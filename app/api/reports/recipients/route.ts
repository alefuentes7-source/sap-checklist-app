import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);

    const clientId = searchParams.get("clientId");

    if (!clientId) {
      return NextResponse.json(
        { error: "Debe indicar clientId" },
        { status: 400 }
      );
    }

    const {
      data: contactsData,
      error: contactsError,
    } = await supabase
      .from("client_contacts")
      .select(`
        id,
        name,
        email,
        role_description
      `)
      .eq("client_id", clientId)
      .eq("active", true)
      .not("email", "is", null)
      .order("name");

    if (contactsError) {
      throw contactsError;
    }

    const contacts =
      (contactsData ?? []).filter(
        (contact) =>
          contact.email &&
          contact.email.trim().length > 0
      );

    return NextResponse.json({
      ok: true,
      contacts,
    });
  } catch (error: any) {
    console.error(
      "Error cargando destinatarios:",
      error
    );

    return NextResponse.json(
      {
        error:
          error?.message ??
          "No se pudieron cargar los destinatarios.",
      },
      {
        status: 500,
      }
    );
  }
}