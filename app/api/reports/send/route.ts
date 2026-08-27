import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { getChecklistDate } from "@/lib/date";

import { sendEmail } from "@/lib/email/EmailService";
import {
  buildReportEmailHtml,
  type EvidenceCidMap,
} from "@/lib/email/templates/ReportEmail";

import { ReportBuilder } from "@/lib/reporting/ReportBuilder";

import {
  markDailyReportMailSent,
  markDailyReportMailError,
} from "@/lib/reporting/repository/DailyReportRepository";

export const runtime = "nodejs";

/*
 * Obtiene un nombre de archivo a partir
 * de la ruta almacenada en Supabase.
 */
function getFileName(path: string) {
  const parts = path.split("/");
  return parts[parts.length - 1] || "evidence.png";
}

/*
 * Determina un content-type razonable
 * a partir de la extensión.
 */
function getContentType(path: string) {
  const lower = path.toLowerCase();

  if (
    lower.endsWith(".jpg") ||
    lower.endsWith(".jpeg")
  ) {
    return "image/jpeg";
  }

  if (lower.endsWith(".webp")) {
    return "image/webp";
  }

  if (lower.endsWith(".gif")) {
    return "image/gif";
  }

  return "image/png";
}

/*
 * Normaliza evidenceUrl.
 *
 * Actualmente normalmente guardamos una ruta como:
 *
 * userId/checklistId/file.png
 *
 * Pero esta función también soporta:
 *
 * evidence/userId/...
 *
 * por si algún registro antiguo quedó de esa forma.
 */
function normalizeEvidencePath(
  evidenceUrl: string
) {
  if (evidenceUrl.startsWith("evidence/")) {
    return evidenceUrl.substring(
      "evidence/".length
    );
  }

  return evidenceUrl;
}

export async function POST(
  request: NextRequest
) {
  let clientIdForError: string | null = null;

  try {
    const supabase = createClient();

    /*
     * Usuario autenticado.
     */
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          error: "No autenticado",
        },
        {
          status: 401,
        }
      );
    }

    /*
     * Request.
     */
    const body = await request.json();

    const clientId =
      body?.clientId;

    const recipients =
      body?.recipients;

    clientIdForError =
      clientId ?? null;

    if (!clientId) {
      return NextResponse.json(
        {
          error:
            "Debe indicar clientId",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Array.isArray(recipients) ||
      recipients.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "Debe indicar al menos un destinatario",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Validamos además que todos los
     * destinatarios sean strings.
     */
    const cleanRecipients =
      recipients
        .filter(
          (recipient): recipient is string =>
            typeof recipient === "string"
        )
        .map((recipient) =>
          recipient.trim()
        )
        .filter(Boolean);

    if (cleanRecipients.length === 0) {
      return NextResponse.json(
        {
          error:
            "No hay destinatarios válidos.",
        },
        {
          status: 400,
        }
      );
    }

    const executionDate =
      getChecklistDate();

    /*
     * -------------------------------------------------
     * 1. Buscar informe generado
     * -------------------------------------------------
     */
    const {
      data: reportData,
      error: reportError,
    } = await supabase
      .from("daily_reports")
      .select(
        "report_id, pdf_path"
      )
      .eq(
        "client_id",
        clientId
      )
      .eq(
        "execution_date",
        executionDate
      )
      .single();

    if (
      reportError ||
      !reportData?.pdf_path
    ) {
      return NextResponse.json(
        {
          error:
            "No se encontró el informe generado.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * -------------------------------------------------
     * 2. Reconstruir datos estructurados
     * -------------------------------------------------
     *
     * No generamos nuevamente el PDF.
     *
     * Necesitamos el objeto report para:
     *
     * - resumen
     * - sistemas
     * - puntos
     * - comentarios
     * - configuración de evidencia en correo
     */
    const builder =
      new ReportBuilder(supabase);

    builder.setExecutionDate(
      executionDate
    );

    await builder.loadClient(
      clientId
    );

    await builder.loadProvider();

    await builder.loadOperator(
      user.id
    );

    await builder.loadSystems();

    await builder.loadChecklistResults();

    const report =
      builder.build();

    /*
     * -------------------------------------------------
     * 3. Descargar PDF previsualizado
     * -------------------------------------------------
     */
    const {
      data: pdfFile,
      error: pdfDownloadError,
    } = await supabase.storage
      .from("reports")
      .download(
        reportData.pdf_path
      );

    if (
      pdfDownloadError ||
      !pdfFile
    ) {
      throw new Error(
        "No se pudo descargar el PDF desde Storage."
      );
    }

    const pdfArrayBuffer =
      await pdfFile.arrayBuffer();

    const pdfBuffer =
      Buffer.from(
        pdfArrayBuffer
      );

    /*
     * -------------------------------------------------
     * 4. Buscar evidencias que deben aparecer
     *    en el cuerpo del correo
     * -------------------------------------------------
     */
    const evidenceReviewPoints =
      report.systems.flatMap(
        (system) =>
          system.reviewPoints
            .filter(
              (reviewPoint) =>
                reviewPoint
                  .includeEvidenceInEmail ===
                  true &&
                Boolean(
                  reviewPoint.evidenceUrl
                )
            )
            .map(
              (reviewPoint) => ({
                systemId:
                  system.id,

                reviewPointId:
                  reviewPoint.id,

                title:
                  reviewPoint.title,

                evidenceUrl:
                  reviewPoint.evidenceUrl!,
              })
            )
      );

    /*
     * Mapa usado por ReportEmail.ts
     *
     * reviewPointId -> CID
     */
    const evidenceCidMap:
      EvidenceCidMap = {};

    /*
     * Adjuntos inline para Nodemailer.
     */
    const inlineAttachments: {
      filename: string;
      content: Buffer;
      contentType: string;
      cid: string;
    }[] = [];

    /*
     * -------------------------------------------------
     * 5. Descargar evidencias desde Storage
     * -------------------------------------------------
     */
    for (
      const evidence
      of evidenceReviewPoints
    ) {
      try {
        const evidencePath =
          normalizeEvidencePath(
            evidence.evidenceUrl
          );

        /*
         * CID único.
         *
         * Ejemplo:
         * evidence-e8ca559f-...
         */
        const cid =
          `evidence-${evidence.reviewPointId}`;

        const {
          data: evidenceFile,
          error: evidenceDownloadError,
        } = await supabase.storage
          .from("evidence")
          .download(
            evidencePath
          );

        if (
          evidenceDownloadError ||
          !evidenceFile
        ) {
          /*
           * Una evidencia dañada no bloquea
           * todo el correo.
           */
          console.error(
            "No se pudo descargar evidencia para correo:",
            {
              reviewPointId:
                evidence.reviewPointId,

              title:
                evidence.title,

              path:
                evidencePath,

              error:
                evidenceDownloadError,
            }
          );

          continue;
        }

        const evidenceArrayBuffer =
          await evidenceFile.arrayBuffer();

        const evidenceBuffer =
          Buffer.from(
            evidenceArrayBuffer
          );

        /*
         * Registramos CID para que
         * ReportEmail pueda mostrarla.
         */
        evidenceCidMap[
          evidence.reviewPointId
        ] = cid;

        /*
         * Adjuntamos imagen inline.
         */
        inlineAttachments.push({
          filename:
            getFileName(
              evidencePath
            ),

          content:
            evidenceBuffer,

          contentType:
            evidenceFile.type ||
            getContentType(
              evidencePath
            ),

          cid,
        });
      } catch (evidenceError) {
        console.error(
          "Error procesando evidencia inline:",
          evidenceError
        );
      }
    }

    console.log(
      "Evidencias configuradas para correo:",
      evidenceReviewPoints.length
    );

    console.log(
      "Evidencias cargadas correctamente:",
      inlineAttachments.length
    );

    /*
     * -------------------------------------------------
     * 6. Generar HTML
     * -------------------------------------------------
     */
    const subject =
      `Checklist SAP - ${report.client.name} - ${executionDate}`;

    const html =
      buildReportEmailHtml(
        report,
        evidenceCidMap
      );

    /*
     * -------------------------------------------------
     * 7. Enviar correo
     * -------------------------------------------------
     *
     * PDF:
     * adjunto normal.
     *
     * Evidencias:
     * adjuntos inline mediante CID.
     */
    await sendEmail({
      to: cleanRecipients,

      subject,

      html,

      attachments: [
        /*
         * PDF
         */
        {
          filename:
            `${reportData.report_id}.pdf`,

          content:
            pdfBuffer,

          contentType:
            "application/pdf",
        },

        /*
         * Imágenes embebidas
         */
        ...inlineAttachments,
      ],
    });

    /*
     * -------------------------------------------------
     * 8. Marcar como enviado
     * -------------------------------------------------
     */
    await markDailyReportMailSent(
      supabase,
      {
        clientId,

        executionDate,

        recipients:
          cleanRecipients,

        deliveryStatus:
          "SENT_TO_CLIENT",
      }
    );

    return NextResponse.json({
      ok: true,

      sentTo:
        cleanRecipients,

      inlineEvidenceCount:
        inlineAttachments.length,
    });
  } catch (error: any) {
    console.error(
      "Error enviando informe al cliente:",
      error
    );

    /*
     * Intentamos registrar el error
     * en daily_reports.
     */
    if (clientIdForError) {
      try {
        const supabase =
          createClient();

        await markDailyReportMailError(
          supabase,
          {
            clientId:
              clientIdForError,

            executionDate:
              getChecklistDate(),

            errorMessage:
              error?.message ??
              "Error desconocido enviando informe.",
          }
        );
      } catch (
        registerError
      ) {
        console.error(
          "No se pudo registrar mail_error:",
          registerError
        );
      }
    }

    return NextResponse.json(
      {
        error:
          error?.message ??
          "No se pudo enviar el informe.",
      },
      {
        status: 500,
      }
    );
  }
}