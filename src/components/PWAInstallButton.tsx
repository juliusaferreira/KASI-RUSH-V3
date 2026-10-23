import React from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, install } = usePWAInstall();

  // If already installed in standalone mode, hide
  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold px-4 py-2 rounded-full shadow-lg border-2 border-emerald-300 transition-transform active:scale-95 text-xs sm:text-sm tracking-wide"
      >
        <Smartphone className="w-4 h-4" />
        <span>Install on Android</span>
      </button>
    );
  }

  // Fallback hint button
  return (
    <button
      onClick={() => {
        alert("To install on Android:\n1. Open Chrome menu (⋮)\n2. Tap 'Add to Home screen' or 'Install app'");
      }}
      className="flex items-center gap-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs px-3 py-1.5 rounded-full border border-slate-600 backdrop-blur-none transition"
      title="Install to Android Home Screen"
    >
      <Download className="w-3.5 h-3.5 text-emerald-400" />
      <span>Android APK / PWA</span>
    </button>
  );
};
