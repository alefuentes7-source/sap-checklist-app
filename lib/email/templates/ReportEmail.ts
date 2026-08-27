import type { DailyClientReport } from "@/lib/reporting/types";

function formatDate(value: string) {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

/*
 * Evita que comentarios o textos ingresados
 * por usuarios rompan el HTML del correo.
 */
function escapeHtml(value: string | null | undefined) {
  if (!value) return "";

  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/*
 * reviewPointId -> CID utilizado por Nodemailer.
 *
 * Ejemplo:
 *
 * {
 *   "uuid-review-point": "evidence-uuid-review-point"
 * }
 *
 * En el HTML se utilizará:
 *
 * <img src="cid:evidence-uuid-review-point">
 */
export type EvidenceCidMap =
  Record<string, string>;

export function buildReportEmailHtml(
  report: DailyClientReport,
  evidenceCidMap: EvidenceCidMap = {}
): string {
  const hasWarnings =
    report.summary.warningSystems > 0;

  /*
   * Busca únicamente puntos configurados
   * para mostrar evidencia en el correo.
   */
  const evidenceItems =
    report.systems.flatMap((system) =>
      system.reviewPoints
        .filter(
          (reviewPoint) =>
            reviewPoint.includeEvidenceInEmail === true &&
            Boolean(reviewPoint.evidenceUrl)
        )
        .map((reviewPoint) => ({
          reviewPointId: reviewPoint.id,

          system:
            system.description ??
            system.sid ??
            "Sistema",

          sid:
            system.sid,

          title:
            reviewPoint.title,

          description:
            reviewPoint.description,

          comments:
            reviewPoint.comments,

          status:
            reviewPoint.status,

          evidenceUrl:
            reviewPoint.evidenceUrl!,
        }))
    );

  /*
   * Solo mostramos aquellas evidencias
   * para las que el endpoint de envío
   * haya preparado un CID.
   */
  const evidenceItemsWithCid =
    evidenceItems.filter(
      (item) =>
        Boolean(
          evidenceCidMap[
            item.reviewPointId
          ]
        )
    );

  const statusMessage = hasWarnings
    ? `
      <p
        style="
          color:#b45309;
          font-weight:600;
          margin:24px 0 14px 0;
        "
      >
        ⚠️ Se detectaron ${report.summary.warningSystems}
        sistema(s) con Warning.
      </p>
    `
    : `
      <p
        style="
          color:#15803d;
          font-weight:600;
          margin:24px 0 14px 0;
        "
      >
        ✅ Todos los sistemas revisados se encuentran OK.
      </p>
    `;

  /*
   * Sección de evidencias destacadas.
   */
  const evidenceHtml =
    evidenceItemsWithCid.length > 0
      ? `
        <div
          style="
            margin-top:30px;
          "
        >
          <h3
            style="
              margin:0 0 6px 0;
              font-size:18px;
              line-height:1.4;
              color:#1f2937;
            "
          >
            Evidencias destacadas
          </h3>

          <p
            style="
              margin:0 0 18px 0;
              font-size:13px;
              line-height:1.5;
              color:#6b7280;
            "
          >
            A continuación se muestran las evidencias
            seleccionadas para ser incluidas en el informe por correo.
          </p>

          ${evidenceItemsWithCid
            .map((item) => {
              const cid =
                evidenceCidMap[
                  item.reviewPointId
                ];

              const isWarning =
                item.status === "WARNING";

              const statusLabel =
                isWarning
                  ? "⚠️ Warning"
                  : "✅ OK";

              const statusColor =
                isWarning
                  ? "#b45309"
                  : "#15803d";

              const statusBackground =
                isWarning
                  ? "#fffbeb"
                  : "#f0fdf4";

              return `
                <div
                  style="
                    margin-bottom:22px;
                    border:1px solid #e5e7eb;
                    border-radius:8px;
                    overflow:hidden;
                    background:#ffffff;
                  "
                >
                  <div
                    style="
                      padding:16px 18px;
                      border-bottom:1px solid #e5e7eb;
                      background:#f9fafb;
                    "
                  >
                    <table
                      cellpadding="0"
                      cellspacing="0"
                      width="100%"
                    >
                      <tr>
                        <td
                          style="
                            vertical-align:top;
                          "
                        >
                          <p
                            style="
                              margin:0;
                              font-size:14px;
                              font-weight:700;
                              color:#1f2937;
                            "
                          >
                            ${escapeHtml(
                              item.system
                            )}
                          </p>

                          ${
                            item.sid
                              ? `
                                <p
                                  style="
                                    margin:3px 0 0 0;
                                    font-size:11px;
                                    color:#6b7280;
                                  "
                                >
                                  SID:
                                  ${escapeHtml(
                                    item.sid
                                  )}
                                </p>
                              `
                              : ""
                          }
                        </td>

                        <td
                          align="right"
                          style="
                            vertical-align:top;
                          "
                        >
                          <span
                            style="
                              display:inline-block;
                              padding:4px 8px;
                              border-radius:999px;
                              background:${statusBackground};
                              color:${statusColor};
                              font-size:11px;
                              font-weight:700;
                            "
                          >
                            ${statusLabel}
                          </span>
                        </td>
                      </tr>
                    </table>
                  </div>

                  <div
                    style="
                      padding:18px;
                    "
                  >
                    <p
                      style="
                        margin:0;
                        font-size:15px;
                        font-weight:700;
                        color:#1f2937;
                      "
                    >
                      ${escapeHtml(
                        item.title
                      )}
                    </p>

                    ${
                      item.description
                        ? `
                          <p
                            style="
                              margin:5px 0 0 0;
                              font-size:13px;
                              line-height:1.5;
                              color:#6b7280;
                            "
                          >
                            ${escapeHtml(
                              item.description
                            )}
                          </p>
                        `
                        : ""
                    }

                    ${
                      item.comments
                        ? `
                          <div
                            style="
                              margin-top:14px;
                              padding:12px 14px;
                              background:#f9fafb;
                              border-radius:6px;
                            "
                          >
                            <p
                              style="
                                margin:0 0 4px 0;
                                font-size:10px;
                                font-weight:700;
                                text-transform:uppercase;
                                letter-spacing:0.05em;
                                color:#6b7280;
                              "
                            >
                              Comentarios
                            </p>

                            <p
                              style="
                                margin:0;
                                font-size:13px;
                                line-height:1.5;
                                color:#374151;
                              "
                            >
                              ${escapeHtml(
                                item.comments
                              )}
                            </p>
                          </div>
                        `
                        : ""
                    }

                    <div
                      style="
                        margin-top:16px;
                        text-align:center;
                      "
                    >
                      <img
                        src="cid:${cid}"
                        alt="Evidencia - ${escapeHtml(
                          item.title
                        )}"
                        style="
                          display:block;
                          width:100%;
                          max-width:600px;
                          height:auto;
                          margin:0 auto;
                          border:1px solid #e5e7eb;
                          border-radius:6px;
                        "
                      />
                    </div>
                  </div>
                </div>
              `;
            })
            .join("")}
        </div>
      `
      : "";

  return `
    <!DOCTYPE html>

    <html>
      <body
        style="
          margin:0;
          padding:0;
          background:#f5f6f8;
          font-family:Arial,Helvetica,sans-serif;
          color:#1f2937;
        "
      >
        <div
          style="
            max-width:700px;
            margin:0 auto;
            padding:40px 20px;
          "
        >
          <div
            style="
              background:#ffffff;
              border:1px solid #e5e7eb;
              border-radius:10px;
              padding:36px 40px;
            "
          >
            <h2
              style="
                margin:0;
                font-size:24px;
                line-height:1.3;
                color:#1f2937;
              "
            >
              Informe diario de checklist SAP
            </h2>

            <p
              style="
                margin:8px 0 28px 0;
                color:#6b7280;
                font-size:15px;
              "
            >
              ${escapeHtml(
                report.client.name
              )}
              ·
              ${formatDate(
                report.executionDate
              )}
            </p>

            <p
              style="
                margin:0 0 16px 0;
                font-size:15px;
                line-height:1.6;
              "
            >
              Estimados,
            </p>

            <p
              style="
                margin:0 0 26px 0;
                font-size:15px;
                line-height:1.6;
              "
            >
              Se generó correctamente el informe diario
              correspondiente al cliente
              <strong>
                ${escapeHtml(
                  report.client.name
                )}
              </strong>.
            </p>

            <div
              style="
                margin:0;
                padding:20px;
                background:#f9fafb;
                border-radius:8px;
              "
            >
              <table
                cellpadding="0"
                cellspacing="0"
                width="100%"
                style="
                  font-size:15px;
                  color:#1f2937;
                "
              >
                <tr>
                  <td
                    style="
                      padding:6px 0;
                    "
                  >
                    Sistemas revisados
                  </td>

                  <td
                    align="right"
                    style="
                      padding:6px 0;
                      font-weight:700;
                    "
                  >
                    ${report.summary.completedSystems}
                  </td>
                </tr>

                <tr>
                  <td
                    style="
                      padding:6px 0;
                    "
                  >
                    Sistemas OK
                  </td>

                  <td
                    align="right"
                    style="
                      padding:6px 0;
                      font-weight:700;
                    "
                  >
                    ${report.summary.okSystems}
                  </td>
                </tr>

                <tr>
                  <td
                    style="
                      padding:6px 0;
                    "
                  >
                    Warning
                  </td>

                  <td
                    align="right"
                    style="
                      padding:6px 0;
                      font-weight:700;
                    "
                  >
                    ${report.summary.warningSystems}
                  </td>
                </tr>

                <tr>
                  <td
                    style="
                      padding:6px 0;
                    "
                  >
                    Puntos revisados
                  </td>

                  <td
                    align="right"
                    style="
                      padding:6px 0;
                      font-weight:700;
                    "
                  >
                    ${report.summary.totalReviewPoints}
                  </td>
                </tr>
              </table>
            </div>

            ${statusMessage}

            <p
              style="
                margin:0;
                font-size:15px;
                line-height:1.6;
              "
            >
              Se adjunta el informe diario de revisión
              de los sistemas SAP.
            </p>

            ${evidenceHtml}

            <p
              style="
                margin:32px 0 0 0;
                padding-top:20px;
                border-top:1px solid #e5e7eb;
                color:#6b7280;
                font-size:13px;
              "
            >
              Este correo fue generado automáticamente
              por SAP Checklist.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}