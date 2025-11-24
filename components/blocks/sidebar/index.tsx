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
  Settings,
  LogOut,
  User,
  ChevronRight
} from "lucide-react";
import SignToggle from "@/components/sign/toggle";
import LocaleToggle from "@/components/locale/toggle";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

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

  return (
    <aside 
      className={cn(
        "hidden md:flex flex-col h-screen fixed left-0 top-0 bg-black/95 border-r border-white/10 z-50 backdrop-blur-xl transition-all duration-300 ease-in-out overflow-hidden",
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
            "font-heading text-xl font-bold text-white tracking-tight transition-all duration-300 whitespace-nowrap",
            isHovered ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 pointer-events-none hidden"
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
                "relative z-10 transition-all duration-300",
                isHovered ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4 hidden"
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
      <div className="p-3 border-t border-white/10 space-y-4 flex-shrink-0">
        {/* Upgrade Card - Only visible when hovered */}
        <AnimatePresence>
          {isHovered && (
            <motion.div 
              initial={{ opacity: 0, height: 0, scale: 0.9 }}
              animate={{ opacity: 1, height: 'auto', scale: 1 }}
              exit={{ opacity: 0, height: 0, scale: 0.9 }}
              className="p-4 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/20 overflow-hidden"
            >
              <h4 className="text-white font-bold text-sm mb-1 whitespace-nowrap">Upgrade Plan</h4>
              <p className="text-xs text-white/60 mb-3 whitespace-nowrap">Unlock premium features.</p>
              <Button size="sm" className="w-full bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25 whitespace-nowrap">
                Upgrade
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* User Controls */}
        <div className={cn("flex items-center gap-2", isHovered ? "justify-between px-2" : "flex-col justify-center")}>
          <LocaleToggle />
          <SignToggle />
        </div>
      </div>
    </aside>
  );
}
