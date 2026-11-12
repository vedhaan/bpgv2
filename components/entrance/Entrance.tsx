'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import gsap from 'gsap';
import styles from './Entrance.module.css';

type MapData = {
  viewBox: string;
  locations: { id: string; name: string; path: string }[];
};

type City = { name: string; x: number; y: number; hq?: boolean };

// Positions are in the map's own 612 x 696 coordinate space
const CITIES: City[] = [
  { name: 'Ahmedabad', x: 93.4, y: 341.9, hq: true },
  { name: 'Anand', x: 100.9, y: 352.6 },
  { name: 'Surat', x: 98.8, y: 383.9 },
  { name: 'Rajkot', x: 56.4, y: 358.4 },
  { name: 'Amreli', x: 65.2, y: 374.2 },
  { name: 'Bhavnagar', x: 84.6, y: 370.6 },
  { name: 'Mumbai', x: 99.8, y: 430.8 },
  { name: 'Udaipur', x: 117.2, y: 306.4 },
  { name: 'Noida', x: 194.0, y: 213.7 },
];

const LINKS: [string, string][] = [
  ['Ahmedabad', 'Udaipur'],
  ['Ahmedabad', 'Noida'],
  ['Ahmedabad', 'Mumbai'],
  ['Ahmedabad', 'Surat'],
  ['Ahmedabad', 'Rajkot'],
  ['Ahmedabad', 'Bhavnagar'],
  ['Ahmedabad', 'Anand'],
  ['Rajkot', 'Amreli'],
  ['Amreli', 'Bhavnagar'],
  ['Surat', 'Mumbai'],
  ['Udaipur', 'Noida'],
];

// States that light up (Gujarat, Maharashtra, Rajasthan, Uttar Pradesh)
const CONNECTED_STATES = ['gj', 'mh', 'rj', 'up'];

const byName = Object.fromEntries(CITIES.map((c) => [c.name, c]));

// A curved path between two cities, bowing upward
function arc(a: City, b: City) {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  let nx = -dy / len;
  let ny = dx / len;
  if (ny > 0) {
    nx = -nx;
    ny = -ny;
  }
  const k = len * 0.22;
  return `M${a.x} ${a.y} Q${(mx + nx * k).toFixed(1)} ${(my + ny * k).toFixed(1)} ${b.x} ${b.y}`;
}

const ARCS = LINKS.map(([a, b]) => arc(byName[a], byName[b]));

function finish(root: HTMLElement | null) {
  document.documentElement.dataset.ready = '1';
  document.body.style.overflow = '';
  if (root) root.style.display = 'none';
}

export default function Entrance() {
  const rootRef = useRef<HTMLDivElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const [map, setMap] = useState<MapData | null>(null);

  // 1. Decide whether to play, and load the map data
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    // Plays on every page load. Only users who ask for reduced motion skip it.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      finish(root);
      return;
    }

    document.body.style.overflow = 'hidden';

    let cancelled = false;
    import('@svg-maps/india')
      .then((m) => {
        if (!cancelled) setMap(m.default as unknown as MapData);
      })
      .catch(() => finish(root));

    return () => {
      cancelled = true;
      document.body.style.overflow = '';
    };
  }, []);

  // 2. Build the timeline once the map is in the DOM
  useEffect(() => {
    const root = rootRef.current;
    if (!map || !root) return;

    const ctx = gsap.context(() => {
      const origin = Math.max(
        0,
        map.locations.findIndex((l) => l.id === 'gj')
      );

      gsap.set('[data-pin]', {
        x: (i: number) => CITIES[i].x,
        y: (i: number) => CITIES[i].y,
        scale: 0,
      });

      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tlRef.current = tl;

      // States draw themselves, spreading outward from Gujarat
      tl.to(
        '[data-state]',
        {
          strokeDashoffset: 0,
          duration: 0.8,
          ease: 'power2.inOut',
          stagger: { each: 0.012, from: origin },
        },
        0
      ).to(
        '[data-state]',
        {
          fill: 'rgba(247, 244, 239, 0.05)',
          duration: 0.6,
          stagger: { each: 0.012, from: origin },
        },
        0.3
      );

      // City pins pop, with a ring that ripples out of each
      tl.to(
        '[data-pin]',
        { scale: 1, autoAlpha: 1, duration: 0.5, ease: 'back.out(2.2)', stagger: 0.08 },
        0.7
      )
        .fromTo(
          '[data-ring]',
          { scale: 0.5, autoAlpha: 0.8 },
          { scale: 3.2, autoAlpha: 0, duration: 1, ease: 'power2.out', stagger: 0.08 },
          0.8
        )
        .fromTo(
          '[data-hq-ring]',
          { scale: 0.6, autoAlpha: 0.8 },
          { scale: 4.5, autoAlpha: 0, duration: 1.2, ease: 'power2.out', repeat: 2, repeatDelay: 0.1 },
          1.0
        );

      // Connected states light up in gold
      CONNECTED_STATES.forEach((id, i) => {
        tl.to(
          `[data-state="${id}"]`,
          { fill: 'rgba(213, 165, 30, 0.3)', stroke: '#D5A51E', duration: 0.7, ease: 'power2.out' },
          1.0 + i * 0.1
        );
      });

      // Connections draw out from the HQ, then light travels along each one
      tl.to(
        '[data-arc]',
        { strokeDashoffset: 0, duration: 0.7, ease: 'power2.inOut', stagger: 0.07 },
        0.95
      ).fromTo(
        '[data-comet]',
        { strokeDashoffset: 0, autoAlpha: 1 },
        { strokeDashoffset: -1, duration: 0.8, ease: 'power1.inOut', stagger: 0.07 },
        1.5
      );

      // Map recedes, logo arrives, curtain lifts
      tl.to('[data-map]', { opacity: 0.22, duration: 0.8, ease: 'power2.inOut' }, 2.5)
        .fromTo('[data-logo]', { autoAlpha: 0, scale: 0.92 }, { autoAlpha: 1, scale: 1, duration: 0.8 }, 2.6)
        .add(() => {
          document.documentElement.dataset.ready = '1';
        }, 3.4)
        .to(root, { yPercent: -100, duration: 0.9, ease: 'power4.inOut' }, 3.4)
        .add(() => finish(root), '>');
    }, root);

    return () => ctx.revert();
  }, [map]);

  const skip = () => {
    const root = rootRef.current;
    if (!root) return;
    tlRef.current?.kill();
    document.documentElement.dataset.ready = '1';
    gsap.to(root, {
      yPercent: -100,
      duration: 0.6,
      ease: 'power4.inOut',
      onComplete: () => finish(root),
    });
  };

  return (
    <div ref={rootRef} className={styles.entrance} data-entrance aria-label="Business Positive Global intro">
      {map && (
        <svg
          className={styles.map}
          data-map
          viewBox={map.viewBox}
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
        >
          <g>
            {map.locations.map((l) => (
              <path key={l.id} data-state={l.id} className={styles.state} pathLength={1} d={l.path} />
            ))}
          </g>
          <g>
            {ARCS.map((d, i) => (
              <path key={i} data-arc className={styles.arc} pathLength={1} d={d} />
            ))}
          </g>
          <g>
            {ARCS.map((d, i) => (
              <path key={i} data-comet className={styles.comet} pathLength={1} d={d} />
            ))}
          </g>
          <g>
            {CITIES.map((c) => (
              <g key={c.name} data-pin className={styles.pin}>
                <circle data-ring className={styles.ring} r={5} />
                {c.hq && <circle data-hq-ring className={styles.ring} r={6} />}
                <circle className={styles.dot} r={c.hq ? 4.6 : 3.2} />
              </g>
            ))}
          </g>
        </svg>
      )}

      <div className={styles.logoWrap} data-logo>
        <Image
          src="/images/bpg-logo.png"
          alt="Business Positive"
          width={330}
          height={614}
          className={styles.logo}
          priority
        />
      </div>

      <button type="button" className={styles.skip} onClick={skip}>
        Skip
      </button>
    </div>
  );
}