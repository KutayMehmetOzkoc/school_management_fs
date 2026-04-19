import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { GraduationCap, Mail, Lock, User, Eye, EyeOff, ChevronDown } from 'lucide-react'

const roles = [
  { value: 'STUDENT', label: '🎓 Öğrenci' },
  { value: 'TEACHER', label: '📚 Öğretmen' },
  { value: 'ADMIN', label: '⚙️ Yönetici' },
]

export default function Register() {
  const [form, setForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'STUDENT',
  })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password.length < 8) {
      toast.error('Şifre en az 8 karakter olmalıdır')
      return
    }
    setLoading(true)
    try {
      await api.post('/auth/register', form)
      toast.success('Kayıt başarılı! Giriş yapabilirsiniz.')
      navigate('/login')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Kayıt başarısız')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left — Branding */}
      <div className="hidden lg:flex lg:w-[40%] bg-gradient-to-br from-indigo-950 via-blue-900 to-blue-800 flex-col justify-center items-center px-12 text-white relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-indigo-500/15 blur-3xl" />
        </div>
        <div className="relative z-10 text-center max-w-xs">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 ring-1 ring-white/20">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold mb-3">EduManage'e Katıl</h2>
          <p className="text-blue-200 text-sm leading-relaxed">
            Hesabını oluştur ve okul yönetim sisteminin tüm özelliklerine anında erişim sağla.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-4">
            {['1000+\nÖğrenci', '50+\nÖğretmen', '200+\nDers'].map((s) => {
              const [num, lbl] = s.split('\n')
              return (
                <div key={lbl} className="bg-white/10 rounded-xl p-3 ring-1 ring-white/10">
                  <p className="text-lg font-bold text-white">{num}</p>
                  <p className="text-xs text-blue-300 mt-0.5">{lbl}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Right — Form */}
      <div className="flex-1 flex items-center justify-center px-8 bg-slate-50 py-10">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <GraduationCap className="w-7 h-7 text-blue-700" />
            <span className="text-xl font-bold text-blue-900">EduManage</span>
          </div>

          <div className="mb-7">
            <h2 className="text-2xl font-bold text-slate-900">Hesap Oluştur</h2>
            <p className="text-slate-500 mt-1.5 text-sm">Bilgilerini doldurarak kayıt ol</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Ad</label>
                <div className="relative">
                  <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    placeholder="John"
                    required
                    className="input-field pl-10"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Soyad</label>
                <input
                  type="text"
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  placeholder="Doe"
                  required
                  className="input-field"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">E-posta</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="ornek@okul.com"
                  required
                  className="input-field pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Şifre
                <span className="text-slate-400 font-normal ml-1">(min. 8 karakter)</span>
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  required
                  className="input-field pl-10 pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {form.password && (
                <div className="mt-2 flex gap-1">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        form.password.length > i * 3
                          ? form.password.length < 8
                            ? 'bg-amber-400'
                            : 'bg-emerald-500'
                          : 'bg-slate-200'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Rol</label>
              <div className="relative">
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="input-field appearance-none pr-10 cursor-pointer"
                >
                  {roles.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-1"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Kayıt Ol'
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-slate-500 text-sm">
            Zaten hesabın var mı?{' '}
            <Link to="/login" className="text-blue-600 hover:text-blue-700 font-semibold">
              Giriş Yap
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
