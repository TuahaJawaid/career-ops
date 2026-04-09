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
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/jobs", label: "Jobs", icon: Briefcase },
  { href: "/applications", label: "Applications", icon: Send },
  { href: "/resumes", label: "Resumes", icon: FileText },
  { href: "/contacts", label: "Contacts", icon: Users },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-64 flex-col glass-subtle border-r border-white/20">
      <div className="flex h-16 items-center px-6 gap-3">
        <div className="h-9 w-9 rounded-xl gradient-blue flex items-center justify-center shadow-card">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <Link href="/dashboard">
          <span className="font-bold text-lg bg-gradient-to-r from-[#4F7DF3] to-[#6C63FF] bg-clip-text text-transparent">
            Career Ops
          </span>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 px-3 mt-2">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200",
                isActive
                  ? "gradient-blue text-white shadow-card font-medium"
                  : "text-muted-foreground hover:bg-white/50 hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 mx-3 mb-3 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-100">
        <p className="text-xs font-medium text-blue-700">
          Built for ATJ
        </p>
        <p className="text-[10px] text-blue-500 mt-0.5">
          With love from TJ
        </p>
      </div>
    </aside>
  );
}
