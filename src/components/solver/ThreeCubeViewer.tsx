import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { SolutionMove } from '../../utils/solutionStages';
import { CubeNetState, CubeColor, CUBE_HEX_COLORS } from '../../utils/cubeState';

interface ThreeCubeViewerProps {
  currentMove?: string;
  moveIndex?: number;
  allMoves?: SolutionMove[];
  cameraPreset?: 'Iso' | 'Top' | 'Bottom' | 'Front';
  turnAngle?: string;
  slice?: string;
  initialCubeState?: CubeNetState | null;
  activeStageHint?: string;
}


interface ActiveAnimation {
  pivot: THREE.Group;
  meshes: THREE.Mesh[];
  axis: THREE.Vector3;
  targetAngle: number;
  startTime: number;
  duration: number;
  resolve: () => void;
}

interface CubeletInitialState {
  mesh: THREE.Mesh;
  initialPos: THREE.Vector3;
}

// Convert WCA move string to rotation parameters
function parseMoveToRotation(moveStr: string, isReversed = false): {
  axis: THREE.Vector3;
  angleRad: number;
  filter: (pos: THREE.Vector3) => boolean;
} | null {
  const m = moveStr.trim();
  if (!m) return null;

  const base = m[0];
  const isPrime = m.includes("'");
  const isDouble = m.includes('2');

  let axis = new THREE.Vector3(1, 0, 0);
  let baseAngle = -Math.PI / 2;
  let filter = (p: THREE.Vector3) => true;

  switch (base) {
    case 'R':
      axis = new THREE.Vector3(1, 0, 0);
      baseAngle = -Math.PI / 2;
      filter = (p) => p.x > 0.5;
      break;
    case 'L':
      axis = new THREE.Vector3(1, 0, 0);
      baseAngle = Math.PI / 2;
      filter = (p) => p.x < -0.5;
      break;
    case 'U':
      axis = new THREE.Vector3(0, 1, 0);
      baseAngle = -Math.PI / 2;
      filter = (p) => p.y > 0.5;
      break;
    case 'D':
      axis = new THREE.Vector3(0, 1, 0);
      baseAngle = Math.PI / 2;
      filter = (p) => p.y < -0.5;
      break;
    case 'F':
      axis = new THREE.Vector3(0, 0, 1);
      baseAngle = -Math.PI / 2;
      filter = (p) => p.z > 0.5;
      break;
    case 'B':
      axis = new THREE.Vector3(0, 0, 1);
      baseAngle = Math.PI / 2;
      filter = (p) => p.z < -0.5;
      break;
    case 'M':
      axis = new THREE.Vector3(1, 0, 0);
      baseAngle = Math.PI / 2;
      filter = (p) => p.x > -0.5 && p.x < 0.5;
      break;
    default:
      return null;
  }

  let angle = baseAngle;
  if (isPrime) angle = -angle;
  if (isDouble) angle *= 2;
  if (isReversed) angle = -angle;

  return { axis, angleRad: angle, filter };
}

function getCubeletFaceColor(
  face: 'R' | 'L' | 'U' | 'D' | 'F' | 'B',
  x: number,
  y: number,
  z: number,
  initialCubeState?: CubeNetState | null
): number {
  const fallbackColors = {
    R: 0xb71234, // Red
    L: 0xff5800, // Orange
    U: 0xffd000, // Yellow (Top - Last Layer)
    D: 0xffffff, // White (Down - Cross)
    F: 0x009b48, // Green
    B: 0x0046ad, // Blue
  };

  if (!initialCubeState) {
    return fallbackColors[face];
  }

  let colorName: CubeColor = 'white';
  switch (face) {
    case 'U':
      colorName = initialCubeState.U[(z + 1) * 3 + (x + 1)] || 'yellow';
      break;
    case 'D':
      colorName = initialCubeState.D[(1 - z) * 3 + (x + 1)] || 'white';
      break;
    case 'F':
      colorName = initialCubeState.F[(1 - y) * 3 + (x + 1)] || 'green';
      break;
    case 'B':
      colorName = initialCubeState.B[(1 - y) * 3 + (1 - x)] || 'blue';
      break;
    case 'L':
      colorName = initialCubeState.L[(1 - y) * 3 + (z + 1)] || 'orange';
      break;
    case 'R':
      colorName = initialCubeState.R[(1 - y) * 3 + (1 - z)] || 'red';
      break;
  }


  switch (colorName) {
    case 'white': return 0xffffff;
    case 'yellow': return 0xffd000;
    case 'green': return 0x009b48;
    case 'blue': return 0x0046ad;
    case 'red': return 0xb71234;
    case 'orange': return 0xff5800;
    default: return fallbackColors[face];
  }
}

export const ThreeCubeViewer: React.FC<ThreeCubeViewerProps> = ({
  currentMove = 'R',
  moveIndex = 0,
  allMoves = [],
  cameraPreset = 'Iso',
  turnAngle = '+90.0°',
  slice = 'R',
  initialCubeState,
  activeStageHint,
}) => {

  const mountRef = useRef<HTMLDivElement | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const cubeGroupRef = useRef<THREE.Group | null>(null);
  const cubeletsRef = useRef<CubeletInitialState[]>([]);
  const activeAnimationRef = useRef<ActiveAnimation | null>(null);
  const lastExecutedIndexRef = useRef<number>(moveIndex);
  const shadowMeshRef = useRef<THREE.Mesh | null>(null);



  // 1. Initialize Scene & 3D Rubik's Cube
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 400;
    const height = container.clientHeight || 340;

    // Scene
    const scene = new THREE.Scene();

    // Perspective Camera
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(5.2, 4.2, 6.2);
    cameraRef.current = camera;

    // WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enablePan = false;
    controls.minDistance = 4.5;
    controls.maxDistance = 12;
    controlsRef.current = controls;

    // Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 2.0);
    dirLight1.position.set(10, 15, 12);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x38bdf8, 0.6); // Cyan rim light
    dirLight2.position.set(-10, -8, -10);
    scene.add(dirLight2);

    const dirLight3 = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight3.position.set(0, -10, 10);
    scene.add(dirLight3);

    // Cube Group
    const cubeGroup = new THREE.Group();
    scene.add(cubeGroup);
    cubeGroupRef.current = cubeGroup;

    const cubeSize = 0.94;
    const spacing = 1.0;
    const geometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);

    const cubelets: CubeletInitialState[] = [];

    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          const materials = [
            new THREE.MeshStandardMaterial({
              color: x === 1 ? getCubeletFaceColor('R', x, y, z, initialCubeState) : 0x111317,
              roughness: 0.25,
              metalness: 0.05,
            }),
            new THREE.MeshStandardMaterial({
              color: x === -1 ? getCubeletFaceColor('L', x, y, z, initialCubeState) : 0x111317,
              roughness: 0.25,
              metalness: 0.05,
            }),
            new THREE.MeshStandardMaterial({
              color: y === 1 ? getCubeletFaceColor('U', x, y, z, initialCubeState) : 0x111317,
              roughness: 0.25,
              metalness: 0.05,
            }),
            new THREE.MeshStandardMaterial({
              color: y === -1 ? getCubeletFaceColor('D', x, y, z, initialCubeState) : 0x111317,
              roughness: 0.25,
              metalness: 0.05,
            }),
            new THREE.MeshStandardMaterial({
              color: z === 1 ? getCubeletFaceColor('F', x, y, z, initialCubeState) : 0x111317,
              roughness: 0.25,
              metalness: 0.05,
            }),
            new THREE.MeshStandardMaterial({
              color: z === -1 ? getCubeletFaceColor('B', x, y, z, initialCubeState) : 0x111317,
              roughness: 0.25,
              metalness: 0.05,
            }),
          ];

          const mesh = new THREE.Mesh(geometry, materials);
          const initialPos = new THREE.Vector3(x * spacing, y * spacing, z * spacing);
          mesh.position.copy(initialPos);
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          cubeGroup.add(mesh);

          cubelets.push({ mesh, initialPos });
        }
      }
    }
    cubeletsRef.current = cubelets;

    // Soft Radial Ground Shadow Plane
    const shadowGeo = new THREE.PlaneGeometry(5.2, 5.2);
    const canvasShadow = document.createElement('canvas');
    canvasShadow.width = 128;
    canvasShadow.height = 128;
    const ctx = canvasShadow.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      grad.addColorStop(0, 'rgba(0,0,0,0.28)');
      grad.addColorStop(0.55, 'rgba(0,0,0,0.06)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 128, 128);
    }
    const shadowTex = new THREE.CanvasTexture(canvasShadow);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = -2.1;
    scene.add(shadowMesh);
    shadowMeshRef.current = shadowMesh;

    // Animation Render Loop
    let animId: number;
    const animate = (time: number) => {
      animId = requestAnimationFrame(animate);

      // Handle ongoing slice rotation animation
      const activeAnim = activeAnimationRef.current;
      if (activeAnim) {
        const elapsed = time - activeAnim.startTime;
        const progress = Math.min(1, elapsed / activeAnim.duration);
        // Cubic ease-out
        const ease = 1 - Math.pow(1 - progress, 3);

        activeAnim.pivot.setRotationFromAxisAngle(activeAnim.axis, activeAnim.targetAngle * ease);

        if (progress >= 1) {
          finishAnimation(activeAnim);
          activeAnimationRef.current = null;
          activeAnim.resolve();
        }
      }

      controls.update();
      renderer.render(scene, camera);
    };
    animId = requestAnimationFrame(animate);

    // Responsive Resize Observer
    const resizeObserver = new ResizeObserver(() => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(animId);
      controls.dispose();
      renderer.dispose();
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Helper: Immediately complete active animation and snap cubelets to exact integer coordinates
  const finishAnimation = (anim: ActiveAnimation) => {
    const cubeGroup = cubeGroupRef.current;
    if (!cubeGroup) return;

    anim.pivot.setRotationFromAxisAngle(anim.axis, anim.targetAngle);

    // Reattach each mesh to main group and round positions to avoid floating point drift
    anim.meshes.forEach((mesh) => {
      cubeGroup.attach(mesh);
      mesh.position.x = Math.round(mesh.position.x);
      mesh.position.y = Math.round(mesh.position.y);
      mesh.position.z = Math.round(mesh.position.z);
      mesh.quaternion.normalize();
    });

    cubeGroup.remove(anim.pivot);
  };

  // Helper: Instantaneous mathematical reset & replay to target move index (0 drift)
  const snapCubeToStep = (targetIdx: number) => {
    // If an animation is active, finish it immediately
    if (activeAnimationRef.current) {
      finishAnimation(activeAnimationRef.current);
      activeAnimationRef.current = null;
    }

    const cubeGroup = cubeGroupRef.current;
    const cubelets = cubeletsRef.current;
    if (!cubeGroup || !cubelets.length) return;

    // Reset all 26 cubelets to initial positions and identity quaternions
    cubelets.forEach(({ mesh, initialPos }) => {
      mesh.position.copy(initialPos);
      mesh.quaternion.identity();
    });

    // Replay moves 0 .. targetIdx - 1 instantaneously
    for (let i = 0; i < targetIdx; i++) {
      const moveObj = allMoves[i];
      if (!moveObj) continue;
      const parsed = parseMoveToRotation(moveObj.move, false);
      if (!parsed) continue;

      const q = new THREE.Quaternion().setFromAxisAngle(parsed.axis, parsed.angleRad);

      cubelets.forEach(({ mesh }) => {
        if (parsed.filter(mesh.position)) {
          mesh.position.applyQuaternion(q);
          mesh.position.x = Math.round(mesh.position.x);
          mesh.position.y = Math.round(mesh.position.y);
          mesh.position.z = Math.round(mesh.position.z);
          mesh.quaternion.premultiply(q);
          mesh.quaternion.normalize();
        }
      });
    }

    lastExecutedIndexRef.current = targetIdx;
  };

  // Update cubelet sticker colors if initialCubeState changes dynamically
  useEffect(() => {
    if (!cubeletsRef.current.length) return;
    cubeletsRef.current.forEach(({ mesh, initialPos }) => {
      const x = Math.round(initialPos.x);
      const y = Math.round(initialPos.y);
      const z = Math.round(initialPos.z);
      const mats = mesh.material as THREE.MeshStandardMaterial[];
      if (Array.isArray(mats)) {
        if (x === 1) mats[0].color.setHex(getCubeletFaceColor('R', x, y, z, initialCubeState));
        if (x === -1) mats[1].color.setHex(getCubeletFaceColor('L', x, y, z, initialCubeState));
        if (y === 1) mats[2].color.setHex(getCubeletFaceColor('U', x, y, z, initialCubeState));
        if (y === -1) mats[3].color.setHex(getCubeletFaceColor('D', x, y, z, initialCubeState));
        if (z === 1) mats[4].color.setHex(getCubeletFaceColor('F', x, y, z, initialCubeState));
        if (z === -1) mats[5].color.setHex(getCubeletFaceColor('B', x, y, z, initialCubeState));
      }
    });
    snapCubeToStep(moveIndex);
  }, [initialCubeState]);

  // 2. Handle Move Index Changes (Smooth animation on single step, instant snap on jump/reset)
  useEffect(() => {
    const prevIdx = lastExecutedIndexRef.current;
    if (moveIndex === prevIdx) return;

    // Finish any currently running animation immediately before handling next step
    if (activeAnimationRef.current) {
      finishAnimation(activeAnimationRef.current);
      activeAnimationRef.current = null;
    }

    const diff = moveIndex - prevIdx;
    const cubeGroup = cubeGroupRef.current;
    const cubelets = cubeletsRef.current;

    // Case A: Normal single forward step (+1) -> Animate move at prevIdx
    if (diff === 1 && cubeGroup && cubelets.length) {
      const moveToExecute = allMoves[prevIdx];
      const parsed = moveToExecute ? parseMoveToRotation(moveToExecute.move, false) : null;

      if (parsed) {
        const activeMeshes = cubelets.map((c) => c.mesh).filter((m) => parsed.filter(m.position));
        const pivot = new THREE.Group();
        cubeGroup.add(pivot);
        activeMeshes.forEach((mesh) => pivot.attach(mesh));

        lastExecutedIndexRef.current = moveIndex;
        activeAnimationRef.current = {
          pivot,
          meshes: activeMeshes,
          axis: parsed.axis,
          targetAngle: parsed.angleRad,
          startTime: performance.now(),
          duration: 180, // Snappy & fluid 180ms
          resolve: () => {},
        };
        return;
      }
    }

    // Case B: Normal single backward step (-1) -> Animate reverse of move at moveIndex
    if (diff === -1 && cubeGroup && cubelets.length) {
      const moveReversed = allMoves[moveIndex];
      const parsed = moveReversed ? parseMoveToRotation(moveReversed.move, true) : null;

      if (parsed) {
        const activeMeshes = cubelets.map((c) => c.mesh).filter((m) => parsed.filter(m.position));
        const pivot = new THREE.Group();
        cubeGroup.add(pivot);
        activeMeshes.forEach((mesh) => pivot.attach(mesh));

        lastExecutedIndexRef.current = moveIndex;
        activeAnimationRef.current = {
          pivot,
          meshes: activeMeshes,
          axis: parsed.axis,
          targetAngle: parsed.angleRad,
          startTime: performance.now(),
          duration: 180,
          resolve: () => {},
        };
        return;
      }
    }

    // Case C: Multi-step jump, stage select, or reset (|<) -> Instant snap with 0 drift
    snapCubeToStep(moveIndex);
  }, [moveIndex, allMoves]);

  // 3. Camera Angle Presets (Zero-singularity, aligned orthogonal and isometric perspectives)
  useEffect(() => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    // Hide ground shadow plane when viewing from underneath (Bottom)
    if (shadowMeshRef.current) {
      shadowMeshRef.current.visible = cameraPreset !== 'Bottom';
    }

    switch (cameraPreset) {
      case 'Top':
        camera.position.set(0, 8.2, 0.4);
        break;
      case 'Bottom':
        camera.position.set(0, -8.2, 0.4);
        break;
      case 'Front':
        camera.position.set(0, 0, 8.2);
        break;
      case 'Iso':
      default:
        camera.position.set(5.2, 4.2, 6.2);
        break;
    }
    controls.target.set(0, 0, 0);
    camera.lookAt(0, 0, 0);
    controls.update();
  }, [cameraPreset]);

  return (
    <div className="relative w-full h-[320px] sm:h-[360px] rounded-2xl bg-gradient-to-b from-[#FAFAFA] to-[#F1F3F5] border border-[#EAECEF] flex items-center justify-center overflow-hidden shadow-inner select-none">
      {/* Background Precision Spatial Grid */}
      <div className="absolute inset-0 opacity-[0.06] bg-[radial-gradient(#111111_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

      {/* UNIFIED TOP HUD BAR (Clean, non-overlapping, fully responsive) */}
      <div className="absolute top-3 inset-x-3 z-10 flex items-center justify-between gap-2 pointer-events-none">
        {/* Left: Move & Action */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full border border-[#EAECEF] shadow-2xs flex items-center gap-1.5 font-mono text-[11px]">
            {moveIndex >= allMoves.length && allMoves.length > 0 ? (
              <span className="text-emerald-600 font-bold">SOLVED ✓</span>
            ) : (
              <>
                <span className="font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[11px] border border-emerald-200">
                  {currentMove || slice}
                </span>
                <span className="text-neutral-500 text-[10px] sm:text-[10.5px] hidden sm:inline font-sans font-medium">
                  {allMoves[moveIndex]?.holdTip || `Lát cắt ${slice}`}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Center: Stage Hint Pill (properly constrained to avoid overlapping) */}
        {activeStageHint && (
          <div className="flex-1 max-w-[50%] min-w-0 flex justify-center">
            <div className="w-auto max-w-full bg-neutral-900/90 text-white backdrop-blur-md px-3 py-1 rounded-full text-[10px] sm:text-[10.5px] font-medium shadow-md flex items-center gap-1.5 border border-white/10">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
              <span className="truncate">{activeStageHint}</span>
            </div>
          </div>
        )}

        {/* Right: Sync Badge */}
        <div className="bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full border border-[#EAECEF] text-[10px] sm:text-[10.5px] font-mono text-neutral-600 flex items-center gap-1.5 shadow-2xs shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="hidden sm:inline">SYNC: ACTIVE</span>
          <span className="sm:hidden">SYNC</span>
        </div>
      </div>

      {/* Face Orientation Legend (Tucked neatly below the HUD on the left) */}
      <div className="absolute top-12 left-3 flex items-center gap-1.5 z-10 pointer-events-none">
        <div className="bg-white/90 backdrop-blur-md px-2 py-0.5 rounded-full border border-[#EAECEF] text-[9px] font-mono text-neutral-700 shadow-2xs flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
          <span>U: VÀNG</span>
        </div>
        <div className="bg-white/90 backdrop-blur-md px-2 py-0.5 rounded-full border border-[#EAECEF] text-[9px] font-mono text-neutral-700 shadow-2xs flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-white border border-neutral-400 shrink-0" />
          <span>D: TRẮNG</span>
        </div>
      </div>

      {/* Three.js Canvas Container */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Kinetic Emerald Rotation Arrow overlay OR Solved Success Badge */}
      {moveIndex >= allMoves.length && allMoves.length > 0 ? (
        <div className="absolute right-4 sm:right-10 top-1/2 -translate-y-1/2 pointer-events-none z-10 flex flex-col items-center gap-2 animate-bounce">
          <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg ring-4 ring-emerald-200">
            <svg className="w-6 h-6 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <span className="bg-emerald-600 text-white font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-md">
            100% SOLVED ✓
          </span>
        </div>
      ) : (
        <div className="absolute right-4 sm:right-10 top-1/2 -translate-y-1/2 pointer-events-none z-10 flex items-center gap-1.5">
          <div className="flex flex-col items-center">
            <svg className="w-14 sm:w-16 h-18 sm:h-20 overflow-visible" viewBox="0 0 70 90">
              <defs>
                <linearGradient id="emeraldArrowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10B981" />
                  <stop offset="100%" stopColor="#047857" />
                </linearGradient>
              </defs>
              <path
                d="M 15,10 C 65,20 65,70 15,80"
                fill="none"
                stroke="url(#emeraldArrowGrad)"
                strokeWidth="4.5"
                strokeLinecap="round"
              />
              <polygon points="12,80 26,72 24,88" fill="#047857" />
            </svg>
            <div className="bg-[#111111]/95 backdrop-blur-md text-white px-2.5 py-1 rounded-xl shadow-lg border border-white/10 flex flex-col items-center mt-1 text-center">
              <div className="flex items-center gap-1 font-mono">
                <span className="text-xs font-black text-emerald-400">
                  {currentMove || slice}
                </span>
                <span className="text-[9.5px] text-neutral-400">
                  ({turnAngle === '180.0°' ? '180°' : '90°'})
                </span>
              </div>
              <span className="text-[9px] font-sans text-neutral-300 font-medium whitespace-nowrap mt-0.5">
                {currentMove?.includes("'")
                  ? 'Ngược chiều KĐH'
                  : currentMove?.includes('2')
                  ? 'Xoay 180°'
                  : 'Thuận chiều KĐH'}
              </span>
            </div>
          </div>
        </div>
      )}


      {/* Bottom Spatial Inspection Tip */}
      <div className="absolute bottom-3 inset-x-0 flex items-center justify-center pointer-events-none z-10 px-3">
        <div className="bg-white/85 backdrop-blur-md px-3 py-1 rounded-full border border-[#EAECEF] text-[10.5px] font-mono text-neutral-500 shadow-2xs flex items-center gap-1.5 text-center">
          <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 shrink-0" />
          <span className="truncate">Spatial Inspection: Kéo chuột xoay 360° · Cuộn chuột thu phóng</span>
        </div>
      </div>
    </div>
  );
};
