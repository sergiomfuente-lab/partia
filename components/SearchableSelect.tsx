"use client";

import { useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

export type SearchableSelectOption = {
  value: string;
  label: string;
};

const normalizar = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

// Desplegable con filtro de texto: se comporta como un <select> normal
// (recibe value/onChange con el id elegido) pero permite escribir para
// filtrar la lista de opciones, útil cuando hay muchos clientes/máquinas.
export default function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = "Selecciona...",
  disabled = false,
  emptyMessage = "Sin resultados",
  size = "sm",
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  options: SearchableSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  emptyMessage?: string;
  size?: "sm" | "base";
  className?: string;
}) {
  const [open, setOpen]           = useState(false);
  const [query, setQuery]         = useState("");
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const seleccionado = options.find((o) => o.value === value);

  const filtradas = useMemo(() => {
    if (!query.trim()) return options;
    const q = normalizar(query);
    return options.filter((o) => normalizar(o.label).includes(q));
  }, [options, query]);

  const abrir = () => {
    if (disabled) return;
    setQuery("");
    setHighlight(0);
    setOpen(true);
  };

  const cerrar = () => {
    setOpen(false);
    setQuery("");
  };

  const elegir = (opt: SearchableSelectOption) => {
    onChange(opt.value);
    cerrar();
    inputRef.current?.blur();
  };

  const textoSize = size === "base" ? "text-base" : "text-sm";

  return (
    <div
      className={`relative ${className}`}
      onClick={() => !disabled && inputRef.current?.focus()}
    >
      <div
        className={`w-full flex items-center gap-2 px-3 py-2.5 ${textoSize} border rounded-lg bg-white transition-colors ${
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-text"
        } ${open ? "border-[#00C2FF]" : "border-gray-200"}`}
      >
        <input
          ref={inputRef}
          type="text"
          disabled={disabled}
          value={open ? query : (seleccionado?.label ?? "")}
          placeholder={placeholder}
          onFocus={abrir}
          onChange={(e) => {
            setQuery(e.target.value);
            setHighlight(0);
            if (!open) setOpen(true);
          }}
          onBlur={() => setTimeout(cerrar, 120)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              cerrar();
              inputRef.current?.blur();
            }
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setHighlight((h) => Math.min(h + 1, filtradas.length - 1));
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              setHighlight((h) => Math.max(h - 1, 0));
            }
            if (e.key === "Enter") {
              e.preventDefault();
              const opt = filtradas[highlight];
              if (opt) elegir(opt);
            }
          }}
          className="flex-1 min-w-0 outline-none bg-transparent text-gray-700 placeholder:text-gray-400 disabled:cursor-not-allowed"
        />
        <ChevronDown
          size={15}
          className={`shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </div>

      {open && !disabled && (
        <div className="absolute z-20 mt-1 w-full max-h-64 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg py-1">
          {filtradas.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-400">{emptyMessage}</div>
          ) : (
            filtradas.map((opt, i) => (
              <button
                key={opt.value}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => elegir(opt)}
                className={`w-full text-left px-3 py-2 text-sm ${
                  i === highlight ? "bg-blue-50 text-gray-900" : "text-gray-700 hover:bg-gray-50"
                } ${opt.value === value ? "font-medium" : ""}`}
              >
                {opt.label}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
