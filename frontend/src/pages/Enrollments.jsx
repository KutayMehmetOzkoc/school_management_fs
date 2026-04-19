import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { UserCheck, Clock, CheckCircle, XCircle, AlertCircle, Trash2, BookOpen } from 'lucide-react'

const statusCfg = {
  CONFIRMED: { label: 'Onaylı', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  PENDING: { label: 'Bekliyor', color: 'bg-amber-100 text-amber-700', icon: Clock },
  FAILED: { label: 'Başarısız', color: 'bg-red-100 text-red-700', icon: XCircle },
  CANCELLED: { label: 'İptal Edildi', color: 'bg-slate-100 text-slate-600', icon: AlertCircle },
}

function StatTile({ label, value, colorClass }) {
  return (
    <div className="card text-center">
      <p className={`text-2xl font-bold ${colorClass}`}>{value}</p>
      <p className="text-sm text-slate-500 mt-1">{label}</p>
    </div>
  )
}

export default function Enrollments() {
  const { user } = useAuth()
  const [enrollments, setEnrollments] = useState([])
  const [loading, setLoading] = useState(true)
  const [cancellingId, setCancellingId] = useState(null)

  const fetch = () => {
    setLoading(true)
    api.get(`/enrollments/student/${user.id}`)
      .then((r) => setEnrollments(r.data ?? []))
      .catch(() => toast.error('Kayıtlar yüklenemedi'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetch() }, [])

  const handleCancel = async (id) => {
    if (!confirm('Bu kaydı iptal etmek istediğinizden emin misiniz?')) return
    setCancellingId(id)
    try {
      await api.delete(`/enrollments/${id}`)
      toast.success('Kayıt iptal edildi')
      fetch()
    } catch {
      toast.error('İptal işlemi başarısız')
    } finally {
      setCancellingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  const counts = {
    total: enrollments.length,
    confirmed: enrollments.filter((e) => e.status === 'CONFIRMED').length,
    pending: enrollments.filter((e) => e.status === 'PENDING').length,
    failed: enrollments.filter((e) => e.status === 'FAILED').length,
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Kayıtlarım</h1>
        <p className="text-slate-500 mt-1 text-sm">Ders kayıt durumlarınızı buradan takip edebilirsiniz</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatTile label="Toplam" value={counts.total} colorClass="text-slate-900" />
        <StatTile label="Onaylı" value={counts.confirmed} colorClass="text-emerald-600" />
        <StatTile label="Bekleyen" value={counts.pending} colorClass="text-amber-600" />
        <StatTile label="Başarısız" value={counts.failed} colorClass="text-red-500" />
      </div>

      {enrollments.length === 0 ? (
        <div className="card text-center py-16">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <UserCheck size={28} className="text-slate-300" />
          </div>
          <h3 className="text-base font-semibold text-slate-700 mb-1">Henüz kayıt yok</h3>
          <p className="text-slate-400 text-sm">Dersler sayfasından ders kaydı yapabilirsiniz.</p>
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-900">Tüm Kayıtlarım</h2>
            <span className="text-xs text-slate-400 font-medium">{enrollments.length} kayıt</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Ders</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Kayıt Tarihi</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Durum</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Neden</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {enrollments.map((e) => {
                  const cfg = statusCfg[e.status] ?? statusCfg.PENDING
                  const Icon = cfg.icon
                  return (
                    <tr key={e.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                            <BookOpen size={14} className="text-blue-600" />
                          </div>
                          <span className="text-sm font-semibold text-slate-800">Ders #{e.courseId}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {new Date(e.createdAt).toLocaleDateString('tr-TR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.color}`}>
                          <Icon size={11} />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400">{e.failureReason ?? '—'}</td>
                      <td className="px-6 py-4 text-right">
                        {e.status === 'CONFIRMED' && (
                          <button
                            onClick={() => handleCancel(e.id)}
                            disabled={cancellingId === e.id}
                            className="btn-danger text-xs py-1.5 px-3 inline-flex items-center gap-1.5"
                          >
                            {cancellingId === e.id ? (
                              <div className="w-3 h-3 border border-red-500 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Trash2 size={12} />
                            )}
                            İptal Et
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
