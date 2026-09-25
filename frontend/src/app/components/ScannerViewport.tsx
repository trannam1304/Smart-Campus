'use client';

import React, { useState, useEffect } from 'react';
import { Zap, ZapOff } from 'lucide-react';

interface ScannerViewportProps {
  flashlightOn: boolean;
  onFlashlightToggle: () => void;
}

export default function ScannerViewport({ flashlightOn, onFlashlightToggle }: ScannerViewportProps) {
  const [scanLinePos, setScanLinePos] = useState(10);

  useEffect(() => {
    // Animate scan line via JS for smooth control
    let direction = 1;
    let pos = 10;
    const interval = setInterval(() => {
      pos += direction * 1.2;
      if (pos >= 85) direction = -1;
      if (pos <= 10) direction = 1;
      setScanLinePos(pos);
    }, 16);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full" style={{ aspectRatio: '1 / 1' }}>
      {/* Dark camera background */}
      <div
        className="w-full h-full rounded-2xl overflow-hidden relative"
        style={{ backgroundColor: 'var(--camera-bg)' }}
        role="img"
        aria-label="Vùng quét mã QR"
      >
        {/* Simulated camera noise / grain */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Flashlight overlay glow */}
        {flashlightOn && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(250,204,21,0.12) 0%, transparent 70%)',
            }}
          />
        )}

        {/* Dark vignette overlay outside the scan zone */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `
              linear-gradient(to bottom, rgba(15,23,42,0.7) 0%, transparent 20%),
              linear-gradient(to top, rgba(15,23,42,0.7) 0%, transparent 20%),
              linear-gradient(to right, rgba(15,23,42,0.7) 0%, transparent 20%),
              linear-gradient(to left, rgba(15,23,42,0.7) 0%, transparent 20%)
            `,
          }}
        />

        {/* Scanner bracket corners */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative" style={{ width: '65%', height: '65%' }}>
            {/* Top-left */}
            <div
              className="scanner-bracket-tl absolute top-0 left-0"
              style={{ width: 28, height: 28 }}
            />
            {/* Top-right */}
            <div
              className="scanner-bracket-tr absolute top-0 right-0"
              style={{ width: 28, height: 28 }}
            />
            {/* Bottom-left */}
            <div
              className="scanner-bracket-bl absolute bottom-0 left-0"
              style={{ width: 28, height: 28 }}
            />
            {/* Bottom-right */}
            <div
              className="scanner-bracket-br absolute bottom-0 right-0"
              style={{ width: 28, height: 28 }}
            />

            {/* Animated scan line */}
            <div
              className="absolute left-0 right-0 pointer-events-none"
              style={{
                top: `${scanLinePos}%`,
                height: 2,
                background: 'linear-gradient(to right, transparent, rgba(52,211,153,0.9), transparent)',
                boxShadow: '0 0 8px rgba(52,211,153,0.6)',
              }}
            />
          </div>
        </div>

        {/* Center hint text */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="mt-[45%] text-center">
            <p className="text-[11px] text-slate-400 font-medium tracking-wide">
              Đặt mã QR vào khung
            </p>
          </div>
        </div>

        {/* Flashlight toggle button */}
        <button
          onClick={onFlashlightToggle}
          className={`
            absolute bottom-4 right-4 w-11 h-11 rounded-full
            flex items-center justify-center
            transition-all duration-200 active:scale-90
            ${flashlightOn
              ? 'bg-yellow-400 text-slate-900 flashlight-glow' :'bg-slate-700/80 text-slate-300 hover:bg-slate-600/80'
            }
          `}
          aria-label={flashlightOn ? 'Tắt đèn flash' : 'Bật đèn flash'}
          aria-pressed={flashlightOn}
        >
          {flashlightOn ? <Zap size={18} strokeWidth={2.5} /> : <ZapOff size={18} strokeWidth={2} />}
        </button>
      </div>
    </div>
  );
}