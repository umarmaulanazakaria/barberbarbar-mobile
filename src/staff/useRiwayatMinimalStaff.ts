import { useCallback, useRef, useState } from "react";
import { AppState } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { api, ambilPesanKesalahan } from "../layanan/api";
import { usePenyegaranRealtime } from "../hooks/usePenyegaranRealtime";
import type { ArsipStaff, RiwayatStaffData } from "./operasionalStaff";

export type FilterRiwayat = { periode: string; jenis: string; status: string; pembayaran: string; urutan: string; mulai: string; selesai: string };
export const filterRiwayatAwal: FilterRiwayat = { periode: "TIGA_PULUH_HARI", jenis: "SEMUA", status: "SEMUA", pembayaran: "SEMUA", urutan: "DESC", mulai: "", selesai: "" };
export const tanggalArsipValid = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && s >= "0001-01-01" && s <= "9998-12-31" && Number.isFinite(Date.parse(s)) && new Date(s).toISOString().slice(0, 10) === s;
export const hariPenutupan = (s: string) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(s));
export function gabungArsip(daftar: ArsipStaff[], urutan: string) {
  return [...new Map(daftar.map(d => [`${d.jenis}:${d.id}`, d])).values()].sort((a, b) => {
    const delta = Date.parse(a.penutupan ?? "") - Date.parse(b.penutupan ?? "");
    return (Number.isFinite(delta) ? urutan === "ASC" ? delta : -delta : 0) || (a.jenis < b.jenis ? -1 : a.jenis > b.jenis ? 1 : 0) || b.id - a.id;
  });
}
export function useRiwayatMinimalStaff(params: Record<string, string>) {
  const kunci = JSON.stringify(params), versi = useRef(0), controller = useRef<AbortController | null>(null), aktif = useRef(false), halaman = useRef(1), hasilRef = useRef<{ kunci: string; data: RiwayatStaffData } | null>(null);
  const [hasil, aturHasil] = useState<typeof hasilRef.current>(null), [memuat, aturMemuat] = useState(true), [tambahan, aturTambahan] = useState(false), [error, aturError] = useState("");
  const muat = useCallback(async (lebih = false): Promise<void> => {
    if (lebih && aktif.current) return;
    const lama = hasilRef.current?.kunci === kunci ? hasilRef.current.data : null;
    if (lebih && (!lama || lama.halaman >= lama.totalHalaman)) return;
    const v = ++versi.current; controller.current?.abort(); const ac = new AbortController(); controller.current = ac; aktif.current = true;
    aturMemuat(true); aturTambahan(lebih); aturError("");
    try {
      const p = JSON.parse(kunci) as Record<string, string>, target = lebih ? lama!.halaman + 1 : lama ? halaman.current : 1;
      let daftar = lebih ? [...lama!.data] : [], metadata: RiwayatStaffData | null = null;
      for (let h = lebih ? target : 1; h <= target; h++) {
        const d = (await api.get<RiwayatStaffData>("/management/history", { params: { ...p, halaman: h }, signal: ac.signal })).data;
        if (h > d.totalHalaman) { if (lebih) { await muat(); return; } break; }
        daftar.push(...d.data); metadata = d;
        if (h >= d.totalHalaman) break;
      }
      if (v === versi.current && metadata) { const data = { ...metadata, data: gabungArsip(daftar, p.urutan) }; halaman.current = metadata.halaman; const baru = { kunci, data }; hasilRef.current = baru; aturHasil(baru); }
    } catch (e) { if (v === versi.current && !ac.signal.aborted) aturError(ambilPesanKesalahan(e)); }
    finally { if (v === versi.current) { aktif.current = false; aturMemuat(false); aturTambahan(false); } }
  }, [kunci]);
  useFocusEffect(useCallback(() => { void muat(); const t = setInterval(() => { if (AppState.currentState === "active") void muat(); }, 30000); return () => { versi.current++; controller.current?.abort(); aktif.current = false; clearInterval(t); }; }, [muat]));
  usePenyegaranRealtime(["booking", "pesanan", "pembayaran", "membership", "pelanggan"], muat);
  return { data: hasil?.kunci === kunci ? hasil.data : null, memuat, tambahan, error, muat, kunci };
}
