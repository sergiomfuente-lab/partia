"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  cliente: any;
}

export default function EditarClienteForm({ cliente }: Props) {
  const router = useRouter();
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    nombre: cliente.nombre || "",
    razonSocial: cliente.razonSocial || "",
    cif: cliente.cif || "",
    email: cliente.email || "",
    telefono: cliente.telefono || "",
    tipo: cliente.tipo || "empresa",
    direccionFacturacion: cliente.direccionFacturacion || "",
    formaPago: cliente.formaPago || "Transferencia bancaria",
    observaciones: cliente.observaciones || "",
    precioHoraEspecial: cliente.precioHoraEspecial?.toString() || "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setError("");

    const res = await fetch(`/api/clientes/${cliente.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Error al actualizar el cliente");
      setCargando(false);
    } else {
      router.push(`/clientes/${cliente.id}`);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => router.back()} className="text-sm text-gray-400 hover:text-gray-600">← Volver</button>
        <h1 className="text-2xl font-semibold text-gray-900">Editar cliente</h1>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Nombre *</label>
              <input name="nombre" value={form.nombre} onChange={handleChange} required className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#00C2FF] bg-gray-50"/>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Razón social</label>
              <input name="razonSocial" value={form.razonSocial} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#00C2FF] bg-gray-50"/>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">CIF / NIF *</label>
              <input name="cif" value={form.cif} onChange={handleChange} required className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#00C2FF] bg-gray-50"/>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Tipo *</label>
              <select name="tipo" value={form.tipo} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#00C2FF] bg-gray-50">
                <option value="empresa">Empresa</option>
                <option value="autonomo">Autónomo</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Email</label>
              <input name="email" value={form.email} onChange={handleChange} type="email" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#00C2FF] bg-gray-50"/>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Teléfono</label>
              <input name="telefono" value={form.telefono} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#00C2FF] bg-gray-50"/>
            </div>
            <div className="col-span-2">
              <label className="block text-sm text-gray-600 mb-1">Dirección de facturación</label>
              <input name="direccionFacturacion" value={form.direccionFacturacion} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#00C2FF] bg-gray-50"/>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Forma de pago</label>
              <select name="formaPago" value={form.formaPago} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#00C2FF] bg-gray-50">
                <option value="Transferencia bancaria">Transferencia bancaria</option>
                <option value="Efectivo">Efectivo</option>
                <option value="Cheque">Cheque</option>
                <option value="Domiciliación bancaria">Domiciliación bancaria</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Precio hora especial (€/h)</label>
              <input name="precioHoraEspecial" value={form.precioHoraEspecial} onChange={handleChange} type="number" step="0.01" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#00C2FF] bg-gray-50"/>
            </div>
            <div className="col-span-2">
              <label className="block text-sm text-gray-600 mb-1">Observaciones</label>
              <textarea name="observaciones" value={form.observaciones} onChange={handleChange} rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#00C2FF] bg-gray-50"/>
            </div>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => router.back()} className="flex-1 border border-gray-200 rounded-lg py-2.5 text-sm text-gray-500 hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit" disabled={cargando} className="flex-1 bg-[#0B1120] text-white rounded-lg py-2.5 text-sm font-medium hover:bg-[#162030] disabled:opacity-50">
              {cargando ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}