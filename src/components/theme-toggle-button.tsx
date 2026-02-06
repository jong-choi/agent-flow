"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggleButton() {
  const { setTheme, theme, systemTheme } = useTheme();

  const onToggle = () => {
    const currentTheme = theme === "system" ? systemTheme : theme;
    const nextTheme = currentTheme === "dark" ? "light" : "dark";

    if (nextTheme === systemTheme) {
      setTheme("system");
    } else {
      setTheme(nextTheme);
    }
  };

  return (
    <div className="flex">
      <Button variant="ghost" size="icon" onClick={onToggle}>
        <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
        <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    </div>
  );
}
