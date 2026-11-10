import React, { useState } from 'react';
import { 
  FileText, 
  Upload, 
  Sparkles, 
  Volume2, 
  Copy, 
  Check, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2,
  FileCheck2,
  Image,
  BookOpen
} from 'lucide-react';
import { documentService } from '../services/documentService';
import { DocumentExtractResponse } from '../types';
import { speechService } from '../services/speechService';

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
      {/* Workspace Header */}
      <div className="p-6 rounded-[18px] bg-white dark:bg-[#0D1422] border border-slate-200 dark:border-[rgba(148,163,184,0.12)] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-[10px] bg-[#2DD4BF]/10 text-[#2DD4BF] flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-[#F8FAFC]">
                Document Text Extractor & OCR
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-[#8493A8] mt-0.5">
              Extract verbatim text from photos, classroom assignments, medical guides, and PDF notices with plain-language accessibility summaries.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-[#8493A8]">
          <span className="font-mono text-[#2DD4BF]">Gemini 3.8</span>
          <span aria-hidden="true">·</span>
          <span>Visual OCR</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Upload Column */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-6 rounded-[18px] bg-white dark:bg-[#121C2D] border border-slate-200 dark:border-[rgba(148,163,184,0.12)] shadow-sm space-y-4">
            <label className="block text-xs font-semibold text-slate-700 dark:text-[#B6C2D2]">
              Upload Document or Image
            </label>

            {/* Drop Zone */}
            <label className="border-2 border-dashed border-slate-300 dark:border-[rgba(148,163,184,0.18)] hover:border-[#22D3EE] dark:hover:border-[#22D3EE] rounded-[14px] p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-slate-50 dark:bg-[#080D18] min-h-[190px]">
              <Upload className="w-8 h-8 text-[#22D3EE] mb-2" />
              <span className="text-xs font-semibold text-slate-800 dark:text-[#F8FAFC]">
                Click to browse or drop an image here
              </span>
              <span className="text-[11px] text-slate-400 dark:text-[#8493A8] mt-1">
                Supports PNG, JPEG, WEBP (Max 15MB)
              </span>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {filePreview && (
              <div className="p-3.5 rounded-[10px] bg-slate-100 dark:bg-[#0D1422] border border-slate-200 dark:border-[rgba(148,163,184,0.12)] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 truncate">
                  <Image className="w-4 h-4 text-[#22D3EE] shrink-0" />
                  <span className="text-xs font-medium text-slate-700 dark:text-[#B6C2D2] truncate">
                    {selectedFile?.name || 'Selected document'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleExtract()}
                  disabled={isLoading}
                  className="h-9 px-4 rounded-[8px] bg-[#22D3EE] hover:bg-[#2DD4BF] text-[#080D18] font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isLoading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  <span>Extract Text</span>
                </button>
              </div>
            )}

            {error && (
              <div className="p-3.5 rounded-[10px] bg-red-500/10 border border-red-500/20 text-[#F87171] text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Sample Presets */}
          <div className="p-5 rounded-[18px] bg-white dark:bg-[#121C2D] border border-slate-200 dark:border-[rgba(148,163,184,0.12)] space-y-3">
            <span className="text-xs font-semibold text-slate-700 dark:text-[#B6C2D2] flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-[#22D3EE]" />
              Try Preloaded Sample Documents
            </span>
            <div className="space-y-2">
              {DEMO_DOCUMENTS.map((demo, idx) => (
                <button
                  key={idx}
                  onClick={() => handleUseDemo(demo)}
                  className="w-full p-3 rounded-[10px] bg-slate-50 dark:bg-[#0D1422] hover:bg-[#22D3EE]/10 border border-slate-200 dark:border-[rgba(148,163,184,0.12)] text-left transition-colors cursor-pointer group"
                >
                  <div className="text-[11px] font-semibold text-[#22D3EE] uppercase tracking-wider mb-1">
                    {demo.type}
                  </div>
                  <div className="font-medium text-xs text-slate-800 dark:text-[#F8FAFC]">
                    {demo.title}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-[#8493A8] line-clamp-1 mt-0.5">
                    {demo.description}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Column */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-6 rounded-[18px] bg-white dark:bg-[#121C2D] border border-slate-200 dark:border-[rgba(148,163,184,0.12)] shadow-sm space-y-5 min-h-[420px]">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[rgba(148,163,184,0.12)] pb-3">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${result ? 'bg-[#34D399]' : 'bg-slate-400 dark:bg-[#64748B]'}`} />
                <span className="text-xs font-semibold text-slate-900 dark:text-[#F8FAFC]">
                  Extracted Document Text & Plain-Language Summary
                </span>
              </div>
              {result?.documentType && (
                <span className="text-xs text-slate-500 dark:text-[#8493A8]">
                  {result.documentType} · {result.detectedLanguage}
                </span>
              )}
            </div>

            {result ? (
              <div className="space-y-4 animate-in fade-in duration-200">
                {/* Plain-Language Summary */}
                <div className="p-4 rounded-[10px] bg-slate-50 dark:bg-[#0D1422] border border-slate-200 dark:border-[rgba(148,163,184,0.12)] space-y-2">
                  <h4 className="text-xs font-semibold text-[#22D3EE] uppercase tracking-wider">
                    Plain-Language Summary
                  </h4>
                  <p className="text-sm font-medium text-slate-800 dark:text-[#F8FAFC] leading-relaxed">
                    {result.summary}
                  </p>
                </div>

                {/* Key Takeaways */}
                {result.keyPoints && result.keyPoints.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-slate-700 dark:text-[#B6C2D2] uppercase tracking-wider">
                      Key Action Items & Points
                    </h4>
                    <ul className="space-y-1.5 text-xs text-slate-700 dark:text-[#B6C2D2]">
                      {result.keyPoints.map((point, idx) => (
                        <li key={idx} className="flex items-start gap-2 p-2.5 rounded-[8px] bg-slate-50 dark:bg-[#0D1422] border border-slate-200 dark:border-[rgba(148,163,184,0.1)]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#34D399] shrink-0 mt-0.5" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Verbatim Extracted Text */}
                <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-[rgba(148,163,184,0.12)]">
                  <h4 className="text-xs font-semibold text-slate-700 dark:text-[#B6C2D2] uppercase tracking-wider">
                    Verbatim Extracted OCR Text
                  </h4>
                  <div className="p-3.5 rounded-[10px] bg-slate-50 dark:bg-[#0D1422] border border-slate-200 dark:border-[rgba(148,163,184,0.12)] text-xs font-mono text-slate-800 dark:text-[#F8FAFC] max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                    {result.extractedText}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-[rgba(148,163,184,0.12)]">
                  <button
                    onClick={() => handleSpeak(result.summary)}
                    className="h-9 px-4 rounded-[8px] bg-slate-100 dark:bg-[#19263A] hover:bg-slate-200 dark:hover:bg-[#1E2E44] text-[#22D3EE] text-xs font-medium border border-slate-200 dark:border-[rgba(148,163,184,0.15)] flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>{isSpeaking ? 'Reading...' : 'Read Aloud'}</span>
                  </button>

                  <button
                    onClick={() => handleCopy(result.extractedText)}
                    className="h-9 px-4 rounded-[8px] bg-slate-100 dark:bg-[#19263A] hover:bg-slate-200 dark:hover:bg-[#1E2E44] text-slate-800 dark:text-[#F8FAFC] text-xs font-medium border border-slate-200 dark:border-[rgba(148,163,184,0.15)] flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {isCopied ? <Check className="w-4 h-4 text-[#34D399]" /> : <Copy className="w-4 h-4" />}
                    <span>{isCopied ? 'Copied' : 'Copy Verbatim Text'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-16 text-center text-slate-400 dark:text-[#8493A8] space-y-2">
                <FileCheck2 className="w-12 h-12 mx-auto opacity-30" />
                <p className="text-xs font-medium">Upload an image or choose a demo to view extracted OCR text.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
