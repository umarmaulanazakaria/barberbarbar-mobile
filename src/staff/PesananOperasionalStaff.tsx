import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, AppState, FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { api, ambilPesanKesalahan } from "../layanan/api";
import { usePenyegaranRealtime } from "../hooks/usePenyegaranRealtime";
import { jamStaff, pesanStaff, statusStaff, type DaftarStaff, type EntriStaff } from "./layananStaff";
import { ambilPesananMinimal, filterAwal, tanggalValid, type FilterPesanan, type TabPesanan } from "./pesananMinimalStaff";
import { bukaTabStaff, type RuteStaff } from "./NavigasiStaff";

const jenis = [["SEMUA", "Semua"], ["BOOKING", "Booking"], ["WALK_IN", "Walk-in"]] as const;
const periode = [["HARI_INI", "Hari ini"], ["MENDATANG", "Mendatang"], ["SEMUA", "Semua jadwal"], ["RENTANG", "Rentang tanggal"], ["RIWAYAT", "Sebelum hari ini"]] as const;
const status = [["SEMUA", "Semua"], ...["WAITING", "AWAITING_DP", "PENDING_CONFIRMATION", "CONFIRMED", "CHECKED_IN", "IN_SERVICE"].map(v => [v, statusStaff[v]] as const), ["COMPLETED_UNPAID", "Menunggu Pembayaran"], ...["COMPLETED", "CANCELLED", "REJECTED", "NO_SHOW"].map(v => [v, statusStaff[v]] as const)] as const;
function Chip({ nilai, opsi, ubah }: { nilai: string; opsi: readonly (readonly [string, string])[]; ubah: (v: string) => void }) {
  return <View style={s.chips}>{opsi.map(([v, label]) => <Pressable key={v} accessibilityRole="button" accessibilityState={{ selected: nilai === v }} onPress={() => ubah(v)} style={[s.chip, nilai === v && s.chipAktif]}><Text style={[s.chipTeks, nilai === v && s.teksAktif]}>{label}</Text></Pressable>)}</View>;
}

export default function PesananOperasionalStaff() {
  const nav = useNavigation<NativeStackNavigationProp<RuteStaff>>(), insets = useSafeAreaInsets();
  const [tab, aturTab] = useState<TabPesanan>("SEMUA"), [filter, aturFilter] = useState<FilterPesanan>(filterAwal), [draft, aturDraft] = useState<FilterPesanan>(filterAwal), [sheet, aturSheet] = useState(false);
  const [cari, aturCari] = useState(""), [kata, aturKata] = useState(""), [halaman, aturHalaman] = useState(1), [hasil, aturHasil] = useState<{ kunci: string; data: DaftarStaff } | null>(null), [memuat, aturMemuat] = useState(true), [error, aturError] = useState("");
  const versi = useRef(0), controller = useRef<AbortController | null>(null), daftar = useRef<FlatList<EntriStaff>>(null);
  const kunci = JSON.stringify({ tab, filter, kata, halaman }), data = hasil?.kunci === kunci ? hasil.data : null, mencari = cari.trim() !== kata;
  useEffect(() => { const t = setTimeout(() => { aturKata(cari.trim()); aturHalaman(1); }, 300); return () => clearTimeout(t); }, [cari]);
  const muat = useCallback(async () => {
    const v = ++versi.current; controller.current?.abort(); const ac = new AbortController(); controller.current = ac; aturMemuat(true); aturError("");
    try {
      const q = JSON.parse(kunci) as { tab: TabPesanan; filter: FilterPesanan; kata: string; halaman: number };
      const d = await ambilPesananMinimal(async params => (await api.get<DaftarStaff>("/management/orders", { params, signal: ac.signal })).data, q.filter, q.tab, q.kata, q.halaman);
      if (v === versi.current) {
        const terakhir = Math.max(1, Math.ceil(d.total / 20));
        if (q.halaman > terakhir) aturHalaman(terakhir);
        else aturHasil({ kunci, data: d });
      }
    } catch (e) { if (v === versi.current && !ac.signal.aborted) { aturHasil(null); aturError(pesanStaff(e) ?? ambilPesanKesalahan(e)); } }
    finally { if (v === versi.current) aturMemuat(false); }
  }, [kunci]);
  useFocusEffect(useCallback(() => { void muat(); const t = setInterval(() => { if (AppState.currentState === "active") void muat(); }, 15000); return () => { versi.current++; controller.current?.abort(); clearInterval(t); }; }, [muat]));
  usePenyegaranRealtime(["pesanan", "booking", "pembayaran", "membership", "pelanggan", "katalog"], muat);
  useEffect(() => { daftar.current?.scrollToOffset({ offset: 0, animated: false }); }, [kunci]);
  const bukaFilter = () => { aturDraft({ ...filter }); aturSheet(true); };
  const ubahDraft = (kolom: keyof FilterPesanan, nilai: string) => aturDraft(v => ({ ...v, [kolom]: nilai }));
  const rentangSah = draft.periode !== "RENTANG" || tanggalValid(draft.mulai) && tanggalValid(draft.selesai) && draft.mulai <= draft.selesai;
  const labelPeriode = periode.find(([v]) => v === filter.periode)?.[1] ?? filter.periode;
  const tanggal = filter.periode === "RENTANG" ? `${filter.mulai} – ${filter.selesai}` : filter.periode === "HARI_INI" && data ? new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", day: "numeric", month: "short" }).format(new Date(`${data.hariIni}T00:00:00+07:00`)) : labelPeriode;
  const totalHalaman = Math.max(1, Math.ceil((data?.total ?? 0) / 20));
  return <SafeAreaView edges={["top", "left", "right"]} style={s.aman}>
    <View style={s.header}><Text style={s.brand}>BARBER BARBAR · STAFF</Text><Text style={s.judul}>Pesanan</Text><Text style={s.subtitle}>Booking & Walk-in · WIB</Text></View>
    <FlatList ref={daftar} data={mencari ? [] : data?.data ?? []} keyExtractor={d => `${d.jenis}:${d.id}`} keyboardShouldPersistTaps="handled" contentContainerStyle={s.isi} refreshing={memuat && !!data} onRefresh={() => void muat()}
      ListHeaderComponent={<>
        <View style={s.segment}>{([["SEMUA", "Semua"], ["AKTIF", "Aktif"], ["SELESAI", "Selesai"]] as const).map(([v, label]) => <Pressable key={v} accessibilityRole="tab" accessibilityState={{ selected: tab === v }} onPress={() => { aturTab(v); aturHalaman(1); }} style={[s.tab, tab === v && s.tabAktif]}><Text style={[s.tabTeks, tab === v && s.teksAktif]}>{label}</Text></Pressable>)}</View>
        <View style={s.pencarian}><Ionicons name="search-outline" size={15} color="#9aa2b2"/><TextInput accessibilityLabel="Cari nama atau nomor pesanan" placeholder="Cari nama atau nomor pesanan" placeholderTextColor="#9aa2b2" value={cari} maxLength={100} onChangeText={aturCari} autoCapitalize="none" style={s.input}/></View>
        <View style={s.kontrol}><Pressable accessibilityRole="button" accessibilityLabel="Pilih tanggal pesanan" onPress={bukaFilter} style={s.kontrolTanggal}><Ionicons name="calendar-outline" size={13} color="#6e778b"/><Text style={s.kontrolTeks} numberOfLines={1}>{labelPeriode}</Text><Ionicons name="chevron-down" size={11} color="#6e778b"/></Pressable><Text style={s.jumlah}>{mencari ? "…" : data?.total ?? "—"} pesanan</Text><Pressable accessibilityRole="button" onPress={bukaFilter} style={s.filter}><Ionicons name="options-outline" size={14} color={ungu}/><Text style={s.filterTeks}>Filter</Text></Pressable></View>
        <View style={s.daftarJudul}><Text style={s.section}>Daftar Pesanan</Text><Text style={s.periode} numberOfLines={1}>{tanggal}</Text></View>
        {!!error && <View accessibilityRole="alert" style={s.error}><Text style={s.errorTeks}>{error}</Text><Pressable accessibilityRole="button" onPress={() => void muat()} hitSlop={8}><Text style={s.filterTeks}>Coba lagi</Text></Pressable></View>}
      </>}
      ListEmptyComponent={memuat || mencari ? <ActivityIndicator color={ungu} style={s.loader}/> : !error ? <Text style={s.kosong}>Tidak ada pesanan sesuai filter.</Text> : null}
      renderItem={({ item: d }) => <Pressable accessibilityRole="button" accessibilityLabel={`${d.pelanggan}, ${statusStaff[d.status] ?? d.status}, ${jamStaff(d.jadwal)} WIB`} onPress={() => nav.navigate("DetailStaff", { jenis: d.jenis, id: d.id })} style={s.kartu}>
        <View style={s.waktu}><Text style={s.jam}>{jamStaff(d.jadwal)}</Text><Text style={s.wib}>WIB</Text></View>
        <View style={s.rincian}><View style={s.barisNama}><Text style={s.nama} numberOfLines={1}>{d.pelanggan}</Text>{d.member && <Text style={s.member}>MEMBER</Text>}</View><Text style={s.deskripsi} numberOfLines={1} ellipsizeMode="tail">{(d.layanan ?? []).join(" + ") || "Rincian layanan"} · {d.barber ?? "Barber belum ditentukan"}</Text></View>
        <View style={s.statusKolom}><Text style={[s.badge, d.status === "IN_SERVICE" && s.badgeUngu, d.status === "COMPLETED" && s.badgeSelesai]} numberOfLines={2}>{statusStaff[d.status] ?? d.status}</Text><Ionicons name="chevron-forward" size={12} color="#9ba3b5"/></View>
      </Pressable>}
      ListFooterComponent={data && totalHalaman > 1 ? <View style={s.pagination}><Pressable accessibilityRole="button" accessibilityLabel="Halaman sebelumnya" disabled={memuat || halaman <= 1} onPress={() => aturHalaman(v => v - 1)} style={[s.pageButton, (memuat || halaman <= 1) && s.disabled]}><Ionicons name="chevron-back" size={15} color={ungu}/></Pressable><Text style={s.pageTeks}>{halaman} / {totalHalaman}</Text><Pressable accessibilityRole="button" accessibilityLabel="Halaman berikutnya" disabled={memuat || halaman >= totalHalaman} onPress={() => aturHalaman(v => v + 1)} style={[s.pageButton, (memuat || halaman >= totalHalaman) && s.disabled]}><Ionicons name="chevron-forward" size={15} color={ungu}/></Pressable></View> : null}/>
    <Modal transparent visible={sheet} animationType="slide" onRequestClose={() => aturSheet(false)}>
      <View style={s.overlay}><Pressable accessibilityLabel="Tutup filter" onPress={() => aturSheet(false)} style={StyleSheet.absoluteFill}/><View accessibilityViewIsModal style={[s.sheet, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={s.handle}/><View style={s.sheetJudul}><Text style={s.sheetTitle}>Filter Pesanan</Text><Pressable accessibilityRole="button" accessibilityLabel="Tutup filter" onPress={() => aturSheet(false)} hitSlop={10}><Ionicons name="close" size={20} color="#7c8599"/></Pressable></View>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.sheetIsi}>
          <Text style={s.label}>Jenis pesanan</Text><Chip nilai={draft.jenis} opsi={jenis} ubah={v => ubahDraft("jenis", v)}/>
          <Text style={s.label}>Tanggal</Text><Chip nilai={draft.periode} opsi={periode} ubah={v => ubahDraft("periode", v)}/>
          {draft.periode === "RENTANG" && <View style={s.rentang}>{(["mulai", "selesai"] as const).map(k => <View key={k} style={s.tanggalKolom}><Text style={s.keterangan}>{k === "mulai" ? "Dari" : "Sampai"} (YYYY-MM-DD)</Text><TextInput accessibilityLabel={k === "mulai" ? "Tanggal mulai" : "Tanggal selesai"} value={draft[k]} maxLength={10} placeholder="YYYY-MM-DD" onChangeText={v => ubahDraft(k, v)} style={s.tanggalInput}/></View>)}</View>}
          {!rentangSah && <Text style={s.errorTeks}>Masukkan rentang tanggal yang valid.</Text>}
          <Text style={s.label}>Status detail</Text><Chip nilai={draft.status} opsi={status} ubah={v => ubahDraft("status", v)}/>
          <Text style={s.keterangan}>Menunggu Pembayaran = Selesai dan Belum lunas. Kedaluwarsa mengikuti klasifikasi di Riwayat.</Text><Pressable accessibilityRole="button" onPress={() => { aturSheet(false); bukaTabStaff(nav, "Riwayat"); }} hitSlop={8}><Text style={s.filterTeks}>Buka Riwayat →</Text></Pressable>
          <Text style={s.label}>Pembayaran</Text><Chip nilai={draft.pembayaran} opsi={[["SEMUA", "Semua"], ["UNPAID", "Belum lunas"], ["PAID", "Lunas"]]} ubah={v => ubahDraft("pembayaran", v)}/>
          <Text style={s.label}>Urutan</Text><Chip nilai={draft.urutan} opsi={[["DESC", "Terbaru"], ["ASC", "Terlama"]]} ubah={v => ubahDraft("urutan", v)}/>
        </ScrollView>
        <View style={s.sheetFooter}><Pressable accessibilityRole="button" onPress={() => aturDraft({ ...filterAwal })} style={s.reset}><Text style={s.filterTeks}>Reset</Text></Pressable><Pressable accessibilityRole="button" disabled={!rentangSah} onPress={() => { aturFilter({ ...draft }); aturHalaman(1); aturSheet(false); }} style={[s.terapkan, !rentangSah && s.disabled]}><Text style={s.terapkanTeks}>Tampilkan pesanan</Text></Pressable></View>
      </View></View>
    </Modal>
  </SafeAreaView>;
}

const ungu = "#7653db";
const s = StyleSheet.create({
  aman: { flex: 1, backgroundColor: "#12203a" }, header: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 21 }, brand: { fontSize: 9, letterSpacing: 2, color: "#aeb9d4", marginBottom: 8, fontWeight: "600" }, judul: { fontSize: 23, fontWeight: "700", color: "#fff" }, subtitle: { fontSize: 10, color: "#bdc6dc", marginTop: 5 },
  isi: { flexGrow: 1, backgroundColor: "#f8f9fc", padding: 16, paddingBottom: 25 }, segment: { flexDirection: "row", backgroundColor: "#eff0f7", borderRadius: 9, padding: 3, marginBottom: 12 }, tab: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 7 }, tabAktif: { backgroundColor: "#fff" }, tabTeks: { fontSize: 11, color: "#8790a3", fontWeight: "600" }, teksAktif: { color: ungu },
  pencarian: { minHeight: 42, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e7eaf2", borderRadius: 11, paddingHorizontal: 12, marginBottom: 11 }, input: { flex: 1, minWidth: 0, paddingVertical: 10, fontSize: 11, color: "#18233b" }, kontrol: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 19 }, kontrolTanggal: { flexDirection: "row", gap: 5, alignItems: "center", maxWidth: "48%", borderRadius: 9, borderWidth: 1, borderColor: "#e7eaf2", backgroundColor: "#fff", paddingVertical: 8, paddingHorizontal: 9 }, kontrolTeks: { fontSize: 10, color: "#6e778b", flexShrink: 1 }, jumlah: { flex: 1, textAlign: "right", color: "#929aab", fontSize: 9 }, filter: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e7eaf2", borderRadius: 9, paddingVertical: 8, paddingHorizontal: 9 }, filterTeks: { fontSize: 10, fontWeight: "600", color: ungu }, daftarJudul: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 11 }, section: { fontSize: 13, fontWeight: "700", color: "#18233b", flex: 1 }, periode: { fontSize: 9, color: "#929aab", maxWidth: "55%" },
  kartu: { minHeight: 70, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e7eaf2", borderRadius: 12, marginBottom: 7, paddingHorizontal: 10, paddingVertical: 13, flexDirection: "row", alignItems: "center", gap: 9 }, waktu: { width: 39, paddingRight: 8, borderRightWidth: 1, borderRightColor: "#edf0f5" }, jam: { fontSize: 11, color: "#18233b", fontWeight: "700", fontVariant: ["tabular-nums"] }, wib: { fontSize: 7, color: "#9aa2b2", marginTop: 3 }, rincian: { flex: 1, minWidth: 0 }, barisNama: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 5 }, nama: { fontSize: 11, fontWeight: "700", color: "#18233b", flexShrink: 1 }, member: { color: ungu, fontSize: 7, fontWeight: "700", borderRadius: 4, backgroundColor: "#eee8fc", paddingHorizontal: 4, paddingVertical: 2 }, deskripsi: { fontSize: 9, color: "#9099aa", lineHeight: 13 }, statusKolom: { flexDirection: "row", alignItems: "center", gap: 3, maxWidth: 90 }, badge: { fontSize: 8, color: "#8b7735", backgroundColor: "#faf3dc", borderRadius: 5, paddingHorizontal: 5, paddingVertical: 4, flexShrink: 1, overflow: "hidden" }, badgeUngu: { color: ungu, backgroundColor: "#f0eafd" }, badgeSelesai: { color: "#388168", backgroundColor: "#eaf6ef" },
  pagination: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 14, paddingVertical: 14 }, pageButton: { padding: 7, borderWidth: 1, borderColor: "#e7eaf2", borderRadius: 7, backgroundColor: "#fff" }, pageTeks: { color: "#8790a3", fontSize: 10 }, disabled: { opacity: 0.4 }, loader: { marginVertical: 18 }, kosong: { fontSize: 11, color: "#8790a3", marginVertical: 15 }, error: { backgroundColor: "#fff1ee", padding: 10, borderRadius: 9, gap: 8, marginBottom: 10 }, errorTeks: { fontSize: 11, color: "#a43d33", lineHeight: 17 },
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "#12203a66" }, sheet: { maxHeight: "85%", backgroundColor: "#fff", borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingHorizontal: 18 }, handle: { width: 32, height: 4, borderRadius: 3, backgroundColor: "#dce0ea", alignSelf: "center", marginTop: 9, marginBottom: 15 }, sheetJudul: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }, sheetTitle: { fontSize: 16, fontWeight: "700", color: "#18233b" }, sheetIsi: { paddingBottom: 12 }, label: { fontSize: 11, color: "#5e687e", fontWeight: "600", marginTop: 16, marginBottom: 9 }, chips: { flexDirection: "row", flexWrap: "wrap", gap: 7 }, chip: { backgroundColor: "#f7f8fb", borderWidth: 1, borderColor: "#e9ecf3", borderRadius: 7, paddingHorizontal: 10, paddingVertical: 8 }, chipAktif: { backgroundColor: "#f0eafd", borderColor: "#d7c9f7" }, chipTeks: { fontSize: 10, color: "#8790a3" }, keterangan: { fontSize: 9, color: "#929aab", lineHeight: 14, marginTop: 7, marginBottom: 5 }, rentang: { flexDirection: "row", gap: 8 }, tanggalKolom: { flex: 1 }, tanggalInput: { borderWidth: 1, borderColor: "#e7eaf2", borderRadius: 8, padding: 9, fontSize: 11, color: "#18233b" }, sheetFooter: { flexDirection: "row", gap: 10, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#edf0f5" }, reset: { padding: 12, borderWidth: 1, borderColor: "#e7eaf2", borderRadius: 9, alignItems: "center", flex: 1 }, terapkan: { flex: 2, backgroundColor: ungu, padding: 12, borderRadius: 9, alignItems: "center" }, terapkanTeks: { fontSize: 11, fontWeight: "600", color: "#fff" },
});
