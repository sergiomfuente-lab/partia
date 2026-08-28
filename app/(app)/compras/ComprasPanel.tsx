"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ShoppingCart, Plus, Package, Users,
  Calendar, ChevronRight, X, Save,
  Trash2, ArrowUpDown, Building2, Camera,
} from "lucide-react";

type Proveedor = { id: string; nombre: string; cif?: string; telefono?: string; email?: string; contacto?: string; activo: boolean; _count?: { compras: number } };
type Producto  = { id: string; nombre: string; referencia?: string; descripcion?: string; precioCoste: number; precioVenta: number; stock: number; stockMinimo: number; unidad: string; activo: boolean };
type Compra    = {
  id: string; fecha: string; numeroAlbaran?: string;
  proveedorNombre?: string; proveedor?: { id: string; nombre: string };
  tecnico?: { id: string; nombre: string };
  fotoTicketBase64?: string;
  total: number; observaciones?: string;
  lineas: LineaCompra[];
  _count: { lineas: number };
};
type LineaCompra = {
  id: string; descripcion: string; referencia?: string;
  cantidad: number; precioCoste: number; precioVenta: number;
  aStock: boolean; productoId?: string; ordenId?: string;
  orden?: { id: string; numero: string };
};
type LineaForm = {
  _key:        string;
  productoId:  string;
  descripcion: string;
  referencia:  string;
  cantidad:    string;
  precioCoste: string;
  precioVenta: string;
  aStock:      boolean;
};

const uid = () => Math.random().toString(36).slice(2, 9);
const hoy = () => new Date().toISOString().split("T")[0];

type Pestana = "compras" | "almacen" | "proveedores";

export default function ComprasPanel({
  compras: comprasIniciales,
  proveedores: proveedoresIniciales,
  productos: productosIniciales,
}: {
  compras:     Compra[];
  proveedores: Proveedor[];
  productos:   Producto[];
}) {
  const router = useRouter();
  const [pestana, setPestana]           = useState<Pestana>("compras");
  const [compras, setCompras]           = useState<Compra[]>(comprasIniciales);
  const [proveedores, setProveedores]   = useState<Proveedor[]>(proveedoresIniciales);
  const [productos, setProductos]       = useState<Producto[]>(productosIniciales);

  // Nueva compra
  const [mostrarCompra, setMostrarCompra] = useState(false);
  const [compraForm, setCompraForm]       = useState({
    fecha: hoy(), numeroAlbaran: "", proveedorId: "",
    proveedorNombre: "", observaciones: "",
  });
  const [lineas, setLineas]   = useState<LineaForm[]>([]);
  const [creando, setCreando] = useState(false);
  const [errorCompra, setErrorCompra] = useState("");
  const [fotoCompraBase64, setFotoCompraBase64] = useState("");
  const [procesandoFotoCompra, setProcesandoFotoCompra] = useState(false);
  const fotoCompraInputRef = useRef<HTMLInputElement>(null);

  // Nuevo producto
  const [mostrarProducto, setMostrarProducto] = useState(false);
  const [productoForm, setProductoForm]       = useState({
    nombre: "", referencia: "", descripcion: "",
    precioCoste: "0", precioVenta: "0", stockMinimo: "0", unidad: "ud",
  });
  const [creandoProducto, setCreandoProducto] = useState(false);

  // Nuevo proveedor
  const [mostrarProveedor, setMostrarProveedor] = useState(false);
  const [proveedorForm, setProveedorForm]       = useState({
    nombre: "", cif: "", direccion: "", telefono: "", email: "", contacto: "",
  });
  const [creandoProveedor, setCreandoProveedor] = useState(false);

  // Salida de stock
  const [salidaProductoId, setSalidaProductoId] = useState<string | null>(null);
  const [salidaForm, setSalidaForm]             = useState({ cantidad: "1", motivo: "" });
  const [procesandoSalida, setProcesandoSalida] = useState(false);
  const [errorSalida, setErrorSalida]           = useState("");
  const [salidaOrdenQuery, setSalidaOrdenQuery]           = useState("");
  const [salidaOrdenResultados, setSalidaOrdenResultados] = useState<{ id: string; numero: string; cliente?: { nombre: string } }[]>([]);
  const [salidaOrdenSeleccionada, setSalidaOrdenSeleccionada] = useState<{ id: string; numero: string } | null>(null);
  const [buscandoOrdenSalida, setBuscandoOrdenSalida]     = useState(false);

  useEffect(() => {
    if (!salidaProductoId || salidaOrdenSeleccionada || salidaOrdenQuery.trim().length < 2) {
      setSalidaOrdenResultados([]);
      return;
    }
    setBuscandoOrdenSalida(true);
    const t = setTimeout(() => {
      fetch(`/api/ordenes?q=${encodeURIComponent(salidaOrdenQuery.trim())}`)
        .then((r) => r.json())
        .then((data) => setSalidaOrdenResultados(Array.isArray(data) ? data.slice(0, 6) : []))
        .finally(() => setBuscandoOrdenSalida(false));
    }, 300);
    return () => clearTimeout(t);
  }, [salidaOrdenQuery, salidaProductoId, salidaOrdenSeleccionada]);

  // Detalle compra
  const [compraDetalle, setCompraDetalle] = useState<Compra | null>(null);
  const [fotoAmpliada, setFotoAmpliada]   = useState<string | null>(null);

  // ---- Líneas de compra ----
  const addLinea = () => setLineas((prev) => [...prev, {
    _key: uid(), productoId: "", descripcion: "", referencia: "",
    cantidad: "1", precioCoste: "0", precioVenta: "0", aStock: false,
  }]);

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
          updated.aStock      = true;
        }
      }
      return updated;
    }));

  const removeLinea = (key: string) => setLineas((prev) => prev.filter((l) => l._key !== key));

  const totalCompra = lineas.reduce((acc, l) => acc + parseFloat(l.cantidad || "0") * parseFloat(l.precioCoste || "0"), 0);

  // ---- Crear compra ----
  const handleFotoCompra = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProcesandoFotoCompra(true);
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
        setFotoCompraBase64(canvas.toDataURL("image/jpeg", 0.75));
        setProcesandoFotoCompra(false);
      };
      img.onerror = () => setProcesandoFotoCompra(false);
      img.src = reader.result as string;
    };
    reader.onerror = () => setProcesandoFotoCompra(false);
    reader.readAsDataURL(file);
  };

  const handleCrearCompra = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorCompra("");
    if (!lineas.length) { setErrorCompra("Añade al menos una línea."); return; }
    setCreando(true);

    const res = await fetch("/api/compras", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...compraForm,
        proveedorId: compraForm.proveedorId || null,
        fotoTicketBase64: fotoCompraBase64 || null,
        lineas: lineas.map((l) => ({
          productoId:  l.productoId  || null,
          descripcion: l.descripcion,
          referencia:  l.referencia  || null,
          cantidad:    parseFloat(l.cantidad),
          precioCoste: parseFloat(l.precioCoste),
          precioVenta: parseFloat(l.precioVenta),
          aStock:      l.aStock,
        })),
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setErrorCompra(data.error ?? "Error al crear la compra.");
      setCreando(false);
      return;
    }

    const nueva = await res.json();
    setCompras((prev) => [nueva, ...prev]);

    // Actualizar stock de productos
    const productosActualizados = await fetch("/api/productos").then((r) => r.json());
    setProductos(productosActualizados);

    setMostrarCompra(false);
    setLineas([]);
    setCompraForm({ fecha: hoy(), numeroAlbaran: "", proveedorId: "", proveedorNombre: "", observaciones: "" });
    setFotoCompraBase64("");
    setCreando(false);
    router.refresh();
  };

  // ---- Crear producto ----
  const handleCrearProducto = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreandoProducto(true);
    const res = await fetch("/api/productos", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(productoForm),
    });
    if (res.ok) {
      const nuevo = await res.json();
      setProductos((prev) => [...prev, nuevo]);
      setMostrarProducto(false);
      setProductoForm({ nombre: "", referencia: "", descripcion: "", precioCoste: "0", precioVenta: "0", stockMinimo: "0", unidad: "ud" });
    }
    setCreandoProducto(false);
  };

  // ---- Crear proveedor ----
  const handleCrearProveedor = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreandoProveedor(true);
    const res = await fetch("/api/proveedores", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(proveedorForm),
    });
    if (res.ok) {
      const nuevo = await res.json();
      setProveedores((prev) => [...prev, nuevo]);
      setMostrarProveedor(false);
      setProveedorForm({ nombre: "", cif: "", direccion: "", telefono: "", email: "", contacto: "" });
    }
    setCreandoProveedor(false);
  };

  // ---- Salida de stock ----
  const handleSalida = async () => {
    if (!salidaProductoId) return;
    setErrorSalida("");
    setProcesandoSalida(true);
    const res = await fetch(`/api/productos/${salidaProductoId}/salida`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        cantidad: parseFloat(salidaForm.cantidad),
        motivo:   salidaForm.motivo,
        ordenId:  salidaOrdenSeleccionada?.id ?? null,
      }),
    });
    if (!res.ok) {
      const data = await res.json();
      setErrorSalida(data.error ?? "Error al registrar la salida.");
    } else {
      const productosActualizados = await fetch("/api/productos").then((r) => r.json());
      setProductos(productosActualizados);
      setSalidaProductoId(null);
      setSalidaForm({ cantidad: "1", motivo: "" });
      setSalidaOrdenSeleccionada(null);
      setSalidaOrdenQuery("");
      setSalidaOrdenResultados([]);
      router.refresh();
    }
    setProcesandoSalida(false);
  };

  const pestanas: { id: Pestana; label: string; icon: React.ReactNode }[] = [
    { id: "compras",    label: "Compras",    icon: <ShoppingCart size={15} /> },
    { id: "almacen",    label: "Almacén",    icon: <Package size={15} /> },
    { id: "proveedores",label: "Proveedores",icon: <Users size={15} /> },
  ];

  return (
    <div className="p-8">
      {/* Cabecera */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Compras y Almacén</h1>
          <p className="text-sm text-gray-400 mt-1">Gestiona tus compras, stock y proveedores</p>
        </div>
        <div className="flex gap-2">
          {pestana === "compras"     && (
            <button onClick={() => setMostrarCompra(true)}
              className="flex items-center gap-2 bg-[#0B1120] text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-[#162030] transition-colors cursor-pointer">
              <Plus size={16} /> Nueva compra
            </button>
          )}
          {pestana === "almacen"     && (
            <button onClick={() => setMostrarProducto(true)}
              className="flex items-center gap-2 bg-[#0B1120] text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-[#162030] transition-colors cursor-pointer">
              <Plus size={16} /> Nuevo producto
            </button>
          )}
          {pestana === "proveedores" && (
            <button onClick={() => setMostrarProveedor(true)}
              className="flex items-center gap-2 bg-[#0B1120] text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-[#162030] transition-colors cursor-pointer">
              <Plus size={16} /> Nuevo proveedor
            </button>
          )}
        </div>
      </div>

      {/* Pestañas */}
      <div className="flex border-b border-gray-200 mb-6">
        {pestanas.map((p) => (
          <button key={p.id} onClick={() => setPestana(p.id)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
              pestana === p.id
                ? "border-[#00C2FF] text-[#0B1120]"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}>
            {p.icon}{p.label}
          </button>
        ))}
      </div>

      {/* ====== PESTAÑA COMPRAS ====== */}
      {pestana === "compras" && (
        <div>
          {/* Formulario nueva compra */}
          {mostrarCompra && (
            <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-sm font-semibold text-gray-700">Nueva compra</h2>
                <button onClick={() => { setMostrarCompra(false); setLineas([]); setErrorCompra(""); setFotoCompraBase64(""); }}
                  className="text-gray-400 hover:text-gray-600 cursor-pointer"><X size={16} /></button>
              </div>
              <form onSubmit={handleCrearCompra} className="space-y-5">
                {/* Cabecera compra */}
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Fecha</label>
                    <input type="date" value={compraForm.fecha}
                      onChange={(e) => setCompraForm((p) => ({ ...p, fecha: e.target.value }))}
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Nº Albarán</label>
                    <input type="text" value={compraForm.numeroAlbaran}
                      onChange={(e) => setCompraForm((p) => ({ ...p, numeroAlbaran: e.target.value }))}
                      placeholder="Opcional"
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Proveedor</label>
                    <select value={compraForm.proveedorId}
                      onChange={(e) => setCompraForm((p) => ({ ...p, proveedorId: e.target.value, proveedorNombre: "" }))}
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white text-gray-700">
                      <option value="">Sin proveedor / Puntual</option>
                      {proveedores.map((p) => (
                        <option key={p.id} value={p.id}>{p.nombre}</option>
                      ))}
                    </select>
                  </div>
                  {!compraForm.proveedorId && (
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Nombre proveedor puntual</label>
                      <input type="text" value={compraForm.proveedorNombre}
                        onChange={(e) => setCompraForm((p) => ({ ...p, proveedorNombre: e.target.value }))}
                        placeholder="Nombre del proveedor"
                        className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white" />
                    </div>
                  )}
                </div>

                {/* Líneas */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Líneas de compra</label>
                    <button type="button" onClick={addLinea}
                      className="text-xs text-[#00C2FF] hover:text-[#00a8db] font-medium cursor-pointer flex items-center gap-1">
                      <Plus size={12} /> Añadir línea
                    </button>
                  </div>

                  {lineas.length === 0 ? (
                    <div className="text-center py-8 border border-dashed border-gray-200 rounded-lg">
                      <p className="text-gray-400 text-sm mb-2">Sin líneas</p>
                      <button type="button" onClick={addLinea}
                        className="text-[#00C2FF] text-sm cursor-pointer">+ Añadir primera línea</button>
                    </div>
                  ) : (
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="grid grid-cols-12 px-4 py-2 bg-gray-50 border-b border-gray-200">
                        <div className="col-span-3 text-xs text-gray-400 uppercase tracking-wide">Producto/Descripción</div>
                        <div className="col-span-2 text-xs text-gray-400 uppercase tracking-wide">Referencia</div>
                        <div className="col-span-1 text-xs text-gray-400 uppercase tracking-wide text-center">Cant.</div>
                        <div className="col-span-2 text-xs text-gray-400 uppercase tracking-wide text-center">P.Coste</div>
                        <div className="col-span-2 text-xs text-gray-400 uppercase tracking-wide text-center">P.Venta</div>
                        <div className="col-span-1 text-xs text-gray-400 uppercase tracking-wide text-center">Stock</div>
                        <div className="col-span-1"></div>
                      </div>
                      {lineas.map((l) => (
                        <div key={l._key} className="grid grid-cols-12 px-4 py-3 border-b border-gray-50 items-center gap-2">
                          <div className="col-span-3">
                            <select value={l.productoId}
                              onChange={(e) => updateLinea(l._key, "productoId", e.target.value)}
                              className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white text-gray-700 mb-1">
                              <option value="">— Libre (sin producto) —</option>
                              {productos.map((p) => (
                                <option key={p.id} value={p.id}>{p.nombre}</option>
                              ))}
                            </select>
                            {!l.productoId && (
                              <input type="text" placeholder="Descripción..." value={l.descripcion}
                                onChange={(e) => updateLinea(l._key, "descripcion", e.target.value)}
                                className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white" />
                            )}
                          </div>
                          <div className="col-span-2">
                            <input type="text" placeholder="Ref..." value={l.referencia}
                              onChange={(e) => updateLinea(l._key, "referencia", e.target.value)}
                              className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white font-mono" />
                          </div>
                          <div className="col-span-1">
                            <input type="number" min="0" step="0.01" value={l.cantidad}
                              onChange={(e) => updateLinea(l._key, "cantidad", e.target.value)}
                              className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white text-center" />
                          </div>
                          <div className="col-span-2">
                            <input type="number" min="0" step="0.01" value={l.precioCoste}
                              onChange={(e) => updateLinea(l._key, "precioCoste", e.target.value)}
                              className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white text-center" />
                          </div>
                          <div className="col-span-2">
                            <input type="number" min="0" step="0.01" value={l.precioVenta}
                              onChange={(e) => updateLinea(l._key, "precioVenta", e.target.value)}
                              className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white text-center" />
                          </div>
                          <div className="col-span-1 flex justify-center">
                            <input type="checkbox" checked={l.aStock}
                              onChange={(e) => updateLinea(l._key, "aStock", e.target.checked)}
                              className="w-4 h-4 rounded cursor-pointer accent-[#00C2FF]" />
                          </div>
                          <div className="col-span-1 flex justify-end">
                            <button type="button" onClick={() => removeLinea(l._key)}
                              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                      <div className="flex justify-end px-4 py-3 bg-gray-50">
                        <span className="text-xs text-gray-500 mr-3">Total compra</span>
                        <span className="text-sm font-bold text-gray-800">{totalCompra.toFixed(2)} €</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Observaciones</label>
                    <textarea rows={2} value={compraForm.observaciones}
                      onChange={(e) => setCompraForm((p) => ({ ...p, observaciones: e.target.value }))}
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white resize-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Foto del ticket/factura</label>
                    <input ref={fotoCompraInputRef} type="file" accept="image/*" onChange={handleFotoCompra} className="hidden" />
                    {fotoCompraBase64 ? (
                      <div className="relative inline-block">
                        <img src={fotoCompraBase64} alt="Ticket" className="h-20 rounded-lg border border-gray-200 object-cover" />
                        <button type="button" onClick={() => setFotoCompraBase64("")}
                          className="absolute -top-2 -right-2 w-6 h-6 flex items-center justify-center bg-white rounded-full border border-gray-200 text-gray-500 shadow-sm cursor-pointer">
                          <X size={13} />
                        </button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => fotoCompraInputRef.current?.click()} disabled={procesandoFotoCompra}
                        className="flex items-center gap-2 text-sm font-medium text-gray-600 border border-dashed border-gray-300 rounded-lg px-4 py-2.5 hover:bg-gray-50 disabled:opacity-50 cursor-pointer">
                        <Camera size={16} /> {procesandoFotoCompra ? "Procesando..." : "Subir foto (opcional)"}
                      </button>
                    )}
                  </div>
                </div>

                {errorCompra && (
                  <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{errorCompra}</div>
                )}

                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => { setMostrarCompra(false); setLineas([]); setFotoCompraBase64(""); }}
                    className="px-5 py-2.5 text-sm text-gray-500 hover:text-gray-700 cursor-pointer">Cancelar</button>
                  <button type="submit" disabled={creando}
                    className="flex items-center gap-2 bg-[#0B1120] text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-[#162030] transition-colors disabled:opacity-50 cursor-pointer">
                    <Save size={15} />
                    {creando ? "Guardando..." : "Guardar compra"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Lista compras */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="grid grid-cols-12 px-5 py-3 bg-gray-50 border-b border-gray-100">
              <div className="col-span-2 text-xs text-gray-400 uppercase tracking-wide">Fecha</div>
              <div className="col-span-2 text-xs text-gray-400 uppercase tracking-wide">Albarán</div>
              <div className="col-span-3 text-xs text-gray-400 uppercase tracking-wide">Proveedor</div>
              <div className="col-span-2 text-xs text-gray-400 uppercase tracking-wide text-center">Líneas</div>
              <div className="col-span-2 text-xs text-gray-400 uppercase tracking-wide text-right">Total</div>
              <div className="col-span-1"></div>
            </div>

            {compras.length === 0 ? (
              <div className="text-center py-16">
                <ShoppingCart size={48} className="mx-auto text-gray-200 mb-4" />
                <p className="text-gray-400 text-sm mb-2">No hay compras registradas</p>
                <button onClick={() => setMostrarCompra(true)}
                  className="text-[#00C2FF] text-sm cursor-pointer">Registrar primera compra →</button>
              </div>
            ) : (
              compras.map((c) => (
                <div key={c.id}
                  className="grid grid-cols-12 px-5 py-4 border-b border-gray-50 items-center hover:bg-gray-50 transition-colors">
                  <div className="col-span-2 flex items-center gap-1.5 text-sm text-gray-500">
                    <Calendar size={12} className="text-gray-300" />
                    {new Date(c.fecha).toLocaleDateString("es-ES")}
                  </div>
                  <div className="col-span-2 text-sm text-gray-600 font-mono">
                    {c.numeroAlbaran || "—"}
                  </div>
                  <div className="col-span-3 text-sm text-gray-700">
                    {c.proveedor?.nombre || c.proveedorNombre || "—"}
                  </div>
                  <div className="col-span-2 text-sm text-gray-600 text-center">
                    {c._count.lineas} línea{c._count.lineas !== 1 ? "s" : ""}
                  </div>
                  <div className="col-span-2 text-sm font-semibold text-gray-800 text-right">
                    {c.total.toFixed(2)} €
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <button onClick={() => setCompraDetalle(compraDetalle?.id === c.id ? null : c)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors cursor-pointer">
                      <ChevronRight size={15} className={`transition-transform ${compraDetalle?.id === c.id ? "rotate-90" : ""}`} />
                    </button>
                  </div>

                  {/* Detalle expandible */}
                  {compraDetalle?.id === c.id && (
                    <div className="col-span-12 mt-3 bg-gray-50 rounded-lg p-4">
                      {(c.tecnico || c.fotoTicketBase64) && (
                        <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200">
                          <div className="text-xs text-gray-500">
                            {c.tecnico
                              ? <>Registrada por <span className="font-medium text-gray-700">{c.tecnico.nombre}</span> desde la app del técnico</>
                              : "Registrada desde la oficina"}
                          </div>
                          {c.fotoTicketBase64 && (
                            <button onClick={() => setFotoAmpliada(c.fotoTicketBase64!)} className="cursor-pointer">
                              <img src={c.fotoTicketBase64} alt="Ticket" className="w-10 h-10 rounded-md object-cover border border-gray-200" />
                            </button>
                          )}
                        </div>
                      )}
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left text-xs text-gray-400 pb-2">Descripción</th>
                            <th className="text-left text-xs text-gray-400 pb-2">Referencia</th>
                            <th className="text-right text-xs text-gray-400 pb-2">Cantidad</th>
                            <th className="text-right text-xs text-gray-400 pb-2">P.Coste</th>
                            <th className="text-right text-xs text-gray-400 pb-2">P.Venta</th>
                            <th className="text-center text-xs text-gray-400 pb-2">A stock</th>
                            <th className="text-left text-xs text-gray-400 pb-2">Orden</th>
                            <th className="text-right text-xs text-gray-400 pb-2">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {c.lineas.map((l) => (
                            <tr key={l.id} className="border-b border-gray-100">
                              <td className="py-2 text-gray-800">{l.descripcion}</td>
                              <td className="py-2 text-gray-400 font-mono">{l.referencia || "—"}</td>
                              <td className="py-2 text-gray-600 text-right">{l.cantidad}</td>
                              <td className="py-2 text-gray-600 text-right">{l.precioCoste.toFixed(2)} €</td>
                              <td className="py-2 text-gray-600 text-right">{l.precioVenta.toFixed(2)} €</td>
                              <td className="py-2 text-center">
                                <span className={`text-xs px-2 py-0.5 rounded-full ${l.aStock ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                                  {l.aStock ? "Sí" : "No"}
                                </span>
                              </td>
                              <td className="py-2 text-gray-500">
                                {l.orden ? (
                                  <a href={`/ordenes/${l.orden.id}`} className="text-[#00C2FF] hover:underline">{l.orden.numero}</a>
                                ) : "—"}
                              </td>
                              <td className="py-2 text-gray-800 font-medium text-right">
                                {(l.cantidad * l.precioCoste).toFixed(2)} €
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {c.observaciones && (
                        <p className="text-xs text-gray-400 mt-3">{c.observaciones}</p>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ====== PESTAÑA ALMACÉN ====== */}
      {pestana === "almacen" && (
        <div>
          {/* Formulario nuevo producto */}
          {mostrarProducto && (
            <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-700">Nuevo producto</h2>
                <button onClick={() => setMostrarProducto(false)}
                  className="text-gray-400 hover:text-gray-600 cursor-pointer"><X size={16} /></button>
              </div>
              <form onSubmit={handleCrearProducto} className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Nombre <span className="text-red-400">*</span></label>
                  <input type="text" value={productoForm.nombre} required
                    onChange={(e) => setProductoForm((p) => ({ ...p, nombre: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Referencia</label>
                  <input type="text" value={productoForm.referencia}
                    onChange={(e) => setProductoForm((p) => ({ ...p, referencia: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white font-mono" />
                </div>
                <div className="col-span-3">
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Descripción</label>
                  <input type="text" value={productoForm.descripcion}
                    onChange={(e) => setProductoForm((p) => ({ ...p, descripcion: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Precio coste</label>
                  <input type="number" min="0" step="0.01" value={productoForm.precioCoste}
                    onChange={(e) => setProductoForm((p) => ({ ...p, precioCoste: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Precio venta</label>
                  <input type="number" min="0" step="0.01" value={productoForm.precioVenta}
                    onChange={(e) => setProductoForm((p) => ({ ...p, precioVenta: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Stock mínimo</label>
                  <input type="number" min="0" step="0.01" value={productoForm.stockMinimo}
                    onChange={(e) => setProductoForm((p) => ({ ...p, stockMinimo: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white" />
                </div>
                <div className="col-span-3 flex justify-end gap-3">
                  <button type="button" onClick={() => setMostrarProducto(false)}
                    className="px-5 py-2.5 text-sm text-gray-500 hover:text-gray-700 cursor-pointer">Cancelar</button>
                  <button type="submit" disabled={creandoProducto}
                    className="flex items-center gap-2 bg-[#0B1120] text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-[#162030] transition-colors disabled:opacity-50 cursor-pointer">
                    <Save size={15} />
                    {creandoProducto ? "Guardando..." : "Crear producto"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Panel salida de stock */}
          {salidaProductoId && (
            <div className="bg-amber-50 rounded-xl border border-amber-200 p-5 mb-6">
              <h3 className="text-sm font-semibold text-amber-700 mb-3">
                Salida de stock — {productos.find((p) => p.id === salidaProductoId)?.nombre}
              </h3>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-medium text-amber-600 uppercase tracking-wide mb-1.5">Cantidad</label>
                  <input type="number" min="0.01" step="0.01" value={salidaForm.cantidad}
                    onChange={(e) => setSalidaForm((p) => ({ ...p, cantidad: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm border border-amber-200 rounded-lg focus:outline-none focus:border-amber-400 bg-white text-center" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-amber-600 uppercase tracking-wide mb-1.5">Orden (opcional)</label>
                  {salidaOrdenSeleccionada ? (
                    <div className="flex items-center gap-2 px-3 py-2.5 text-sm border border-amber-200 rounded-lg bg-white">
                      <span className="flex-1 truncate">{salidaOrdenSeleccionada.numero}</span>
                      <button type="button" onClick={() => { setSalidaOrdenSeleccionada(null); setSalidaOrdenQuery(""); }}
                        className="text-gray-400 hover:text-gray-600 cursor-pointer">
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <input type="text" placeholder="Buscar por nº de orden..."
                        value={salidaOrdenQuery}
                        onChange={(e) => setSalidaOrdenQuery(e.target.value)}
                        className="w-full px-3 py-2.5 text-sm border border-amber-200 rounded-lg focus:outline-none focus:border-amber-400 bg-white" />
                      {(salidaOrdenResultados.length > 0 || buscandoOrdenSalida) && (
                        <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                          {buscandoOrdenSalida ? (
                            <div className="px-3 py-2 text-xs text-gray-400">Buscando...</div>
                          ) : (
                            salidaOrdenResultados.map((o) => (
                              <button key={o.id} type="button"
                                onClick={() => { setSalidaOrdenSeleccionada(o); setSalidaOrdenResultados([]); }}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer">
                                {o.numero}{o.cliente?.nombre ? ` — ${o.cliente.nombre}` : ""}
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-amber-600 uppercase tracking-wide mb-1.5">Motivo</label>
                  <input type="text" value={salidaForm.motivo}
                    onChange={(e) => setSalidaForm((p) => ({ ...p, motivo: e.target.value }))}
                    placeholder="Motivo de la salida..."
                    className="w-full px-3 py-2.5 text-sm border border-amber-200 rounded-lg focus:outline-none focus:border-amber-400 bg-white" />
                </div>
                <button onClick={handleSalida} disabled={procesandoSalida}
                  className="flex items-center gap-2 bg-amber-600 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-amber-700 transition-colors disabled:opacity-50 cursor-pointer">
                  <ArrowUpDown size={15} />
                  {procesandoSalida ? "Procesando..." : "Registrar salida"}
                </button>
                <button onClick={() => { setSalidaProductoId(null); setErrorSalida(""); setSalidaOrdenSeleccionada(null); setSalidaOrdenQuery(""); }}
                  className="px-4 py-2.5 text-sm text-gray-500 hover:text-gray-700 cursor-pointer">Cancelar</button>
              </div>
              {salidaOrdenSeleccionada && (
                <p className="text-[11px] text-amber-600 mt-2">
                  Se descontará del almacén y se añadirá como recambio en la orden {salidaOrdenSeleccionada.numero}.
                </p>
              )}
              {errorSalida && <p className="text-xs text-red-500 mt-2">{errorSalida}</p>}
            </div>
          )}

          {/* Lista productos */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="grid grid-cols-12 px-5 py-3 bg-gray-50 border-b border-gray-100">
              <div className="col-span-3 text-xs text-gray-400 uppercase tracking-wide">Nombre</div>
              <div className="col-span-2 text-xs text-gray-400 uppercase tracking-wide">Referencia</div>
              <div className="col-span-1 text-xs text-gray-400 uppercase tracking-wide text-center">Stock</div>
              <div className="col-span-1 text-xs text-gray-400 uppercase tracking-wide text-center">Mín.</div>
              <div className="col-span-2 text-xs text-gray-400 uppercase tracking-wide text-right">P.Coste</div>
              <div className="col-span-2 text-xs text-gray-400 uppercase tracking-wide text-right">P.Venta</div>
              <div className="col-span-1 text-xs text-gray-400 uppercase tracking-wide text-center">Acción</div>
            </div>

            {productos.length === 0 ? (
              <div className="text-center py-16">
                <Package size={48} className="mx-auto text-gray-200 mb-4" />
                <p className="text-gray-400 text-sm mb-2">No hay productos en el almacén</p>
                <button onClick={() => setMostrarProducto(true)}
                  className="text-[#00C2FF] text-sm cursor-pointer">Añadir primer producto →</button>
              </div>
            ) : (
              productos.map((p) => {
                const stockBajo = p.stock <= p.stockMinimo && p.stockMinimo > 0;
                return (
                  <div key={p.id} className="grid grid-cols-12 px-5 py-4 border-b border-gray-50 items-center hover:bg-gray-50 transition-colors">
                    <div className="col-span-3">
                      <div className="text-sm font-medium text-gray-800">{p.nombre}</div>
                      {p.descripcion && <div className="text-xs text-gray-400">{p.descripcion}</div>}
                    </div>
                    <div className="col-span-2 text-sm text-gray-400 font-mono">{p.referencia || "—"}</div>
                    <div className="col-span-1 text-center">
                      <span className={`text-sm font-semibold ${stockBajo ? "text-red-500" : "text-gray-800"}`}>
                        {p.stock}
                      </span>
                      {stockBajo && (
                        <div className="text-xs text-red-400">Bajo</div>
                      )}
                    </div>
                    <div className="col-span-1 text-sm text-gray-400 text-center">{p.stockMinimo}</div>
                    <div className="col-span-2 text-sm text-gray-600 text-right">{p.precioCoste.toFixed(2)} €</div>
                    <div className="col-span-2 text-sm text-gray-600 text-right">{p.precioVenta.toFixed(2)} €</div>
                    <div className="col-span-1 flex justify-center">
                      <button
                        onClick={() => { setSalidaProductoId(p.id); setSalidaForm({ cantidad: "1", motivo: "" }); setErrorSalida(""); setSalidaOrdenSeleccionada(null); setSalidaOrdenQuery(""); setSalidaOrdenResultados([]); }}
                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200 transition-colors cursor-pointer"
                        title="Registrar salida"
                      >
                        <ArrowUpDown size={15} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ====== PESTAÑA PROVEEDORES ====== */}
      {pestana === "proveedores" && (
        <div>
          {mostrarProveedor && (
            <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-700">Nuevo proveedor</h2>
                <button onClick={() => setMostrarProveedor(false)}
                  className="text-gray-400 hover:text-gray-600 cursor-pointer"><X size={16} /></button>
              </div>
              <form onSubmit={handleCrearProveedor} className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Nombre <span className="text-red-400">*</span></label>
                  <input type="text" value={proveedorForm.nombre} required
                    onChange={(e) => setProveedorForm((p) => ({ ...p, nombre: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">CIF / NIF</label>
                  <input type="text" value={proveedorForm.cif}
                    onChange={(e) => setProveedorForm((p) => ({ ...p, cif: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Teléfono</label>
                  <input type="tel" value={proveedorForm.telefono}
                    onChange={(e) => setProveedorForm((p) => ({ ...p, telefono: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Email</label>
                  <input type="email" value={proveedorForm.email}
                    onChange={(e) => setProveedorForm((p) => ({ ...p, email: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Persona de contacto</label>
                  <input type="text" value={proveedorForm.contacto}
                    onChange={(e) => setProveedorForm((p) => ({ ...p, contacto: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white" />
                </div>
                <div className="col-span-3">
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Dirección</label>
                  <input type="text" value={proveedorForm.direccion}
                    onChange={(e) => setProveedorForm((p) => ({ ...p, direccion: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white" />
                </div>
                <div className="col-span-3 flex justify-end gap-3">
                  <button type="button" onClick={() => setMostrarProveedor(false)}
                    className="px-5 py-2.5 text-sm text-gray-500 hover:text-gray-700 cursor-pointer">Cancelar</button>
                  <button type="submit" disabled={creandoProveedor}
                    className="flex items-center gap-2 bg-[#0B1120] text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-[#162030] transition-colors disabled:opacity-50 cursor-pointer">
                    <Save size={15} />
                    {creandoProveedor ? "Guardando..." : "Crear proveedor"}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="grid grid-cols-12 px-5 py-3 bg-gray-50 border-b border-gray-100">
              <div className="col-span-3 text-xs text-gray-400 uppercase tracking-wide">Nombre</div>
              <div className="col-span-2 text-xs text-gray-400 uppercase tracking-wide">CIF</div>
              <div className="col-span-2 text-xs text-gray-400 uppercase tracking-wide">Teléfono</div>
              <div className="col-span-3 text-xs text-gray-400 uppercase tracking-wide">Email</div>
              <div className="col-span-2 text-xs text-gray-400 uppercase tracking-wide">Contacto</div>
            </div>

            {proveedores.length === 0 ? (
              <div className="text-center py-16">
                <Building2 size={48} className="mx-auto text-gray-200 mb-4" />
                <p className="text-gray-400 text-sm mb-2">No hay proveedores registrados</p>
                <button onClick={() => setMostrarProveedor(true)}
                  className="text-[#00C2FF] text-sm cursor-pointer">Añadir primer proveedor →</button>
              </div>
            ) : (
              proveedores.map((p) => (
                <div key={p.id} className="grid grid-cols-12 px-5 py-4 border-b border-gray-50 items-center hover:bg-gray-50 transition-colors">
                  <div className="col-span-3 text-sm font-medium text-gray-800">{p.nombre}</div>
                  <div className="col-span-2 text-sm text-gray-400 font-mono">{p.cif || "—"}</div>
                  <div className="col-span-2 text-sm text-gray-600">{p.telefono || "—"}</div>
                  <div className="col-span-3 text-sm text-gray-600">{p.email || "—"}</div>
                  <div className="col-span-2 text-sm text-gray-600">{p.contacto || "—"}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Foto de ticket ampliada */}
      {fotoAmpliada && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          onClick={() => setFotoAmpliada(null)}
        >
          <img src={fotoAmpliada} alt="Ticket ampliado" className="max-w-full max-h-full rounded-lg" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}