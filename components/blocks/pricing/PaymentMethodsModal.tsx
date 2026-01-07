"use client";

import { useState } from "react";
import { CreditCard, Loader } from "lucide-react";
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

// WeChat Pay Icon - Official SVG
const WeChatIcon = () => (
  <img 
    src="/wechat.svg" 
    alt="WeChat Pay" 
    className="w-6 h-6"
  />
);

// Alipay Icon - Official SVG
const AlipayIcon = () => (
  <img 
    src="/alipay-icon.svg" 
    alt="Alipay" 
    className="w-6 h-6"
  />
);

// Crypto/Bitcoin Icon - SVG for faster loading
const CryptoIcon = () => (
  <svg viewBox="0 0 48 48" className="w-6 h-6" fill="none">
    <circle cx="24" cy="24" r="24" fill="#F7931A"/>
    <path d="M33.6 21.3c.5-3.3-2-5.1-5.5-6.3l1.1-4.5-2.7-.7-1.1 4.4c-.7-.2-1.5-.4-2.2-.5l1.1-4.4-2.7-.7-1.1 4.5c-.6-.1-1.2-.3-1.7-.4l-3.8-.9-.7 2.9s2 .5 2 .5c1.1.3 1.3 1 1.3 1.6l-1.3 5.2c.1 0 .2 0 .3.1-.1 0-.2-.1-.3-.1l-1.8 7.3c-.1.4-.5.9-1.2.7 0 0-2-.5-2-.5l-1.4 3.1 3.6.9c.7.2 1.3.4 2 .5l-1.1 4.6 2.7.7 1.1-4.5c.7.2 1.5.4 2.2.5l-1.1 4.5 2.7.7 1.1-4.6c4.7.9 8.2.5 9.7-3.7 1.2-3.4-.1-5.3-2.5-6.6 1.8-.4 3.1-1.6 3.5-4zm-6.2 8.7c-.9 3.4-6.7 1.6-8.6 1.1l1.5-6.2c1.9.5 7.9 1.4 7.1 5.1zm.9-8.8c-.8 3.1-5.7 1.5-7.3 1.1l1.4-5.6c1.6.4 6.7 1.2 5.9 4.5z" fill="white"/>
  </svg>
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
