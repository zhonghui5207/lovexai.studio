"use client";

import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
} from "@/components/ui/drawer";
import { SiDiscord } from "react-icons/si";
import { RiTwitterXFill } from "react-icons/ri";
import { Mail, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { signIn } from "next-auth/react";
import { useAppContext } from "@/contexts/app";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useTranslations } from "next-intl";
import LovexaiLogo from "@/components/ui/logo";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

// Colorful Google Logo
const GoogleColorLogo = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

type AuthStep = "email" | "otp";

export default function AuthModal() {
  const t = useTranslations();
  const { showSignModal, setShowSignModal } = useAppContext();
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (isDesktop) {
    return (
      <Dialog open={showSignModal} onOpenChange={setShowSignModal}>
        <DialogContent className="sm:max-w-[400px] p-0 bg-[#0d0d12] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden">
          <VisuallyHidden>
            <DialogTitle>Sign In</DialogTitle>
          </VisuallyHidden>
          <AuthForm onClose={() => setShowSignModal(false)} />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={showSignModal} onOpenChange={setShowSignModal}>
      <DrawerContent className="bg-[#0d0d12] border-t border-white/[0.08]">
        <AuthForm onClose={() => setShowSignModal(false)} />
        <DrawerFooter className="pt-2 pb-6">
          <DrawerClose asChild>
            <Button variant="ghost" className="text-white/40 hover:text-white/60 hover:bg-white/5">
              Cancel
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

function AuthForm({ onClose }: { onClose?: () => void }) {
  const [step, setStep] = useState<AuthStep>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSocialLogin = async (provider: string) => {
    setLoadingProvider(provider);
    try {
      await signIn(provider);
    } catch (error) {
      console.error(`${provider} login failed:`, error);
    } finally {
      setLoadingProvider(null);
    }
  };

  const handleSendOtp = async () => {
    if (!email.trim() || !email.includes("@")) return;
    setIsLoading(true);
    setError(null);
    
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || "Failed to send code");
        setIsLoading(false);
        return;
      }
      
      setStep("otp");
      setCountdown(60);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value[0];
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    // Auto submit when all fields filled
    if (newOtp.every(v => v) && newOtp.join("").length === 6) {
      handleVerifyOtp(newOtp.join(""));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async (code: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), code }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || "Verification failed");
        setOtp(["", "", "", "", "", ""]);
        otpRefs.current[0]?.focus();
        setIsLoading(false);
        return;
      }
      
      // Success! Sign in with email-otp credentials
      const result = await signIn("email-otp", {
        email: email.trim(),
        userId: data.user.id,
        redirect: false,
      });
      
      if (result?.ok) {
        // Close modal on success
        window.location.reload();
      } else {
        setError("Login failed. Please try again.");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0) return;
    setCountdown(60);
    setError(null);
    
    try {
      await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
    } catch (err) {
      setError("Failed to resend code");
    }
  };

  const maskEmail = (email: string) => {
    const [name, domain] = email.split("@");
    const masked = name.length > 3 
      ? name.slice(0, 3) + "***" 
      : name[0] + "***";
    return `${masked}@${domain}`;
  };

  return (
    <div className="p-6">
      <AnimatePresence mode="wait">
        {step === "email" ? (
          <motion.div
            key="email-step"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <LovexaiLogo className="w-12 h-12" />
            </div>

            {/* Title */}
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-white mb-1">Welcome</h2>
              <p className="text-sm text-white/40">Sign in or create an account</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                {error}
              </div>
            )}

            {/* Email Input */}
            <div className="mb-4">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                  className="h-12 pl-10 bg-white/[0.03] border-white/[0.08] text-white placeholder:text-white/30 rounded-xl
                    focus:border-white/20 focus:ring-0 transition-colors"
                />
              </div>
            </div>

            {/* Continue Button */}
            <Button
              onClick={handleSendOtp}
              disabled={isLoading || !email.trim() || !email.includes("@")}
              className="w-full h-12 bg-gradient-to-r from-[#e04080] to-[#c03070] hover:from-[#e84890] hover:to-[#d03880]
                text-white font-medium rounded-xl transition-all duration-200
                disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Continue"
              )}
            </Button>

            {/* Divider */}
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/[0.06]" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-[#0d0d12] text-white/30">or continue with</span>
              </div>
            </div>

            {/* Social Login Buttons */}
            <div className="space-y-2.5">
              {/* Google */}
              <Button
                variant="outline"
                onClick={() => handleSocialLogin("google")}
                disabled={loadingProvider !== null}
                className="w-full h-12 bg-[#2a2a35] hover:bg-[#35354a] 
                  border-0 text-white font-medium rounded-xl transition-all"
              >
                {loadingProvider === "google" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <GoogleColorLogo className="w-5 h-5 mr-2.5" />
                    Google
                  </>
                )}
              </Button>

              {/* Discord & X Row */}
              <div className="grid grid-cols-2 gap-2.5">
                <Button
                  variant="outline"
                  onClick={() => handleSocialLogin("discord")}
                  disabled={loadingProvider !== null}
                  className="h-12 bg-[#5865F2] hover:bg-[#4752c4] border-0 text-white font-medium rounded-xl transition-all"
                >
                  {loadingProvider === "discord" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <SiDiscord className="w-4 h-4 mr-2" />
                      Discord
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => handleSocialLogin("twitter")}
                  disabled={loadingProvider !== null}
                  className="h-12 bg-[#2a2a35] hover:bg-[#35354a]
                    border-0 text-white font-medium rounded-xl transition-all"
                >
                  {loadingProvider === "twitter" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RiTwitterXFill className="w-5 h-5" />
                  )}
                </Button>
              </div>
            </div>

            {/* Terms */}
            <p className="mt-5 text-center text-xs text-white/30">
              By continuing, you agree to our{" "}
              <a href="/terms-of-service" className="text-white/50 hover:text-white/70 underline underline-offset-2">
                Terms
              </a>
              {" "}and{" "}
              <a href="/privacy-policy" className="text-white/50 hover:text-white/70 underline underline-offset-2">
                Privacy Policy
              </a>
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="otp-step"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
          >
            {/* Back Button */}
            <button
              onClick={() => {
                setStep("email");
                setOtp(["", "", "", "", "", ""]);
              }}
              className="flex items-center gap-2 text-white/50 hover:text-white/80 mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back</span>
            </button>

            {/* Email Icon */}
            <div className="flex justify-center mb-5">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#e04080] to-[#c03070] flex items-center justify-center">
                <Mail className="w-7 h-7 text-white" />
              </div>
            </div>

            {/* Title */}
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-white mb-2">Check your email</h2>
              <p className="text-sm text-white/40">
                We sent a verification code to
              </p>
              <p className="text-sm text-white/70 font-medium">{maskEmail(email)}</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                {error}
              </div>
            )}

            {/* OTP Input */}
            <div className="flex justify-center gap-2 mb-6">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { otpRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  className={cn(
                    "w-11 h-13 text-center text-lg font-semibold rounded-xl transition-all",
                    "bg-white/[0.03] border border-white/[0.08] text-white",
                    "focus:border-[#e04080]/50 focus:ring-0 focus:outline-none",
                    digit && "border-white/20"
                  )}
                />
              ))}
            </div>

            {/* Verify Button */}
            <Button
              onClick={() => handleVerifyOtp(otp.join(""))}
              disabled={isLoading || otp.some(v => !v)}
              className="w-full h-12 bg-gradient-to-r from-[#e04080] to-[#c03070] hover:from-[#e84890] hover:to-[#d03880]
                text-white font-medium rounded-xl transition-all duration-200
                disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Verify"
              )}
            </Button>

            {/* Resend */}
            <p className="mt-5 text-center text-sm text-white/40">
              Didn't receive a code?{" "}
              {countdown > 0 ? (
                <span className="text-white/30">Resend in {countdown}s</span>
              ) : (
                <button
                  onClick={handleResendOtp}
                  className="text-[#e04080] hover:text-[#e84890] font-medium transition-colors"
                >
                  Resend
                </button>
              )}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
