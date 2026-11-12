import type { Metadata } from 'next';
import { Manrope, Inter } from 'next/font/google';
import Entrance from '@/components/entrance/Entrance';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ScrollEngine from '@/components/layout/ScrollEngine';
import '@/styles/tokens.css';
import './globals.css';

const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope', display: 'swap' });
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

export const metadata: Metadata = {
  title: 'Business Positive Global',
  description:
    'BPG brings business owners and entrepreneurs together through structured events built for real connections that turn into real referrals.',
};

const bootScript = `
(function () {
  var d = document.documentElement;
  d.classList.add('js');
  try {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      d.dataset.reduced = '1';
      d.dataset.ready = '1';
    }
  } catch (e) {}
  setTimeout(function () { d.dataset.ready = '1'; }, 7000);
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${manrope.variable} ${inter.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body>
        <ScrollEngine />
        <Entrance />
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}