import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient, getQueryFn } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, Trash2, Loader2, Image as ImageIcon, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { MediaFolder } from "@shared/schema";

interface MediaItem {
  id: number;
  filename: string;
  objectPath: string;
  folder: string;
  contentType: string | null;
  size: number | null;
  uploadedBy: number | null;
  createdAt: string;
}

interface ImagePickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (objectPath: string) => void;
  defaultFolder?: string;
}

function getImageSrc(path: string) {
  if (path.startsWith("http")) return path;
  return `/objects${path.startsWith("/") ? path : `/${path}`}`;
}

const DEFAULT_FOLDERS = [
  { id: "events", label: "Events" },
  { id: "team", label: "Team" },
  { id: "sermons", label: "Sermons" },
  { id: "pages", label: "Pages" },
  { id: "general", label: "General" },
];

export default function ImagePickerModal({ open, onClose, onSelect, defaultFolder = "general" }: ImagePickerModalProps) {
  const { toast } = useToast();
  const [activeFolder, setActiveFolder] = useState(defaultFolder);
  const [uploading, setUploading] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setActiveFolder(defaultFolder);
      setSelectedId(null);
    }
  }, [open, defaultFolder]);

  // Fetch dynamic folders
  const { data: dynamicFolders = [] } = useQuery<MediaFolder[]>({
    queryKey: ["/api/media/folders"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: open,
  });

  // Merge default + dynamic folders, deduplicate
  const allFolderTabs = (() => {
    const seen = new Set(DEFAULT_FOLDERS.map(f => f.id));
    const merged = [...DEFAULT_FOLDERS];
    for (const df of dynamicFolders) {
      if (!seen.has(df.path)) {
        seen.add(df.path);
        merged.push({ id: df.path, label: df.path.split("/").pop() || df.path });
      }
    }
    return merged;
  })();

  const { data: mediaItems = [], isLoading } = useQuery<MediaItem[]>({
    queryKey: ["/api/media", `?folder=${activeFolder}`],
    enabled: open,
  });

  const allMedia = useQuery<MediaItem[]>({
    queryKey: ["/api/media"],
    enabled: open && activeFolder === "all",
  });

  const items = activeFolder === "all" ? (allMedia.data || []) : mediaItems;
  const loading = activeFolder === "all" ? allMedia.isLoading : isLoading;

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/media/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/media"] });
      toast({ title: "Image deleted" });
    },
  });

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Please select an image file", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", activeFolder === "all" ? "general" : activeFolder);

      const token = localStorage.getItem("lc3_access_token");
      const res = await fetch("/api/media/upload", {
        method: "POST",
        body: formData,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Upload failed");
      }

      const { objectPath } = await res.json();

      queryClient.invalidateQueries({ queryKey: ["/api/media"] });
      toast({ title: "Image uploaded" });

      onSelect(objectPath);
      onClose();
    } catch (err: any) {
      toast({ title: err.message || "Upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleSelect() {
    const item = items.find((m) => m.id === selectedId);
    if (item) {
      onSelect(item.objectPath);
      onClose();
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5" /> Media Library
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2 mb-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleUpload}
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="gap-2"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            Upload New Image
          </Button>
          {selectedId && (
            <Button onClick={handleSelect} variant="default" className="gap-2 ml-auto">
              <Check className="w-4 h-4" /> Use Selected
            </Button>
          )}
        </div>

        <div className="flex gap-1 flex-wrap mb-2">
          <button
            onClick={() => setActiveFolder("all")}
            className={`px-3 py-1.5 rounded-md text-sm transition-colors ${activeFolder === "all" ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"}`}
          >
            All
          </button>
          {allFolderTabs.map(f => (
            <button
              key={f.id}
              onClick={() => setActiveFolder(f.id)}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors ${activeFolder === f.id ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"}`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto mt-2 min-h-[300px]">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <ImageIcon className="w-12 h-12 mb-2 opacity-30" />
              <p>No images in this folder</p>
              <p className="text-sm">Upload one to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                    selectedId === item.id ? "border-blue-500 ring-2 ring-blue-300" : "border-transparent hover:border-gray-300"
                  }`}
                  onClick={() => setSelectedId(item.id)}
                >
                  <img
                    src={getImageSrc(item.objectPath)}
                    alt={item.filename}
                    className="w-full h-28 object-cover"
                    loading="lazy"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1 text-xs text-white truncate">
                    {item.filename}
                  </div>
                  <button
                    className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm("Delete this image?")) {
                        deleteMutation.mutate(item.id);
                        if (selectedId === item.id) setSelectedId(null);
                      }
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                  {selectedId === item.id && (
                    <div className="absolute top-1 left-1 bg-blue-500 text-white rounded-full p-0.5">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
