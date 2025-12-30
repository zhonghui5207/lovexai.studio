"use client";

import { useState } from "react";
import { CreditCard, X, Loader } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export type PaymentMethod = "card" | "wechat" | "alipay" | "crypto";

interface PaymentMethodOption {
  id: PaymentMethod;
  name: string;
  icon: React.ReactNode;
  iconBgColor: string;
  iconColor: string;
}

interface PaymentMethodsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (method: PaymentMethod) => void;
  isLoading?: boolean;
  planName?: string;
  planPrice?: string;
}

// WeChat Pay Icon
const WeChatIcon = () => (
  <svg
    viewBox="0 0 24 24"
    className="w-6 h-6"
    fill="currentColor"
  >
    <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.89c-.135-.01-.269-.03-.406-.032zm-2.344 3.02c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.981.97-.981zm4.844 0c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.981.969-.981z" />
  </svg>
);

// Alipay Icon - using image
const AlipayIcon = () => (
  <img src="/alipay.png" alt="Alipay" className="w-6 h-6 object-contain" />
);

// Crypto Icon - using image (Bybit)
const CryptoIcon = () => (
  <img src="/bybit.png" alt="Crypto" className="w-6 h-6 object-contain" />
);

const paymentOptions: PaymentMethodOption[] = [
  {
    id: "card",
    name: "Credit Card",
    icon: <CreditCard className="w-6 h-6" />,
    iconBgColor: "bg-slate-700/50",
    iconColor: "text-slate-300",
  },
  {
    id: "wechat",
    name: "WeChat Pay",
    icon: <WeChatIcon />,
    iconBgColor: "bg-green-900/30",
    iconColor: "text-green-500",
  },
  {
    id: "alipay",
    name: "Alipay",
    icon: <AlipayIcon />,
    iconBgColor: "bg-blue-900/30",
    iconColor: "text-white",
  },
  {
    id: "crypto",
    name: "Crypto",
    icon: <CryptoIcon />,
    iconBgColor: "bg-orange-900/30",
    iconColor: "text-white",
  },
];

export default function PaymentMethodsModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  planName,
  planPrice,
}: PaymentMethodsModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("card");

  const handleConfirm = () => {
    onConfirm(selectedMethod);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg bg-card border-border p-0 gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b border-border">
          <DialogTitle className="text-xl font-bold text-foreground">
            Payment Methods
          </DialogTitle>
          {planName && planPrice && (
            <p className="text-sm text-muted-foreground mt-1">
              {planName} - {planPrice}
            </p>
          )}
        </DialogHeader>

        {/* Payment Options Grid */}
        <div className="p-6">
          <div className="grid grid-cols-2 gap-4">
            {paymentOptions.map((option) => {
              const isSelected = selectedMethod === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setSelectedMethod(option.id)}
                  disabled={isLoading}
                  className={`
                    relative flex items-center gap-3 p-4 rounded-xl
                    transition-all duration-300 ease-out text-left
                    border backdrop-blur-sm
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${
                      isSelected
                        ? "border-primary/50 bg-primary/10 shadow-lg shadow-primary/10 ring-1 ring-primary/30"
                        : "border-border bg-muted/20 hover:border-border/60 hover:bg-muted/30"
                    }
                  `}
                >
                  {/* Icon container */}
                  <div
                    className={`
                      flex items-center justify-center w-10 h-10 rounded-xl
                      transition-all duration-300
                      ${option.iconBgColor} ${option.iconColor}
                    `}
                  >
                    {option.icon}
                  </div>

                  {/* Text content */}
                  <div className="flex flex-col items-start flex-1 min-w-0">
                    <span
                      className={`
                        font-semibold text-sm truncate w-full
                        transition-colors duration-300
                        ${isSelected ? "text-foreground" : "text-foreground/80"}
                      `}
                    >
                      {option.name}
                    </span>
                  </div>

                  {/* Selection indicator */}
                  <div
                    className={`
                      w-5 h-5 rounded-full border-2 shrink-0
                      transition-all duration-300 flex items-center justify-center
                      ${
                        isSelected
                          ? "border-primary bg-primary"
                          : "border-muted-foreground/30 bg-transparent"
                      }
                    `}
                  >
                    {isSelected && (
                      <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Confirm Button */}
          <Button
            className="w-full mt-6 flex items-center justify-center gap-3 font-bold text-lg py-6 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 hover:from-purple-600 hover:via-pink-600 hover:to-red-600 text-white rounded-xl shadow-lg transition-all duration-300 hover:shadow-primary/20 disabled:opacity-70 disabled:cursor-not-allowed"
            disabled={isLoading}
            onClick={handleConfirm}
          >
            {isLoading ? (
              <>
                <Loader className="h-5 w-5 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <span>Continue with {paymentOptions.find(p => p.id === selectedMethod)?.name}</span>
            )}
          </Button>

          {/* Security notice */}
          <p className="text-xs text-muted-foreground text-center mt-4">
            🔒 Your payment is secured with 256-bit encryption
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
