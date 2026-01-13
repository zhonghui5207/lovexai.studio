"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { Header as HeaderType } from "@/types/blocks/header";
import Icon from "@/components/icon";
import Link from "next/link";
import LocaleToggle from "@/components/locale/toggle";
import { Menu } from "lucide-react";
import SignToggle from "@/components/sign/toggle";
import { cn } from "@/lib/utils";
import LovexaiLogo from "@/components/ui/logo";
import { useTranslations } from "next-intl";

export default function Header({ header }: { header: HeaderType }) {
  const t = useTranslations();

  if (header.disabled) {
    return null;
  }

  const navItems = [
    { name: t('nav.home'), href: '/' },
    { name: t('nav.messages'), href: '/chat' },
    { name: t('nav.discover'), href: '/discover' },
    { name: t('nav.create'), href: '/create' },
    { name: t('nav.generate'), href: '/generate' },
    { name: t('nav.pricing'), href: '/pricing' },
  ];

  return (
    <header className="absolute top-0 left-0 right-0 z-50 w-full bg-transparent backdrop-blur-[2px]">
      <div className="container flex h-20 max-w-screen-2xl items-center justify-between">
        {/* Left: Logo */}
        <div className="flex items-center">
          <a
            href={header.brand?.url || "/"}
            className="flex items-center gap-3 group transition-all duration-300"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-primary blur-md opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
              <LovexaiLogo className="relative w-10 h-10 transition-transform group-hover:scale-110 z-10" />
            </div>
            {header.brand?.title && (
              <span className="font-heading text-2xl font-bold text-white tracking-tight group-hover:text-primary transition-colors duration-300">
                {header.brand?.title || ""}
              </span>
            )}
          </a>
        </div>

        {/* Center: Navigation Menu */}
        <nav className="hidden md:flex items-center space-x-1">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="relative px-4 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors group overflow-hidden rounded-full"
            >
              <span className="relative z-10">{item.name}</span>
              <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            </a>
          ))}
        </nav>

        {/* Right: Language Toggle & User Profile */}
        <div className="flex items-center space-x-4">
          {header.show_locale && (
            <LocaleToggle />
          )}

          {header.show_sign && (
            <SignToggle />
          )}
        </div>
      </div>
      
      {/* Mobile Navigation */}
      <div className="md:hidden absolute right-4 top-4">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
              <Menu className="h-6 w-6" />
              <span className="sr-only">{t('nav.toggle_menu')}</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-full sm:w-80 bg-background/95 backdrop-blur-xl border-r border-white/10">
            <SheetHeader>
              <SheetTitle>
                <div className="flex items-center gap-3">
                  <LovexaiLogo className="w-8 h-8" />
                  {header.brand?.title && (
                    <span className="text-lg font-bold text-white">
                      {header.brand?.title || ""}
                    </span>
                  )}
                </div>
              </SheetTitle>
            </SheetHeader>
            <div className="flex flex-col space-y-2 mt-8">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="text-lg font-medium px-4 py-3 rounded-xl hover:bg-white/5 text-white/80 hover:text-white transition-all"
                >
                  {item.name}
                </a>
              ))}
              <div className="flex items-center justify-between pt-6 px-4">
                {header.show_locale && <LocaleToggle />}
                {header.show_sign && <SignToggle />}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
