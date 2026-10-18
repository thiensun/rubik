import * as THREE from 'three';
import { sound } from './audio.js';

// Color definitions matching official WCA competition cubes
export const CUBE_COLORS = {
  U: 0xffffff, // Up: White
  D: 0xfed700, // Down: Yellow
  L: 0xff5800, // Left: Orange
  R: 0xc41e3a, // Right: Red
  F: 0x009e60, // Front: Green
  B: 0x0051ba, // Back: Blue
  BODY: 0x11141c // Dark carbon core
};

export class RubikCube3D {
  constructor(containerElement, onMoveCallback, onSolvedCallback) {
    this.container = containerElement;
    this.onMove = onMoveCallback || (() => {});
    this.onSolved = onSolvedCallback || (() => {});

    this.scene = null;
    this.camera = null;
    this.renderer = null;

    this.cubelets = [];
    this.isAnimating = false;
    this.moveQueue = [];
    this.animationSpeed = 180; // ms per 90 deg turn

    // Raycasting & Drag interaction
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.dragStart = null;
    this.dragIntersect = null;
    this.isPointerDown = false;
    this.pointerDownPos = new THREE.Vector2();

    // Orbit camera controls
    this.isOrbiting = false;
    this.previousMousePosition = { x: 0, y: 0 };
    this.cameraDistance = 7.5;
    this.cameraTheta = Math.PI / 4;
    this.cameraPhi = Math.PI / 6;

    // Move history
    this.moveHistory = [];

    this.init();
  }

  init() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    // 1. Scene
    this.scene = new THREE.Scene();

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    this.updateCameraPosition();

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // 4. Lighting
    this.setupLighting();

    // 5. Build 3x3x3 Cubelets
    this.buildCube();

    // 6. Event Listeners
    this.bindEvents();

    // 7. Start Render Loop
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  setupLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    this.scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.8);
    dirLight1.position.set(10, 15, 12);
    dirLight1.castShadow = true;
    this.scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x00f0ff, 0.6); // Cyan rim light
    dirLight2.position.set(-12, -8, -10);
    this.scene.add(dirLight2);

    const dirLight3 = new THREE.DirectionalLight(0xa855f7, 0.4); // Purple soft accent
    dirLight3.position.set(0, -10, 10);
    this.scene.add(dirLight3);
  }

  updateCameraPosition() {
    this.camera.position.x = this.cameraDistance * Math.sin(this.cameraTheta) * Math.cos(this.cameraPhi);
    this.camera.position.y = this.cameraDistance * Math.sin(this.cameraPhi);
    this.camera.position.z = this.cameraDistance * Math.cos(this.cameraTheta) * Math.cos(this.cameraPhi);
    this.camera.lookAt(0, 0, 0);
  }

  createCubeletMaterials(x, y, z) {
    const materials = [];
    const baseMat = new THREE.MeshStandardMaterial({
      color: CUBE_COLORS.BODY,
      roughness: 0.35,
      metalness: 0.15
    });

    // Face orders in Three.js BoxGeometry:
    // 0: +X (Right / Red)
    // 1: -X (Left / Orange)
    // 2: +Y (Up / White)
    // 3: -Y (Down / Yellow)
    // 4: +Z (Front / Green)
    // 5: -Z (Back / Blue)

    const colors = [
      x === 1 ? CUBE_COLORS.R : null,
      x === -1 ? CUBE_COLORS.L : null,
      y === 1 ? CUBE_COLORS.U : null,
      y === -1 ? CUBE_COLORS.D : null,
      z === 1 ? CUBE_COLORS.F : null,
      z === -1 ? CUBE_COLORS.B : null
    ];

    for (let i = 0; i < 6; i++) {
      if (colors[i] !== null) {
        // High quality glossy sticker texture
        materials.push(new THREE.MeshStandardMaterial({
          color: colors[i],
          roughness: 0.18,
          metalness: 0.08,
          polygonOffset: true,
          polygonOffsetFactor: -1,
          polygonOffsetUnits: -1
        }));
      } else {
        materials.push(baseMat);
      }
    }

    return materials;
  }

  buildCube() {
    // Clear existing cubelets if any
    this.cubelets.forEach(c => this.scene.remove(c));
    this.cubelets = [];

    const size = 0.96;
    const spacing = 1.0;
    const geometry = new THREE.BoxGeometry(size, size, size);

    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          const materials = this.createCubeletMaterials(x, y, z);
          const cubelet = new THREE.Mesh(geometry, materials);
          cubelet.position.set(x * spacing, y * spacing, z * spacing);
          cubelet.castShadow = true;
          cubelet.receiveShadow = true;

          // Metadata for tracking
          cubelet.userData = {
            initialPosition: new THREE.Vector3(x, y, z),
            isCubelet: true
          };

          this.cubelets.push(cubelet);
          this.scene.add(cubelet);
        }
      }
    }
  }

  // Find cubelets in a given layer
  getLayerCubelets(axis, layerIndex) {
    const eps = 0.2;
    return this.cubelets.filter(c => {
      const pos = c.position[axis];
      return Math.abs(pos - layerIndex) < eps;
    });
  }

  // Execute a single standard Singmaster move
  // Examples: 'R', "R'", 'R2', 'U', 'L', 'F', 'B', 'D', 'M', 'E', 'S'
  applyMove(moveNotation, speed = null, recordHistory = true) {
    return new Promise(resolve => {
      this.moveQueue.push({ notation: moveNotation, speed, recordHistory, resolve });
      this.processQueue();
    });
  }

  processQueue() {
    if (this.isAnimating || this.moveQueue.length === 0) return;

    this.isAnimating = true;
    const { notation, speed, recordHistory, resolve } = this.moveQueue.shift();

    const turnSpeed = speed !== null ? speed : this.animationSpeed;
    const { axis, layer, angle } = this.parseNotation(notation);

    if (axis === null) {
      this.isAnimating = false;
      resolve();
      this.processQueue();
      return;
    }

    const layerCubelets = this.getLayerCubelets(axis, layer);
    const pivot = new THREE.Group();
    this.scene.add(pivot);

    layerCubelets.forEach(c => pivot.attach(c));

    if (turnSpeed > 0) {
      sound.playTurn();
    }

    const startTime = performance.now();
    const animateRotation = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / turnSpeed, 1);
      // Smooth easeInOutCubic curve
      const eased = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      pivot.rotation[axis] = angle * eased;

      if (progress < 1) {
        requestAnimationFrame(animateRotation);
      } else {
        pivot.rotation[axis] = angle;
        pivot.updateMatrixWorld(true);

        layerCubelets.forEach(c => {
          this.scene.attach(c);
          // Snap coordinates to discrete positions to avoid floating point drift
          c.position.x = Math.round(c.position.x);
          c.position.y = Math.round(c.position.y);
          c.position.z = Math.round(c.position.z);
        });

        this.scene.remove(pivot);
        this.isAnimating = false;

        if (recordHistory) {
          this.moveHistory.push(notation);
          this.onMove(notation, this.moveHistory.length);
        }

        if (this.isSolved()) {
          this.onSolved();
        }

        resolve();
        this.processQueue();
      }
    };

    if (turnSpeed === 0) {
      pivot.rotation[axis] = angle;
      pivot.updateMatrixWorld(true);
      layerCubelets.forEach(c => {
        this.scene.attach(c);
        c.position.x = Math.round(c.position.x);
        c.position.y = Math.round(c.position.y);
        c.position.z = Math.round(c.position.z);
      });
      this.scene.remove(pivot);
      this.isAnimating = false;
      if (recordHistory) {
        this.moveHistory.push(notation);
        this.onMove(notation, this.moveHistory.length);
      }
      resolve();
      this.processQueue();
    } else {
      requestAnimationFrame(animateRotation);
    }
  }

  parseNotation(notation) {
    const prime = notation.includes("'");
    const double = notation.includes("2");
    const face = notation[0].toUpperCase();

    let multiplier = 1;
    if (prime) multiplier = -1;
    if (double) multiplier = 2;

    const baseAngle = -Math.PI / 2; // Right hand rule clockwise

    switch (face) {
      case 'R': return { axis: 'x', layer: 1, angle: baseAngle * multiplier };
      case 'L': return { axis: 'x', layer: -1, angle: -baseAngle * multiplier };
      case 'U': return { axis: 'y', layer: 1, angle: baseAngle * multiplier };
      case 'D': return { axis: 'y', layer: -1, angle: -baseAngle * multiplier };
      case 'F': return { axis: 'z', layer: 1, angle: baseAngle * multiplier };
      case 'B': return { axis: 'z', layer: -1, angle: -baseAngle * multiplier };
      case 'M': return { axis: 'x', layer: 0, angle: -baseAngle * multiplier };
      case 'E': return { axis: 'y', layer: 0, angle: -baseAngle * multiplier };
      case 'S': return { axis: 'z', layer: 0, angle: baseAngle * multiplier };
      default: return { axis: null, layer: 0, angle: 0 };
    }
  }

  // Execute a sequence of moves (e.g. "R U R' U'")
  async executeSequence(movesString, speed = null, recordHistory = true) {
    const moves = movesString.trim().split(/\s+/).filter(m => m.length > 0);
    for (const move of moves) {
      await this.applyMove(move, speed, recordHistory);
    }
  }

  // Scramble the cube with 20-25 random moves
  async scramble(length = 20) {
    const faces = ['R', 'L', 'U', 'D', 'F', 'B'];
    const modifiers = ['', "'", '2'];
    const scrambleMoves = [];
    let lastFace = '';

    for (let i = 0; i < length; i++) {
      let face;
      do {
        face = faces[Math.floor(Math.random() * faces.length)];
      } while (face === lastFace);
      lastFace = face;

      const mod = modifiers[Math.floor(Math.random() * modifiers.length)];
      scrambleMoves.push(face + mod);
    }

    const scrambleString = scrambleMoves.join(' ');
    this.moveHistory = [];
    sound.playScramble();

    for (const move of scrambleMoves) {
      await this.applyMove(move, 65, false); // Quick smooth animation during scramble
    }

    return scrambleString;
  }

  // Reset cube to fresh solved state
  reset() {
    this.moveQueue = [];
    this.isAnimating = false;
    this.moveHistory = [];
    this.buildCube();
  }

  // Check if all faces have uniform color
  isSolved() {
    if (this.moveHistory.length === 0) return false;

    // Check 6 outer faces
    const faces = [
      { axis: 'x', layer: 1, normal: new THREE.Vector3(1, 0, 0) },
      { axis: 'x', layer: -1, normal: new THREE.Vector3(-1, 0, 0) },
      { axis: 'y', layer: 1, normal: new THREE.Vector3(0, 1, 0) },
      { axis: 'y', layer: -1, normal: new THREE.Vector3(0, -1, 0) },
      { axis: 'z', layer: 1, normal: new THREE.Vector3(0, 0, 1) },
      { axis: 'z', layer: -1, normal: new THREE.Vector3(0, 0, -1) }
    ];

    for (const f of faces) {
      const layerCubelets = this.getLayerCubelets(f.axis, f.layer);
      if (layerCubelets.length !== 9) return false;

      // Check sticker colors facing outer normal
      const firstMatColor = this.getStickerColor(layerCubelets[0], f.normal);
      if (!firstMatColor) return false;

      for (let i = 1; i < layerCubelets.length; i++) {
        const cColor = this.getStickerColor(layerCubelets[i], f.normal);
        if (cColor !== firstMatColor) return false;
      }
    }
    return true;
  }

  getStickerColor(cubelet, worldNormal) {
    const localNormal = worldNormal.clone().applyQuaternion(cubelet.quaternion.clone().invert()).round();
    let matIndex = -1;
    if (localNormal.x > 0.5) matIndex = 0;
    else if (localNormal.x < -0.5) matIndex = 1;
    else if (localNormal.y > 0.5) matIndex = 2;
    else if (localNormal.y < -0.5) matIndex = 3;
    else if (localNormal.z > 0.5) matIndex = 4;
    else if (localNormal.z < -0.5) matIndex = 5;

    if (matIndex >= 0 && cubelet.material[matIndex]) {
      return cubelet.material[matIndex].color.getHex();
    }
    return null;
  }

  // Mouse & Touch Interaction
  bindEvents() {
    const dom = this.renderer.domElement;

    dom.addEventListener('pointerdown', (e) => {
      this.isPointerDown = true;
      this.pointerDownPos.set(e.clientX, e.clientY);
      this.previousMousePosition = { x: e.clientX, y: e.clientY };

      const rect = dom.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.cubelets);

      if (intersects.length > 0 && e.button === 0) {
        this.dragIntersect = intersects[0];
        this.dragStart = { x: e.clientX, y: e.clientY };
        this.isOrbiting = false;
      } else {
        this.dragIntersect = null;
        this.isOrbiting = true;
      }
    });

    window.addEventListener('pointermove', (e) => {
      if (!this.isPointerDown) return;

      const deltaX = e.clientX - this.previousMousePosition.x;
      const deltaY = e.clientY - this.previousMousePosition.y;

      if (this.dragIntersect && !this.isOrbiting) {
        const totalDist = Math.hypot(e.clientX - this.dragStart.x, e.clientY - this.dragStart.y);
        if (totalDist > 25 && !this.isAnimating) {
          this.handleFaceDrag(e.clientX - this.dragStart.x, e.clientY - this.dragStart.y);
          this.dragIntersect = null;
        }
      } else if (this.isOrbiting) {
        this.cameraTheta -= deltaX * 0.008;
        this.cameraPhi = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, this.cameraPhi + deltaY * 0.008));
        this.updateCameraPosition();
      }

      this.previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('pointerup', () => {
      this.isPointerDown = false;
      this.isOrbiting = false;
      this.dragIntersect = null;
    });

    // Zoom via wheel
    dom.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.cameraDistance = Math.max(5.0, Math.min(12.0, this.cameraDistance + e.deltaY * 0.005));
      this.updateCameraPosition();
    }, { passive: false });

    // Window resize
    window.addEventListener('resize', () => {
      const w = this.container.clientWidth || window.innerWidth;
      const h = this.container.clientHeight || window.innerHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    });
  }

  // Convert 2D screen drag vector into 3D slice rotation
  handleFaceDrag(screenDx, screenDy) {
    if (!this.dragIntersect) return;

    const normal = this.dragIntersect.face.normal.clone();
    normal.transformDirection(this.dragIntersect.object.matrixWorld).round();
    const pos = this.dragIntersect.object.position;

    // Determine direction vector in camera space
    const dragVec = new THREE.Vector2(screenDx, -screenDy).normalize();

    // Mapping based on touched face normal
    if (Math.abs(normal.z) > 0.5) {
      // Front (+Z) or Back (-Z)
      if (Math.abs(dragVec.x) > Math.abs(dragVec.y)) {
        // Horizontal drag -> rotate horizontal layer (U, E, or D)
        const notation = dragVec.x > 0 ? (pos.y > 0.5 ? "U" : pos.y < -0.5 ? "D'" : "E'") : (pos.y > 0.5 ? "U'" : pos.y < -0.5 ? "D" : "E");
        this.applyMove(notation);
      } else {
        // Vertical drag -> rotate vertical layer (R, M, or L)
        const notation = dragVec.y > 0 ? (pos.x > 0.5 ? "R" : pos.x < -0.5 ? "L'" : "M'") : (pos.x > 0.5 ? "R'" : pos.x < -0.5 ? "L" : "M");
        this.applyMove(notation);
      }
    } else if (Math.abs(normal.x) > 0.5) {
      // Right (+X) or Left (-X)
      if (Math.abs(dragVec.x) > Math.abs(dragVec.y)) {
        const notation = dragVec.x > 0 ? (pos.y > 0.5 ? "U" : pos.y < -0.5 ? "D'" : "E'") : (pos.y > 0.5 ? "U'" : pos.y < -0.5 ? "D" : "E");
        this.applyMove(notation);
      } else {
        const notation = dragVec.y > 0 ? (pos.z > 0.5 ? "F" : pos.z < -0.5 ? "B'" : "S") : (pos.z > 0.5 ? "F'" : pos.z < -0.5 ? "B" : "S'");
        this.applyMove(notation);
      }
    } else if (Math.abs(normal.y) > 0.5) {
      // Up (+Y) or Down (-Y)
      if (Math.abs(dragVec.x) > Math.abs(dragVec.y)) {
        const notation = dragVec.x > 0 ? (pos.z > 0.5 ? "F" : pos.z < -0.5 ? "B'" : "S") : (pos.z > 0.5 ? "F'" : pos.z < -0.5 ? "B" : "S'");
        this.applyMove(notation);
      } else {
        const notation = dragVec.y > 0 ? (pos.x > 0.5 ? "R" : pos.x < -0.5 ? "L'" : "M'") : (pos.x > 0.5 ? "R'" : pos.x < -0.5 ? "L" : "M");
        this.applyMove(notation);
      }
    }
  }

  animate() {
    requestAnimationFrame(this.animate);
    this.renderer.render(this.scene, this.camera);
  }
}
