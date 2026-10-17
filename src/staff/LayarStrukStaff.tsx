import { useCallback, useState } from "react";
import { Image, Platform, Text, View, useWindowDimensions } from "react-native";
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import { api, ambilPesanKesalahan } from "../layanan/api";
import { usePenyegaranRealtime } from "../hooks/usePenyegaranRealtime";
import { jamStaff, rupiahStaff, tanggalStaff, type DokumenStaff } from "./layananStaff";
import { HalamanStaff, MemuatStaff, PesanStaff, s, TombolStaff } from "./UiStaff";
import type { RuteStaff } from "./NavigasiStaff";
export default function LayarStrukStaff() {
  const { params: { jenis, id } } = useRoute<RouteProp<RuteStaff, "StrukStaff">>(), nav = useNavigation(), { width } = useWindowDimensions();
  const [doc, aturDoc] = useState<DokumenStaff | null>(null), [error, aturError] = useState(""), [format, aturFormat] = useState<58 | 80>(58), [pilih, aturPilih] = useState("");
  const muat = useCallback(async () => { try { const d = (await api.get<DokumenStaff>(`/management/finance/documents/${jenis === "BOOKING" ? "B" : "W"}-${id}`)).data; aturDoc(d); aturError(""); } catch (e) { aturError(ambilPesanKesalahan(e)); } }, [jenis, id]);
  useFocusEffect(useCallback(() => { let aktif = true; if (aktif) void muat(); return () => { aktif = false; }; }, [muat]));
  usePenyegaranRealtime(["pembayaran", "pesanan", "booking"], muat);
  const struk = doc?.struk.find(t => t.id === pilih) ?? doc?.struk.at(-1), gratis = doc?.final && doc.total === 0 && doc.status === "FREE";
  const font = { fontFamily: Platform.OS === "ios" ? "Courier" : "monospace", fontSize: format === 58 ? 10 : 12, lineHeight: format === 58 ? 17 : 20, color: "#172238" } as const;
  return <HalamanStaff judul="Struk" subjudul="Dokumen pembayaran terverifikasi" kembali={() => nav.goBack()} refresh={() => void muat()}>
    <PesanStaff pesan={error}/>{!doc && !error && <MemuatStaff/>}<View style={s.baris}><TombolStaff judul="58 mm" sekunder={format !== 58} aksi={() => aturFormat(58)}/><TombolStaff judul="80 mm" sekunder={format !== 80} aksi={() => aturFormat(80)}/></View>
    {doc?.struk.length ? doc.struk.map(t => <TombolStaff key={t.id} judul={`${t.nomor} · ${rupiahStaff(t.nominal)}`} sekunder={struk?.id !== t.id} aksi={() => aturPilih(t.id)}/>) : null}
    {doc && (struk || gratis) ? <View style={{ alignSelf: "center", width: Math.min(width - 40, format === 58 ? 232 : 320), backgroundColor: "white", padding: 18, borderWidth: 1, borderColor: "#e5e7ef", marginVertical: 12 }}>
      <Image source={require("../../assets/barber-barbar-logo.png")} style={{ width: "90%", height: 48, alignSelf: "center", marginBottom: 8 }} resizeMode="contain"/>
      <Text style={[font, { textAlign: "center", fontWeight: "700" }]}>{gratis ? "MANFAAT MEMBER" : "BUKTI PEMBAYARAN"}</Text><Text style={[font, { textAlign: "center", marginBottom: 12 }]}>{struk?.nomor ?? doc.nomor}</Text>
      <Text style={font}>{doc.pelanggan}{"\n"}{doc.referensi}</Text>{struk && <Text style={font}>{tanggalStaff(struk.tanggal)} {jamStaff(struk.tanggal)} WIB</Text>}<Text style={font}>--------------------------------</Text>
      {doc.items.map((i, n) => <View key={n} style={{ marginBottom: 7 }}><Text style={font}>{i.nama} ×{i.qty}</Text><Text style={[font, { textAlign: "right" }]}>{rupiahStaff(i.nominal)}</Text></View>)}
      <Text style={font}>--------------------------------</Text><Text style={font}>Total tagihan {rupiahStaff(doc.total)}</Text>{struk && <><Text style={font}>Metode {struk.metode === "CASH" ? "Tunai" : struk.metode === "TRANSFER" ? "Transfer Manual" : struk.metode}</Text><Text style={font}>Pembayaran {rupiahStaff(struk.nominal)}</Text>{struk.diterima !== null && <Text style={font}>Diterima {rupiahStaff(struk.diterima)}</Text>}<Text style={font}>Kembalian {rupiahStaff(struk.kembalian)}</Text></>}<Text style={font}>Sisa tagihan {rupiahStaff(doc.balance)}</Text><Text style={[font, { marginTop: 16, textAlign: "center" }]}>Terima kasih atas kunjungan Anda.</Text>
    </View> : doc && <Text style={s.teks}>Belum ada bukti pembayaran terverifikasi yang dapat ditampilkan.</Text>}
    <Text style={s.kecil}>Preview thermal {format} mm. Printer fisik belum terhubung pada aplikasi ini. Cetak melalui Web Admin dengan dokumen yang sama; membuka struk tidak membuat pembayaran baru.</Text>
  </HalamanStaff>;
}
