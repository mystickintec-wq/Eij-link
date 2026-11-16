import React, { useState } from 'react';
import {
  Bot,
  Sparkles,
  Copy,
  Check,
  Volume2,
  ArrowRight,
  FileCheck,
  Lightbulb,
  MessageSquarePlus,
  BookOpen,
} from 'lucide-react';
import { assistantService } from '../services/assistantService';
import { AssistantResponse, AssistantMode, AssistantTone } from '../types';
import { speechService } from '../services/speechService';
import { useCommunication } from '../context/CommunicationContext';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  IconButton,
  LoadingState,
  OfflineNotice,
  SelectField,
  StatusBadge,
  TextArea,
  WorkspaceHeader,
  useToast,
} from './ui';

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
  const { showToast } = useToast();

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
    showToast('Copied text to clipboard', 'success');
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
      <WorkspaceHeader
        title="AI Communication Assistant"
        description="Translates complex sentences into clear, plain language and generates 1-tap quick replies for Deaf and hard-of-hearing users."
        icon={<Bot className="w-5 h-5" />}
        accent="amber"
        meta={
          <StatusBadge tone="info">Server-Side AI Proxy</StatusBadge>
        }
      />

      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Input Form and Controls */}
        <div className="lg:col-span-6 space-y-4">
          <Card padding="md" className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <SelectField
                label="Assistant Task Mode"
                value={mode}
                onChange={(e) => setMode(e.target.value as AssistantMode)}
              >
                <option value="simplify">Simplify Complex Text (Plain Language)</option>
                <option value="suggest_replies">Generate Quick Reply Suggestions</option>
                <option value="clarify">Explain Technical Jargon & Idioms</option>
                <option value="tone_adjust">Adjust Tone & Formality</option>
              </SelectField>

              <SelectField
                label="Desired Output Tone"
                value={tone}
                onChange={(e) => setTone(e.target.value as AssistantTone)}
              >
                <option value="simple">Simple &amp; Plain Reading</option>
                <option value="polite">Polite &amp; Respectful</option>
                <option value="formal">Formal &amp; Professional</option>
                <option value="brief">Brief &amp; Direct (Bullet points)</option>
              </SelectField>
            </div>

            <TextArea
              label="Enter or Paste Text to Process"
              headerRight={`${inputText.length} / 6,000 chars`}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              rows={6}
              placeholder="Paste an email, classroom note, official document text, or a message you received..."
            />

            {error && (
              <ErrorState
                title="Unable to process text"
                message={error}
                onRetry={() => handleProcess()}
              />
            )}

            <div className="flex items-center justify-between pt-1">
              <Button
                variant="ghost"
                size="md"
                onClick={() => {
                  setInputText('');
                  setResult(null);
                  setError(null);
                }}
                disabled={!inputText}
              >
                Clear
              </Button>

              <Button
                variant="primary"
                size="md"
                onClick={() => handleProcess()}
                isLoading={isLoading}
                disabled={!inputText.trim()}
                leftIcon={<Sparkles className="w-4 h-4" />}
              >
                {isLoading ? 'Simplifying...' : 'Analyze & Simplify'}
              </Button>
            </div>
          </Card>

          {/* Preset Prompts Shelf */}
          <Card padding="md" className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-[#F4F7FB]">
              <Lightbulb className="w-4 h-4 text-amber-700 dark:text-amber-400" aria-hidden="true" />
              <span>Try Real-World Examples</span>
            </div>
            <div className="grid sm:grid-cols-2 gap-2.5">
              {SAMPLE_PROMPTS.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleUsePreset(sample.text)}
                  className="p-3 rounded-[10px] bg-slate-50 dark:bg-[#172438] hover:border-[#0E7490]/50 dark:hover:border-[#43D9E9]/50 border border-slate-200 dark:border-[#253448] text-left transition-colors cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490] dark:focus-visible:ring-[#43D9E9]"
                >
                  <div className="flex items-center justify-between text-[11px] font-semibold text-[#0E7490] dark:text-[#43D9E9] uppercase tracking-wider mb-1">
                    <span>{sample.category}</span>
                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
                  </div>
                  <div className="font-medium text-xs text-slate-900 dark:text-[#F4F7FB] line-clamp-1">
                    {sample.title}
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column: Output / Results Display */}
        <div className="lg:col-span-6 space-y-4">
          {isLoading ? (
            <LoadingState
              title="Analyzing and simplifying text..."
              description="Generating plain-language wording, key takeaways, and quick reply options."
              className="min-h-[360px]"
            />
          ) : result ? (
            <Card padding="md" className="space-y-5">
              {result.isOfflineFallback && (
                <OfflineNotice
                  message={result.offlineNotice || 'Instant plain-language analysis active.'}
                  onRetry={() => handleProcess()}
                />
              )}

              <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-[#253448] pb-3.5">
                <StatusBadge tone="success">Simplified Plain-Language Version</StatusBadge>
                <span className="text-xs font-mono text-slate-600 dark:text-[#A0AEC0]">
                  Reading Level: {result.readingLevel || 'Standard'}
                </span>
              </div>

              <div className="p-4 rounded-[12px] bg-slate-50 dark:bg-[#172438] border border-slate-200 dark:border-[#253448] space-y-3">
                <p className="text-sm sm:text-base font-medium text-slate-900 dark:text-[#F4F7FB] leading-relaxed">
                  {result.simplifiedText}
                </p>

                <div className="flex items-center justify-end gap-2 pt-2.5 border-t border-slate-200 dark:border-[#253448]">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleSpeak(result.simplifiedText)}
                    leftIcon={<Volume2 className="w-3.5 h-3.5 text-[#0E7490] dark:text-[#43D9E9]" />}
                  >
                    {isSpeaking ? 'Speaking...' : 'Read Aloud'}
                  </Button>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleCopy(result.simplifiedText, 'simplified')}
                    leftIcon={
                      copiedKey === 'simplified' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )
                    }
                  >
                    {copiedKey === 'simplified' ? 'Copied' : 'Copy'}
                  </Button>
                </div>
              </div>

              {result.keyPoints && result.keyPoints.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-slate-700 dark:text-[#A0AEC0] uppercase tracking-wider flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400" aria-hidden="true" /> Key Takeaway Points
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-700 dark:text-[#F4F7FB]">
                    {result.keyPoints.map((point, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2.5 p-3 rounded-[10px] bg-slate-50 dark:bg-[#172438] border border-slate-200 dark:border-[#253448]"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0E7490] dark:bg-[#43D9E9] shrink-0 mt-1.5" />
                        <span className="leading-relaxed">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.suggestedReplies && result.suggestedReplies.length > 0 && (
                <div className="space-y-2.5 pt-3 border-t border-slate-200 dark:border-[#253448]">
                  <h4 className="text-xs font-semibold text-slate-700 dark:text-[#A0AEC0] uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquarePlus className="w-4 h-4 text-[#0E7490] dark:text-[#43D9E9]" aria-hidden="true" />
                    One-Tap Quick Replies
                  </h4>
                  <div className="space-y-2">
                    {result.suggestedReplies.map((reply, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-[10px] bg-slate-50 dark:bg-[#172438] border border-slate-200 dark:border-[#253448] flex items-center justify-between gap-3 text-xs"
                      >
                        <p className="font-medium text-slate-900 dark:text-[#F4F7FB]">"{reply}"</p>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <IconButton
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSpeak(reply)}
                            label={`Speak quick reply ${idx + 1}`}
                          >
                            <Volume2 className="w-4 h-4 text-[#0E7490] dark:text-[#43D9E9]" />
                          </IconButton>
                          <IconButton
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopy(reply, `reply-${idx}`)}
                            label={`Copy quick reply ${idx + 1}`}
                          >
                            {copiedKey === `reply-${idx}` ? (
                              <Check className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </IconButton>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.explanations && (
                <div className="p-3.5 rounded-[10px] bg-slate-50 dark:bg-[#172438] border border-slate-200 dark:border-[#253448] text-xs text-slate-600 dark:text-[#A0AEC0]">
                  <strong className="text-slate-900 dark:text-[#F4F7FB] block mb-0.5">Context:</strong>
                  {result.explanations}
                </div>
              )}
            </Card>
          ) : (
            <EmptyState
              icon={<BookOpen className="w-5 h-5" />}
              title="Ready to Simplify Communication"
              description="Paste any complex paragraph or choose an example on the left to see plain-language rewording, key takeaway bullets, and suggested responses."
              className="min-h-[360px]"
            />
          )}
        </div>
      </div>
    </div>
  );
};
