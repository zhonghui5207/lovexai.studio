"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Search, Heart, User, Star } from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import LocaleToggle from "@/components/locale/toggle";
import { useTranslations } from "next-intl";

export default function TopFilterBar() {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  const currentGender = searchParams.get("gender") || "girls";
  const currentNsfw = searchParams.get("nsfw") === "true";

  const [gender, setGender] = useState(currentGender);
  const [nsfw, setNsfw] = useState(currentNsfw);

  useEffect(() => {
    setGender(currentGender);
    setNsfw(currentNsfw);
  }, [currentGender, currentNsfw]);

  // Only show on home page (strip locale prefix for check)
  const pathnameWithoutLocale = pathname.replace(/^\/[a-z]{2}/, '') || '/';
  if (pathnameWithoutLocale !== '/') return null;

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const genderOptions = [
    { key: 'girls', label: t('categories.girls'), icon: Heart },
    { key: 'guys', label: t('categories.guys'), icon: User },
    { key: 'anime', label: t('categories.anime'), icon: Star }
  ];

  return (
    <div className="sticky top-0 z-40 w-full bg-background/20 backdrop-blur-xl border-b border-white/5 px-6 md:px-8 py-3 flex items-center justify-between">
      {/* Left: Gender Tabs */}
      <div className="flex items-center gap-2">
        <div className="flex items-center">
          {genderOptions.map((option) => {
            const Icon = option.icon;
            const isActive = gender === option.key;
            return (
              <button
                key={option.key}
                onClick={() => updateFilter('gender', option.key)}
                className={`relative px-6 py-3 text-sm font-medium transition-all duration-300 ${
                  isActive
                    ? 'text-white'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2 translate-y-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'fill-current' : ''}`} />
                  <span>{option.label}</span>
                </div>
                
                {isActive && (
                  <motion.div
                    layoutId="activeGenderTop"
                    className="absolute -bottom-[13px] left-0 right-0 h-[2px] bg-primary"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Right: NSFW & Search */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
          <span className="text-xs font-bold text-white/80 uppercase tracking-wider">{t('top_filter.nsfw')}</span>
          <button
            onClick={() => updateFilter('nsfw', (!nsfw).toString())}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
              nsfw ? 'bg-primary' : 'bg-white/20'
            }`}
          >
            <span
              className={`${
                nsfw ? 'translate-x-4' : 'translate-x-1'
              } inline-block h-3 w-3 transform rounded-full bg-white transition-transform`}
            />
          </button>
        </div>

        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder={t('top_filter.search')}
            className="bg-white/5 border border-white/10 rounded-full pl-9 pr-4 py-1.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-primary w-48 transition-all focus:w-64"
          />
        </div>

        <LocaleToggle />
      </div>
    </div>
  );
}
