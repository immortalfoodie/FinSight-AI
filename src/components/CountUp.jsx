import React, { useEffect, useState } from 'react';

/** Short count-up for headline numbers (performance-friendly) */
export default function CountUp({ end, duration = 900, decimals = 0, className = '', style = {} }) {
  const [v, setV] = useState(0);

  useEffect(() => {
    let raf;
    const start = performance.now();
    const from = 0;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const ease = 1 - (1 - t) ** 3;
      setV(from + (end - from) * ease);
      if (t < 1) raf = requestAnimationFrame(tick);
      else setV(end);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [end, duration]);

  const shown = decimals > 0 ? v.toFixed(decimals) : Math.round(v);
  return (
    <span className={`font-mono-nums ${className}`} style={style}>
      {shown}
    </span>
  );
}
