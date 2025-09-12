import { Footer as FooterType } from "@/types/blocks/footer";
import Icon from "@/components/icon";

export default function Footer({ footer }: { footer: FooterType }) {
  if (footer.disabled) {
    return null;
  }

  return (
    <section id={footer.name} className="relative py-20 overflow-hidden">
      <div className="max-w-7xl mx-auto px-8">
        <footer>
          <div className="flex flex-col items-center justify-between gap-12 text-center lg:flex-row lg:text-left">
            <div className="flex w-full max-w-96 shrink flex-col items-center justify-between gap-8 lg:items-start">
              {footer.brand && (
                <div>
                  <div className="flex items-center justify-center gap-3 lg:justify-start group">
                    {footer.brand.logo && (
                      <img
                        src={footer.brand.logo.src}
                        alt={footer.brand.logo.alt || footer.brand.title}
                        className="h-12 transition-transform group-hover:scale-110 duration-300"
                      />
                    )}
                    {footer.brand.title && (
                      <p className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                        {footer.brand.title}
                      </p>
                    )}
                  </div>
                  {footer.brand.description && (
                    <p className="mt-6 text-lg text-white/70 font-light leading-relaxed">
                      {footer.brand.description}
                    </p>
                  )}
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
                        className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-all duration-300"
                      >
                        {item.icon && (
                          <Icon name={item.icon} className="size-5" />
                        )}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-16">
              {footer.nav?.items?.map((item, i) => (
                <div key={i} className="text-center md:text-left">
                  <p className="mb-6 font-bold text-xl text-white">{item.title}</p>
                  <ul className="space-y-4">
                    {item.children?.map((iitem, ii) => (
                      <li 
                        key={ii} 
                        className="font-medium transition-all duration-300"
                      >
                        <a 
                          href={iitem.url} 
                          target={iitem.target}
                          className="text-white/70 hover:text-white text-base hover:translate-x-1 inline-block transition-all duration-300"
                        >
                          {iitem.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-12 flex flex-col justify-between gap-6 border-t border-white/10 pt-8 text-center text-base font-medium lg:flex-row lg:items-center lg:text-left">
            {footer.copyright && (
              <p className="text-white/60">
                {footer.copyright}
                {process.env.NEXT_PUBLIC_SHOW_POWERED_BY === "false" ? null : (
                  <a
                    href="https://shipany.ai"
                    target="_blank"
                    className="px-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent hover:from-blue-300 hover:to-purple-300 transition-all duration-300 font-semibold"
                  >
                    build with ShipAny
                  </a>
                )}
              </p>
            )}

            {footer.agreement && (
              <ul className="flex justify-center gap-6 lg:justify-start">
                {footer.agreement.items?.map((item, i) => (
                  <li key={i} className="transition-all duration-300">
                    <a 
                      href={item.url} 
                      target={item.target}
                      className="text-white/70 hover:text-white font-medium hover:underline transition-all duration-300"
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
