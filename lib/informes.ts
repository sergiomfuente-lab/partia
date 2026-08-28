// Configuración central del módulo de Informes / Exportaciones a Excel.
//
// Para cada "tabla" exportable se define: la lista de columnas disponibles
// (con una función que extrae el valor de cada fila y un formato de
// presentación), cómo se consultan las filas en Prisma (incluyendo las
// relaciones necesarias) y cómo se aplican los filtros básicos.
//
// IMPORTANTE: el endpoint solo debe exportar columnas que existan en esta
// lista (whitelist) — nunca campos arbitrarios que lleguen del cliente.

import { prisma } from "@/lib/prisma";

export type FormatoColumna = "texto" | "numero" | "moneda" | "fecha" | "fechaHora" | "booleano";

export interface ColumnaInforme {
  key:     string;
  label:   string;
  formato: FormatoColumna;
  get:     (row: any) => any;
}

export interface FiltrosInforme {
  clienteId?:  string;
  tecnicoId?:  string;
  estado?:     string;
  fechaDesde?: string;
  fechaHasta?: string;
  activo?:     string; // "true" | "false"
  tipo?:       string;
}

export const TABLAS = ["clientes", "maquinas", "ordenes", "facturas", "presupuestos"] as const;
export type TablaInforme = (typeof TABLAS)[number];

export const TABLA_LABELS: Record<TablaInforme, string> = {
  clientes:     "Clientes",
  maquinas:     "Máquinas",
  ordenes:      "Órdenes de trabajo",
  facturas:     "Facturas",
  presupuestos: "Presupuestos",
};

const fmtFecha = (d: any) => (d ? new Date(d) : null);

export const COLUMNAS: Record<TablaInforme, ColumnaInforme[]> = {
  clientes: [
    { key: "nombre",               label: "Nombre",                  formato: "texto",   get: (c) => c.nombre },
    { key: "nombreComercial",      label: "Nombre comercial",        formato: "texto",   get: (c) => c.nombreComercial },
    { key: "razonSocial",          label: "Razón social",            formato: "texto",   get: (c) => c.razonSocial },
    { key: "cif",                  label: "CIF / NIF",               formato: "texto",   get: (c) => c.cif },
    { key: "tipo",                 label: "Tipo",                    formato: "texto",   get: (c) => (c.tipo === "empresa" ? "Empresa" : "Autónomo") },
    { key: "email",                label: "Email",                   formato: "texto",   get: (c) => c.email },
    { key: "telefono",             label: "Teléfono",                formato: "texto",   get: (c) => c.telefono },
    { key: "direccionFacturacion", label: "Dirección de facturación",formato: "texto",   get: (c) => c.direccionFacturacion },
    { key: "formaPago",            label: "Forma de pago",           formato: "texto",   get: (c) => c.formaPago },
    { key: "observaciones",        label: "Observaciones",           formato: "texto",   get: (c) => c.observaciones },
    { key: "activo",               label: "Activo",                  formato: "booleano",get: (c) => c.activo },
    { key: "precioHoraEspecial",   label: "Precio/hora especial",    formato: "moneda",  get: (c) => c.precioHoraEspecial },
    { key: "precioPorKmEspecial",  label: "Precio/km especial",      formato: "moneda",  get: (c) => c.precioPorKmEspecial },
    { key: "totalMaquinas",        label: "Nº máquinas",             formato: "numero",  get: (c) => c._count?.maquinas },
    { key: "totalOrdenes",         label: "Nº órdenes",              formato: "numero",  get: (c) => c._count?.ordenes },
    { key: "fechaAlta",            label: "Fecha de alta",           formato: "fecha",   get: (c) => fmtFecha(c.createdAt) },
  ],
  maquinas: [
    { key: "marca",         label: "Marca",                formato: "texto",  get: (m) => m.marca },
    { key: "modelo",        label: "Modelo",               formato: "texto",  get: (m) => m.modelo },
    { key: "numeroDeSerie", label: "Número de serie",      formato: "texto",  get: (m) => m.numeroDeSerie },
    { key: "matricula",     label: "Matrícula / Nº parque",formato: "texto",  get: (m) => m.matricula },
    { key: "cliente",       label: "Cliente",              formato: "texto",  get: (m) => m.cliente?.nombre },
    { key: "estado",        label: "Estado",               formato: "texto",  get: (m) => m.estado },
    { key: "horasIniciales",label: "Horas iniciales",      formato: "numero", get: (m) => m.horasIniciales },
    { key: "horasActuales", label: "Horas actuales",       formato: "numero", get: (m) => m.horasActuales },
    { key: "observaciones", label: "Observaciones",        formato: "texto",  get: (m) => m.observaciones },
    { key: "totalOrdenes",  label: "Nº órdenes",           formato: "numero", get: (m) => m._count?.ordenes },
    { key: "fechaAlta",     label: "Fecha de alta",        formato: "fecha",  get: (m) => fmtFecha(m.createdAt) },
  ],
  ordenes: [
    { key: "numero",              label: "Nº orden",           formato: "texto",   get: (o) => o.numero },
    { key: "fecha",                label: "Fecha",               formato: "fecha",   get: (o) => fmtFecha(o.fecha) },
    { key: "cliente",              label: "Cliente",             formato: "texto",   get: (o) => o.cliente?.nombre },
    { key: "maquina",              label: "Máquina",             formato: "texto",   get: (o) => o.maquina ? `${o.maquina.marca} ${o.maquina.modelo} (${o.maquina.numeroDeSerie})` : null },
    { key: "matricula",            label: "Matrícula máquina",   formato: "texto",   get: (o) => o.maquina?.matricula },
    { key: "tecnico",              label: "Técnico",             formato: "texto",   get: (o) => o.tecnico?.nombre },
    { key: "estado",               label: "Estado",              formato: "texto",   get: (o) => o.estado },
    { key: "horasTrabajo",         label: "Horas de trabajo",    formato: "numero",  get: (o) => o.horasTrabajo },
    { key: "direccionReparacion",  label: "Dirección reparación",formato: "texto",   get: (o) => o.direccionReparacion },
    { key: "trabajosRealizados",   label: "Trabajos realizados", formato: "texto",   get: (o) => o.trabajosRealizados },
    { key: "observaciones",        label: "Observaciones",       formato: "texto",   get: (o) => o.observaciones },
    { key: "numServicios",         label: "Nº servicios",        formato: "numero",  get: (o) => (o.servicios?.length ?? 0) + (o.serviciosLibres?.length ?? 0) },
    { key: "numRepuestos",         label: "Nº repuestos",        formato: "numero",  get: (o) => o.repuestos?.length ?? 0 },
    { key: "facturada",            label: "Facturada",           formato: "booleano",get: (o) => !!o.facturaId },
    { key: "fechaAlta",            label: "Fecha de creación",   formato: "fecha",   get: (o) => fmtFecha(o.createdAt) },
  ],
  facturas: [
    { key: "numero",        label: "Nº factura",     formato: "texto",     get: (f) => f.numero },
    { key: "fecha",         label: "Fecha",          formato: "fecha",     get: (f) => fmtFecha(f.fecha) },
    { key: "vencimiento",   label: "Vencimiento",    formato: "fecha",     get: (f) => fmtFecha(f.vencimiento) },
    { key: "cliente",       label: "Cliente",        formato: "texto",     get: (f) => f.cliente?.nombre },
    { key: "estado",        label: "Estado",         formato: "texto",     get: (f) => f.estado },
    { key: "esDirecta",     label: "Factura directa",formato: "booleano",  get: (f) => f.esDirecta },
    { key: "serie",         label: "Serie",          formato: "texto",     get: (f) => f.serie?.nombre },
    { key: "baseImponible", label: "Base imponible", formato: "moneda",    get: (f) => f.baseImponible },
    { key: "descuento",     label: "Descuento",      formato: "moneda",    get: (f) => f.descuento },
    { key: "iva",           label: "IVA",            formato: "moneda",    get: (f) => f.iva },
    { key: "total",         label: "Total",          formato: "moneda",    get: (f) => f.total },
    { key: "fechaPago",     label: "Fecha de pago",  formato: "fechaHora", get: (f) => fmtFecha(f.fechaPago) },
    { key: "pagadoPor",     label: "Pagada / marcada por", formato: "texto", get: (f) => f.pagadoPor?.nombre },
    { key: "notas",         label: "Notas",          formato: "texto",     get: (f) => f.notas },
  ],
  presupuestos: [
    { key: "numero",              label: "Nº presupuesto", formato: "texto",  get: (p) => p.numero },
    { key: "fecha",                label: "Fecha",           formato: "fecha",  get: (p) => fmtFecha(p.fecha) },
    { key: "validezHasta",         label: "Válido hasta",    formato: "fecha",  get: (p) => fmtFecha(p.validezHasta) },
    { key: "cliente",              label: "Cliente",         formato: "texto",  get: (p) => p.cliente?.nombre },
    { key: "maquina",              label: "Máquina",         formato: "texto",  get: (p) => p.maquina ? `${p.maquina.marca} ${p.maquina.modelo} (${p.maquina.numeroDeSerie})` : null },
    { key: "estado",               label: "Estado",          formato: "texto",  get: (p) => p.estado },
    { key: "direccionReparacion",  label: "Dirección reparación", formato: "texto", get: (p) => p.direccionReparacion },
    { key: "descripcion",          label: "Descripción",     formato: "texto",  get: (p) => p.descripcion },
    { key: "observaciones",        label: "Observaciones",   formato: "texto",  get: (p) => p.observaciones },
    { key: "baseImponible",        label: "Base imponible",  formato: "moneda", get: (p) => p.baseImponible },
    { key: "descuento",            label: "Descuento",       formato: "moneda", get: (p) => p.descuento },
    { key: "iva",                  label: "IVA",             formato: "moneda", get: (p) => p.iva },
    { key: "total",                label: "Total",           formato: "moneda", get: (p) => p.total },
    { key: "notas",                label: "Notas",           formato: "texto",  get: (p) => p.notas },
  ],
};

// Estados posibles por tabla, para el selector de filtro en el cliente.
export const ESTADOS_POR_TABLA: Record<TablaInforme, string[] | null> = {
  clientes:     null,
  maquinas:     ["activo", "inactivo", "en_reparacion"],
  ordenes:      ["pendiente", "en_curso", "pausado", "completado", "cancelado"],
  facturas:     ["pendiente", "cobrada", "vencida"],
  presupuestos: ["borrador", "enviado", "aceptado", "rechazado"],
};

function rangoFechas(desde?: string, hasta?: string) {
  if (!desde && !hasta) return undefined;
  const rango: any = {};
  if (desde) rango.gte = new Date(`${desde}T00:00:00`);
  if (hasta) rango.lte = new Date(`${hasta}T23:59:59`);
  return rango;
}

export async function obtenerFilas(tabla: TablaInforme, empresaId: string, filtros: FiltrosInforme): Promise<any[]> {
  const rangoFecha = rangoFechas(filtros.fechaDesde, filtros.fechaHasta);

  switch (tabla) {
    case "clientes":
      return prisma.cliente.findMany({
        where: {
          empresaId,
          ...(filtros.tipo && { tipo: filtros.tipo }),
          ...(filtros.activo !== undefined && filtros.activo !== "" && { activo: filtros.activo === "true" }),
          ...(rangoFecha && { createdAt: rangoFecha }),
        },
        include: { _count: { select: { maquinas: true, ordenes: true } } },
        orderBy: { nombre: "asc" },
      });

    case "maquinas":
      return prisma.maquina.findMany({
        where: {
          cliente: { empresaId },
          ...(filtros.clienteId && { clienteId: filtros.clienteId }),
          ...(filtros.estado && { estado: filtros.estado }),
          ...(rangoFecha && { createdAt: rangoFecha }),
        },
        include: {
          cliente: { select: { nombre: true } },
          _count:  { select: { ordenes: true } },
        },
        orderBy: { createdAt: "desc" },
      });

    case "ordenes":
      return prisma.orden.findMany({
        where: {
          empresaId,
          ...(filtros.clienteId && { clienteId: filtros.clienteId }),
          ...(filtros.tecnicoId && { tecnicoId: filtros.tecnicoId }),
          ...(filtros.estado && { estado: filtros.estado }),
          ...(rangoFecha && { fecha: rangoFecha }),
        },
        include: {
          cliente: { select: { nombre: true } },
          maquina: { select: { marca: true, modelo: true, numeroDeSerie: true, matricula: true } },
          tecnico: { select: { nombre: true } },
          servicios: true,
          serviciosLibres: true,
          repuestos: true,
        },
        orderBy: { fecha: "desc" },
      });

    case "facturas":
      return prisma.factura.findMany({
        where: {
          empresaId,
          ...(filtros.clienteId && { clienteId: filtros.clienteId }),
          ...(filtros.estado && { estado: filtros.estado }),
          ...(rangoFecha && { fecha: rangoFecha }),
        },
        include: {
          cliente:   { select: { nombre: true } },
          serie:     { select: { nombre: true } },
          pagadoPor: { select: { nombre: true } },
        },
        orderBy: { fecha: "desc" },
      });

    case "presupuestos":
      return prisma.presupuesto.findMany({
        where: {
          empresaId,
          ...(filtros.clienteId && { clienteId: filtros.clienteId }),
          ...(filtros.estado && { estado: filtros.estado }),
          ...(rangoFecha && { fecha: rangoFecha }),
        },
        include: {
          cliente: { select: { nombre: true } },
          maquina: { select: { marca: true, modelo: true, numeroDeSerie: true } },
        },
        orderBy: { fecha: "desc" },
      });
  }
}
