import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const empresaId = (session.user as any).empresaId;
  if (!empresaId) return NextResponse.json({ error: "Sin empresa asignada" }, { status: 403 });
  const { id }    = await params;

  const orden = await prisma.orden.findFirst({
    where: { id, empresaId },
    include: {
      cliente:         true,
      maquina:         true,
      tecnico:         { select: { id: true, nombre: true } },
      servicios:       { include: { tipoServicio: true }, orderBy: { fecha: "asc" } },
      serviciosLibres: true,
      repuestos:       true,
      factura:         { select: { id: true, numero: true, estado: true } },
    },
  });

  if (!orden) return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
  return NextResponse.json(orden);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const empresaId = (session.user as any).empresaId;
  if (!empresaId) return NextResponse.json({ error: "Sin empresa asignada" }, { status: 403 });
  const { id }    = await params;
  const body      = await req.json();
  const {
    fecha, direccionReparacion, trabajosRealizados,
    observaciones, estado, servicios, serviciosLibres, repuestos,
    firmaDni, firmaObservaciones, firmaBase64,
    mostrarPrecios, tecnicoId, horasMaquina,
  } = body;

  const orden = await prisma.orden.findFirst({
    where: { id, empresaId },
  });
  if (!orden) return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });

  // Registro de tiempo de trabajo real: cualquier transicion que ENTRA en
  // "en_curso" (empezar o reanudar tras una pausa) abre una sesion nueva;
  // cualquier transicion que SALE de "en_curso" (pausar, completar,
  // cancelar) cierra la sesion abierta y suma sus horas a Orden.horasTrabajo.
  const entrandoEnCurso   = estado !== undefined && estado === "en_curso" && orden.estado !== "en_curso";
  const saliendoDeEnCurso = estado !== undefined && estado !== "en_curso" && orden.estado === "en_curso";

  // Al ejecutar la orden por primera vez (entrar en "en_curso") es obligatorio
  // registrar las horas actuales de la maquina; quedan guardadas en el
  // historico y sustituyen el valor mostrado en la ficha de la maquina.
  const requiereHorasMaquina = entrandoEnCurso && orden.horasMaquinaRegistradas == null;
  let horasMaquinaNum: number | null = null;
  let maquinaActual: { horasActuales: number } | null = null;

  if (requiereHorasMaquina) {
    horasMaquinaNum = typeof horasMaquina === "number" ? horasMaquina : parseFloat(horasMaquina);
    if (horasMaquina === undefined || horasMaquina === null || horasMaquina === "" || isNaN(horasMaquinaNum)) {
      return NextResponse.json(
        { error: "Debes indicar las horas actuales de la máquina para poner la orden en curso." },
        { status: 400 }
      );
    }
    maquinaActual = await prisma.maquina.findUnique({
      where:  { id: orden.maquinaId },
      select: { horasActuales: true },
    });
    if (maquinaActual && horasMaquinaNum < maquinaActual.horasActuales) {
      return NextResponse.json(
        { error: `Las horas no pueden ser inferiores a las horas actuales de la máquina (${maquinaActual.horasActuales} h).` },
        { status: 400 }
      );
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    let incrementoHoras = 0;

    if (saliendoDeEnCurso) {
      const sesionAbierta = await tx.sesionTrabajo.findFirst({
        where:   { ordenId: id, fin: null },
        orderBy: { inicio: "desc" },
      });
      if (sesionAbierta) {
        const fin = new Date();
        incrementoHoras = (fin.getTime() - sesionAbierta.inicio.getTime()) / 3_600_000;
        await tx.sesionTrabajo.update({ where: { id: sesionAbierta.id }, data: { fin } });
      }
    }

    if (entrandoEnCurso) {
      const sesionColgada = await tx.sesionTrabajo.findFirst({ where: { ordenId: id, fin: null } });
      if (!sesionColgada) {
        await tx.sesionTrabajo.create({ data: { ordenId: id, inicio: new Date() } });
      }
    }

    if (requiereHorasMaquina && horasMaquinaNum !== null) {
      await tx.historialHorasMaquina.create({
        data: {
          maquinaId:       orden.maquinaId,
          horas:           horasMaquinaNum,
          horasAnteriores: maquinaActual?.horasActuales ?? null,
          ordenId:         id,
          usuarioId:       session.user!.id,
        },
      });
      await tx.maquina.update({
        where: { id: orden.maquinaId },
        data:  { horasActuales: horasMaquinaNum },
      });
    }

    return tx.orden.update({
      where: { id },
      data: {
        ...(fecha               !== undefined && { fecha:               new Date(fecha) }),
        ...(direccionReparacion !== undefined && { direccionReparacion }),
        ...(trabajosRealizados  !== undefined && { trabajosRealizados }),
        ...(observaciones       !== undefined && { observaciones }),
        ...(estado              !== undefined && { estado }),
        ...(requiereHorasMaquina && horasMaquinaNum !== null && { horasMaquinaRegistradas: horasMaquinaNum }),
        ...(tecnicoId           !== undefined && { tecnicoId: tecnicoId || null }),
        ...(mostrarPrecios      !== undefined && { mostrarPrecios }),
        ...(firmaDni            !== undefined && { firmaDni }),
        ...(firmaObservaciones  !== undefined && { firmaObservaciones }),
        ...(firmaBase64         !== undefined && { firmaBase64 }),
        ...(incrementoHoras > 0 && { horasTrabajo: { increment: incrementoHoras } }),
        ...(servicios !== undefined && {
          servicios: {
            deleteMany: {},
            create: servicios.map((s: any) => ({
              fecha:          s.fecha ? new Date(s.fecha) : new Date(),
              tipoServicioId: s.tipoServicioId,
              cantidad:       s.cantidad,
              precio:         s.precio,
              descripcion:    s.descripcion ?? null,
            })),
          },
        }),
        ...(serviciosLibres !== undefined && {
          serviciosLibres: {
            deleteMany: {},
            create: serviciosLibres.map((s: any) => ({
              descripcion: s.descripcion,
              cantidad:    s.cantidad,
              precio:      s.precio,
            })),
          },
        }),
        ...(repuestos !== undefined && {
          repuestos: {
            deleteMany: {},
            create: repuestos.map((r: any) => ({
              referencia:  r.referencia  ?? null,
              descripcion: r.descripcion,
              cantidad:    r.cantidad,
              precioCoste: r.precioCoste,
              precioVenta: r.precioVenta,
            })),
          },
        }),
      },
      include: {
        cliente:         { select: { id: true, nombre: true } },
        maquina:         { select: { id: true, marca: true, modelo: true, horasActuales: true } },
        tecnico:         { select: { id: true, nombre: true } },
        servicios:       { include: { tipoServicio: true } },
        serviciosLibres: true,
        repuestos:       true,
      },
    });
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const empresaId = (session.user as any).empresaId;
  if (!empresaId) return NextResponse.json({ error: "Sin empresa asignada" }, { status: 403 });
  const { id }    = await params;

  const orden = await prisma.orden.findFirst({
    where: { id, empresaId },
  });
  if (!orden) return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });

  await prisma.servicio.deleteMany({ where: { ordenId: id } });
  await prisma.servicioLibre.deleteMany({ where: { ordenId: id } });
  await prisma.repuesto.deleteMany({ where: { ordenId: id } });
  await prisma.sesionTrabajo.deleteMany({ where: { ordenId: id } });
  await prisma.orden.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}