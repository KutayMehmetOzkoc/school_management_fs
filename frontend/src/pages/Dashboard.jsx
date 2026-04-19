import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { BookOpen, Users, Award, TrendingUp, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react'

const enrollmentStatus = {
  CONFIRMED: { label: 'Onaylı', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  PENDING: { label: 'Bekliyor', color: 'bg-amber-100 text-amber-700', icon: Clock },
  FAILED: { label: 'Başarısız', color: 'bg-red-100 text-red-700', icon: XCircle },
  CANCELLED: { label: 'İptal', color: 'bg-slate-100 text-slate-600', icon: AlertCircle },
}

const letterColors = {
  AA: 'bg-emerald-100 text-emerald-800',
  BA: 'bg-emerald-100 text-emerald-700',
  BB: 'bg-blue-100 text-blue-800',
  CB: 'bg-blue-100 text-blue-700',
  CC: 'bg-indigo-100 text-indigo-700',
  DC: 'bg-amber-100 text-amber-800',
  DD: 'bg-orange-100 text-orange-800',
  FD: 'bg-red-100 text-red-700',
  FF: 'bg-red-100 text-red-800',
}

const courseStatusCfg = {
  ACTIVE: { label: 'Aktif', color: 'bg-emerald-100 text-emerald-700' },
  FULL: { label: 'Dolu', color: 'bg-amber-100 text-amber-700' },
  CLOSED: { label: 'Kapalı', color: 'bg-red-100 text-red-700' },
  DRAFT: { label: 'Taslak', color: 'bg-slate-100 text-slate-600' },
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent" />
    </div>
  )
}

function Empty({ text }) {
  return <p className="text-center text-slate-400 text-sm py-10">{text}</p>
}

function StatCard({ icon: Icon, label, value, sub, colorClass }) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass}`}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900 leading-none">{value}</p>
        <p className="text-sm text-slate-500 mt-1">{label}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function CourseChip({ course }) {
  const cfg = courseStatusCfg[course.status] || courseStatusCfg.DRAFT
  const pct = course.capacity > 0 ? Math.round((course.enrolledCount / course.capacity) * 100) : 0
  return (
    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 hover:border-blue-100 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">{course.code}</span>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</span>
      </div>
      <p className="text-sm font-semibold text-slate-900 leading-snug mb-3">{course.name}</p>
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-slate-400">
          <span>{course.enrolledCount}/{course.capacity} öğrenci</span>
          <span>{course.creditHours} kredi</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-1">
          <div
            className={`h-1 rounded-full ${pct >= 100 ? 'bg-red-500' : pct >= 75 ? 'bg-amber-500' : 'bg-blue-500'}`}
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
      </div>
    </div>
  )
}

function StudentDashboard({ user }) {
  const [enrollments, setEnrollments] = useState([])
  const [grades, setGrades] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get(`/enrollments/student/${user.id}`),
      api.get(`/grades/student/${user.id}`),
    ])
      .then(([e, g]) => {
        setEnrollments(e.data || [])
        setGrades(g.data || [])
      })
      .catch(() => toast.error('Veriler yüklenemedi'))
      .finally(() => setLoading(false))
  }, [user.id])

  if (loading) return <Spinner />

  const confirmed = enrollments.filter((e) => e.status === 'CONFIRMED').length
  const avg =
    grades.length > 0
      ? (grades.reduce((s, g) => s + g.score, 0) / grades.length).toFixed(1)
      : '—'

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={BookOpen} label="Aktif Ders" value={confirmed} colorClass="bg-blue-100 text-blue-700" />
        <StatCard icon={Award} label="Genel Ortalama" value={avg} sub="100 üzerinden" colorClass="bg-emerald-100 text-emerald-700" />
        <StatCard icon={TrendingUp} label="Girilen Not" value={grades.length} colorClass="bg-purple-100 text-purple-700" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-base font-bold text-slate-900 mb-4">Son Kayıtlarım</h3>
          {enrollments.length === 0 ? (
            <Empty text="Henüz kayıt yok" />
          ) : (
            <div className="space-y-1">
              {enrollments.slice(0, 6).map((e) => {
                const cfg = enrollmentStatus[e.status] || enrollmentStatus.PENDING
                const Icon = cfg.icon
                return (
                  <div key={e.id} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                        <BookOpen size={14} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">Ders #{e.courseId}</p>
                        <p className="text-xs text-slate-400">
                          {new Date(e.createdAt).toLocaleDateString('tr-TR')}
                        </p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.color}`}>
                      <Icon size={11} />
                      {cfg.label}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="text-base font-bold text-slate-900 mb-4">Son Notlarım</h3>
          {grades.length === 0 ? (
            <Empty text="Henüz not girilmemiş" />
          ) : (
            <div className="space-y-1">
              {grades.slice(0, 6).map((g) => (
                <div key={g.id} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                      <Award size={14} className="text-purple-600" />
                    </div>
                    <p className="text-sm font-semibold text-slate-800">Ders #{g.courseId}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-700">{g.score}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${letterColors[g.letterGrade] || 'bg-slate-100 text-slate-600'}`}>
                      {g.letterGrade}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function TeacherDashboard({ user }) {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/courses/teacher/${user.id}`)
      .then((r) => setCourses(r.data || []))
      .catch(() => toast.error('Dersler yüklenemedi'))
      .finally(() => setLoading(false))
  }, [user.id])

  if (loading) return <Spinner />

  const totalStudents = courses.reduce((s, c) => s + (c.enrolledCount ?? 0), 0)
  const active = courses.filter((c) => c.status === 'ACTIVE' || c.status === 'FULL').length

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={BookOpen} label="Toplam Ders" value={courses.length} colorClass="bg-blue-100 text-blue-700" />
        <StatCard icon={Users} label="Toplam Öğrenci" value={totalStudents} colorClass="bg-emerald-100 text-emerald-700" />
        <StatCard icon={CheckCircle} label="Aktif Ders" value={active} colorClass="bg-purple-100 text-purple-700" />
      </div>
      <div className="card">
        <h3 className="text-base font-bold text-slate-900 mb-4">Derslerim</h3>
        {courses.length === 0 ? (
          <Empty text="Henüz ders eklenmemiş" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {courses.map((c) => <CourseChip key={c.id} course={c} />)}
          </div>
        )}
      </div>
    </div>
  )
}

function AdminDashboard() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/courses')
      .then((r) => setCourses(r.data?.content ?? r.data ?? []))
      .catch(() => toast.error('Dersler yüklenemedi'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner />

  const counts = {
    total: courses.length,
    active: courses.filter((c) => c.status === 'ACTIVE').length,
    full: courses.filter((c) => c.status === 'FULL').length,
    closed: courses.filter((c) => c.status === 'CLOSED').length,
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={BookOpen} label="Toplam Ders" value={counts.total} colorClass="bg-blue-100 text-blue-700" />
        <StatCard icon={CheckCircle} label="Aktif" value={counts.active} colorClass="bg-emerald-100 text-emerald-700" />
        <StatCard icon={Users} label="Dolu" value={counts.full} colorClass="bg-amber-100 text-amber-700" />
        <StatCard icon={XCircle} label="Kapalı" value={counts.closed} colorClass="bg-red-100 text-red-700" />
      </div>
      <div className="card">
        <h3 className="text-base font-bold text-slate-900 mb-4">Tüm Dersler</h3>
        {courses.length === 0 ? (
          <Empty text="Henüz ders eklenmemiş" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {courses.map((c) => <CourseChip key={c.id} course={c} />)}
          </div>
        )}
      </div>
    </div>
  )
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Günaydın'
  if (h < 17) return 'İyi günler'
  return 'İyi akşamlar'
}

export default function Dashboard() {
  const { user } = useAuth()

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          {greeting()}, {user?.firstName}! 👋
        </h1>
        <p className="text-slate-500 mt-1 text-sm">Bugünkü özet bilgiler aşağıda.</p>
      </div>

      {user?.role === 'STUDENT' && <StudentDashboard user={user} />}
      {user?.role === 'TEACHER' && <TeacherDashboard user={user} />}
      {user?.role === 'ADMIN' && <AdminDashboard />}
    </div>
  )
}
