import { useState, useRef, useCallback } from "react";
import ReactCrop, { type Crop, type PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

interface MediaCropModalProps {
  open: boolean;
  onClose: () => void;
  imageSrc: string;
  filename: string;
  folder: string;
  onCropped?: (newObjectPath: string) => void;
}

const ASPECT_PRESETS: { label: string; value: number | undefined }[] = [
  { label: "Free", value: undefined },
  { label: "1:1 (Square)", value: 1 },
  { label: "16:9 (Widescreen)", value: 16 / 9 },
  { label: "4:3 (Standard)", value: 4 / 3 },
  { label: "3:2 (Photo)", value: 3 / 2 },
  { label: "2:3 (Portrait)", value: 2 / 3 },
];

export default function MediaCropModal({ open, onClose, imageSrc, filename, folder, onCropped }: MediaCropModalProps) {
  const { toast } = useToast();
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [aspect, setAspect] = useState<number | undefined>(undefined);
  const [resizeWidth, setResizeWidth] = useState<string>("");
  const [resizeHeight, setResizeHeight] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [saveMode, setSaveMode] = useState<"new" | "replace">("new");

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    setResizeWidth(String(naturalWidth));
    setResizeHeight(String(naturalHeight));
  }, []);

  function handleAspectChange(value: string) {
    const preset = ASPECT_PRESETS.find(p => p.label === value);
    setAspect(preset?.value);
    setCrop(undefined);
  }

  async function handleSave() {
    if (!imgRef.current) return;
    setSaving(true);
    try {
      const canvas = document.createElement("canvas");
      const img = imgRef.current;

      let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
      if (completedCrop && completedCrop.width > 0 && completedCrop.height > 0) {
        const scaleX = img.naturalWidth / img.width;
        const scaleY = img.naturalHeight / img.height;
        sx = completedCrop.x * scaleX;
        sy = completedCrop.y * scaleY;
        sw = completedCrop.width * scaleX;
        sh = completedCrop.height * scaleY;
      }

      const targetW = resizeWidth ? Number(resizeWidth) : sw;
      const targetH = resizeHeight ? Number(resizeHeight) : sh;
      canvas.width = targetW;
      canvas.height = targetH;

      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas not supported");
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetW, targetH);

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(b => b ? resolve(b) : reject(new Error("Failed to create image")), "image/png", 1);
      });

      const ext = filename.replace(/\.[^.]+$/, "");
      const newFilename = saveMode === "new" ? `${ext}-cropped.png` : filename;

      const formData = new FormData();
      formData.append("file", blob, newFilename);
      formData.append("folder", folder);

      const token = localStorage.getItem("lc3_access_token");
      const res = await fetch("/api/media/upload", {
        method: "POST",
        body: formData,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) throw new Error("Upload failed");
      const { objectPath } = await res.json();

      queryClient.invalidateQueries({ queryKey: ["/api/media"] });
      toast({ title: saveMode === "new" ? "Saved as new image" : "Image replaced" });
      onCropped?.(objectPath);
      onClose();
    } catch (err: any) {
      toast({ title: err.message || "Failed to save", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Crop & Resize Image</DialogTitle>
        </DialogHeader>

        <div className="flex gap-4 items-end flex-wrap mb-2">
          <div>
            <Label className="text-xs">Aspect Ratio</Label>
            <Select onValueChange={handleAspectChange} defaultValue="Free">
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ASPECT_PRESETS.map(p => (
                  <SelectItem key={p.label} value={p.label}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Width (px)</Label>
            <Input type="number" value={resizeWidth} onChange={e => setResizeWidth(e.target.value)} className="w-24" />
          </div>
          <div>
            <Label className="text-xs">Height (px)</Label>
            <Input type="number" value={resizeHeight} onChange={e => setResizeHeight(e.target.value)} className="w-24" />
          </div>
          <div>
            <Label className="text-xs">Save As</Label>
            <Select value={saveMode} onValueChange={v => setSaveMode(v as "new" | "replace")}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="new">New Image</SelectItem>
                <SelectItem value="replace">Replace Original</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex-1 overflow-auto min-h-0 flex items-center justify-center bg-muted/30 rounded-md p-2">
          <ReactCrop
            crop={crop}
            onChange={c => setCrop(c)}
            onComplete={c => setCompletedCrop(c)}
            aspect={aspect}
          >
            <img
              ref={imgRef}
              src={imageSrc}
              onLoad={onImageLoad}
              style={{ maxHeight: "60vh", maxWidth: "100%" }}
              crossOrigin="anonymous"
            />
          </ReactCrop>
        </div>

        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
