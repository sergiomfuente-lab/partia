"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2, Plus, Pencil, Power, PowerOff,
  Save, X, Check, LogIn, Users, ClipboardList,
} from "lucide-react";

type Empresa = {
  id:              string;
  nombre:          string;
  nombreFiscal:    string | null;
  cifNif:          string | null;
  direccionFiscal: string | null;
  codigoPostal:    string | null;
  ciudad:          string | null;
  provincia:       string | null;
  telefono:        string | null;
  emailFacturacion:string | null;
  iban:            string | null;
  precioHora:      number;
  precioPorKm:     number;
  activa:          boolean;
  createdAt:       string;
  _count:          { usuarios: number; clientes: number };
};

export default function SuperadminPanel({
  empresas: empresasIniciales,
  empresaActivaId: empresaActivaIdInicial,
}: {
  empresas: Empresa[];
  empresaActivaId: string | null;
}) {
  const router = useRouter();
  const [empresas, setEmpresas]           = useState<Empresa[]>(empresasIniciales);
  const [empresaActivaId, setEmpresaActivaId] = useState<string | null>(empresaActivaIdInicial);
  const [mostrarForm, setMostrarForm]     = useState(false);
  const [editando, setEditando]           = useState<string | null>(null);
  const [editForm, setEditForm]           = useState<Partial<Empresa>>({});
  const [error, setError]                 = useState("");
  const [seleccionando, setSeleccionando] = useState(false);

  // Form nueva empresa
  const [nuevoForm, setNuevoForm] = useState({
    nombre: "", nombreFiscal: "", cifNif: "",
    direccionFiscal: "", codigoPostal: "", ciudad: "",
    provincia: "", telefono: "", emailFacturacion: "", iban: "",
    precioHora: "55", precioPorKm: "0.35",
    adminNombre: "", adminEmail: "", adminPassword: "",
  });
  const [creando, setCreando] = useState(false);

  const handleSeleccionarEmpresa = async (empresaId: string | null) => {
    setSeleccionando(true);
    const res = await fetch("/api/superadmin/seleccionar-empresa", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ empresaId }),
    });
    if (res.ok) {
      setEmpresaActivaId(empresaId);
      router.refresh();
    }
    setSeleccionando(false);
  };

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setCreando(true);

    const res = await fetch("/api/superadmin/empresas", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(nuevoForm),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Error al crear la empresa.");
      setCreando(false);
      return;
    }

    const nueva = await res.json();
    setEmpresas((prev) => [nueva, ...prev]);
    setNuevoForm({
      nombre: "", nombreFiscal: "", cifNif: "",
      direccionFiscal: "", codigoPostal: "", ciudad: "",
      provincia: "", telefono: "", emailFacturacion: "", iban: "",
      precioHora: "55", precioPorKm: "0.35",
      adminNombre: "", adminEmail: "", adminPassword: "",
    });
    setMostrarForm(false);
    setCreando(false);
  };

  const handleEditar = (e: Empresa) => {
    setEditando(e.id);
    setEditForm({
      nombre:          e.nombre,
      nombreFiscal:    e.nombreFiscal    ?? "",
      cifNif:          e.cifNif          ?? "",
      direccionFiscal: e.direccionFiscal ?? "",
      codigoPostal:    e.codigoPostal    ?? "",
      ciudad:          e.ciudad          ?? "",
      provincia:       e.provincia       ?? "",
      telefono:        e.telefono        ?? "",
      emailFacturacion:e.emailFacturacion?? "",
      iban:            e.iban            ?? "",
      precioHora:      e.precioHora,
      precioPorKm:     e.precioPorKm,
    });
  };

  const handleGuardar = async (id: string) => {
    const res = await fetch(`/api/superadmin/empresas/${id}`, {
      method:  "PUT",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(editForm),
    });
    if (res.ok) {
      const updated = await res.json();
      setEmpresas((prev) => prev.map((e) => e.id === id ? { ...e, ...updated } : e));
      setEditando(null);
    }
  };

  const handleToggleActiva = async (e: Empresa) => {
    const res = await fetch(`/api/superadmin/empresas/${e.id}`, {
      method:  "PUT",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ activa: !e.activa }),
    });
    if (res.ok) {
      setEmpresas((prev) =>
        prev.map((x) => x.id === e.id ? { ...x, activa: !x.activa } : x)
      );
    }
  };

  return (
    <div className="p-8">
      {/* Cabecera */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Superadmin</h1>
          <p className="text-sm text-gray-400 mt-1">
            {empresas.length} empresa{empresas.length !== 1 ? "s" : ""} registrada{empresas.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => setMostrarForm(true)}
          className="flex items-center gap-2 bg-[#0B1120] text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-[#162030] transition-colors cursor-pointer"
        >
          <Plus size={16} />
          Nueva empresa
        </button>
      </div>

      {/* Empresa activa */}
      {empresaActivaId && (
        <div className="bg-[#00C2FF]/10 border border-[#00C2FF]/30 rounded-xl p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#00C2FF] rounded-lg flex items-center justify-center">
              <Building2 size={15} className="text-[#0B1120]" />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-800">
                Trabajando como: <span className="text-[#00C2FF] font-semibold">
                  {empresas.find((e) => e.id === empresaActivaId)?.nombre}
                </span>
              </div>
              <div className="text-xs text-gray-400">Estás viendo los datos de esta empresa</div>
            </div>
          </div>
          <button
            onClick={() => handleSeleccionarEmpresa(null)}
            disabled={seleccionando}
            className="text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Salir de empresa
          </button>
        </div>
      )}

      {/* Formulario nueva empresa */}
      {mostrarForm && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-semibold text-gray-700">Nueva empresa</h2>
            <button
              onClick={() => { setMostrarForm(false); setError(""); }}
              className="text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleCrear} className="space-y-6">
            {/* Datos empresa */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Datos de la empresa
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-3">
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                    Nombre comercial <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={nuevoForm.nombre}
                    onChange={(e) => setNuevoForm((p) => ({ ...p, nombre: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Razón social</label>
                  <input type="text" value={nuevoForm.nombreFiscal}
                    onChange={(e) => setNuevoForm((p) => ({ ...p, nombreFiscal: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">CIF / NIF</label>
                  <input type="text" value={nuevoForm.cifNif}
                    onChange={(e) => setNuevoForm((p) => ({ ...p, cifNif: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Teléfono</label>
                  <input type="tel" value={nuevoForm.telefono}
                    onChange={(e) => setNuevoForm((p) => ({ ...p, telefono: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Dirección fiscal</label>
                  <input type="text" value={nuevoForm.direccionFiscal}
                    onChange={(e) => setNuevoForm((p) => ({ ...p, direccionFiscal: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">CP</label>
                  <input type="text" value={nuevoForm.codigoPostal}
                    onChange={(e) => setNuevoForm((p) => ({ ...p, codigoPostal: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Ciudad</label>
                  <input type="text" value={nuevoForm.ciudad}
                    onChange={(e) => setNuevoForm((p) => ({ ...p, ciudad: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Provincia</label>
                  <input type="text" value={nuevoForm.provincia}
                    onChange={(e) => setNuevoForm((p) => ({ ...p, provincia: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Precio/hora</label>
                  <input type="number" min="0" step="0.5" value={nuevoForm.precioHora}
                    onChange={(e) => setNuevoForm((p) => ({ ...p, precioHora: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Precio/km</label>
                  <input type="number" min="0" step="0.01" value={nuevoForm.precioPorKm}
                    onChange={(e) => setNuevoForm((p) => ({ ...p, precioPorKm: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white" />
                </div>
              </div>
            </div>

            {/* Admin inicial */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Administrador inicial
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                    Nombre <span className="text-red-400">*</span>
                  </label>
                  <input type="text" value={nuevoForm.adminNombre}
                    onChange={(e) => setNuevoForm((p) => ({ ...p, adminNombre: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white"
                    required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                    Email <span className="text-red-400">*</span>
                  </label>
                  <input type="email" value={nuevoForm.adminEmail}
                    onChange={(e) => setNuevoForm((p) => ({ ...p, adminEmail: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white"
                    required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                    Contraseña temporal <span className="text-red-400">*</span>
                  </label>
                  <input type="text" value={nuevoForm.adminPassword}
                    onChange={(e) => setNuevoForm((p) => ({ ...p, adminPassword: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white"
                    required />
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                El administrador deberá cambiar la contraseña al iniciar sesión por primera vez.
              </p>
            </div>

            {error && (
              <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => { setMostrarForm(false); setError(""); }}
                className="px-5 py-2.5 text-sm text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={creando}
                className="flex items-center gap-2 bg-[#0B1120] text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-[#162030] transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Save size={15} />
                {creando ? "Creando..." : "Crear empresa"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de empresas */}
      <div className="space-y-4">
        {empresas.map((e) => {
          const isEditing  = editando === e.id;
          const isActiva   = empresaActivaId === e.id;

          return (
            <div
              key={e.id}
              className={`bg-white rounded-xl border p-5 transition-all ${
                isActiva ? "border-[#00C2FF] shadow-sm" : "border-gray-100"
              }`}
            >
              {isEditing ? (
                /* Modo edición */
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-3">
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Nombre</label>
                      <input type="text" value={editForm.nombre as string}
                        onChange={(ev) => setEditForm((p) => ({ ...p, nombre: ev.target.value }))}
                        className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Razón social</label>
                      <input type="text" value={editForm.nombreFiscal as string}
                        onChange={(ev) => setEditForm((p) => ({ ...p, nombreFiscal: ev.target.value }))}
                        className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">CIF / NIF</label>
                      <input type="text" value={editForm.cifNif as string}
                        onChange={(ev) => setEditForm((p) => ({ ...p, cifNif: ev.target.value }))}
                        className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white font-mono" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Teléfono</label>
                      <input type="tel" value={editForm.telefono as string}
                        onChange={(ev) => setEditForm((p) => ({ ...p, telefono: ev.target.value }))}
                        className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Precio/hora</label>
                      <input type="number" value={editForm.precioHora as number}
                        onChange={(ev) => setEditForm((p) => ({ ...p, precioHora: parseFloat(ev.target.value) }))}
                        className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Precio/km</label>
                      <input type="number" value={editForm.precioPorKm as number}
                        onChange={(ev) => setEditForm((p) => ({ ...p, precioPorKm: parseFloat(ev.target.value) }))}
                        className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white" />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3">
                    <button onClick={() => setEditando(null)}
                      className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 cursor-pointer">
                      Cancelar
                    </button>
                    <button onClick={() => handleGuardar(e.id)}
                      className="flex items-center gap-2 bg-[#0B1120] text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#162030] transition-colors cursor-pointer">
                      <Check size={14} />
                      Guardar
                    </button>
                  </div>
                </div>
              ) : (
                /* Modo vista */
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-bold ${
                      e.activa ? "bg-[#0B1120]" : "bg-gray-300"
                    }`}>
                      {e.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">{e.nombre}</span>
                        {isActiva && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-[#00C2FF]/10 text-[#00C2FF] font-medium">
                            Activa
                          </span>
                        )}
                        {!e.activa && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-400 font-medium">
                            Desactivada
                          </span>
                        )}
                      </div>
                      {e.cifNif && (
                        <div className="text-xs text-gray-400 font-mono">{e.cifNif}</div>
                      )}
                      <div className="flex items-center gap-4 mt-1">
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Users size={11} />
                          {e._count.usuarios} usuario{e._count.usuarios !== 1 ? "s" : ""}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <ClipboardList size={11} />
                          {e._count.clientes} cliente{e._count.clientes !== 1 ? "s" : ""}
                        </span>
                        <span className="text-xs text-gray-400">
                          {e.precioHora}€/h · {e.precioPorKm}€/km
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Entrar como empresa */}
                    <button
                      onClick={() => handleSeleccionarEmpresa(isActiva ? null : e.id)}
                      disabled={seleccionando || !e.activa}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                        isActiva
                          ? "bg-[#00C2FF]/10 text-[#00C2FF] hover:bg-[#00C2FF]/20"
                          : "border border-gray-200 text-gray-500 hover:bg-gray-50"
                      } disabled:opacity-50`}
                    >
                      <LogIn size={14} />
                      {isActiva ? "Salir" : "Entrar"}
                    </button>

                    {/* Editar */}
                    <button
                      onClick={() => handleEditar(e)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200 transition-colors cursor-pointer"
                      title="Editar"
                    >
                      <Pencil size={15} />
                    </button>

                    {/* Activar/Desactivar */}
                    <button
                      onClick={() => handleToggleActiva(e)}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-colors cursor-pointer ${
                        e.activa
                          ? "border-gray-200 text-gray-400 hover:bg-red-50 hover:text-red-500 hover:border-red-200"
                          : "border-green-200 text-green-600 hover:bg-green-50"
                      }`}
                      title={e.activa ? "Desactivar" : "Activar"}
                    >
                      {e.activa ? <PowerOff size={15} /> : <Power size={15} />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}