import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined" && window.localStorage) {
      const storedPrefs = window.localStorage.getItem("corplink-theme");
      if (typeof storedPrefs === "string") return storedPrefs;
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark";
    }
    return "dark"; // Default to dark for premium feel
  });

  const [branding, setBranding] = useState(() => {
    if (typeof window !== "undefined" && window.localStorage) {
      const cached = window.localStorage.getItem("corplink-branding");
      if (cached) return JSON.parse(cached);
    }
    return {
      platform_name: "CorpLink",
      primary_color: "#8b5cf6",
      logo_url: null,
      favicon_url: null
    };
  });

  useEffect(() => {
    const fetchBranding = async () => {
      const { data } = await supabase
        .from("platform_config")
        .select("config")
        .eq("id", "branding")
        .single();
      
      if (data?.config) {
        setBranding(data.config);
        applyBranding(data.config);
        localStorage.setItem("corplink-branding", JSON.stringify(data.config));
      }
    };

    fetchBranding();
  }, []);

  const applyBranding = (config) => {
    const root = window.document.documentElement;
    
    // Apply primary color variable
    root.style.setProperty('--primary-color', config.primary_color);
    
    // Apply Platform Name
    if (config.platform_name) {
      document.title = config.platform_name;
    }

    // Apply Favicon
    if (config.favicon_url) {
      let link = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = config.favicon_url;
    }
  };

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem("corplink-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, branding }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
