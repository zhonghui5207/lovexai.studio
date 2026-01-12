import { Suspense } from "react";
import { Loader } from "lucide-react";
import PaySuccessContent from "@/components/blocks/payment/PaySuccessContent";

/**
 * Pay Success Page - Server Component
 *
 * 优化说明:
 * - 移除了 "use client"，页面现在是 Server Component
 * - 静态结构在服务端渲染
 * - 交互逻辑通过 PaySuccessContent (Client Component) 处理
 * - 使用 Suspense 提供加载状态
 */
export default function PaySuccessPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Suspense fallback={<PaySuccessSkeleton />}>
        <PaySuccessContent />
      </Suspense>
    </div>
  );
}

// 骨架屏组件
function PaySuccessSkeleton() {
  return (
    <div className="max-w-md w-full text-center space-y-4">
      <Loader className="w-16 h-16 text-primary animate-spin mx-auto" />
      <h1 className="text-2xl font-bold">Processing Payment...</h1>
      <p className="text-muted-foreground">Please wait while we confirm your payment.</p>
    </div>
  );
}
