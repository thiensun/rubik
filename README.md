# 🎲 Rubik 3D Master

An interactive, ultra-smooth 3D Rubik's Cube simulator and speedcubing trainer built with **Three.js**, **Vite**, and **Modern CSS**.

## ✨ Features

- **Realistic 3D WebGL Cube**: 27 individual cubelets with chamfered geometry, official WCA color scheme, and dynamic studio lighting.
- **Direct Face Dragging**: Click and drag any sticker directly on the cube in your desired direction to rotate that slice.
- **3D Camera Orbit**: Drag the background to rotate the entire cube in 3D space with smooth inertia and zoom controls.
- **WCA Speedcubing Timer**: Hold Spacebar to prime (orange -> green), release to start, press any key to stop. Millisecond precision with Ao5, Ao12, and TPS tracking.
- **WCA Scrambler**: Generates official 20+ move random scrambles with rapid smooth animations.
- **CFOP Step-by-Step Solver Guide**: Step through solutions (Cross, F2L, OLL, PLL) or trigger one-click Auto Solve.
- **Tactile Sound System**: Web Audio API mechanical rotation click effects, scramble swoosh, timer beeps, and victory fanfare.
- **Confetti Victory Blast**: Colorful celebratory particle effect upon solving.

## 🚀 Quick Start

1. Install dependencies:
```bash
npm install
```

2. Start the local development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

## ⌨️ Controls & Shortcuts

| Action | Control / Shortcut |
|---|---|
| **Rotate Layer (Clockwise)** | <kbd>U</kbd> <kbd>D</kbd> <kbd>L</kbd> <kbd>R</kbd> <kbd>F</kbd> <kbd>B</kbd> |
| **Rotate Layer (Counter-Clockwise)** | <kbd>Shift</kbd> + <kbd>Face Key</kbd> |
| **Speedcubing Timer** | Hold <kbd>Space</kbd> for 0.3s & release |
| **Scramble Cube** | <kbd>S</kbd> |
| **Toggle Sound** | <kbd>M</kbd> |
| **Keyboard Cheatsheet** | <kbd>?</kbd> |
| **Orbit Camera** | Left/Right drag on background |
| **Rotate Slice** | Drag directly across cube stickers |
