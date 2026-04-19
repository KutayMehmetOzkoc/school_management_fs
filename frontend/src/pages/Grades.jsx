import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { Award, Plus, X } from 'lucide-react'

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

function Spinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent" />
    </div>
  )
}

function GradeModal({ open, onClose, courseId, onSubmitted }) {
  const { user } = useAuth()
  const [form, setForm] = useState({ studentId: '', score: '', feedback: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/grades', {
        studentId: Number(form.studentId),
        courseId: Number(courseId),
        teacherId: user.id,
        score: Number(form.score),
        feedback: form.feedback,
      })
      toast.success('Not başarıyla girildi')
      onSubmitted()
      onClose()
      setForm({ studentId: '', score: '', feedback: '' })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Not girilemedi')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">Not Gir / Güncelle</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Öğrenci ID</label>
            <input
              type="number"
              value={form.studentId}
              onChange={(e) => setForm({ ...form, studentId: e.target.value })}
              placeholder="Öğrenci ID numarasını girin"
              required
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Puan (0–100)</label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={form.score}
              onChange={(e) => setForm({ ...form, score: e.target.value })}
              placeholder="85.50"
              required
              className="input-field"
            />
            {form.score !== '' && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                  <div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${Math.min(Number(form.score), 100)}%` }} />
                </div>
                <span className="text-xs text-slate-500 w-8 text-right">{form.score}</span>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Geri Bildirim</label>
            <textarea
              value={form.feedback}
              onChange={(e) => setForm({ ...form, feedback: e.target.value })}
              rows={3}
              placeholder="Öğrenciye yönelik geri bildirim..."
              className="input-field resize-none"
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">İptal</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center">
              {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function GradeRow({ grade }) {
  return (
    <tr className="hover:bg-slate-50/60 transition-colors">
      <td className="px-6 py-4 text-sm font-semibold text-slate-800">Ders #{grade.courseId}</td>
      <td className="px-6 py-4 text-sm text-slate-500">#{grade.teacherId}</td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2.5">
          <div className="w-20 bg-slate-100 rounded-full h-1.5">
            <div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${grade.score}%` }} />
          </div>
          <span className="text-sm font-bold text-slate-800 w-10">{grade.score}</span>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${letterColors[grade.letterGrade] ?? 'bg-slate-100 text-slate-600'}`}>
          {grade.letterGrade}
        </span>
      </td>
      <td className="px-6 py-4 text-sm text-slate-400 max-w-[200px] truncate">{grade.feedback ?? '—'}</td>
    </tr>
  )
}

function GradeTable({ grades, header }) {
  return (
    <div className="card overflow-hidden p-0">
      {header && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          {header}
        </div>
      )}
      {grades.length === 0 ? (
        <div className="text-center py-14 text-slate-400">
          <Award size={36} className="mx-auto mb-3 text-slate-200" />
          <p className="text-sm">Henüz not girilmemiş</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Ders</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Öğretmen</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Puan</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Harf</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Geri Bildirim</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {grades.map((g) => <GradeRow key={g.id} grade={g} />)}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function StudentGrades({ userId }) {
  const [grades, setGrades] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/grades/student/${userId}`)
      .then((r) => setGrades(r.data ?? []))
      .finally(() => setLoading(false))
  }, [userId])

  if (loading) return <Spinner />

  const avg = grades.length > 0 ? (grades.reduce((s, g) => s + g.score, 0) / grades.length).toFixed(1) : null
  const best = grades.length > 0 ? Math.max(...grades.map((g) => g.score)).toFixed(1) : null

  return (
    <div className="space-y-6">
      {avg && (
        <div className="grid grid-cols-3 gap-4">
          <div className="card text-center">
            <p className="text-3xl font-bold text-blue-600">{avg}</p>
            <p className="text-sm text-slate-500 mt-1">Genel Ortalama</p>
          </div>
          <div className="card text-center">
            <p className="text-3xl font-bold text-emerald-600">{best}</p>
            <p className="text-sm text-slate-500 mt-1">En Yüksek</p>
          </div>
          <div className="card text-center">
            <p className="text-3xl font-bold text-slate-700">{grades.length}</p>
            <p className="text-sm text-slate-500 mt-1">Ders Sayısı</p>
          </div>
        </div>
      )}
      <GradeTable
        grades={grades}
        header={<h2 className="font-bold text-slate-900">Not Listesi</h2>}
      />
    </div>
  )
}

function TeacherGrades({ userId }) {
  const [courses, setCourses] = useState([])
  const [selected, setSelected] = useState(null)
  const [grades, setGrades] = useState([])
  const [coursesLoading, setCoursesLoading] = useState(true)
  const [gradesLoading, setGradesLoading] = useState(false)
  const [modal, setModal] = useState(false)

  useEffect(() => {
    api.get(`/courses/teacher/${userId}`)
      .then((r) => setCourses(r.data ?? []))
      .finally(() => setCoursesLoading(false))
  }, [userId])

  const loadGrades = (courseId) => {
    setSelected(courseId)
    setGradesLoading(true)
    api.get(`/grades/course/${courseId}`)
      .then((r) => setGrades(r.data ?? []))
      .finally(() => setGradesLoading(false))
  }

  if (coursesLoading) return <Spinner />

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="font-bold text-slate-900 mb-4 text-sm uppercase tracking-wide text-slate-500">Ders Seçin</h2>
        {courses.length === 0 ? (
          <p className="text-slate-400 text-sm">Henüz ders eklenmemiş</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {courses.map((c) => (
              <button
                key={c.id}
                onClick={() => loadGrades(c.id)}
                className={`text-left p-4 rounded-xl border-2 transition-all ${
                  selected === c.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-100 hover:border-blue-200 hover:bg-slate-50'
                }`}
              >
                <span className="text-xs font-bold text-blue-600">{c.code}</span>
                <p className="text-sm font-semibold text-slate-800 mt-1 leading-snug">{c.name}</p>
                <p className="text-xs text-slate-400 mt-1.5">{c.enrolledCount} öğrenci</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <>
          {gradesLoading ? (
            <Spinner />
          ) : (
            <GradeTable
              grades={grades.map((g) => ({ ...g, courseId: g.courseId ?? selected }))}
              header={
                <>
                  <h2 className="font-bold text-slate-900">Not Listesi</h2>
                  <button onClick={() => setModal(true)} className="btn-primary flex items-center gap-2 text-sm py-2">
                    <Plus size={15} />
                    Not Gir
                  </button>
                </>
              }
            />
          )}
          <GradeModal
            open={modal}
            onClose={() => setModal(false)}
            courseId={selected}
            onSubmitted={() => loadGrades(selected)}
          />
        </>
      )}
    </div>
  )
}

export default function Grades() {
  const { user } = useAuth()

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Notlar</h1>
        <p className="text-slate-500 mt-1 text-sm">
          {user.role === 'STUDENT' ? 'Ders notlarınızı burada görebilirsiniz' : 'Öğrenci notlarını görüntüleyin ve girin'}
        </p>
      </div>
      {user.role === 'STUDENT' && <StudentGrades userId={user.id} />}
      {(user.role === 'TEACHER' || user.role === 'ADMIN') && <TeacherGrades userId={user.id} />}
    </div>
  )
}
