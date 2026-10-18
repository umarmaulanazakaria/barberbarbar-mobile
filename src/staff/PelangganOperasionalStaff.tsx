import { useState } from "react";
import { Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useOperasionalStaff } from "./operasionalStaff";
import { tanggalStaff, type JenisStaff } from "./layananStaff";
import type { RuteStaff } from "./NavigasiStaff";
import { HalamanStaff, InputStaff, MemuatStaff, PanelStaff, PesanStaff, s, TombolStaff } from "./UiStaff";
type Profil = { id: number; nama: string; nomorTelepon: string | null; diarsipkanPada: string | null; jumlahKunjungan: number; kunjunganTerakhir: string | null };
type Detail = { profil: Profil; jumlahKunjungan: number; riwayatPesanan: { id: number; jenis: JenisStaff; nomor: string; status: string }[] };
function RincianPelanggan({ id, tutup }: { id: number; tutup: () => void }) {
  const nav = useNavigation<NativeStackNavigationProp<RuteStaff>>(), { data, memuat, error, muat } = useOperasionalStaff<Detail>(`/management/customers/${id}`);
  return <HalamanStaff judul="Detail Pelanggan" kembali={tutup} refresh={() => void muat()} memuat={memuat}><PesanStaff pesan={error}/>{memuat && !data && <MemuatStaff/>}{data && <><PanelStaff><Text style={s.h2}>{data.profil.nama}</Text><Text style={s.teks}>{data.profil.nomorTelepon || "Tanpa nomor HP"}</Text><Text style={s.kecil}>{data.jumlahKunjungan} kunjungan selesai</Text><Text style={s.kecil}>Perubahan profil, arsip, dan pembuatan pelanggan hanya melalui Admin.</Text></PanelStaff><Text style={s.h2}>Pesanan pelanggan</Text>{data.riwayatPesanan.map(p => <TombolStaff key={`${p.jenis}-${p.id}`} judul={`${p.nomor} · ${p.status}`} sekunder aksi={() => nav.navigate(["COMPLETED", "CANCELLED", "REJECTED", "NO_SHOW"].includes(p.status) ? "ArsipStaff" : "DetailStaff", { jenis: p.jenis, id: p.id })}/>)}</>}</HalamanStaff>;
}
export default function PelangganOperasionalStaff() {
  const nav = useNavigation(), [cari, aturCari] = useState(""), [kata, aturKata] = useState(""), [halaman, aturHalaman] = useState(1), [pilihan, aturPilihan] = useState<number | null>(null);
  const { data, memuat, error, muat } = useOperasionalStaff<{ data: Profil[]; total: number; halaman: number; batas: number }>("/management/customers", { cari: kata, arsip: "AKTIF", halaman });
  if (pilihan) return <RincianPelanggan id={pilihan} tutup={() => aturPilihan(null)}/>;
  return <HalamanStaff judul="Pelanggan" subjudul="Akses operasional · baca saja" kembali={() => nav.goBack()} refresh={() => void muat()} memuat={memuat}>
    <InputStaff label="Cari nama atau nomor HP" nilai={cari} ubah={aturCari}/><TombolStaff judul="Cari pelanggan" sekunder aksi={() => { aturKata(cari.trim()); aturHalaman(1); }}/><PesanStaff pesan={error}/>{memuat && !data && <MemuatStaff/>}
    {data?.data.map(p => <PanelStaff key={p.id}><Text style={s.h2}>{p.nama}</Text><Text style={s.teks}>{p.nomorTelepon || "Tanpa nomor HP"}</Text><Text style={s.kecil}>{p.jumlahKunjungan} kunjungan · Terakhir {p.kunjunganTerakhir ? tanggalStaff(p.kunjunganTerakhir) : "Belum tersedia"}</Text><TombolStaff judul="Lihat pelanggan" sekunder aksi={() => aturPilihan(p.id)}/></PanelStaff>)}
    {data && !data.total && <Text style={s.kecil}>Pelanggan tidak ditemukan.</Text>}
    <View style={s.baris}><TombolStaff judul="Sebelumnya" sekunder nonaktif={memuat || halaman <= 1} aksi={() => aturHalaman(v => v - 1)}/><TombolStaff judul="Berikutnya" sekunder nonaktif={memuat || !data || data.halaman * data.batas >= data.total} aksi={() => aturHalaman(v => v + 1)}/></View>
  </HalamanStaff>;
}
