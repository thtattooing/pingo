"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/home",       icon: "fa-house",      label: "Início"   },
  { href: "/insights",   icon: "fa-chart-pie",  label: "Insights" },
  { href: "/lancamento", icon: "fa-piggy-bank",  label: "Pingar",  fab: true },
  { href: "/cartoes",    icon: "fa-credit-card", label: "Cartões"  },
  { href: "/transacoes", icon: "fa-list",        label: "Extratos" },
];

export default function BottomNav() {
  const path = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 glass border-t"
      style={{ borderColor: "var(--border)", paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-end justify-around h-16 px-2">
        {tabs.map((tab) => {
          const active = path === tab.href || (tab.href !== "/home" && path.startsWith(tab.href));

          if (tab.fab) {
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="flex flex-col items-center gap-1 -mt-5 active:scale-90 transition-transform"
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg, #EC4899 0%, #F472B6 100%)",
                    boxShadow: "0 4px 20px rgba(236,72,153,0.55)",
                  }}
                >
                  <i className="fa-solid fa-piggy-bank text-white text-xl" />
                </div>
                <span
                  className="text-[10px] font-semibold"
                  style={{ color: active ? "var(--primary)" : "var(--muted-foreground)" }}
                >
                  {tab.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all active:scale-90 relative"
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
