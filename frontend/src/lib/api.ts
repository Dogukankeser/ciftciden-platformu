import axios from "axios";

// Merkezi API istemcisi
export const api = axios.create({
  baseURL: "http://localhost:8000/api/v1",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Resim/Dosya yükleme işlemleri için özel instance
export const uploadApi = axios.create({
  baseURL: "http://localhost:8000/api/v1",
  timeout: 30000,
  headers: {
    "Content-Type": "multipart/form-data",
  },
});
