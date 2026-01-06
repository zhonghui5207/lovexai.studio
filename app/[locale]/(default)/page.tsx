"use client";

import HeroBanner from "@/components/blocks/characters/HeroBanner";
import DiscoverSection from "@/components/blocks/characters/DiscoverSection";
import ImageGenSection from "@/components/blocks/home/ImageGenSection";
import Testimonials from "@/components/blocks/home/Testimonials";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function LandingPage() {
  // DiscoverSection 使用动态数据
  const characters = useQuery(api.characters.list, { activeOnly: true });

  return (
    <>
      {/* Hero Banner - 静态数据，从 URL 读取分类 */}
      <HeroBanner />
      
      {/* Character Discovery Section - 动态数据，从 URL 读取分类 */}
      <DiscoverSection characters={characters} />

      {/* AI Image Generation Showcase */}
      <ImageGenSection />

      {/* User Testimonials */}
      <Testimonials />
    </>
  );
}
