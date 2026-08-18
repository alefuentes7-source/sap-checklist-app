import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

import type {
    DailyClientReport,
    ReportClient,
    ReportOperator,
    ReportProvider,
    ReportSummary,
    ReportSystem,
} from "@/lib/reporting/types";

type Client = SupabaseClient<Database>;

export class ReportBuilder {
    private supabase: Client;

    private client: ReportClient | null = null;
    private providerId: string | null = null;
    private provider: ReportProvider | null = null;
    private operator: ReportOperator | null = null;

    private executionDate: string | null = null;
    private clientId: string | null = null;
    private operatorId: string | null = null;

    private systems: ReportSystem[] = [];

    constructor(supabase: Client) {
        this.supabase = supabase;
    }

    /**
     * Define la fecha del informe.
     * Formato esperado: YYYY-MM-DD
     */
    setExecutionDate(executionDate: string) {
        this.executionDate = executionDate;

        return this;
    }

    /**
     * Carga los datos del cliente.
     * Se implementará en el siguiente paso.
     */
    async loadClient(clientId: string) {
        const { data, error } = await this.supabase
            .from("clients")
            .select(`
        id,
        name,
        logo_url,
        provider_id
      `)
            .eq("id", clientId)
            .single();

        if (error) {
            throw error;
        }

        if (!data) {
            throw new Error("Cliente no encontrado.");
        }

        this.client = {

            id: data.id,
            name: data.name,
            logoUrl: data.logo_url,
        }; this.clientId = data.id;

        this.providerId = data.provider_id;

        return this;
    }
    /**
     * Carga el proveedor asociado al cliente.
     * Se implementará después de loadClient().
     */
    async loadProvider() {
        if (!this.providerId) {
            this.provider = null;
            return this;
        }

        const { data, error } = await this.supabase
            .from("providers")
            .select(`
            id,
            name,
            logo_url
          `)
            .eq("id", this.providerId)
            .maybeSingle();

        if (error) {
            throw error;
        }

        if (!data) {
            this.provider = null;
            return this;
        }

        this.provider = {
            id: data.id,
            name: data.name,
            logoUrl: data.logo_url,
        };

        return this;
    }
    /**
     * Carga los datos del operador.
     */
    async loadOperator(userId: string) {
        const { data, error } = await this.supabase
            .from("users")
            .select(`
            id,
            name
          `)
            .eq("id", userId)
            .maybeSingle();

        if (error) {
            throw error;
        }

        if (!data) {
            this.operator = null;
            return this;
        }

        this.operator = {
            id: data.id,
            name: data.name,
        };
        this.operatorId = data.id;

        return this;
    }

    /**
     * Carga los sistemas y checklists correspondientes
     * al cliente y fecha seleccionados.
     */
    async loadSystems() {

        if (!this.clientId) {
            throw new Error("Debe ejecutar loadClient() primero.");
        }

        if (!this.operatorId) {
            throw new Error("Debe ejecutar loadOperator() primero.");
        }

        if (!this.executionDate) {
            throw new Error("Debe definir executionDate.");
        }

        //-----------------------------------------
        // Sistemas
        //-----------------------------------------

        const { data: systems, error: systemsError } =
            await this.supabase
                .from("systems")
                .select(`
              id,
              sid,
              description,
              environment,
              display_order
            `)
                .eq("client_id", this.clientId)
                .eq("active", true)
                .order("display_order");

        if (systemsError) {
            throw systemsError;
        }

        //-----------------------------------------
        // Checklists del día
        //-----------------------------------------

        const { data: checklists, error: checklistError } =
            await this.supabase
                .from("checklists")
                .select(`
              id,
              system_id,
              overall_status,
              submitted_at
            `)
                .eq("client_id", this.clientId)
                .eq("created_by", this.operatorId)
                .eq("execution_date", this.executionDate);

        if (checklistError) {
            throw checklistError;
        }

        const checklistMap = new Map(
            (checklists ?? []).map((checklist) => [
                checklist.system_id,
                checklist,
            ])
        );

        this.systems = (systems ?? []).map((system) => {

            const checklist = checklistMap.get(system.id);

            return {

                id: system.id,

                sid: system.sid,

                description: system.description,

                environment: system.environment,

                displayOrder: system.display_order ?? 999,

                checklistId: checklist?.id ?? "",

                submittedAt: checklist?.submitted_at ?? null,

                overallStatus:
                    checklist?.overall_status === "WARNING"
                        ? "WARNING"
                        : "OK",

                totalReviewPoints: 0,

                okReviewPoints: 0,

                warningReviewPoints: 0,

                reviewPoints: [],
            };

        });

        return this;

    }

    async loadChecklistResults() {
        if (this.systems.length === 0) {
            return this;
        }

        const systemIds = this.systems.map((system) => system.id);

        const { data: reviewPoints, error: reviewPointsError } =
            await this.supabase
                .from("review_points")
                .select(`
              id,
              system_id,
              title,
              description,
              review_instructions,
              mandatory,
              evidence_required,
              display_order
            `)
                .in("system_id", systemIds)
                .order("display_order");

        if (reviewPointsError) {
            throw reviewPointsError;
        }

        const checklistIds = this.systems
            .map((system) => system.checklistId)
            .filter(Boolean);

        let checklistResults: {
            checklist_id: string;
            review_point_id: string;
            status: "OK" | "WARNING";
            comments: string | null;
            evidence_url: string | null;
        }[] = [];

        if (checklistIds.length > 0) {
            const { data, error } = await this.supabase
                .from("checklist_results")
                .select(`
              checklist_id,
              review_point_id,
              status,
              comments,
              evidence_url
            `)
                .in("checklist_id", checklistIds);

            if (error) {
                throw error;
            }

            checklistResults = data ?? [];
        }

        const resultMap = new Map(
            checklistResults.map((result) => [
                `${result.checklist_id}-${result.review_point_id}`,
                result,
            ])
        );

        this.systems = this.systems.map((system) => {
            const systemReviewPoints = (reviewPoints ?? []).filter(
                (reviewPoint) => reviewPoint.system_id === system.id
            );

            const enrichedReviewPoints = systemReviewPoints
                .map((reviewPoint) => {
                    const result = system.checklistId
                        ? resultMap.get(
                            `${system.checklistId}-${reviewPoint.id}`
                        )
                        : undefined;

                    if (!result) {
                        return null;
                    }

                    return {
                        id: reviewPoint.id,
                        displayOrder: reviewPoint.display_order ?? 999,

                        title: reviewPoint.title,
                        description: reviewPoint.description,
                        reviewInstructions: reviewPoint.review_instructions,

                        mandatory: reviewPoint.mandatory,
                        evidenceRequired: reviewPoint.evidence_required,

                        status: result.status,
                        comments: result.comments,
                        evidenceUrl: result.evidence_url,
                    };
                })
                .filter(
                    (
                        reviewPoint
                    ): reviewPoint is NonNullable<typeof reviewPoint> =>
                        reviewPoint !== null
                );

            const okReviewPoints = enrichedReviewPoints.filter(
                (reviewPoint) => reviewPoint.status === "OK"
            ).length;

            const warningReviewPoints = enrichedReviewPoints.filter(
                (reviewPoint) => reviewPoint.status === "WARNING"
            ).length;

            return {
                ...system,

                totalReviewPoints: enrichedReviewPoints.length,
                okReviewPoints,
                warningReviewPoints,

                reviewPoints: enrichedReviewPoints,
            };
        });

        return this;
    }
    /**
     * Calcula los totales globales del informe.
     */
    private calculateSummary(): ReportSummary {

        const totalSystems = this.systems.length;

        const completedSystems =
            this.systems.filter(
                (system) => system.checklistId !== ""
            ).length;

        const pendingSystems =
            totalSystems - completedSystems;

        const okSystems =
            this.systems.filter(
                (system) => system.overallStatus === "OK"
            ).length;

        const warningSystems =
            this.systems.filter(
                (system) => system.overallStatus === "WARNING"
            ).length;

        const totalReviewPoints =
            this.systems.reduce(
                (sum, system) =>
                    sum + system.totalReviewPoints,
                0
            );

        const okReviewPoints =
            this.systems.reduce(
                (sum, system) =>
                    sum + system.okReviewPoints,
                0
            );

        const warningReviewPoints =
            this.systems.reduce(
                (sum, system) =>
                    sum + system.warningReviewPoints,
                0
            );

        const completionPercent =
            totalSystems === 0
                ? 0
                : Math.round(
                    (completedSystems / totalSystems) * 100
                );

        return {

            totalSystems,

            completedSystems,

            pendingSystems,

            okSystems,

            warningSystems,

            totalReviewPoints,

            okReviewPoints,

            warningReviewPoints,

            completionPercent,

        };

    }

    /**
    * Devuelve el estado interno del builder.
    * Solo para depuración durante el desarrollo.
    */
    debug() {
        return {
            client: this.client,
            provider: this.provider,
            operator: this.operator,
            executionDate: this.executionDate,
            systems: this.systems,
        };
    }

    private generateReportId(): string {
        if (!this.client || !this.executionDate) {
            throw new Error(
                "No se puede generar reportId sin cliente y fecha."
            );
        }

        const clientSlug = this.client.name
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toUpperCase()
            .replace(/[^A-Z0-9]+/g, "-")
            .replace(/^-|-$/g, "");

        const date = this.executionDate.replace(/-/g, "");

        return `CHK-${date}-${clientSlug}`;
    }

    /**
     * Construye el objeto final que consumirán
     * PDF, correo, API, etc.
     */
    build(): DailyClientReport {
        if (!this.client) {
            throw new Error(
                "No se puede generar el informe: falta cargar el cliente."
            );
        }

        if (!this.executionDate) {
            throw new Error(
                "No se puede generar el informe: falta la fecha de ejecución."
            );
        }

        return {
            version: "1.0",
            reportId: this.generateReportId(),
            metadata: {
                application: "SAP Checklist",
                version: "1.0",
            },
            client: this.client,
            provider: this.provider,
            operator: this.operator,

            executionDate: this.executionDate,
            generatedAt: new Date().toISOString(),

            summary: this.calculateSummary(),

            systems: this.systems,
        };
    }
}