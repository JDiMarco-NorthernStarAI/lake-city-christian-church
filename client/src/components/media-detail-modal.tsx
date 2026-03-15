import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Copy, Pencil, Trash2, Crop, FolderInput } from "lucide-react";
import type { Media, MediaFolder } from "@shared/schema";
import MediaCropModal from "./media-crop-modal";

function getImageSrc(path: string) {
  if (path.startsWith("http")) return path;
  return `/objects${path.startsWith("/") ? path : `/${path}`}`;
}

function formatBytes(bytes: number | null | undefined) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface MediaDetailModalProps {
  open: boolean;
  onClose: () => void;
  item: Media | null;
  folders: MediaFolder[];
  onDeleted?: () => void;
}

export default function MediaDetailModal({ open, onClose, item, folders, onDeleted }: MediaDetailModalProps) {
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [newFilename, setNewFilename] = useState("");
  const [moving, setMoving] = useState(false);
  const [newFolder, setNewFolder] = useState("");
  const [cropOpen, setCropOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!item) return null;

  const imageUrl = getImageSrc(item.objectPath);
  const fullUrl = `${window.location.origin}${imageUrl}`;

  async function handleCopyUrl() {
    await navigator.clipboard.writeText(fullUrl);
    toast({ title: "URL copied to clipboard" });
  }

  async function handleRename() {
    if (!newFilename.trim()) return;
    try {
      await apiRequest("PUT", `/api/media/${item!.id}`, { filename: newFilename.trim() });
      queryClient.invalidateQueries({ queryKey: ["/api/media"] });
      toast({ title: "File renamed" });
      setEditing(false);
    } catch {
      toast({ title: "Failed to rename", variant: "destructive" });
    }
  }

  async function handleMove() {
    if (!newFolder) return;
    try {
      await apiRequest("PUT", `/api/media/${item!.id}`, { folder: newFolder });
      queryClient.invalidateQueries({ queryKey: ["/api/media"] });
      toast({ title: "Moved to " + newFolder });
      setMoving(false);
    } catch {
      toast({ title: "Failed to move", variant: "destructive" });
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await apiRequest("DELETE", `/api/media/${item!.id}`);
      queryClient.invalidateQueries({ queryKey: ["/api/media"] });
      toast({ title: "Image deleted" });
      onDeleted?.();
      onClose();
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <Dialog open={open && !cropOpen} onOpenChange={v => !v && onClose()}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="truncate">{item.filename}</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-auto min-h-0 flex items-center justify-center bg-muted/30 rounded-md p-2">
            <img
              src={imageUrl}
              alt={item.filename}
              className="max-h-[50vh] max-w-full object-contain rounded"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground mt-2">
            <div><span className="font-medium text-foreground">Folder:</span> {item.folder}</div>
            <div><span className="font-medium text-foreground">Size:</span> {formatBytes(item.size)}</div>
            <div><span className="font-medium text-foreground">Type:</span> {item.contentType || "—"}</div>
            <div><span className="font-medium text-foreground">Uploaded:</span> {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "—"}</div>
          </div>

          {editing ? (
            <div className="flex gap-2 items-end mt-2">
              <div className="flex-1">
                <Label className="text-xs">New filename</Label>
                <Input value={newFilename} onChange={e => setNewFilename(e.target.value)} autoFocus onKeyDown={e => e.key === "Enter" && handleRename()} />
              </div>
              <Button size="sm" onClick={handleRename}>Save</Button>
              <Button size="sm" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
            </div>
          ) : moving ? (
            <div className="flex gap-2 items-end mt-2">
              <div className="flex-1">
                <Label className="text-xs">Move to folder</Label>
                <Select value={newFolder} onValueChange={setNewFolder}>
                  <SelectTrigger><SelectValue placeholder="Select folder" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">general</SelectItem>
                    {folders.map(f => (
                      <SelectItem key={f.id} value={f.path}>{f.path}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button size="sm" onClick={handleMove} disabled={!newFolder}>Move</Button>
              <Button size="sm" variant="outline" onClick={() => setMoving(false)}>Cancel</Button>
            </div>
          ) : (
            <DialogFooter className="flex-wrap gap-2 mt-2">
              <Button variant="outline" size="sm" onClick={handleCopyUrl}><Copy className="w-4 h-4 mr-1" /> Copy URL</Button>
              <Button variant="outline" size="sm" onClick={() => { setNewFilename(item.filename); setEditing(true); }}><Pencil className="w-4 h-4 mr-1" /> Rename</Button>
              <Button variant="outline" size="sm" onClick={() => { setNewFolder(item.folder); setMoving(true); }}><FolderInput className="w-4 h-4 mr-1" /> Move</Button>
              <Button variant="outline" size="sm" onClick={() => setCropOpen(true)}><Crop className="w-4 h-4 mr-1" /> Crop/Resize</Button>
              <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting}><Trash2 className="w-4 h-4 mr-1" /> {deleting ? "Deleting..." : "Delete"}</Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {cropOpen && (
        <MediaCropModal
          open={cropOpen}
          onClose={() => setCropOpen(false)}
          imageSrc={imageUrl}
          filename={item.filename}
          folder={item.folder}
          onCropped={() => {
            queryClient.invalidateQueries({ queryKey: ["/api/media"] });
          }}
        />
      )}
    </>
  );
}
