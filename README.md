# SolarVerse – Explore the Solar System in AR

> "Explore Beyond Your Screen."

An interactive, educational web application that lets you explore the Solar System in 3D and Augmented Reality. Built with HTML5, CSS3, JavaScript, and Three.js.

## 🚀 How to Run

### Option 1: VS Code Live Server (Recommended)

1. Open the `solarverse` folder in VS Code.
2. Install the **Live Server** extension (by Ritwick Dey) from the Extensions Marketplace.
3. Right-click `index.html` → **Open with Live Server**.
4. The app opens in your browser at `http://127.0.0.1:5500`.

### Option 2: Python HTTP Server

```bash
cd solarverse
python -m http.server 8000
```

Open `http://localhost:8000` in your browser.

### Option 3: Node.js HTTP Server

```bash
npx http-server . -p 8000
```

Open `http://localhost:8000` in your browser.

> **Important**: You must serve via HTTP (not `file://`) because ES modules and Three.js imports require a server.

## 📱 Testing AR on Mobile

1. Serve the app over HTTPS (required for camera access). Use one of:
   - **ngrok**: `ngrok http 5500` → use the HTTPS URL on your phone.
   - **VS Code Port Forwarding**: Forward port 5500 and use the HTTPS tunnel URL.
   - **GitHub Pages**: Push to a repo and enable Pages.
2. Open the HTTPS URL on your Android/iOS device in **Chrome** (Android) or **Safari** (iOS).
3. If WebXR AR is not supported on the device, the app automatically falls back to **3D Solar System Mode** where you can still rotate, zoom, and explore the planets.

## 🎯 Features

- 🌍 Interactive 3D Solar System with all 8 planets + the Sun
- 🔄 Planet rotation and orbit animation
- ⏯ Pause/Resume and Speed controls (0.5x, 1x, 2x)
- 🏷 Toggle orbit paths and planet labels
- 🔊 Ambient space sound toggle
- 📋 Planet info cards with facts, stats, and details
- 🃏 "Explore Planets" section with cards for each planet
- 🧠 10-question Solar System quiz with scoring
- 🌌 Animated star background
- 📐 Responsive design (mobile, tablet, desktop)
- 🎨 Futuristic glassmorphism UI

## 📁 Project Structure

```
solarverse/
├── index.html      # Main HTML file
├── style.css       # All styles
├── script.js       # JavaScript application
├── assets/         # Assets directory (for textures, etc.)
└── README.md       # This file
```

## 🛠 Technologies

- HTML5 / CSS3 / JavaScript (ES Modules)
- Three.js (CDN) – 3D rendering
- WebXR API – Augmented Reality
- Web Audio API – Ambient sound
- Font Awesome – Icons
- Google Fonts (Orbitron + Inter) – Typography

## 👨‍🎓 College Mini-Project / Hackathon

This project is designed to be suitable for college-level demonstrations. It showcases:
- Modern web development practices
- 3D graphics programming with Three.js
- Responsive UI/UX design
- Interactive educational content
- AR/XR technology awareness

---

Built with ❤️ for SolarVerse
