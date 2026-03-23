"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import {
  LayoutDashboard,
  Car,
  PlusCircle,
  Settings,
  LogOut,
  Menu,
  Cpu,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Járművek", href: "/vehicles", icon: Car },
  { label: "Új munka", href: "/jobs/new", icon: PlusCircle },
  { label: "Beállítások", href: "/settings", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col border-r border-[rgba(255,255,255,0.06)] bg-[#0c1017]">
        <div className="flex h-14 items-center gap-2.5 px-4 border-b border-[rgba(255,255,255,0.06)]">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#0ea5e9] to-[#06b6d4] text-white shadow-[0_2px_8px_rgba(14,165,233,0.3)]">
              <Cpu className="h-4 w-4" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-[var(--font-rajdhani)] font-bold text-[17px] tracking-[0.05em] uppercase text-[#0ea5e9]">
                ECU
              </span>
              <span className="font-[var(--font-rajdhani)] font-semibold text-[13px] tracking-[0.05em] uppercase text-[#64748b]">
                File Vault
              </span>
            </div>
          </Link>
        </div>
        <ScrollArea className="flex-1 py-4">
          <nav className="flex flex-col gap-1 px-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-150",
                    active
                      ? "bg-[rgba(14,165,233,0.08)] text-[#0ea5e9] font-medium sidebar-active-indicator"
                      : "text-[#64748b] hover:text-[#e2e8f0] hover:bg-[#111620]"
                  )}
                >
                  <Icon className="h-[18px] w-[18px]" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </ScrollArea>
        <Separator className="opacity-30" />
        <div className="p-3">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-[#64748b] hover:text-[#e2e8f0] hover:bg-[#111620] transition-colors duration-150"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Kijelentkezés
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="flex h-14 items-center justify-between border-b border-[rgba(255,255,255,0.06)] px-4 md:hidden bg-[#0c1017]">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#0ea5e9] to-[#06b6d4] text-white">
              <Cpu className="h-4 w-4" />
            </div>
            <span className="font-[var(--font-rajdhani)] font-bold text-sm tracking-[0.05em] uppercase text-[#0ea5e9]">
              ECU
            </span>
            <span className="font-[var(--font-rajdhani)] font-semibold text-xs tracking-[0.05em] uppercase text-[#64748b]">
              File Vault
            </span>
          </Link>
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              render={(props) => (
                <Button {...props} variant="ghost" size="icon" className="text-[#64748b]">
                  <Menu className="h-5 w-5" />
                </Button>
              )}
            />
            <SheetContent side="left" className="w-64 p-0 bg-[#0c1017] border-[rgba(255,255,255,0.06)]">
              <div className="flex h-14 items-center gap-2.5 px-4 border-b border-[rgba(255,255,255,0.06)]">
                <Cpu className="h-5 w-5 text-[#0ea5e9]" />
                <span className="font-[var(--font-rajdhani)] font-bold tracking-[0.05em] uppercase text-[#0ea5e9]">
                  Menü
                </span>
              </div>
              <nav className="flex flex-col gap-1 p-3">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-150",
                        active
                          ? "bg-[rgba(14,165,233,0.08)] text-[#0ea5e9] font-medium sidebar-active-indicator"
                          : "text-[#64748b] hover:text-[#e2e8f0] hover:bg-[#111620]"
                      )}
                    >
                      <Icon className="h-[18px] w-[18px]" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
              <Separator className="opacity-30" />
              <div className="p-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-[#64748b]"
                  onClick={() => {
                    setMobileOpen(false);
                    handleLogout();
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Kijelentkezés
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">{children}</main>

        {/* Mobile bottom nav */}
        <nav className="flex md:hidden border-t border-[rgba(255,255,255,0.06)] bg-[#0c1017]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] transition-colors duration-150",
                  active ? "text-[#0ea5e9]" : "text-[#334155]"
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
