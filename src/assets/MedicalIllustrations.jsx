/** Inline medical SVG illustrations for the healthcare theme. */

export function DoctorPatientIllustration({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 400 320" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Background circle */}
      <circle cx="200" cy="160" r="140" fill="#0D9488" opacity="0.06" />
      <circle cx="200" cy="160" r="100" fill="#0D9488" opacity="0.04" />

      {/* Stethoscope */}
      <path d="M160 80 C160 80 140 100 140 130 C140 160 160 170 170 180" stroke="#0D9488" strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d="M200 80 C200 80 220 100 220 130 C220 160 200 170 190 180" stroke="#0D9488" strokeWidth="4" strokeLinecap="round" fill="none" />
      <circle cx="180" cy="190" r="14" stroke="#0D9488" strokeWidth="4" fill="#0D9488" opacity="0.15" />
      <circle cx="160" cy="76" r="6" fill="#0D9488" />
      <circle cx="200" cy="76" r="6" fill="#0D9488" />

      {/* Doctor figure */}
      <circle cx="120" cy="200" r="22" fill="#E2E8F0" />
      <circle cx="120" cy="200" r="22" stroke="#0D9488" strokeWidth="2.5" />
      <rect x="98" y="228" width="44" height="60" rx="12" fill="#0D9488" opacity="0.85" />
      <rect x="110" y="228" width="20" height="12" rx="4" fill="white" opacity="0.5" />
      {/* Doctor cross */}
      <rect x="116" y="235" width="8" height="2" rx="1" fill="white" />
      <rect x="119" y="233" width="2" height="6" rx="1" fill="white" />
      {/* Head features */}
      <circle cx="114" cy="198" r="2" fill="#475569" />
      <circle cx="126" cy="198" r="2" fill="#475569" />
      <path d="M116 206 Q120 210 124 206" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" fill="none" />

      {/* Patient figure */}
      <circle cx="280" cy="200" r="22" fill="#E2E8F0" />
      <circle cx="280" cy="200" r="22" stroke="#64748B" strokeWidth="2.5" />
      <rect x="258" y="228" width="44" height="60" rx="12" fill="#64748B" opacity="0.7" />
      {/* Head features */}
      <circle cx="274" cy="198" r="2" fill="#475569" />
      <circle cx="286" cy="198" r="2" fill="#475569" />
      <path d="M276 206 Q280 210 284 206" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" fill="none" />

      {/* Speech / translation bubbles */}
      <rect x="150" y="218" width="100" height="36" rx="12" fill="#0D9488" opacity="0.12" stroke="#0D9488" strokeWidth="1.5" />
      <text x="200" y="240" textAnchor="middle" fontSize="11" fill="#0D9488" fontWeight="600" fontFamily="sans-serif">Translation</text>

      {/* Arrow left to right */}
      <path d="M144 236 L154 236" stroke="#0D9488" strokeWidth="2" strokeLinecap="round" markerEnd="url(#arrowR)" />
      <path d="M256 236 L246 236" stroke="#0D9488" strokeWidth="2" strokeLinecap="round" markerEnd="url(#arrowL)" />

      {/* Medical cross top-right */}
      <rect x="320" y="90" width="12" height="36" rx="3" fill="#0D9488" opacity="0.18" />
      <rect x="308" y="102" width="36" height="12" rx="3" fill="#0D9488" opacity="0.18" />

      {/* Pulse line */}
      <polyline points="60,160 80,160 90,140 100,180 110,150 120,165 130,160 150,160" stroke="#0D9488" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.3" />

      <defs>
        <marker id="arrowR" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="#0D9488" /></marker>
        <marker id="arrowL" markerWidth="6" markerHeight="6" refX="1" refY="3" orient="auto"><path d="M6,0 L0,3 L6,6" fill="#0D9488" /></marker>
      </defs>
    </svg>
  )
}

export function StethoscopeIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="30" fill="#0D9488" opacity="0.08" />
      <path d="M22 14 C22 14 16 20 16 30 C16 40 24 44 28 48" stroke="#0D9488" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M42 14 C42 14 48 20 48 30 C48 40 40 44 36 48" stroke="#0D9488" strokeWidth="3" strokeLinecap="round" fill="none" />
      <circle cx="32" cy="52" r="6" stroke="#0D9488" strokeWidth="3" fill="#0D9488" opacity="0.15" />
      <circle cx="22" cy="12" r="3.5" fill="#0D9488" />
      <circle cx="42" cy="12" r="3.5" fill="#0D9488" />
    </svg>
  )
}

export function MedicalShieldIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M32 4L8 16V32C8 48 32 60 32 60C32 60 56 48 56 32V16L32 4Z" fill="#0D9488" opacity="0.08" stroke="#0D9488" strokeWidth="2.5" strokeLinejoin="round" />
      <rect x="28" y="22" width="8" height="20" rx="2" fill="#0D9488" />
      <rect x="22" y="28" width="20" height="8" rx="2" fill="#0D9488" />
    </svg>
  )
}

export function HeartbeatIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="28" fill="#0D9488" opacity="0.06" />
      <polyline points="4,32 16,32 20,20 26,44 32,28 36,36 40,32 60,32" stroke="#0D9488" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  )
}

export function PrescriptionIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="12" y="6" width="40" height="52" rx="6" fill="#0D9488" opacity="0.08" stroke="#0D9488" strokeWidth="2.5" />
      <line x1="20" y1="20" x2="44" y2="20" stroke="#0D9488" strokeWidth="2" strokeLinecap="round" />
      <line x1="20" y1="28" x2="38" y2="28" stroke="#0D9488" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      <line x1="20" y1="36" x2="40" y2="36" stroke="#0D9488" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      <line x1="20" y1="44" x2="34" y2="44" stroke="#0D9488" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      {/* Rx symbol */}
      <text x="22" y="16" fontSize="10" fill="#0D9488" fontWeight="bold" fontFamily="serif">Rx</text>
    </svg>
  )
}

export function HospitalBuildingIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="14" y="18" width="36" height="40" rx="4" fill="#0D9488" opacity="0.08" stroke="#0D9488" strokeWidth="2.5" />
      {/* Cross on building */}
      <rect x="28" y="8" width="8" height="18" rx="2" fill="#0D9488" />
      <rect x="24" y="12" width="16" height="8" rx="2" fill="#0D9488" />
      {/* Windows */}
      <rect x="22" y="30" width="6" height="6" rx="1" fill="#0D9488" opacity="0.35" />
      <rect x="36" y="30" width="6" height="6" rx="1" fill="#0D9488" opacity="0.35" />
      <rect x="22" y="42" width="6" height="6" rx="1" fill="#0D9488" opacity="0.35" />
      <rect x="36" y="42" width="6" height="6" rx="1" fill="#0D9488" opacity="0.35" />
      {/* Door */}
      <rect x="28" y="48" width="8" height="10" rx="2" fill="#0D9488" opacity="0.5" />
    </svg>
  )
}

export function AmbulanceIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 80 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="10" width="50" height="26" rx="4" fill="#0D9488" opacity="0.1" stroke="#0D9488" strokeWidth="2" />
      <path d="M54 20 L70 20 L76 30 L76 36 L54 36 Z" fill="#0D9488" opacity="0.1" stroke="#0D9488" strokeWidth="2" strokeLinejoin="round" />
      {/* Cross */}
      <rect x="24" y="16" width="4" height="14" rx="1" fill="#0D9488" />
      <rect x="20" y="20" width="12" height="4" rx="1" fill="#0D9488" />
      {/* Wheels */}
      <circle cx="20" cy="38" r="5" fill="#0D9488" opacity="0.3" stroke="#0D9488" strokeWidth="2" />
      <circle cx="64" cy="38" r="5" fill="#0D9488" opacity="0.3" stroke="#0D9488" strokeWidth="2" />
    </svg>
  )
}
