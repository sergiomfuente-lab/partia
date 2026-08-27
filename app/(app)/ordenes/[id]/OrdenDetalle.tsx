"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, ClipboardList, Pencil, Download,
  CheckCircle2, Clock, AlertCircle, PlayCircle, PauseCircle,
  Building2, Calendar, Wrench, Package,
  FileText, PenLine, Trash2,
} from "lucide-react";

const ESTADO_CONFIG: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  pendiente:  { label: "Pendiente",  className: "bg-yellow-50 text-yellow-700 border border-yellow-200", icon: <Clock size={13} /> },
  en_curso:   { label: "En curso",   className: "bg-blue-50 text-blue-700 border border-blue-200",       icon: <PlayCircle size={13} /> },
  pausado:    { label: "Pausada",    className: "bg-orange-50 text-orange-700 border border-orange-200", icon: <PauseCircle size={13} /> },
  completado: { label: "Completado", className: "bg-green-50 text-green-700 border border-green-200",    icon: <CheckCircle2 size={13} /> },
  cancelado:  { label: "Cancelado",  className: "bg-red-50 text-red-700 border border-red-200",          icon: <AlertCircle size={13} /> },
};

const formatHoras = (horas: number) => {
  const totalMin = Math.round((horas ?? 0) * 60);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
};

export default function OrdenDetalle({ orden }: { orden: any }) {
  const router = useRouter();
  const [cambiandoEstado, setCambiandoEstado] = useState(false);
  const [mostrarFirma, setMostrarFirma]       = useState(false);
  const [firmaDni, setFirmaDni]               = useState(orden.firmaDni ?? "");
  const [firmaObs, setFirmaObs]               = useState(orden.firmaObservaciones ?? "");
  const [firmando, setFirmando]               = useState(false);
  const [firmadoOk, setFirmadoOk]             = useState(!!orden.firmaBase64);
  const [mostrarPrecios, setMostrarPrecios]   = useState(orden.mostrarPrecios ?? true);
  const [togglingPrecios, setTogglingPrecios] = useState(false);

  const canvasRef      = useRef<HTMLCanvasElement>(null);
  const dibujandoRef   = useRef(false);
  const ultimoPuntoRef = useRef<{ x: number; y: number } | null>(null);

  const estadoInfo = ESTADO_CONFIG[orden.estado] ?? ESTADO_CONFIG.pendiente;

  const totalServicios = (orden.servicios ?? []).reduce((a: number, s: any) => a + s.cantidad * s.precio, 0);
  const totalLibres    = (orden.serviciosLibres ?? []).reduce((a: number, s: any) => a + s.cantidad * s.precio, 0);
  const totalRepuestos = (orden.repuestos ?? []).reduce((a: number, r: any) => a + r.cantidad * r.precioVenta, 0);
  const totalOrden     = totalServicios + totalLibres + totalRepuestos;

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
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return { x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    dibujandoRef.current   = true;
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

  const stopDraw = () => {
    dibujandoRef.current   = false;
    ultimoPuntoRef.current = null;
  };

  const limpiarFirma = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleGuardarFirma = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const firmaBase64 = canvas.toDataURL("image/png");
    setFirmando(true);
    const res = await fetch(`/api/ordenes/${orden.id}`, {
      method:  "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firmaDni:           firmaDni || null,
        firmaObservaciones: firmaObs || null,
        firmaBase64,
      }),
    });
    if (res.ok) {
      setFirmadoOk(true);
      setMostrarFirma(false);
      router.refresh();
    }
    setFirmando(false);
  };

  const handleEstado = async (nuevoEstado: string) => {
    setCambiandoEstado(true);
    await fetch(`/api/ordenes/${orden.id}`, {
      method:  "PUT",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ estado: nuevoEstado }),
    });
    setCambiandoEstado(false);
    router.refresh();
  };

  const handleTogglePrecios = async () => {
    setTogglingPrecios(true);
    const nuevoValor = !mostrarPrecios;
    const res = await fetch(`/api/ordenes/${orden.id}`, {
      method:  "PUT",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ mostrarPrecios: nuevoValor }),
    });
    if (res.ok) setMostrarPrecios(nuevoValor);
    setTogglingPrecios(false);
  };

  return (
    <div className="p-8">
      {/* Cabecera */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/ordenes")}
            className="text-gray-400 hover:text-gray-600 text-sm flex items-center gap-1 cursor-pointer"
          >
            <ArrowLeft size={14} /> Volver
          </button>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <ClipboardList size={22} />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-semibold text-gray-900 font-mono">{orden.numero}</h1>
                <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${estadoInfo.className}`}>
                  {estadoInfo.icon} {estadoInfo.label}
                </span>
                {firmadoOk && (
                  <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium bg-purple-50 text-purple-700 border border-purple-200">
                    <PenLine size={11} /> Firmado
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-400 mt-0.5 flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Calendar size={12} />
                  {new Date(orden.fecha).toLocaleDateString("es-ES", {
                    day: "2-digit", month: "long", year: "numeric",
                  })}
                </span>
                <span className="flex items-center gap-1">
                  <Building2 size={12} />
                  {orden.cliente.nombre}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setMostrarFirma(true)}
            className="flex items-center gap-2 border border-purple-200 text-purple-600 rounded-lg px-4 py-2 text-sm hover:bg-purple-50 transition-colors cursor-pointer"
          >
            <PenLine size={15} />
            {firmadoOk ? "Ver / editar firma" : "Añadir firma"}
          </button> 
        <a href={`/api/ordenes/${orden.id}/pdf`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer">
            <Download size={15} />
            Descargar PDF
        </a>
          <Link
            href={`/ordenes/${orden.id}/editar`}
            className="flex items-center gap-2 border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Pencil size={14} /> Editar
          </Link>
        </div>
      </div>

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Servicios estándar</div>
          <div className="text-2xl font-semibold text-gray-900">
            {totalServicios.toFixed(2)} <span className="text-sm font-normal text-gray-400">€</span>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Servicios libres</div>
          <div className="text-2xl font-semibold text-gray-900">
            {totalLibres.toFixed(2)} <span className="text-sm font-normal text-gray-400">€</span>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Recambios</div>
          <div className="text-2xl font-semibold text-gray-900">
            {totalRepuestos.toFixed(2)} <span className="text-sm font-normal text-gray-400">€</span>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[#00C2FF] p-4">
          <div className="text-xs text-[#00C2FF] uppercase tracking-wide mb-1">Total</div>
          <div className="text-2xl font-bold text-[#0B1120]">
            {totalOrden.toFixed(2)} <span className="text-sm font-normal text-gray-400">€</span>
          </div>
        </div>
      </div>

      {/* Modal firma */}
      {mostrarFirma && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <PenLine size={18} className="text-purple-600" />
                Firma del cliente
              </h2>
              <button
                onClick={() => setMostrarFirma(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer text-xl leading-none"
              >
                &times;
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                  DNI del cliente (opcional)
                </label>
                <input
                  type="text"
                  value={firmaDni}
                  onChange={(e) => setFirmaDni(e.target.value)}
                  placeholder="Ej: 12345678A"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                  Observaciones del cliente (opcional)
                </label>
                <textarea
                  rows={2}
                  value={firmaObs}
                  onChange={(e) => setFirmaObs(e.target.value)}
                  placeholder="Observaciones del cliente sobre los trabajos realizados..."
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white resize-none"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Firma del cliente
                  </label>
                  <button
                    type="button"
                    onClick={limpiarFirma}
                    className="text-xs text-gray-400 hover:text-red-500 cursor-pointer flex items-center gap-1"
                  >
                    <Trash2 size={11} /> Limpiar
                  </button>
                </div>
                <div className="border-2 border-dashed border-gray-200 rounded-xl overflow-hidden bg-gray-50">
                  <canvas
                    ref={canvasRef}
                    width={456}
                    height={180}
                    className="w-full touch-none cursor-crosshair"
                    onMouseDown={startDraw}
                    onMouseMove={draw}
                    onMouseUp={stopDraw}
                    onMouseLeave={stopDraw}
                    onTouchStart={startDraw}
                    onTouchMove={draw}
                    onTouchEnd={stopDraw}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  El cliente debe firmar en el recuadro de arriba
                </p>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setMostrarFirma(false)}
                className="px-5 py-2.5 text-sm text-gray-500 hover:text-gray-700 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleGuardarFirma}
                disabled={firmando}
                className="flex items-center gap-2 bg-purple-600 text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <PenLine size={15} />
                {firmando ? "Guardando..." : "Guardar firma"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Firma guardada */}
      {firmadoOk && orden.firmaBase64 && !mostrarFirma && (
        <div className="bg-purple-50 rounded-xl border border-purple-100 p-5 mb-6">
          <h3 className="text-sm font-semibold text-purple-700 mb-3 flex items-center gap-2">
            <PenLine size={15} /> Firma del cliente
          </h3>
          <div className="grid grid-cols-3 gap-4">
            {orden.firmaDni && (
              <div>
                <div className="text-xs text-purple-400 mb-0.5">DNI</div>
                <div className="text-sm font-medium text-purple-800 font-mono">{orden.firmaDni}</div>
              </div>
            )}
            {orden.firmaObservaciones && (
              <div className="col-span-2">
                <div className="text-xs text-purple-400 mb-0.5">Observaciones del cliente</div>
                <div className="text-sm text-purple-800">{orden.firmaObservaciones}</div>
              </div>
            )}
            <div className="col-span-3">
              <div className="text-xs text-purple-400 mb-2">Firma</div>
              <div className="bg-white rounded-lg border border-purple-200 p-2 inline-block">
                <img
                  src={orden.firmaBase64}
                  alt="Firma del cliente"
                  className="h-20 object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        {/* Columna izquierda */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 pb-3 border-b border-gray-100">
              Información
            </h3>
            <div className="space-y-3">
              <div>
                <div className="text-xs text-gray-400 mb-0.5">Cliente</div>
                <Link
                  href={`/clientes/${orden.clienteId}`}
                  className="text-sm font-medium text-[#00C2FF] hover:underline"
                >
                  {orden.cliente.nombre}
                </Link>
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-0.5">Máquina</div>
                <Link
                  href={`/maquinas/${orden.maquinaId}`}
                  className="text-sm font-medium text-[#00C2FF] hover:underline"
                >
                  {orden.maquina.marca} {orden.maquina.modelo}
                </Link>
                <div className="text-xs text-gray-400 font-mono mt-0.5">
                  {orden.maquina.numeroDeSerie}
                </div>
              </div>
              {orden.direccionReparacion && (
                <div>
                  <div className="text-xs text-gray-400 mb-0.5">Dir. reparación</div>
                  <div className="text-sm text-gray-700">{orden.direccionReparacion}</div>
                </div>
              )}
              <div>
                <div className="text-xs text-gray-400 mb-0.5">Horas máquina</div>
                <div className="text-sm font-medium text-gray-800">
                  {orden.maquina.horasActuales}h
                </div>
              </div>
              {orden.horasTrabajo > 0 && (
                <div>
                  <div className="text-xs text-gray-400 mb-0.5">Tiempo trabajado (técnico)</div>
                  <div className="text-sm font-medium text-gray-800">
                    {formatHoras(orden.horasTrabajo)}
                  </div>
                </div>
              )}

              {/* Toggle mostrar precios */}
              <div className="pt-2 border-t border-gray-100">
                <div className="text-xs text-gray-400 mb-2">Mostrar precios en PDF</div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleTogglePrecios}
                    disabled={togglingPrecios}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer disabled:opacity-50 ${
                      mostrarPrecios ? "bg-[#00C2FF]" : "bg-gray-200"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        mostrarPrecios ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                  <span className="text-xs text-gray-500">
                    {mostrarPrecios ? "Sí, mostrar" : "No mostrar"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Estado */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
              Cambiar estado
            </div>
            <div className="space-y-2">
              {["pendiente", "en_curso", "pausado", "completado", "cancelado"].map((e) => {
                const info = ESTADO_CONFIG[e];
                return (
                  <button
                    key={e}
                    onClick={() => handleEstado(e)}
                    disabled={orden.estado === e || cambiandoEstado}
                    className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                      orden.estado === e
                        ? info.className
                        : "border border-gray-200 text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    {info.icon} {info.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Factura vinculada */}
          {orden.factura && (
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                Factura
              </div>
              <Link
                href={`/facturas/${orden.factura.id}`}
                className="text-sm text-[#185FA5] font-mono hover:underline"
              >
                {orden.factura.numero}
              </Link>
            </div>
          )}

          {orden.observaciones && (
            <div className="bg-amber-50 rounded-xl border border-amber-100 p-5">
              <h3 className="text-sm font-semibold text-amber-700 mb-2">
                Observaciones internas
              </h3>
              <p className="text-sm text-amber-800 leading-relaxed">{orden.observaciones}</p>
            </div>
          )}
        </div>

        {/* Columna derecha */}
        <div className="col-span-2 space-y-6">
          {orden.trabajosRealizados && (
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <FileText size={15} className="text-gray-400" /> Trabajos realizados
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">{orden.trabajosRealizados}</p>
            </div>
          )}

          {/* Servicios estándar */}
          {orden.servicios?.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
                <Wrench size={15} className="text-amber-500" />
                <h3 className="text-sm font-semibold text-gray-700">Servicios</h3>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                  {orden.servicios.length}
                </span>
              </div>
              <div className="grid grid-cols-12 px-5 py-2 bg-gray-50 border-b border-gray-100">
                <div className="col-span-2 text-xs text-gray-400 uppercase tracking-wide">Fecha</div>
                <div className="col-span-3 text-xs text-gray-400 uppercase tracking-wide">Tipo</div>
                <div className="col-span-3 text-xs text-gray-400 uppercase tracking-wide">Descripción</div>
                <div className="col-span-1 text-xs text-gray-400 uppercase tracking-wide text-center">Cant.</div>
                <div className="col-span-1 text-xs text-gray-400 uppercase tracking-wide text-center">Precio</div>
                <div className="col-span-2 text-xs text-gray-400 uppercase tracking-wide text-right">Total</div>
              </div>
              {orden.servicios.map((s: any) => (
                <div key={s.id} className="grid grid-cols-12 px-5 py-3 border-b border-gray-50 items-center">
                  <div className="col-span-2 text-sm text-gray-500">
                    {new Date(s.fecha).toLocaleDateString("es-ES", {
                      day: "2-digit", month: "2-digit",
                    })}
                  </div>
                  <div className="col-span-3 text-sm font-medium text-gray-800">
                    {s.tipoServicio.nombre}
                  </div>
                  <div className="col-span-3 text-sm text-gray-500">{s.descripcion || "—"}</div>
                  <div className="col-span-1 text-sm text-gray-800 text-center">
                    {s.cantidad} {s.tipoServicio.unidad}
                  </div>
                  <div className="col-span-1 text-sm text-gray-500 text-center">
                    {s.precio.toFixed(2)} €
                  </div>
                  <div className="col-span-2 text-sm font-semibold text-gray-800 text-right">
                    {(s.cantidad * s.precio).toFixed(2)} €
                  </div>
                </div>
              ))}
              <div className="flex justify-end px-5 py-3 bg-gray-50">
                <span className="text-xs text-gray-500 mr-3">Total servicios</span>
                <span className="text-sm font-bold text-gray-800">{totalServicios.toFixed(2)} €</span>
              </div>
            </div>
          )}

          {/* Servicios libres */}
          {orden.serviciosLibres?.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
                <Wrench size={15} className="text-purple-500" />
                <h3 className="text-sm font-semibold text-gray-700">Servicios libres</h3>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                  {orden.serviciosLibres.length}
                </span>
              </div>
              <div className="grid grid-cols-12 px-5 py-2 bg-gray-50 border-b border-gray-100">
                <div className="col-span-6 text-xs text-gray-400 uppercase tracking-wide">Descripción</div>
                <div className="col-span-2 text-xs text-gray-400 uppercase tracking-wide text-center">Cant.</div>
                <div className="col-span-2 text-xs text-gray-400 uppercase tracking-wide text-center">Precio</div>
                <div className="col-span-2 text-xs text-gray-400 uppercase tracking-wide text-right">Total</div>
              </div>
              {orden.serviciosLibres.map((s: any) => (
                <div key={s.id} className="grid grid-cols-12 px-5 py-3 border-b border-gray-50 items-center">
                  <div className="col-span-6 text-sm text-gray-800">{s.descripcion}</div>
                  <div className="col-span-2 text-sm text-gray-600 text-center">{s.cantidad}</div>
                  <div className="col-span-2 text-sm text-gray-600 text-center">
                    {s.precio.toFixed(2)} €
                  </div>
                  <div className="col-span-2 text-sm font-semibold text-gray-800 text-right">
                    {(s.cantidad * s.precio).toFixed(2)} €
                  </div>
                </div>
              ))}
              <div className="flex justify-end px-5 py-3 bg-gray-50">
                <span className="text-xs text-gray-500 mr-3">Total servicios libres</span>
                <span className="text-sm font-bold text-gray-800">{totalLibres.toFixed(2)} €</span>
              </div>
            </div>
          )}

          {/* Repuestos */}
          {orden.repuestos?.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
                <Package size={15} className="text-purple-500" />
                <h3 className="text-sm font-semibold text-gray-700">Recambios</h3>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                  {orden.repuestos.length}
                </span>
              </div>
              <div className="grid grid-cols-12 px-5 py-2 bg-gray-50 border-b border-gray-100">
                <div className="col-span-2 text-xs text-gray-400 uppercase tracking-wide">Referencia</div>
                <div className="col-span-4 text-xs text-gray-400 uppercase tracking-wide">Descripción</div>
                <div className="col-span-1 text-xs text-gray-400 uppercase tracking-wide text-center">Cant.</div>
                <div className="col-span-2 text-xs text-gray-400 uppercase tracking-wide text-center">P. Coste</div>
                <div className="col-span-2 text-xs text-gray-400 uppercase tracking-wide text-center">P. Venta</div>
                <div className="col-span-1 text-xs text-gray-400 uppercase tracking-wide text-right">Total</div>
              </div>
              {orden.repuestos.map((r: any) => (
                <div key={r.id} className="grid grid-cols-12 px-5 py-3 border-b border-gray-50 items-center">
                  <div className="col-span-2 text-sm text-gray-400 font-mono">{r.referencia || "—"}</div>
                  <div className="col-span-4 text-sm font-medium text-gray-800">{r.descripcion}</div>
                  <div className="col-span-1 text-sm text-gray-800 text-center">{r.cantidad}</div>
                  <div className="col-span-2 text-sm text-gray-500 text-center">
                    {r.precioCoste.toFixed(2)} €
                  </div>
                  <div className="col-span-2 text-sm text-gray-500 text-center">
                    {r.precioVenta.toFixed(2)} €
                  </div>
                  <div className="col-span-1 text-sm font-semibold text-gray-800 text-right">
                    {(r.cantidad * r.precioVenta).toFixed(2)} €
                  </div>
                </div>
              ))}
              <div className="flex justify-end px-5 py-3 bg-gray-50">
                <span className="text-xs text-gray-500 mr-3">Total recambios</span>
                <span className="text-sm font-bold text-gray-800">{totalRepuestos.toFixed(2)} €</span>
              </div>
            </div>
          )}

          {/* Total */}
          <div className="bg-[#0B1120] rounded-xl p-5">
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Servicios estándar</span>
                <span className="text-white font-medium">{totalServicios.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Servicios libres</span>
                <span className="text-white font-medium">{totalLibres.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Recambios</span>
                <span className="text-white font-medium">{totalRepuestos.toFixed(2)} €</span>
              </div>
            </div>
            <div className="border-t border-gray-700 pt-4 flex items-center justify-between">
              <div className="text-xs text-gray-400 uppercase tracking-wide">Total orden</div>
              <div className="text-3xl font-bold text-white">
                {totalOrden.toFixed(2)}{" "}
                <span className="text-lg font-normal text-gray-400">€</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}