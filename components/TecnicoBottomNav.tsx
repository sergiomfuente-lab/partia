"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, ShoppingCart } from "lucide-react";

export default function TecnicoBottomNav() {
  const pathname   = usePathname() ?? "";
  const enCompras  = pathname.startsWith("/tecnico/compras");

  const tabs = [
    { href: "/tecnico",          label: "Órdenes", icon: ClipboardList, active: !enCompras },
    { href: "/tecnico/compras",  label: "Compras", icon: ShoppingCart,  active: enCompras },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-gray-100 pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-lg mx-auto grid grid-cols-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center gap-0.5 py-2.5 text-xs font-medium ${
                tab.active ? "text-[#00C2FF]" : "text-gray-400"
              }`}
            >
              <Icon size={20} />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
