'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { ACTIVE_STATES, CITIES, VIEWS, type City } from '@/data/chapters';
import styles from './Chapters.module.css';

type MapData = {
  viewBox: string;
  locations: { id: string; name: string; path: string }[];
};

const W = 612;
const H = 696;
const HQ = CITIES.find((c) => c.hq) ?? CITIES[0];
const byName = Object.fromEntries(CITIES.map((c) => [c.name, c]));
const cssVar = (name: string, value: string | number) => ({ [name]: value }) as CSSProperties;

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

const ARCS = CITIES.filter((c) => c !== HQ && c.name !== 'Gandhinagar').map((c) => ({
  name: c.name,
  d: arc(HQ, c),
}));

const FIELDS: { key: 'zone' | 'area' | 'leaders' | 'members' | 'meetings'; label: string }[] = [
  { key: 'zone', label: 'Zone' },
  { key: 'area', label: 'Area' },
  { key: 'leaders', label: 'Leaders' },
  { key: 'members', label: 'Members' },
  { key: 'meetings', label: 'Meetings' },
];

export default function Chapters() {
  const sectionRef = useRef<HTMLElement>(null);
  const nudged = useRef(false);

  const [map, setMap] = useState<MapData | null>(null);
  const [inView, setInView] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  const city = selected ? byName[selected] : null;
  const view = city ? VIEWS[city.view] : VIEWS.all;
  const zoomed = city !== null;

  // Load the map data only when the section is near
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let cancelled = false;

    const nearIO = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        import('@svg-maps/india').then((m) => {
          if (!cancelled) setMap(m.default as unknown as MapData);
        });
        nearIO.disconnect();
      },
      { rootMargin: '200% 0px' }
    );
    nearIO.observe(el);

    const seenIO = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        setInView(true);
        // A first nudge: select the HQ so the zoom shows what the map does
        if (!nudged.current && !reduce) {
          nudged.current = true;
          window.setTimeout(() => setSelected((s) => s ?? HQ.name), 2200);
        }
      },
      { threshold: 0.35 }
    );
    seenIO.observe(el);

    return () => {
      cancelled = true;
      nearIO.disconnect();
      seenIO.disconnect();
    };
  }, []);

  const detailRows = city
    ? FIELDS.map((f) => {
        const v = city.details?.[f.key];
        const text = Array.isArray(v) ? v.join(', ') : v;
        return text ? { label: f.label, text } : null;
      }).filter((r): r is { label: string; text: string } => r !== null)
    : [];

  const transform = `translate(${W / 2}px, ${H / 2}px) scale(${view.k}) translate(${-view.cx}px, ${-view.cy}px)`;

  return (
    <section id="chapters" ref={sectionRef} className={styles.chapters} data-in={inView}>
      <div className={styles.inner}>
        <header className={styles.head}>
          <p className={styles.eyebrow} data-reveal>
            Chapters &amp; Zones
          </p>
          <h2 className={styles.heading} data-reveal data-delay="0.1">
            Find your city. Find your <span className={styles.mark}>chapter.</span>
          </h2>
          <p className={styles.lead} data-reveal data-delay="0.2">
            BPG operates across chapters and zones nationwide. Select a city on the map to see its chapter
            structure.
          </p>
        </header>

        <div className={styles.stage}>
          <div className={styles.side}>
            <div className={styles.cities} role="group" aria-label="Chapter cities">
              {CITIES.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  aria-pressed={selected === c.name}
                  className={`${styles.cityBtn} ${selected === c.name ? styles.cityOn : ''}`}
                  onClick={() => setSelected(c.name)}
                >
                  {c.name}
                  {c.hq && <span className={styles.hqTag}>HQ</span>}
                </button>
              ))}
              {zoomed && (
                <button type="button" className={styles.allBtn} onClick={() => setSelected(null)}>
                  All India
                </button>
              )}
            </div>

            <div className={styles.panel} aria-live="polite">
              {city ? (
                <div key={city.name} className={styles.panelIn}>
                  <p className={styles.stateName}>{city.state}</p>
                  <h3 className={styles.cityName}>{city.name}</h3>
                  {city.hq && <p className={styles.hqLine}>Business Positive Global HQ</p>}

                  {detailRows.length > 0 ? (
                    <dl className={styles.details}>
                      {detailRows.map((r) => (
                        <div key={r.label}>
                          <dt>{r.label}</dt>
                          <dd>{r.text}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : (
                    <p className={styles.ask}>
                      Want to know how the {city.name} chapter runs, when it meets, or how to join?{' '}
                      <a href="#contact">Ask us directly</a>.
                    </p>
                  )}
                </div>
              ) : (
                <p className={styles.prompt}>Select a city on the map to view its chapter details.</p>
              )}
            </div>

            <p className={styles.partner}>
              Don&apos;t see your city? <a href="#contact">Become a Chapter / Zone Partner</a> and bring BPG to it.
            </p>
          </div>

          <div className={styles.mapWrap}>
            <svg
              className={styles.svg}
              viewBox={`0 0 ${W} ${H}`}
              preserveAspectRatio="xMidYMid meet"
              style={cssVar('--k', view.k)}
              role="img"
              aria-label="Map of India showing BPG chapter cities"
            >
              <g className={styles.world} style={{ transform }}>
                {map && (
                  <g className={styles.states}>
                    {map.locations.map((l, i) => (
                      <path
                        key={l.id}
                        d={l.path}
                        className={`${styles.state} ${ACTIVE_STATES.includes(l.id) ? styles.stateOn : ''}`}
                        style={cssVar('--i', i)}
                      />
                    ))}
                  </g>
                )}

                <g className={styles.arcs}>
                  {ARCS.map((a, i) => (
                    <g key={a.name}>
                      <path d={a.d} className={styles.arc} pathLength={1} style={cssVar('--i', i)} />
                      <path
                        d={a.d}
                        className={`${styles.comet} ${selected === a.name ? styles.cometOn : ''}`}
                        pathLength={1}
                        style={cssVar('--i', i)}
                      />
                    </g>
                  ))}
                </g>

                {CITIES.map((c, i) => {
                  const on = selected === c.name;
                  return (
                    <g key={c.name} transform={`translate(${c.x} ${c.y})`}>
                      <g className={styles.pop} style={cssVar('--i', i)}>
                        <g
                          className={`${styles.pin} ${on ? styles.pinOn : ''} ${c.hq ? styles.pinHq : ''}`}
                          onClick={() => setSelected(c.name)}
                        >
                          <circle className={styles.pulse} r="9" />
                          <circle className={styles.hit} r="16" />
                          <circle className={styles.dot} r={c.hq ? 6 : 4.6} />
                          <text
                            className={`${styles.label} ${zoomed || c.hq ? styles.labelOn : ''}`}
                            x="10"
                            y="-8"
                          >
                            {c.name}
                          </text>
                        </g>
                      </g>
                    </g>
                  );
                })}
              </g>
            </svg>
          </div>
        </div>

        <p className={styles.credit}>
          Map: <a href="https://github.com/VictorCazanave/svg-maps" rel="noopener">svg-maps</a> by Victor Cazanave,
          licensed CC BY 4.0
        </p>
      </div>
    </section>
  );
}