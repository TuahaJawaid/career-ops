"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  Send,
  FileText,
  Settings,
  Compass,
  Sparkles,
  Users,
  HandCoins,
} from "lucide-react";
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

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-sidebar-border/80 bg-sidebar/95 md:flex md:flex-col">
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border/80 px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl neon-chip">
          <Sparkles className="h-[18px] w-[18px] text-primary" />
        </div>
        <Link href="/dashboard">
          <span className="text-base font-semibold tracking-tight text-foreground">
            Career Ops
          </span>
        </Link>
      </div>
      <nav className="mt-4 flex-1 space-y-1 px-3">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
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
          );
        })}
      </nav>
      <div className="mx-3 mb-3 rounded-xl border border-sidebar-border/70 bg-sidebar-accent/50 p-4">
        <p className="text-xs font-semibold text-foreground">
          Command Deck
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Track pipeline health, high-priority actions, and global opportunities.
        </p>
      </div>
    </aside>
  );
}
