"use client";

import * as React from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
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

export default function SignUser({ user, children }: { user: User, children?: React.ReactNode }) {
  const t = useTranslations();

  return (
    <DropdownMenu>
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
      <DropdownMenuContent className="mx-4 bg-slate-800/95 backdrop-blur-sm border-white/10 text-white">
        <DropdownMenuLabel className="text-center truncate text-white">
          {user.nickname}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/10" />

        <DropdownMenuItem className="flex justify-center cursor-pointer hover:bg-white/5 text-white/90 focus:text-white">
          <Link href="/my-credits">{t("my_credits.title")}</Link>
        </DropdownMenuItem>
        
        <DropdownMenuItem className="flex justify-center cursor-pointer hover:bg-white/5 text-white/90 focus:text-white">
          <Link href="/my-images">{t("user.my_images")}</Link>
        </DropdownMenuItem>
        
        <DropdownMenuItem className="flex justify-center cursor-pointer hover:bg-white/5 text-white/90 focus:text-white">
          <Link href="/my-orders">{t("user.my_orders")}</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-white/10" />
        
        <DropdownMenuItem className="flex justify-center cursor-pointer hover:bg-white/5 text-white/90 focus:text-white">
          <Link href="/api-keys">{t("api_keys.title")}</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-white/10" />

        <DropdownMenuItem className="flex justify-center cursor-pointer hover:bg-white/5 text-white/90 focus:text-white">
          <Link href="/my-orders">{t("user.user_center")}</Link>
        </DropdownMenuItem>

        <DropdownMenuItem className="flex justify-center cursor-pointer hover:bg-white/5 text-white/90 focus:text-white">
          <Link href="/admin/users" target="_blank">
            {t("user.admin_system")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-white/10" />

        <DropdownMenuItem
          className="flex justify-center cursor-pointer hover:bg-white/5 text-red-400 focus:text-red-300"
          onClick={() => signOut()}
        >
          {t("user.sign_out")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
