export type ReportStatus = "OK" | "WARNING";

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

  overallStatus: ReportStatus;

  totalReviewPoints: number;
  okReviewPoints: number;
  warningReviewPoints: number;

  reviewPoints: ReportReviewPoint[];
}

export interface ReportReviewPoint {
  id: string;

  displayOrder: number;

  title: string;
  description: string | null;
  reviewInstructions: string | null;

  mandatory: boolean;
  evidenceRequired: boolean;

  status: ReportStatus;

  comments: string | null;

  evidenceUrl: string | null;
}