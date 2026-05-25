import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1",
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

// Request interceptor — attach access token
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("travyn-auth");
    if (stored) {
      try {
        const { state } = JSON.parse(stored);
        if (state?.accessToken) {
          config.headers.Authorization = `Bearer ${state.accessToken}`;
        }
      } catch {}
    }
  }
  return config;
});

// Response interceptor — handle 401 and refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const stored = localStorage.getItem("travyn-auth");
        if (stored) {
          const { state } = JSON.parse(stored);
          if (state?.refreshToken) {
            const res = await axios.post(
              `${api.defaults.baseURL}/auth/refresh`,
              { refreshToken: state.refreshToken }
            );

            const { access_token, refresh_token } = res.data;

            // Update store
            const newState = {
              ...JSON.parse(stored),
              state: {
                ...state,
                accessToken: access_token,
                refreshToken: refresh_token,
              },
            };
            localStorage.setItem("travyn-auth", JSON.stringify(newState));

            originalRequest.headers.Authorization = `Bearer ${access_token}`;
            return api(originalRequest);
          }
        }
      } catch {
        // Refresh failed — clear auth and redirect
        localStorage.removeItem("travyn-auth");
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
