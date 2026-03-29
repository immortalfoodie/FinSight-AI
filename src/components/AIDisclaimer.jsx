import React from 'react';
import { Info } from 'lucide-react';

const SHORT =
  'AI-generated guidance for education and planning — not legal, tax, investment, or fiduciary advice. Not a substitute for a SEBI-registered advisor, CA, or licensed professional.';

/**
 * Professional, non-intrusive disclaimers. Variants tune density and placement.
 */
export default function AIDisclaimer({ variant = 'inline', className = '' }) {
  if (variant === 'micro') {
    return (
      <p className={`ai-disclaimer ai-disclaimer--micro ${className}`.trim()} role="note">
        <Info size={12} strokeWidth={2.5} aria-hidden className="ai-disclaimer__icon" />
        <span>{SHORT}</span>
      </p>
    );
  }

  if (variant === 'panel') {
    return (
      <div className={`ai-disclaimer ai-disclaimer--panel ${className}`.trim()} role="note">
        <Info size={15} strokeWidth={2} className="ai-disclaimer__icon" aria-hidden />
        <div>
          <p className="ai-disclaimer__title">Important</p>
          <p className="ai-disclaimer__body">
            {SHORT} Outputs reflect model fit to your inputs, not certainty of outcomes. Past performance does not guarantee future
            returns.
          </p>
        </div>
      </div>
    );
  }

  if (variant === 'footer') {
    return (
      <footer className={`ai-disclaimer ai-disclaimer--footer ${className}`.trim()} role="contentinfo">
        <p className="ai-disclaimer__footer-text">
          <strong>AI Money Mentor</strong> provides educational tools and illustrative calculations. Nothing here is personalized
          advice from a licensed adviser. Tax and investment decisions require your own diligence and, where appropriate, a
          qualified professional. Data in this session stays in your browser unless you export it.
        </p>
      </footer>
    );
  }

  /* inline — single compact band */
  return (
    <div className={`ai-disclaimer ai-disclaimer--inline ${className}`.trim()} role="note">
      <Info size={14} strokeWidth={2} aria-hidden className="ai-disclaimer__icon" />
      <p className="ai-disclaimer__body">{SHORT}</p>
    </div>
  );
}
