import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("meetmind_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("meetmind_token");
      localStorage.removeItem("meetmind_user");
      if (window.location.pathname !== "/signin" && window.location.pathname !== "/signup" && window.location.pathname !== "/") {
        window.location.href = "/signin";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
