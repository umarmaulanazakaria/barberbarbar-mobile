import type { Booking, RingkasanBooking } from "../tipe/booking";
import type { Pesanan } from "../tipe/pesanan";
import { batasKonfirmasi } from "./aturanBooking";
import { ambilDaftarBooking, ambilDetailBooking, ambilPembayaranBooking } from "./booking";
import { ambilSemuaPesanan } from "./pesanan";

const SEHARI = 86_400_000;
const WIB = 7 * 3_600_000;
export function hariOperasional(waktu = Date.now()) {
  const tanggal = new Date(waktu + WIB);
  const tahun = tanggal.getUTCFullYear(), bulan = tanggal.getUTCMonth() + 1, hari = tanggal.getUTCDate();
  const mulai = Date.UTC(tahun, bulan - 1, hari) - WIB;
  return { tahun, bulan, hari, mulai, akhir: mulai + SEHARI,
    kunci: `${tahun}-${String(bulan).padStart(2, "0")}-${String(hari).padStart(2, "0")}` };
}
export function padaHariIni(iso: string, sekarang = Date.now()) {
  const waktu = Date.parse(iso), hari = hariOperasional(sekarang);
  return waktu >= hari.mulai && waktu < hari.akhir;
}
export function bookingHariIni(daftar: Booking[], sekarang: number, cari = "") {
  const kata = cari.trim().toLowerCase();
  return daftar.filter(b => padaHariIni(b.mulaiPada, sekarang) &&
    `${b.pelanggan.nama} ${b.nomorBooking} ${b.status}`.toLowerCase().includes(kata))
    .sort((a, b) => Date.parse(a.mulaiPada) - Date.parse(b.mulaiPada));
}
export type EntriOperasional = {
  kunci: string;
  asal: "Booking" | "Walk-in";
  jadwal: string;
  booking: Booking | null;
  pesanan: Pesanan | null;
  pembayaran?: RingkasanBooking;
};
export function gabungkanOperasional(booking: Booking[], pesanan: Pesanan[],
  pembayaran: ReadonlyMap<number, RingkasanBooking> = new Map()): EntriOperasional[] {
  const semuaBooking = new Map(booking.map(b => [b.id, b]));
  const semuaPesanan = new Map(pesanan.map(p => [p.id, p]));
  const menurutBooking = new Map<number, Pesanan>();
  const terkait = new Set<number>();
  for (const p of semuaPesanan.values()) {
    if (p.booking) { menurutBooking.set(p.booking.id, p); terkait.add(p.id); }
  }
  const hasil: EntriOperasional[] = [];
  for (const b of semuaBooking.values()) {
    const p = (b.pesananId === null ? undefined : semuaPesanan.get(b.pesananId)) ?? menurutBooking.get(b.id);
    if (p) terkait.add(p.id);
    hasil.push({kunci: `booking:${b.id}`, asal: "Booking", jadwal: b.mulaiPada,
      booking: b, pesanan: p ?? null, pembayaran: pembayaran.get(b.id)});
  }
  for (const p of semuaPesanan.values()) {
    // Relasi booking harus dilengkapi adapter; jangan menyamarkannya sebagai walk-in.
    if (terkait.has(p.id)) continue;
    hasil.push({kunci: `pesanan:${p.id}`, asal: "Walk-in", jadwal: p.checkInTime ?? p.dibuatPada,
      booking: null, pesanan: p});
  }
  return hasil;
}
export function daftarAktif(daftar: EntriOperasional[], sekarang: number) {
  return daftar.filter(e => {
    if (e.booking) {
      const b = e.booking;
      if (b.status === "PENDING_CONFIRMATION") return sekarang < batasKonfirmasi(b) && sekarang < Date.parse(b.mulaiPada);
      if (["CONFIRMED", "CHECKED_IN", "IN_SERVICE"].includes(b.status)) return true;
      // Ringkasan ledger dari backend menentukan lunas; kegagalan baca tetap dapat ditindaklanjuti.
      return b.status === "COMPLETED" && e.pembayaran?.statusPembayaran !== "PAID";
    }
    const p = e.pesanan;
    return !!p && (["WAITING", "IN_SERVICE"].includes(p.status) || (p.status === "COMPLETED" && p.statusPembayaran !== "PAID"));
  }).sort((a, b) => {
    const tenggat = (e: EntriOperasional) => e.booking?.status === "PENDING_CONFIRMATION" ? batasKonfirmasi(e.booking) : Infinity;
    return tenggat(a) - tenggat(b) || Date.parse(a.jadwal) - Date.parse(b.jadwal) || a.kunci.localeCompare(b.kunci);
  });
}
export function riwayatOperasional(daftar: EntriOperasional[], sekarang: number) {
  return daftar.filter(e => Date.parse(e.jadwal) < hariOperasional(sekarang).mulai)
    .sort((a, b) => Date.parse(b.jadwal) - Date.parse(a.jadwal));
}
export function ruteOperasional(e: EntriOperasional) {
  return e.booking
    ? { screen: "DetailBooking" as const, params: {idBooking: e.booking.id} }
    : { screen: "DetailPesanan" as const, params: {idPesanan: e.pesanan!.id} };
}
export function tenggatOperasional(e: EntriOperasional, sekarang: number) {
  const b = e.booking;
  if (!b) return null;
  if (b.status === "PENDING_CONFIRMATION") {
    return {label: sekarang >= batasKonfirmasi(b) || sekarang >= Date.parse(b.mulaiPada)
      ? "Batas konfirmasi terlewati; menunggu pembaruan backend" : "Batas konfirmasi", waktu: batasKonfirmasi(b)};
  }
  if (b.status === "CONFIRMED" && b.deadlineDp && !e.pembayaran?.dpTerverifikasi) return {label: "Batas DP", waktu: Date.parse(b.deadlineDp)};
  if (b.status === "COMPLETED" && b.deadlinePelunasan && e.pembayaran?.statusPembayaran !== "PAID")
    return {label: "Batas pelunasan", waktu: Date.parse(b.deadlinePelunasan)};
  return null;
}
// Semua endpoint existing mengembalikan array lengkap, tanpa pagination.
// Batasi konkurensi pembacaan ringkasan; tidak ada mutasi dari penggabungan daftar.
export async function ambilOperasionalTerpadu(): Promise<EntriOperasional[]> {
  const [booking, pesanan] = await Promise.all([ambilDaftarBooking(), ambilSemuaPesanan()]);
  const idAda = new Set(booking.map(b => b.id));
  const kurang = [...new Set(pesanan.flatMap(p => p.booking && !idAda.has(p.booking.id) ? [p.booking.id] : []))];
  for (const id of kurang) booking.push(await ambilDetailBooking(id));
  const pembayaran = new Map<number, RingkasanBooking>();
  const perluRingkasan = booking.filter(b => ["CONFIRMED", "COMPLETED"].includes(b.status));
  let indeks = 0;
  await Promise.all(Array.from({length: Math.min(4, perluRingkasan.length)}, async () => {
    while (indeks < perluRingkasan.length) {
      const b = perluRingkasan[indeks++];
      try { pembayaran.set(b.id, await ambilPembayaranBooking(b.id)); }
      catch { /* Kartu tetap tampil dengan status belum dapat dimuat, bukan dianggap lunas. */ }
    }
  }));
  return gabungkanOperasional(booking, pesanan, pembayaran);
}
