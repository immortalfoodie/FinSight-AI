import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { HelpCircle } from 'lucide-react';

/** Accessible info icon with inline tooltip for hover, focus, and click. */
export default function FieldHint({ text }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState(null);
  const tooltipId = useId();
  const btnRef = useRef(null);
  const hintText = typeof text === 'string' && text.trim()
    ? text.trim()
    : 'Add this value from your latest statement or estimate.';

  useEffect(() => {
    if (!open) return;
    const update = () => {
      if (!btnRef.current) return;
      const r = btnRef.current.getBoundingClientRect();
      setCoords({
        left: r.left + (r.width / 2),
        top: r.top - 8,
      });
    };

    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [open]);

  return (
    <span className="field-hint-wrap" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        ref={btnRef}
        type="button"
        className="field-hint-btn"
        aria-label={hintText}
        aria-expanded={open}
        aria-describedby={open ? tooltipId : undefined}
        title={hintText}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((v) => !v)}
      >
        <HelpCircle size={14} strokeWidth={2.2} aria-hidden />
      </button>
      {open && coords && createPortal(
        <span
          id={tooltipId}
          role="tooltip"
          className="field-hint-tooltip"
          style={{ left: `${coords.left}px`, top: `${coords.top}px` }}
        >
          {hintText}
        </span>,
        document.body,
      )}
    </span>
  );
}
