"use client";

import { useState } from "react";
import { AlertTriangle, WifiOff, RefreshCw, CreditCard, Lock, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export type ErrorType = 'network' | 'server' | 'credits' | 'permission' | 'general' | 'timeout' | 'empty_message';

interface ErrorDisplayProps {
  error: string | null;
  type: ErrorType;
  onRetry?: () => void;
  onDismiss?: () => void;
  showRetry?: boolean;
}

const errorConfig = {
  network: {
    icon: WifiOff,
    title: "Network Error",
    color: "text-orange-600",
    bgColor: "bg-orange-50 border-orange-200",
    retryText: "Retry Connection"
  },
  server: {
    icon: AlertTriangle,
    title: "Server Error",
    color: "text-red-600",
    bgColor: "bg-red-50 border-red-200",
    retryText: "Try Again"
  },
  credits: {
    icon: CreditCard,
    title: "Insufficient Credits",
    color: "text-yellow-600",
    bgColor: "bg-yellow-50 border-yellow-200",
    retryText: "Top Up Credits"
  },
  permission: {
    icon: Lock,
    title: "Access Denied",
    color: "text-purple-600",
    bgColor: "bg-purple-50 border-purple-200",
    retryText: "Upgrade Plan"
  },
  timeout: {
    icon: AlertCircle,
    title: "Request Timeout",
    color: "text-blue-600",
    bgColor: "bg-blue-50 border-blue-200",
    retryText: "Retry"
  },
  empty_message: {
    icon: AlertCircle,
    title: "Message Required",
    color: "text-gray-600",
    bgColor: "bg-gray-50 border-gray-200",
    retryText: null
  },
  general: {
    icon: AlertTriangle,
    title: "Error",
    color: "text-red-600",
    bgColor: "bg-red-50 border-red-200",
    retryText: "Try Again"
  }
};

export default function ErrorDisplay({
  error,
  type,
  onRetry,
  onDismiss,
  showRetry = true
}: ErrorDisplayProps) {
  const [isRetrying, setIsRetrying] = useState(false);

  if (!error) return null;

  const config = errorConfig[type];
  const Icon = config.icon;

  const handleRetry = async () => {
    if (!onRetry) return;

    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  };

  const handleAction = () => {
    if (type === 'credits') {
      // 跳转到充值页面
      window.location.href = '/pricing';
    } else if (type === 'permission') {
      // 跳转到订阅页面
      window.location.href = '/pricing';
    } else if (onRetry) {
      handleRetry();
    }
  };

  return (
    <Alert className={`mb-4 ${config.bgColor} border-2 relative`}>
      <div className="flex items-start gap-3">
        <Icon className={`h-5 w-5 ${config.color} flex-shrink-0 mt-0.5`} />

        <div className="flex-1 min-w-0">
          <h4 className={`font-semibold ${config.color} mb-1`}>
            {config.title}
          </h4>
          <AlertDescription className="text-sm text-gray-700">
            {error}
          </AlertDescription>
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center gap-2">
          {showRetry && config.retryText && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleAction}
              disabled={isRetrying}
              className="text-xs"
            >
              {isRetrying ? (
                <>
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                  Retrying...
                </>
              ) : (
                config.retryText
              )}
            </Button>
          )}

          {onDismiss && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onDismiss}
              className="h-6 w-6 text-gray-500 hover:text-gray-700"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    </Alert>
  );
}