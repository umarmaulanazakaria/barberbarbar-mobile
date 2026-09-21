import axios from "axios";

import { ambilToken, hapusToken } from "../penyimpanan/penyimpananSesi";

const alamatApi = process.env.EXPO_PUBLIC_API_URL;

if (!alamatApi) {
  throw new Error("EXPO_PUBLIC_API_URL belum diatur.");
}

type PenanganSesiTidakValid = () => void | Promise<void>;

let penanganSesiTidakValid: PenanganSesiTidakValid | null = null;

export const aturPenanganSesiTidakValid = (
  penangan: PenanganSesiTidakValid,
) => {
  penanganSesiTidakValid = penangan;
};

export const api = axios.create({
  baseURL: alamatApi,
  timeout: 10000,
});

api.interceptors.request.use(async (konfigurasi) => {
  const token = await ambilToken();

  if (token) {
    konfigurasi.headers.Authorization = `Bearer ${token}`;
  }

  return konfigurasi;
});

api.interceptors.response.use(
  (response) => response,

  async (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const url = error.config?.url ?? "";

      const adalahLogin = url.includes("/auth/login");

      if (!adalahLogin) {
        try {
          await hapusToken();
        } catch {
          // State aplikasi tetap
          // akan dibersihkan.
        }

        if (penanganSesiTidakValid) {
          await penanganSesiTidakValid();
        }
      }
    }

    return Promise.reject(error);
  },
);

const memilikiPesan = (data: unknown): data is { pesan: string } => {
  return (
    typeof data === "object" &&
    data !== null &&
    "pesan" in data &&
    typeof data.pesan === "string"
  );
};

export const ambilPesanKesalahan = (error: unknown) => {
  if (!axios.isAxiosError(error)) {
    return "Terjadi kesalahan. Silakan coba lagi.";
  }

  if (!error.response) {
    return "Tidak dapat terhubung ke BARBER BARBAR.";
  }

  if (error.response.status === 401) {
    const url = error.config?.url ?? "";

    if (url.includes("/auth/login")) {
      return "Email atau kata sandi tidak sesuai.";
    }

    return "Sesi telah berakhir. Silakan masuk kembali.";
  }

  if (memilikiPesan(error.response.data)) {
    return error.response.data.pesan;
  }

  if (error.response.status === 400) {
    return "Periksa kembali data yang dimasukkan.";
  }

  if (error.response.status === 403) {
    return "Akun tidak memiliki akses.";
  }

  if (error.response.status === 404) {
    return "Data tidak ditemukan.";
  }

  if (error.response.status === 409) {
    return "Data sudah digunakan.";
  }

  return "Terjadi kesalahan. Silakan coba lagi.";
};
