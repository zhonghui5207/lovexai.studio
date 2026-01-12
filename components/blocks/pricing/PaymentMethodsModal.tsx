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

// WeChat Pay Icon - Inline SVG for instant loading
const WeChatIcon = () => (
  <svg viewBox="0 0 1024 1024" className="w-6 h-6" xmlns="http://www.w3.org/2000/svg">
    <path d="M337.387 341.827c-17.757 0-35.514 11.838-35.514 29.595s17.757 29.595 35.514 29.595 29.596-11.838 29.596-29.595c0-18.497-11.838-29.595-29.596-29.595zM577.85 513.48c-11.838 0-22.937 12.578-22.937 23.676 0 12.578 11.838 23.676 22.937 23.676 17.757 0 29.595-11.838 29.595-23.676s-11.838-23.676-29.595-23.676zm-76.208-112.463c17.757 0 29.595-12.578 29.595-29.595 0-17.757-11.838-29.595-29.595-29.595s-35.515 11.838-35.515 29.595 17.757 29.595 35.515 29.595zM706.59 513.48c-11.839 0-22.937 12.578-22.937 23.676 0 12.578 11.838 23.676 22.937 23.676 17.757 0 29.595-11.838 29.595-23.676s-11.838-23.676-29.595-23.676z" fill="#28C445"/>
    <path d="M510.52 2.96C228.624 2.96 0 231.584 0 513.48S228.624 1024 510.52 1024s510.52-228.624 510.52-510.52S792.416 2.96 510.52 2.96zm-96.925 641.48c-29.595 0-53.271-5.92-81.387-12.579l-81.387 41.434 22.936-71.769c-58.45-41.434-93.965-95.445-93.965-159.815 0-113.202 105.803-201.988 233.803-201.988 114.682 0 216.047 71.028 236.023 166.474-7.398-.74-14.797-1.48-22.196-1.48-110.983 1.48-198.29 85.086-198.29 188.67 0 17.018 2.96 33.295 7.4 49.573-7.4.74-15.538 1.48-22.937 1.48zm346.266 82.866 17.757 59.191-63.63-35.514c-22.936 5.919-46.612 11.838-70.289 11.838-111.722 0-199.768-76.948-199.768-172.393-.74-94.705 87.306-171.653 198.289-171.653 105.803 0 199.029 77.687 199.029 172.393 0 53.271-34.775 100.624-81.388 136.138z" fill="#28C445"/>
  </svg>
);

// Alipay Icon - Inline SVG for instant loading
const AlipayIcon = () => (
  <svg viewBox="0 0 1024 1024" className="w-6 h-6" xmlns="http://www.w3.org/2000/svg">
    <path d="M230.4 576.512c-12.288 9.728-25.088 24.064-28.672 41.984-5.12 24.576-1.024 55.296 22.528 79.872 28.672 29.184 72.704 37.376 91.648 38.912 51.2 3.584 105.984-22.016 147.456-50.688 16.384-11.264 44.032-34.304 70.144-69.632-59.392-30.72-133.632-64.512-212.48-61.44-40.448 1.536-69.632 9.728-90.624 20.992zm752.64 135.68C1009.152 650.752 1024 583.168 1024 512 1024 229.888 794.112 0 512 0S0 229.888 0 512s229.888 512 512 512c170.496 0 321.536-83.968 414.72-211.968-88.064-43.52-232.96-115.712-322.56-159.232-42.496 48.64-105.472 97.28-176.64 118.272-44.544 13.312-84.992 18.432-126.976 9.728-41.984-8.704-72.704-28.16-90.624-47.616-9.216-10.24-19.456-22.528-27.136-37.888.512 1.024 1.024 2.048 1.024 3.072 0 0-4.608-7.68-7.68-19.456-1.536-6.144-3.072-11.776-3.584-17.92-.512-4.096-.512-8.704 0-12.8-.512-7.68 0-15.872 1.536-24.064 4.096-20.48 12.8-44.032 35.328-65.536 49.152-48.128 114.688-50.688 148.992-50.176 50.176.512 138.24 22.528 211.968 48.64 20.48-43.52 33.792-90.112 41.984-121.344h-307.2v-33.28h157.696v-66.56H272.384V302.08h190.464v-66.56c0-9.216 2.048-16.384 16.384-16.384h74.752v82.944h207.36v33.28h-207.36v66.56h165.888s-16.896 92.672-68.608 184.32c115.2 40.96 278.016 104.448 331.776 125.952z" fill="#06B4FD"/>
  </svg>
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
