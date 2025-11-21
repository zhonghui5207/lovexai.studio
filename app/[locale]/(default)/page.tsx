
import HeroBanner from "@/components/blocks/characters/HeroBanner";
import DiscoverSection from "@/components/blocks/characters/DiscoverSection";
import ImageGenSection from "@/components/blocks/home/ImageGenSection";
import Testimonials from "@/components/blocks/home/Testimonials";
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
      {/* Hero Banner - New AI Companion Focus */}
      <HeroBanner />
      
      {/* Character Discovery Section */}
      <DiscoverSection />

      {/* AI Image Generation Showcase */}
      <ImageGenSection />

      {/* User Testimonials */}
      <Testimonials />
    </>
  );
}
