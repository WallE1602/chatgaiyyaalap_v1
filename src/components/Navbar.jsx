import { NavLink, useNavigate, Link } from 'react-router-dom'
import { LanguageIcon, GlobeAltIcon, Bars3Icon, XMarkIcon, ArrowRightStartOnRectangleIcon, UserIcon } from '@heroicons/react/24/outline'
import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

const NAV_LINK_KEYS = [
  { to: '/', key: 'nav.home' },
  { to: '/translate', key: 'nav.translate' },
  { to: '/history', key: 'nav.history' },
  { to: '/phrases', key: 'nav.phrases' },
  { to: '/about', key: 'nav.about' },
]

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const { user, isAuthenticated, logout } = useAuth()
  const { t, lang, setLang } = useLanguage()
  const navigate = useNavigate()
  const dropdownRef = useRef(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleLogout() {
    logout()
    setMobileOpen(false)
    setProfileOpen(false)
    navigate('/')
  }

  const linkClass = ({ isActive }) =>
    `px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
      isActive
        ? 'text-[#0D9488] underline decoration-2 underline-offset-4'
        : 'text-slate-300 hover:text-white hover:bg-slate-800'
    }`

  return (
    <nav className="bg-[#0F172A] shadow-lg sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <NavLink to="/" className="flex items-center gap-2 text-white font-bold text-lg">
          <LanguageIcon className="h-6 w-6 text-[#0D9488]" />
          <span>
            <span className="text-[#0D9488]">Chatgaiyya</span>Alap
          </span>
        </NavLink>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINK_KEYS.map(({ to, key }) => (
            <NavLink key={to} to={to} end={to === '/'} className={linkClass}>
              {t(key)}
            </NavLink>
          ))}

          <div className="ml-3 pl-3 border-l border-slate-700 flex items-center gap-2">
            {/* Language toggle */}
            <button
              onClick={() => setLang(lang === 'en' ? 'bn' : 'en')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-600 text-slate-300 hover:text-white hover:border-teal-500 hover:bg-slate-800 transition-colors"
              aria-label="Switch language"
            >
              <GlobeAltIcon className="h-4 w-4 text-[#5EEAD4]" />
              <span>{lang === 'en' ? 'বাংলা' : 'EN'}</span>
            </button>

            {isAuthenticated ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setProfileOpen((o) => !o)}
                  className="flex items-center gap-2 rounded-full hover:ring-2 hover:ring-teal-500/40 transition-all"
                  aria-label={t('nav.openProfileMenu')}
                >
                  {user.avatar ? (
                    <img src={user.avatar} alt="" className="w-8 h-8 rounded-full object-cover border-2 border-teal-400/50" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[#0D9488]/20 flex items-center justify-center border-2 border-teal-400/50">
                      <UserIcon className="h-4 w-4 text-[#5EEAD4]" />
                    </div>
                  )}
                  <span className="text-xs text-slate-300 hidden lg:inline max-w-[100px] truncate">{user.name}</span>
                </button>

                {/* Dropdown */}
                {profileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
                    <div className="px-4 py-3 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        {user.avatar ? (
                          <img src={user.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center">
                            <UserIcon className="h-5 w-5 text-[#0D9488]" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#0F172A] truncate">{user.name}</p>
                          <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                        </div>
                      </div>
                      <span className="inline-block mt-2 px-2 py-0.5 rounded bg-[#0D9488]/10 text-[#0D9488] font-semibold uppercase text-[10px]">
                        {user.role}
                      </span>
                    </div>
                    <Link
                      to="/profile"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <UserIcon className="h-4 w-4 text-slate-400" />
                      {t('nav.myProfile')}
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <ArrowRightStartOnRectangleIcon className="h-4 w-4" />
                      {t('nav.logout')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <NavLink to="/login" className="px-4 py-1.5 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
                  {t('nav.signIn')}
                </NavLink>
                <NavLink to="/register" className="px-4 py-1.5 text-sm bg-[#0D9488] hover:bg-[#0B7C72] text-white font-medium rounded-lg transition-colors">
                  {t('nav.register')}
                </NavLink>
              </>
            )}
          </div>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800"
          onClick={() => setMobileOpen((o) => !o)}
          aria-label={t('nav.toggleMobileMenu')}
        >
          {mobileOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-700 px-4 py-3 flex flex-col gap-1">
          {NAV_LINK_KEYS.map(({ to, key }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={linkClass}
              onClick={() => setMobileOpen(false)}
            >
              {t(key)}
            </NavLink>
          ))}

          <div className="mt-2 pt-2 border-t border-slate-700 flex flex-col gap-1">
            {/* Mobile language toggle */}
            <button
              onClick={() => setLang(lang === 'en' ? 'bn' : 'en')}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <GlobeAltIcon className="h-4 w-4 text-[#5EEAD4]" />
              {lang === 'en' ? 'বাংলায় পরিবর্তন করুন' : 'Switch to English'}
            </button>

            {isAuthenticated ? (
              <>
                <div className="flex items-center gap-3 px-4 py-2">
                  {user.avatar ? (
                    <img src={user.avatar} alt="" className="w-9 h-9 rounded-full object-cover border-2 border-teal-400/50" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-[#0D9488]/20 flex items-center justify-center border-2 border-teal-400/50">
                      <UserIcon className="h-4 w-4 text-[#5EEAD4]" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-200 truncate">{user.name}</p>
                    <span className="inline-block px-1.5 py-0.5 rounded bg-[#0D9488]/20 text-[#0D9488] font-semibold uppercase text-[10px]">
                      {user.role}
                    </span>
                  </div>
                </div>
                <NavLink to="/profile" className={linkClass} onClick={() => setMobileOpen(false)}>
                  {t('nav.myProfile')}
                </NavLink>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-slate-800 rounded-lg transition-colors text-left"
                >
                  <ArrowRightStartOnRectangleIcon className="h-4 w-4" />
                  {t('nav.logout')}
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className={linkClass} onClick={() => setMobileOpen(false)}>
                  {t('nav.signIn')}
                </NavLink>
                <NavLink to="/register" className={linkClass} onClick={() => setMobileOpen(false)}>
                  {t('nav.register')}
                </NavLink>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
