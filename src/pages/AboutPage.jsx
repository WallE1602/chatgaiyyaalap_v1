import {
  CodeBracketIcon,
  UserGroupIcon,
  AcademicCapIcon,
  HeartIcon,
} from '@heroicons/react/24/outline'
import { useLanguage } from '../context/LanguageContext'

const TEAM = [
  { name: 'Sefatul Wasi', id: '2511921', role: 'MSc' },
  { name: 'Deawan Rakin Ahamed Remal', id: '2511929', role: 'MSc' },
  { name: 'Sinthia Chowdhury', id: '2511930', role: 'MSc' },
]

const TECH_STACK = [
  'React 18 + Vite',
  'Tailwind CSS',
  'React Router DOM v6',
  '@heroicons/react',
  'react-hot-toast',
  'Noto Sans Bengali',
]

export default function AboutPage() {
  const { t } = useLanguage()

  const COURSE_DETAILS = [
    { label: t('about.courseLabel'), value: 'CSE-451: Software Engineering' },
    { label: t('about.institutionLabel'), value: 'Independent University, Bangladesh (IUB)' },
    { label: t('about.groupLabel'), value: 'G-12' },
    { label: t('about.semesterLabel'), value: 'Spring 2026' },
    { label: t('about.typeLabel'), value: 'Demo' },
  ]

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      {/* ── Project Overview Card ───────────────────────────────────────── */}
      <div className="bg-[#0F172A] rounded-2xl p-8 text-white mb-8">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-teal-900/50 rounded-xl flex-shrink-0">
            <HeartIcon className="h-7 w-7 text-[#0D9488]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold mb-2">{t('about.projectName')}</h1>
            <p className="text-slate-300 leading-relaxed text-sm">
              {t('about.projectDesc')}
            </p>
          </div>
        </div>

        {/* Course meta strip */}
        <div className="mt-6 grid grid-cols-3 gap-4 border-t border-slate-700 pt-6">
          {[
            { label: t('about.course'), value: 'CSE-451' },
            { label: t('about.university'), value: 'IUB' },
            { label: t('about.group'), value: 'G-12' },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest">{label}</p>
              <p className="font-bold text-[#0D9488] text-xl mt-0.5">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Two-column detail grid ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Team Members */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-5">
            <UserGroupIcon className="h-5 w-5 text-[#0D9488]" />
            <h2 className="font-bold text-[#0F172A]">{t('about.teamMembers')}</h2>
          </div>
          <div className="space-y-3">
            {TEAM.map(({ name, id, role }) => (
              <div
                key={name}
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100"
              >
                <div className="w-9 h-9 rounded-full bg-[#0D9488]/10 text-[#0D9488] flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-[#1E293B] truncate">{name}</p>
                  <p className="text-xs text-[#64748B]">
                    {id} · {role}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Right column: Tech Stack + Course Details */}
        <div className="flex flex-col gap-6">
          {/* Tech Stack */}
          <section className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <CodeBracketIcon className="h-5 w-5 text-[#0D9488]" />
              <h2 className="font-bold text-[#0F172A]">{t('about.techStack')}</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {TECH_STACK.map((tech) => (
                <span
                  key={tech}
                  className="px-3 py-1 rounded-full bg-slate-100 text-sm text-[#1E293B] font-medium"
                >
                  {tech}
                </span>
              ))}
            </div>
          </section>

          {/* Course Details */}
          <section className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <AcademicCapIcon className="h-5 w-5 text-[#0D9488]" />
              <h2 className="font-bold text-[#0F172A]">{t('about.courseDetails')}</h2>
            </div>
            <dl className="space-y-2 text-sm">
              {COURSE_DETAILS.map(({ label, value }) => (
                <div key={label} className="flex gap-2">
                  <dt className="text-[#64748B] w-24 flex-shrink-0">{label}:</dt>
                  <dd className="text-[#1E293B] font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
      </div>
    </main>
  )
}
