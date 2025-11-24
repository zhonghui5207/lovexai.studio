import { Footer as FooterType } from "@/types/blocks/footer";
import Icon from "@/components/icon";
import LovexaiLogo from "@/components/ui/logo";

export default function Footer({ footer }: { footer: FooterType }) {
  if (footer.disabled) {
    return null;
  }

  return (
    <section id={footer.name} className="relative bg-black py-12 lg:py-20 overflow-hidden">
      <div className="w-full px-6 md:px-8 max-w-[1400px] mx-auto">
        <footer>
          {/* Grid Layout: Left Brand (2 cols) | Right Links (3 cols) */}
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-8">
            
            {/* Brand Column */}
            <div className="flex flex-col gap-6 lg:col-span-4 xl:col-span-5">
              {footer.brand && (
                <div className="flex flex-col gap-6">
                  <div className="flex items-center gap-3 group w-fit">
                    <LovexaiLogo className="h-10 w-10 transition-transform duration-300 group-hover:scale-110" />
                    {footer.brand.title && (
                      <span className="text-2xl font-bold tracking-tight text-white">
                        {footer.brand.title}
                      </span>
                    )}
                  </div>
                  <p className="text-base font-light leading-relaxed text-white/60">
                    Experience the next generation of AI companionship. Dive into immersive roleplay, create your dream characters, and explore a universe of limitless possibilities. Your fantasy, your rules.
                  </p>
                </div>
              )}
              
              {footer.social && (
                <ul className="flex items-center gap-4">
                  {footer.social.items?.map((item, i) => (
                    <li key={i}>
                      <a 
                        href={item.url} 
                        target={item.target}
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 transition-colors duration-300 hover:border-primary/50 hover:bg-primary/10 hover:text-primary"
                      >
                        {item.icon && <Icon name={item.icon} className="h-4 w-4" />}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Links Columns */}
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-8 lg:col-start-6 xl:col-span-6 xl:col-start-7">
              {/* Column 1 */}
              <div className="flex flex-col gap-4">
                <h4 className="text-lg font-bold text-white">Explore</h4>
                <ul className="flex flex-col gap-2">
                  <li><a href="/characters" className="text-sm text-white/60 transition-colors hover:text-primary">Characters</a></li>
                  <li><a href="/generate" className="text-sm text-white/60 transition-colors hover:text-primary">Image Gen</a></li>
                  <li><a href="/pricing" className="text-sm text-white/60 transition-colors hover:text-primary">Pricing</a></li>
                </ul>
              </div>

              {/* Column 2 */}
              <div className="flex flex-col gap-4">
                <h4 className="text-lg font-bold text-white">Support</h4>
                <ul className="flex flex-col gap-2">
                  <li><a href="#" className="text-sm text-white/60 transition-colors hover:text-primary">Help Center</a></li>
                  <li><a href="#" className="text-sm text-white/60 transition-colors hover:text-primary">Community</a></li>
                  <li><a href="#" className="text-sm text-white/60 transition-colors hover:text-primary">Contact</a></li>
                </ul>
              </div>

              {/* Column 3 */}
              <div className="flex flex-col gap-4">
                <h4 className="text-lg font-bold text-white">Legal</h4>
                <ul className="flex flex-col gap-2">
                  <li><a href="#" className="text-sm text-white/60 transition-colors hover:text-primary">Terms</a></li>
                  <li><a href="#" className="text-sm text-white/60 transition-colors hover:text-primary">Privacy</a></li>
                  <li><a href="#" className="text-sm text-white/60 transition-colors hover:text-primary">Guidelines</a></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-16 flex flex-col items-center justify-between gap-6 border-t border-white/10 pt-8 text-sm font-medium lg:flex-row">
            {footer.copyright && (
              <p className="text-white/40 text-center lg:text-left">
                {footer.copyright}
              </p>
            )}

            {footer.agreement && (
              <ul className="flex flex-wrap justify-center gap-6">
                {footer.agreement.items?.map((item, i) => (
                  <li key={i}>
                    <a 
                      href={item.url} 
                      target={item.target}
                      className="text-white/40 transition-colors hover:text-white"
                    >
                      {item.title}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </footer>
      </div>
    </section>
  );
}
