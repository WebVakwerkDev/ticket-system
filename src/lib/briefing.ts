type BriefingProject = {
  name: string;
  status: string;
  techStack: string | null;
  domainName: string | null;
  hostingInfo: string | null;
  client: { companyName: string };
  repositories: Array<{ repoUrl: string; defaultBranch: string; issueBoardUrl: string | null }>;
};

type BriefingChangeRequest = {
  title: string;
  description: string;
  impact: string;
  sourceType: string;
};

export function buildDeveloperBriefing(
  project: BriefingProject,
  changeRequest: BriefingChangeRequest | null,
): string {
  const primaryRepo = project.repositories[0] ?? null;

  let acceptanceCriteria =
    "- [ ] Feature implemented as described\n- [ ] No regressions introduced\n- [ ] Code is clean and documented";
  if (changeRequest) {
    const descLines = changeRequest.description
      .split(/[.!?]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 10)
      .slice(0, 5);
    if (descLines.length > 0) {
      acceptanceCriteria = descLines.map((line) => `- [ ] ${line}`).join("\n");
    }
  }

  let risks = "- [ ] Unexpected side effects\n- [ ] Performance regression";
  if (changeRequest) {
    if (changeRequest.impact === "LARGE") {
      risks =
        "- Breaking changes may affect other parts of the codebase\n- Performance impact under load needs validation\n- Client-facing functionality requires thorough QA";
    } else if (changeRequest.impact === "MEDIUM") {
      risks =
        "- Adjacent features may be affected\n- Requires cross-browser testing\n- Regression testing recommended";
    } else {
      risks =
        "- Minimal risk expected\n- Verify no unintended side effects\n- Test on mobile devices";
    }
  }

  let techNotes = "Follow project coding standards and conventions.";
  if (project.techStack) {
    const stack = project.techStack.toLowerCase();
    const notes: string[] = [];
    if (stack.includes("next") || stack.includes("react")) {
      notes.push("Use React Server Components where possible.");
      notes.push("Ensure proper client/server boundary separation.");
    }
    if (stack.includes("prisma")) {
      notes.push("Run Prisma migrations if schema changes are required.");
    }
    if (stack.includes("typescript") || stack.includes("ts")) {
      notes.push("Maintain strict TypeScript types — no `any`.");
    }
    if (stack.includes("tailwind")) {
      notes.push("Use Tailwind utility classes; avoid custom CSS unless necessary.");
    }
    if (notes.length > 0) {
      techNotes = notes.join("\n");
    }
  }

  return `# Developer Briefing

## Project Context
- **Project**: ${project.name}
- **Client**: ${project.client.companyName}
- **Status**: ${project.status}
- **Tech Stack**: ${project.techStack ?? "Not specified"}
- **Domain**: ${project.domainName ?? "Not specified"}
- **Hosting**: ${project.hostingInfo ?? "Not specified"}
- **Repository**: ${primaryRepo?.repoUrl ?? "No repository linked"}
- **Default Branch**: ${primaryRepo?.defaultBranch ?? "Not specified"}

${
  changeRequest
    ? `## Change Request
- **Title**: ${changeRequest.title}
- **Description**: ${changeRequest.description}
- **Impact**: ${changeRequest.impact}
- **Source**: ${changeRequest.sourceType}

## Requested Change
${changeRequest.description}`
    : "## Requested Change\n_No specific change request linked. Refer to project scope and description._"
}

## Acceptance Criteria
${acceptanceCriteria}

## Technical Notes
${techNotes}

## Risks
${risks}

## Review Checklist
- [ ] Code reviewed
- [ ] Tested on mobile
- [ ] Cross-browser tested
- [ ] Client approved
`;
}
