"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { useParams, usePathname, useRouter } from "next/navigation";

import { MdLanguage } from "react-icons/md";
import { localeNames, defaultLocale } from "@/i18n/locale";

export default function ({ isIcon = false }: { isIcon?: boolean }) {
  // TODO: Temporarily disabled - only English for now
  // Remove this line to re-enable language switching
  return null;

  const params = useParams();
  const locale = (params.locale as string) || defaultLocale;
  const router = useRouter();
  const pathname = usePathname();

  const handleSwitchLanguage = (value: string) => {
    if (value === locale) return;

    // Remove current locale prefix from pathname
    let pathWithoutLocale = pathname;
    if (pathname.startsWith(`/${locale}`)) {
      pathWithoutLocale = pathname.slice(`/${locale}`.length);
    }
    if (!pathWithoutLocale.startsWith('/')) {
      pathWithoutLocale = '/' + pathWithoutLocale;
    }

    // Add new locale prefix if not default locale
    let newPathName: string;
    if (value === defaultLocale) {
      newPathName = pathWithoutLocale;
    } else {
      newPathName = `/${value}${pathWithoutLocale}`;
    }

    router.push(newPathName);
  };

  return (
    <Select value={locale} onValueChange={handleSwitchLanguage}>
      <SelectTrigger className="flex items-center gap-x-2 border border-white/10 text-white/90 hover:text-white outline-none hover:bg-white/10 focus:ring-0 focus:ring-offset-0 bg-white/5 px-3 py-1.5 rounded-md min-w-[100px] h-9">
        <MdLanguage className="text-base" />
        {!isIcon && (
          <span className="hidden md:block font-medium">{localeNames[locale]}</span>
        )}
      </SelectTrigger>
      <SelectContent className="z-50 bg-[#1a1d26] border-white/10 text-white">
        {Object.keys(localeNames).map((key: string) => {
          const name = localeNames[key];
          return (
            <SelectItem
              className="cursor-pointer text-white/90 hover:bg-white/10 focus:bg-white/10"
              key={key}
              value={key}
            >
              {name}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
