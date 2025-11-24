import { Footer as FooterType } from "@/types/blocks/footer";
import Icon from "@/components/icon";
import LovexaiLogo from "@/components/ui/logo";

export default function Footer({ footer }: { footer: FooterType }) {
  if (footer.disabled) {
    return null;
  }

  return (
    <section id={footer.name} className="relative py-20 overflow-hidden bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <footer>
          <div className="flex flex-col items-center justify-between gap-12 text-center lg:flex-row lg:items-start lg:text-left">
            <div className="flex w-full max-w-96 shrink flex-col items-center justify-between gap-8 lg:items-start">
              {footer.brand && (
                <div>
                  <div className="flex items-center justify-center gap-3 lg:justify-start group">
                    <LovexaiLogo className="h-10 w-10 transition-transform group-hover:scale-110 duration-300" />
                    {footer.brand.title && (
                      <p className="text-2xl font-bold text-white tracking-tight">
                        {footer.brand.title}
                      </p>
                    )}
                  </div>
                  <p className="mt-6 text-base text-white/60 font-light leading-relaxed">
                    Experience the next generation of AI companionship. Dive into immersive roleplay, create your dream characters, and explore a universe of limitless possibilities. Your fantasy, your rules.
                  </p>
                </div>
              )}
              {footer.social && (
                <ul className="flex items-center space-x-4">
                  {footer.social.items?.map((item, i) => (
                    <li 
                      key={i} 
                      className="font-medium transition-all duration-300 transform hover:scale-110"
                    >
                      <a 
                        href={item.url} 
                        target={item.target}
                        className="flex items-center justify-center w-10 h-10 rounded-full bg-white/5 border border-white/10 text-white/60 hover:text-primary hover:border-primary/50 hover:bg-primary/10 transition-all duration-300"
                      >
                        {item.icon && (
                          <Icon name={item.icon} className="size-4" />
                        )}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
              </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-8 lg:gap-12 w-full lg:w-auto">
              <div className="text-center md:text-left">
                <p className="mb-4 font-bold text-lg text-white">Explore</p>
                <ul className="space-y-2">
                  <li><a href="/characters" className="text-white/60 hover:text-primary text-sm hover:translate-x-1 inline-block transition-all">Characters</a></li>
                  <li><a href="/generate" className="text-white/60 hover:text-primary text-sm hover:translate-x-1 inline-block transition-all">Image Gen</a></li>
                  <li><a href="/pricing" className="text-white/60 hover:text-primary text-sm hover:translate-x-1 inline-block transition-all">Pricing</a></li>
                </ul>
              </div>
              <div className="text-center md:text-left">
                <p className="mb-4 font-bold text-lg text-white">Support</p>
                <ul className="space-y-2">
                  <li><a href="#" className="text-white/60 hover:text-primary text-sm hover:translate-x-1 inline-block transition-all">Help Center</a></li>
                  <li><a href="#" className="text-white/60 hover:text-primary text-sm hover:translate-x-1 inline-block transition-all">Community</a></li>
                  <li><a href="#" className="text-white/60 hover:text-primary text-sm hover:translate-x-1 inline-block transition-all">Contact</a></li>
                </ul>
              </div>
              <div className="text-center md:text-left">
                <p className="mb-4 font-bold text-lg text-white">Legal</p>
                <ul className="space-y-2">
                  <li><a href="#" className="text-white/60 hover:text-primary text-sm hover:translate-x-1 inline-block transition-all">Terms</a></li>
                  <li><a href="#" className="text-white/60 hover:text-primary text-sm hover:translate-x-1 inline-block transition-all">Privacy</a></li>
                  <li><a href="#" className="text-white/60 hover:text-primary text-sm hover:translate-x-1 inline-block transition-all">Guidelines</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="mt-16 flex flex-col justify-between gap-6 pt-8 text-center text-sm font-medium lg:flex-row lg:items-center lg:text-left">
            {footer.copyright && (
              <p className="text-white/40">
                {footer.copyright}
              </p>
            )}

            {footer.agreement && (
              <ul className="flex justify-center gap-6 lg:justify-start">
                {footer.agreement.items?.map((item, i) => (
                  <li key={i} className="transition-all duration-300">
                    <a 
                      href={item.url} 
                      target={item.target}
                      className="text-white/40 hover:text-white font-medium transition-all duration-300"
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
