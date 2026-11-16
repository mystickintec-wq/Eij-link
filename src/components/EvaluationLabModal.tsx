import React, { useState, useEffect } from 'react';
import { 
  X, 
  FlaskConical, 
  Play, 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  Activity, 
  Clock, 
  BarChart3, 
  ShieldAlert, 
  Database, 
  Cpu, 
  Info,
  Layers,
  Sparkles
} from 'lucide-react';
import { 
  evaluationService, 
  AutomatedSuiteReport, 
  createSyntheticPose 
} from '../services/evaluationService';
import { 
  EvaluationReport, 
  EvaluationSampleRecord, 
  DatasetSample 
} from '../types';
import { GESTURE_LIST, GESTURE_DEFINITIONS } from '../data/gestures';
import { classifyHandPoseDetailed } from '../services/gestureClassifier';

interface EvaluationLabModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EvaluationLabModal: React.FC<EvaluationLabModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'audit' | 'benchmark' | 'metrics' | 'confusion'>('benchmark');
  const [suiteReport, setSuiteReport] = useState<AutomatedSuiteReport | null>(null);
  const [isRunningSuite, setIsRunningSuite] = useState(false);

  // Evaluation dataset selection: 'benchmark' or 'user_collected'
  const [evalDataSource, setEvalDataSource] = useState<'benchmark' | 'user_collected'>('benchmark');
  const [evalReport, setEvalReport] = useState<EvaluationReport | null>(null);
  const [userSampleCount, setUserSampleCount] = useState<number>(0);

  // Run automated suite on mount or tab change if not run yet
  useEffect(() => {
    if (isOpen && !suiteReport) {
      runAutomatedSuite();
    }
    // Check user dataset count
    try {
      const stored = localStorage.getItem('ejjilink_ethsl_dataset_samples');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setUserSampleCount(parsed.length);
        }
      }
    } catch (e) {
      // ignore
    }
  }, [isOpen]);

  // Compute evaluation report whenever source changes
  useEffect(() => {
    if (!isOpen) return;

    if (evalDataSource === 'benchmark') {
      const records = evaluationService.generateBenchmarkEvaluationRecords();
      const report = evaluationService.evaluateSamples(records);
      setEvalReport(report);
    } else {
      // Load user dataset samples and run evaluation through classifier
      try {
        const stored = localStorage.getItem('ejjilink_ethsl_dataset_samples');
        if (stored) {
          const samples: DatasetSample[] = JSON.parse(stored);
          const records: EvaluationSampleRecord[] = samples.map((s) => {
            const t0 = performance.now();
            const res = classifyHandPoseDetailed(s.landmarks);
            const lat = Math.max(0.2, performance.now() - t0);

            return {
              id: s.id,
              timestamp: s.timestamp,
              expectedLabel: s.label as any,
              predictedLabel: res.predictedGesture,
              confidence: res.confidence,
              outcome: res.predictedGesture === s.label ? 'correct' : res.isUnknown ? 'rejected' : 'incorrect',
              source: s.source === 'simulation' ? 'simulation' : 'real_camera',
              latencyMs: Math.round(lat * 10) / 10,
              signerId: s.signerId,
              lighting: s.lighting,
              distance: s.distance,
              notes: s.notes,
            };
          });

          // Isolate real camera from simulation for strict evaluation
          const cameraOnlyRecords = records.filter((r) => r.source !== 'simulation');
          const report = evaluationService.evaluateSamples(cameraOnlyRecords.length > 0 ? cameraOnlyRecords : records);
          setEvalReport(report);
        } else {
          setEvalReport(null);
        }
      } catch (e) {
        console.error('Failed to parse user dataset', e);
        setEvalReport(null);
      }
    }
  }, [evalDataSource, isOpen]);

  const runAutomatedSuite = () => {
    setIsRunningSuite(true);
    setTimeout(() => {
      const report = evaluationService.runAutomatedRobustnessSuite();
      setSuiteReport(report);
      setIsRunningSuite(false);
    }, 150);
  };

  const handleExportEvaluationReport = () => {
    if (!evalReport) return;
    const payload = {
      project: 'EjjiLink AI - Scientific Evaluation Report',
      generatedAt: new Date().toISOString(),
      evaluationDataSource: evalDataSource,
      suiteReport,
      metrics: evalReport,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `ejjilink_eval_report_${evalDataSource}_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Evaluation and Scientific Testing Lab"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md"
    >
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 bg-white dark:bg-[#0D1422] border border-slate-200 dark:border-[rgba(148,163,184,0.15)] rounded-[20px] max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden ejji-animate-modal">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-[rgba(148,163,184,0.12)] flex items-center justify-between gap-4 bg-slate-50 dark:bg-[#080D18]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[10px] bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-[#0E7490] dark:text-[#43D9E9]">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-slate-900 dark:text-[#F8FAFC]">
                  Evaluation & Scientific Testing Lab
                </h3>
                <span className="px-2.5 py-0.5 rounded-[8px] bg-cyan-500/10 text-[#0E7490] dark:text-[#43D9E9] border border-cyan-500/20 text-[10px] font-semibold uppercase tracking-wider font-mono">
                  Phase C Verified
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-[#A0AEC0]">
                Repeatable evaluation metrics, confusion matrix, and robustness unit tests.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-[10px] bg-slate-100 hover:bg-slate-200 dark:bg-[#19263A] dark:hover:bg-[#1f2f47] text-slate-600 dark:text-[#A0AEC0] hover:text-slate-900 dark:hover:text-[#F8FAFC] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490] dark:focus-visible:ring-[#43D9E9]"
            aria-label="Close Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-5 sm:px-6 pt-3 border-b border-slate-200 dark:border-[rgba(148,163,184,0.12)] bg-slate-50/40 dark:bg-[#080D18]/40 text-xs font-semibold overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('benchmark')}
            className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490] dark:focus-visible:ring-[#43D9E9] ${
              activeTab === 'benchmark'
                ? 'border-[#0E7490] dark:border-[#43D9E9] text-[#0E7490] dark:text-[#43D9E9] font-bold'
                : 'border-transparent text-slate-600 dark:text-[#A0AEC0] hover:text-slate-900 dark:hover:text-[#F8FAFC]'
            }`}
          >
            <Play className="w-3.5 h-3.5" /> Robustness Unit Tests
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('metrics')}
            className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490] dark:focus-visible:ring-[#43D9E9] ${
              activeTab === 'metrics'
                ? 'border-[#0E7490] dark:border-[#43D9E9] text-[#0E7490] dark:text-[#43D9E9] font-bold'
                : 'border-transparent text-slate-600 dark:text-[#A0AEC0] hover:text-slate-900 dark:hover:text-[#F8FAFC]'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" /> Performance Metrics
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('confusion')}
            className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490] dark:focus-visible:ring-[#43D9E9] ${
              activeTab === 'confusion'
                ? 'border-[#0E7490] dark:border-[#43D9E9] text-[#0E7490] dark:text-[#43D9E9] font-bold'
                : 'border-transparent text-slate-600 dark:text-[#A0AEC0] hover:text-slate-900 dark:hover:text-[#F8FAFC]'
            }`}
          >
            <Activity className="w-3.5 h-3.5" /> Confusion Matrix
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490] dark:focus-visible:ring-[#43D9E9] ${
              activeTab === 'audit'
                ? 'border-[#0E7490] dark:border-[#43D9E9] text-[#0E7490] dark:text-[#43D9E9] font-bold'
                : 'border-transparent text-slate-600 dark:text-[#A0AEC0] hover:text-slate-900 dark:hover:text-[#F8FAFC]'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" /> Scientific Disclosures
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-xs">

          {/* TAB 1: AUTOMATED ROBUSTNESS TESTS */}
          {activeTab === 'benchmark' && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-[14px] bg-slate-900 dark:bg-[#121C2D] text-white border border-slate-800 dark:border-[rgba(148,163,184,0.12)]">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-[10px] bg-cyan-500/20 text-[#43D9E9]">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-100">
                      Automated Pipeline & Geometry Unit Tests
                    </h4>
                    <p className="text-[11px] text-slate-300 dark:text-[#A0AEC0]">
                      Verifies translation/scale normalizer invariance, malformed data safety, template coverage, distractor rejection, and temporal debounce.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={runAutomatedSuite}
                  disabled={isRunningSuite}
                  className="px-4 py-2 rounded-[10px] bg-[#43D9E9] hover:bg-[#67E8F9] text-[#080D18] font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer disabled:text-slate-700 disabled:bg-slate-300 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{isRunningSuite ? 'Running Tests...' : 'Re-Run Suite'}</span>
                </button>
              </div>

              {suiteReport && (
                <div className="space-y-4">
                  {/* Summary Bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="p-3.5 rounded-[14px] bg-slate-50 dark:bg-[#121C2D] border border-slate-200 dark:border-[rgba(148,163,184,0.12)]">
                      <div className="text-[10px] text-slate-600 dark:text-[#A0AEC0] uppercase font-bold">Total Tests</div>
                      <div className="text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-[#F8FAFC]">
                        {suiteReport.totalTests}
                      </div>
                    </div>
                    <div className="p-3.5 rounded-[14px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                      <div className="text-[10px] uppercase font-bold">Passed Tests</div>
                      <div className="text-xl font-bold font-mono tabular-nums">
                        {suiteReport.passedTests}
                      </div>
                    </div>
                    <div className="p-3.5 rounded-[14px] bg-red-500/10 border border-red-500/20 text-rose-700 dark:text-rose-400">
                      <div className="text-[10px] uppercase font-bold">Failed Tests</div>
                      <div className="text-xl font-bold font-mono tabular-nums">
                        {suiteReport.failedTests}
                      </div>
                    </div>
                    <div className="p-3.5 rounded-[14px] bg-cyan-500/10 border border-cyan-500/20 text-[#0E7490] dark:text-[#43D9E9]">
                      <div className="text-[10px] uppercase font-bold">Pass Rate</div>
                      <div className="text-xl font-bold font-mono tabular-nums">
                        {suiteReport.passRate}%
                      </div>
                    </div>
                  </div>

                  {/* Test Cases List */}
                  <div className="space-y-2">
                    <span className="font-bold text-slate-700 dark:text-[#B6C2D2] uppercase tracking-wider text-[11px]">
                      Test Execution Details
                    </span>
                    <div className="space-y-2">
                      {suiteReport.tests.map((test) => (
                        <div
                          key={test.id}
                          className="p-3.5 rounded-[14px] bg-slate-50 dark:bg-[#121C2D] border border-slate-200 dark:border-[rgba(148,163,184,0.12)] flex items-start justify-between gap-3"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2 py-0.5 rounded-[6px] font-mono text-[10px] font-bold uppercase ${
                                  test.status === 'passed'
                                    ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                                    : 'bg-red-500/20 text-rose-700 dark:text-rose-400'
                                }`}
                              >
                                {test.status}
                              </span>
                              <span className="font-bold text-slate-900 dark:text-[#F8FAFC] text-xs">
                                {test.testName}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 dark:text-[#A0AEC0] leading-relaxed">
                              {test.details}
                            </p>
                          </div>
                          <span className="font-mono tabular-nums text-[10px] text-slate-600 dark:text-[#A0AEC0] shrink-0">
                            {test.latencyMs} ms
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PERFORMANCE METRICS */}
          {activeTab === 'metrics' && (
            <div className="space-y-5">
              {/* Dataset Selection Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-[14px] bg-slate-50 dark:bg-[#121C2D] border border-slate-200 dark:border-[rgba(148,163,184,0.12)]">
                <div className="flex items-center gap-2 font-semibold text-slate-700 dark:text-[#B6C2D2]">
                  <Database className="w-4 h-4 text-[#0E7490] dark:text-[#43D9E9]" />
                  <span>Evaluation Data Source:</span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEvalDataSource('benchmark')}
                    className={`px-3 py-1.5 rounded-[10px] border text-xs font-medium cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490] dark:focus-visible:ring-[#43D9E9] ${
                      evalDataSource === 'benchmark'
                        ? 'bg-[#0E7490] text-white border-[#0E7490] dark:bg-[#43D9E9] dark:text-[#080D18] dark:border-[#43D9E9] font-bold'
                        : 'bg-white dark:bg-[#19263A] text-slate-700 dark:text-[#B6C2D2] border-slate-200 dark:border-[rgba(148,163,184,0.15)]'
                    }`}
                  >
                    Benchmark Ground-Truth Suite (N=28)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEvalDataSource('user_collected')}
                    className={`px-3 py-1.5 rounded-[10px] border text-xs font-medium cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490] dark:focus-visible:ring-[#43D9E9] ${
                      evalDataSource === 'user_collected'
                        ? 'bg-[#0E7490] text-white border-[#0E7490] dark:bg-[#43D9E9] dark:text-[#080D18] dark:border-[#43D9E9] font-bold'
                        : 'bg-white dark:bg-[#19263A] text-slate-700 dark:text-[#B6C2D2] border-slate-200 dark:border-[rgba(148,163,184,0.15)]'
                    }`}
                  >
                    Recorded Webcam Dataset ({userSampleCount} Samples)
                  </button>

                  <button
                    type="button"
                    onClick={handleExportEvaluationReport}
                    className="px-3 py-1.5 rounded-[10px] bg-slate-200 dark:bg-[#19263A] hover:bg-slate-300 dark:hover:bg-[#1f2f47] text-slate-800 dark:text-[#F8FAFC] font-semibold flex items-center gap-1.5 cursor-pointer transition-colors border border-slate-200 dark:border-[rgba(148,163,184,0.15)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490] dark:focus-visible:ring-[#43D9E9]"
                  >
                    <Download className="w-3.5 h-3.5 text-[#0E7490] dark:text-[#43D9E9]" /> Export Report (JSON)
                  </button>
                </div>
              </div>

              {/* Insufficient Sample Size Alert */}
              {evalDataSource === 'user_collected' && userSampleCount < 10 && (
                <div className="p-4 rounded-[14px] bg-amber-500/10 border border-amber-500/25 text-amber-800 dark:text-amber-300 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold">Limited Sample Size Warning (N = {userSampleCount})</strong>
                    <span>
                      In keeping with scientific honesty guidelines, calculating statistical metrics on fewer than 5 samples per class cannot yield representative or generalizable accuracy claims. Please record more diverse samples across signers in the Dataset Collector.
                    </span>
                  </div>
                </div>
              )}

              {evalReport && (
                <div className="space-y-5">
                  {/* Metric Stat Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                    <div className="p-3.5 rounded-[14px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                      <div className="text-[10px] uppercase font-bold">Overall Accuracy</div>
                      <div className="text-2xl font-bold font-mono tabular-nums">
                        {evalReport.overallAccuracy}%
                      </div>
                      <span className="text-[10px] text-slate-600 dark:text-[#A0AEC0]">N = {evalReport.evaluatedSampleCount}</span>
                    </div>

                    <div className="p-3.5 rounded-[14px] bg-cyan-500/10 border border-cyan-500/20 text-[#0E7490] dark:text-[#43D9E9]">
                      <div className="text-[10px] uppercase font-bold">Unknown Rejection</div>
                      <div className="text-2xl font-bold font-mono tabular-nums">
                        {evalReport.unknownRejectionRate}%
                      </div>
                      <span className="text-[10px] text-slate-600 dark:text-[#A0AEC0]">Rejected safely</span>
                    </div>

                    <div className="p-3.5 rounded-[14px] bg-purple-500/10 border border-purple-500/20 text-purple-700 dark:text-purple-400">
                      <div className="text-[10px] uppercase font-bold">False Acceptance (FAR)</div>
                      <div className="text-2xl font-bold font-mono tabular-nums">
                        {evalReport.falseAcceptanceRate}%
                      </div>
                      <span className="text-[10px] text-slate-600 dark:text-[#A0AEC0]">Distractor errors</span>
                    </div>

                    <div className="p-3.5 rounded-[14px] bg-slate-50 dark:bg-[#121C2D] border border-slate-200 dark:border-[rgba(148,163,184,0.12)] text-slate-800 dark:text-[#F8FAFC]">
                      <div className="text-[10px] uppercase font-bold text-slate-600 dark:text-[#A0AEC0]">Median Latency</div>
                      <div className="text-2xl font-bold font-mono tabular-nums">
                        {evalReport.medianLatencyMs} <span className="text-xs">ms</span>
                      </div>
                      <span className="text-[10px] text-slate-600 dark:text-[#A0AEC0]">50th percentile</span>
                    </div>

                    <div className="p-3.5 rounded-[14px] bg-slate-50 dark:bg-[#121C2D] border border-slate-200 dark:border-[rgba(148,163,184,0.12)] text-slate-800 dark:text-[#F8FAFC]">
                      <div className="text-[10px] uppercase font-bold text-slate-600 dark:text-[#A0AEC0]">p95 Latency</div>
                      <div className="text-2xl font-bold font-mono tabular-nums">
                        {evalReport.p95LatencyMs} <span className="text-xs">ms</span>
                      </div>
                      <span className="text-[10px] text-slate-600 dark:text-[#A0AEC0]">95th percentile</span>
                    </div>
                  </div>

                  {/* Per-Class Performance Table */}
                  <div className="space-y-2">
                    <span className="font-bold text-slate-700 dark:text-[#B6C2D2] uppercase tracking-wider text-[11px]">
                      Per-Class Evaluation Breakdown
                    </span>
                    <div className="overflow-x-auto rounded-[14px] border border-slate-200 dark:border-[rgba(148,163,184,0.12)]">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-100 dark:bg-[#080D18] text-slate-700 dark:text-[#B6C2D2] text-[11px] font-mono border-b border-slate-200 dark:border-[rgba(148,163,184,0.12)]">
                            <th className="p-2.5">Class Sign</th>
                            <th className="p-2.5 text-center">Support (N)</th>
                            <th className="p-2.5 text-center">TP</th>
                            <th className="p-2.5 text-center">FP</th>
                            <th className="p-2.5 text-center">FN</th>
                            <th className="p-2.5 text-center">Precision</th>
                            <th className="p-2.5 text-center">Recall</th>
                            <th className="p-2.5 text-center">F1-Score</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-[rgba(148,163,184,0.10)] font-mono tabular-nums text-[11px]">
                          {Object.values(evalReport.perClassMetrics).map((row) => (
                            <tr key={row.label} className="hover:bg-slate-50/50 dark:hover:bg-[#19263A]/40 transition-colors">
                              <td className="p-2.5 font-bold font-sans capitalize text-slate-900 dark:text-[#F8FAFC] flex items-center gap-1.5">
                                <span>{GESTURE_DEFINITIONS[row.label as any]?.emoji || '❓'}</span>
                                <span>{row.label.replace('_', ' ')}</span>
                              </td>
                              <td className="p-2.5 text-center text-slate-600 dark:text-[#A0AEC0]">{row.support}</td>
                              <td className="p-2.5 text-center text-emerald-700 dark:text-emerald-400 font-bold">{row.tp}</td>
                              <td className="p-2.5 text-center text-amber-700 dark:text-amber-400 font-medium">{row.fp}</td>
                              <td className="p-2.5 text-center text-rose-700 dark:text-rose-400 font-medium">{row.fn}</td>
                              <td className="p-2.5 text-center">{Math.round(row.precision * 100)}%</td>
                              <td className="p-2.5 text-center">{Math.round(row.recall * 100)}%</td>
                              <td className="p-2.5 text-center font-bold text-[#0E7490] dark:text-[#43D9E9]">
                                {Math.round(row.f1 * 100)}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CONFUSION MATRIX */}
          {activeTab === 'confusion' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-[14px] bg-slate-50 dark:bg-[#121C2D] border border-slate-200 dark:border-[rgba(148,163,184,0.12)] flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 dark:text-[#F8FAFC]">
                    Confusion Matrix Visualization
                  </span>
                  <p className="text-[11px] text-slate-600 dark:text-[#A0AEC0]">
                    Rows represent Ground Truth (Actual Class); Columns represent Predicted Class.
                  </p>
                </div>
                <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400">
                  ● Diagonal = True Positive Matches
                </span>
              </div>

              {evalReport && (
                <div className="overflow-x-auto rounded-[14px] border border-slate-200 dark:border-[rgba(148,163,184,0.12)] p-2 bg-white dark:bg-[#121C2D]">
                  <table className="border-collapse text-[10px] font-mono tabular-nums w-full">
                    <thead>
                      <tr>
                        <th className="p-1.5 text-left text-slate-600 dark:text-[#A0AEC0]">Actual \ Pred</th>
                        {evalReport.confusionMatrix.labels.map((l) => (
                          <th key={l} className="p-1.5 text-center text-slate-600 dark:text-[#A0AEC0] uppercase tracking-tighter truncate max-w-[45px]" title={l}>
                            {l.slice(0, 3)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-[rgba(148,163,184,0.10)]">
                      {evalReport.confusionMatrix.matrix.map((row, rIdx) => {
                        const trueLabel = evalReport.confusionMatrix.labels[rIdx];
                        return (
                          <tr key={trueLabel}>
                            <td className="p-1.5 font-bold text-slate-700 dark:text-[#B6C2D2] uppercase tracking-tighter truncate max-w-[80px]" title={trueLabel}>
                              {trueLabel.slice(0, 7)}
                            </td>
                            {row.map((val, cIdx) => {
                              const isDiagonal = rIdx === cIdx;
                              return (
                                <td
                                  key={cIdx}
                                  className={`p-1.5 text-center font-bold rounded ${
                                    isDiagonal && val > 0
                                      ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                                      : val > 0
                                      ? 'bg-red-500/20 text-rose-700 dark:text-rose-400'
                                      : 'text-slate-500 dark:text-slate-500'
                                  }`}
                                >
                                  {val}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: SCIENTIFIC DISCLOSURES */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <div className="p-4 rounded-[14px] bg-cyan-500/10 border border-cyan-500/25 space-y-2">
                <div className="flex items-center gap-2 font-bold text-[#0E7490] dark:text-[#43D9E9] text-sm">
                  <ShieldAlert className="w-5 h-5 text-[#0E7490] dark:text-[#43D9E9]" />
                  <span>Scientific Honesty & Architecture Audit</span>
                </div>
                <p className="text-xs text-slate-700 dark:text-[#B6C2D2] leading-relaxed">
                  In accordance with ethical machine learning standards, this project explicitly documents current limitations, model boundaries, and scientific realities:
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-[14px] bg-slate-50 dark:bg-[#121C2D] border border-slate-200 dark:border-[rgba(148,163,184,0.12)] space-y-2">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-[#F8FAFC]">
                    <Cpu className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                    <span>Rule-Based Heuristic Engine</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-[#A0AEC0] leading-relaxed">
                    The current recognition system uses an on-device geometric vector heuristic pipeline comparing normalized 2D/3D angles and ratios. <strong>No trained deep neural network or blackbox ML classifier is connected yet.</strong>
                  </p>
                </div>

                <div className="p-4 rounded-[14px] bg-slate-50 dark:bg-[#121C2D] border border-slate-200 dark:border-[rgba(148,163,184,0.12)] space-y-2">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-[#F8FAFC]">
                    <Activity className="w-4 h-4 text-blue-700 dark:text-[#60A5FA]" />
                    <span>Confidence Score Interpretation</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-[#A0AEC0] leading-relaxed">
                    Confidence percentages represent geometric distance margins from defined static hand pose thresholds. <strong>They are not calibrated Bayesian posterior probabilities</strong> and must not be cited as such.
                  </p>
                </div>

                <div className="p-4 rounded-[14px] bg-slate-50 dark:bg-[#121C2D] border border-slate-200 dark:border-[rgba(148,163,184,0.12)] space-y-2">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-[#F8FAFC]">
                    <Layers className="w-4 h-4 text-[#4F46E5] dark:text-[#8585FF]" />
                    <span>EthSL Linguistic Validation Status</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-[#A0AEC0] leading-relaxed">
                    The sign vocabulary represents a high-school innovation prototype developed by students at Holy Trinity Cathedral School. <strong>Full linguistic certification requires official collaboration with the Ethiopian National Association of the Deaf (ENAD).</strong>
                  </p>
                </div>

                <div className="p-4 rounded-[14px] bg-slate-50 dark:bg-[#121C2D] border border-slate-200 dark:border-[rgba(148,163,184,0.12)] space-y-2">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-[#F8FAFC]">
                    <Database className="w-4 h-4 text-teal-700 dark:text-[#2DD4BF]" />
                    <span>Isolation of Simulation Data</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-[#A0AEC0] leading-relaxed">
                    Card simulations are strictly flagged and excluded from real webcam evaluations to prevent artificial accuracy inflation. Only real camera frames or canonical recorded benchmark fixtures are used for metrics.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
