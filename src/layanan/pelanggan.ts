import { api } from "./api";

import type {
  DataTambahPelanggan,
  Pelanggan,
  ResponsBuatMembership,
} from "../tipe/pelanggan";

export const ambilSemuaPelanggan = async () => {
  const { data } = await api.get<Pelanggan[]>("/pelanggan");

  return data;
};

export const ambilPelangganBerdasarkanId = async (idPelanggan: number) => {
  const { data } = await api.get<Pelanggan>(`/pelanggan/${idPelanggan}`);

  return data;
};

export const tambahPelanggan = async (dataPelanggan: DataTambahPelanggan) => {
  const { data } = await api.post<Pelanggan>("/pelanggan", dataPelanggan);

  return data;
};

export const buatMembership = async (pelangganId: number) => {
  const { data } = await api.post<ResponsBuatMembership>("/memberships", {
    pelangganId,
  });

  return data;
};
