"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { useParams, usePathname, useRouter } from "next/navigation";

import { MdLanguage } from "react-icons/md";
import { localeNames } from "@/i18n/locale";

export default function ({ isIcon = false }: { isIcon?: boolean }) {
  const params = useParams();
  const locale = params.locale as string;
  const router = useRouter();
  const pathname = usePathname();

  const handleSwitchLanguage = (value: string) => {
    if (value !== locale) {
      let newPathName = pathname.replace(`/${locale}`, `/${value}`);
      if (!newPathName.startsWith(`/${value}`)) {
        newPathName = `/${value}${newPathName}`;
      }
      router.push(newPathName);
    }
  };

  return (
    <Select value={locale} onValueChange={handleSwitchLanguage}>
      <SelectTrigger className="flex items-center gap-x-2 border-none text-white/80 hover:text-white outline-none hover:bg-transparent focus:ring-0 focus:ring-offset-0 bg-transparent">
        <MdLanguage className="text-xl" />
        {!isIcon && (
          <span className="hidden md:block">{localeNames[locale]}</span>
        )}
      </SelectTrigger>
      <SelectContent className="z-50 bg-slate-800/95 backdrop-blur-sm border-white/10 text-white">
        {Object.keys(localeNames).map((key: string) => {
          const name = localeNames[key];
          return (
            <SelectItem 
              className="cursor-pointer text-white/80 hover:text-white hover:bg-white/5 focus:bg-white/5 focus:text-white data-[highlighted]:bg-white/5 data-[highlighted]:text-white" 
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
