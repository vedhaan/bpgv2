'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';

type Props = { to: number; suffix?: string };

export default function CountUp({ to, suffix = '' }: Props) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const format = (n: number) => Math.round(n).toLocaleString('en-IN') + suffix;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.textContent = format(to);
      return;
    }

    el.textContent = format(0);
    const state = { v: 0 };
    let tween: gsap.core.Tween | null = null;
    let observer: MutationObserver | null = null;
    const html = document.documentElement;

    const run = () => {
      tween = gsap.to(state, {
        v: to,
        duration: 1.8,
        delay: 0.6,
        ease: 'power3.out',
        onUpdate: () => {
          el.textContent = format(state.v);
        },
      });
    };

    // Count up only once the entrance has lifted
    if (html.dataset.ready === '1') {
      run();
    } else {
      observer = new MutationObserver(() => {
        if (html.dataset.ready === '1') {
          observer?.disconnect();
          run();
        }
      });
      observer.observe(html, { attributes: true, attributeFilter: ['data-ready'] });
    }

    return () => {
      observer?.disconnect();
      tween?.kill();
    };
  }, [to, suffix]);

  return (
    <span ref={ref}>
      {to.toLocaleString('en-IN')}
      {suffix}
    </span>
  );
}