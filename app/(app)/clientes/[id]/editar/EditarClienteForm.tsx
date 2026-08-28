"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, User, Building2, Euro } from "lucide-react";

const FORMAS_PAGO = [
  "Transferencia bancaria",
  "Contado",
  "Cheque",
  "Domiciliación bancaria",
  "Tarjeta",
];

export default function EditarClienteForm({ cliente }: { cliente: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const [form, setForm] = useState({
    nombre:              cliente.nombre              ?? "",
    nombreComercial:     cliente.nombreComercial     ?? "",
    razonSocial:         cliente.razonSocial         ?? "",
    cif:                 cliente.cif                 ?? "",
    direccionFacturacion:cliente.direccionFacturacion ?? "",
    formaPago:           cliente.formaPago            ?? "Transferencia bancaria",
    plazoPagoDias:       cliente.plazoPagoDias != null ? String(cliente.plazoPagoDias) : "",
    email:               cliente.email               ?? "",
    telefono:            cliente.telefono             ?? "",
    tipo:                cliente.tipo                ?? "empresa",
    observaciones:       cliente.observaciones        ?? "",
    precioHoraEspecial:  cliente.precioHoraEspecial  != null ? String(cliente.precioHoraEspecial)  : "",
    precioPorKmEspecial: cliente.precioPorKmEspecial != null ? String(cliente.precioPorKmEspecial) : "",
    mostrarPrecios:      cliente.mostrarPrecios ?? true,
  });

  const setField = (f: string, v: any) => setForm((p) => ({ ...p, [f]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.nombre || !form.cif) {
      setError("Nombre y CIF son obligatorios.");
      return;
    }
    setLoading(true);

    const res = await fetch(`/api/clientes/${cliente.id}`, {
      method:  "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre:              form.nombre,
        nombreComercial:     form.nombreComercial     || null,
        razonSocial:         form.razonSocial         || null,
        cif:                 form.cif,
        direccionFacturacion:form.direccionFacturacion || null,
        formaPago:           form.formaPago,
        plazoPagoDias:       form.plazoPagoDias !== "" ? parseInt(form.plazoPagoDias) : null,
        email:               form.email               || null,
        telefono:            form.telefono             || null,
        tipo:                form.tipo,
        observaciones:       form.observaciones        || null,
        precioHoraEspecial:  form.precioHoraEspecial  !== "" ? parseFloat(form.precioHoraEspecial)  : null,
        precioPorKmEspecial: form.precioPorKmEspecial !== "" ? parseFloat(form.precioPorKmEspecial) : null,
        mostrarPrecios:      form.mostrarPrecios,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Error al guardar.");
      setLoading(false);
      return;
    }

    router.push(`/clientes/${cliente.id}`);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href={`/clientes/${cliente.id}`}
            className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 transition-colors">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Editar cliente</h1>
            <p className="text-sm text-gray-400 mt-0.5">{cliente.nombre}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/clientes/${cliente.id}`}
            className="px-5 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors">
            Cancelar
          </Link>
          <button form="editar-cliente-form" type="submit" disabled={loading}
            className="flex items-center gap-2 bg-[#0B1120] text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-[#162030] transition-colors disabled:opacity-50 cursor-pointer">
            <Save size={15} />
            {loading ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </div>

      <form id="editar-cliente-form" onSubmit={handleSubmit}>
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">

            {/* Datos generales */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Building2 size={15} className="text-blue-600" />
                </div>
                <h2 className="text-sm font-semibold text-gray-700">Datos generales</h2>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                      Tipo de cliente
                    </label>
                    <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                      {["empresa", "particular"].map((t) => (
                        <button key={t} type="button"
                          onClick={() => setField("tipo", t)}
                          className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
                            form.tipo === t ? "bg-[#0B1120] text-white" : "text-gray-500 hover:bg-gray-50"
                          } ${t === "particular" ? "border-l border-gray-200" : ""}`}>
                          {t === "empresa" ? "Empresa" : "Particular"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                    Nombre <span className="text-red-400">*</span>
                  </label>
                  <input type="text" value={form.nombre} required
                    onChange={(e) => setField("nombre", e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white" />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                    Nombre comercial
                  </label>
                  <input type="text" value={form.nombreComercial}
                    placeholder="Nombre por el que lo conoce el técnico (opcional)"
                    onChange={(e) => setField("nombreComercial", e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white" />
                </div>

                {form.tipo === "empresa" && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                      Razón social
                    </label>
                    <input type="text" value={form.razonSocial}
                      onChange={(e) => setField("razonSocial", e.target.value)}
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white" />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                    CIF / NIF <span className="text-red-400">*</span>
                  </label>
                  <input type="text" value={form.cif} required
                    onChange={(e) => setField("cif", e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white font-mono" />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                    Dirección de facturación
                  </label>
                  <input type="text" value={form.direccionFacturacion}
                    onChange={(e) => setField("direccionFacturacion", e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                      Teléfono
                    </label>
                    <input type="tel" value={form.telefono}
                      onChange={(e) => setField("telefono", e.target.value)}
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                      Email
                    </label>
                    <input type="email" value={form.email}
                      onChange={(e) => setField("email", e.target.value)}
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                    Forma de pago
                  </label>
                  <select value={form.formaPago}
                    onChange={(e) => setField("formaPago", e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white text-gray-700">
                    {FORMAS_PAGO.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                    Plazo de pago
                  </label>
                  <select value={form.plazoPagoDias}
                    onChange={(e) => setField("plazoPagoDias", e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white text-gray-700">
                    <option value="">Sin definir (vencimiento manual)</option>
                    <option value="0">Al contado</option>
                    <option value="15">15 días</option>
                    <option value="30">30 días</option>
                    <option value="45">45 días</option>
                    <option value="60">60 días</option>
                    <option value="90">90 días</option>
                  </select>
                  <p className="text-xs text-gray-400 mt-1">Al facturar a este cliente, la fecha de vencimiento se calculará sola.</p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                    Observaciones
                  </label>
                  <textarea rows={3} value={form.observaciones}
                    onChange={(e) => setField("observaciones", e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white resize-none" />
                </div>
              </div>
            </div>

            {/* Tarifas especiales */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
                <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                  <Euro size={15} className="text-green-600" />
                </div>
                <h2 className="text-sm font-semibold text-gray-700">Tarifas especiales</h2>
              </div>
              <div className="p-5 space-y-4">
                <p className="text-xs text-gray-400">
                  Si se configuran tarifas especiales, se usarán en lugar de las tarifas por defecto de la empresa.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                      Precio / hora especial
                    </label>
                    <div className="relative">
                      <input type="number" min="0" step="0.5"
                        value={form.precioHoraEspecial}
                        onChange={(e) => setField("precioHoraEspecial", e.target.value)}
                        placeholder="Dejar vacío para usar tarifa empresa"
                        className="w-full px-3 py-2.5 pr-8 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">€/h</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                      Precio / km especial
                    </label>
                    <div className="relative">
                      <input type="number" min="0" step="0.01"
                        value={form.precioPorKmEspecial}
                        onChange={(e) => setField("precioPorKmEspecial", e.target.value)}
                        placeholder="Dejar vacío para usar tarifa empresa"
                        className="w-full px-3 py-2.5 pr-12 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">€/km</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Preferencias PDF */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                  <User size={15} className="text-amber-600" />
                </div>
                <h2 className="text-sm font-semibold text-gray-700">Preferencias de impresión</h2>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-700">Mostrar precios en PDF de órdenes</div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      Por defecto los PDFs de órdenes mostrarán o no los precios para este cliente. Se puede cambiar en cada orden.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setField("mostrarPrecios", !form.mostrarPrecios)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                      form.mostrarPrecios ? "bg-[#00C2FF]" : "bg-gray-200"
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      form.mostrarPrecios ? "translate-x-6" : "translate-x-1"
                    }`} />
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                {error}
              </div>
            )}
          </div>

          {/* Columna derecha */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
                Resumen
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tipo</span>
                  <span className="font-medium text-gray-800">
                    {form.tipo === "empresa" ? "Empresa" : "Particular"}
                  </span>
                </div>
                {form.precioHoraEspecial && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Tarifa hora</span>
                    <span className="font-medium text-[#00C2FF]">{form.precioHoraEspecial} €/h</span>
                  </div>
                )}
                {form.precioPorKmEspecial && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Tarifa km</span>
                    <span className="font-medium text-[#00C2FF]">{form.precioPorKmEspecial} €/km</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Precios en PDF</span>
                  <span className={`font-medium ${form.mostrarPrecios ? "text-green-600" : "text-gray-400"}`}>
                    {form.mostrarPrecios ? "Sí" : "No"}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-xl border border-blue-100 p-5">
              <div className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-2">
                Sobre los precios en PDF
              </div>
              <p className="text-xs text-blue-500 leading-relaxed">
                Esta configuración define el valor por defecto al crear nuevas órdenes para este cliente. Siempre puedes cambiarlo en cada orden individualmente.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}