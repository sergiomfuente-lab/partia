"use client";

import { signOut } from "next-auth/react";
import { Wrench, LogOut } from "lucide-react";

export default function TecnicoTopBar({ userName }: { userName: string }) {
  return (
    <header className="sticky top-0 z-20 bg-white border-b border-gray-100 px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))] flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-[#00C2FF]/10 flex items-center justify-center">
          <Wrench size={16} className="text-[#00C2FF]" />
        </div>
        <div>
          <div className="text-sm font-semibold text-gray-900 leading-tight">Partia Técnico</div>
          <div className="text-xs text-gray-400 leading-tight">{userName}</div>
        </div>
      </div>
      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50"
        aria-label="Cerrar sesión"
      >
        <LogOut size={18} />
      </button>
    </header>
  );
}
