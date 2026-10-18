import { useState } from "react";
import { Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSesiStore } from "../store/useSesiStore";
import { rupiahStaff, tanggalStaff } from "./layananStaff";
import { useOperasionalStaff, type DashboardStaff } from "./operasionalStaff";
import { bukaTabStaff, type RuteStaff } from "./NavigasiStaff";
import { HalamanStaff, InputStaff, KartuSlimStaff, MemuatStaff, PanelStaff, PesanStaff, s, TombolStaff, warnaStaff } from "./UiStaff";

export default function BerandaOperasionalStaff() {
  const nav = useNavigation<NativeStackNavigationProp<RuteStaff>>(), pengguna = useSesiStore(v => v.pengguna);
  const [jenis, aturJenis] = useState("BOOKING"), [halaman, aturHalaman] = useState(1), [cari, aturCari] = useState(""), [kata, aturKata] = useState(""), [kategori, aturKategori] = useState(""), [halamanPerhatian, aturHalamanPerhatian] = useState(1);
  const { data, memuat, error, muat } = useOperasionalStaff<DashboardStaff>("/management/dashboard", { jenis, halaman, cari: kata, ...(kategori ? { kategoriPerhatian: kategori, halamanPerhatian } : {}) });
  return <HalamanStaff judul={`Halo, ${pengguna?.name ?? "Staff"}`} subjudul={data ? `${tanggalStaff(data.serverTime)} · WIB` : "Operasional toko"} refresh={() => void muat()} memuat={memuat}>
    <PesanStaff pesan={error}/>{memuat && !data && <MemuatStaff/>}
    {data && <>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>{[
        ["Booking Hari Ini", data.kpi.bookingHariIni], ["Menunggu Check-in", data.kpi.menungguCheckIn], ["Sedang Dilayani", data.kpi.sedangDilayani], ["Pembayaran Diterima Hari Ini", rupiahStaff(data.kpi.pembayaranHariIni)],
      ].map(([label, angka]) => <View key={label} style={[s.panel, { width: "48%", padding: 12, marginBottom: 0 }]}><Text style={{ color: warnaStaff.ungu, fontSize: 20, fontWeight: "700" }}>{angka}</Text><Text style={s.kecil}>{label}</Text></View>)}</View>
    </>}
    <View style={s.baris}><View style={{ flex: 1 }}><TombolStaff judul="+ Tambah Walk-in" aksi={() => bukaTabStaff(nav, "Walk-in")}/></View><View style={{ flex: 1 }}><TombolStaff judul="Cek Member" sekunder aksi={() => nav.navigate("CekMember")}/></View></View>
    <TombolStaff judul="Pelanggan operasional" sekunder aksi={() => nav.navigate("PelangganStaff")}/>
    <Text style={s.h2}>Aktivitas hari ini</Text><View style={s.baris}>{["BOOKING", "WALK_IN"].map(j => <View key={j} style={{ flex: 1 }}><TombolStaff judul={j === "BOOKING" ? "Booking" : "Walk-in"} sekunder={jenis !== j} aksi={() => { aturJenis(j); aturHalaman(1); }}/></View>)}</View>
    <InputStaff label="Cari nama atau nomor" nilai={cari} ubah={aturCari}/><TombolStaff judul="Cari aktivitas" sekunder aksi={() => { aturKata(cari.trim()); aturHalaman(1); }}/>
    {data?.aktivitas.data.map(d => <KartuSlimStaff key={`${d.jenis}-${d.id}`} data={d} buka={() => nav.navigate("DetailStaff", { jenis: d.jenis, id: d.id })}/>)}
    {data && !data.aktivitas.total && <Text style={s.kecil}>Tidak ada aktivitas sesuai pencarian.</Text>}
    <View style={s.baris}><TombolStaff judul="Sebelumnya" sekunder nonaktif={memuat || halaman <= 1} aksi={() => aturHalaman(v => v - 1)}/><Text style={s.kecil}>{data?.aktivitas.total ?? "—"} aktivitas</Text><TombolStaff judul="Berikutnya" sekunder nonaktif={memuat || !data || halaman * 10 >= data.aktivitas.total} aksi={() => aturHalaman(v => v + 1)}/></View>
    <Text style={s.h2}>Perlu Perhatian</Text><Text style={s.kecil}>Masalah aktif, semua tanggal</Text>
    {data && !data.perhatian.length && <PanelStaff><Text style={s.teks}>Tidak ada yang perlu ditangani.</Text></PanelStaff>}
    {data?.perhatian.map(k => <PanelStaff key={k.kode}><TombolStaff judul={`${k.judul} · ${k.total}`} sekunder aksi={() => { aturKategori(kategori === k.kode ? "" : k.kode); aturHalamanPerhatian(1); }}/>{kategori === k.kode && <>
      {k.data.map(d => <View key={`${d.jenis}-${d.id}`}><KartuSlimStaff data={d} buka={() => nav.navigate("DetailStaff", { jenis: d.jenis, id: d.id })}/><Text style={s.kecil}>{d.masalah}</Text></View>)}
      <View style={s.baris}><TombolStaff judul="Sebelumnya" sekunder nonaktif={memuat || halamanPerhatian <= 1} aksi={() => aturHalamanPerhatian(v => v - 1)}/><TombolStaff judul="Berikutnya" sekunder nonaktif={memuat || halamanPerhatian * 5 >= k.total} aksi={() => aturHalamanPerhatian(v => v + 1)}/></View>
    </>}</PanelStaff>)}
  </HalamanStaff>;
}
