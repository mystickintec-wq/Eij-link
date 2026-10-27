import React, { useState } from 'react';
import { 
  Bot, 
  Sparkles, 
  Send, 
  Copy, 
  Check, 
  Volume2, 
  RefreshCw, 
  ArrowRight, 
  Sliders, 
  HelpCircle, 
  FileCheck, 
  AlertCircle,
  Lightbulb,
  MessageSquarePlus,
  BookOpen
} from 'lucide-react';
import { assistantService } from '../services/assistantService';
import { AssistantResponse, AssistantMode, AssistantTone } from '../types';
import { speechService } from '../services/speechService';

const SAMPLE_PROMPTS = [
  {
    title: 'Hospital Doctor Instructions',
    category: 'Medical',
    text: 'Patient exhibits signs of moderate acute pharyngitis secondary to viral etiologies. Prescribed acetaminophen 500mg q8h PRN for antipyretic analgesia and recommended copious oral hydration and vocal rest.',
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

  const handleProcess = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await assistantService.processText({
        text: inputText.trim(),
        mode,
        tone,
      });
      setResult(data);
    } catch (err: any) {
      console.error('Assistant error:', err);
      setError(err.message || 'Failed to process text. Please try again.');
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
      () => setIsSpeaking(true),
      () => setIsSpeaking(false),
      () => setIsSpeaking(false)
    );
  };

  const handleUsePreset = (text: string) => {
    setInputText(text);
    setResult(null);
    setError(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Workspace Header */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-500 flex items-center justify-center shrink-0">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold font-heading text-slate-900 dark:text-white">
                AI Communication Assistant
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                POST /api/assistant
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Powered by server-side Gemini 3.8 Flash. Translates convoluted language into clear, plain sentences and generates 1-tap quick replies for Deaf and Hard-of-Hearing individuals.
            </p>
          </div>
        </div>

        {/* Security Disclosures Tag */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold self-start md:self-auto">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Server-Protected Keys • Zero Browser Leaks</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Left Column: Input Form and Controls */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-lg space-y-4">
            
            {/* Mode & Tone Selectors */}
            <div className="grid sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5 font-heading">
                  Assistant Task Mode
                </label>
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value as AssistantMode)}
                  className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  <option value="simplify">Simplify Complex Text (Plain Language)</option>
                  <option value="suggest_replies">Generate Quick Reply Suggestions</option>
                  <option value="clarify">Explain Technical Jargon & Idioms</option>
                  <option value="tone_adjust">Adjust Tone & Formality</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5 font-heading">
                  Desired Output Tone
                </label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value as AssistantTone)}
                  className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
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
                <label className="font-bold text-slate-700 dark:text-slate-300 font-heading">
                  Enter or Paste Text to Process
                </label>
                <span className="text-[11px] text-slate-400">
                  {inputText.length} / 6,000 chars
                </span>
              </div>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                rows={6}
                placeholder="Paste an email, classroom note, official document text, or a message you received..."
                className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-2xl p-4 text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none resize-none"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  setInputText('');
                  setResult(null);
                  setError(null);
                }}
                disabled={!inputText}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-40 cursor-pointer"
              >
                Clear
              </button>

              <button
                type="button"
                onClick={() => handleProcess()}
                disabled={isLoading || !inputText.trim()}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-md transition-all disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing with Gemini 3.8...</span>
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
          <div className="p-5 rounded-3xl bg-white/60 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-800/80 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold font-heading text-slate-700 dark:text-slate-300">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <span>Try Real-World Examples</span>
            </div>
            <div className="grid sm:grid-cols-2 gap-2">
              {SAMPLE_PROMPTS.map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => handleUsePreset(sample.text)}
                  className="p-3 rounded-2xl bg-gray-50 dark:bg-slate-950 hover:bg-amber-500/10 dark:hover:bg-amber-500/10 border border-gray-200 dark:border-slate-800 hover:border-amber-500/30 text-left transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">
                    <span>{sample.category}</span>
                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="font-semibold text-xs text-slate-800 dark:text-slate-200 line-clamp-1">
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
            <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-amber-500/30 shadow-xl space-y-5 animate-in fade-in duration-200">
              {/* Result Header */}
              <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white font-heading">
                    Simplified Plain-Language Version
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                    Grade: {result.readingLevel || 'Standard'}
                  </span>
                </div>
              </div>

              {/* Main Simplified Text Box */}
              <div className="p-4 rounded-2xl bg-amber-500/5 dark:bg-slate-950 border border-amber-500/20 space-y-3">
                <p className="text-sm sm:text-base font-medium text-slate-800 dark:text-slate-100 leading-relaxed">
                  {result.simplifiedText}
                </p>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-amber-500/10">
                  <button
                    onClick={() => handleSpeak(result.simplifiedText)}
                    className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 hover:bg-gray-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium border border-gray-200 dark:border-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-amber-500" />
                    <span>{isSpeaking ? 'Speaking...' : 'Read Aloud'}</span>
                  </button>

                  <button
                    onClick={() => handleCopy(result.simplifiedText, 'simplified')}
                    className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 hover:bg-gray-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium border border-gray-200 dark:border-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedKey === 'simplified' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
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
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-heading flex items-center gap-1.5">
                    <FileCheck className="w-3.5 h-3.5 text-emerald-500" /> Key Takeaway Points
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                    {result.keyPoints.map((point, idx) => (
                      <li key={idx} className="flex items-start gap-2 p-2 rounded-xl bg-gray-50 dark:bg-slate-950/60 border border-gray-100 dark:border-slate-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* One-Tap Suggested Replies */}
              {result.suggestedReplies && result.suggestedReplies.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-slate-800">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-heading flex items-center gap-1.5">
                    <MessageSquarePlus className="w-3.5 h-3.5 text-amber-500" /> One-Tap Quick Replies
                  </h4>
                  <div className="space-y-2">
                    {result.suggestedReplies.map((reply, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-2xl bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 hover:border-amber-500/30 flex items-center justify-between gap-3 text-xs transition-colors"
                      >
                        <p className="font-medium text-slate-800 dark:text-slate-200">
                          "{reply}"
                        </p>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleSpeak(reply)}
                            className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-pointer"
                            title="Speak reply"
                          >
                            <Volume2 className="w-3.5 h-3.5 text-amber-500" />
                          </button>
                          <button
                            onClick={() => handleCopy(reply, `reply-${idx}`)}
                            className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-pointer"
                            title="Copy reply"
                          >
                            {copiedKey === `reply-${idx}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
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
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
                  <strong className="text-slate-700 dark:text-slate-300 font-heading block mb-0.5">
                    Accessibility Context:
                  </strong>
                  {result.explanations}
                </div>
              )}
            </div>
          ) : (
            /* Empty State */
            <div className="p-12 rounded-3xl bg-white/50 dark:bg-slate-900/50 border border-dashed border-gray-300 dark:border-slate-800 flex flex-col items-center justify-center text-center space-y-3 min-h-[350px]">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-sm font-heading text-slate-800 dark:text-slate-200">
                Ready to Simplify Communication
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                Paste any complex paragraph or choose an example on the left to see plain-language rewording, key takeaway bullets, and suggested responses.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
