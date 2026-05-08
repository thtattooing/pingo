"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/",           icon: "fa-house",          label: "Início" },
  { href: "/lancamento", icon: "fa-comment-dots",   label: "Lançar" },
  { href: "/importar",   icon: "fa-file-arrow-up",  label: "Importar" },
  { href: "/historico",  icon: "fa-chart-line",     label: "Histórico" },
  { href: "/ir",         icon: "fa-file-invoice",   label: "IR" },
];

export default function BottomNav() {
  const path = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 glass border-t"
      style={{ borderColor: "var(--border)", paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center justify-around h-16 px-2">
        {tabs.map((tab) => {
          const active = path === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all active:scale-90"
              style={{ minWidth: 52 }}
            >
              <i
                className={`fa-solid ${tab.icon} text-lg transition-colors`}
                style={{ color: active ? "var(--primary)" : "var(--muted-foreground)" }}
              />
              <span
                className="text-[10px] font-medium transition-colors"
                style={{ color: active ? "var(--primary)" : "var(--muted-foreground)" }}
              >
                {tab.label}
              </span>
              {active && (
                <span
                  className="absolute -top-px w-8 h-0.5 rounded-full"
                  style={{ background: "var(--primary)" }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
