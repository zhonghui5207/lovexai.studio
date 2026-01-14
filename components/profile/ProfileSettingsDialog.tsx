"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User } from "@/types/user";
import { Settings, CreditCard, Sparkles, Crown, Zap, Loader2, LucideIcon } from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { toast } from "sonner";

const TIER_CONFIG: Record<string, { name: string; icon: LucideIcon; color: string; bgColor: string }> = {
  free: { name: "Free Plan", icon: CreditCard, color: "text-white/60", bgColor: "bg-white/10" },
  plus: { name: "Plus Plan", icon: Zap, color: "text-blue-400", bgColor: "bg-blue-500/20" },
  pro: { name: "Pro Plan", icon: Sparkles, color: "text-purple-400", bgColor: "bg-purple-500/20" },
  ultimate: { name: "Ultimate Plan", icon: Crown, color: "text-yellow-400", bgColor: "bg-yellow-500/20" },
};

interface ProfileSettingsDialogProps {
  user: User;
}

export function ProfileSettingsDialog({ user }: ProfileSettingsDialogProps) {
  const [nickname, setNickname] = useState(user.nickname || "");
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Get real subscription data from Convex by email
  const convexUser = useQuery(api.users.getByEmail, user?.email ? { email: user.email } : "skip");
  const tier = convexUser?.subscription_tier || 'free';
  const tierConfig = TIER_CONFIG[tier] || TIER_CONFIG.free;
  const TierIcon = tierConfig.icon;
  
  // Update user mutation
  const updateUser = useMutation(api.users.updateProfile);

  const handleSave = async () => {
    if (!convexUser?._id) {
      toast.error("User not found");
      return;
    }
    
    setIsSaving(true);
    try {
      await updateUser({
        userId: convexUser._id,
        name: nickname,
      });
      toast.success("Profile updated!");
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to save profile:", error);
      toast.error("Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 bg-white/5 border-white/10 hover:bg-white/10 text-white hover:text-white hover:border-white/20 transition-all">
          <Settings className="w-4 h-4" />
          <span className="hidden sm:inline">Settings</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-[#0a0a0a] border-white/10 text-white p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-white/5 bg-white/[0.02]">
          <DialogTitle className="text-xl">Profile Settings</DialogTitle>
          <DialogDescription className="text-white/60">
            Manage your account settings and preferences.
          </DialogDescription>
        </DialogHeader>
        
        <div className="p-6 space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center gap-5">
             <div className="relative group cursor-pointer">
                <Avatar className="w-20 h-20 border-2 border-white/10 shadow-xl group-hover:border-primary/50 transition-colors">
                    <AvatarImage src={user.avatar_url} />
                    <AvatarFallback className="text-2xl bg-neutral-800">{user.nickname?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-xs font-medium text-white">Change</span>
                </div>
             </div>
             <div className="flex-1 space-y-1">
                <h3 className="font-medium text-white">Profile Picture</h3>
                <p className="text-xs text-white/50">Click on the avatar to upload a new one. JPG, GIF or PNG. Max size of 800K.</p>
             </div>
          </div>

          <div className="space-y-4">
            {/* Nickname */}
            <div className="grid gap-2">
                <Label htmlFor="nickname" className="text-white/80">Display Name</Label>
                <Input
                id="nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="bg-white/5 border-white/10 text-white focus:border-primary/50 focus:bg-white/10 h-11"
                placeholder="Enter your display name"
                />
            </div>

            {/* Email (Read only) */}
            <div className="grid gap-2">
                <Label htmlFor="email" className="text-white/80">Email Address</Label>
                <Input
                id="email"
                value={user.email}
                disabled
                className="bg-white/5 border-white/10 text-white/50 cursor-not-allowed h-11"
                />
            </div>

            {/* Subscription */}
            <div className="pt-2">
                <Label className="text-white/80 mb-2 block">Subscription Plan</Label>
                <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-full ${tierConfig.bgColor} ${tierConfig.color}`}>
                            <TierIcon className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="font-semibold text-white">{tierConfig.name}</div>
                            <div className="text-xs text-white/50 mt-0.5">
                              {tier === 'free' ? 'Upgrade to unlock premium features' : `Your plan is active`}
                            </div>
                        </div>
                    </div>
                    <Link href="/pricing">
                      <Button 
                        size="sm" 
                        className={tier === 'free' 
                          ? "bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20" 
                          : "bg-white/10 hover:bg-white/20 text-white border border-white/10"
                        }
                      >
                          {tier === 'free' ? 'Upgrade' : 'Manage'}
                      </Button>
                    </Link>
                </div>
            </div>
          </div>
        </div>

        <DialogFooter className="p-6 pt-4 border-t border-white/5 bg-white/[0.02]">
          <Button 
            variant="ghost" 
            onClick={() => setIsOpen(false)} 
            className="hover:bg-white/5 hover:text-white"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
