import React, { useState, useEffect, useRef } from 'react';
import { 
  Hand, 
  Mic, 
  MicOff, 
  Search, 
  Volume2, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  RotateCcw,
  Layers,
  BookOpen,
  Activity
} from 'lucide-react';
import { GestureKey } from '../types';
import { GESTURE_DEFINITIONS, GESTURE_LIST } from '../data/gestures';
import { TranslatorStudio } from './TranslatorStudio';
import { ThreeDHandViewer } from './ThreeDHandViewer';
import { speechService } from '../services/speechService';

declare global {
  interface Window {
    webkitSpeechRecognition?: any;
    SpeechRecognition?: any;
  }
}

interface TwoWayWorkspaceProps {
  activeGestureKey: GestureKey | 'neutral';
  onGestureChange: (gesture: GestureKey | 'neutral') => void;
}

export const TwoWayWorkspace: React.FC<TwoWayWorkspaceProps> = ({
  activeGestureKey,
  onGestureChange,
}) => {
  const [activeTab, setActiveTab] = useState<'hands-to-voice' | 'voice-to-hands'>('hands-to-voice');

  // Mode B state (Speech/Text to 3D Hands)
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [matchStatus, setMatchStatus] = useState<{
    matchedKey: GestureKey | null;
    isError: boolean;
    message: string;
  }>({
    matchedKey: 'hello',
    isError: false,
    message: 'Displaying "Hello" (ሰላም) on the 3D hand in React.js',
  });

  const recognitionRef = useRef<any>(null);
  const isContinuousRef = useRef<boolean>(false);
  const [continuousListening, setContinuousListening] = useState<boolean>(false);

  // Keep ref in sync with state for callbacks
  useEffect(() => {
    isContinuousRef.current = continuousListening;
  }, [continuousListening]);

  // Natural Language & Synonyms Phrase Matcher
  const matchPhrase = (query: string) => {
    const clean = query.trim().toLowerCase();
    if (!clean) {
      setMatchStatus({
        matchedKey: null,
        isError: false,
        message: 'Type or speak a phrase above to see its 3D hand gesture.',
      });
      return;
    }

    // Comprehensive Dictionary mapping natural queries & Amharic terms to all 12 gestures
    const dictionary: Record<string, GestureKey> = {
      // 1. Hello
      hello: 'hello',
      hi: 'hello',
      hey: 'hello',
      greetings: 'hello',
      selam: 'hello',
      'ሰላም': 'hello',

      // 2. Thank You
      'thank you': 'thank_you',
      thanks: 'thank_you',
      'thank u': 'thank_you',
      grateful: 'thank_you',
      ameseginalehu: 'thank_you',
      'አመሰግናለሁ': 'thank_you',

      // 3. Yes
      yes: 'yes',
      yeah: 'yes',
      yep: 'yes',
      sure: 'yes',
      agree: 'yes',
      correct: 'yes',
      awon: 'yes',
      'አዎን': 'yes',

      // 4. No
      no: 'no',
      nope: 'no',
      nah: 'no',
      disagree: 'no',
      never: 'no',
      ay: 'no',
      'አይ': 'no',

      // 5. Help
      help: 'help',
      sos: 'help',
      assist: 'help',
      assistance: 'help',
      emergency: 'help',
      danger: 'help',
      eredagn: 'help',
      'እርዳኝ': 'help',

      // 6. Water
      water: 'water',
      drink: 'water',
      thirsty: 'water',
      h2o: 'water',
      wuha: 'water',
      'ውሃ': 'water',

      // 7. Please
      please: 'please',
      pls: 'please',
      kindly: 'please',
      beg: 'please',
      ebakwo: 'please',
      ebakih: 'please',
      'እባክዎ': 'please',
      'እባክህ': 'please',

      // 8. Peace / Victory
      peace: 'peace',
      victory: 'peace',
      win: 'peace',
      triumph: 'peace',
      harmony: 'peace',
      'selam lehulu': 'peace',
      dil: 'peace',
      'ሰላም ለሁሉ': 'peace',
      'ድል': 'peace',

      // 9. Love
      love: 'love',
      'i love you': 'love',
      ily: 'love',
      affection: 'love',
      heart: 'love',
      ewedihalehu: 'love',
      fikir: 'love',
      'እወድሃለሁ': 'love',
      'ፍቅር': 'love',

      // 10. Okay / Perfect
      ok: 'ok',
      okay: 'ok',
      perfect: 'ok',
      fine: 'ok',
      good: 'ok',
      alright: 'ok',
      tikkikkil: 'ok',
      mirt: 'ok',
      'ትክክል': 'ok',
      'ምርጥ': 'ok',

      // 11. Call Me
      call: 'call',
      'call me': 'call',
      phone: 'call',
      telephone: 'call',
      ring: 'call',
      dial: 'call',
      dewillign: 'call',
      'ደውልልኝ': 'call',

      // 12. Stop / Wait
      stop: 'stop',
      wait: 'stop',
      halt: 'stop',
      pause: 'stop',
      hold: 'stop',
      'hold on': 'stop',
      qum: 'stop',
      tebbiq: 'stop',
      'ቁም': 'stop',
      'ጠብቅ': 'stop',
    };

    let match: GestureKey | undefined = dictionary[clean];

    if (!match) {
      // Substring check
      for (const [key, val] of Object.entries(dictionary)) {
        if (clean.includes(key) || key.includes(clean)) {
          match = val;
          break;
        }
      }
    }

    if (match) {
      const def = GESTURE_DEFINITIONS[match];
      onGestureChange(match);
      setMatchStatus({
        matchedKey: match,
        isError: false,
        message: `Recognized "${def.labelEn}" (${def.labelAm}). 3D anatomical hand articulated!`,
      });
    } else {
      setMatchStatus({
        matchedKey: null,
        isError: true,
        message: `Phrase "${query}" is not in the active 12-gesture dictionary. Try: "Peace", "Love", "Call me", "Stop", "OK", "Hello", "Thank you", "Water", "Please", "Help", "Yes", or "No".`,
      });
    }
  };

  // Initialize Speech Recognition for Voice Input in Mode B
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const lastResultIndex = event.results.length - 1;
        const transcript = event.results[lastResultIndex][0].transcript;
        if (transcript && transcript.trim()) {
          setInputText(transcript.trim());
          matchPhrase(transcript.trim());
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error !== 'no-speech') {
          console.warn('Speech recognition warning:', event.error);
        }
      };

      recognition.onend = () => {
        // If continuous background listening is enabled, auto-restart speech recognition!
        if (isContinuousRef.current) {
          try {
            recognition.start();
          } catch (e) {
            // Already started or restarting
          }
        } else {
          setIsListening(false);
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  const toggleVoiceListening = () => {
    if (!recognitionRef.current) {
      alert('Speech Recognition is not supported by your current browser. You can type any phrase in the input box below!');
      return;
    }

    if (isListening || continuousListening) {
      setContinuousListening(false);
      isContinuousRef.current = false;
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.warn('Error starting voice recognition:', e);
      }
    }
  };

  const toggleContinuousBackgroundListening = () => {
    if (!recognitionRef.current) {
      alert('Speech Recognition is not supported by your current browser.');
      return;
    }

    if (continuousListening) {
      setContinuousListening(false);
      isContinuousRef.current = false;
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setContinuousListening(true);
      isContinuousRef.current = true;
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        // Already active
      }
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    matchPhrase(inputText);
  };

  const matchedDef = matchStatus.matchedKey ? GESTURE_DEFINITIONS[matchStatus.matchedKey] : null;

  return (
    <section id="communication-workspace" className="py-10 scroll-mt-20">
      {/* Workspace Navigation Tabs (Mode A vs Mode B) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 pb-4 border-b border-gray-200 dark:border-slate-800">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-heading">
            Dual-Direction Accessibility Suite
          </span>
          <h2 className="font-display text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Two-Way Communication Workspace
          </h2>
        </div>

        {/* Mode Selector Buttons */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-emerald-500/30 shadow-xs">
          <button
            onClick={() => setActiveTab('hands-to-voice')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'hands-to-voice'
                ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-md'
                : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Hand className="w-4 h-4" />
            <span>Mode A: Hands to Voice</span>
          </button>

          <button
            onClick={() => setActiveTab('voice-to-hands')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'voice-to-hands'
                ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-md'
                : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Mic className="w-4 h-4" />
            <span>Mode B: Voice/Text to 3D Hands</span>
          </button>
        </div>
      </div>

      {/* Tab A Content: Hands to Voice (Camera & Computer Vision) */}
      {activeTab === 'hands-to-voice' && (
        <div className="space-y-6">
          <TranslatorStudio
            activeGestureKey={activeGestureKey === 'neutral' ? 'hello' : activeGestureKey}
            onGestureRecognized={(key) => onGestureChange(key)}
          />
        </div>
      )}

      {/* Tab B Content: Voice/Text to 3D Hands (Speech-to-Sign) */}
      {activeTab === 'voice-to-hands' && (
        <div className="space-y-8">
          {/* Input & Phrase Matching Search Box */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-gray-200 dark:border-amber-500/40 shadow-xl space-y-5">
            <div className="max-w-3xl space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30">
                <Sparkles className="w-3.5 h-3.5" /> Speech & Text to Sign Language
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white font-heading">
                Translate English or Amharic Speech into 3D Hand Gestures
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-gray-400">
                Speak into your microphone or type a phrase below. EjjiLink AI matches your input in <strong>React.js</strong> and animates the 3D hand into the corresponding anatomical gesture.
              </p>
            </div>

            {/* Input Form */}
            <form onSubmit={handleFormSubmit} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type a phrase (e.g., 'Hello', 'Water', 'Thank You', 'Please', 'Help')..."
                  className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-2xl pl-11 pr-4 py-3.5 text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all placeholder:text-gray-500"
                />
              </div>

              <div className="flex flex-wrap sm:flex-nowrap gap-2">
                <button
                  type="button"
                  onClick={toggleContinuousBackgroundListening}
                  className={`px-4 py-3.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all border cursor-pointer ${
                    continuousListening
                      ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-500/20 ring-2 ring-emerald-400/50'
                      : 'bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-slate-700 dark:text-gray-300 border-gray-300 dark:border-slate-700'
                  }`}
                  title="Keep speech recognition listening continuously in the background"
                >
                  <Activity className={`w-4 h-4 ${continuousListening ? 'animate-pulse text-white' : 'text-emerald-500'}`} />
                  <span>{continuousListening ? 'Continuous: ON' : 'Background Voice'}</span>
                </button>

                <button
                  type="button"
                  onClick={toggleVoiceListening}
                  className={`px-4 py-3.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all border cursor-pointer ${
                    isListening && !continuousListening
                      ? 'bg-red-600 text-white border-red-500 animate-pulse'
                      : 'bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-amber-600 dark:text-amber-300 border-gray-300 dark:border-slate-700'
                  }`}
                  title="Click to speak once"
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  <span>{isListening ? 'Listening...' : 'Push to Speak'}</span>
                </button>

                <button
                  type="submit"
                  className="px-5 py-3.5 rounded-2xl font-bold text-xs bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Animate Hand</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>

            {/* Continuous background listening banner if active */}
            {continuousListening && (
              <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="font-semibold">Background Voice Monitor Active:</span>
                  <span className="hidden sm:inline">Keep speaking naturally. As soon as you say "Peace", "Hello", "Stop", etc., the 3D hand articulates automatically.</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-1 h-3 bg-emerald-500 animate-pulse rounded-full" />
                  <span className="w-1 h-5 bg-emerald-500 animate-pulse delay-75 rounded-full" />
                  <span className="w-1 h-4 bg-emerald-500 animate-pulse delay-150 rounded-full" />
                  <span className="w-1 h-2 bg-emerald-500 animate-pulse rounded-full" />
                </div>
              </div>
            )}

            {/* Suggested Quick Phrases */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="text-slate-500 dark:text-gray-400 font-semibold mr-1">Quick Test Phrases:</span>
              {GESTURE_LIST.map((g) => (
                <button
                  key={g.id}
                  onClick={() => {
                    setInputText(g.labelEn);
                    matchPhrase(g.labelEn);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-slate-950 dark:hover:bg-slate-800 text-slate-800 dark:text-gray-300 hover:text-slate-950 dark:hover:text-white border border-gray-200 dark:border-slate-800 hover:border-amber-500/40 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span>{g.emoji}</span>
                  <span className="font-medium">{g.labelEn}</span>
                  <span className="text-amber-600 dark:text-amber-400 text-[11px] font-ethiopic">({g.labelAm})</span>
                </button>
              ))}
            </div>

            {/* Match Status Feedback */}
            <div
              className={`p-4 rounded-2xl border flex items-start gap-3 text-xs leading-relaxed transition-all ${
                matchStatus.isError
                  ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-300 dark:border-amber-500/30 text-amber-800 dark:text-amber-200'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
              }`}
            >
              {matchStatus.isError ? (
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              )}
              <div>
                <strong className="block text-slate-900 dark:text-white mb-0.5 font-heading">
                  {matchStatus.isError ? 'Unsupported Phrase' : 'Gesture Validated & Displayed'}
                </strong>
                <span>{matchStatus.message}</span>
              </div>
            </div>
          </div>

          {/* 3D Hand Model Execution in Mode B */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-gray-300 font-heading flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                Interactive 3D Hand Execution
              </h4>
              {matchedDef && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => speechService.speak(matchedDef, 'en-US')}
                    className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-gray-200 dark:border-slate-700 flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" /> Speak Phrase
                  </button>
                  <button
                    onClick={() => onGestureChange(matchedDef.id)}
                    className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-gray-300 border border-gray-200 dark:border-slate-700 flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Replay Pose
                  </button>
                </div>
              )}
            </div>

            <ThreeDHandViewer
              activeGestureKey={activeGestureKey}
              onSelectGesture={(key) => onGestureChange(key)}
              isSimulated={true}
            />

            {/* Gesture Details Pill */}
            {matchedDef && (
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs shadow-md">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{matchedDef.emoji}</span>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white text-sm font-heading">
                      {matchedDef.labelEn} <span className="text-amber-600 dark:text-amber-400 font-ethiopic">• {matchedDef.labelAm}</span>
                      <span className="text-gray-500 text-xs ml-2">("{matchedDef.phoneticAm}")</span>
                    </div>
                    <p className="text-slate-500 dark:text-gray-400 mt-0.5">{matchedDef.poseInstructions}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 font-mono font-bold">
                    Pose: {matchedDef.id.toUpperCase()}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
