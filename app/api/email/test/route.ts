import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/EmailService";

export const runtime = "nodejs";

export async function POST() {
  try {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      );
    }

    if (!user.email) {
      return NextResponse.json(
        {
          error: "El usuario autenticado no tiene correo.",
        },
        { status: 400 }
      );
    }

    const result = await sendEmail({
      to: [user.email],
      subject: "Prueba SAP Checklist",
      html: `
        <h2>SAP Checklist</h2>

        <p>
          Si recibes este correo, la configuración SMTP con Gmail
          está funcionando correctamente.
        </p>
      `,
    });

    return NextResponse.json({
      ok: true,
      recipient: user.email,
      messageId: result.messageId,
    });
  } catch (error: any) {
    console.error("Error correo prueba:", error);

    return NextResponse.json(
      {
        error:
          error?.message ??
          "No se pudo enviar el correo.",
      },
      { status: 500 }
    );
  }
}