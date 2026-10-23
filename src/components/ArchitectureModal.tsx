import React from 'react';
import { X, ShieldCheck, Cloud, Cpu, Database, Lock, CheckCircle2 } from 'lucide-react';

interface ArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureModal: React.FC<ArchitectureModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-emerald-500/30 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white font-heading">System Architecture & Privacy Disclosures</h3>
              <p className="text-xs text-slate-500 dark:text-gray-400">EjjiLink AI Technical Verification & Transparency</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. On-Device vs Cloud Processing Truth */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-2 font-heading">
            <Cpu className="w-4 h-4" /> 1. Where Does Computation Occur?
          </h4>
          <div className="grid sm:grid-cols-2 gap-3 text-xs">
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-950 border border-emerald-300 dark:border-emerald-500/30 space-y-2">
              <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-heading">
                <CheckCircle2 className="w-3.5 h-3.5" /> 100% In-Browser (Local)
              </span>
              <p className="text-slate-700 dark:text-gray-300 leading-relaxed">
                <strong>Camera Frames & Video:</strong> Streamed directly from your webcam to HTML5 Video and MediaPipe Hands in browser memory.
              </p>
              <p className="text-slate-500 dark:text-gray-400">
                <strong>AI Inference:</strong> 21-landmark geometric classification runs client-side on your CPU/GPU in React.js.
              </p>
              <p className="text-slate-500 dark:text-gray-400">
                <strong>Speech Synthesis:</strong> Web Speech API synthesis executes locally on your operating system.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 space-y-2">
              <span className="font-bold text-sky-600 dark:text-sky-400 flex items-center gap-1.5 font-heading">
                <Cloud className="w-3.5 h-3.5" /> Cloud & Deployment
              </span>
              <p className="text-slate-700 dark:text-gray-300 leading-relaxed">
                <strong>Static Web Hosting:</strong> Cloud Run / static hosting delivers compiled HTML, CSS, JavaScript, and Three.js assets.
              </p>
              <p className="text-slate-500 dark:text-gray-400">
                <strong>No Video Uploads:</strong> No external API endpoints or cloud video servers receive your camera stream.
              </p>
            </div>
          </div>
        </div>

        {/* 2. Cloud Backend & Firebase Roadmap */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-2 font-heading">
            <Database className="w-4 h-4" /> 2. Data Storage & Firebase Backend Roadmap
          </h4>
          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 space-y-3 text-xs text-slate-700 dark:text-gray-300">
            <div className="flex items-start gap-2.5">
              <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 dark:text-white block font-heading">Current Storage (Version 2.0):</strong>
                Saved settings, language choices, and recent locked history are kept purely inside your browser's private <code className="text-emerald-700 dark:text-emerald-300 bg-gray-200 dark:bg-slate-900 px-1 py-0.5 rounded">localStorage</code>.
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Cloud className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 dark:text-white block font-heading">Planned Optional Cloud Sync (Firebase):</strong>
                Optional user authentication and Cloud Firestore can synchronize custom gesture profiles and vocabulary preferences without capturing video footage.
              </div>
            </div>
          </div>
        </div>

        {/* 3. Honest Disclaimer on Sign Language Translation */}
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
          <strong className="text-slate-900 dark:text-white block mb-1 font-heading">Academic & Accessibility Integrity:</strong>
          EjjiLink AI is an assistive gesture-to-phrase prototype engineered by high school students to explore human-computer interaction. It focuses on 7 explicit everyday gestures and does not claim to translate complete Ethiopian Sign Language (EthSL) or American Sign Language (ASL).
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer shadow-xs"
        >
          Got It, Return to Studio
        </button>
      </div>
    </div>
  );
};
