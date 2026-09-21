import { api } from "./api";

import type {
  DataTambahItemPesanan,
  DataUbahItemPesanan,
  ResponsItemPesanan,
} from "../tipe/pesanan";

export const tambahItemPesanan = async (dataItem: DataTambahItemPesanan) => {
  const { data } = await api.post<ResponsItemPesanan>("/order-items", dataItem);

  return data;
};

export const ubahItemPesanan = async (
  idItem: number,
  dataItem: DataUbahItemPesanan,
) => {
  const { data } = await api.patch<ResponsItemPesanan>(
    `/order-items/${idItem}`,
    dataItem,
  );

  return data;
};

export const hapusItemPesanan = async (idItem: number) => {
  const { data } = await api.delete<{
    pesan: string;
  }>(`/order-items/${idItem}`);

  return data;
};
