import styles from './CityMarquee.module.css';

const CITIES = [
  'Ahmedabad',
  'Gandhinagar',
  'Anand',
  'Surat',
  'Rajkot',
  'Amreli',
  'Bhavnagar',
  'Mumbai',
  'Udaipur',
  'Noida',
];

function Bean() {
  return (
    <svg className={styles.bean} viewBox="-10 -7 20 14" aria-hidden="true">
      <ellipse rx="9" ry="5.6" />
      <path d="M-7 0 C-3 -3 3 3 7 0" />
    </svg>
  );
}

export default function CityMarquee() {
  return (
    <section className={styles.marquee} aria-label="BPG chapter cities">
      <div className={styles.track}>
        {[0, 1].map((copy) => (
          <ul key={copy} className={styles.list} aria-hidden={copy === 1}>
            {CITIES.map((city) => (
              <li key={city}>
                {city}
                <Bean />
              </li>
            ))}
          </ul>
        ))}
      </div>
    </section>
  );
}