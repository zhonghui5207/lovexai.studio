"use client";

import { cn } from "@/lib/utils";
import LovexaiLogo from "@/components/ui/logo";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  MessageSquare, 
  Compass, 
  PlusCircle, 
  Image as ImageIcon, 
  CreditCard, 
  ChevronDown
} from "lucide-react";
import SignToggle from "@/components/sign/toggle";
import { useState } from "react";
import { useAppContext } from "@/contexts/app";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const NAVIGATION_ITEMS = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Messages', href: '/chat', icon: MessageSquare },
  { name: 'Discover', href: '/discover', icon: Compass },
  { name: 'Create', href: '/create', icon: PlusCircle },
  { name: 'Generate', href: '/generate', icon: ImageIcon },
  { name: 'Pricing', href: '/pricing', icon: CreditCard },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isHovered, setIsHovered] = useState(false);
  const { user } = useAppContext();
  const [gender, setGender] = useState<'girls' | 'guys' | 'anime'>('girls');

  return (
    <aside 
      className={cn(
        "hidden md:flex flex-col h-screen fixed left-0 top-0 bg-background/20 border-r border-white/5 z-50 backdrop-blur-xl transition-all duration-300 ease-in-out overflow-hidden",
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
            "font-heading text-xl font-bold text-white tracking-tight transition-all duration-300 whitespace-nowrap overflow-hidden",
            isHovered ? "opacity-100 max-w-[150px]" : "opacity-0 max-w-0"
          )}>
            LoveXAI
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
                "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-300 group relative overflow-hidden whitespace-nowrap",
                isActive 
                  ? "text-white bg-primary/10" 
                  : "text-muted-foreground hover:text-white hover:bg-white/5",
                !isHovered && "justify-center px-0"
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full" />
              )}
              <Icon className={cn("w-5 h-5 flex-shrink-0 transition-colors", isActive ? "text-primary" : "group-hover:text-white")} />
              <span className={cn(
                "relative z-10 transition-all duration-300 overflow-hidden whitespace-nowrap",
                isHovered ? "opacity-100 max-w-[150px]" : "opacity-0 max-w-0"
              )}>
                {item.name}
              </span>
              
              {!isHovered && isActive && (
                <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="p-3 border-t border-white/10 flex-shrink-0">
        {/* Extended Footer Content - Only visible when hovered */}
          {isHovered && (
          <div className="mb-4 space-y-4 px-2">
            {/* Links */}
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground font-medium px-1">
              {['Discord', 'Reddit', 'Twitter', 'Tags', 'Affiliates', 'Guides'].map((text) => (
                <a key={text} href="#" className="hover:text-white transition-colors">
                  {text}
                </a>
              ))}
            </div>

            {/* Gender Toggle */}
            <div className="bg-white/5 p-1 rounded-lg grid grid-cols-3 gap-1">
              {(['Girls', 'Guys', 'Anime'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setGender(type.toLowerCase() as any)}
                  className={cn(
                    "text-xs font-medium py-1.5 rounded-md transition-all duration-200",
                    gender === type.toLowerCase()
                      ? "bg-primary text-white shadow-sm"
                      : "text-muted-foreground hover:text-white hover:bg-white/5"
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className={cn("flex items-center justify-center", isHovered ? "px-0" : "")}>
          <SignToggle>
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
                  <p className="text-[10px] text-muted-foreground font-medium">Free Plan</p>
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
