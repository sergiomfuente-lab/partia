"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  User, Euro, FileText, Wrench,
  Save, Plus, Power, PowerOff, Check,
  Hash, Image, Shield, CreditCard, Star,
} from "lucide-react";

type TipoServicio = {
  id: string; nombre: string; unidad: string;
  activo: boolean; orden: number;
};

type Serie = {
  id:            string;
  nombre:        string;
  prefijo:       string;
  contadorActual:number;
  prefijoAbono:  string;
  contadorAbono: number;
  predeterminada:boolean;
  activa:        boolean;
};

const UNIDADES = [
  { value: "h",  label: "Horas (h)" },
  { value: "km", label: "Kilómetros (km)" },
  { value: "ud", label: "Unidades (ud)" },
];

export default function ConfiguracionPanel({
  usuario, tiposServicio: tiposIniciales,
  empresa: empresaInicial, contadorActual, anioActual,
  series: seriesIniciales,
}: {
  usuario: any;
  tiposServicio: TipoServicio[];
  empresa: any;
  contadorActual: number;
  anioActual: number;
  series: Serie[];
}) {
  const router = useRouter();
  const [pestana, setPestana]   = useState("perfil");
  const [saved, setSaved]       = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const logoInputRef            = useRef<HTMLInputElement>(null);

  // Perfil
  const [perfil, setPerfil] = useState({
    nombre:      usuario.nombre      ?? "",
    precioHora:  String(usuario.precioHora  ?? 55),
    precioPorKm: String(usuario.precioPorKm ?? 0.35),
  });

  // Fiscal
  const [fiscal, setFiscal] = useState({
    nombreFiscal:     empresaInicial?.nombreFiscal     ?? "",
    cifNif:           empresaInicial?.cifNif           ?? "",
    direccionFiscal:  empresaInicial?.direccionFiscal  ?? "",
    codigoPostal:     empresaInicial?.codigoPostal     ?? "",
    ciudad:           empresaInicial?.ciudad           ?? "",
    provincia:        empresaInicial?.provincia        ?? "",
    telefono:         empresaInicial?.telefono         ?? "",
    emailFacturacion: empresaInicial?.emailFacturacion ?? "",
    iban:             empresaInicial?.iban             ?? "",
  });

  // Veri*Factu / RRSIF — configuración de facturación electrónica de la empresa
  const [verifactu, setVerifactu] = useState({
    facturacionInmutableActiva: empresaInicial?.facturacionInmutableActiva ?? false,
    regimenFiscalVerifactu:     empresaInicial?.regimenFiscalVerifactu     ?? "",
    verifactuModalidad:         empresaInicial?.verifactuModalidad         ?? "",
    verifactuFechaLimite:       empresaInicial?.verifactuFechaLimite
      ? String(empresaInicial.verifactuFechaLimite).slice(0, 10)
      : "",
    verifactuNotasGestoria:     empresaInicial?.verifactuNotasGestoria     ?? "",
  });
  const [savingVerifactu, setSavingVerifactu] = useState(false);
  const [savedVerifactu, setSavedVerifactu]   = useState(false);
  const setVField = (f: string, v: string | boolean) => setVerifactu((p) => ({ ...p, [f]: v }));

  // Empresa
  const [textoRgpd, setTextoRgpd]     = useState(empresaInicial?.textoRgpd ?? "");
  const [logoBase64, setLogoBase64]   = useState(empresaInicial?.logoBase64 ?? "");
  const [logoPreview, setLogoPreview] = useState(empresaInicial?.logoBase64 ?? "");

  // Contador facturas
  const [contador, setContador]               = useState(String(contadorActual));
  const [savingContador, setSavingContador]   = useState(false);
  const [savedContador, setSavedContador]     = useState(false);

  // Tipos de servicio
  const [tipos, setTipos]             = useState<TipoServicio[]>(tiposIniciales);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoUnidad, setNuevoUnidad] = useState("h");
  const [addingTipo, setAddingTipo]   = useState(false);

  // Series de facturación
  const [series, setSeries]           = useState<Serie[]>(seriesIniciales);
  const [mostrarNuevaSerie, setMostrarNuevaSerie] = useState(false);
  const [nuevaSerie, setNuevaSerie]   = useState({
    nombre: "", prefijo: "", contadorActual: "0",
    prefijoAbono: "", contadorAbono: "0",
  });
  const [addingSerie, setAddingSerie] = useState(false);
  const [savingSerie, setSavingSerie] = useState<string | null>(null);

  const setPField = (f: string, v: string) => setPerfil((p) => ({ ...p, [f]: v }));
  const setFField = (f: string, v: string) => setFiscal((p) => ({ ...p, [f]: v }));

  const showSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  // Guardar perfil + fiscal
  const handleSave = async () => {
    setLoading(true); setError("");
    const res = await fetch("/api/configuracion", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre:      perfil.nombre,
        nombreFiscal:     fiscal.nombreFiscal,
        cifNif:           fiscal.cifNif,
        direccionFiscal:  fiscal.direccionFiscal,
        codigoPostal:     fiscal.codigoPostal,
        ciudad:           fiscal.ciudad,
        provincia:        fiscal.provincia,
        telefono:         fiscal.telefono,
        emailFacturacion: fiscal.emailFacturacion,
        iban:             fiscal.iban,
        precioHora:  parseFloat(perfil.precioHora)  || 55,
        precioPorKm: parseFloat(perfil.precioPorKm) || 0.35,
      }),
    });
    if (!res.ok) { setError("Error al guardar."); setLoading(false); return; }
    showSaved(); setLoading(false); router.refresh();
  };

  // Guardar empresa (RGPD + logo)
  const handleSaveEmpresa = async () => {
    setLoading(true); setError("");
    const res = await fetch("/api/empresa", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ textoRgpd, logoBase64 }),
    });
    if (!res.ok) { setError("Error al guardar."); setLoading(false); return; }
    showSaved(); setLoading(false); router.refresh();
  };

  // Guardar configuración Veri*Factu / RRSIF
  const handleSaveVerifactu = async () => {
    setSavingVerifactu(true); setError("");
    const res = await fetch("/api/configuracion", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        facturacionInmutableActiva: verifactu.facturacionInmutableActiva,
        regimenFiscalVerifactu:     verifactu.regimenFiscalVerifactu || null,
        verifactuModalidad:         verifactu.verifactuModalidad || null,
        verifactuFechaLimite:       verifactu.verifactuFechaLimite || null,
        verifactuNotasGestoria:     verifactu.verifactuNotasGestoria,
      }),
    });
    if (!res.ok) { setError("Error al guardar."); setSavingVerifactu(false); return; }
    setSavedVerifactu(true);
    setTimeout(() => setSavedVerifactu(false), 3000);
    setSavingVerifactu(false);
    router.refresh();
  };

  // Guardar contador facturas
  const handleSaveContador = async () => {
    setSavingContador(true);
    const res = await fetch("/api/facturas/contador", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ anio: anioActual, contador: parseInt(contador) || 0 }),
    });
    if (res.ok) {
      setSavedContador(true);
      setTimeout(() => setSavedContador(false), 3000);
    }
    setSavingContador(false);
  };

  // Subir logo
  const handleLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setLogoBase64(base64);
      setLogoPreview(base64);
    };
    reader.readAsDataURL(file);
  };

  // Tipos de servicio
  const handleToggleTipo = async (tipo: TipoServicio) => {
    const res = await fetch(`/api/tipos-servicio/${tipo.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activo: !tipo.activo }),
    });
    if (res.ok) setTipos((prev) => prev.map((t) => t.id === tipo.id ? { ...t, activo: !t.activo } : t));
  };

  const handleAddTipo = async () => {
    if (!nuevoNombre.trim()) return;
    setAddingTipo(true);
    const res = await fetch("/api/tipos-servicio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre: nuevoNombre, unidad: nuevoUnidad }),
    });
    if (res.ok) {
      const nuevo = await res.json();
      setTipos((prev) => [...prev, nuevo]);
      setNuevoNombre(""); setNuevoUnidad("h");
    }
    setAddingTipo(false);
  };

  // Series de facturación
  const handleAddSerie = async () => {
    if (!nuevaSerie.nombre.trim() || !nuevaSerie.prefijo.trim()) return;
    setAddingSerie(true);
    const res = await fetch("/api/series-facturacion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre:         nuevaSerie.nombre,
        prefijo:        nuevaSerie.prefijo,
        contadorActual: parseInt(nuevaSerie.contadorActual) || 0,
        prefijoAbono:   nuevaSerie.prefijoAbono,
        contadorAbono:  parseInt(nuevaSerie.contadorAbono) || 0,
      }),
    });
    if (res.ok) {
      const nueva = await res.json();
      setSeries((prev) => [...prev, nueva]);
      setNuevaSerie({ nombre: "", prefijo: "", contadorActual: "0", prefijoAbono: "", contadorAbono: "0" });
      setMostrarNuevaSerie(false);
    }
    setAddingSerie(false);
  };

  const handleToggleSerie = async (serie: Serie) => {
    const res = await fetch(`/api/series-facturacion/${serie.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activa: !serie.activa }),
    });
    if (res.ok) setSeries((prev) => prev.map((s) => s.id === serie.id ? { ...s, activa: !s.activa } : s));
  };

  const handlePredeterminada = async (serie: Serie) => {
    const res = await fetch(`/api/series-facturacion/${serie.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ predeterminada: true }),
    });
    if (res.ok) {
      setSeries((prev) => prev.map((s) => ({ ...s, predeterminada: s.id === serie.id })));
    }
  };

  const handleGuardarContadorSerie = async (serie: Serie, nuevoContador: number, nuevoContadorAbono: number) => {
    setSavingSerie(serie.id);
    const res = await fetch(`/api/series-facturacion/${serie.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contadorActual: nuevoContador, contadorAbono: nuevoContadorAbono }),
    });
    if (res.ok) {
      const updated = await res.json();
      setSeries((prev) => prev.map((s) => s.id === serie.id ? { ...s, ...updated } : s));
    }
    setSavingSerie(null);
  };

  const pestanas = [
    { id: "perfil",    label: "Perfil y tarifas",      icon: <User size={15} /> },
    { id: "fiscal",    label: "Datos fiscales",         icon: <FileText size={15} /> },
    { id: "empresa",   label: "Empresa",                icon: <Image size={15} /> },
    { id: "series",    label: "Series facturación",     icon: <CreditCard size={15} /> },
    { id: "servicios", label: "Tipos de servicio",      icon: <Wrench size={15} /> },
    { id: "contador",  label: "Contador facturas",      icon: <Hash size={15} /> },
    { id: "verifactu", label: "Veri*Factu",              icon: <Shield size={15} /> },
  ];

  const showSaveButton   = ["perfil", "fiscal"].includes(pestana);
  const showEmpresaButton = pestana === "empresa";

  return (
    <div className="p-8">
      {/* Cabecera */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Configuración</h1>
          <p className="text-sm text-gray-400 mt-1">Gestiona tu perfil, tarifas y datos de empresa</p>
        </div>
        {showSaveButton && (
          <button onClick={handleSave} disabled={loading}
            className="flex items-center gap-2 bg-[#0B1120] text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-[#162030] transition-colors disabled:opacity-50 cursor-pointer">
            {saved ? <Check size={15} /> : <Save size={15} />}
            {saved ? "¡Guardado!" : loading ? "Guardando..." : "Guardar cambios"}
          </button>
        )}
        {showEmpresaButton && (
          <button onClick={handleSaveEmpresa} disabled={loading}
            className="flex items-center gap-2 bg-[#0B1120] text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-[#162030] transition-colors disabled:opacity-50 cursor-pointer">
            {saved ? <Check size={15} /> : <Save size={15} />}
            {saved ? "¡Guardado!" : loading ? "Guardando..." : "Guardar cambios"}
          </button>
        )}
        {pestana === "verifactu" && (
          <button onClick={handleSaveVerifactu} disabled={savingVerifactu}
            className="flex items-center gap-2 bg-[#0B1120] text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-[#162030] transition-colors disabled:opacity-50 cursor-pointer">
            {savedVerifactu ? <Check size={15} /> : <Save size={15} />}
            {savedVerifactu ? "¡Guardado!" : savingVerifactu ? "Guardando..." : "Guardar cambios"}
          </button>
        )}
      </div>

      {/* Pestañas */}
      <div className="flex border-b border-gray-200 mb-8 overflow-x-auto">
        {pestanas.map((p) => (
          <button key={p.id} onClick={() => setPestana(p.id)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              pestana === p.id
                ? "border-[#00C2FF] text-[#0B1120]"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}>
            {p.icon}{p.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>
      )}

      {/* Pestaña Perfil */}
      {pestana === "perfil" && (
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <User size={15} className="text-blue-600" />
                </div>
                <h2 className="text-sm font-semibold text-gray-700">Datos de acceso</h2>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Nombre</label>
                  <input type="text" value={perfil.nombre}
                    onChange={(e) => setPField("nombre", e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Email</label>
                  <input type="email" value={usuario.email} disabled
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-400 cursor-not-allowed" />
                  <p className="text-xs text-gray-400 mt-1">El email no se puede cambiar</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
                <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                  <Euro size={15} className="text-green-600" />
                </div>
                <h2 className="text-sm font-semibold text-gray-700">Tarifas por defecto</h2>
              </div>
              <div className="p-5 space-y-4">
                <p className="text-xs text-gray-400">Estas tarifas se aplican a todos los clientes salvo que tengan tarifa especial.</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Precio / hora</label>
                    <div className="relative">
                      <input type="number" min="0" step="0.5" value={perfil.precioHora}
                        onChange={(e) => setPField("precioHora", e.target.value)}
                        className="w-full px-3 py-2.5 pr-8 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">€/h</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Precio / km</label>
                    <div className="relative">
                      <input type="number" min="0" step="0.01" value={perfil.precioPorKm}
                        onChange={(e) => setPField("precioPorKm", e.target.value)}
                        className="w-full px-3 py-2.5 pr-12 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">€/km</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Resumen</div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Precio/hora base</span>
                  <span className="font-medium text-gray-800">{parseFloat(perfil.precioHora) || 0} €/h</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Precio/km base</span>
                  <span className="font-medium text-gray-800">{parseFloat(perfil.precioPorKm) || 0} €/km</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pestaña Fiscal */}
      {pestana === "fiscal" && (
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2">
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
                <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                  <FileText size={15} className="text-purple-600" />
                </div>
                <h2 className="text-sm font-semibold text-gray-700">Datos fiscales</h2>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Nombre fiscal / Razón social</label>
                    <input type="text" value={fiscal.nombreFiscal} onChange={(e) => setFField("nombreFiscal", e.target.value)}
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">CIF / NIF</label>
                    <input type="text" value={fiscal.cifNif} onChange={(e) => setFField("cifNif", e.target.value)}
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white font-mono" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Dirección fiscal</label>
                  <input type="text" value={fiscal.direccionFiscal} onChange={(e) => setFField("direccionFiscal", e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Código postal</label>
                    <input type="text" value={fiscal.codigoPostal} onChange={(e) => setFField("codigoPostal", e.target.value)}
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Ciudad</label>
                    <input type="text" value={fiscal.ciudad} onChange={(e) => setFField("ciudad", e.target.value)}
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Provincia</label>
                    <input type="text" value={fiscal.provincia} onChange={(e) => setFField("provincia", e.target.value)}
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Teléfono</label>
                    <input type="tel" value={fiscal.telefono} onChange={(e) => setFField("telefono", e.target.value)}
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Email de facturación</label>
                    <input type="email" value={fiscal.emailFacturacion} onChange={(e) => setFField("emailFacturacion", e.target.value)}
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">IBAN</label>
                  <input type="text" value={fiscal.iban} onChange={(e) => setFField("iban", e.target.value)}
                    placeholder="ES00 0000 0000 0000 0000 0000"
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white font-mono" />
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">¿Para qué sirve?</div>
              <p className="text-xs text-gray-500 leading-relaxed mb-3">Estos datos aparecerán en las facturas que generes para tus clientes.</p>
              <p className="text-xs text-gray-500 leading-relaxed">El IBAN aparecerá en el pie de la factura como dato de pago.</p>
            </div>
            {(fiscal.nombreFiscal || fiscal.cifNif) && (
              <div className="bg-gray-50 rounded-xl border border-gray-200 p-5">
                <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Vista previa</div>
                <div className="text-sm space-y-1">
                  {fiscal.nombreFiscal && <div className="font-semibold text-gray-800">{fiscal.nombreFiscal}</div>}
                  {fiscal.cifNif      && <div className="text-gray-500 font-mono text-xs">{fiscal.cifNif}</div>}
                  {fiscal.direccionFiscal && <div className="text-gray-500 text-xs">{fiscal.direccionFiscal}</div>}
                  {(fiscal.codigoPostal || fiscal.ciudad) && (
                    <div className="text-gray-500 text-xs">{fiscal.codigoPostal} {fiscal.ciudad} {fiscal.provincia && `(${fiscal.provincia})`}</div>
                  )}
                  {fiscal.telefono         && <div className="text-gray-500 text-xs mt-2">{fiscal.telefono}</div>}
                  {fiscal.emailFacturacion && <div className="text-gray-500 text-xs">{fiscal.emailFacturacion}</div>}
                  {fiscal.iban             && <div className="text-gray-400 font-mono text-xs mt-2">{fiscal.iban}</div>}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pestaña Empresa */}
      {pestana === "empresa" && (
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Image size={15} className="text-blue-600" />
                </div>
                <h2 className="text-sm font-semibold text-gray-700">Logo de la empresa</h2>
              </div>
              <div className="p-5">
                <p className="text-xs text-gray-400 mb-4">El logo aparecerá en todas las facturas. Formato recomendado: PNG con fondo transparente, máximo 300x150px.</p>
                <div className="flex items-center gap-6">
                  <div className="w-48 h-24 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center bg-gray-50 overflow-hidden">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo empresa" className="max-w-full max-h-full object-contain p-2" />
                    ) : (
                      <div className="text-center">
                        <Image size={24} className="mx-auto text-gray-300 mb-1" />
                        <span className="text-xs text-gray-400">Sin logo</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <button type="button" onClick={() => logoInputRef.current?.click()}
                      className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer">
                      <Plus size={14} />
                      {logoPreview ? "Cambiar logo" : "Subir logo"}
                    </button>
                    {logoPreview && (
                      <button type="button" onClick={() => { setLogoBase64(""); setLogoPreview(""); }}
                        className="flex items-center gap-2 px-4 py-2.5 border border-red-200 rounded-lg text-sm text-red-500 hover:bg-red-50 transition-colors cursor-pointer">
                        Eliminar logo
                      </button>
                    )}
                    <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogo} className="hidden" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                  <Shield size={15} className="text-amber-600" />
                </div>
                <h2 className="text-sm font-semibold text-gray-700">Texto RGPD</h2>
              </div>
              <div className="p-5">
                <p className="text-xs text-gray-400 mb-3">Este texto aparece al pie de todas las facturas.</p>
                <textarea rows={6} value={textoRgpd} onChange={(e) => setTextoRgpd(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white resize-none"
                  placeholder="Texto legal RGPD..." />
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="bg-amber-50 rounded-xl border border-amber-100 p-5">
              <div className="text-xs font-medium text-amber-600 uppercase tracking-wide mb-2">Importante</div>
              <p className="text-xs text-amber-700 leading-relaxed">El logo y el texto RGPD son globales y se aplican a todos los usuarios de la empresa.</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Vista previa RGPD</div>
              <p className="text-xs text-gray-500 leading-relaxed">{textoRgpd || "Sin texto configurado"}</p>
            </div>
          </div>
        </div>
      )}

      {/* Pestaña Series de Facturación */}
      {pestana === "series" && (
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-4">

            {/* Botón nueva serie */}
            <div className="flex justify-end">
              <button onClick={() => setMostrarNuevaSerie(true)}
                className="flex items-center gap-2 bg-[#0B1120] text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-[#162030] transition-colors cursor-pointer">
                <Plus size={15} /> Nueva serie
              </button>
            </div>

            {/* Formulario nueva serie */}
            {mostrarNuevaSerie && (
              <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
                <h3 className="text-sm font-semibold text-gray-700">Nueva serie de facturación</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                      Nombre <span className="text-red-400">*</span>
                    </label>
                    <input type="text" placeholder="Ej: Reparaciones"
                      value={nuevaSerie.nombre}
                      onChange={(e) => setNuevaSerie((p) => ({ ...p, nombre: e.target.value }))}
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                      Prefijo factura <span className="text-red-400">*</span>
                    </label>
                    <input type="text" placeholder="Ej: RPY"
                      value={nuevaSerie.prefijo}
                      onChange={(e) => setNuevaSerie((p) => ({ ...p, prefijo: e.target.value.toUpperCase() }))}
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white font-mono" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                      Prefijo abono
                    </label>
                    <input type="text" placeholder="Ej: ABO-RPY"
                      value={nuevaSerie.prefijoAbono}
                      onChange={(e) => setNuevaSerie((p) => ({ ...p, prefijoAbono: e.target.value.toUpperCase() }))}
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white font-mono" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                      Empezar desde nº
                    </label>
                    <input type="number" min="0" placeholder="0"
                      value={nuevaSerie.contadorActual}
                      onChange={(e) => setNuevaSerie((p) => ({ ...p, contadorActual: e.target.value }))}
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white" />
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => setMostrarNuevaSerie(false)}
                    className="px-5 py-2.5 text-sm text-gray-500 hover:text-gray-700 cursor-pointer">Cancelar</button>
                  <button type="button" onClick={handleAddSerie} disabled={addingSerie || !nuevaSerie.nombre || !nuevaSerie.prefijo}
                    className="flex items-center gap-2 bg-[#0B1120] text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-[#162030] transition-colors disabled:opacity-50 cursor-pointer">
                    <Save size={15} />
                    {addingSerie ? "Guardando..." : "Crear serie"}
                  </button>
                </div>
              </div>
            )}

            {/* Lista de series */}
            {series.length === 0 ? (
              <div className="bg-white rounded-xl border border-dashed border-gray-200 p-12 text-center">
                <CreditCard size={40} className="mx-auto text-gray-200 mb-3" />
                <p className="text-gray-400 text-sm mb-3">No hay series configuradas</p>
                <button onClick={() => setMostrarNuevaSerie(true)}
                  className="text-[#00C2FF] text-sm cursor-pointer">Crear primera serie →</button>
              </div>
            ) : (
              <div className="space-y-3">
                {series.map((serie) => (
                  <SerieCard
                    key={serie.id}
                    serie={serie}
                    anioActual={anioActual}
                    onToggle={() => handleToggleSerie(serie)}
                    onPredeterminada={() => handlePredeterminada(serie)}
                    onGuardarContador={(c, ca) => handleGuardarContadorSerie(serie, c, ca)}
                    saving={savingSerie === serie.id}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Formato del número</div>
              <p className="text-xs text-gray-500 leading-relaxed mb-3">
                Las facturas se numeran como:
              </p>
              <div className="bg-gray-50 rounded-lg p-3 font-mono text-sm text-gray-700 text-center">
                PREFIJO-001-{anioActual}
              </div>
              <p className="text-xs text-gray-400 leading-relaxed mt-3">
                Los abonos usarán el prefijo de abono de cada serie con su propio contador independiente.
              </p>
            </div>
            <div className="bg-blue-50 rounded-xl border border-blue-100 p-5">
              <div className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-2">Serie predeterminada</div>
              <p className="text-xs text-blue-500 leading-relaxed">
                La serie marcada como predeterminada se seleccionará automáticamente al crear una nueva factura.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Pestaña Tipos de servicio */}
      {pestana === "servicios" && (
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2">
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                    <Wrench size={15} className="text-amber-600" />
                  </div>
                  <h2 className="text-sm font-semibold text-gray-700">Tipos de servicio</h2>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{tipos.length}</span>
                </div>
              </div>
              <div>
                <div className="grid grid-cols-12 px-5 py-2 bg-gray-50 border-b border-gray-100">
                  <div className="col-span-5 text-xs text-gray-400 uppercase tracking-wide">Nombre</div>
                  <div className="col-span-3 text-xs text-gray-400 uppercase tracking-wide">Unidad</div>
                  <div className="col-span-2 text-xs text-gray-400 uppercase tracking-wide text-center">Estado</div>
                  <div className="col-span-2 text-xs text-gray-400 uppercase tracking-wide text-center">Acción</div>
                </div>
                {tipos.map((tipo) => (
                  <div key={tipo.id} className="grid grid-cols-12 px-5 py-4 border-b border-gray-50 items-center">
                    <div className="col-span-5 text-sm font-medium text-gray-800">{tipo.nombre}</div>
                    <div className="col-span-3">
                      <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 font-mono">{tipo.unidad}</span>
                    </div>
                    <div className="col-span-2 flex justify-center">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${tipo.activo ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {tipo.activo ? "Activo" : "Inactivo"}
                      </span>
                    </div>
                    <div className="col-span-2 flex justify-center">
                      <button onClick={() => handleToggleTipo(tipo)}
                        className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                          tipo.activo ? "border-gray-200 text-gray-500 hover:bg-gray-50" : "border-green-200 text-green-600 hover:bg-green-50"
                        }`}>
                        {tipo.activo ? <PowerOff size={12} /> : <Power size={12} />}
                        {tipo.activo ? "Desactivar" : "Activar"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-5 py-4 bg-gray-50 border-t border-gray-100">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Añadir nuevo tipo</p>
                <div className="flex gap-3">
                  <input type="text" placeholder="Nombre del tipo..."
                    value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddTipo()}
                    className="flex-1 px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white" />
                  <select value={nuevoUnidad} onChange={(e) => setNuevoUnidad(e.target.value)}
                    className="px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white text-gray-700">
                    {UNIDADES.map((u) => (
                      <option key={u.value} value={u.value}>{u.label}</option>
                    ))}
                  </select>
                  <button onClick={handleAddTipo} disabled={addingTipo || !nuevoNombre.trim()}
                    className="flex items-center gap-2 bg-[#0B1120] text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-[#162030] transition-colors disabled:opacity-50 cursor-pointer">
                    <Plus size={15} /> Añadir
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Unidades disponibles</div>
              <div className="space-y-3">
                {UNIDADES.map((u) => (
                  <div key={u.value} className="flex items-center gap-3">
                    <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600 font-mono w-8 text-center">{u.value}</span>
                    <span className="text-sm text-gray-600">{u.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pestaña Contador */}
      {pestana === "contador" && (
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2">
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Hash size={15} className="text-blue-600" />
                </div>
                <h2 className="text-sm font-semibold text-gray-700">Contador de facturas {anioActual}</h2>
              </div>
              <div className="p-5 space-y-4">
                <p className="text-xs text-gray-400 leading-relaxed">
                  Este contador es el legado. Si usas series de facturación, el contador de cada serie se gestiona en la pestaña "Series facturación".
                </p>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                    Contador actual — año {anioActual}
                  </label>
                  <div className="flex gap-3 items-center">
                    <input type="number" min="0" value={contador}
                      onChange={(e) => setContador(e.target.value)}
                      className="w-40 px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white text-center text-lg font-mono font-semibold" />
                    <button onClick={handleSaveContador} disabled={savingContador}
                      className="flex items-center gap-2 bg-[#0B1120] text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-[#162030] transition-colors disabled:opacity-50 cursor-pointer">
                      {savedContador ? <Check size={15} /> : <Save size={15} />}
                      {savedContador ? "¡Guardado!" : savingContador ? "Guardando..." : "Guardar contador"}
                    </button>
                  </div>
                </div>
                <div className="bg-blue-50 rounded-lg border border-blue-100 p-4">
                  <div className="text-xs font-medium text-blue-600 mb-1">Próxima factura</div>
                  <div className="text-sm text-blue-700">
                    La siguiente factura tendrá el número:{" "}
                    <span className="font-mono font-bold">
                      {parseInt(contador) + 1}_{String(new Date().getDate()).padStart(2,"0")}-{String(new Date().getMonth()+1).padStart(2,"0")}-{anioActual}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="bg-amber-50 rounded-xl border border-amber-100 p-5">
              <div className="text-xs font-medium text-amber-600 uppercase tracking-wide mb-2">Atención</div>
              <p className="text-xs text-amber-700 leading-relaxed">
                Modificar el contador manualmente puede generar números duplicados. Úsalo solo para la configuración inicial.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Pestaña Veri*Factu / RRSIF */}
      {pestana === "verifactu" && (
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Shield size={15} className="text-blue-600" />
                </div>
                <h2 className="text-sm font-semibold text-gray-700">Facturación electrónica (Veri*Factu / RRSIF)</h2>
              </div>
              <div className="p-5 space-y-5">
                <p className="text-xs text-gray-400 leading-relaxed">
                  Estos datos dependen de lo que confirme tu gestoría (régimen fiscal exacto, modalidad y plazo
                  aplicable). Cada empresa puede tener respuestas distintas, así que esta configuración es
                  independiente por empresa.
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                      Régimen fiscal
                    </label>
                    <select value={verifactu.regimenFiscalVerifactu}
                      onChange={(e) => setVField("regimenFiscalVerifactu", e.target.value)}
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white">
                      <option value="">Sin definir todavía</option>
                      <option value="sociedad">Sociedad (Impuesto sobre Sociedades)</option>
                      <option value="autonomo">Autónomo / IRPF</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                      Modalidad elegida
                    </label>
                    <select value={verifactu.verifactuModalidad}
                      onChange={(e) => setVField("verifactuModalidad", e.target.value)}
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white">
                      <option value="">Sin decidir todavía</option>
                      <option value="verifactu">Veri*Factu (envío en tiempo real a la AEAT)</option>
                      <option value="no_verifactu">No Veri*Factu (firma local + registro inmutable)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                    Fecha límite aplicable a esta empresa
                  </label>
                  <input type="date" value={verifactu.verifactuFechaLimite}
                    onChange={(e) => setVField("verifactuFechaLimite", e.target.value)}
                    className="w-full max-w-xs px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white" />
                  <p className="text-xs text-gray-400 mt-1.5">
                    Orientativo: 1 de enero de 2027 para sociedades, 1 de julio de 2027 para autónomos y el resto
                    de obligados (Real Decreto-ley 15/2025). Confírmalo con tu gestoría.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                    Notas de la gestoría
                  </label>
                  <textarea value={verifactu.verifactuNotasGestoria}
                    onChange={(e) => setVField("verifactuNotasGestoria", e.target.value)}
                    rows={4} placeholder="Respuestas, matices o instrucciones que os dé la gestoría sobre este tema..."
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white resize-none" />
                </div>

                <div className="flex items-start gap-3 pt-2 border-t border-gray-100">
                  <input type="checkbox" id="facturacionInmutable"
                    checked={verifactu.facturacionInmutableActiva}
                    onChange={(e) => setVField("facturacionInmutableActiva", e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-[#0B1120] cursor-pointer" />
                  <label htmlFor="facturacionInmutable" className="text-sm text-gray-700 cursor-pointer">
                    <span className="font-medium">Activar inmutabilidad de facturas emitidas.</span>{" "}
                    <span className="text-gray-400">
                      A partir de que actives esto, los importes de una factura ya emitida no se podrán editar —
                      cualquier corrección deberá hacerse mediante un Abono (factura rectificativa). Actívalo solo
                      cuando tu gestoría confirme que debéis empezar a operar así.
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-amber-50 rounded-xl border border-amber-100 p-5">
              <div className="text-xs font-medium text-amber-600 uppercase tracking-wide mb-2">Estado técnico</div>
              <p className="text-xs text-amber-700 leading-relaxed">
                La aplicación ya calcula y guarda la huella (hash encadenado) de cada factura y abono que se emite,
                de forma invisible, preparando el terreno para Veri*Factu. Falta activar el envío a la AEAT o la
                firma local una vez la gestoría confirme la modalidad y el certificado a usar.
              </p>
            </div>
            <div className="bg-blue-50 rounded-xl border border-blue-100 p-5">
              <div className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-2">Recordatorio</div>
              <p className="text-xs text-blue-700 leading-relaxed">
                Hay un listado completo de preguntas para la gestoría sobre este tema — pídeselo a quien administre
                la aplicación si no lo tienes a mano.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Componente tarjeta de serie
function SerieCard({
  serie, anioActual, onToggle, onPredeterminada, onGuardarContador, saving,
}: {
  serie: Serie;
  anioActual: number;
  onToggle: () => void;
  onPredeterminada: () => void;
  onGuardarContador: (contador: number, contadorAbono: number) => void;
  saving: boolean;
}) {
  const [editando, setEditando]           = useState(false);
  const [contador, setContador]           = useState(String(serie.contadorActual));
  const [contadorAbono, setContadorAbono] = useState(String(serie.contadorAbono));

  return (
    <div className={`bg-white rounded-xl border p-5 transition-all ${
      serie.predeterminada ? "border-[#00C2FF] shadow-sm" : "border-gray-100"
    } ${!serie.activa ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold ${
            serie.activa ? "bg-[#0B1120]" : "bg-gray-300"
          }`}>
            {serie.prefijo.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-900">{serie.nombre}</span>
              {serie.predeterminada && (
                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-[#00C2FF]/10 text-[#00C2FF] font-medium">
                  <Star size={10} /> Predeterminada
                </span>
              )}
              {!serie.activa && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">Inactiva</span>
              )}
            </div>
            <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
              <span className="font-mono">Facturas: <span className="text-gray-600">{serie.prefijo}-XXX-{anioActual}</span></span>
              {serie.prefijoAbono && (
                <span className="font-mono">Abonos: <span className="text-gray-600">{serie.prefijoAbono}-XXX-{anioActual}</span></span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!serie.predeterminada && serie.activa && (
            <button onClick={onPredeterminada}
              className="text-xs px-3 py-1.5 border border-[#00C2FF]/30 text-[#00C2FF] rounded-lg hover:bg-[#00C2FF]/5 transition-colors cursor-pointer">
              Predeterminar
            </button>
          )}
          <button onClick={() => setEditando(!editando)}
            className="text-xs px-3 py-1.5 border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
            {editando ? "Cerrar" : "Contadores"}
          </button>
          <button onClick={onToggle}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
              serie.activa
                ? "border-gray-200 text-gray-500 hover:bg-gray-50"
                : "border-green-200 text-green-600 hover:bg-green-50"
            }`}>
            {serie.activa ? <PowerOff size={12} /> : <Power size={12} />}
            {serie.activa ? "Desactivar" : "Activar"}
          </button>
        </div>
      </div>

      {/* Panel de contadores */}
      {editando && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                Contador facturas (último emitido)
              </label>
              <div className="flex items-center gap-2">
                <input type="number" min="0" value={contador}
                  onChange={(e) => setContador(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white text-center font-mono" />
                <span className="text-xs text-gray-400 shrink-0">
                  → Próxima: <span className="font-mono font-medium">{serie.prefijo}-{String(parseInt(contador) + 1).padStart(3, "0")}-{anioActual}</span>
                </span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                Contador abonos (último emitido)
              </label>
              <div className="flex items-center gap-2">
                <input type="number" min="0" value={contadorAbono}
                  onChange={(e) => setContadorAbono(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00C2FF] bg-white text-center font-mono" />
                {serie.prefijoAbono && (
                  <span className="text-xs text-gray-400 shrink-0">
                    → Próximo: <span className="font-mono font-medium">{serie.prefijoAbono}-{String(parseInt(contadorAbono) + 1).padStart(3, "0")}-{anioActual}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              onClick={() => {
                onGuardarContador(parseInt(contador) || 0, parseInt(contadorAbono) || 0);
                setEditando(false);
              }}
              disabled={saving}
              className="flex items-center gap-2 bg-[#0B1120] text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#162030] transition-colors disabled:opacity-50 cursor-pointer">
              {saving ? <Check size={14} /> : <Save size={14} />}
              {saving ? "Guardado" : "Guardar contadores"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}