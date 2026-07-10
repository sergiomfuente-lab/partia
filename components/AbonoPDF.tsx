import React from "react";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";

const c = {
  negro:     "#0B1120",
  azul:      "#185FA5",
  gris:      "#6B7280",
  borde:     "#E5E7EB",
  fondo:     "#F9FAFB",
  rojo:      "#DC2626",
};

const s = StyleSheet.create({
  page:         { fontSize: 8, color: c.negro, padding: 40, backgroundColor: "#fff" },
  row:          { flexDirection: "row" },
  headerLeft:   { flex: 1 },
  headerRight:  { flex: 1, alignItems: "flex-end" },
  logo:         { width: 120, height: 50, objectFit: "contain", marginBottom: 6 },
  empresa:      { fontSize: 11, fontWeight: 700, marginBottom: 2 },
  empresaSub:   { fontSize: 7, color: c.gris, marginBottom: 1 },
  numLabel:     { fontSize: 7, color: c.rojo, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 1 },
  numValue:     { fontSize: 13, fontWeight: 700, marginBottom: 4, color: c.rojo },
  fechaLabel:   { fontSize: 7, color: c.gris, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 1 },
  fechaValue:   { fontSize: 8, fontWeight: 600, marginBottom: 4 },
  divider:      { borderBottomWidth: 1, borderBottomColor: c.borde, marginVertical: 12 },
  partesRow:    { flexDirection: "row", marginBottom: 16 },
  parteLabel:   { fontSize: 7, color: c.gris, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  parteNombre:  { fontSize: 9, fontWeight: 700, marginBottom: 2 },
  parteSub:     { fontSize: 7, color: c.gris, marginBottom: 1 },
  col:          { flex: 1 },
  refBox:       { backgroundColor: "#FEF2F2", borderRadius: 4, padding: 8, marginBottom: 12 },
  refLabel:     { fontSize: 7, color: c.rojo, fontWeight: 700, marginBottom: 2 },
  refValue:     { fontSize: 8, color: c.negro },
  tablaHeader:  { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#D1D5DB", paddingBottom: 4, marginBottom: 4 },
  tablaHeaderT: { fontSize: 7, color: c.gris, fontWeight: 600 },
  tablaRow:     { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: c.borde, paddingVertical: 3 },
  tablaTxt:     { fontSize: 7, color: c.negro },
  tablaGris:    { fontSize: 7, color: c.gris },
  col1:         { width: "50%", textAlign: "left" },
  col2:         { width: "15%", textAlign: "right" },
  col3:         { width: "20%", textAlign: "right" },
  col4:         { width: "15%", textAlign: "right" },
  totalesBox:   { flexDirection: "row", justifyContent: "flex-end", marginTop: 12 },
  totalesInner: { width: 200 },
  totalRow:     { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3, borderBottomWidth: 1, borderBottomColor: c.borde },
  totalLabel:   { fontSize: 7, color: c.gris },
  totalValue:   { fontSize: 7, fontWeight: 600 },
  totalFinalRow:{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 5, borderTopWidth: 2, borderTopColor: c.rojo, marginTop: 2 },
  totalFinalLbl:{ fontSize: 10, fontWeight: 700, color: c.rojo },
  totalFinalVal:{ fontSize: 10, fontWeight: 700, color: c.rojo },
  pieBox:       { marginTop: 16, paddingTop: 10, borderTopWidth: 1, borderTopColor: c.borde },
  pieIban:      { fontSize: 7, color: c.gris, marginBottom: 8 },
  pieRgpd:      { fontSize: 6, color: c.gris, lineHeight: 1.5 },
  motivoBox:    { backgroundColor: c.fondo, borderRadius: 4, padding: 8, marginBottom: 12 },
  motivoLabel:  { fontSize: 7, color: c.gris, fontWeight: 700, marginBottom: 2 },
  motivoValue:  { fontSize: 8, color: c.negro },
});

const fmt = (d: string) =>
  new Date(d).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });

export default function AbonoPDF({ abono, empresa }: { abono: any; empresa: any }) {
  return (
    <Document>
      <Page size="A4" style={s.page}>

        {/* CABECERA */}
        <View style={s.row}>
          <View style={s.headerLeft}>
            {empresa?.logoBase64 ? (
              <Image src={empresa.logoBase64} style={s.logo} />
            ) : (
              <Text style={s.empresa}>{empresa?.nombreFiscal || "—"}</Text>
            )}
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
            <Text style={s.numLabel}>Nota de abono</Text>
            <Text style={s.numValue}>{abono.numero}</Text>
            <Text style={s.fechaLabel}>Fecha</Text>
            <Text style={s.fechaValue}>{fmt(abono.fecha)}</Text>
          </View>
        </View>

        <View style={s.divider} />

        {/* REFERENCIA A FACTURA */}
        <View style={s.refBox}>
          <Text style={s.refLabel}>En concepto de abono de la factura:</Text>
          <Text style={s.refValue}>{abono.factura?.numero ?? "—"}</Text>
        </View>

        {/* PARTES */}
        <View style={s.partesRow}>
          <View style={s.col}>
            <Text style={s.parteLabel}>Emisor</Text>
            <Text style={s.parteNombre}>{empresa?.nombreFiscal || "—"}</Text>
            {empresa?.cifNif && <Text style={s.parteSub}>{empresa.cifNif}</Text>}
          </View>
          <View style={[s.col, { alignItems: "flex-end" }]}>
            <Text style={s.parteLabel}>Cliente</Text>
            <Text style={s.parteNombre}>{abono.factura?.cliente?.nombre || "—"}</Text>
            {abono.factura?.cliente?.cif && <Text style={s.parteSub}>{abono.factura.cliente.cif}</Text>}
            {abono.factura?.cliente?.direccionFacturacion && (
              <Text style={s.parteSub}>{abono.factura.cliente.direccionFacturacion}</Text>
            )}
          </View>
        </View>

        <View style={s.divider} />

        {/* MOTIVO */}
        {abono.motivo && (
          <View style={s.motivoBox}>
            <Text style={s.motivoLabel}>Motivo del abono</Text>
            <Text style={s.motivoValue}>{abono.motivo}</Text>
          </View>
        )}

        {/* LÍNEAS */}
        <View style={s.tablaHeader}>
          <Text style={[s.tablaHeaderT, s.col1]}>Descripción</Text>
          <Text style={[s.tablaHeaderT, s.col2]}>Cantidad</Text>
          <Text style={[s.tablaHeaderT, s.col3]}>Precio</Text>
          <Text style={[s.tablaHeaderT, s.col4]}>Total</Text>
        </View>
        {abono.lineas.map((l: any) => (
          <View key={l.id} style={s.tablaRow}>
            <Text style={[s.tablaTxt, s.col1]}>{l.descripcion}</Text>
            <Text style={[s.tablaGris, s.col2]}>{l.cantidad}</Text>
            <Text style={[s.tablaGris, s.col3]}>{l.precio.toFixed(2)} €</Text>
            <Text style={[s.tablaTxt, s.col4]}>{l.total.toFixed(2)} €</Text>
          </View>
        ))}

        {/* TOTALES */}
        <View style={s.totalesBox}>
          <View style={s.totalesInner}>
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Base imponible</Text>
              <Text style={s.totalValue}>{abono.baseImponible.toFixed(2)} €</Text>
            </View>
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>IVA (21%)</Text>
              <Text style={s.totalValue}>{abono.iva.toFixed(2)} €</Text>
            </View>
            <View style={s.totalFinalRow}>
              <Text style={s.totalFinalLbl}>Total abono</Text>
              <Text style={s.totalFinalVal}>{abono.total.toFixed(2)} €</Text>
            </View>
          </View>
        </View>

        {/* PIE */}
        <View style={s.pieBox}>
          {empresa?.iban && (
            <Text style={s.pieIban}>IBAN: {empresa.iban}</Text>
          )}
          {empresa?.textoRgpd && (
            <Text style={s.pieRgpd}>{empresa.textoRgpd}</Text>
          )}
        </View>

      </Page>
    </Document>
  );
}