"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users, Plus, Pencil, Power, PowerOff,
  Save, X, Check,
} from "lucide-react";

type Usuario = {
  id:        string;
  nombre:    string;
  email:     string;
  rol:       string;
  activo:    boolean;
  createdAt: string;
};

const ROL_CONFIG: Record<string, { label: string; className: string }> = {
  superadmin:     { label: "Superadmin",     className: "bg-purple-50 text-purple-700" },
  administrador:  { label: "Administrador",  className: "bg-blue-50 text-blue-700" },
  tecnico:        { label: "Técnico",        className: "bg-green-50 text-green-700" },
  administrativo: { label: "Administrativo", className: "bg-amber-50 text-amber-700" },
};

export default function UsuariosPanel({
  usuarios: usuariosIniciales,
  rolActual,
}: {
  usuarios: Usuario[];
  rolActual: string;
}) {
  const router  = useRouter();
  const [usuarios, setUsuarios] = useState<Usuario[]>(usuariosIniciales);
  const [editando, setEditando] = useState<string | null>(null);
  const [error, setError]       = useState("");

  // Nuevo usuario
  const [mostrarForm, setMostrarForm] = useState(false);
  const [nuevoForm, setNuevoForm]     = useState({
    nombre: "", email: "", password: "", rol: "tecnico",
  });
  const [creando, setCreando] = useState(false);

  // Edición inline
  const [editForm, setEditForm] = useState<{ nombre: string; rol: string }>({
    nombre: "", rol: "",
  });

  const rolesDisponibles = rolActual === "superadmin"
    ? ["superadmin", "administrador", "tecnico", "administrativo"]
    : ["administrador", "tecnico", "administrativo"];

  const handleEditar = (u: Usuario) => {
    setEditando(u.id);
    setEditForm({ nombre: u.nombre, rol: u.rol });
  };

  const handleGuardar = async (id: string) => {
    const res = await fetch(`/api/usuarios/${id}`, {
      method:  "PUT",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(editForm),
    });
    if (res.ok) {
      const updated = await res.json();
      setUsuarios((prev) => prev.map((u) => u.id === id ? { ...u, ...updated } : u));
      setEditando(null);
    }
  };

  const handleToggleActivo = async (u: Usuario) => {
    const res = await fetch(`/api/usuarios/${u.id}`, {
      method:  "PUT",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ activo: !u.activo }),
    });
    if (res.ok) {
      setUsuarios((prev) =>
        prev.map((x) => x.id === u.id ? { ...x, activo: !x.activo } : x)
      );
    }
  };

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setCreando(true);

    const res = await fetch("/api/usuarios", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ ...nuevoForm, rolNuevo: nuevoForm.rol }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Error al crear el usuario.");
      setCreando(false);
      return;
    }

    const nuevo = await res.json();
    setUsuarios((prev) => [...prev, nuevo]);
    setNuevoForm({ nombre: "", email: "", password: "", rol: "tecnico" });
    setMostrarForm(false);
    setCreando(false);
    router.refresh();
  };

  return (
    <div className="p-8">
      {/* Cabecera */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Usuarios</h1>
          <p className="text-sm text-gray-400 mt-1">
            {usuarios.length} usuario{usuarios.length !== 1 ? "s" : ""} en esta empresa
          </p>
        </div>
        <button
          onClick={() => setMostrarForm(true)}
          className="flex items-center gap-2 bg-[#0B1120] text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-[#162030] transition-colors cursor-pointer"
        >
          <Plus size={16} />
          Nuevo usuario
        </button>
      </div>

      {/* Formulario nuevo usuario */}
      {mostrarForm && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700">Nuevo usuario</h2>
            <button
              onClick={() => { setMostrarForm(false); setError(""); }}
              className="text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
          <form onSubmit={handleCrear} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                Nombre <span className="text-red-400">*</span>
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
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                Email <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                value={nuevoForm.email}
                onChange={(e) => setNuevoForm((p) => ({ ...p, email: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                Contraseña <span className="text-red-400">*</span>
              </label>
              <input
                type="password"
                value={nuevoForm.password}
                onChange={(e) => setNuevoForm((p) => ({ ...p, password: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                Rol
              </label>
              <select
                value={nuevoForm.rol}
                onChange={(e) => setNuevoForm((p) => ({ ...p, rol: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white text-gray-700"
              >
                {rolesDisponibles.map((r) => (
                  <option key={r} value={r}>{ROL_CONFIG[r]?.label ?? r}</option>
                ))}
              </select>
            </div>
            {error && (
              <div className="col-span-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                {error}
              </div>
            )}
            <div className="col-span-2 flex justify-end gap-3">
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
                {creando ? "Creando..." : "Crear usuario"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="grid grid-cols-12 px-5 py-3 bg-gray-50 border-b border-gray-100">
          <div className="col-span-3 text-xs text-gray-400 uppercase tracking-wide">Nombre</div>
          <div className="col-span-3 text-xs text-gray-400 uppercase tracking-wide">Email</div>
          <div className="col-span-2 text-xs text-gray-400 uppercase tracking-wide">Rol</div>
          <div className="col-span-1 text-xs text-gray-400 uppercase tracking-wide text-center">Estado</div>
          <div className="col-span-1 text-xs text-gray-400 uppercase tracking-wide">Alta</div>
          <div className="col-span-2 text-xs text-gray-400 uppercase tracking-wide text-center">Acciones</div>
        </div>

        {usuarios.length === 0 ? (
          <div className="text-center py-16">
            <Users size={48} className="mx-auto text-gray-200 mb-4" />
            <p className="text-gray-400 text-sm">No hay usuarios todavía</p>
          </div>
        ) : (
          usuarios.map((u) => {
            const rolInfo = ROL_CONFIG[u.rol] ?? { label: u.rol, className: "bg-gray-100 text-gray-500" };
            const isEditing = editando === u.id;

            return (
              <div key={u.id} className="grid grid-cols-12 px-5 py-4 border-b border-gray-50 items-center hover:bg-gray-50 transition-colors">
                {/* Nombre */}
                <div className="col-span-3">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.nombre}
                      onChange={(e) => setEditForm((p) => ({ ...p, nombre: e.target.value }))}
                      className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white"
                    />
                  ) : (
                    <div className="text-sm font-medium text-gray-800">{u.nombre}</div>
                  )}
                </div>

                {/* Email */}
                <div className="col-span-3 text-sm text-gray-500 truncate">{u.email}</div>

                {/* Rol */}
                <div className="col-span-2">
                  {isEditing ? (
                    <select
                      value={editForm.rol}
                      onChange={(e) => setEditForm((p) => ({ ...p, rol: e.target.value }))}
                      className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white text-gray-700"
                    >
                      {rolesDisponibles.map((r) => (
                        <option key={r} value={r}>{ROL_CONFIG[r]?.label ?? r}</option>
                      ))}
                    </select>
                  ) : (
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${rolInfo.className}`}>
                      {rolInfo.label}
                    </span>
                  )}
                </div>

                {/* Estado */}
                <div className="col-span-1 flex justify-center">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    u.activo ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
                  }`}>
                    {u.activo ? "Activo" : "Inactivo"}
                  </span>
                </div>

                {/* Alta */}
                <div className="col-span-1 text-xs text-gray-400">
                  {new Date(u.createdAt).toLocaleDateString("es-ES")}
                </div>

                {/* Acciones */}
                <div className="col-span-2 flex gap-2 justify-center">
                  {isEditing ? (
                    <>
                      <button
                        onClick={() => handleGuardar(u.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-green-200 text-green-600 hover:bg-green-50 transition-colors cursor-pointer"
                        title="Guardar"
                      >
                        <Check size={15} />
                      </button>
                      <button
                        onClick={() => setEditando(null)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 transition-colors cursor-pointer"
                        title="Cancelar"
                      >
                        <X size={15} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleEditar(u)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200 transition-colors cursor-pointer"
                        title="Editar"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => handleToggleActivo(u)}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-colors cursor-pointer ${
                          u.activo
                            ? "border-gray-200 text-gray-400 hover:bg-red-50 hover:text-red-500 hover:border-red-200"
                            : "border-green-200 text-green-600 hover:bg-green-50"
                        }`}
                        title={u.activo ? "Desactivar" : "Activar"}
                      >
                        {u.activo ? <PowerOff size={15} /> : <Power size={15} />}
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}