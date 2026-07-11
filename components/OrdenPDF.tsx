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
  logo:          { width: 120, height: 50, objectFit: "contain", marginBottom: 4 },
  empresa:       { fontSize: 10, fontWeight: 700, marginBottom: 2 },
  empresaSub:    { fontSize: 7, color: c.gris, marginBottom: 1 },
  numLabel:      { fontSize: 7, color: c.gris, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 1 },
  numValue:      { fontSize: 13, fontWeight: 700, marginBottom: 3 },
  fechaLabel:    { fontSize: 7, color: c.gris, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 1 },
  fechaValue:    { fontSize: 8, fontWeight: 600, marginBottom: 3 },
  divider:       { borderBottomWidth: 1, borderBottomColor: c.borde, marginVertical: 10 },
  partesRow:     { flexDirection: "row", marginBottom: 10 },
  parteLabel:    { fontSize: 7, color: c.gris, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3 },
  parteNombre:   { fontSize: 9, fontWeight: 700, marginBottom: 1 },
  parteSub:      { fontSize: 7, color: c.gris, marginBottom: 1 },
  seccionLabel:  { fontSize: 7, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4, marginTop: 8 },
  maquinaBox:    { backgroundColor: c.fondo, borderRadius: 4, padding: 8, marginBottom: 8 },
  maquinaText:   { fontSize: 7, color: c.gris },
  tablaHeader:   { flexDirection: "row", backgroundColor: c.fondo, padding: 4, borderBottomWidth: 1, borderBottomColor: c.borde, marginBottom: 2 },
  tablaHeaderTxt:{ fontSize: 7, color: c.gris, fontWeight: 600 },
  tablaRow:      { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: c.borde, paddingVertical: 3 },
  tablaTxt:      { fontSize: 7, color: c.negro },
  tablaGris:     { fontSize: 7, color: c.gris },

  // Columnas servicios
  sCol1: { width: "20%", textAlign: "left" },
  sCol2: { width: "25%", textAlign: "left" },
  sCol3: { width: "30%", textAlign: "left" },
  sCol4: { width: "12%", textAlign: "right" },
  sCol5: { width: "13%", textAlign: "right" },

  // Columnas repuestos
  rCol1: { width: "35%" },
  rCol2: { width: "15%", textAlign: "right" },
  rCol3: { width: "25%", textAlign: "right" },
  rCol4: { width: "25%", textAlign: "right" },

  trabajosBox:   { backgroundColor: c.fondo, borderRadius: 4, padding: 8, marginBottom: 8 },
  trabajosTxt:   { fontSize: 7, color: c.negro, lineHeight: 1.5 },

  tecnicoBox:    { marginTop: 8, marginBottom: 8 },
  tecnicoLabel:  { fontSize: 7, fontWeight: 700, marginBottom: 2 },
  tecnicoTxt:    { fontSize: 7, color: c.gris },

  firmaRow:      { flexDirection: "row", marginTop: 16, gap: 20 },
  firmaBox:      { flex: 1 },
  firmaLabel:    { fontSize: 7, color: c.gris, marginBottom: 4 },
  firmaImg:      { width: 120, height: 60, objectFit: "contain", borderBottomWidth: 1, borderBottomColor: c.borde },
  firmaLinea:    { borderBottomWidth: 1, borderBottomColor: c.borde, marginBottom: 2, height: 60 },
  firmaDni:      { fontSize: 7, color: c.gris, marginTop: 2 },

  pieBox:        { marginTop: 12, paddingTop: 8, borderTopWidth: 1, borderTopColor: c.borde },
  pieRgpd:       { fontSize: 6, color: c.grisClaro, lineHeight: 1.5 },

  totalBox:      { flexDirection: "row", justifyContent: "flex-end", marginTop: 8 },
  totalInner:    { width: 180 },
  totalRow:      { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2, borderBottomWidth: 1, borderBottomColor: c.borde },
  totalLabel:    { fontSize: 7, color: c.gris },
  totalValue:    { fontSize: 7, fontWeight: 600 },
  totalFinalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4, borderTopWidth: 2, borderTopColor: c.negro, marginTop: 2 },
  totalFinalLbl: { fontSize: 9, fontWeight: 700 },
  totalFinalVal: { fontSize: 9, fontWeight: 700 },
});

const fmt = (d: string) =>
  new Date(d).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });

export default function OrdenPDF({
  orden, empresa, tecnico, mostrarPrecios,
}: {
  orden:         any;
  empresa:       any;
  tecnico:       any;
  mostrarPrecios:boolean;
}) {
  const totalServicios = (orden.servicios ?? []).reduce(
    (a: number, s: any) => a + s.cantidad * s.precio, 0
  );
  const totalLibres = (orden.serviciosLibres ?? []).reduce(
    (a: number, s: any) => a + s.cantidad * s.precio, 0
  );
  const totalRepuestos = (orden.repuestos ?? []).reduce(
    (a: number, r: any) => a + r.cantidad * r.precioVenta, 0
  );
  const totalOrden = totalServicios + totalLibres + totalRepuestos;

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
            {empresa?.cifNif          && <Text style={s.empresaSub}>{empresa.cifNif}</Text>}
            {empresa?.direccionFiscal && <Text style={s.empresaSub}>{empresa.direccionFiscal}</Text>}
            {(empresa?.codigoPostal || empresa?.ciudad) && (
              <Text style={s.empresaSub}>
                {empresa.codigoPostal} {empresa.ciudad}{empresa.provincia ? ` (${empresa.provincia})` : ""}
              </Text>
            )}
          </View>
          <View style={s.headerRight}>
            <Text style={s.numLabel}>Número de parte</Text>
            <Text style={s.numValue}>{orden.numero}</Text>
            <Text style={s.fechaLabel}>Fecha (Inicio de trabajo)</Text>
            <Text style={s.fechaValue}>{fmt(orden.fecha)}</Text>
          </View>
        </View>

        <View style={s.divider} />

        {/* PARTES */}
        <View style={s.partesRow}>
          <View style={s.col}>
            <Text style={s.parteLabel}>Emisor</Text>
            <Text style={s.parteNombre}>{empresa?.nombreFiscal || "—"}</Text>
            {empresa?.cifNif && <Text style={s.parteSub}>{empresa.cifNif}</Text>}
          </View>
          <View style={[s.col, { alignItems: "flex-end" }]}>
            <Text style={s.parteLabel}>Cliente</Text>
            <Text style={s.parteNombre}>{orden.cliente.nombre}</Text>
            {orden.cliente.razonSocial && <Text style={s.parteSub}>{orden.cliente.razonSocial}</Text>}
            {orden.cliente.cif         && <Text style={s.parteSub}>{orden.cliente.cif}</Text>}
          </View>
        </View>

        <View style={s.divider} />

        {/* MÁQUINA */}
        <Text style={s.seccionLabel}>Información de máquina</Text>
        <View style={s.maquinaBox}>
          <Text style={s.maquinaText}>
            Marca: {orden.maquina.marca} · Modelo: {orden.maquina.modelo} · Número de serie: {orden.maquina.numeroDeSerie}
            {orden.direccionReparacion ? ` · Dir. de reparación: ${orden.direccionReparacion}` : ""}
            {" · "}Número de horas actuales: {orden.maquina.horasActuales}
          </Text>
        </View>

        {/* SERVICIOS ESTÁNDAR */}
        {(orden.servicios ?? []).length > 0 && (
          <View>
            <Text style={s.seccionLabel}>Servicios</Text>
            <View style={s.tablaHeader}>
              <Text style={[s.tablaHeaderTxt, s.sCol1]}>Fecha</Text>
              <Text style={[s.tablaHeaderTxt, s.sCol2]}>Tipo de servicio</Text>
              <Text style={[s.tablaHeaderTxt, s.sCol3]}>Descripción de servicio</Text>
              <Text style={[s.tablaHeaderTxt, s.sCol4]}>Cantidad</Text>
              {mostrarPrecios && <Text style={[s.tablaHeaderTxt, s.sCol5]}>Coste</Text>}
              {mostrarPrecios && <Text style={[s.tablaHeaderTxt, { width: "13%", textAlign: "right" }]}>Total</Text>}
            </View>
            {(orden.servicios ?? []).map((s2: any) => (
              <View key={s2.id} style={s.tablaRow}>
                <Text style={[s.tablaGris, s.sCol1]}>{fmt(s2.fecha)}</Text>
                <Text style={[s.tablaTxt, s.sCol2]}>{s2.tipoServicio.nombre}</Text>
                <Text style={[s.tablaGris, s.sCol3]}>{s2.descripcion || "—"}</Text>
                <Text style={[s.tablaGris, s.sCol4]}>{s2.cantidad} {s2.tipoServicio.unidad}</Text>
                {mostrarPrecios && <Text style={[s.tablaGris, s.sCol5]}>{s2.precio.toFixed(2)}</Text>}
                {mostrarPrecios && <Text style={[s.tablaTxt, { width: "13%", textAlign: "right" }]}>{(s2.cantidad * s2.precio).toFixed(2)}</Text>}
              </View>
            ))}
          </View>
        )}

        {/* SERVICIOS LIBRES */}
        {(orden.serviciosLibres ?? []).length > 0 && (
          <View>
            {(orden.servicios ?? []).length === 0 && <Text style={s.seccionLabel}>Servicios</Text>}
            {(orden.serviciosLibres ?? []).map((s2: any) => (
              <View key={s2.id} style={s.tablaRow}>
                <Text style={[s.tablaGris, s.sCol1]}>—</Text>
                <Text style={[s.tablaTxt, s.sCol2]}>{s2.descripcion}</Text>
                <Text style={[s.tablaGris, s.sCol3]}>—</Text>
                <Text style={[s.tablaGris, s.sCol4]}>{s2.cantidad}</Text>
                {mostrarPrecios && <Text style={[s.tablaGris, s.sCol5]}>{s2.precio.toFixed(2)}</Text>}
                {mostrarPrecios && <Text style={[s.tablaTxt, { width: "13%", textAlign: "right" }]}>{(s2.cantidad * s2.precio).toFixed(2)}</Text>}
              </View>
            ))}
          </View>
        )}

        {/* RECAMBIOS */}
        {(orden.repuestos ?? []).length > 0 && (
          <View>
            <Text style={s.seccionLabel}>Recambios</Text>
            <View style={s.tablaHeader}>
              <Text style={[s.tablaHeaderTxt, s.rCol1]}>Nombre de recambio</Text>
              <Text style={[s.tablaHeaderTxt, s.rCol2]}>Cantidad</Text>
              {mostrarPrecios && <Text style={[s.tablaHeaderTxt, s.rCol3]}>Coste</Text>}
              {mostrarPrecios && <Text style={[s.tablaHeaderTxt, s.rCol4]}>Total</Text>}
            </View>
            {(orden.repuestos ?? []).map((r: any) => (
              <View key={r.id} style={s.tablaRow}>
                <Text style={[s.tablaTxt, s.rCol1]}>{r.descripcion}{r.referencia ? ` (${r.referencia})` : ""}</Text>
                <Text style={[s.tablaGris, s.rCol2]}>{r.cantidad}</Text>
                {mostrarPrecios && <Text style={[s.tablaGris, s.rCol3]}>{r.precioVenta.toFixed(2)}</Text>}
                {mostrarPrecios && <Text style={[s.tablaTxt, s.rCol4]}>{(r.cantidad * r.precioVenta).toFixed(2)}</Text>}
              </View>
            ))}
          </View>
        )}

        {/* TOTALES */}
        {mostrarPrecios && (
          <View style={s.totalBox}>
            <View style={s.totalInner}>
              {(totalServicios + totalLibres) > 0 && (
                <View style={s.totalRow}>
                  <Text style={s.totalLabel}>Total servicios</Text>
                  <Text style={s.totalValue}>{(totalServicios + totalLibres).toFixed(2)} €</Text>
                </View>
              )}
              {totalRepuestos > 0 && (
                <View style={s.totalRow}>
                  <Text style={s.totalLabel}>Total recambios</Text>
                  <Text style={s.totalValue}>{totalRepuestos.toFixed(2)} €</Text>
                </View>
              )}
              <View style={s.totalRow}>
                <Text style={s.totalLabel}>Base imponible</Text>
                <Text style={s.totalValue}>{totalOrden.toFixed(2)} €</Text>
              </View>
              <View style={s.totalRow}>
                <Text style={s.totalLabel}>Impuestos (IVA 21%)</Text>
                <Text style={s.totalValue}>{(totalOrden * 0.21).toFixed(2)} €</Text>
              </View>
              <View style={s.totalFinalRow}>
                <Text style={s.totalFinalLbl}>Total</Text>
                <Text style={s.totalFinalVal}>{(totalOrden * 1.21).toFixed(2)} €</Text>
              </View>
            </View>
          </View>
        )}

        {/* TRABAJOS REALIZADOS */}
        {orden.trabajosRealizados && (
          <View>
            <Text style={s.seccionLabel}>Descripción de trabajos realizados</Text>
            <View style={s.trabajosBox}>
              <Text style={s.trabajosTxt}>{orden.trabajosRealizados}</Text>
            </View>
          </View>
        )}

        {/* TÉCNICO */}
        <View style={s.tecnicoBox}>
          <Text style={s.tecnicoLabel}>Información del técnico que realizó la reparación.</Text>
          <Text style={s.tecnicoTxt}>
            Nombre: {tecnico?.nombre || "—"}
            {tecnico?.dni ? `  DNI: ${tecnico.dni}` : ""}
          </Text>
        </View>

        {/* FIRMA */}
        <View style={s.firmaRow}>
          <View style={s.firmaBox}>
            {orden.firmaBase64 ? (
              <Image src={orden.firmaBase64} style={s.firmaImg} />
            ) : (
              <View style={s.firmaLinea} />
            )}
            <Text style={s.firmaLabel}>
              {orden.firmaObservaciones ? `Observaciones de Firma\n${orden.firmaObservaciones}` : "Observaciones de Firma"}
            </Text>
          </View>
          <View style={[s.firmaBox, { alignItems: "flex-end" }]}>
            <Text style={s.firmaLabel}>DNI Firma</Text>
            <Text style={s.firmaDni}>{orden.firmaDni || "—"}</Text>
          </View>
        </View>

        {/* RGPD */}
        {empresa?.textoRgpd && (
          <View style={s.pieBox}>
            <Text style={s.pieRgpd}>{empresa.textoRgpd}</Text>
          </View>
        )}

      </Page>
    </Document>
  );
}