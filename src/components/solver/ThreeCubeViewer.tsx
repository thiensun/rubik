import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { SolutionMove } from '../../utils/solutionStages';
import { CubeNetState, CubeColor } from '../../utils/cubeState';
import { CubeSize } from '../../core/types';

interface ThreeCubeViewerProps {
  cubeSize?: CubeSize;
  currentMove?: string;
  moveIndex?: number;
  currentMoveIndex?: number;
  allMoves?: SolutionMove[] | Array<{ move: string; explanation?: string }>;
  cameraPreset?: 'Iso' | 'Top' | 'Bottom' | 'Front';
  turnAngle?: string;
  slice?: string;
  initialCubeState?: CubeNetState | null;
  activeStageHint?: string;
  isSolved?: boolean;
  playbackSpeed?: '0.5x' | '1.0x' | '2.0x' | number;
  onAnimationComplete?: () => void;
  heightClassName?: string;
  compact?: boolean;
  isOrbitLocked?: boolean;
}

function getAnimationDuration(speed?: '0.5x' | '1.0x' | '2.0x' | number): number {
  if (speed === '0.5x' || speed === 0.5) return 380;
  if (speed === '2.0x' || speed === 2.0) return 110;
  return 180;
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
  ix: number;
  iy: number;
  iz: number;
}

export function parseMoveToRotation(
  moveStr: string,
  isReversed = false,
  cubeSize: CubeSize = 3,
  spacing = 3.0 / cubeSize,
): {
  axis: THREE.Vector3;
  angleRad: number;
  filter: (pos: THREE.Vector3) => boolean;
} | null {
  const m = moveStr.trim().replace(/[()[\]]/g, '');
  if (!m) return null;

  const offset = (cubeSize - 1) / 2;
  let isInnerSlice = false;
  let base = m[0];
  let modifiers = m.slice(1);

  if (m.startsWith('2') && m.length >= 2 && /[RLUDFBrludfb]/.test(m[1])) {
    isInnerSlice = true;
    base = m[1].toUpperCase();
    modifiers = m.slice(2);
  } else if (m.length >= 2 && (m[1] === 'w' || m[1] === 'W')) {
    base = m[0].toLowerCase();
    modifiers = m.slice(2);
  }

  const isPrime = modifiers.includes("'");
  const isDouble = modifiers.includes('2');

  let axis = new THREE.Vector3(1, 0, 0);
  let baseAngle = -Math.PI / 2;
  let filter = (_p: THREE.Vector3) => true;

  if (isInnerSlice) {
    // 4x4x4 inner slice moves: 2R, 2L, 2U, 2D, 2F, 2B
    const innerLayerCoord = Math.max(0.5, offset - 1);
    switch (base) {
      case 'R':
        axis = new THREE.Vector3(1, 0, 0);
        baseAngle = -Math.PI / 2;
        filter = (p) => Math.abs(p.x / spacing - innerLayerCoord) < 0.4;
        break;
      case 'L':
        axis = new THREE.Vector3(1, 0, 0);
        baseAngle = Math.PI / 2;
        filter = (p) => Math.abs(p.x / spacing + innerLayerCoord) < 0.4;
        break;
      case 'U':
        axis = new THREE.Vector3(0, 1, 0);
        baseAngle = -Math.PI / 2;
        filter = (p) => Math.abs(p.y / spacing - innerLayerCoord) < 0.4;
        break;
      case 'D':
        axis = new THREE.Vector3(0, 1, 0);
        baseAngle = Math.PI / 2;
        filter = (p) => Math.abs(p.y / spacing + innerLayerCoord) < 0.4;
        break;
      case 'F':
        axis = new THREE.Vector3(0, 0, 1);
        baseAngle = -Math.PI / 2;
        filter = (p) => Math.abs(p.z / spacing - innerLayerCoord) < 0.4;
        break;
      case 'B':
        axis = new THREE.Vector3(0, 0, 1);
        baseAngle = Math.PI / 2;
        filter = (p) => Math.abs(p.z / spacing + innerLayerCoord) < 0.4;
        break;
      default:
        return null;
    }
  } else {
    switch (base) {
      case 'R':
        axis = new THREE.Vector3(1, 0, 0);
        baseAngle = -Math.PI / 2;
        filter = (p) => p.x / spacing > offset - 0.5;
        break;
      case 'L':
        axis = new THREE.Vector3(1, 0, 0);
        baseAngle = Math.PI / 2;
        filter = (p) => p.x / spacing < -offset + 0.5;
        break;
      case 'U':
        axis = new THREE.Vector3(0, 1, 0);
        baseAngle = -Math.PI / 2;
        filter = (p) => p.y / spacing > offset - 0.5;
        break;
      case 'D':
        axis = new THREE.Vector3(0, 1, 0);
        baseAngle = Math.PI / 2;
        filter = (p) => p.y / spacing < -offset + 0.5;
        break;
      case 'F':
        axis = new THREE.Vector3(0, 0, 1);
        baseAngle = -Math.PI / 2;
        filter = (p) => p.z / spacing > offset - 0.5;
        break;
      case 'B':
        axis = new THREE.Vector3(0, 0, 1);
        baseAngle = Math.PI / 2;
        filter = (p) => p.z / spacing < -offset + 0.5;
        break;
      // Slices
      case 'M':
        axis = new THREE.Vector3(1, 0, 0);
        baseAngle = Math.PI / 2;
        filter = (p) => Math.abs(p.x / spacing) < offset - 0.4;
        break;
      case 'E':
        axis = new THREE.Vector3(0, 1, 0);
        baseAngle = Math.PI / 2;
        filter = (p) => Math.abs(p.y / spacing) < offset - 0.4;
        break;
      case 'S':
        axis = new THREE.Vector3(0, 0, 1);
        baseAngle = -Math.PI / 2;
        filter = (p) => Math.abs(p.z / spacing) < offset - 0.4;
        break;
      // Wide moves (2 outer layers)
      case 'r':
        axis = new THREE.Vector3(1, 0, 0);
        baseAngle = -Math.PI / 2;
        filter = (p) => p.x / spacing > offset - 1.5;
        break;
      case 'l':
        axis = new THREE.Vector3(1, 0, 0);
        baseAngle = Math.PI / 2;
        filter = (p) => p.x / spacing < -offset + 1.5;
        break;
      case 'u':
        axis = new THREE.Vector3(0, 1, 0);
        baseAngle = -Math.PI / 2;
        filter = (p) => p.y / spacing > offset - 1.5;
        break;
      case 'd':
        axis = new THREE.Vector3(0, 1, 0);
        baseAngle = Math.PI / 2;
        filter = (p) => p.y / spacing < -offset + 1.5;
        break;
      case 'f':
        axis = new THREE.Vector3(0, 0, 1);
        baseAngle = -Math.PI / 2;
        filter = (p) => p.z / spacing > offset - 1.5;
        break;
      case 'b':
        axis = new THREE.Vector3(0, 0, 1);
        baseAngle = Math.PI / 2;
        filter = (p) => p.z / spacing < -offset + 1.5;
        break;
      // Cube Rotations
      case 'x':
        axis = new THREE.Vector3(1, 0, 0);
        baseAngle = -Math.PI / 2;
        filter = () => true;
        break;
      case 'y':
        axis = new THREE.Vector3(0, 1, 0);
        baseAngle = -Math.PI / 2;
        filter = () => true;
        break;
      case 'z':
        axis = new THREE.Vector3(0, 0, 1);
        baseAngle = -Math.PI / 2;
        filter = () => true;
        break;
      default:
        return null;
    }
  }

  let angle = baseAngle;
  if (isPrime) angle = -angle;
  if (isDouble) angle *= 2;
  if (isReversed) angle = -angle;

  return { axis, angleRad: angle, filter };
}

function getCubeletFaceColor(
  face: 'R' | 'L' | 'U' | 'D' | 'F' | 'B',
  ix: number,
  iy: number,
  iz: number,
  cubeSize: CubeSize,
  initialCubeState?: CubeNetState | null,
): number {
  const fallbackColors = {
    R: 0xb71234,
    L: 0xff5800,
    U: 0xffd000,
    D: 0xffffff,
    F: 0x009b48,
    B: 0x0046ad,
  };

  if (!initialCubeState) {
    return fallbackColors[face];
  }

  const faceArr = initialCubeState[face] as unknown as CubeColor[];
  if (!faceArr || !faceArr.length) return fallbackColors[face];

  const netDim = Math.round(Math.sqrt(faceArr.length)) || 3;
  const mapIdx = (coord: number) =>
    netDim === cubeSize ? coord : Math.min(netDim - 1, Math.floor((coord * netDim) / cubeSize));

  const mx = mapIdx(ix);
  const my = mapIdx(iy);
  const mz = mapIdx(iz);
  const last = netDim - 1;

  let colorName: CubeColor = 'white';
  switch (face) {
    case 'U':
      colorName = faceArr[mz * netDim + mx] || 'yellow';
      break;
    case 'D':
      colorName = faceArr[(last - mz) * netDim + mx] || 'white';
      break;
    case 'F':
      colorName = faceArr[(last - my) * netDim + mx] || 'green';
      break;
    case 'B':
      colorName = faceArr[(last - my) * netDim + (last - mx)] || 'blue';
      break;
    case 'L':
      colorName = faceArr[(last - my) * netDim + mz] || 'orange';
      break;
    case 'R':
      colorName = faceArr[(last - my) * netDim + (last - mz)] || 'red';
      break;
  }

  switch (colorName) {
    case 'white':
      return 0xffffff;
    case 'yellow':
      return 0xffd000;
    case 'green':
      return 0x009b48;
    case 'blue':
      return 0x0046ad;
    case 'red':
      return 0xb71234;
    case 'orange':
      return 0xff5800;
    default:
      return fallbackColors[face];
  }
}

export const ThreeCubeViewer: React.FC<ThreeCubeViewerProps> = ({
  cubeSize = 3,
  currentMove = 'R',
  moveIndex = 0,
  currentMoveIndex,
  allMoves = [],
  cameraPreset = 'Iso',
  turnAngle = '+90.0°',
  slice = 'R',
  initialCubeState,
  activeStageHint,
  isSolved = false,
  playbackSpeed = '1.0x',
  onAnimationComplete,
  heightClassName = 'h-[320px] sm:h-[360px]',
  compact = false,
  isOrbitLocked = false,
}) => {
  const effectiveMoveIndex = currentMoveIndex !== undefined ? currentMoveIndex : moveIndex;
  const mountRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const cubeGroupRef = useRef<THREE.Group | null>(null);
  const cubeletsRef = useRef<CubeletInitialState[]>([]);
  const activeAnimationRef = useRef<ActiveAnimation | null>(null);
  const lastExecutedIndexRef = useRef<number>(effectiveMoveIndex);
  const shadowMeshRef = useRef<THREE.Mesh | null>(null);
  const onAnimationCompleteRef = useRef(onAnimationComplete);

  const offset = (cubeSize - 1) / 2;
  const cubieScale = 2.7 / cubeSize;
  const spacing = 3.0 / cubeSize;

  const snapCoord = (val: number) => (Math.round(val / spacing + offset) - offset) * spacing;

  useEffect(() => {
    onAnimationCompleteRef.current = onAnimationComplete;
  }, [onAnimationComplete]);

  // 1. Initialize Scene & Parametric N×N×N 3D Rubik's Cube
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 400;
    const height = container.clientHeight || 340;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(5.2, 4.2, 6.2);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enablePan = false;
    controls.minDistance = 4.5;
    controls.maxDistance = 12;
    controls.enabled = !isOrbitLocked;
    controlsRef.current = controls;

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 2.0);
    dirLight1.position.set(10, 15, 12);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x38bdf8, 0.6);
    dirLight2.position.set(-10, -8, -10);
    scene.add(dirLight2);

    const dirLight3 = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight3.position.set(0, -10, 10);
    scene.add(dirLight3);

    const cubeGroup = new THREE.Group();
    scene.add(cubeGroup);
    cubeGroupRef.current = cubeGroup;

    const geometry = new THREE.BoxGeometry(cubieScale, cubieScale, cubieScale);
    const cubelets: CubeletInitialState[] = [];

    for (let ix = 0; ix < cubeSize; ix++) {
      for (let iy = 0; iy < cubeSize; iy++) {
        for (let iz = 0; iz < cubeSize; iz++) {
          // Only generate surface cubies
          const isSurface =
            ix === 0 ||
            ix === cubeSize - 1 ||
            iy === 0 ||
            iy === cubeSize - 1 ||
            iz === 0 ||
            iz === cubeSize - 1;
          if (!isSurface) continue;

          const gx = ix - offset;
          const gy = iy - offset;
          const gz = iz - offset;

          const materials = [
            new THREE.MeshStandardMaterial({
              color:
                ix === cubeSize - 1
                  ? getCubeletFaceColor('R', ix, iy, iz, cubeSize, initialCubeState)
                  : 0x111317,
              roughness: 0.25,
              metalness: 0.05,
            }),
            new THREE.MeshStandardMaterial({
              color:
                ix === 0
                  ? getCubeletFaceColor('L', ix, iy, iz, cubeSize, initialCubeState)
                  : 0x111317,
              roughness: 0.25,
              metalness: 0.05,
            }),
            new THREE.MeshStandardMaterial({
              color:
                iy === cubeSize - 1
                  ? getCubeletFaceColor('U', ix, iy, iz, cubeSize, initialCubeState)
                  : 0x111317,
              roughness: 0.25,
              metalness: 0.05,
            }),
            new THREE.MeshStandardMaterial({
              color:
                iy === 0
                  ? getCubeletFaceColor('D', ix, iy, iz, cubeSize, initialCubeState)
                  : 0x111317,
              roughness: 0.25,
              metalness: 0.05,
            }),
            new THREE.MeshStandardMaterial({
              color:
                iz === cubeSize - 1
                  ? getCubeletFaceColor('F', ix, iy, iz, cubeSize, initialCubeState)
                  : 0x111317,
              roughness: 0.25,
              metalness: 0.05,
            }),
            new THREE.MeshStandardMaterial({
              color:
                iz === 0
                  ? getCubeletFaceColor('B', ix, iy, iz, cubeSize, initialCubeState)
                  : 0x111317,
              roughness: 0.25,
              metalness: 0.05,
            }),
          ];

          const mesh = new THREE.Mesh(geometry, materials);
          const initialPos = new THREE.Vector3(gx * spacing, gy * spacing, gz * spacing);
          mesh.position.copy(initialPos);
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          cubeGroup.add(mesh);

          cubelets.push({ mesh, initialPos, ix, iy, iz });
        }
      }
    }
    cubeletsRef.current = cubelets;

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

    // Replay current step if initialized mid-sequence
    snapCubeToStep(effectiveMoveIndex);

    let animId: number;
    const animate = (time: number) => {
      animId = requestAnimationFrame(animate);

      const activeAnim = activeAnimationRef.current;
      if (activeAnim) {
        const elapsed = time - activeAnim.startTime;
        const progress = Math.min(1, elapsed / activeAnim.duration);
        const ease = 1 - Math.pow(1 - progress, 3);

        activeAnim.pivot.setRotationFromAxisAngle(activeAnim.axis, activeAnim.targetAngle * ease);

        if (progress >= 1) {
          finishAnimation(activeAnim);
          activeAnimationRef.current = null;
          activeAnim.resolve();
          onAnimationCompleteRef.current?.();
        }
      }

      controls.update();
      renderer.render(scene, camera);
    };
    animId = requestAnimationFrame(animate);

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
      if (activeAnimationRef.current && cubeGroupRef.current) {
        cubeGroupRef.current.remove(activeAnimationRef.current.pivot);
        activeAnimationRef.current = null;
      }
      cubeletsRef.current.forEach(({ mesh }) => {
        mesh.geometry.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => m.dispose());
        } else if (mesh.material) {
          (mesh.material as THREE.Material).dispose();
        }
      });
      geometry.dispose();
      shadowGeo.dispose();
      shadowTex.dispose();
      shadowMat.dispose();
      controls.dispose();
      renderer.dispose();
      renderer.forceContextLoss?.();
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      rendererRef.current = null;
    };
  }, [cubeSize]);

  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.enabled = !isOrbitLocked;
    }
    if (rendererRef.current?.domElement) {
      rendererRef.current.domElement.style.touchAction = isOrbitLocked ? 'pan-y' : 'none';
    }
  }, [isOrbitLocked]);

  const finishAnimation = (anim: ActiveAnimation) => {
    const cubeGroup = cubeGroupRef.current;
    if (!cubeGroup) return;

    anim.pivot.setRotationFromAxisAngle(anim.axis, anim.targetAngle);

    anim.meshes.forEach((mesh) => {
      cubeGroup.attach(mesh);
      mesh.position.x = snapCoord(mesh.position.x);
      mesh.position.y = snapCoord(mesh.position.y);
      mesh.position.z = snapCoord(mesh.position.z);
      mesh.quaternion.normalize();
    });

    cubeGroup.remove(anim.pivot);
  };

  const snapCubeToStep = (targetIdx: number) => {
    if (activeAnimationRef.current) {
      finishAnimation(activeAnimationRef.current);
      activeAnimationRef.current = null;
    }

    const cubeGroup = cubeGroupRef.current;
    const cubelets = cubeletsRef.current;
    if (!cubeGroup || !cubelets.length) return;

    cubelets.forEach(({ mesh, initialPos }) => {
      mesh.position.copy(initialPos);
      mesh.quaternion.identity();
    });

    for (let i = 0; i < targetIdx; i++) {
      const moveObj = allMoves[i];
      if (!moveObj) continue;
      const parsed = parseMoveToRotation(moveObj.move, false, cubeSize, spacing);
      if (!parsed) continue;

      const q = new THREE.Quaternion().setFromAxisAngle(parsed.axis, parsed.angleRad);

      cubelets.forEach(({ mesh }) => {
        if (parsed.filter(mesh.position)) {
          mesh.position.applyQuaternion(q);
          mesh.position.x = snapCoord(mesh.position.x);
          mesh.position.y = snapCoord(mesh.position.y);
          mesh.position.z = snapCoord(mesh.position.z);
          mesh.quaternion.premultiply(q);
          mesh.quaternion.normalize();
        }
      });
    }

    lastExecutedIndexRef.current = targetIdx;
    onAnimationCompleteRef.current?.();
  };

  useEffect(() => {
    if (!cubeletsRef.current.length) return;
    cubeletsRef.current.forEach(({ mesh, ix, iy, iz }) => {
      const mats = mesh.material as THREE.MeshStandardMaterial[];
      if (Array.isArray(mats)) {
        if (ix === cubeSize - 1)
          mats[0].color.setHex(getCubeletFaceColor('R', ix, iy, iz, cubeSize, initialCubeState));
        if (ix === 0)
          mats[1].color.setHex(getCubeletFaceColor('L', ix, iy, iz, cubeSize, initialCubeState));
        if (iy === cubeSize - 1)
          mats[2].color.setHex(getCubeletFaceColor('U', ix, iy, iz, cubeSize, initialCubeState));
        if (iy === 0)
          mats[3].color.setHex(getCubeletFaceColor('D', ix, iy, iz, cubeSize, initialCubeState));
        if (iz === cubeSize - 1)
          mats[4].color.setHex(getCubeletFaceColor('F', ix, iy, iz, cubeSize, initialCubeState));
        if (iz === 0)
          mats[5].color.setHex(getCubeletFaceColor('B', ix, iy, iz, cubeSize, initialCubeState));
      }
    });
    snapCubeToStep(effectiveMoveIndex);
  }, [initialCubeState, cubeSize]);

  useEffect(() => {
    const prevIdx = lastExecutedIndexRef.current;
    if (effectiveMoveIndex === prevIdx) return;

    if (activeAnimationRef.current) {
      finishAnimation(activeAnimationRef.current);
      activeAnimationRef.current = null;
    }

    const diff = effectiveMoveIndex - prevIdx;
    const cubeGroup = cubeGroupRef.current;
    const cubelets = cubeletsRef.current;
    const duration = getAnimationDuration(playbackSpeed);

    if (diff === 1 && cubeGroup && cubelets.length) {
      const moveToExecute = allMoves[prevIdx];
      const parsed = moveToExecute
        ? parseMoveToRotation(moveToExecute.move, false, cubeSize, spacing)
        : null;

      if (parsed) {
        const activeMeshes = cubelets.map((c) => c.mesh).filter((m) => parsed.filter(m.position));
        const pivot = new THREE.Group();
        cubeGroup.add(pivot);
        activeMeshes.forEach((mesh) => pivot.attach(mesh));

        lastExecutedIndexRef.current = effectiveMoveIndex;
        activeAnimationRef.current = {
          pivot,
          meshes: activeMeshes,
          axis: parsed.axis,
          targetAngle: parsed.angleRad,
          startTime: performance.now(),
          duration,
          resolve: () => {},
        };
        return;
      }
    }

    if (diff === -1 && cubeGroup && cubelets.length) {
      const moveReversed = allMoves[effectiveMoveIndex];
      const parsed = moveReversed
        ? parseMoveToRotation(moveReversed.move, true, cubeSize, spacing)
        : null;

      if (parsed) {
        const activeMeshes = cubelets.map((c) => c.mesh).filter((m) => parsed.filter(m.position));
        const pivot = new THREE.Group();
        cubeGroup.add(pivot);
        activeMeshes.forEach((mesh) => pivot.attach(mesh));

        lastExecutedIndexRef.current = effectiveMoveIndex;
        activeAnimationRef.current = {
          pivot,
          meshes: activeMeshes,
          axis: parsed.axis,
          targetAngle: parsed.angleRad,
          startTime: performance.now(),
          duration,
          resolve: () => {},
        };
        return;
      }
    }

    snapCubeToStep(effectiveMoveIndex);
  }, [effectiveMoveIndex, allMoves, playbackSpeed, cubeSize]);

  useEffect(() => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

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
    <div
      className={`relative w-full ${heightClassName} shrink-0 rounded-xl bg-gradient-to-b from-[#FAFAFA] to-[#F1F3F5] border border-[#EAECEF] flex items-center justify-center overflow-hidden shadow-inner select-none`}
    >
      <div className="absolute inset-0 opacity-[0.06] bg-[radial-gradient(#111111_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

      <div className="absolute top-2.5 inset-x-2.5 z-10 flex items-center justify-between gap-2 pointer-events-none">
        <div className="flex items-center gap-1.5 shrink-0 max-w-[58%]">
          <div className="bg-white/95 backdrop-blur-md px-2 py-0.5 rounded-full border border-[#EAECEF] shadow-2xs flex items-center gap-1.5 font-mono text-[10.5px] min-w-0">
            {isSolved ? (
              <span className="text-emerald-600 font-bold">SOLVED ✓</span>
            ) : (
              <>
                <span className="font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded text-[10.5px] border border-emerald-200 shrink-0">
                  {currentMove || slice}
                </span>
                <span className="text-neutral-500 text-[10px] hidden sm:inline font-sans font-medium truncate">
                  {(allMoves[effectiveMoveIndex] as any)?.holdTip ||
                    (allMoves[effectiveMoveIndex] as any)?.explanation ||
                    `${cubeSize}x${cubeSize}x${cubeSize} · Lát cắt ${slice}`}
                </span>
              </>
            )}
          </div>
        </div>

        {activeStageHint && !compact && (
          <div className="flex-1 max-w-[45%] min-w-0 flex justify-center">
            <div className="w-auto max-w-full bg-neutral-900/90 text-white backdrop-blur-md px-2.5 py-0.5 rounded-full text-[10px] font-medium shadow-md flex items-center gap-1.5 border border-white/10">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
              <span className="truncate">{activeStageHint}</span>
            </div>
          </div>
        )}

        <div className="bg-white/95 backdrop-blur-md px-2 py-0.5 rounded-full border border-[#EAECEF] text-[9.5px] font-mono text-neutral-600 flex items-center gap-1 shadow-2xs shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="truncate max-w-[110px]">
            {compact && activeStageHint ? activeStageHint : `${cubeSize}x${cubeSize} SYNC`}
          </span>
        </div>
      </div>

      {!compact && (
        <div className="absolute top-11 left-2.5 flex items-center gap-1.5 z-10 pointer-events-none">
          <div className="bg-white/90 backdrop-blur-md px-2 py-0.5 rounded-full border border-[#EAECEF] text-[9px] font-mono text-neutral-700 shadow-2xs flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
            <span>U: VÀNG</span>
          </div>
          <div className="bg-white/90 backdrop-blur-md px-2 py-0.5 rounded-full border border-[#EAECEF] text-[9px] font-mono text-neutral-700 shadow-2xs flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-white border border-neutral-400 shrink-0" />
            <span>D: TRẮNG</span>
          </div>
        </div>
      )}

      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {isSolved ? (
        <div className="absolute right-3 bottom-2.5 pointer-events-none z-10 flex items-center gap-1.5">
          <span className="bg-emerald-600 text-white font-mono text-[10px] font-bold px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
            <span>100% SOLVED ✓</span>
          </span>
        </div>
      ) : (
        <div className="absolute right-2.5 bottom-2.5 pointer-events-none z-10 flex items-center gap-1">
          <div className="bg-[#111111]/95 backdrop-blur-md text-white px-2.5 py-1 rounded-xl shadow-lg border border-white/10 flex items-center gap-1.5 text-center">
            <span className="text-xs font-mono font-black text-emerald-400">
              {currentMove || slice}
            </span>
            <span className="text-[10px] font-mono text-neutral-400">
              {currentMove?.slice(1).includes('2') || turnAngle === '180.0°'
                ? '180°'
                : currentMove?.includes("'")
                ? '-90°'
                : '90°'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
