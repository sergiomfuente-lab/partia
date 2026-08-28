// Utilidades para la "huella" (hash SHA-256 encadenado) de los registros de
// facturación, siguiendo el formato publicado por la AEAT para Veri*Factu /
// RRSIF (Real Decreto 1007/2023):
//
//   IDEmisorFactura=...&NumSerieFactura=...&FechaExpedicionFactura=DD-MM-YYYY
//   &TipoFactura=F1&CuotaTotal=0.00&ImporteTotal=0.00&Huella=<hash anterior o vacío>
//   &FechaHoraHusoGenRegistro=YYYY-MM-DDTHH:mm:ss+HH:mm
//
// Referencia: "Veri-Factu_especificaciones_huella_hash_registros.pdf" (AEAT).
//
// IMPORTANTE: esto es preparación técnica. Antes de activar el envío real a
// la AEAT (modalidad Veri*Factu) o la firma electrónica local (modalidad no
// Veri*Factu) hay que validar estos valores exactos con la gestoría y, en su
// caso, adaptar TipoFactura/CuotaTotal a facturas simplificadas, operaciones
// exentas, etc. Ver preguntas_gestoria_verifactu.md.

import crypto from "crypto";

const TIMEZONE = "Europe/Madrid";

function parteFecha(fecha: Date, timeZone: string) {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false,
  }).formatToParts(fecha);
  const get = (t: string) => partes.find((p) => p.type === t)?.value ?? "00";
  return {
    year: get("year"), month: get("month"), day: get("day"),
    hour: get("hour") === "24" ? "00" : get("hour"),
    minute: get("minute"), second: get("second"),
  };
}

/** Formatea una fecha como DD-MM-YYYY en la zona horaria de España (FechaExpedicionFactura). */
export function formatFechaExpedicion(fecha: Date, timeZone: string = TIMEZONE): string {
  const p = parteFecha(fecha, timeZone);
  return `${p.day}-${p.month}-${p.year}`;
}

/** Calcula el offset (en minutos) de una zona horaria respecto a UTC en un instante dado. */
function offsetMinutos(fecha: Date, timeZone: string): number {
  const p = parteFecha(fecha, timeZone);
  const comoUTC = Date.UTC(
    parseInt(p.year), parseInt(p.month) - 1, parseInt(p.day),
    parseInt(p.hour), parseInt(p.minute), parseInt(p.second)
  );
  return Math.round((comoUTC - fecha.getTime()) / 60000);
}

/** Formatea fecha+hora con huso horario, ej. 2026-08-28T12:34:56+02:00 (FechaHoraHusoGenRegistro). */
export function formatFechaHoraHuso(fecha: Date, timeZone: string = TIMEZONE): string {
  const p = parteFecha(fecha, timeZone);
  const local = `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}`;
  const offset = offsetMinutos(fecha, timeZone);
  const signo = offset >= 0 ? "+" : "-";
  const abs = Math.abs(offset);
  const hh = String(Math.floor(abs / 60)).padStart(2, "0");
  const mm = String(abs % 60).padStart(2, "0");
  return `${local}${signo}${hh}:${mm}`;
}

export type TipoFacturaVerifactu = "F1" | "F2" | "R1" | "R2" | "R3" | "R4" | "R5";

export interface DatosHuella {
  nifEmisor: string;
  numeroFactura: string;
  fechaExpedicion: Date;
  tipoFactura: TipoFacturaVerifactu;
  cuotaTotal: number;
  importeTotal: number;
  huellaAnterior: string | null;
  fechaHoraGeneracion: Date;
}

/**
 * Calcula la huella SHA-256 (en mayúsculas, hexadecimal) de un registro de
 * facturación siguiendo el algoritmo de la AEAT para Veri*Factu.
 */
export function calcularHuella(datos: DatosHuella): string {
  const cadena = [
    `IDEmisorFactura=${datos.nifEmisor ?? ""}`,
    `NumSerieFactura=${datos.numeroFactura}`,
    `FechaExpedicionFactura=${formatFechaExpedicion(datos.fechaExpedicion)}`,
    `TipoFactura=${datos.tipoFactura}`,
    `CuotaTotal=${datos.cuotaTotal.toFixed(2)}`,
    `ImporteTotal=${datos.importeTotal.toFixed(2)}`,
    `Huella=${datos.huellaAnterior ?? ""}`,
    `FechaHoraHusoGenRegistro=${formatFechaHoraHuso(datos.fechaHoraGeneracion)}`,
  ].join("&");

  return crypto.createHash("sha256").update(cadena, "utf-8").digest("hex").toUpperCase();
}
