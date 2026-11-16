import React, { useState, useEffect, useCallback } from 'react';
import {
  Hand,
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  RotateCcw,
  Activity,
  ListChecks,
  Radio,
  Play,
  GraduationCap,
  Coffee,
  HeartHandshake,
  Languages,
  Clock,
  ScanFace,
} from 'lucide-react';
import { GestureKey, SignSequence } from '../types';
import { GESTURE_DEFINITIONS } from '../data/gestures';
import { SIGN_SEQUENCES, findSequencesByScenario } from '../data/signSequences';
import { TranslatorStudio } from './TranslatorStudio';
import { HandPoseDiagram } from './HandPoseDiagram';
import { ErrorBoundary } from './ErrorBoundary';
import { speechService } from '../services/speechService';
import { geminiVoiceRecorder, TranscriptionResult } from '../services/transcribeService';
import {
  Alert,
  Button,
  Card,
  SearchInput,
  StatusBadge,
  WorkspaceHeader,
} from './ui';

interface TwoWayWorkspaceProps {
  activeGestureKey: GestureKey | 'neutral';
  onGestureChange: (gesture: GestureKey | 'neutral') => void;
  onOpenTrackingStudio?: () => void;
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
  onOpenTrackingStudio,
}) => {
  const [activeTab, setActiveTab] = useState<'hands-to-voice' | 'voice-to-hands'>('hands-to-voice');

  // Mode B state (Speech/Text to 2D Sign Sequence)
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [continuousListening, setContinuousListening] = useState(false);
  const [audioVolume, setAudioVolume] = useState<number>(0);
  const [transcriptionNotice, setTranscriptionNotice] = useState<string>('');
  const [selectedSequence, setSelectedSequence] = useState<SignSequence | null>(null);
  const [activeSequenceStepIndex, setActiveSequenceStepIndex] = useState<number>(0);

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
      subMessageEn: '2D sign pipeline initialized. Dual-direction translation active.',
      subMessageAm: 'የእጅ ምልክት ትርጉም ዝግጁ ነው። የሁለትዮሽ ግንኙነት ንቁ ነው።',
      timestamp: 'Ready · ዝግጁ',
    };
  });

  // Mode B match status feedback
  const [matchStatus, setMatchStatus] = useState<BilingualMatchStatus>({
    matchedKey: 'hello',
    isError: false,
    messageEn: 'Displaying "Hello" 21-point EthSL handshape guide.',
    messageAm: 'የ"ሰላም" (Selam) የእጅ ምልክት መመሪያ እየታየ ነው።',
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
      subMessageEn: `Temporal lock established (>80% accuracy). Updated 2D sign guide.`,
      subMessageAm: `በመሳሪያው ላይ በ${Math.round(def.threshold * 100)}% እርግጠኝነት ተረጋግጧል።`,
      timestamp: timeStr,
    });

    setMatchStatus({
      matchedKey: key,
      isError: false,
      messageEn: `Recognized "${def.labelEn}" via ${sourceLabelEn}.`,
      messageAm: `በ${sourceLabelAm} አማካኝነት "${def.labelAm}" (${def.phoneticAm}) ተረጋግጧል!`,
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
        messageEn: 'Type or speak a phrase above to display its 2D EthSL handshape.',
        messageAm: 'የእጅ ምልክቱን ለማየት ከላይ አንድ ቃል ይተይቡ ወይም ይናገሩ።',
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
      setActiveSequenceStepIndex(0);
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
        subMessageEn: `Demonstrating ${matchedSeq.steps.length} sequential sign stages: ${stepsEn}`,
        subMessageAm: `${matchedSeq.steps.length} ተከታታይ የምልክት ደረጃዎች ይታያሉ፦ ${stepsAm}`,
        timestamp: timeStr,
      });

      setMatchStatus({
        matchedKey: initialKey,
        isError: false,
        messageEn: `Recognized Sequence: "${matchedSeq.titleEn}" (${matchedSeq.steps.length} sequential stages).`,
        messageAm: `ተከታታይ ምልክት ተለይቷል፦ "${matchedSeq.titleAm}". ${matchedSeq.steps.length} የምልክት ደረጃዎች ይታያሉ።`,
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
        subMessageEn: `Matched phrase "${query}". 21-point EthSL handshape displayed.`,
        subMessageAm: `ከ"${query}" ጋር ተመሳስሏል። የ21-ነጥብ የእጅ ምልክት ታይቷል።`,
        timestamp: timeStr,
      });

      setMatchStatus({
        matchedKey: match,
        isError: false,
        messageEn: `Recognized "${def.labelEn}" (${def.category}). EthSL 2D handshape guide updated.`,
        messageAm: `"${def.labelAm}" (${def.phoneticAm}) ተረጋግጧል! የ2D የእጅ ምልክት መመሪያ ታይቷል።`,
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
    setActiveSequenceStepIndex(0);
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
      subMessageAm: `${seq.steps.length} ተከታታይ የምልክት ደረጃዎች ይታያሉ፦ ${stepsAm}`,
      timestamp: timeStr,
    });

    setMatchStatus({
      matchedKey: initialKey,
      isError: false,
      messageEn: `Scenario Sequence: "${seq.titleEn}" (${seq.steps.length} sequential stages).`,
      messageAm: `ተከታታይ ምልክት ተለይቷል፦ "${seq.titleAm}". ${seq.steps.length} ተከታታይ የምልክት ደረጃዎች ይታያሉ።`,
      subMessageEn: `Steps: ${stepsEn}`,
      subMessageAm: `ደረጃዎች፦ ${stepsAm}`,
      source: 'preset',
      timestamp: timeStr,
    });
  };

  // Auto-step through multi-sign sequence stages in Mode B
  useEffect(() => {
    if (!selectedSequence || selectedSequence.steps.length <= 1 || activeTab !== 'voice-to-hands') {
      return;
    }
    const timer = window.setInterval(() => {
      setActiveSequenceStepIndex((prev) => {
        const next = (prev + 1) % selectedSequence.steps.length;
        const stepKey = selectedSequence.steps[next]?.signKey;
        if (stepKey && stepKey !== 'neutral') {
          onGestureChange(stepKey);
        }
        return next;
      });
    }, 2400);
    return () => window.clearInterval(timer);
  }, [selectedSequence, activeTab, onGestureChange]);

  const currentDef = GESTURE_DEFINITIONS[bilingualStatus.gestureKey] || GESTURE_DEFINITIONS.hello;
  const matchedDef = matchStatus.matchedKey ? GESTURE_DEFINITIONS[matchStatus.matchedKey] : null;
  const displayedSignKey: GestureKey =
    (selectedSequence?.steps[activeSequenceStepIndex]?.signKey &&
    selectedSequence.steps[activeSequenceStepIndex].signKey !== 'neutral'
      ? (selectedSequence.steps[activeSequenceStepIndex].signKey as GestureKey)
      : matchedDef?.id) || 'hello';
  const displayedDef = GESTURE_DEFINITIONS[displayedSignKey] || GESTURE_DEFINITIONS.hello;

  return (
    <div id="communication-workspace" className="space-y-6 scroll-mt-20">
      {/* Unified Workspace Header with Accessible Segmented Mode Tabs */}
      <WorkspaceHeader
        title="Two-Way Communication"
        description="Switch smoothly between live sign-to-voice camera recognition and spoken or typed phrase translation into 2D EthSL sign guides."
        icon={<Languages className="w-5 h-5" />}
        accent="cyan"
        actions={
          <div
            role="tablist"
            aria-label="Communication Direction"
            className="flex flex-wrap items-center gap-1 p-1 rounded-[12px] bg-slate-100 dark:bg-[#172438] border border-slate-200 dark:border-[#253448]"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'hands-to-voice'}
              onClick={() => setActiveTab('hands-to-voice')}
              className={`min-h-[38px] px-3.5 py-2 rounded-[8px] font-semibold text-xs flex items-center gap-2 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490] dark:focus-visible:ring-[#43D9E9] ${
                activeTab === 'hands-to-voice'
                  ? 'bg-[#0E7490] dark:bg-[#43D9E9] text-white dark:text-[#080D18] shadow-xs'
                  : 'text-slate-600 dark:text-[#A0AEC0] hover:text-slate-900 dark:hover:text-[#F4F7FB]'
              }`}
            >
              <Hand className="w-4 h-4" aria-hidden="true" />
              <span>Hands to Voice</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'voice-to-hands'}
              onClick={() => setActiveTab('voice-to-hands')}
              className={`min-h-[38px] px-3.5 py-2 rounded-[8px] font-semibold text-xs flex items-center gap-2 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490] dark:focus-visible:ring-[#43D9E9] ${
                activeTab === 'voice-to-hands'
                  ? 'bg-[#0E7490] dark:bg-[#43D9E9] text-white dark:text-[#080D18] shadow-xs'
                  : 'text-slate-600 dark:text-[#A0AEC0] hover:text-slate-900 dark:hover:text-[#F4F7FB]'
              }`}
            >
              <Mic className="w-4 h-4" aria-hidden="true" />
              <span>Voice / Text to Sign</span>
            </button>
          </div>
        }
      />

      {/* Real-time Bilingual Confirmation Status Hub */}
      {currentDef && (
        <Card
          role="region"
          aria-label="Bilingual Gesture Confirmation Status"
          padding="md"
          className="space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-[#253448] text-xs">
            <div className="flex items-center gap-2">
              <StatusBadge tone="success" icon={<CheckCircle2 className="w-3.5 h-3.5" />}>
                Bilingual Confirmation
              </StatusBadge>
              <span className="font-ethiopic text-slate-600 dark:text-[#A0AEC0] text-xs">
                የሁለትዮሽ ምልክት ማረጋገጫ
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-[#A0AEC0]">
              <StatusBadge tone="neutral">
                {bilingualStatus.source === 'camera'
                  ? 'Camera Vision'
                  : bilingualStatus.source === 'voice'
                  ? 'Voice Input'
                  : bilingualStatus.source === 'text'
                  ? 'Text Query'
                  : 'Active Selection'}
              </StatusBadge>
              <span className="flex items-center gap-1 font-mono tabular-nums text-[11px]">
                <Clock className="w-3 h-3" aria-hidden="true" />
                {bilingualStatus.timestamp}
              </span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* English Confirmation Card */}
            <div className="p-4 rounded-[12px] bg-slate-50 dark:bg-[#172438] border border-slate-200 dark:border-[#253448] flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#0E7490] dark:text-[#43D9E9]">
                    English Output
                  </span>
                  <span className="text-[11px] font-mono text-slate-600 dark:text-[#A0AEC0]">
                    {CATEGORY_TRANSLATIONS[currentDef.category]?.en || currentDef.category}
                  </span>
                </div>
                <div className="text-base font-bold text-slate-900 dark:text-[#F4F7FB] flex items-center gap-2">
                  <span aria-hidden="true">{currentDef.emoji}</span>
                  <span>{currentDef.labelEn}</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" aria-hidden="true" />
                </div>
                <p className="text-xs text-slate-700 dark:text-[#A0AEC0] mt-1 leading-snug">
                  {bilingualStatus.messageEn}
                </p>
                <p className="text-[11px] text-slate-600 dark:text-[#A0AEC0] mt-0.5">
                  {bilingualStatus.subMessageEn}
                </p>
              </div>

              <div className="pt-2.5 border-t border-slate-200 dark:border-[#253448] flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-600 dark:text-[#A0AEC0]">
                  Status: <strong className="text-slate-900 dark:text-[#F4F7FB]">Calibrated</strong>
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => speechService.speak(currentDef, 'en-US')}
                  leftIcon={<Volume2 className="w-3.5 h-3.5 text-[#0E7490] dark:text-[#43D9E9]" />}
                >
                  Speak (EN)
                </Button>
              </div>
            </div>

            {/* Amharic Confirmation Card */}
            <div className="p-4 rounded-[12px] bg-slate-50 dark:bg-[#172438] border border-slate-200 dark:border-[#253448] flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-ethiopic">
                    የአማርኛ ውጤት (Amharic)
                  </span>
                  <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-ethiopic">
                    {CATEGORY_TRANSLATIONS[currentDef.category]?.am || currentDef.category}
                  </span>
                </div>
                <div className="text-base font-bold text-slate-900 dark:text-[#F4F7FB] flex items-center gap-2">
                  <span className="text-xl font-ethiopic text-[#0E7490] dark:text-[#43D9E9]">
                    {currentDef.labelAm}
                  </span>
                  <span className="text-xs font-normal text-slate-600 dark:text-[#A0AEC0]">
                    ({currentDef.phoneticAm})
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" aria-hidden="true" />
                </div>
                <p className="text-xs text-slate-700 dark:text-[#A0AEC0] mt-1 leading-snug font-ethiopic">
                  {bilingualStatus.messageAm}
                </p>
                <p className="text-[11px] text-slate-600 dark:text-[#A0AEC0] mt-0.5 font-ethiopic">
                  {bilingualStatus.subMessageAm}
                </p>
              </div>

              <div className="pt-2.5 border-t border-slate-200 dark:border-[#253448] flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-600 dark:text-[#A0AEC0] font-ethiopic">
                  አነባበብ፦ <strong className="text-slate-900 dark:text-[#F4F7FB] font-mono">{currentDef.phoneticAm}</strong>
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => speechService.speak(currentDef, 'am-ET')}
                  leftIcon={<Volume2 className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />}
                  className="font-ethiopic"
                >
                  አማርኛ አሰማ (AM)
                </Button>
              </div>
            </div>
          </div>

          <div role="status" aria-live="polite" className="sr-only">
            {bilingualStatus.messageEn}. {bilingualStatus.messageAm}.
          </div>
        </Card>
      )}

      {/* Tab A Content: Hands to Voice */}
      {activeTab === 'hands-to-voice' && (
        <div role="tabpanel" aria-label="Hands to Voice">
          <ErrorBoundary
            title="Camera Recognition Error"
            description="MediaPipe vision encountered an unexpected error. Reload to reinitialize live hand tracking."
          >
            <TranslatorStudio
              embedded={true}
              activeGestureKey={activeGestureKey === 'neutral' ? 'hello' : activeGestureKey}
              onGestureRecognized={(key) => handleGestureRecognized(key, 'camera')}
            />
          </ErrorBoundary>
        </div>
      )}

      {/* Tab B Content: Voice / Text to Sign */}
      {activeTab === 'voice-to-hands' && (
        <div role="tabpanel" aria-label="Voice and Text to Sign" className="space-y-6">
          <Card padding="lg" className="space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="max-w-2xl space-y-1">
                <span className="text-xs font-semibold text-[#0E7490] dark:text-[#43D9E9] uppercase tracking-wider">
                  Speech & Text to EthSL Sign Guide
                </span>
                <h3 className="font-heading text-xl font-bold text-slate-900 dark:text-[#F4F7FB]">
                  Translate English or Amharic Speech into 2D Sign Poses
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-[#A0AEC0]">
                  Speak into your microphone or enter a phrase below to inspect the matching EthSL 21-point handshape or scenario sequence.
                </p>
              </div>

              {isListening && (
                <div className="flex items-center gap-2.5 p-2.5 rounded-[10px] bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs shrink-0">
                  <Radio className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <div>
                    <div className="font-semibold font-mono tabular-nums">Audio Level: {audioVolume}%</div>
                    <div className="w-24 bg-slate-200 dark:bg-[#080D18] h-1.5 rounded-full overflow-hidden mt-1">
                      <div
                        className="bg-[#0E7490] dark:bg-[#43D9E9] h-full rounded-full transition-all duration-75"
                        style={{ width: `${audioVolume}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleFormSubmit} className="flex flex-col sm:flex-row gap-2.5">
              <SearchInput
                aria-label="Enter phrase or Amharic word to translate into a sign pose"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onClear={() => setInputText('')}
                placeholder="Type a phrase (e.g., 'Water please', 'Hello teacher', 'Peace', 'Help')..."
              />

              <div className="flex flex-wrap sm:flex-nowrap gap-2 shrink-0">
                <Button
                  variant={continuousListening ? 'primary' : 'secondary'}
                  size="lg"
                  onClick={toggleContinuousBackgroundVoice}
                  aria-pressed={continuousListening}
                  leftIcon={<Activity className="w-4 h-4" />}
                >
                  {continuousListening ? 'Voice Monitor: ON' : 'Voice Monitor'}
                </Button>

                <Button
                  variant={isListening && !continuousListening ? 'danger' : 'secondary'}
                  size="lg"
                  onClick={togglePushToSpeak}
                  leftIcon={isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                >
                  {isListening ? 'Recording...' : 'Push to Speak'}
                </Button>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Animate Hand
                </Button>
              </div>
            </form>

            {transcriptionNotice && (
              <Alert variant="info" title="Voice Transcription">
                {transcriptionNotice}
              </Alert>
            )}

            {/* Preset Demonstration Scenarios */}
            <div className="pt-2 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-700 dark:text-[#F4F7FB] flex items-center gap-1.5">
                  <ListChecks className="w-4 h-4 text-[#0E7490] dark:text-[#43D9E9]" aria-hidden="true" />
                  Preset Demonstration Scenarios
                </span>
                <span className="text-[11px] text-slate-600 dark:text-[#A0AEC0]">
                  Select a multi-sign sequence to animate
                </span>
              </div>

              <div className="grid md:grid-cols-3 gap-3">
                {[
                  {
                    scenario: 'classroom' as const,
                    title: '1. Classroom Communication',
                    icon: <GraduationCap className="w-4 h-4" />,
                    accentClass: 'text-[#0E7490] dark:text-[#43D9E9]',
                    activeClass: 'bg-[#0E7490]/10 dark:bg-[#43D9E9]/15 border-[#0E7490] dark:border-[#43D9E9] text-[#0E7490] dark:text-[#43D9E9]',
                  },
                  {
                    scenario: 'service' as const,
                    title: '2. Everyday Services',
                    icon: <Coffee className="w-4 h-4" />,
                    accentClass: 'text-emerald-700 dark:text-emerald-400',
                    activeClass: 'bg-emerald-500/10 border-emerald-700 dark:border-emerald-500 text-emerald-800 dark:text-emerald-300',
                  },
                  {
                    scenario: 'daily' as const,
                    title: '3. Daily Communication',
                    icon: <HeartHandshake className="w-4 h-4" />,
                    accentClass: 'text-[#4F46E5] dark:text-[#8585FF]',
                    activeClass: 'bg-[#4F46E5]/10 dark:bg-[#8585FF]/15 border-[#4F46E5] dark:border-[#8585FF] text-[#4F46E5] dark:text-[#8585FF]',
                  },
                ].map((group) => (
                  <div
                    key={group.scenario}
                    className="p-4 rounded-[12px] bg-slate-50 dark:bg-[#172438] border border-slate-200 dark:border-[#253448] space-y-2.5"
                  >
                    <div className={`flex items-center gap-2 text-xs font-semibold ${group.accentClass}`}>
                      <span aria-hidden="true">{group.icon}</span>
                      <span>{group.title}</span>
                    </div>
                    <div className="space-y-1.5">
                      {findSequencesByScenario(group.scenario).map((s) => {
                        const isSelected = selectedSequence?.id === s.id;
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => handleSelectScenarioSequence(s)}
                            aria-pressed={isSelected}
                            className={`w-full min-h-[44px] text-left p-3 rounded-[10px] text-xs transition-[transform,border-color,background-color,box-shadow] duration-200 hover:-translate-y-0.5 motion-reduce:hover:translate-y-0 hover:shadow-xs flex items-center justify-between gap-2 border cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490] dark:focus-visible:ring-[#43D9E9] ${
                              isSelected
                                ? group.activeClass
                                : 'bg-white dark:bg-[#101C2C] text-slate-700 dark:text-[#F4F7FB] border-slate-200 dark:border-[#253448] hover:border-[#0E7490]/50 dark:hover:border-[#43D9E9]/50'
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="font-semibold truncate">{s.titleEn}</div>
                              <div className={`text-[11px] font-ethiopic ${group.accentClass}`}>{s.titleAm}</div>
                            </div>
                            <Play className={`w-3.5 h-3.5 shrink-0 ${group.accentClass}`} aria-hidden="true" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bilingual Match Status Feedback */}
            <Alert
              variant={matchStatus.isError ? 'warning' : 'success'}
              title={
                matchStatus.isError
                  ? 'Phrase Not Matched · የግብዓት ማስታወሻ'
                  : 'Bilingual Gesture Confirmation · የሁለትዮሽ ምልክት ማረጋገጫ'
              }
            >
              <div className="grid sm:grid-cols-2 gap-3 pt-1.5">
                <div className="p-3 rounded-[10px] bg-white/80 dark:bg-[#101C2C] border border-slate-200 dark:border-[#253448]">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#0E7490] dark:text-[#43D9E9] block mb-0.5">
                    English Status
                  </span>
                  <p className="text-xs text-slate-800 dark:text-[#F4F7FB] font-medium leading-relaxed">
                    {matchStatus.messageEn}
                  </p>
                  {matchStatus.subMessageEn && (
                    <p className="text-[11px] text-slate-600 dark:text-[#A0AEC0] mt-1">
                      {matchStatus.subMessageEn}
                    </p>
                  )}
                </div>

                <div className="p-3 rounded-[10px] bg-white/80 dark:bg-[#101C2C] border border-slate-200 dark:border-[#253448]">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block mb-0.5 font-ethiopic">
                    የአማርኛ ሁኔታ (Amharic)
                  </span>
                  <p className="text-xs text-slate-800 dark:text-[#F4F7FB] font-medium leading-relaxed font-ethiopic">
                    {matchStatus.messageAm}
                  </p>
                  {matchStatus.subMessageAm && (
                    <p className="text-[11px] text-slate-600 dark:text-[#A0AEC0] mt-1 font-ethiopic">
                      {matchStatus.subMessageAm}
                    </p>
                  )}
                </div>
              </div>
            </Alert>
          </Card>

          {/* 2D Sign Guide Execution in Mode B */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h4 className="font-heading text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-[#A0AEC0] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#0E7490] dark:text-[#43D9E9]" aria-hidden="true" />
                2D Anatomical Sign &amp; Sequence Visualizer
              </h4>
              <div className="flex flex-wrap items-center gap-2">
                {matchedDef && (
                  <>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => speechService.speak(displayedDef, 'en-US')}
                      leftIcon={<Volume2 className="w-3.5 h-3.5 text-[#0E7490] dark:text-[#43D9E9]" />}
                    >
                      Speak (EN)
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => speechService.speak(displayedDef, 'am-ET')}
                      leftIcon={<Volume2 className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />}
                      className="font-ethiopic"
                    >
                      አማርኛ አሰማ (AM)
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setActiveSequenceStepIndex(0);
                        onGestureChange(displayedDef.id);
                      }}
                      leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                    >
                      Replay Pose
                    </Button>
                  </>
                )}
                {onOpenTrackingStudio && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={onOpenTrackingStudio}
                    leftIcon={<ScanFace className="w-3.5 h-3.5" />}
                  >
                    Open 2D Tracking Studio
                  </Button>
                )}
              </div>
            </div>

            <Card padding="md" className="grid md:grid-cols-12 gap-5 items-center">
              <div className="md:col-span-5">
                <HandPoseDiagram gestureKey={displayedSignKey} variant="stage" className="max-h-[250px]" />
              </div>

              <div className="md:col-span-7 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-3xl shrink-0" aria-hidden="true">
                      {displayedDef.emoji}
                    </span>
                    <div className="min-w-0">
                      <div className="font-heading text-xl font-bold text-slate-900 dark:text-[#F4F7FB] truncate">
                        {displayedDef.labelEn}
                      </div>
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-lg font-bold font-ethiopic text-[#0E7490] dark:text-[#43D9E9]">
                          {displayedDef.labelAm}
                        </span>
                        <span className="text-xs font-mono text-slate-600 dark:text-[#A0AEC0]">
                          /{displayedDef.phoneticAm}/
                        </span>
                      </div>
                    </div>
                  </div>
                  <StatusBadge tone="info" className="font-mono shrink-0">
                    21-PT POSE: {displayedDef.id.toUpperCase()}
                  </StatusBadge>
                </div>

                <div className="p-3.5 rounded-[12px] bg-slate-50 dark:bg-[#172438] border border-slate-200 dark:border-[#253448] space-y-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-[#A0AEC0] block">
                    Handshape &amp; Movement Instruction
                  </span>
                  <p className="text-xs sm:text-sm text-slate-800 dark:text-[#F4F7FB] leading-relaxed">
                    {displayedDef.poseInstructions}
                  </p>
                </div>

                {selectedSequence && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-[#A0AEC0]">
                      <span className="font-semibold text-slate-800 dark:text-[#F4F7FB]">
                        Sequence: {selectedSequence.titleEn}
                      </span>
                      <span className="font-mono tabular-nums">
                        Step {activeSequenceStepIndex + 1}/{selectedSequence.steps.length}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedSequence.steps.map((step, idx) => {
                        const isStepActive = idx === activeSequenceStepIndex;
                        return (
                          <button
                            key={step.id}
                            type="button"
                            onClick={() => {
                              setActiveSequenceStepIndex(idx);
                              if (step.signKey !== 'neutral') {
                                onGestureChange(step.signKey);
                              }
                            }}
                            className={`px-2.5 py-1.5 rounded-[8px] text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1.5 ${
                              isStepActive
                                ? 'bg-[#0E7490] dark:bg-[#43D9E9] text-white dark:text-[#080D18] border-transparent font-semibold'
                                : 'bg-slate-50 dark:bg-[#172438] text-slate-700 dark:text-[#A0AEC0] border-slate-200 dark:border-[#253448]'
                            }`}
                          >
                            <span aria-hidden="true">{step.emoji}</span>
                            <span>{step.glossEn}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};
