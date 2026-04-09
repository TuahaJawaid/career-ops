"use client";

import { usePathname } from "next/navigation";
import { MobileNav } from "./mobile-nav";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/discover": "Discover Jobs",
  "/jobs": "My Jobs",
  "/applications": "Applications",
  "/resumes": "Resumes",
  "/settings": "Settings",
};

export function Header() {
  const pathname = usePathname();
  const title =
    Object.entries(pageTitles).find(([path]) =>
      pathname.startsWith(path)
    )?.[1] ?? "Career Ops";

  return (
    <header className="flex h-14 items-center gap-4 border-b border-border bg-card px-6">
      <MobileNav />
      <h1 className="text-lg font-semibold">{title}</h1>
    </header>
  );
}
