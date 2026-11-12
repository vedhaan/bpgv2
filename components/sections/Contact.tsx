'use client';

import { useState, type FormEvent } from 'react';
import { EMAIL, PHONE_DISPLAY, PHONE_TEL, waLink } from '@/data/site';
import styles from './Contact.module.css';

const MAX = 800;
const PARTNER_TEXT = "Hi, I'm interested in becoming a BPG Chapter/Zone Partner.";

function Icon({ kind }: { kind: 'whatsapp' | 'phone' | 'mail' }) {
  const p = { className: styles.icon, viewBox: '0 0 24 24', 'aria-hidden': true } as const;
  if (kind === 'whatsapp') {
    return (
      <svg {...p}>
        <path d="M4 20l1.3-4.2A8 8 0 1 1 8.4 18.8z" />
        <path d="M9.2 8.8c.3 2.6 2.5 4.8 5.1 5.3l1.1-1.1-1.9-1-.8.7a4 4 0 0 1-1.9-1.9l.7-.8-1-1.9z" />
      </svg>
    );
  }
  if (kind === 'phone') {
    return (
      <svg {...p}>
        <path d="M6.6 3.5 9 3l1.6 4.2-1.9 1.4a11 11 0 0 0 4.7 4.7l1.4-1.9L19 13l-.5 2.4a2.2 2.2 0 0 1-2.2 1.8A13 13 0 0 1 4.8 5.7 2.2 2.2 0 0 1 6.6 3.5z" />
      </svg>
    );
  }
  return (
    <svg {...p}>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="m4 7.5 8 6 8-6" />
    </svg>
  );
}

const METHODS = [
  { kind: 'whatsapp', label: 'WhatsApp', value: PHONE_DISPLAY, href: waLink(), external: true },
  { kind: 'phone', label: 'Phone', value: PHONE_DISPLAY, href: `tel:${PHONE_TEL}`, external: false },
  { kind: 'mail', label: 'Email', value: EMAIL, href: `mailto:${EMAIL}`, external: false },
] as const;

export default function Contact() {
  const [count, setCount] = useState(0);
  const [opened, setOpened] = useState(false);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    if (!form.reportValidity()) return;

    const data = new FormData(form);
    const get = (k: string) => String(data.get(k) ?? '').trim();

    const lines = ['Hello BPG team,', '', `Name: ${get('name')}`];
    if (get('phone')) lines.push(`Phone: ${get('phone')}`);
    if (get('email')) lines.push(`Email: ${get('email')}`);
    if (get('city')) lines.push(`City: ${get('city')}`);
    lines.push('', get('message'));

    // A real link click inside the user's tap is never blocked as a pop-up
    const a = document.createElement('a');
    a.href = waLink(lines.join('\n'));
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    a.remove();

    setOpened(true);
  };

  return (
    <section id="contact" className={styles.contact}>
      <div className={styles.inner}>
        <div className={styles.info}>
          <p className={styles.eyebrow} data-reveal>
            Contact Us
          </p>
          <h2 className={styles.heading} data-reveal data-delay="0.1">
            Let&apos;s talk <span className={styles.mark}>business.</span>
          </h2>
          <p className={styles.lead} data-reveal data-delay="0.2">
            Have a question, want to join a chapter, or interested in starting one in your city? Reach out
            directly.
          </p>

          <ul className={styles.methods}>
            {METHODS.map((m, i) => (
              <li key={m.label} data-reveal data-delay={i * 0.06}>
                <a
                  href={m.href}
                  className={styles.method}
                  {...(m.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                >
                  <span className={styles.badge}>
                    <Icon kind={m.kind} />
                  </span>
                  <span className={styles.methodText}>
                    <span className={styles.methodLabel}>{m.label}</span>
                    <span className={styles.methodValue}>
                      {/* A break opportunity after the @ keeps the email tidy on narrow screens */}
                      {m.kind === 'mail' ? m.value.replace('@', '@\u200b') : m.value}
                    </span>
                  </span>
                  <span className={styles.arrow} aria-hidden="true">
                    &rarr;
                  </span>
                </a>
              </li>
            ))}
          </ul>

          <div className={styles.partner} data-reveal>
            <h3>Become a Chapter / Zone Partner</h3>
            <p>Interested in bringing BPG to your city? Let&apos;s talk about partnership and expansion.</p>
            <a href={waLink(PARTNER_TEXT)} target="_blank" rel="noopener noreferrer" className={styles.enquire}>
              Enquire
            </a>
          </div>
        </div>

        <div className={styles.card} data-reveal="left">
          <h3 className={styles.cardTitle}>Send us a message</h3>

          <form onSubmit={onSubmit} onChange={() => setOpened(false)} className={styles.form}>
            <div className={styles.row}>
              <label className={styles.field}>
                <span>Full Name</span>
                <input name="name" type="text" required maxLength={80} autoComplete="name" placeholder="Your name" />
              </label>
              <label className={styles.field}>
                <span>Phone Number</span>
                <input
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  maxLength={20}
                  autoComplete="tel"
                  placeholder="+91"
                />
              </label>
            </div>

            <div className={styles.row}>
              <label className={styles.field}>
                <span>Email</span>
                <input name="email" type="email" maxLength={120} autoComplete="email" placeholder="you@company.com" />
              </label>
              <label className={styles.field}>
                <span>City</span>
                <input name="city" type="text" maxLength={60} autoComplete="address-level2" placeholder="Your city" />
              </label>
            </div>

            <label className={styles.field}>
              <span>Message</span>
              <textarea
                name="message"
                required
                rows={5}
                maxLength={MAX}
                placeholder="Tell us what you'd like to know"
                onChange={(e) => setCount(e.target.value.length)}
              />
              <em className={styles.count}>
                {count} / {MAX}
              </em>
            </label>

            <button type="submit" className={styles.send}>
              <Icon kind="whatsapp" />
              Send via WhatsApp
            </button>

            <p className={styles.note} aria-live="polite">
              {opened
                ? 'WhatsApp is opening with your message ready. Hit send there to finish.'
                : 'This opens WhatsApp with your message ready, just hit send there.'}
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}