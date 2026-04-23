"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Menu, Briefcase, LayoutDashboard, Send, FileText, Settings, Compass, Sparkles, Users, HandCoins } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/jobs", label: "Jobs", icon: Briefcase },
  { href: "/applications", label: "Applications", icon: Send },
  { href: "/resumes", label: "Resumes", icon: FileText },
  { href: "/contacts", label: "Contacts", icon: Users },
  { href: "/offers", label: "Offers", icon: HandCoins },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="inline-flex items-center justify-center rounded-lg p-2 text-muted-foreground hover:bg-muted/60 hover:text-foreground md:hidden">
        <Menu className="h-5 w-5" />
      </SheetTrigger>
      <SheetContent side="left" className="w-64 border-r border-sidebar-border/80 bg-sidebar/95 p-0">
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border/80 px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl neon-chip">
            <Sparkles className="h-[18px] w-[18px] text-primary" />
          </div>
          <span className="text-base font-semibold tracking-tight text-foreground">
            Career Ops
          </span>
        </div>
        <nav className="mt-4 space-y-1 px-3">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <div key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 text-sm transition-colors",
                    isActive
                      ? "border border-sidebar-border/90 bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                      : "text-muted-foreground hover:border-border/80 hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
                {item.href === "/resumes" && (
                  <Link
                    href="/resumes/builder"
                    onClick={() => setOpen(false)}
                    className={cn(
                      "ml-6 mt-1 flex items-center gap-2 rounded-lg border border-transparent px-3 py-2 text-xs transition-colors",
                      pathname === "/resumes/builder"
                        ? "border border-sidebar-border/90 bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                        : "text-muted-foreground hover:border-border/80 hover:bg-muted/50 hover:text-foreground"
                    )}
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                    Resume Builder
                  </Link>
                )}
              </div>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
