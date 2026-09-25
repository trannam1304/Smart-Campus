import React from 'react';

interface MobileShellProps {
  children: React.ReactNode;
}

export default function MobileShell({ children }: MobileShellProps) {
  return (
    <div className="min-h-screen bg-slate-200 flex items-start justify-center py-6 px-4">
      <div
        className="
          mobile-frame w-full bg-background rounded-[2.5rem] overflow-hidden
          shadow-2xl shadow-slate-400/40 relative
          flex flex-col
        "
        style={{ boxShadow: '0 25px 60px rgba(15,23,42,0.25), 0 0 0 1px rgba(203,213,225,0.5)' }}
      >
        {/* Status bar simulation */}
        <div className="flex items-center justify-between px-6 pt-3 pb-1 bg-background">
          <span className="text-xs font-semibold text-foreground tabular-nums">9:41</span>
          <div className="flex items-center gap-1.5">
            <svg width="16" height="12" viewBox="0 0 16 12" fill="none" aria-hidden="true">
              <rect x="0" y="4" width="3" height="8" rx="0.5" fill="currentColor" opacity="0.4" />
              <rect x="4.5" y="2.5" width="3" height="9.5" rx="0.5" fill="currentColor" opacity="0.6" />
              <rect x="9" y="0.5" width="3" height="11.5" rx="0.5" fill="currentColor" />
            </svg>
            <svg width="16" height="12" viewBox="0 0 16 12" fill="none" aria-hidden="true">
              <path d="M8 2.5C10.5 2.5 12.7 3.6 14.2 5.3L15.5 4C13.6 1.9 11 0.5 8 0.5C5 0.5 2.4 1.9 0.5 4L1.8 5.3C3.3 3.6 5.5 2.5 8 2.5Z" fill="currentColor" opacity="0.4" />
              <path d="M8 5.5C9.7 5.5 11.2 6.2 12.3 7.3L13.6 6C12.1 4.6 10.1 3.5 8 3.5C5.9 3.5 3.9 4.6 2.4 6L3.7 7.3C4.8 6.2 6.3 5.5 8 5.5Z" fill="currentColor" opacity="0.7" />
              <circle cx="8" cy="10" r="1.5" fill="currentColor" />
            </svg>
            <svg width="25" height="12" viewBox="0 0 25 12" fill="none" aria-hidden="true">
              <rect x="0.5" y="0.5" width="21" height="11" rx="3.5" stroke="currentColor" strokeOpacity="0.35" />
              <rect x="2" y="2" width="17" height="8" rx="2" fill="currentColor" />
              <path d="M23 4v4a2 2 0 000-4z" fill="currentColor" fillOpacity="0.4" />
            </svg>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}