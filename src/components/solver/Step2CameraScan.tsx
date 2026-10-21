import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Camera,
  Sun,
  Check,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Grid,
  Edit3,
  Lightbulb,
  FlipHorizontal,
  AlertCircle,
  RefreshCw,
  AlertTriangle,
  Upload,
  Settings2,
  Copy,
} from 'lucide-react';
import { CubeColor, CubeNetState, CUBE_HEX_COLORS, applyScramble, SOLVED_CUBE } from '../../utils/cubeState';
import { validateCubeState, CubeValidationResult } from '../../utils/cubeValidator';
import { CFOP_DEMO_SCRAMBLE, DEMO_SCRAMBLES } from '../../utils/solutionStages';
import { SolverLevelId } from '../../types/cubing';
import {
  classifyRubikColor,
  sample9TilesFromCanvas,
  ColorDetectionResult,
  COLOR_CONFIG,
} from '../../utils/colorDetector';
import { sound } from '../../utils/audio';

interface Step2CameraScanProps {
  selectedLevel?: SolverLevelId;
  onBackToStep1: () => void;
  onProceedToStep3: () => void;
  onUpdateScannedCube?: (cubeState: CubeNetState) => void;
  demoScramble?: string | null;
  onSetDemoScramble?: (scramble: string | null) => void;
}

type FaceKey = 'U' | 'F' | 'R' | 'B' | 'L' | 'D';

interface FaceMeta {
  key: FaceKey;
  name: string;
  vietnameseName: string;
  centerColor: CubeColor;
  centerHex: string;
  centerLabel: string;
  nextPrompt: string;
}

const FACES_ORDER: FaceMeta[] = [
  { key: 'D', name: 'Down', vietnameseName: 'Mặt Đáy (Cross Trắng)', centerColor: 'white', centerHex: '#FFFFFF', centerLabel: 'WHITE (CROSS)', nextPrompt: 'Xoay khối Rubik lên Mặt Trước (Xanh lá)' },
  { key: 'F', name: 'Front', vietnameseName: 'Mặt Trước', centerColor: 'green', centerHex: '#009B48', centerLabel: 'GREEN CTR', nextPrompt: 'Xoay khối 90° sang Mặt Phải (Đỏ)' },
  { key: 'R', name: 'Right', vietnameseName: 'Mặt Phải', centerColor: 'red', centerHex: '#B71234', centerLabel: 'RED CTR', nextPrompt: 'Xoay khối 90° sang Mặt Sau (Xanh dương)' },
  { key: 'B', name: 'Back', vietnameseName: 'Mặt Sau', centerColor: 'blue', centerHex: '#0046AD', centerLabel: 'BLUE CTR', nextPrompt: 'Xoay khối 90° sang Mặt Trái (Cam)' },
  { key: 'L', name: 'Left', vietnameseName: 'Mặt Trái', centerColor: 'orange', centerHex: '#FF5800', centerLabel: 'ORANGE CTR', nextPrompt: 'Xoay khối lên Mặt Đỉnh (Vàng)' },
  { key: 'U', name: 'Up', vietnameseName: 'Mặt Đỉnh (Last Layer Vàng)', centerColor: 'yellow', centerHex: '#FFD000', centerLabel: 'YELLOW (LAST LAYER)', nextPrompt: 'Quét hoàn tất! Đã thu thập đủ 6 mặt.' },
];


const SWATCH_CONFIG: { color: CubeColor; hex: string; label: string }[] = [
  { color: 'white', hex: '#FFFFFF', label: 'W' },
  { color: 'yellow', hex: '#FFD000', label: 'Y' },
  { color: 'green', hex: '#009B48', label: 'G' },
  { color: 'blue', hex: '#0046AD', label: 'B' },
  { color: 'red', hex: '#B71234', label: 'R' },
  { color: 'orange', hex: '#FF5800', label: 'O' },
];

export const Step2CameraScan: React.FC<Step2CameraScanProps> = ({
  selectedLevel = 'level-2',
  onBackToStep1,
  onProceedToStep3,
  onUpdateScannedCube,
  demoScramble,
  onSetDemoScramble,
}) => {
  const DEMO_SCRAMBLE = DEMO_SCRAMBLES[selectedLevel] || CFOP_DEMO_SCRAMBLE;
  const [copiedDemo, setCopiedDemo] = useState(false);
  // Current active face index: default to 0 (Up - White Center)
  const [activeFaceIdx, setActiveFaceIdx] = useState<number>(0);
  const [scanMode, setScanMode] = useState<'auto' | 'manual'>('auto');
  const [selectedBrush, setSelectedBrush] = useState<CubeColor>('yellow');
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('user');

  // Available camera hardware devices
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');

  // Camera Stream Status
  const [cameraStatus, setCameraStatus] = useState<'requesting' | 'active' | 'denied' | 'virtual'>('requesting');
  const [streamResolution, setStreamResolution] = useState<string>('1280x720 @ 60 FPS');
  const [isShutterFlashing, setIsShutterFlashing] = useState<boolean>(false);
  const [autoHoldProgress, setAutoHoldProgress] = useState<number>(0);
  const [centerAligned, setCenterAligned] = useState<boolean>(false);

  // Diagnosis: Solid Green Glitch (YUV uninitialized driver lock)
  const [isCameraBlockedOrGreen, setIsCameraBlockedOrGreen] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Status for 6 faces
  const [verifiedFaces, setVerifiedFaces] = useState<Record<FaceKey, boolean>>({
    U: false,
    F: false,
    R: false,
    B: false,
    L: false,
    D: false,
  });

  // State of all 54 stickers across 6 faces
  const [cubeNetData, setCubeNetData] = useState<Record<FaceKey, CubeColor[]>>(() => {
    return {
      U: ['yellow', 'yellow', 'yellow', 'yellow', 'yellow', 'yellow', 'yellow', 'yellow', 'yellow'],
      F: ['green', 'green', 'green', 'green', 'green', 'green', 'green', 'green', 'green'],
      R: ['red', 'red', 'red', 'red', 'red', 'red', 'red', 'red', 'red'],
      B: ['blue', 'blue', 'blue', 'blue', 'blue', 'blue', 'blue', 'blue', 'blue'],
      L: ['orange', 'orange', 'orange', 'orange', 'orange', 'orange', 'orange', 'orange', 'orange'],
      D: ['white', 'white', 'white', 'white', 'white', 'white', 'white', 'white', 'white'],
    };
  });


  // Live real-time detected stickers from camera feed for current face (9 cells)
  const [liveDetected, setLiveDetected] = useState<ColorDetectionResult[]>(() => {
    return Array(9).fill(null).map(() => classifyRubikColor(240, 240, 240));
  });

  const activeFaceMeta = FACES_ORDER[activeFaceIdx];

  // Current active stream in state so video element reliably mounts it
  const [activeStream, setActiveStream] = useState<MediaStream | null>(null);

  // Discover and list all camera devices on the system
  const refreshDevicesList = useCallback(async () => {
    if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((d) => d.kind === 'videoinput');
        setVideoDevices(videoInputs);
        return videoInputs;
      } catch {
        return [];
      }
    }
    return [];
  }, []);

  // Start real webcam stream with robust constraints & device selection
  const startCamera = useCallback(async (deviceIdOverride?: string) => {
    setCameraStatus('requesting');
    setIsCameraBlockedOrGreen(false);

    // Stop existing stream tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const targetDeviceId = deviceIdOverride || selectedDeviceId;

        // Use ideal constraints for desktop laptop compatibility
        const videoConstraints: MediaTrackConstraints = targetDeviceId
          ? { deviceId: { exact: targetDeviceId } }
          : {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: { ideal: cameraFacing },
            };

        const stream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
          audio: false,
        });

        streamRef.current = stream;
        setActiveStream(stream);

        // Populate device labels now that permission is granted
        await refreshDevicesList();

        setCameraStatus('active');
      } catch (err) {
        console.warn('Camera access denied or device not found, falling back to simulated HUD:', err);
        setCameraStatus('denied');
      }
    } else {
      setCameraStatus('denied');
    }
  }, [selectedDeviceId, cameraFacing, refreshDevicesList]);

  // Attach stream to video whenever activeStream updates
  useEffect(() => {
    if (videoRef.current && activeStream) {
      const video = videoRef.current;
      video.muted = true;
      video.setAttribute('playsinline', 'true');
      video.setAttribute('muted', 'true');
      video.setAttribute('autoplay', 'true');
      video.srcObject = activeStream;

      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setCameraStatus('active');
            setStreamResolution(`${video.videoWidth || 1280}x${video.videoHeight || 720} @ 60 FPS`);
          })
          .catch((err) => {
            console.warn('Auto play failed, waiting for user gesture:', err);
          });
      }
    }
  }, [activeStream]);

  // Initial camera startup
  useEffect(() => {
    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [startCamera]);

  // Auto-resume camera when user returns from Chrome permission popup / settings window
  useEffect(() => {
    const handleWindowFocus = () => {
      if (videoRef.current) {
        if (videoRef.current.paused || !streamRef.current?.active) {
          startCamera();
        } else {
          videoRef.current.play().catch(() => {});
        }
      }
    };

    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) handleWindowFocus();
    });

    return () => {
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [startCamera]);

  // Switch to next available video device
  const handleSwitchToNextDevice = useCallback(() => {
    if (videoDevices.length > 1) {
      const currentIndex = videoDevices.findIndex((d) => d.deviceId === selectedDeviceId);
      const nextIndex = (currentIndex + 1) % videoDevices.length;
      const nextDevice = videoDevices[nextIndex];
      setSelectedDeviceId(nextDevice.deviceId);
      startCamera(nextDevice.deviceId);
      sound.playTick();
    } else {
      // Toggle facingMode between user and environment
      const nextFacing = cameraFacing === 'user' ? 'environment' : 'user';
      setCameraFacing(nextFacing);
      startCamera();
      sound.playTick();
    }
  }, [videoDevices, selectedDeviceId, cameraFacing, startCamera]);

  // Real-time Video Frame Processing Loop (Webcam Pixel Sampling & Green Screen Check)
  useEffect(() => {
    let lastTime = 0;
    const intervalMs = 60; // ~16 FPS sampling rate

    const processFrame = (currentTime: number) => {
      if (currentTime - lastTime >= intervalMs) {
        lastTime = currentTime;

        if (cameraStatus === 'active' && videoRef.current && videoRef.current.readyState >= 2) {
          const video = videoRef.current;
          let canvas = canvasRef.current;
          if (!canvas) {
            canvas = document.createElement('canvas');
            canvasRef.current = canvas;
          }

          if (canvas.width !== video.videoWidth && video.videoWidth > 0) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
          }

          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (ctx && canvas.width > 0 && canvas.height > 0) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const isMirrored = cameraFacing === 'user';
            const sampled = sample9TilesFromCanvas(ctx, canvas.width, canvas.height, 14, isMirrored);

            if (sampled.length === 9) {
              setLiveDetected(sampled);

              // Check if stream is returning uninitialized YUV (all pure green ~ #008700 with R<25, G>50, B<25)
              const allGreenGlitch = sampled.every(
                (s) => s.rgb[0] < 30 && s.rgb[1] > 50 && s.rgb[2] < 30
              );
              setIsCameraBlockedOrGreen(allGreenGlitch);

              // Check if center tile matches current target face center
              const centerDetected = sampled[4].color;
              const matchesCenter = centerDetected === activeFaceMeta.centerColor;
              setCenterAligned(matchesCenter);
            }
          }
        } else if (cameraStatus === 'virtual') {
          // Virtual mode: realistic color oscillation matching active face
          const time = Date.now() / 1000;
          const target = activeFaceMeta.centerColor;
          const dummyResults: ColorDetectionResult[] = Array(9).fill(null).map((_, i) => {
            const jitter = Math.sin(time + i) * 3;
            if (i === 4) {
              return {
                color: target,
                confidence: Math.round(97 + jitter),
                label: COLOR_CONFIG[target].label,
                hex: COLOR_CONFIG[target].hex,
                rgb: [240, 200, 30],
                hsv: [55, 0.8, 0.9],
              };
            }
            const palette: CubeColor[] = ['white', 'yellow', 'green', 'blue', 'orange', 'red'];
            const c = palette[(i + activeFaceIdx) % palette.length];
            return {
              color: c,
              confidence: Math.round(95 + jitter),
              label: COLOR_CONFIG[c].label,
              hex: COLOR_CONFIG[c].hex,
              rgb: [200, 200, 200],
              hsv: [0, 0, 0.8],
            };
          });
          setLiveDetected(dummyResults);
          setCenterAligned(true);
        }
      }

      animFrameRef.current = requestAnimationFrame(processFrame);
    };

    animFrameRef.current = requestAnimationFrame(processFrame);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [cameraStatus, cameraFacing, activeFaceIdx, activeFaceMeta.centerColor]);

  // Count verified colors across 54 facelets
  const colorCounts: Record<CubeColor, number> = {
    white: 0,
    yellow: 0,
    green: 0,
    blue: 0,
    red: 0,
    orange: 0,
  };

  (Object.keys(cubeNetData) as FaceKey[]).forEach((face) => {
    if (verifiedFaces[face]) {
      cubeNetData[face].forEach((c) => {
        if (c in colorCounts) colorCounts[c]++;
      });
    } else {
      const center = cubeNetData[face][4];
      if (center in colorCounts) colorCounts[center]++;
    }
  });

  const verifiedCount = (Object.keys(verifiedFaces) as FaceKey[]).reduce((acc, f) => {
    return acc + (verifiedFaces[f] ? 9 : 0);
  }, 0);

  const remainingFaces = 6 - Object.values(verifiedFaces).filter(Boolean).length;
  const allCompleted = Object.values(verifiedFaces).every(Boolean);

  // Live Rubik's cube 54-sticker state & mathematical parity validation
  const currentCubeNetState: CubeNetState = {
    U: cubeNetData.U as any,
    D: cubeNetData.D as any,
    F: cubeNetData.F as any,
    B: cubeNetData.B as any,
    L: cubeNetData.L as any,
    R: cubeNetData.R as any,
  };
  const validationResult: CubeValidationResult = validateCubeState(currentCubeNetState);

  // Capture Current Face action
  const handleCaptureFace = useCallback(() => {
    sound.playTimerReady();
    setIsShutterFlashing(true);
    setTimeout(() => setIsShutterFlashing(false), 200);

    // Save detected 9 colors into the current face of cubeNetData
    const capturedColors = liveDetected.map((d) => d.color);
    capturedColors[4] = activeFaceMeta.centerColor;

    setCubeNetData((prev) => {
      const updated = { ...prev, [activeFaceMeta.key]: capturedColors };
      if (onUpdateScannedCube) {
        onUpdateScannedCube({
          U: updated.U as any,
          D: updated.D as any,
          F: updated.F as any,
          B: updated.B as any,
          L: updated.L as any,
          R: updated.R as any,
        });
      }
      return updated;
    });

    setVerifiedFaces((prev) => ({ ...prev, [activeFaceMeta.key]: true }));

    // Advance to next face if not at end
    if (activeFaceIdx < FACES_ORDER.length - 1) {
      setActiveFaceIdx((prev) => prev + 1);
    } else {
      sound.playPBChord();
    }
  }, [activeFaceIdx, activeFaceMeta, liveDetected, onUpdateScannedCube]);

  // Auto-Scan timer logic: when center matches and auto mode is on
  useEffect(() => {
    let holdTimer: number | null = null;
    let stepInterval: number | null = null;

    if (scanMode === 'auto' && centerAligned && !verifiedFaces[activeFaceMeta.key] && !isCameraBlockedOrGreen) {
      let currentProgress = 0;
      stepInterval = window.setInterval(() => {
        currentProgress += 12.5; // reaches 100% in 800ms
        setAutoHoldProgress(Math.min(100, currentProgress));
      }, 100);

      holdTimer = window.setTimeout(() => {
        handleCaptureFace();
        setAutoHoldProgress(0);
      }, 800);
    } else {
      setAutoHoldProgress(0);
    }

    return () => {
      if (holdTimer) clearTimeout(holdTimer);
      if (stepInterval) clearInterval(stepInterval);
    };
  }, [scanMode, centerAligned, verifiedFaces, activeFaceMeta.key, handleCaptureFace, isCameraBlockedOrGreen]);

  // Load Demo Scrambled Cube (Alt+D)
  const handleLoadDemo = useCallback(() => {
    sound.playPBChord();
    const demoState = applyScramble(DEMO_SCRAMBLE);
    setCubeNetData({
      U: [...demoState.U],
      F: [...demoState.F],
      R: [...demoState.R],
      B: [...demoState.B],
      L: [...demoState.L],
      D: [...demoState.D],
    });
    setVerifiedFaces({
      U: true,
      F: true,
      R: true,
      B: true,
      L: true,
      D: true,
    });
    if (onUpdateScannedCube) {
      onUpdateScannedCube(demoState);
    }
    onSetDemoScramble?.(DEMO_SCRAMBLE);
  }, [DEMO_SCRAMBLE, onUpdateScannedCube, onSetDemoScramble]);

  // Reset all 54 stickers to clean solved state
  const handleResetAllToSolved = useCallback(() => {
    sound.playPBChord();
    setCubeNetData({
      U: [...SOLVED_CUBE.U],
      F: [...SOLVED_CUBE.F],
      R: [...SOLVED_CUBE.R],
      B: [...SOLVED_CUBE.B],
      L: [...SOLVED_CUBE.L],
      D: [...SOLVED_CUBE.D],
    });
    setVerifiedFaces({
      U: false,
      F: false,
      R: false,
      B: false,
      L: false,
      D: false,
    });
    if (onUpdateScannedCube) {
      onUpdateScannedCube(null);
    }
    onSetDemoScramble?.(null);
  }, [onUpdateScannedCube, onSetDemoScramble]);

  // Reset current face
  const handleResetFace = useCallback(() => {
    sound.playTick();
    setVerifiedFaces((prev) => ({ ...prev, [activeFaceMeta.key]: false }));
  }, [activeFaceMeta.key]);

  // Handle Image File Upload (Fallback for laptops with camera driver locks)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current || document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const sampled = sample9TilesFromCanvas(ctx, canvas.width, canvas.height, 16, false);
        if (sampled.length === 9) {
          setLiveDetected(sampled);
          sound.playTimerReady();
        }
      }
    };
    img.src = URL.createObjectURL(file);
  };

  // Proceed to Step 3 with verified cube state
  const handleProceedToStep3 = useCallback(() => {
    const netState: CubeNetState = {
      U: [...cubeNetData.U] as any,
      D: [...cubeNetData.D] as any,
      F: [...cubeNetData.F] as any,
      B: [...cubeNetData.B] as any,
      L: [...cubeNetData.L] as any,
      R: [...cubeNetData.R] as any,
    };
    const validation = validateCubeState(netState);
    if (!validation.isValid) return;

    // Clear stale demoScramble from prop and localStorage so solver receives genuine camera state
    onSetDemoScramble?.(null);
    try {
      localStorage.removeItem('cubemaster_demo_scramble');
    } catch {}

    if (onUpdateScannedCube) {
      onUpdateScannedCube(netState);
    }
    onProceedToStep3();
  }, [cubeNetData, onSetDemoScramble, onUpdateScannedCube, onProceedToStep3]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        handleCaptureFace();
      } else if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        handleSwitchToNextDevice();
      } else if (e.code === 'Escape') {
        e.preventDefault();
        handleResetFace();
      } else if (e.altKey && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault();
        handleLoadDemo();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (validationResult.isValid) {
          handleProceedToStep3();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleCaptureFace, handleSwitchToNextDevice, handleResetFace, handleLoadDemo, handleProceedToStep3, validationResult.isValid]);

  // Override a sticker color in 2D Net
  const handleStickerOverride = (face: FaceKey, idx: number) => {
    sound.playTick();
    setCubeNetData((prev) => {
      const copy = [...prev[face]];
      copy[idx] = selectedBrush;
      const updated = { ...prev, [face]: copy };
      if (onUpdateScannedCube) {
        onUpdateScannedCube({
          U: updated.U as any,
          D: updated.D as any,
          F: updated.F as any,
          B: updated.B as any,
          L: updated.L as any,
          R: updated.R as any,
        });
      }
      return updated;
    });
  };

  // Render a 3x3 face box in the 2D Net (Old design with square aspect ratio)
  const renderNetFace = (faceKey: FaceKey, label: string) => {
    const isActive = activeFaceMeta.key === faceKey;
    const isVerified = verifiedFaces[faceKey];
    const stickers = cubeNetData[faceKey];

    return (
      <div
        onClick={() => setActiveFaceIdx(FACES_ORDER.findIndex((f) => f.key === faceKey))}
        className={`relative p-1.5 sm:p-2 rounded-xl transition-all cursor-pointer flex flex-col items-center justify-between ${
          isActive
            ? 'ring-2 ring-red-500 bg-red-50/40 shadow-xs'
            : isVerified
            ? 'bg-neutral-50/80 hover:bg-neutral-100'
            : 'bg-neutral-50/50 border border-dashed border-neutral-200 hover:border-neutral-300'
        }`}
      >
        {/* Face Label and Status */}
        <div className="flex items-center justify-between w-full mb-1 text-[9px] sm:text-[9.5px] font-mono px-0.5">
          <span className="font-bold text-neutral-800 truncate">{label}</span>
          {isVerified && <Check className="w-2.5 h-2.5 text-emerald-600 stroke-[3] ml-0.5 shrink-0" />}
        </div>

        {/* 3x3 Stickers Grid - Giữ nguyên thiết kế cũ, tỷ lệ vuông chuẩn 1:1 */}
        <div className="w-full aspect-square grid grid-cols-3 grid-rows-3 gap-[2px] p-[2px] bg-neutral-200/80 rounded-md">
          {stickers.map((col, idx) => {
            const isCenter = idx === 4;
            const colorHex = isVerified || isCenter ? CUBE_HEX_COLORS[col] : '#DFE5ED';
            const isWhite = col === 'white' && (isVerified || isCenter);

            return (
              <div
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  handleStickerOverride(faceKey, idx);
                }}
                className="w-full h-full aspect-square rounded-[2px] transition-transform hover:scale-110 flex items-center justify-center relative cursor-pointer"
                style={{
                  backgroundColor: colorHex,
                  border: isWhite ? '1px solid rgba(200, 205, 210, 0.8)' : 'none',
                }}
                title={`Click to set ${selectedBrush}`}
              >
                {isCenter && (
                  <span className="w-1.5 h-1.5 rounded-full bg-black/40" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT BENTO CARD (7 Cols): Real Camera Live Viewport & Precision Reticle */}
        <section className="lg:col-span-7 bg-white rounded-[20px] sm:rounded-[24px] border border-[#EAECEF] p-3.5 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col gap-3 sm:gap-4">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2.5 sm:pb-3 border-b border-[#F2F4F7] gap-2.5 sm:gap-3">
            <div className="flex flex-col gap-0.5">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-mono text-[10px] sm:text-[11px] font-semibold text-neutral-500 uppercase tracking-wider hidden sm:inline">
                  Vision Engine: Real-Time RGB/HSV
                </span>
                <span className="text-neutral-300 hidden sm:inline">|</span>
                <span className="font-mono text-[10.5px] sm:text-[11px] font-bold text-neutral-900 uppercase tracking-wider">
                  Mặt {activeFaceIdx + 1}/6: {activeFaceMeta.name} ({activeFaceMeta.centerColor.toUpperCase()})
                </span>
              </div>
              <h2 className="font-bold text-base sm:text-lg text-neutral-900 tracking-tight">
                <span className="sm:hidden">Quét Camera &amp; Nhận Diện Màu</span>
                <span className="hidden sm:inline">Camera Live Feed &amp; Color Recognition</span>
              </h2>
            </div>

            {/* Segmented Switch: Auto-Scan vs Manual Capture */}
            <div className="inline-flex items-center bg-[#F1F3F5] p-1 rounded-xl border border-[#EAECEF] text-xs shrink-0 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setScanMode('auto')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  scanMode === 'auto' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Auto-Scan</span>
                <span className="text-[10px] font-mono text-neutral-400">0.8s</span>
              </button>

              <button
                type="button"
                onClick={() => setScanMode('manual')}
                className={`px-3 py-1 rounded-lg text-xs transition-all ${
                  scanMode === 'manual' ? 'bg-white text-neutral-900 font-bold shadow-sm' : 'text-neutral-500'
                }`}
              >
                Manual Capture
              </button>
            </div>
          </div>

          {/* Device Selection Bar (If Multiple Cameras Found) */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-[#F8F9FA] border border-[#EAECEF] rounded-xl text-xs font-mono">
            <div className="flex items-center gap-1.5 min-w-[150px] flex-1">
              <Camera className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
              <span className="font-semibold text-neutral-700 shrink-0 text-[11px] sm:text-xs">Cam:</span>
              {videoDevices.length > 0 ? (
                <select
                  value={selectedDeviceId}
                  onChange={(e) => {
                    setSelectedDeviceId(e.target.value);
                    startCamera(e.target.value);
                  }}
                  className="flex-1 min-w-0 bg-white border border-[#D0D5DD] rounded-lg px-2 py-1 text-[11px] sm:text-xs font-medium text-neutral-900 focus:outline-none focus:ring-1 focus:ring-black truncate"
                >
                  {videoDevices.map((dev, idx) => (
                    <option key={dev.deviceId || idx} value={dev.deviceId}>
                      {dev.label || `Camera ${idx + 1}`}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-neutral-500 font-normal truncate text-[11px] sm:text-xs">Default Camera</span>
              )}
            </div>

            <div className="flex flex-wrap gap-2 justify-center items-center shrink-0">
              <button
                type="button"
                onClick={handleSwitchToNextDevice}
                className="px-2 py-1 rounded-lg bg-white border border-[#D0D5DD] hover:bg-neutral-100 text-neutral-800 text-[10.5px] sm:text-[11px] font-bold flex items-center gap-1 shadow-2xs"
                title="Đổi camera khác hoặc đổi trước/sau"
              >
                <FlipHorizontal className="w-3 h-3 text-neutral-500" />
                <span>Đổi Cam</span>
              </button>

              <button
                type="button"
                onClick={() => startCamera()}
                className="px-2 py-1 rounded-lg bg-white border border-[#D0D5DD] hover:bg-neutral-100 text-neutral-800 text-[10.5px] sm:text-[11px] font-bold flex items-center gap-1 shadow-2xs"
                title="Khởi động lại kết nối camera"
              >
                <RefreshCw className="w-3 h-3 text-neutral-500" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* REAL CAMERA VIEWPORT (Precision Optical HUD with Real Camera Video) */}
          <div
            onClick={() => {
              if (videoRef.current && videoRef.current.paused) {
                videoRef.current.play().catch(() => {});
              }
            }}
            className="relative w-full aspect-[4/5] sm:aspect-[4/3] rounded-2xl overflow-hidden bg-[#0A0F1D] border border-slate-800 shadow-inner flex flex-col items-center justify-between p-2.5 sm:p-3 select-none group cursor-pointer"
            title="Click viewport to resume video stream"
          >
            {/* 1. Real Webcam Video Stream Element */}
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              onCanPlay={(e) => {
                e.currentTarget.play().catch(() => {});
              }}
              onPlaying={() => {
                setCameraStatus('active');
              }}
              onLoadedMetadata={(e) => {
                const v = e.currentTarget;
                v.play().catch(() => {});
                setStreamResolution(`${v.videoWidth || 1280}x${v.videoHeight || 720} @ 60 FPS`);
              }}
              className="absolute inset-0 w-full h-full object-cover z-0 transition-opacity duration-200 opacity-100"
              style={{
                transform: cameraFacing === 'user' ? 'scaleX(-1)' : 'none',
              }}
            />

            {/* 2. Shutter Flash Overlay */}
            {isShutterFlashing && (
              <div className="absolute inset-0 bg-white/70 z-50 animate-pulse pointer-events-none transition-opacity duration-150" />
            )}

            {/* 3. Camera Request / Denied States */}
            {cameraStatus === 'requesting' && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/80 text-white gap-3 p-6 text-center">
                <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
                <span className="font-mono text-sm font-bold">Connecting to camera feed...</span>
                <span className="text-xs text-slate-400">Please allow camera permissions if prompted by your browser.</span>
              </div>
            )}

            {cameraStatus === 'denied' && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/90 text-white gap-3 p-6 text-center">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-1">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <span className="font-mono text-sm font-bold text-amber-300">Camera Access Not Available</span>
                <p className="text-xs text-slate-300 max-w-sm">
                  Webcam was not granted permission or is in use. Click below to retry or switch to Virtual Demo Camera.
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => startCamera()}
                    className="px-4 py-2 rounded-xl bg-white text-neutral-900 font-bold text-xs hover:bg-neutral-100 transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Try Again (Thử Lại)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCameraStatus('virtual')}
                    className="px-4 py-2 rounded-xl bg-neutral-800 text-white font-bold text-xs hover:bg-neutral-700 transition-all flex items-center gap-1.5 border border-white/20"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Virtual Demo Feed (Camera Ảo)</span>
                  </button>
                </div>
              </div>
            )}

            {/* 4. DIAGNOSIS ALERT: GREEN SCREEN / DRIVER GLITCH */}
            {isCameraBlockedOrGreen && cameraStatus === 'active' && (
              <div className="absolute top-14 inset-x-4 z-30 bg-amber-950/95 border border-amber-400 text-amber-100 p-3.5 rounded-xl backdrop-blur-md shadow-2xl text-xs space-y-1.5 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div className="font-bold flex items-center gap-2 text-amber-300">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Camera đang trả về màn hình xanh</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSwitchToNextDevice()}
                    className="px-2.5 py-1 rounded bg-amber-400 text-black font-bold text-[11px] hover:bg-amber-300"
                  >
                    Đổi Camera
                  </button>
                </div>
                <div className="text-[11px] text-amber-200/90 leading-relaxed space-y-1">
                  <p>Trình duyệt đã kết nối nhưng chưa có hình ảnh. Hãy kiểm tra nắp che camera hoặc đóng ứng dụng khác đang chiếm camera.</p>
                </div>
              </div>
            )}

            {/* Top Viewport Telemetry Badges - Pinned to top of flex container */}
            <div className="w-full flex items-center justify-between z-20 pointer-events-none shrink-0">
              <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-900/85 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/15 text-white font-mono text-[10px] sm:text-[11px] shadow-sm">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="font-semibold">{cameraStatus === 'virtual' ? 'VIRTUAL' : 'LIVE'}</span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-300">{streamResolution}</span>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-900/85 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/15 text-white font-mono text-[10px] sm:text-[11px] shadow-sm">
                <Sun className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400" />
                <span>EV: Balanced</span>
              </div>
            </div>

            {/* Center Status Banner (Alignment Guidance) - Positioned safely above reticle */}
            <div className="z-20 pointer-events-none shrink-0 my-1">
              <div
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-white shadow-lg backdrop-blur-md transition-all duration-300 ${
                  centerAligned && !isCameraBlockedOrGreen
                    ? 'bg-emerald-950/85 border-emerald-400 text-emerald-200'
                    : 'bg-slate-900/90 border-amber-500/50 text-white'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${
                    centerAligned && !isCameraBlockedOrGreen ? 'bg-emerald-400 animate-ping' : 'bg-amber-400 animate-pulse'
                  }`}
                />
                <span className="font-mono text-[10px] sm:text-xs font-semibold tracking-wide">
                  {centerAligned && !isCameraBlockedOrGreen
                    ? `✓ Center Aligned: ${activeFaceMeta.centerColor.toUpperCase()} (${autoHoldProgress > 0 ? `${autoHoldProgress}%` : 'Hold still'})`
                    : `Hold Still 0.8s... Align ${activeFaceMeta.centerColor.toUpperCase()} CENTER`}
                </span>
              </div>
            </div>

            {/* 3x3 PRECISION ALIGNMENT RETICLE - Centered vertically with zero collisions */}
            <div className="relative z-20 w-[205px] h-[205px] sm:w-[260px] sm:h-[260px] aspect-square border border-white/30 rounded-2xl p-1.5 sm:p-2 bg-black/15 backdrop-blur-[1px] shadow-2xl my-auto shrink-0">
              {/* 4 Viewfinder Corner Brackets */}
              <div className="absolute -top-1.5 -left-1.5 w-5 h-5 sm:w-6 sm:h-6 border-t-[3px] border-l-[3px] border-white rounded-tl" />
              <div className="absolute -top-1.5 -right-1.5 w-5 h-5 sm:w-6 sm:h-6 border-t-[3px] border-r-[3px] border-white rounded-tr" />
              <div className="absolute -bottom-1.5 -left-1.5 w-5 h-5 sm:w-6 sm:h-6 border-b-[3px] border-l-[3px] border-white rounded-bl" />
              <div className="absolute -bottom-1.5 -right-1.5 w-5 h-5 sm:w-6 sm:h-6 border-b-[3px] border-r-[3px] border-white rounded-br" />

              {/* Optical Axis Reticle lines */}
              <div className="absolute inset-x-2 top-1/2 h-[1px] bg-cyan-400/25 pointer-events-none" />
              <div className="absolute inset-y-2 left-1/2 w-[1px] bg-cyan-400/25 pointer-events-none" />

              {/* 9 Live Detection Reticle Tiles */}
              <div className="grid grid-cols-3 grid-rows-3 gap-1.5 sm:gap-2.5 w-full h-full aspect-square">
                {liveDetected.map((detected, idx) => {
                  const isCenter = idx === 4;
                  const targetCenterColor = activeFaceMeta.centerColor;
                  const isCenterMatch = isCenter && detected.color === targetCenterColor;

                  return (
                    <div
                      key={idx}
                      onClick={() => handleStickerOverride(activeFaceMeta.key, idx)}
                      className={`relative rounded-xl border-2 transition-all flex flex-col items-center justify-between p-1 sm:p-1.5 text-white cursor-pointer backdrop-blur-[0.5px] hover:bg-black/30 aspect-square w-full h-full ${
                        isCenter
                          ? isCenterMatch
                            ? 'border-emerald-400 bg-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                            : 'border-amber-400 bg-amber-500/15'
                          : 'border-white/40 bg-black/15 hover:border-white'
                      }`}
                      style={{
                        borderColor: !isCenter ? detected.hex : undefined,
                        boxShadow: !isCenter ? `0 0 8px ${detected.hex}40` : undefined,
                      }}
                      title={`Live detected: ${detected.color.toUpperCase()} (${detected.confidence}%). Click to override.`}
                    >
                      {/* Top Row: Detection Color Pill Badge */}
                      <div className="w-full flex items-center justify-between pointer-events-none">
                        <span
                          className="w-2 h-2 rounded-full border border-black/40 shrink-0"
                          style={{ backgroundColor: detected.hex }}
                        />
                        <span className="font-mono text-[8px] sm:text-[9px] font-extrabold px-1 rounded bg-black/70 text-white tracking-tight">
                          {detected.label} {detected.confidence}%
                        </span>
                      </div>

                      {/* Center Crosshair or Center Target Marker */}
                      <div className="flex flex-col items-center justify-center pointer-events-none my-auto">
                        {isCenter ? (
                          <div className="flex flex-col items-center text-center">
                            <span className="text-xs sm:text-sm font-bold leading-none">◎</span>
                            <span className="font-mono text-[8px] sm:text-[9px] font-black uppercase tracking-tight mt-0.5 px-1 rounded bg-black/70 text-white">
                              {activeFaceMeta.centerLabel}
                            </span>
                          </div>
                        ) : (
                          <span className="text-white/40 font-mono text-[10px] leading-none">+</span>
                        )}
                      </div>

                      {/* Bottom Micro Coordinate */}
                      <div className="w-full text-right pointer-events-none">
                        <span className="font-mono text-[7px] sm:text-[8px] text-white/50">
                          #{idx + 1}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Viewport Next Face / Instruction Banner - Pinned to bottom of flex container */}
            <div className="w-full flex items-center justify-center gap-1.5 bg-slate-900/85 backdrop-blur-md py-1.5 px-3 rounded-xl border border-white/15 text-white font-mono text-[10px] sm:text-[11px] z-20 shrink-0">
              <RotateCcw className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-cyan-400 shrink-0" />
              <span className="truncate">{activeFaceMeta.nextPrompt}</span>
            </div>
          </div>

          {/* Action Row below Viewport */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
            {/* Primary Capture Button - Full width on mobile! */}
            <button
              type="button"
              onClick={handleCaptureFace}
              className="w-full sm:w-auto bg-[#111111] hover:bg-neutral-800 text-white font-bold text-xs px-4 py-3 sm:py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98]"
            >
              <Camera className="w-4 h-4" />
              <span>Chụp Mặt Hiện Tại (Capture Face)</span>
              <span className="hidden sm:inline-block keycap-dark ml-0.5">Space</span>
            </button>

            {/* Quick 4 Action Buttons in a Grid on Mobile */}
            <div className="grid grid-cols-4 sm:flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleSwitchToNextDevice}
                className="bg-white hover:bg-[#F8F9FA] text-neutral-700 border border-[#EAECEF] font-semibold text-xs py-2 px-1 sm:px-3 sm:py-2.5 rounded-xl flex flex-col sm:flex-row items-center justify-center gap-1 transition-all shadow-sm"
                title="Switch Camera Device (C)"
              >
                <FlipHorizontal className="w-3.5 h-3.5 text-neutral-500" />
                <span className="text-[10.5px] sm:text-xs">Đổi Cam</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="bg-white hover:bg-[#F8F9FA] text-neutral-700 border border-[#EAECEF] font-semibold text-xs py-2 px-1 sm:px-3 sm:py-2.5 rounded-xl flex flex-col sm:flex-row items-center justify-center gap-1 transition-all shadow-sm"
                title="Upload photo of Rubik face"
              >
                <Upload className="w-3.5 h-3.5 text-neutral-500" />
                <span className="text-[10.5px] sm:text-xs">Tải Ảnh</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </button>

              <button
                type="button"
                onClick={handleResetFace}
                className="bg-white hover:bg-[#F8F9FA] text-neutral-700 border border-[#EAECEF] font-semibold text-xs py-2 px-1 sm:px-3 sm:py-2.5 rounded-xl flex flex-col sm:flex-row items-center justify-center gap-1 transition-all shadow-sm"
                title="Reset Face (Esc)"
              >
                <RotateCcw className="w-3.5 h-3.5 text-neutral-500" />
                <span className="text-[10.5px] sm:text-xs">Reset</span>
              </button>

              <button
                type="button"
                onClick={handleLoadDemo}
                className="bg-white hover:bg-[#F8F9FA] text-neutral-700 border border-[#EAECEF] font-semibold text-xs py-2 px-1 sm:px-3 sm:py-2.5 rounded-xl flex flex-col sm:flex-row items-center justify-center gap-1 transition-all shadow-sm"
                title="Load Demo Scrambled Cube (Alt+D)"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-[10.5px] sm:text-xs">Demo</span>
              </button>
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN (5 Cols): 2 Bento Cards matching Stitch */}
        <section className="lg:col-span-5 flex flex-col gap-4">
          {/* DEMO SCRAMBLE INFO BOX */}
          {demoScramble && (
            <div className="bg-[#111111] text-white rounded-[20px] p-3.5 sm:px-4 sm:py-3.5 border border-neutral-800 shadow-sm flex flex-col sm:flex-row sm:items-start justify-between gap-3 animate-fade-in font-mono text-xs">
              <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded bg-amber-400 text-black text-[9.5px] font-black uppercase tracking-wider shrink-0">
                    DEMO SCRAMBLE · {demoScramble.trim().split(/\s+/).filter(Boolean).length} BƯỚC
                  </span>
                </div>
                <div className="text-neutral-200 whitespace-normal break-words leading-relaxed select-all font-semibold">
                  {demoScramble}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(demoScramble);
                  setCopiedDemo(true);
                  sound.playTick();
                  setTimeout(() => setCopiedDemo(false), 2000);
                }}
                className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white font-semibold text-[11px] shrink-0 border border-white/10 flex items-center gap-1 transition-colors"
                title="Sao chép công thức xáo trộn demo"
              >
                {copiedDemo ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Đã chép</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-neutral-400" />
                    <span>Sao chép</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Card 1: SCANNED 2D NET · 54 FACELETS */}
          <div className="bg-white rounded-[20px] sm:rounded-[24px] border border-[#EAECEF] p-3.5 sm:p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#F2F4F7]">
                <div className="flex items-center gap-2">
                  <Grid className="w-4 h-4 text-neutral-600" />
                  <span className="font-mono text-[11px] font-bold text-neutral-900 uppercase tracking-wider">
                    SCANNED 2D NET · 54 FACELETS
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleResetAllToSolved}
                    className="px-2 py-0.5 rounded bg-neutral-100 hover:bg-neutral-200 text-[10px] font-mono font-bold text-neutral-700 uppercase transition-colors flex items-center gap-1 cursor-pointer"
                    title="Khôi phục toàn bộ 54 ô về màu gốc đã giải"
                  >
                    <RotateCcw className="w-2.5 h-2.5 text-neutral-500" />
                    <span>Reset Về Gốc</span>
                  </button>
                  <span className="px-2 py-0.5 rounded bg-[#F1F3F5] text-[10px] font-mono font-bold text-neutral-500 uppercase">
                    WCA LAYOUT
                  </span>
                </div>
              </div>

              <p className="text-xs text-neutral-500 mb-3 font-mono">
                Standard cross projection. Live recognized stickers are saved here upon capture.
              </p>

              {/* Cross Layout Container */}
              <div className="bg-[#F8F9FA] border border-[#EAECEF] rounded-2xl p-2 sm:p-4 flex flex-col items-center justify-center my-2 overflow-x-auto">
                <div className="grid grid-cols-4 gap-1.5 sm:gap-2 items-center">
                  {/* Row 1: U is at column 2 (Yellow - Last Layer) */}
                  <div className="col-start-2">
                    {renderNetFace('U', 'U - VÀNG (ĐỈNH)')}
                  </div>

                  {/* Row 2: L, F, R, B across all 4 cols */}
                  <div className="col-span-4 grid grid-cols-4 gap-1.5 sm:gap-2">
                    <div>{renderNetFace('L', 'L - CAM')}</div>
                    <div>{renderNetFace('F', 'F - XANH LÁ')}</div>
                    <div>{renderNetFace('R', 'R - ĐỎ')}</div>
                    <div>{renderNetFace('B', 'B - XANH DƯƠNG')}</div>
                  </div>

                  {/* Row 3: D is at column 2 (White - Cross) */}
                  <div className="col-start-2">
                    {renderNetFace('D', 'D - TRẮNG (CROSS)')}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Face Selector Row (6 Pills) */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 pt-3 border-t border-[#F1F3F5]">
              {FACES_ORDER.map((f, idx) => {
                const isActive = activeFaceIdx === idx;
                const isDone = verifiedFaces[f.key];

                return (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setActiveFaceIdx(idx)}
                    className={`py-1.5 px-2 rounded-xl text-[10.5px] font-mono flex items-center justify-center gap-1 transition-all ${
                      isActive
                        ? 'border-2 border-red-500 bg-red-50 text-red-700 font-bold'
                        : isDone
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold'
                        : 'bg-[#F8F9FA] border border-[#EAECEF] text-neutral-500 hover:bg-neutral-100'
                    }`}
                  >
                    {isDone ? (
                      <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                    ) : isActive ? (
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                    ) : null}
                    <span>{f.key} · {f.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Card 2: MANUAL COLOR OVERRIDE & VALIDATION */}
          <div className="bg-white rounded-[20px] sm:rounded-[24px] border border-[#EAECEF] p-3.5 sm:p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] space-y-3.5 sm:space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#F2F4F7]">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-neutral-600" />
                <span className="font-mono text-[11px] font-bold text-neutral-900 uppercase tracking-wider">
                  MANUAL COLOR OVERRIDE &amp; VALIDATION
                </span>
              </div>
              <span className="text-[10px] font-mono text-neutral-400">
                54 Max
              </span>
            </div>

            {/* 6 Color Swatches */}
            <div className="grid grid-cols-6 gap-1.5 sm:gap-2">
              {SWATCH_CONFIG.map((s) => {
                const isSelected = selectedBrush === s.color;
                const count = colorCounts[s.color] || 0;
                const isFull = count === 9;

                return (
                  <div
                    key={s.color}
                    onClick={() => setSelectedBrush(s.color)}
                    className={`p-1.5 sm:p-2 rounded-xl border flex flex-col items-center justify-center cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#111111] border-2 bg-neutral-50 shadow-sm scale-105'
                        : 'border-[#EAECEF] hover:bg-neutral-50'
                    }`}
                  >
                    <div
                      className="w-4 h-4 sm:w-5 sm:h-5 rounded-full border border-neutral-300 shadow-2xs mb-1"
                      style={{ backgroundColor: s.hex }}
                    />
                    <span
                      className={`text-[9.5px] sm:text-[10px] font-mono font-bold ${
                        isFull ? 'text-emerald-700' : 'text-neutral-500'
                      }`}
                    >
                      {count}/9
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Tip Banner */}
            <div className="p-2.5 sm:p-3 bg-[#F8F9FA] rounded-xl border border-[#EAECEF] flex items-center gap-2 text-[11px] sm:text-xs text-neutral-600 font-mono">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>Click swatch then click tile in 2D Net to adjust.</span>
            </div>

            {/* Validation Banner: Live 54-Sticker & Parity Diagnostics */}
            {validationResult.isValid ? (
              <div className="p-3 rounded-xl border border-emerald-300 bg-emerald-50/90 text-emerald-800 flex items-center justify-between text-xs font-mono shadow-2xs transition-all">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-bold text-emerald-950">
                    Khối Rubik Hợp Lệ 100%
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded">
                  54/54 Nhãn Dán Chuẩn
                </span>
              </div>
            ) : (
              <div className="p-3 rounded-xl border border-amber-300/80 bg-amber-50 text-amber-900 flex flex-col gap-1 text-xs font-mono shadow-2xs transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="font-bold text-amber-950">
                      Chưa Thể Giải: Khối Rubik Chưa Hợp Lệ
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-200/70 text-amber-900">
                    {verifiedCount}/54 Đã Quét
                  </span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed mt-1 border-t border-amber-200/60 pt-1">
                  {validationResult.errors[0] || 'Vui lòng kiểm tra lại 6 mặt và điều chỉnh nhãn dán.'}
                </p>
              </div>
            )}

            {/* Generate Solution Primary CTA Button */}
            <button
              type="button"
              disabled={!validationResult.isValid}
              onClick={handleProceedToStep3}
              className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all ${
                validationResult.isValid
                  ? 'bg-[#111111] hover:bg-neutral-800 text-white cursor-pointer active:scale-[0.98]'
                  : 'bg-neutral-200 text-neutral-400 cursor-not-allowed opacity-60'
              }`}
            >
              <span>Tạo Lời Giải Chi Tiết (Generate Solution)</span>
              <span className="hidden sm:inline-block keycap-dark">Enter</span>
              <ArrowRight className="w-4 h-4 ml-0.5" />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};
