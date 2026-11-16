import React, { useState } from 'react';
import {
  FileText,
  Upload,
  Sparkles,
  Volume2,
  Copy,
  Check,
  CheckCircle2,
  FileCheck2,
  Image,
  BookOpen,
} from 'lucide-react';
import { documentService } from '../services/documentService';
import { DocumentExtractResponse } from '../types';
import { speechService } from '../services/speechService';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  StatusBadge,
  WorkspaceHeader,
  useToast,
} from './ui';

const DEMO_DOCUMENTS = [
  {
    title: 'School Exam Instructions Notice',
    description: 'Bilingual notice on HTCS national examination rules and venue timing.',
    type: 'Academic Notice',
    sampleText: 'ETHIOPIAN MINISTRY OF EDUCATION - HTCS SCHOLASTIC NOTICE:\nAll Grade 12 students must assemble at Hall B by 08:30 AM with authorized identification and pens. Non-programmable calculators only.',
  },
  {
    title: 'Medical Prescription Dosage Guide',
    description: 'Hospital medication guidelines with clinical precautions and hydration notes.',
    type: 'Medical Prescription',
    sampleText: 'ST. PAUL HOSPITAL MILLENNIUM MEDICAL COLLEGE:\nRx: Amoxicillin 500mg capsules. Sig: Take one capsule orally thrice daily after meals for 7 days. Complete full course. Keep refrigerated.',
  },
  {
    title: 'Classroom Field Trip Permission',
    description: 'Parental consent form for Geological Rift Valley excursion.',
    type: 'Permission Slip',
    sampleText: 'THE ETHIO-TECH INITIATIVE - GEOLOGICAL FIELD WORK:\nStudents will study volcanic tectonic features in Debre Zeyit. Depart Friday 07:00 AM. Emergency contact: +251 911 000 000.',
  },
];

export const DocumentsWorkspace: React.FC = () => {
  const { showToast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DocumentExtractResponse | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setError('File size exceeds 15MB limit.');
      return;
    }

    setSelectedFile(file);
    setError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setFilePreview(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleExtract = async (overrideBase64?: string, overrideMime?: string, overrideName?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      let base64 = overrideBase64;
      let mimeType = overrideMime || 'image/png';
      let filename = overrideName || selectedFile?.name || 'document';

      if (!base64 && filePreview) {
        const parts = filePreview.split(',');
        base64 = parts[1];
        mimeType = parts[0].split(';')[0].replace('data:', '');
      }

      if (!base64) {
        throw new Error('Please select an image or document to extract.');
      }

      const data = await documentService.extractText({
        fileBase64: base64,
        mimeType,
        filename,
        simplifyLanguage: true,
      });

      setResult(data);
    } catch (err: any) {
      console.error('Document extraction error:', err);
      setError(err.message || 'Failed to extract text from document.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseDemo = (demo: typeof DEMO_DOCUMENTS[0]) => {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 600, 300);
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText(demo.title, 30, 45);
      ctx.fillStyle = '#334155';
      ctx.font = '13px monospace';
      const lines = demo.sampleText.split('\n');
      lines.forEach((l, i) => {
        ctx.fillText(l, 30, 90 + i * 26);
      });
      const dataUrl = canvas.toDataURL('image/png');
      setFilePreview(dataUrl);
      setSelectedFile(new File([], demo.title + '.png'));
      const base64 = dataUrl.split(',')[1];
      handleExtract(base64, 'image/png', demo.title);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    showToast('Extracted text copied to clipboard', 'success');
    setTimeout(() => setIsCopied(false), 2500);
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

  return (
    <div className="space-y-6">
      <WorkspaceHeader
        title="Document Text Extractor (OCR)"
        description="Extract verbatim text from photos, classroom assignments, medical guides, and PDF notices with plain-language accessibility summaries."
        icon={<FileText className="w-5 h-5" />}
        accent="emerald"
        meta={
          <StatusBadge tone="info">PNG · JPEG · WEBP · PDF</StatusBadge>
        }
      />

      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* Upload Column */}
        <div className="lg:col-span-5 space-y-4">
          <Card padding="md" className="space-y-4">
            <span className="block text-xs font-semibold text-slate-800 dark:text-[#F4F7FB]">
              Upload Document or Image
            </span>

            <label className="border-2 border-dashed border-slate-300 dark:border-[#253448] hover:border-[#0E7490] dark:hover:border-[#43D9E9] rounded-[14px] p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-slate-50 dark:bg-[#080D18] min-h-[190px] focus-within:ring-2 focus-within:ring-[#0E7490] dark:focus-within:ring-[#43D9E9]">
              <Upload className="w-8 h-8 text-[#0E7490] dark:text-[#43D9E9] mb-2" aria-hidden="true" />
              <span className="text-xs font-semibold text-slate-900 dark:text-[#F4F7FB]">
                Click to browse or drop an image or PDF
              </span>
              <span className="text-[11px] text-slate-600 dark:text-[#A0AEC0] mt-1">
                Supports PNG, JPEG, WEBP, PDF (Max 15MB)
              </span>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileUpload}
                className="sr-only"
              />
            </label>

            {filePreview && (
              <div className="p-3.5 rounded-[10px] bg-slate-50 dark:bg-[#172438] border border-slate-200 dark:border-[#253448] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <Image className="w-4 h-4 text-[#0E7490] dark:text-[#43D9E9] shrink-0" aria-hidden="true" />
                  <span className="text-xs font-medium text-slate-800 dark:text-[#F4F7FB] truncate">
                    {selectedFile?.name || 'Selected document'}
                  </span>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleExtract()}
                  isLoading={isLoading}
                  leftIcon={<Sparkles className="w-3.5 h-3.5" />}
                >
                  {isLoading ? 'Extracting...' : 'Extract Text'}
                </Button>
              </div>
            )}

            {error && (
              <ErrorState
                title="Extraction error"
                message={error}
                onRetry={filePreview ? () => handleExtract() : undefined}
              />
            )}
          </Card>

          <Card padding="md" className="space-y-3">
            <span className="text-xs font-semibold text-slate-800 dark:text-[#F4F7FB] flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-[#0E7490] dark:text-[#43D9E9]" aria-hidden="true" />
              <span>Try Preloaded Sample Documents</span>
            </span>
            <div className="space-y-2">
              {DEMO_DOCUMENTS.map((demo, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleUseDemo(demo)}
                  className="w-full p-3.5 rounded-[10px] bg-slate-50 dark:bg-[#172438] hover:border-[#0E7490]/50 dark:hover:border-[#43D9E9]/50 border border-slate-200 dark:border-[#253448] text-left transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490] dark:focus-visible:ring-[#43D9E9]"
                >
                  <div className="text-[11px] font-semibold text-[#0E7490] dark:text-[#43D9E9] uppercase tracking-wider mb-0.5">
                    {demo.type}
                  </div>
                  <div className="font-semibold text-xs text-slate-900 dark:text-[#F4F7FB]">
                    {demo.title}
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-[#A0AEC0] line-clamp-1 mt-0.5">
                    {demo.description}
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Results Column */}
        <div className="lg:col-span-7 space-y-4">
          {isLoading ? (
            <LoadingState
              title="Extracting document text..."
              description="Running visual OCR and generating plain-language takeaways."
              className="min-h-[420px]"
            />
          ) : (
            <Card padding="md" className="space-y-5 min-h-[420px]">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-[#253448] pb-3.5">
                <StatusBadge tone={result ? 'success' : 'neutral'}>
                  Extracted Text & Summary
                </StatusBadge>
                {result?.documentType && (
                  <span className="text-xs font-mono text-slate-600 dark:text-[#A0AEC0]">
                    {result.documentType} · {result.detectedLanguage}
                  </span>
                )}
              </div>

              {result ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-[12px] bg-slate-50 dark:bg-[#172438] border border-slate-200 dark:border-[#253448] space-y-2">
                    <h4 className="text-xs font-semibold text-[#0E7490] dark:text-[#43D9E9] uppercase tracking-wider">
                      Plain-Language Summary
                    </h4>
                    <p className="text-sm font-medium text-slate-900 dark:text-[#F4F7FB] leading-relaxed">
                      {result.summary}
                    </p>
                  </div>

                  {result.keyPoints && result.keyPoints.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-slate-700 dark:text-[#A0AEC0] uppercase tracking-wider">
                        Key Action Items & Points
                      </h4>
                      <ul className="space-y-1.5 text-xs text-slate-800 dark:text-[#F4F7FB]">
                        {result.keyPoints.map((point, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-2.5 p-3 rounded-[10px] bg-slate-50 dark:bg-[#172438] border border-slate-200 dark:border-[#253448]"
                          >
                            <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
                            <span className="leading-relaxed">{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="space-y-2 pt-3 border-t border-slate-200 dark:border-[#253448]">
                    <h4 className="text-xs font-semibold text-slate-700 dark:text-[#A0AEC0] uppercase tracking-wider">
                      Verbatim Extracted OCR Text
                    </h4>
                    <div className="p-4 rounded-[12px] bg-slate-50 dark:bg-[#080D18] border border-slate-200 dark:border-[#253448] text-xs font-mono text-slate-800 dark:text-[#F4F7FB] max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                      {result.extractedText}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-200 dark:border-[#253448]">
                    <Button
                      variant="secondary"
                      size="md"
                      onClick={() => handleSpeak(result.summary)}
                      leftIcon={<Volume2 className="w-4 h-4 text-[#0E7490] dark:text-[#43D9E9]" />}
                    >
                      {isSpeaking ? 'Reading...' : 'Read Summary Aloud'}
                    </Button>

                    <Button
                      variant="secondary"
                      size="md"
                      onClick={() => handleCopy(result.extractedText)}
                      leftIcon={
                        isCopied ? (
                          <Check className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )
                      }
                    >
                      {isCopied ? 'Copied' : 'Copy Verbatim Text'}
                    </Button>
                  </div>
                </div>
              ) : (
                <EmptyState
                  icon={<FileCheck2 className="w-5 h-5" />}
                  title="No Document Processed Yet"
                  description="Upload an image or PDF on the left, or run one of the sample documents to inspect extracted OCR text and key action points."
                  className="my-6"
                />
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
