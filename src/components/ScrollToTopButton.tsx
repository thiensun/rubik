import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

interface ScrollToTopButtonProps {
  className?: string;
}

export const ScrollToTopButton: React.FC<ScrollToTopButtonProps> = ({ className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Check initial position
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Back to top"
      title="Cuộn lên đầu trang"
      className={`fixed right-4 sm:right-6 z-50 w-11 h-11 rounded-full bg-[#111111] hover:bg-neutral-800 text-white flex items-center justify-center shadow-lg border border-[#EAECEF] transition-all duration-300 cursor-pointer active:scale-90 ${className || 'bottom-6'} ${
        isVisible
          ? 'opacity-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 translate-y-3 pointer-events-none'
      }`}
    >
      <ArrowUp className="w-5 h-5 stroke-[2.2]" />
    </button>
  );
};

