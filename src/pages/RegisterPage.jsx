import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { LanguageIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

const ROLE_KEYS = [
  { value: 'doctor', labelKey: 'register.doctor', descKey: 'register.doctorDesc', emoji: '🩺' },
  { value: 'patient', labelKey: 'register.patient', descKey: 'register.patientDesc', emoji: '🧑' },
]

export default function RegisterPage() {
  const { register } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', role: '' })
  const [error, setError] = useState('')

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name || !form.email || !form.password || !form.role) {
      setError(t('register.fillAll'))
      return
    }
    if (form.password.length < 6) {
      setError(t('register.passwordShort'))
      return
    }
    if (form.password !== form.confirmPassword) {
      setError(t('register.passwordMismatch'))
      return
    }
    const result = await register({ name: form.name, email: form.email, password: form.password, role: form.role })
    if (result.success) {
      toast.success(t('register.success'))
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
          <h1 className="text-2xl font-bold text-[#0F172A]">{t('register.createAccount')}</h1>
          <p className="text-slate-500 mt-1">{t('register.subtitle')}</p>
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
            <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1.5">
              {t('register.fullName')}
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              value={form.name}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488] outline-none transition-shadow text-sm"
              placeholder={t('register.namePlaceholder')}
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
              {t('register.email')}
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
              {t('register.password')}
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488] outline-none transition-shadow text-sm"
              placeholder={t('register.passwordPlaceholder')}
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-1.5">
              {t('register.confirmPassword')}
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={form.confirmPassword}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488] outline-none transition-shadow text-sm"
              placeholder={t('register.confirmPlaceholder')}
            />
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2.5">
              {t('register.selectRole')}
            </label>
            <div className="grid grid-cols-2 gap-3">
              {ROLE_KEYS.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => { setForm((f) => ({ ...f, role: r.value })); setError('') }}
                  className={`flex flex-col items-center gap-1.5 p-4 rounded-xl border-2 transition-all text-center ${
                    form.role === r.value
                      ? 'border-[#0D9488] bg-teal-50 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <span className="text-2xl">{r.emoji}</span>
                  <span className="font-semibold text-sm text-[#0F172A]">{t(r.labelKey)}</span>
                  <span className="text-xs text-slate-500 leading-tight">{t(r.descKey)}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-[#0D9488] hover:bg-[#0B7C72] text-white font-semibold rounded-lg transition-colors text-sm"
          >
            {t('register.createBtn')}
          </button>

          <p className="text-center text-sm text-slate-500">
            {t('register.hasAccount')}{' '}
            <Link to="/login" className="text-[#0D9488] font-medium hover:underline">
              {t('register.signInLink')}
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
