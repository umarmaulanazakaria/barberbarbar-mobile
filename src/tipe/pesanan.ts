import type { Barber } from "./barber";

import type { Layanan } from "./layanan";

import type { Pelanggan } from "./pelanggan";

export type StatusPesanan =
  | "WAITING"
  | "IN_SERVICE"
  | "COMPLETED"
  | "CANCELLED";

export type StatusPembayaran = "UNPAID" | "PAID";

export type MetodePembayaran = "CASH" | "QRIS" | "CARD" | "TRANSFER" | "OTHER";

export type PenggunaRiwayat = {
  id: number;
  name: string;
  role: "ADMIN" | "STAFF";
};

export type ItemPesananDasar = {
  id: number;
  pesananId: number;
  layananId: number;

  namaLayanan: string;
  durasiMenit: number;
  harga: number;
  qty: number;
  subtotal: number;
};

export type ItemPesanan = ItemPesananDasar & {
  layanan: Layanan;
};

export type Pembayaran = {
  id: number;
  pesananId: number;
  nomorInvoice: string;

  metode: MetodePembayaran;

  jumlahDiterima: number;
  kembalian: number;

  catatan: string | null;
  dibayarPada: string;
};

export type RiwayatStatusPesanan = {
  id: number;
  pesananId: number;

  status: StatusPesanan;

  penggunaId: number | null;

  diubahPada: string;

  pengguna: PenggunaRiwayat | null;
};

export type Pesanan = {
  id: number;
  nomorPesanan: string;

  pelangganId: number;
  barberId: number | null;

  status: StatusPesanan;
  statusPembayaran: StatusPembayaran;

  checkInTime: string;
  catatan: string | null;

  subtotal: number;
  discountPercent: number;
  diskon: number;
  total: number;

  dibuatPada: string;
  diperbaruiPada: string;

  pelanggan: Pelanggan;
  barber: Barber | null;

  items: ItemPesanan[];

  pembayaran: Pembayaran | null;

  riwayatStatus: RiwayatStatusPesanan[];
};

export type PelangganPesananRingkas = Omit<Pelanggan, "membership">;

export type PesananDashboard = Omit<
  Pesanan,
  "pelanggan" | "items" | "riwayatStatus"
> & {
  pelanggan: PelangganPesananRingkas;

  items: ItemPesananDasar[];
};

export type ItemTambahPesanan = {
  layananId: number;
  qty: number;
};

export type DataTambahPesanan = {
  pelangganId: number;
  barberId: number;

  items: ItemTambahPesanan[];

  catatan?: string;
};

export type ResponsTambahPesanan = {
  pesan: string;
  data: Pesanan;
};

export type ResponsUbahStatusPesanan = {
  pesan: string;
  data: Pesanan;
};

export type DataPembayaran = {
  metode: MetodePembayaran;
  jumlahDiterima: number;
  catatan?: string;
};

export type ResponsPembayaran = {
  pesan: string;

  data: {
    pembayaran: Pembayaran;
    pesanan: Pesanan;
  };
};

export type DataTambahItemPesanan = {
  pesananId: number;
  layananId: number;
  qty: number;
};

export type DataUbahItemPesanan = {
  layananId?: number;
  qty?: number;
};

export type ResponsItemPesanan = {
  pesan: string;
  data: ItemPesananDasar;
};
