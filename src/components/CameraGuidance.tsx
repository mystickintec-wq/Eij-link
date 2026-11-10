import React from 'react';
import { Compass, Lightbulb, Clock } from 'lucide-react';

export const CameraGuidance: React.FC = () => {
  return (
    <section id="camera-guide" className="py-8 scroll-mt-20">
      <div className="bg-white dark:bg-[#121C2D] rounded-[18px] p-6 sm:p-7 border border-slate-200 dark:border-[rgba(148,163,184,0.12)] shadow-sm">
        <div className="flex items-center gap-3.5 mb-6">
          <div className="w-10 h-10 rounded-[10px] bg-[#22D3EE]/10 text-[#22D3EE] flex items-center justify-center shrink-0">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-[#F8FAFC]">
              Camera Guidance for Optimal Precision
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-[#8493A8]">
              Developed by HTCS student engineers to ensure high-confidence gesture recognition across diverse lighting and hand distances.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-5 rounded-[14px] bg-slate-50 dark:bg-[#0D1422] border border-slate-200 dark:border-[rgba(148,163,184,0.12)] space-y-2">
            <div className="flex items-center gap-2 text-[#22D3EE] font-semibold text-xs sm:text-sm">
              <Compass className="w-4 h-4" />
              <span>1. Distance: 30–50 cm</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-[#B6C2D2] leading-relaxed">
              Position your palm and all 5 fingertips clearly inside the viewport. Keep your hand centered without touching camera edges so all 21 skeletal joints are tracked.
            </p>
          </div>

          <div className="p-5 rounded-[14px] bg-slate-50 dark:bg-[#0D1422] border border-slate-200 dark:border-[rgba(148,163,184,0.12)] space-y-2">
            <div className="flex items-center gap-2 text-[#FBBF24] font-semibold text-xs sm:text-sm">
              <Clock className="w-4 h-4" />
              <span>2. Steady 1-Second Hold</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-[#B6C2D2] leading-relaxed">
              EjjiLink AI requires 5 consecutive high-confidence frames (&gt;80%) before confirming a translation lock. Holding steady eliminates erratic false triggers.
            </p>
          </div>

          <div className="p-5 rounded-[14px] bg-slate-50 dark:bg-[#0D1422] border border-slate-200 dark:border-[rgba(148,163,184,0.12)] space-y-2">
            <div className="flex items-center gap-2 text-[#2DD4BF] font-semibold text-xs sm:text-sm">
              <Lightbulb className="w-4 h-4" />
              <span>3. Front Lighting</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-[#B6C2D2] leading-relaxed">
              Ensure soft light illuminates your hand from the front. Avoid bright windows directly behind you which silhouette your hand and reduce landmark contrast.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
