import { useState, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Upload, Trash2, FolderPlus, ChevronRight, Home, ImageIcon,
  Pencil, AlertTriangle, HardDrive, FolderOpen, X,
} from "lucide-react";
import type { Media, MediaFolder } from "@shared/schema";
import MediaDetailModal from "@/components/media-detail-modal";

function getImageSrc(path: string) {
  if (path.startsWith("http")) return path;
  return `/objects${path.startsWith("/") ? path : `/${path}`}`;
}

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

const HUNDRED_GB = 100 * 1024 * 1024 * 1024;

export default function AdminMediaTab() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  // State
  const [currentFolder, setCurrentFolder] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [detailItem, setDetailItem] = useState<Media | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number }>({ done: 0, total: 0 });
  const [dragOver, setDragOver] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderPath, setNewFolderPath] = useState("");
  const [renameFolderOpen, setRenameFolderOpen] = useState(false);
  const [renameFolderTarget, setRenameFolderTarget] = useState<MediaFolder | null>(null);
  const [renameFolderPath, setRenameFolderPath] = useState("");
  const [deleteFolderOpen, setDeleteFolderOpen] = useState(false);
  const [deleteFolderTarget, setDeleteFolderTarget] = useState<MediaFolder | null>(null);
  const [deleteFolderAction, setDeleteFolderAction] = useState<"move_to_general" | "delete_contents">("move_to_general");

  // Queries
  const { data: allMedia = [] } = useQuery<Media[]>({
    queryKey: ["/api/media"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const { data: folders = [] } = useQuery<MediaFolder[]>({
    queryKey: ["/api/media/folders"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const { data: storageStats } = useQuery<{ totalBytes: number; fileCount: number }>({
    queryKey: ["/api/media/storage-stats"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  // Derived
  const filteredMedia = currentFolder === "all"
    ? allMedia
    : allMedia.filter(m => m.folder === currentFolder || m.folder.startsWith(currentFolder + "/"));

  // Build folder tree
  const folderTree = buildFolderTree(folders);

  // Get unique folder paths from media for items not in any registered folder
  const mediaFolders = [...new Set(allMedia.map(m => m.folder))].sort();

  function getMediaCount(folderPath: string): number {
    return allMedia.filter(m => m.folder === folderPath || m.folder.startsWith(folderPath + "/")).length;
  }

  // Upload handler
  async function handleFiles(files: FileList | File[]) {
    const imageFiles = Array.from(files).filter(f => f.type.startsWith("image/"));
    if (imageFiles.length === 0) {
      toast({ title: "Please select image files", variant: "destructive" });
      return;
    }
    const oversized = imageFiles.filter(f => f.size > 10 * 1024 * 1024);
    if (oversized.length > 0) {
      toast({ title: `${oversized.length} file(s) exceed 10MB limit`, variant: "destructive" });
      return;
    }

    setUploading(true);
    setUploadProgress({ done: 0, total: imageFiles.length });
    const folder = currentFolder === "all" ? "general" : currentFolder;

    for (let i = 0; i < imageFiles.length; i++) {
      try {
        const formData = new FormData();
        formData.append("file", imageFiles[i]);
        formData.append("folder", folder);
        const token = localStorage.getItem("lc3_access_token");
        const res = await fetch("/api/media/upload", {
          method: "POST",
          body: formData,
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error("Upload failed");
      } catch {
        toast({ title: `Failed to upload ${imageFiles[i].name}`, variant: "destructive" });
      }
      setUploadProgress({ done: i + 1, total: imageFiles.length });
    }

    queryClient.invalidateQueries({ queryKey: ["/api/media"] });
    queryClient.invalidateQueries({ queryKey: ["/api/media/storage-stats"] });
    setUploading(false);
    toast({ title: `Uploaded ${imageFiles.length} image(s)` });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // Drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);
  const handleDragLeave = useCallback(() => setDragOver(false), []);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
  }, [currentFolder]);

  // Selection
  function toggleSelect(id: number) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === filteredMedia.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredMedia.map(m => m.id)));
    }
  }

  // Bulk delete
  async function handleBulkDelete() {
    try {
      await apiRequest("POST", "/api/media/bulk-delete", { ids: Array.from(selectedIds) });
      queryClient.invalidateQueries({ queryKey: ["/api/media"] });
      queryClient.invalidateQueries({ queryKey: ["/api/media/storage-stats"] });
      toast({ title: `Deleted ${selectedIds.size} image(s)` });
      setSelectedIds(new Set());
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
    setConfirmDelete(false);
  }

  // Folder CRUD
  async function handleCreateFolder() {
    if (!newFolderPath.trim()) return;
    try {
      await apiRequest("POST", "/api/media/folders", { path: newFolderPath.trim() });
      queryClient.invalidateQueries({ queryKey: ["/api/media/folders"] });
      toast({ title: "Folder created" });
      setNewFolderOpen(false);
      setNewFolderPath("");
    } catch (err: any) {
      const msg = err?.message || "Failed to create folder";
      toast({ title: msg, variant: "destructive" });
    }
  }

  async function handleRenameFolder() {
    if (!renameFolderTarget || !renameFolderPath.trim()) return;
    try {
      await apiRequest("PUT", `/api/media/folders/${renameFolderTarget.id}`, { path: renameFolderPath.trim() });
      queryClient.invalidateQueries({ queryKey: ["/api/media/folders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/media"] });
      toast({ title: "Folder renamed" });
      setRenameFolderOpen(false);
      if (currentFolder === renameFolderTarget.path) setCurrentFolder(renameFolderPath.trim());
    } catch (err: any) {
      toast({ title: err?.message || "Failed to rename folder", variant: "destructive" });
    }
  }

  async function handleDeleteFolder() {
    if (!deleteFolderTarget) return;
    try {
      await apiRequest("DELETE", `/api/media/folders/${deleteFolderTarget.id}?action=${deleteFolderAction}`);
      queryClient.invalidateQueries({ queryKey: ["/api/media/folders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/media"] });
      queryClient.invalidateQueries({ queryKey: ["/api/media/storage-stats"] });
      toast({ title: "Folder deleted" });
      setDeleteFolderOpen(false);
      if (currentFolder === deleteFolderTarget.path) setCurrentFolder("all");
    } catch {
      toast({ title: "Failed to delete folder", variant: "destructive" });
    }
  }

  // Breadcrumbs
  const breadcrumbs = currentFolder === "all" ? [] : currentFolder.split("/");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="text-2xl font-bold">Media Library</h2>
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant="outline" onClick={() => setNewFolderOpen(true)}>
            <FolderPlus className="w-4 h-4 mr-1" /> New Folder
          </Button>
          <Button size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            <Upload className="w-4 h-4 mr-1" /> Upload
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={e => e.target.files && handleFiles(e.target.files)}
          />
        </div>
      </div>

      {/* Storage stats */}
      {storageStats && (
        <Card>
          <CardContent className="py-3 px-4">
            <div className="flex items-center gap-3">
              <HardDrive className="w-4 h-4 text-muted-foreground" />
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span>{formatBytes(storageStats.totalBytes)} used ({storageStats.fileCount} files)</span>
                  <span className="text-muted-foreground">100 GB limit</span>
                </div>
                <Progress value={(storageStats.totalBytes / HUNDRED_GB) * 100} className="h-2" />
              </div>
              {storageStats.totalBytes >= HUNDRED_GB && (
                <div className="flex items-center gap-1 text-amber-600 text-sm">
                  <AlertTriangle className="w-4 h-4" /> Storage limit reached
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-4">
        {/* Folder sidebar */}
        <div className="w-56 shrink-0 space-y-1">
          <button
            onClick={() => { setCurrentFolder("all"); setSelectedIds(new Set()); }}
            className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-2 ${currentFolder === "all" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
          >
            <Home className="w-4 h-4" /> All Media
            <span className="ml-auto text-xs opacity-70">{allMedia.length}</span>
          </button>

          {/* Default folder: general (always show) */}
          <FolderButton
            path="general"
            label="general"
            depth={0}
            count={getMediaCount("general")}
            active={currentFolder === "general"}
            onClick={() => { setCurrentFolder("general"); setSelectedIds(new Set()); }}
            onRename={() => {}}
            onDelete={() => {}}
            isDefault
          />

          {/* Registered folders */}
          {folderTree.map(node => (
            <FolderTreeNode
              key={node.folder.id}
              node={node}
              currentFolder={currentFolder}
              getMediaCount={getMediaCount}
              onSelect={path => { setCurrentFolder(path); setSelectedIds(new Set()); }}
              onRename={f => { setRenameFolderTarget(f); setRenameFolderPath(f.path); setRenameFolderOpen(true); }}
              onDelete={f => { setDeleteFolderTarget(f); setDeleteFolderOpen(true); }}
            />
          ))}

          {/* Unregistered folders from media (ones not in media_folders table) */}
          {mediaFolders
            .filter(mf => mf !== "general" && !folders.some(f => f.path === mf))
            .map(mf => (
              <FolderButton
                key={mf}
                path={mf}
                label={mf}
                depth={0}
                count={getMediaCount(mf)}
                active={currentFolder === mf}
                onClick={() => { setCurrentFolder(mf); setSelectedIds(new Set()); }}
                onRename={() => {}}
                onDelete={() => {}}
                isDefault
              />
            ))}
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Breadcrumbs */}
          {breadcrumbs.length > 0 && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
              <button onClick={() => setCurrentFolder("all")} className="hover:text-foreground">All</button>
              {breadcrumbs.map((part, i) => {
                const path = breadcrumbs.slice(0, i + 1).join("/");
                return (
                  <span key={i} className="flex items-center gap-1">
                    <ChevronRight className="w-3 h-3" />
                    <button onClick={() => setCurrentFolder(path)} className="hover:text-foreground">{part}</button>
                  </span>
                );
              })}
            </div>
          )}

          {/* Toolbar */}
          {filteredMedia.length > 0 && (
            <div className="flex items-center gap-3 mb-3">
              <Checkbox
                checked={selectedIds.size === filteredMedia.length && filteredMedia.length > 0}
                onCheckedChange={toggleSelectAll}
              />
              <span className="text-sm text-muted-foreground">
                {selectedIds.size > 0 ? `${selectedIds.size} selected` : `${filteredMedia.length} images`}
              </span>
              {selectedIds.size > 0 && (
                <Button size="sm" variant="destructive" onClick={() => setConfirmDelete(true)}>
                  <Trash2 className="w-4 h-4 mr-1" /> Delete Selected
                </Button>
              )}
            </div>
          )}

          {/* Upload progress */}
          {uploading && (
            <div className="mb-3">
              <div className="text-sm mb-1">Uploading {uploadProgress.done}/{uploadProgress.total}...</div>
              <Progress value={(uploadProgress.done / uploadProgress.total) * 100} className="h-2" />
            </div>
          )}

          {/* Drop zone / grid */}
          <div
            ref={dropRef}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`min-h-[300px] rounded-lg border-2 border-dashed transition-colors ${
              dragOver ? "border-primary bg-primary/5" : "border-transparent"
            }`}
          >
            {filteredMedia.length === 0 && !uploading ? (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <ImageIcon className="w-12 h-12 mb-2 opacity-40" />
                <p>No images in this folder</p>
                <p className="text-sm">Drag & drop images here or click Upload</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {filteredMedia.map(item => (
                  <div
                    key={item.id}
                    className={`group relative rounded-lg overflow-hidden border cursor-pointer transition-all ${
                      selectedIds.has(item.id) ? "ring-2 ring-primary border-primary" : "hover:border-primary/50"
                    }`}
                  >
                    <div className="absolute top-2 left-2 z-10">
                      <Checkbox
                        checked={selectedIds.has(item.id)}
                        onCheckedChange={() => toggleSelect(item.id)}
                        className="bg-white/80 backdrop-blur-sm"
                        onClick={e => e.stopPropagation()}
                      />
                    </div>
                    <div
                      className="aspect-square bg-muted"
                      onClick={() => { setDetailItem(item); setDetailOpen(true); }}
                    >
                      <img
                        src={getImageSrc(item.objectPath)}
                        alt={item.filename}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <div className="p-2">
                      <p className="text-xs font-medium truncate">{item.filename}</p>
                      <p className="text-xs text-muted-foreground">{formatBytes(item.size || 0)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail modal */}
      <MediaDetailModal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        item={detailItem}
        folders={folders}
        onDeleted={() => {
          queryClient.invalidateQueries({ queryKey: ["/api/media/storage-stats"] });
        }}
      />

      {/* Confirm bulk delete */}
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.size} image(s)?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the selected images from storage. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* New folder dialog */}
      <Dialog open={newFolderOpen} onOpenChange={setNewFolderOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Folder</DialogTitle></DialogHeader>
          <div>
            <p className="text-sm text-muted-foreground mb-2">Use forward slashes for nested folders, e.g. <code>events/2026/easter</code></p>
            <Input
              value={newFolderPath}
              onChange={e => setNewFolderPath(e.target.value)}
              placeholder="folder/path"
              autoFocus
              onKeyDown={e => e.key === "Enter" && handleCreateFolder()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewFolderOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateFolder} disabled={!newFolderPath.trim()}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename folder dialog */}
      <Dialog open={renameFolderOpen} onOpenChange={setRenameFolderOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Rename Folder</DialogTitle></DialogHeader>
          <Input
            value={renameFolderPath}
            onChange={e => setRenameFolderPath(e.target.value)}
            autoFocus
            onKeyDown={e => e.key === "Enter" && handleRenameFolder()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameFolderOpen(false)}>Cancel</Button>
            <Button onClick={handleRenameFolder} disabled={!renameFolderPath.trim()}>Rename</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete folder dialog */}
      <AlertDialog open={deleteFolderOpen} onOpenChange={setDeleteFolderOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete folder "{deleteFolderTarget?.path}"?</AlertDialogTitle>
            <AlertDialogDescription>
              What should happen to images in this folder?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 my-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={deleteFolderAction === "move_to_general"}
                onChange={() => setDeleteFolderAction("move_to_general")}
              />
              <span className="text-sm">Move images to "general" folder</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={deleteFolderAction === "delete_contents"}
                onChange={() => setDeleteFolderAction("delete_contents")}
              />
              <span className="text-sm text-destructive">Delete all images in this folder</span>
            </label>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteFolder} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Folder
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ==================== Folder tree helpers ====================

interface FolderNode {
  folder: MediaFolder;
  children: FolderNode[];
}

function buildFolderTree(folders: MediaFolder[]): FolderNode[] {
  const nodes: FolderNode[] = [];
  const sorted = [...folders].sort((a, b) => a.path.localeCompare(b.path));

  for (const folder of sorted) {
    if (folder.path === "general") continue; // shown separately
    const parts = folder.path.split("/");
    if (parts.length === 1) {
      nodes.push({ folder, children: [] });
    } else {
      // Find parent
      const parentPath = parts.slice(0, -1).join("/");
      const parent = findNode(nodes, parentPath);
      if (parent) {
        parent.children.push({ folder, children: [] });
      } else {
        nodes.push({ folder, children: [] });
      }
    }
  }
  return nodes;
}

function findNode(nodes: FolderNode[], path: string): FolderNode | undefined {
  for (const node of nodes) {
    if (node.folder.path === path) return node;
    const found = findNode(node.children, path);
    if (found) return found;
  }
  return undefined;
}

interface FolderTreeNodeProps {
  node: FolderNode;
  currentFolder: string;
  getMediaCount: (path: string) => number;
  onSelect: (path: string) => void;
  onRename: (folder: MediaFolder) => void;
  onDelete: (folder: MediaFolder) => void;
  depth?: number;
}

function FolderTreeNode({ node, currentFolder, getMediaCount, onSelect, onRename, onDelete, depth = 0 }: FolderTreeNodeProps) {
  const label = node.folder.path.split("/").pop() || node.folder.path;
  return (
    <>
      <FolderButton
        path={node.folder.path}
        label={label}
        depth={depth}
        count={getMediaCount(node.folder.path)}
        active={currentFolder === node.folder.path}
        onClick={() => onSelect(node.folder.path)}
        onRename={() => onRename(node.folder)}
        onDelete={() => onDelete(node.folder)}
      />
      {node.children.map(child => (
        <FolderTreeNode
          key={child.folder.id}
          node={child}
          currentFolder={currentFolder}
          getMediaCount={getMediaCount}
          onSelect={onSelect}
          onRename={onRename}
          onDelete={onDelete}
          depth={depth + 1}
        />
      ))}
    </>
  );
}

interface FolderButtonProps {
  path: string;
  label: string;
  depth: number;
  count: number;
  active: boolean;
  onClick: () => void;
  onRename: () => void;
  onDelete: () => void;
  isDefault?: boolean;
}

function FolderButton({ path, label, depth, count, active, onClick, onRename, onDelete, isDefault }: FolderButtonProps) {
  return (
    <div className="group relative">
      <button
        onClick={onClick}
        className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-2 ${
          active ? "bg-primary text-primary-foreground" : "hover:bg-muted"
        }`}
        style={{ paddingLeft: `${12 + depth * 16}px` }}
      >
        <FolderOpen className="w-4 h-4 shrink-0" />
        <span className="truncate">{label}</span>
        <span className="ml-auto text-xs opacity-70">{count}</span>
      </button>
      {!isDefault && (
        <div className={`absolute right-1 top-1/2 -translate-y-1/2 hidden group-hover:flex gap-0.5 ${active ? "" : ""}`}>
          <button
            onClick={e => { e.stopPropagation(); onRename(); }}
            className="p-1 rounded hover:bg-muted/80"
            title="Rename"
          >
            <Pencil className="w-3 h-3" />
          </button>
          <button
            onClick={e => { e.stopPropagation(); onDelete(); }}
            className="p-1 rounded hover:bg-destructive/20 text-destructive"
            title="Delete"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}
