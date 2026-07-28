"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Calendar, MapPin, Clock, Plus, Trash2, Edit3,
  ChevronDown, ChevronRight, GripVertical, Loader2,
  Car, Utensils, Mountain, Hotel, Coffee, Save, X, ArrowUp, ArrowDown,
  CalendarPlus, StickyNote, RotateCcw
} from "lucide-react";
import api from "@/lib/api";

const categoryConfig: Record<string, { icon: typeof Car; color: string; label: string }> = {
  TRAVEL: { icon: Car, color: "#60a5fa", label: "Travel" },
  FOOD: { icon: Utensils, color: "#f59e0b", label: "Food" },
  ACTIVITY: { icon: Mountain, color: "#2dd4a8", label: "Activity" },
  ACCOMMODATION: { icon: Hotel, color: "#a78bfa", label: "Stay" },
  FREE_TIME: { icon: Coffee, color: "#f472b6", label: "Free Time" },
};

interface ItineraryItem {
  id: string;
  dayId: string;
  title: string;
  description?: string;
  location?: string;
  startTime?: string;
  endTime?: string;
  category: string;
  sortOrder: number;
  createdBy: string;
  createdByName?: string;
  createdAt: string;
}

interface ItineraryDay {
  id: string;
  tripId: string;
  date: string;
  title: string;
  notes?: string;
  dayNumber: number;
  items: ItineraryItem[];
  createdAt: string;
  updatedAt: string;
}

interface TripInfo {
  startDate: string;
  endDate: string;
  title: string;
}

export default function ItineraryPage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.id as string;
  const initialExpandDone = useRef(false);
  const savedSnapshotRef = useRef<Map<string, ItineraryItem[]>>(new Map());

  const [days, setDays] = useState<ItineraryDay[]>([]);
  const [trip, setTrip] = useState<TripInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [addingItem, setAddingItem] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editingDay, setEditingDay] = useState<string | null>(null);
  const [addingDay, setAddingDay] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [itemForm, setItemForm] = useState({
    title: "", description: "", location: "", startTime: "", endTime: "", category: "ACTIVITY",
  });
  const [dayForm, setDayForm] = useState({ date: "", title: "", notes: "" });
  const [editDayForm, setEditDayForm] = useState({ title: "", notes: "" });

  const fetchItinerary = useCallback(async () => {
    try {
      const [res, tripRes] = await Promise.all([
        api.get(`/trips/${tripId}/itinerary`),
        api.get(`/trips/${tripId}`)
      ]);
      const fetchedDays: ItineraryDay[] = res.data || [];
      setDays(fetchedDays);
      setTrip(tripRes.data);

      // Save initial snapshot on first load for Reset functionality
      if (savedSnapshotRef.current.size === 0 && fetchedDays.length > 0) {
        fetchedDays.forEach(d => {
          savedSnapshotRef.current.set(d.id, JSON.parse(JSON.stringify(d.items)));
        });
      }

      // Auto-expand all days on first load only
      if (!initialExpandDone.current && fetchedDays.length > 0) {
        setExpandedDays(new Set(fetchedDays.map((d: ItineraryDay) => d.id)));
        initialExpandDone.current = true;
      }
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    fetchItinerary();
  }, [fetchItinerary]);

  const toggleDay = (dayId: string) => {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(dayId)) next.delete(dayId);
      else next.add(dayId);
      return next;
    });
  };

  // ─── Item handlers ───────────────────────────────────────────
  const handleAddItem = async (dayId: string) => {
    if (!itemForm.title.trim()) return;
    setSaving(true);
    try {
      await api.post(`/trips/${tripId}/itinerary/days/${dayId}/items`, {
        ...itemForm,
        startTime: itemForm.startTime || null,
        endTime: itemForm.endTime || null,
      });
      setAddingItem(null);
      setItemForm({ title: "", description: "", location: "", startTime: "", endTime: "", category: "ACTIVITY" });
      await fetchItinerary();
    } catch {}
    setSaving(false);
  };

  const handleUpdateItem = async (itemId: string) => {
    setSaving(true);
    try {
      await api.put(`/trips/${tripId}/itinerary/items/${itemId}`, {
        ...itemForm,
        startTime: itemForm.startTime || null,
        endTime: itemForm.endTime || null,
      });
      setEditingItem(null);
      setItemForm({ title: "", description: "", location: "", startTime: "", endTime: "", category: "ACTIVITY" });
      await fetchItinerary();
    } catch {}
    setSaving(false);
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!window.confirm("Delete this activity? This cannot be undone.")) return;
    try {
      await api.delete(`/trips/${tripId}/itinerary/items/${itemId}`);
      await fetchItinerary();
    } catch {}
  };

  // Drag and drop state
  const [draggedItem, setDraggedItem] = useState<{ dayId: string; index: number } | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<{ dayId: string; index: number } | null>(null);

  // ─── Conflict & Reorder Helpers ────────────────────────────────
  const getItemMinutes = (timeStr?: string) => {
    if (!timeStr) return null;
    const trimmed = timeStr.trim();
    if (!trimmed) return null;

    const isPM = /pm/i.test(trimmed);
    const isAM = /am/i.test(trimmed);

    const cleanStr = trimmed.replace(/[^\d:]/g, "");
    const parts = cleanStr.split(":");
    if (parts.length < 2) return null;

    let hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    if (isNaN(hours) || isNaN(minutes)) return null;

    if (isPM && hours < 12) hours += 12;
    if (isAM && hours === 12) hours = 0;

    return hours * 60 + minutes;
  };

  const isTimeConflict = (items: ItineraryItem[], idx: number) => {
    const item = items[idx];
    const currStart = getItemMinutes(item.startTime);
    if (currStart === null) return false;
    const currEnd = getItemMinutes(item.endTime);

    for (let i = 0; i < items.length; i++) {
      if (i === idx) continue;
      const otherStart = getItemMinutes(items[i].startTime);
      if (otherStart === null) continue;
      const otherEnd = getItemMinutes(items[i].endTime);

      // Check preceding items in list (i < idx)
      if (i < idx) {
        // Conflict 1: Preceding item starts AFTER current item
        if (otherStart > currStart) return true;
        // Conflict 2: Preceding item has explicit endTime extending PAST current item start
        if (otherEnd !== null && otherEnd > currStart) return true;
      }

      // Check succeeding items in list (i > idx)
      if (i > idx) {
        // Conflict 1: Succeeding item starts BEFORE current item
        if (otherStart < currStart) return true;
        // Conflict 2: Current item has explicit endTime extending PAST succeeding item start
        if (currEnd !== null && currEnd > otherStart) return true;
      }
    }
    return false;
  };

  const handleResetDayOrder = async (dayId: string) => {
    const originalItems = savedSnapshotRef.current.get(dayId);
    if (!originalItems || originalItems.length === 0) return;

    setSaving(true);
    try {
      // Re-apply original item order and original time slots
      const itemIds = originalItems.map(i => i.id);
      
      const updatePromises = originalItems.map(item => {
        return api.put(`/trips/${tripId}/itinerary/items/${item.id}`, {
          title: item.title,
          description: item.description,
          location: item.location,
          category: item.category,
          startTime: item.startTime || null,
          endTime: item.endTime || null,
        });
      });

      await Promise.all([
        ...updatePromises,
        api.put(`/trips/${tripId}/itinerary/days/${dayId}/reorder`, { itemIds })
      ]);

      setDays(prev => prev.map(d => d.id === dayId ? { ...d, items: JSON.parse(JSON.stringify(originalItems)) } : d));
      await fetchItinerary();
    } catch {
      await fetchItinerary();
    }
    setSaving(false);
  };

  const handleDragSwap = async (dayId: string, fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    const day = days.find(d => d.id === dayId);
    if (!day) return;

    const items = [...day.items];
    const sourceItem = items[fromIndex];
    const targetItem = items[toIndex];

    // Smart Time Slot Swapping: Swap startTime and endTime between source and target items
    const sourceStart = sourceItem.startTime;
    const sourceEnd = sourceItem.endTime;
    const targetStart = targetItem.startTime;
    const targetEnd = targetItem.endTime;

    // Perform swap in local array
    [items[fromIndex], items[toIndex]] = [items[toIndex], items[fromIndex]];
    const itemIds = items.map(i => i.id);

    // Optimistically update state for crisp UI responsiveness
    setDays(prev => prev.map(d => d.id === dayId ? { ...d, items } : d));

    try {
      // Persist swapped time slots and new sort order to backend
      await Promise.all([
        api.put(`/trips/${tripId}/itinerary/items/${sourceItem.id}`, {
          title: sourceItem.title,
          description: sourceItem.description,
          location: sourceItem.location,
          category: sourceItem.category,
          startTime: targetStart || null,
          endTime: targetEnd || null,
        }),
        api.put(`/trips/${tripId}/itinerary/items/${targetItem.id}`, {
          title: targetItem.title,
          description: targetItem.description,
          location: targetItem.location,
          category: targetItem.category,
          startTime: sourceStart || null,
          endTime: sourceEnd || null,
        }),
        api.put(`/trips/${tripId}/itinerary/days/${dayId}/reorder`, { itemIds }),
      ]);
      await fetchItinerary();
    } catch {
      await fetchItinerary();
    }
  };

  const handleMoveItem = async (dayId: string, itemIndex: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? itemIndex - 1 : itemIndex + 1;
    await handleDragSwap(dayId, itemIndex, newIndex);
  };

  const startEditItem = (item: ItineraryItem) => {
    setEditingItem(item.id);
    setItemForm({
      title: item.title,
      description: item.description || "",
      location: item.location || "",
      startTime: item.startTime || "",
      endTime: item.endTime || "",
      category: item.category,
    });
  };

  // ─── Day handlers ────────────────────────────────────────────
  const handleAddDay = async () => {
    if (!dayForm.date) return;
    setError(null);
    setSaving(true);
    try {
      // Check if a day already exists for this date (auto-scaffolded days)
      const existingDay = days.find(d => d.date.split("T")[0] === dayForm.date);
      if (existingDay) {
        // Update existing day's title & notes instead of creating a duplicate
        await api.put(`/trips/${tripId}/itinerary/days/${existingDay.id}`, {
          title: dayForm.title || existingDay.title,
          notes: dayForm.notes || existingDay.notes,
        });
      } else {
        // Create new day (for dates outside the trip range)
        await api.post(`/trips/${tripId}/itinerary/days`, dayForm);
      }
      setAddingDay(false);
      setDayForm({ date: "", title: "", notes: "" });
      await fetchItinerary();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || "Failed to save day. Please try again.");
    }
    setSaving(false);
  };

  const handleDeleteDay = async (dayId: string) => {
    if (!window.confirm("Delete this entire day and all its activities? This cannot be undone.")) return;
    try {
      await api.delete(`/trips/${tripId}/itinerary/days/${dayId}`);
      await fetchItinerary();
    } catch {}
  };

  const startEditDay = (day: ItineraryDay) => {
    setEditingDay(day.id);
    setEditDayForm({ title: day.title || "", notes: day.notes || "" });
  };

  const handleUpdateDay = async (dayId: string) => {
    setSaving(true);
    try {
      await api.put(`/trips/${tripId}/itinerary/days/${dayId}`, editDayForm);
      setEditingDay(null);
      setEditDayForm({ title: "", notes: "" });
      await fetchItinerary();
    } catch {}
    setSaving(false);
  };

  // ─── Helpers ─────────────────────────────────────────────────
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

  const totalActivities = days.reduce((sum, d) => sum + d.items.length, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin" style={{ color: "var(--color-primary)" }} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm"
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-txt-muted)" }}
        >
          <ArrowLeft size={16} /> Back to Trip
        </button>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--color-txt-white)" }}>
            <Calendar size={24} className="inline mr-2" style={{ color: "var(--color-primary)" }} />
            Trip Itinerary
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-txt-muted)" }}>
            {days.length} {days.length === 1 ? "day" : "days"} planned • {totalActivities} {totalActivities === 1 ? "activity" : "activities"}
          </p>
        </div>
        <button
          onClick={() => setAddingDay(true)}
          className="t-btn-primary flex items-center gap-1.5"
          style={{ padding: "10px 20px", fontSize: "0.85rem" }}
        >
          <CalendarPlus size={16} /> Add Day
        </button>
      </div>

      {/* Add Day Form */}
      {addingDay && (
        <div
          className="rounded-xl p-5 space-y-4"
          style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-line-active)" }}
        >
          <h3 className="text-sm font-semibold" style={{ color: "var(--color-txt-white)" }}>Add New Day</h3>
          {error && (
            <div
              className="text-xs px-3 py-2 rounded-lg"
              style={{ background: "rgba(248,113,113,0.1)", color: "#f87171", border: "1px solid rgba(248,113,113,0.2)" }}
            >
              {error}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="date"
              value={dayForm.date}
              onChange={(e) => { setDayForm({ ...dayForm, date: e.target.value }); setError(null); }}
              className="t-input"
            />
            <input
              placeholder="Day title (optional)"
              value={dayForm.title}
              onChange={(e) => setDayForm({ ...dayForm, title: e.target.value })}
              className="t-input"
            />
          </div>
          <textarea
            placeholder="Notes (optional)"
            value={dayForm.notes}
            onChange={(e) => setDayForm({ ...dayForm, notes: e.target.value })}
            className="t-input"
            rows={2}
            style={{ resize: "none" }}
          />
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => { setAddingDay(false); setDayForm({ date: "", title: "", notes: "" }); setError(null); }}
              className="t-btn-outline"
              style={{ padding: "8px 16px", fontSize: "0.85rem" }}
            >
              Cancel
            </button>
            <button
              onClick={handleAddDay}
              disabled={saving || !dayForm.date}
              className="t-btn-primary"
              style={{ padding: "8px 16px", fontSize: "0.85rem" }}
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save Day
            </button>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="relative">
        {/* Vertical timeline line */}
        <div
          className="absolute left-6 top-0 bottom-0 w-px"
          style={{ background: "linear-gradient(to bottom, var(--color-primary), var(--color-line), transparent)" }}
        />

        <div className="space-y-4">
          {days.map((day) => {
            const isExpanded = expandedDays.has(day.id);
            const isDayEditing = editingDay === day.id;
            return (
              <div key={day.id} className="relative pl-14">
                {/* Timeline dot */}
                <div
                  className="absolute left-4 top-4 w-5 h-5 rounded-full border-2 flex items-center justify-center"
                  style={{
                    background: isExpanded ? "var(--color-primary)" : "var(--color-bg-surface)",
                    borderColor: "var(--color-primary)",
                  }}
                >
                  {isExpanded && <div className="w-2 h-2 rounded-full" style={{ background: "var(--color-bg-deep)" }} />}
                </div>

                {/* Day card */}
                <div
                  className="rounded-xl overflow-hidden"
                  style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-line)" }}
                >
                  {/* Day header */}
                  <div
                    className="group flex items-center justify-between p-4 cursor-pointer"
                    onClick={() => toggleDay(day.id)}
                    style={{ background: "none", border: "none" }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
                        style={{ background: "rgba(45,212,168,0.1)", color: "var(--color-primary)" }}
                      >
                        D{day.dayNumber}
                      </div>
                      <div>
                        <div className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--color-txt-white)" }}>
                          <span>{day.title || `Day ${day.dayNumber}`}</span>
                        </div>
                        <div className="text-xs" style={{ color: "var(--color-txt-muted)" }}>
                          {formatDate(day.date)} • {day.items.length} {day.items.length === 1 ? "activity" : "activities"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Reset Order */}
                      {day.items.length > 1 && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleResetDayOrder(day.id); }}
                          className="p-1.5 rounded-lg opacity-80 hover:opacity-100 transition-opacity flex items-center gap-1"
                          style={{ background: "rgba(96, 165, 250, 0.1)", border: "none", cursor: "pointer" }}
                          title="Reset timeline: Auto-sort activities chronologically by time"
                        >
                          <RotateCcw size={14} style={{ color: "#60a5fa" }} />
                        </button>
                      )}
                      {/* Edit day */}
                      <button
                        onClick={(e) => { e.stopPropagation(); startEditDay(day); }}
                        className="p-1.5 rounded-lg opacity-80 hover:opacity-100 transition-opacity"
                        style={{ background: "rgba(45,212,168,0.1)", border: "none", cursor: "pointer" }}
                        title="Edit day title & notes"
                      >
                        <StickyNote size={14} style={{ color: "var(--color-primary)" }} />
                      </button>
                      {/* Delete day */}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteDay(day.id); }}
                        className="p-1.5 rounded-lg opacity-80 hover:opacity-100 transition-opacity"
                        style={{ background: "rgba(248,113,113,0.1)", border: "none", cursor: "pointer" }}
                        title="Delete day"
                      >
                        <Trash2 size={14} style={{ color: "#f87171" }} />
                      </button>
                      {isExpanded ? (
                        <ChevronDown size={18} style={{ color: "var(--color-txt-muted)" }} />
                      ) : (
                        <ChevronRight size={18} style={{ color: "var(--color-txt-muted)" }} />
                      )}
                    </div>
                  </div>

                  {/* Inline day edit form */}
                  {isDayEditing && (
                    <div className="px-4 pb-3 space-y-2" style={{ borderTop: "1px solid var(--color-line)" }}>
                      <input
                        placeholder="Day title"
                        value={editDayForm.title}
                        onChange={(e) => setEditDayForm({ ...editDayForm, title: e.target.value })}
                        className="t-input mt-3"
                        autoFocus
                        style={{ padding: "8px 12px", fontSize: "0.85rem" }}
                      />
                      <textarea
                        placeholder="Notes for this day..."
                        value={editDayForm.notes}
                        onChange={(e) => setEditDayForm({ ...editDayForm, notes: e.target.value })}
                        className="t-input"
                        rows={2}
                        style={{ resize: "none", padding: "8px 12px", fontSize: "0.85rem" }}
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={(e) => { e.stopPropagation(); setEditingDay(null); }}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-txt-muted)", fontSize: "0.85rem" }}
                        >
                          <X size={14} className="inline mr-1" /> Cancel
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleUpdateDay(day.id); }}
                          disabled={saving}
                          className="t-btn-primary"
                          style={{ padding: "6px 14px", fontSize: "0.8rem" }}
                        >
                          {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Save
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Day content (items) */}
                  {isExpanded && !isDayEditing && (
                    <div className="px-4 pb-4 space-y-2" style={{ borderTop: "1px solid var(--color-line)" }}>
                      {day.notes && (
                        <p className="text-xs pt-3 pb-1 italic" style={{ color: "var(--color-txt-secondary)" }}>
                          {day.notes}
                        </p>
                      )}

                      {day.items.length === 0 && !addingItem && (
                        <div className="text-center py-6">
                          <p className="text-sm" style={{ color: "var(--color-txt-muted)" }}>
                            No activities yet. Start planning this day!
                          </p>
                        </div>
                      )}

                      {day.items.map((item, idx) => {
                        const cat = categoryConfig[item.category] || categoryConfig.ACTIVITY;
                        const CatIcon = cat.icon;
                        const isEditing = editingItem === item.id;
                        const conflict = isTimeConflict(day.items, idx);
                        const isBeingDraggedOver = dragOverIndex?.dayId === day.id && dragOverIndex?.index === idx;

                        if (isEditing) {
                          return (
                            <div
                              key={item.id}
                              className="rounded-lg p-3 space-y-3"
                              style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-line-active)" }}
                            >
                              <input
                                placeholder="Activity title *"
                                value={itemForm.title}
                                onChange={(e) => setItemForm({ ...itemForm, title: e.target.value })}
                                className="t-input"
                                style={{ padding: "10px 14px", fontSize: "0.85rem" }}
                              />
                              <div className="grid grid-cols-2 gap-2">
                                <input
                                  type="time"
                                  value={itemForm.startTime}
                                  onChange={(e) => setItemForm({ ...itemForm, startTime: e.target.value })}
                                  className="t-input"
                                  style={{ padding: "8px 12px", fontSize: "0.85rem" }}
                                />
                                <input
                                  type="time"
                                  value={itemForm.endTime}
                                  onChange={(e) => setItemForm({ ...itemForm, endTime: e.target.value })}
                                  className="t-input"
                                  style={{ padding: "8px 12px", fontSize: "0.85rem" }}
                                />
                              </div>
                              <input
                                placeholder="Location"
                                value={itemForm.location}
                                onChange={(e) => setItemForm({ ...itemForm, location: e.target.value })}
                                className="t-input"
                                style={{ padding: "10px 14px", fontSize: "0.85rem" }}
                              />
                              <textarea
                                placeholder="Description / Notes (optional)"
                                value={itemForm.description}
                                onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                                className="t-input"
                                rows={2}
                                style={{ resize: "none", padding: "10px 14px", fontSize: "0.85rem" }}
                              />
                              <div className="flex flex-wrap gap-2">
                                {Object.entries(categoryConfig).map(([key, cfg]) => {
                                  const Icon = cfg.icon;
                                  return (
                                    <button
                                      key={key}
                                      onClick={() => setItemForm({ ...itemForm, category: key })}
                                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                                      style={{
                                        background: itemForm.category === key ? `${cfg.color}20` : "var(--color-bg-deep)",
                                        border: `1px solid ${itemForm.category === key ? cfg.color : "var(--color-line)"}`,
                                        color: itemForm.category === key ? cfg.color : "var(--color-txt-muted)",
                                        cursor: "pointer",
                                      }}
                                    >
                                      <Icon size={12} /> {cfg.label}
                                    </button>
                                  );
                                })}
                              </div>
                              <div className="flex gap-2 justify-end">
                                <button
                                  onClick={() => { setEditingItem(null); setItemForm({ title: "", description: "", location: "", startTime: "", endTime: "", category: "ACTIVITY" }); }}
                                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-txt-muted)", fontSize: "0.85rem" }}
                                >
                                  <X size={14} className="inline mr-1" /> Cancel
                                </button>
                                <button
                                  onClick={() => handleUpdateItem(item.id)}
                                  disabled={saving || !itemForm.title.trim()}
                                  className="t-btn-primary"
                                  style={{ padding: "6px 14px", fontSize: "0.8rem" }}
                                >
                                  {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Save
                                </button>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div
                            key={item.id}
                            draggable={!editingItem && !saving}
                            onDragStart={() => setDraggedItem({ dayId: day.id, index: idx })}
                            onDragOver={(e) => { e.preventDefault(); setDragOverIndex({ dayId: day.id, index: idx }); }}
                            onDragLeave={() => setDragOverIndex(null)}
                            onDrop={(e) => {
                              e.preventDefault();
                              if (draggedItem && draggedItem.dayId === day.id && draggedItem.index !== idx) {
                                handleDragSwap(day.id, draggedItem.index, idx);
                              }
                              setDraggedItem(null);
                              setDragOverIndex(null);
                            }}
                            onDragEnd={() => { setDraggedItem(null); setDragOverIndex(null); }}
                            className="group flex items-start gap-3 rounded-lg p-3 transition-all cursor-grab active:cursor-grabbing"
                            style={{
                              background: conflict ? "rgba(245, 158, 11, 0.06)" : "var(--color-bg-deep)",
                              border: isBeingDraggedOver
                                ? "2px dashed var(--color-primary)"
                                : conflict
                                ? "1px solid rgba(245, 158, 11, 0.4)"
                                : "1px solid var(--color-line)",
                            }}
                          >
                            {/* Reorder grip & buttons */}
                            <div className="flex flex-col gap-0.5 pt-1 opacity-70 hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleMoveItem(day.id, idx, "up")}
                                disabled={idx === 0}
                                style={{ background: "none", border: "none", cursor: idx === 0 ? "default" : "pointer", padding: "2px" }}
                                title="Move up (swaps time slot)"
                              >
                                <ArrowUp size={12} style={{ color: idx === 0 ? "var(--color-txt-dim)" : "var(--color-txt-muted)" }} />
                              </button>
                              <span title="Hold & drag to reorder" className="flex items-center justify-center">
                                <GripVertical size={13} style={{ color: "var(--color-primary)" }} />
                              </span>
                              <button
                                onClick={() => handleMoveItem(day.id, idx, "down")}
                                disabled={idx === day.items.length - 1}
                                style={{ background: "none", border: "none", cursor: idx === day.items.length - 1 ? "default" : "pointer", padding: "2px" }}
                                title="Move down (swaps time slot)"
                              >
                                <ArrowDown size={12} style={{ color: idx === day.items.length - 1 ? "var(--color-txt-dim)" : "var(--color-txt-muted)" }} />
                              </button>
                            </div>

                            {/* Category icon */}
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                              style={{ background: `${cat.color}15`, border: `1px solid ${cat.color}30` }}
                            >
                              <CatIcon size={14} style={{ color: cat.color }} />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="text-sm font-medium flex items-center gap-2" style={{ color: "var(--color-txt-white)" }}>
                                    <span>{item.title}</span>
                                    {conflict && (
                                      <span
                                        className="text-[10px] font-semibold px-2 py-0.5 rounded flex items-center gap-1"
                                        style={{ background: "rgba(245, 158, 11, 0.2)", color: "#f59e0b", border: "1px solid rgba(245, 158, 11, 0.4)" }}
                                      >
                                        ⚠️ Time Conflict
                                      </span>
                                    )}
                                  </div>
                                  {item.location && (
                                    <div className="flex items-center gap-1 text-xs mt-0.5" style={{ color: "var(--color-txt-secondary)" }}>
                                      <MapPin size={10} /> {item.location}
                                    </div>
                                  )}
                                  {(item.startTime || item.endTime) && (
                                    <div className="flex items-center gap-1 text-xs mt-0.5" style={{ color: conflict ? "#f59e0b" : "var(--color-txt-muted)" }}>
                                      <Clock size={10} />
                                      {item.startTime && item.startTime.substring(0, 5)}
                                      {item.startTime && item.endTime && " – "}
                                      {item.endTime && item.endTime.substring(0, 5)}
                                    </div>
                                  )}
                                </div>

                                {/* Actions - Always Visible */}
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => startEditItem(item)}
                                    className="p-1.5 rounded-lg transition-transform hover:scale-105"
                                    style={{ background: "rgba(45,212,168,0.15)", border: "1px solid rgba(45,212,168,0.3)", cursor: "pointer" }}
                                    title="Edit activity"
                                  >
                                    <Edit3 size={13} style={{ color: "var(--color-primary)" }} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteItem(item.id)}
                                    className="p-1.5 rounded-lg transition-transform hover:scale-105"
                                    style={{ background: "rgba(248,113,113,0.15)", border: "1px solid rgba(248,113,113,0.3)", cursor: "pointer" }}
                                    title="Delete activity"
                                  >
                                    <Trash2 size={13} style={{ color: "#f87171" }} />
                                  </button>
                                </div>
                              </div>
                              {item.description && (
                                <p className="text-xs mt-1" style={{ color: "var(--color-txt-muted)" }}>{item.description}</p>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {/* Add item form */}
                      {addingItem === day.id ? (
                        <div
                          className="rounded-lg p-3 space-y-3"
                          style={{ background: "var(--color-bg-elevated)", border: "1px dashed var(--color-line-active)" }}
                        >
                          <input
                            placeholder="Activity title *"
                            value={itemForm.title}
                            onChange={(e) => setItemForm({ ...itemForm, title: e.target.value })}
                            className="t-input"
                            autoFocus
                            style={{ padding: "10px 14px", fontSize: "0.85rem" }}
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="time"
                              value={itemForm.startTime}
                              onChange={(e) => setItemForm({ ...itemForm, startTime: e.target.value })}
                              className="t-input"
                              placeholder="Start time"
                              style={{ padding: "8px 12px", fontSize: "0.85rem" }}
                            />
                            <input
                              type="time"
                              value={itemForm.endTime}
                              onChange={(e) => setItemForm({ ...itemForm, endTime: e.target.value })}
                              className="t-input"
                              placeholder="End time"
                              style={{ padding: "8px 12px", fontSize: "0.85rem" }}
                            />
                          </div>
                          <input
                            placeholder="Location"
                            value={itemForm.location}
                            onChange={(e) => setItemForm({ ...itemForm, location: e.target.value })}
                            className="t-input"
                            style={{ padding: "10px 14px", fontSize: "0.85rem" }}
                          />
                          <textarea
                            placeholder="Description (optional)"
                            value={itemForm.description}
                            onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                            className="t-input"
                            rows={2}
                            style={{ resize: "none", padding: "10px 14px", fontSize: "0.85rem" }}
                          />
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(categoryConfig).map(([key, cfg]) => {
                              const Icon = cfg.icon;
                              return (
                                <button
                                  key={key}
                                  onClick={() => setItemForm({ ...itemForm, category: key })}
                                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                                  style={{
                                    background: itemForm.category === key ? `${cfg.color}20` : "var(--color-bg-deep)",
                                    border: `1px solid ${itemForm.category === key ? cfg.color : "var(--color-line)"}`,
                                    color: itemForm.category === key ? cfg.color : "var(--color-txt-muted)",
                                    cursor: "pointer",
                                  }}
                                >
                                  <Icon size={12} /> {cfg.label}
                                </button>
                              );
                            })}
                          </div>
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => {
                                setAddingItem(null);
                                setItemForm({ title: "", description: "", location: "", startTime: "", endTime: "", category: "ACTIVITY" });
                              }}
                              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-txt-muted)", fontSize: "0.85rem" }}
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleAddItem(day.id)}
                              disabled={saving || !itemForm.title.trim()}
                              className="t-btn-primary"
                              style={{ padding: "6px 14px", fontSize: "0.8rem" }}
                            >
                              {saving ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />} Add
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setAddingItem(day.id);
                            setItemForm({ title: "", description: "", location: "", startTime: "", endTime: "", category: "ACTIVITY" });
                          }}
                          className="w-full py-2.5 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1"
                          style={{
                            background: "transparent",
                            border: "1px dashed var(--color-line-hover)",
                            color: "var(--color-txt-muted)",
                            cursor: "pointer",
                          }}
                        >
                          <Plus size={14} /> Add Activity
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {days.length === 0 && (
        <div className="text-center py-16">
          <Calendar size={48} className="mx-auto mb-4" style={{ color: "var(--color-txt-dim)" }} />
          <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--color-txt-white)" }}>No Itinerary Yet</h3>
          <p className="text-sm mb-4" style={{ color: "var(--color-txt-muted)" }}>
            Days are automatically created based on your trip dates. Refresh to get started!
          </p>
        </div>
      )}
    </div>
  );
}
