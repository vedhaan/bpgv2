'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import styles from './HowItWorks.module.css';

gsap.registerPlugin(ScrollTrigger);

// The 3D scene is its own chunk, loaded only when the section is near
const CafeScene = dynamic(() => import('./CafeScene'), { ssr: false });

const STEPS = [
  {
    title: 'Join BPG',
    text: 'Become part of a chapter and get access to the network, meetings, and community.',
  },
  {
    title: 'Step into the cafe and meet entrepreneurs',
    text: 'Sit across from business owners in your chapter, face to face, not just a directory listing.',
  },
  {
    title: 'Build relationships',
    text: 'Consistent meetings turn introductions into relationships people actually trust.',
  },
  {
    title: 'Increase visibility',
    text: "The more members understand what you do, the more naturally your name comes up in rooms you're not in.",
  },
  {
    title: 'Exchange referrals',
    text: 'Trust converts into referrals, given and received, as the natural next step.',
  },
  {
    title: 'Collaborate',
    text: 'Members team up directly on projects, ventures, and shared clients.',
  },
  {
    title: 'Create business opportunities',
    text: 'What began as a meeting becomes a pipeline: ongoing business, not a one-off exchange.',
  },
];

const LAST = STEPS.length - 1;
const pad = (n: number) => String(n).padStart(2, '0');

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

export default function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLSpanElement>(null);
  const progress = useRef(0);
  const stepRef = useRef(0);
  const endRef = useRef(0);

  const [journey, setJourney] = useState(false);
  const [lite, setLite] = useState(false);
  const [near, setNear] = useState(false);
  const [visible, setVisible] = useState(false);
  const [ready, setReady] = useState(false);
  const [step, setStep] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    if (!section || !stage) return;

    // Reduced motion or no WebGL: the steps stay as a readable list
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !hasWebGL()) return;

    setJourney(true);
    setLite(window.innerWidth < 900 || (navigator.hardwareConcurrency ?? 8) <= 4);

    // Load the 3D scene when the section is within a couple of screens
    const nearIO = new IntersectionObserver(([e]) => setNear(e.isIntersecting), { rootMargin: '250% 0px' });
    nearIO.observe(section);

    // Only render frames while the stage is actually on screen
    const seenIO = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: '10% 0px' });
    seenIO.observe(stage);

    const mm = gsap.matchMedia();
    mm.add('(min-width: 0px)', () => {
      section.dataset.mode = 'journey';

      const trigger = ScrollTrigger.create({
        trigger: stage,
        start: 'top top',
        end: () => `+=${window.innerHeight * 8}`,
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          progress.current = self.progress;
          endRef.current = self.end;
          if (fillRef.current) fillRef.current.style.transform = `scaleX(${self.progress.toFixed(4)})`;
          const idx = Math.min(LAST, Math.floor(self.progress * STEPS.length));
          if (idx !== stepRef.current) {
            stepRef.current = idx;
            setStep(idx);
          }
          setStarted((s) => (self.progress > 0.015 ? true : s));
        },
      });
      endRef.current = trigger.end;
      requestAnimationFrame(() => ScrollTrigger.refresh());

      return () => {
        trigger.kill();
        delete section.dataset.mode;
      };
    }, section);

    return () => {
      nearIO.disconnect();
      seenIO.disconnect();
      mm.revert();
    };
  }, []);

  const skip = () => {
    window.scrollTo({ top: endRef.current + 4 });
  };

  return (
    <section id="how-works" ref={sectionRef} className={styles.how}>
      <div ref={stageRef} className={styles.stage}>
        {journey && (
          <div className={styles.canvasWrap} aria-hidden="true">
            {near && <CafeScene progress={progress} active={visible} lite={lite} onReady={() => setReady(true)} />}
          </div>
        )}
        {journey && <div className={styles.shade} aria-hidden="true" />}
        {journey && (
          <div className={`${styles.loading} ${ready ? styles.loaded : ''}`} aria-hidden="true">
            <span>Opening the doors</span>
          </div>
        )}

        <header className={styles.head}>
          <p className={styles.eyebrow}>How BPG Works</p>
          <h2 className={styles.heading}>From stranger to collaborator, in seven steps.</h2>
          <p className={styles.lead}>
            BPG isn&apos;t a one-time event, it&apos;s a system. Here&apos;s exactly what happens once you walk in.
          </p>
        </header>

        <div className={styles.panel}>
          <ol className={styles.steps}>
            {STEPS.map((s, i) => (
              <li key={s.title} className={styles.step} data-active={i === step}>
                <span className={styles.num}>Step {pad(i + 1)}</span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
                {i === LAST && (
                  <a href="#contact" className={styles.cta}>
                    Join a Chapter
                  </a>
                )}
              </li>
            ))}
          </ol>
        </div>

        <div className={styles.meter} aria-hidden="true">
          <span className={styles.count}>
            {pad(step + 1)} / {pad(STEPS.length)}
          </span>
          <span className={styles.bar}>
            <span ref={fillRef} className={styles.fill} />
          </span>
          <button type="button" className={styles.skip} onClick={skip} tabIndex={-1}>
            Skip
          </button>
        </div>

        <p className={`${styles.hint} ${started ? styles.hintOff : ''}`} aria-hidden="true">
          Scroll to walk in
        </p>
      </div>
    </section>
  );
}