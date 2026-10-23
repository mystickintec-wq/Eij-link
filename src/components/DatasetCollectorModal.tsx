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
  Sparkles
} from 'lucide-react';
import { DatasetSample, GestureKey, LandmarkPoint } from '../types';
import { GESTURE_LIST, GESTURE_DEFINITIONS } from '../data/gestures';
import { normalizeLandmarks } from '../services/gestureClassifier';

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
      alert('Please check the informed consent checkbox before recording training samples.');
      return;
    }

    if (!currentLandmarks || currentLandmarks.length < 21) {
      alert('No active hand landmarks detected by the camera right now. Please present your hand in front of the camera and click Capture again.');
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
      alert('Duplicate pose detected: Hand has not moved sufficiently since the last recorded frame. Adjust position slightly before capturing.');
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
      alert('No samples recorded yet. Capture at least one sample first!');
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
          alert('Invalid format: File does not contain dataset samples.');
        }
      } catch (err) {
        alert('Could not parse JSON dataset file.');
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
    if (confirm('Are you sure you want to clear all collected dataset samples? This action cannot be undone.')) {
      saveSamples([]);
      showToast('Dataset cleared.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md">
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-amber-500/40 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between gap-4 bg-gray-50/70 dark:bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white font-heading">
                  Consented EthSL Dataset Collector
                </h3>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  <ShieldCheck className="w-3 h-3" /> Privacy-First (Geometric Only)
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-gray-400">
                Collect labeled 21-point hand landmark sequences for training machine learning models on Ethiopian Sign Language.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-xs">
          
          {toastMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{toastMsg}</span>
            </div>
          )}

          {/* Consent Banner */}
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 flex items-start gap-3">
            <input
              type="checkbox"
              id="consent-check"
              checked={hasConsent}
              onChange={(e) => setHasConsent(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
            />
            <label htmlFor="consent-check" className="text-slate-800 dark:text-amber-200 leading-relaxed cursor-pointer select-none">
              <strong>Informed Consent Declaration:</strong> I consent to recording anonymized 21-point 3D geometric hand coordinate coordinates and metadata strictly for educational evaluation and training of the EjjiLink AI sign language models. No facial biometric images or raw video frames are ever recorded or uploaded.
            </label>
          </div>

          {/* Recorder Controls */}
          <div className="p-5 rounded-2xl bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 space-y-4">
            <h4 className="font-bold text-slate-900 dark:text-white text-sm font-heading flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Recording Configuration
            </h4>

            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-600 dark:text-gray-400 font-medium mb-1">Target Sign Label</label>
                <select
                  value={selectedLabel}
                  onChange={(e) => setSelectedLabel(e.target.value as GestureKey)}
                  className="w-full bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-medium"
                >
                  {GESTURE_LIST.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.emoji} {g.labelEn} ({g.labelAm}) — {g.signLanguage}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-gray-400 font-medium mb-1">Signer ID (Anonymized)</label>
                <input
                  type="text"
                  value={signerId}
                  onChange={(e) => setSignerId(e.target.value)}
                  placeholder="e.g. signer-htcs-01"
                  className="w-full bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-gray-400 font-medium mb-1">Data Split Allocation</label>
                <select
                  value={selectedSplit}
                  onChange={(e) => setSelectedSplit(e.target.value as any)}
                  className="w-full bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-medium"
                >
                  <option value="train">Training (70%)</option>
                  <option value="val">Validation (15%)</option>
                  <option value="test">Held-Out Test (15%)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-gray-400 font-medium mb-1">Lighting Condition</label>
                <select
                  value={lighting}
                  onChange={(e) => setLighting(e.target.value as any)}
                  className="w-full bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-medium"
                >
                  <option value="normal">Standard Classroom Lighting</option>
                  <option value="bright">Direct Daylight / Bright</option>
                  <option value="low">Dim / Low Lighting</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-gray-400 font-medium mb-1">Camera Distance</label>
                <select
                  value={distance}
                  onChange={(e) => setDistance(e.target.value as any)}
                  className="w-full bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-medium"
                >
                  <option value="medium">Medium Range (0.5m - 1.0m)</option>
                  <option value="close">Close-up Range (&lt; 0.5m)</option>
                  <option value="far">Far Range (&gt; 1.0m)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-gray-400 font-medium mb-1">Session / Notes</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. HTCS Lab Session 2"
                  className="w-full bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-200 dark:border-slate-800">
              <div className="flex items-center gap-2 text-slate-500 dark:text-gray-400">
                <span className={`w-2.5 h-2.5 rounded-full ${currentLandmarks.length === 21 ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                <span>
                  {currentLandmarks.length === 21
                    ? `Live Hand Detected (${currentHandedness} Hand • 21 Landmarks)`
                    : 'Awaiting Hand in Front of Camera'}
                </span>
              </div>

              <button
                onClick={handleCaptureSample}
                disabled={!hasConsent || currentLandmarks.length < 21}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold flex items-center gap-2 shadow-md cursor-pointer transition-all"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Capture Labeled Frame</span>
              </button>
            </div>
          </div>

          {/* Dataset Table & Export Controls */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 dark:text-gray-200 flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-500" />
                <span>Collected Samples ({samples.length})</span>
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportJSON}
                  disabled={samples.length === 0}
                  className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-50 text-slate-700 dark:text-gray-300 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-amber-500" /> Export JSON
                </button>

                <label className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-gray-300 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer">
                  <Upload className="w-3.5 h-3.5 text-emerald-500" /> Import JSON
                  <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
                </label>

                {samples.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    className="p-1.5 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                    title="Clear All Samples"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {samples.length > 0 ? (
              <div className="border border-gray-200 dark:border-slate-800 rounded-2xl overflow-hidden max-h-56 overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-100 dark:bg-slate-950 text-slate-600 dark:text-gray-400 font-semibold border-b border-gray-200 dark:border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Sign</th>
                      <th className="py-2.5 px-3">Signer</th>
                      <th className="py-2.5 px-3">Hand</th>
                      <th className="py-2.5 px-3">Standard</th>
                      <th className="py-2.5 px-3">Time</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-slate-800/80">
                    {samples.map((s) => (
                      <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/40">
                        <td className="py-2 px-3 font-semibold text-slate-900 dark:text-white uppercase">
                          {s.label}
                        </td>
                        <td className="py-2 px-3 text-slate-600 dark:text-gray-400 font-mono text-[11px]">
                          {s.signerId}
                        </td>
                        <td className="py-2 px-3 text-slate-600 dark:text-gray-400">
                          {s.handedness}
                        </td>
                        <td className="py-2 px-3 text-emerald-600 dark:text-emerald-400">
                          {s.signLanguage}
                        </td>
                        <td className="py-2 px-3 text-slate-400 text-[11px]">
                          {new Date(s.timestamp).toLocaleTimeString()}
                        </td>
                        <td className="py-2 px-3 text-right">
                          <button
                            onClick={() => handleDeleteSample(s.id)}
                            className="p-1 rounded text-red-500 hover:bg-red-500/10 transition-colors"
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
              <div className="p-8 text-center bg-gray-50 dark:bg-slate-950/60 rounded-2xl border border-dashed border-gray-300 dark:border-slate-800 text-slate-400">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No dataset samples captured yet. Accept consent and click "Capture Labeled Frame" while gesturing.</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-gray-200 dark:border-slate-800 flex items-center justify-between bg-gray-50/70 dark:bg-slate-950/40 text-xs text-slate-500 dark:text-gray-400">
          <span>Compliant with Section 4 ML training data specifications.</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 text-white font-bold cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
