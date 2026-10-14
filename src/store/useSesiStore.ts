import { create } from "zustand";

import { api, aturPenanganSesiTidakValid } from "../layanan/api";

import {
  ambilToken,
  hapusToken,
  hapusTokenJikaSama,
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
let versiSesi=0;

export const useSesiStore = create<SesiStore>((set) => ({
  pengguna: null,
  token: null,

  sedangLogin: false,
  sudahMemuatSesi: false,

  login: async (email, kataSandi) => {
    const versi=++versiSesi;
    set({
      sedangLogin: true,
    });

    try {
      const { data } = await api.post<ResponsLogin>("/auth/login", {
        email,
        password: kataSandi,
      });
      if(versi!==versiSesi)return;

      await simpanToken(data.token);
      if(versi!==versiSesi){await hapusTokenJikaSama(data.token);return;}

      set({
        pengguna: data.pengguna,

        token: data.token,
      });
    } finally {
      if(versi===versiSesi)
      set({
        sedangLogin: false,
      });
    }
  },

  muatSesi: async () => {
    const versi=++versiSesi;
    set({
      sudahMemuatSesi: false,
    });

    try {
      const tokenTersimpan = await ambilToken();
      if(versi!==versiSesi)return;

      if (!tokenTersimpan) {
        set({
          pengguna: null,
          token: null,
        });

        return;
      }

      const { data } = await api.get<ResponsProfil>("/auth/me");
      if(versi!==versiSesi)return;

      set({
        pengguna: data.pengguna,

        token: tokenTersimpan,
      });
    } catch {
      if(versi!==versiSesi)return;
      try {
        await hapusToken();
      } catch {
        // Session state tetap
        // dibersihkan.
      }
      if(versi!==versiSesi)return;

      set({
        pengguna: null,
        token: null,
      });
    } finally {
      if(versi===versiSesi)
      set({
        sudahMemuatSesi: true,
      });
    }
  },

  logout: async () => {
    versiSesi++;
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

aturPenanganSesiTidakValid((token) => {
  if(useSesiStore.getState().token!==token)return;
  versiSesi++;
  useSesiStore.setState({
    pengguna: null,
    token: null,
    sedangLogin: false,
    sudahMemuatSesi: true,
  });
});
