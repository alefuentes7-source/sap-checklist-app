import type { DailyClientReport } from "@/lib/reporting/types";

function formatDate(value: string) {
  const [year, month, day] = value.split("-");

  return `${day}/${month}/${year}`;
}

export function buildReportEmailHtml(
  report: DailyClientReport
): string {
  const warningText =
    report.summary.warningSystems > 0
      ? `
        <p style="color:#b45309;font-weight:600;">
          ⚠️ Se detectaron ${report.summary.warningSystems}
          sistema(s) con Warning.
        </p>
      `
      : `
        <p style="color:#15803d;font-weight:600;">
          ✅ Todos los sistemas revisados se encuentran OK.
        </p>
      `;

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
            max-width:620px;
            margin:0 auto;
            padding:28px 20px;
          "
        >
          <div
            style="
              background:#ffffff;
              border:1px solid #e5e7eb;
              border-radius:8px;
              padding:28px;
            "
          >
            <h2
              style="
                margin:0 0 8px 0;
                font-size:20px;
              "
            >
              Informe diario de checklist SAP
            </h2>

            <p
              style="
                margin:0 0 24px 0;
                color:#6b7280;
              "
            >
              ${report.client.name}
              ·
              ${formatDate(report.executionDate)}
            </p>

            <p>
              Hola ${report.operator?.name ?? ""},
            </p>

            <p>
              Se generó correctamente el informe diario
              correspondiente al cliente
              <strong>${report.client.name}</strong>.
            </p>

            <div
              style="
                margin:22px 0;
                padding:16px;
                background:#f9fafb;
                border-radius:6px;
              "
            >
              <table
                cellpadding="0"
                cellspacing="0"
                width="100%"
              >
                <tr>
                  <td style="padding:5px 0;">
                    Sistemas revisados
                  </td>

                  <td
                    align="right"
                    style="
                      padding:5px 0;
                      font-weight:600;
                    "
                  >
                    ${report.summary.completedSystems}
                  </td>
                </tr>

                <tr>
                  <td style="padding:5px 0;">
                    Sistemas OK
                  </td>

                  <td
                    align="right"
                    style="
                      padding:5px 0;
                      font-weight:600;
                    "
                  >
                    ${report.summary.okSystems}
                  </td>
                </tr>

                <tr>
                  <td style="padding:5px 0;">
                    Warning
                  </td>

                  <td
                    align="right"
                    style="
                      padding:5px 0;
                      font-weight:600;
                    "
                  >
                    ${report.summary.warningSystems}
                  </td>
                </tr>

                <tr>
                  <td style="padding:5px 0;">
                    Puntos revisados
                  </td>

                  <td
                    align="right"
                    style="
                      padding:5px 0;
                      font-weight:600;
                    "
                  >
                    ${report.summary.totalReviewPoints}
                  </td>
                </tr>
              </table>
            </div>

            ${warningText}

            <p>
              Se adjunta el informe en PDF para tu revisión
              antes de enviarlo al cliente.
            </p>

            <p
              style="
                margin-top:28px;
                color:#6b7280;
                font-size:12px;
              "
            >
              Este correo fue generado automáticamente por
              SAP Checklist.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}