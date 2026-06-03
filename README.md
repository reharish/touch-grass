# 🌿 Touch Grass

> **Focus hard. Touch grass harder.**

We've all been there: staring at compiler errors, writing React hooks, or debugging SQL queries for four hours straight without blinking. Your eyes are dry, your back is stiff, and you've forgotten what sunlight looks like. 

**Touch Grass** is a gorgeous, distraction-free desktop utility designed to save you from screen burnout. It runs silently in the background and dims your monitor when it's time to step away, stretch, hydrate, and reconnect with the real world.

---

## ✨ Features

- **🎯 Simple Setup**: Choose the classic Pomodoro preset (25 min focus / 5 min break) or customize your own work and break sliders.
- **🌫️ Fullscreen Zen Overlay**: When focus time ends, your primary monitor is dimmed with a smooth 40% opacity dark layer and glassmorphism backdrop blur. Content floats naturally in the center with no rectangular popup boxes.
- **🧘 Zen Break Option**: Hide all text and suggestion panels during breaks, leaving only a gentle breathing leaf animation and a soft circular countdown timer.
- **🔔 Programmatic Zen Chimes**: Pleasant transition sounds synthesized dynamically using the **Web Audio API**—no heavy audio binary files, working out of the box cross-platform.
- **⌨️ Keyboard Shortcuts**: Pressed for time? Double-tap the `Escape` key (`Esc` + `Esc`) to immediately skip the break and return to focus mode.
- **📥 Tray-only Mode**: Once you start a focus session, the dashboard closes automatically and runs inside your system tray displaying tooltips of remaining minutes. You can force breaks, pause, or quit directly from the tray context menu.
- **💾 Settings Persistence**: Your focus durations, zen options, and sound toggles are saved locally and persist across application launches.

---

## 🚀 Getting Started

### Prerequisites
You need [Node.js](https://nodejs.org) (v18+) and [npm](https://npmjs.com) installed on your system.

### Installation
Clone this repository and install the development dependencies:
```bash
git clone https://github.com/reharish/touch-grass.git
cd touch-grass
npm install
```

### Running Locally
To launch the app on your desktop, run:
```bash
npm start
```

---

## 📦 Standalone Packaging (Linux Executables)

You can compile **Touch Grass** into a standalone executable (an **AppImage** or a **.deb** installer) that runs on any Linux computer without requiring Node.js to be installed.

To build the installers, run:
```bash
npm run package
```

The compiled binaries will be output to the newly created `dist/` directory:
- `dist/Touch Grass-1.0.0.AppImage` (portable single-file executable)
- `dist/touch-grass_1.0.0_amd64.deb` (Debian/Ubuntu installation package)

---

## 🛠️ Technology Stack
- **Framework**: Electron (Main and Renderer processes)
- **Frontend**: HTML5, Vanilla CSS3 (Custom transitions and SVG rings), Vanilla JavaScript
- **Audio**: Web Audio API (Synthesizing Zen Bell oscillators)

---

## 📄 License & Maintainer
Created and maintained by **Harish** ([rengarajharish@gmail.com](mailto:rengarajharish@gmail.com)).
Distributed under the MIT License.
