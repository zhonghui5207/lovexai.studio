"use client";

import { Footer as FooterType } from "@/types/blocks/footer";
import LovexaiLogo from "@/components/ui/logo";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useTranslations } from "next-intl";

export default function Footer({ footer }: { footer: FooterType }) {
  const t = useTranslations();
  const pathname = usePathname();

  // Strip locale prefix for homepage check
  const pathnameWithoutLocale = pathname.replace(/^\/[a-z]{2}/, '') || '/';

  if (footer.disabled || pathnameWithoutLocale !== '/') {
    return null;
  }

  return (
    <section id={footer.name} className="relative bg-black py-12 lg:py-20 overflow-hidden">
      <div className="w-full px-6 md:px-8 max-w-[1400px] mx-auto">
        <footer>
          {/* Grid Layout: Left Brand | Right Links (4 columns) */}
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-8">
            
            {/* Brand Column */}
            <div className="flex flex-col gap-6 lg:col-span-4">
              <div className="flex flex-col gap-6">
                <div className="flex items-center gap-3 group w-fit">
                  <LovexaiLogo className="h-10 w-10 transition-transform duration-300 group-hover:scale-110" />
                  <span className="text-2xl font-bold tracking-tight text-white">
                    LOVEXAI
                  </span>
                </div>
                <p className="text-base font-light leading-relaxed text-white/60">
                  {t('footer.description')}
                </p>
                <p className="text-sm text-white/40">
                  © {new Date().getFullYear()} LOVEXAI.Studio - {t('footer.rights_reserved')}
                </p>
              </div>
            </div>

            {/* Links Columns */}
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:col-span-8">
              
              {/* Column 1: Features */}
              <div className="flex flex-col gap-4">
                <h4 className="text-lg font-bold text-white">{t('footer.column_features')}</h4>
                <ul className="flex flex-col gap-2">
                  <li><a href="/discover" className="text-sm text-white/60 transition-colors hover:text-primary">{t('footer.ai_characters')}</a></li>
                  <li><a href="/chat" className="text-sm text-white/60 transition-colors hover:text-primary">{t('footer.ai_chat')}</a></li>
                  <li><a href="/generate" className="text-sm text-white/60 transition-colors hover:text-primary">{t('footer.image_generator')}</a></li>
                  <li><a href="/create" className="text-sm text-white/60 transition-colors hover:text-primary">{t('footer.create_character')}</a></li>
                </ul>
              </div>

              {/* Column 2: Trending */}
              <div className="flex flex-col gap-4">
                <h4 className="text-lg font-bold text-white">{t('footer.column_trending')}</h4>
                <ul className="flex flex-col gap-2">
                  <li><a href="/discover?filter=female" className="text-sm text-white/60 transition-colors hover:text-primary">{t('footer.ai_girlfriend')}</a></li>
                  <li><a href="/discover?filter=male" className="text-sm text-white/60 transition-colors hover:text-primary">{t('footer.ai_boyfriend')}</a></li>
                  <li><a href="/discover?filter=anime" className="text-sm text-white/60 transition-colors hover:text-primary">{t('footer.anime_characters')}</a></li>
                  <li><a href="/pricing" className="text-sm text-white/60 transition-colors hover:text-primary">{t('nav.pricing')}</a></li>
                </ul>
              </div>

              {/* Column 3: Legal */}
              <div className="flex flex-col gap-4">
                <h4 className="text-lg font-bold text-white">{t('footer.column_legal')}</h4>
                <ul className="flex flex-col gap-2">
                  <li><a href="/terms-of-service" className="text-sm text-white/60 transition-colors hover:text-primary">{t('footer.terms_of_use')}</a></li>
                  <li><a href="/privacy-policy" className="text-sm text-white/60 transition-colors hover:text-primary">{t('footer.privacy_policy')}</a></li>
                </ul>
              </div>

              {/* Column 4: Contact Us */}
              <div className="flex flex-col gap-4">
                <h4 className="text-lg font-bold text-white">{t('footer.column_contact')}</h4>
                <ul className="flex flex-col gap-3">
                  <li>
                    <a
                      href="https://discord.gg/lovexai"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-white/60 transition-colors hover:text-primary"
                    >
                      {t('footer.discord')}
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://twitter.com/lovexai"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-white/60 transition-colors hover:text-primary"
                    >
                      {t('footer.twitter')}
                    </a>
                  </li>
                </ul>

                {/* Payment Methods - Direct icon display */}
                <div className="mt-2">
                  <div className="flex flex-col gap-2">
                    {/* Row 1: Visa, Mastercard */}
                    <div className="flex items-center gap-2">
                      <Image 
                        src="/visa_logo.svg" 
                        alt="Visa" 
                        width={80} 
                        height={50} 
                        className="object-contain"
                      />
                      <Image 
                        src="/mastercard_logo.svg" 
                        alt="Mastercard" 
                        width={80} 
                        height={50} 
                        className="object-contain"
                      />
                    </div>

                    {/* Row 2: Bitcoin, WeChat, Alipay - All circular */}
                    <div className="flex items-center gap-2">
                      <Image 
                        src="/bitcoin_logo.svg" 
                        alt="Bitcoin" 
                        width={50} 
                        height={50} 
                        className="object-contain"
                      />
                      <div className="flex h-[50px] w-[50px] items-center justify-center rounded-full bg-[#07C160]">
                        <svg viewBox="0 0 24 24" className="h-8 w-8" fill="white">
                          <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.89c-.135-.01-.269-.03-.406-.032zm-2.344 3.02c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.981.97-.981zm4.844 0c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.981.969-.981z" />
                        </svg>
                      </div>
                      <Image
                        src="/alipay-icon.svg"
                        alt="Alipay"
                        width={50}
                        height={50}
                        className="object-contain"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </section>
  );
}
