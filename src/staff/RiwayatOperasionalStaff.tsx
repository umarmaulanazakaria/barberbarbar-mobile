import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { jamStaff, rupiahStaff, tanggalStaff } from "./layananStaff";
import { useOperasionalStaff, type RiwayatStaffData, type DetailArsipStaff } from "./operasionalStaff";
import type { RuteStaff } from "./NavigasiStaff";
import { HalamanStaff, InputStaff, KartuSlimStaff, MemuatStaff, PanelStaff, PesanStaff, s, TombolStaff } from "./UiStaff";

export function PilihanOperasional({ nilai, opsi, ubah }: { nilai: string; opsi: readonly (readonly [string, string])[]; ubah: (v: string) => void }) {
  return <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>{opsi.map(([v, label]) => <View key={v} style={{ marginRight: 7 }}><TombolStaff judul={label} sekunder={nilai !== v} aksi={() => ubah(v)}/></View>)}</ScrollView>;
}
export default function RiwayatOperasionalStaff() {
  const nav = useNavigation<NativeStackNavigationProp<RuteStaff>>();
  const [jenis, aturJenis] = useState("SEMUA"), [status, aturStatus] = useState("SEMUA"), [periode, aturPeriode] = useState("TIGA_PULUH_HARI"), [halaman, aturHalaman] = useState(1), [cari, aturCari] = useState(""), [kata, aturKata] = useState(""), [mulai, aturMulai] = useState(""), [selesai, aturSelesai] = useState(""), [rentang, aturRentang] = useState<{ mulai: string; selesai: string } | null>(null);
  const [rentangTerbuka, aturRentangTerbuka] = useState(false);
  const { data, memuat, error, muat } = useOperasionalStaff<RiwayatStaffData>("/management/history", { jenis, status, periode, halaman, cari: kata, ...(periode === "RENTANG" ? rentang ?? {} : {}) });
  return <HalamanStaff judul="Riwayat" subjudul="Arsip berdasarkan waktu penutupan · WIB" refresh={() => void muat()} memuat={memuat}>
    <PilihanOperasional nilai={jenis} opsi={[["SEMUA", "Semua"], ["BOOKING", "Booking"], ["WALK_IN", "Walk-in"]]} ubah={v => { aturJenis(v); aturHalaman(1); }}/>
    <PilihanOperasional nilai={status} opsi={[["SEMUA", "Semua status"], ["COMPLETED", "Selesai"], ["CANCELLED", "Dibatalkan"], ["EXPIRED", "Kedaluwarsa"]]} ubah={v => { aturStatus(v); aturHalaman(1); }}/>
    <PilihanOperasional nilai={periode} opsi={[["HARI_INI", "Hari ini"], ["TUJUH_HARI", "7 hari"], ["TIGA_PULUH_HARI", "30 hari"]]} ubah={v => { aturPeriode(v); aturHalaman(1); }}/>
    <TombolStaff judul={rentangTerbuka ? "Tutup rentang tanggal" : "Pilih rentang tanggal"} sekunder aksi={() => aturRentangTerbuka(v => !v)}/>
    {rentangTerbuka && <>
    <InputStaff label="Dari tanggal (YYYY-MM-DD)" nilai={mulai} ubah={aturMulai}/><InputStaff label="Sampai tanggal (YYYY-MM-DD)" nilai={selesai} ubah={aturSelesai}/>
    <TombolStaff judul="Terapkan rentang tanggal" sekunder nonaktif={!/^\d{4}-\d{2}-\d{2}$/.test(mulai) || !/^\d{4}-\d{2}-\d{2}$/.test(selesai) || mulai > selesai} aksi={() => { aturRentang({ mulai, selesai }); aturPeriode("RENTANG"); aturHalaman(1); }}/>
    </>}
    <InputStaff label="Cari nama, nomor pesanan atau HP" nilai={cari} ubah={aturCari}/><TombolStaff judul="Cari riwayat" sekunder aksi={() => { aturKata(cari.trim()); aturHalaman(1); }}/>
    <PesanStaff pesan={error}/>{memuat && !data && <MemuatStaff/>}
    {!!data?.tanpaWaktuPenutupan && <Text style={s.kecil}>{data.tanpaWaktuPenutupan} arsip tidak memiliki waktu penutupan dan tidak termasuk rentang ini, sesuai Admin.</Text>}
    {data?.data.map(d => <View key={`${d.jenis}-${d.id}`}><KartuSlimStaff data={{ ...d, status: d.statusAkhir }} buka={() => nav.navigate("ArsipStaff", { jenis: d.jenis, id: d.id })}/><Text style={s.kecil}>Ditutup: {d.penutupan ? `${tanggalStaff(d.penutupan)} ${jamStaff(d.penutupan)}` : "Tidak tersedia"}</Text></View>)}
    {data && !data.total && <Text style={s.kecil}>Tidak ada riwayat sesuai filter.</Text>}
    <View style={s.baris}><TombolStaff judul="Sebelumnya" sekunder nonaktif={memuat || halaman <= 1} aksi={() => aturHalaman(v => v - 1)}/><Text style={s.kecil}>{data?.total ?? "—"} pesanan · {data?.halaman ?? halaman}</Text><TombolStaff judul="Berikutnya" sekunder nonaktif={memuat || !data || halaman >= data.totalHalaman} aksi={() => aturHalaman(v => v + 1)}/></View>
  </HalamanStaff>;
}
export function DetailArsipOperasionalStaff() {
  const nav = useNavigation<NativeStackNavigationProp<RuteStaff>>(), { params: { jenis, id } } = useRoute<RouteProp<RuteStaff, "ArsipStaff">>();
  const { data: d, memuat, error, muat } = useOperasionalStaff<DetailArsipStaff>(`/management/history/${jenis}/${id}`);
  return <HalamanStaff judul="Detail Riwayat" kembali={() => nav.goBack()} refresh={() => void muat()} memuat={memuat}><PesanStaff pesan={error}/>{memuat && !d && <MemuatStaff/>}{d && <>
    <PanelStaff><Text style={s.h2}>{d.nomor}</Text><Text style={s.teks}>{d.pelanggan} · {d.nomorTelepon || "Tanpa nomor HP"}</Text><Text style={s.teks}>Status akhir: {d.statusAkhir} · {d.statusBackend}</Text><Text style={s.kecil}>Jadwal: {tanggalStaff(d.jadwal)} {jamStaff(d.jadwal)} WIB</Text><Text style={s.kecil}>Penutupan: {d.penutupan ? `${tanggalStaff(d.penutupan)} ${jamStaff(d.penutupan)} WIB` : "Tidak tersedia"}</Text><Text style={s.teks}>Barber: {d.barber ?? "Belum ditentukan"}</Text></PanelStaff>
    <PanelStaff><Text style={s.h2}>Layanan & Pembayaran</Text>{d.items.map((i, n) => <Text key={n} style={s.teks}>{i.namaLayanan} ×{i.qty} · {rupiahStaff(i.subtotal)}</Text>)}<Text style={s.teks}>Total {rupiahStaff(d.pembayaran.total)}</Text><Text style={s.teks}>Dibayar {rupiahStaff(d.pembayaran.jumlahDibayar)}</Text><Text style={s.teks}>Sisa {rupiahStaff(d.pembayaran.balance)} · {d.pembayaran.statusPembayaran}</Text>{d.pembayaran.invoice && <Text style={s.teks}>Invoice: {d.pembayaran.invoice.nomorInvoice}</Text>}</PanelStaff>
    <PanelStaff><Text style={s.h2}>Perkembangan</Text>{d.riwayat.map(r => <Text key={r.id} style={s.kecil}>{r.aksi} · {r.sebelum ?? "—"} → {r.setelah}{"\n"}{tanggalStaff(r.waktu)} {jamStaff(r.waktu)} WIB</Text>)}{d.catatan && <Text style={s.teks}>{d.catatan}</Text>}{d.alasan && <Text style={s.teks}>Alasan: {d.alasan}</Text>}</PanelStaff>
    {d.statusBackend === "COMPLETED" && <TombolStaff judul="Detail pembayaran & struk" sekunder aksi={() => nav.navigate("DetailStaff", { jenis, id })}/>}
  </>}</HalamanStaff>;
}
