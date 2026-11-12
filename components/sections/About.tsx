'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import styles from './About.module.css';

gsap.registerPlugin(ScrollTrigger);

const TEXT =
  'Business Positive Global (BPG) is a network of business owners and entrepreneurs who meet with intent, to build real relationships that turn into real business. What started with a handful of founders in Ahmedabad has grown into a global movement of chapters, all built on the same belief: business grows when people genuinely support each other.';

export default function About() {
  const textRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // Each word lights up as you scroll through the paragraph
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '[data-word]',
        { opacity: 0.16 },
        {
          opacity: 1,
          ease: 'none',
          stagger: 0.12,
          scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 55%', scrub: true },
        }
      );
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <section id="about" className={styles.about}>
      <div className={styles.inner}>
        <header className={styles.head}>
          <p className={styles.eyebrow} data-reveal>
            About Business Positive Global
          </p>
          <h2 className={styles.heading} data-reveal data-delay="0.1">
            A community built on <em>trust</em>, not transactions.
          </h2>
        </header>

        <div className={styles.body}>
          <p ref={textRef} className={styles.text}>
            {TEXT.split(' ').map((word, i) => (
              <span key={i} data-word>
                {word}{' '}
              </span>
            ))}
          </p>

          <figure className={styles.vision} data-reveal>
            <figcaption>Our Vision</figcaption>
            <blockquote>
              To create the largest trusted business community where entrepreneurs connect, collaborate, and
              create more business opportunities.
            </blockquote>
          </figure>

          <a href="#how-works" className={styles.link} data-reveal>
            See how it works <span aria-hidden="true">&rarr;</span>
          </a>
        </div>
      </div>
    </section>
  );
}