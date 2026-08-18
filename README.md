# Checklists SAP

Scaffold inicial de la app de checklists de estado de salud de sistemas SAP.

## Cómo correrlo

```bash
npm install
cp .env.local.example .env.local   # completar con tus datos de Supabase
npm run dev
```

## Qué incluye este scaffold

- **Auth**: login con Supabase Auth (`app/login`), middleware que protege
  `/clientes` y `/checklist`.
- **Selección de cliente** (`app/clientes`): lista primero los clientes
  asignados al operador (`user_clients`) y debajo el resto de clientes
  activos, para casos de reemplazo/cobertura.
- **Supabase**: cliente de navegador (`lib/supabase/client.ts`) y de
  servidor (`lib/supabase/server.ts`) usando `@supabase/ssr`.
- **Tokens de diseño** en `tailwind.config.ts`: paleta ink/accent/warn,
  tipografías Space Grotesk (display), Inter (texto), IBM Plex Mono
  (códigos SID, badges de estado).
- **RLS**: ver `rls_checklist_sap.sql` (entregado antes) para las
  políticas de seguridad a nivel de fila que este frontend asume.

## Pendiente (próximos pasos)

- `app/checklist/nuevo`: wizard por sistema → review_points.
- Autosave de `checklists` / `checklist_results` mientras se completa.
- Edge Function `generar-pdf-y-enviar` (usa `SUPABASE_SERVICE_ROLE_KEY`).
- Sincronizar `public.users` con `auth.users` al crear cuentas (trigger).
