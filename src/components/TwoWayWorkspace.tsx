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
    <section id="communication-workspace" className="py-8 scroll-mt-20">
      {/* Workspace Navigation Tabs (Mode A vs Mode B) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200 dark:border-[rgba(148,163,184,0.12)]">
        <div>
          <span className="text-xs font-semibold text-[#22D3EE] uppercase tracking-wider block mb-1">
            Dual-Direction Accessibility Suite
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-[#F8FAFC] tracking-tight">
            Two-Way Communication Workspace
          </h2>
        </div>

        {/* Mode Selector Buttons — Segmented Control Standard */}
        <div className="flex items-center gap-1 p-1 rounded-[10px] bg-slate-100 dark:bg-[#0D1422] border border-slate-200 dark:border-[rgba(148,163,184,0.12)] shadow-xs">
          <button
            onClick={() => setActiveTab('hands-to-voice')}
            className={`px-3.5 py-2 rounded-[8px] font-semibold text-xs flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'hands-to-voice'
                ? 'bg-[#22D3EE] text-[#080D18] shadow-xs'
                : 'text-slate-600 dark:text-[#B6C2D2] hover:text-slate-900 dark:hover:text-[#F8FAFC]'
            }`}
          >
            <Hand className="w-4 h-4" />
            <span>Mode A: Hands to Voice</span>
          </button>

          <button
            onClick={() => setActiveTab('voice-to-hands')}
            className={`px-3.5 py-2 rounded-[8px] font-semibold text-xs flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'voice-to-hands'
                ? 'bg-[#22D3EE] text-[#080D18] shadow-xs'
                : 'text-slate-600 dark:text-[#B6C2D2] hover:text-slate-900 dark:hover:text-[#F8FAFC]'
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

      {/* Tab B Content: Voice/Text to 3D Hands */}
      {activeTab === 'voice-to-hands' && (
        <div className="space-y-6">
          {/* Input & Phrase Matching Search Box */}
          <div className="bg-white dark:bg-[#121C2D] rounded-[18px] p-6 sm:p-7 border border-slate-200 dark:border-[rgba(148,163,184,0.12)] shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="max-w-2xl space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-[#8493A8]">
                  <span className="font-semibold text-[#22D3EE]">Speech & Text to Sign</span>
                  <span aria-hidden="true">·</span>
                  <span>Gemini 3.5 Transcribe</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-[#F8FAFC]">
                  Translate English or Amharic Speech into 3D Hand Gestures
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-[#B6C2D2]">
                  Speak into your microphone or type a phrase below. EjjiLink AI matches your input and animates the 3D hand into the corresponding anatomical gesture sequence.
                </p>
              </div>

              {/* Live Audio Level Meter */}
              {isListening && (
                <div className="flex items-center gap-2 p-2.5 rounded-[10px] bg-red-500/10 border border-red-500/20 text-[#F87171] text-xs">
                  <Radio className="w-4 h-4 text-[#F87171]" />
                  <div>
                    <div className="font-semibold font-mono text-xs">Audio Level: {audioVolume}%</div>
                    <div className="w-24 bg-slate-200 dark:bg-[#080D18] h-1.5 rounded-full overflow-hidden mt-1">
                      <div
                        className="bg-[#22D3EE] h-full rounded-full transition-all duration-75"
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
                <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type a phrase (e.g., 'Water please', 'Hello teacher', 'Peace and love', 'Help')..."
                  className="w-full min-h-[44px] bg-slate-50 dark:bg-[#080D18] border border-slate-200 dark:border-[rgba(148,163,184,0.15)] text-slate-900 dark:text-[#F8FAFC] rounded-[10px] pl-11 pr-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-[#22D3EE]/30 focus:border-[#22D3EE] focus:outline-none transition-colors placeholder:text-[#8493A8]"
                />
              </div>

              <div className="flex flex-wrap sm:flex-nowrap gap-2">
                {/* Background Voice Button */}
                <button
                  type="button"
                  onClick={toggleContinuousBackgroundVoice}
                  className={`h-11 px-4 rounded-[10px] font-medium text-xs flex items-center justify-center gap-2 transition-colors border cursor-pointer ${
                    continuousListening
                      ? 'bg-[#22D3EE] text-[#080D18] border-[#22D3EE] font-semibold'
                      : 'bg-slate-100 dark:bg-[#19263A] hover:bg-slate-200 dark:hover:bg-[#1E2E44] text-slate-700 dark:text-[#B6C2D2] border-slate-200 dark:border-[rgba(148,163,184,0.15)]'
                  }`}
                  title="Enable continuous background speech monitoring"
                >
                  <Activity className={`w-4 h-4 ${continuousListening ? 'text-[#080D18]' : 'text-[#22D3EE]'}`} />
                  <span>{continuousListening ? 'Voice Monitor: ON' : 'Voice Monitor'}</span>
                </button>

                {/* Push to Speak Button */}
                <button
                  type="button"
                  onClick={togglePushToSpeak}
                  className={`h-11 px-4 rounded-[10px] font-medium text-xs flex items-center justify-center gap-2 transition-colors border cursor-pointer ${
                    isListening && !continuousListening
                      ? 'bg-red-500/10 text-[#F87171] border-red-500/30 font-semibold'
                      : 'bg-slate-100 dark:bg-[#19263A] hover:bg-slate-200 dark:hover:bg-[#1E2E44] text-slate-700 dark:text-[#B6C2D2] border-slate-200 dark:border-[rgba(148,163,184,0.15)]'
                  }`}
                  title="Push to speak"
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  <span>{isListening ? 'Recording...' : 'Push to Speak'}</span>
                </button>

                <button
                  type="submit"
                  className="h-11 px-5 rounded-[10px] font-semibold text-xs sm:text-sm bg-[#22D3EE] hover:bg-[#2DD4BF] text-[#080D18] shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
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

            {/* Three Demonstration Scenarios */}
            <div className="pt-2 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 dark:text-[#B6C2D2] flex items-center gap-1.5">
                  <ListChecks className="w-3.5 h-3.5 text-[#22D3EE]" />
                  Preset Demonstration Scenarios (Multi-Sign Sequences):
                </span>
                <span className="text-[11px] text-slate-400 dark:text-[#8493A8]">Click any scenario to animate</span>
              </div>

              <div className="grid md:grid-cols-3 gap-3">
                {/* Scenario 1: Classroom */}
                <div className="p-4 rounded-[14px] bg-slate-50 dark:bg-[#0D1422] border border-slate-200 dark:border-[rgba(148,163,184,0.12)] space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#22D3EE]">
                    <GraduationCap className="w-4 h-4" />
                    <span>1. Classroom Communication</span>
                  </div>
                  <div className="space-y-1.5">
                    {findSequencesByScenario('classroom').map((s) => (
                      <button
                        key={s.id}
                        onClick={() => handleSelectScenarioSequence(s)}
                        className={`w-full text-left p-2.5 rounded-[8px] text-xs transition-colors flex items-center justify-between border cursor-pointer ${
                          selectedSequence?.id === s.id
                            ? 'bg-[#22D3EE]/15 text-[#22D3EE] border-[#22D3EE]/50 font-semibold'
                            : 'bg-white dark:bg-[#121C2D] text-slate-700 dark:text-[#B6C2D2] border-slate-200 dark:border-[rgba(148,163,184,0.12)] hover:border-[#22D3EE]/40'
                        }`}
                      >
                        <div>
                          <div className="font-medium text-slate-900 dark:text-[#F8FAFC]">{s.titleEn}</div>
                          <div className="text-[11px] text-[#22D3EE] font-ethiopic">{s.titleAm}</div>
                        </div>
                        <Play className="w-3 h-3 text-[#22D3EE] shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Scenario 2: Service Interactions */}
                <div className="p-4 rounded-[14px] bg-slate-50 dark:bg-[#0D1422] border border-slate-200 dark:border-[rgba(148,163,184,0.12)] space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#2DD4BF]">
                    <Coffee className="w-4 h-4" />
                    <span>2. Everyday Services</span>
                  </div>
                  <div className="space-y-1.5">
                    {findSequencesByScenario('service').map((s) => (
                      <button
                        key={s.id}
                        onClick={() => handleSelectScenarioSequence(s)}
                        className={`w-full text-left p-2.5 rounded-[8px] text-xs transition-colors flex items-center justify-between border cursor-pointer ${
                          selectedSequence?.id === s.id
                            ? 'bg-[#2DD4BF]/15 text-[#2DD4BF] border-[#2DD4BF]/50 font-semibold'
                            : 'bg-white dark:bg-[#121C2D] text-slate-700 dark:text-[#B6C2D2] border-slate-200 dark:border-[rgba(148,163,184,0.12)] hover:border-[#2DD4BF]/40'
                        }`}
                      >
                        <div>
                          <div className="font-medium text-slate-900 dark:text-[#F8FAFC]">{s.titleEn}</div>
                          <div className="text-[11px] text-[#2DD4BF] font-ethiopic">{s.titleAm}</div>
                        </div>
                        <Play className="w-3 h-3 text-[#2DD4BF] shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Scenario 3: Daily Communication */}
                <div className="p-4 rounded-[14px] bg-slate-50 dark:bg-[#0D1422] border border-slate-200 dark:border-[rgba(148,163,184,0.12)] space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#8B5CF6]">
                    <HeartHandshake className="w-4 h-4" />
                    <span>3. Daily Communication</span>
                  </div>
                  <div className="space-y-1.5">
                    {findSequencesByScenario('daily').map((s) => (
                      <button
                        key={s.id}
                        onClick={() => handleSelectScenarioSequence(s)}
                        className={`w-full text-left p-2.5 rounded-[8px] text-xs transition-colors flex items-center justify-between border cursor-pointer ${
                          selectedSequence?.id === s.id
                            ? 'bg-[#8B5CF6]/15 text-[#8B5CF6] border-[#8B5CF6]/50 font-semibold'
                            : 'bg-white dark:bg-[#121C2D] text-slate-700 dark:text-[#B6C2D2] border-slate-200 dark:border-[rgba(148,163,184,0.12)] hover:border-[#8B5CF6]/40'
                        }`}
                      >
                        <div>
                          <div className="font-medium text-slate-900 dark:text-[#F8FAFC]">{s.titleEn}</div>
                          <div className="text-[11px] text-[#8B5CF6] font-ethiopic">{s.titleAm}</div>
                        </div>
                        <Play className="w-3 h-3 text-[#8B5CF6] shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Match Status Feedback */}
            <div
              className={`p-4 rounded-[10px] border flex items-start gap-3 text-xs leading-relaxed transition-colors ${
                matchStatus.isError
                  ? 'bg-amber-500/10 border-amber-500/20 text-[#FBBF24]'
                  : 'bg-emerald-500/10 border-emerald-500/20 text-[#34D399]'
              }`}
            >
              {matchStatus.isError ? (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <div>
                <strong className="block text-slate-900 dark:text-[#F8FAFC] mb-0.5">
                  {matchStatus.isError ? 'Unsupported Phrase' : 'Gesture Validated & Displayed'}
                </strong>
                <span className="text-slate-700 dark:text-[#B6C2D2]">{matchStatus.message}</span>
              </div>
            </div>
          </div>

          {/* 3D Hand Model Execution in Mode B */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-[#B6C2D2] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#22D3EE]" />
                Interactive 3D Hand Execution
              </h4>
              {matchedDef && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => speechService.speak(matchedDef, 'en-US')}
                    className="h-8 px-3 rounded-[8px] bg-white dark:bg-[#121C2D] hover:bg-slate-100 dark:hover:bg-[#19263A] text-xs font-medium text-[#22D3EE] border border-slate-200 dark:border-[rgba(148,163,184,0.15)] flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" /> Speak Phrase
                  </button>
                  <button
                    onClick={() => onGestureChange(matchedDef.id)}
                    className="h-8 px-3 rounded-[8px] bg-white dark:bg-[#121C2D] hover:bg-slate-100 dark:hover:bg-[#19263A] text-xs font-medium text-slate-700 dark:text-[#B6C2D2] border border-slate-200 dark:border-[rgba(148,163,184,0.15)] flex items-center gap-1.5 transition-colors cursor-pointer"
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

            {/* Gesture Details */}
            {matchedDef && (
              <div className="p-4 rounded-[14px] bg-white dark:bg-[#121C2D] border border-slate-200 dark:border-[rgba(148,163,184,0.12)] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs shadow-xs">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{matchedDef.emoji}</span>
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-[#F8FAFC] text-sm">
                      {matchedDef.labelEn} <span className="text-[#22D3EE] font-ethiopic">· {matchedDef.labelAm}</span>
                      <span className="text-slate-400 dark:text-[#8493A8] text-xs ml-2">("{matchedDef.phoneticAm}")</span>
                    </div>
                    <p className="text-slate-500 dark:text-[#8493A8] mt-0.5">{matchedDef.poseInstructions}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-mono text-[#22D3EE]">
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
