import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { GraduationCap, Mail, Lock, Eye, EyeOff, BookOpen, Users, Award } from 'lucide-react'

const features = [
  { icon: BookOpen, title: 'Ders Yönetimi', desc: 'Tüm dersleri tek platformdan takip edin' },
  { icon: Users, title: 'Öğrenci Kayıt', desc: 'Kayıt ve devamsızlıkları kolayca yönetin' },
  { icon: Award, title: 'Not Sistemi', desc: 'Otomatik harf notu hesaplama ve raporlama' },
]

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', form)
      login(data)
      toast.success(`Hoş geldin, ${data.firstName}!`)
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'E-posta veya şifre hatalı')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left — Branding */}
      <div className="hidden lg:flex lg:w-[52%] bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-900 flex-col justify-center px-16 text-white relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-indigo-500/15 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-white/5" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border border-white/5" />
        </div>

        <div className="relative z-10 max-w-sm">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center ring-1 ring-white/20 backdrop-blur-sm">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">EduManage</h1>
              <p className="text-xs text-blue-300">Okul Yönetim Sistemi</p>
            </div>
          </div>

          <h2 className="text-4xl font-bold leading-tight mb-4">
            Eğitimi kolaylaştıran platform
          </h2>
          <p className="text-blue-200 text-base leading-relaxed mb-12">
            Öğrenciler, öğretmenler ve yöneticiler için tasarlanmış kapsamlı okul yönetim çözümü.
          </p>

          <div className="space-y-5">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0 ring-1 ring-white/10">
                  <Icon size={18} className="text-blue-200" />
                </div>
                <div>
                  <p className="font-semibold text-white text-sm">{title}</p>
                  <p className="text-xs text-blue-300 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Form */}
      <div className="flex-1 flex items-center justify-center px-8 bg-slate-50">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-10 justify-center">
            <GraduationCap className="w-7 h-7 text-blue-700" />
            <span className="text-xl font-bold text-blue-900">EduManage</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Tekrar hoş geldin 👋</h2>
            <p className="text-slate-500 mt-1.5 text-sm">Hesabına giriş yaparak devam et</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Şifre</label>
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
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-1"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Giriş Yap'
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-slate-500 text-sm">
            Hesabın yok mu?{' '}
            <Link to="/register" className="text-blue-600 hover:text-blue-700 font-semibold">
              Kayıt Ol
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
