"use client";

import { useState, useCallback, useRef } from "react";
import {
  X, Upload, CloudUpload, ImagePlus, AlertCircle, CheckCircle2, Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ImageCropModal from "./ImageCropModal";
import {
  validateImageFile,
  compressImage,
  getCroppedImg,
  uploadToSupabase,
  generateUploadPath,
} from "@/lib/upload";
import type { UploadProgress } from "@/lib/upload";

interface ImageUploadModalProps {
  /** Which Supabase bucket to upload to */
  bucket: string;
  /** Current user ID for path generation */
  userId: string;
  /** "round" for avatars, "rect" for covers */
  cropShape?: "round" | "rect";
  /** Aspect ratio. 1 for avatar, 16/5 for cover */
  aspect?: number;
  /** If true, skip the crop step (e.g. for chat images) */
  skipCrop?: boolean;
  /** Title shown in the modal header */
  title?: string;
  onUploadComplete: (url: string) => void;
  onClose: () => void;
}

export default function ImageUploadModal({
  bucket,
  userId,
  cropShape = "round",
  aspect = 1,
  skipCrop = false,
  title = "Upload Photo",
  onUploadComplete,
  onClose,
}: ImageUploadModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showCrop, setShowCrop] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      setError(null);
      const validationError = validateImageFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);

      if (skipCrop) {
        // Skip crop → compress and upload directly
        handleDirectUpload(file);
      } else {
        setShowCrop(true);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [skipCrop]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => setDragActive(false);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDirectUpload = async (file: File) => {
    try {
      setProgress({ stage: "compressing", percent: 20, message: "Compressing image..." });
      const compressed = await compressImage(file);

      setProgress({ stage: "uploading", percent: 60, message: "Uploading to cloud..." });
      const path = generateUploadPath(userId, bucket, file.name);
      const result = await uploadToSupabase(bucket, path, compressed, compressed.type);

      setProgress({ stage: "done", percent: 100, message: "Upload complete!" });
      setTimeout(() => onUploadComplete(result.url), 600);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setProgress(null);
    }
  };

  const handleCropComplete = async (croppedAreaPixels: {
    x: number;
    y: number;
    width: number;
    height: number;
  }) => {
    if (!previewUrl || !selectedFile) return;
    setShowCrop(false);

    try {
      setProgress({ stage: "cropping", percent: 30, message: "Cropping image..." });
      const croppedBlob = await getCroppedImg(previewUrl, croppedAreaPixels);

      setProgress({ stage: "compressing", percent: 50, message: "Compressing..." });
      const croppedFile = new File([croppedBlob], selectedFile.name, {
        type: "image/jpeg",
      });
      const compressed = await compressImage(croppedFile);

      setProgress({ stage: "uploading", percent: 70, message: "Uploading to cloud..." });
      const path = generateUploadPath(userId, bucket, selectedFile.name);
      const result = await uploadToSupabase(bucket, path, compressed, "image/jpeg");

      setProgress({ stage: "done", percent: 100, message: "Upload complete!" });
      setTimeout(() => onUploadComplete(result.url), 600);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setProgress(null);
    }
  };

  const reset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setProgress(null);
    setError(null);
    setShowCrop(false);
  };

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] flex items-center justify-center"
          style={{ background: "rgba(0, 0, 0, 0.75)" }}
        >
          <div className="absolute inset-0" onClick={onClose} />

          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md mx-4 rounded-2xl overflow-hidden"
            style={{
              background: "var(--color-bg-elevated)",
              border: "1px solid var(--color-line-hover)",
              boxShadow:
                "0 40px 100px rgba(0,0,0,0.6), 0 0 80px rgba(45,212,168,0.05)",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: "1px solid var(--color-line)" }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{
                    background: "rgba(45, 212, 168, 0.1)",
                    border: "1px solid rgba(45, 212, 168, 0.15)",
                  }}
                >
                  <ImagePlus size={16} style={{ color: "var(--color-primary)" }} />
                </div>
                <h3
                  className="text-base font-semibold"
                  style={{ color: "var(--color-txt-white)" }}
                >
                  {title}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg transition-colors"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <X
                  size={18}
                  style={{ color: "var(--color-txt-muted)" }}
                />
              </button>
            </div>

            {/* Body */}
            <div className="p-5">
              {/* Drop Zone (only visible when no file selected) */}
              {!progress && !error && (
                <div
                  className="relative rounded-xl transition-all cursor-pointer"
                  style={{
                    border: `2px dashed ${dragActive ? "var(--color-primary)" : "var(--color-line-hover)"}`,
                    background: dragActive
                      ? "rgba(45, 212, 168, 0.05)"
                      : "var(--color-bg-surface)",
                    padding: "40px 24px",
                  }}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleFileInput}
                    className="hidden"
                  />

                  <div className="flex flex-col items-center text-center">
                    <motion.div
                      animate={{
                        y: dragActive ? -8 : 0,
                        scale: dragActive ? 1.1 : 1,
                      }}
                      transition={{ type: "spring", damping: 15 }}
                      className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                      style={{
                        background: dragActive
                          ? "rgba(45, 212, 168, 0.15)"
                          : "rgba(45, 212, 168, 0.08)",
                        border: `1px solid ${dragActive ? "rgba(45, 212, 168, 0.3)" : "rgba(45, 212, 168, 0.1)"}`,
                      }}
                    >
                      <CloudUpload
                        size={28}
                        style={{
                          color: dragActive
                            ? "var(--color-primary-bright)"
                            : "var(--color-primary)",
                        }}
                      />
                    </motion.div>

                    <p
                      className="text-sm font-medium mb-1"
                      style={{ color: "var(--color-txt-primary)" }}
                    >
                      {dragActive
                        ? "Drop your image here"
                        : "Drag & drop your image here"}
                    </p>
                    <p
                      className="text-xs mb-4"
                      style={{ color: "var(--color-txt-muted)" }}
                    >
                      or click to browse
                    </p>

                    {/* File type badges */}
                    <div className="flex items-center gap-2 flex-wrap justify-center">
                      {["JPG", "PNG", "WebP", "GIF"].map((type) => (
                        <span
                          key={type}
                          className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
                          style={{
                            background: "var(--color-bg-deep)",
                            color: "var(--color-txt-dim)",
                            border: "1px solid var(--color-line)",
                          }}
                        >
                          {type}
                        </span>
                      ))}
                      <span
                        className="text-[10px] font-medium"
                        style={{ color: "var(--color-txt-dim)" }}
                      >
                        • Max 10MB
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Progress State */}
              {progress && (
                <div className="py-6 text-center">
                  <div className="flex justify-center mb-4">
                    {progress.stage === "done" ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", damping: 12 }}
                        className="w-16 h-16 rounded-full flex items-center justify-center"
                        style={{
                          background: "rgba(45, 212, 168, 0.12)",
                          border: "2px solid var(--color-primary)",
                        }}
                      >
                        <CheckCircle2
                          size={32}
                          style={{ color: "var(--color-primary-bright)" }}
                        />
                      </motion.div>
                    ) : (
                      <div
                        className="w-16 h-16 rounded-full flex items-center justify-center"
                        style={{
                          background: "rgba(45, 212, 168, 0.08)",
                          border: "1px solid rgba(45, 212, 168, 0.15)",
                        }}
                      >
                        <Loader2
                          size={28}
                          className="animate-spin"
                          style={{ color: "var(--color-primary)" }}
                        />
                      </div>
                    )}
                  </div>

                  <p
                    className="text-sm font-medium mb-1"
                    style={{
                      color:
                        progress.stage === "done"
                          ? "var(--color-primary-bright)"
                          : "var(--color-txt-primary)",
                    }}
                  >
                    {progress.message}
                  </p>

                  {/* Progress bar */}
                  <div className="mt-4 mx-auto max-w-xs">
                    <div
                      className="w-full h-1.5 rounded-full overflow-hidden"
                      style={{ background: "var(--color-bg-deep)" }}
                    >
                      <motion.div
                        className="h-full rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress.percent}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        style={{
                          background:
                            progress.stage === "done"
                              ? "var(--color-primary-bright)"
                              : "linear-gradient(90deg, var(--color-primary-dim), var(--color-primary))",
                        }}
                      />
                    </div>
                    <p
                      className="text-xs mt-1.5"
                      style={{ color: "var(--color-txt-dim)" }}
                    >
                      {progress.percent}%
                    </p>
                  </div>
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="py-6 text-center">
                  <div
                    className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4"
                    style={{
                      background: "rgba(248, 113, 113, 0.1)",
                      border: "1px solid rgba(248, 113, 113, 0.2)",
                    }}
                  >
                    <AlertCircle
                      size={28}
                      style={{ color: "var(--color-danger)" }}
                    />
                  </div>
                  <p
                    className="text-sm font-medium mb-1"
                    style={{ color: "var(--color-danger)" }}
                  >
                    {error}
                  </p>
                  <button
                    onClick={reset}
                    className="mt-3 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                    style={{
                      background: "var(--color-bg-deep)",
                      border: "1px solid var(--color-line)",
                      color: "var(--color-txt-secondary)",
                      cursor: "pointer",
                    }}
                  >
                    <Upload size={14} className="inline mr-1.5" />
                    Try Again
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Crop Modal */}
      {showCrop && previewUrl && (
        <ImageCropModal
          imageSrc={previewUrl}
          cropShape={cropShape}
          aspect={aspect}
          onCropComplete={handleCropComplete}
          onClose={() => {
            setShowCrop(false);
            reset();
          }}
        />
      )}
    </>
  );
}
