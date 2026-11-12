import { useEffect, useRef } from 'react';
import { attachCanvas, fitCanvas } from './particles.js';

// The particle canvas: covers the whole screen, above the game and below the
// run display and tooltips, and never takes the pointer. Mounted once, in App.
export default function ParticleLayer() {
  const ref = useRef(null);
  useEffect(() => {
    attachCanvas(ref.current);
    window.addEventListener('resize', fitCanvas);
    return () => {
      window.removeEventListener('resize', fitCanvas);
      attachCanvas(null);
    };
  }, []);
  return <canvas ref={ref} className="fixed inset-0 z-30 w-full h-full pointer-events-none" />;
}
