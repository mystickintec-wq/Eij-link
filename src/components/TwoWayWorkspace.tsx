import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Activity,
  ListChecks,
  Radio,
  Play,
  GraduationCap,
  Coffee,
  HeartHandshake
} from 'lucide-react';
import { GestureKey, SignSequence, LandmarkPoint } from '../types';
import { GESTURE_DEFINITIONS, GESTURE_LIST } from '../data/gestures';
import { SIGN_SEQUENCES, findSequencesByScenario } from '../data/signSequences';
import { TranslatorStudio } from './TranslatorStudio';
import { ThreeDHandViewer } from './ThreeDHandViewer';
import { speechService } from '../services/speechService';
import { geminiVoiceRecorder, TranscriptionResult } from '../services/transcribeService';

interface TwoWayWorkspaceProps {
  activeGestureKey: GestureKey | 'neutral';
  onGestureChange: (gesture: GestureKey | 'neutral') => void;
}

export const TwoWayWorkspace: React.FC<TwoWayWorkspaceProps> = ({
  activeGestureKey,
  onGestureChange,
}) => {
  const [activeTab, setActiveTab] = useState<'hands-to-voice' | 'voice-to-hands'>('hands-to-voice');

  // Shared live landmarks between Mode A and 3D Hand
  const [liveLandmarks, setLiveLandmarks] = useState<LandmarkPoint[]>([]);
  const [liveHandedness, setLiveHandedness] = useState<string>('Right');

  // Mode B state (Speech/Text to 3D Hands)
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [continuousListening, setContinuousListening] = useState(false);
  const [audioVolume, setAudioVolume] = useState<number>(0);
  const [transcriptionNotice, setTranscriptionNotice] = useState<string>('');
  const [selectedSequence, setSelectedSequence] = useState<SignSequence | null>(null);

  const [matchStatus, setMatchStatus] = useState<{
    matchedKey: GestureKey | null;
    isError: boolean;
    message: string;
  }>({
    matchedKey: 'hello',
    isError: false,
    message: 'Displaying "Hello" (ሰላም) on the 3D hand in React.js',
  });

  // Dictionary mapping natural queries & Amharic terms to all 12 gestures
  const dictionary: Record<string, GestureKey> = {
    hello: 'hello', hi: 'hello', hey: 'hello', greetings: 'hello', selam: 'hello', 'ሰላም': 'hello',
    'thank you': 'thank_you', thanks: 'thank_you', 'thank u': 'thank_you', grateful: 'thank_you', ameseginalehu: 'thank_you', 'አመሰግናለሁ': 'thank_you',
    yes: 'yes', yeah: 'yes', yep: 'yes', sure: 'yes', agree: 'yes', correct: 'yes', awon: 'yes', 'አዎን': 'yes',
    no: 'no', nope: 'no', nah: 'no', disagree: 'no', never: 'no', ay: 'no', 'አይ': 'no',
    help: 'help', sos: 'help', assist: 'help', assistance: 'help', emergency: 'help', danger: 'help', eredagn: 'help', 'እርዳኝ': 'help',
    water: 'water', drink: 'water', thirsty: 'water', h2o: 'water', wuha: 'water', 'ውሃ': 'water',
    please: 'please', pls: 'please', kindly: 'please', beg: 'please', ebakwo: 'please', ebakih: 'please', 'እባክዎ': 'please', 'እባክህ': 'please',
    peace: 'peace', victory: 'peace', win: 'peace', triumph: 'peace', harmony: 'peace', 'selam lehulu': 'peace', dil: 'peace', 'ሰላም ለሁሉ': 'peace', 'ድል': 'peace',
    love: 'love', 'i love you': 'love', ily: 'love', affection: 'love', heart: 'love', ewedihalehu: 'love', fikir: 'love', 'እወድሃለሁ': 'love', 'ፍቅር': 'love',
    ok: 'ok', okay: 'ok', perfect: 'ok', fine: 'ok', good: 'ok', alright: 'ok', tikkikkil: 'ok', mirt: 'ok', 'ትክክል': 'ok', 'ምርጥ': 'ok',
    call: 'call', 'call me': 'call', phone: 'call', telephone: 'call', ring: 'call', dial: 'call', dewillign: 'call', 'ደውልልኝ': 'call',
    stop: 'stop', wait: 'stop', halt: 'stop', pause: 'stop', hold: 'stop', 'hold on': 'stop', qum: 'stop', tebbiq: 'stop', 'ቁም': 'stop', 'ጠብቅ': 'stop',
  };

  // Match phrase against sequences first, then single gestures
  const matchPhrase = useCallback((query: string) => {
    const clean = query.trim().toLowerCase();
    if (!clean) {
      setMatchStatus({
        matchedKey: null,
        isError: false,
        message: 'Type or speak a phrase above to see its 3D hand gesture.',
      });
      setSelectedSequence(null);
      return;
    }

    // 1. Check multi-sign Demonstration Sequences first
    const matchedSeq = SIGN_SEQUENCES.find((s) => {
      const titleEn = s.titleEn.toLowerCase();
      const titleAm = s.titleAm.toLowerCase();
      if (clean.includes(titleEn) || titleEn.includes(clean)) return true;
      if (clean.includes(titleAm) || titleAm.includes(clean)) return true;
      return s.steps.some(
        (st) => clean.includes(st.glossEn.toLowerCase()) && s.steps.length > 1 && clean.length > 5
      );
    });

    if (matchedSeq) {
      setSelectedSequence(matchedSeq);
      const firstSign = matchedSeq.steps[0]?.signKey;
      const initialKey = firstSign && firstSign !== 'neutral' ? (firstSign as GestureKey) : 'hello';
      onGestureChange(initialKey);
      setMatchStatus({
        matchedKey: initialKey,
        isError: false,
        message: `Recognized Sequence: "${matchedSeq.titleEn}" (${matchedSeq.titleAm}). Articulating ${matchedSeq.steps.length} sign stages on the 3D hand!`,
      });
      return;
    }

    // 2. Comprehensive 12-gesture dictionary mapping
    let match: GestureKey | undefined = dictionary[clean];
    if (!match) {
      for (const [key, val] of Object.entries(dictionary)) {
        if (clean.includes(key) || key.includes(clean)) {
          match = val;
          break;
        }
      }
    }

    if (match) {
      setSelectedSequence(null);
      const def = GESTURE_DEFINITIONS[match];
      onGestureChange(match);
      setMatchStatus({
        matchedKey: match,
        isError: false,
        message: `Recognized "${def.labelEn}" (${def.labelAm}). 3D anatomical hand articulated!`,
      });
    } else {
      setSelectedSequence(null);
      setMatchStatus({
        matchedKey: null,
        isError: true,
        message: `Phrase "${query}" is not in the active vocabulary. Try: "Hello", "Thank you", "Water please", "Peace and love", "Please call me", "Help", or select a scenario below.`,
      });
    }
  }, [onGestureChange]);

  // Clean up voice recorder on unmount
  useEffect(() => {
    return () => {
      geminiVoiceRecorder.stop();
    };
  }, []);

  // Background Voice Monitor powered by hybrid engine (Web Speech + Gemini fallback)
  const toggleContinuousBackgroundVoice = async () => {
    if (geminiVoiceRecorder.isRunning() && continuousListening) {
      setContinuousListening(false);
      setIsListening(false);
      await geminiVoiceRecorder.stop();
      setTranscriptionNotice('Background voice monitor paused.');
    } else {
      setContinuousListening(true);
      setIsListening(true);
      setTranscriptionNotice('Background Voice active: Listening continuously for spoken commands...');
      try {
        await geminiVoiceRecorder.start(
          true,
          (result: TranscriptionResult) => {
            if (result.isInterim) {
              setTranscriptionNotice(`Listening: "${result.text}"...`);
            } else {
              setInputText(result.text);
              setTranscriptionNotice(`Transcribed via ${result.source}: "${result.text}"`);
              matchPhrase(result.text);
            }
          },
          (vol: number) => setAudioVolume(vol),
          (status: string) => setTranscriptionNotice(status)
        );
      } catch (err: any) {
        setContinuousListening(false);
        setIsListening(false);
        setTranscriptionNotice(`Microphone access error: ${err.message || 'Permission denied'}`);
      }
    }
  };

  // Push to speak (single utterance) powered by Gemini AI Transcribe
  const togglePushToSpeak = async () => {
    if (geminiVoiceRecorder.isRunning() && !continuousListening) {
      await geminiVoiceRecorder.stop();
      setIsListening(false);
    } else {
      if (continuousListening) {
        await geminiVoiceRecorder.stop();
        setContinuousListening(false);
      }
      setIsListening(true);
      setTranscriptionNotice('Listening... Speak now.');
      try {
        await geminiVoiceRecorder.start(
          false,
          (result: TranscriptionResult) => {
            setInputText(result.text);
            setTranscriptionNotice(`Transcribed via ${result.source}: "${result.text}"`);
            matchPhrase(result.text);
            setIsListening(false);
          },
          (vol: number) => setAudioVolume(vol),
          (status: string) => setTranscriptionNotice(status)
        );
      } catch (err: any) {
        setIsListening(false);
        setTranscriptionNotice(`Microphone error: ${err.message || 'Permission denied'}`);
      }
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    matchPhrase(inputText);
  };

  const handleSelectScenarioSequence = (seq: SignSequence) => {
    setSelectedSequence(seq);
    setInputText(seq.titleEn);
    const firstSign = seq.steps[0]?.signKey;
    if (firstSign && firstSign !== 'neutral') {
      onGestureChange(firstSign as GestureKey);
    }
    setMatchStatus({
      matchedKey: (firstSign && firstSign !== 'neutral' ? firstSign : 'hello') as GestureKey,
      isError: false,
      message: `Selected Scenario: "${seq.titleEn}" (${seq.titleAm}). Articulating ${seq.steps.length} sequential sign steps!`,
    });
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
            onLiveLandmarksUpdate={(lms, hand) => {
              setLiveLandmarks(lms);
              setLiveHandedness(hand);
            }}
          />
        </div>
      )}

      {/* Tab B Content: Voice/Text to 3D Hands (Speech-to-Sign with Gemini 3.5 Transcribe) */}
      {activeTab === 'voice-to-hands' && (
        <div className="space-y-8">
          {/* Input & Phrase Matching Search Box */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-gray-200 dark:border-amber-500/40 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="max-w-2xl space-y-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30">
                    <Sparkles className="w-3.5 h-3.5" /> Speech & Text to Sign Language
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/30">
                    gemini-3.5-transcribe
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white font-heading">
                  Translate English or Amharic Speech into 3D Hand Gestures
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-gray-400">
                  Speak into your microphone using <strong>Gemini 3.5 Transcribe</strong> or type a phrase below. EjjiLink AI matches your input and animates the 3D hand into the corresponding anatomical gesture sequence.
                </p>
              </div>

              {/* Live Audio Level Meter */}
              {isListening && (
                <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs">
                  <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
                  <div>
                    <div className="font-bold font-mono text-[11px]">Audio Level: {audioVolume}%</div>
                    <div className="w-24 bg-gray-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-75"
                        style={{ width: `${audioVolume}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleFormSubmit} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type a phrase (e.g., 'Water please', 'Hello teacher', 'Peace and love', 'Help')..."
                  className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-2xl pl-11 pr-4 py-3.5 text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all placeholder:text-gray-500"
                />
              </div>

              <div className="flex flex-wrap sm:flex-nowrap gap-2">
                {/* Background Voice Button (Continuous Gemini 3.5 Transcribe) */}
                <button
                  type="button"
                  onClick={toggleContinuousBackgroundVoice}
                  className={`px-4 py-3.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all border cursor-pointer ${
                    continuousListening
                      ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-500/20 ring-2 ring-emerald-400/50'
                      : 'bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-slate-700 dark:text-gray-300 border-gray-300 dark:border-slate-700'
                  }`}
                  title="Enable continuous background speech monitoring using gemini-3.5-transcribe"
                >
                  <Activity className={`w-4 h-4 ${continuousListening ? 'animate-pulse text-white' : 'text-emerald-500'}`} />
                  <span>{continuousListening ? 'Background Voice: ON' : 'Background Voice'}</span>
                </button>

                {/* Push to Speak Button */}
                <button
                  type="button"
                  onClick={togglePushToSpeak}
                  className={`px-4 py-3.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all border cursor-pointer ${
                    isListening && !continuousListening
                      ? 'bg-red-600 text-white border-red-500 animate-pulse'
                      : 'bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-amber-600 dark:text-amber-300 border-gray-300 dark:border-slate-700'
                  }`}
                  title="Push to speak with Gemini 3.5 Transcribe"
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  <span>{isListening ? 'Recording Speech...' : 'Push to Speak'}</span>
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

            {/* Transcription Status Banner */}
            {transcriptionNotice && (
              <div className="flex items-center justify-between p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs font-medium">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  <span>{transcriptionNotice}</span>
                </div>
                <span className="font-mono text-[10px] uppercase font-bold opacity-80">gemini-3.5-transcribe</span>
              </div>
            )}

            {/* ========================================================= */}
            {/* THREE DEMONSTRATION SCENARIOS (Phase D Requirement) */}
            {/* ========================================================= */}
            <div className="pt-2 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-gray-300 font-heading flex items-center gap-1.5">
                  <ListChecks className="w-3.5 h-3.5 text-amber-500" />
                  3 Preset Demonstration Scenarios (Multi-Sign Sequences):
                </span>
                <span className="text-[11px] text-slate-400">Click any scenario to animate full sequence</span>
              </div>

              <div className="grid md:grid-cols-3 gap-3">
                {/* Scenario 1: Classroom */}
                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 font-heading">
                    <GraduationCap className="w-4 h-4" />
                    <span>1. Classroom Communication</span>
                  </div>
                  <div className="space-y-1.5">
                    {findSequencesByScenario('classroom').map((s) => (
                      <button
                        key={s.id}
                        onClick={() => handleSelectScenarioSequence(s)}
                        className={`w-full text-left p-2 rounded-xl text-xs transition-colors flex items-center justify-between border cursor-pointer ${
                          selectedSequence?.id === s.id
                            ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-400'
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-gray-300 border-gray-200 dark:border-slate-800 hover:border-emerald-400'
                        }`}
                      >
                        <div>
                          <div className="font-semibold">{s.titleEn}</div>
                          <div className="text-[10px] text-amber-600 dark:text-amber-400 font-ethiopic">{s.titleAm}</div>
                        </div>
                        <Play className="w-3 h-3 text-emerald-500 shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Scenario 2: Service Interactions */}
                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-sky-600 dark:text-sky-400 font-heading">
                    <Coffee className="w-4 h-4" />
                    <span>2. Everyday Services</span>
                  </div>
                  <div className="space-y-1.5">
                    {findSequencesByScenario('service').map((s) => (
                      <button
                        key={s.id}
                        onClick={() => handleSelectScenarioSequence(s)}
                        className={`w-full text-left p-2 rounded-xl text-xs transition-colors flex items-center justify-between border cursor-pointer ${
                          selectedSequence?.id === s.id
                            ? 'bg-sky-500/20 text-sky-700 dark:text-sky-300 border-sky-400'
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-gray-300 border-gray-200 dark:border-slate-800 hover:border-sky-400'
                        }`}
                      >
                        <div>
                          <div className="font-semibold">{s.titleEn}</div>
                          <div className="text-[10px] text-amber-600 dark:text-amber-400 font-ethiopic">{s.titleAm}</div>
                        </div>
                        <Play className="w-3 h-3 text-sky-500 shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Scenario 3: Daily Communication */}
                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400 font-heading">
                    <HeartHandshake className="w-4 h-4" />
                    <span>3. Daily Communication</span>
                  </div>
                  <div className="space-y-1.5">
                    {findSequencesByScenario('daily').map((s) => (
                      <button
                        key={s.id}
                        onClick={() => handleSelectScenarioSequence(s)}
                        className={`w-full text-left p-2 rounded-xl text-xs transition-colors flex items-center justify-between border cursor-pointer ${
                          selectedSequence?.id === s.id
                            ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-400'
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-gray-300 border-gray-200 dark:border-slate-800 hover:border-amber-400'
                        }`}
                      >
                        <div>
                          <div className="font-semibold">{s.titleEn}</div>
                          <div className="text-[10px] text-amber-600 dark:text-amber-400 font-ethiopic">{s.titleAm}</div>
                        </div>
                        <Play className="w-3 h-3 text-amber-500 shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
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
              sequence={selectedSequence}
              liveLandmarks={liveLandmarks}
              handedness={liveHandedness}
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
