"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Suno-style left navigation. Icons inline as SVGs to avoid extra deps.
const NAV = [
  { href: "/create", label: "Create", icon: IconCreate }
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden md:flex md:w-60 shrink-0 flex-col bg-neutral-950 border-r border-neutral-800 h-screen sticky top-0">
      <div className="px-5 pt-5 pb-7 flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-fuchsia-500 to-indigo-600" />
        <span className="font-semibold tracking-wide">Melos AI</span>
      </div>

      <nav className="flex flex-col gap-1 px-3">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/create"
              ? pathname?.startsWith("/create")
              : pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={[
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-neutral-800 text-white"
                  : "text-neutral-400 hover:text-white hover:bg-neutral-900"
              ].join(" ")}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto p-4 border-t border-neutral-800 text-xs text-neutral-400">
        <div className="flex items-center justify-between mb-2">
          <span className="opacity-70">Plan</span>
          <span className="font-mono text-neutral-200">free</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="opacity-70">Account</span>
          <span className="font-mono text-neutral-200 truncate max-w-[110px]">
            tuanpv960
          </span>
        </div>
      </div>
    </aside>
  );
}

function IconCreate({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

