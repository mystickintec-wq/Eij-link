import React, { useState } from 'react';
import { 
  Bot, 
  Sparkles, 
  Copy, 
  Check, 
  Volume2, 
  RefreshCw, 
  ArrowRight, 
  FileCheck, 
  AlertCircle,
  Lightbulb,
  MessageSquarePlus,
  BookOpen
} from 'lucide-react';
import { assistantService } from '../services/assistantService';
import { AssistantResponse, AssistantMode, AssistantTone } from '../types';
import { speechService } from '../services/speechService';
import { useCommunication } from '../context/CommunicationContext';

const SAMPLE_PROMPTS = [
  {
    title: 'Hospital Doctor Instructions',
    category: 'Medical',
    text: 'Patient should rigorously adhere to the prescribed pharmacotherapeutic protocol, maintaining fasting glucose homeostatic parameters prior to the diagnostic venipuncture.',
  },
  {
    title: 'Classroom Assignment Notice',
    category: 'School',
    text: 'Students are ostensibly mandated to synthesize their empirical observations regarding Ethiopian geological rift formations into a 4-page pedagogical abstract prior to the subsequent scholastic symposium.',
  },
  {
    title: 'Administrative Government Notice',
    category: 'Official',
    text: 'Pursuant to municipal decree article 14-B, all prospective commercial vehicular operators must submit authenticated biometric identity documentation to the registry before the statutory expiration deadline.',
  },
  {
    title: 'Job Interview Inquiry',
    category: 'Career',
    text: 'Could you please elaborate on your strategic methodologies for asynchronous cross-functional conflict remediation across geographically distributed agile engineering teams?',
  },
];

export const AssistantWorkspace: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [mode, setMode] = useState<AssistantMode>('simplify');
  const [tone, setTone] = useState<AssistantTone>('simple');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AssistantResponse | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const { setCommunicationState } = useCommunication();

  const handleProcess = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    setIsLoading(true);
    setError(null);
    setCommunicationState('processing');

    try {
      const data = await assistantService.processText({
        text: inputText.trim(),
        mode,
        tone,
      });
      setResult(data);
      setCommunicationState('success');
    } catch (err: any) {
      console.error('Assistant error:', err);
      setError(err.message || 'Failed to process text. Please try again.');
      setCommunicationState('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleSpeak = (text: string) => {
    speechService.speakCustomText(
      text,
      'en-US',
      0.9,
      () => {
        setIsSpeaking(true);
        setCommunicationState('speaking');
      },
      () => {
        setIsSpeaking(false);
        setCommunicationState('idle');
      },
      () => {
        setIsSpeaking(false);
        setCommunicationState('idle');
      }
    );
  };

  const handleUsePreset = (text: string) => {
    setInputText(text);
    setResult(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <div className="p-6 rounded-[18px] bg-white dark:bg-[#0D1422] border border-slate-200 dark:border-[rgba(148,163,184,0.12)] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-[10px] bg-[#FBBF24]/10 text-[#FBBF24] flex items-center justify-center shrink-0">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-[#F8FAFC]">
                AI Communication Assistant
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-[#8493A8] mt-0.5">
              Powered by server-side Gemini 3.8 Flash. Translates complex sentences into clear, plain language and generates 1-tap quick replies for Deaf and hard-of-hearing users.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-[#8493A8]">
          <span className="font-mono text-[#FBBF24]">Gemini 3.8</span>
          <span aria-hidden="true">·</span>
          <span>Zero Browser Key Leaks</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Left Column: Input Form and Controls */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-6 rounded-[18px] bg-white dark:bg-[#121C2D] border border-slate-200 dark:border-[rgba(148,163,184,0.12)] shadow-sm space-y-4">
            
            {/* Mode & Tone Selectors */}
            <div className="grid sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-[#B6C2D2] font-semibold mb-1.5">
                  Assistant Task Mode
                </label>
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value as AssistantMode)}
                  className="w-full min-h-[44px] bg-slate-50 dark:bg-[#080D18] border border-slate-200 dark:border-[rgba(148,163,184,0.15)] rounded-[10px] px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-900 dark:text-[#F8FAFC] focus:ring-2 focus:ring-[#22D3EE]/30 focus:border-[#22D3EE] focus:outline-none"
                >
                  <option value="simplify">Simplify Complex Text (Plain Language)</option>
                  <option value="suggest_replies">Generate Quick Reply Suggestions</option>
                  <option value="clarify">Explain Technical Jargon & Idioms</option>
                  <option value="tone_adjust">Adjust Tone & Formality</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-[#B6C2D2] font-semibold mb-1.5">
                  Desired Output Tone
                </label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value as AssistantTone)}
                  className="w-full min-h-[44px] bg-slate-50 dark:bg-[#080D18] border border-slate-200 dark:border-[rgba(148,163,184,0.15)] rounded-[10px] px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-900 dark:text-[#F8FAFC] focus:ring-2 focus:ring-[#22D3EE]/30 focus:border-[#22D3EE] focus:outline-none"
                >
                  <option value="simple">Simple & Plain (Easy Reading)</option>
                  <option value="polite">Polite & Respectful</option>
                  <option value="formal">Formal & Professional</option>
                  <option value="brief">Brief & Direct (Bullet points)</option>
                </select>
              </div>
            </div>

            {/* Input Text Area */}
            <div>
              <div className="flex items-center justify-between mb-1.5 text-xs">
                <label className="font-semibold text-slate-700 dark:text-[#B6C2D2]">
                  Enter or Paste Text to Process
                </label>
                <span className="font-mono text-slate-400 dark:text-[#8493A8] text-xs">
                  {inputText.length} / 6,000 chars
                </span>
              </div>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                rows={6}
                placeholder="Paste an email, classroom note, official document text, or a message you received..."
                className="w-full bg-slate-50 dark:bg-[#080D18] border border-slate-200 dark:border-[rgba(148,163,184,0.15)] rounded-[10px] p-4 text-sm text-slate-900 dark:text-[#F8FAFC] focus:ring-2 focus:ring-[#22D3EE]/30 focus:border-[#22D3EE] focus:outline-none resize-none leading-relaxed placeholder:text-[#8493A8]"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3.5 rounded-[10px] bg-red-500/10 border border-red-500/20 text-[#F87171] text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => {
                  setInputText('');
                  setResult(null);
                  setError(null);
                }}
                disabled={!inputText}
                className="h-10 px-4 rounded-[10px] text-xs font-medium text-slate-500 dark:text-[#8493A8] hover:text-slate-900 dark:hover:text-[#F8FAFC] hover:bg-slate-100 dark:hover:bg-[#19263A] transition-colors disabled:opacity-40 cursor-pointer"
              >
                Clear
              </button>

              <button
                type="button"
                onClick={() => handleProcess()}
                disabled={isLoading || !inputText.trim()}
                className="h-10 px-5 rounded-[10px] bg-[#22D3EE] hover:bg-[#2DD4BF] text-[#080D18] font-semibold text-xs sm:text-sm flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing with Gemini...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Analyze & Simplify</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Preset Prompts Shelf */}
          <div className="p-5 rounded-[18px] bg-white dark:bg-[#121C2D] border border-slate-200 dark:border-[rgba(148,163,184,0.12)] space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-[#B6C2D2]">
              <Lightbulb className="w-4 h-4 text-[#FBBF24]" />
              <span>Try Real-World Examples</span>
            </div>
            <div className="grid sm:grid-cols-2 gap-2">
              {SAMPLE_PROMPTS.map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => handleUsePreset(sample.text)}
                  className="p-3 rounded-[10px] bg-slate-50 dark:bg-[#0D1422] hover:bg-[#22D3EE]/10 border border-slate-200 dark:border-[rgba(148,163,184,0.12)] text-left transition-colors cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-[11px] font-semibold text-[#22D3EE] uppercase tracking-wider mb-1">
                    <span>{sample.category}</span>
                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="font-medium text-xs text-slate-800 dark:text-[#F8FAFC] line-clamp-1">
                    {sample.title}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Output / Results Display */}
        <div className="lg:col-span-6 space-y-4">
          {result ? (
            <div className="p-6 rounded-[18px] bg-white dark:bg-[#121C2D] border border-slate-200 dark:border-[rgba(148,163,184,0.12)] shadow-sm space-y-5 animate-in fade-in duration-200">
              {/* Standby High-Availability Banner */}
              {result.isOfflineFallback && (
                <div className="p-3 rounded-[10px] bg-[#FBBF24]/10 border border-[#FBBF24]/30 flex items-center justify-between gap-3 text-xs text-slate-800 dark:text-[#FBBF24]">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#FBBF24] shrink-0" />
                    <span className="text-xs font-medium leading-tight">
                      {result.offlineNotice || 'Instant plain-language analysis active.'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleProcess()}
                    disabled={isLoading}
                    className="h-8 px-3 rounded-[8px] bg-[#FBBF24] hover:bg-[#F59E0B] text-[#080D18] font-semibold text-xs shrink-0 transition-colors cursor-pointer"
                  >
                    Retry Cloud
                  </button>
                </div>
              )}

              {/* Result Header */}
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-[rgba(148,163,184,0.12)] pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#34D399]" />
                  <span className="text-xs font-semibold text-slate-900 dark:text-[#F8FAFC]">
                    Simplified Plain-Language Version
                  </span>
                </div>
                <span className="text-xs text-slate-500 dark:text-[#8493A8]">
                  Reading Level: {result.readingLevel || 'Standard'}
                </span>
              </div>

              {/* Main Simplified Text Box */}
              <div className="p-4 rounded-[10px] bg-slate-50 dark:bg-[#0D1422] border border-slate-200 dark:border-[rgba(148,163,184,0.12)] space-y-3">
                <p className="text-sm sm:text-base font-medium text-slate-800 dark:text-[#F8FAFC] leading-relaxed">
                  {result.simplifiedText}
                </p>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-[rgba(148,163,184,0.1)]">
                  <button
                    onClick={() => handleSpeak(result.simplifiedText)}
                    className="h-8 px-3 rounded-[8px] bg-white dark:bg-[#121C2D] hover:bg-slate-100 dark:hover:bg-[#19263A] text-slate-700 dark:text-[#B6C2D2] text-xs font-medium border border-slate-200 dark:border-[rgba(148,163,184,0.15)] flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-[#22D3EE]" />
                    <span>{isSpeaking ? 'Speaking...' : 'Read Aloud'}</span>
                  </button>

                  <button
                    onClick={() => handleCopy(result.simplifiedText, 'simplified')}
                    className="h-8 px-3 rounded-[8px] bg-white dark:bg-[#121C2D] hover:bg-slate-100 dark:hover:bg-[#19263A] text-slate-700 dark:text-[#B6C2D2] text-xs font-medium border border-slate-200 dark:border-[rgba(148,163,184,0.15)] flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedKey === 'simplified' ? (
                      <Check className="w-3.5 h-3.5 text-[#34D399]" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                    )}
                    <span>{copiedKey === 'simplified' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Key Takeaways */}
              {result.keyPoints && result.keyPoints.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-slate-700 dark:text-[#B6C2D2] uppercase tracking-wider flex items-center gap-1.5">
                    <FileCheck className="w-3.5 h-3.5 text-[#34D399]" /> Key Takeaway Points
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-600 dark:text-[#B6C2D2]">
                    {result.keyPoints.map((point, idx) => (
                      <li key={idx} className="flex items-start gap-2 p-2.5 rounded-[8px] bg-slate-50 dark:bg-[#0D1422] border border-slate-200 dark:border-[rgba(148,163,184,0.1)]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#22D3EE] shrink-0 mt-1.5" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* One-Tap Suggested Replies */}
              {result.suggestedReplies && result.suggestedReplies.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-[rgba(148,163,184,0.12)]">
                  <h4 className="text-xs font-semibold text-slate-700 dark:text-[#B6C2D2] uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquarePlus className="w-3.5 h-3.5 text-[#22D3EE]" /> One-Tap Quick Replies
                  </h4>
                  <div className="space-y-2">
                    {result.suggestedReplies.map((reply, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-[10px] bg-slate-50 dark:bg-[#0D1422] border border-slate-200 dark:border-[rgba(148,163,184,0.12)] hover:border-[#22D3EE]/30 flex items-center justify-between gap-3 text-xs transition-colors"
                      >
                        <p className="font-medium text-slate-800 dark:text-[#F8FAFC]">
                          "{reply}"
                        </p>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleSpeak(reply)}
                            className="p-1.5 rounded-[6px] hover:bg-slate-200 dark:hover:bg-[#19263A] text-slate-500 dark:text-[#8493A8] cursor-pointer"
                            title="Speak reply"
                          >
                            <Volume2 className="w-3.5 h-3.5 text-[#22D3EE]" />
                          </button>
                          <button
                            onClick={() => handleCopy(reply, `reply-${idx}`)}
                            className="p-1.5 rounded-[6px] hover:bg-slate-200 dark:hover:bg-[#19263A] text-slate-500 dark:text-[#8493A8] cursor-pointer"
                            title="Copy reply"
                          >
                            {copiedKey === `reply-${idx}` ? (
                              <Check className="w-3.5 h-3.5 text-[#34D399]" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Explanations */}
              {result.explanations && (
                <div className="p-3 rounded-[10px] bg-slate-50 dark:bg-[#0D1422] border border-slate-200 dark:border-[rgba(148,163,184,0.12)] text-xs text-slate-500 dark:text-[#8493A8]">
                  <strong className="text-slate-700 dark:text-[#B6C2D2] block mb-0.5">
                    Context:
                  </strong>
                  {result.explanations}
                </div>
              )}
            </div>
          ) : (
            /* Empty State */
            <div className="p-12 rounded-[18px] bg-white dark:bg-[#121C2D] border border-dashed border-slate-200 dark:border-[rgba(148,163,184,0.15)] flex flex-col items-center justify-center text-center space-y-3 min-h-[360px]">
              <div className="w-10 h-10 rounded-[10px] bg-[#22D3EE]/10 text-[#22D3EE] flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-sm text-slate-800 dark:text-[#F8FAFC]">
                Ready to Simplify Communication
              </h3>
              <p className="text-xs text-slate-500 dark:text-[#8493A8] max-w-sm">
                Paste any complex paragraph or choose an example on the left to see plain-language rewording, key takeaway bullets, and suggested responses.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
