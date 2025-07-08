"use client";

import { useState, useEffect } from "react";
import { Button } from "./button";
import { Moon, Sun, Monitor } from "lucide-react";
import { getTheme, setTheme, type Theme } from "@/lib/theme";

export function ThemeToggle() {
  const [theme, setCurrentTheme] = useState<Theme>('system');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setCurrentTheme(getTheme());
  }, []);

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    setCurrentTheme(newTheme);
  };

  if (!mounted) {
    return (
      <Button variant="outline" size="icon" className="w-9 h-9">
        <Sun className="h-4 w-4" />
      </Button>
    );
  }

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="h-4 w-4" />;
      case 'dark':
        return <Moon className="h-4 w-4" />;
      case 'system':
        return <Monitor className="h-4 w-4" />;
    }
  };

  const getThemeLabel = () => {
    switch (theme) {
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      case 'system':
        return 'System';
    }
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="icon"
        className="w-9 h-9"
        onClick={() => {
          const themes: Theme[] = ['light', 'dark', 'system'];
          const currentIndex = themes.indexOf(theme);
          const nextIndex = (currentIndex + 1) % themes.length;
          handleThemeChange(themes[nextIndex]);
        }}
        title={`Current theme: ${getThemeLabel()}. Click to cycle through themes.`}
      >
        {getThemeIcon()}
      </Button>
    </div>
  );
} 