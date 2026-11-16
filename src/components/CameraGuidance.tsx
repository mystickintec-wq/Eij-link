import React from 'react';
import { Compass, Lightbulb, Clock } from 'lucide-react';
import { Card } from './ui';

export const CameraGuidance: React.FC = () => {
  return (
    <section id="camera-guide" className="py-6 scroll-mt-20">
      <Card padding="lg" className="shadow-sm">
        <div className="flex items-center gap-3.5 mb-6">
          <div
            className="w-10 h-10 rounded-[10px] bg-[#0E7490]/10 dark:bg-[#43D9E9]/15 text-[#0E7490] dark:text-[#43D9E9] flex items-center justify-center shrink-0"
            aria-hidden="true"
          >
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-heading text-lg sm:text-xl font-bold text-slate-900 dark:text-[#F4F7FB]">
              Camera Guidance for Optimal Precision
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-[#A0AEC0]">
              Developed by HTCS student engineers to ensure high-confidence gesture recognition across diverse lighting and hand distances.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <Card variant="elevated" padding="sm" className="space-y-2 p-5">
            <div className="flex items-center gap-2 text-[#0E7490] dark:text-[#43D9E9] font-semibold text-xs sm:text-sm">
              <Compass className="w-4 h-4" aria-hidden="true" />
              <span>1. Distance: 30–50 cm</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-[#A0AEC0] leading-relaxed">
              Position your palm and all 5 fingertips clearly inside the viewport. Keep your hand centered without touching camera edges so all 21 skeletal joints are tracked.
            </p>
          </Card>

          <Card variant="elevated" padding="sm" className="space-y-2 p-5">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-semibold text-xs sm:text-sm">
              <Clock className="w-4 h-4" aria-hidden="true" />
              <span>2. Steady 1-Second Hold</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-[#A0AEC0] leading-relaxed">
              EjjiLink AI requires 5 consecutive high-confidence frames (&gt;80%) before confirming a translation lock. Holding steady eliminates erratic false triggers.
            </p>
          </Card>

          <Card variant="elevated" padding="sm" className="space-y-2 p-5">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-semibold text-xs sm:text-sm">
              <Lightbulb className="w-4 h-4" aria-hidden="true" />
              <span>3. Front Lighting</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-[#A0AEC0] leading-relaxed">
              Ensure soft light illuminates your hand from the front. Avoid bright windows directly behind you which silhouette your hand and reduce landmark contrast.
            </p>
          </Card>
        </div>
      </Card>
    </section>
  );
};
