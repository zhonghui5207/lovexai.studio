"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function TopFilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const currentGender = searchParams.get("gender") || "female";
  const currentNsfw = searchParams.get("nsfw") === "true";

  const [gender, setGender] = useState(currentGender);
  const [nsfw, setNsfw] = useState(currentNsfw);

  useEffect(() => {
    setGender(currentGender);
    setNsfw(currentNsfw);
  }, [currentGender, currentNsfw]);

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
    { key: 'female', label: 'Girls', icon: '👩' },
    { key: 'male', label: 'Guys', icon: '👨' },
    { key: 'anime', label: 'Anime', icon: '🎭' }
  ];

  return (
    <div className="sticky top-0 z-40 w-full bg-black/80 backdrop-blur-xl border-b border-white/5 px-6 py-3 flex items-center justify-between">
      {/* Left: Gender Tabs */}
      <div className="flex items-center gap-2">
        <div className="inline-flex p-1 rounded-full bg-white/5 border border-white/10">
          {genderOptions.map((option) => (
            <button
              key={option.key}
              onClick={() => updateFilter('gender', option.key)}
              className={`relative px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${
                gender === option.key
                  ? 'text-white shadow-lg'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              {gender === option.key && (
                <motion.div
                  layoutId="activeGenderTop"
                  className="absolute inset-0 bg-primary rounded-full"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <span>{option.icon}</span>
                {option.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Right: NSFW & Search */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
          <span className="text-xs font-bold text-white/80 uppercase tracking-wider">NSFW</span>
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
            placeholder="Search..." 
            className="bg-white/5 border border-white/10 rounded-full pl-9 pr-4 py-1.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-primary w-48 transition-all focus:w-64"
          />
        </div>
      </div>
    </div>
  );
}
