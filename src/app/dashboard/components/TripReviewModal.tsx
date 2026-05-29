import { useState } from 'react';
import { Star, X, Loader2 } from 'lucide-react';
import api from '@/lib/api';

interface TripReviewModalProps {
  tripId: string;
  tripTitle: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function TripReviewModal({ tripId, tripTitle, onClose, onSuccess }: TripReviewModalProps) {
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (rating === 0) {
      setError("Please select a rating");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await api.post(`/trips/${tripId}/reviews`, {
        rating,
        textReview: comment
      });
      onSuccess();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to submit review. You may have already reviewed this trip.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md p-6 rounded-2xl shadow-2xl bg-gray-900 border border-gray-800">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-bold text-white mb-2">Review Trip</h2>
        <p className="text-sm text-gray-400 mb-6">
          How was your experience on the trip "{tripTitle}"? Rate the overall experience and destination.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="flex justify-center gap-2 mb-6">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className="focus:outline-none transition-transform hover:scale-110"
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(star)}
            >
              <Star
                size={36}
                fill={(hoverRating || rating) >= star ? "#f0a030" : "transparent"}
                color={(hoverRating || rating) >= star ? "#f0a030" : "#4b5563"}
              />
            </button>
          ))}
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Comments (Optional)
          </label>
          <textarea
            className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
            rows={4}
            placeholder="Share your experience about the trip..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={1000}
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting || rating === 0}
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
