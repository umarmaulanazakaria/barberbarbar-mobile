import { api } from "./api";

import type {
  DataPembayaran,
  DataTambahPesanan,
  Pesanan,
  ResponsPembayaran,
  ResponsTambahPesanan,
  ResponsUbahStatusPesanan,
  StatusPesanan,
} from "../tipe/pesanan";

export const ambilPesananAktif = async () => {
  const { data } = await api.get<Pesanan[]>("/orders/active");

  return data;
};

export const ambilSemuaPesanan = async () => {
  const { data } = await api.get<Pesanan[]>("/orders");

  return data;
};

export const ambilPesananBerdasarkanId = async (idPesanan: number) => {
  const { data } = await api.get<Pesanan>(`/orders/${idPesanan}`);

  return data;
};

export const tambahPesanan = async (dataPesanan: DataTambahPesanan) => {
  const { data } = await api.post<ResponsTambahPesanan>("/orders", dataPesanan);

  return data;
};

export const ubahStatusPesanan = async (
  idPesanan: number,
  status: StatusPesanan,
  barberId?: number,
) => {
  const { data } = await api.patch<ResponsUbahStatusPesanan>(
    `/orders/${idPesanan}/status`,
    {
      status,
      ...(barberId === undefined ? {} : { barberId }),
    },
  );

  return data;
};

export const bayarPesanan = async (
  idPesanan: number,
  dataPembayaran: DataPembayaran,
) => {
  const { data } = await api.post<ResponsPembayaran>(
    `/orders/${idPesanan}/payment`,
    dataPembayaran,
  );

  return data;
};
