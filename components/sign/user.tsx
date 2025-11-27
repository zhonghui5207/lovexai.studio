"use client";

import * as React from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import Link from "next/link";
import { User } from "@/types/user";
import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";

interface SignUserProps {
  user: User;
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function SignUser({ user, children, open, onOpenChange }: SignUserProps) {
  const t = useTranslations();

  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange} modal={false}>
      <DropdownMenuTrigger asChild>
        {children || (
        <Avatar className="cursor-pointer hover:ring-2 hover:ring-white/20 transition-all duration-200">
          <AvatarImage src={user.avatar_url} alt={user.nickname} />
          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
            {user.nickname?.charAt(0)?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent usePortal={false} className="mx-4 bg-popover border-border text-popover-foreground w-56 shadow-2xl z-[100]">
        <DropdownMenuLabel className="text-center truncate text-muted-foreground font-normal">
          {user.nickname}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem className="flex justify-center cursor-pointer text-muted-foreground focus:text-foreground focus:bg-white/10 transition-colors">
          <Link href="/profile" className="w-full text-center py-1">Profile</Link>
        </DropdownMenuItem>
        
        <DropdownMenuItem className="flex justify-center cursor-pointer text-muted-foreground focus:text-foreground focus:bg-white/10 transition-colors">
          <Link href="/favorites" className="w-full text-center py-1">My Favorites</Link>
        </DropdownMenuItem>
        
        <DropdownMenuItem className="flex justify-center cursor-pointer text-muted-foreground focus:text-foreground focus:bg-white/10 transition-colors">
          <Link href="/preferences" className="w-full text-center py-1">Preferences</Link>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="flex justify-center cursor-pointer text-muted-foreground/70 focus:text-foreground focus:bg-white/10 transition-colors"
          onClick={() => signOut()}
        >
          {t("user.sign_out")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
