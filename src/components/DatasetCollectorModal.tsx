import React, { useState } from 'react';
import { 
  Database, 
  X, 
  Download, 
  Upload, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Play, 
  ShieldCheck, 
  Layers,
  Sparkles,
  Hand
} from 'lucide-react';
import { DatasetSample, GestureKey, LandmarkPoint } from '../types';
import { GESTURE_LIST, GESTURE_DEFINITIONS } from '../data/gestures';
import { normalizeLandmarks } from '../services/gestureClassifier';
import { ConfirmDialog } from './ui/Feedback';

interface DatasetCollectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLandmarks: LandmarkPoint[];
  currentHandedness: string;
}

const LOCAL_STORAGE_DATASET_KEY = 'ejjilink_ethsl_dataset_samples';

export const DatasetCollectorModal: React.FC<DatasetCollectorModalProps> = ({
  isOpen,
  onClose,
  currentLandmarks,
  currentHandedness,
}) => {
  const [samples, setSamples] = useState<DatasetSample[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_DATASET_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Could not read dataset from localStorage', e);
    }
    return [];
  });

  const [hasConsent, setHasConsent] = useState(false);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [signerId, setSignerId] = useState('signer-htcs-01');
  const [selectedLabel, setSelectedLabel] = useState<GestureKey>('hello');
  const [selectedSplit, setSelectedSplit] = useState<'train' | 'val' | 'test'>('train');
  const [lighting, setLighting] = useState<'bright' | 'normal' | 'low'>('normal');
  const [distance, setDistance] = useState<'close' | 'medium' | 'far'>('medium');
  const [notes, setNotes] = useState('HTCS Student Research Lab');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const saveSamples = (updated: DatasetSample[]) => {
    setSamples(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_DATASET_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save dataset samples', e);
    }
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleCaptureSample = () => {
    if (!hasConsent) {
      showToast('Please check the informed consent checkbox before recording training samples.');
      return;
    }

    if (!currentLandmarks || currentLandmarks.length < 21) {
      showToast('No active hand landmarks detected by the camera right now. Present your hand and try again.');
      return;
    }

    // Duplicate detection: check if nearly identical landmarks for this label already exist
    const isDuplicate = samples.some((s) => {
      if (s.label !== selectedLabel || !s.landmarks || s.landmarks.length < 21) return false;
      let totalDist = 0;
      for (let i = 0; i < 21; i++) {
        totalDist += Math.hypot(s.landmarks[i].x - currentLandmarks[i].x, s.landmarks[i].y - currentLandmarks[i].y);
      }
      return (totalDist / 21) < 0.005;
    });

    if (isDuplicate) {
      showToast('Duplicate pose detected: Hand has not moved sufficiently since the last recorded frame.');
      return;
    }

    const norm = normalizeLandmarks(currentLandmarks);
    const def = GESTURE_DEFINITIONS[selectedLabel];

    const newSample: DatasetSample = {
      id: `sample-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      label: selectedLabel,
      signerId: signerId.trim() || 'anonymous-signer',
      signLanguage: def?.signLanguage || 'EthSL',
      landmarks: currentLandmarks,
      normalizedLandmarks: norm,
      handedness: currentHandedness || 'Right',
      split: selectedSplit,
      lighting,
      distance,
      hasConsent: true,
      source: 'camera',
      notes: notes.trim(),
    };

    const updated = [newSample, ...samples];
    saveSamples(updated);
    showToast(`Captured sample for "${selectedLabel.toUpperCase()}" [Split: ${selectedSplit.toUpperCase()}] (${updated.length} total samples).`);
  };

  const handleExportJSON = () => {
    if (samples.length === 0) {
      showToast('No samples recorded yet. Capture at least one sample first.');
      return;
    }

    const trainCount = samples.filter((s) => s.split === 'train').length;
    const valCount = samples.filter((s) => s.split === 'val').length;
    const testCount = samples.filter((s) => s.split === 'test').length;

    const datasetPayload = {
      metadata: {
        project: 'EjjiLink AI - EthSL Dataset Collector',
        institution: 'The Ethio-Tech Initiative, Holy Trinity Cathedral General Secondary School',
        location: 'Addis Ababa, Ethiopia',
        exportDate: new Date().toISOString(),
        totalSamples: samples.length,
        version: '1.2.0-phaseC',
        featureFormat: '21-point MediaPipe Normalized Landmarks [wrist at (0,0,0), scaled by palm vector]',
        splitDistribution: {
          train: trainCount,
          validation: valCount,
          test: testCount,
        },
        targetVocabulary: GESTURE_LIST.map((g) => ({
          id: g.id,
          labelEn: g.labelEn,
          labelAm: g.labelAm,
          signLanguage: g.signLanguage,
          validationStatus: g.validationStatus,
        })),
        scientificDisclosure: {
          consentStatus: 'All samples recorded with informed ethical student consent',
          personalIdentifiers: 'Anonymized signer IDs only (no facial or video media)',
          linguisticValidation: 'Student prototype vocabulary; pending ENAD certification',
        },
      },
      samples,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(datasetPayload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `ethsl_dataset_export_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Dataset exported successfully with split and metadata schema!');
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        const importedSamples = Array.isArray(parsed) ? parsed : parsed.samples;
        if (Array.isArray(importedSamples)) {
          saveSamples(importedSamples);
          showToast(`Successfully imported ${importedSamples.length} samples!`);
        } else {
          showToast('Invalid format: File does not contain dataset samples.');
        }
      } catch (err) {
        showToast('Could not parse JSON dataset file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleDeleteSample = (id: string) => {
    const updated = samples.filter((s) => s.id !== id);
    saveSamples(updated);
    showToast('Sample deleted.');
  };

  const handleClearAll = () => {
    setConfirmClearOpen(true);
  };

  const confirmClearAll = () => {
    saveSamples([]);
    showToast('Dataset cleared.');
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Consented EthSL Dataset Collector"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md"
    >
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 bg-white dark:bg-[#0D1422] border border-slate-200 dark:border-[rgba(148,163,184,0.15)] rounded-[20px] max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden ejji-animate-modal">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-[rgba(148,163,184,0.12)] flex items-center justify-between gap-4 bg-slate-50 dark:bg-[#080D18]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[10px] bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-[#0E7490] dark:text-[#43D9E9]">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-[#F8FAFC]">
                  Consented EthSL Dataset Collector
                </h3>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[8px] text-[10px] font-semibold uppercase tracking-wider bg-cyan-500/10 text-[#0E7490] dark:text-[#43D9E9] border border-cyan-500/20">
                  <ShieldCheck className="w-3 h-3" /> Privacy-First (Geometric Only)
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-[#A0AEC0]">
                Collect labeled 21-point hand landmark sequences for training machine learning models on Ethiopian Sign Language.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Dataset Collector"
            className="p-2 rounded-[10px] text-slate-600 dark:text-[#A0AEC0] hover:text-slate-900 dark:hover:text-[#F8FAFC] hover:bg-slate-100 dark:hover:bg-[#19263A] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490] dark:focus-visible:ring-[#43D9E9]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-xs">
          
          {toastMsg && (
            <div className="p-3.5 rounded-[10px] bg-emerald-500/15 border border-emerald-500/30 text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
              <span>{toastMsg}</span>
            </div>
          )}

          {/* Consent Banner */}
          <div className="p-4 rounded-[14px] bg-amber-500/10 border border-amber-500/25 flex items-start gap-3">
            <input
              type="checkbox"
              id="consent-check"
              checked={hasConsent}
              onChange={(e) => setHasConsent(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded accent-[#0E7490] dark:accent-[#43D9E9] focus:ring-[#0E7490] dark:focus:ring-[#43D9E9] cursor-pointer"
            />
            <label htmlFor="consent-check" className="text-slate-800 dark:text-amber-200 leading-relaxed cursor-pointer select-none">
              <strong>Informed Consent Declaration:</strong> I consent to recording anonymized 21-point 3D geometric hand coordinates and metadata strictly for educational evaluation and training of the EjjiLink AI sign language models. No facial biometric images or raw video frames are ever recorded or uploaded.
            </label>
          </div>

          {/* Recorder Controls */}
          <div className="p-5 rounded-[14px] bg-slate-50 dark:bg-[#121C2D] border border-slate-200 dark:border-[rgba(148,163,184,0.12)] space-y-4">
            <h4 className="font-bold text-slate-900 dark:text-[#F8FAFC] text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#0E7490] dark:text-[#43D9E9]" />
              Recording Configuration
            </h4>

            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <label htmlFor="dataset-label-select" className="block text-slate-700 dark:text-[#B6C2D2] font-medium mb-1">
                  Target Sign Label
                </label>
                <select
                  id="dataset-label-select"
                  value={selectedLabel}
                  onChange={(e) => setSelectedLabel(e.target.value as GestureKey)}
                  className="w-full min-h-[40px] bg-white dark:bg-[#0D1422] border border-slate-300 dark:border-[rgba(148,163,184,0.2)] rounded-[10px] px-3 py-2 text-slate-900 dark:text-[#F8FAFC] font-medium focus:border-[#0E7490] dark:focus:border-[#43D9E9] focus:outline-none focus:ring-2 focus:ring-[#0E7490]/25 dark:focus:ring-[#43D9E9]/25 cursor-pointer"
                >
                  {GESTURE_LIST.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.emoji} {g.labelEn} ({g.labelAm}) — {g.signLanguage}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="dataset-signer-id" className="block text-slate-700 dark:text-[#B6C2D2] font-medium mb-1">
                  Signer ID (Anonymized)
                </label>
                <input
                  id="dataset-signer-id"
                  type="text"
                  value={signerId}
                  onChange={(e) => setSignerId(e.target.value)}
                  placeholder="e.g. signer-htcs-01"
                  className="w-full min-h-[40px] bg-white dark:bg-[#0D1422] border border-slate-300 dark:border-[rgba(148,163,184,0.2)] rounded-[10px] px-3 py-2 text-slate-900 dark:text-[#F8FAFC] focus:border-[#0E7490] dark:focus:border-[#43D9E9] focus:outline-none focus:ring-2 focus:ring-[#0E7490]/25 dark:focus:ring-[#43D9E9]/25"
                />
              </div>

              <div>
                <label htmlFor="dataset-split-select" className="block text-slate-700 dark:text-[#B6C2D2] font-medium mb-1">
                  Data Split Allocation
                </label>
                <select
                  id="dataset-split-select"
                  value={selectedSplit}
                  onChange={(e) => setSelectedSplit(e.target.value as any)}
                  className="w-full min-h-[40px] bg-white dark:bg-[#0D1422] border border-slate-300 dark:border-[rgba(148,163,184,0.2)] rounded-[10px] px-3 py-2 text-slate-900 dark:text-[#F8FAFC] font-medium focus:border-[#0E7490] dark:focus:border-[#43D9E9] focus:outline-none focus:ring-2 focus:ring-[#0E7490]/25 dark:focus:ring-[#43D9E9]/25 cursor-pointer"
                >
                  <option value="train">Training (70%)</option>
                  <option value="val">Validation (15%)</option>
                  <option value="test">Held-Out Test (15%)</option>
                </select>
              </div>

              <div>
                <label htmlFor="dataset-lighting-select" className="block text-slate-700 dark:text-[#B6C2D2] font-medium mb-1">
                  Lighting Condition
                </label>
                <select
                  id="dataset-lighting-select"
                  value={lighting}
                  onChange={(e) => setLighting(e.target.value as any)}
                  className="w-full min-h-[40px] bg-white dark:bg-[#0D1422] border border-slate-300 dark:border-[rgba(148,163,184,0.2)] rounded-[10px] px-3 py-2 text-slate-900 dark:text-[#F8FAFC] font-medium focus:border-[#0E7490] dark:focus:border-[#43D9E9] focus:outline-none focus:ring-2 focus:ring-[#0E7490]/25 dark:focus:ring-[#43D9E9]/25 cursor-pointer"
                >
                  <option value="normal">Standard Classroom Lighting</option>
                  <option value="bright">Direct Daylight / Bright</option>
                  <option value="low">Dim / Low Lighting</option>
                </select>
              </div>

              <div>
                <label htmlFor="dataset-distance-select" className="block text-slate-700 dark:text-[#B6C2D2] font-medium mb-1">
                  Camera Distance
                </label>
                <select
                  id="dataset-distance-select"
                  value={distance}
                  onChange={(e) => setDistance(e.target.value as any)}
                  className="w-full min-h-[40px] bg-white dark:bg-[#0D1422] border border-slate-300 dark:border-[rgba(148,163,184,0.2)] rounded-[10px] px-3 py-2 text-slate-900 dark:text-[#F8FAFC] font-medium focus:border-[#0E7490] dark:focus:border-[#43D9E9] focus:outline-none focus:ring-2 focus:ring-[#0E7490]/25 dark:focus:ring-[#43D9E9]/25 cursor-pointer"
                >
                  <option value="medium">Medium Range (0.5m - 1.0m)</option>
                  <option value="close">Close-up Range (&lt; 0.5m)</option>
                  <option value="far">Far Range (&gt; 1.0m)</option>
                </select>
              </div>

              <div>
                <label htmlFor="dataset-session-notes" className="block text-slate-700 dark:text-[#B6C2D2] font-medium mb-1">
                  Session / Notes
                </label>
                <input
                  id="dataset-session-notes"
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. HTCS Lab Session 2"
                  className="w-full min-h-[40px] bg-white dark:bg-[#0D1422] border border-slate-300 dark:border-[rgba(148,163,184,0.2)] rounded-[10px] px-3 py-2 text-slate-900 dark:text-[#F8FAFC] focus:border-[#0E7490] dark:focus:border-[#43D9E9] focus:outline-none focus:ring-2 focus:ring-[#0E7490]/25 dark:focus:ring-[#43D9E9]/25"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200 dark:border-[rgba(148,163,184,0.12)]">
              <div className="flex items-center gap-2 text-slate-700 dark:text-[#A0AEC0]">
                {currentLandmarks.length === 21 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" aria-hidden="true" />
                ) : (
                  <Hand className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" aria-hidden="true" />
                )}
                <span>
                  {currentLandmarks.length === 21
                    ? `Live Hand Detected (${currentHandedness} Hand · 21 Landmarks)`
                    : 'Awaiting Hand in Front of Camera'}
                </span>
              </div>

              <button
                type="button"
                onClick={handleCaptureSample}
                disabled={!hasConsent || currentLandmarks.length < 21}
                className="px-5 py-2.5 rounded-[10px] bg-[#0E7490] hover:bg-[#155E75] text-white dark:bg-[#43D9E9] dark:hover:bg-[#67E8F9] dark:text-[#080D18] disabled:bg-slate-200 disabled:text-slate-500 dark:disabled:bg-[#172438] dark:disabled:text-[#A0AEC0] font-bold flex items-center gap-2 shadow-sm cursor-pointer disabled:cursor-not-allowed transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490] dark:focus-visible:ring-[#43D9E9]"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Capture Labeled Frame</span>
              </button>
            </div>
          </div>

          {/* Dataset Table & Export Controls */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 dark:text-[#F8FAFC] flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#0E7490] dark:text-[#43D9E9]" />
                <span>Collected Samples ({samples.length})</span>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportJSON}
                  disabled={samples.length === 0}
                  className="px-3 py-1.5 rounded-[10px] bg-slate-100 hover:bg-slate-200 dark:bg-[#19263A] dark:hover:bg-[#1f2f47] disabled:text-slate-500 dark:disabled:text-[#A0AEC0] disabled:cursor-not-allowed text-slate-700 dark:text-[#B6C2D2] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200 dark:border-[rgba(148,163,184,0.15)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490] dark:focus-visible:ring-[#43D9E9]"
                >
                  <Download className="w-3.5 h-3.5 text-[#0E7490] dark:text-[#43D9E9]" /> Export JSON
                </button>

                <label className="px-3 py-1.5 rounded-[10px] bg-slate-100 hover:bg-slate-200 dark:bg-[#19263A] dark:hover:bg-[#1f2f47] text-slate-700 dark:text-[#B6C2D2] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200 dark:border-[rgba(148,163,184,0.15)] focus-within:ring-2 focus-within:ring-[#0E7490] dark:focus-within:ring-[#43D9E9]">
                  <Upload className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" /> Import JSON
                  <input type="file" accept=".json" onChange={handleImportJSON} className="sr-only" />
                </label>

                {samples.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="p-1.5 rounded-[8px] text-rose-700 dark:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490] dark:focus-visible:ring-[#43D9E9]"
                    title="Clear All Samples"
                    aria-label="Clear All Samples"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {samples.length > 0 ? (
              <div className="border border-slate-200 dark:border-[rgba(148,163,184,0.12)] rounded-[14px] overflow-hidden max-h-56 overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-100 dark:bg-[#080D18] text-slate-600 dark:text-[#A0AEC0] font-semibold border-b border-slate-200 dark:border-[rgba(148,163,184,0.12)]">
                    <tr>
                      <th className="py-2.5 px-3">Sign</th>
                      <th className="py-2.5 px-3">Signer</th>
                      <th className="py-2.5 px-3">Hand</th>
                      <th className="py-2.5 px-3">Standard</th>
                      <th className="py-2.5 px-3">Time</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-[rgba(148,163,184,0.10)] font-mono tabular-nums">
                    {samples.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-[#19263A]/40 transition-colors">
                        <td className="py-2 px-3 font-semibold text-slate-900 dark:text-[#F8FAFC] uppercase font-sans">
                          {s.label}
                        </td>
                        <td className="py-2 px-3 text-slate-600 dark:text-[#A0AEC0] text-[11px]">
                          {s.signerId}
                        </td>
                        <td className="py-2 px-3 text-slate-600 dark:text-[#A0AEC0] font-sans">
                          {s.handedness}
                        </td>
                        <td className="py-2 px-3 text-emerald-700 dark:text-emerald-400 font-sans">
                          {s.signLanguage}
                        </td>
                        <td className="py-2 px-3 text-slate-600 dark:text-[#A0AEC0] text-[11px]">
                          {new Date(s.timestamp).toLocaleTimeString()}
                        </td>
                        <td className="py-2 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteSample(s.id)}
                            aria-label={`Delete ${s.label} sample`}
                            className="p-1 rounded text-rose-700 dark:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490] dark:focus-visible:ring-[#43D9E9]"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-50 dark:bg-[#121C2D]/60 rounded-[14px] border border-dashed border-slate-300 dark:border-[rgba(148,163,184,0.15)] text-slate-600 dark:text-[#A0AEC0]">
                <FileText className="w-8 h-8 mx-auto mb-2 text-slate-500 dark:text-[#A0AEC0]" />
                <p>No dataset samples captured yet. Accept consent and click "Capture Labeled Frame" while gesturing.</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-[rgba(148,163,184,0.12)] flex items-center justify-between bg-slate-50 dark:bg-[#080D18] text-xs text-slate-600 dark:text-[#A0AEC0]">
          <span>Compliant with Section 4 ML training data specifications.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-[10px] bg-slate-900 dark:bg-[#19263A] hover:bg-slate-800 dark:hover:bg-[#1f2f47] text-white font-bold cursor-pointer border border-slate-200 dark:border-[rgba(148,163,184,0.15)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490] dark:focus-visible:ring-[#43D9E9]"
          >
            Done
          </button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmClearOpen}
        onClose={() => setConfirmClearOpen(false)}
        onConfirm={confirmClearAll}
        title="Clear Collected Dataset"
        message="Are you sure you want to clear all collected dataset samples? This action cannot be undone."
        confirmLabel="Clear All"
        cancelLabel="Cancel"
        destructive={true}
      />
    </div>
  );
};
