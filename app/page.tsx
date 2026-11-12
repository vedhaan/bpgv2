import Hero from '@/components/sections/Hero';
import CityMarquee from '@/components/sections/CityMarquee';
import About from '@/components/sections/About';
import WhyBPG from '@/components/sections/WhyBPG';
import HowItWorks from '@/components/sections/HowItWorks';
import Meetings from '@/components/sections/Meetings';
import BrewSection from '@/components/sections/BrewSection';
import Chapters from '@/components/sections/Chapters';
import Contact from '@/components/sections/Contact';

export default function Home() {
  return (
    <main>
      <Hero />
      <CityMarquee />
      <About />
      <WhyBPG />
      <HowItWorks />
      <Meetings />
      <BrewSection />
      <Chapters />
      <Contact />
    </main>
  );
}