import {
    Document,
    Page,
    View,
    Text,
    Image,
    StyleSheet,
    Svg,
    Path,
} from "@react-pdf/renderer";

import type { DailyClientReport } from "@/lib/reporting/types";
import type { ReactElement } from "react";
import type { DocumentProps } from "@react-pdf/renderer";

const styles = StyleSheet.create({
    page: {
        paddingTop: 20,
        paddingBottom: 28,
        paddingHorizontal: 24,
        fontSize: 8,
        fontFamily: "Helvetica",
        color: "#1f2937",
    },

    /* =========================
       CABECERA
       ========================= */

    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingBottom: 9,
        marginBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#d1d5db",
    },

    logoContainer: {
        width: 80,
        height: 38,
        alignItems: "center",
        justifyContent: "center",
    },

    headerLogo: {
        width: 80,
        height: 38,
        objectFit: "contain",
    },

    logoFallback: {
        fontSize: 9,
        fontWeight: "bold",
        color: "#374151",
        textAlign: "center",
    },

    headerCenter: {
        flexGrow: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 10,
    },

    clientName: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#111827",
        textAlign: "center",
    },

    reportTitle: {
        marginTop: 2,
        fontSize: 8.5,
        color: "#6b7280",
        textAlign: "center",
    },

    headerInfoRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 5,
    },

    headerInfoText: {
        fontSize: 7.5,
        color: "#374151",
    },

    headerInfoSeparator: {
        fontSize: 7.5,
        color: "#9ca3af",
        marginHorizontal: 5,
    },

    /* =========================
       RESUMEN
       ========================= */

    summaryTitle: {
        marginTop: 2,
        marginBottom: 5,
        fontSize: 8,
        fontWeight: "bold",
        color: "#374151",
        textTransform: "uppercase",
    },

    systemsSummary: {
        flexDirection: "row",
        flexWrap: "wrap",
        marginBottom: 12,
        padding: 7,
        backgroundColor: "#f9fafb",
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 4,
    },

    systemSummaryItem: {
        flexDirection: "row",
        alignItems: "center",
        width: "25%",
        paddingVertical: 4,
        paddingHorizontal: 4,
    },

    systemSummarySid: {
        marginLeft: 5,
        fontSize: 7.5,
        fontWeight: "bold",
        color: "#374151",
    },

    /* =========================
       SISTEMA
       ========================= */

    systemBlock: {
        marginBottom: 14,
    },

    systemHeader: {
        backgroundColor: "#111827",
        color: "#ffffff",
        paddingVertical: 6,
        paddingHorizontal: 8,
        borderTopLeftRadius: 4,
        borderTopRightRadius: 4,
    },

    systemTitle: {
        fontSize: 9.5,
        fontWeight: "bold",
    },

    systemMeta: {
        marginTop: 2,
        fontSize: 6.5,
        color: "#d1d5db",
    },

    /* =========================
       TABLA
       ========================= */

    tableHeader: {
        flexDirection: "row",
        backgroundColor: "#f3f4f6",
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderBottomWidth: 1,
        borderColor: "#d1d5db",
    },

    row: {
        flexDirection: "row",
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderBottomWidth: 1,
        borderColor: "#d1d5db",
    },

    cell: {
        padding: 5,
        borderRightWidth: 1,
        borderRightColor: "#e5e7eb",
        justifyContent: "flex-start",
    },

    statusCell: {
        width: "8%",
        alignItems: "center",
        justifyContent: "center",
    },

    titleCell: {
        width: "21%",
        alignItems: "flex-start",
        justifyContent: "center",
    },

    commentsCell: {
        width: "16%",
        alignItems: "flex-start",
        justifyContent: "center",
    },


    evidenceCell: {
        width: "46%",
        borderRightWidth: 0,
        alignItems: "center",
        justifyContent: "center",
    },

    tableHeaderText: {
        fontSize: 6.5,
        fontWeight: "bold",
        color: "#374151",
        textAlign: "left",
    },

    tableHeaderStatusText: {
        fontSize: 6.5,
        fontWeight: "bold",
        color: "#374151",
        textAlign: "center",
    },

    pointTitle: {
        fontSize: 7.5,
        fontWeight: "bold",
        color: "#111827",
        textAlign: "left",
    },

    pointDescription: {
        marginTop: 3,
        fontSize: 6.5,
        lineHeight: 1.25,
        color: "#6b7280",
        textAlign: "left",
    },

    comments: {
        fontSize: 6.8,
        lineHeight: 1.3,
        color: "#374151",
        textAlign: "left",
    },

    emptyText: {
        fontSize: 6.5,
        color: "#9ca3af",
        fontStyle: "italic",
        textAlign: "left",
    },

    /* Evidencia con tamaño fijo */
    evidenceFrame: {
        width: 205,
        height: 112,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#ffffff",
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 3,
        padding: 2,
    },

    evidence: {
        width: "100%",
        height: "100%",
        objectFit: "contain",
    },

    noEvidence: {
        fontSize: 6.5,
        color: "#9ca3af",
        fontStyle: "italic",
        textAlign: "center",
    },

    /* =========================
       FOOTER
       ========================= */

    footer: {
        position: "absolute",
        left: 24,
        right: 24,
        bottom: 12,
        flexDirection: "row",
        justifyContent: "space-between",
        color: "#9ca3af",
        fontSize: 6,
    },
});

function formatDate(value: string) {
    const [year, month, day] = value.split("-");
    return `${day}/${month}/${year}`;
}

/* =========================
   ICONO DE ESTADO
   ========================= */

function StatusIcon({
    status,
    size = 18,
}: {
    status: "OK" | "WARNING";
    size?: number;
}) {
    if (status === "WARNING") {
        return (
            <Svg
                width={size}
                height={size}
                viewBox="0 0 24 24"
            >
                <Path
                    d="M12 2L22 21H2L12 2Z"
                    fill="#F59E0B"
                />

                <Path
                    d="M12 8V14"
                    stroke="#FFFFFF"
                    strokeWidth={2}
                    strokeLinecap="round"
                />

                <Path
                    d="M12 17.5V17.6"
                    stroke="#FFFFFF"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                />
            </Svg>
        );
    }

    return (
        <Svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
        >
            <Path
                d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z"
                fill="#16A34A"
            />

            <Path
                d="M7.5 12.3L10.5 15.3L16.8 8.8"
                stroke="#FFFFFF"
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </Svg>
    );
}

export function ChecklistPdfDocument({
    report,
}: {
    report: DailyClientReport;
}): ReactElement<DocumentProps> {
    return (
        <Document
            title={`Checklist SAP - ${report.client.name} - ${report.executionDate}`}
            author={report.metadata.application}
        >
            <Page
                size="A4"
                orientation="portrait"
                style={styles.page}
            >
                {/* =====================
              CABECERA
              ===================== */}

                <View style={styles.header}>
                    {/* Logo proveedor */}
                    <View style={styles.logoContainer}>
                        {report.provider?.logoUrl ? (
                            <Image
                                src={report.provider.logoUrl}
                                style={styles.headerLogo}
                            />
                        ) : (
                            <Text style={styles.logoFallback}>
                                {report.provider?.name ?? ""}
                            </Text>
                        )}
                    </View>

                    {/* Centro */}
                    <View style={styles.headerCenter}>
                        <Text style={styles.clientName}>
                            {report.client.name}
                        </Text>

                        <Text style={styles.reportTitle}>
                            Informe diario de checklist SAP
                        </Text>

                        <View style={styles.headerInfoRow}>
                            <Text style={styles.headerInfoText}>
                                Fecha: {formatDate(report.executionDate)}
                            </Text>

                            <Text style={styles.headerInfoSeparator}>
                                •
                            </Text>

                            <Text style={styles.headerInfoText}>
                                Operador: {report.operator?.name ?? "-"}
                            </Text>
                        </View>
                    </View>

                    {/* Logo cliente */}
                    <View style={styles.logoContainer}>
                        {report.client.logoUrl ? (
                            <Image
                                src={report.client.logoUrl}
                                style={styles.headerLogo}
                            />
                        ) : (
                            <Text style={styles.logoFallback}>
                                {report.client.name}
                            </Text>
                        )}
                    </View>
                </View>

                {/* =====================
              RESUMEN DE SISTEMAS
              ===================== */}

                <Text style={styles.summaryTitle}>
                    Resumen de sistemas
                </Text>

                <View style={styles.systemsSummary}>
                    {report.systems.map((system) => (
                        <View
                            key={`summary-${system.id}`}
                            style={styles.systemSummaryItem}
                        >
                            <StatusIcon
                                status={system.overallStatus}
                                size={14}
                            />

                            <Text style={styles.systemSummarySid}>
                                {system.description ?? system.sid ?? "Sin descripción"}
                            </Text>
                        </View>
                    ))}
                </View>

                {/* =====================
              SISTEMAS
              ===================== */}

                {report.systems.map((system) => (
                    <View
                        key={system.id}
                        style={styles.systemBlock}
                    >
                        {/* Encabezado del sistema */}
                        <View style={styles.systemHeader}>
                            <Text style={styles.systemTitle}>
                                {system.sid ?? "Sin SID"} -{" "}
                                {system.description ?? "Sin descripción"}
                            </Text>

                            <Text style={styles.systemMeta}>
                                {system.environment ?? ""}
                                {" · "}
                                Estado general: {system.overallStatus}
                            </Text>
                        </View>

                        {/* Cabecera de tabla */}
                        <View style={styles.tableHeader}>
                            <View
                                style={[
                                    styles.cell,
                                    styles.statusCell,
                                ]}
                            >
                                <Text style={styles.tableHeaderStatusText}>
                                    Estado
                                </Text>
                            </View>

                            <View
                                style={[
                                    styles.cell,
                                    styles.titleCell,
                                ]}
                            >
                                <Text style={styles.tableHeaderText}>
                                    Punto de revisión
                                </Text>
                            </View>

                            <View
                                style={[
                                    styles.cell,
                                    styles.commentsCell,
                                ]}
                            >
                                <Text style={styles.tableHeaderText}>
                                    Comentarios
                                </Text>
                            </View>

                            <View
                                style={[
                                    styles.cell,
                                    styles.evidenceCell,
                                ]}
                            >
                                <Text style={styles.tableHeaderText}>
                                    Evidencia
                                </Text>
                            </View>
                        </View>

                        {/* Filas */}
                        {system.reviewPoints.map((point) => (
                            <View
                                key={point.id}
                                style={styles.row}
                                wrap={false}
                            >
                                {/* Estado */}
                                <View
                                    style={[
                                        styles.cell,
                                        styles.statusCell,
                                    ]}
                                >
                                    <StatusIcon
                                        status={point.status}
                                        size={20}
                                    />
                                </View>

                                {/* Punto revisión */}
                                <View
                                    style={[
                                        styles.cell,
                                        styles.titleCell,
                                    ]}
                                >
                                    <Text style={styles.pointTitle}>
                                        {point.title}
                                    </Text>

                                    {point.description && (
                                        <Text style={styles.pointDescription}>
                                            {point.description}
                                        </Text>
                                    )}
                                </View>

                                {/* Comentarios */}
                                <View
                                    style={[
                                        styles.cell,
                                        styles.commentsCell,
                                    ]}
                                >
                                    {point.comments ? (
                                        <Text style={styles.comments}>
                                            {point.comments}
                                        </Text>
                                    ) : (
                                        <Text style={styles.emptyText}>
                                            Sin comentarios
                                        </Text>
                                    )}
                                </View>

                                {/* Evidencia */}
                                <View
                                    style={[
                                        styles.cell,
                                        styles.evidenceCell,
                                    ]}
                                >
                                    {point.evidenceUrl ? (
                                        <View style={styles.evidenceFrame}>
                                            <Image
                                                src={point.evidenceUrl}
                                                style={styles.evidence}
                                            />
                                        </View>
                                    ) : (
                                        <Text style={styles.noEvidence}>
                                            Sin evidencia
                                        </Text>
                                    )}
                                </View>
                            </View>
                        ))}
                    </View>
                ))}

                {/* =====================
              FOOTER
              ===================== */}

                <View style={styles.footer} fixed>
                    <Text>
                        {report.reportId}
                    </Text>

                    <Text
                        render={({ pageNumber, totalPages }) =>
                            `Página ${pageNumber} de ${totalPages}`
                        }
                    />
                </View>
            </Page>
        </Document>
    );
}