import { useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import Modal from "../../components/ui/Modal";
import Button from "../../components/ui/Button";
import ZoomSlider from "../../components/ui/ZoomSlider";
import api, { API_ORIGIN } from "../../lib/api";

const FRAME = 240;
const MIN_ZOOM_PCT = 100;
const MAX_ZOOM_PCT = 300;
const ZOOM_STEP = 20;
const PAN_SNAP = 10;
const MAX_FILE_SIZE = 2 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

function snap(value, step) {
  return Math.round(value / step) * step;
}

function clampOffset(offset, scale, natural, frame) {
  const drawnW = natural.w * scale;
  const drawnH = natural.h * scale;
  const minX = Math.min(0, frame - drawnW);
  const minY = Math.min(0, frame - drawnH);
  return {
    x: Math.min(0, Math.max(minX, offset.x)),
    y: Math.min(0, Math.max(minY, offset.y)),
  };
}

function getBounds(scale, natural, frame) {
  const drawnW = natural.w * scale;
  const drawnH = natural.h * scale;
  return {
    minX: Math.min(0, frame - drawnW),
    maxX: 0,
    minY: Math.min(0, frame - drawnH),
    maxY: 0,
  };
}

export default function AvatarUploadModal({ open, onClose, onUploaded, profile }) {
  const [file, setFile] = useState(null);
  const [imgUrl, setImgUrl] = useState(null);
  const [natural, setNatural] = useState(null);
  const [baseScale, setBaseScale] = useState(1);
  const [zoomPct, setZoomPct] = useState(MIN_ZOOM_PCT);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [loadingCurrent, setLoadingCurrent] = useState(false);

  const fileInputRef = useRef(null);
  const frameRef = useRef(null);
  const dragRef = useRef(null);
  const imgUrlRef = useRef(null);
  const pendingCropRef = useRef(null);

  useEffect(() => {
    if (open) {
      loadCurrentAvatarIfAny();
    } else {
      reset();
    }
  }, [open]);

  async function loadCurrentAvatarIfAny() {
    const hasOriginal = Boolean(profile?.avatar_original_url);
    const path = hasOriginal ? profile.avatar_original_url : profile?.avatar_url;
    if (!path) return;

    setError("");
    setLoadingCurrent(true);
    try {
      const { data: blob } = await api.get(`${API_ORIGIN}${path}`, { responseType: "blob" });

      if (imgUrlRef.current) URL.revokeObjectURL(imgUrlRef.current);
      const url = URL.createObjectURL(blob);
      imgUrlRef.current = url;

      if (hasOriginal && profile.avatar_zoom != null) {
        pendingCropRef.current = {
          zoom: Number(profile.avatar_zoom),
          offsetX: Number(profile.avatar_offset_x),
          offsetY: Number(profile.avatar_offset_y),
        };
      } else {
        pendingCropRef.current = null;
      }

      setImgUrl(url);
    } catch (err) {
      console.error("Load current avatar error:", err);
    } finally {
      setLoadingCurrent(false);
    }
  }

  function reset() {
    if (imgUrlRef.current) URL.revokeObjectURL(imgUrlRef.current);
    imgUrlRef.current = null;
    pendingCropRef.current = null;
    setFile(null);
    setImgUrl(null);
    setNatural(null);
    setZoomPct(MIN_ZOOM_PCT);
    setOffset({ x: 0, y: 0 });
    setDragging(false);
    setError("");
    setUploading(false);
    setLoadingCurrent(false);
  }

  function handlePickClick() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;

    setError("");
    if (!ALLOWED_TYPES.includes(f.type)) {
      setError("Please choose a JPG, PNG, or WEBP image");
      return;
    }
    if (f.size > MAX_FILE_SIZE) {
      setError("Image must be under 2MB");
      return;
    }

    if (imgUrlRef.current) URL.revokeObjectURL(imgUrlRef.current);
    const url = URL.createObjectURL(f);
    imgUrlRef.current = url;
    pendingCropRef.current = null;
    setFile(f);
    setImgUrl(url);
    setZoomPct(MIN_ZOOM_PCT);
  }

  function handleImgLoad(e) {
    const w = e.target.naturalWidth;
    const h = e.target.naturalHeight;
    const scale = FRAME / Math.min(w, h);
    setNatural({ w, h });
    setBaseScale(scale);

    const pending = pendingCropRef.current;
    pendingCropRef.current = null;

    if (pending && pending.zoom) {
      const restoredScale = scale * (pending.zoom / 100);
      const restoredOffset = clampOffset(
        { x: pending.offsetX, y: pending.offsetY },
        restoredScale,
        { w, h },
        FRAME
      );
      setZoomPct(Math.min(MAX_ZOOM_PCT, Math.max(MIN_ZOOM_PCT, pending.zoom)));
      setOffset(restoredOffset);
    } else {
      setZoomPct(MIN_ZOOM_PCT);
      setOffset({
        x: (FRAME - w * scale) / 2,
        y: (FRAME - h * scale) / 2,
      });
    }
  }

  function handleZoomChange(nextPct) {
    if (!natural) return;
    const clamped = Math.min(MAX_ZOOM_PCT, Math.max(MIN_ZOOM_PCT, nextPct));
    const oldScale = baseScale * (zoomPct / 100);
    const newScale = baseScale * (clamped / 100);

    const oldBounds = getBounds(oldScale, natural, FRAME);
    const newBounds = getBounds(newScale, natural, FRAME);

    const rangeX = oldBounds.maxX - oldBounds.minX;
    const rangeY = oldBounds.maxY - oldBounds.minY;
    const fracX = rangeX === 0 ? 0.5 : (offset.x - oldBounds.minX) / rangeX;
    const fracY = rangeY === 0 ? 0.5 : (offset.y - oldBounds.minY) / rangeY;

    const nextOffset = {
      x: newBounds.minX + fracX * (newBounds.maxX - newBounds.minX),
      y: newBounds.minY + fracY * (newBounds.maxY - newBounds.minY),
    };

    setZoomPct(clamped);
    setOffset(nextOffset);
  }

  function handlePointerDown(e) {
    frameRef.current?.setPointerCapture(e.pointerId);
    setDragging(true);
    dragRef.current = { startX: e.clientX, startY: e.clientY, startOffset: offset };
  }

  function handlePointerMove(e) {
    if (!dragRef.current || !natural) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    const scale = baseScale * (zoomPct / 100);
    const raw = {
      x: dragRef.current.startOffset.x + dx,
      y: dragRef.current.startOffset.y + dy,
    };
    const snapped = { x: snap(raw.x, PAN_SNAP), y: snap(raw.y, PAN_SNAP) };
    const next = clampOffset(snapped, scale, natural, FRAME);
    setOffset(next);
  }

  function handlePointerUp(e) {
    frameRef.current?.releasePointerCapture(e.pointerId);
    setDragging(false);
    dragRef.current = null;
  }

  async function handleSave() {
    if (!imgUrl || !natural) return;
    setError("");
    setUploading(true);
    try {
      const scale = baseScale * (zoomPct / 100);
      const OUTPUT = 320;
      const canvas = document.createElement("canvas");
      canvas.width = OUTPUT;
      canvas.height = OUTPUT;
      const ctx = canvas.getContext("2d");

      const img = new Image();
      img.src = imgUrl;
      await new Promise((resolve, reject) => {
        if (img.complete) return resolve();
        img.onload = resolve;
        img.onerror = reject;
      });

      const sx = -offset.x / scale;
      const sy = -offset.y / scale;
      const sSize = FRAME / scale;
      ctx.drawImage(img, sx, sy, sSize, sSize, 0, 0, OUTPUT, OUTPUT);

      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.92)
      );

      const formData = new FormData();
      formData.append("avatar", blob, "avatar.jpg");
      if (file) {
        formData.append("avatarOriginal", file, file.name);
      }
      formData.append("zoom", String(zoomPct));
      formData.append("offsetX", String(offset.x));
      formData.append("offsetY", String(offset.y));

      const { data } = await api.post("/profile/avatar", formData);
      onUploaded(data.profile);
      onClose();
    } catch (err) {
      console.error("Avatar upload error:", err);
      setError(err?.response?.data?.error || "Something went wrong uploading your photo");
    } finally {
      setUploading(false);
    }
  }

  const drawnW = natural ? natural.w * baseScale * (zoomPct / 100) : 0;
  const drawnH = natural ? natural.h * baseScale * (zoomPct / 100) : 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Update profile photo"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={uploading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!imgUrl || uploading}>
            {uploading ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Saving...
              </>
            ) : (
              "Save photo"
            )}
          </Button>
        </>
      }
    >
      {loadingCurrent ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin text-[var(--color-text-muted)]" />
        </div>
      ) : !imgUrl ? (
        <div className="flex flex-col items-center justify-center gap-3 py-10">
          <button
            type="button"
            onClick={handlePickClick}
            className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-[var(--color-border)]
              px-8 py-8 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-alt)]
              hover:text-[var(--color-text)] transition-colors"
          >
            <ImagePlus size={28} />
            <span className="text-sm font-medium">Choose a photo</span>
            <span className="text-xs">JPG, PNG, or WEBP · up to 2MB</span>
          </button>
          {error && <p className="text-xs text-[var(--color-danger)]">{error}</p>}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 py-1">
          <div
            ref={frameRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            style={{ width: FRAME, height: FRAME }}
            className="relative overflow-hidden rounded-md border border-[var(--color-border)]
              bg-[var(--color-surface-alt)] shadow-inner cursor-grab active:cursor-grabbing touch-none select-none"
          >
            <img
              src={imgUrl}
              alt="Selected"
              draggable={false}
              onLoad={handleImgLoad}
              style={{
                position: "absolute",
                left: offset.x,
                top: offset.y,
                width: drawnW || undefined,
                height: drawnH || undefined,
                maxWidth: "none",
              }}
            />

            <div
              className={`pointer-events-none absolute inset-0 transition-opacity duration-150 ${
                dragging ? "opacity-100" : "opacity-0"
              }`}
            >
              {[1, 2].map((i) => (
                <div
                  key={`v-${i}`}
                  className="absolute top-0 bottom-0 w-px bg-white/60"
                  style={{ left: `${(i / 3) * 100}%` }}
                />
              ))}
              {[1, 2].map((i) => (
                <div
                  key={`h-${i}`}
                  className="absolute left-0 right-0 h-px bg-white/60"
                  style={{ top: `${(i / 3) * 100}%` }}
                />
              ))}
            </div>

            <div className="pointer-events-none absolute inset-0 rounded-md ring-1 ring-inset ring-white/10" />
          </div>

          <ZoomSlider
            value={zoomPct}
            min={MIN_ZOOM_PCT}
            max={MAX_ZOOM_PCT}
            step={ZOOM_STEP}
            onChange={handleZoomChange}
            className="max-w-[240px]"
          />

          <span className="text-xs text-[var(--color-text-muted)] -mt-2">{zoomPct}%</span>

          <button
            type="button"
            onClick={handlePickClick}
            className="text-xs text-[var(--color-primary)] hover:underline"
          >
            Choose a different photo
          </button>

          {error && <p className="text-xs text-[var(--color-danger)]">{error}</p>}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
    </Modal>
  );
}
