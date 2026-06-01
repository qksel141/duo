// 티어 색상/배지 공통 유틸 (Home 카드, MyPage, EditProfile 등에서 공유)

export const TIER_LIST = [
  'Iron',
  'Bronze',
  'Silver',
  'Gold',
  'Platinum',
  'Emerald',
  'Diamond',
  'Master',
  'Grandmaster',
  'Challenger',
];

// 한글 별명 (사용자 요청: 아/브/실/골/플/에/다/마/그마/챌)
export const TIER_LABEL_KR = {
  iron: '아이언',
  bronze: '브론즈',
  silver: '실버',
  gold: '골드',
  platinum: '플래티넘',
  emerald: '에메랄드',
  diamond: '다이아',
  master: '마스터',
  grandmaster: '그마',
  challenger: '챌',
};

const COLOR_TABLE = {
  iron: {
    text: 'text-stone-400',
    bg: 'bg-stone-700/30',
    border: 'border-stone-500/40',
    glow: '',
  },
  bronze: {
    text: 'text-amber-600',
    bg: 'bg-amber-900/30',
    border: 'border-amber-700/40',
    glow: '',
  },
  silver: {
    text: 'text-slate-300',
    bg: 'bg-slate-500/20',
    border: 'border-slate-400/40',
    glow: '',
  },
  gold: {
    text: 'text-yellow-400',
    bg: 'bg-yellow-600/20',
    border: 'border-yellow-500/40',
    glow: 'shadow-[0_0_18px_rgba(234,179,8,0.35)]',
  },
  platinum: {
    text: 'text-cyan-300',
    bg: 'bg-cyan-500/15',
    border: 'border-cyan-400/40',
    glow: 'shadow-[0_0_18px_rgba(34,211,238,0.35)]',
  },
  emerald: {
    text: 'text-emerald-300',
    bg: 'bg-emerald-500/15',
    border: 'border-emerald-400/40',
    glow: 'shadow-[0_0_18px_rgba(16,185,129,0.35)]',
  },
  diamond: {
    text: 'text-sky-300',
    bg: 'bg-sky-500/15',
    border: 'border-sky-400/40',
    glow: 'shadow-[0_0_22px_rgba(56,189,248,0.4)]',
  },
  master: {
    text: 'text-fuchsia-300',
    bg: 'bg-fuchsia-500/15',
    border: 'border-fuchsia-400/40',
    glow: 'shadow-[0_0_22px_rgba(217,70,239,0.4)]',
  },
  grandmaster: {
    text: 'text-red-300',
    bg: 'bg-red-500/15',
    border: 'border-red-400/40',
    glow: 'shadow-[0_0_22px_rgba(239,68,68,0.4)]',
  },
  challenger: {
    text: 'text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-yellow-300 to-amber-400',
    bg: 'bg-gradient-to-r from-cyan-500/15 via-yellow-500/15 to-amber-500/15',
    border: 'border-yellow-400/40',
    glow: 'shadow-[0_0_28px_rgba(250,204,21,0.45)]',
  },
};

function normalize(tier) {
  if (!tier) return null;
  return String(tier).trim().toLowerCase();
}

export function getTierColor(tier) {
  const key = normalize(tier);
  return COLOR_TABLE[key]?.text || 'text-stone-500';
}

export function getTierBadgeClass(tier) {
  const key = normalize(tier);
  const entry = COLOR_TABLE[key];
  if (!entry) {
    return 'text-stone-400 bg-stone-800/40 border border-stone-700/40';
  }
  return `${entry.text} ${entry.bg} border ${entry.border} ${entry.glow}`;
}

export function getTierShortLabel(tier) {
  const key = normalize(tier);
  return TIER_LABEL_KR[key] || tier || '미설정';
}
