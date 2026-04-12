import { Link } from 'react-router-dom'
import { ShieldExclamationIcon } from '@heroicons/react/24/outline'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

export default function UnauthorizedPage() {
  const { user } = useAuth()
  const { t } = useLanguage()

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <ShieldExclamationIcon className="h-16 w-16 text-red-400 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-[#0F172A] mb-2">{t('unauthorized.title')}</h1>
        <p className="text-slate-500 mb-6">
          {t('unauthorized.message')} <span className="font-semibold text-[#0F172A]">({user?.role})</span> {t('unauthorized.messageSuffix')}
        </p>
        <Link
          to="/"
          className="inline-block px-6 py-2.5 bg-[#0D9488] hover:bg-[#0B7C72] text-white font-semibold rounded-lg transition-colors text-sm"
        >
          {t('unauthorized.goHome')}
        </Link>
      </div>
    </div>
  )
}
