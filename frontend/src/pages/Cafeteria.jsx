import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { UtensilsCrossed, Plus, Trash2, X, ChevronLeft, ChevronRight, Leaf } from 'lucide-react'

const mealTypes = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK']
const mealLabels = { BREAKFAST: 'Kahvaltı', LUNCH: 'Öğle', DINNER: 'Akşam', SNACK: 'Ara Öğün' }
const mealColors = {
  BREAKFAST: 'bg-amber-50 border-amber-200 text-amber-800',
  LUNCH: 'bg-blue-50 border-blue-200 text-blue-800',
  DINNER: 'bg-indigo-50 border-indigo-200 text-indigo-800',
  SNACK: 'bg-emerald-50 border-emerald-200 text-emerald-800',
}
const mealDot = {
  BREAKFAST: 'bg-amber-400',
  LUNCH: 'bg-blue-400',
  DINNER: 'bg-indigo-400',
  SNACK: 'bg-emerald-400',
}
const days = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar']

function getMonday(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function fmt(date) {
  return date.toISOString().split('T')[0]
}

function AddMenuModal({ open, onClose, onAdded, defaultDate }) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    menuDate: defaultDate ?? fmt(new Date()),
    mealType: 'LUNCH',
    vegetarian: false,
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (defaultDate) setForm((f) => ({ ...f, menuDate: defaultDate }))
  }, [defaultDate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/cafeteria/menu', form)
      toast.success('Menü öğesi eklendi')
      onAdded()
      onClose()
      setForm({ name: '', description: '', menuDate: defaultDate ?? fmt(new Date()), mealType: 'LUNCH', vegetarian: false })
    } catch {
      toast.error('Eklenemedi')
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
          <h2 className="text-lg font-bold text-slate-900">Menü Ekle</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Yemek Adı</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Mercimek Çorbası"
              required
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Açıklama</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              placeholder="İsteğe bağlı açıklama..."
              className="input-field resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tarih</label>
              <input
                type="date"
                value={form.menuDate}
                onChange={(e) => setForm({ ...form, menuDate: e.target.value })}
                required
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Öğün</label>
              <select
                value={form.mealType}
                onChange={(e) => setForm({ ...form, mealType: e.target.value })}
                className="input-field"
              >
                {mealTypes.map((t) => (
                  <option key={t} value={t}>{mealLabels[t]}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Vegetarian toggle */}
          <div
            className="flex items-center gap-3 cursor-pointer select-none"
            onClick={() => setForm({ ...form, vegetarian: !form.vegetarian })}
          >
            <div className={`w-10 h-6 rounded-full transition-colors relative ${form.vegetarian ? 'bg-emerald-500' : 'bg-slate-200'}`}>
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${form.vegetarian ? 'left-5' : 'left-1'}`} />
            </div>
            <span className="text-sm font-medium text-slate-700">Vejetaryen</span>
            {form.vegetarian && <Leaf size={15} className="text-emerald-500" />}
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">İptal</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center">
              {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Ekle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Cafeteria() {
  const { user } = useAuth()
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()))
  const [menu, setMenu] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [defaultDate, setDefaultDate] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const fetchMenu = () => {
    setLoading(true)
    api.get(`/cafeteria/menu/weekly?weekStart=${fmt(weekStart)}`)
      .then((r) => setMenu(r.data ?? []))
      .catch(() => toast.error('Menü yüklenemedi'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchMenu() }, [weekStart])

  const handleDelete = async (id) => {
    if (!confirm('Bu menü öğesini silmek istiyor musunuz?')) return
    setDeletingId(id)
    try {
      await api.delete(`/cafeteria/menu/${id}`)
      toast.success('Silindi')
      fetchMenu()
    } catch {
      toast.error('Silinemedi')
    } finally {
      setDeletingId(null)
    }
  }

  const openModal = (date) => {
    setDefaultDate(date)
    setModal(true)
  }

  const prevWeek = () => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() - 7)
    setWeekStart(d)
  }
  const nextWeek = () => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + 7)
    setWeekStart(d)
  }

  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + i)
    return d
  })

  const todayStr = fmt(new Date())
  const isCurrentWeek = fmt(getMonday(new Date())) === fmt(weekStart)

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kafeterya Menüsü</h1>
          <p className="text-slate-500 mt-1 text-sm">Haftalık yemek programı</p>
        </div>
        {user.role === 'ADMIN' && (
          <button onClick={() => openModal(todayStr)} className="btn-primary flex items-center gap-2">
            <Plus size={16} />
            Menü Ekle
          </button>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-5 flex-wrap">
        {mealTypes.map((t) => (
          <div key={t} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-full ${mealDot[t]}`} />
            <span className="text-xs text-slate-500 font-medium">{mealLabels[t]}</span>
          </div>
        ))}
      </div>

      {/* Week Navigation */}
      <div className="card mb-6 flex items-center justify-between py-4">
        <button onClick={prevWeek} className="btn-secondary flex items-center gap-1 py-2 px-4 text-sm">
          <ChevronLeft size={16} />
          Önceki
        </button>
        <div className="text-center">
          <p className="font-bold text-slate-900 text-sm">
            {weekStart.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}
            {' '}&ndash;{' '}
            {weekDates[6].toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          {isCurrentWeek && (
            <span className="text-xs text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded-full mt-1 inline-block">
              Bu Hafta
            </span>
          )}
        </div>
        <button onClick={nextWeek} className="btn-secondary flex items-center gap-1 py-2 px-4 text-sm">
          Sonraki
          <ChevronRight size={16} />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {weekDates.map((date, i) => {
            const dateStr = fmt(date)
            const isToday = dateStr === todayStr
            const dayMenu = menu.filter((m) => m.menuDate === dateStr)

            return (
              <div
                key={i}
                className={`rounded-2xl border-2 overflow-hidden flex flex-col ${isToday ? 'border-blue-400 shadow-md shadow-blue-100' : 'border-slate-100'}`}
              >
                {/* Day Header */}
                <div className={`px-3 py-2.5 text-center flex-shrink-0 ${isToday ? 'bg-blue-600' : 'bg-slate-50'}`}>
                  <p className={`text-xs font-bold uppercase tracking-wide ${isToday ? 'text-blue-100' : 'text-slate-400'}`}>
                    {days[i]}
                  </p>
                  <p className={`text-xl font-bold leading-none mt-0.5 ${isToday ? 'text-white' : 'text-slate-800'}`}>
                    {date.getDate()}
                  </p>
                </div>

                {/* Meals */}
                <div className="bg-white p-2 flex-1 space-y-1.5">
                  {dayMenu.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-20 text-slate-200">
                      <UtensilsCrossed size={20} className="mb-1" />
                      <span className="text-xs">Menü yok</span>
                    </div>
                  ) : (
                    dayMenu.map((item) => (
                      <div
                        key={item.id}
                        className={`rounded-lg p-2 border text-xs ${mealColors[item.mealType]}`}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1 mb-0.5">
                              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${mealDot[item.mealType]}`} />
                              <span className="font-bold opacity-60 text-xs">{mealLabels[item.mealType]}</span>
                              {item.vegetarian && <Leaf size={10} className="text-emerald-500 flex-shrink-0" />}
                            </div>
                            <p className="font-semibold leading-tight truncate">{item.name}</p>
                            {item.description && (
                              <p className="opacity-50 text-xs mt-0.5 leading-tight line-clamp-1">{item.description}</p>
                            )}
                          </div>
                          {user.role === 'ADMIN' && (
                            <button
                              onClick={() => handleDelete(item.id)}
                              disabled={deletingId === item.id}
                              className="flex-shrink-0 p-0.5 hover:opacity-80 opacity-40 transition-opacity"
                            >
                              {deletingId === item.id ? (
                                <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Trash2 size={11} />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}

                  {user.role === 'ADMIN' && (
                    <button
                      onClick={() => openModal(dateStr)}
                      className="w-full text-center text-xs text-slate-300 hover:text-blue-500 py-1 border border-dashed border-slate-200 hover:border-blue-300 rounded-lg transition-colors mt-1"
                    >
                      + Ekle
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <AddMenuModal
        open={modal}
        onClose={() => setModal(false)}
        onAdded={fetchMenu}
        defaultDate={defaultDate}
      />
    </div>
  )
}
