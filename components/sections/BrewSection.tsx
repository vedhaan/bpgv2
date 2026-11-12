'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import styles from './BrewSection.module.css';

const INGREDIENTS = [
  {
    title: 'Visibility is Your Credibility',
    text: 'People refer businesses they can see and understand. Show up consistently, and trust follows.',
    color: '#2d170c',
  },
  {
    title: 'Be a Giver',
    text: 'Give value first, without keeping score. The return comes, rarely from the person you gave to.',
    color: '#7a4a22',
  },
  {
    title: 'Participation > Joining',
    text: "Membership doesn't build trust. Showing up, every time, does.",
    color: '#c79a63',
  },
  {
    title: 'Connect → Collaborate → Create',
    text: "Every real business outcome follows this order. Skip a step and it doesn't hold.",
    color: '#e9d8b8',
  },
  {
    title: 'Coffee Beans = Referrals',
    text: 'Every referral is a bean toward a stronger brew, small individually, powerful together.',
    color: '#b97a2c',
  },
  {
    title: 'CDD = Received Transactions',
    text: 'Confirmed business closed through the network, the real measure of whether BPG is working.',
    color: '#D5A51E',
  },
];

const BLEND = [
  { word: 'परंपरा', meaning: 'Tradition' },
  { word: 'प्रतिष्ठा', meaning: 'Prestige' },
  { word: 'अनुशासन', meaning: 'Discipline' },
];

const SLOT = 26; // height of one layer in the cup drawing
const BASE = 276; // y of the bottom of the liquid
const total = INGREDIENTS.length;
const pad = (n: number) => String(n).padStart(2, '0');
const cssVar = (name: string, value: string | number) => ({ [name]: value }) as CSSProperties;

type Drop = { id: number; dy: number };

export default function BrewSection() {
  const stageRef = useRef<HTMLDivElement>(null);
  const timer = useRef<number | null>(null);
  const demoDone = useRef(false);
  const dropId = useRef(0);

  const [added, setAdded] = useState<boolean[]>(() => Array(total).fill(false));
  const [focus, setFocus] = useState(0);
  const [drop, setDrop] = useState<Drop | null>(null);
  const [splash, setSplash] = useState(0);

  const count = added.filter(Boolean).length;
  const complete = count === total;

  // Packed position of each added layer, bottom up, in ingredient order
  const slotOf = (i: number) => added.slice(0, i).filter(Boolean).length;
  const surface = BASE - count * SLOT;

  const stop = () => {
    if (timer.current !== null) {
      window.clearInterval(timer.current);
      timer.current = null;
    }
  };

  const addAt = (i: number) => {
    setAdded((prev) => {
      if (prev[i]) return prev;
      const next = [...prev];
      next[i] = true;
      const n = next.filter(Boolean).length;
      dropId.current += 1;
      setDrop({ id: dropId.current, dy: BASE - n * SLOT - 36 });
      setSplash((s) => s + 1);
      return next;
    });
    setFocus(i);
  };

  const pick = (i: number) => {
    stop();
    if (!added[i]) addAt(i);
    else setFocus(i);
  };

  const brewAll = () => {
    stop();
    let i = 0;
    const step = () => {
      while (i < total && added[i]) i += 1;
      if (i >= total) {
        stop();
        return;
      }
      addAt(i);
      i += 1;
    };
    step();
    timer.current = window.setInterval(step, 650);
  };

  const reset = () => {
    stop();
    setAdded(Array(total).fill(false));
    setFocus(0);
    setDrop(null);
  };

  // A first nudge: once the section is on screen, the first ingredient adds itself to show what happens
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !demoDone.current && !reduce) {
          demoDone.current = true;
          window.setTimeout(() => addAt(0), 900);
        }
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section id="philosophy" className={styles.brew}>
      <div className={styles.inner}>
        <header className={styles.head}>
          <p className={styles.eyebrow} data-reveal>
            BPG Philosophy
          </p>
          <h2 className={styles.heading} data-reveal data-delay="0.1">
            The BPG <span className={styles.mark}>Brew</span>
          </h2>
          <p className={styles.lead} data-reveal data-delay="0.2">
            Every strong cup starts with the right ingredients, brewed with intention. Our philosophy works the same
            way, six principles, one culture.
          </p>
        </header>

        <div ref={stageRef} className={styles.stage}>
          <div className={styles.list}>
            <div className={styles.status}>
              <span className={styles.count}>
                {count} of {total} added
              </span>
              <span className={styles.actions}>
                <button type="button" onClick={brewAll} disabled={complete}>
                  Brew it all
                </button>
                <button type="button" onClick={reset} disabled={count === 0}>
                  Start over
                </button>
              </span>
            </div>

            <ol className={styles.items}>
              {INGREDIENTS.map((it, i) => (
                <li key={it.title} className={`${styles.item} ${added[i] ? styles.on : ''}`}>
                  <button
                    type="button"
                    className={styles.row}
                    aria-pressed={added[i]}
                    aria-expanded={focus === i}
                    aria-controls={`brew-note-${i}`}
                    onClick={() => pick(i)}
                  >
                    <span className={styles.idx}>{pad(i + 1)}</span>
                    <span className={styles.swatch} style={cssVar('--c', it.color)} aria-hidden="true" />
                    <span className={styles.name}>{it.title}</span>
                    <span className={styles.chip}>
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path className={styles.plus} d="M12 6v12M6 12h12" />
                        <path className={styles.tick} d="M6 12.5l4 4 8-9" />
                      </svg>
                    </span>
                  </button>
                  <div id={`brew-note-${i}`} className={styles.note} data-open={focus === i}>
                    <p>{it.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className={styles.cup} data-complete={complete} style={cssVar('--steam', count / total)}>
            <svg viewBox="0 0 320 340" role="img" aria-label={`A cup with ${count} of ${total} ingredients added`}>
              <defs>
                <clipPath id="brew-glass">
                  <path d="M52 104H208V258Q208 276 190 276H70Q52 276 52 258Z" />
                </clipPath>
                <linearGradient id="brew-shine" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0" stopColor="#fff" stopOpacity="0.28" />
                  <stop offset="0.35" stopColor="#fff" stopOpacity="0" />
                </linearGradient>
              </defs>

              <circle cx="130" cy="190" r="150" className={styles.glow} />
              <ellipse cx="130" cy="296" rx="124" ry="15" className={styles.saucer} />

              {/* Steam grows as the cup fills */}
              <g className={styles.steam}>
                <path d="M104 84c-12-16 12-26 0-44" style={cssVar('--d', '0s')} />
                <path d="M130 80c-12-18 12-30 0-52" style={cssVar('--d', '0.7s')} />
                <path d="M156 84c-12-16 12-26 0-44" style={cssVar('--d', '1.4s')} />
              </g>

              {/* The liquid, one layer per principle */}
              <g clipPath="url(#brew-glass)">
                {INGREDIENTS.map((it, i) => (
                  <rect
                    key={it.title}
                    x="50"
                    y={BASE - SLOT}
                    width="162"
                    height={SLOT + 1}
                    fill={it.color}
                    className={styles.layer}
                    style={{
                      transform: `translateY(${-slotOf(i) * SLOT}px) scaleY(${added[i] ? 1 : 0})`,
                    }}
                  />
                ))}

                {/* Beans float on the surface once referrals are in */}
                <g className={styles.floaters} style={{ transform: `translateY(${surface - BASE + SLOT - 3}px)`, opacity: added[4] ? 1 : 0 }}>
                  {[
                    [92, 0],
                    [128, 3],
                    [164, -1],
                  ].map(([x, dy], k) => (
                    <g key={x} transform={`translate(${x} ${BASE - SLOT + dy}) rotate(${k * 38 - 20})`} className={styles.bob} style={cssVar('--d', `${k * 0.5}s`)}>
                      <ellipse rx="9" ry="5.6" className={styles.bean} />
                      <path d="M-6.5 0C-3 -3 3 3 6.5 0" className={styles.crease} />
                    </g>
                  ))}
                </g>

                <rect x="52" y="104" width="156" height="172" fill="url(#brew-shine)" />
              </g>

              {/* Ripple where a bean lands */}
              <g key={splash} className={styles.splash} style={{ transform: `translateY(${surface - BASE}px)` }}>
                <ellipse cx="130" cy={BASE} rx="40" ry="5" />
              </g>

              {/* The glass, rim and handle */}
              <path d="M44 96H216V262Q216 284 194 284H66Q44 284 44 262Z" className={styles.glass} />
              <path d="M216 132C272 124 276 234 216 238" className={styles.handle} />
              <ellipse cx="130" cy="96" rx="86" ry="7" className={styles.rim} />

              {/* A bean drops in each time something is added */}
              {drop && (
                <g
                  key={drop.id}
                  className={styles.drop}
                  style={cssVar('--dy', `${drop.dy}px`)}
                  onAnimationEnd={() => setDrop(null)}
                >
                  <g transform="translate(130 44) rotate(-30)">
                    <ellipse rx="10" ry="6.2" className={styles.beanDrop} />
                    <path d="M-7 0C-3 -3.4 3 3.4 7 0" className={styles.crease} />
                  </g>
                </g>
              )}
            </svg>

            <p className={styles.caption} aria-live="polite">
              {complete ? 'The BPG Brew is ready.' : count === 0 ? 'Add an ingredient to start brewing.' : 'Keep going.'}
            </p>
          </div>
        </div>

        {/* The Blend */}
        <div className={styles.blend} data-complete={complete}>
          <div className={styles.blendHead}>
            <p className={styles.kicker}>The Blend</p>
            <p className={styles.sub}>Our Cultural Foundation</p>
            {!complete && <p className={styles.hint}>Add all six ingredients to bring it out.</p>}
          </div>
          <ul className={styles.words}>
            {BLEND.map((b, i) => (
              <li key={b.word} style={cssVar('--i', i)}>
                <span className={styles.word}>{b.word}</span>
                <span className={styles.meaning}>{b.meaning}</span>
              </li>
            ))}
          </ul>
          <p className={styles.culture}>BPG Culture</p>
        </div>
      </div>
    </section>
  );
}