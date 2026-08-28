"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Clock, PlayCircle, PauseCircle, CheckCircle2, AlertCircle,
  Building2, Wrench, Phone, Plus, Trash2, PenLine, X,
} from "lucide-react";
import TecnicoCompraForm from "@/components/TecnicoCompraForm";

const ESTADO_CONFIG: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  pendiente:  { label: "Pendiente",  className: "bg-yellow-50 text-yellow-700 border-yellow-200", icon: <Clock size={13} /> },
  en_curso:   { label: "En curso",   className: "bg-blue-50 text-blue-700 border-blue-200",       icon: <PlayCircle size={13} /> },
  pausado:    { label: "Pausada",    className: "bg-orange-50 text-orange-700 border-orange-200", icon: <PauseCircle size={13} /> },
  completado: { label: "Completado", className: "bg-green-50 text-green-700 border-green-200",    icon: <CheckCircle2 size={13} /> },
  cancelado:  { label: "Cancelado",  className: "bg-red-50 text-red-700 border-red-200",          icon: <AlertCircle size={13} /> },
};

const formatHoras = (horas: number) => {
  const totalMin = Math.round((horas ?? 0) * 60);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
};

type TipoServicio = { id: string; nombre: string; unidad: string };

const uid = () => Math.random().toString(36).slice(2, 9);
const hoy = () => new Date().toISOString().split("T")[0];

export default function TecnicoOrdenDetalle({
  orden,
  tiposServicio,
  precioHoraDefault,
  precioPorKmDefault,
  tecnicoId,
  proveedores,
  productos,
}: {
  orden: any;
  tiposServicio: TipoServicio[];
  precioHoraDefault: number;
  precioPorKmDefault: number;
  tecnicoId: string;
  proveedores: { id: string; nombre: string }[];
  productos: any[];
}) {
  const router = useRouter();

  const [estado, setEstado]     = useState(orden.estado);
  const [guardando, setGuardando] = useState(false);
  const [error, setError]       = useState("");
  const [okMsg, setOkMsg]       = useState("");

  const [trabajos, setTrabajos]   = useState(orden.trabajosRealizados ?? "");
  const [observ, setObserv]       = useState(orden.observaciones ?? "");

  const precioHora  = orden.cliente?.precioHoraEspecial  ?? precioHoraDefault;
  const precioPorKm = orden.cliente?.precioPorKmEspecial ?? precioPorKmDefault;

  const [serviciosEstandar, setServiciosEstandar] = useState(
    (orden.servicios ?? []).map((s: any) => ({
      _key:           uid(),
      fecha:          s.fecha ? String(s.fecha).split("T")[0] : hoy(),
      tipoServicioId: s.tipoServicioId,
      cantidad:       s.cantidad,
      precio:         s.precio,
      descripcion:    s.descripcion ?? "",
    }))
  );
  const [repuestos, setRepuestos] = useState(
    (orden.repuestos ?? []).map((r: any) => ({ ...r, _key: uid() }))
  );
  const [comprasOrden, setComprasOrden] = useState(
    (orden.lineasCompra ?? []).map((lc: any) => ({ ...lc, _key: uid() }))
  );
  const [mostrarCompra, setMostrarCompra] = useState(false);
  const [serviciosLibres, setServiciosLibres] = useState(
    (orden.serviciosLibres ?? []).map((s: any) => ({ ...s, _key: uid() }))
  );

  const [mostrarFirma, setMostrarFirma] = useState(false);
  const [firmaDni, setFirmaDni]         = useState(orden.firmaDni ?? "");
  const [firmadoOk, setFirmadoOk]       = useState(!!orden.firmaBase64);
  const canvasRef      = useRef<HTMLCanvasElement>(null);
  const dibujandoRef   = useRef(false);
  const ultimoPuntoRef = useRef<{ x: number; y: number } | null>(null);

  const estadoInfo = ESTADO_CONFIG[estado] ?? ESTADO_CONFIG.pendiente;

  useEffect(() => {
    if (!mostrarFirma) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.strokeStyle = "#0B1120";
    ctx.lineWidth   = 2;
    ctx.lineCap     = "round";
    ctx.lineJoin    = "round";
  }, [mostrarFirma]);

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    dibujandoRef.current = true;
    const canvas = canvasRef.current;
    if (!canvas) return;
    ultimoPuntoRef.current = getPos(e, canvas);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!dibujandoRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const pos  = getPos(e, canvas);
    const last = ultimoPuntoRef.current;
    if (!last) return;
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    ultimoPuntoRef.current = pos;
  };

  const stopDraw = () => { dibujandoRef.current = false; ultimoPuntoRef.current = null; };

  const limpiarFirma = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // ---- Servicios estándar ----
  const addServicioEstandar = () => {
    const primerTipo = tiposServicio[0];
    const precio     = primerTipo?.unidad === "h" ? precioHora : precioPorKm;
    setServiciosEstandar((prev: any) => [...prev, {
      _key: uid(), fecha: hoy(),
      tipoServicioId: primerTipo?.id ?? "",
      cantidad: 0, precio, descripcion: "",
    }]);
  };

  const updateServicioEstandar = (key: string, field: string, value: any) =>
    setServiciosEstandar((prev: any) => prev.map((s: any) => {
      if (s._key !== key) return s;
      const updated = { ...s, [field]: value };
      if (field === "tipoServicioId") {
        const tipo = tiposServicio.find((t) => t.id === value);
        updated.precio = tipo?.unidad === "h" ? precioHora : precioPorKm;
      }
      return updated;
    }));

  const removeServicioEstandar = (key: string) =>
    setServiciosEstandar((prev: any) => prev.filter((s: any) => s._key !== key));

  // ---- Repuestos ----
  const addRepuesto = () =>
    setRepuestos((prev: any) => [...prev, {
      _key: uid(), referencia: "", descripcion: "", cantidad: 1, precioCoste: 0, precioVenta: 0,
    }]);
  const updateRepuesto = (key: string, field: string, value: any) =>
    setRepuestos((prev: any) => prev.map((r: any) => r._key === key ? { ...r, [field]: value } : r));
  const removeRepuesto = (key: string) =>
    setRepuestos((prev: any) => prev.filter((r: any) => r._key !== key));

  // ---- Compra de materiales ----
  // Al registrar una compra ligada a esta orden, la API crea también un
  // Repuesto correspondiente (para que entre en el presupuesto/factura) y
  // lo devuelve junto con la compra: lo añadimos aquí al estado local para
  // que aparezca al momento y no se pierda si luego se pulsa "Guardar
  // cambios" (que reemplaza por completo la lista de repuestos).
  const handleCompraGuardada = (compra: any) => {
    const nuevasLineas = (compra.lineas ?? []).map((l: any) => ({
      ...l,
      _key: uid(),
      compra: {
        proveedor:        compra.proveedor ?? null,
        proveedorNombre:  compra.proveedorNombre ?? null,
        fecha:            compra.fecha,
        fotoTicketBase64: compra.fotoTicketBase64 ?? null,
      },
    }));
    setComprasOrden((prev: any) => [...prev, ...nuevasLineas]);

    const nuevosRepuestos = (compra.repuestosCreados ?? []).map((r: any) => ({ ...r, _key: uid() }));
    if (nuevosRepuestos.length) {
      setRepuestos((prev: any) => [...prev, ...nuevosRepuestos]);
    }

    setMostrarCompra(false);
    setOkMsg("Compra registrada. Se ha añadido como recambio de la orden.");
  };

  // ---- Servicios libres (trabajo / mano de obra suelta) ----
  const addServicioLibre = () =>
    setServiciosLibres((prev: any) => [...prev, { _key: uid(), descripcion: "", cantidad: 1, precio: 0 }]);
  const updateServicioLibre = (key: string, field: string, value: any) =>
    setServiciosLibres((prev: any) => prev.map((s: any) => s._key === key ? { ...s, [field]: value } : s));
  const removeServicioLibre = (key: string) =>
    setServiciosLibres((prev: any) => prev.filter((s: any) => s._key !== key));

  const guardarCambios = async (extra: Record<string, any> = {}) => {
    setGuardando(true);
    setError("");
    setOkMsg("");
    const res = await fetch(`/api/ordenes/${orden.id}`, {
      method:  "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        trabajosRealizados: trabajos,
        observaciones:      observ,
        servicios: serviciosEstandar.map((s: any) => ({
          fecha:          s.fecha,
          tipoServicioId: s.tipoServicioId,
          cantidad:       Number(s.cantidad) || 0,
          precio:         Number(s.precio)   || 0,
          descripcion:    s.descripcion || null,
          esManoObra:     tiposServicio.find((t) => t.id === s.tipoServicioId)?.unidad === "h",
        })),
        repuestos: repuestos.map((r: any) => ({
          referencia:  r.referencia  || null,
          descripcion: r.descripcion,
          cantidad:    Number(r.cantidad)    || 1,
          precioCoste: Number(r.precioCoste) || 0,
          precioVenta: Number(r.precioVenta) || 0,
        })),
        serviciosLibres: serviciosLibres.map((s: any) => ({
          descripcion: s.descripcion,
          cantidad:    Number(s.cantidad) || 1,
          precio:      Number(s.precio)   || 0,
        })),
        ...extra,
      }),
    });
    setGuardando(false);
    if (!res.ok) { setError("No se pudo guardar. Revisa la conexión e inténtalo de nuevo."); return false; }
    setOkMsg("Guardado.");
    router.refresh();
    return true;
  };

  const handleEnCurso = async () => {
    setEstado("en_curso");
    await guardarCambios({ estado: "en_curso" });
  };

  const handlePausar = async () => {
    setEstado("pausado");
    await guardarCambios({ estado: "pausado" });
  };

  const handleGuardarFirma = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const firmaBase64 = canvas.toDataURL("image/png");
    const ok = await guardarCambios({ estado: "completado", firmaDni: firmaDni || null, firmaBase64 });
    if (ok) {
      setEstado("completado");
      setFirmadoOk(true);
      setMostrarFirma(false);
    }
  };

  const totalEstandar  = serviciosEstandar.reduce((acc: number, s: any) => acc + (Number(s.cantidad) || 0) * (Number(s.precio) || 0), 0);
  const totalLibres    = serviciosLibres.reduce((acc: number, s: any) => acc + (Number(s.cantidad) || 0) * (Number(s.precio) || 0), 0);
  const totalRepuestos = repuestos.reduce((acc: number, r: any) => acc + (Number(r.cantidad) || 0) * (Number(r.precioVenta) || 0), 0);

  return (
    <div>
      <Link href="/tecnico" className="inline-flex items-center gap-1.5 text-sm text-gray-500 mb-3">
        <ArrowLeft size={15} /> Volver a órdenes
      </Link>

      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-lg font-semibold text-gray-900">{orden.numero}</h1>
          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded border ${estadoInfo.className}`}>
            {estadoInfo.icon} {estadoInfo.label}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-gray-700 mb-1">
          <Building2 size={14} className="text-gray-400 shrink-0" /> {orden.cliente?.nombre}
        </div>
        {orden.cliente?.telefono && (
          <a href={`tel:${orden.cliente.telefono}`} className="flex items-center gap-1.5 text-sm text-[#00C2FF] mb-1">
            <Phone size={14} className="shrink-0" /> {orden.cliente.telefono}
          </a>
        )}
        <div className="flex items-center gap-1.5 text-sm text-gray-500">
          <Wrench size={14} className="text-gray-400 shrink-0" />
          {orden.maquina?.marca} {orden.maquina?.modelo} — {orden.maquina?.numeroDeSerie}
        </div>
        {orden.direccionReparacion && (
          <div className="text-xs text-gray-400 mt-2">📍 {orden.direccionReparacion}</div>
        )}
        {orden.horasTrabajo > 0 && (
          <div className="text-xs text-gray-500 mt-2 flex items-center gap-1">
            <Clock size={12} className="text-gray-400" /> Tiempo trabajado: {formatHoras(orden.horasTrabajo)}
          </div>
        )}
      </div>

      {estado === "pendiente" && (
        <button
          onClick={handleEnCurso}
          disabled={guardando}
          className="w-full mb-4 bg-blue-50 text-blue-700 border border-blue-200 font-medium text-sm py-2.5 rounded-lg active:opacity-80 disabled:opacity-50"
        >
          Empezar a trabajar en esta orden
        </button>
      )}

      {estado === "en_curso" && (
        <button
          onClick={handlePausar}
          disabled={guardando}
          className="w-full mb-4 flex items-center justify-center gap-2 bg-orange-50 text-orange-700 border border-orange-200 font-medium text-sm py-2.5 rounded-lg active:opacity-80 disabled:opacity-50"
        >
          <PauseCircle size={16} /> Pausar (comida, desplazamiento...)
        </button>
      )}

      {estado === "pausado" && (
        <button
          onClick={handleEnCurso}
          disabled={guardando}
          className="w-full mb-4 flex items-center justify-center gap-2 bg-blue-50 text-blue-700 border border-blue-200 font-medium text-sm py-2.5 rounded-lg active:opacity-80 disabled:opacity-50"
        >
          <PlayCircle size={16} /> Reanudar trabajo
        </button>
      )}

      {/* Trabajos realizados */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
          Trabajos realizados
        </label>
        <textarea rows={3} placeholder="Describe lo que has hecho..."
          value={trabajos}
          onChange={(e) => setTrabajos(e.target.value)}
          className="w-full px-3 py-2.5 text-base border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white resize-none" />

        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5 mt-3">
          Observaciones internas
        </label>
        <textarea rows={2} placeholder="Notas internas..."
          value={observ}
          onChange={(e) => setObserv(e.target.value)}
          className="w-full px-3 py-2.5 text-base border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white resize-none" />
      </div>

      {/* Servicios estándar */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-900">Servicios estándar</h2>
          <button onClick={addServicioEstandar} className="flex items-center gap-1 text-xs font-medium text-[#00C2FF]">
            <Plus size={14} /> Añadir
          </button>
        </div>
        {serviciosEstandar.length === 0 && <div className="text-xs text-gray-400 pb-1">Ningún servicio estándar registrado.</div>}
        <div className="space-y-3">
          {serviciosEstandar.map((s: any) => {
            const tipo  = tiposServicio.find((t) => t.id === s.tipoServicioId);
            const total = (Number(s.cantidad) || 0) * (Number(s.precio) || 0);
            return (
              <div key={s._key} className="border border-gray-100 rounded-lg p-3 relative bg-amber-50/20">
                <button onClick={() => removeServicioEstandar(s._key)} className="absolute top-2 right-2 text-gray-300">
                  <Trash2 size={15} />
                </button>
                <div className="grid grid-cols-2 gap-2 mb-2 pr-8">
                  <select
                    value={s.tipoServicioId}
                    onChange={(e) => updateServicioEstandar(s._key, "tipoServicioId", e.target.value)}
                    className="px-2.5 py-2 text-base border border-amber-200 rounded-lg bg-white text-gray-700"
                  >
                    {tiposServicio.map((t) => (
                      <option key={t.id} value={t.id}>{t.nombre}</option>
                    ))}
                  </select>
                  <input type="date" value={s.fecha}
                    onChange={(e) => updateServicioEstandar(s._key, "fecha", e.target.value)}
                    className="px-2.5 py-2 text-base border border-gray-200 rounded-lg bg-white" />
                </div>
                <input type="text" placeholder="Descripción adicional (opcional)"
                  value={s.descripcion}
                  onChange={(e) => updateServicioEstandar(s._key, "descripcion", e.target.value)}
                  className="w-full px-2.5 py-2 text-base border border-gray-200 rounded-lg mb-2" />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-gray-400 uppercase tracking-wide mb-1">Cantidad ({tipo?.unidad ?? "ud"})</label>
                    <input type="number" min="0" step="0.5" value={s.cantidad}
                      onChange={(e) => updateServicioEstandar(s._key, "cantidad", parseFloat(e.target.value) || 0)}
                      className="w-full px-2.5 py-2 text-base border border-gray-200 rounded-lg bg-white" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 uppercase tracking-wide mb-1">Precio (€/{tipo?.unidad ?? "ud"})</label>
                    <input type="number" min="0" step="0.01" value={s.precio}
                      onChange={(e) => updateServicioEstandar(s._key, "precio", parseFloat(e.target.value) || 0)}
                      className="w-full px-2.5 py-2 text-base border border-gray-200 rounded-lg bg-white" />
                  </div>
                </div>
                {tipo?.unidad === "h" && orden.horasTrabajo > 0 && (
                  <button
                    type="button"
                    onClick={() => updateServicioEstandar(s._key, "cantidad", Math.round(orden.horasTrabajo * 100) / 100)}
                    className="mt-2 text-[11px] font-medium text-[#00C2FF]"
                  >
                    Usar tiempo trabajado ({formatHoras(orden.horasTrabajo)})
                  </button>
                )}
                <div className="text-right text-xs font-semibold text-gray-700 mt-2">{total.toFixed(2)} €</div>
              </div>
            );
          })}
        </div>
        {serviciosEstandar.length > 0 && (
          <div className="flex justify-end pt-3 mt-1 border-t border-gray-100">
            <span className="text-xs text-gray-500 mr-3">Total servicios estándar</span>
            <span className="text-sm font-semibold text-gray-800">{totalEstandar.toFixed(2)} €</span>
          </div>
        )}
      </div>

      {/* Repuestos */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-900">Recambios usados</h2>
          <button onClick={addRepuesto} className="flex items-center gap-1 text-xs font-medium text-[#00C2FF]">
            <Plus size={14} /> Añadir
          </button>
        </div>
        {repuestos.length === 0 && <div className="text-xs text-gray-400 pb-1">Ningún recambio registrado.</div>}
        <div className="space-y-3">
          {repuestos.map((r: any) => (
            <div key={r._key} className="border border-gray-100 rounded-lg p-3 relative">
              <button onClick={() => removeRepuesto(r._key)} className="absolute top-2 right-2 text-gray-300">
                <Trash2 size={15} />
              </button>
              <input type="text" placeholder="Descripción del recambio"
                value={r.descripcion}
                onChange={(e) => updateRepuesto(r._key, "descripcion", e.target.value)}
                className="w-full px-2.5 py-2 text-base border border-gray-200 rounded-lg mb-2 pr-8" />
              <div className="grid grid-cols-2 gap-2 mb-2">
                <input type="text" placeholder="Referencia"
                  value={r.referencia ?? ""}
                  onChange={(e) => updateRepuesto(r._key, "referencia", e.target.value)}
                  className="px-2.5 py-2 text-base border border-gray-200 rounded-lg" />
                <input type="number" min="0" step="1" placeholder="Cantidad"
                  value={r.cantidad}
                  onChange={(e) => updateRepuesto(r._key, "cantidad", e.target.value)}
                  className="px-2.5 py-2 text-base border border-gray-200 rounded-lg" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-gray-400 uppercase tracking-wide mb-1">P. Coste</label>
                  <input type="number" min="0" step="0.01" placeholder="0.00"
                    value={r.precioCoste}
                    onChange={(e) => updateRepuesto(r._key, "precioCoste", e.target.value)}
                    className="w-full px-2.5 py-2 text-base border border-gray-200 rounded-lg" />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 uppercase tracking-wide mb-1">P. Venta</label>
                  <input type="number" min="0" step="0.01" placeholder="0.00"
                    value={r.precioVenta}
                    onChange={(e) => updateRepuesto(r._key, "precioVenta", e.target.value)}
                    className="w-full px-2.5 py-2 text-base border border-gray-200 rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>
        {repuestos.length > 0 && (
          <div className="flex justify-end pt-3 mt-1 border-t border-gray-100">
            <span className="text-xs text-gray-500 mr-3">Total recambios</span>
            <span className="text-sm font-semibold text-gray-800">{totalRepuestos.toFixed(2)} €</span>
          </div>
        )}
      </div>

      {/* Compra de materiales */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-900">Compra de materiales</h2>
          <button type="button" onClick={() => setMostrarCompra(true)} className="flex items-center gap-1 text-xs font-medium text-[#00C2FF]">
            <Plus size={14} /> Registrar compra
          </button>
        </div>
        {comprasOrden.length === 0 ? (
          <div className="text-xs text-gray-400 pb-1">
            Úsalo cuando compres materiales por tu cuenta para este trabajo (ferretería, recambios...).
          </div>
        ) : (
          <div className="space-y-2">
            {comprasOrden.map((lc: any) => {
              const nombreProveedor = lc.compra?.proveedor?.nombre ?? lc.compra?.proveedorNombre ?? "Proveedor sin especificar";
              return (
                <div key={lc._key} className="flex items-center justify-between border border-gray-100 rounded-lg px-3 py-2">
                  <div className="min-w-0">
                    <div className="text-sm text-gray-800 truncate">{lc.descripcion}</div>
                    <div className="text-xs text-gray-400 truncate">{nombreProveedor} · {lc.cantidad} ud</div>
                  </div>
                  <div className="text-sm font-semibold text-gray-700 shrink-0 ml-2">
                    {(Number(lc.cantidad) * Number(lc.precioCoste)).toFixed(2)} €
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <p className="text-[11px] text-gray-400 mt-3">
          Se añade automáticamente como recambio de la orden con el precio de venta que indiques.
        </p>
      </div>

      {/* Servicios / trabajo suelto */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-900">Otros trabajos / servicios libres</h2>
          <button onClick={addServicioLibre} className="flex items-center gap-1 text-xs font-medium text-[#00C2FF]">
            <Plus size={14} /> Añadir
          </button>
        </div>
        {serviciosLibres.length === 0 && <div className="text-xs text-gray-400 pb-1">Nada añadido.</div>}
        <div className="space-y-3">
          {serviciosLibres.map((s: any) => (
            <div key={s._key} className="border border-gray-100 rounded-lg p-3 relative bg-purple-50/20">
              <button onClick={() => removeServicioLibre(s._key)} className="absolute top-2 right-2 text-gray-300">
                <Trash2 size={15} />
              </button>
              <input type="text" placeholder="Descripción"
                value={s.descripcion}
                onChange={(e) => updateServicioLibre(s._key, "descripcion", e.target.value)}
                className="w-full px-2.5 py-2 text-base border border-purple-200 rounded-lg mb-2 pr-8" />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-gray-400 uppercase tracking-wide mb-1">Cantidad</label>
                  <input type="number" min="0" step="0.5" placeholder="Cantidad / horas"
                    value={s.cantidad}
                    onChange={(e) => updateServicioLibre(s._key, "cantidad", e.target.value)}
                    className="w-full px-2.5 py-2 text-base border border-gray-200 rounded-lg" />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 uppercase tracking-wide mb-1">Precio (€/ud)</label>
                  <input type="number" min="0" step="0.01" placeholder="0.00"
                    value={s.precio}
                    onChange={(e) => updateServicioLibre(s._key, "precio", e.target.value)}
                    className="w-full px-2.5 py-2 text-base border border-gray-200 rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>
        {serviciosLibres.length > 0 && (
          <div className="flex justify-end pt-3 mt-1 border-t border-gray-100">
            <span className="text-xs text-gray-500 mr-3">Total servicios libres</span>
            <span className="text-sm font-semibold text-gray-800">{totalLibres.toFixed(2)} €</span>
          </div>
        )}
      </div>

      {error && <div className="text-sm text-red-600 mb-3">{error}</div>}
      {okMsg && !error && <div className="text-sm text-green-600 mb-3">{okMsg}</div>}

      <button
        onClick={() => guardarCambios()}
        disabled={guardando}
        className="w-full bg-gray-900 text-white font-medium text-sm py-3 rounded-lg active:opacity-80 disabled:opacity-50 mb-3"
      >
        {guardando ? "Guardando..." : "Guardar cambios"}
      </button>

      {estado !== "completado" && (
        <button
          onClick={() => setMostrarFirma(true)}
          className="w-full flex items-center justify-center gap-2 bg-green-600 text-white font-medium text-sm py-3 rounded-lg active:opacity-80"
        >
          <PenLine size={16} /> Firmar y completar orden
        </button>
      )}

      {firmadoOk && estado === "completado" && (
        <div className="text-center text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg py-3 mt-2">
          Orden completada y firmada.
        </div>
      )}

      {/* Modal firma */}
      {mostrarFirma && (
        <div className="fixed inset-0 bg-black/40 z-30 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">Firma del cliente</h3>
              <button onClick={() => setMostrarFirma(false)}><X size={18} className="text-gray-400" /></button>
            </div>
            <input type="text" placeholder="DNI de quien firma (opcional)"
              value={firmaDni}
              onChange={(e) => setFirmaDni(e.target.value)}
              className="w-full px-3 py-2.5 text-base border border-gray-200 rounded-lg mb-3" />
            <div className="border border-gray-200 rounded-lg overflow-hidden mb-1 bg-gray-50">
              <canvas
                ref={canvasRef}
                width={400} height={180}
                className="w-full touch-none bg-white"
                onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
                onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw}
              />
            </div>
            <button onClick={limpiarFirma} className="text-xs text-gray-400 mb-3">Borrar y repetir</button>
            <div className="text-xs text-gray-400 mb-3">El cliente debe firmar en el recuadro de arriba.</div>
            <button
              onClick={handleGuardarFirma}
              disabled={guardando}
              className="w-full bg-green-600 text-white font-medium text-sm py-3 rounded-lg disabled:opacity-50"
            >
              {guardando ? "Guardando..." : "Guardar firma y completar"}
            </button>
          </div>
        </div>
      )}

      {/* Modal compra de materiales */}
      {mostrarCompra && (
        <div className="fixed inset-0 bg-black/40 z-30 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">Compra de materiales</h3>
              <button onClick={() => setMostrarCompra(false)}><X size={18} className="text-gray-400" /></button>
            </div>
            <TecnicoCompraForm
              ordenId={orden.id}
              proveedores={proveedores}
              productos={productos}
              tecnicoId={tecnicoId}
              onCancel={() => setMostrarCompra(false)}
              onSaved={handleCompraGuardada}
            />
          </div>
        </div>
      )}
    </div>
  );
}
