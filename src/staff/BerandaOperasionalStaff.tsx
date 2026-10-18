import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSesiStore } from "../store/useSesiStore";
import { rupiahStaff, tanggalStaff } from "./layananStaff";
import { useOperasionalStaff, type DashboardStaff } from "./operasionalStaff";
import { bukaTabStaff, type RuteStaff } from "./NavigasiStaff";
import { KartuSlimStaff } from "./UiStaff";

export default function BerandaOperasionalStaff() {
  const nav = useNavigation<NativeStackNavigationProp<RuteStaff>>(), pengguna = useSesiStore(v => v.pengguna);
  // Filter dan urutan default Dashboard Admin tetap ditentukan Backend.
  const { data, memuat, error, muat } = useOperasionalStaff<DashboardStaff>("/management/dashboard", { jenis: "BOOKING", halaman: 1, cari: "" });
  const tanggal = data ? tanggalStaff(`${data.hariIni}T00:00:00+07:00`) : "Memuat tanggal operasional…";
  return <SafeAreaView edges={["top", "left", "right"]} style={v.aman}>
    <View style={v.header}>
      <Text style={v.brand}>BARBER BARBAR · STAFF</Text>
      <Text style={v.sapaan} numberOfLines={2}>Halo, {pengguna?.name ?? "Staff"} 👋</Text>
      <Text style={v.tanggal}>{tanggal}{data ? " · WIB" : ""}</Text>
    </View>
    <ScrollView contentContainerStyle={v.isi} refreshControl={<RefreshControl refreshing={memuat && !!data} onRefresh={() => void muat()} tintColor={ungu}/> }>
      <View style={v.konten}>
        {!!error && <View style={v.galat} accessibilityRole="alert"><Text style={v.galatTeks}>{error}</Text><Pressable accessibilityRole="button" accessibilityLabel="Coba muat Beranda kembali" onPress={() => void muat()} hitSlop={8}><Text style={v.tautan}>Coba lagi</Text></Pressable></View>}
        {memuat && !data && <ActivityIndicator accessibilityLabel="Memuat Beranda" color={ungu} style={v.memuat}/>}
        {data && <>
          <Text style={v.judulSection}>Ringkasan hari ini</Text>
          <View style={v.ringkasan}>
            <View style={v.barisKpi}>{[
              { label: "Booking", nilai: data.kpi.bookingHariIni },
              { label: "Menunggu Check-in", nilai: data.kpi.menungguCheckIn },
              { label: "Sedang Dilayani", nilai: data.kpi.sedangDilayani },
            ].map((k, i) => <View key={k.label} style={[v.kpi, i > 0 && v.pemisahKpi]}>
              <Text style={v.angka} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{k.nilai}</Text>
              <Text style={v.labelKpi}>{k.label}</Text>
            </View>)}</View>
            <View style={v.pembayaran}><Text style={v.labelPembayaran}>Pembayaran diterima</Text><Text style={v.nominal} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{rupiahStaff(data.kpi.pembayaranHariIni)}</Text></View>
          </View>
          <View style={v.judulBaris}><Text style={v.judulPesanan}>Pesanan berikutnya</Text><Pressable accessibilityRole="button" accessibilityLabel="Lihat semua pesanan" onPress={() => bukaTabStaff(nav, "Pesanan")} hitSlop={8}><Text style={v.tautan}>Lihat semua →</Text></Pressable></View>
          {data.aktivitas.data.map(d => <KartuSlimStaff key={`${d.jenis}-${d.id}`} data={d} buka={() => nav.navigate("DetailStaff", { jenis: d.jenis, id: d.id })}/>)}
          {!data.aktivitas.data.length && <Text style={v.kosong}>Belum ada pesanan berikutnya.</Text>}
          {!!data.perhatian.length && <View style={v.perhatian}>
            <Text style={v.judulSection}>Perlu Perhatian</Text>
            {data.perhatian.map(k => <View key={k.kode} style={v.kategori}>
              <View style={v.kategoriJudul}><Text style={v.namaKategori}>{k.judul}</Text><Text style={v.jumlah}>{k.total}</Text></View>
              {k.data.map(d => <Pressable key={`${d.jenis}-${d.id}`} accessibilityRole="button" accessibilityLabel={`Detail ${d.nomor}: ${d.masalah ?? k.judul}`} onPress={() => nav.navigate("DetailStaff", { jenis: d.jenis, id: d.id })} style={v.itemPerhatian}>
                <View style={v.rincianPerhatian}><Text style={v.pelanggan} numberOfLines={1}>{d.pelanggan}</Text><Text style={v.masalah} numberOfLines={2}>{d.masalah ?? k.judul}</Text></View><Text style={v.chevron}>›</Text>
              </Pressable>)}
              {k.total > k.data.length && <Pressable accessibilityRole="button" onPress={() => bukaTabStaff(nav, "Pesanan")} hitSlop={8}><Text style={v.tautan}>Lihat pesanan lainnya →</Text></Pressable>}
            </View>)}
          </View>}
        </>}
      </View>
    </ScrollView>
  </SafeAreaView>;
}

const ungu = "#7653db";
const v = StyleSheet.create({
  aman: { flex: 1, backgroundColor: "#12203a" },
  header: { paddingHorizontal: 20, paddingTop: 19, paddingBottom: 23 },
  brand: { color: "#aeb9d4", fontSize: 9, letterSpacing: 2, fontWeight: "600", marginBottom: 8 },
  sapaan: { color: "#fff", fontSize: 24, fontWeight: "700", lineHeight: 31 },
  tanggal: { color: "#bdc6dc", fontSize: 10, marginTop: 6 },
  isi: { flexGrow: 1, padding: 18, paddingBottom: 26, backgroundColor: "#f8f9fc" },
  konten: { width: "100%", maxWidth: 600, alignSelf: "center" },
  judulSection: { color: "#18233b", fontSize: 14, fontWeight: "700", marginBottom: 11 },
  ringkasan: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#e9ecf3", borderRadius: 14, paddingVertical: 16, paddingHorizontal: 12, marginBottom: 24 },
  barisKpi: { flexDirection: "row", alignItems: "stretch" },
  kpi: { flex: 1, minWidth: 0, alignItems: "center", paddingHorizontal: 5 },
  pemisahKpi: { borderLeftWidth: 1, borderLeftColor: "#e9ecf3" },
  angka: { color: ungu, fontSize: 23, fontWeight: "700", fontVariant: ["tabular-nums"], marginBottom: 5 },
  labelKpi: { fontSize: 9, lineHeight: 14, textAlign: "center", color: "#7c8599" },
  pembayaran: { flexDirection: "row", alignItems: "center", gap: 8, borderTopWidth: 1, borderTopColor: "#e9ecf3", marginTop: 15, paddingTop: 13, paddingHorizontal: 2 },
  labelPembayaran: { color: "#7c8599", fontSize: 10, flex: 1 },
  nominal: { color: ungu, fontSize: 13, fontWeight: "700", maxWidth: "60%", fontVariant: ["tabular-nums"] },
  judulBaris: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 11 },
  judulPesanan: { color: "#18233b", fontSize: 14, fontWeight: "700", flex: 1 },
  tautan: { color: ungu, fontSize: 10, fontWeight: "600" },
  kosong: { color: "#7c8599", fontSize: 12, lineHeight: 18, marginVertical: 8 },
  perhatian: { marginTop: 20 },
  kategori: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#e9ecf3", borderRadius: 12, padding: 12, marginBottom: 9 },
  kategoriJudul: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  namaKategori: { flex: 1, color: "#18233b", fontSize: 12, fontWeight: "600" },
  jumlah: { color: ungu, fontSize: 12, fontWeight: "700" },
  itemPerhatian: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 8 },
  rincianPerhatian: { flex: 1, minWidth: 0 },
  pelanggan: { color: "#18233b", fontSize: 12, fontWeight: "600" },
  masalah: { color: "#7c8599", fontSize: 10, lineHeight: 15, marginTop: 3 },
  chevron: { color: "#9ba3b5", fontSize: 20 },
  galat: { backgroundColor: "#fff1ee", padding: 12, borderRadius: 9, marginBottom: 14, gap: 8 },
  galatTeks: { color: "#a43d33", fontSize: 12, lineHeight: 18 },
  memuat: { marginVertical: 16 },
});
