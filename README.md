# EjjiLink AI — Two-Way Sign Language & Accessibility Platform

EjjiLink AI bridges communication barriers between Deaf, hard-of-hearing, and hearing individuals in **English** and **Amharic (አማርኛ)** using computer vision, real-time 2D face/body/hand tracking, and AI speech models. Built with React 19, TypeScript, Vite, Tailwind CSS, MediaPipe Vision, and Express.

---

## Prerequisites

- **Node.js**: `v18.18+` or `v20+` (LTS recommended)
- **Package Manager**: `npm` (comes with Node), `pnpm`, or `bun`
- **A Gemini API Key**: [Get a free Gemini API key from Google AI Studio](https://aistudio.google.com/app/apikey)

---

## Quick Start (Local Setup)

### 1. Extract and Enter Project Directory
```bash
# If downloaded as a ZIP, unzip it and open a terminal in the project folder:
cd ejjilink-ai
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Open `.env` in your code editor and add your **Gemini API Key**:
```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
PORT=3000
NODE_ENV=development
```

*(Note: The Firebase client configuration is pre-configured in `firebase-applet-config.json` for cloud sync).*

### 4. Start the Development Server
```bash
npm run dev
```

Open your browser and navigate to:
**[http://localhost:3000](http://localhost:3000)**

---

## Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Runs the full-stack server (`server.ts` + Vite middleware) on port `3000`. |
| `npm run build` | Compiles both client static assets (`dist/`) and server bundle (`server.js`). |
| `npm start` | Starts the production server (`node server.js`). |
| `npm test` | Runs the 29 automated kinematic classifier and normalization tests. |
| `npm run lint` | Runs TypeScript type checking (`tsc --noEmit`). |

---

## Running in Production (Docker or Cloud Host)

### Build and Run:
```bash
npm run build
npm start
```

### Deploying to Render, Railway, or Google Cloud Run:
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Environment Variable**: Set `GEMINI_API_KEY` in your cloud host's dashboard.

---

## Key Features

- **Mode A (Hands to Voice)**: Real-time on-device hand gesture tracking via MediaPipe vision with 5-frame temporal smoothing.
- **Mode B (Voice/Text to Sign)**: Voice recognition (Web Speech + Gemini Transcribe) translating speech into guided 2D EthSL handshape signs and multi-step sequences.
- **2D Tracking Studio**: Real-time 2D tracking with red facial contours, red body skeleton lines, and colorful 21-point left & right hand landmarks on a dark canvas overlay alongside live text and translation.
- **UX Particle Displayer**: 3D Three.js acoustic equalizer with real-time microphone Web Audio reactivity (Spherical Equalizer, Neural Network, and Acoustic Waves).
- **Universal Translation**: English and Amharic translation for accessible communication.
- **WCAG 2.2 AA Compliant**: Full keyboard navigation, `Alt+1` to `Alt+6` workspace shortcuts, visible focus indicators, and screen reader announcements.
