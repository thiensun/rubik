import React, { useState, useEffect } from 'react';
import { Download, X, Share, PlusSquare, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const PWAInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // 1. Check if already installed / running in standalone mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    if (isStandalone) {
      return;
    }

    // 2. Check if user dismissed prompt recently (within 7 days)
    const dismissedAt = localStorage.getItem('cubemaster_pwa_dismissed');
    if (dismissedAt) {
      const daysSinceDismissed = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        return;
      }
    }

    // 3. Detect iOS Safari
    const ua = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(ua);
    const isSafari = ua.includes('safari') && !ua.includes('chrome') && !ua.includes('crios') && !ua.includes('fxios');

    if (isIOSDevice && isSafari) {
      setIsIOS(true);
      // Delay showing subtle tip on iOS to not overwhelm on initial render
      const timer = setTimeout(() => setIsVisible(true), 3500);
      return () => clearTimeout(timer);
    }

    // 4. Android / Chrome / Desktop beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;

    if (choiceResult.outcome === 'accepted') {
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('cubemaster_pwa_dismissed', Date.now().toString());
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div
      role="banner"
      aria-label="Cài đặt CubeMaster AI"
      className="fixed top-3 left-3 right-3 sm:left-auto sm:right-6 sm:w-[410px] z-50 animate-in fade-in slide-in-from-top-3 duration-300"
    >
      <div className="bg-white/95 backdrop-blur-md border border-[#EAECEF] rounded-2xl p-3 sm:p-3.5 shadow-[0_8px_30px_rgba(0,0,0,0.08)] flex items-start gap-3">
        {/* App Logo */}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" aria-label="CubeMaster AI" className="w-10 h-10 shrink-0 shadow-xs mt-0.5">
          {/* Nền đen bo góc */}
          <rect width="100" height="100" rx="24" fill="#111111" />
          
          {/* Lưới 9 chấm màu 3x3 */}
          {/* Hàng 1 */}
          <rect x="16" y="16" width="20" height="20" rx="5" fill="#F59E0B" /> {/* Cam */}
          <rect x="40" y="16" width="20" height="20" rx="5" fill="#10B981" /> {/* Xanh lá */}
          <rect x="64" y="16" width="20" height="20" rx="5" fill="#FFFFFF" /> {/* Trắng */}
          
          {/* Hàng 2 */}
          <rect x="16" y="40" width="20" height="20" rx="5" fill="#EF4444" /> {/* Đỏ */}
          <rect x="40" y="40" width="20" height="20" rx="5" fill="#3B82F6" /> {/* Xanh dương */}
          <rect x="64" y="40" width="20" height="20" rx="5" fill="#FBBF24" /> {/* Vàng */}
          
          {/* Hàng 3 */}
          <rect x="16" y="64" width="20" height="20" rx="5" fill="#F59E0B" /> {/* Cam */}
          <rect x="40" y="64" width="20" height="20" rx="5" fill="#FFFFFF" /> {/* Trắng */}
          <rect x="64" y="64" width="20" height="20" rx="5" fill="#10B981" /> {/* Xanh lá */}
        </svg>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-xs sm:text-sm text-[#111111] tracking-tight">CubeMaster AI App</span>
            <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              PWA
            </span>
          </div>

          {isIOS ? (
            <p className="text-[11px] sm:text-xs text-neutral-600 mt-1 leading-snug">
              Bấm nút <Share className="inline w-3.5 h-3.5 text-neutral-800 -mt-0.5" /> <span className="font-semibold text-neutral-900">Chia sẻ</span> &rarr; chọn{' '}
              <PlusSquare className="inline w-3.5 h-3.5 text-neutral-800 -mt-0.5" /> <span className="font-semibold text-neutral-900">Thêm vào MH chính</span> để dùng toàn màn hình mượt mà.
            </p>
          ) : (
            <p className="text-[11px] sm:text-xs text-neutral-600 mt-0.5 leading-snug">
              Cài đặt ứng dụng để luyện Rubik offline, mở tức thì và dùng toàn màn hình không có thanh URL.
            </p>
          )}

          {!isIOS && deferredPrompt && (
            <div className="mt-2.5 flex items-center gap-2">
              <button
                type="button"
                onClick={handleInstallClick}
                className="bg-[#111111] hover:bg-neutral-800 active:scale-95 text-white text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Cài Đặt Ngay</span>
              </button>
              <button
                type="button"
                onClick={handleDismiss}
                className="text-neutral-500 hover:text-neutral-800 text-xs px-2.5 py-1.5 font-medium rounded-xl transition-colors cursor-pointer"
              >
                Để sau
              </button>
            </div>
          )}
        </div>

        {/* Dismiss Close Icon */}
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Đóng thông báo"
          className="text-neutral-400 hover:text-neutral-700 p-1 rounded-lg hover:bg-neutral-100 transition-colors shrink-0 cursor-pointer"
        >
          <X className="w-4 h-4 stroke-[2.2]" />
        </button>
      </div>
    </div>
  );
};
