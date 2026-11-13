import React from 'react';
import { parseTimeInput } from '../../utils/cubingStats';

interface ManualTimeInputProps {
  inputRef: React.RefObject<HTMLInputElement | null>;
  value: string;
  placeholder: string;
  fontSizeClass: string;
  onChange: (val: string) => void;
  onSubmitMs: (parsedMs: number) => void;
  onCancel: () => void;
}

export const ManualTimeInput: React.FC<ManualTimeInputProps> = ({
  inputRef,
  value,
  placeholder,
  fontSizeClass,
  onChange,
  onSubmitMs,
  onCancel,
}) => {
  return (
    <div
      className="flex items-baseline justify-center max-w-full px-1 w-full"
      onClick={(e) => e.stopPropagation()}
    >
      <input
        ref={inputRef}
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            const parsed = parseTimeInput(value);
            if (parsed !== null && parsed > 0) {
              onSubmitMs(parsed);
            } else {
              alert('Vui lòng nhập định dạng thời gian hợp lệ (ví dụ: 9.31, 1:04.25 hoặc 931)');
            }
          } else if (e.key === 'Escape') {
            onCancel();
          }
        }}
        className={`font-mono leading-none font-bold tabular-nums text-[#111111] bg-transparent border-none text-center focus:outline-none focus:ring-0 p-0 m-0 w-full max-w-full caret-[#111111] ${fontSizeClass}`}
      />
    </div>
  );
};
