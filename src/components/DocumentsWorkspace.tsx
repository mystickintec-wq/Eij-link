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

// Preloaded accessible sample documents (base64 encoded lightweight 1x1 test image to demonstrate OCR)
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
        // Strip data:image/...;base64,
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
    // Generate a quick canvas image with demo text
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
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Workspace Header */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-500 flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold font-heading text-slate-900 dark:text-white">
                Document Text Extractor & OCR
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                POST /api/documents
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Extract verbatim text from photos, classroom assignments, medical guides, and PDF notices with plain-language accessibility summaries.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs font-semibold self-start md:self-auto">
          <span>Gemini 3.8 Flash • Visual OCR</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Upload Column */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-lg space-y-4">
            <label className="block text-xs font-bold font-heading text-slate-700 dark:text-slate-300">
              Upload Document or Image
            </label>

            {/* Drop Zone */}
            <label className="border-2 border-dashed border-gray-300 dark:border-slate-700 hover:border-rose-500 dark:hover:border-rose-500 rounded-3xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-gray-50/50 dark:bg-slate-950/50 min-h-[190px]">
              <Upload className="w-8 h-8 text-rose-500 mb-2" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Click to browse or drop an image here
              </span>
              <span className="text-[11px] text-slate-400 mt-1">
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
              <div className="p-3 rounded-2xl bg-gray-100 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 truncate">
                  <Image className="w-4 h-4 text-rose-500 shrink-0" />
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                    {selectedFile?.name || 'Selected document'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleExtract()}
                  disabled={isLoading}
                  className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
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
              <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Sample Presets */}
          <div className="p-5 rounded-3xl bg-white/60 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-800/80 space-y-3">
            <span className="text-xs font-bold font-heading text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-rose-500" />
              Try Preloaded Sample Documents
            </span>
            <div className="space-y-2">
              {DEMO_DOCUMENTS.map((demo, idx) => (
                <button
                  key={idx}
                  onClick={() => handleUseDemo(demo)}
                  className="w-full p-3 rounded-2xl bg-gray-50 dark:bg-slate-950 hover:bg-rose-500/10 border border-gray-200 dark:border-slate-800 hover:border-rose-500/30 text-left transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-1">
                    <span>{demo.type}</span>
                  </div>
                  <div className="font-semibold text-xs text-slate-800 dark:text-slate-200">
                    {demo.title}
                  </div>
                  <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                    {demo.description}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Column */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-xl space-y-5 min-h-[420px]">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${result ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                <span className="text-xs font-bold font-heading text-slate-900 dark:text-white uppercase tracking-wider">
                  Extracted Document Text & Plain-Language Summary
                </span>
              </div>
              {result?.documentType && (
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                  {result.documentType} ({result.detectedLanguage})
                </span>
              )}
            </div>

            {result ? (
              <div className="space-y-4 animate-in fade-in duration-200">
                {/* Plain-Language Summary */}
                <div className="p-4 rounded-2xl bg-rose-500/5 dark:bg-slate-950 border border-rose-500/20 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 font-heading">
                    Plain-Language Summary
                  </h4>
                  <p className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-100 leading-relaxed">
                    {result.summary}
                  </p>
                </div>

                {/* Key Takeaways */}
                {result.keyPoints && result.keyPoints.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 font-heading">
                      Key Action Items & Points
                    </h4>
                    <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                      {result.keyPoints.map((point, idx) => (
                        <li key={idx} className="flex items-start gap-2 p-2 rounded-xl bg-gray-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Verbatim Extracted Text */}
                <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-slate-800">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 font-heading">
                    Verbatim Extracted OCR Text
                  </h4>
                  <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs font-mono text-slate-800 dark:text-slate-200 max-h-48 overflow-y-auto whitespace-pre-wrap">
                    {result.extractedText}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-slate-800">
                  <button
                    onClick={() => handleSpeak(result.summary)}
                    className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-rose-600 dark:text-rose-400 text-xs font-semibold border border-gray-200 dark:border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>{isSpeaking ? 'Reading...' : 'Read Aloud'}</span>
                  </button>

                  <button
                    onClick={() => handleCopy(result.extractedText)}
                    className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-gray-200 dark:border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {isCopied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    <span>{isCopied ? 'Copied' : 'Copy Verbatim Text'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-16 text-center text-slate-400 space-y-2">
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
