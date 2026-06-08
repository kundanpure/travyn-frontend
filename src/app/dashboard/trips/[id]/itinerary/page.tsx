"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Calendar, MapPin, Clock, Plus, Trash2, Edit3,
  ChevronDown, ChevronRight, GripVertical, Loader2,
  Car, Utensils, Mountain, Hotel, Coffee, Save, X, ArrowUp, ArrowDown
} from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

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

export default function ItineraryPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const tripId = params.id as string;

  const [days, setDays] = useState<ItineraryDay[]>([]);
  const [trip, setTrip] = useState<{ startDate: string; endDate: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [addingItem, setAddingItem] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [addingDay, setAddingDay] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form states
  const [itemForm, setItemForm] = useState({
    title: "", description: "", location: "", startTime: "", endTime: "", category: "ACTIVITY",
  });
  const [dayForm, setDayForm] = useState({ date: "", title: "", notes: "" });

  const fetchItinerary = useCallback(async () => {
    try {
      const [res, tripRes] = await Promise.all([
        api.get(`/trips/${tripId}/itinerary`),
        api.get(`/trips/${tripId}`)
      ]);
      setDays(res.data || []);
      setTrip(tripRes.data);
      // Auto-expand all days on first load
      if (expandedDays.size === 0 && res.data?.length > 0) {
        setExpandedDays(new Set(res.data.map((d: ItineraryDay) => d.id)));
      }
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  }, [tripId, expandedDays.size]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
    try {
      await api.delete(`/trips/${tripId}/itinerary/items/${itemId}`);
      await fetchItinerary();
    } catch {}
  };

  const handleAddDay = async () => {
    if (!dayForm.date) return;
    setSaving(true);
    try {
      await api.post(`/trips/${tripId}/itinerary/days`, dayForm);
      setAddingDay(false);
      setDayForm({ date: "", title: "", notes: "" });
      await fetchItinerary();
    } catch {}
    setSaving(false);
  };

  const handleDeleteDay = async (dayId: string) => {
    try {
      await api.delete(`/trips/${tripId}/itinerary/days/${dayId}`);
      await fetchItinerary();
    } catch {}
  };

  const handleMoveItem = async (dayId: string, itemIndex: number, direction: "up" | "down") => {
    const day = days.find(d => d.id === dayId);
    if (!day) return;
    const items = [...day.items];
    const newIndex = direction === "up" ? itemIndex - 1 : itemIndex + 1;
    if (newIndex < 0 || newIndex >= items.length) return;
    [items[itemIndex], items[newIndex]] = [items[newIndex], items[itemIndex]];
    const itemIds = items.map(i => i.id);
    try {
      await api.put(`/trips/${tripId}/itinerary/days/${dayId}/reorder`, { itemIds });
      await fetchItinerary();
    } catch {}
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

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

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

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--color-txt-white)" }}>
            <Calendar size={24} className="inline mr-2" style={{ color: "var(--color-primary)" }} />
            Trip Itinerary
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-txt-muted)" }}>
            {days.length} days planned • {days.reduce((sum, d) => sum + d.items.length, 0)} activities
          </p>
        </div>
        <button
          onClick={() => setAddingDay(true)}
          className="t-btn-primary"
          style={{ padding: "10px 20px", fontSize: "0.85rem" }}
        >
          <Plus size={16} /> Add Day
        </button>
      </div>

      {/* Add Day Form */}
      {addingDay && (
        <div
          className="rounded-xl p-5 space-y-4"
          style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-line-active)" }}
        >
          <h3 className="text-sm font-semibold" style={{ color: "var(--color-txt-white)" }}>Add New Day</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="date"
              value={dayForm.date}
              min={trip?.startDate?.split("T")[0]}
              max={trip?.endDate?.split("T")[0]}
              onChange={(e) => setDayForm({ ...dayForm, date: e.target.value })}
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
              onClick={() => { setAddingDay(false); setDayForm({ date: "", title: "", notes: "" }); }}
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
                  <button
                    onClick={() => toggleDay(day.id)}
                    className="w-full flex items-center justify-between p-4 text-left"
                    style={{ background: "none", border: "none", cursor: "pointer" }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold"
                        style={{ background: "rgba(45,212,168,0.1)", color: "var(--color-primary)" }}
                      >
                        D{day.dayNumber}
                      </div>
                      <div>
                        <div className="text-sm font-semibold" style={{ color: "var(--color-txt-white)" }}>
                          {day.title || `Day ${day.dayNumber}`}
                        </div>
                        <div className="text-xs" style={{ color: "var(--color-txt-muted)" }}>
                          {formatDate(day.date)} • {day.items.length} {day.items.length === 1 ? "activity" : "activities"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteDay(day.id); }}
                        className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
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
                  </button>

                  {/* Day content (items) */}
                  {isExpanded && (
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

                        if (isEditing) {
                          return (
                            <div
                              key={item.id}
                              className="rounded-lg p-3 space-y-3"
                              style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-line-active)" }}
                            >
                              <input
                                placeholder="Activity title"
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
                                  disabled={saving}
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
                            className="group flex items-start gap-3 rounded-lg p-3 transition-all"
                            style={{ background: "var(--color-bg-deep)", border: "1px solid var(--color-line)" }}
                          >
                            {/* Reorder buttons */}
                            <div className="flex flex-col gap-0.5 pt-1 opacity-30 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleMoveItem(day.id, idx, "up")}
                                disabled={idx === 0}
                                style={{ background: "none", border: "none", cursor: idx === 0 ? "default" : "pointer", padding: "2px" }}
                              >
                                <ArrowUp size={12} style={{ color: idx === 0 ? "var(--color-txt-dim)" : "var(--color-txt-muted)" }} />
                              </button>
                              <GripVertical size={12} style={{ color: "var(--color-txt-dim)" }} />
                              <button
                                onClick={() => handleMoveItem(day.id, idx, "down")}
                                disabled={idx === day.items.length - 1}
                                style={{ background: "none", border: "none", cursor: idx === day.items.length - 1 ? "default" : "pointer", padding: "2px" }}
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
                                  <div className="text-sm font-medium" style={{ color: "var(--color-txt-white)" }}>
                                    {item.title}
                                  </div>
                                  {item.location && (
                                    <div className="flex items-center gap-1 text-xs mt-0.5" style={{ color: "var(--color-txt-secondary)" }}>
                                      <MapPin size={10} /> {item.location}
                                    </div>
                                  )}
                                  {(item.startTime || item.endTime) && (
                                    <div className="flex items-center gap-1 text-xs mt-0.5" style={{ color: "var(--color-txt-muted)" }}>
                                      <Clock size={10} />
                                      {item.startTime && item.startTime.substring(0, 5)}
                                      {item.startTime && item.endTime && " – "}
                                      {item.endTime && item.endTime.substring(0, 5)}
                                    </div>
                                  )}
                                </div>

                                {/* Actions */}
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => startEditItem(item)}
                                    className="p-1.5 rounded-lg"
                                    style={{ background: "rgba(45,212,168,0.1)", border: "none", cursor: "pointer" }}
                                  >
                                    <Edit3 size={12} style={{ color: "var(--color-primary)" }} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteItem(item.id)}
                                    className="p-1.5 rounded-lg"
                                    style={{ background: "rgba(248,113,113,0.1)", border: "none", cursor: "pointer" }}
                                  >
                                    <Trash2 size={12} style={{ color: "#f87171" }} />
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
            Plan your trip day by day. Activities will be auto-created when you first load.
          </p>
        </div>
      )}
    </div>
  );
}
