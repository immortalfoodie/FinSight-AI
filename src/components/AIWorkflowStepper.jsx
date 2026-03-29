import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Check, GitBranch, Circle } from 'lucide-react';

const STEPS = [
  { id: 1, label: 'Input collection', detail: 'Structured capture of salary, deductions, and preferences.' },
  { id: 2, label: 'Validation', detail: 'Range checks, caps (e.g. 80C ₹1.5L), and consistency rules.' },
  { id: 3, label: 'Financial calculations', detail: 'Slab-wise tax, HRA, cess, and regime comparison.' },
  { id: 4, label: 'Regulatory rules applied', detail: 'FY 2025–26 slabs, rebates, and deduction limits.' },
  { id: 5, label: 'Final plan generation', detail: 'Ranked recommendation, savings estimate, and next actions.' },
];

const STEP_MS = 580;
const START_MS = 320;

function getStepState(i, doneCount, activeIndex) {
  if (i < doneCount) return 'done';
  if (activeIndex !== null && i === activeIndex) return 'active';
  return 'pending';
}

/**
 * Visual multi-step flow — staged animation when expanded (active work → complete + check).
 */
export default function AIWorkflowStepper({ defaultOpen = true, className = '' }) {
  const [open, setOpen] = useState(defaultOpen);
  const [doneCount, setDoneCount] = useState(0);
  const [activeIndex, setActiveIndex] = useState(null);

  useEffect(() => {
    if (!open) {
      setDoneCount(0);
      setActiveIndex(null);
      return;
    }

    const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setDoneCount(STEPS.length);
      setActiveIndex(null);
      return;
    }

    setDoneCount(0);
    setActiveIndex(0);

    const timers = [];
    for (let k = 0; k < STEPS.length; k++) {
      timers.push(
        window.setTimeout(() => {
          setDoneCount(k + 1);
          setActiveIndex(k < STEPS.length - 1 ? k + 1 : null);
        }, START_MS + STEP_MS * (k + 1)),
      );
    }

    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [open]);

  const isRunning = open && activeIndex !== null;

  return (
    <section
      className={`ai-workflow glass-panel ${className}`.trim()}
      aria-labelledby="ai-workflow-heading"
      aria-busy={isRunning}
    >
      <button type="button" className="ai-workflow__toggle" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <div className="ai-workflow__toggle-main">
          <div className={`ai-workflow__icon-wrap ${isRunning ? 'ai-workflow__icon-wrap--pulse' : ''}`} aria-hidden>
            <GitBranch size={18} />
          </div>
          <div className="ai-workflow__titles">
            <span className="section-eyebrow" style={{ marginBottom: '0.2rem' }}>
              Autonomous pipeline
            </span>
            <span id="ai-workflow-heading" className="ai-workflow__title">
              AI Workflow
            </span>
          </div>
        </div>
        {open ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
      </button>

      {open && (
        <div className="ai-workflow__body">
          <ol className="ai-workflow__steps">
            {STEPS.map((step, i) => {
              const state = getStepState(i, doneCount, activeIndex);
              return (
                <li
                  key={step.id}
                  className={`ai-workflow__step ai-workflow__step--${state}`}
                >
                  <div className="ai-workflow__rail" aria-hidden>
                    <span className={`ai-workflow__dot ai-workflow__dot--${state}`}>
                      {state === 'done' && (
                        <Check className="ai-workflow__check" size={12} strokeWidth={3} aria-hidden />
                      )}
                      {state === 'active' && <span className="ai-workflow__dot-core" />}
                      {state === 'pending' && <Circle className="ai-workflow__pending-ring" size={11} strokeWidth={2} aria-hidden />}
                    </span>
                    {i < STEPS.length - 1 && (
                      <span
                        className={`ai-workflow__line ${i < doneCount ? 'ai-workflow__line--complete' : ''}`}
                      />
                    )}
                  </div>
                  <div className={`ai-workflow__step-body ai-workflow__step-body--${state}`}>
                    <span className="ai-workflow__step-num">Step {step.id}</span>
                    <span className="ai-workflow__step-label">{step.label}</span>
                    <p className="ai-workflow__step-detail">{step.detail}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </section>
  );
}
