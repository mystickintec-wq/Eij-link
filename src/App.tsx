import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { NavigationModuleBar } from './components/NavigationModuleBar';
import { TwoWayWorkspace } from './components/TwoWayWorkspace';
import { AssistantWorkspace } from './components/AssistantWorkspace';
import { TranslationWorkspace } from './components/TranslationWorkspace';
import { CaptionsWorkspace } from './components/CaptionsWorkspace';
import { DocumentsWorkspace } from './components/DocumentsWorkspace';
import { AccessibilitySettingsModal } from './components/AccessibilitySettingsModal';
import { CameraGuidance } from './components/CameraGuidance';
import { ClubPortfolio } from './components/ClubPortfolio';
import { SchoolStory } from './components/SchoolStory';
import { ArchitectureModal } from './components/ArchitectureModal';
import { CloudStorageVault } from './components/CloudStorageVault';
import { EvaluationLabModal } from './components/EvaluationLabModal';
import { ScrollAtmosphere3D } from './components/ScrollAtmosphere3D';
import { Footer } from './components/Footer';
import { GestureKey, ActiveModule, AccessibilitySettings } from './types';

const ACCESSIBILITY_STORAGE_KEY = 'ejjilink_accessibility_settings_v1';

export default function App() {
  const [activeGestureKey, setActiveGestureKey] = useState<GestureKey | 'neutral'>('neutral');
  const [activeModule, setActiveModule] = useState<ActiveModule>('studio');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isArchitectureOpen, setIsArchitectureOpen] = useState(false);
  const [isCloudVaultOpen, setIsCloudVaultOpen] = useState(false);
  const [isEvaluationLabOpen, setIsEvaluationLabOpen] = useState(false);
  const [isAccessibilityOpen, setIsAccessibilityOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Accessibility State
  const [accessibilitySettings, setAccessibilitySettings] = useState<AccessibilitySettings>(() => {
    try {
      const saved = localStorage.getItem(ACCESSIBILITY_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Could not read accessibility settings:', e);
    }
    return {
      textSize: 'normal',
      highContrast: false,
      dyslexicFont: false,
      screenReaderOptimized: false,
      autoSpeak: false,
      speechRate: 1.0,
      speechPitch: 1.0,
      preferredLanguage: 'en-US',
    };
  });

  // Save accessibility settings
  useEffect(() => {
    try {
      localStorage.setItem(ACCESSIBILITY_STORAGE_KEY, JSON.stringify(accessibilitySettings));
    } catch (e) {
      console.error('Failed to save accessibility settings:', e);
    }
  }, [accessibilitySettings]);

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
    setActiveModule('studio');
    document.getElementById('module-workspace')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleUpdateAccessibility = (newSettings: Partial<AccessibilitySettings>) => {
    setAccessibilitySettings((prev) => ({ ...prev, ...newSettings }));
  };

  const handleSelectModule = (mod: ActiveModule) => {
    if (mod === 'settings') {
      setIsAccessibilityOpen(true);
    } else {
      setActiveModule(mod);
      document.getElementById('module-workspace')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Typography and contrast classes based on accessibility settings
  const getTextSizeClass = () => {
    if (accessibilitySettings.textSize === 'xlarge') return 'text-lg';
    if (accessibilitySettings.textSize === 'large') return 'text-base';
    return 'text-sm';
  };

  return (
    <div className={`min-h-screen bg-slate-50 text-slate-900 dark:bg-[#030712] dark:text-slate-100 flex flex-col selection:bg-emerald-500/30 selection:text-emerald-500 transition-colors duration-300 relative ${
      accessibilitySettings.highContrast ? 'contrast-125' : ''
    } ${accessibilitySettings.dyslexicFont ? 'font-mono' : ''} ${getTextSizeClass()}`}>
      
      {/* 3D Neural Constellation & Axum Particle Atmosphere */}
      <ScrollAtmosphere3D />

      {/* Interactive Top Scroll Progress Indicator */}
      <div 
        className="fixed top-0 left-0 right-0 h-1 z-[60] bg-gradient-to-r from-emerald-500 via-amber-400 to-emerald-400 transition-all duration-100 origin-left"
        style={{ transform: `scaleX(${scrollProgress / 100})` }}
      />

      {/* Top Fixed Transparent Header */}
      <Header
        currentTheme={theme}
        onToggleTheme={toggleTheme}
        onOpenArchitecture={() => setIsArchitectureOpen(true)}
        onOpenCloudVault={() => setIsCloudVaultOpen(true)}
        onOpenEvaluationLab={() => setIsEvaluationLabOpen(true)}
        onOpenAccessibility={() => setIsAccessibilityOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 container mx-auto px-4 md:px-6 relative z-10 pt-4">
        {/* Hero Section */}
        <HeroSection
          onStartDemo={() => {
            setActiveModule('studio');
            document.getElementById('module-workspace')?.scrollIntoView({ behavior: 'smooth' });
          }}
          onExplore3D={() => {
            setActiveModule('studio');
            document.getElementById('module-workspace')?.scrollIntoView({ behavior: 'smooth' });
          }}
          onOpenCloudVault={() => setIsCloudVaultOpen(true)}
        />

        {/* Part 2: Interactive Modular Navigation Bar */}
        <div id="module-workspace" className="scroll-mt-24">
          <NavigationModuleBar
            activeModule={activeModule}
            onSelectModule={handleSelectModule}
          />
        </div>

        {/* Dynamic Modular Workspace Router */}
        <div className="mb-12">
          {activeModule === 'studio' && (
            <div id="communication-workspace">
              <TwoWayWorkspace
                activeGestureKey={activeGestureKey}
                onGestureChange={handleGestureChange}
              />
            </div>
          )}

          {activeModule === 'assistant' && (
            <AssistantWorkspace />
          )}

          {activeModule === 'translate' && (
            <TranslationWorkspace />
          )}

          {activeModule === 'captions' && (
            <CaptionsWorkspace />
          )}

          {activeModule === 'documents' && (
            <DocumentsWorkspace />
          )}
        </div>

        {/* Camera Positioning & Precision Guide */}
        <CameraGuidance />

        {/* The Ethio-Tech Initiative Portfolio (EjjiLink AI & Guzo AI) */}
        <ClubPortfolio />

        {/* Why We Built This: Ethiopian High School Story & Trust Metrics */}
        <SchoolStory />
      </main>

      {/* Centralized Accessibility & App Preferences Modal */}
      <AccessibilitySettingsModal
        isOpen={isAccessibilityOpen}
        onClose={() => setIsAccessibilityOpen(false)}
        settings={accessibilitySettings}
        onUpdateSettings={handleUpdateAccessibility}
        onOpenCloudVault={() => setIsCloudVaultOpen(true)}
      />

      {/* Scientific Recognition Evaluation & Testing Lab Modal */}
      <EvaluationLabModal
        isOpen={isEvaluationLabOpen}
        onClose={() => setIsEvaluationLabOpen(false)}
      />

      {/* Cloud Architecture & Privacy Transparency Modal (Part 2 Comprehensive) */}
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
