import { AboutMissionSection } from "@/components/home/about-mission-section";
import { HeroSection } from "@/components/home/hero-section";
import { HowItWorksSection } from "@/components/home/how-it-works-section";
import { OrganizeEventBanner } from "@/components/home/organize-event-banner";
import { SiteFooter } from "@/components/home/site-footer";
import { UpcomingEventsSection } from "@/components/home/upcoming-events-section";
import { HomeSignInPrompt } from "@/components/auth/home-sign-in-prompt";
import { SmoothHashScroll } from "@/components/smooth-hash-scroll";
import { getTopUpcomingEvents } from "@/lib/public-api";

/** Keep in sync with PUBLIC_EVENTS_REVALIDATE in lib/public-api.js */
export const revalidate = 300;

export default async function Home() {
  const topUpcomingEvents = await getTopUpcomingEvents(3);

  return (
    <>
      <SmoothHashScroll />
      <HomeSignInPrompt />
      <main className="flex-1">
        <HeroSection />
        <UpcomingEventsSection events={topUpcomingEvents} />
        <OrganizeEventBanner />
        <HowItWorksSection />
        <AboutMissionSection />
      </main>
      <SiteFooter />
    </>
  );
}
