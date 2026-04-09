"use client";

import { usePathname } from "next/navigation";
import { MobileNav } from "./mobile-nav";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/discover": "Discover Jobs",
  "/jobs": "My Jobs",
  "/applications": "Applications",
  "/resumes": "Resumes",
  "/contacts": "Contacts",
  "/analytics": "Analytics",
  "/settings": "Settings",
};

export function Header() {
  const pathname = usePathname();
  const title =
    Object.entries(pageTitles).find(([path]) =>
      pathname.startsWith(path)
    )?.[1] ?? "Career Ops";

  return (
    <header className="flex h-16 items-center gap-4 border-b border-white/20 glass-subtle px-6">
      <MobileNav />
      <h1 className="text-lg font-semibold">{title}</h1>
    </header>
  );
}
