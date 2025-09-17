import GenderSelector from "@/components/blocks/preferences/GenderSelector";
import HeroBanner from "@/components/blocks/characters/HeroBanner";
import DiscoverSection from "@/components/blocks/characters/DiscoverSection";
import ChatCompanionsSection from "@/components/blocks/characters/ChatCompanionsSection";
import Pricing from "@/components/blocks/pricing";
import { getLandingPage } from "@/services/page";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  let canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}`;

  if (locale !== "en") {
    canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/${locale}`;
  }

  return {
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const page = await getLandingPage(locale);

  return (
    <>
      {/* Gender Preference Selector - Nectar.AI Style */}
      <GenderSelector />
      
      {/* Hero Banner - New AI Companion Focus */}
      <HeroBanner />
      
      {/* Character Discovery Section */}
      <DiscoverSection />
      
      {/* Chat Companions Section */}
      <ChatCompanionsSection />
      
      {/* Keep existing pricing */}
      {page.pricing && <Pricing pricing={page.pricing} />}
    </>
  );
}
