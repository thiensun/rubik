import React, { useState, useRef, useEffect } from 'react';

// Nấc 1: Mở vừa (62vh), Nấc 2: Mở hết cỡ (92vh)
type SnapState = 'half' | 'full';

interface MobileBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export const MobileBottomSheet: React.FC<MobileBottomSheetProps> = ({ isOpen, onClose, children }) => {
  const [snap, setSnap] = useState<SnapState>('half');
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef(0);
  const currentYRef = useRef(0);

  useEffect(() => {
    if (isOpen) {
      setSnap('half');
      setDragOffset(0);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTouchStart = (e: React.TouchEvent) => {
    startYRef.current = e.touches[0].clientY;
    currentYRef.current = e.touches[0].clientY;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    currentYRef.current = e.touches[0].clientY;
    const diff = currentYRef.current - startYRef.current;

    // Nếu đang ở 'half' mà kéo lên -> diff âm -> cho phép kéo lên tới full
    // Nếu kéo xuống -> diff dương -> đi xuống
    setDragOffset(diff);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    const diff = currentYRef.current - startYRef.current;

    if (snap === 'half') {
      if (diff < -60) {
        // Vuốt lên mạnh -> Chuyển sang Full
        setSnap('full');
      } else if (diff > 90) {
        // Vuốt xuống mạnh -> Đóng thẻ
        onClose();
      }
    } else if (snap === 'full') {
      if (diff > 80) {
        // Từ Full vuốt xuống -> Thu về Half
        setSnap('half');
      }
    }
    setDragOffset(0);
  };

  // Tính chiều cao css tương ứng
  const heightStyle = snap === 'full' ? '92vh' : '62vh';
  // Khi đang drag bằng tay thì dịch chuyển theo ngón tay, khi thả tay thì dùng transition mượt
  const transformStyle = isDragging ? `translateY(${Math.max(-120, dragOffset)}px)` : 'translateY(0)';

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end lg:hidden">
      {/* Vùng mờ ngoài màn hình: bấm vào là đóng ngay */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
      />

      {/* Thẻ Bottom Sheet */}
      <div
        style={{
          height: heightStyle,
          transform: transformStyle,
          transition: isDragging
            ? 'none'
            : 'height 0.3s cubic-bezier(0.2, 0.8, 0.2, 1), transform 0.3s ease-out',
        }}
        className="relative z-10 w-full bg-white rounded-t-[28px] shadow-[0_-10px_40px_rgba(0,0,0,0.15)] border-t border-[#EAECEF] flex flex-col overflow-hidden"
      >
        {/* KHU VỰC THANH KÉO (DRAG HEADER) - Bắt sự kiện touch riêng biệt */}
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="w-full pt-3 pb-2 px-4 cursor-grab active:cursor-grabbing select-none shrink-0 touch-none flex flex-col items-center"
        >
          {/* Thanh ngang xám bo tròn to rõ hơn để dễ vuốt chạm */}
          <div className="w-12 h-1.5 bg-neutral-300 hover:bg-neutral-400 rounded-full transition-colors mb-2" />
        </div>

        {/* NỘI DUNG BÊN TRONG CÓ THỂ CUỘN TỰ DO */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-10">
          {children}
        </div>
      </div>
    </div>
  );
};
