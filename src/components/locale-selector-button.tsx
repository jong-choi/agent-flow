"use client";

import { Languages } from "lucide-react";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePathname, useRouter } from "@/lib/i18n/navigation";
import { type Locale, routing } from "@/lib/i18n/routing";

const localeLabels: Record<Locale, string> = {
  ko: "한국어",
  en: "English",
};

export function LocaleSelectorButton() {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();

  const onChangeLocale = (nextLocale: string) => {
    if (nextLocale === locale) {
      return;
    }

    router.replace(pathname, { locale: nextLocale as Locale });
  };

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Select language">
          <Languages className="h-[1.2rem] w-[1.2rem]" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup value={locale} onValueChange={onChangeLocale}>
          {routing.locales.map((item) => (
            <DropdownMenuRadioItem key={item} value={item}>
              {localeLabels[item]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
