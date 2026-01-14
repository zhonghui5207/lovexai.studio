"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import Link from "next/link";

interface InsufficientCreditsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function InsufficientCreditsDialog({
  isOpen,
  onClose,
}: InsufficientCreditsDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-[#0B0E14] border-white/10 text-white">
        <DialogHeader>
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <DialogTitle className="text-center text-xl">Out of Credits</DialogTitle>
          <DialogDescription className="text-center text-white/60 pt-2">
            You&apos;ve run out of credits to continue this conversation. Top up now to keep chatting with your favorite characters!
          </DialogDescription>
        </DialogHeader>
        <div className="py-6">
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Current Balance</span>
              <span className="text-sm font-bold text-red-400">0 Credits</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Cost per message</span>
              <span className="text-sm font-bold text-white">1 Credit</span>
            </div>
          </div>
        </div>
        <DialogFooter className="flex-col sm:flex-col gap-2">
          <Link href="/pricing" className="w-full">
            <Button className="w-full bg-primary hover:bg-primary/90 text-white font-semibold h-11">
              Get More Credits
            </Button>
          </Link>
          <Button
            variant="ghost"
            onClick={onClose}
            className="w-full text-white/60 hover:text-white hover:bg-white/5"
          >
            Maybe Later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
