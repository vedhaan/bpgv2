import type { CSSProperties } from 'react';
import Tile from './Tile';
import styles from './WhyBPG.module.css';

const REASONS = [
  {
    key: 'a',
    title: 'Visibility',
    text: 'Build your identity and credibility within a trusted business network.',
  },
  {
    key: 'b',
    title: 'Collaboration',
    text: "Team up with other entrepreneurs to create opportunities you couldn't build alone.",
  },
  {
    key: 'c',
    title: 'Business Opportunities',
    text: 'Referrals, collaborations, and direct business opportunities from people who know your work.',
  },
  {
    key: 'd',
    title: 'Relationship Building',
    text: 'Meaningful relationships that go beyond the transaction.',
  },
  {
    key: 'e',
    title: 'Community',
    text: "An ecosystem where members actively contribute to each other's growth.",
  },
  {
    key: 'f',
    title: 'Learning & Growth',
    text: 'Meetings, training, events, and knowledge-sharing that sharpen how you do business.',
  },
] as const;

const COMMUNITY_DOTS = Array.from({ length: 8 }, (_, i) => {
  const angle = (i / 8) * Math.PI * 2;
  return { x: (80 + Math.cos(angle) * 52).toFixed(2), y: (80 + Math.sin(angle) * 52).toFixed(2) };
});

const BARS = [30, 56, 82, 108];

const cssVar = (name: string, value: number) => ({ [name]: value }) as CSSProperties;

function Art({ id }: { id: (typeof REASONS)[number]['key'] }) {
  switch (id) {
    case 'a': // Visibility: ripples spreading out from one point
      return (
        <svg className={styles.art} viewBox="0 0 200 200" aria-hidden="true">
          {[30, 50, 70, 90].map((r, i) => (
            <circle key={r} className={`${styles.stroke} ${styles.ripple}`} style={cssVar('--i', i)} cx="100" cy="100" r={r} />
          ))}
          <circle className={styles.accentFill} cx="100" cy="100" r="9" />
        </svg>
      );
    case 'b': // Collaboration: two circles, one shared overlap
      return (
        <svg className={styles.art} viewBox="0 0 160 160" aria-hidden="true">
          <circle className={`${styles.stroke} ${styles.cl}`} cx="58" cy="80" r="34" />
          <circle className={`${styles.stroke} ${styles.cr}`} cx="102" cy="80" r="34" />
          <path
            className={`${styles.accentFill} ${styles.lens}`}
            d="M80 54.1 A34 34 0 0 1 80 105.9 A34 34 0 0 1 80 54.1 Z"
          />
        </svg>
      );
    case 'c': // Business opportunities: a path that climbs
      return (
        <svg className={styles.art} viewBox="0 0 160 160" aria-hidden="true">
          <path
            className={`${styles.stroke} ${styles.trail}`}
            pathLength={1}
            d="M20 132 C 50 132 58 78 90 78 S 120 46 140 28"
          />
          <circle className={`${styles.fill} ${styles.pt}`} cx="20" cy="132" r="5" />
          <circle className={`${styles.fill} ${styles.pt}`} cx="90" cy="78" r="5" />
          <circle className={`${styles.accentFill} ${styles.pt}`} cx="140" cy="28" r="9" />
        </svg>
      );
    case 'd': // Relationship building: two people, one bond between them
      return (
        <svg className={styles.art} viewBox="0 0 160 160" aria-hidden="true">
          <circle className={`${styles.stroke} ${styles.l1}`} cx="34" cy="80" r="24" />
          <circle className={`${styles.stroke} ${styles.l2}`} cx="126" cy="80" r="24" />
          <line className={`${styles.stroke} ${styles.bond}`} x1="58" y1="80" x2="102" y2="80" />
          <circle className={`${styles.accentFill} ${styles.bondDot}`} cx="80" cy="80" r="7" />
        </svg>
      );
    case 'e': // Community: a ring of members around a centre
      return (
        <svg className={styles.art} viewBox="0 0 160 160" aria-hidden="true">
          <g className={styles.orbit}>
            {COMMUNITY_DOTS.map((d, i) => (
              <g key={i} className={styles.node} style={cssVar('--i', i)}>
                <line className={styles.stroke} x1="80" y1="80" x2={d.x} y2={d.y} />
                <circle className={styles.fill} cx={d.x} cy={d.y} r="6" />
              </g>
            ))}
          </g>
          <circle className={styles.accentFill} cx="80" cy="80" r="10" />
        </svg>
      );
    default: // Learning & growth: steps that rise
      return (
        <svg className={styles.art} viewBox="0 0 160 160" aria-hidden="true">
          {BARS.map((h, i) => (
            <rect
              key={h}
              className={`${i === BARS.length - 1 ? styles.accentFill : styles.fill} ${styles.bar}`}
              style={cssVar('--i', i)}
              x={24 + i * 34}
              y={140 - h}
              width="22"
              height={h}
              rx="6"
            />
          ))}
        </svg>
      );
  }
}

export default function WhyBPG() {
  return (
    <section id="why" className={styles.why}>
      <div className={styles.inner}>
        <header className={styles.head}>
          <div>
            <p className={styles.eyebrow} data-reveal>
              Why Business Positive?
            </p>
            <h2 className={styles.heading} data-reveal data-delay="0.1">
              Why join <span className={styles.mark}>BPG?</span>
            </h2>
          </div>
          <p className={styles.lead} data-reveal data-delay="0.2">
            Six reasons entrepreneurs choose BPG over any other networking group, and why they stay.
          </p>
        </header>

        <div className={styles.grid}>
          {REASONS.map((r, i) => (
            <div key={r.key} className={`${styles.cell} ${styles[r.key]}`} data-reveal data-delay={(i % 3) * 0.08}>
              <Tile>
                <span className={styles.idx}>0{i + 1}</span>
                <Art id={r.key} />
                <h3>{r.title}</h3>
                <p>{r.text}</p>
              </Tile>
            </div>
          ))}
        </div>

        <div className={styles.cta} data-reveal>
          <div className={styles.ctaCopy}>
            <h3>Let&apos;s talk business.</h3>
            <p>Want to join a chapter, or bring BPG to your city? Reach out directly.</p>
          </div>
          <div className={styles.ctaActions}>
            <a href="#contact" className={styles.ctaPrimary}>
              Join a Chapter
            </a>
            <a href="#chapters" className={styles.ctaSecondary}>
              Find your city
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}