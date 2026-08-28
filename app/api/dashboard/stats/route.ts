import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Calcula el rango de fechas [desde, hasta) para cada periodo soportado,
// junto con una etiqueta legible para mostrar en la interfaz.
function rangoPeriodo(periodo: string) {
  const ahora = new Date();
  const inicioMes = (fecha: Date) => new Date(fecha.getFullYear(), fecha.getMonth(), 1);

  if (periodo === "mes_anterior") {
    const desde = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
    const hasta = inicioMes(ahora);
    return { desde, hasta, label: desde.toLocaleDateString("es-ES", { month: "long", year: "numeric" }) };
  }
  if (periodo === "anio") {
    const desde = new Date(ahora.getFullYear(), 0, 1);
    const hasta = new Date(ahora.getFullYear() + 1, 0, 1);
    return { desde, hasta, label: `Año ${ahora.getFullYear()}` };
  }
  if (periodo === "historico") {
    return { desde: null as Date | null, hasta: null as Date | null, label: "Histórico" };
  }
  // "mes" (por defecto): mes en curso
  const desde = inicioMes(ahora);
  const hasta = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 1);
  return { desde, hasta, label: desde.toLocaleDateString("es-ES", { month: "long", year: "numeric" }) };
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const rol = (session.user as any).rol;
  if (rol === "tecnico") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const empresaId = (session.user as any).empresaId;
  if (!empresaId) return NextResponse.json({ error: "Sin empresa asignada" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const periodo = searchParams.get("periodo") ?? "mes";
  const { desde, hasta, label } = rangoPeriodo(periodo);
  const filtroFecha = desde && hasta ? { fecha: { gte: desde, lt: hasta } } : {};

  const [facturasPeriodo, facturasPendientes, tecnicos, ordenesCompletadasPeriodo, productos] = await Promise.all([
    // Facturación emitida en el periodo (independientemente de si ya se cobró)
    prisma.factura.findMany({
      where:  { empresaId, ...filtroFecha },
      select: { id: true, total: true, estado: true },
    }),
    // Foto actual de todo lo pendiente de cobro (no depende del periodo)
    prisma.factura.findMany({
      where:   { empresaId, estado: { in: ["pendiente", "vencida"] } },
      select:  { id: true, numero: true, fecha: true, vencimiento: true, total: true, estado: true, cliente: { select: { nombre: true } } },
      orderBy: { fecha: "asc" },
    }),
    prisma.usuario.findMany({
      where:   { empresaId, rol: "tecnico", activo: true },
      select:  { id: true, nombre: true },
      orderBy: { nombre: "asc" },
    }),
    prisma.orden.findMany({
      where:  { empresaId, estado: "completado", ...filtroFecha },
      select: { tecnicoId: true, horasTrabajo: true },
    }),
    prisma.producto.findMany({
      where:  { empresaId, activo: true },
      select: { id: true, nombre: true, stock: true, stockMinimo: true, unidad: true },
    }),
  ]);

  const totalFacturado = facturasPeriodo.reduce((acc, f) => acc + f.total, 0);
  const totalCobradoPeriodo = facturasPeriodo.filter((f) => f.estado === "cobrada").reduce((acc, f) => acc + f.total, 0);

  const totalPendiente = facturasPendientes.reduce((acc, f) => acc + f.total, 0);
  const numVencidas = facturasPendientes.filter((f) => f.estado === "vencida").length;

  const ahora = Date.now();
  const facturasPendientesConAntiguedad = facturasPendientes.slice(0, 8).map((f) => ({
    ...f,
    diasAntiguedad: Math.floor((ahora - new Date(f.fecha).getTime()) / 86_400_000),
  }));

  const rendimientoPorTecnico: Record<string, { ordenesCompletadas: number; horasTrabajo: number }> = {};
  for (const o of ordenesCompletadasPeriodo) {
    if (!o.tecnicoId) continue;
    if (!rendimientoPorTecnico[o.tecnicoId]) rendimientoPorTecnico[o.tecnicoId] = { ordenesCompletadas: 0, horasTrabajo: 0 };
    rendimientoPorTecnico[o.tecnicoId].ordenesCompletadas += 1;
    rendimientoPorTecnico[o.tecnicoId].horasTrabajo += o.horasTrabajo ?? 0;
  }

  const tecnicosConDatos = tecnicos
    .map((t) => ({
      id: t.id,
      nombre: t.nombre,
      ordenesCompletadas: rendimientoPorTecnico[t.id]?.ordenesCompletadas ?? 0,
      horasTrabajo: rendimientoPorTecnico[t.id]?.horasTrabajo ?? 0,
    }))
    .sort((a, b) => b.ordenesCompletadas - a.ordenesCompletadas);

  const stockBajo = productos
    .filter((p) => p.stockMinimo > 0 && p.stock < p.stockMinimo)
    .sort((a, b) => a.stock - b.stock);

  return NextResponse.json({
    periodo: { valor: periodo, label },
    facturacion: {
      totalFacturado,
      totalCobrado: totalCobradoPeriodo,
      numFacturas: facturasPeriodo.length,
    },
    pendienteCobro: {
      total: totalPendiente,
      numPendientes: facturasPendientes.length,
      numVencidas,
      facturas: facturasPendientesConAntiguedad,
    },
    tecnicos: tecnicosConDatos,
    stockBajo,
  });
}
