import React from 'react';
import { Monitor } from 'lucide-react';
import { useMobileMode } from '../context/MobileMode';

export default function MobileFrame({ children }) {
  const { isMobileMode, setViewMode } = useMobileMode();

  if (!isMobileMode) return children;

  return (
    <div className="fixed inset-0 z-[55] flex items-center justify-center overflow-y-auto bg-gradient-to-br from-[#0a0612] via-[#0d0718] to-[#140a24] py-6">
      <button
        onClick={() => setViewMode('pc')}
        className="fixed top-5 left-5 z-[80] flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-stone-300 backdrop-blur hover:bg-white/10 hover:text-white transition-all"
      >
        <Monitor size={16} />
        PC로 보기
      </button>

      <div
        className="relative shrink-0 overflow-hidden rounded-[44px] border-[10px] border-stone-950 bg-[#05030d] shadow-[0_30px_120px_rgba(124,58,237,0.35)]"
        style={{
          width: 'min(440px, calc(100vw - 24px))',
          height: 'min(900px, calc(100vh - 48px))',
          transform: 'translateZ(0)',
        }}
      >
        {/* 상단 노치 */}
        <div className="pointer-events-none absolute top-0 left-1/2 z-[90] h-6 w-36 -translate-x-1/2 rounded-b-2xl bg-stone-950" />

        <div className="h-full w-full overflow-y-auto overflow-x-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
