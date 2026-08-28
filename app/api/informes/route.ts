import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import ExcelJS from "exceljs";
import {
  TABLAS, TABLA_LABELS, COLUMNAS, obtenerFilas,
  type TablaInforme, type FiltrosInforme,
} from "@/lib/informes";

const ROLES_PERMITIDOS = ["superadmin", "administrador", "administrativo"];

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const rol = (session.user as any).rol;
  if (!ROLES_PERMITIDOS.includes(rol)) {
    return NextResponse.json({ error: "No tienes permiso para generar informes" }, { status: 403 });
  }

  const empresaId = (session.user as any).empresaId;
  if (!empresaId) return NextResponse.json({ error: "Sin empresa asignada" }, { status: 403 });

  const body = await req.json();
  const { tabla, campos, filtros } = body as { tabla: string; campos: string[]; filtros?: FiltrosInforme };

  if (!TABLAS.includes(tabla as TablaInforme)) {
    return NextResponse.json({ error: "Tabla no válida" }, { status: 400 });
  }
  const tablaValida = tabla as TablaInforme;

  // Whitelist: solo se exportan columnas que existan de verdad para esta
  // tabla, nunca campos arbitrarios enviados por el cliente. Se respeta el
  // orden en el que el usuario las seleccionó.
  const columnasDisponibles = COLUMNAS[tablaValida];
  const columnasSeleccionadas = (Array.isArray(campos) ? campos : [])
    .map((key) => columnasDisponibles.find((c) => c.key === key))
    .filter((c): c is (typeof columnasDisponibles)[number] => !!c);

  if (columnasSeleccionadas.length === 0) {
    return NextResponse.json({ error: "Selecciona al menos una columna" }, { status: 400 });
  }

  const filas = await obtenerFilas(tablaValida, empresaId, filtros ?? {});

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Partia";
  workbook.created = new Date();
  const hoja = workbook.addWorksheet(TABLA_LABELS[tablaValida].slice(0, 31));

  hoja.columns = columnasSeleccionadas.map((c) => ({
    header: c.label,
    key:    c.key,
    width:  Math.min(Math.max(c.label.length + 4, 14), 40),
  }));
  hoja.getRow(1).font = { bold: true };
  hoja.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE5E7EB" } };

  for (const fila of filas) {
    const valores: Record<string, any> = {};
    for (const col of columnasSeleccionadas) {
      let valor = col.get(fila);
      if (col.formato === "booleano") valor = valor ? "Sí" : "No";
      valores[col.key] = valor ?? "";
    }
    const filaExcel = hoja.addRow(valores);
    columnasSeleccionadas.forEach((col, idx) => {
      const celda = filaExcel.getCell(idx + 1);
      if (col.formato === "fecha" && celda.value instanceof Date) {
        celda.numFmt = "dd/mm/yyyy";
      } else if (col.formato === "fechaHora" && celda.value instanceof Date) {
        celda.numFmt = "dd/mm/yyyy hh:mm";
      } else if (col.formato === "moneda" && typeof celda.value === "number") {
        celda.numFmt = "#,##0.00 €";
      }
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const fechaArchivo = new Date().toISOString().slice(0, 10);
  const nombreArchivo = `${tablaValida}_${fechaArchivo}.xlsx`;

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${nombreArchivo}"`,
    },
  });
}
