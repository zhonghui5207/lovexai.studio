"use client";

import { Badge } from "@/components/ui/badge";
import HappyUsers from "./happy-users";
import ModernBg from "./ModernBg";
import { Hero as HeroType } from "@/types/blocks/hero";
import Icon from "@/components/icon";
import Link from "next/link";
import OptimizedGenerator from "./OptimizedGenerator";

export default function Hero({ hero }: { hero: HeroType }) {
  if (hero.disabled) {
    return null;
  }

  const highlightText = hero.highlight_text;
  let texts = null;
  if (highlightText) {
    texts = hero.title?.split(highlightText, 2);
  }

  return (
    <>
      <ModernBg />
      <section className="relative min-h-screen py-16 lg:py-24 overflow-hidden">
        {/* Glass morphism overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-blue-500/5 backdrop-blur-3xl"></div>
        
        <div className="container relative z-10">
          {hero.show_badge && (
            <div className="flex items-center justify-center mb-8">
              <div className="relative p-1 rounded-2xl bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 backdrop-blur-sm">
                <div className="bg-black/20 rounded-xl px-6 py-3 backdrop-blur-sm">
                  <img
                    src="/imgs/badges/phdaily.svg"
                    alt="phdaily"
                    className="h-8 object-cover opacity-90"
                  />
                </div>
              </div>
            </div>
          )}
          <div className="text-center max-w-6xl mx-auto">
            {hero.announcement && (
              <div className="mb-8">
                <a
                  href={hero.announcement.url}
                  className="inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm font-medium transition-all duration-300 hover:bg-white/10 hover:border-white/30 backdrop-blur-sm group"
                >
                  {hero.announcement.label && (
                    <Badge variant="secondary" className="bg-gradient-to-r from-blue-500/80 to-purple-500/80 text-white border-0">
                      {hero.announcement.label}
                    </Badge>
                  )}
                  <span className="text-white/90">{hero.announcement.title}</span>
                  <Icon name="RiArrowRightLine" className="h-3 w-3 text-white/70 transition-transform group-hover:translate-x-1" />
                </a>
              </div>
            )}

            {texts && texts.length > 1 ? (
              <h1 className="mb-8 text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl xl:text-8xl">
                <span className="block text-white drop-shadow-2xl">{texts[0]}</span>
                <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent drop-shadow-2xl">
                  {highlightText}
                </span>
                <span className="block text-white drop-shadow-2xl">{texts[1]}</span>
              </h1>
            ) : (
              <h1 className="mb-8 text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl xl:text-8xl text-white drop-shadow-2xl">
                {hero.title}
              </h1>
            )}

            <p
              className="mx-auto mb-12 max-w-3xl text-xl text-white/80 lg:text-2xl leading-relaxed font-light"
              dangerouslySetInnerHTML={{ __html: hero.description || "" }}
            />
            
            {/* Optimized Generator - Support both text-to-image and image-to-image */}
            {hero.prompt_input && (
              <OptimizedGenerator hero={hero} />
            )}

            {hero.tip && (
              <p className="mt-16 text-sm text-white/50 max-w-3xl mx-auto font-light">{hero.tip}</p>
            )}
            {hero.show_happy_users && (
              <div className="mt-12">
                <HappyUsers />
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}