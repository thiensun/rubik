import type { TimerState } from './ZenTimerStage';

export function formatTimerDigits(
  ms: number,
  timerState: TimerState,
  inspectionSeconds: number,
): string {
  if (timerState === 'inspection') {
    if (inspectionSeconds < -2) return 'DNF';
    if (inspectionSeconds <= 0) return '+2';
    return inspectionSeconds.toString().padStart(2, '0');
  }
  if (timerState === 'ready') return '00.00';

  const totalSeconds = Math.floor(ms / 1000);
  const hundredths = Math.floor((ms % 1000) / 10);
  const pad = (n: number) => n.toString().padStart(2, '0');
  if (totalSeconds >= 60) {
    return `${pad(Math.floor(totalSeconds / 60))}:${pad(totalSeconds % 60)}.${pad(hundredths)}`;
  }
  return `${pad(totalSeconds)}.${pad(hundredths)}`;
}

export function getTimerColorClass(timerState: TimerState, inspectionSeconds: number): string {
  if (timerState === 'inspection') {
    if (inspectionSeconds < -2) return 'text-rose-600';
    if (inspectionSeconds <= 0) return 'text-orange-600';
    if (inspectionSeconds <= 3) return 'text-red-600';
    return 'text-indigo-600';
  }
  if (timerState === 'holding') return 'text-[#D97706]';
  if (timerState === 'ready') return 'text-[#059669]';
  return 'text-[#111111]';
}

export function getTimerMicroHint(
  timerState: TimerState,
  inspectionSeconds: number,
  isSplitMode: boolean,
): { text: string; className: string } | null {
  if (timerState === 'running') return null;

  if (timerState === 'inspection') {
    return {
      text: `Quan sát: ${inspectionSeconds}s · Giữ để sẵn sàng`,
      className: inspectionSeconds <= 3 ? 'text-red-500 animate-pulse font-bold' : 'text-indigo-600',
    };
  }
  if (timerState === 'holding') {
    return { text: 'Đang chuẩn bị...', className: 'text-[#D97706] font-bold' };
  }
  if (timerState === 'ready') {
    return { text: 'Thả để đếm giờ!', className: 'text-[#059669] font-bold animate-pulse' };
  }
  return {
    text: isSplitMode
      ? 'Giữ để bắt đầu · Chạm 4 lần (Cross/F2L/OLL/PLL)'
      : 'Giữ để bắt đầu',
    className: 'text-neutral-400',
  };
}
