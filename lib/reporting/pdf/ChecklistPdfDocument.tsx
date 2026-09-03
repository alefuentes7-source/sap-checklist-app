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
   CABECERA TECNOLÓGICA
   ========================= */

    heroHeader: {
        position: "relative",
        height: 118,
        marginHorizontal: -24,
        marginTop: -20,
        marginBottom: 14,
        backgroundColor: "#06152F",
        overflow: "hidden",
    },

    heroBackground: {
        position: "absolute",
        top: 0,
        right: 0,
        width: "72%",
        height: "100%",
        objectFit: "cover",
        opacity: 1,
    },

    heroOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        width: "52%",
        height: "100%",
        backgroundColor: "rgba(3, 15, 36, 0.55)",
    },

    heroContent: {
        position: "relative",
        height: "100%",
        flexDirection: "row",
        justifyContent: "space-between",
        paddingTop: 14,
        paddingBottom: 12,
        paddingHorizontal: 24,
    },

    heroLeft: {
        width: "68%",
        justifyContent: "space-between",
    },

    heroProviderLogoContainer: {
        width: 100,
        height: 32,
        alignItems: "flex-start",
        justifyContent: "center",
    },
    
    heroProviderLogo: {
        maxWidth: 100,
        maxHeight: 30,
        objectFit: "contain",
    },

    heroProviderFallback: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#FFFFFF",
    },

    heroClientName: {
        marginTop: 7,
        fontSize: 16,
        fontWeight: "bold",
        color: "#FFFFFF",
    },

    heroStatusRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 4,
    },

    heroStatusLabel: {
        fontSize: 9,
        color: "#E5E7EB",
    },

    heroStatusOk: {
        marginLeft: 3,
        fontSize: 9,
        fontWeight: "bold",
        color: "#22C55E",
    },

    heroStatusWarning: {
        marginLeft: 3,
        fontSize: 9,
        fontWeight: "bold",
        color: "#F59E0B",
    },

    heroMetadata: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 11,
    },

    heroMetadataText: {
        fontSize: 7.3,
        color: "#F3F4F6",
    },

    heroMetadataSeparator: {
        marginHorizontal: 6,
        fontSize: 7.3,
        color: "#94A3B8",
    },

    heroRight: {
        width: "26%",
        alignItems: "flex-end",
        justifyContent: "flex-start",
        paddingTop: 4,
        paddingRight: 6,
    },

    heroClientLogoBox: {
        width: 96,
        height: 40,
        alignItems: "center",
        justifyContent: "center",
    },

    heroClientLogo: {
        maxWidth: 96,
        maxHeight: 36,
        objectFit: "contain",
    },

    heroClientFallback: {
        fontSize: 7,
        fontWeight: "bold",
        color: "#111827",
        textAlign: "center",
    },

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
        width: "20%",
        alignItems: "flex-start",
        justifyContent: "center",
    },

    commentsCell: {
        width: "20%",
        alignItems: "flex-start",
        justifyContent: "center",
    },

    evidenceCell: {
        width: "43%",
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
        fontSize: 6.4,
        lineHeight: 1.25,
        color: "#374151",
        textAlign: "left",
    },

    emptyText: {
        fontSize: 6.5,
        color: "#9ca3af",
        fontStyle: "italic",
        textAlign: "left",
    },

    /* Evidencias múltiples */
    evidencesContainer: {
        width: "100%",
        flexDirection: "column",
        alignItems: "center",
    },

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
        marginBottom: 5,
    },

    evidenceFrameLast: {
        marginBottom: 0,
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

function formatCurrentTime(): string {
    return new Intl.DateTimeFormat("es-CL", {
        timeZone: "America/Santiago",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    }).format(new Date());
}

function getOverallReportStatus(
    report: DailyClientReport
): "OK" | "WARNING" {
    return report.systems.some(
        (system) => system.overallStatus === "WARNING"
    )
        ? "WARNING"
        : "OK";
}
/**
 * Inserta puntos de corte invisibles en textos técnicos largos para que
 * React PDF pueda envolverlos dentro de la celda sin desbordarse.
 */
function wrapTechnicalText(value: string): string {
    return value
        .split(/\s+/)
        .map((token) => {
            if (token.length <= 18) {
                return token;
            }

            // Permite corte después de separadores habituales en nombres SAP.
            const withBreaks = token.replace(
                /([_\-\/\\.])/g,
                "$1\u200B"
            );

            // Si sigue siendo una cadena larga, agrega cortes cada 18 caracteres.
            return withBreaks.replace(
                /([^\u200B]{18})(?=[^\u200B])/g,
                "$1\u200B"
            );
        })
        .join(" ");
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
    const overallStatus =
        getOverallReportStatus(report);

    const executionTime =
        formatCurrentTime();

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

                <View style={styles.heroHeader}>
                    {/* Imagen tecnológica de fondo */}
                    <Image
                        src={`${process.cwd()}/public/pdf-header.png`}
                        style={styles.heroBackground}
                    />

                    <View style={styles.heroOverlay} />

                    <View style={styles.heroContent}>
                        {/* ==========================
            IZQUIERDA
            ========================== */}
                        <View style={styles.heroLeft}>

                            {/* Logo proveedor */}
                            <View style={styles.heroProviderLogoContainer}>
                                {report.provider?.logoUrl ? (
                                    <Image
                                        src={report.provider.logoUrl}
                                        style={styles.heroProviderLogo}
                                    />
                                ) : (
                                    <Text style={styles.heroProviderFallback}>
                                        {report.provider?.name ?? ""}
                                    </Text>
                                )}
                            </View>

                            {/* Cliente */}
                            <View>
                                <Text style={styles.heroClientName}>
                                    {report.client.name}
                                </Text>

                                <View style={styles.heroStatusRow}>
                                    <Text style={styles.heroStatusLabel}>
                                        Estado general:
                                    </Text>

                                    <Text
                                        style={
                                            overallStatus === "WARNING"
                                                ? styles.heroStatusWarning
                                                : styles.heroStatusOk
                                        }
                                    >
                                        {overallStatus === "WARNING"
                                            ? "ADVERTENCIA"
                                            : "OK"}
                                    </Text>
                                </View>

                                {/* Datos de ejecución */}
                                <View style={styles.heroMetadata}>
                                    <Text style={styles.heroMetadataText}>
                                        Fecha: {formatDate(report.executionDate)}
                                    </Text>

                                    <Text style={styles.heroMetadataSeparator}>
                                        •
                                    </Text>

                                    <Text style={styles.heroMetadataText}>
                                        Hora: {executionTime}
                                    </Text>

                                    <Text style={styles.heroMetadataSeparator}>
                                        •
                                    </Text>

                                    <Text style={styles.heroMetadataText}>
                                        Ejecutado por: {report.operator?.name ?? "-"}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* ==========================
            DERECHA
            Logo cliente
            ========================== */}
                        <View style={styles.heroRight}>
                            <View style={styles.heroClientLogoBox}>
                                {report.client.logoUrl ? (
                                    <Image
                                        src={report.client.logoUrl}
                                        style={styles.heroClientLogo}
                                    />
                                ) : (
                                    <Text style={styles.heroClientFallback}>
                                        {report.client.name}
                                    </Text>
                                )}
                            </View>
                        </View>
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
                                status={
                                    system.overallStatus === "WARNING"
                                        ? "WARNING"
                                        : "OK"
                                }
                            />

                            <Text style={styles.systemSummarySid}>
                                {wrapTechnicalText(
                                    system.description ?? system.sid ?? "Sin descripción"
                                )}
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
                                {wrapTechnicalText(system.sid ?? "Sin SID")} -{" "}
                                {wrapTechnicalText(
                                    system.description ?? "Sin descripción"
                                )}
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
                                        status={
                                            point.status === "WARNING"
                                                ? "WARNING"
                                                : "OK"
                                        }
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
                                        {wrapTechnicalText(point.title)}
                                    </Text>

                                    {point.description && (
                                        <Text style={styles.pointDescription}>
                                            {wrapTechnicalText(point.description)}
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
                                            {wrapTechnicalText(point.comments)}
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
                                    {point.evidences.some(
                                        (evidence) => Boolean(evidence.imageUrl)
                                    ) ? (
                                        <View style={styles.evidencesContainer}>
                                            {point.evidences
                                                .filter(
                                                    (evidence) =>
                                                        Boolean(evidence.imageUrl)
                                                )
                                                .map((evidence, index, visibleEvidences) => (
                                                    <View
                                                        key={evidence.id}
                                                        style={[
                                                            styles.evidenceFrame,
                                                            index === visibleEvidences.length - 1
                                                                ? styles.evidenceFrameLast
                                                                : {},
                                                        ]}
                                                    >
                                                        <Image
                                                            src={evidence.imageUrl!}
                                                            style={styles.evidence}
                                                        />
                                                    </View>
                                                ))}
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
        </Document >
    );
}