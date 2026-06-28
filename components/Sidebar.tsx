"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

const menu = [
  { href: "/dashboard", label: "Dashboard", icon: "⊞" },
  { href: "/clientes", label: "Clientes", icon: "👥" },
  { href: "/maquinas", label: "Máquinas", icon: "⚙️" },
  { href: "/ordenes", label: "Órdenes", icon: "📋" },
  { href: "/facturas", label: "Facturas", icon: "🧾" },
  { href: "/compras", label: "Compras", icon: "🛒" },
  { href: "/configuracion", label: "Configuración", icon: "⚙" },
];

interface Props {
  userName?: string | null;
}

export default function Sidebar({ userName }: Props) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <aside className="w-60 bg-[#0B1120] flex flex-col h-full fixed top-0 left-0 z-40">
      <div className="flex items-center gap-3 px-5 py-6 border-b border-[#1e2d42]">
        <svg width="28" height="28" viewBox="0 0 56 56">
          <polygon points="28,4 50,16 50,40 28,52 6,40 6,16" fill="none" stroke="#00C2FF" strokeWidth="2.5"/>
          <polygon points="28,14 42,22 42,34 28,42 14,34 14,22" fill="#00C2FF" opacity="0.12"/>
          <circle cx="28" cy="28" r="7" fill="#00C2FF"/>
          <circle cx="28" cy="28" r="3.5" fill="#0B1120"/>
        </svg>
        <div>
          <div className="text-white font-bold text-base tracking-wide">Partia</div>
          <div className="text-[#00C2FF] text-[9px] tracking-[3px]">GESTIÓN · TECNOLOGÍA</div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {menu.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
              isActive(item.href)
                ? "bg-[#162030] text-white font-medium border-l-2 border-[#00C2FF]"
                : "text-[#6a8aaa] hover:text-white hover:bg-[#111827]"
            }`}
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-[#1e2d42]">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-[#111827] cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-[#00C2FF] flex items-center justify-center text-[#0B1120] text-sm font-bold flex-shrink-0">
            {userName?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-xs font-medium truncate">{userName}</div>
            <div className="text-[#6a8aaa] text-[10px]">Administrador</div>
          </div>
        </div>
      </div>
    </aside>
  );
}