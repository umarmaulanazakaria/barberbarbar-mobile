import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import axios from "axios";
import { api, ambilPesanKesalahan } from "../layanan/api";
import { usePenyegaranRealtime } from "../hooks/usePenyegaranRealtime";
import { segarkanRealtime } from "../layanan/sinyalRealtime";
import { useSesiStore } from "../store/useSesiStore";
import type { Barber } from "../tipe/barber";
import type { Layanan } from "../tipe/layanan";
import type { MemberTerverifikasiStaff } from "./MemberStaff";
import VerifikasiWalkinMinimalStaff from "./VerifikasiWalkinMinimalStaff";
import { bacaPermintaanStaff, hapusPermintaanStaff, katalogStaff, kunciStaff, pesanStaff, profilStaff, rupiahStaff, simpanPermintaanStaff, type ProfilStaff } from "./layananStaff";
import type { RuteStaff } from "./NavigasiStaff";

type Permintaan = { pelanggan: { jenis: "ANONIM" } | { jenis: "LAMA"; id: number }; barberId: number | null; konfirmasiMember?: true; verifikasiId?: number; items: { layananId: number; qty: 1; hargaDiharapkan: number }[]; totalDiharapkan: number; kunciIdempotensi: string };
type Quote = { member: boolean; subtotal: number; promo: number | null; diskonMember: number; total: number; items: { layananId: number; namaLayanan: string; harga: number; hargaDiharapkan: number; subtotal: number }[] };
type Hasil = { data: { id: number; nomorPesanan: string; total: number } };
type Rincian = { quote: Quote; body: Permintaan; nama: string; barber: string; member: boolean; konfirmasi: boolean };
export default function LayarWalkinStaff() {
  const nav = useNavigation<NativeStackNavigationProp<RuteStaff>>(), insets = useSafeAreaInsets(), tinggiTab = useBottomTabBarHeight(), user = useSesiStore(v => v.pengguna), penyimpanan = `bb-staff-walkin-${user?.id}`;
  const kunci = useRef(kunciStaff()), guard = useRef(false), versi = useRef(0), versiHarga = useRef(0);
  const [barber, aturBarber] = useState<Barber[]>([]), [layanan, aturLayanan] = useState<Layanan[]>([]), [muat, aturMuat] = useState(true), [barberId, aturBarberId] = useState(0), [items, aturItems] = useState<number[]>([]);
  const [mode, aturMode] = useState(false), [member, aturMember] = useState<MemberTerverifikasiStaff | null>(null), [cari, aturCari] = useState(""), [profil, aturProfil] = useState<ProfilStaff | null>(null), [opsi, aturOpsi] = useState<ProfilStaff[]>([]), [mencari, aturMencari] = useState(false);
  const [harga, aturHarga] = useState<{ sidik: string; quote: Quote } | null>(null), [hargaSibuk, aturHargaSibuk] = useState(false), [error, aturError] = useState(""), [sibuk, aturSibuk] = useState(false), [tertunda, aturTertunda] = useState<Permintaan | null>(null), [rincian, aturRincian] = useState<Rincian | null>(null), [hasil, aturHasil] = useState<Hasil["data"] | null>(null);
  const pemilik = mode ? member?.profil : profil, pilihan = layanan.filter(l => items.includes(l.id));
  const sidik = JSON.stringify({ items, profilId: pemilik?.id, mode, bukti: member?.verifikasiId, cari: mode ? "" : cari.trim() });
  const quote = harga?.sidik === sidik ? harga.quote : null;
  const alasan = muat ? "Memuat katalog…" : tertunda ? "Pastikan hasil permintaan tersimpan terlebih dahulu." : !items.length ? "Pilih minimal satu layanan." : mode && !member ? "Periksa Kartu Member dan KTP terlebih dahulu." : !mode && cari.trim() && !profil ? "Pilih profil existing atau kosongkan nama untuk anonim." : !quote ? "Harga Backend belum tersedia." : "";
  const muatAwal = useCallback(async () => {
    const v = ++versi.current; aturMuat(true); aturError("");
    try { const [k, pending] = await Promise.all([katalogStaff(), bacaPermintaanStaff<Permintaan>(penyimpanan)]); if (v !== versi.current) return; aturBarber(k.barber); aturLayanan(k.layanan); aturTertunda(pending); if (pending) kunci.current = pending.kunciIdempotensi; }
    catch (e) { if (v === versi.current) aturError(ambilPesanKesalahan(e)); }
    finally { if (v === versi.current) aturMuat(false); }
  }, [penyimpanan]);
  useFocusEffect(useCallback(() => { void muatAwal(); return () => { versi.current++; versiHarga.current++; }; }, [muatAwal]));
  usePenyegaranRealtime(["katalog", "membership", "pelanggan"], muatAwal);
  const ambilQuote = useCallback(async (): Promise<Quote> => {
    if (!items.length || items.length > 50) throw Error("Pilih 1–50 layanan yang tersedia.");
    if (mode && !member) throw Error("Verifikasi Kartu Member dan KTP terlebih dahulu.");
    if (!mode && cari.trim() && !profil) throw Error("Pilih profil existing atau kosongkan nama untuk anonim. Pembuatan profil baru hanya melalui Admin.");
    const q = (await api.post<Quote>("/management/membership-benefits/quote", { ...(pemilik ? { profilId: pemilik.id } : {}), items: items.map(layananId => ({ layananId, qty: 1 })) })).data;
    if (!Number.isSafeInteger(q.total) || !Number.isSafeInteger(q.subtotal) || !Number.isSafeInteger(q.diskonMember) || q.items.length !== items.length || q.items.some(i => !items.includes(i.layananId) || !Number.isSafeInteger(i.hargaDiharapkan))) throw Error("Rincian harga Backend belum dapat dipastikan. Perbarui katalog dan coba lagi.");
    if (q.member !== mode) throw Error(q.member ? "Profil memiliki Membership aktif. Gunakan mode Member dan periksa identitas." : "Manfaat Member belum dapat digunakan. Minta pemeriksaan Admin.");
    return q;
  }, [sidik]);
  useEffect(() => {
    const v = ++versiHarga.current; aturHarga(null);
    if (muat || tertunda || !items.length || mode && !member || !mode && cari.trim() && !profil) { aturHargaSibuk(false); return; }
    aturHargaSibuk(true);
    const t = setTimeout(() => { void ambilQuote().then(q => { if (v === versiHarga.current) aturHarga({ sidik, quote: q }); }).catch(e => { if (v === versiHarga.current) aturError(pesanStaff(e) ?? ambilPesanKesalahan(e)); }).finally(() => { if (v === versiHarga.current) aturHargaSibuk(false); }); }, 250);
    return () => { clearTimeout(t); versiHarga.current++; };
  }, [ambilQuote, sidik, muat, tertunda]);
  const cariProfil = async () => { if (guard.current) return; guard.current = true; aturMencari(true); aturError(""); try { aturOpsi(await profilStaff(cari.trim())); } catch (e) { aturError(ambilPesanKesalahan(e)); } finally { guard.current = false; aturMencari(false); } };
  const bukaRincian = async (konfirmasi: boolean) => {
    if (guard.current || tertunda || alasan) return; guard.current = true; aturSibuk(true); aturError(""); versiHarga.current++;
    try { const q = await ambilQuote(); aturHarga({ sidik, quote: q });
      const body: Permintaan = { pelanggan: pemilik ? { jenis: "LAMA", id: pemilik.id } : { jenis: "ANONIM" }, barberId: barberId || null, ...(mode ? { konfirmasiMember: true, verifikasiId: member!.verifikasiId } : {}), items: q.items.map(i => ({ layananId: i.layananId, qty: 1, hargaDiharapkan: i.hargaDiharapkan })), totalDiharapkan: q.total, kunciIdempotensi: kunci.current };
      aturRincian({ quote: q, body, nama: pemilik?.nama ?? "Pelanggan Anonim", barber: barber.find(b => b.id === barberId)?.nama ?? "Tentukan nanti", member: mode, konfirmasi });
    } catch (e) { aturHarga(null); aturError(pesanStaff(e) ?? ambilPesanKesalahan(e)); }
    finally { guard.current = false; aturSibuk(false); aturHargaSibuk(false); }
  };
  const selesai = async (d: Hasil["data"]) => { await hapusPermintaanStaff(penyimpanan); aturTertunda(null); aturRincian(null); aturHasil(d); kunci.current = kunciStaff(); aturItems([]); aturHarga(null); aturProfil(null); aturMember(null); aturCari(""); aturBarberId(0); segarkanRealtime(); };
  const kirim = async (body: Permintaan) => {
    if (guard.current) return; guard.current = true; aturSibuk(true); aturError("");
    try { await simpanPermintaanStaff(penyimpanan, body); aturTertunda(body); if (body.konfirmasiMember && !body.verifikasiId) throw Error("Verifikasi fisik Member diperlukan untuk permintaan ini."); const r = (await api.post<Hasil>(body.konfirmasiMember ? "/management/membership-benefits/staff/walk-in" : "/orders/walk-in", body, { timeout: 25000 })).data; await selesai(r.data); }
    catch (e) { aturRincian(null); aturError(pesanStaff(e) ?? ambilPesanKesalahan(e)); if (axios.isAxiosError(e) && e.response?.status === 409 && e.response.data?.kode === "VERIFIKASI_MEMBER_TIDAK_SAH") { const ulang = { ...body, verifikasiId: undefined }; await simpanPermintaanStaff(penyimpanan, ulang); aturTertunda(ulang); } else if (axios.isAxiosError(e) && e.response?.status === 409 && e.response.data?.kode && !["IDEMPOTENSI_BERBEDA", "DATA_TERPAKAI"].includes(e.response.data.kode)) { await hapusPermintaanStaff(penyimpanan); aturTertunda(null); aturHarga(null); } }
    finally { guard.current = false; aturSibuk(false); }
  };
  return <SafeAreaView edges={["top", "left", "right"]} style={s.aman}>
    <View style={s.header}><Text style={s.brand}>BARBER BARBAR · STAFF</Text><Text style={s.judul}>Tambah Walk-in</Text><Text style={s.subtitle}>Daftarkan pelanggan di toko · WIB</Text></View>
    <KeyboardAvoidingView style={s.badan} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={tinggiTab}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.isi} refreshControl={<RefreshControl refreshing={muat} onRefresh={() => void muatAwal()} tintColor={ungu}/>}>
        {!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
        {hasil && <View style={s.panel}><Text style={s.section}>Walk-in tercatat</Text><Text style={s.catatan}>{hasil.nomorPesanan} · {rupiahStaff(hasil.total)}</Text><Pressable accessibilityRole="button" onPress={() => nav.navigate("DetailStaff", { jenis: "WALK_IN", id: hasil.id })} hitSlop={8}><Text style={s.link}>Buka Detail Pesanan →</Text></Pressable></View>}
        {tertunda ? <View style={s.panel}><Text style={s.section}>Permintaan tersimpan</Text><Text style={s.catatan}>Hasil belum dipastikan. Jangan membuat pesanan pengganti atau mengganti kunci permintaan.</Text>
          {tertunda.konfirmasiMember && !tertunda.verifikasiId && <VerifikasiWalkinMinimalStaff kunciPermintaan={tertunda.kunciIdempotensi} onReset={() => undefined} onVerifikasi={m => { if (tertunda.pelanggan.jenis !== "LAMA" || tertunda.pelanggan.id !== m.profil.id) { aturError("Member tidak sesuai permintaan tersimpan. Minta pemeriksaan Admin."); return; } const baru = { ...tertunda, verifikasiId: m.verifikasiId }; void simpanPermintaanStaff(penyimpanan, baru).then(() => aturTertunda(baru)).catch(e => aturError(ambilPesanKesalahan(e))); }}/>}<Pressable accessibilityRole="button" disabled={sibuk || !!tertunda.konfirmasiMember && !tertunda.verifikasiId} onPress={() => void kirim(tertunda)} style={s.retry}><Text style={s.link}>Kirim ulang permintaan yang sama</Text></Pressable><Pressable accessibilityRole="button" disabled={sibuk} onPress={() => { if (guard.current) return; guard.current = true; aturSibuk(true); void api.get<Hasil>(`/orders/walk-in/requests/${tertunda.kunciIdempotensi}`).then(r => selesai(r.data.data)).catch(e => aturError(ambilPesanKesalahan(e))).finally(() => { guard.current = false; aturSibuk(false); }); }} style={s.retry}><Text style={s.link}>Periksa hasil Backend →</Text></Pressable>
        </View> : <>
          <Text style={s.section}>Pelanggan</Text><View style={s.panel} pointerEvents={sibuk || mencari ? "none" : "auto"}>
            <View style={s.segment}>{[false, true].map(m => <Pressable accessibilityRole="tab" accessibilityState={{ selected: mode === m }} key={String(m)} onPress={() => { aturMode(m); aturMember(null); aturProfil(null); aturCari(""); aturOpsi([]); aturError(""); }} style={[s.tab, mode === m && s.tabAktif]}><Text style={[s.tabTeks, mode === m && s.ungu]}>{m ? "Member" : "Reguler"}</Text></Pressable>)}</View>
            {mode ? <VerifikasiWalkinMinimalStaff key={kunci.current} kunciPermintaan={kunci.current} onReset={() => aturMember(null)} onVerifikasi={aturMember}/> : <>
              <Text style={s.label}>Nama pelanggan (opsional)</Text><TextInput accessibilityLabel="Nama pelanggan (opsional)" placeholder="Kosongkan untuk pelanggan anonim" value={cari} maxLength={100} onChangeText={v => { aturCari(v); aturProfil(null); aturOpsi([]); }} style={s.input}/>
              <Pressable accessibilityRole="button" disabled={mencari || !cari.trim()} onPress={() => void cariProfil()} hitSlop={8} style={s.cari}><Text style={s.link}>{mencari ? "Mencari…" : "Cari profil →"}</Text></Pressable>
              {opsi.map(p => <Pressable key={p.id} accessibilityRole="button" onPress={() => { aturProfil(p); aturCari(p.nama); aturOpsi([]); }} style={s.opsi}><Text style={s.nama}>{p.nama}</Text><Text style={s.catatan}>{p.nomorTelepon}</Text></Pressable>)}
              {profil && <Text style={s.catatan}>Profil dipilih: {profil.nama}</Text>}{!!cari.trim() && !profil && <Text style={s.catatan}>Pilih profil existing. Nama baru harus didaftarkan Admin; kosongkan untuk anonim.</Text>}
            </>}
          </View>
          <Text style={s.section}>Barber</Text><Text style={s.petunjuk}>Opsional · dapat ditentukan nanti</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.barber}>{[{ id: 0, nama: "Tentukan nanti" }, ...barber].map(b => <Pressable key={b.id} accessibilityRole="button" accessibilityState={{ selected: barberId === b.id }} disabled={sibuk} onPress={() => aturBarberId(b.id)} style={[s.chip, barberId === b.id && s.chipAktif]}><Text style={[s.chipTeks, barberId === b.id && s.ungu]}>{b.nama}</Text></Pressable>)}</ScrollView>
          <View style={s.judulLayanan}><Text style={s.section}>Pilih layanan</Text><Text style={s.catatan}>{items.length} dipilih</Text></View>
          <View style={s.layananPanel}>{layanan.map((l, n) => <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: items.includes(l.id) }} disabled={sibuk} key={l.id} onPress={() => { aturItems(v => v.includes(l.id) ? v.filter(i => i !== l.id) : [...v, l.id]); aturError(""); }} style={[s.layanan, n > 0 && s.pemisah]}><Ionicons name={items.includes(l.id) ? "checkbox" : "square-outline"} color={items.includes(l.id) ? ungu : "#c9ceda"} size={18}/><Text style={s.layananNama} numberOfLines={2}>{l.nama}</Text><Text style={s.harga}>{rupiahStaff(l.harga)}</Text></Pressable>)}{muat && <ActivityIndicator color={ungu} style={s.loader}/>}</View>
          {!muat && !layanan.length && <Pressable accessibilityRole="button" onPress={() => void muatAwal()} hitSlop={8}><Text style={s.link}>Muat ulang katalog →</Text></Pressable>}
          {mode && <Text style={s.catatan}>Manfaat mengikuti status dan mapping layanan resmi Backend. Setiap jenis layanan dipilih satu kali.</Text>}
        </>}
      </ScrollView>
      <View style={s.footer}><View style={s.totalKolom}><Text style={s.estimasi}>Estimasi total</Text><Text style={s.total} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={.7}>{quote ? rupiahStaff(quote.total) : hargaSibuk ? "…" : "—"}</Text><Pressable accessibilityRole="button" disabled={!!alasan || sibuk} onPress={() => void bukaRincian(false)} hitSlop={8}><Text style={s.link}>Lihat rincian ↗</Text></Pressable></View><View style={s.buatKolom}><Pressable accessibilityRole="button" disabled={!!alasan || sibuk || hargaSibuk} onPress={() => void bukaRincian(true)} style={[s.buat, (!!alasan || sibuk || hargaSibuk) && s.nonaktif]}><Text style={s.buatTeks}>{sibuk ? "Memproses…" : "Buat Walk-in →"}</Text></Pressable>{!!alasan && <Text style={s.alasan}>{alasan}</Text>}</View></View>
    </KeyboardAvoidingView>
    <Modal transparent visible={!!rincian} animationType="slide" onRequestClose={() => !sibuk && aturRincian(null)}><View style={s.overlay}><Pressable style={StyleSheet.absoluteFill} accessibilityLabel="Tutup rincian" onPress={() => !sibuk && aturRincian(null)}/><View accessibilityViewIsModal style={[s.sheet, { paddingBottom: Math.max(insets.bottom, 12) }]}><View style={s.handle}/><Text style={s.sheetTitle}>{rincian?.konfirmasi ? "Konfirmasi Walk-in" : "Rincian Harga"}</Text><ScrollView contentContainerStyle={s.sheetIsi}>
      {rincian && <><Text style={s.nama}>{rincian.nama}</Text><Text style={s.catatan}>{rincian.member ? "Member" : "Reguler"} · Barber: {rincian.barber}</Text>{rincian.quote.items.map(i => <View key={i.layananId} style={s.rinciBaris}><Text style={s.rinciNama}>{i.namaLayanan} ×1</Text><Text style={s.harga}>{rupiahStaff(i.subtotal)}</Text></View>)}<View style={s.rinciBaris}><Text style={s.catatan}>Subtotal</Text><Text style={s.harga}>{rupiahStaff(rincian.quote.subtotal)}</Text></View><View style={s.rinciBaris}><Text style={s.catatan}>Promo</Text><Text style={s.catatan}>{rincian.quote.promo === null ? "Tidak dirinci" : rupiahStaff(rincian.quote.promo)}</Text></View><View style={s.rinciBaris}><Text style={s.catatan}>Manfaat Membership</Text><Text style={s.harga}>{rupiahStaff(rincian.quote.diskonMember)}</Text></View><View style={s.rinciBaris}><Text style={s.nama}>Total akhir</Text><Text style={s.total}>{rupiahStaff(rincian.quote.total)}</Text></View><Text style={s.catatan}>Harga diperiksa ulang oleh Backend saat disimpan. Status awal Menunggu; pembayaran mengikuti alur existing.</Text></>}
    </ScrollView><View style={s.sheetFooter}><Pressable accessibilityRole="button" disabled={sibuk} onPress={() => aturRincian(null)} style={s.kembali}><Text style={s.link}>Kembali</Text></Pressable>{rincian?.konfirmasi && <Pressable accessibilityRole="button" disabled={sibuk} onPress={() => void kirim(rincian.body)} style={[s.konfirmasi, sibuk && s.nonaktif]}><Text style={s.buatTeks}>{sibuk ? "Memproses…" : "Konfirmasi"}</Text></Pressable>}</View></View></View></Modal>
  </SafeAreaView>;
}

const ungu = "#7553dd";
const s = StyleSheet.create({
  aman: { flex: 1, backgroundColor: "#12203a" }, header: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 21 }, brand: { color: "#aeb9d4", fontSize: 9, letterSpacing: 2, marginBottom: 8, fontWeight: "600" }, judul: { color: "#fff", fontSize: 23, fontWeight: "700" }, subtitle: { color: "#bdc6dc", fontSize: 10, marginTop: 5 }, badan: { flex: 1, backgroundColor: "#f8f9fc" }, isi: { padding: 16, paddingBottom: 22 }, section: { color: "#18233b", fontSize: 13, fontWeight: "700", marginBottom: 10 }, panel: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#e8ebf2", borderRadius: 13, padding: 12, marginBottom: 18 }, segment: { flexDirection: "row", backgroundColor: "#eff0f7", borderRadius: 8, padding: 3, marginBottom: 13 }, tab: { flex: 1, alignItems: "center", paddingVertical: 7, borderRadius: 6 }, tabAktif: { backgroundColor: "#fff" }, tabTeks: { color: "#8790a3", fontSize: 11, fontWeight: "600" }, ungu: { color: ungu }, label: { fontSize: 10, color: "#69758b", marginBottom: 7 }, input: { borderWidth: 1, borderColor: "#e8ebf2", borderRadius: 9, paddingHorizontal: 10, minHeight: 39, fontSize: 11, color: "#18233b" }, link: { color: ungu, fontSize: 10, fontWeight: "600" }, cari: { alignSelf: "flex-start", marginTop: 10 }, catatan: { color: "#8790a3", fontSize: 10, lineHeight: 16, marginTop: 4 }, nama: { color: "#18233b", fontSize: 12, fontWeight: "600" }, opsi: { borderTopWidth: 1, borderTopColor: "#edf0f5", paddingVertical: 9, marginTop: 5 }, petunjuk: { color: "#929aab", fontSize: 9, marginTop: -5, marginBottom: 10 }, barber: { marginBottom: 19 }, chip: { minHeight: 36, justifyContent: "center", paddingHorizontal: 12, borderWidth: 1, borderColor: "#e8ebf2", backgroundColor: "#fff", borderRadius: 8, marginRight: 7 }, chipAktif: { backgroundColor: "#f0eafd", borderColor: "#d7c9f7" }, chipTeks: { color: "#8790a3", fontSize: 10 }, judulLayanan: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }, layananPanel: { borderWidth: 1, borderColor: "#e8ebf2", backgroundColor: "#fff", borderRadius: 13, overflow: "hidden" }, layanan: { minHeight: 49, flexDirection: "row", alignItems: "center", gap: 9, paddingHorizontal: 12, paddingVertical: 10 }, pemisah: { borderTopWidth: 1, borderTopColor: "#edf0f5" }, layananNama: { flex: 1, minWidth: 0, color: "#536079", fontSize: 11 }, harga: { color: "#18233b", fontSize: 10, fontWeight: "600", textAlign: "right" }, loader: { marginVertical: 15 }, error: { backgroundColor: "#fff1ee", borderRadius: 9, padding: 10, color: "#a43d33", fontSize: 11, lineHeight: 17, marginBottom: 12 }, retry: { paddingVertical: 10 },
  footer: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#e8ebf2", paddingHorizontal: 18, paddingVertical: 12 }, totalKolom: { flex: 1, minWidth: 0, gap: 4 }, estimasi: { color: "#8790a3", fontSize: 9 }, total: { color: "#18233b", fontSize: 19, fontWeight: "700", fontVariant: ["tabular-nums"] }, buatKolom: { flex: 1.2 }, buat: { backgroundColor: ungu, borderRadius: 9, paddingVertical: 13, alignItems: "center", paddingHorizontal: 10 }, buatTeks: { color: "#fff", fontSize: 11, fontWeight: "600" }, alasan: { color: "#929aab", fontSize: 8, lineHeight: 12, marginTop: 5 }, nonaktif: { opacity: .4 },
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "#12203a66" }, sheet: { maxHeight: "80%", backgroundColor: "#fff", borderTopLeftRadius: 21, borderTopRightRadius: 21, paddingHorizontal: 18 }, handle: { width: 32, height: 4, borderRadius: 3, backgroundColor: "#dce0ea", alignSelf: "center", marginTop: 9, marginBottom: 15 }, sheetTitle: { color: "#18233b", fontSize: 16, fontWeight: "700", marginBottom: 14 }, sheetIsi: { paddingBottom: 14 }, rinciBaris: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#edf0f5" }, rinciNama: { flex: 1, color: "#69758b", fontSize: 11 }, sheetFooter: { flexDirection: "row", gap: 10, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#e8ebf2" }, kembali: { borderWidth: 1, borderColor: "#e8ebf2", borderRadius: 9, padding: 12, alignItems: "center", flex: 1 }, konfirmasi: { backgroundColor: ungu, borderRadius: 9, padding: 12, alignItems: "center", flex: 2 },
});
