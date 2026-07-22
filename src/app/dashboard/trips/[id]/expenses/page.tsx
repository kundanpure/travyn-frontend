"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, DollarSign, Plus, Trash2, Loader2,
  Utensils, Car, Hotel, Mountain, ShoppingBag, MoreHorizontal,
  ArrowRightLeft, TrendingUp, PieChart, X, Users, CheckCircle2, Edit2, Info
} from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

const categoryConfig: Record<string, { icon: typeof Utensils; color: string; label: string }> = {
  FOOD: { icon: Utensils, color: "#f59e0b", label: "Food" },
  TRANSPORT: { icon: Car, color: "#60a5fa", label: "Transport" },
  ACCOMMODATION: { icon: Hotel, color: "#a78bfa", label: "Stay" },
  ACTIVITY: { icon: Mountain, color: "#2dd4a8", label: "Activity" },
  SHOPPING: { icon: ShoppingBag, color: "#f472b6", label: "Shopping" },
  OTHER: { icon: MoreHorizontal, color: "#94a3b8", label: "Other" },
};

interface ExpenseSplit {
  id: string;
  userId: string;
  userName: string;
  amount: number;
}

interface Expense {
  id: string;
  tripId: string;
  paidBy: string;
  paidByName: string;
  title: string;
  amount: number;
  currency: string;
  category: string;
  splitType: string;
  date: string;
  notes?: string;
  splits: ExpenseSplit[];
  createdAt: string;
}

interface MemberSummary {
  userId: string;
  userName: string;
  totalPaid: number;
  totalOwed: number;
  netBalance: number;
}

interface ExpenseSummary {
  totalSpent: number;
  expenseCount: number;
  categoryBreakdown: Record<string, number>;
  memberSummaries: MemberSummary[];
}

interface Settlement {
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  amount: number;
}

interface TripMember {
  userId: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  profilePhotoUrl?: string;
}

interface TripSettlementHistory {
  id: string;
  tripId: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  amount: number;
  paymentMethod: string;
  status: "PENDING" | "CONFIRMED" | "REJECTED";
  notes?: string;
  rejectionReason?: string;
  createdAt: string;
}

export default function ExpensesPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const tripId = params.id as string;

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<ExpenseSummary | null>(null);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [settlementHistory, setSettlementHistory] = useState<TripSettlementHistory[]>([]);
  const [members, setMembers] = useState<TripMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"expenses" | "settlements">("expenses");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [expandedExpenseId, setExpandedExpenseId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Settlement Modal State
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [settleSubmitting, setSettleSubmitting] = useState(false);
  const [isRecipientLocked, setIsRecipientLocked] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<"ALL" | "MINE">("ALL");
  const [settleForm, setSettleForm] = useState({
    toUserId: "",
    amount: "",
    paymentMethod: "UPI" as "CASH" | "UPI" | "BANK_TRANSFER" | "OTHER",
    notes: "",
    isDirectReceipt: false,
  });
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const [form, setForm] = useState({
    title: "",
    amount: "",
    category: "FOOD",
    splitType: "EQUAL",
    date: new Date().toISOString().split("T")[0],
    notes: "",
    splitWith: [] as string[],
    customAmounts: {} as Record<string, number>,
  });

  const fetchData = useCallback(async () => {
    try {
      const [expRes, sumRes, setRes, memRes, histRes] = await Promise.all([
        api.get(`/trips/${tripId}/expenses`),
        api.get(`/trips/${tripId}/expenses/summary`),
        api.get(`/trips/${tripId}/expenses/settlements`),
        api.get(`/trips/${tripId}/members`),
        api.get(`/trips/${tripId}/expenses/settlements/history`).catch(() => ({ data: [] })),
      ]);
      setExpenses(expRes.data || []);
      setSummary(sumRes.data);
      setSettlements(setRes.data || []);
      setMembers((memRes.data || []).filter((m: TripMember) => m.status === "APPROVED"));
      setSettlementHistory(histRes.data || []);
    } catch {}
    setLoading(false);
  }, [tripId]);

  const handleRecordSettlement = async () => {
    if (!settleForm.toUserId || !settleForm.amount) return;
    setSettleSubmitting(true);
    try {
      await api.post(`/trips/${tripId}/expenses/settlements/pay`, {
        toUserId: settleForm.toUserId,
        amount: parseFloat(settleForm.amount),
        paymentMethod: settleForm.paymentMethod,
        notes: settleForm.notes || null,
        isDirectReceipt: settleForm.isDirectReceipt,
      });
      setShowSettleModal(false);
      setSettleForm({ toUserId: "", amount: "", paymentMethod: "UPI", notes: "", isDirectReceipt: false });
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to record payment.");
    } finally {
      setSettleSubmitting(false);
    }
  };

  const handleConfirmSettlement = async (settlementId: string) => {
    try {
      await api.post(`/trips/${tripId}/expenses/settlements/${settlementId}/confirm`);
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to confirm settlement.");
    }
  };

  const handleRejectSettlement = async (settlementId: string) => {
    try {
      await api.post(`/trips/${tripId}/expenses/settlements/${settlementId}/reject`, null, {
        params: { reason: rejectReason || null }
      });
      setRejectingId(null);
      setRejectReason("");
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to decline settlement.");
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  const handleSave = async () => {
    if (!form.title.trim() || !form.amount) return;
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        amount: parseFloat(form.amount),
        category: form.category,
        splitType: form.splitType,
        date: form.date,
        notes: form.notes || null,
        splitWith: form.splitWith.length > 0 ? form.splitWith : null,
        customAmounts: form.splitType === "CUSTOM" ? form.customAmounts : null,
      };

      if (editingExpenseId) {
        await api.put(`/trips/${tripId}/expenses/${editingExpenseId}`, payload);
      } else {
        await api.post(`/trips/${tripId}/expenses`, payload);
      }
      
      setShowAddForm(false);
      setEditingExpenseId(null);
      setForm({ title: "", amount: "", category: "FOOD", splitType: "EQUAL", date: new Date().toISOString().split("T")[0], notes: "", splitWith: [], customAmounts: {} });
      await fetchData();
    } catch {}
    setSaving(false);
  };

  const handleDelete = async (expenseId: string) => {
    try {
      await api.delete(`/trips/${tripId}/expenses/${expenseId}`);
      await fetchData();
    } catch {}
  };

  const myBalance = summary?.memberSummaries.find(m => m.userId === user?.id)?.netBalance ?? 0;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);

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
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm"
        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-txt-muted)" }}
      >
        <ArrowLeft size={16} /> Back to Trip
      </button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--color-txt-white)" }}>
            <DollarSign size={24} className="inline mr-2" style={{ color: "var(--color-primary)" }} />
            Trip Expenses
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-txt-muted)" }}>
            {summary?.expenseCount || 0} expenses • {formatCurrency(summary?.totalSpent || 0)} total
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="t-btn-primary"
          style={{ padding: "10px 20px", fontSize: "0.85rem" }}
        >
          <Plus size={16} /> Add Expense
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          className="rounded-xl p-4 text-center"
          style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-line)" }}
        >
          <TrendingUp size={20} className="mx-auto mb-2" style={{ color: "var(--color-primary)" }} />
          <div className="text-xs" style={{ color: "var(--color-txt-muted)" }}>Total Spent</div>
          <div className="text-xl font-bold mt-1" style={{ color: "var(--color-txt-white)" }}>
            {formatCurrency(summary?.totalSpent || 0)}
          </div>
        </div>
        <div
          className="rounded-xl p-4 text-center"
          style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-line)" }}
        >
          <PieChart size={20} className="mx-auto mb-2" style={{ color: "var(--color-accent)" }} />
          <div className="text-xs" style={{ color: "var(--color-txt-muted)" }}>Per Person (avg)</div>
          <div className="text-xl font-bold mt-1" style={{ color: "var(--color-txt-white)" }}>
            {formatCurrency(
              summary && summary.memberSummaries.length > 0
                ? summary.totalSpent / summary.memberSummaries.length
                : 0
            )}
          </div>
        </div>
        <div
          className="rounded-xl p-4 text-center"
          style={{
            background: "var(--color-bg-surface)",
            border: `1px solid ${myBalance >= 0 ? "rgba(45,212,168,0.3)" : "rgba(248,113,113,0.3)"}`,
          }}
        >
          <ArrowRightLeft size={20} className="mx-auto mb-2" style={{ color: myBalance >= 0 ? "#2dd4a8" : "#f87171" }} />
          <div className="text-xs" style={{ color: "var(--color-txt-muted)" }}>Your Balance</div>
          <div className="text-xl font-bold mt-1" style={{ color: myBalance >= 0 ? "#2dd4a8" : "#f87171" }}>
            {myBalance >= 0 ? "+" : ""}{formatCurrency(myBalance)}
          </div>
          <div className="text-xs mt-0.5" style={{ color: "var(--color-txt-dim)" }}>
            {myBalance > 0 ? "You are owed" : myBalance < 0 ? "You owe" : "All settled"}
          </div>
        </div>
      </div>

      {/* Category breakdown bar */}
      {summary && summary.totalSpent > 0 && (
        <div
          className="rounded-xl p-4"
          style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-line)" }}
        >
          <div className="text-xs font-semibold mb-3" style={{ color: "var(--color-txt-white)" }}>Category Breakdown</div>
          <div className="flex rounded-lg overflow-hidden h-3 mb-3">
            {Object.entries(summary.categoryBreakdown).map(([cat, amount]) => {
              const pct = (amount / summary.totalSpent) * 100;
              const cfg = categoryConfig[cat] || categoryConfig.OTHER;
              return (
                <div
                  key={cat}
                  style={{ width: `${pct}%`, background: cfg.color, minWidth: pct > 0 ? "4px" : "0" }}
                  title={`${cfg.label}: ${formatCurrency(amount)} (${pct.toFixed(0)}%)`}
                />
              );
            })}
          </div>
          <div className="flex flex-wrap gap-3">
            {Object.entries(summary.categoryBreakdown).map(([cat, amount]) => {
              const cfg = categoryConfig[cat] || categoryConfig.OTHER;
              const Icon = cfg.icon;
              return (
                <div key={cat} className="flex items-center gap-1.5 text-xs">
                  <div className="w-2 h-2 rounded-full" style={{ background: cfg.color }} />
                  <Icon size={11} style={{ color: cfg.color }} />
                  <span style={{ color: "var(--color-txt-secondary)" }}>{cfg.label}</span>
                  <span style={{ color: "var(--color-txt-muted)" }}>{formatCurrency(amount)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: "var(--color-bg-surface)" }}>
        {(["expenses", "settlements"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-all"
            style={{
              background: activeTab === tab ? "var(--color-bg-elevated)" : "transparent",
              color: activeTab === tab ? "var(--color-txt-white)" : "var(--color-txt-muted)",
              border: activeTab === tab ? "1px solid var(--color-line)" : "1px solid transparent",
              cursor: "pointer",
            }}
          >
            {tab === "expenses" ? `Expenses (${expenses.length})` : `Settle Up (${settlements.length})`}
          </button>
        ))}
      </div>

      {/* Add Expense Form */}
      {showAddForm && (
        <div
          className="rounded-xl p-5 space-y-4"
          style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-line-active)" }}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold" style={{ color: "var(--color-txt-white)" }}>{editingExpenseId ? "Edit Expense" : "Add Expense"}</h3>
            <button onClick={() => { setShowAddForm(false); setEditingExpenseId(null); setForm({ title: "", amount: "", category: "FOOD", splitType: "EQUAL", date: new Date().toISOString().split("T")[0], notes: "", splitWith: [], customAmounts: {} }); }} style={{ background: "none", border: "none", cursor: "pointer" }}>
              <X size={18} style={{ color: "var(--color-txt-muted)" }} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              placeholder="What was it for? *"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="t-input"
              autoFocus
            />
            <input
              type="number"
              placeholder="Amount (₹) *"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="t-input"
              min="0"
              step="0.01"
            />
          </div>

          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className="t-input"
          />

          {/* Category picker */}
          <div>
            <div className="text-xs font-medium mb-2" style={{ color: "var(--color-txt-secondary)" }}>Category</div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(categoryConfig).map(([key, cfg]) => {
                const Icon = cfg.icon;
                return (
                  <button
                    key={key}
                    onClick={() => setForm({ ...form, category: key })}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all"
                    style={{
                      background: form.category === key ? `${cfg.color}20` : "var(--color-bg-deep)",
                      border: `1px solid ${form.category === key ? cfg.color : "var(--color-line)"}`,
                      color: form.category === key ? cfg.color : "var(--color-txt-muted)",
                      cursor: "pointer",
                    }}
                  >
                    <Icon size={14} /> {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Split type */}
          <div>
            <div className="text-xs font-medium mb-2" style={{ color: "var(--color-txt-secondary)" }}>Split Type</div>
            <div className="flex gap-2">
              {[
                { key: "EQUAL", label: "Split Equally" },
                { key: "CUSTOM", label: "Split Individually" },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setForm({ ...form, splitType: key })}
                  className="flex-1 py-2 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: form.splitType === key ? "rgba(45,212,168,0.1)" : "var(--color-bg-deep)",
                    border: `1px solid ${form.splitType === key ? "var(--color-primary)" : "var(--color-line)"}`,
                    color: form.splitType === key ? "var(--color-primary)" : "var(--color-txt-muted)",
                    cursor: "pointer",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Split with members */}
          <div>
            {form.splitType !== "CUSTOM" && (
              <>
                <div className="text-xs font-medium mb-2" style={{ color: "var(--color-txt-secondary)" }}>
                  <Users size={12} className="inline mr-1" /> Split with (leave empty for all members)
                </div>
                <div className="flex flex-wrap gap-2 mb-2">
                  {members.map((m) => {
                    const selected = form.splitWith.includes(m.userId);
                    return (
                      <button
                        key={m.userId}
                        onClick={() => {
                          setForm({
                            ...form,
                            splitWith: selected
                              ? form.splitWith.filter(id => id !== m.userId)
                              : [...form.splitWith, m.userId],
                          });
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                        style={{
                          background: selected ? "rgba(45,212,168,0.1)" : "var(--color-bg-deep)",
                          border: `1px solid ${selected ? "var(--color-primary)" : "var(--color-line)"}`,
                          color: selected ? "var(--color-primary)" : "var(--color-txt-muted)",
                          cursor: "pointer",
                        }}
                      >
                        {selected && <CheckCircle2 size={11} />}
                        {m.firstName} {m.lastName}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
            
            {form.splitType === "CUSTOM" && (
              <div className="space-y-2 mt-3 p-3 rounded-lg" style={{ background: "var(--color-bg-deep)" }}>
                <div className="text-xs mb-1" style={{ color: "var(--color-txt-muted)" }}>Enter exact amounts for each person:</div>
                {members.map(m => (
                  <div key={m.userId} className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium" style={{ color: "var(--color-txt-white)" }}>{m.firstName} {m.lastName}</span>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={form.customAmounts[m.userId] || ""}
                      onChange={(e) => setForm({
                        ...form,
                        customAmounts: { ...form.customAmounts, [m.userId]: parseFloat(e.target.value) || 0 }
                      })}
                      className="t-input text-right w-24 !py-1 !text-xs"
                      min="0"
                      step="0.01"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <textarea
            placeholder="Notes (optional)"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="t-input"
            rows={2}
            style={{ resize: "none" }}
          />

          <div className="flex gap-2 justify-end">
            <button
              onClick={() => { setShowAddForm(false); setEditingExpenseId(null); setForm({ title: "", amount: "", category: "FOOD", splitType: "EQUAL", date: new Date().toISOString().split("T")[0], notes: "", splitWith: [], customAmounts: {} }); }}
              className="t-btn-outline"
              style={{ padding: "8px 16px", fontSize: "0.85rem" }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !form.title.trim() || !form.amount}
              className="t-btn-primary"
              style={{ padding: "8px 16px", fontSize: "0.85rem" }}
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : (editingExpenseId ? <CheckCircle2 size={14} /> : <Plus size={14} />)} {editingExpenseId ? "Save Changes" : "Add Expense"}
            </button>
          </div>
        </div>
      )}

      {/* Expense list */}
      {activeTab === "expenses" && (
        <div className="space-y-3">
          {expenses.length === 0 ? (
            <div className="text-center py-16">
              <DollarSign size={48} className="mx-auto mb-4" style={{ color: "var(--color-txt-dim)" }} />
              <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--color-txt-white)" }}>No Expenses Yet</h3>
              <p className="text-sm" style={{ color: "var(--color-txt-muted)" }}>
                Start tracking trip expenses. Add the first one above!
              </p>
            </div>
          ) : (
            expenses.map((expense) => {
              const cat = categoryConfig[expense.category] || categoryConfig.OTHER;
              const CatIcon = cat.icon;
              const canDelete = expense.paidBy === user?.id;

              return (
                <div
                  key={expense.id}
                  className="group rounded-xl p-4 flex flex-col gap-4"
                  style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-line)", cursor: "pointer" }}
                  onClick={() => setExpandedExpenseId(expandedExpenseId === expense.id ? null : expense.id)}
                >
                  <div className="flex items-center gap-4 w-full">
                    {/* Category icon */}
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: `${cat.color}15`, border: `1px solid ${cat.color}30` }}
                    >
                      <CatIcon size={18} style={{ color: cat.color }} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium" style={{ color: "var(--color-txt-white)" }}>
                        {expense.title}
                      </div>
                      <div className="text-xs mt-0.5" style={{ color: "var(--color-txt-muted)" }}>
                        Paid by <span style={{ color: "var(--color-txt-secondary)" }}>{expense.paidByName}</span>
                        {" • "}
                        {new Date(expense.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        {" • "}
                        Split {expense.splits.length} ways
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-bold" style={{ color: "var(--color-txt-white)" }}>
                        {formatCurrency(expense.amount)}
                      </div>
                      <div className="text-xs" style={{ color: cat.color }}>{cat.label}</div>
                    </div>

                    {/* Actions */}
                    {canDelete && (
                      <div className="flex items-center gap-1 transition-opacity flex-shrink-0" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const splitIds = expense.splits.map(s => s.userId);
                            const customAmounts: Record<string, number> = {};
                            if (expense.splitType === "CUSTOM") {
                              expense.splits.forEach(s => {
                                customAmounts[s.userId] = s.amount;
                              });
                            }
                            setForm({
                              title: expense.title,
                              amount: expense.amount.toString(),
                              category: expense.category,
                              splitType: expense.splitType || "EQUAL",
                              date: expense.date,
                              notes: expense.notes || "",
                              splitWith: splitIds.length === members.length ? [] : splitIds,
                              customAmounts
                            });
                            setEditingExpenseId(expense.id);
                            setShowAddForm(true);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                          className="p-2 rounded-lg"
                          style={{ background: "rgba(45,212,168,0.1)", border: "none", cursor: "pointer" }}
                        >
                          <Edit2 size={14} style={{ color: "#2dd4a8" }} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(expense.id);
                          }}
                          className="p-2 rounded-lg"
                          style={{ background: "rgba(248,113,113,0.1)", border: "none", cursor: "pointer" }}
                        >
                          <Trash2 size={14} style={{ color: "#f87171" }} />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {expandedExpenseId === expense.id && (
                    <div className="pt-3 mt-1" style={{ borderTop: "1px solid var(--color-line)" }} onClick={e => e.stopPropagation()}>
                      {expense.notes && (
                        <div className="text-xs mb-3 p-2 rounded-lg" style={{ background: "var(--color-bg-deep)", color: "var(--color-txt-muted)" }}>
                          <span className="font-semibold block mb-1">Notes</span>
                          {expense.notes}
                        </div>
                      )}
                      
                      <div className="text-xs font-semibold mb-2" style={{ color: "var(--color-txt-white)" }}>
                        Split Details {expense.splitType === "CUSTOM" && <span style={{ color: "var(--color-txt-dim)", fontWeight: "normal" }}>(Individual)</span>}
                      </div>
                      
                      <div className="space-y-1.5">
                        {expense.splits.map((split) => (
                          <div key={split.id} className="flex justify-between items-center text-xs">
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: "var(--color-primary-dim)", color: "var(--color-primary)" }}>
                                {split.userName ? split.userName.charAt(0).toUpperCase() : "?"}
                              </div>
                              <span style={{ color: split.userId === user?.id ? "var(--color-txt-white)" : "var(--color-txt-secondary)" }}>
                                {split.userName} {split.userId === user?.id && "(You)"}
                              </span>
                            </div>
                            <span className="font-medium" style={{ color: "var(--color-txt-white)" }}>
                              {formatCurrency(split.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Settlements */}
      {activeTab === "settlements" && (
        <div className="space-y-4">

          {/* Pending Verification Banner for Recipient */}
          {settlementHistory.filter(s => s.toUserId === user?.id && s.status === "PENDING").length > 0 && (
            <div
              className="rounded-xl p-4 space-y-3"
              style={{ background: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.3)" }}
            >
              <div className="flex items-center gap-2 text-sm font-bold" style={{ color: "#f59e0b" }}>
                <Info size={16} />
                Pending Payment Verifications ({settlementHistory.filter(s => s.toUserId === user?.id && s.status === "PENDING").length})
              </div>
              <p className="text-xs" style={{ color: "var(--color-txt-secondary)" }}>
                The following trip members have recorded a payment to you. Please confirm once you receive the funds:
              </p>
              <div className="space-y-2">
                {settlementHistory.filter(s => s.toUserId === user?.id && s.status === "PENDING").map(s => (
                  <div
                    key={s.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-lg gap-2"
                    style={{ background: "var(--color-bg-deep)", border: "1px solid var(--color-line)" }}
                  >
                    <div>
                      <div className="text-xs font-semibold" style={{ color: "var(--color-txt-white)" }}>
                        {s.fromUserName} paid you <span style={{ color: "#2dd4a8" }}>{formatCurrency(s.amount)}</span> via {s.paymentMethod}
                      </div>
                      {s.notes && (
                        <div className="text-[11px] mt-0.5" style={{ color: "var(--color-txt-muted)" }}>
                          Note: {s.notes}
                        </div>
                      )}
                    </div>

                    {rejectingId === s.id ? (
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <input
                          type="text"
                          placeholder="Reason (optional)"
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          className="t-input !py-1 !text-xs flex-1"
                        />
                        <button
                          onClick={() => handleRejectSettlement(s.id)}
                          className="px-2.5 py-1 rounded text-xs font-bold"
                          style={{ background: "#f87171", color: "white" }}
                        >
                          Confirm Decline
                        </button>
                        <button
                          onClick={() => setRejectingId(null)}
                          className="px-2 py-1 text-xs"
                          style={{ color: "var(--color-txt-muted)" }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleConfirmSettlement(s.id)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                          style={{ background: "#2dd4a8", color: "var(--color-bg-deep)" }}
                        >
                          <CheckCircle2 size={13} /> Confirm Receipt
                        </button>
                        <button
                          onClick={() => { setRejectingId(s.id); setRejectReason(""); }}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                          style={{ background: "rgba(248,113,113,0.1)", color: "#f87171", border: "1px solid rgba(248,113,113,0.2)" }}
                        >
                          Decline
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Member balances */}
          {summary && summary.memberSummaries.length > 0 && (
            <div
              className="rounded-xl p-4"
              style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-line)" }}
            >
              <div className="text-xs font-semibold mb-3" style={{ color: "var(--color-txt-white)" }}>Member Balances</div>
              <div className="space-y-2">
                {summary.memberSummaries.map((m) => {
                  const pendingItem = settlementHistory.find(s => s.status === "PENDING" && (s.fromUserId === m.userId || s.toUserId === m.userId));
                  const isFullySettled = Math.abs(m.netBalance) < 0.01 && !pendingItem;
                  return (
                    <div key={m.userId} className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                          style={{
                            background: m.userId === user?.id ? "linear-gradient(135deg, var(--color-primary), var(--color-accent))" : "var(--color-bg-elevated)",
                            color: m.userId === user?.id ? "var(--color-bg-deep)" : "var(--color-txt-secondary)",
                          }}
                        >
                          {m.userName?.split(" ").map(n => n[0]).join("").toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-medium" style={{ color: "var(--color-txt-white)" }}>
                            {m.userName} {m.userId === user?.id && <span className="text-xs" style={{ color: "var(--color-primary)" }}>(You)</span>}
                          </div>
                          <div className="text-xs" style={{ color: "var(--color-txt-muted)" }}>
                            Paid {formatCurrency(m.totalPaid)} • Owes {formatCurrency(m.totalOwed)}
                          </div>
                          {pendingItem && (
                            <div className="text-[11px] font-semibold mt-0.5" style={{ color: "#f59e0b" }}>
                              ⏳ {formatCurrency(pendingItem.amount)} payment pending confirmation
                            </div>
                          )}
                          {isFullySettled && (
                            <div className="text-[11px] font-semibold mt-0.5" style={{ color: "#2dd4a8" }}>
                              ✅ Fully Settled
                            </div>
                          )}
                        </div>
                      </div>
                      <div
                        className="text-sm font-bold"
                        style={{ color: m.netBalance >= 0 ? "#2dd4a8" : "#f87171" }}
                      >
                        {m.netBalance >= 0 ? "+" : ""}{formatCurrency(m.netBalance)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Settlement plan */}
          <div
            className="rounded-xl p-4"
            style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-line)" }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="text-xs font-semibold" style={{ color: "var(--color-txt-white)" }}>
                  <ArrowRightLeft size={14} className="inline mr-1" style={{ color: "var(--color-primary)" }} />
                  Optimized Settlements
                </div>
                <div className="group relative">
                  <Info size={14} style={{ color: "var(--color-txt-muted)", cursor: "help" }} />
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 p-2 rounded-lg text-[10px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 text-center" style={{ background: "var(--color-bg-deep)", border: "1px solid var(--color-line)", color: "var(--color-txt-secondary)", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}>
                    Calculated by finding the fewest number of transactions needed to settle everyone's debts.
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setSettleForm({ toUserId: "", amount: "", paymentMethod: "UPI", notes: "", isDirectReceipt: false });
                  setIsRecipientLocked(false);
                  setShowSettleModal(true);
                }}
                className="t-btn-primary !py-1 !px-3 !text-xs flex items-center gap-1"
              >
                <DollarSign size={13} /> Record Payment
              </button>
            </div>

            {settlements.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 size={32} className="mx-auto mb-2" style={{ color: "var(--color-primary)" }} />
                <p className="text-sm" style={{ color: "var(--color-txt-muted)" }}>
                  {expenses.length === 0 ? "No expenses to settle" : "Everyone is settled up! 🎉"}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {settlements.map((s, i) => (
                  <div
                    key={i}
                    className="flex flex-col sm:flex-row items-center justify-between p-3 rounded-xl gap-3"
                    style={{ background: "var(--color-bg-deep)", border: "1px solid var(--color-line)" }}
                  >
                    <div className="flex items-center gap-3 flex-1 w-full sm:w-auto">
                      <div className="flex flex-col items-center gap-1">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                          style={{ background: "rgba(248,113,113,0.1)", color: "#f87171" }}
                        >
                          {s.fromUserName?.split(" ").map(n => n[0]).join("").toUpperCase()}
                        </div>
                        <span className="text-[10px] text-center truncate max-w-[80px]" style={{ color: "var(--color-txt-secondary)" }}>
                          {s.fromUserName} {s.fromUserId === user?.id && "(You)"}
                        </span>
                      </div>

                      <div className="flex flex-col items-center px-2">
                        <div className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: "var(--color-txt-muted)" }}>pays</div>
                        <div className="font-bold text-sm" style={{ color: "var(--color-txt-white)" }}>
                          {formatCurrency(s.amount)}
                        </div>
                        <ArrowRightLeft size={12} className="mt-1 opacity-50" style={{ color: "var(--color-txt-muted)" }} />
                      </div>

                      <div className="flex flex-col items-center gap-1">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                          style={{ background: "rgba(45,212,168,0.1)", color: "#2dd4a8" }}
                        >
                          {s.toUserName?.split(" ").map(n => n[0]).join("").toUpperCase()}
                        </div>
                        <span className="text-[10px] text-center truncate max-w-[80px]" style={{ color: "var(--color-txt-secondary)" }}>
                          {s.toUserName} {s.toUserId === user?.id && "(You)"}
                        </span>
                      </div>
                    </div>

                    {(s.fromUserId === user?.id || s.toUserId === user?.id) && (
                      <button
                        onClick={() => {
                          setSettleForm({
                            toUserId: s.toUserId === user?.id ? s.fromUserId : s.toUserId,
                            amount: s.amount.toString(),
                            paymentMethod: "UPI",
                            notes: "",
                            isDirectReceipt: s.toUserId === user?.id,
                          });
                          setIsRecipientLocked(true);
                          setShowSettleModal(true);
                        }}
                        className="t-btn-outline !py-1.5 !px-3 !text-xs w-full sm:w-auto"
                      >
                        {s.fromUserId === user?.id ? "Record I Paid" : "Record Cash Received"}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payment Settlement History - Always Visible */}
          <div
            className="rounded-xl p-4"
            style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-line)" }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-semibold" style={{ color: "var(--color-txt-white)" }}>
                Settlement History ({settlementHistory.length})
              </div>

              {/* 2-Way Filter Toggle */}
              <div className="flex items-center p-1 rounded-lg gap-1" style={{ background: "var(--color-bg-deep)", border: "1px solid var(--color-line)" }}>
                <button
                  onClick={() => setHistoryFilter("ALL")}
                  className="px-2.5 py-1 rounded-md text-xs font-bold transition-all"
                  style={{
                    background: historyFilter === "ALL" ? "linear-gradient(135deg, var(--color-primary), var(--color-accent))" : "transparent",
                    color: historyFilter === "ALL" ? "#ffffff" : "var(--color-txt-secondary)",
                    boxShadow: historyFilter === "ALL" ? "0 2px 4px rgba(0,0,0,0.2)" : "none",
                  }}
                >
                  All Group Payments
                </button>
                <button
                  onClick={() => setHistoryFilter("MINE")}
                  className="px-2.5 py-1 rounded-md text-xs font-bold transition-all"
                  style={{
                    background: historyFilter === "MINE" ? "linear-gradient(135deg, var(--color-primary), var(--color-accent))" : "transparent",
                    color: historyFilter === "MINE" ? "#ffffff" : "var(--color-txt-secondary)",
                    boxShadow: historyFilter === "MINE" ? "0 2px 4px rgba(0,0,0,0.2)" : "none",
                  }}
                >
                  My Payments Only
                </button>
              </div>
            </div>

            {(() => {
              const filteredList = historyFilter === "MINE"
                ? settlementHistory.filter(s => s.fromUserId === user?.id || s.toUserId === user?.id)
                : settlementHistory;

              if (filteredList.length === 0) {
                return (
                  <div className="text-center py-6 text-xs" style={{ color: "var(--color-txt-muted)" }}>
                    {settlementHistory.length === 0 ? "No settlements recorded yet." : "No personal settlement history found."}
                  </div>
                );
              }

              return (
                <div className="space-y-2">
                  {filteredList.map(s => {
                    const isPending = s.status === "PENDING";
                    const isConfirmed = s.status === "CONFIRMED";
                    const isRejected = s.status === "REJECTED";
                    return (
                      <div
                        key={s.id}
                        className="flex items-center justify-between p-3 rounded-lg text-xs"
                        style={{ background: "var(--color-bg-deep)", border: "1px solid var(--color-line)" }}
                      >
                        <div>
                          <div className="font-medium" style={{ color: "var(--color-txt-white)" }}>
                            {s.fromUserName} ➔ {s.toUserName}: <span className="font-bold">{formatCurrency(s.amount)}</span> ({s.paymentMethod})
                          </div>
                          <div className="text-[11px] mt-0.5" style={{ color: "var(--color-txt-muted)" }}>
                            {new Date(s.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                            {s.notes && ` • Note: ${s.notes}`}
                            {s.rejectionReason && ` • Declined: ${s.rejectionReason}`}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 font-bold text-[11px] px-2 py-1 rounded">
                          {isConfirmed && <span style={{ color: "#2dd4a8" }}>✅ Confirmed</span>}
                          {isPending && <span style={{ color: "#f59e0b" }}>⏳ Pending</span>}
                          {isRejected && <span style={{ color: "#f87171" }}>❌ Declined</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>

        </div>
      )}

      {/* Record Settlement Modal */}
      {showSettleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div
            className="w-full max-w-md rounded-2xl p-6 space-y-4"
            style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-line)" }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold" style={{ color: "var(--color-txt-white)" }}>
                Record Settlement Payment
              </h3>
              <button onClick={() => setShowSettleModal(false)} className="p-1 text-muted hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold flex items-center justify-between mb-1" style={{ color: "var(--color-txt-secondary)" }}>
                  <span>{settleForm.isDirectReceipt ? "Paying Member" : "Recipient Member"}</span>
                  {isRecipientLocked && <span className="text-[10px] text-muted">🔒 Locked from card</span>}
                </label>
                <select
                  value={settleForm.toUserId}
                  onChange={(e) => setSettleForm({ ...settleForm, toUserId: e.target.value })}
                  disabled={isRecipientLocked}
                  className="t-input w-full disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <option value="">Select member...</option>
                  {members.filter(m => m.userId !== user?.id).map(m => (
                    <option key={m.userId} value={m.userId}>
                      {m.firstName} {m.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: "var(--color-txt-secondary)" }}>
                  Amount (INR)
                </label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={settleForm.amount}
                  onChange={(e) => setSettleForm({ ...settleForm, amount: e.target.value })}
                  className="t-input w-full"
                  min="1"
                  step="0.01"
                />
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: "var(--color-txt-secondary)" }}>
                  Payment Method
                </label>
                <div className="flex gap-2">
                  {(["UPI", "CASH", "BANK_TRANSFER", "OTHER"] as const).map(method => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setSettleForm({ ...settleForm, paymentMethod: method })}
                      className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-all"
                      style={{
                        background: settleForm.paymentMethod === method ? "var(--color-primary-dim)" : "var(--color-bg-deep)",
                        border: `1px solid ${settleForm.paymentMethod === method ? "var(--color-primary)" : "var(--color-line)"}`,
                        color: settleForm.paymentMethod === method ? "var(--color-primary)" : "var(--color-txt-muted)"
                      }}
                    >
                      {method === "UPI" ? "📱 UPI" : method === "CASH" ? "💵 Cash" : method === "BANK_TRANSFER" ? "🏦 Bank" : "💳 Other"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: "var(--color-txt-secondary)" }}>
                  Notes / Ref ID (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. UPI Ref: 4123xxxx"
                  value={settleForm.notes}
                  onChange={(e) => setSettleForm({ ...settleForm, notes: e.target.value })}
                  className="t-input w-full"
                />
              </div>

              <div className="p-3 rounded-lg text-xs" style={{ background: "var(--color-bg-deep)", color: "var(--color-txt-muted)", border: "1px solid var(--color-line)" }}>
                {settleForm.isDirectReceipt ? (
                  <span>💡 <b>Direct Receipt:</b> As the recipient logging this payment, it will be marked as <b style={{ color: "#2dd4a8" }}>Confirmed</b> immediately.</span>
                ) : (
                  <span>📩 <b>Pending Verification:</b> A confirmation request will be sent to the recipient to verify before balances update.</span>
                )}
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => setShowSettleModal(false)} className="t-btn-outline" style={{ padding: "8px 16px", fontSize: "0.85rem" }}>
                Cancel
              </button>
              <button
                onClick={handleRecordSettlement}
                disabled={settleSubmitting || !settleForm.toUserId || !settleForm.amount}
                className="t-btn-primary"
                style={{ padding: "8px 16px", fontSize: "0.85rem" }}
              >
                {settleSubmitting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} {settleForm.isDirectReceipt ? "Record & Confirm" : "Submit for Confirmation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
