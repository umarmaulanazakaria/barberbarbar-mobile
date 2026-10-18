import type { DaftarStaff, EntriStaff } from "./layananStaff";

export type TabPesanan = "SEMUA" | "AKTIF" | "SELESAI";
export type FilterPesanan = { jenis: string; periode: string; status: string; pembayaran: string; urutan: string; mulai: string; selesai: string };
export const filterAwal: FilterPesanan = { jenis: "SEMUA", periode: "HARI_INI", status: "SEMUA", pembayaran: "SEMUA", urutan: "DESC", mulai: "", selesai: "" };
type Ambil = (params: Record<string, string | number>) => Promise<DaftarStaff>;
const aktif = new Set(["WAITING", "AWAITING_DP", "PENDING_CONFIRMATION", "CONFIRMED", "CHECKED_IN", "IN_SERVICE"]);
export const tanggalValid = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && s >= "0001-01-01" && Number.isFinite(Date.parse(s)) && new Date(s).toISOString().slice(0, 10) === s;

export async function ambilPesananMinimal(ambil: Ambil, filter: FilterPesanan, tab: TabPesanan, cari: string, halaman: number): Promise<DaftarStaff> {
  // Menunggu pembayaran adalah kombinasi filter, bukan status database baru.
  const tagihan = filter.status === "COMPLETED_UNPAID", status = tagihan ? "COMPLETED" : filter.status;
  if (tab === "AKTIF" && status !== "SEMUA" && !aktif.has(status) || tab === "SELESAI" && status !== "SEMUA" && status !== "COMPLETED" || tagihan && filter.pembayaran === "PAID") throw Error("Filter status dan tab/pembayaran tidak beririsan. Sesuaikan filter untuk melihat pesanan.");
  const params = { jenis: filter.jenis, periode: filter.periode, urutan: filter.urutan, status: tab === "SELESAI" ? "COMPLETED" : status, pembayaran: tagihan ? "UNPAID" : filter.pembayaran, cari, ...(filter.periode === "RENTANG" ? { mulai: filter.mulai, selesai: filter.selesai } : {}) };
  if (tab !== "AKTIF" || status !== "SEMUA") return ambil({ ...params, halaman, batas: 20 });

  // API menerima satu status. Dua himpunan yang terpisah ini mencakup semua status aktif Backend.
  // Ambil cukup prefix dari tiap himpunan sebelum menggabungkan, bukan menyaring satu halaman.
  const jumlah = halaman * 20;
  const prefix = async (kelompok: string, status: string) => {
    const pertama = await ambil({ ...params, kelompok, status, halaman: 1, batas: 50 });
    const data = [...pertama.data];
    for (let h = 2; data.length < Math.min(jumlah, pertama.total); h++) {
      const lanjut = await ambil({ ...params, kelompok, status, halaman: h, batas: 50 });
      if (!lanjut.data.length) break;
      data.push(...lanjut.data);
    }
    return { ...pertama, data };
  };
  const [menunggu, dilayani] = await Promise.all([prefix("MENUNGGU", "SEMUA"), prefix("SEMUA", "IN_SERVICE")]);
  const gabungan = [...menunggu.data, ...dilayani.data], unik = new Map(gabungan.map(d => [`${d.jenis}:${d.id}`, d]));
  const banding = (a: EntriStaff, b: EntriStaff) => {
    const waktu = Date.parse(a.jadwal) - Date.parse(b.jadwal);
    return (filter.periode === "MENDATANG" || filter.urutan === "ASC" ? waktu : -waktu) || (a.jenis < b.jenis ? -1 : a.jenis > b.jenis ? 1 : 0) || b.id - a.id;
  };
  return { ...menunggu, data: [...unik.values()].sort(banding).slice((halaman - 1) * 20, jumlah), total: menunggu.total + dilayani.total - (gabungan.length - unik.size), halaman, batas: 20 };
}
