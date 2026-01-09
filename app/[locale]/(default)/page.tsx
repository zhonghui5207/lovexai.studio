import { Suspense } from "react";
import HeroBanner from "@/components/blocks/characters/HeroBanner";
import DiscoverSectionWrapper from "@/components/blocks/characters/DiscoverSectionWrapper";
import ImageGenSection from "@/components/blocks/home/ImageGenSection";
import Testimonials from "@/components/blocks/home/Testimonials";
import { CharactersSkeleton } from "@/components/skeletons/CharactersSkeleton";

/**
 * Landing Page - Server Component
 *
 * 优化说明:
 * - 移除了 "use client"，页面现在是 Server Component
 * - 静态结构在服务端渲染，对 SEO 更友好
 * - 动态数据获取通过 DiscoverSectionWrapper (Client Component) 处理
 * - 使用 Suspense 提供加载状态，避免阻塞整个页面
 */
export default function LandingPage() {
  return (
    <>
      {/* Hero Banner - Client Component (需要动画和交互) */}
      <HeroBanner />

      {/* Character Discovery Section - 使用 Suspense 包裹 */}
      <Suspense fallback={<CharactersSkeleton />}>
        <DiscoverSectionWrapper />
      </Suspense>

      {/* AI Image Generation Showcase - Client Component */}
      <ImageGenSection />

      {/* User Testimonials - Client Component (需要动画) */}
      <Testimonials />
    </>
  );
}
