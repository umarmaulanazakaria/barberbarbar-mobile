import { create } from "zustand";

import { api, aturPenanganSesiTidakValid } from "../layanan/api";

import {
  ambilToken,
  hapusToken,
  simpanToken,
} from "../penyimpanan/penyimpananSesi";

import type {
  Pengguna,
  ResponsLogin,
  ResponsProfil,
} from "../tipe/autentikasi";

type SesiStore = {
  pengguna: Pengguna | null;
  token: string | null;

  sedangLogin: boolean;
  sudahMemuatSesi: boolean;

  login: (email: string, kataSandi: string) => Promise<void>;

  muatSesi: () => Promise<void>;

  logout: () => Promise<void>;
};

export const useSesiStore = create<SesiStore>((set) => ({
  pengguna: null,
  token: null,

  sedangLogin: false,
  sudahMemuatSesi: false,

  login: async (email, kataSandi) => {
    set({
      sedangLogin: true,
    });

    try {
      const { data } = await api.post<ResponsLogin>("/auth/login", {
        email,
        password: kataSandi,
      });

      await simpanToken(data.token);

      set({
        pengguna: data.pengguna,

        token: data.token,
      });
    } finally {
      set({
        sedangLogin: false,
      });
    }
  },

  muatSesi: async () => {
    set({
      sudahMemuatSesi: false,
    });

    try {
      const tokenTersimpan = await ambilToken();

      if (!tokenTersimpan) {
        set({
          pengguna: null,
          token: null,
        });

        return;
      }

      const { data } = await api.get<ResponsProfil>("/auth/me");

      set({
        pengguna: data.pengguna,

        token: tokenTersimpan,
      });
    } catch {
      try {
        await hapusToken();
      } catch {
        // Session state tetap
        // dibersihkan.
      }

      set({
        pengguna: null,
        token: null,
      });
    } finally {
      set({
        sudahMemuatSesi: true,
      });
    }
  },

  logout: async () => {
    set({
      pengguna: null,
      token: null,
      sedangLogin: false,
      sudahMemuatSesi: true,
    });

    try {
      await hapusToken();
    } catch {
      // User tetap dikeluarkan
      // dari session aplikasi.
    }
  },
}));

aturPenanganSesiTidakValid(() => {
  useSesiStore.setState({
    pengguna: null,
    token: null,
    sedangLogin: false,
    sudahMemuatSesi: true,
  });
});
