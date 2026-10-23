import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { TwoWayWorkspace } from './components/TwoWayWorkspace';
import { CameraGuidance } from './components/CameraGuidance';
import { ClubPortfolio } from './components/ClubPortfolio';
import { SchoolStory } from './components/SchoolStory';
import { ArchitectureModal } from './components/ArchitectureModal';
import { CloudStorageVault } from './components/CloudStorageVault';
import { EvaluationLabModal } from './components/EvaluationLabModal';
import { ScrollAtmosphere3D } from './components/ScrollAtmosphere3D';
import { Footer } from './components/Footer';
import { GestureKey } from './types';

export default function App() {
  const [activeGestureKey, setActiveGestureKey] = useState<GestureKey | 'neutral'>('neutral');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isArchitectureOpen, setIsArchitectureOpen] = useState(false);
  const [isCloudVaultOpen, setIsCloudVaultOpen] = useState(false);
  const [isEvaluationLabOpen, setIsEvaluationLabOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const savedTheme = localStorage.getItem('ejjilink_theme') as 'dark' | 'light' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } else {
      document.documentElement.classList.add('dark');
    }

    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (totalScroll > 0) {
        const currentProgress = (window.scrollY / totalScroll) * 100;
        setScrollProgress(currentProgress);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('ejjilink_theme', nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleGestureChange = (gesture: GestureKey | 'neutral') => {
    setActiveGestureKey(gesture);
  };

  const handleSelectVaultGesture = (key: GestureKey) => {
    setActiveGestureKey(key);
    document.getElementById('communication-workspace')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#030712] dark:text-slate-100 flex flex-col selection:bg-emerald-500/30 selection:text-emerald-500 transition-colors duration-300 relative">
      {/* 3D Neural Constellation & Axum Particle Atmosphere (Interactive with Scroll & Mouse) */}
      <ScrollAtmosphere3D />

      {/* Interactive Top Scroll Progress Indicator */}
      <div 
        className="fixed top-0 left-0 right-0 h-1 z-[60] bg-gradient-to-r from-emerald-500 via-amber-400 to-emerald-400 transition-all duration-100 origin-left"
        style={{ transform: `scaleX(${scrollProgress / 100})` }}
      />

      {/* Top Fixed Transparent Header with Official Logo & Theme Toggle */}
      <Header
        currentTheme={theme}
        onToggleTheme={toggleTheme}
        onOpenArchitecture={() => setIsArchitectureOpen(true)}
        onOpenCloudVault={() => setIsCloudVaultOpen(true)}
        onOpenEvaluationLab={() => setIsEvaluationLabOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 container mx-auto px-4 md:px-6 relative z-10">
        {/* Cool Welcome & Hero Section */}
        <HeroSection
          onStartDemo={() => {
            document.getElementById('communication-workspace')?.scrollIntoView({ behavior: 'smooth' });
          }}
          onExplore3D={() => {
            document.getElementById('communication-workspace')?.scrollIntoView({ behavior: 'smooth' });
          }}
          onOpenCloudVault={() => setIsCloudVaultOpen(true)}
        />

        {/* Two-Way Communication Workspace (Mode A: Hands to Voice & Mode B: Voice/Text to 3D Hands) */}
        <TwoWayWorkspace
          activeGestureKey={activeGestureKey}
          onGestureChange={handleGestureChange}
        />

        {/* Camera Positioning & Precision Guide */}
        <CameraGuidance />

        {/* The Ethio-Tech Initiative Portfolio (EjjiLink AI & Guzo AI) */}
        <ClubPortfolio />

        {/* Why We Built This: Ethiopian High School Story & Trust Metrics */}
        <SchoolStory />
      </main>

      {/* Scientific Recognition Evaluation & Testing Lab Modal */}
      <EvaluationLabModal
        isOpen={isEvaluationLabOpen}
        onClose={() => setIsEvaluationLabOpen(false)}
      />

      {/* Cloud Architecture & Privacy Transparency Modal */}
      <ArchitectureModal
        isOpen={isArchitectureOpen}
        onClose={() => setIsArchitectureOpen(false)}
      />

      {/* Dedicated Cloud Storage & Synchronization Hub */}
      <CloudStorageVault
        isOpen={isCloudVaultOpen}
        onClose={() => setIsCloudVaultOpen(false)}
        onSelectGesture={handleSelectVaultGesture}
      />

      {/* Global Footer */}
      <Footer />
    </div>
  );
}
