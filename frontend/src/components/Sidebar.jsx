import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard,
  BookOpen,
  UserCheck,
  Award,
  UtensilsCrossed,
  LogOut,
  GraduationCap,
  ChevronRight,
} from 'lucide-react'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['ADMIN', 'TEACHER', 'STUDENT'] },
  { to: '/courses', icon: BookOpen, label: 'Dersler', roles: ['ADMIN', 'TEACHER', 'STUDENT'] },
  { to: '/enrollments', icon: UserCheck, label: 'Kayıtlarım', roles: ['STUDENT'] },
  { to: '/grades', icon: Award, label: 'Notlar', roles: ['ADMIN', 'TEACHER', 'STUDENT'] },
  { to: '/cafeteria', icon: UtensilsCrossed, label: 'Kafeterya', roles: ['ADMIN', 'TEACHER', 'STUDENT'] },
]

const roleLabel = { ADMIN: 'Yönetici', TEACHER: 'Öğretmen', STUDENT: 'Öğrenci' }
const roleBadge = {
  ADMIN: 'bg-amber-400/20 text-amber-300 border border-amber-400/30',
  TEACHER: 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30',
  STUDENT: 'bg-blue-400/20 text-blue-200 border border-blue-400/30',
}

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`

  return (
    <aside className="w-64 flex flex-col bg-gradient-to-b from-blue-950 via-blue-900 to-indigo-950 text-white shadow-2xl flex-shrink-0">
      {/* Logo */}
      <div className="px-5 py-7 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center ring-1 ring-white/20">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white leading-tight">EduManage</h1>
            <p className="text-xs text-blue-300">Okul Yönetim Sistemi</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-5 space-y-0.5">
        <p className="text-xs font-semibold text-blue-400/60 uppercase tracking-widest px-3 mb-3">Menü</p>
        {navItems
          .filter((item) => item.roles.includes(user?.role))
          .map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 group ${
                  isActive
                    ? 'bg-white/15 text-white shadow-sm ring-1 ring-white/10'
                    : 'text-blue-200/80 hover:bg-white/8 hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`w-4.5 h-4.5 flex-shrink-0 transition-colors ${
                      isActive ? 'text-white' : 'text-blue-300/70 group-hover:text-white'
                    }`}
                    size={18}
                  />
                  <span className="flex-1">{label}</span>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-white/50" />}
                </>
              )}
            </NavLink>
          ))}
      </nav>

      {/* User Info */}
      <div className="px-3 py-4 border-t border-white/10 space-y-2">
        <div className="bg-white/5 rounded-xl p-3 ring-1 ring-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ring-2 ring-white/20">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleBadge[user?.role]}`}>
                {roleLabel[user?.role]}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-blue-300/70 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all duration-200 font-medium"
        >
          <LogOut size={16} />
          Çıkış Yap
        </button>
      </div>
    </aside>
  )
}
