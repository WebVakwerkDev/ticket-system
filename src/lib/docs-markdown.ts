export function parseStoredDocMarkdown(raw: string, fallbackTitle: string) {
  if (!raw.startsWith("---\n")) {
    return {
      title: fallbackTitle,
      content: raw.trim(),
    };
  }

  const endIndex = raw.indexOf("\n---\n", 4);
  if (endIndex === -1) {
    return {
      title: fallbackTitle,
      content: raw.trim(),
    };
  }

  const frontmatter = raw.slice(4, endIndex).trim();
  const content = raw.slice(endIndex + 5).trim();
  const titleLine = frontmatter
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.startsWith("title:"));

  return {
    title: titleLine ? titleLine.slice("title:".length).trim() || fallbackTitle : fallbackTitle,
    content,
  };
}

export function buildStoredDocMarkdown(title: string, content: string) {
  const normalizedTitle = title.replace(/\r?\n/g, " ").trim();
  const normalizedContent = content.trim();

  return `---\ntitle: ${normalizedTitle}\n---\n\n${normalizedContent}\n`;
}
