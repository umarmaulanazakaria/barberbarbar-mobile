import { useCallback, useRef, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSesiStore } from "../store/useSesiStore";
import { usePenyegaranRealtime } from "../hooks/usePenyegaranRealtime";
import { ambilPesanKesalahan } from "../layanan/api";
import { daftarStaff, tanggalStaff, type DaftarStaff, type EntriStaff } from "./layananStaff";
import { HalamanStaff, KartuSlimStaff, MemuatStaff, PanelStaff, PesanStaff, s, TombolStaff, warnaStaff } from "./UiStaff";
import { bukaTabStaff, type RuteStaff } from "./NavigasiStaff";
type Nav = NativeStackNavigationProp<RuteStaff>;
function useDaftarStaff(params: Record<string, string | number>) {
  const sidik = JSON.stringify(params), versi = useRef(0), [data, aturData] = useState<DaftarStaff | null>(null), [memuat, aturMemuat] = useState(true), [error, aturError] = useState("");
  const muat = useCallback(async () => { const v = ++versi.current; aturMemuat(true); aturError(""); try { const d = await daftarStaff(JSON.parse(sidik) as Record<string, string | number>); if (v === versi.current) aturData(d); } catch (e) { if (v === versi.current) aturError(ambilPesanKesalahan(e)); } finally { if (v === versi.current) aturMemuat(false); } }, [sidik]);
  useFocusEffect(useCallback(() => { void muat(); return () => { versi.current++; }; }, [muat]));
  usePenyegaranRealtime(["pesanan", "booking", "membership", "pembayaran", "katalog"], muat);
  return { data, memuat, error, muat };
}
export function BerandaStaff() {
  const nav = useNavigation<Nav>(), pengguna = useSesiStore(v => v.pengguna), { data, memuat, error, muat } = useDaftarStaff({ periode: "HARI_INI", kelompok: "MENUNGGU", urutan: "ASC", batas: 20, ringkasan: "true" });
  const metrik = data?.metrik?.operasionalHariIni;
  return <HalamanStaff judul={`Halo, ${pengguna?.name ?? "Staff"}`} subjudul={data ? `${tanggalStaff(data.serverTime)} · WIB` : "Memuat hari operasional..."} refresh={() => void muat()} memuat={memuat}>
    <PesanStaff pesan={error}/><View style={{ flexDirection: "row", gap: 9, marginBottom: 20 }}>{[["Menunggu", metrik?.menunggu], ["Berlangsung", metrik?.berlangsung], ["Selesai", metrik?.selesai]].map(([label, angka]) => <View key={label} style={[s.panel, { flex: 1, padding: 13, marginBottom: 0 }]}><Text style={{ color: warnaStaff.ungu, fontSize: 25, fontWeight: "700", marginBottom: 6 }}>{angka ?? "—"}</Text><Text style={s.kecil}>{label}</Text></View>)}</View>
    <View style={{ flexDirection: "row", gap: 10, marginBottom: 18 }}><View style={{ flex: 1 }}><TombolStaff judul="+ Tambah Walk-in" aksi={() => bukaTabStaff(nav, "Walk-in")}/></View><View style={{ flex: 1 }}><TombolStaff judul="Cek Member" sekunder aksi={() => nav.navigate("CekMember")}/></View></View>
    <View style={s.baris}><Text style={s.h2}>Antrean berikutnya</Text><Pressable onPress={() => bukaTabStaff(nav, "Pesanan")}><Text style={{ color: warnaStaff.ungu, fontSize: 12 }}>Lihat semua</Text></Pressable></View>
    {memuat && !data && <MemuatStaff/>}{!memuat && !error && !data?.data.length && <PanelStaff><Text style={s.kecil}>Belum ada antrean hari ini.</Text></PanelStaff>}
    {data?.data.slice(0, 6).map(d => <KartuSlimStaff key={`${d.jenis}-${d.id}`} data={d} buka={() => nav.navigate("DetailStaff", { jenis: d.jenis, id: d.id })}/>)}
  </HalamanStaff>;
}
const pilihan = ["Semua", "Menunggu", "Dilayani", "Selesai", "Booking", "Walk-in"] as const;
export function DaftarPesananStaff({ riwayat = false }: { riwayat?: boolean }) {
  const nav = useNavigation<Nav>(), [filter, aturFilter] = useState<typeof pilihan[number]>("Semua"), [halaman, aturHalaman] = useState(1), [semuaHari, aturSemuaHari] = useState(riwayat);
  const params = { periode: semuaHari ? "SEMUA" : "HARI_INI", halaman, status: riwayat || filter === "Selesai" ? "COMPLETED" : filter === "Dilayani" ? "IN_SERVICE" : "SEMUA", jenis: filter === "Booking" ? "BOOKING" : filter === "Walk-in" ? "WALK_IN" : "SEMUA", kelompok: filter === "Menunggu" ? "MENUNGGU" : "SEMUA" };
  const { data, memuat, error, muat } = useDaftarStaff(params);
  return <HalamanStaff judul={riwayat ? "Riwayat" : "Pesanan"} subjudul={riwayat ? "Pelayanan yang telah selesai" : "Booking & Walk-in"} refresh={() => void muat()} memuat={memuat}>
    <View style={s.baris}><Text style={s.kecil}>{semuaHari ? "Semua jadwal" : "Jadwal hari ini · WIB"}</Text><Pressable onPress={() => { aturSemuaHari(v => !v); aturHalaman(1); }}><Text style={{ color: warnaStaff.ungu, fontSize: 12 }}>{semuaHari ? "Hari ini" : "Semua jadwal"}</Text></Pressable></View>
    {!riwayat && <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 18 }}>{pilihan.map(p => <Pressable key={p} onPress={() => { aturFilter(p); aturHalaman(1); }} style={{ backgroundColor: filter === p ? warnaStaff.ungu : "white", padding: 10, borderRadius: 8, marginRight: 7, borderColor: warnaStaff.garis, borderWidth: 1 }}><Text style={{ fontSize: 12, color: filter === p ? "white" : warnaStaff.redup }}>{p}</Text></Pressable>)}</ScrollView>}
    <PesanStaff pesan={error}/>{memuat && <MemuatStaff/>}{!memuat && !error && !data?.data.length && <PanelStaff><Text style={s.kecil}>Tidak ada pesanan pada pilihan ini.</Text></PanelStaff>}
    {data?.data.map((d: EntriStaff) => <KartuSlimStaff key={`${d.jenis}-${d.id}`} data={d} buka={() => nav.navigate("DetailStaff", { jenis: d.jenis, id: d.id })}/>)}
    <View style={s.baris}><TombolStaff judul="Sebelumnya" sekunder nonaktif={memuat || halaman <= 1} aksi={() => aturHalaman(v => v - 1)}/><Text style={s.kecil}>{data?.total ?? "—"} pesanan · {halaman}</Text><TombolStaff judul="Berikutnya" sekunder nonaktif={memuat || !data || halaman * data.batas >= data.total} aksi={() => aturHalaman(v => v + 1)}/></View>
  </HalamanStaff>;
}
export function RiwayatStaff() { return <DaftarPesananStaff riwayat/>; }
export function ProfilStaff() {
  const pengguna = useSesiStore(v => v.pengguna), logout = useSesiStore(v => v.logout);
  return <HalamanStaff judul="Profil" subjudul="Akun operasional"><PanelStaff><Text style={s.h2}>{pengguna?.name}</Text><Text style={s.teks}>{pengguna?.email}</Text><Text style={{ color: warnaStaff.ungu, fontSize: 12, fontWeight: "700", marginTop: 10 }}>{pengguna?.role}</Text></PanelStaff><PanelStaff><Text style={s.h2}>Akses operasional</Text><Text style={s.teks}>Antrean dan pelayanan, verifikasi Member, Walk-in, pembayaran, dan struk.</Text><Text style={s.kecil}>Tindakan mengikuti izin akun. Pengaturan, persetujuan, dan perubahan data khusus Admin tidak tersedia di sini.</Text></PanelStaff><TombolStaff judul="Keluar" sekunder aksi={() => Alert.alert("Keluar", "Keluar dari akun ini?", [{ text: "Batal", style: "cancel" }, { text: "Keluar", style: "destructive", onPress: () => void logout() }])}/></HalamanStaff>;
}
