import { useCallback, useRef, useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import axios from "axios";
import { api, ambilPesanKesalahan } from "../layanan/api";
import { usePenyegaranRealtime } from "../hooks/usePenyegaranRealtime";
import { useSesiStore } from "../store/useSesiStore";
import { bacaPermintaanStaff, hapusPermintaanStaff, kunciStaff, jamStaff, rupiahStaff, simpanPermintaanStaff, tanggalStaff, type DokumenStaff, type TransaksiStaff } from "./layananStaff";
import { HalamanStaff, InputStaff, MemuatStaff, PanelStaff, PesanStaff, s, TombolStaff } from "./UiStaff";
import type { RuteStaff } from "./NavigasiStaff";
type PermintaanBayar = { metode: "CASH" | "TRANSFER" | "QRIS"; kunciIdempotensi: string; tagihanDiharapkan: number; diterima?: true; jumlahDiterima?: number; referensi?: string };
export default function LayarBayarStaff() {
  const { params: { jenis, id, pesananId } } = useRoute<RouteProp<RuteStaff, "BayarStaff">>(), nav = useNavigation<NativeStackNavigationProp<RuteStaff>>(), user = useSesiStore(v => v.pengguna), storage = `bb-staff-pay-${user?.id}-${pesananId}`;
  const [doc, aturDoc] = useState<DokumenStaff | null>(null), [transaksi, aturTransaksi] = useState<TransaksiStaff[]>([]), [metode, aturMetode] = useState<PermintaanBayar["metode"]>("CASH"), [jumlah, aturJumlah] = useState(""), [referensi, aturReferensi] = useState(""), [diterima, aturDiterima] = useState(false);
  const [pending, aturPending] = useState<PermintaanBayar | null>(null), [memuat, aturMemuat] = useState(true), [sibuk, aturSibuk] = useState(false), [error, aturError] = useState(""), kunci = useRef(false), versi = useRef(0);
  const muat = useCallback(async () => { const v = ++versi.current; aturError(""); try { const [d, t, p] = await Promise.all([api.get<DokumenStaff>(`/management/finance/documents/${jenis === "BOOKING" ? "B" : "W"}-${id}`), api.get<{ transaksi: TransaksiStaff[] }>(`/management/payments/${pesananId}`), bacaPermintaanStaff<PermintaanBayar>(storage)]); if (v !== versi.current) return; aturDoc(d.data); aturTransaksi(t.data.transaksi); aturPending(p); } catch (e) { if (v === versi.current) aturError(ambilPesanKesalahan(e)); } finally { if (v === versi.current) aturMemuat(false); } }, [jenis, id, pesananId, storage]);
  useFocusEffect(useCallback(() => { void muat(); return () => { versi.current++; }; }, [muat]));
  usePenyegaranRealtime(["pembayaran", "pesanan", "booking"], muat);
  const aktif = transaksi.find(t => t.status === "PENDING"), diblokir = sibuk || !!pending || !!aktif;
  const bolehBayar = doc?.keadaan === "COMPLETED" && !error;
  const kirim = async () => {
    if (kunci.current || !doc || doc.balance <= 0) return; kunci.current = true; aturSibuk(true); aturError("");
    const body: PermintaanBayar = pending ?? { metode, kunciIdempotensi: kunciStaff(), tagihanDiharapkan: doc.balance, ...(metode !== "QRIS" ? { diterima: true, jumlahDiterima: Number(jumlah), ...(metode === "TRANSFER" ? { referensi: referensi.trim() } : {}) } : {}) };
    try { await simpanPermintaanStaff(storage, body); aturPending(body); await api.post(`/management/payments/${pesananId}`, body, { timeout: 25000 }); await hapusPermintaanStaff(storage); aturPending(null); await muat(); }
    catch (e) { await muat(); aturError(ambilPesanKesalahan(e)); if (axios.isAxiosError(e) && e.response && [400,409].includes(e.response.status) && e.response.data?.kode !== "IDEMPOTENSI_BERBEDA") { await hapusPermintaanStaff(storage); aturPending(null); } }
    finally { kunci.current = false; aturSibuk(false); }
  };
  const sinkron = async (t: TransaksiStaff) => { if (kunci.current) return; kunci.current = true; aturSibuk(true); aturError(""); try { await api.post(`/management/payments/${pesananId}/${t.id}/sync`, {}); await muat(); } catch (e) { aturError(ambilPesanKesalahan(e)); } finally { kunci.current = false; aturSibuk(false); } };
  const qrisAman = (url: string | null) => { if (!url) return false; try { const u = new URL(url); return u.protocol === "https:" && u.hostname === "api.sandbox.midtrans.com" && !u.username && !u.password && /^\/v[24]\/qris\/[A-Za-z0-9-]+\/qr-code$/.test(u.pathname) && !u.search && !u.hash; } catch { return false; } };
  const valid = metode === "QRIS" || diterima && Number.isSafeInteger(Number(jumlah)) && Number(jumlah) >= (doc?.balance ?? Infinity) && (metode !== "TRANSFER" || Number(jumlah) === doc?.balance && referensi.trim().length >= 3);
  return <HalamanStaff judul="Pembayaran" kembali={() => nav.goBack()} refresh={() => void muat()} memuat={false}>
    <PesanStaff pesan={error}/>{memuat && <MemuatStaff/>}{doc && <PanelStaff><Text style={s.kecil}>{doc.referensi} · {doc.pelanggan}</Text><Text style={s.teks}>Total {rupiahStaff(doc.total)}</Text><Text style={s.teks}>Sudah dibayar {rupiahStaff(doc.dibayar)}</Text><Text style={s.h2}>Sisa tagihan {rupiahStaff(doc.balance)}</Text><Text style={s.kecil}>DP dan pembayaran yang telah terverifikasi sudah diperhitungkan pada sisa tagihan.</Text></PanelStaff>}
    {doc && doc.balance === 0 ? <PanelStaff><Text style={s.h2}>{doc.final && ["PAID", "FREE"].includes(doc.status) ? "Tagihan selesai" : "Menunggu finalisasi dokumen"}</Text>{(doc.struk.length > 0 || doc.final) && <TombolStaff judul="Lihat Struk" aksi={() => nav.navigate("StrukStaff", { jenis, id })}/>}</PanelStaff> : <>
      {pending && <PanelStaff><Text style={s.teks}>Hasil permintaan belum dipastikan. Jangan menerima pembayaran pengganti.</Text><TombolStaff judul="Periksa / kirim ulang pembayaran yang sama" nonaktif={sibuk} aksi={() => void kirim()}/></PanelStaff>}
      {aktif && <PanelStaff><Text style={s.h2}>Menunggu pembayaran terverifikasi</Text><Text style={s.teks}>{rupiahStaff(aktif.nominal)} · {aktif.metode}</Text>{qrisAman(aktif.urlQris) && <Image source={{ uri: aktif.urlQris! }} accessibilityLabel="QRIS pembayaran Midtrans" style={{ width: 230, height: 230, alignSelf: "center", marginVertical: 15 }} resizeMode="contain"/>}{aktif.kedaluwarsaPada && <Text style={s.kecil}>Batas pembayaran {tanggalStaff(aktif.kedaluwarsaPada)} {jamStaff(aktif.kedaluwarsaPada)} WIB</Text>}<Text style={s.kecil}>QRIS ditampilkan bukan bukti lunas. Tunggu verifikasi pembayaran.</Text><TombolStaff judul="Periksa status pembayaran" nonaktif={sibuk} aksi={() => void sinkron(aktif)}/></PanelStaff>}
      {!pending && !aktif && doc && <PanelStaff><Text style={s.h2}>Metode pembayaran</Text>{(["CASH", "TRANSFER", "QRIS"] as const).map(m => <TombolStaff key={m} judul={m === "CASH" ? "Tunai" : m === "TRANSFER" ? "Transfer Manual" : "QRIS Midtrans"} sekunder={metode !== m} nonaktif={diblokir} aksi={() => { aturMetode(m); aturDiterima(false); }}/>) }{metode !== "QRIS" && <><InputStaff label="Jumlah diterima" numerik nilai={jumlah} nonaktif={diblokir} ubah={aturJumlah}/>{metode === "TRANSFER" && <InputStaff label="Referensi transfer" nilai={referensi} nonaktif={diblokir} ubah={aturReferensi}/>}<Pressable accessibilityRole="checkbox" accessibilityState={{ checked: diterima }} disabled={diblokir} onPress={() => aturDiterima(v => !v)} style={{ marginBottom: 16 }}><Text style={s.teks}>{diterima ? "☑" : "☐"} {metode === "CASH" ? "Saya telah menerima uang tunai" : "Saya telah memeriksa dana transfer masuk"}</Text></Pressable>{metode === "CASH" && <Text style={s.teks}>Kembalian {rupiahStaff(Math.max(0, Number(jumlah) - doc.balance))}</Text>}</>}<TombolStaff judul={metode === "QRIS" ? "Buat QRIS Pembayaran" : "Konfirmasi Penerimaan Dana"} nonaktif={diblokir || !valid || !bolehBayar} aksi={() => void kirim()}/></PanelStaff>}
    </>}
    <View style={{ marginTop: 10 }}><TombolStaff judul="Perbarui rincian" sekunder nonaktif={sibuk} aksi={() => void muat()}/></View>
  </HalamanStaff>;
}
