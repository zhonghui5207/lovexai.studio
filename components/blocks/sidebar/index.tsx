"use client";

import { cn } from "@/lib/utils";
import LovexaiLogo from "@/components/ui/logo";
import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import {
  Home,
  MessageSquare,
  Compass,
  PlusCircle,
  Image as ImageIcon,
  CreditCard,
  ChevronDown,
  Coins
} from "lucide-react";
import SignToggle from "@/components/sign/toggle";
import { useState, useEffect } from "react";
import { useAppContext } from "@/contexts/app";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useTranslations } from "next-intl";

export default function Sidebar() {
  const t = useTranslations();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);
  const { user } = useAppContext();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Navigation items with translations
  const NAVIGATION_ITEMS = [
    { name: t('nav.home'), href: '/', icon: Home },
    { name: t('nav.messages'), href: '/chat', icon: MessageSquare },
    { name: t('nav.discover'), href: '/discover', icon: Compass },
    { name: t('nav.create'), href: '/create', icon: PlusCircle },
    { name: t('nav.generate'), href: '/generate', icon: ImageIcon },
    { name: t('nav.pricing'), href: '/pricing', icon: CreditCard },
  ];

  // Tier display with translations
  const getTierDisplay = (tier: string) => {
    const tierKey = `tiers.${tier}` as any;
    const tierName = t(tierKey);
    const tierColors: Record<string, string> = {
      free: "text-white/60",
      plus: "text-blue-400",
      pro: "text-purple-400",
      ultimate: "text-yellow-400",
    };
    return {
      name: tierName,
      color: tierColors[tier] || "text-white/60"
    };
  };

  // Sync gender with URL params
  const urlGender = searchParams.get('gender') as 'girls' | 'guys' | 'anime' | null;
  const gender = urlGender || 'girls';

  // Handle gender change - update URL
  const handleGenderChange = (newGender: 'girls' | 'guys' | 'anime') => {
    // Only navigate if on homepage or discover page
    if (pathname === '/' || pathname === '/en' || pathname === '/zh' || pathname.includes('/discover')) {
      const params = new URLSearchParams(searchParams.toString());
      params.set('gender', newGender);
      router.push(`${pathname}?${params.toString()}`);
    } else {
      // Navigate to homepage with gender
      router.push(`/?gender=${newGender}`);
    }
  };

  // Get real-time user data from Convex by email
  const convexUser = useQuery(api.users.getByEmail, user?.email ? { email: user.email } : "skip");
  const credits = convexUser?.credits_balance ?? 0;
  const tier = convexUser?.subscription_tier || 'free';
  const tierInfo = getTierDisplay(tier);

  // 当侧边栏收起时，强制关闭下拉菜单
  useEffect(() => {
    if (!isHovered) {
      setDropdownOpen(false);
    }
  }, [isHovered]);

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col h-screen fixed left-0 top-0 bg-background/20 border-r border-white/5 z-50 backdrop-blur-xl",
        isHovered ? "w-64 shadow-[10px_0_30px_rgba(0,0,0,0.5)]" : "w-20"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Logo Section */}
      <div className="h-20 flex items-center px-6 gap-3 flex-shrink-0">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 bg-primary blur-md opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
            <LovexaiLogo className="relative w-8 h-8 transition-transform group-hover:scale-110 z-10" />
          </div>
          <span className={cn(
            "font-heading text-xl font-bold text-white tracking-widest transition-all duration-300 whitespace-nowrap overflow-hidden drop-shadow-[0_0_8px_rgba(244,63,94,0.8)]",
            isHovered ? "opacity-100 max-w-[150px]" : "opacity-0 max-w-0"
          )}>
            LOVEXAI
          </span>
        </Link>
      </div>


      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto overflow-x-hidden scrollbar-hide">
        {NAVIGATION_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-3 text-sm font-medium transition-all duration-300 group relative overflow-hidden whitespace-nowrap",
                !isHovered ? "rounded-full justify-center px-0 w-10 h-10 mx-auto" : "rounded-xl",
                isActive 
                  ? "text-white bg-primary/10" 
                  : "text-muted-foreground hover:text-white hover:bg-white/5"
              )}
            >
              <Icon className={cn("w-5 h-5 flex-shrink-0 transition-colors", isActive ? "text-primary" : "group-hover:text-white")} />
              <span className={cn(
                "relative z-10 transition-all duration-300 overflow-hidden whitespace-nowrap",
                isHovered ? "opacity-100 max-w-[150px]" : "opacity-0 max-w-0 hidden"
              )}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="p-3 border-t border-white/10 flex-shrink-0">
        {/* Extended Footer Content - instant show/hide */}
        <div className={cn(
          "space-y-3 px-2",
          isHovered ? "opacity-100 visible mb-4" : "opacity-0 invisible h-0 overflow-hidden"
        )}>
            {/* Credits Display - At top */}
            {convexUser && (
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
            )}

            {/* Links */}
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
                <button
                  key={type}
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
              ))}
            </div>
          </div>

        <div className={cn("flex items-center justify-center", isHovered ? "px-0" : "")}>
          <SignToggle
            dropdownOpen={dropdownOpen}
            onDropdownOpenChange={setDropdownOpen}
          >
            {isHovered && user && (
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
      </div>

    </aside>
  );
}

