"use client";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
  SheetTitle,
} from "@/components/ui/sheet";
import { Header as HeaderType } from "@/types/blocks/header";
import Link from "next/link";
import LocaleToggle from "@/components/locale/toggle";
import { Menu, Search, Heart, User, Star, Home, MessageSquare, Compass, Plus, Image, CreditCard, ChevronDown, Coins } from "lucide-react";
import SignToggle from "@/components/sign/toggle";
import { cn } from "@/lib/utils";
import LovexaiLogo from "@/components/ui/logo";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useAppContext } from "@/contexts/app";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function Header({ header }: { header: HeaderType }) {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { user } = useAppContext();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const currentGender = searchParams.get("gender") || "girls";
  const [gender, setGender] = useState(currentGender);

  // Get real-time user data from Convex
  const convexUser = useQuery(api.users.getByEmail, user?.email ? { email: user.email } : "skip");
  const credits = convexUser?.credits_balance ?? 0;
  const tier = convexUser?.subscription_tier || 'free';

  // Tier display
  const getTierDisplay = (tier: string) => {
    const tierKey = `tiers.${tier}` as any;
    const tierName = t(tierKey);
    const tierColors: Record<string, string> = {
      free: "text-white/60",
      plus: "text-blue-400",
      pro: "text-purple-400",
      ultimate: "text-yellow-400",
    };
    return { name: tierName, color: tierColors[tier] || "text-white/60" };
  };
  const tierInfo = getTierDisplay(tier);

  useEffect(() => {
    setGender(currentGender);
  }, [currentGender]);

  // Close sheet when pathname changes (navigation occurred)
  useEffect(() => {
    setSheetOpen(false);
  }, [pathname]);

  if (header.disabled) {
    return null;
  }

  // Check if on home page (for showing category tabs)
  const pathnameWithoutLocale = pathname.replace(/^\/[a-z]{2}/, '') || '/';
  const isHomePage = pathnameWithoutLocale === '/';

  // Handle gender change
  const handleGenderChange = (newGender: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('gender', newGender);
    if (pathname === '/' || pathname.includes('/discover')) {
      router.push(`${pathname}?${params.toString()}`);
    } else {
      router.push(`/?gender=${newGender}`);
    }
  };

  const navItems = [
    { name: t('nav.home'), href: '/', icon: Home },
    { name: t('nav.messages'), href: '/chat', icon: MessageSquare },
    { name: t('nav.discover'), href: '/discover', icon: Compass },
    { name: t('nav.create'), href: '/create', icon: Plus },
    { name: t('nav.generate'), href: '/generate', icon: Image },
    { name: t('nav.pricing'), href: '/pricing', icon: CreditCard },
  ];

  const genderOptions = [
    { key: 'girls', label: t('categories.girls'), icon: Heart },
    { key: 'guys', label: t('categories.guys'), icon: User },
    { key: 'anime', label: t('categories.anime'), icon: Star }
  ];

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`?${params.toString()}`, { scroll: false });
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur-xl border-b border-white/5">
      {/* Row 1: Main Navigation Bar */}
      <div className="flex h-14 items-center justify-between px-4">
        {/* Left: Menu Button + Logo */}
        <div className="flex items-center gap-3">
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white/80 hover:text-white hover:bg-white/10 -ml-2">
                <Menu className="h-5 w-5" />
                <span className="sr-only">{t('nav.toggle_menu')}</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] bg-background/98 backdrop-blur-xl border-r border-white/10 p-0 flex flex-col">
              {/* Logo Section - Same as desktop sidebar */}
              <div className="h-20 flex items-center px-6 gap-3 flex-shrink-0">
                <SheetTitle className="flex items-center gap-3">
                  <div className="relative flex-shrink-0">
                    <div className="absolute inset-0 bg-primary blur-md opacity-50"></div>
                    <LovexaiLogo className="relative w-8 h-8 z-10" />
                  </div>
                  <span className="font-heading text-xl font-bold text-white tracking-widest drop-shadow-[0_0_8px_rgba(244,63,94,0.8)]">
                    LOVEXAI
                  </span>
                </SheetTitle>
              </div>

              {/* Navigation Items */}
              <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathnameWithoutLocale === item.href ||
                    (item.href !== '/' && pathnameWithoutLocale.startsWith(item.href));
                  return (
                    <SheetClose asChild key={item.href}>
                      <a
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all",
                          isActive
                            ? "bg-primary/10 text-white"
                            : "text-muted-foreground hover:text-white hover:bg-white/5"
                        )}
                      >
                        <Icon className={cn("w-5 h-5 flex-shrink-0", isActive && "text-primary")} />
                        {item.name}
                      </a>
                    </SheetClose>
                  );
                })}
              </nav>

              {/* Bottom Section - Same as desktop sidebar */}
              <div className="p-3 border-t border-white/10 flex-shrink-0 space-y-3">
                {/* Credits Display */}
                {convexUser && (
                  <SheetClose asChild>
                    <Link
                      href="/pricing?tab=credits"
                      className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-colors group flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                          <Coins className="w-2.5 h-2.5 text-white" />
                        </div>
                        <span className="text-sm font-semibold text-white">{credits.toLocaleString()}</span>
                      </div>
                      <span className="text-[10px] text-white/40 group-hover:text-white/60">+</span>
                    </Link>
                  </SheetClose>
                )}

                {/* Social Links */}
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground font-medium px-1">
                  {['social_discord', 'social_reddit', 'social_twitter', 'social_tags', 'social_affiliates', 'social_guides'].map((key) => (
                    <a key={key} href="#" className="hover:text-white transition-colors">
                      {t(`sidebar.${key}`)}
                    </a>
                  ))}
                </div>

                {/* Gender Toggle */}
                <div className="bg-white/5 p-1 rounded-lg grid grid-cols-3 gap-1">
                  {(['girls', 'guys', 'anime'] as const).map((type) => (
                    <SheetClose asChild key={type}>
                      <button
                        onClick={() => handleGenderChange(type)}
                        className={cn(
                          "text-xs font-medium py-1.5 rounded-md transition-colors",
                          gender === type
                            ? "bg-primary text-white shadow-sm"
                            : "text-muted-foreground hover:text-white hover:bg-white/5"
                        )}
                      >
                        {t(`categories.${type}`)}
                      </button>
                    </SheetClose>
                  ))}
                </div>

                {/* User Profile */}
                <SignToggle dropdownOpen={dropdownOpen} onDropdownOpenChange={setDropdownOpen}>
                  {user && (
                    <div className="flex items-center gap-3 w-full p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group border border-transparent hover:border-white/10">
                      <Avatar className="h-9 w-9 border border-white/10">
                        <AvatarImage src={user.avatar_url} alt={user.name} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {user.name?.charAt(0)?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-sm font-medium text-white truncate leading-none mb-1">{user.name}</p>
                        <p className={cn("text-[10px] font-medium", tierInfo.color)}>{tierInfo.name} {t('sidebar.plan')}</p>
                      </div>
                      <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-white transition-colors" />
                    </div>
                  )}
                </SignToggle>
              </div>
            </SheetContent>
          </Sheet>

          <a
            href={header.brand?.url || "/"}
            className="flex items-center gap-2"
          >
            <LovexaiLogo className="w-7 h-7" />
            <span className="font-heading text-lg font-bold text-white tracking-widest drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]">
              LOVEXAI
            </span>
          </a>
        </div>

        {/* Right: Search + User */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-white/60 hover:text-white hover:bg-white/10">
            <Search className="h-5 w-5" />
          </Button>
          {header.show_sign && (
            <SignToggle />
          )}
        </div>
      </div>

      {/* Row 2: Category Tabs (Only on Home Page) */}
      {isHomePage && (
        <div className="flex items-center justify-center border-t border-white/5">
          {genderOptions.map((option) => {
            const Icon = option.icon;
            const isActive = gender === option.key;
            return (
              <button
                key={option.key}
                onClick={() => updateFilter('gender', option.key)}
                className={cn(
                  "relative flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-all",
                  isActive ? "text-white" : "text-white/50 hover:text-white/80"
                )}
              >
                <Icon className={cn("w-4 h-4", isActive && "fill-current")} />
                <span>{option.label}</span>

                {isActive && (
                  <div
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary transition-all duration-300"
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
}
