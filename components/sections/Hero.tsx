import Image from 'next/image';
import type { CSSProperties } from 'react';
import CountUp from '@/components/ui/CountUp';
import styles from './Hero.module.css';

const STATS = [
  { to: 500, suffix: '+', label: 'Active Members' },
  { to: 12, suffix: '+', label: 'Chapters' },
  { to: 1000, suffix: '+', label: 'Referrals Made' },
];

const delay = (i: number) => ({ '--i': i }) as CSSProperties;

export default function Hero() {
  return (
    <section id="home" className={styles.hero}>
      <div className={styles.wrap}>
        <div className={styles.inner}>
          <div className={styles.copy} data-scroll-out>
            <p className={`${styles.eyebrow} reveal`} style={delay(0)}>
              Business Positive Global
            </p>

            <h1 className={`${styles.title} reveal`} style={delay(1)}>
              Business grows faster in the <span className={styles.mark}>right room.</span>
            </h1>

            <p className={`${styles.sub} reveal`} style={delay(2)}>
              BPG brings business owners and entrepreneurs together through structured events built for one
              thing: real connections that turn into real referrals.
            </p>

            <div className={`${styles.actions} reveal`} style={delay(3)}>
              <a href="#contact" className={styles.primary}>Join a Chapter</a>
              <a href="#how-works" className={styles.secondary}>How it works</a>
            </div>
          </div>

          <div className={`${styles.visual} reveal`} style={delay(2)}>
            <div className={styles.frame}>
              <Image
                src="/images/hero.jpg"
                alt="BPG members networking at a live event"
                fill
                priority
                sizes="(max-width: 900px) 90vw, 40vw"
                className={styles.photo}
                data-parallax="6"
              />
            </div>

            <svg className={styles.stamp} viewBox="0 0 120 120" aria-hidden="true">
              <defs>
                <path id="stamp-path" d="M60,60 m-45,0 a45,45 0 1,1 90,0 a45,45 0 1,1 -90,0" />
              </defs>
              <circle cx="60" cy="60" r="60" className={styles.stampBg} />
              <text className={styles.stampText}>
                <textPath href="#stamp-path" textLength="280" lengthAdjust="spacing">
                  STRUCTURED NETWORKING · REAL REFERRALS ·
                </textPath>
              </text>
              <g transform="translate(60 60) rotate(-30)">
                <ellipse rx="11" ry="7" className={styles.stampBean} />
                <path d="M-8.5 0 C-3.5 -3.5 3.5 3.5 8.5 0" className={styles.stampCrease} />
              </g>
            </svg>
          </div>
        </div>

        <ul className={`${styles.stats} reveal`} style={delay(4)}>
          {STATS.map((s) => (
            <li key={s.label}>
              <strong>
                <CountUp to={s.to} suffix={s.suffix} />
              </strong>
              <span>{s.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}