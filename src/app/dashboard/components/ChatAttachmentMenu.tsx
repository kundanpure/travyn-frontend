"use client";

import { useState, useRef, useEffect } from "react";
import { ImagePlus, Paperclip, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ImageUploadModal from "./ImageUploadModal";
import { BUCKETS } from "@/lib/supabase";

interface ChatAttachmentMenuProps {
  userId: string;
  onImageUploaded: (url: string) => void;
}

export default function ChatAttachmentMenu({
  userId,
  onImageUploaded,
}: ChatAttachmentMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2.5 rounded-full transition-all"
          style={{
            background: isOpen ? "rgba(45, 212, 168, 0.1)" : "transparent",
            border: `1.5px solid ${isOpen ? "var(--color-primary)" : "var(--color-line)"}`,
            cursor: "pointer",
            color: isOpen ? "var(--color-primary-bright)" : "var(--color-txt-muted)",
          }}
          title="Attach file"
        >
          {isOpen ? <X size={18} /> : <Paperclip size={18} />}
        </button>

        {/* Popover Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute bottom-14 left-0 rounded-xl overflow-hidden shadow-2xl"
              style={{
                background: "var(--color-bg-elevated)",
                border: "1px solid var(--color-line-hover)",
                minWidth: 180,
              }}
            >
              <button
                onClick={() => {
                  setIsOpen(false);
                  setShowUploadModal(true);
                }}
                className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium transition-colors text-left"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--color-txt-primary)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget.style.background = "rgba(45, 212, 168, 0.06)");
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget.style.background = "none");
                }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{
                    background: "rgba(96, 165, 250, 0.1)",
                    border: "1px solid rgba(96, 165, 250, 0.15)",
                  }}
                >
                  <ImagePlus size={16} style={{ color: "#60a5fa" }} />
                </div>
                <div>
                  <span className="block" style={{ color: "var(--color-txt-primary)" }}>Photo</span>
                  <span className="text-[11px]" style={{ color: "var(--color-txt-dim)" }}>
                    JPG, PNG, WebP
                  </span>
                </div>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Upload Modal for chat images — no crop */}
      {showUploadModal && (
        <ImageUploadModal
          bucket={BUCKETS.CHAT_IMAGES}
          userId={userId}
          skipCrop={true}
          title="Send Photo"
          onUploadComplete={(url) => {
            setShowUploadModal(false);
            onImageUploaded(url);
          }}
          onClose={() => setShowUploadModal(false)}
        />
      )}
    </>
  );
}
