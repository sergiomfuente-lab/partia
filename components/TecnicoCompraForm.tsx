"use client";

import { useRef, useState } from "react";
import { Camera, Plus, Trash2, X, Search } from "lucide-react";

type Proveedor   = { id: string; nombre: string };
type Producto    = { id: string; nombre: string; referencia?: string; precioCoste: number; precioVenta: number; unidad: string };
type OrdenOpcion = { id: string; numero: string; cliente?: { nombre: string } };

type Linea = {
  _key:        string;
  productoId:  string;
  descripcion: string;
  referencia:  string;
  cantidad:    string;
  precioCoste: string;
  precioVenta: string;
};

const uid = () => Math.random().toString(36).slice(2, 9);
const hoy = () => new Date().toISOString().split("T")[0];

const nuevaLinea = (): Linea => ({
  _key: uid(), productoId: "", descripcion: "", referencia: "",
  cantidad: "1", precioCoste: "0", precioVenta: "0",
});

export default function TecnicoCompraForm({
  ordenId,
  ordenesDisponibles,
  proveedores,
  productos,
  tecnicoId,
  onCancel,
  onSaved,
}: {
  ordenId?:            string;
  ordenesDisponibles?: OrdenOpcion[];
  proveedores:         Proveedor[];
  productos:           Producto[];
  tecnicoId:           string;
  onCancel:            () => void;
  onSaved:             (compra: any) => void;
}) {
  const [ordenSeleccionadaId, setOrdenSeleccionadaId] = useState("");
  const [modoProveedor, setModoProveedor] = useState<"existente" | "nuevo">(
    proveedores.length ? "existente" : "nuevo"
  );
  const [proveedorId, setProveedorId]             = useState("");
  const [proveedorNombreLibre, setProveedorNombreLibre] = useState("");
  const [guardarProveedor, setGuardarProveedor]   = useState(false);

  const [fecha, setFecha]                 = useState(hoy());
  const [numeroAlbaran, setNumeroAlbaran] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [aStock, setAStock]               = useState(false);

  const [fotoBase64, setFotoBase64]       = useState("");
  const [procesandoFoto, setProcesandoFoto] = useState(false);
  const fotoInputRef = useRef<HTMLInputElement>(null);

  const [lineas, setLineas] = useState<Linea[]>([nuevaLinea()]);
  const [buscandoProducto, setBuscandoProducto] = useState<Record<string, string>>({});

  const [guardando, setGuardando] = useState(false);
  const [error, setError]         = useState("");

  const ordenFinalId = ordenId ?? (ordenSeleccionadaId || undefined);

  const updateLinea = (key: string, field: string, value: any) =>
    setLineas((prev) => prev.map((l) => {
      if (l._key !== key) return l;
      const updated = { ...l, [field]: value };
      if (field === "productoId" && value) {
        const p = productos.find((p) => p.id === value);
        if (p) {
          updated.descripcion = p.nombre;
          updated.referencia  = p.referencia ?? "";
          updated.precioCoste = String(p.precioCoste);
          updated.precioVenta = String(p.precioVenta);
        }
      }
      return updated;
    }));

  const addLinea    = () => setLineas((prev) => [...prev, nuevaLinea()]);
  const removeLinea = (key: string) =>
    setLineas((prev) => (prev.length > 1 ? prev.filter((l) => l._key !== key) : prev));

  const total = lineas.reduce((acc, l) => acc + (parseFloat(l.cantidad) || 0) * (parseFloat(l.precioCoste) || 0), 0);

  const handleFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProcesandoFoto(true);
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxAncho = 1280;
        const escala   = Math.min(1, maxAncho / img.width);
        const canvas   = document.createElement("canvas");
        canvas.width   = img.width  * escala;
        canvas.height  = img.height * escala;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        setFotoBase64(canvas.toDataURL("image/jpeg", 0.72));
        setProcesandoFoto(false);
      };
      img.onerror = () => setProcesandoFoto(false);
      img.src = reader.result as string;
    };
    reader.onerror = () => setProcesandoFoto(false);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const lineasValidas = lineas.filter((l) => l.descripcion.trim());
    if (!lineasValidas.length) { setError("Añade al menos un material."); return; }

    setGuardando(true);
    try {
      let proveedorFinalId     = modoProveedor === "existente" ? (proveedorId || null) : null;
      let proveedorFinalNombre = modoProveedor === "nuevo" ? (proveedorNombreLibre.trim() || null) : null;

      if (modoProveedor === "nuevo" && guardarProveedor && proveedorFinalNombre) {
        const resProv = await fetch("/api/proveedores", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ nombre: proveedorFinalNombre }),
        });
        if (resProv.ok) {
          const nuevo = await resProv.json();
          proveedorFinalId     = nuevo.id;
          proveedorFinalNombre = null;
        }
      }

      const res = await fetch("/api/compras", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fecha, numeroAlbaran: numeroAlbaran || null,
          proveedorId: proveedorFinalId, proveedorNombre: proveedorFinalNombre,
          observaciones: observaciones || null,
          fotoTicketBase64: fotoBase64 || null,
          tecnicoId,
          lineas: lineasValidas.map((l) => ({
            productoId:  l.productoId || null,
            descripcion: l.descripcion,
            referencia:  l.referencia || null,
            cantidad:    parseFloat(l.cantidad)    || 1,
            precioCoste: parseFloat(l.precioCoste) || 0,
            precioVenta: parseFloat(l.precioVenta) || 0,
            aStock:      !ordenFinalId && aStock,
            ordenId:     ordenFinalId ?? null,
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "No se pudo guardar la compra.");
      }
      const compra = await res.json();
      onSaved(compra);
    } catch (err: any) {
      setError(err.message ?? "Ha ocurrido un error.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!ordenId && ordenesDisponibles && ordenesDisponibles.length > 0 && (
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
            Orden relacionada (opcional)
          </label>
          <select
            value={ordenSeleccionadaId}
            onChange={(e) => setOrdenSeleccionadaId(e.target.value)}
            className="w-full px-3 py-2.5 text-base border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:border-[#00C2FF]"
          >
            <option value="">Compra suelta (sin ligar a ninguna orden)</option>
            {ordenesDisponibles.map((o) => (
              <option key={o.id} value={o.id}>{o.numero} — {o.cliente?.nombre ?? ""}</option>
            ))}
          </select>
        </div>
      )}

      {/* Proveedor */}
      <div>
        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
          Proveedor / tienda
        </label>
        {proveedores.length > 0 && (
          <div className="flex bg-gray-100 rounded-lg p-1 mb-2">
            <button type="button" onClick={() => setModoProveedor("existente")}
              className={`flex-1 text-sm font-medium py-2 rounded-md transition-colors ${modoProveedor === "existente" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>
              De la lista
            </button>
            <button type="button" onClick={() => setModoProveedor("nuevo")}
              className={`flex-1 text-sm font-medium py-2 rounded-md transition-colors ${modoProveedor === "nuevo" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>
              Otro
            </button>
          </div>
        )}
        {modoProveedor === "existente" && proveedores.length > 0 ? (
          <select
            value={proveedorId}
            onChange={(e) => setProveedorId(e.target.value)}
            className="w-full px-3 py-2.5 text-base border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:border-[#00C2FF]"
          >
            <option value="">Selecciona un proveedor...</option>
            {proveedores.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
        ) : (
          <div className="space-y-2">
            <input type="text" placeholder="Nombre de la tienda (ej. Leroy Merlin)"
              value={proveedorNombreLibre}
              onChange={(e) => setProveedorNombreLibre(e.target.value)}
              className="w-full px-3 py-2.5 text-base border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-[#00C2FF]" />
            {proveedorNombreLibre.trim() && (
              <label className="flex items-center gap-2 text-xs text-gray-500">
                <input type="checkbox" checked={guardarProveedor} onChange={(e) => setGuardarProveedor(e.target.checked)} />
                Guardar en la lista de proveedores
              </label>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Fecha</label>
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)}
            className="w-full px-3 py-2.5 text-base border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-[#00C2FF]" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Nº ticket/albarán</label>
          <input type="text" placeholder="Opcional" value={numeroAlbaran} onChange={(e) => setNumeroAlbaran(e.target.value)}
            className="w-full px-3 py-2.5 text-base border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-[#00C2FF]" />
        </div>
      </div>

      {/* Foto ticket */}
      <div>
        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Foto del ticket</label>
        <input ref={fotoInputRef} type="file" accept="image/*" capture="environment" onChange={handleFoto} className="hidden" />
        {fotoBase64 ? (
          <div className="relative inline-block">
            <img src={fotoBase64} alt="Ticket" className="h-28 rounded-lg border border-gray-200 object-cover" />
            <button type="button" onClick={() => setFotoBase64("")}
              className="absolute -top-2 -right-2 w-6 h-6 flex items-center justify-center bg-white rounded-full border border-gray-200 text-gray-500 shadow-sm">
              <X size={13} />
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => fotoInputRef.current?.click()} disabled={procesandoFoto}
            className="flex items-center gap-2 text-sm font-medium text-gray-600 border border-dashed border-gray-300 rounded-lg px-4 py-3 active:bg-gray-50 disabled:opacity-50">
            <Camera size={16} /> {procesandoFoto ? "Procesando..." : "Hacer foto al ticket"}
          </button>
        )}
      </div>

      {/* Líneas de materiales */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Materiales comprados</label>
          <button type="button" onClick={addLinea} className="flex items-center gap-1 text-xs font-medium text-[#00C2FF]">
            <Plus size={14} /> Añadir
          </button>
        </div>
        <div className="space-y-3">
          {lineas.map((l) => {
            const query = buscandoProducto[l._key] ?? "";
            const sugerencias = query.trim().length >= 2
              ? productos.filter((p) => p.nombre.toLowerCase().includes(query.toLowerCase())).slice(0, 5)
              : [];
            return (
              <div key={l._key} className="border border-gray-100 rounded-lg p-3 relative bg-gray-50/40">
                {lineas.length > 1 && (
                  <button type="button" onClick={() => removeLinea(l._key)} className="absolute top-2 right-2 text-gray-300">
                    <Trash2 size={15} />
                  </button>
                )}
                <div className="relative mb-2 pr-8">
                  <input type="text" placeholder="¿Qué has comprado? (ej. Manguera hidráulica 2m)"
                    value={l.descripcion}
                    onChange={(e) => {
                      updateLinea(l._key, "descripcion", e.target.value);
                      updateLinea(l._key, "productoId", "");
                      setBuscandoProducto((prev) => ({ ...prev, [l._key]: e.target.value }));
                    }}
                    className="w-full px-2.5 py-2 text-base border border-gray-200 rounded-lg bg-white" />
                  {sugerencias.length > 0 && (
                    <div className="absolute z-10 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                      {sugerencias.map((p) => (
                        <button key={p.id} type="button"
                          onClick={() => { updateLinea(l._key, "productoId", p.id); setBuscandoProducto((prev) => ({ ...prev, [l._key]: "" })); }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2">
                          <Search size={12} className="text-gray-300 shrink-0" />
                          <span className="truncate">{p.nombre}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <input type="text" placeholder="Referencia (opcional)"
                    value={l.referencia}
                    onChange={(e) => updateLinea(l._key, "referencia", e.target.value)}
                    className="px-2.5 py-2 text-base border border-gray-200 rounded-lg bg-white" />
                  <input type="number" min="0" step="1" placeholder="Cantidad"
                    value={l.cantidad}
                    onChange={(e) => updateLinea(l._key, "cantidad", e.target.value)}
                    className="px-2.5 py-2 text-base border border-gray-200 rounded-lg bg-white" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-gray-400 uppercase tracking-wide mb-1">Lo que has pagado</label>
                    <input type="number" min="0" step="0.01" placeholder="0.00"
                      value={l.precioCoste}
                      onChange={(e) => updateLinea(l._key, "precioCoste", e.target.value)}
                      className="w-full px-2.5 py-2 text-base border border-gray-200 rounded-lg bg-white" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 uppercase tracking-wide mb-1">P. venta al cliente</label>
                    <input type="number" min="0" step="0.01" placeholder="0.00"
                      value={l.precioVenta}
                      onChange={(e) => updateLinea(l._key, "precioVenta", e.target.value)}
                      className="w-full px-2.5 py-2 text-base border border-gray-200 rounded-lg bg-white" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {!ordenFinalId && (
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input type="checkbox" checked={aStock} onChange={(e) => setAStock(e.target.checked)} />
          Añadir estas unidades al stock del almacén
        </label>
      )}

      <div>
        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Observaciones</label>
        <textarea rows={2} placeholder="Notas (opcional)" value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          className="w-full px-3 py-2.5 text-base border border-gray-200 rounded-lg bg-white resize-none focus:outline-none focus:border-[#00C2FF]" />
      </div>

      <div className="flex justify-end text-sm text-gray-500">
        Total: <span className="font-semibold text-gray-800 ml-1">{total.toFixed(2)} €</span>
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>
      )}

      <div className="flex gap-2">
        <button type="button" onClick={onCancel}
          className="flex-1 border border-gray-200 text-gray-600 font-medium text-sm py-3 rounded-lg active:bg-gray-50">
          Cancelar
        </button>
        <button type="submit" disabled={guardando}
          className="flex-1 bg-[#0B1120] text-white font-medium text-sm py-3 rounded-lg disabled:opacity-50 active:opacity-80">
          {guardando ? "Guardando..." : "Guardar compra"}
        </button>
      </div>
    </form>
  );
}
