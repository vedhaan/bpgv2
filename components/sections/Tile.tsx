'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import styles from './WhyBPG.module.css';

export default function Tile({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.dataset.live = 'true';
      return;
    }

    // Start the illustration once the tile is on screen (works on touch devices too)
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.dataset.live = 'true';
          io.disconnect();
        }
      },
      { threshold: 0.45 }
    );
    io.observe(el);

    // Spotlight, tilt and depth follow the cursor, only on devices with a real hover
    const hasHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    let raf = 0;

    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;
        el.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`);
        el.style.setProperty('--my', `${(y * 100).toFixed(1)}%`);
        el.style.setProperty('--px', ((x - 0.5) * 2).toFixed(3));
        el.style.setProperty('--py', ((y - 0.5) * 2).toFixed(3));
        el.style.setProperty('--ry', `${((x - 0.5) * 6).toFixed(2)}deg`);
        el.style.setProperty('--rx', `${(-(y - 0.5) * 6).toFixed(2)}deg`);
      });
    };

    const onLeave = () => {
      cancelAnimationFrame(raf);
      el.style.setProperty('--px', '0');
      el.style.setProperty('--py', '0');
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--ry', '0deg');
    };

    if (hasHover) {
      el.addEventListener('pointermove', onMove);
      el.addEventListener('pointerleave', onLeave);
    }

    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return (
    <article ref={ref} className={styles.tile}>
      {children}
    </article>
  );
}