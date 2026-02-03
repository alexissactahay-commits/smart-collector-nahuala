import axios from "axios";

const API_URL =
  process.env.REACT_APP_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_URL.endsWith("/")
    ? API_URL.slice(0, -1)
    : API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Agrega automáticamente el token JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
