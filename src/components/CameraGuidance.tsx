import React from 'react';
import { Compass, Lightbulb, Clock, CheckCircle } from 'lucide-react';

export const CameraGuidance: React.FC = () => {
  return (
    <section id="camera-guide" className="py-12 scroll-mt-20">
      <div className="bg-gradient-to-br from-emerald-50 via-white to-amber-50 dark:from-emerald-950/40 dark:via-slate-900 dark:to-amber-950/30 rounded-3xl p-6 sm:p-8 border border-gray-200 dark:border-emerald-500/30 shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-600 to-amber-500 text-white flex items-center justify-center font-bold text-xl shrink-0 shadow-md">
            🤲
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white font-heading">
              Camera Guidance for Optimal Precision
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-gray-400">
              Developed by HTCS student engineers in React.js to ensure high-confidence detection across all lighting and hand positions.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-white/90 dark:bg-slate-950/80 border border-gray-200 dark:border-emerald-500/20 shadow-xs space-y-2">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm font-heading">
              <Compass className="w-4 h-4" />
              <span>1. Distance: 30–50 cm</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-gray-300 leading-relaxed">
              Position your palm and all 5 fingertips clearly inside the viewport. Keep hand centered without touching camera edges so all 21 joints are tracked.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/90 dark:bg-slate-950/80 border border-gray-200 dark:border-amber-500/20 shadow-xs space-y-2">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-sm font-heading">
              <Clock className="w-4 h-4" />
              <span>2. Steady 1-Second Hold</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-gray-300 leading-relaxed">
              EjjiLink AI requires 5 consecutive high-confidence frames (&gt;80%) before confirming a translation lock. Holding steady eliminates erratic false-triggers.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/90 dark:bg-slate-950/80 border border-gray-200 dark:border-emerald-500/20 shadow-xs space-y-2">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm font-heading">
              <Lightbulb className="w-4 h-4" />
              <span>3. Front Lighting</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-gray-300 leading-relaxed">
              Ensure soft light illuminates your hand from the front. Avoid bright windows directly behind you which silhouette your hand and reduce landmark contrast.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
