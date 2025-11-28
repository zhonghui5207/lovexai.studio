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
import { Settings, CreditCard, Sparkles } from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ProfileSettingsDialogProps {
  user: User;
}

export function ProfileSettingsDialog({ user }: ProfileSettingsDialogProps) {
  const [nickname, setNickname] = useState(user.nickname || "");
  const [isOpen, setIsOpen] = useState(false);

  const handleSave = () => {
    // TODO: Implement save logic
    console.log("Saving profile:", { nickname });
    setIsOpen(false);
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
                        <div className={`p-3 rounded-full ${user.credits?.is_pro ? 'bg-primary/20 text-primary' : 'bg-white/10 text-white/60'}`}>
                            {user.credits?.is_pro ? <Sparkles className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
                        </div>
                        <div>
                            <div className="font-semibold text-white">{user.credits?.is_pro ? 'Pro Plan' : 'Free Plan'}</div>
                            <div className="text-xs text-white/50 mt-0.5">{user.credits?.is_pro ? 'Your plan renews on Dec 28, 2025' : 'Upgrade to unlock premium features'}</div>
                        </div>
                    </div>
                    {!user.credits?.is_pro && (
                        <Button size="sm" className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
                            Upgrade
                        </Button>
                    )}
                    {user.credits?.is_pro && (
                        <Button variant="outline" size="sm" className="border-white/10 hover:bg-white/5 text-white">
                            Manage
                        </Button>
                    )}
                </div>
            </div>
          </div>
        </div>

        <DialogFooter className="p-6 pt-2">
          <Button variant="ghost" onClick={() => setIsOpen(false)} className="hover:bg-white/5 hover:text-white">Cancel</Button>
          <Button onClick={handleSave} className="bg-white text-black hover:bg-white/90">Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
