import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 left-4 md:left-auto md:w-96 z-50 bg-gradient-to-r from-red-950 to-slate-900 border border-red-500/40 rounded-2xl p-4 shadow-2xl backdrop-blur-xl animate-bounce-short">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-red-600/20 border border-red-500/40 rounded-xl text-red-400">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Install FUHSI ERS App</h4>
            <p className="text-xs text-slate-300">Fast 1-tap SOS from your homescreen</p>
          </div>
        </div>
        <button
          onClick={() => setShowPrompt(false)}
          className="text-slate-400 hover:text-white p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="mt-3 flex items-center space-x-2">
        <button
          onClick={handleInstall}
          className="w-full py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 transition-colors shadow-lg shadow-red-600/30"
        >
          <Download className="w-4 h-4" />
          <span>Install Web App</span>
        </button>
      </div>
    </div>
  );
}
