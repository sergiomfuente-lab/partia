import React from "react";
import {
  Document, Page, Text, View, StyleSheet, Image, Font,
} from "@react-pdf/renderer";

Font.register({
  family: "Inter",
  fonts: [
    { src: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff", fontWeight: 400 },
    { src: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZ9hiJ-Ek-_EeA.woff", fontWeight: 600 },
    { src: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hiJ-Ek-_EeA.woff", fontWeight: 700 },
  ],
});

const c = {
  negro:    "#0B1120",
  azul:     "#185FA5",
  gris:     "#6B7280",
  grisClaro:"#9CA3AF",
  borde:    "#E5E7EB",
  fondo:    "#F9FAFB",
};

const s = StyleSheet.create({
  page:          { fontFamily: "Inter", fontSize: 8, color: c.negro, padding: 40, backgroundColor: "#fff" },
  row:           { flexDirection: "row" },
  col:           { flex: 1 },

  // Cabecera
  headerLeft:    { flex: 1 },
  headerRight:   { flex: 1, alignItems: "flex-end" },
  logo:          { width: 120, height: 50, objectFit: "contain", marginBottom: 6 },
  empresa:       { fontSize: 11, fontWeight: 700, marginBottom: 2 },
  empresaSub:    { fontSize: 7, color: c.gris, marginBottom: 1 },
  numLabel:      { fontSize: 7, color: c.azul, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 1 },
  numValue:      { fontSize: 13, fontWeight: 700, fontFamily: "Inter", marginBottom: 4 },
  fechaLabel:    { fontSize: 7, color: c.gris, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 1 },
  fechaValue:    { fontSize: 8, fontWeight: 600, marginBottom: 4 },

  // Separador
  divider:       { borderBottomWidth: 1, borderBottomColor: c.borde, marginVertical: 12 },

  // Partes
  partesRow:     { flexDirection: "row", marginBottom: 16 },
  parteLabel:    { fontSize: 7, color: c.gris, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  parteNombre:   { fontSize: 9, fontWeight: 700, marginBottom: 2 },
  parteSub:      { fontSize: 7, color: c.gris, marginBottom: 1 },

  // Sección
  seccionLabel:  { fontSize: 7, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4, marginTop: 10 },

  // Máquina
  maquinaBox:    { backgroundColor: c.fondo, borderRadius: 4, padding: 8, marginBottom: 8 },
  maquinaText:   { fontSize: 7, color: c.gris },

  // Tabla
  tablaHeader:   { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#D1D5DB", paddingBottom: 4, marginBottom: 4 },
  tablaHeaderTxt:{ fontSize: 7, color: c.gris, fontWeight: 600 },
  tablaRow:      { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: c.borde, paddingVertical: 3 },
  tablaTxt:      { fontSize: 7, color: c.negro },
  tablaGris:     { fontSize: 7, color: c.gris },

  // Columnas servicios
  sCol1: { width: "13%" },
  sCol2: { width: "20%" },
  sCol3: { width: "32%" },
  sCol4: { width: "13%", textAlign: "right" },
  sCol5: { width: "11%", textAlign: "right" },
  sCol6: { width: "11%", textAlign: "right" },

  // Columnas repuestos
  rCol1: { width: "42%" },
  rCol2: { width: "16%", textAlign: "right" },
  rCol3: { width: "21%", textAlign: "right" },
  rCol4: { width: "21%", textAlign: "right" },

  // Totales
  totalesBox:    { flexDirection: "row", justifyContent: "flex-end", marginTop: 12 },
  totalesInner:  { width: 200 },
  totalRow:      { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3, borderBottomWidth: 1, borderBottomColor: c.borde },
  totalLabel:    { fontSize: 7, color: c.gris },
  totalValue:    { fontSize: 7, fontWeight: 600 },
  totalFinalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 5, borderTopWidth: 2, borderTopColor: c.negro, marginTop: 2 },
  totalFinalLbl: { fontSize: 10, fontWeight: 700 },
  totalFinalVal: { fontSize: 10, fontWeight: 700 },

  // Pie
  pieBox:        { marginTop: 16, paddingTop: 10, borderTopWidth: 1, borderTopColor: c.borde },
  piePago:       { fontSize: 8, fontWeight: 600, marginBottom: 2 },
  pieIban:       { fontSize: 7, color: c.gris, fontFamily: "Inter", marginBottom: 8 },
  pieRgpd:       { fontSize: 6, color: c.grisClaro, lineHeight: 1.5 },
});

const fmt = (d: string) =>
  new Date(d).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });

export function FacturaPDF({ factura, usuario, empresa }: { factura: any; usuario: any; empresa: any }) {
  return (
    <Document>
      <Page size="A4" style={s.page}>

        {/* CABECERA */}
        <View style={s.row}>
          <View style={s.headerLeft}>
            {empresa?.logoBase64 && (
              <Image src={empresa.logoBase64} style={s.logo} />
            )}
            {!empresa?.logoBase64 && (
              <Text style={s.empresa}>{usuario?.nombreFiscal || "—"}</Text>
            )}
            {empresa?.logoBase64 && (
              <Text style={s.empresa}>{usuario?.nombreFiscal || "—"}</Text>
            )}
            {usuario?.cifNif           && <Text style={s.empresaSub}>{usuario.cifNif}</Text>}
            {usuario?.direccionFiscal  && <Text style={s.empresaSub}>{usuario.direccionFiscal}</Text>}
            {(usuario?.codigoPostal || usuario?.ciudad) && (
              <Text style={s.empresaSub}>
                {usuario.codigoPostal} {usuario.ciudad}{usuario.provincia ? ` (${usuario.provincia})` : ""}
              </Text>
            )}
            {usuario?.telefono         && <Text style={s.empresaSub}>{usuario.telefono}</Text>}
            {usuario?.emailFacturacion && <Text style={s.empresaSub}>{usuario.emailFacturacion}</Text>}
          </View>

          <View style={s.headerRight}>
            <Text style={s.numLabel}>Número de factura</Text>
            <Text style={s.numValue}>{factura.numero}</Text>
            <Text style={s.fechaLabel}>Fecha de factura</Text>
            <Text style={s.fechaValue}>{fmt(factura.fecha)}</Text>
            {factura.vencimiento && (
              <>
                <Text style={s.fechaLabel}>Vencimiento</Text>
                <Text style={s.fechaValue}>{fmt(factura.vencimiento)}</Text>
              </>
            )}
          </View>
        </View>

        <View style={s.divider} />

        {/* PARTES */}
        <View style={s.partesRow}>
          <View style={s.col}>
            <Text style={s.parteLabel}>Datos del técnico</Text>
            <Text style={s.parteNombre}>{usuario?.nombreFiscal || "—"}</Text>
            {usuario?.cifNif && <Text style={s.parteSub}>{usuario.cifNif}</Text>}
          </View>
          <View style={[s.col, { alignItems: "flex-end" }]}>
            <Text style={s.parteLabel}>Facturar a</Text>
            <Text style={s.parteNombre}>{factura.cliente.nombre}</Text>
            {factura.cliente.razonSocial && (
              <Text style={s.parteSub}>{factura.cliente.razonSocial}</Text>
            )}
            {factura.cliente.cif && (
              <Text style={s.parteSub}>{factura.cliente.cif}</Text>
            )}
            {factura.cliente.direccionFacturacion && (
              <Text style={s.parteSub}>{factura.cliente.direccionFacturacion}</Text>
            )}
          </View>
        </View>

        <View style={s.divider} />

        {/* ÓRDENES */}
        {factura.ordenes.map((orden: any) => (
          <View key={orden.id}>
            {/* Máquina */}
            <Text style={s.seccionLabel}>Información de máquina</Text>
            <View style={s.maquinaBox}>
              <Text style={s.maquinaText}>
                Marca: {orden.maquina.marca} · Modelo: {orden.maquina.modelo} · Nº serie: {orden.maquina.numeroDeSerie}
                {orden.direccionReparacion ? ` · Dir. reparación: ${orden.direccionReparacion}` : ""}
              </Text>
            </View>

            {/* Servicios */}
            {orden.servicios.length > 0 && (
              <View>
                <Text style={s.seccionLabel}>Servicios</Text>
                <View style={s.tablaHeader}>
                  <Text style={[s.tablaHeaderTxt, s.sCol1]}>Fecha</Text>
                  <Text style={[s.tablaHeaderTxt, s.sCol2]}>Tipo de servicio</Text>
                  <Text style={[s.tablaHeaderTxt, s.sCol3]}>Descripción</Text>
                  <Text style={[s.tablaHeaderTxt, s.sCol4]}>Cantidad</Text>
                  <Text style={[s.tablaHeaderTxt, s.sCol5]}>Coste</Text>
                  <Text style={[s.tablaHeaderTxt, s.sCol6]}>Total</Text>
                </View>
                {orden.servicios.map((s2: any) => (
                  <View key={s2.id} style={s.tablaRow}>
                    <Text style={[s.tablaGris, s.sCol1]}>{fmt(s2.fecha)}</Text>
                    <Text style={[s.tablaTxt, s.sCol2]}>{s2.tipoServicio.nombre}</Text>
                    <Text style={[s.tablaGris, s.sCol3]}>{s2.descripcion || "—"}</Text>
                    <Text style={[s.tablaTxt, s.sCol4]}>{s2.cantidad} {s2.tipoServicio.unidad}</Text>
                    <Text style={[s.tablaGris, s.sCol5]}>{s2.precio.toFixed(2)}</Text>
                    <Text style={[s.tablaTxt, s.sCol6]}>{(s2.cantidad * s2.precio).toFixed(2)}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Recambios */}
            {orden.repuestos.length > 0 && (
              <View>
                <Text style={s.seccionLabel}>Recambios</Text>
                <View style={s.tablaHeader}>
                  <Text style={[s.tablaHeaderTxt, s.rCol1]}>Nombre de recambio</Text>
                  <Text style={[s.tablaHeaderTxt, s.rCol2]}>Cantidad</Text>
                  <Text style={[s.tablaHeaderTxt, s.rCol3]}>Coste</Text>
                  <Text style={[s.tablaHeaderTxt, s.rCol4]}>Total</Text>
                </View>
                {orden.repuestos.map((r: any) => (
                  <View key={r.id} style={s.tablaRow}>
                    <Text style={[s.tablaTxt, s.rCol1]}>
                      {r.referencia ? `${r.referencia} ` : ""}{r.descripcion}
                    </Text>
                    <Text style={[s.tablaGris, s.rCol2]}>{r.cantidad}</Text>
                    <Text style={[s.tablaGris, s.rCol3]}>{r.precioVenta.toFixed(2)}</Text>
                    <Text style={[s.tablaTxt, s.rCol4]}>{(r.cantidad * r.precioVenta).toFixed(2)}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}

        {/* TOTALES */}
        <View style={s.totalesBox}>
          <View style={s.totalesInner}>
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Base imponible</Text>
              <Text style={s.totalValue}>{factura.baseImponible.toFixed(2)} €</Text>
            </View>
            {factura.descuento > 0 && (
              <View style={s.totalRow}>
                <Text style={s.totalLabel}>
                  Descuentos{factura.tipoDescuento === "porcentaje" ? ` (${factura.descuentoValor}%)` : ""}
                </Text>
                <Text style={s.totalValue}>- {factura.descuento.toFixed(2)} €</Text>
              </View>
            )}
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Impuestos (IVA 21%)</Text>
              <Text style={s.totalValue}>{factura.iva.toFixed(2)} €</Text>
            </View>
            <View style={s.totalFinalRow}>
              <Text style={s.totalFinalLbl}>Total</Text>
              <Text style={s.totalFinalVal}>{factura.total.toFixed(2)} €</Text>
            </View>
          </View>
        </View>

        {/* PIE */}
        <View style={s.pieBox}>
          {factura.cliente.formaPago && (
            <Text style={s.piePago}>Pago por {factura.cliente.formaPago}</Text>
          )}
          {usuario?.iban && (
            <Text style={s.pieIban}>{usuario.iban}</Text>
          )}
          {factura.notas && (
            <Text style={[s.pieIban, { marginBottom: 6 }]}>{factura.notas}</Text>
          )}
          {empresa?.textoRgpd && (
            <Text style={s.pieRgpd}>{empresa.textoRgpd}</Text>
          )}
        </View>

      </Page>
    </Document>
  );
}