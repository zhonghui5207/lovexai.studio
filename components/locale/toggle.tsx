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
      <SelectTrigger className="flex items-center gap-x-2 border border-border text-foreground hover:text-foreground outline-none hover:bg-muted focus:ring-0 focus:ring-offset-0 bg-background/50 px-3 py-1.5 rounded-md min-w-[100px]">
        <MdLanguage className="text-base" />
        {!isIcon && (
          <span className="hidden md:block font-medium">{localeNames[locale]}</span>
        )}
      </SelectTrigger>
      <SelectContent className="z-50 bg-background border-border">
        {Object.keys(localeNames).map((key: string) => {
          const name = localeNames[key];
          return (
            <SelectItem 
              className="cursor-pointer text-foreground hover:bg-muted focus:bg-muted" 
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
