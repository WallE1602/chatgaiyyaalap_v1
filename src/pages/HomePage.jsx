import { useNavigate } from 'react-router-dom'
import {
  UserIcon,
  HeartIcon,
  BookOpenIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
  ClipboardDocumentListIcon,
  LanguageIcon,
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  CheckBadgeIcon,
} from '@heroicons/react/24/outline'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import {
  DoctorPatientIllustration,
  StethoscopeIcon,
  MedicalShieldIcon,
  HeartbeatIcon,
  PrescriptionIcon,
  HospitalBuildingIcon,
  AmbulanceIcon,
} from '../assets/MedicalIllustrations'

const TEAM = [
  { name: 'Sefatul Wasi', id: '2511921' },
  { name: 'Deawan Rakin Ahamed Remal', id: '2511929' },
  { name: 'Sinthia Chowdhury', id: '2511930' },
]

const FEATURES_ICONS = [
  ShieldCheckIcon,
  ChatBubbleLeftRightIcon,
  ClipboardDocumentListIcon,
  LanguageIcon,
]

const STAT_ICONS = [
  ClipboardDocumentListIcon,
  BookOpenIcon,
  LanguageIcon,
  HeartIcon,
]

const STAT_VALUES = ['4', '50+', '2', '100%']

const HOW_ILLUSTRATIONS = ['shield', 'stethoscope', 'prescription']

export default function HomePage() {
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()
  const { t } = useLanguage()

  const FEATURES = [
    { icon: FEATURES_ICONS[0], title: t('home.feat1Title'), desc: t('home.feat1Desc') },
    { icon: FEATURES_ICONS[1], title: t('home.feat2Title'), desc: t('home.feat2Desc') },
    { icon: FEATURES_ICONS[2], title: t('home.feat3Title'), desc: t('home.feat3Desc') },
    { icon: FEATURES_ICONS[3], title: t('home.feat4Title'), desc: t('home.feat4Desc') },
  ]

  const STATS = [
    { value: STAT_VALUES[0], label: t('home.statCategories'), Icon: STAT_ICONS[0] },
    { value: STAT_VALUES[1], label: t('home.statPhrases'), Icon: STAT_ICONS[1] },
    { value: STAT_VALUES[2], label: t('home.statLanguages'), Icon: STAT_ICONS[2] },
    { value: STAT_VALUES[3], label: t('home.statFree'), Icon: STAT_ICONS[3] },
  ]

  const HOW_IT_WORKS = [
    { step: '1', title: t('home.how1Title'), desc: t('home.how1Desc'), illustration: HOW_ILLUSTRATIONS[0] },
    { step: '2', title: t('home.how2Title'), desc: t('home.how2Desc'), illustration: HOW_ILLUSTRATIONS[1] },
    { step: '3', title: t('home.how3Title'), desc: t('home.how3Desc'), illustration: HOW_ILLUSTRATIONS[2] },
  ]

  return (
    <main>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0F172A] via-[#0F172A] to-teal-900 text-white">
        {/* Decorative background elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-teal-400 rounded-full blur-[120px]" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-400 rounded-full blur-[150px]" />
        </div>
        {/* Cross pattern for medical feel */}
        <div className="absolute top-12 right-20 text-teal-600/10 hidden lg:block">
          <svg width="120" height="120" viewBox="0 0 120 120"><rect x="45" y="0" width="30" height="120" fill="currentColor"/><rect x="0" y="45" width="120" height="30" fill="currentColor"/></svg>
        </div>
        <div className="absolute bottom-16 left-16 text-teal-600/10 hidden lg:block">
          <svg width="80" height="80" viewBox="0 0 120 120"><rect x="45" y="0" width="30" height="120" fill="currentColor"/><rect x="0" y="45" width="120" height="30" fill="currentColor"/></svg>
        </div>

        <div className="relative max-w-6xl mx-auto px-4 py-24 md:py-32">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left — Text */}
            <div>
              <div className="inline-flex items-center gap-2 bg-teal-500/10 backdrop-blur-sm text-[#5EEAD4] text-sm px-4 py-2 rounded-full mb-6 border border-teal-500/20">
                <HeartIcon className="h-4 w-4" />
                {t('home.heroBadge')}
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-5 leading-tight">
                {t('home.heroTitle1')} <span className="text-[#5EEAD4]">{t('home.heroTitle2')}</span> {t('home.heroTitle3')}
              </h1>

              <p className="text-slate-300 text-lg leading-relaxed mb-4 max-w-lg">
                {t('home.heroDesc')}
              </p>

              <p className="text-slate-400 font-bengali text-base mb-8">
                {t('home.heroBangla')}
              </p>

              {/* CTA */}
              <div className="flex flex-col sm:flex-row gap-3">
                {isAuthenticated ? (
                  <button
                    onClick={() => navigate('/translate')}
                    className="flex items-center justify-center gap-2 px-8 py-4 bg-[#0D9488] text-white font-semibold rounded-xl hover:bg-teal-600 transition-colors shadow-lg shadow-teal-900/40"
                  >
                    <ArrowRightIcon className="h-5 w-5" />
                    {t('home.ctaTranslator')}
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => navigate('/register')}
                      className="flex items-center justify-center gap-2 px-8 py-4 bg-[#0D9488] text-white font-semibold rounded-xl hover:bg-teal-600 transition-colors shadow-lg shadow-teal-900/40"
                    >
                      <UserIcon className="h-5 w-5" />
                      {t('home.ctaGetStarted')}
                    </button>
                    <button
                      onClick={() => navigate('/login')}
                      className="flex items-center justify-center gap-2 px-8 py-4 bg-white/5 text-white font-semibold rounded-xl border border-white/10 hover:bg-white/10 transition-colors"
                    >
                      {t('home.ctaSignIn')}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Right — Healthcare illustration */}
            <div className="hidden md:flex justify-center">
              <div className="relative w-full max-w-md">
                {/* Main illustration */}
                <DoctorPatientIllustration className="w-full h-auto drop-shadow-lg" />

                {/* Floating cards around illustration */}
                <div className="absolute top-4 right-0 bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-3 shadow-lg flex items-center gap-2.5 animate-pulse">
                  <HeartbeatIcon className="w-8 h-8" />
                  <span className="text-xs font-semibold text-[#5EEAD4]">{t('home.floatingLive')}</span>
                </div>

                <div className="absolute -bottom-2 left-4 bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-xl flex items-center gap-2.5">
                  <MedicalShieldIcon className="w-8 h-8" />
                  <div>
                    <span className="text-xs font-semibold text-[#0F172A] block">{t('home.floatingAccuracy')}</span>
                    <span className="text-[10px] text-slate-400">{t('home.floatingVerified')}</span>
                  </div>
                </div>

                <div className="absolute bottom-16 -right-2 bg-white border border-slate-200 rounded-2xl px-3 py-2.5 shadow-xl flex items-center gap-2">
                  <StethoscopeIcon className="w-7 h-7" />
                  <span className="text-[10px] font-semibold text-[#0D9488]">{t('home.floatingReady')}<br/>{t('home.floatingReadyLine2')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust Stats ────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {STATS.map(({ value, label, Icon }) => (
              <div key={label} className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center mb-2">
                  <Icon className="h-5 w-5 text-[#0D9488]" />
                </div>
                <p className="text-3xl font-extrabold text-[#0D9488]">{value}</p>
                <p className="text-sm text-slate-500 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-[#F8FAFC] relative overflow-hidden">
        {/* Background medical accents */}
        <div className="absolute top-10 right-6 opacity-[0.04] hidden lg:block">
          <StethoscopeIcon className="w-48 h-48" />
        </div>
        <div className="absolute bottom-10 left-6 opacity-[0.04] hidden lg:block">
          <HeartbeatIcon className="w-40 h-40" />
        </div>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-teal-50 text-[#0D9488] text-xs font-semibold px-3 py-1.5 rounded-full mb-4 border border-teal-100">
              <ShieldCheckIcon className="h-3.5 w-3.5" />
              {t('home.featuresBadge')}
            </div>
            <h2 className="text-3xl font-bold text-[#0F172A] mb-3">
              {t('home.featuresTitle')}
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              {t('home.featuresDesc')}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="bg-white rounded-2xl p-7 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex gap-5"
              >
                <div className="flex-shrink-0 w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center">
                  <Icon className="h-6 w-6 text-[#0D9488]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#0F172A] mb-1.5">{title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Medical Banner ──────────────────────────────────────────────── */}
      <section className="bg-gradient-to-r from-[#0F172A] to-teal-900 py-14 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.05]">
          <div className="absolute top-4 left-[10%]"><StethoscopeIcon className="w-20 h-20" /></div>
          <div className="absolute bottom-2 right-[15%]"><HeartbeatIcon className="w-24 h-24" /></div>
          <div className="absolute top-2 right-[40%]"><MedicalShieldIcon className="w-16 h-16" /></div>
        </div>
        <div className="relative max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-8">
          <div className="flex items-center gap-4">
            <AmbulanceIcon className="w-20 h-12 flex-shrink-0" />
            <HospitalBuildingIcon className="w-14 h-14 flex-shrink-0 hidden sm:block" />
          </div>
          <div className="text-center md:text-left flex-1">
            <h3 className="text-xl font-bold text-white mb-1">{t('home.bannerTitle')}</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              {t('home.bannerDesc')}
            </p>
          </div>
          <button
            onClick={() => navigate(isAuthenticated ? '/translate' : '/register')}
            className="flex-shrink-0 px-6 py-3 bg-[#0D9488] hover:bg-teal-600 text-white font-semibold rounded-xl transition-colors text-sm whitespace-nowrap"
          >
            {t('home.bannerCta')}
          </button>
        </div>
      </section>

      {/* ── How It Works ────────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-white border-t border-slate-100">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-[#0F172A] mb-3">{t('home.howTitle')}</h2>
            <p className="text-slate-500">{t('home.howDesc')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map(({ step, title, desc, illustration }) => {
              const IllustrationComponent = illustration === 'shield' ? MedicalShieldIcon : illustration === 'stethoscope' ? StethoscopeIcon : PrescriptionIcon
              return (
                <div key={step} className="text-center group">
                  <div className="w-20 h-20 mx-auto mb-5 bg-teal-50 rounded-2xl flex items-center justify-center group-hover:bg-teal-100 transition-colors relative">
                    <IllustrationComponent className="w-12 h-12" />
                    <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-[#0D9488] text-white text-xs font-bold flex items-center justify-center shadow-md">
                      {step}
                    </span>
                  </div>
                  <h3 className="font-semibold text-[#0F172A] mb-2">{title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
                </div>
              )
            })}
          </div>
          <div className="text-center mt-12">
            <button
              onClick={() => navigate(isAuthenticated ? '/translate' : '/register')}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-[#0F172A] text-white font-semibold hover:bg-slate-800 transition-colors shadow-md"
            >
              <ArrowRightIcon className="h-4 w-4" />
              {isAuthenticated ? t('home.ctaOpenTranslator') : t('home.ctaCreateAccount')}
            </button>
          </div>
        </div>
      </section>

      {/* ── About the Project ───────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-[#F8FAFC] border-t border-slate-100">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="grid md:grid-cols-5">
              {/* Left accent */}
              <div className="md:col-span-2 bg-gradient-to-br from-[#0F172A] to-slate-800 p-10 flex flex-col justify-center text-white relative overflow-hidden">
                {/* Background medical illustration */}
                <div className="absolute -bottom-8 -right-8 opacity-[0.06]">
                  <HospitalBuildingIcon className="w-48 h-48" />
                </div>
                <HeartIcon className="h-10 w-10 text-[#5EEAD4] mb-4" />
                <h2 className="text-2xl font-bold mb-2">{t('home.aboutTitle')}</h2>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {t('home.aboutDesc')}
                </p>
                <div className="mt-6 space-y-2 text-xs text-slate-400">
                  <p><span className="text-slate-300 font-medium">{t('home.aboutCourse')}:</span> CSE-451</p>
                  <p><span className="text-slate-300 font-medium">{t('home.aboutInstitution')}:</span> IUB</p>
                  <p><span className="text-slate-300 font-medium">{t('home.aboutGroup')}:</span> G-12</p>
                  <p><span className="text-slate-300 font-medium">{t('home.aboutSemester')}:</span> Spring 2026</p>
                </div>
              </div>
              {/* Right content */}
              <div className="md:col-span-3 p-10">
                <p className="text-slate-600 leading-relaxed mb-8">
                  <strong className="text-[#0F172A]">ChatgaiyyaAlap</strong> {t('home.aboutMainText')}{' '}
                  <strong className="text-[#0F172A]">CSE-451</strong> {t('home.aboutMainText2')}
                </p>
                <div className="flex flex-wrap gap-2 mb-8">
                  {['React 19 + Vite', 'Tailwind CSS', 'React Router v7', 'Web Speech API', 'Heroicons'].map((tag) => (
                    <span key={tag} className="px-3 py-1.5 bg-slate-100 text-slate-600 text-xs font-medium rounded-lg border border-slate-200">
                      {tag}
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => navigate('/phrases')}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0D9488] text-white font-medium hover:bg-teal-600 transition-colors text-sm"
                >
                  <BookOpenIcon className="h-4 w-4" />
                  {t('home.aboutBrowseLibrary')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Team Credits ────────────────────────────────────────────────── */}
      <section className="py-16 px-4 bg-white border-t border-slate-100">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <UserGroupIcon className="h-8 w-8 text-[#0D9488] mx-auto mb-3" />
            <h2 className="text-2xl font-bold text-[#0F172A] mb-1">{t('home.teamTitle')}</h2>
            <p className="text-slate-500 text-sm">
              {t('home.teamSubtitle')}
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-5">
            {TEAM.map(({ name, id }) => (
              <div
                key={name}
                className="w-52 bg-[#F8FAFC] rounded-2xl border border-slate-200 p-6 text-center hover:shadow-md transition-shadow"
              >
                <div className="w-14 h-14 rounded-full bg-[#0D9488]/10 text-[#0D9488] flex items-center justify-center mx-auto mb-4">
                  <UserIcon className="h-7 w-7" />
                </div>
                <p className="font-semibold text-sm text-[#1E293B] leading-snug">{name}</p>
                <p className="text-xs text-slate-500 mt-1">ID: {id}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{t('home.mscStudent')}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
