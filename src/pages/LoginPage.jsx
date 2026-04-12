import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { LanguageIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const { login, isAuthenticated, loading } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate('/translate', { replace: true })
    }
  }, [loading, isAuthenticated, navigate])

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.email || !form.password) {
      setError(t('login.fillAll'))
      return
    }
    const result = await login(form)
    if (result.success) {
      toast.success(t('login.success'))
      navigate('/translate')
    } else {
      setError(result.message)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <LanguageIcon className="h-8 w-8 text-[#0D9488]" />
            <span className="text-2xl font-bold text-[#0F172A]">
              <span className="text-[#0D9488]">Chatgaiyya</span>Alap
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#0F172A]">{t('login.welcomeBack')}</h1>
          <p className="text-slate-500 mt-1">{t('login.subtitle')}</p>
        </div>

        {/* Form Card */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 space-y-5"
        >
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
              {t('login.email')}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488] outline-none transition-shadow text-sm"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
              {t('login.password')}
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={form.password}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488] outline-none transition-shadow text-sm"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-[#0D9488] hover:bg-[#0B7C72] text-white font-semibold rounded-lg transition-colors text-sm"
          >
            {t('login.signInBtn')}
          </button>

          <p className="text-center text-sm text-slate-500">
            {t('login.noAccount')}{' '}
            <Link to="/register" className="text-[#0D9488] font-medium hover:underline">
              {t('login.registerLink')}
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
