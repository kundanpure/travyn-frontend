'use client'

import React, { useState } from 'react'
import { Star, Loader2, X } from 'lucide-react'
import api from '@/lib/api'

interface ReviewModalProps {
  tripId: string;
  revieweeId: string;
  revieweeName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function ReviewModal({ tripId, revieweeId, revieweeName, onClose, onSuccess }: ReviewModalProps) {
  const [ratings, setRatings] = useState({
    punctuality: 0,
    cleanliness: 0,
    communication: 0,
    vibe: 0,
    safety: 0
  });
  const [hoverRatings, setHoverRatings] = useState({
    punctuality: 0,
    cleanliness: 0,
    communication: 0,
    vibe: 0,
    safety: 0
  });
  
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isFormValid = Object.values(ratings).every(r => r > 0);

  const handleSubmit = async () => {
    if (!isFormValid) {
      setError("Please select all ratings");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await api.post(`/trips/${tripId}/reviews/${revieweeId}`, {
        punctualityRating: ratings.punctuality,
        cleanlinessRating: ratings.cleanliness,
        communicationRating: ratings.communication,
        vibeRating: ratings.vibe,
        safetyRating: ratings.safety,
        textReview: comment
      });
      onSuccess();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to submit review. You may have already reviewed this user.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (category: keyof typeof ratings, label: string) => (
    <div className="flex items-center justify-between mb-3">
      <span className="text-sm font-medium text-gray-300">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className="focus:outline-none transition-transform hover:scale-110"
            onMouseEnter={() => setHoverRatings({ ...hoverRatings, [category]: star })}
            onMouseLeave={() => setHoverRatings({ ...hoverRatings, [category]: 0 })}
            onClick={() => setRatings({ ...ratings, [category]: star })}
          >
            <Star
              size={24}
              fill={(hoverRatings[category] || ratings[category]) >= star ? "#f0a030" : "transparent"}
              color={(hoverRatings[category] || ratings[category]) >= star ? "#f0a030" : "#4b5563"}
            />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md p-6 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4" style={{ color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer" }}
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>Review {revieweeName}</h2>
        <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
          How was your experience co-traveling with {revieweeName}? Honest reviews keep our community safe.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="mb-6">
          {renderStars("punctuality", "Punctuality")}
          {renderStars("cleanliness", "Cleanliness")}
          {renderStars("communication", "Communication")}
          {renderStars("vibe", "Vibe")}
          {renderStars("safety", "Safety")}
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Comments (Optional)
          </label>
          <textarea
            className="t-input w-full"
            rows={3}
            placeholder="Share your experience..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={500}
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting || !isFormValid}
          className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 font-bold flex items-center justify-center gap-2 transition-colors"
        >
          {submitting ? (
            <><Loader2 size={18} className="animate-spin" /> Submitting...</>
          ) : (
            "Submit Review"
          )}
        </button>
      </div>
    </div>
  )
}
