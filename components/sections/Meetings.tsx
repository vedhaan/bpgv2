'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import styles from './Meetings.module.css';

const FACETS = [
  { label: 'Purpose', text: 'Build trust through structured, face-to-face interaction.' },
  { label: 'Format', text: 'Members sit around a single table, no hierarchy, no back rows.' },
  { label: 'Table Display', text: 'Each member showcases their business visually at the table.' },
  { label: 'Networking', text: 'Dedicated time to connect one-on-one before the formal round begins.' },
  { label: 'Business Introduction', text: 'Every member introduces their business to the full table.' },
  { label: 'Referral Opportunities', text: 'Structured time to give and ask for referrals directly.' },
];

type IconKind = 'online' | 'power' | 'coffee' | 'chai' | 'social' | 'train';

const ROOMS: { name: string; text?: string; chips?: string[]; icon: IconKind }[] = [
  {
    name: 'Online Meetings',
    chips: ['Weekly meetings', 'Zoom networking', 'Business introductions', 'Collaboration'],
    icon: 'online',
  },
  { name: 'Power Meetings', text: 'Focused business networking.', icon: 'power' },
  { name: 'Coffee Meetings', text: 'Small group relationship building.', icon: 'coffee' },
  { name: 'Chai Pe Charcha', text: 'Informal networking & relationship building.', icon: 'chai' },
  { name: 'Social Events', text: 'Community bonding.', icon: 'social' },
  {
    name: 'Training & Workshops',
    text: 'Leadership, networking, business development, and more.',
    icon: 'train',
  },
];

const pad = (n: number) => String(n).padStart(2, '0');

// Position on a circle in the 400 x 400 table drawing, starting at 12 o'clock
const at = (i: number, r: number) => {
  const a = ((-90 + i * 60) * Math.PI) / 180;
  return { x: (200 + Math.cos(a) * r).toFixed(1), y: (200 + Math.sin(a) * r).toFixed(1) };
};

function RoomIcon({ kind }: { kind: IconKind }) {
  const p = { className: styles.icon, viewBox: '0 0 48 48', 'aria-hidden': true } as const;
  switch (kind) {
    case 'online':
      return (
        <svg {...p}>
          <rect x="6" y="9" width="36" height="24" rx="3" />
          <path d="M18 41h12M24 33v8" />
          <circle cx="24" cy="21" r="5" />
        </svg>
      );
    case 'power':
      return (
        <svg {...p}>
          <path d="M27 5 11 27h12l-3 16 17-23H25z" />
        </svg>
      );
    case 'coffee':
      return (
        <svg {...p}>
          <path d="M8 18h26v10a10 10 0 0 1-10 10h-6A10 10 0 0 1 8 28z" />
          <path d="M34 21h3a5 5 0 0 1 0 10h-4" />
          <path d="M16 6c-2 3 2 4 0 8M24 6c-2 3 2 4 0 8" />
        </svg>
      );
    case 'chai':
      return (
        <svg {...p}>
          <path d="M13 16h22l-3 22a3 3 0 0 1-3 3H19a3 3 0 0 1-3-3z" />
          <path d="M13 16h22M19 8c-2 3 2 4 0 6M29 8c-2 3 2 4 0 6" />
        </svg>
      );
    case 'social':
      return (
        <svg {...p}>
          <circle cx="24" cy="15" r="6" />
          <circle cx="11" cy="31" r="5" />
          <circle cx="37" cy="31" r="5" />
          <path d="M16 41c1-5 4-7 8-7s7 2 8 7" />
        </svg>
      );
    default:
      return (
        <svg {...p}>
          <path d="M5 18 24 9l19 9-19 9z" />
          <path d="M13 23v9c0 3 5 6 11 6s11-3 11-6v-9" />
          <path d="M43 18v12" />
        </svg>
      );
  }
}

export default function Meetings() {
  const sectionRef = useRef<HTMLElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const [inView, setInView] = useState(false);
  const [hold, setHold] = useState(false);
  const [still, setStill] = useState(false);

  useEffect(() => {
    setStill(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const go = (i: number) => {
    const n = (i + FACETS.length) % FACETS.length;
    setActive(n);
    return n;
  };

  const onKey = (e: KeyboardEvent) => {
    const k = e.key;
    if (k === 'ArrowDown' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowLeft') {
      e.preventDefault();
      const n = go(active + (k === 'ArrowDown' || k === 'ArrowRight' ? 1 : -1));
      tabRefs.current[n]?.focus();
    }
  };

  const running = inView && !hold && !still;

  return (
    <section id="meetings" ref={sectionRef} className={styles.meetings}>
      <div className={styles.inner}>
        <header className={styles.head}>
          <p className={styles.eyebrow} data-reveal>
            BPG Meetings &amp; Activities
          </p>
          <h2 className={styles.heading} data-reveal data-delay="0.1">
            Different rooms, for different kinds of <span className={styles.mark}>business.</span>
          </h2>
          <p className={styles.lead} data-reveal data-delay="0.2">
            Not every connection needs the same format. BPG runs structured and informal formats side by side,
            so relationships can build in whatever setting fits.
          </p>
        </header>

        {/* Flagship format: the round table */}
        <div
          className={styles.flagship}
          onMouseEnter={() => setHold(true)}
          onMouseLeave={() => setHold(false)}
          onFocus={() => setHold(true)}
          onBlur={() => setHold(false)}
        >
          <div className={styles.copy}>
            <p className={styles.kicker} data-reveal>
              Flagship Format
            </p>
            <h3 className={styles.title} data-reveal data-delay="0.1">
              Round Table Coffee Meeting <span>(RTCM)</span>
            </h3>

            <div className={styles.tabs} role="tablist" aria-orientation="vertical" data-reveal data-delay="0.15">
              {FACETS.map((f, i) => (
                <button
                  key={f.label}
                  ref={(el) => {
                    tabRefs.current[i] = el;
                  }}
                  type="button"
                  role="tab"
                  id={`rtcm-tab-${i}`}
                  aria-selected={i === active}
                  aria-controls="rtcm-panel"
                  tabIndex={i === active ? 0 : -1}
                  className={`${styles.tab} ${i === active ? styles.tabOn : ''}`}
                  onClick={() => setActive(i)}
                  onKeyDown={onKey}
                >
                  <span className={styles.tabNum}>{pad(i + 1)}</span>
                  {f.label}
                </button>
              ))}
            </div>

            <div id="rtcm-panel" role="tabpanel" aria-labelledby={`rtcm-tab-${active}`} className={styles.panel} aria-live="polite">
              <p key={active}>{FACETS[active].text}</p>
            </div>
          </div>

          <div className={styles.visual} data-reveal="scale">
            <svg viewBox="0 0 400 400" className={styles.table} aria-hidden="true">
              <circle cx="200" cy="200" r="190" className={styles.rug} />
              <circle cx="200" cy="200" r="136" className={styles.top} />
              <circle cx="200" cy="200" r="136" className={styles.rim} />
              <circle cx="200" cy="200" r="66" className={styles.inlay} />

              {/* The timer ring: it sweeps, then the table moves on to the next facet */}
              <circle
                key={active}
                cx="200"
                cy="200"
                r="66"
                className={styles.sweep}
                pathLength={1}
                transform="rotate(-90 200 200)"
                style={{ animationPlayState: running ? 'running' : 'paused' }}
                onAnimationEnd={() => go(active + 1)}
              />

              {FACETS.map((f, i) => {
                const seat = at(i, 168);
                const cup = at(i, 104);
                const on = i === active;
                return (
                  <g key={f.label}>
                    <circle cx={cup.x} cy={cup.y} r="11" className={`${styles.cup} ${on ? styles.cupOn : ''}`} />
                    <circle cx={cup.x} cy={cup.y} r="5.5" className={styles.coffee} />
                    <g
                      className={`${styles.seat} ${on ? styles.seatOn : ''}`}
                      transform={`translate(${seat.x} ${seat.y})`}
                      onClick={() => setActive(i)}
                    >
                      <circle r="22" className={styles.seatDisc} />
                      <text className={styles.seatNum} textAnchor="middle" dy="5">
                        {i + 1}
                      </text>
                    </g>
                  </g>
                );
              })}

              <text x="200" y="180" textAnchor="middle" className={styles.centerSmall}>
                RTCM
              </text>
              <text x="200" y="218" textAnchor="middle" className={styles.centerBig}>
                {pad(active + 1)}
              </text>
            </svg>
          </div>
        </div>

        {/* The other rooms */}
        <ul className={styles.rooms}>
          {ROOMS.map((r, i) => (
            <li key={r.name} className={styles.room} data-reveal data-delay={(i % 2) * 0.06}>
              <span className={styles.roomNum}>{pad(i + 1)}</span>
              <RoomIcon kind={r.icon} />
              <h3 className={styles.roomName}>{r.name}</h3>
              <div className={styles.roomBody}>
                {r.text && <p>{r.text}</p>}
                {r.chips && (
                  <ul className={styles.chips}>
                    {r.chips.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}