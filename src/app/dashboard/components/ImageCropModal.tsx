"use client";

import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { X, ZoomIn, ZoomOut, Check, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ImageCropModalProps {
  imageSrc: string;
  /** "circle" for avatars, "rect" for covers */
  cropShape?: "round" | "rect";
  /** Aspect ratio (width/height). 1 for square avatar, 16/5 for cover */
  aspect?: number;
  onCropComplete: (croppedAreaPixels: CropArea) => void;
  onClose: () => void;
}

export default function ImageCropModal({
  imageSrc,
  cropShape = "round",
  aspect = 1,
  onCropComplete,
  onClose,
}: ImageCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null);

  const onCropChange = useCallback(
    (_: unknown, croppedAreaPx: CropArea) => {
      setCroppedAreaPixels(croppedAreaPx);
    },
    []
  );

  const handleConfirm = () => {
    if (croppedAreaPixels) {
      onCropComplete(croppedAreaPixels);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center"
        style={{ background: "rgba(0, 0, 0, 0.85)" }}
      >
        {/* Backdrop click to close */}
        <div className="absolute inset-0" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.92 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg mx-4 rounded-2xl overflow-hidden"
          style={{
            background: "var(--color-bg-elevated)",
            border: "1px solid var(--color-line-hover)",
            boxShadow: "0 40px 100px rgba(0,0,0,0.6)",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: "1px solid var(--color-line)" }}
          >
            <h3 className="text-base font-semibold" style={{ color: "var(--color-txt-white)" }}>
              {cropShape === "round" ? "Crop Avatar" : "Adjust Cover Photo"}
            </h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg transition-colors"
              style={{ background: "none", border: "none", cursor: "pointer" }}
            >
              <X size={18} style={{ color: "var(--color-txt-muted)" }} />
            </button>
          </div>

          {/* Crop Area */}
          <div className="relative" style={{ height: 360, background: "var(--color-bg-deep)" }}>
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              cropShape={cropShape}
              showGrid={cropShape === "rect"}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropChange}
              style={{
                containerStyle: { background: "var(--color-bg-deep)" },
              }}
            />
          </div>

          {/* Controls */}
          <div
            className="px-5 py-4 space-y-4"
            style={{ borderTop: "1px solid var(--color-line)" }}
          >
            {/* Zoom slider */}
            <div className="flex items-center gap-3">
              <ZoomOut size={16} style={{ color: "var(--color-txt-muted)" }} />
              <input
                type="range"
                min={1}
                max={3}
                step={0.05}
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, var(--color-primary) ${((zoom - 1) / 2) * 100}%, var(--color-bg-deep) ${((zoom - 1) / 2) * 100}%)`,
                  accentColor: "var(--color-primary)",
                }}
              />
              <ZoomIn size={16} style={{ color: "var(--color-txt-muted)" }} />
              <span className="text-xs font-mono w-10 text-right" style={{ color: "var(--color-txt-dim)" }}>
                {zoom.toFixed(1)}x
              </span>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setZoom(1); setCrop({ x: 0, y: 0 }); }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{
                  background: "var(--color-bg-deep)",
                  border: "1px solid var(--color-line)",
                  color: "var(--color-txt-secondary)",
                  cursor: "pointer",
                }}
              >
                <RotateCcw size={15} /> Reset
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all"
                style={{
                  background: "linear-gradient(135deg, var(--color-primary-dim), var(--color-primary))",
                  border: "none",
                  color: "var(--color-bg-deep)",
                  cursor: "pointer",
                }}
              >
                <Check size={15} /> Apply Crop
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
