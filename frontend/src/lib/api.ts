import axios from "axios";

const baseURL = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/v1`;

// Merkezi API istemcisi
export const api = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Resim/Dosya yükleme işlemleri için özel instance
export const uploadApi = axios.create({
  baseURL,
  timeout: 30000,
  headers: {
    "Content-Type": "multipart/form-data",
  },
});
