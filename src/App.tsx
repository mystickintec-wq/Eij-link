import React, { useState, useEffect, useCallback } from 'react';
import { HeroSection } from './components/HeroSection';
import { TwoWayWorkspace } from './components/TwoWayWorkspace';
import { TranslatorStudio } from './components/TranslatorStudio';
import { AssistantWorkspace } from './components/AssistantWorkspace';
import { TranslationWorkspace } from './components/TranslationWorkspace';
import { CaptionsWorkspace } from './components/CaptionsWorkspace';
import { DocumentsWorkspace } from './components/DocumentsWorkspace';
import { ThreeDHandViewer } from './components/ThreeDHandViewer';
import { CameraStandbyEthslGuide } from './components/CameraStandbyEthslGuide';
import { AccessibilitySettingsModal } from './components/AccessibilitySettingsModal';
import { OverviewCapabilities } from './components/OverviewCapabilities';
import { ClubPortfolio } from './components/ClubPortfolio';
import { SchoolStory } from './components/SchoolStory';
import { ArchitectureModal } from './components/ArchitectureModal';
import { CloudStorageVault } from './components/CloudStorageVault';
import { EvaluationLabModal } from './components/EvaluationLabModal';
import { ScrollAtmosphere3D } from './components/ScrollAtmosphere3D';
import { Footer } from './components/Footer';
import { VoiceAccessibilityBar } from './components/VoiceAccessibilityBar';
import { CommunicationProvider } from './context/CommunicationContext';
import {
  AppSidebar,
  AppHeader,
  MobileNavigation,
  HelpSupportModal,
} from './components/navigation';
import {
  ALL_ROUTE_ITEMS,
  AppLanguage,
  NavItemConfig,
  getAppLanguage,
  getRouteMetadata,
  resolveModuleFromHash,
} from './config/navigation';
import { Volume2, Hand, BookOpen } from 'lucide-react';
import { GESTURE_DEFINITIONS, GESTURE_LIST } from './data/gestures';
import { speechService } from './services/speechService';
import { GestureKey, ActiveModule, AccessibilitySettings } from './types';
import { Button, Card, StatusBadge, ToastProvider, WorkspaceHeader } from './components/ui';

const ACCESSIBILITY_STORAGE_KEY = 'ejjilink_accessibility_settings_v1';
const SIDEBAR_COLLAPSED_KEY = 'ejjilink_sidebar_collapsed_v1';

export default function App() {
  const [activeGestureKey, setActiveGestureKey] = useState<GestureKey | 'neutral'>('neutral');
  const [activeModule, setActiveModule] = useState<ActiveModule>(() => {
    if (typeof window !== 'undefined') {
      return resolveModuleFromHash(window.location.hash) || 'overview';
    }
    return 'overview';
  });

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
      if (saved !== null) return saved === 'true';
      // Default collapsed on tablet widths (768px - 1023px) to preserve workspace width
      return window.innerWidth >= 768 && window.innerWidth < 1024;
    } catch {
      return false;
    }
  });

  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isArchitectureOpen, setIsArchitectureOpen] = useState(false);
  const [isCloudVaultOpen, setIsCloudVaultOpen] = useState(false);
  const [isEvaluationLabOpen, setIsEvaluationLabOpen] = useState(false);
  const [isAccessibilityOpen, setIsAccessibilityOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

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

  const appLanguage: AppLanguage = getAppLanguage(accessibilitySettings.preferredLanguage);

  // Persist accessibility settings
  useEffect(() => {
    try {
      localStorage.setItem(ACCESSIBILITY_STORAGE_KEY, JSON.stringify(accessibilitySettings));
    } catch (e) {
      console.error('Failed to save accessibility settings:', e);
    }
  }, [accessibilitySettings]);

  // Persist sidebar collapsed preference
  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(isSidebarCollapsed));
    } catch {
      // ignore storage errors
    }
  }, [isSidebarCollapsed]);

  // Theme initialization
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
  }, []);

  // Sync URL hash changes (Back/Forward browser navigation)
  useEffect(() => {
    const handleHashChange = () => {
      const resolved = resolveModuleFromHash(window.location.hash);
      if (resolved) {
        setActiveModule(resolved);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const nextTheme = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('ejjilink_theme', nextTheme);
      if (nextTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return nextTheme;
    });
  }, []);

  const navigateToModule = useCallback((mod: ActiveModule) => {
    if (mod === 'settings') {
      setIsAccessibilityOpen(true);
      return;
    }

    setActiveModule(mod);
    const { item } = getRouteMetadata(mod);
    if (item.hashSlug && typeof window !== 'undefined') {
      const targetHash = `#${item.hashSlug}`;
      if (window.location.hash !== targetHash) {
        window.history.replaceState(null, '', targetHash);
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleSelectNavItem = useCallback(
    (item: NavItemConfig) => {
      if (item.kind === 'action') {
        if (item.actionId === 'open-settings') {
          setIsAccessibilityOpen(true);
        } else if (item.actionId === 'open-help') {
          setIsHelpOpen(true);
        }
        return;
      }
      if (item.moduleId) {
        navigateToModule(item.moduleId);
      }
    },
    [navigateToModule]
  );

  // Unified Keyboard Shortcuts (Alt+1..9 routes, Ctrl+B sidebar, Ctrl+, settings, Ctrl+M theme, Ctrl+K vault, Ctrl+L lab)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      const key = e.key.toLowerCase();

      if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey) {
        if (key === 'b') {
          e.preventDefault();
          setIsSidebarCollapsed((prev) => !prev);
          return;
        }
        if (key === 'k') {
          e.preventDefault();
          setIsCloudVaultOpen(true);
          return;
        }
        if (key === 'l') {
          e.preventDefault();
          setIsEvaluationLabOpen(true);
          return;
        }
        if (key === ',') {
          e.preventDefault();
          setIsAccessibilityOpen(true);
          return;
        }
        if (key === 'm') {
          e.preventDefault();
          toggleTheme();
          return;
        }
      }

      if ((e.ctrlKey || e.metaKey || e.altKey) && !e.shiftKey) {
        const num = parseInt(e.key, 10);
        if (num >= 1 && num <= ALL_ROUTE_ITEMS.length) {
          e.preventDefault();
          const routeItem = ALL_ROUTE_ITEMS[num - 1];
          if (routeItem?.moduleId) {
            navigateToModule(routeItem.moduleId);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigateToModule, toggleTheme]);

  const handleGestureChange = (gesture: GestureKey | 'neutral') => {
    setActiveGestureKey(gesture);
  };

  const handleSelectVaultGesture = (key: GestureKey) => {
    setActiveGestureKey(key);
    navigateToModule('studio');
  };

  const handleUpdateAccessibility = (newSettings: Partial<AccessibilitySettings>) => {
    setAccessibilitySettings((prev) => ({ ...prev, ...newSettings }));
  };

  const handleLanguageChange = (lang: AppLanguage) => {
    handleUpdateAccessibility({
      preferredLanguage: lang === 'am' ? 'am-ET' : 'en-US',
    });
  };

  const getTextSizeClass = () => {
    if (accessibilitySettings.textSize === 'xlarge') return 'text-lg';
    if (accessibilitySettings.textSize === 'large') return 'text-base';
    return 'text-sm';
  };

  const selectedStudioGesture =
    GESTURE_DEFINITIONS[activeGestureKey === 'neutral' ? 'hello' : activeGestureKey] ||
    GESTURE_DEFINITIONS.hello;

  return (
    <ToastProvider>
      <CommunicationProvider
        activeModule={activeModule}
        onSelectModule={navigateToModule}
        disable3D={accessibilitySettings.disable3D}
      >
      <div
        className={`min-h-screen bg-slate-50 text-slate-900 dark:bg-[#080D18] dark:text-[#F4F7FB] flex selection:bg-[#43D9E9]/30 selection:text-[#0E7490] dark:selection:text-[#43D9E9] transition-colors duration-200 relative overflow-x-hidden ${
          accessibilitySettings.highContrast ? 'contrast-125' : ''
        } ${accessibilitySettings.dyslexicFont ? 'font-mono' : ''} ${getTextSizeClass()}`}
      >
        {/* Skip to Main Content Accessibility Link */}
        <a
          href="#main-workspace"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] px-4 py-2.5 bg-[#0E7490] text-white dark:bg-[#43D9E9] dark:text-[#080D18] font-bold rounded-[8px] shadow-xl outline-none ring-2 ring-white"
        >
          Skip to main content
        </a>

        {/* Ambient 3D Neural Constellation & Axum Particle Atmosphere */}
        <ScrollAtmosphere3D disabled={accessibilitySettings.disable3D} />

        {/* Persistent Collapsible Desktop Sidebar */}
        <AppSidebar
          activeModule={activeModule}
          isCollapsed={isSidebarCollapsed}
          language={appLanguage}
          onSelectItem={handleSelectNavItem}
          onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
          onNavigateOverview={() => navigateToModule('overview')}
        />

        {/* Responsive Mobile Drawer */}
        <MobileNavigation
          isOpen={isMobileDrawerOpen}
          activeModule={activeModule}
          language={appLanguage}
          onClose={() => setIsMobileDrawerOpen(false)}
          onSelectItem={handleSelectNavItem}
          onChangeLanguage={handleLanguageChange}
          onNavigateOverview={() => navigateToModule('overview')}
        />

        {/* Application Shell Content Column (Adapts smoothly to sidebar width) */}
        <div
          className={`flex-1 min-w-0 flex flex-col min-h-screen relative z-10 transition-[padding] duration-200 ease-out ${
            isSidebarCollapsed ? 'md:pl-[72px]' : 'md:pl-[252px]'
          }`}
        >
          {/* Unified Global Top Header */}
          <AppHeader
            activeModule={activeModule}
            language={appLanguage}
            currentTheme={theme}
            isSidebarCollapsed={isSidebarCollapsed}
            isMobileDrawerOpen={isMobileDrawerOpen}
            onToggleDesktopSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
            onOpenMobileDrawer={() => setIsMobileDrawerOpen(true)}
            onNavigateOverview={() => navigateToModule('overview')}
            onChangeLanguage={handleLanguageChange}
            onToggleTheme={toggleTheme}
            onOpenHelp={() => setIsHelpOpen(true)}
            onOpenCloudVault={() => setIsCloudVaultOpen(true)}
            onOpenSettings={() => setIsAccessibilityOpen(true)}
            voiceControl={
              <VoiceAccessibilityBar
                language={appLanguage}
                onToggleTheme={toggleTheme}
                onOpenSettings={() => setIsAccessibilityOpen(true)}
                onOpenVault={() => setIsCloudVaultOpen(true)}
                onOpenLab={() => setIsEvaluationLabOpen(true)}
                onOpenArchitecture={() => setIsArchitectureOpen(true)}
              />
            }
          />

          {/* Main Workspace Area */}
          <main
            id="main-workspace"
            tabIndex={-1}
            className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-10 focus:outline-none"
          >
            {activeModule === 'overview' && (
              <div className="space-y-16 lg:space-y-20 pb-8">
                <HeroSection
                  language={appLanguage}
                  onStartDemo={() => navigateToModule('studio')}
                  onStartLiveRecognition={() => navigateToModule('live-recognition')}
                  onExplore3D={(gestureKey) => {
                    if (gestureKey) {
                      setActiveGestureKey(gestureKey);
                    }
                    navigateToModule('hand-studio');
                  }}
                />
                <OverviewCapabilities
                  language={appLanguage}
                  onNavigateModule={navigateToModule}
                  onSelectGestureFor3D={(gestureKey) => {
                    setActiveGestureKey(gestureKey);
                    navigateToModule('hand-studio');
                  }}
                />
                <SchoolStory language={appLanguage} />
                <ClubPortfolio
                  language={appLanguage}
                  onLaunchStudio={() => navigateToModule('studio')}
                  onOpenCloudVault={() => setIsCloudVaultOpen(true)}
                />
              </div>
            )}

            {activeModule === 'live-recognition' && (
              <section aria-label="Live Recognition Studio" className="mb-10">
                <TranslatorStudio
                  activeGestureKey={activeGestureKey === 'neutral' ? 'hello' : activeGestureKey}
                  onGestureRecognized={handleGestureChange}
                />
              </section>
            )}

            {activeModule === 'studio' && (
              <section id="communication-workspace" aria-label="Two-Way Communication" className="mb-10">
                <TwoWayWorkspace
                  activeGestureKey={activeGestureKey}
                  onGestureChange={handleGestureChange}
                />
              </section>
            )}

            {activeModule === 'captions' && (
              <section aria-label="Live Speech Captions" className="mb-10">
                <CaptionsWorkspace />
              </section>
            )}

            {activeModule === 'translate' && (
              <section aria-label="Language Translator" className="mb-10">
                <TranslationWorkspace />
              </section>
            )}

            {activeModule === 'assistant' && (
              <section aria-label="AI Communication Assistant" className="mb-10">
                <AssistantWorkspace />
              </section>
            )}

            {activeModule === 'documents' && (
              <section aria-label="Text Extraction OCR" className="mb-10">
                <DocumentsWorkspace />
              </section>
            )}

            {activeModule === 'hand-studio' && (
              <section aria-label="3D Hand Studio" className="mb-10 space-y-5">
                <WorkspaceHeader
                  title={appLanguage === 'am' ? '3D የእጅ እና የሰውነት እንቅስቃሴ ስቱዲዮ' : '3D Hand & Dual-Arm Kinematics Studio'}
                  description={
                    appLanguage === 'am'
                      ? 'የምልክት ቋንቋ እንቅስቃሴዎችን፣ የፊት መከታተያን እና የሰውነት አቀማመጥን በ3D ይመልከቱ።'
                      : 'Inspect articulated EthSL sign poses, face tracking orientation, and adjustable dual-arm kinematics alongside anatomical instructions.'
                  }
                  icon={<Hand className="w-5 h-5" />}
                  accent="cyan"
                  meta={
                    <>
                      <StatusBadge tone="info" className="font-mono">
                        {GESTURE_LIST.length} Signs Ready
                      </StatusBadge>
                      <span aria-hidden="true">·</span>
                      <span>Interactive Orbit &amp; Dual-Arm Kinematics</span>
                    </>
                  }
                  actions={
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => navigateToModule('vocabulary')}
                      leftIcon={<BookOpen className="w-3.5 h-3.5" />}
                    >
                      EthSL Dictionary
                    </Button>
                  }
                />

                <div className="grid lg:grid-cols-12 gap-5 items-start">
                  {/* Primary 3D Viewport */}
                  <div className="lg:col-span-8 min-w-0">
                    <ThreeDHandViewer
                      activeGestureKey={activeGestureKey}
                      onSelectGesture={handleGestureChange}
                      initialMode="preset"
                      showModeTabs={true}
                    />
                  </div>

                  {/* Sign & Kinematics Inspector */}
                  <div className="lg:col-span-4 space-y-3">
                    <Card padding="sm" className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-3xl shrink-0" aria-hidden="true">
                            {selectedStudioGesture.emoji}
                          </span>
                          <div className="min-w-0">
                            <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-[#F4F7FB] truncate">
                              {selectedStudioGesture.labelEn}
                            </h3>
                            <p className="text-sm font-ethiopic font-semibold text-[#0E7490] dark:text-[#43D9E9] truncate">
                              {selectedStudioGesture.labelAm}
                            </p>
                            <p className="text-[11px] font-mono text-slate-600 dark:text-[#A0AEC0]">
                              /{selectedStudioGesture.phoneticAm}/
                            </p>
                          </div>
                        </div>
                        <StatusBadge tone="info" className="shrink-0">
                          {selectedStudioGesture.signLanguage || 'EthSL'}
                        </StatusBadge>
                      </div>

                      <div className="p-3 rounded-[12px] bg-slate-50 dark:bg-[#172438] border border-slate-200 dark:border-[#253448] space-y-1.5">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-[#A0AEC0] block">
                          Pose &amp; Handshape Guidance
                        </span>
                        <p className="text-xs text-slate-700 dark:text-[#F4F7FB] leading-relaxed">
                          {selectedStudioGesture.poseInstructions}
                        </p>
                        <p className="text-[11px] text-slate-600 dark:text-[#A0AEC0] leading-relaxed">
                          {selectedStudioGesture.description}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => speechService.speak(selectedStudioGesture, 'en-US')}
                          leftIcon={<Volume2 className="w-3.5 h-3.5" />}
                        >
                          Speak EN
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => speechService.speak(selectedStudioGesture, 'am-ET')}
                          leftIcon={<Volume2 className="w-3.5 h-3.5 text-[#0E7490] dark:text-[#43D9E9]" />}
                        >
                          Speak AM
                        </Button>
                      </div>
                    </Card>

                    <Card padding="sm" className="space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-900 dark:text-[#F4F7FB]">
                          Sign Vocabulary Presets
                        </span>
                        <span className="text-[11px] font-mono text-slate-600 dark:text-[#A0AEC0]">
                          {GESTURE_LIST.length} Poses
                        </span>
                      </div>
                      <div
                        className="grid grid-cols-2 sm:grid-cols-3 gap-1.5"
                        role="group"
                        aria-label="Select 3D Sign Gesture"
                      >
                        {GESTURE_LIST.map((g) => {
                          const isSelected =
                            (activeGestureKey === 'neutral' ? 'hello' : activeGestureKey) === g.id;
                          return (
                            <button
                              key={g.id}
                              type="button"
                              onClick={() => handleGestureChange(g.id)}
                              className={`min-h-[34px] px-2 py-1 rounded-[8px] text-[11px] font-medium border transition-colors cursor-pointer flex items-center gap-1.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490] dark:focus-visible:ring-[#43D9E9] ${
                                isSelected
                                  ? 'bg-[#0E7490]/10 dark:bg-[#43D9E9]/15 border-[#0E7490] dark:border-[#43D9E9] text-[#0E7490] dark:text-[#43D9E9] font-semibold'
                                  : 'bg-slate-50 dark:bg-[#172438] border-slate-200 dark:border-[#253448] text-slate-700 dark:text-[#A0AEC0] hover:text-slate-900 dark:hover:text-[#F4F7FB]'
                              }`}
                            >
                              <span aria-hidden="true" className="shrink-0">
                                {g.emoji}
                              </span>
                              <span className="truncate font-ethiopic">
                                {appLanguage === 'am' ? g.labelAm : g.labelEn}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </Card>
                  </div>
                </div>
              </section>
            )}

            {activeModule === 'vocabulary' && (
              <section aria-label="Ethiopian Sign Language Vocabulary" className="mb-10">
                <CameraStandbyEthslGuide
                  variant="standalone"
                  onStartCamera={() => navigateToModule('live-recognition')}
                  onSelectGesture={(gestureKey) => {
                    setActiveGestureKey(gestureKey);
                    navigateToModule('hand-studio');
                  }}
                />
              </section>
            )}
          </main>

          {/* Global Footer */}
          <Footer />
        </div>

        {/* Centralized Accessibility & App Preferences Modal */}
        <AccessibilitySettingsModal
          isOpen={isAccessibilityOpen}
          onClose={() => setIsAccessibilityOpen(false)}
          settings={accessibilitySettings}
          onUpdateSettings={handleUpdateAccessibility}
          onOpenCloudVault={() => setIsCloudVaultOpen(true)}
        />

        {/* Help & Support Hub Modal */}
        <HelpSupportModal
          isOpen={isHelpOpen}
          language={appLanguage}
          onClose={() => setIsHelpOpen(false)}
          onOpenEvaluationLab={() => setIsEvaluationLabOpen(true)}
          onOpenArchitecture={() => setIsArchitectureOpen(true)}
          onGoToOverview={() => navigateToModule('overview')}
        />

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
      </div>
    </CommunicationProvider>
    </ToastProvider>
  );
}
