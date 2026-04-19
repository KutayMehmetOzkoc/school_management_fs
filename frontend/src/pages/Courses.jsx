import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { Plus, Search, BookOpen, Users, Clock, X, ChevronDown, Filter } from 'lucide-react'

const statusCfg = {
  ACTIVE: { label: 'Aktif', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  FULL: { label: 'Dolu', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  CLOSED: { label: 'Kapalı', color: 'bg-red-100 text-red-700 border-red-200' },
  DRAFT: { label: 'Taslak', color: 'bg-slate-100 text-slate-600 border-slate-200' },
}

function Modal({ open, onClose, title, children }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

function CreateCourseModal({ open, onClose, onCreated }) {
  const { user } = useAuth()
  const [form, setForm] = useState({ code: '', name: '', description: '', capacity: 30, creditHours: 3 })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/courses', {
        ...form,
        teacherId: user.id,
        capacity: Number(form.capacity),
        creditHours: Number(form.creditHours),
      })
      toast.success('Ders başarıyla oluşturuldu')
      onCreated()
      onClose()
      setForm({ code: '', name: '', description: '', capacity: 30, creditHours: 3 })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Ders oluşturulamadı')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Yeni Ders Oluştur">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Ders Kodu</label>
            <input
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              placeholder="CS101"
              required
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Kredi Saati</label>
            <input
              type="number"
              min="1"
              max="6"
              value={form.creditHours}
              onChange={(e) => setForm({ ...form, creditHours: e.target.value })}
              required
              className="input-field"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Ders Adı</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Programlamaya Giriş"
            required
            className="input-field"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Açıklama</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            placeholder="Ders hakkında kısa bir açıklama..."
            className="input-field resize-none"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Kontenjan</label>
          <input
            type="number"
            min="1"
            value={form.capacity}
            onChange={(e) => setForm({ ...form, capacity: e.target.value })}
            required
            className="input-field"
          />
        </div>
        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">
            İptal
          </button>
          <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center">
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              'Oluştur'
            )}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function CourseCard({ course, user, enrolledIds, onEnroll, onClose }) {
  const cfg = statusCfg[course.status] || statusCfg.DRAFT
  const pct = course.capacity > 0 ? Math.round((course.enrolledCount / course.capacity) * 100) : 0
  const isEnrolled = enrolledIds.has(course.id)
  const canEnroll = user.role === 'STUDENT' && course.status === 'ACTIVE' && !isEnrolled
  const canManage = user.role === 'ADMIN' || (user.role === 'TEACHER' && course.teacherId === user.id)

  return (
    <div className="card hover:shadow-md transition-all duration-200 flex flex-col group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0 mr-3">
          <span className="inline-block text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-lg mb-1.5">
            {course.code}
          </span>
          <h3 className="text-sm font-bold text-slate-900 leading-snug">{course.name}</h3>
        </div>
        <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border flex-shrink-0 ${cfg.color}`}>
          {cfg.label}
        </span>
      </div>

      {course.description && (
        <p className="text-xs text-slate-500 mb-4 leading-relaxed line-clamp-2">{course.description}</p>
      )}

      <div className="mt-auto space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1">
            <Users size={12} />
            <span>{course.enrolledCount}/{course.capacity}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock size={12} />
            <span>{course.creditHours} kredi</span>
          </div>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full transition-all ${pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-blue-500'}`}
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>

        {isEnrolled && user.role === 'STUDENT' && (
          <div className="text-center text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-lg py-1.5">
            ✓ Kayıtlısınız
          </div>
        )}
        {canEnroll && (
          <button onClick={() => onEnroll(course.id)} className="btn-primary w-full text-sm py-2">
            Kayıt Ol
          </button>
        )}
        {course.status === 'FULL' && user.role === 'STUDENT' && !isEnrolled && (
          <div className="text-center text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-100 rounded-lg py-1.5">
            Kontenjan Dolu
          </div>
        )}
        {course.status === 'CLOSED' && user.role === 'STUDENT' && (
          <div className="text-center text-xs font-semibold text-slate-400 bg-slate-50 rounded-lg py-1.5">
            Ders Kapalı
          </div>
        )}
        {canManage && course.status !== 'CLOSED' && (
          <button onClick={() => onClose(course.id)} className="btn-danger w-full text-sm py-2">
            Dersi Kapat
          </button>
        )}
      </div>
    </div>
  )
}

export default function Courses() {
  const { user } = useAuth()
  const [courses, setCourses] = useState([])
  const [enrollments, setEnrollments] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [modal, setModal] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/courses')
      setCourses(data?.content ?? data ?? [])
      if (user.role === 'STUDENT') {
        const { data: ed } = await api.get(`/enrollments/student/${user.id}`)
        setEnrollments(ed ?? [])
      }
    } catch {
      toast.error('Dersler yüklenemedi')
    } finally {
      setLoading(false)
    }
  }, [user.id, user.role])

  useEffect(() => { fetchData() }, [fetchData])

  const enrolledIds = new Set(
    enrollments.filter((e) => e.status === 'CONFIRMED' || e.status === 'PENDING').map((e) => e.courseId)
  )

  const handleEnroll = async (courseId) => {
    try {
      await api.post('/enrollments', { studentId: user.id, courseId })
      toast.success('Kayıt isteği gönderildi!')
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Kayıt başarısız')
    }
  }

  const handleClose = async (courseId) => {
    if (!confirm('Bu dersi kapatmak istediğinizden emin misiniz?')) return
    try {
      await api.delete(`/courses/${courseId}/close`)
      toast.success('Ders kapatıldı')
      fetchData()
    } catch {
      toast.error('İşlem başarısız')
    }
  }

  const filtered = courses
    .filter((c) => statusFilter === 'ALL' || c.status === statusFilter)
    .filter(
      (c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.code.toLowerCase().includes(search.toLowerCase())
    )

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dersler</h1>
          <p className="text-slate-500 mt-1 text-sm">{courses.length} ders listeleniyor</p>
        </div>
        {(user.role === 'ADMIN' || user.role === 'TEACHER') && (
          <button onClick={() => setModal(true)} className="btn-primary flex items-center gap-2">
            <Plus size={16} />
            Yeni Ders
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ders adı veya kodu ara..."
            className="input-field pl-10"
          />
        </div>
        <div className="relative sm:w-52">
          <Filter size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field pl-9 pr-9 appearance-none cursor-pointer"
          >
            <option value="ALL">Tüm Durumlar</option>
            <option value="ACTIVE">Aktif</option>
            <option value="FULL">Dolu</option>
            <option value="CLOSED">Kapalı</option>
            <option value="DRAFT">Taslak</option>
          </select>
          <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BookOpen size={28} className="text-slate-300" />
          </div>
          <p className="text-slate-400 font-medium">Ders bulunamadı</p>
          <p className="text-slate-300 text-sm mt-1">Arama kriterlerini değiştirmeyi deneyin</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              user={user}
              enrolledIds={enrolledIds}
              onEnroll={handleEnroll}
              onClose={handleClose}
            />
          ))}
        </div>
      )}

      <CreateCourseModal open={modal} onClose={() => setModal(false)} onCreated={fetchData} />
    </div>
  )
}
