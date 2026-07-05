import React from "react";
import {
  Document, Page, Text, View, StyleSheet, Image,
} from "@react-pdf/renderer";

const c = {
  negro:     "#0B1120",
  azul:      "#185FA5",
  gris:      "#6B7280",
  grisClaro: "#9CA3AF",
  borde:     "#E5E7EB",
  fondo:     "#F9FAFB",
};

const s = StyleSheet.create({
  page:          { fontSize: 8, color: c.negro, padding: 40, backgroundColor: "#fff" },
  row:           { flexDirection: "row" },
  col:           { flex: 1 },
  headerLeft:    { flex: 1 },
  headerRight:   { flex: 1, alignItems: "flex-end" },
  logo:          { width: 120, height: 50, objectFit: "contain", marginBottom: 6 },
  empresa:       { fontSize: 11, fontWeight: 700, marginBottom: 2 },
  empresaSub:    { fontSize: 7, color: c.gris, marginBottom: 1 },
  numLabel:      { fontSize: 7, color: c.azul, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 1 },
  numValue:      { fontSize: 13, fontWeight: 700, marginBottom: 4 },
  fechaLabel:    { fontSize: 7, color: c.gris, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 1 },
  fechaValue:    { fontSize: 8, fontWeight: 600, marginBottom: 4 },
  divider:       { borderBottomWidth: 1, borderBottomColor: c.borde, marginVertical: 12 },
  partesRow:     { flexDirection: "row", marginBottom: 16 },
  parteLabel:    { fontSize: 7, color: c.gris, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  parteNombre:   { fontSize: 9, fontWeight: 700, marginBottom: 2 },
  parteSub:      { fontSize: 7, color: c.gris, marginBottom: 1 },
  seccionLabel:  { fontSize: 7, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4, marginTop: 10 },
  maquinaBox:    { backgroundColor: c.fondo, borderRadius: 4, padding: 8, marginBottom: 8 },
  maquinaText:   { fontSize: 7, color: c.gris },
  tablaHeader:   { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#D1D5DB", paddingBottom: 4, marginBottom: 4 },
  tablaHeaderTxt:{ fontSize: 7, color: c.gris, fontWeight: 600 },
  tablaRow:      { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: c.borde, paddingVertical: 3 },
  tablaTxt:      { fontSize: 7, color: c.negro },
  tablaGris:     { fontSize: 7, color: c.gris },

  // Columnas servicios libres
  slCol1: { width: "55%", textAlign: "left" },
  slCol2: { width: "15%", textAlign: "right" },
  slCol3: { width: "15%", textAlign: "right" },
  slCol4: { width: "15%", textAlign: "right" },

  // Columnas repuestos
  rCol1: { width: "42%" },
  rCol2: { width: "16%", textAlign: "right" },
  rCol3: { width: "21%", textAlign: "right" },
  rCol4: { width: "21%", textAlign: "right" },

  totalesBox:    { flexDirection: "row", justifyContent: "flex-end", marginTop: 12 },
  totalesInner:  { width: 200 },
  totalRow:      { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3, borderBottomWidth: 1, borderBottomColor: c.borde },
  totalLabel:    { fontSize: 7, color: c.gris },
  totalValue:    { fontSize: 7, fontWeight: 600 },
  totalFinalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 5, borderTopWidth: 2, borderTopColor: c.negro, marginTop: 2 },
  totalFinalLbl: { fontSize: 10, fontWeight: 700 },
  totalFinalVal: { fontSize: 10, fontWeight: 700 },

  validezBox:    { marginTop: 12, padding: 8, backgroundColor: c.fondo, borderRadius: 4 },
  validezTxt:    { fontSize: 7, color: c.gris },

  pieBox:        { marginTop: 16, paddingTop: 10, borderTopWidth: 1, borderTopColor: c.borde },
  pieNotas:      { fontSize: 7, color: c.gris, lineHeight: 1.5 },
});

const fmt = (d: string) =>
  new Date(d).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });

export default function PresupuestoPDF({ presupuesto, empresa }: { presupuesto: any; empresa: any }) {
  return (
    <Document>
      <Page size="A4" style={s.page}>

        {/* CABECERA */}
        <View style={s.row}>
          <View style={s.headerLeft}>
            {empresa?.logoBase64 && (
              <Image src={empresa.logoBase64} style={s.logo} />
            )}
            <Text style={s.empresa}>{empresa?.nombreFiscal || "—"}</Text>
            {empresa?.cifNif           && <Text style={s.empresaSub}>{empresa.cifNif}</Text>}
            {empresa?.direccionFiscal  && <Text style={s.empresaSub}>{empresa.direccionFiscal}</Text>}
            {(empresa?.codigoPostal || empresa?.ciudad) && (
              <Text style={s.empresaSub}>
                {empresa.codigoPostal} {empresa.ciudad}{empresa.provincia ? ` (${empresa.provincia})` : ""}
              </Text>
            )}
            {empresa?.telefono         && <Text style={s.empresaSub}>{empresa.telefono}</Text>}
            {empresa?.emailFacturacion && <Text style={s.empresaSub}>{empresa.emailFacturacion}</Text>}
          </View>

          <View style={s.headerRight}>
            <Text style={s.numLabel}>Presupuesto</Text>
            <Text style={s.numValue}>{presupuesto.numero}</Text>
            <Text style={s.fechaLabel}>Fecha</Text>
            <Text style={s.fechaValue}>{fmt(presupuesto.fecha)}</Text>
            {presupuesto.validezHasta && (
              <>
                <Text style={s.fechaLabel}>Válido hasta</Text>
                <Text style={s.fechaValue}>{fmt(presupuesto.validezHasta)}</Text>
              </>
            )}
          </View>
        </View>

        <View style={s.divider} />

        {/* PARTES */}
        <View style={s.partesRow}>
          <View style={s.col}>
            <Text style={s.parteLabel}>Datos del técnico</Text>
            <Text style={s.parteNombre}>{empresa?.nombreFiscal || "—"}</Text>
            {empresa?.cifNif && <Text style={s.parteSub}>{empresa.cifNif}</Text>}
          </View>
          <View style={[s.col, { alignItems: "flex-end" }]}>
            <Text style={s.parteLabel}>Presupuesto para</Text>
            <Text style={s.parteNombre}>{presupuesto.cliente.nombre}</Text>
            {presupuesto.cliente.razonSocial && (
              <Text style={s.parteSub}>{presupuesto.cliente.razonSocial}</Text>
            )}
            {presupuesto.cliente.cif && (
              <Text style={s.parteSub}>{presupuesto.cliente.cif}</Text>
            )}
            {presupuesto.cliente.direccionFacturacion && (
              <Text style={s.parteSub}>{presupuesto.cliente.direccionFacturacion}</Text>
            )}
          </View>
        </View>

        <View style={s.divider} />

        {/* Descripción general */}
        {presupuesto.descripcion && (
          <View style={{ marginBottom: 8 }}>
            <Text style={s.seccionLabel}>Descripción</Text>
            <Text style={{ fontSize: 8, color: c.gris }}>{presupuesto.descripcion}</Text>
          </View>
        )}

        {/* Máquina */}
        {presupuesto.maquina && (
          <View>
            <Text style={s.seccionLabel}>Información de máquina</Text>
            <View style={s.maquinaBox}>
              <Text style={s.maquinaText}>
                Marca: {presupuesto.maquina.marca} · Modelo: {presupuesto.maquina.modelo}
                {presupuesto.direccionReparacion ? ` · Dir. reparación: ${presupuesto.direccionReparacion}` : ""}
              </Text>
            </View>
          </View>
        )}

        {/* Servicios libres */}
        {presupuesto.serviciosLibres.length > 0 && (
          <View>
            <Text style={s.seccionLabel}>Servicios</Text>
            <View style={s.tablaHeader}>
              <Text style={[s.tablaHeaderTxt, s.slCol1]}>Descripción</Text>
              <Text style={[s.tablaHeaderTxt, s.slCol2]}>Cantidad</Text>
              <Text style={[s.tablaHeaderTxt, s.slCol3]}>Precio</Text>
              <Text style={[s.tablaHeaderTxt, s.slCol4]}>Total</Text>
            </View>
            {presupuesto.serviciosLibres.map((s2: any) => (
              <View key={s2.id} style={s.tablaRow}>
                <Text style={[s.tablaTxt, s.slCol1]}>{s2.descripcion}</Text>
                <Text style={[s.tablaGris, s.slCol2]}>{s2.cantidad}</Text>
                <Text style={[s.tablaGris, s.slCol3]}>{s2.precio.toFixed(2)} €</Text>
                <Text style={[s.tablaTxt, s.slCol4]}>{(s2.cantidad * s2.precio).toFixed(2)} €</Text>
              </View>
            ))}
          </View>
        )}

        {/* Repuestos */}
        {presupuesto.repuestos.length > 0 && (
          <View>
            <Text style={s.seccionLabel}>Materiales y repuestos</Text>
            <View style={s.tablaHeader}>
              <Text style={[s.tablaHeaderTxt, s.rCol1]}>Descripción</Text>
              <Text style={[s.tablaHeaderTxt, s.rCol2]}>Cantidad</Text>
              <Text style={[s.tablaHeaderTxt, s.rCol3]}>Precio ud.</Text>
              <Text style={[s.tablaHeaderTxt, s.rCol4]}>Total</Text>
            </View>
            {presupuesto.repuestos.map((r: any) => (
              <View key={r.id} style={s.tablaRow}>
                <Text style={[s.tablaTxt, s.rCol1]}>
                  {r.referencia ? `${r.referencia} ` : ""}{r.descripcion}
                </Text>
                <Text style={[s.tablaGris, s.rCol2]}>{r.cantidad}</Text>
                <Text style={[s.tablaGris, s.rCol3]}>{r.precioVenta.toFixed(2)} €</Text>
                <Text style={[s.tablaTxt, s.rCol4]}>{(r.cantidad * r.precioVenta).toFixed(2)} €</Text>
              </View>
            ))}
          </View>
        )}

        {/* Totales */}
        <View style={s.totalesBox}>
          <View style={s.totalesInner}>
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Base imponible</Text>
              <Text style={s.totalValue}>{presupuesto.baseImponible.toFixed(2)} €</Text>
            </View>
            {presupuesto.descuento > 0 && (
              <View style={s.totalRow}>
                <Text style={s.totalLabel}>
                  Descuento{presupuesto.tipoDescuento === "porcentaje" ? ` (${presupuesto.descuentoValor}%)` : ""}
                </Text>
                <Text style={s.totalValue}>- {presupuesto.descuento.toFixed(2)} €</Text>
              </View>
            )}
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>IVA (21%)</Text>
              <Text style={s.totalValue}>{presupuesto.iva.toFixed(2)} €</Text>
            </View>
            <View style={s.totalFinalRow}>
              <Text style={s.totalFinalLbl}>Total</Text>
              <Text style={s.totalFinalVal}>{presupuesto.total.toFixed(2)} €</Text>
            </View>
          </View>
        </View>

        {/* Validez */}
        {presupuesto.validezHasta && (
          <View style={s.validezBox}>
            <Text style={s.validezTxt}>
              Este presupuesto tiene validez hasta el {fmt(presupuesto.validezHasta)}.
              Pasada esta fecha, los precios podrían variar.
            </Text>
          </View>
        )}

        {/* Notas */}
        {presupuesto.notas && (
          <View style={s.pieBox}>
            <Text style={s.pieNotas}>{presupuesto.notas}</Text>
          </View>
        )}

      </Page>
    </Document>
  );
}