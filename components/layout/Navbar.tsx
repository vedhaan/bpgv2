'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import Image from 'next/image';
import styles from './Navbar.module.css';

const LINKS = [
  { href: '#about', label: 'About' },
  { href: '#why', label: 'Why BPG' },
  { href: '#how-works', label: 'How it works' },
  { href: '#meetings', label: 'Meetings' },
  { href: '#chapters', label: 'Chapters' },
  { href: '#contact', label: 'Contact' },
];

const delay = (i: number) => ({ '--i': i }) as CSSProperties;

export default function Navbar() {
  const headerRef = useRef<HTMLElement>(null);
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState('');

  // Hide on scroll down, show on scroll up, and drive the progress line
  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;

    const update = () => {
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      headerRef.current?.style.setProperty('--p', String(max > 0 ? Math.min(1, y / max) : 0));

      if (y > 120 && y > lastY + 4) setHidden(true);
      else if (y < lastY - 4 || y <= 120) setHidden(false);

      lastY = y;
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    update();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Highlight the link for the section currently in view
  useEffect(() => {
    const els = LINKS.map((l) => document.getElementById(l.href.slice(1))).filter(
      (el): el is HTMLElement => el !== null
    );
    if (!els.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: '-45% 0px -50% 0px' }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // Lock the page behind the mobile menu, close it with Escape
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <>
      <header
        ref={headerRef}
        className={`${styles.header} ${hidden && !open ? styles.hidden : ''}`}
      >
        <div className={`${styles.bar} reveal`}>
          <a href="#home" className={styles.brand} aria-label="Business Positive Global, home">
            <Image src="/images/bpg-logo.png" alt="" width={330} height={614} className={styles.logo} priority />
          </a>

          <nav className={styles.desktop} aria-label="Primary">
            {LINKS.map((l, i) => (
              <a
                key={l.href}
                href={l.href}
                className={`${styles.link} ${active === l.href.slice(1) ? styles.active : ''}`}
              >
                <span className={styles.num}>0{i + 1}</span>
                {l.label}
              </a>
            ))}
          </nav>

          <a href="#contact" className={styles.cta}>
            Join a Chapter
          </a>

          <button
            type="button"
            className={`${styles.burger} ${open ? styles.open : ''}`}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((v) => !v)}
          >
            <span />
            <span />
          </button>
        </div>

        <span className={styles.progress} aria-hidden="true" />
      </header>

      <div
        id="mobile-menu"
        className={`${styles.menu} ${open ? styles.open : ''}`}
        aria-hidden={!open}
        data-lenis-prevent
      >
        <nav className={styles.menuLinks} aria-label="Mobile">
          {LINKS.map((l, i) => (
            <a key={l.href} href={l.href} style={delay(i)} onClick={() => setOpen(false)}>
              <span>0{i + 1}</span>
              {l.label}
            </a>
          ))}
        </nav>

        <div className={styles.menuFoot}>
          <a href="#contact" className={styles.menuCta} onClick={() => setOpen(false)}>
            Join a Chapter
          </a>
          <p>info@businesspositiveglobal.com</p>
        </div>
      </div>
    </>
  );
}