import { z } from "zod";
import {
  ProjectType,
  ProjectStatus,
  ProjectPriority,
  CommunicationType,
  ChangeRequestSource,
  ChangeRequestStatus,
  ChangeRequestImpact,
} from "@prisma/client";
import { optionalTrimmedString } from "@/lib/validations/shared";

// ─── Client (inline or by reference) ─────────────────────────────────────────

const ApiClientSchema = z.object({
  companyName: z.string().trim().min(2, "Company name must be at least 2 characters"),
  contactName: z.string().trim().min(2, "Contact name must be at least 2 characters"),
  email: z.string().trim().email("Invalid email address"),
  phone: optionalTrimmedString,
  address: optionalTrimmedString,
  notes: optionalTrimmedString,
  invoiceDetails: optionalTrimmedString,
});

// ─── Project ──────────────────────────────────────────────────────────────────

const ApiProjectSchema = z.object({
  name: z.string().trim().min(2, "Project name must be at least 2 characters"),
  projectType: z.nativeEnum(ProjectType).default(ProjectType.OTHER),
  status: z.nativeEnum(ProjectStatus).default(ProjectStatus.INTAKE),
  priority: z.nativeEnum(ProjectPriority).default(ProjectPriority.MEDIUM),
  description: optionalTrimmedString,
  intakeSummary: optionalTrimmedString,
  scope: optionalTrimmedString,
  techStack: optionalTrimmedString,
  domainName: optionalTrimmedString,
  hostingInfo: optionalTrimmedString,
  startDate: z.string().trim().datetime({ offset: true }).or(z.string().trim().date()).optional(),
  ownerUserId: optionalTrimmedString,
  tags: z.array(z.string().trim().min(1)).default([]),
});

// ─── Initial communication ────────────────────────────────────────────────────

const ApiCommunicationSchema = z.object({
  type: z.nativeEnum(CommunicationType).default(CommunicationType.OTHER),
  subject: z.string().trim().min(1, "Subject is required"),
  content: z.string().trim().min(1, "Content is required"),
  externalSenderName: optionalTrimmedString,
  externalSenderEmail: optionalTrimmedString.pipe(z.string().email().optional()),
  occurredAt: z.string().trim().datetime({ offset: true }).optional(),
});

// ─── Initial change request ──────────────────────────────────────────────────

const ApiChangeRequestSchema = z.object({
  title: z.string().trim().min(2, "Title must be at least 2 characters"),
  description: z.string().trim().min(1, "Description is required"),
  sourceType: z.nativeEnum(ChangeRequestSource).default(ChangeRequestSource.INTERNAL),
  status: z.nativeEnum(ChangeRequestStatus).default(ChangeRequestStatus.NEW),
  impact: z.nativeEnum(ChangeRequestImpact).default(ChangeRequestImpact.MEDIUM),
});

// ─── Source tracking ──────────────────────────────────────────────────────────

const ApiSourceSchema = z.object({
  type: z.string().trim().min(1),
  label: optionalTrimmedString,
});

// ─── Top-level request body ───────────────────────────────────────────────────

export const ProjectCreateApiSchema = z
  .object({
    clientId: z.string().optional(),
    client: ApiClientSchema.optional(),
    project: ApiProjectSchema,
    initialCommunication: ApiCommunicationSchema.optional(),
    initialChangeRequest: ApiChangeRequestSchema.optional(),
    source: ApiSourceSchema.optional(),
  })
  .refine(
    (data) => data.clientId || data.client,
    { message: "Either clientId or client object is required", path: ["client"] },
  );

export type ProjectCreateApiInput = z.infer<typeof ProjectCreateApiSchema>;
