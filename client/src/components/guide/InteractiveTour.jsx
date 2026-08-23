import React, { useState, useEffect, useCallback } from 'react';
import { useGuide } from '../../context/GuideContext';
import { TOUR_STEPS } from './guideData';
import * as Icons from 'lucide-react';

const InteractiveTour = () => {
  const { isTourActive, tourStep, endTour, nextTourStep, prevTourStep, openGuide } =
    useGuide();
  const [targetRect, setTargetRect] = useState(null);

  const currentStep = TOUR_STEPS[tourStep] || TOUR_STEPS[0];

  const updateTargetPosition = useCallback(() => {
    if (!isTourActive || !currentStep) return;
    const targetElement = document.querySelector(currentStep.target);
    if (targetElement) {
      const rect = targetElement.getBoundingClientRect();
      setTargetRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        bottom: rect.bottom,
        right: rect.right,
      });
      // Scroll smoothly into view if off-screen
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
      // If target not in viewport, center fallback
      setTargetRect(null);
    }
  }, [isTourActive, currentStep]);

  useEffect(() => {
    updateTargetPosition();
    window.addEventListener('resize', updateTargetPosition);
    window.addEventListener('scroll', updateTargetPosition);
    return () => {
      window.removeEventListener('resize', updateTargetPosition);
      window.removeEventListener('scroll', updateTargetPosition);
    };
  }, [updateTargetPosition]);

  // Keyboard navigation
  useEffect(() => {
    if (!isTourActive) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        endTour(false);
      } else if (e.key === 'ArrowRight') {
        nextTourStep(TOUR_STEPS.length);
      } else if (e.key === 'ArrowLeft') {
        prevTourStep();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTourActive, endTour, nextTourStep, prevTourStep]);

  if (!isTourActive) return null;

  // Calculate tooltip placement styles
  const getTooltipPositionStyle = () => {
    if (!targetRect) {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }

    const margin = 16;
    const placement = currentStep.placement || 'bottom';

    if (placement === 'right') {
      return {
        top: Math.max(20, Math.min(window.innerHeight - 300, targetRect.top + targetRect.height / 2 - 120)),
        left: targetRect.right + margin,
      };
    } else if (placement === 'bottom') {
      return {
        top: targetRect.bottom + margin,
        left: Math.max(20, Math.min(window.innerWidth - 380, targetRect.left + targetRect.width / 2 - 170)),
      };
    } else if (placement === 'bottom-left') {
      return {
        top: targetRect.bottom + margin,
        left: Math.max(20, targetRect.right - 360),
      };
    } else {
      return {
        top: Math.max(20, targetRect.top - 240),
        left: Math.max(20, Math.min(window.innerWidth - 380, targetRect.left)),
      };
    }
  };

  const isLastStep = tourStep === TOUR_STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[200] pointer-events-auto">
      {/* Dark overlay backdrop */}
      <div className="absolute inset-0 bg-black/65 backdrop-blur-[2px] transition-all duration-300" />

      {/* Target Spotlight Highlight Ring */}
      {targetRect && (
        <div
          className="absolute transition-all duration-300 ease-out rounded-2xl pointer-events-none ring-4 ring-indigo-500 shadow-[0_0_0_9999px_rgba(0,0,0,0.65)]"
          style={{
            top: targetRect.top - 6,
            left: targetRect.left - 6,
            width: targetRect.width + 12,
            height: targetRect.height + 12,
          }}
        />
      )}

      {/* Tooltip Card */}
      <div
        className="fixed z-[210] w-[90vw] max-w-sm sm:max-w-md bg-white dark:bg-dark-main border border-slate-200 dark:border-white/15 rounded-3xl shadow-2xl p-6 transition-all duration-300 animate-slide-up flex flex-col gap-4"
        style={getTooltipPositionStyle()}
      >
        {/* Step Indicator Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-6 px-2.5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-extrabold text-[11px] items-center justify-center">
              Step {tourStep + 1} of {TOUR_STEPS.length}
            </span>
            <span className="text-xs font-semibold text-slate-400">
              Interactive Tour
            </span>
          </div>

          <button
            onClick={() => endTour(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            title="Skip Tour"
          >
            <Icons.X size={16} />
          </button>
        </div>

        {/* Content */}
        <div>
          <h3 className="text-base font-black text-slate-900 dark:text-white mb-1.5">
            {currentStep.title}
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {currentStep.content}
          </p>
        </div>

        {/* Step dots */}
        <div className="flex items-center justify-center gap-1.5 py-1">
          {TOUR_STEPS.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === tourStep
                  ? 'w-6 bg-indigo-600 dark:bg-indigo-400'
                  : 'w-1.5 bg-slate-300 dark:bg-white/20'
              }`}
            />
          ))}
        </div>

        {/* Buttons Controls */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-white/10">
          <button
            onClick={() => endTour(false)}
            className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
          >
            Skip Tour
          </button>

          <div className="flex items-center gap-2">
            {tourStep > 0 && (
              <button
                onClick={prevTourStep}
                className="px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer"
              >
                Back
              </button>
            )}

            <button
              onClick={() => {
                if (isLastStep) {
                  endTour(true);
                  openGuide();
                } else {
                  nextTourStep(TOUR_STEPS.length);
                }
              }}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 cursor-pointer"
            >
              <span>{isLastStep ? 'Finish & Open Guide' : 'Next'}</span>
              <Icons.ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveTour;
