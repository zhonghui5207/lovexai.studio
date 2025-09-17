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

export default function Header({ header }: { header: HeaderType }) {
  if (header.disabled) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center justify-between">
        {/* Left: Logo */}
        <div className="flex items-center">
          <a
            href={header.brand?.url || "/"}
            className="flex items-center gap-3 group transition-all duration-300"
          >
            <LovexaiLogo className="w-8 h-8 transition-transform group-hover:scale-110" />
            {header.brand?.title && (
              <span className="text-xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent group-hover:from-blue-300 group-hover:via-purple-300 group-hover:to-pink-300 transition-all duration-300">
                {header.brand?.title || ""}
              </span>
            )}
          </a>
        </div>

        {/* Center: Navigation Menu - Strict Nectar.AI Style */}
        <nav className="hidden md:flex items-center space-x-8">
          <a
            href="/"
            className="text-sm font-medium text-foreground hover:text-foreground/80 transition-colors"
          >
            Home
          </a>
          <a
            href="/discover"
            className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
          >
            Discover
          </a>
          <a
            href="/create"
            className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
          >
            Create
          </a>
          <a
            href="/generate"
            className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
          >
            Generate
          </a>
          <a
            href="/pricing"
            className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
          >
            Pricing
          </a>
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
      <div className="md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="ml-auto">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-full sm:w-80">
            <SheetHeader>
              <SheetTitle>
                <div className="flex items-center gap-3">
                  <LovexaiLogo className="w-8 h-8" />
                  {header.brand?.title && (
                    <span className="text-lg font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                      {header.brand?.title || ""}
                    </span>
                  )}
                </div>
              </SheetTitle>
            </SheetHeader>
            <div className="flex flex-col space-y-4 mt-8">
              <a href="/" className="text-lg font-medium px-2 py-3 border-b">Home</a>
              <a href="/discover" className="text-lg font-medium px-2 py-3 border-b">Discover</a>
              <a href="/create" className="text-lg font-medium px-2 py-3 border-b">Create</a>
              <a href="/generate" className="text-lg font-medium px-2 py-3 border-b">Generate</a>
              <a href="/pricing" className="text-lg font-medium px-2 py-3 border-b">Pricing</a>
              <div className="flex items-center justify-between pt-6">
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
