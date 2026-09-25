'use client';

import React from 'react';
import Link from 'next/link';
import { QrCode, AlertTriangle } from 'lucide-react';

interface Tab {
  label: string;
  href: string;
  icon: React.ReactNode;
  activeIcon: React.ReactNode;
}

interface BottomTabBarProps {
  activeHref: string;
}

const tabs: Tab[] = [
  {
    label: 'Điểm danh',
    href: '/',
    icon: <QrCode size={22} strokeWidth={1.8} />,
    activeIcon: <QrCode size={22} strokeWidth={2.5} />,
  },
  {
    label: 'Báo cáo',
    href: '/hardware-incident-report-form',
    icon: <AlertTriangle size={22} strokeWidth={1.8} />,
    activeIcon: <AlertTriangle size={22} strokeWidth={2.5} />,
  },
];

export default function BottomTabBar({ activeHref }: BottomTabBarProps) {
  return (
    <nav
      className="flex items-stretch border-t border-border bg-card"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      aria-label="Điều hướng chính"
    >
      {tabs.map((tab) => {
        const isActive = tab.href === activeHref;
        return (
          <Link
            key={`tab-${tab.href}`}
            href={tab.href}
            className={`
              flex-1 flex flex-col items-center justify-center py-3 gap-1
              transition-colors duration-150
              ${isActive
                ? 'text-primary' :'text-muted-foreground hover:text-secondary-foreground'
              }
            `}
            aria-current={isActive ? 'page' : undefined}
          >
            <span className="transition-transform duration-150" style={{ transform: isActive ? 'scale(1.1)' : 'scale(1)' }}>
              {isActive ? tab.activeIcon : tab.icon}
            </span>
            <span
              className={`text-[11px] font-medium tracking-wide ${isActive ? 'tab-active pb-0.5' : ''}`}
            >
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}