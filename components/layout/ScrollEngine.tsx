'use client';

import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

const REVEAL_FROM: Record<string, gsap.TweenVars> = {
  up: { y: 48 },
  left: { x: -60 },
  right: { x: 60 },
  scale: { scale: 0.92 },
  fade: {},
};

export default function ScrollEngine() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const html = document.documentElement;

    // Smooth scroll, wired into GSAP's ticker so ScrollTrigger stays in sync
    const lenis = new Lenis({ duration: 1.1, anchors: true });
    lenis.on('scroll', ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    // Keep scrolling locked until the entrance has lifted
    let observer: MutationObserver | null = null;
    if (html.dataset.ready !== '1') {
      lenis.stop();
      observer = new MutationObserver(() => {
        if (html.dataset.ready === '1') {
          lenis.start();
          observer?.disconnect();
        }
      });
      observer.observe(html, { attributes: true, attributeFilter: ['data-ready'] });
    }

    const ctx = gsap.context(() => {
      // [data-reveal="up|left|right|scale|fade"] [data-delay="0.2"]
      gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el) => {
        const kind = el.dataset.reveal || 'up';
        const delay = parseFloat(el.dataset.delay || '0');
        gsap.fromTo(
          el,
          { opacity: 0, ...(REVEAL_FROM[kind] ?? REVEAL_FROM.up) },
          {
            opacity: 1,
            x: 0,
            y: 0,
            scale: 1,
            duration: 1,
            delay,
            ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 88%', once: true },
          }
        );
      });

      // [data-parallax="6"]: element drifts as its parent crosses the screen.
      // The parent needs overflow: hidden.
      gsap.utils.toArray<HTMLElement>('[data-parallax]').forEach((el) => {
        const amount = parseFloat(el.dataset.parallax || '8');
        gsap.fromTo(
          el,
          { yPercent: -amount, scale: 1.2 },
          {
            yPercent: amount,
            scale: 1.2,
            ease: 'none',
            scrollTrigger: {
              trigger: el.parentElement,
              start: 'top bottom',
              end: 'bottom top',
              scrub: true,
            },
          }
        );
      });

      // [data-scroll-out]: fades and lifts as its section scrolls away
      gsap.utils.toArray<HTMLElement>('[data-scroll-out]').forEach((el) => {
        gsap.to(el, {
          y: -90,
          opacity: 0.15,
          ease: 'none',
          scrollTrigger: {
            trigger: el.closest('section') ?? el,
            start: 'top top',
            end: 'bottom top',
            scrub: true,
          },
        });
      });
    });

    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener('load', refresh);
    document.fonts?.ready.then(refresh);

    return () => {
      window.removeEventListener('load', refresh);
      observer?.disconnect();
      ctx.revert();
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, []);

  return null;
}