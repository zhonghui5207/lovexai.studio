import { Suspense } from "react";
import PricingContent from "@/components/blocks/pricing/PricingContent";

/**
 * Pricing Page - Server Component
 *
 * 优化说明:
 * - 移除了 "use client"，页面现在是 Server Component
 * - 静态结构在服务端渲染，对 SEO 更友好
 * - 交互逻辑通过 PricingContent (Client Component) 处理
 * - 使用 Suspense 提供加载状态
 */
export default function PricingPage() {
  // BreadcrumbList JSON-LD for Pricing page
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://lovexai.studio"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Pricing",
        "item": "https://lovexai.studio/pricing"
      }
    ]
  };

  return (
    <div className="min-h-screen bg-background pt-8 pb-20 px-4">
      {/* BreadcrumbList JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <div className="container max-w-screen-xl mx-auto">
        <Suspense fallback={<PricingSkeleton />}>
          <PricingContent />
        </Suspense>
      </div>
    </div>
  );
}

// 骨架屏组件
function PricingSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Tab skeleton */}
      <div className="mb-12">
        <div className="flex items-center gap-8 border-b border-white/10 pb-4 mb-8">
          <div className="h-6 w-32 bg-white/10 rounded" />
          <div className="h-6 w-24 bg-white/10 rounded" />
        </div>
      </div>

      {/* Title skeleton */}
      <div className="mb-10">
        <div className="h-10 w-80 bg-white/10 rounded mb-4" />
        <div className="h-5 w-96 bg-white/5 rounded" />
      </div>

      {/* Toggle skeleton */}
      <div className="mb-12">
        <div className="h-10 w-48 bg-white/5 rounded-full" />
      </div>

      {/* Cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-6 rounded-3xl border border-white/5 bg-card h-[480px]">
            <div className="h-6 w-20 bg-white/10 rounded mb-2" />
            <div className="h-4 w-32 bg-white/5 rounded mb-6" />
            <div className="h-10 w-24 bg-white/10 rounded mb-4" />
            <div className="h-8 w-36 bg-primary/10 rounded-full mb-6" />
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((j) => (
                <div key={j} className="h-4 w-full bg-white/5 rounded" />
              ))}
            </div>
            <div className="mt-auto pt-8">
              <div className="h-12 w-full bg-white/10 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
