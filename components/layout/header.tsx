"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MobileNav } from "./mobile-nav";
import { ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/discover": "Discover Jobs",
  "/jobs": "My Jobs",
  "/applications": "Applications",
  "/resumes": "Resumes",
  "/resumes/builder": "Resume Builder",
  "/contacts": "Contacts",
  "/offers": "Offers",
  "/settings": "Settings",
};

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/discover", label: "Discover" },
  { href: "/jobs", label: "Jobs" },
  { href: "/applications", label: "Applications" },
  { href: "/resumes", label: "Resumes" },
  { href: "/contacts", label: "Contacts" },
  { href: "/offers", label: "Offers" },
  { href: "/settings", label: "Settings" },
];

export function Header() {
  const pathname = usePathname();
  const title =
    Object.entries(pageTitles).find(([path]) =>
      pathname.startsWith(path)
    )?.[1] ?? "Career Ops";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border/80 bg-[#0b0c0f]/88 px-4 backdrop-blur-xl sm:px-6">
      <MobileNav />
      <div className="min-w-0 flex-1 md:hidden">
        <h1 className="truncate text-[20px] font-semibold tracking-tight text-foreground">
          {title}
        </h1>
      </div>
      <div className="hidden flex-1 items-center justify-center md:flex">
        <nav className="flex items-center gap-1 rounded-full border border-border/80 bg-muted/30 p-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            if (item.href === "/resumes") {
              const isBuilderActive = pathname === "/resumes/builder";
              return (
                <div key={item.href} className="relative group">
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                      isActive
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {item.label}
                    <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                  </Link>
                  <div className="invisible absolute left-1/2 top-[115%] z-40 min-w-[170px] -translate-x-1/2 rounded-xl border border-border/80 bg-card/95 p-1.5 opacity-0 shadow-card backdrop-blur-md transition-all group-hover:visible group-hover:opacity-100">
                    <Link
                      href="/resumes"
                      className={cn(
                        "block rounded-lg px-2.5 py-2 text-xs transition-colors",
                        pathname === "/resumes"
                          ? "bg-muted text-foreground"
                          : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                      )}
                    >
                      Resume Library
                    </Link>
                    <Link
                      href="/resumes/builder"
                      className={cn(
                        "mt-1 block rounded-lg px-2.5 py-2 text-xs transition-colors",
                        isBuilderActive
                          ? "bg-muted text-foreground"
                          : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                      )}
                    >
                      Resume Builder
                    </Link>
                  </div>
                </div>
              );
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                  isActive
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="hidden items-center gap-2 rounded-full border border-border/70 bg-muted/40 px-3 py-1.5 text-sm text-muted-foreground lg:flex">
        <Search className="h-3.5 w-3.5" />
        Search jobs, companies, actions...
      </div>
    </header>
  );
}
