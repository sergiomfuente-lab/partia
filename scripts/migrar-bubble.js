/**
 * Migración de datos desde Bubble.io a partia.
 *
 * Lee los CSV exportados de Bubble (carpeta migracion-bubble/ en la raíz del
 * proyecto) y los vuelca en la base de datos a través de Prisma, reutilizando
 * el "unique id" de Bubble como id de cada registro nuevo, de modo que las
 * relaciones entre tablas se resuelven directamente.
 *
 * USO
 *   node scripts/migrar-bubble.js                  -> modo prueba (no escribe nada)
 *   node scripts/migrar-bubble.js --apply          -> migra de verdad
 *   node scripts/migrar-bubble.js --apply --sin-firmas
 *                                                   -> migra sin descargar las firmas
 *
 * ANTES DE USAR --apply:
 *   1. Ejecuta scripts/vaciar-datos.js --apply (la base de datos debe estar
 *      sin clientes, máquinas, órdenes, facturas, etc.).
 *   2. Ejecuta este script SIN --apply y lee el informe y los AVISOS.
 *   3. Debe existir una Serie de facturación marcada como predeterminada.
 *
 * DECISIONES DE MIGRACIÓN
 *   - Los contadores de número de Bubble (NUM_ORDEN, NUM_FACTURA,
 *     NUM_PRESUPUESTO) se reiniciaron varias veces y tienen repetidos. Cada
 *     documento se renumera de forma correlativa por fecha real, con el
 *     formato de numeración de la propia app, y el número original de Bubble
 *     se guarda en observaciones / notas. Los contadores quedan en el último
 *     número para que el siguiente documento nuevo continúe la serie.
 *   - Las facturas migradas no llevan huella Veri*Factu.
 */

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");
const { PrismaClient } = require("@prisma/client");

// Railway puede cortar la conexión a mitad de una migración larga. Esta
// extensión reintenta cualquier operación que falle por un corte transitorio.
function esErrorDeConexionTransitorio(e) {
  const codigos = new Set(["P1017", "P1001", "P1008", "P1002"]);
  if (e && codigos.has(e.code)) return true;
  const msg = String(e && e.message ? e.message : e);
  return /closed the connection|ECONNRESET|Connection terminated|connect timeout|timed out|socket hang up/i.test(msg);
}

const prismaBase = new PrismaClient();
const prisma = prismaBase.$extends({
  query: {
    async $allOperations({ model, operation, args, query }) {
      const intentosMax = 5;
      let huboCorte = false;
      for (let intento = 1; intento <= intentosMax; intento++) {
        try {
          return await query(args);
        } catch (e) {
          if (esErrorDeConexionTransitorio(e) && intento < intentosMax) {
            huboCorte = true;
            const espera = 1500 * intento;
            console.log(`  ⚠ Conexión interrumpida (${model}.${operation}); reintentando en ${espera}ms (intento ${intento}/${intentosMax})...`);
            await new Promise((r) => setTimeout(r, espera));
            continue;
          }
          // Si tras un corte el reintento de un create choca con el mismo id,
          // la fila ya se había creado antes de cortarse la respuesta.
          if (huboCorte && operation === "create" && e && e.code === "P2002") {
            console.log(`  (la fila de ${model} ya se había creado antes del corte; se continúa)`);
            return undefined;
          }
          throw e;
        }
      }
    },
  },
});

const APLICAR = process.argv.includes("--apply");
const SIN_FIRMAS = process.argv.includes("--sin-firmas");
const DATA_DIR = process.env.MIGRACION_DIR || path.join(__dirname, "..", "migracion-bubble");

const avisos = [];
const avisar = (msg) => avisos.push(msg);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Busca en migracion-bubble/ el CSV de una tabla por su nombre de Bubble
// (p. ej. "TBL-CLIENTES" -> Tabla_TBL-CLIENTES_2026-10-10_19-35-49.csv).
function leerCsv(clave) {
  if (!fs.existsSync(DATA_DIR)) {
    throw new Error(`No encuentro la carpeta ${DATA_DIR}. Debe estar en la raíz del proyecto.`);
  }
  const candidatos = fs.readdirSync(DATA_DIR)
    .filter((f) => f.toLowerCase().endsWith(".csv") && f.includes(`Tabla_${clave}_`))
    .sort();
  if (candidatos.length === 0) {
    throw new Error(`No encuentro ningún CSV de la tabla ${clave} en ${DATA_DIR} (se busca un archivo "Tabla_${clave}_....csv").`);
  }
  if (candidatos.length > 1) {
    avisar(`Hay ${candidatos.length} archivos para la tabla ${clave}; se usa el más reciente (${candidatos[candidatos.length - 1]}).`);
  }
  const contenido = fs.readFileSync(path.join(DATA_DIR, candidatos[candidatos.length - 1]), "utf8");
  return parse(contenido, { columns: true, skip_empty_lines: true, bom: true, trim: false });
}

// Fechas de Bubble: "Nov 24, 2023 12:00 am"
function fechaBubble(str) {
  if (!str || !String(str).trim()) return null;
  const d = new Date(String(str).trim());
  return isNaN(d.getTime()) ? null : d;
}

// Decimales con coma: "760,78"
function numeroEs(str) {
  if (str === undefined || str === null) return 0;
  const s = String(str).trim();
  if (!s) return 0;
  const n = parseFloat(s.replace(",", "."));
  return isNaN(n) ? 0 : n;
}

const vacio = (str) => str === undefined || str === null || !String(str).trim();
const limpio = (str) => (vacio(str) ? null : String(str).trim());
const listaBubble = (str) => (vacio(str) ? [] : String(str).split(",").map((s) => s.trim()).filter(Boolean));
const pad = (n, len) => String(n).padStart(len, "0");
const redondea = (n) => Math.round(n * 100) / 100;

async function crearEnLotes(modelo, filas, tam = 500) {
  for (let i = 0; i < filas.length; i += tam) {
    await prisma[modelo].createMany({ data: filas.slice(i, i + tam), skipDuplicates: true });
  }
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------

async function main() {
  console.log(`\n${"=".repeat(70)}`);
  console.log(`Migración Bubble -> partia   [modo: ${APLICAR ? "APLICAR (escribe en la BD)" : "PRUEBA (no escribe nada)"}]`);
  console.log(`${"=".repeat(70)}`);

  const empresas = await prisma.empresa.findMany();
  if (empresas.length !== 1) {
    throw new Error(`Se esperaba exactamente 1 Empresa en la base de datos y hay ${empresas.length}.`);
  }
  const empresa = empresas[0];
  console.log(`\nEmpresa objetivo: ${empresa.nombre} (${empresa.id})`);

  // La base de datos debe estar vacía de datos de negocio.
  const ocupadas = [];
  for (const t of ["cliente", "maquina", "orden", "factura", "presupuesto", "proveedor", "compra"]) {
    const n = await prisma[t].count();
    if (n > 0) ocupadas.push(`${t}: ${n}`);
  }
  if (ocupadas.length > 0) {
    const msg = `La base de datos ya tiene datos (${ocupadas.join(", ")}). Ejecuta antes: node scripts/vaciar-datos.js --apply`;
    if (APLICAR) throw new Error(msg);
    console.log(`\n⚠ ${msg}\n  (en modo prueba se continúa igualmente para mostrar el informe)`);
  }

  const serieDefault = await prisma.serieFacturacion.findFirst({
    where: { empresaId: empresa.id, predeterminada: true },
  });
  if (!serieDefault) {
    throw new Error("No hay ninguna Serie de facturación marcada como predeterminada. Créala en Configuración antes de migrar.");
  }
  console.log(`Serie de facturación para las facturas migradas: ${serieDefault.nombre} (prefijo "${serieDefault.prefijo}")`);

  // Tipos de servicio (se reutilizan los existentes por su unidad)
  let tipoManoObra = await prisma.tipoServicio.findFirst({ where: { unidad: "h" } });
  if (!tipoManoObra) {
    avisar('No había ningún TipoServicio con unidad "h"; se crea "Mano de obra".');
    tipoManoObra = APLICAR
      ? await prisma.tipoServicio.create({ data: { nombre: "Mano de obra", unidad: "h", orden: 1 } })
      : { id: "PENDIENTE-TIPO-H" };
  }
  let tipoDesplazamiento = await prisma.tipoServicio.findFirst({ where: { unidad: "km" } });
  if (!tipoDesplazamiento) {
    avisar('No había ningún TipoServicio con unidad "km"; se crea "Desplazamiento".');
    tipoDesplazamiento = APLICAR
      ? await prisma.tipoServicio.create({ data: { nombre: "Desplazamiento", unidad: "km", orden: 2 } })
      : { id: "PENDIENTE-TIPO-KM" };
  }
  const tipoServicioPorNombreBubble = { "Mano de obra": tipoManoObra.id, Kms: tipoDesplazamiento.id };

  const proveedorIdPorNombre = await migrarProveedores(empresa.id);
  const { clienteIdPorNombre, maquinasPorCliente } = await migrarClientes(empresa.id);
  const { candidatosPorSerie, maquinaIdsCreadas } = await migrarMaquinas(maquinasPorCliente);

  // Resuelve qué Maquina es, dada la serie en texto. Solo devuelve máquinas
  // que realmente se crean (nunca una ficha descartada).
  function resolverMaquina(clienteId, serieTexto, contexto) {
    const serie = limpio(serieTexto);
    if (!serie) return null;
    const candidatos = (candidatosPorSerie.get(serie) || []).filter((c) => maquinaIdsCreadas.has(c.maquinaId));
    if (candidatos.length === 0) {
      avisar(`${contexto}: la máquina de serie "${serie}" no se encontró (o su ficha estaba descartada). Se deja sin máquina.`);
      return null;
    }
    if (candidatos.length === 1) return candidatos[0].maquinaId;
    const delCliente = candidatos.filter((c) => c.clienteIdAsignado === clienteId);
    if (delCliente.length >= 1) return delCliente[0].maquinaId;
    avisar(`${contexto}: serie "${serie}" ambigua y ninguna coincide con el cliente; se usa la primera.`);
    return candidatos[0].maquinaId;
  }

  const { ordenIdsValidos, lecturasPorMaquina, firmaPorOrden } = await migrarOrdenes(empresa.id, clienteIdPorNombre, resolverMaquina);
  await migrarServiciosDeOrden(ordenIdsValidos, tipoServicioPorNombreBubble);
  await migrarRecambiosDeOrden(ordenIdsValidos);
  await actualizarHorasMaquinas(lecturasPorMaquina);
  await migrarFacturas(empresa.id, clienteIdPorNombre, ordenIdsValidos, serieDefault);
  await migrarPresupuestos(empresa.id, clienteIdPorNombre, resolverMaquina);
  await migrarCompras(empresa.id, proveedorIdPorNombre);
  await migrarFirmas(firmaPorOrden);

  console.log(`\n${"=".repeat(70)}`);
  console.log(`AVISOS (${avisos.length})`);
  console.log(`${"=".repeat(70)}`);
  if (avisos.length === 0) console.log("  (ninguno)");
  else avisos.forEach((a, i) => console.log(`  ${i + 1}. ${a}`));
  console.log(`\n${APLICAR ? "Migración aplicada." : "Modo prueba: no se ha escrito nada. Ejecuta con --apply para aplicar de verdad."}\n`);
}

// ---------------------------------------------------------------------------
// Paso 1: Proveedores
// ---------------------------------------------------------------------------

async function migrarProveedores(empresaId) {
  const filas = leerCsv("TBL-PROVEEDORES");
  const idPorNombre = new Map();
  console.log(`\n--- Paso 1: Proveedores (${filas.length} filas) ---`);
  const datos = [];
  for (const row of filas) {
    const id = row["unique id"];
    const nombre = limpio(row.NOMBRE) || `Proveedor sin nombre (${id})`;
    idPorNombre.set(nombre, id);
    datos.push({
      id, nombre,
      cif: limpio(row.CIF),
      direccion: limpio(row.DIRECCION_FACTURA) || limpio(row.DIRECCION_VENTA),
      telefono: limpio(row.TELEFONO),
      email: limpio(row.EMAIL),
      activo: row.ESTADO === "Activo",
      empresaId,
    });
  }
  if (APLICAR) await crearEnLotes("proveedor", datos);
  avisar('Proveedores: "Razón social", "Forma de pago" y "Observaciones" de Bubble no tienen sitio en la ficha de proveedor de partia y no se migran.');
  console.log(`  ${APLICAR ? "Creados" : "Se crearían"} ${datos.length} proveedores.`);
  return idPorNombre;
}

// ---------------------------------------------------------------------------
// Paso 2: Clientes
// ---------------------------------------------------------------------------

async function migrarClientes(empresaId) {
  const filas = leerCsv("TBL-CLIENTES");
  const idPorNombre = new Map();
  const maquinasPorCliente = new Map();
  const plazosNecesarios = new Set();
  console.log(`\n--- Paso 2: Clientes (${filas.length} filas) ---`);
  const datos = [];
  for (const row of filas) {
    const id = row["unique id"];
    const nombre = limpio(row.NOMBRE) || `Cliente sin nombre (${id})`;
    idPorNombre.set(nombre, id);
    maquinasPorCliente.set(id, listaBubble(row.TBL_MAQUINAS));

    let formaPago = limpio(row.FORMA_PAGO) || "Transferencia bancaria";
    let plazoPagoDias = null;
    const m = formaPago.match(/Pago\s+(\d+)\s*d[ií]as/i);
    if (m) {
      plazoPagoDias = parseInt(m[1], 10);
      plazosNecesarios.add(plazoPagoDias);
      formaPago = "Transferencia bancaria";
    }
    const obs = [limpio(row.OBSERVACIONES), limpio(row.OBS_PAGO) ? `Obs. pago: ${limpio(row.OBS_PAGO)}` : null]
      .filter(Boolean).join(" | ") || null;

    datos.push({
      id, nombre,
      razonSocial: limpio(row.RAZON_SOCIAL),
      cif: limpio(row.CIF),
      direccionFacturacion: limpio(row.DIRECCION),
      formaPago, plazoPagoDias,
      email: limpio(row.EMAIL),
      telefono: limpio(row.TELEFONO),
      observaciones: obs,
      activo: row.ESTADO === "Activo",
      empresaId,
      createdAt: fechaBubble(row["Creation Date"]) || undefined,
    });
  }
  if (APLICAR) {
    await crearEnLotes("cliente", datos);
    for (const dias of plazosNecesarios) {
      await prisma.plazoPago.upsert({
        where: { empresaId_dias: { empresaId, dias } },
        update: { activo: true },
        create: { empresaId, dias, activo: true },
      });
    }
  }
  if (plazosNecesarios.size > 0) {
    console.log(`  Plazos de pago detectados: ${[...plazosNecesarios].join(", ")} días.`);
  }
  console.log(`  ${APLICAR ? "Creados" : "Se crearían"} ${datos.length} clientes.`);
  return { clienteIdPorNombre: idPorNombre, maquinasPorCliente };
}

// ---------------------------------------------------------------------------
// Paso 3: Máquinas
// ---------------------------------------------------------------------------

async function migrarMaquinas(maquinasPorCliente) {
  const filas = leerCsv("TBL-MAQUINAS");
  console.log(`\n--- Paso 3: Máquinas (${filas.length} filas) ---`);

  // Bubble no guarda el cliente en la máquina: el cliente lista las series de
  // sus máquinas. Se reconstruye el dueño de cada máquina a partir de ahí.
  const candidatosPorSerie = new Map();
  for (const row of filas) {
    const serie = limpio(row.NUMERO_SERIE);
    if (!serie) continue;
    if (!candidatosPorSerie.has(serie)) candidatosPorSerie.set(serie, []);
    candidatosPorSerie.get(serie).push({ maquinaId: row["unique id"], clienteIdAsignado: null });
  }

  const consumidos = new Map();
  const dueno = new Map();
  const seriesAmbiguas = [...candidatosPorSerie.entries()].filter(([, v]) => v.length > 1).map(([k]) => k);

  for (const [clienteId, series] of maquinasPorCliente) {
    for (const serie of series) {
      const candidatos = candidatosPorSerie.get(serie);
      if (!candidatos || candidatos.length === 0) {
        avisar(`Cliente ${clienteId}: la máquina de serie "${serie}" no existe en la tabla de máquinas. Se ignora.`);
        continue;
      }
      const i = consumidos.get(serie) || 0;
      const elegido = candidatos[Math.min(i, candidatos.length - 1)];
      consumidos.set(serie, i + 1);
      elegido.clienteIdAsignado = clienteId;
      dueno.set(elegido.maquinaId, clienteId);
    }
  }
  if (seriesAmbiguas.length > 0) {
    avisar(
      `${seriesAmbiguas.length} números de serie de máquina están repetidos en Bubble (${seriesAmbiguas.join(", ")}). ` +
      "Se asignan al cliente que los reclama; conviene revisar esas máquinas tras migrar."
    );
  }

  const datos = [];
  const maquinaIdsCreadas = new Set();
  let descartadas = 0;
  for (const row of filas) {
    const id = row["unique id"];
    const serie = limpio(row.NUMERO_SERIE);
    const marca = limpio(row.MARCA);
    if (!serie || !marca || marca === "," || serie === ",") {
      avisar(`Máquina ${id}: fila con datos corruptos en Bubble (marca/serie vacíos o rotos). Se descarta.`);
      descartadas++;
      continue;
    }
    const clienteId = dueno.get(id);
    if (!clienteId) {
      avisar(`Máquina ${id} (${marca}, serie ${serie}) no aparece en la lista de ningún cliente. Se descarta.`);
      descartadas++;
      continue;
    }
    datos.push({
      id, marca,
      modelo: limpio(row.MODELO) || "-",
      numeroDeSerie: serie,
      horasIniciales: numeroEs(row.HORAS_INICIALES),
      horasActuales: numeroEs(row.HORAS_INICIALES),
      observaciones: limpio(row.OBSERVACIONES),
      estado: row.ESTADO === "Activo" ? "activo" : "inactivo",
      clienteId,
      createdAt: fechaBubble(row["Creation Date"]) || undefined,
    });
    maquinaIdsCreadas.add(id);
  }
  if (APLICAR) await crearEnLotes("maquina", datos);
  console.log(`  ${APLICAR ? "Creadas" : "Se crearían"} ${datos.length} máquinas (${descartadas} descartadas).`);
  return { candidatosPorSerie, maquinaIdsCreadas };
}

// ---------------------------------------------------------------------------
// Paso 4: Órdenes
// ---------------------------------------------------------------------------

async function migrarOrdenes(empresaId, clienteIdPorNombre, resolverMaquina) {
  const filas = leerCsv("TBL-ORDENES");
  console.log(`\n--- Paso 4: Órdenes (${filas.length} filas) ---`);

  const ordenIdsValidos = new Set();
  const lecturasPorMaquina = new Map(); // maquinaId -> [{ horas, fecha, ordenId }]
  const firmaPorOrden = new Map();      // ordenId -> url de la firma en Bubble
  let creadas = 0, descartadas = 0, seq = 0, lecturasPlaceholder = 0;

  const fechaOrden = (r) => fechaBubble(r.FECHA_INICIO) || fechaBubble(r["Creation Date"]) || new Date(0);
  const ordenadas = [...filas].sort((a, b) => fechaOrden(a).getTime() - fechaOrden(b).getTime());

  for (const row of ordenadas) {
    const id = row["unique id"];
    const nombreCliente = limpio(row.TBL_CLIENTE);
    const clienteId = nombreCliente ? clienteIdPorNombre.get(nombreCliente) : null;
    if (!clienteId) {
      avisar(`Orden nº Bubble ${row.NUM_ORDEN} (${id}): cliente "${nombreCliente}" no encontrado. Se descarta.`);
      descartadas++;
      continue;
    }
    const maquinaId = resolverMaquina(clienteId, row.TBL_MAQUINA, `Orden nº Bubble ${row.NUM_ORDEN}`);
    if (!maquinaId) { descartadas++; continue; }

    const fecha = fechaOrden(row);
    const fechaFin = fechaBubble(row.FECHA_FIN);
    let horasTrabajo = 0;
    if (fechaFin) {
      const diff = (fechaFin.getTime() - fecha.getTime()) / 3_600_000;
      if (diff > 0 && diff < 24 * 30) horasTrabajo = diff;
    }

    // En Bubble, HORAS_ACTUALES vale 1 cuando no se llegó a introducir lectura
    // (es el valor por defecto): no se trata como una lectura real.
    const horasMaquina = numeroEs(row.HORAS_ACTUALES);
    const tieneLectura = !vacio(row.HORAS_ACTUALES) && horasMaquina > 1;
    if (!vacio(row.HORAS_ACTUALES) && horasMaquina <= 1) lecturasPlaceholder++;
    if (tieneLectura) {
      if (!lecturasPorMaquina.has(maquinaId)) lecturasPorMaquina.set(maquinaId, []);
      lecturasPorMaquina.get(maquinaId).push({ horas: horasMaquina, fecha, ordenId: id });
    }

    seq++;
    const data = {
      id,
      numero: `ORD-${pad(seq, 5)}`,
      empresaId,
      fecha,
      direccionReparacion: limpio(row.DIRECCION),
      trabajosRealizados: limpio(row.TRABAJOS_REALIZADOS),
      observaciones: `Nº de orden original en Bubble: ${row.NUM_ORDEN}`,
      estado: row.ESTADO === "Finalizado" ? "completado" : "pendiente",
      firmaDni: limpio(row.FIN_DNI),
      firmaObservaciones: limpio(row.FIN_OBSERVACIONES),
      clienteId,
      maquinaId,
      horasTrabajo,
      horasMaquinaRegistradas: tieneLectura ? horasMaquina : null,
      createdAt: fechaBubble(row["Creation Date"]) || undefined,
    };
    if (APLICAR) await prisma.orden.create({ data });
    ordenIdsValidos.add(id);
    const urlFirma = limpio(row.FIN_FIRMA);
    if (urlFirma) firmaPorOrden.set(id, urlFirma);
    creadas++;
  }

  if (APLICAR) {
    await prisma.contadorOrden.upsert({
      where: { empresaId },
      update: { contador: seq },
      create: { empresaId, contador: seq },
    });
  }
  if (lecturasPlaceholder > 0) {
    avisar(`Horas de máquina: ${lecturasPlaceholder} órdenes tenían la lectura de horas en 1 (valor por defecto de Bubble cuando no se introducía). No se tratan como lectura real: esas órdenes quedan sin horas de máquina registradas.`);
  }
  avisar(
    "Órdenes: el NUM_ORDEN de Bubble no era fiable (el contador se reinició y hay números repetidos). Cada orden se ha " +
    "renumerado de forma correlativa por fecha (ORD-00001, ORD-00002, ...) y el número original se guarda en sus observaciones."
  );
  console.log(`  ${APLICAR ? "Creadas" : "Se crearían"} ${creadas} órdenes (${descartadas} descartadas).`);
  console.log(`  Contador de órdenes ${APLICAR ? "dejado" : "que se dejaría"} en ${seq} (la próxima será ORD-${pad(seq + 1, 5)}).`);
  return { ordenIdsValidos, lecturasPorMaquina, firmaPorOrden };
}

// ---------------------------------------------------------------------------
// Paso 5: Servicios y recambios de cada orden
// ---------------------------------------------------------------------------

async function migrarServiciosDeOrden(ordenIdsValidos, tipoServicioPorNombreBubble) {
  const filas = leerCsv("TBL-O-SERVICIOS");
  console.log(`\n--- Paso 5a: Líneas de servicio de órdenes (${filas.length} filas) ---`);
  const datos = [];
  let descartadas = 0;
  for (const row of filas) {
    const ordenId = limpio(row.ID_ORDEN);
    if (!ordenId || !ordenIdsValidos.has(ordenId)) { descartadas++; continue; }
    const tipoNombre = limpio(row.TIPO_SERVICIO);
    const tipoServicioId = tipoServicioPorNombreBubble[tipoNombre];
    if (!tipoServicioId) {
      avisar(`Servicio ${row["unique id"]}: tipo de servicio "${tipoNombre}" no reconocido. Se descarta.`);
      descartadas++;
      continue;
    }
    datos.push({
      id: row["unique id"],
      fecha: fechaBubble(row.FECHA_REGISTRO) || fechaBubble(row["Creation Date"]) || new Date(),
      tipoServicioId,
      cantidad: numeroEs(row.CANTIDAD),
      precio: numeroEs(row.VAL_UNITARIO),
      descripcion: limpio(row.OBSERVACIONES),
      ordenId,
    });
  }
  if (APLICAR) await crearEnLotes("servicio", datos);
  if (descartadas > 0) avisar(`Servicios de órdenes: ${descartadas} líneas apuntaban a una orden que no existe (o no se migra) y se han descartado.`);
  console.log(`  ${APLICAR ? "Creadas" : "Se crearían"} ${datos.length} líneas de servicio (${descartadas} descartadas).`);
}

async function migrarRecambiosDeOrden(ordenIdsValidos) {
  const filas = leerCsv("TBL-O-RECAMBIOS");
  console.log(`\n--- Paso 5b: Recambios de órdenes (${filas.length} filas) ---`);
  const datos = [];
  let descartadas = 0;
  for (const row of filas) {
    const ordenId = limpio(row.ID_ORDEN);
    if (!ordenId || !ordenIdsValidos.has(ordenId)) { descartadas++; continue; }
    const precio = numeroEs(row.VAL_UNITARIO);
    const nombre = limpio(row.NOMBRE_RECAMBIO) || "Recambio";
    const obs = limpio(row.OBSERVACIONES);
    datos.push({
      id: row["unique id"],
      descripcion: obs ? `${nombre} — ${obs}` : nombre,
      cantidad: numeroEs(row.CANTIDAD) || 1,
      precioCoste: precio,
      precioVenta: precio,
      ordenId,
    });
  }
  if (APLICAR) await crearEnLotes("repuesto", datos);
  avisar("Recambios: Bubble solo guardaba un precio por línea; se usa el mismo valor como precio de coste y de venta.");
  if (descartadas > 0) avisar(`Recambios de órdenes: ${descartadas} líneas apuntaban a una orden que no existe (o no se migra) y se han descartado.`);
  console.log(`  ${APLICAR ? "Creados" : "Se crearían"} ${datos.length} recambios (${descartadas} descartados).`);
}

// ---------------------------------------------------------------------------
// Paso 6: horas actuales de cada máquina (la mayor lectura registrada)
// ---------------------------------------------------------------------------

async function actualizarHorasMaquinas(lecturasPorMaquina) {
  console.log(`\n--- Paso 6: horas actuales de máquinas (${lecturasPorMaquina.size} máquinas con lecturas) ---`);
  let anomalias = 0;
  for (const [maquinaId, lecturas] of lecturasPorMaquina) {
    const ordenadas = [...lecturas].sort((a, b) => a.fecha.getTime() - b.fecha.getTime());
    const ultima = ordenadas[ordenadas.length - 1];
    const maxima = Math.max(...ordenadas.map((l) => l.horas));
    if (maxima > ultima.horas * 1.05 + 10) {
      anomalias++;
      avisar(`Máquina ${maquinaId}: la última lectura de horas (${ultima.horas}) es menor que otra anterior (${maxima}); se toma la mayor (${maxima}) como horas actuales. Revisa si alguna lectura está mal introducida.`);
    }
    if (APLICAR) {
      await prisma.maquina.update({ where: { id: maquinaId }, data: { horasActuales: maxima } });
      await prisma.historialHorasMaquina.createMany({
        data: ordenadas.map((l, i) => ({
          maquinaId,
          horas: l.horas,
          horasAnteriores: i > 0 ? ordenadas[i - 1].horas : null,
          ordenId: l.ordenId,
          usuarioId: null,
          fecha: l.fecha,
        })),
      });
    }
  }
  console.log(`  ${APLICAR ? "Actualizadas" : "Se actualizarían"} ${lecturasPorMaquina.size} máquinas (${anomalias} con lecturas incoherentes, ver avisos).`);
}

// ---------------------------------------------------------------------------
// Paso 7: Facturas
// ---------------------------------------------------------------------------

async function migrarFacturas(empresaId, clienteIdPorNombre, ordenIdsValidos, serieDefault) {
  const filas = leerCsv("TBL-FACTURAS");
  console.log(`\n--- Paso 7: Facturas (${filas.length} filas) ---`);

  let sinCliente = 0, borradoresVacios = 0;
  const validas = [];
  for (const row of filas) {
    if (vacio(row.TBL_CLIENTE)) { sinCliente++; continue; }
    // Borradores que Bubble creó al abrir una factura y que nunca se completaron.
    if (vacio(row["6_TOTAL_FACTURA"]) && vacio(row.FECHA_FACTURA)) {
      borradoresVacios++;
      avisar(`Factura nº Bubble ${row.NUM_FACTURA} (${row.TBL_CLIENTE}): borrador vacío sin fecha ni importe. Se descarta.`);
      continue;
    }
    validas.push(row);
  }
  if (sinCliente > 0) avisar(`${sinCliente} facturas de Bubble no tenían cliente (registros huérfanos de facturas borradas allí). Se descartan.`);

  const fechaFactura = (r) => fechaBubble(r.FECHA_FACTURA) || fechaBubble(r["Creation Date"]) || new Date(0);
  const ordenadas = [...validas].sort((a, b) => fechaFactura(a).getTime() - fechaFactura(b).getTime());

  // Una orden solo puede enlazar con una factura: si Bubble tiene varias para
  // la misma orden, se enlaza la pagada (o la más antigua) y se avisa.
  const facturasPorOrden = new Map();
  for (const row of ordenadas) {
    const ordenId = limpio(row.TBL_ORDEN);
    if (!ordenId || !ordenIdsValidos.has(ordenId)) continue;
    if (!facturasPorOrden.has(ordenId)) facturasPorOrden.set(ordenId, []);
    facturasPorOrden.get(ordenId).push(row);
  }
  const facturaEnlazadaPorOrden = new Map();
  for (const [ordenId, rows] of facturasPorOrden) {
    const elegida = rows.find((r) => r.ESTADO === "Pagado") || rows[0];
    facturaEnlazadaPorOrden.set(ordenId, elegida["unique id"]);
    if (rows.length > 1) {
      avisar(`La orden ${ordenId} tiene ${rows.length} facturas en Bubble (nº ${rows.map((r) => r.NUM_FACTURA).join(", ")}). Se migran todas, pero la orden solo se enlaza con la nº ${elegida.NUM_FACTURA}.`);
    }
  }

  let seq = 0, creadas = 0, descartadas = sinCliente + borradoresVacios, pagadasSinFecha = 0;
  for (const row of ordenadas) {
    const id = row["unique id"];
    const clienteId = clienteIdPorNombre.get(limpio(row.TBL_CLIENTE));
    if (!clienteId) {
      avisar(`Factura nº Bubble ${row.NUM_FACTURA} (${id}): cliente "${row.TBL_CLIENTE}" no encontrado. Se descarta.`);
      descartadas++;
      continue;
    }
    const ordenId = limpio(row.TBL_ORDEN);
    const enlazar = ordenId && facturaEnlazadaPorOrden.get(ordenId) === id;
    const tieneOrden = ordenId && ordenIdsValidos.has(ordenId);

    const fecha = fechaFactura(row);
    seq++;
    const numero = `${serieDefault.prefijo}-${pad(seq, 3)}-${fecha.getFullYear()}`;

    const estado = row.ESTADO === "Pagado" ? "cobrada" : "pendiente";
    const pct = numeroEs(row["2_PORCENTAJE_DESCUENTO"]);
    const descImporte = numeroEs(row["3_TOTAL_DESCUENTO"]);
    const tipoDescuento = pct > 0 ? "porcentaje" : "euro";
    const descuentoValor = pct > 0 ? pct : descImporte;

    let fechaPago = null;
    if (estado === "cobrada") {
      fechaPago = fechaBubble(row.FECHA_PAGADO);
      if (!fechaPago) pagadasSinFecha++;
    }

    const data = {
      id, numero, empresaId,
      fecha,
      estado,
      baseImponible: numeroEs(row["1_TOTAL_SI"]),
      descuento: descImporte,
      tipoDescuento,
      descuentoValor,
      iva: numeroEs(row["5_TOTAL_IVA"]), // en partia "iva" es el importe del IVA, no el porcentaje
      total: numeroEs(row["6_TOTAL_FACTURA"]),
      esDirecta: !tieneOrden,
      serieId: serieDefault.id,
      clienteId,
      notas: `Nº de factura original en Bubble: ${row.NUM_FACTURA}`,
      fechaPago,
      createdAt: fechaBubble(row["Creation Date"]) || undefined,
      ...(enlazar ? { ordenes: { connect: { id: ordenId } } } : {}),
    };
    if (APLICAR) await prisma.factura.create({ data });
    creadas++;
  }

  if (APLICAR) {
    await prisma.serieFacturacion.update({ where: { id: serieDefault.id }, data: { contadorActual: seq } });
  }
  if (pagadasSinFecha > 0) avisar(`${pagadasSinFecha} facturas pagadas no tenían fecha de pago en Bubble; quedan cobradas sin fecha de pago.`);
  avisar(
    "Facturas: el NUM_FACTURA de Bubble no era fiable (el contador se reinició varias veces y hay números repetidos). Cada factura se " +
    "ha renumerado de forma correlativa por fecha y el número original se guarda en sus notas."
  );
  avisar("Facturas: se migran sin huella Veri*Factu (son anteriores a la normativa). La cadena de huellas empezará con la primera factura nueva.");
  avisar("Facturas: Bubble solo guardaba totales, no líneas. Las facturas migradas tienen importes correctos pero no desglose de conceptos propio.");
  console.log(`  ${APLICAR ? "Creadas" : "Se crearían"} ${creadas} facturas (${descartadas} descartadas).`);
  console.log(`  Contador de la serie "${serieDefault.nombre}" ${APLICAR ? "dejado" : "que se dejaría"} en ${seq} (la próxima será ${serieDefault.prefijo}-${pad(seq + 1, 3)}-${new Date().getFullYear()}).`);
}

// ---------------------------------------------------------------------------
// Paso 8: Presupuestos
// ---------------------------------------------------------------------------

async function migrarPresupuestos(empresaId, clienteIdPorNombre, resolverMaquina) {
  const filas = leerCsv("PRESUPUESTOS");
  console.log(`\n--- Paso 8: Presupuestos (${filas.length} filas) ---`);

  const fechaPres = (r) => fechaBubble(r["Creation Date"]) || new Date(0);
  const ordenados = [...filas].sort((a, b) => fechaPres(a).getTime() - fechaPres(b).getTime());
  const seqPorAnio = new Map();
  let creados = 0, descartados = 0;

  for (const row of ordenados) {
    const id = row["unique id"];
    const nombreCliente = limpio(row.TBL_CLIENTE);
    const clienteId = nombreCliente ? clienteIdPorNombre.get(nombreCliente) : null;
    if (!clienteId) {
      avisar(`Presupuesto nº Bubble ${row.NUM_PRESUPUESTO} (${id}): cliente "${nombreCliente}" no encontrado. Se descarta.`);
      descartados++;
      continue;
    }
    const maquinaId = resolverMaquina(clienteId, row.TBL_MAQUINA, `Presupuesto nº Bubble ${row.NUM_PRESUPUESTO}`);

    const fecha = fechaPres(row);
    const anio = fecha.getFullYear();
    const seq = (seqPorAnio.get(anio) || 0) + 1;
    seqPorAnio.set(anio, seq);

    // En Bubble TOTAL es el importe sin IVA tras descuento; en partia hay que
    // guardar base, descuento, importe del IVA y total con IVA.
    const baseSinDescuento = numeroEs(row.TOTAL_ANTES) || numeroEs(row.TOTAL);
    const baseConDescuento = numeroEs(row.TOTAL) || baseSinDescuento;
    const descuento = redondea(Math.max(0, baseSinDescuento - baseConDescuento));
    const iva = redondea(baseConDescuento * 0.21);
    if (!vacio(row.TOTAL_DESCUENTO) && Math.abs(numeroEs(row.TOTAL_DESCUENTO) - descuento) > 0.01) {
      avisar(`Presupuesto nº Bubble ${row.NUM_PRESUPUESTO}: el descuento de Bubble (${numeroEs(row.TOTAL_DESCUENTO)}) no cuadra con la diferencia entre importes (${descuento}); se usa la diferencia.`);
    }

    const data = {
      id,
      numero: `PRES-${pad(seq, 3)}-${anio}`,
      empresaId,
      fecha,
      estado: row.ESTADO === "Aceptado" ? "aceptado" : "enviado",
      direccionReparacion: limpio(row.DIRECCION),
      descripcion: limpio(row.TRABAJOS_REALIZADOS),
      observaciones: `Nº de presupuesto original en Bubble: ${row.NUM_PRESUPUESTO}`,
      baseImponible: baseSinDescuento,
      descuento,
      tipoDescuento: "euro",
      descuentoValor: descuento,
      iva,
      total: redondea(baseConDescuento + iva),
      clienteId,
      maquinaId,
      createdAt: fechaBubble(row["Creation Date"]) || undefined,
    };
    if (APLICAR) await prisma.presupuesto.create({ data });
    creados++;
  }

  if (APLICAR) {
    for (const [anio, seq] of seqPorAnio) {
      await prisma.contadorPresupuesto.upsert({
        where: { empresaId_anio: { empresaId, anio } },
        update: { contador: seq },
        create: { empresaId, anio, contador: seq },
      });
    }
  }
  avisar("Presupuestos: se migran con sus importes totales pero sin líneas de servicios/recambios (no se han exportado). Renumerados por año con su número original de Bubble en observaciones.");
  console.log(`  ${APLICAR ? "Creados" : "Se crearían"} ${creados} presupuestos (${descartados} descartados).`);
  for (const [anio, seq] of seqPorAnio) {
    console.log(`  Contador de presupuestos ${anio} ${APLICAR ? "dejado" : "que se dejaría"} en ${seq} (siguiente PRES-${pad(seq + 1, 3)}-${anio}).`);
  }
}

// ---------------------------------------------------------------------------
// Paso 9: Compras
// ---------------------------------------------------------------------------

async function migrarCompras(empresaId, proveedorIdPorNombre) {
  const filas = leerCsv("TBL-COMPRAS");
  console.log(`\n--- Paso 9: Compras (${filas.length} filas) ---`);
  let creadas = 0;
  for (const row of filas) {
    const nombreProveedor = limpio(row.TBL_PROVEEDOR);
    const proveedorId = nombreProveedor ? proveedorIdPorNombre.get(nombreProveedor) : null;
    if (nombreProveedor && !proveedorId) {
      avisar(`Compra ${row["unique id"]}: proveedor "${nombreProveedor}" no encontrado. Se deja sin proveedor vinculado (se conserva el nombre).`);
    }
    const total = numeroEs(row.COSTE_TOTAL);
    const obs = [
      limpio(row.OBSERVACIONES),
      row.ESTADO ? `Estado en Bubble: ${row.ESTADO}` : null,
      row.PAGADO ? `Pagado: ${row.PAGADO}` : null,
      row.FORMA_PAGO ? `Forma de pago: ${row.FORMA_PAGO}` : null,
    ].filter(Boolean).join(" | ") || null;

    const data = {
      id: row["unique id"],
      fecha: fechaBubble(row.FECHA_COMPRA) || fechaBubble(row["Creation Date"]) || new Date(),
      proveedorId: proveedorId || null,
      proveedorNombre: nombreProveedor,
      total,
      observaciones: obs,
      empresaId,
      createdAt: fechaBubble(row["Creation Date"]) || undefined,
      lineas: { create: [{ descripcion: "Compra migrada de Bubble", cantidad: 1, precioCoste: total, precioVenta: 0 }] },
    };
    if (APLICAR) await prisma.compra.create({ data });
    creadas++;
  }
  avisar('Compras: el "Estado" y "Pagado" de Bubble no tienen campo en partia; se han añadido como texto en las observaciones.');
  console.log(`  ${APLICAR ? "Creadas" : "Se crearían"} ${creadas} compras.`);
}

// ---------------------------------------------------------------------------
// Paso 10: Firmas (se descargan de Bubble y se guardan dentro de la orden)
// ---------------------------------------------------------------------------

async function descargarFirma(url) {
  const completa = url.startsWith("//") ? `https:${url}` : url;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 30000);
  try {
    const res = await fetch(completa, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length === 0) throw new Error("respuesta vacía");
    return `data:image/png;base64,${buf.toString("base64")}`;
  } finally {
    clearTimeout(t);
  }
}

async function migrarFirmas(firmaPorOrden) {
  console.log(`\n--- Paso 10: Firmas de las órdenes (${firmaPorOrden.size} con firma) ---`);
  if (SIN_FIRMAS) {
    avisar("Firmas: omitidas por --sin-firmas. Las órdenes se han migrado sin imagen de firma.");
    console.log("  Omitido (--sin-firmas).");
    return;
  }
  const entradas = [...firmaPorOrden.entries()];
  if (entradas.length === 0) return;

  // Prueba de conectividad con las primeras firmas antes de lanzar todas.
  let probadas = 0;
  for (const [, url] of entradas.slice(0, 3)) {
    try { await descargarFirma(url); probadas++; } catch (e) { /* se informa abajo */ }
  }
  if (probadas === 0) {
    avisar("Firmas: no se ha podido descargar ninguna (¿sin conexión con Bubble?). Las órdenes quedan sin imagen de firma.");
    console.log("  ⚠ No se pudo descargar ninguna firma de prueba; se omite este paso.");
    return;
  }
  if (!APLICAR) {
    console.log(`  Prueba de descarga correcta (${probadas}/3). Con --apply se descargarían y guardarían ${entradas.length} firmas.`);
    return;
  }

  let ok = 0, fallos = 0, hecho = 0;
  const fallidas = [];
  const concurrencia = 6;
  let indice = 0;
  async function trabajador() {
    while (indice < entradas.length) {
      const [ordenId, url] = entradas[indice++];
      try {
        let dataUri;
        for (let intento = 1; ; intento++) {
          try { dataUri = await descargarFirma(url); break; }
          catch (e) { if (intento >= 3) throw e; await new Promise((r) => setTimeout(r, 1000 * intento)); }
        }
        await prisma.orden.update({ where: { id: ordenId }, data: { firmaBase64: dataUri } });
        ok++;
      } catch (e) {
        fallos++;
        fallidas.push(ordenId);
      }
      hecho++;
      if (hecho % 100 === 0) console.log(`  ... ${hecho}/${entradas.length} firmas procesadas`);
    }
  }
  await Promise.all(Array.from({ length: concurrencia }, trabajador));
  if (fallos > 0) avisar(`Firmas: ${fallos} no se pudieron descargar (órdenes: ${fallidas.slice(0, 10).join(", ")}${fallidas.length > 10 ? ", ..." : ""}).`);
  console.log(`  Firmas guardadas: ${ok}. Fallidas: ${fallos}.`);
}

// ---------------------------------------------------------------------------

main()
  .catch((e) => {
    console.error("\n❌ Error durante la migración:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
