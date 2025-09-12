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
    <section className="relative py-4">
      <div className="md:max-w-7xl mx-auto px-4">
        <nav className="hidden justify-between lg:flex">
          {/* Left: Logo */}
          <div className="flex items-center">
            <a
              href={header.brand?.url || ""}
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

          {/* Center: Navigation Menu */}
          <div className="flex items-center">
            <NavigationMenu>
              <NavigationMenuList className="gap-2">
                {header.nav?.items?.map((item, i) => {
                  if (item.children && item.children.length > 0) {
                    return (
                      <NavigationMenuItem
                        key={i}
                        className="text-white/80"
                      >
                        <NavigationMenuTrigger className="bg-transparent hover:bg-white/5 text-white/80 hover:text-white font-medium px-4 py-2 rounded-lg transition-all duration-300 border-none data-[state=open]:bg-white/5">
                          {item.icon && (
                            <Icon
                              name={item.icon}
                              className="size-4 shrink-0 mr-2"
                            />
                          )}
                          <span>{item.title}</span>
                        </NavigationMenuTrigger>
                        <NavigationMenuContent>
                          <ul className="w-80 p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl shadow-lg">
                            {item.children.map((iitem, ii) => (
                              <li key={ii}>
                                <NavigationMenuLink asChild>
                                  <a
                                    className={cn(
                                      "flex select-none gap-4 rounded-lg p-3 leading-none no-underline outline-none transition-all duration-300 hover:bg-white/5 text-white/80 hover:text-white"
                                    )}
                                    href={iitem.url}
                                    target={iitem.target}
                                  >
                                    {iitem.icon && (
                                      <Icon
                                        name={iitem.icon}
                                        className="size-5 shrink-0 text-blue-400"
                                      />
                                    )}
                                    <div>
                                      <div className="text-sm font-semibold text-white">
                                        {iitem.title}
                                      </div>
                                      <p className="text-sm leading-snug text-white/60">
                                        {iitem.description}
                                      </p>
                                    </div>
                                  </a>
                                </NavigationMenuLink>
                              </li>
                            ))}
                          </ul>
                        </NavigationMenuContent>
                      </NavigationMenuItem>
                    );
                  }

                  return (
                    <NavigationMenuItem key={i}>
                      <NavigationMenuLink asChild>
                        <a
                          className="text-white/80 hover:text-white font-medium px-4 py-2 rounded-lg hover:bg-white/5 transition-all duration-300 bg-transparent border-none"
                          href={item.url}
                          target={item.target}
                        >
                          {item.icon && (
                            <Icon
                              name={item.icon}
                              className="size-4 shrink-0 mr-2"
                            />
                          )}
                          {item.title}
                        </a>
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                  );
                })}
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* Right: Language Toggle & User Profile */}
          <div className="shrink-0 flex gap-3 items-center">
            {header.show_locale && (
              <div className="bg-white/5 border border-white/20 rounded-lg hover:bg-white/10 transition-all duration-200">
                <LocaleToggle />
              </div>
            )}

            {header.show_sign && (
              <SignToggle />
            )}
          </div>
        </nav>

        <div className="block lg:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <LovexaiLogo className="w-8 h-8" />
              {header.brand?.title && (
                <span className="text-xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {header.brand?.title || ""}
                </span>
              )}
            </div>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="bg-white/5 backdrop-blur-sm border border-white/10 text-white hover:bg-white/5 rounded-lg">
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent className="overflow-y-auto bg-slate-900/50 backdrop-blur-lg border-white/10">
                <SheetHeader>
                  <SheetTitle>
                    <div className="flex items-center gap-3">
                      <LovexaiLogo className="w-8 h-8" />
                      {header.brand?.title && (
                        <span className="text-xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                          {header.brand?.title || ""}
                        </span>
                      )}
                    </div>
                  </SheetTitle>
                </SheetHeader>
                <div className="mb-8 mt-8 flex flex-col gap-4">
                  <Accordion type="single" collapsible className="w-full">
                    {header.nav?.items?.map((item, i) => {
                      if (item.children && item.children.length > 0) {
                        return (
                          <AccordionItem
                            key={i}
                            value={item.title || ""}
                            className="border-b border-white/10"
                          >
                            <AccordionTrigger className="mb-4 py-2 font-semibold hover:no-underline text-left text-white hover:text-blue-400 transition-colors duration-300">
                              {item.title}
                            </AccordionTrigger>
                            <AccordionContent className="mt-2">
                              {item.children.map((iitem, ii) => (
                                <a
                                  key={ii}
                                  className={cn(
                                    "flex select-none gap-4 rounded-lg p-3 leading-none outline-none transition-all duration-300 hover:bg-white/5 text-white/80 hover:text-white mb-2"
                                  )}
                                  href={iitem.url}
                                  target={iitem.target}
                                >
                                  {iitem.icon && (
                                    <Icon
                                      name={iitem.icon}
                                      className="size-4 shrink-0 text-blue-400"
                                    />
                                  )}
                                  <div>
                                    <div className="text-sm font-semibold text-white">
                                      {iitem.title}
                                    </div>
                                    <p className="text-sm leading-snug text-white/60">
                                      {iitem.description}
                                    </p>
                                  </div>
                                </a>
                              ))}
                            </AccordionContent>
                          </AccordionItem>
                        );
                      }
                      return (
                        <a
                          key={i}
                          href={item.url}
                          target={item.target}
                          className="font-semibold my-4 flex items-center gap-3 text-white/80 hover:text-white p-3 rounded-lg hover:bg-white/5 transition-all duration-300"
                        >
                          {item.title}
                          {item.icon && (
                            <Icon
                              name={item.icon}
                              className="size-4 shrink-0"
                            />
                          )}
                        </a>
                      );
                    })}
                  </Accordion>
                </div>
                <div className="flex-1"></div>
                <div className="border-t border-white/10 pt-6">
                  <div className="mt-2 flex flex-col gap-4">
                    {header.buttons?.map((item, i) => {
                      return (
                        <Button 
                          key={i} 
                          variant={item.variant}
                          className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white font-semibold py-3 rounded-lg shadow-lg transition-all duration-300 border-0"
                        >
                          <Link
                            href={item.url || ""}
                            target={item.target || ""}
                            className="flex items-center gap-2"
                          >
                            {item.title}
                            {item.icon && (
                              <Icon
                                name={item.icon}
                                className="size-4 shrink-0"
                              />
                            )}
                          </Link>
                        </Button>
                      );
                    })}

                    {header.show_sign && (
                      <div className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
                        <SignToggle />
                      </div>
                    )}
                  </div>

                  <div className="mt-6 flex items-center gap-3">
                    {header.show_locale && (
                      <div className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
                        <LocaleToggle />
                      </div>
                    )}
                    <div className="flex-1"></div>

                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </section>
  );
}
