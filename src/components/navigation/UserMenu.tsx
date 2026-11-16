import React, { useEffect, useRef, useState } from 'react';
import {
  ChevronDown,
  Cloud,
  LogIn,
  LogOut,
  Settings,
  User as UserIcon,
  UserCheck,
} from 'lucide-react';
import {
  auth,
  googleProvider,
  onAuthStateChanged,
  signInAnonymously,
  signInWithPopup,
  signOut,
  type User,
} from '../../services/firebase';
import { AppLanguage } from '../../config/navigation';

interface UserMenuProps {
  language: AppLanguage;
  onOpenCloudVault: () => void;
  onOpenSettings: () => void;
}

export const UserMenu: React.FC<UserMenuProps> = ({
  language,
  onOpenCloudVault,
  onOpenSettings,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthError(null);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleGoogleSignIn = async () => {
    setAuthBusy(true);
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
      setIsOpen(false);
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        setAuthError(language === 'am' ? 'በGoogle መግባት አልተሳካም' : 'Google sign-in unavailable');
      }
    } finally {
      setAuthBusy(false);
    }
  };

  const handleGuestSignIn = async () => {
    setAuthBusy(true);
    setAuthError(null);
    try {
      await signInAnonymously(auth);
      setIsOpen(false);
    } catch {
      setAuthError(language === 'am' ? 'የእንግዳ መግቢያ አልተሳካም' : 'Guest sign-in failed');
    } finally {
      setAuthBusy(false);
    }
  };

  const handleSignOut = async () => {
    setAuthBusy(true);
    try {
      await signOut(auth);
      setIsOpen(false);
    } finally {
      setAuthBusy(false);
    }
  };

  const displayName = user
    ? user.isAnonymous
      ? language === 'am'
        ? 'እንግዳ ተጠቃሚ'
        : 'Guest Session'
      : user.displayName || user.email || 'Account'
    : language === 'am'
    ? 'መለያ'
    : 'Account';

  const initials = user?.displayName
    ? user.displayName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : null;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={language === 'am' ? 'የተጠቃሚ መለያ ምናሌ' : 'User account menu'}
        className="h-9 w-9 sm:w-auto px-0 sm:pl-2 sm:pr-2.5 rounded-[10px] bg-slate-100 dark:bg-[#172438] hover:bg-slate-200 dark:hover:bg-[#1E2E46] border border-slate-200 dark:border-[#253448] flex items-center justify-center sm:justify-start gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490] dark:focus-visible:ring-[#43D9E9] cursor-pointer shrink-0"
      >
        <span className="w-6 h-6 rounded-full bg-[#0E7490]/15 dark:bg-[#43D9E9]/15 text-[#0E7490] dark:text-[#43D9E9] flex items-center justify-center text-[11px] font-bold overflow-hidden shrink-0">
          {user?.photoURL ? (
            <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
          ) : initials ? (
            initials
          ) : (
            <UserIcon className="w-3.5 h-3.5" aria-hidden="true" />
          )}
        </span>
        <span className="hidden sm:inline text-xs font-semibold text-slate-800 dark:text-[#F4F7FB] max-w-[120px] truncate">
          {displayName}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={`hidden sm:block w-3.5 h-3.5 text-slate-600 dark:text-[#A0AEC0] transition-transform duration-150 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-label={language === 'am' ? 'የመለያ እርምጃዎች' : 'Account actions'}
          className="absolute right-0 mt-2 w-64 rounded-[14px] bg-white dark:bg-[#101C2C] border border-slate-200 dark:border-[#253448] shadow-xl py-2 z-50"
        >
          {/* Current Session Summary */}
          <div className="px-3.5 py-2 border-b border-slate-200 dark:border-[#253448]">
            {user ? (
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-full bg-[#0E7490]/15 dark:bg-[#43D9E9]/15 text-[#0E7490] dark:text-[#43D9E9] flex items-center justify-center text-xs font-bold overflow-hidden shrink-0">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <UserCheck className="w-4 h-4" aria-hidden="true" />
                  )}
                </span>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-900 dark:text-[#F4F7FB] truncate">
                    {displayName}
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-[#A0AEC0] truncate">
                    {user.email || (user.isAnonymous ? 'Temporary Firebase Session' : 'Cloud Sync Ready')}
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div className="text-xs font-semibold text-slate-900 dark:text-[#F4F7FB]">
                  {language === 'am' ? 'አልገቡም' : 'Not signed in'}
                </div>
                <div className="text-[11px] text-slate-600 dark:text-[#A0AEC0]">
                  {language === 'am'
                    ? 'የተቀመጡ ምልክቶችን ለማመሳሰል ይግቡ'
                    : 'Sign in to sync saved EthSL phrases'}
                </div>
              </div>
            )}
          </div>

          {authError && (
            <div className="mx-3 mt-2 px-2.5 py-1.5 rounded-[8px] bg-rose-500/10 border border-rose-500/30 text-[11px] text-rose-700 dark:text-rose-400">
              {authError}
            </div>
          )}

          {/* Account Navigation Actions */}
          <div className="py-1 px-1.5 space-y-0.5">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setIsOpen(false);
                onOpenCloudVault();
              }}
              className="w-full px-2.5 py-2 rounded-[8px] text-left text-xs font-medium text-slate-700 dark:text-[#F4F7FB] hover:bg-slate-100 dark:hover:bg-[#172438] flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <Cloud className="w-4 h-4 text-[#0E7490] dark:text-[#43D9E9]" aria-hidden="true" />
              <span>{language === 'am' ? 'የክላውድ ማከማቻ (Vault)' : 'Cloud Storage Vault'}</span>
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setIsOpen(false);
                onOpenSettings();
              }}
              className="w-full px-2.5 py-2 rounded-[8px] text-left text-xs font-medium text-slate-700 dark:text-[#F4F7FB] hover:bg-slate-100 dark:hover:bg-[#172438] flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <Settings className="w-4 h-4 text-slate-600 dark:text-[#A0AEC0]" aria-hidden="true" />
              <span>{language === 'am' ? 'ቅንብሮች እና ተደራሽነት' : 'Accessibility & Settings'}</span>
            </button>
          </div>

          {/* Auth Actions */}
          <div className="pt-1 mt-1 px-1.5 border-t border-slate-200 dark:border-[#253448] space-y-0.5">
            {!user ? (
              <>
                <button
                  type="button"
                  role="menuitem"
                  disabled={authBusy}
                  onClick={handleGoogleSignIn}
                  className="w-full px-2.5 py-2 rounded-[8px] text-left text-xs font-semibold text-[#0E7490] dark:text-[#43D9E9] hover:bg-slate-100 dark:hover:bg-[#172438] flex items-center gap-2.5 transition-colors cursor-pointer disabled:text-slate-500 disabled:cursor-not-allowed"
                >
                  <LogIn className="w-4 h-4" aria-hidden="true" />
                  <span>{language === 'am' ? 'በGoogle ይግቡ' : 'Sign in with Google'}</span>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  disabled={authBusy}
                  onClick={handleGuestSignIn}
                  className="w-full px-2.5 py-2 rounded-[8px] text-left text-xs font-medium text-slate-700 dark:text-[#A0AEC0] hover:bg-slate-100 dark:hover:bg-[#172438] flex items-center gap-2.5 transition-colors cursor-pointer disabled:text-slate-500 disabled:cursor-not-allowed"
                >
                  <UserIcon className="w-4 h-4" aria-hidden="true" />
                  <span>{language === 'am' ? 'እንደ እንግዳ ይቀጥሉ' : 'Continue as Guest'}</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                role="menuitem"
                disabled={authBusy}
                onClick={handleSignOut}
                className="w-full px-2.5 py-2 rounded-[8px] text-left text-xs font-medium text-rose-700 dark:text-rose-400 hover:bg-rose-500/10 flex items-center gap-2.5 transition-colors cursor-pointer disabled:text-slate-500 disabled:cursor-not-allowed"
              >
                <LogOut className="w-4 h-4" aria-hidden="true" />
                <span>{language === 'am' ? 'ይውጡ' : 'Sign out'}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
