"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/queue", label: "Cola" },
  { href: "/admin/history", label: "Historial" },
  { href: "/admin/tables", label: "Mesas" },
  { href: "/admin/settings", label: "Ajustes" },
];

export function AdminNav({ email, barId }: { email: string; barId: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-base-900/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <Link href="/admin" className="flex items-center gap-2 font-black">
          <span className="text-lg">🎸</span> RockBox
        </Link>

        <nav className="flex flex-1 flex-wrap items-center gap-1">
          {LINKS.map((l) => {
            const active =
              l.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-accent text-white"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <a
            href={`/player/${barId}`}
            target="_blank"
            rel="noreferrer"
            className="hidden text-xs text-neon hover:underline sm:inline"
          >
            Abrir Player ↗
          </a>
          <span className="hidden text-xs text-white/40 md:inline">{email}</span>
          <button onClick={logout} className="btn-ghost px-3 py-1.5 text-xs">
            Salir
          </button>
        </div>
      </div>
    </header>
  );
}
