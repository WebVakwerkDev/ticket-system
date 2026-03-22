import path from "node:path";
import { generateSlug } from "@/lib/utils";
import { buildStoredDocMarkdown, parseStoredDocMarkdown } from "@/lib/docs-markdown";
import {
  deleteRepositoryFile,
  getRepositoryFile,
  getRepositoryFileLastCommitDate,
  listRepositoryFiles,
  parseOwnerRepo,
  upsertRepositoryFile,
} from "@/services/githubService";

export interface DocsRepositoryConfig {
  repoName: string;
  branch: string;
  basePath: string;
}

export interface StoredDocEntry {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
  folderId: string;
}

export interface StoredDocFolder {
  id: string;
  name: string;
  docs: StoredDocEntry[];
}

const GENERAL_ROOT = "general";
const CLIENT_ROOT = "clients";
const GITKEEP_FILE = ".gitkeep";
const DOC_ID_PREFIX = "github-doc:";
const FOLDER_ID_PREFIX = "github-folder:";

export async function getGeneralDocsFromRepository(
  config: DocsRepositoryConfig,
): Promise<StoredDocFolder[]> {
  const { owner, repo } = parseOwnerRepo(config.repoName);
  const rootPath = buildRepositoryPath(config.basePath, GENERAL_ROOT);
  const files = await listRepositoryFiles(owner, repo, config.branch, rootPath);
  const folderMap = new Map<string, StoredDocFolder>();

  for (const file of files) {
    const relativePath = getRelativeRepositoryPath(rootPath, file.path);
    if (!relativePath) {
      continue;
    }

    const folderName = normalizeFolderName(path.posix.dirname(relativePath));
    const folder = getOrCreateFolder(folderMap, folderName);

    if (path.posix.basename(relativePath) === GITKEEP_FILE || !relativePath.endsWith(".md")) {
      continue;
    }

    const storedDoc = await getStoredDocEntry(config, file.path);
    if (!storedDoc) {
      continue;
    }

    folder.docs.push({ ...storedDoc, folderId: folder.id });
  }

  return Array.from(folderMap.values())
    .map((folder) => ({
      ...folder,
      docs: folder.docs.sort((a, b) => {
        const updatedAtDiff = new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        if (updatedAtDiff !== 0) {
          return updatedAtDiff;
        }

        return a.title.localeCompare(b.title, "nl");
      }),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "nl"));
}

export async function createGeneralDocFolderInRepository(
  config: DocsRepositoryConfig,
  folderName: string,
) {
  const { owner, repo } = parseOwnerRepo(config.repoName);
  const normalizedFolderName = normalizeFolderName(folderName);
  const folderPath = buildRepositoryPath(
    config.basePath,
    GENERAL_ROOT,
    normalizedFolderName,
    GITKEEP_FILE,
  );

  await upsertRepositoryFile(
    owner,
    repo,
    config.branch,
    folderPath,
    "",
    `Create docs folder ${normalizedFolderName}`,
  );

  return {
    id: encodeFolderId(normalizedFolderName),
    name: normalizedFolderName,
    docs: [],
  };
}

export async function createGeneralDocInRepository(
  config: DocsRepositoryConfig,
  folderId: string,
  title: string,
  content: string,
) {
  const folderName = decodeFolderId(folderId);
  if (!folderName) {
    throw new Error("Ongeldige folder-id voor GitHub docs.");
  }

  const directoryPath = buildRepositoryPath(config.basePath, GENERAL_ROOT, folderName);
  return createDocInRepository(config, directoryPath, title, content);
}

export async function getClientDocsFromRepository(
  config: DocsRepositoryConfig,
  clientId: string,
): Promise<StoredDocEntry[]> {
  const { owner, repo } = parseOwnerRepo(config.repoName);
  const rootPath = buildRepositoryPath(config.basePath, CLIENT_ROOT, clientId);
  const files = await listRepositoryFiles(owner, repo, config.branch, rootPath);
  const docs: StoredDocEntry[] = [];

  for (const file of files) {
    if (!file.path.endsWith(".md")) {
      continue;
    }

    const storedDoc = await getStoredDocEntry(config, file.path);
    if (!storedDoc) {
      continue;
    }

    docs.push({ ...storedDoc, folderId: encodeFolderId(clientId) });
  }

  return docs.sort((a, b) => {
    const updatedAtDiff = new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    if (updatedAtDiff !== 0) {
      return updatedAtDiff;
    }

    return a.title.localeCompare(b.title, "nl");
  });
}

export async function createClientDocInRepository(
  config: DocsRepositoryConfig,
  clientId: string,
  title: string,
  content: string,
) {
  const directoryPath = buildRepositoryPath(config.basePath, CLIENT_ROOT, clientId);
  return createDocInRepository(config, directoryPath, title, content);
}

export async function updateDocInRepository(
  config: DocsRepositoryConfig,
  docId: string,
  title: string,
  content: string,
) {
  const existingPath = decodeDocId(docId);
  if (!existingPath) {
    throw new Error("Ongeldige document-id voor GitHub docs.");
  }

  const { owner, repo } = parseOwnerRepo(config.repoName);
  const directoryPath = path.posix.dirname(existingPath);
  const nextPath = await buildUniqueDocPath(config, directoryPath, title, existingPath);
  const markdown = buildStoredDocMarkdown(title, content);

  await upsertRepositoryFile(
    owner,
    repo,
    config.branch,
    nextPath,
    markdown,
    `Update doc ${title}`,
  );

  if (nextPath !== existingPath) {
    await deleteRepositoryFile(
      owner,
      repo,
      config.branch,
      existingPath,
      `Delete renamed doc ${path.posix.basename(existingPath)}`,
    );
  }

  return {
    id: encodeDocId(nextPath),
    title,
    content,
    updatedAt: new Date().toISOString(),
    folderId: buildFolderId(config, nextPath),
  };
}

export async function deleteDocFromRepository(config: DocsRepositoryConfig, docId: string) {
  const filePath = decodeDocId(docId);
  if (!filePath) {
    throw new Error("Ongeldige document-id voor GitHub docs.");
  }

  const { owner, repo } = parseOwnerRepo(config.repoName);
  await deleteRepositoryFile(
    owner,
    repo,
    config.branch,
    filePath,
    `Delete doc ${path.posix.basename(filePath)}`,
  );
}

function getOrCreateFolder(map: Map<string, StoredDocFolder>, folderName: string) {
  const existing = map.get(folderName);
  if (existing) {
    return existing;
  }

  const folder = {
    id: encodeFolderId(folderName),
    name: folderName,
    docs: [],
  };
  map.set(folderName, folder);
  return folder;
}

async function createDocInRepository(
  config: DocsRepositoryConfig,
  directoryPath: string,
  title: string,
  content: string,
) {
  const { owner, repo } = parseOwnerRepo(config.repoName);
  const filePath = await buildUniqueDocPath(config, directoryPath, title);
  const markdown = buildStoredDocMarkdown(title, content);

  await upsertRepositoryFile(
    owner,
    repo,
    config.branch,
    filePath,
    markdown,
    `Create doc ${title}`,
  );

  return {
    id: encodeDocId(filePath),
    title,
    content,
    updatedAt: new Date().toISOString(),
    folderId: buildFolderId(config, filePath),
  };
}

async function getStoredDocEntry(
  config: DocsRepositoryConfig,
  filePath: string,
): Promise<StoredDocEntry | null> {
  const { owner, repo } = parseOwnerRepo(config.repoName);
  const [repositoryFile, updatedAt] = await Promise.all([
    getRepositoryFile(owner, repo, config.branch, filePath),
    getRepositoryFileLastCommitDate(owner, repo, config.branch, filePath),
  ]);

  if (!repositoryFile) {
    return null;
  }

  const fallbackTitle = path.posix.basename(filePath, ".md");
  const parsed = parseStoredDocMarkdown(repositoryFile.content, fallbackTitle);

  return {
    id: encodeDocId(filePath),
    title: parsed.title,
    content: parsed.content,
    updatedAt: updatedAt ?? new Date().toISOString(),
    folderId: buildFolderId(config, filePath),
  };
}

async function buildUniqueDocPath(
  config: DocsRepositoryConfig,
  directoryPath: string,
  title: string,
  currentPath?: string,
) {
  const { owner, repo } = parseOwnerRepo(config.repoName);
  const baseSlug = generateSlug(title) || "document";

  for (let attempt = 0; attempt < 100; attempt += 1) {
    const suffix = attempt === 0 ? "" : `-${attempt + 1}`;
    const filePath = path.posix.join(directoryPath, `${baseSlug}${suffix}.md`);

    if (filePath === currentPath) {
      return filePath;
    }

    const existing = await getRepositoryFile(owner, repo, config.branch, filePath);
    if (!existing) {
      return filePath;
    }
  }

  throw new Error("Kon geen unieke bestandsnaam voor document bepalen.");
}

function buildRepositoryPath(...parts: string[]) {
  return parts
    .map((part) => part.replace(/^\/+|\/+$/g, ""))
    .filter(Boolean)
    .join("/");
}

function buildFolderId(config: DocsRepositoryConfig, filePath: string) {
  const generalRoot = buildRepositoryPath(config.basePath, GENERAL_ROOT);
  const clientRoot = buildRepositoryPath(config.basePath, CLIENT_ROOT);
  const directoryPath = path.posix.dirname(filePath);

  if (directoryPath === generalRoot || directoryPath.startsWith(`${generalRoot}/`)) {
    const folderPath = getRelativeRepositoryPath(generalRoot, directoryPath);
    return encodeFolderId(normalizeFolderName(folderPath));
  }

  if (directoryPath === clientRoot || directoryPath.startsWith(`${clientRoot}/`)) {
    const clientPath = getRelativeRepositoryPath(clientRoot, directoryPath);
    const clientId = clientPath.split("/")[0];
    return encodeFolderId(clientId || directoryPath);
  }

  return encodeFolderId(directoryPath);
}

function getRelativeRepositoryPath(rootPath: string, filePath: string) {
  if (filePath === rootPath) {
    return "";
  }

  return filePath.startsWith(`${rootPath}/`)
    ? filePath.slice(rootPath.length + 1)
    : "";
}

function normalizeFolderName(folderName: string) {
  const normalized = folderName.replace(/^\/+|\/+$/g, "").trim();
  return normalized && normalized !== "." ? normalized : "Algemeen";
}

function encodeFolderId(folderName: string) {
  return `${FOLDER_ID_PREFIX}${encodeURIComponent(folderName)}`;
}

function decodeFolderId(folderId: string) {
  if (!folderId.startsWith(FOLDER_ID_PREFIX)) {
    return null;
  }

  return decodeURIComponent(folderId.slice(FOLDER_ID_PREFIX.length));
}

function encodeDocId(filePath: string) {
  return `${DOC_ID_PREFIX}${encodeURIComponent(filePath)}`;
}

function decodeDocId(docId: string) {
  if (!docId.startsWith(DOC_ID_PREFIX)) {
    return null;
  }

  return decodeURIComponent(docId.slice(DOC_ID_PREFIX.length));
}
