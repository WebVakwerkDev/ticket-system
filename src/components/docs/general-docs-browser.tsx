"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Copy, FileText, FilePlus2, Save, Trash2 } from "lucide-react";
import { createDocEntry, deleteDocEntry, updateDocEntry } from "@/actions/docs";
import { renderMarkdown } from "@/lib/markdown";

interface DocEntry {
  id: string;
  title: string;
  content: string;
  updatedAt: Date | string;
}

interface DocFolder {
  id: string;
  name: string;
  docs: DocEntry[];
}

interface Props {
  folders: DocFolder[];
  content: {
    title: string;
    description: string;
    emptyFolders: string;
    emptyFolderDocs: string;
    newDocumentPrefix: string;
    newDocumentTitlePlaceholder: string;
    newDocumentContentPlaceholder: string;
    addDocumentButton: string;
    emptyPreview: string;
    cancelButton: string;
    saveButton: string;
    editButton: string;
    copyButton: string;
    copiedButton: string;
    deleteConfirm: string;
  };
}

export function GeneralDocsBrowser({ folders, content }: Props) {
  const router = useRouter();
  const { data: session } = useSession();
  const [isPending, startTransition] = useTransition();
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(folders[0]?.id ?? null);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(folders[0]?.docs[0]?.id ?? null);
  const [newDocTitle, setNewDocTitle] = useState("");
  const [newDocContent, setNewDocContent] = useState("");
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingContent, setEditingContent] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!folders.length) {
      setSelectedFolderId(null);
      setSelectedDocId(null);
      return;
    }

    const folderExists = folders.some((folder) => folder.id === selectedFolderId);
    const nextFolderId = folderExists ? selectedFolderId : folders[0].id;
    setSelectedFolderId(nextFolderId);

    const nextFolder = folders.find((folder) => folder.id === nextFolderId) ?? folders[0];
    const docExists = nextFolder.docs.some((doc) => doc.id === selectedDocId);
    setSelectedDocId(docExists ? selectedDocId : nextFolder.docs[0]?.id ?? null);
  }, [folders, selectedFolderId, selectedDocId]);

  function refresh() {
    startTransition(() => {
      router.refresh();
    });
  }

  const selectedFolder = useMemo(
    () => folders.find((folder) => folder.id === selectedFolderId) ?? folders[0] ?? null,
    [folders, selectedFolderId],
  );

  const selectedDoc = useMemo(
    () => selectedFolder?.docs.find((doc) => doc.id === selectedDocId) ?? selectedFolder?.docs[0] ?? null,
    [selectedDocId, selectedFolder],
  );

  useEffect(() => {
    if (selectedDoc && editingDocId !== selectedDoc.id) {
      setEditingDocId(null);
    }
  }, [selectedDoc, editingDocId]);

  async function handleCreateDoc(e: React.FormEvent) {
    e.preventDefault();
    if (!session?.user?.id || !selectedFolder || !newDocTitle.trim() || !newDocContent.trim()) return;

    const result = await createDocEntry({
      folderId: selectedFolder.id,
      title: newDocTitle.trim(),
      content: newDocContent.trim(),
      actorUserId: session.user.id,
    });

    if (result.success && result.entry) {
      setNewDocTitle("");
      setNewDocContent("");
      setSelectedDocId(result.entry.id);
      refresh();
    }
  }

  function startEditing() {
    if (!selectedDoc) return;
    setEditingDocId(selectedDoc.id);
    setEditingTitle(selectedDoc.title);
    setEditingContent(selectedDoc.content);
  }

  async function saveDoc() {
    if (!session?.user?.id || !editingDocId) return;

    const result = await updateDocEntry({
      id: editingDocId,
      title: editingTitle.trim(),
      content: editingContent.trim(),
      actorUserId: session.user.id,
    });

    if (result.success) {
      setEditingDocId(null);
      refresh();
    }
  }

  async function removeDoc() {
    if (!session?.user?.id || !selectedDoc) return;
    if (!confirm(content.deleteConfirm)) return;

    const result = await deleteDocEntry(selectedDoc.id, session.user.id);
    if (result.success) {
      setSelectedDocId(null);
      setEditingDocId(null);
      refresh();
    }
  }

  async function copyDoc() {
    if (!selectedDoc) return;
    await navigator.clipboard.writeText(selectedDoc.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="space-y-5">
      <div className="card p-5">
        <h2 className="text-base font-semibold text-gray-900">{content.title}</h2>
        <p className="mt-1 text-sm text-gray-500">{content.description}</p>
      </div>

      <div className="grid grid-cols-[320px_minmax(0,1fr)] gap-6">
        <aside className="card p-4">
          <div className="space-y-4">
            {folders.length > 0 ? (
              folders.map((folder) => (
                <div key={folder.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFolderId(folder.id);
                      setSelectedDocId(folder.docs[0]?.id ?? null);
                    }}
                    className={`w-full rounded-lg px-3 py-2 text-left text-sm font-semibold ${
                      selectedFolder?.id === folder.id
                        ? "bg-gray-900 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {folder.name}
                  </button>

                  <div className="mt-2 space-y-1 pl-2">
                    {folder.docs.length > 0 ? (
                      folder.docs.map((doc) => (
                        <button
                          key={doc.id}
                          type="button"
                          onClick={() => {
                            setSelectedFolderId(folder.id);
                            setSelectedDocId(doc.id);
                          }}
                          className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm ${
                            selectedDoc?.id === doc.id
                              ? "bg-blue-50 text-blue-700"
                              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                          }`}
                        >
                          <FileText className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{doc.title}</span>
                        </button>
                      ))
                    ) : (
                      <p className="px-3 py-2 text-sm text-gray-400">{content.emptyFolderDocs}</p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400">{content.emptyFolders}</p>
            )}
          </div>
        </aside>

        <div className="space-y-5">
          {selectedFolder && (
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-gray-900">
                {content.newDocumentPrefix} {selectedFolder.name}
              </h3>
              <form onSubmit={handleCreateDoc} className="mt-4 space-y-3">
                <input
                  type="text"
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  className="form-input"
                  placeholder={content.newDocumentTitlePlaceholder}
                />
                <textarea
                  value={newDocContent}
                  onChange={(e) => setNewDocContent(e.target.value)}
                  className="form-textarea"
                  rows={5}
                  placeholder={content.newDocumentContentPlaceholder}
                />
                <div className="flex justify-end">
                  <button type="submit" className="btn-primary" disabled={isPending}>
                    <FilePlus2 className="h-4 w-4" />
                    {content.addDocumentButton}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="card min-h-[520px] p-6">
            {selectedDoc ? (
              editingDocId === selectedDoc.id ? (
                <div className="space-y-4">
                  <input
                    type="text"
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    className="form-input"
                  />
                  <textarea
                    value={editingContent}
                    onChange={(e) => setEditingContent(e.target.value)}
                    className="form-textarea"
                    rows={18}
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button type="button" className="btn-secondary" onClick={() => setEditingDocId(null)}>
                      {content.cancelButton}
                    </button>
                    <button type="button" className="btn-primary" onClick={saveDoc}>
                      <Save className="h-4 w-4" />
                      {content.saveButton}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-4">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-400">
                        {selectedFolder?.name}
                      </p>
                      <h3 className="mt-1 text-xl font-semibold text-gray-900">{selectedDoc.title}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" className="btn-secondary" onClick={startEditing}>
                        {content.editButton}
                      </button>
                      <button type="button" className="btn-secondary" onClick={copyDoc}>
                        <Copy className="h-4 w-4" />
                        {copied ? content.copiedButton : content.copyButton}
                      </button>
                      <button type="button" className="text-gray-400 hover:text-red-600" onClick={removeDoc}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div
                    className="prose prose-sm max-w-none text-gray-700 prose-headings:text-gray-900 prose-p:leading-7 prose-pre:overflow-x-auto prose-pre:rounded-lg prose-pre:bg-gray-950 prose-pre:p-4 prose-pre:text-gray-100"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(selectedDoc.content) }}
                  />
                </div>
              )
            ) : (
              <div className="flex h-full min-h-[420px] items-center justify-center text-sm text-gray-400">
                {content.emptyPreview}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
