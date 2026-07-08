# 🌿 Touch Grass

> **Focus hard. Touch grass harder.**

You have been staring at VS Code for six hours. Your compiler is screaming, your flexbox layout is refusing to center, and you haven't blinked since your last git commit. Your body is currently composed of 70% caffeine, 20% stack overflow tabs, and 10% pure existential dread. 

Your doctor said you need to go outside. We built a tool to make you.

**Touch Grass** is a gorgeous, distraction-free desktop utility designed to save you from screen-induced burnout. It runs silently in the background, waiting. When your focus time is up, it forcibly (but gently) dims **all** of your connected monitors, rendering you temporarily useless to your employer so you can step away, stretch, drink water, and remember what a tree looks like.

---

## ✨ Features

- **🖥️ Multi-Screen Hostage Situation**: When it's break time, the app dims *every single one* of your connected monitors. Dimming one monitor while the other continues to blast 1000 nits of a stack overflow light-theme thread is not a break.
- **🧘 Zen Mode (The "Leave Me Alone" Option)**: Hide all text and suggestion panels during breaks, leaving only a gentle breathing leaf animation and a circular countdown. It's like a screensaver for your nervous system.
- **🔔 Non-Violent Chimes**: Dynamically synthesizes soothing transition chords using the **Web Audio API**. No generic system beep alarms that give you mini-heart attacks.
- **⌨️ The Emergency Exit**: Double-press the `Escape` key (`Esc` + `Esc` within 1 second) to immediately skip the break. Use this only if your production database is literally on fire.
- **📥 Tray-Only Ninja Mode**: Once you start a focus session, the dashboard vanishes entirely and runs in your system tray, updating its tooltip with your remaining time. 
- **💾 Settings Persistence**: Remembers your custom work/break intervals, sound preferences, and zen toggles, because configuring a timer every time you launch it is too much work.
- **⚡ CPU Optimized**: Near-zero idle CPU footprint. Keyframe animations are dynamically paused when screens are hidden, and the main dashboard uses solid opaque rendering to avoid heavy transparent GPU layer blending.

---

## 🚀 Getting Started

### Prerequisites
You need [Node.js](https://nodejs.org) (v22 recommended) and [npm](https://npmjs.com) installed.

### Installation
Clone this repository and grab the packages:
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

You can compile **Touch Grass** into a standalone executable (an **AppImage** or a **.deb** installer) that runs natively on Linux without needing Node.js installed. We've optimized the package naming convention so it installs to `/opt/touch-grass/` (all lowercase, no spaces) to bypass Chromium's unprivileged user namespace zygote bugs. 

To build the installers, run:
```bash
npm run package
```

The compiled binaries will be output to the `dist/` directory:
- `dist/touch-grass-1.3.0.AppImage` (portable single-file executable)
- `dist/touch-grass_1.3.0_amd64.deb` (Debian/Ubuntu installation package)

---

## 🛠️ Technology Stack
- **Framework**: Electron (Main and Renderer processes)
- **Frontend**: HTML5, Vanilla CSS3 (Custom transitions and SVG rings), Vanilla JavaScript
- **Audio**: Web Audio API (Synthesizing Zen Bell oscillators)

---

## 📄 License & Maintainer
Created and maintained by **Harish** ([rengarajharish@gmail.com](mailto:rengarajharish@gmail.com)).
Distributed under the MIT License.
