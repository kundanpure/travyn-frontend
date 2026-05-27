import { create } from "zustand";
import api from "@/lib/api";

export interface Notification {
  id: string;
  message: string;
  type: string;
  referenceId: string | null;
  read: boolean;
  createdAt: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  fetchNotifications: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  addNotification: (notification: Notification) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,

  fetchNotifications: async () => {
    set({ loading: true });
    try {
      const res = await api.get("/notifications?page=0&size=20");
      set({ notifications: res.data, loading: false });
    } catch (err) {
      console.error("Failed to fetch notifications", err);
      set({ loading: false });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const res = await api.get("/notifications/unread-count");
      set({ unreadCount: res.data.count });
    } catch (err) {
      console.error("Failed to fetch unread count", err);
    }
  },

  markAsRead: async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  },

  markAllAsRead: async () => {
    try {
      await api.put("/notifications/read-all");
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
        unreadCount: 0,
      }));
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  },

  addNotification: (notification: Notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },
}));
