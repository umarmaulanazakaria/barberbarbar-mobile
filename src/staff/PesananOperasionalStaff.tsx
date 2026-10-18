import { useState } from "react";
import { Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useOperasionalStaff } from "./operasionalStaff";
import { statusStaff, type DaftarStaff } from "./layananStaff";
import { PilihanOperasional } from "./RiwayatOperasionalStaff";
import { HalamanStaff, InputStaff, KartuSlimStaff, MemuatStaff, PesanStaff, s, TombolStaff } from "./UiStaff";
import type { RuteStaff } from "./NavigasiStaff";

export default function PesananOperasionalStaff() {
  const nav = useNavigation<NativeStackNavigationProp<RuteStaff>>();
  const [jenis, aturJenis] = useState("SEMUA"), [status, aturStatus] = useState("SEMUA"), [pembayaran, aturPembayaran] = useState("SEMUA"), [periode, aturPeriode] = useState("HARI_INI"), [urutan, aturUrutan] = useState("DESC"), [halaman, aturHalaman] = useState(1), [cari, aturCari] = useState(""), [kata, aturKata] = useState(""), [mulai, aturMulai] = useState(""), [selesai, aturSelesai] = useState(""), [rentang, aturRentang] = useState<{ mulai: string; selesai: string } | null>(null);
  const [filterLanjut, aturFilterLanjut] = useState(false);
  const { data, memuat, error, muat } = useOperasionalStaff<DaftarStaff>("/management/orders", { jenis, status, pembayaran, periode, urutan, halaman, cari: kata, ...(periode === "RENTANG" ? rentang ?? {} : {}) });
  return <HalamanStaff judul="Pesanan" subjudul="Booking & Walk-in · WIB" refresh={() => void muat()} memuat={memuat}>
    <PilihanOperasional nilai={jenis} opsi={[["SEMUA", "Semua"], ["BOOKING", "Booking"], ["WALK_IN", "Walk-in"]]} ubah={v => { aturJenis(v); aturHalaman(1); }}/>
    <PilihanOperasional nilai={periode} opsi={[["HARI_INI", "Hari ini"], ["MENDATANG", "Mendatang"], ["SEMUA", "Semua jadwal"]]} ubah={v => { aturPeriode(v); aturHalaman(1); }}/>
    <PilihanOperasional nilai={status} opsi={[["SEMUA", "Semua status"], ...["WAITING", "AWAITING_DP", "PENDING_CONFIRMATION", "CONFIRMED", "CHECKED_IN", "IN_SERVICE", "COMPLETED", "CANCELLED", "REJECTED", "NO_SHOW"].map(v => [v, statusStaff[v]] as const)]} ubah={v => { aturStatus(v); aturHalaman(1); }}/>
    <TombolStaff judul={filterLanjut ? "Tutup filter lanjutan" : "Filter pembayaran, urutan dan tanggal"} sekunder aksi={() => aturFilterLanjut(v => !v)}/>
    {filterLanjut && <>
    <PilihanOperasional nilai={pembayaran} opsi={[["SEMUA", "Semua pembayaran"], ["PAID", "Lunas"], ["UNPAID", "Belum lunas"]]} ubah={v => { aturPembayaran(v); aturHalaman(1); }}/>
    <PilihanOperasional nilai={urutan} opsi={[["DESC", "Jadwal terbaru"], ["ASC", "Jadwal terawal"]]} ubah={v => { aturUrutan(v); aturHalaman(1); }}/>
    <InputStaff label="Dari tanggal (YYYY-MM-DD)" nilai={mulai} ubah={aturMulai}/><InputStaff label="Sampai tanggal (YYYY-MM-DD)" nilai={selesai} ubah={aturSelesai}/>
    <TombolStaff judul="Terapkan rentang tanggal" sekunder nonaktif={!/^\d{4}-\d{2}-\d{2}$/.test(mulai) || !/^\d{4}-\d{2}-\d{2}$/.test(selesai) || mulai > selesai} aksi={() => { aturRentang({ mulai, selesai }); aturPeriode("RENTANG"); aturHalaman(1); }}/>
    </>}
    <InputStaff label="Cari nama atau nomor pesanan" nilai={cari} ubah={aturCari}/><TombolStaff judul="Cari pesanan" sekunder aksi={() => { aturKata(cari.trim()); aturHalaman(1); }}/>
    <PesanStaff pesan={error}/>{memuat && !data && <MemuatStaff/>}
    {data?.data.map(d => <KartuSlimStaff key={`${d.jenis}-${d.id}`} data={d} buka={() => nav.navigate("DetailStaff", { jenis: d.jenis, id: d.id })}/>)}
    {data && !data.total && <Text style={s.kecil}>Tidak ada pesanan sesuai filter.</Text>}
    <View style={s.baris}><TombolStaff judul="Sebelumnya" sekunder nonaktif={memuat || halaman <= 1} aksi={() => aturHalaman(v => v - 1)}/><Text style={s.kecil}>{data?.total ?? "—"} pesanan · {halaman}</Text><TombolStaff judul="Berikutnya" sekunder nonaktif={memuat || !data || halaman * data.batas >= data.total} aksi={() => aturHalaman(v => v + 1)}/></View>
  </HalamanStaff>;
}
