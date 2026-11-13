import React, { useRef, useState, useEffect, useCallback } from 'react';

interface ScrollablePillBarProps {
  activeId: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Horizontal pill bar with dynamic left/right gradient fades,
 * minimalist chevron buttons, and smooth auto-centering of the active pill.
 */
export const ScrollablePillBar: React.FC<ScrollablePillBarProps> = ({
  activeId,
  children,
  className = 'py-2 px-1.5 gap-2',
}) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    window.addEventListener('resize', updateScrollState);
    const ro =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => updateScrollState())
        : null;
    ro?.observe(el);
    return () => {
      window.removeEventListener('resize', updateScrollState);
      ro?.disconnect();
    };
  }, [updateScrollState, activeId]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const activeEl = el.querySelector<HTMLElement>('[data-active="true"]');
    if (activeEl && typeof activeEl.scrollIntoView === 'function') {
      activeEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
    const timer = window.setTimeout(updateScrollState, 180);
    return () => window.clearTimeout(timer);
  }, [activeId, updateScrollState]);

  return (
    <div className="relative w-full">
      <div
        ref={scrollRef}
        onScroll={updateScrollState}
        className={`snap-x flex items-center overflow-x-auto no-scrollbar bg-[#F8F9FA] rounded-2xl border border-[#EAECEF] w-full ${className}`}
      >
        {children}
      </div>

      {canScrollLeft && (
        <>
          <div className="absolute left-0 top-0 bottom-0 w-10 bg-gradient-to-r from-[#F8F9FA] via-[#F8F9FA]/85 to-transparent pointer-events-none z-10 rounded-l-2xl" />
          <button
            type="button"
            onClick={() => scrollRef.current?.scrollBy({ left: -220, behavior: 'smooth' })}
            aria-label="Cuộn sang trái"
            className="absolute left-1.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white border border-[#EAECEF] text-[#111111] shadow-[0_2px_10px_rgba(0,0,0,0.04)] flex items-center justify-center hover:bg-[#F1F5F9] transition-all duration-200 ease-out active:scale-[0.98] cursor-pointer font-mono text-sm leading-none"
          >
            ‹
          </button>
        </>
      )}

      {canScrollRight && (
        <>
          <div className="absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-[#F8F9FA] via-[#F8F9FA]/85 to-transparent pointer-events-none z-10 rounded-r-2xl" />
          <button
            type="button"
            onClick={() => scrollRef.current?.scrollBy({ left: 220, behavior: 'smooth' })}
            aria-label="Cuộn sang phải"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white border border-[#EAECEF] text-[#111111] shadow-[0_2px_10px_rgba(0,0,0,0.04)] flex items-center justify-center hover:bg-[#F1F5F9] transition-all duration-200 ease-out active:scale-[0.98] cursor-pointer font-mono text-sm leading-none"
          >
            ›
          </button>
        </>
      )}
    </div>
  );
};
