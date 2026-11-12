'use client';

import Image from 'next/image';
import type { CSSProperties, PointerEvent } from 'react';
import { EMAIL, PHONE_DISPLAY, PHONE_TEL, waLink } from '@/data/site';
import styles from './Footer.module.css';

const EXPLORE = [
  { href: '#home', label: 'Home' },
  { href: '#about', label: 'About' },
  { href: '#why', label: 'Why BPG' },
  { href: '#how-works', label: 'How it works' },
  { href: '#meetings', label: 'Meetings' },
  { href: '#philosophy', label: 'The BPG Brew' },
  { href: '#chapters', label: 'Chapters' },
];

const INVOLVED = [
  { href: '#contact', label: 'Join a Chapter' },
  { href: '#contact', label: 'Zone Partner' },
  { href: '#chapters', label: 'Find your city' },
];

const JOIN_TEXT = "Hi, I'd like to know more about joining BPG.";
const pad = (n: number) => String(n).padStart(2, '0');

/* ---------- The night skyline, generated once so server and client render the same thing ---------- */

const W = 1200;
const H = 300;

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

type Rect = { x: number; y: number; w: number; h: number };
type Tower = Rect & { windows: string };

function layer(r: () => number, minW: number, spanW: number, minH: number, spanH: number, gap: number): Rect[] {
  const out: Rect[] = [];
  for (let x = -20; x < W + 20; ) {
    const w = minW + r() * spanW;
    const h = minH + r() * spanH;
    out.push({ x, y: H - h, w, h });
    x += w + r() * gap;
  }
  return out;
}

function buildSkyline() {
  const r = rng(23);

  const far = layer(r, 30, 46, 50, 100, 4);
  const mid = layer(r, 34, 50, 80, 110, 6);

  const front: Tower[] = [];
  const twinkles: { x: number; y: number; d: number }[] = [];
  for (let x = -10; x < W + 10; ) {
    const w = 30 + r() * 44;
    const h = 40 + r() * 130;
    const cols = Math.max(1, Math.floor((w - 8) / 9));
    const rows = Math.max(1, Math.floor((h - 12) / 13));
    const ox = x + (w - cols * 9 + 4) / 2;
    let windows = '';
    for (let c = 0; c < cols; c++) {
      for (let k = 0; k < rows; k++) {
        const wx = ox + c * 9;
        const wy = H - h + 8 + k * 13;
        const v = r();
        if (v > 0.93) twinkles.push({ x: wx, y: wy, d: r() * 6 });
        else if (v > 0.52) windows += `M${wx.toFixed(1)} ${wy.toFixed(1)}h5v7h-5z`;
      }
    }
    front.push({ x, y: H - h, w, h, windows });
    x += w + 2 + r() * 4;
  }

  const stars = Array.from({ length: 70 }, () => ({
    x: r() * W,
    y: 8 + r() * 120,
    s: 0.6 + r() * 1.1,
    d: r() * 6,
  }));

  // Light travels across the rooftops
  const tall = front.filter((b) => b.h > 80);
  const step = Math.max(1, Math.floor(tall.length / 6));
  const nodes = tall
    .filter((_, i) => i % step === 0)
    .slice(0, 6)
    .map((b) => ({ x: b.x + b.w / 2, y: b.y }));

  let net = '';
  nodes.forEach((n, i) => {
    if (i === 0) {
      net += `M${n.x.toFixed(1)} ${n.y.toFixed(1)}`;
      return;
    }
    const p = nodes[i - 1];
    net += ` Q${((p.x + n.x) / 2).toFixed(1)} ${(Math.min(p.y, n.y) - 50).toFixed(1)} ${n.x.toFixed(1)} ${n.y.toFixed(1)}`;
  });

  return { far, mid, front, twinkles, stars, nodes, net };
}

const SKY = buildSkyline();

const CARS = [
  { t: 16, d: -2, left: false, c: '#ffe2b0' },
  { t: 24, d: -11, left: false, c: '#ffe2b0' },
  { t: 20, d: -6, left: true, c: '#ff7a5c' },
  { t: 28, d: -17, left: true, c: '#ff7a5c' },
  { t: 18, d: -9, left: false, c: '#ffd27a' },
];

export default function Footer() {
  const onMove = (e: PointerEvent<HTMLElement>) => {
    if (e.pointerType === 'touch') return;
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--px', (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3));
  };
  const onLeave = (e: PointerEvent<HTMLElement>) => e.currentTarget.style.setProperty('--px', '0');

  return (
    <footer className={styles.footer} onPointerMove={onMove} onPointerLeave={onLeave}>
      <div className={styles.inner}>
        <div className={styles.grid}>
          <div className={styles.brand}>
            <Image src="/images/bpg-logo.png" alt="Business Positive" width={330} height={614} className={styles.logo} />
            <h2 className={styles.heading}>
              Every skyline starts with a <span>conversation.</span>
            </h2>
            <p className={styles.tagline}>
              A community of business owners and entrepreneurs, built on trust, referrals, and real relationships.
            </p>
            <a href={waLink(JOIN_TEXT)} target="_blank" rel="noopener noreferrer" className={styles.cta}>
              Chat on WhatsApp <span aria-hidden="true">&rarr;</span>
            </a>
          </div>

          <nav className={styles.nav} aria-label="Explore">
            <h3>Explore</h3>
            <ul>
              {EXPLORE.map((l, i) => (
                <li key={l.label}>
                  <a href={l.href}>
                    <span className={styles.num}>{pad(i + 1)}</span>
                    <span className={styles.txt}>{l.label}</span>
                    <span className={styles.arr} aria-hidden="true">
                      &rarr;
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <nav className={styles.nav} aria-label="Get involved">
            <h3>Get involved</h3>
            <ul>
              {INVOLVED.map((l, i) => (
                <li key={l.label}>
                  <a href={l.href}>
                    <span className={styles.num}>{pad(i + 1)}</span>
                    <span className={styles.txt}>{l.label}</span>
                    <span className={styles.arr} aria-hidden="true">
                      &rarr;
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className={styles.nav}>
            <h3>Get in touch</h3>
            <ul className={styles.contact}>
              <li>
                <span className={styles.k}>WhatsApp</span>
                <a href={waLink()} target="_blank" rel="noopener noreferrer">
                  <span className={styles.txt}>Chat now</span>
                  <span className={styles.arr} aria-hidden="true">
                    &rarr;
                  </span>
                </a>
              </li>
              <li>
                <span className={styles.k}>Phone</span>
                <a href={`tel:${PHONE_TEL}`}>
                  <span className={styles.txt}>{PHONE_DISPLAY}</span>
                  <span className={styles.arr} aria-hidden="true">
                    &rarr;
                  </span>
                </a>
              </li>
              <li>
                <span className={styles.k}>Email</span>
                <a href={`mailto:${EMAIL}`}>
                  <span className={styles.txt}>{EMAIL.replace('@', '@\u200b')}</span>
                  <span className={styles.arr} aria-hidden="true">
                    &rarr;
                  </span>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className={styles.skyline} aria-hidden="true">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMax slice">
          <g>
            {SKY.stars.map((s, i) => (
              <circle
                key={i}
                cx={s.x.toFixed(1)}
                cy={s.y.toFixed(1)}
                r={s.s.toFixed(2)}
                className={styles.star}
                style={{ '--d': `${s.d.toFixed(2)}s` } as CSSProperties}
              />
            ))}
          </g>

          <g className={styles.sun}>
            <circle cx={W * 0.72} cy={H - 140} r="130" className={styles.sunGlow} />
            <circle cx={W * 0.72} cy={H - 140} r="36" className={styles.sunDisc} />
          </g>

          <g className={styles.far}>
            {SKY.far.map((b, i) => (
              <rect key={i} x={b.x} y={b.y} width={b.w} height={b.h} />
            ))}
          </g>

          <g className={styles.mid}>
            {SKY.mid.map((b, i) => (
              <rect key={i} x={b.x} y={b.y} width={b.w} height={b.h} />
            ))}
          </g>

          <g className={styles.front}>
            {SKY.front.map((b, i) => (
              <g key={i}>
                <rect x={b.x} y={b.y} width={b.w} height={b.h} className={styles.tower} />
                <path d={b.windows} className={styles.lit} />
              </g>
            ))}
            {SKY.twinkles.map((t, i) => (
              <rect
                key={i}
                x={t.x}
                y={t.y}
                width="5"
                height="7"
                className={styles.tw}
                style={{ '--d': `${t.d.toFixed(2)}s` } as CSSProperties}
              />
            ))}
          </g>

          <path d={SKY.net} className={styles.net} />
          <path d={SKY.net} className={styles.packet} pathLength={1} />
          {SKY.nodes.map((n, i) => (
            <g key={i} transform={`translate(${n.x.toFixed(1)} ${n.y.toFixed(1)})`}>
              <circle r="9" className={styles.pulse} style={{ '--d': `${i * 0.5}s` } as CSSProperties} />
              <circle r="3.4" className={styles.node} />
            </g>
          ))}

          <rect x="0" y={H - 7} width={W} height="7" className={styles.road} />
          {CARS.map((c, i) => (
            <g
              key={i}
              className={`${styles.car} ${c.left ? styles.carLeft : ''}`}
              style={{ '--t': `${c.t}s`, '--d': `${c.d}s` } as CSSProperties}
            >
              <circle cx="0" cy={H - 3.5} r="6" fill={c.c} opacity="0.18" />
              <circle cx="0" cy={H - 3.5} r="1.7" fill={c.c} />
              <circle cx="6" cy={H - 3.5} r="1.7" fill={c.c} />
            </g>
          ))}
        </svg>
      </div>

      <div className={styles.bar}>
        <div className={styles.barInner}>
          <p>&copy; {new Date().getFullYear()} Business Positive Global. All rights reserved.</p>
          <p className={styles.tag}>Trust. Referrals. Relationships.</p>
          <button type="button" className={styles.up} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            Back to top <span aria-hidden="true">&uarr;</span>
          </button>
        </div>
      </div>
    </footer>
  );
}