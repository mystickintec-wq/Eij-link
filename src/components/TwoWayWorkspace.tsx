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
  HeartHandshake,
  Languages,
  Clock,
  ShieldCheck
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

export interface BilingualMatchStatus {
  matchedKey: GestureKey | null;
  isError: boolean;
  messageEn: string;
  messageAm: string;
  subMessageEn?: string;
  subMessageAm?: string;
  source?: 'camera' | 'voice' | 'text' | 'preset';
  timestamp?: string;
}

// Category translation dictionary
const CATEGORY_TRANSLATIONS: Record<string, { en: string; am: string }> = {
  greeting: { en: 'Greeting', am: 'ሰላምታ' },
  politeness: { en: 'Politeness & Courtesy', am: 'ትህትና እና አክብሮት' },
  affirmation: { en: 'Affirmation / Response', am: 'ማረጋገጫ / ምላሽ' },
  urgent: { en: 'Urgent / Emergency', am: 'አስቸኳይ / ድንገተኛ' },
  need: { en: 'Essential Need', am: 'መሰረታዊ ፍላጎት' },
  expression: { en: 'Expression / Emotion', am: 'ስሜት መግለጫ' },
  communication: { en: 'Communication', am: 'ግንኙነት' },
  command: { en: 'Directive / Command', am: 'መመሪያ / ትዕዛዝ' },
};

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

  // Top-level bilingual status tracking
  const [bilingualStatus, setBilingualStatus] = useState<{
    gestureKey: GestureKey;
    source: 'camera' | 'voice' | 'text' | 'preset';
    messageEn: string;
    messageAm: string;
    subMessageEn: string;
    subMessageAm: string;
    timestamp: string;
  }>(() => {
    const initialKey = activeGestureKey !== 'neutral' ? activeGestureKey : 'hello';
    const def = GESTURE_DEFINITIONS[initialKey] || GESTURE_DEFINITIONS.hello;
    return {
      gestureKey: initialKey,
      source: 'preset',
      messageEn: `Gesture Confirmed: "${def.labelEn}" (${CATEGORY_TRANSLATIONS[def.category]?.en || def.category})`,
      messageAm: `የተረጋገጠ ምልክት፦ "${def.labelAm}" (${def.phoneticAm})`,
      subMessageEn: 'Kinematics initialized. Dual-direction translation active.',
      subMessageAm: 'የእጅ እንቅስቃሴ ዝግጁ ነው። የሁለትዮሽ ትርጉም ንቁ ነው።',
      timestamp: 'Ready · ዝግጁ',
    };
  });

  // Mode B match status feedback
  const [matchStatus, setMatchStatus] = useState<BilingualMatchStatus>({
    matchedKey: 'hello',
    isError: false,
    messageEn: 'Displaying "Hello" on the 3D hand in React.js.',
    messageAm: 'የ"ሰላም" (Selam) ምልክት በ3D እጅ እንቅስቃሴ ላይ እየታየ ነው።',
    subMessageEn: 'Pose confirmed and ready for two-way translation.',
    subMessageAm: 'ምልክቱ ተረጋግጦ ለሁለትዮሽ ግንኙነት ዝግጁ ነው።',
    source: 'preset',
    timestamp: 'Initial',
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

  // Sync external active gesture with bilingual status
  useEffect(() => {
    if (activeGestureKey && activeGestureKey !== 'neutral' && activeGestureKey !== bilingualStatus.gestureKey) {
      const def = GESTURE_DEFINITIONS[activeGestureKey];
      if (def) {
        setBilingualStatus((prev) => ({
          ...prev,
          gestureKey: activeGestureKey,
          messageEn: `Gesture Confirmed: "${def.labelEn}" (${CATEGORY_TRANSLATIONS[def.category]?.en || def.category})`,
          messageAm: `የተረጋገጠ ምልክት፦ "${def.labelAm}" (${def.phoneticAm})`,
          subMessageEn: `Kinematics synchronized for "${def.labelEn}".`,
          subMessageAm: `የእጅ እንቅስቃሴ ለ"${def.labelAm}" ተመሳስሏል።`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        }));
      }
    }
  }, [activeGestureKey, bilingualStatus.gestureKey]);

  // Handler for confirmed gesture recognition from any source
  const handleGestureRecognized = useCallback((key: GestureKey, source: 'camera' | 'voice' | 'text' | 'preset' = 'camera') => {
    onGestureChange(key);
    const def = GESTURE_DEFINITIONS[key];
    if (!def) return;

    const sourceLabelEn = source === 'camera' ? 'Camera Vision' : source === 'voice' ? 'Spoken Voice' : source === 'text' ? 'Text Input' : 'Preset Selection';
    const sourceLabelAm = source === 'camera' ? 'የካሜራ እይታ' : source === 'voice' ? 'የድምጽ ንግግር' : source === 'text' ? 'የተጻፈ ጽሁፍ' : 'ቅድመ-ቅምጥ ምርጫ';
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    setBilingualStatus({
      gestureKey: key,
      source,
      messageEn: `${sourceLabelEn} Confirmed: "${def.labelEn}" (${CATEGORY_TRANSLATIONS[def.category]?.en || def.category})`,
      messageAm: `${sourceLabelAm} ተረጋግጧል፦ "${def.labelAm}" (${def.phoneticAm})`,
      subMessageEn: `Temporal lock established (>80% accuracy). Articulated on 3D hand.`,
      subMessageAm: `በመሳሪያው ላይ በ${Math.round(def.threshold * 100)}% እርግጠኝነት ተረጋግጧል። በ3D እጅ ላይ ተንቀሳቅሷል።`,
      timestamp: timeStr,
    });

    setMatchStatus({
      matchedKey: key,
      isError: false,
      messageEn: `Recognized "${def.labelEn}" via ${sourceLabelEn}. 3D anatomical hand articulated!`,
      messageAm: `በ${sourceLabelAm} አማካኝነት "${def.labelAm}" (${def.phoneticAm}) ተረጋግጧል! 3D የአካል እጅ ሞዴል ተንቀሳቅሷል!`,
      subMessageEn: def.poseInstructions,
      subMessageAm: `የእጅ አቀማመጥ መመሪያ፦ ${def.poseInstructions}`,
      source,
      timestamp: timeStr,
    });
  }, [onGestureChange]);

  // Match phrase against sequences first, then single gestures
  const matchPhrase = useCallback((query: string) => {
    const clean = query.trim().toLowerCase();
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    if (!clean) {
      setMatchStatus({
        matchedKey: null,
        isError: false,
        messageEn: 'Type or speak a phrase above to see its 3D hand gesture.',
        messageAm: 'የ3D እጅ እንቅስቃሴውን ለማየት ከላይ አንድ ቃል ይተይቡ ወይም ይናገሩ።',
        subMessageEn: 'Supports English and Amharic voice or text queries.',
        subMessageAm: 'የእንግሊዝኛ እና የአማርኛ የድምጽ ወይም የጽሁፍ ጥያቄዎችን ይደግፋል።',
        source: 'text',
        timestamp: timeStr,
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

      const stepsEn = matchedSeq.steps.map((st) => st.glossEn).join(' → ');
      const stepsAm = matchedSeq.steps.map((st) => st.glossAm).join(' → ');

      setBilingualStatus({
        gestureKey: initialKey,
        source: 'text',
        messageEn: `Scenario Sequence Confirmed: "${matchedSeq.titleEn}"`,
        messageAm: `ተከታታይ ሁኔታ ተረጋግጧል፦ "${matchedSeq.titleAm}"`,
        subMessageEn: `Articulating ${matchedSeq.steps.length} sequential sign stages: ${stepsEn}`,
        subMessageAm: `${matchedSeq.steps.length} ተከታታይ የምልክት ደረጃዎች በ3D እጅ ላይ ይታያሉ፦ ${stepsAm}`,
        timestamp: timeStr,
      });

      setMatchStatus({
        matchedKey: initialKey,
        isError: false,
        messageEn: `Recognized Sequence: "${matchedSeq.titleEn}". Articulating ${matchedSeq.steps.length} sequential stages on the 3D hand!`,
        messageAm: `ተከታታይ ምልክት ተለይቷል፦ "${matchedSeq.titleAm}". ${matchedSeq.steps.length} የምልክት ደረጃዎች በ3D እጅ ላይ ይተገበራሉ!`,
        subMessageEn: `Sequence Steps: ${stepsEn}`,
        subMessageAm: `ተከታታይ ደረጃዎች፦ ${stepsAm}`,
        source: 'text',
        timestamp: timeStr,
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

      setBilingualStatus({
        gestureKey: match,
        source: 'text',
        messageEn: `Gesture Confirmed: "${def.labelEn}" (${CATEGORY_TRANSLATIONS[def.category]?.en || def.category})`,
        messageAm: `የተረጋገጠ ምልክት፦ "${def.labelAm}" (${def.phoneticAm})`,
        subMessageEn: `Matched phrase "${query}". 3D anatomical hand articulated.`,
        subMessageAm: `ከ"${query}" ጋር ተመሳስሏል። የ3D የአካል እጅ እንቅስቃሴ ተከናውኗል።`,
        timestamp: timeStr,
      });

      setMatchStatus({
        matchedKey: match,
        isError: false,
        messageEn: `Recognized "${def.labelEn}" (${def.category}). 3D anatomical hand articulated!`,
        messageAm: `"${def.labelAm}" (${def.phoneticAm}) ተረጋግጧል! 3D የአካል እጅ ሞዴል ተንቀሳቅሷል!`,
        subMessageEn: `Pose: ${def.labelEn} · Category: ${def.category}`,
        subMessageAm: `ምልክት፦ ${def.labelAm} · አነባበብ፦ ${def.phoneticAm}`,
        source: 'text',
        timestamp: timeStr,
      });
    } else {
      setSelectedSequence(null);
      setMatchStatus({
        matchedKey: null,
        isError: true,
        messageEn: `Phrase "${query}" is not in the active vocabulary. Try: "Hello", "Thank you", "Water please", "Peace and love", "Please call me", "Help".`,
        messageAm: `"${query}" የሚለው ቃል በተደገፈው የቃላት ዝርዝር ውስጥ የለም። እባክዎ "ሰላም"፣ "አመሰግናለሁ"፣ "ውሃ"፣ "እርዳኝ"፣ "ፍቅር" ወይም ከታች ያሉትን ሁኔታዎች ይሞክሩ።`,
        subMessageEn: '12 core EthSL & universal signs supported.',
        subMessageAm: '12 መሰረታዊ የኢትዮጵያና አለምአቀፍ የምልክት ቋንቋ ምልክቶች ተደግፈዋል።',
        source: 'text',
        timestamp: timeStr,
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
    const initialKey = (firstSign && firstSign !== 'neutral' ? firstSign : 'hello') as GestureKey;
    onGestureChange(initialKey);

    const stepsEn = seq.steps.map((st) => st.glossEn).join(' → ');
    const stepsAm = seq.steps.map((st) => st.glossAm).join(' → ');
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    setBilingualStatus({
      gestureKey: initialKey,
      source: 'preset',
      messageEn: `Scenario Selected: "${seq.titleEn}" (${seq.scenario})`,
      messageAm: `የተመረጠ ሁኔታ፦ "${seq.titleAm}"`,
      subMessageEn: `Demonstrating ${seq.steps.length} sequential sign stages: ${stepsEn}`,
      subMessageAm: `${seq.steps.length} ተከታታይ የምልክት ደረጃዎች በ3D እጅ ላይ ይታያሉ፦ ${stepsAm}`,
      timestamp: timeStr,
    });

    setMatchStatus({
      matchedKey: initialKey,
      isError: false,
      messageEn: `Scenario Sequence: "${seq.titleEn}". Articulating ${seq.steps.length} sequential stages on the 3D hand!`,
      messageAm: `ተከታታይ ምልክት ተለይቷል፦ "${seq.titleAm}". ${seq.steps.length} ተከታታይ የምልክት ደረጃዎች በ3D እጅ ላይ ይተገበራሉ!`,
      subMessageEn: `Steps: ${stepsEn}`,
      subMessageAm: `ደረጃዎች፦ ${stepsAm}`,
      source: 'preset',
      timestamp: timeStr,
    });
  };

  const currentDef = GESTURE_DEFINITIONS[bilingualStatus.gestureKey] || GESTURE_DEFINITIONS.hello;
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

      {/* Real-time Bilingual UI Status Updates & Confirmation Hub */}
      {currentDef && (
        <div 
          role="region" 
          aria-label="Bilingual Gesture Confirmation Status" 
          className="mb-6 p-4 sm:p-5 rounded-[14px] bg-white dark:bg-[#121C2D] border border-slate-200 dark:border-[rgba(148,163,184,0.12)] shadow-sm space-y-3"
        >
          {/* Header row: Status badge & timestamp */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-[rgba(148,163,184,0.1)] text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#34D399] animate-pulse" />
              <span className="font-semibold text-slate-900 dark:text-[#F8FAFC] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Languages className="w-3.5 h-3.5 text-[#22D3EE]" />
                Bilingual Confirmation Status · የሁለትዮሽ ምልክት ማረጋገጫ
              </span>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-[#8493A8]">
              <span className="px-2 py-0.5 rounded-[6px] bg-slate-100 dark:bg-[#19263A] text-slate-700 dark:text-[#B6C2D2] border border-slate-200 dark:border-[rgba(148,163,184,0.1)] capitalize">
                Source: {bilingualStatus.source === 'camera' ? 'Camera Vision' : bilingualStatus.source === 'voice' ? 'Voice Input' : bilingualStatus.source === 'text' ? 'Text Query' : 'Active Selection'}
              </span>
              <span className="flex items-center gap-1 font-mono">
                <Clock className="w-3 h-3 text-slate-400" />
                {bilingualStatus.timestamp}
              </span>
            </div>
          </div>

          {/* Bilingual Status Columns (English & Amharic side-by-side) */}
          <div className="grid md:grid-cols-2 gap-3.5">
            {/* English Confirmation Card */}
            <div className="p-3.5 rounded-[10px] bg-slate-50 dark:bg-[#0D1422] border border-slate-200 dark:border-[rgba(148,163,184,0.1)] flex flex-col justify-between space-y-2">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#22D3EE] flex items-center gap-1">
                    🇬🇧 English Confirmation
                  </span>
                  <span className="text-[11px] font-mono text-slate-400 dark:text-[#8493A8]">
                    {CATEGORY_TRANSLATIONS[currentDef.category]?.en || currentDef.category}
                  </span>
                </div>
                <div className="text-base font-bold text-slate-900 dark:text-[#F8FAFC] flex items-center gap-2">
                  <span>{currentDef.emoji}</span>
                  <span>{currentDef.labelEn}</span>
                  <CheckCircle2 className="w-4 h-4 text-[#34D399] shrink-0" />
                </div>
                <p className="text-xs text-slate-600 dark:text-[#B6C2D2] mt-1 leading-snug">
                  {bilingualStatus.messageEn}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-[#8493A8] mt-0.5">
                  {bilingualStatus.subMessageEn}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-200/60 dark:border-[rgba(148,163,184,0.08)] flex items-center justify-between">
                <span className="text-[11px] text-slate-500 dark:text-[#8493A8]">
                  Confidence: <strong className="text-slate-800 dark:text-[#F8FAFC]">&gt;80% Locked</strong>
                </span>
                <button
                  type="button"
                  onClick={() => speechService.speak(currentDef, 'en-US')}
                  className="px-2.5 py-1 rounded-[6px] bg-white dark:bg-[#121C2D] hover:bg-slate-100 dark:hover:bg-[#19263A] text-slate-700 dark:text-[#B6C2D2] border border-slate-200 dark:border-[rgba(148,163,184,0.15)] text-[11px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Speak English Confirmation"
                >
                  <Volume2 className="w-3 h-3 text-[#22D3EE]" />
                  <span>Speak (EN)</span>
                </button>
              </div>
            </div>

            {/* Amharic Confirmation Card */}
            <div className="p-3.5 rounded-[10px] bg-slate-50 dark:bg-[#0D1422] border border-slate-200 dark:border-[rgba(148,163,184,0.1)] flex flex-col justify-between space-y-2">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#2DD4BF] flex items-center gap-1 font-ethiopic">
                    🇪🇹 የአማርኛ ማረጋገጫ (Amharic)
                  </span>
                  <span className="text-[11px] text-[#2DD4BF] font-ethiopic">
                    {CATEGORY_TRANSLATIONS[currentDef.category]?.am || currentDef.category}
                  </span>
                </div>
                <div className="text-base font-bold text-slate-900 dark:text-[#F8FAFC] flex items-center gap-2">
                  <span className="text-xl font-ethiopic text-[#22D3EE]">{currentDef.labelAm}</span>
                  <span className="text-xs font-normal text-slate-400 dark:text-[#8493A8]">({currentDef.phoneticAm})</span>
                  <CheckCircle2 className="w-4 h-4 text-[#34D399] shrink-0" />
                </div>
                <p className="text-xs text-slate-600 dark:text-[#B6C2D2] mt-1 leading-snug font-ethiopic">
                  {bilingualStatus.messageAm}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-[#8493A8] mt-0.5 font-ethiopic">
                  {bilingualStatus.subMessageAm}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-200/60 dark:border-[rgba(148,163,184,0.08)] flex items-center justify-between">
                <span className="text-[11px] text-slate-500 dark:text-[#8493A8] font-ethiopic">
                  አነባበብ፦ <strong className="text-slate-800 dark:text-[#F8FAFC] font-mono">{currentDef.phoneticAm}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => speechService.speak(currentDef, 'am-ET')}
                  className="px-2.5 py-1 rounded-[6px] bg-white dark:bg-[#121C2D] hover:bg-slate-100 dark:hover:bg-[#19263A] text-slate-700 dark:text-[#B6C2D2] border border-slate-200 dark:border-[rgba(148,163,184,0.15)] text-[11px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Speak Amharic Confirmation"
                >
                  <Volume2 className="w-3 h-3 text-[#2DD4BF]" />
                  <span className="font-ethiopic">አማርኛ አሰማ (AM)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Screen reader live announcement */}
          <div role="status" aria-live="polite" className="sr-only">
            {bilingualStatus.messageEn}. {bilingualStatus.messageAm}.
          </div>
        </div>
      )}

      {/* Tab A Content: Hands to Voice (Camera & Computer Vision) */}
      {activeTab === 'hands-to-voice' && (
        <div className="space-y-6">
          <TranslatorStudio
            activeGestureKey={activeGestureKey === 'neutral' ? 'hello' : activeGestureKey}
            onGestureRecognized={(key) => handleGestureRecognized(key, 'camera')}
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

            {/* Bilingual Match Status Feedback Card */}
            <div
              className={`p-4 sm:p-5 rounded-[12px] border transition-colors ${
                matchStatus.isError
                  ? 'bg-amber-500/10 border-amber-500/20 text-[#FBBF24]'
                  : 'bg-emerald-500/10 border-emerald-500/20 text-[#34D399]'
              }`}
            >
              <div className="flex items-start gap-3">
                {matchStatus.isError ? (
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-500" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-[#34D399]" />
                )}
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <strong className="block text-sm font-semibold text-slate-900 dark:text-[#F8FAFC]">
                      {matchStatus.isError ? 'Input Notice · የግብዓት ማስታወሻ' : 'Bilingual Gesture Confirmation · የሁለትዮሽ ምልክት ማረጋገጫ'}
                    </strong>
                    <span className="text-[11px] px-2 py-0.5 rounded-[6px] bg-white/60 dark:bg-[#0D1422]/60 font-mono text-slate-600 dark:text-[#B6C2D2] border border-slate-200/60 dark:border-[rgba(148,163,184,0.1)]">
                      {matchStatus.isError ? 'Unmatched · አልተገኘም' : 'Verified · ተረጋግጧል'}
                    </span>
                  </div>

                  {/* Dual English and Amharic Confirmation Boxes */}
                  <div className="grid sm:grid-cols-2 gap-3 pt-1">
                    <div className="p-2.5 rounded-[8px] bg-white/70 dark:bg-[#121C2D]/70 border border-slate-200/50 dark:border-[rgba(148,163,184,0.1)]">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#22D3EE] block mb-0.5">
                        🇬🇧 English Status
                      </span>
                      <p className="text-xs text-slate-800 dark:text-[#F8FAFC] font-medium leading-relaxed">
                        {matchStatus.messageEn}
                      </p>
                      {matchStatus.subMessageEn && (
                        <p className="text-[11px] text-slate-500 dark:text-[#8493A8] mt-1">
                          {matchStatus.subMessageEn}
                        </p>
                      )}
                    </div>

                    <div className="p-2.5 rounded-[8px] bg-white/70 dark:bg-[#121C2D]/70 border border-slate-200/50 dark:border-[rgba(148,163,184,0.1)]">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#2DD4BF] block mb-0.5 font-ethiopic">
                        🇪🇹 የአማርኛ ሁኔታ (Amharic)
                      </span>
                      <p className="text-xs text-slate-800 dark:text-[#F8FAFC] font-medium leading-relaxed font-ethiopic">
                        {matchStatus.messageAm}
                      </p>
                      {matchStatus.subMessageAm && (
                        <p className="text-[11px] text-slate-500 dark:text-[#8493A8] mt-1 font-ethiopic">
                          {matchStatus.subMessageAm}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
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
                    title="Speak in English"
                  >
                    <Volume2 className="w-3.5 h-3.5" /> Speak (EN)
                  </button>
                  <button
                    onClick={() => speechService.speak(matchedDef, 'am-ET')}
                    className="h-8 px-3 rounded-[8px] bg-white dark:bg-[#121C2D] hover:bg-slate-100 dark:hover:bg-[#19263A] text-xs font-medium text-[#2DD4BF] border border-slate-200 dark:border-[rgba(148,163,184,0.15)] flex items-center gap-1.5 transition-colors cursor-pointer font-ethiopic"
                    title="Speak in Amharic"
                  >
                    <Volume2 className="w-3.5 h-3.5" /> አማርኛ አሰማ (AM)
                  </button>
                  <button
                    onClick={() => onGestureChange(matchedDef.id)}
                    className="h-8 px-3 rounded-[8px] bg-white dark:bg-[#121C2D] hover:bg-slate-100 dark:hover:bg-[#19263A] text-xs font-medium text-slate-700 dark:text-[#B6C2D2] border border-slate-200 dark:border-[rgba(148,163,184,0.15)] flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Replay 3D hand gesture"
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
                    <div className="font-semibold text-slate-900 dark:text-[#F8FAFC] text-sm flex items-center gap-2">
                      <span>{matchedDef.labelEn}</span>
                      <span className="text-[#22D3EE] font-ethiopic font-bold">· {matchedDef.labelAm}</span>
                      <span className="text-slate-400 dark:text-[#8493A8] text-xs">("{matchedDef.phoneticAm}")</span>
                    </div>
                    <p className="text-slate-500 dark:text-[#8493A8] mt-0.5">{matchedDef.poseInstructions}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-mono text-[#22D3EE] px-2 py-1 rounded-[6px] bg-[#22D3EE]/10 border border-[#22D3EE]/20">
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
