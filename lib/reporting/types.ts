export type ReportReviewPointStatus =
  | "OK"
  | "WARNING";

export interface ReportMetadata {
  application: string;
  version: string;
}

export interface DailyClientReport {
  version: "1.0";
  reportId: string;
  metadata: ReportMetadata;
  client: ReportClient;
  provider: ReportProvider | null;
  operator: ReportOperator | null;
  executionDate: string;
  generatedAt: string;
  summary: ReportSummary;
  systems: ReportSystem[];
}

export interface ReportClient {
  id: string;
  name: string;
  logoUrl: string | null;
}

export interface ReportProvider {
  id: string;
  name: string;
  logoUrl: string | null;
}

export interface ReportOperator {
  id: string;
  name: string;
}

export interface ReportSummary {
  totalSystems: number;
  completedSystems: number;
  pendingSystems: number;
  okSystems: number;
  warningSystems: number;
  totalReviewPoints: number;
  okReviewPoints: number;
  warningReviewPoints: number;
  completionPercent: number;
}

export interface ReportSystem {
  id: string;
  sid: string | null;
  description: string | null;
  environment: string | null;
  displayOrder: number;
  checklistId: string;
  submittedAt: string | null;
  overallStatus: "OK" | "WARNING";
  totalReviewPoints: number;
  okReviewPoints: number;
  warningReviewPoints: number;
  reviewPoints: ReportReviewPoint[];
}

export interface ReportEvidence {
  id: string;
  storagePath: string;
  displayOrder: number;

  /*
   * Se completa posteriormente en hydrateReportAssets().
   * Puede ser una data URL o una URL utilizable por el renderer.
   */
  imageUrl: string | null;
}

export interface ReportReviewPoint {
  id: string;
  displayOrder: number;
  title: string;
  description: string | null;
  reviewInstructions: string | null;
  mandatory: boolean;
  evidenceRequired: boolean;
  includeEvidenceInEmail: boolean;
  status: ReportReviewPointStatus;
  comments: string | null;

  /*
   * Nuevo modelo multi-evidencia.
   */
  evidences: ReportEvidence[];

  /*
   * Campo legacy. Se mantiene temporalmente para no romper
   * componentes que todavía trabajan con una sola evidencia.
   */
  evidenceUrl: string | null;
}
