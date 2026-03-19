import { z } from "zod";
import {
  ProjectType,
  ProjectStatus,
  ProjectPriority,
} from "@prisma/client";

const optionalTrimmedString = z.preprocess(
  (value) => {
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    return trimmed === "" ? undefined : trimmed;
  },
  z.string().optional(),
);

export const ProjectFormSchema = z.object({
  name: z.string().trim().min(2, "Project name must be at least 2 characters"),
  clientId: z.string().trim().min(1, "Client is required"),
  projectType: z.nativeEnum(ProjectType),
  status: z.nativeEnum(ProjectStatus),
  priority: z.nativeEnum(ProjectPriority),
  description: optionalTrimmedString,
  intakeSummary: optionalTrimmedString,
  scope: optionalTrimmedString,
  techStack: optionalTrimmedString,
  domainName: optionalTrimmedString,
  hostingInfo: optionalTrimmedString,
  startDate: optionalTrimmedString,
  ownerUserId: optionalTrimmedString,
  tags: z.array(z.string().trim().min(1)).default([]),
});

export type ProjectFormData = z.infer<typeof ProjectFormSchema>;
