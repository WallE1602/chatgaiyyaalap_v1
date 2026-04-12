import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { db } from '../firebase'
import { collection, query, where, getCountFromServer } from 'firebase/firestore'
import { CameraIcon, UserIcon, CheckIcon, PlusIcon, XMarkIcon, ArrowRightStartOnRectangleIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

const ROLE_KEYS = [
  { value: 'doctor', labelKey: 'register.doctor', emoji: '🩺' },
  { value: 'patient', labelKey: 'register.patient', emoji: '🧑' },
]

const SPECIALTIES = [
  'General Practice', 'Cardiology', 'Pediatrics', 'Neurology', 'Orthopedics',
  'Dermatology', 'Psychiatry', 'ENT', 'Ophthalmology', 'Gynecology',
  'Surgery', 'Internal Medicine', 'Pulmonology', 'Oncology', 'Other',
]

const LANGUAGES = ['Standard Bangla', 'English', 'Chittagonian', 'Hindi', 'Urdu', 'Arabic']

const DIALECT_REGIONS = [
  'Chattogram City', 'Hathazari', 'Cox\'s Bazar', 'Patiya', 'Sitakunda',
  'Sandwip', 'Banshkhali', 'Rangunia', 'Boalkhali', 'Anwara', 'Lohagara', 'Other',
]

const GENDERS = ['Male', 'Female', 'Other', 'Prefer not to say']

const COMMON_CONDITIONS = [
  'Diabetes', 'Hypertension', 'Asthma', 'Heart Disease', 'Thyroid Disorder',
  'Arthritis', 'Kidney Disease', 'Liver Disease', 'Allergies', 'Migraine',
]

const UI_LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'bn', label: 'বাংলা (Bangla)' },
]

const MAX_AVATAR_SIZE = 200 * 1024

// ── Reusable input class ──
const inputCls = 'w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488] outline-none transition-shadow text-sm'
const labelCls = 'block text-sm font-medium text-slate-700 mb-1.5'
const sectionTitle = (text) => (
  <div className="flex items-center gap-2 pt-2 pb-1">
    <div className="h-px flex-1 bg-slate-200" />
    <span className="text-xs font-semibold uppercase tracking-wider text-[#0D9488]">{text}</span>
    <div className="h-px flex-1 bg-slate-200" />
  </div>
)

export default function ProfilePage() {
  const { user, updateProfile, logout } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const [translationCount, setTranslationCount] = useState(null)

  // Fetch translation count from Firestore
  useEffect(() => {
    if (!user?.uid) return
    const q = query(collection(db, 'translations'), where('userId', '==', user.uid))
    getCountFromServer(q)
      .then((snap) => setTranslationCount(snap.data().count))
      .catch(() => setTranslationCount(0))
  }, [user])

  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    role: user?.role || '',
    phone: user?.phone || '',
    // Doctor fields
    specialty: user?.specialty || '',
    bmdcNumber: user?.bmdcNumber || '',
    hospital: user?.hospital || '',
    languageProficiency: user?.languageProficiency || [],
    // Patient fields
    dialectRegion: user?.dialectRegion || '',
    dateOfBirth: user?.dateOfBirth || '',
    gender: user?.gender || '',
    emergencyContactName: user?.emergencyContactName || '',
    emergencyContactPhone: user?.emergencyContactPhone || '',
    medicalHistory: user?.medicalHistory || [],
    medicalHistoryNotes: user?.medicalHistoryNotes || '',
    // General settings
    uiLanguage: user?.uiLanguage || 'en',
    largeText: user?.largeText || false,
    textToSpeech: user?.textToSpeech || false,
  })
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || null)
  const [pendingAvatar, setPendingAvatar] = useState(null)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
    setError('')
    setSaved(false)
  }

  function toggleArrayItem(field, item) {
    setForm((f) => {
      const arr = f[field] || []
      return { ...f, [field]: arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item] }
    })
    setError('')
    setSaved(false)
  }

  function handleAvatarClick() { fileInputRef.current?.click() }

  function handleAvatarChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setError(t('profile.invalidImage')); return }
    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = ev.target.result
      if (dataUrl.length > MAX_AVATAR_SIZE) { setError(t('profile.imageTooLarge')); return }
      setAvatarPreview(dataUrl)
      setPendingAvatar(dataUrl)
      setError('')
      setSaved(false)
    }
    reader.readAsDataURL(file)
  }

  function handleRemoveAvatar() { setAvatarPreview(null); setPendingAvatar(''); setSaved(false) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name || !form.email || !form.role) { setError(t('profile.requiredFields')); return }

    const updates = { ...form }
    if (pendingAvatar !== null) updates.avatar = pendingAvatar || ''

    const result = await updateProfile(updates)
    if (result.success) {
      toast.success(t('profile.updated'))
      setSaved(true)
      setPendingAvatar(null)
    } else {
      setError(result.message)
    }
  }

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-[#0F172A] mb-2">{t('profile.title')}</h1>
        <p className="text-slate-500 text-sm mb-8">{t('profile.subtitle')}</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>
          )}
          {saved && (
            <div className="bg-teal-50 border border-teal-200 text-teal-700 text-sm rounded-lg px-4 py-3 flex items-center gap-2">
              <CheckIcon className="h-4 w-4" /> {t('profile.saved')}
            </div>
          )}

          {/* ── Card: Basic Info ────────────────────────────────────── */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 space-y-6">
            <h2 className="text-lg font-semibold text-[#0F172A]">{t('profile.basicInfo')}</h2>

            {/* Avatar */}
            <div className="flex flex-col items-center gap-3">
              <button type="button" onClick={handleAvatarClick} className="relative group" aria-label="Change profile picture">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Profile" className="w-24 h-24 rounded-full object-cover border-4 border-teal-100 shadow-md" />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-teal-50 border-4 border-teal-100 flex items-center justify-center shadow-md">
                    <UserIcon className="h-10 w-10 text-[#0D9488]" />
                  </div>
                )}
                <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <CameraIcon className="h-7 w-7 text-white" />
                </div>
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
              <div className="flex gap-3">
                <button type="button" onClick={handleAvatarClick} className="text-xs text-[#0D9488] font-medium hover:underline">{t('profile.uploadPhoto')}</button>
                {avatarPreview && <button type="button" onClick={handleRemoveAvatar} className="text-xs text-red-400 font-medium hover:underline">{t('profile.removePhoto')}</button>}
              </div>
            </div>

            {/* Name */}
            <div>
              <label htmlFor="name" className={labelCls}>{t('profile.fullName')}</label>
              <input id="name" name="name" type="text" value={form.name} onChange={handleChange} className={inputCls} />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className={labelCls}>{t('profile.email')}</label>
              <input id="email" name="email" type="email" value={form.email} onChange={handleChange} className={inputCls} />
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className={labelCls}>{t('profile.phone')}</label>
              <input id="phone" name="phone" type="tel" value={form.phone} onChange={handleChange} className={inputCls} placeholder={t('profile.phonePlaceholder')} />
            </div>

            {/* Role */}
            <div>
              <label className={labelCls}>{t('profile.role')}</label>
              <div className="grid grid-cols-2 gap-3">
                {ROLE_KEYS.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => { setForm((f) => ({ ...f, role: r.value })); setError(''); setSaved(false) }}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all text-sm font-medium ${
                      form.role === r.value ? 'border-[#0D9488] bg-teal-50 text-[#0D9488]' : 'border-slate-200 hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    <span>{r.emoji}</span> {t(r.labelKey)}
                  </button>
                ))}
              </div>
            </div>

            {/* Account info */}
            <div className="bg-slate-50 rounded-xl px-4 py-3 text-xs text-slate-500 space-y-1">
              <div><span className="font-medium text-slate-600">Email:</span> {user?.email}</div>
              {user?.createdAt && (
                <div>
                  <span className="font-medium text-slate-600">Member since:</span>{' '}
                  {(user.createdAt.toDate ? user.createdAt.toDate() : new Date(user.createdAt)).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              )}
              <div>
                <span className="font-medium text-slate-600">Total translations:</span>{' '}
                {translationCount !== null ? translationCount : '…'}
              </div>
            </div>
          </div>

          {/* ── Card: Doctor Fields ─────────────────────────────────── */}
          {form.role === 'doctor' && (
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 space-y-6">
              <div className="flex items-center gap-2">
                <span className="text-xl">🩺</span>
                <h2 className="text-lg font-semibold text-[#0F172A]">{t('profile.professionalDetails')}</h2>
              </div>

              {/* Specialty */}
              <div>
                <label htmlFor="specialty" className={labelCls}>{t('profile.specialty')}</label>
                <select id="specialty" name="specialty" value={form.specialty} onChange={handleChange} className={inputCls}>
                  <option value="">{t('profile.selectSpecialty')}</option>
                  {SPECIALTIES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* BMDC */}
              <div>
                <label htmlFor="bmdcNumber" className={labelCls}>{t('profile.bmdcNumber')}</label>
                <input id="bmdcNumber" name="bmdcNumber" type="text" value={form.bmdcNumber} onChange={handleChange} className={inputCls} placeholder={t('profile.bmdcPlaceholder')} />
                <p className="text-[11px] text-slate-400 mt-1">{t('profile.bmdcHint')}</p>
              </div>

              {/* Hospital */}
              <div>
                <label htmlFor="hospital" className={labelCls}>{t('profile.hospital')}</label>
                <input id="hospital" name="hospital" type="text" value={form.hospital} onChange={handleChange} className={inputCls} placeholder={t('profile.hospitalPlaceholder')} />
              </div>

              {/* Language Proficiency */}
              <div>
                <label className={labelCls}>{t('profile.langProficiency')}</label>
                <p className="text-[11px] text-slate-400 mb-2">{t('profile.langProfHint')}</p>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => toggleArrayItem('languageProficiency', lang)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        form.languageProficiency.includes(lang)
                          ? 'border-[#0D9488] bg-teal-50 text-[#0D9488]'
                          : 'border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      {form.languageProficiency.includes(lang) && <CheckIcon className="h-3 w-3 inline mr-1" />}
                      {lang}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Card: Patient Fields ────────────────────────────────── */}
          {form.role === 'patient' && (
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 space-y-6">
              <div className="flex items-center gap-2">
                <span className="text-xl">🧑</span>
                <h2 className="text-lg font-semibold text-[#0F172A]">{t('profile.patientInfo')}</h2>
              </div>

              {/* Dialect Region */}
              <div>
                <label htmlFor="dialectRegion" className={labelCls}>{t('profile.dialectRegion')}</label>
                <select id="dialectRegion" name="dialectRegion" value={form.dialectRegion} onChange={handleChange} className={inputCls}>
                  <option value="">{t('profile.selectRegion')}</option>
                  {DIALECT_REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">{t('profile.dialectHint')}</p>
              </div>

              {/* DOB */}
              <div>
                <label htmlFor="dateOfBirth" className={labelCls}>{t('profile.dateOfBirth')}</label>
                <input id="dateOfBirth" name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={handleChange} className={inputCls} />
              </div>

              {/* Gender */}
              <div>
                <label htmlFor="gender" className={labelCls}>{t('profile.gender')}</label>
                <select id="gender" name="gender" value={form.gender} onChange={handleChange} className={inputCls}>
                  <option value="">{t('profile.selectGender')}</option>
                  {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>

              {sectionTitle(t('profile.emergencyContact'))}

              {/* Emergency Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="emergencyContactName" className={labelCls}>{t('profile.contactName')}</label>
                  <input id="emergencyContactName" name="emergencyContactName" type="text" value={form.emergencyContactName} onChange={handleChange} className={inputCls} placeholder={t('profile.contactNamePlaceholder')} />
                </div>
                <div>
                  <label htmlFor="emergencyContactPhone" className={labelCls}>{t('profile.contactPhone')}</label>
                  <input id="emergencyContactPhone" name="emergencyContactPhone" type="tel" value={form.emergencyContactPhone} onChange={handleChange} className={inputCls} placeholder="+880 1XXX-XXXXXX" />
                </div>
              </div>

              {sectionTitle(t('profile.medicalHistory'))}

              {/* Pre-existing Conditions */}
              <div>
                <label className={labelCls}>{t('profile.preExisting')}</label>
                <p className="text-[11px] text-slate-400 mb-2">{t('profile.preExistingHint')}</p>
                <div className="flex flex-wrap gap-2">
                  {COMMON_CONDITIONS.map((cond) => (
                    <button
                      key={cond}
                      type="button"
                      onClick={() => toggleArrayItem('medicalHistory', cond)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        form.medicalHistory.includes(cond)
                          ? 'border-red-300 bg-red-50 text-red-600'
                          : 'border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      {form.medicalHistory.includes(cond) ? (
                        <XMarkIcon className="h-3 w-3 inline mr-1" />
                      ) : (
                        <PlusIcon className="h-3 w-3 inline mr-1" />
                      )}
                      {cond}
                    </button>
                  ))}
                </div>
              </div>

              {/* Additional notes */}
              <div>
                <label htmlFor="medicalHistoryNotes" className={labelCls}>{t('profile.additionalNotes')} <span className="text-slate-400 font-normal">{t('profile.additionalNotesOptional')}</span></label>
                <textarea
                  id="medicalHistoryNotes"
                  name="medicalHistoryNotes"
                  rows={3}
                  value={form.medicalHistoryNotes}
                  onChange={handleChange}
                  className={inputCls + ' resize-none'}
                  placeholder={t('profile.additionalNotesPlaceholder')}
                />
              </div>
            </div>
          )}

          {/* ── Card: General Settings ──────────────────────────────── */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 space-y-6">
            <div className="flex items-center gap-2">
              <span className="text-xl">⚙️</span>
                <h2 className="text-lg font-semibold text-[#0F172A]">{t('profile.generalSettings')}</h2>
            </div>

            {/* UI Language */}
            <div>
              <label htmlFor="uiLanguage" className={labelCls}>{t('profile.uiLanguage')}</label>
              <select id="uiLanguage" name="uiLanguage" value={form.uiLanguage} onChange={handleChange} className={inputCls}>
                {UI_LANGUAGES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
            </div>

            {/* Accessibility */}
            <div>
              <label className={labelCls}>{t('profile.accessibility')}</label>
              <div className="space-y-3 mt-1">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    name="largeText"
                    checked={form.largeText}
                    onChange={handleChange}
                    className="w-4 h-4 rounded border-slate-300 text-[#0D9488] focus:ring-[#0D9488]"
                  />
                  <div>
                    <p className="text-sm text-slate-700 font-medium group-hover:text-[#0D9488] transition-colors">{t('profile.largeText')}</p>
                    <p className="text-[11px] text-slate-400">{t('profile.largeTextDesc')}</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    name="textToSpeech"
                    checked={form.textToSpeech}
                    onChange={handleChange}
                    className="w-4 h-4 rounded border-slate-300 text-[#0D9488] focus:ring-[#0D9488]"
                  />
                  <div>
                    <p className="text-sm text-slate-700 font-medium group-hover:text-[#0D9488] transition-colors">{t('profile.textToSpeech')}</p>
                    <p className="text-[11px] text-slate-400">{t('profile.ttsDesc')}</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* ── Save Button ─────────────────────────────────────────── */}
          <button
            type="submit"
            className="w-full py-3 bg-[#0D9488] hover:bg-[#0B7C72] text-white font-semibold rounded-xl transition-colors text-sm shadow-md"
          >
            {t('profile.saveAll')}
          </button>

          {/* ── Logout Button ───────────────────────────────────────── */}
          <button
            type="button"
            onClick={handleLogout}
            className="w-full py-3 flex items-center justify-center gap-2 bg-white border border-red-200 text-red-600 font-semibold rounded-xl hover:bg-red-50 transition-colors text-sm"
          >
            <ArrowRightStartOnRectangleIcon className="h-5 w-5" />
            Logout
          </button>
        </form>
      </div>
    </div>
  )
}
