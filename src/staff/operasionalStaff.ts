import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { AppState } from "react-native";
import { api, ambilPesanKesalahan } from "../layanan/api";
import { usePenyegaranRealtime } from "../hooks/usePenyegaranRealtime";
import type { EntriStaff } from "./layananStaff";

export type AktivitasStaff = EntriStaff & { bookingId: number | null; masalah?: string };
export type DashboardStaff = { serverTime: string; hariIni: string; kpi: { bookingHariIni: number; menungguCheckIn: number; sedangDilayani: number; pembayaranHariIni: number }; aktivitas: { data: AktivitasStaff[]; total: number; halaman: number; batas: number }; perhatian: { kode: string; judul: string; total: number; halaman: number; data: AktivitasStaff[] }[] };
export type ArsipStaff = EntriStaff & { statusAkhir: string; statusBackend: string; penutupan: string | null };
export type RiwayatStaffData = { data: ArsipStaff[]; total: number; halaman: number; batas: number; totalHalaman: number; tanpaWaktuPenutupan: number; hariIni: string; serverTime: string };
export type DetailArsipStaff = ArsipStaff & { nomorTelepon: string | null; catatan: string | null; alasan: string | null; items: { namaLayanan: string; qty: number; harga: number; subtotal: number }[]; pembayaran: { total: number; jumlahDibayar: number; balance: number; statusPembayaran: string; invoice: { nomorInvoice: string } | null }; riwayat: { id: number; aksi: string; sebelum: string | null; setelah: string; waktu: string }[] };

// Satu sumber REST dengan Admin; hook ini tidak membuat koneksi Socket baru.
export function useOperasionalStaff<T>(jalur: string, params: Record<string, string | number> = {}) {
  const sidik = JSON.stringify(params), versi = useRef(0), [data, aturData] = useState<T | null>(null), [memuat, aturMemuat] = useState(true), [error, aturError] = useState("");
  const muat = useCallback(async () => {
    const v = ++versi.current; aturMemuat(true); aturError("");
    try { const d = (await api.get<T>(jalur, { params: JSON.parse(sidik) as Record<string, string | number> })).data; if (v === versi.current) aturData(d); }
    catch (e) { if (v === versi.current) { aturData(null); aturError(ambilPesanKesalahan(e)); } }
    finally { if (v === versi.current) aturMemuat(false); }
  }, [jalur, sidik]);
  useFocusEffect(useCallback(() => {
    aturData(null); void muat(); const t = setInterval(() => { if (AppState.currentState === "active") void muat(); }, 15000);
    return () => { versi.current++; clearInterval(t); };
  }, [muat]));
  usePenyegaranRealtime(["beranda", "pesanan", "booking", "pembayaran", "membership", "pelanggan", "katalog"], muat);
  return { data, memuat, error, muat };
}
