# SolarVerse – Interactive 3D & WebAR Solar System Experience

> "Explore our planetary neighborhood in real-time 3D, or place the planets directly into your physical surroundings using Web Augmented Reality."

SolarVerse is a responsive web application and space observatory built with **Next.js (App Router)** and **Three.js (WebGL)**. It features real-time procedural planetary texturing, smooth 360° touch and cursor orbit controls, live rear-camera WebAR tracking, and an astronomy quiz module.

---

## 🌟 Highlights & Key Features

- **Web Augmented Reality (WebAR)**:
  - Superimposes 3D planets into your physical room using your phone's camera stream via WebRTC (`getUserMedia`).
  - True transparent WebGL composition so planets float directly in your physical environment.
  - Zero app install required; works natively in mobile browsers (iOS Safari, Android Chrome) over HTTPS.
- **High-Contrast Phone QR Code**:
  - Prominent QR code on the landing page for instant mobile scanning.
  - Includes clear 3-step instructions (Scan → Allow Camera → View in Room).
  - If viewing directly on a smartphone, includes an **"Open AR on this phone"** alternative button.
- **Interactive 3D Planet Inspection**:
  - Select any planet to inspect it in a dedicated 3D view with 360° yaw, pitch, and roll rotation using cursor drag or touch swipe.
  - Multi-light cosmic rig ensures planets are vibrantly lit and never obscured by pitch-black shadows.
  - Clear, prominent **"← Back to Solar System"** navigation button.
- **Educational Dataset & Astronomy Quiz**:
  - Accurate physical characteristics for the Sun and all 8 planets.
  - Interactive 10-question astronomy quiz across Easy, Medium, and Hard difficulty with score tracking.

---

## 🚀 Running Locally

### Prerequisites
- Node.js 18+ installed

### Development Server
```bash
# Install dependencies
npm install

# Start Next.js development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your web browser.

### Production Build
```bash
npm run build
npm start
```

---

## ☁️ Deployment on Vercel

SolarVerse is optimized for seamless deployment on **Vercel**:
1. Push this repository to GitHub (`main` or `master` branch).
2. Import the repository in [Vercel](https://vercel.com).
3. Framework Preset: **Next.js** (detected automatically).
4. Deploy! Vercel handles HTTPS certificate issuance, camera permissions headers, and edge delivery.

**Live Deployment URL:** [https://solarverse-flame.vercel.app](https://solarverse-flame.vercel.app)

---

## 🛠 Tech Stack

- **Framework**: Next.js 14 (App Router, React 18)
- **3D Graphics**: Three.js (WebGL, OrbitControls)
- **AR / Hardware**: WebRTC Camera Stream (`navigator.mediaDevices.getUserMedia`)
- **Icons**: Lucide React
- **QR Generation**: QRCode.js (High-contrast SVG)
- **Deployment**: Vercel (HTTPS Cloud)

---

Built with ❤️ for SolarVerse — College Mini-Project & Educational Showcase.
