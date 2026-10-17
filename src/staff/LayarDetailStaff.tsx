import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Text, View } from "react-native";
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { api, ambilPesanKesalahan } from "../layanan/api";
import { usePenyegaranRealtime } from "../hooks/usePenyegaranRealtime";
import { FormMemberStaff } from "./MemberStaff";
import { bookingStaff, daftarStaff, jamStaff, katalogStaff, memberBookingStaff, pesananStaff, rupiahStaff, statusStaff, tanggalStaff, uangStaff, type BookingStaff, type DokumenStaff, type MemberBookingStaff, type PesananStaff, type UangBookingStaff } from "./layananStaff";
import type { Barber } from "../tipe/barber";
import { HalamanStaff, MemuatStaff, PanelStaff, PesanStaff, s, TombolStaff } from "./UiStaff";
import type { RuteStaff } from "./NavigasiStaff";
type DataDetail = { b: BookingStaff | null; p: PesananStaff | null; uang: UangBookingStaff | null; dokumen: DokumenStaff; member: MemberBookingStaff | null; barber: Barber[]; offset: number };
export default function LayarDetailStaff() {
  const { params: { jenis, id } } = useRoute<RouteProp<RuteStaff, "DetailStaff">>(), nav = useNavigation<NativeStackNavigationProp<RuteStaff>>();
  const [data, aturData] = useState<DataDetail | null>(null), [memuat, aturMemuat] = useState(true), [error, aturError] = useState(""), [sibuk, aturSibuk] = useState(false), [barberId, aturBarber] = useState(0), [clock, aturClock] = useState(Date.now());
  const versi = useRef(0), aksiAktif = useRef(false);
  const muat = useCallback(async () => { const v = ++versi.current; aturError(""); try {
    const [k, waktu, doc] = await Promise.all([katalogStaff(), daftarStaff({ batas: 1 }), api.get<DokumenStaff>(`/management/finance/documents/${jenis === "BOOKING" ? "B" : "W"}-${id}`)]);
    let b: BookingStaff | null = null, p: PesananStaff | null = null, uang: UangBookingStaff | null = null, member: MemberBookingStaff | null = null;
    if (jenis === "BOOKING") { [b, uang, member] = await Promise.all([bookingStaff(id), uangStaff(id), memberBookingStaff(id)]); if (b.pesananId) p = await pesananStaff(b.pesananId); }
    else p = await pesananStaff(id);
    if (v !== versi.current) return;
    aturData({ b, p, uang, member, dokumen: doc.data, barber: k.barber, offset: Date.parse(waktu.serverTime) - Date.now() });
    aturBarber(prev => prev || b?.barberFinalId || b?.barberDisetujuiId || b?.barberPilihanId || p?.barberId || 0);
  } catch (e) { if (v === versi.current) aturError(ambilPesanKesalahan(e)); } finally { if (v === versi.current) aturMemuat(false); } }, [jenis, id]);
  useFocusEffect(useCallback(() => { void muat(); return () => { versi.current++; }; }, [muat]));
  usePenyegaranRealtime(["booking", "pesanan", "pembayaran", "membership", "katalog"], muat);
  useEffect(() => { const t = setInterval(() => aturClock(Date.now()), 1000); return () => clearInterval(t); }, []);
  const executer = (judul: string, f: () => Promise<unknown>) => Alert.alert(judul, "Lanjutkan tindakan pada pesanan ini?", [{ text: "Batal", style: "cancel" }, { text: "Lanjutkan", onPress: () => { void (async () => { if (aksiAktif.current) return; aksiAktif.current = true; aturSibuk(true); aturError(""); try { await f(); await muat(); } catch (e) { await muat(); aturError(ambilPesanKesalahan(e)); } finally { aksiAktif.current = false; aturSibuk(false); } })(); } }]);
  if (!data) return <HalamanStaff judul="Detail Pesanan" kembali={() => nav.goBack()}><PesanStaff pesan={error}/>{memuat ? <MemuatStaff/> : <TombolStaff judul="Coba lagi" aksi={() => void muat()}/>}</HalamanStaff>;
  const { b, p, uang, member, dokumen, barber } = data, status = b?.status ?? p!.status, sekarang = clock + data.offset, jadwal = b?.mulaiPada ?? p!.checkInTime;
  const syarat = !!uang?.syaratDpTerpenuhi, pilihanBarber = b?.barberDisetujuiId ?? b?.barberPilihanId;
  const tersedia = b && pilihanBarber ? barber.filter(v => v.id === pilihanBarber) : barber;
  const petugas = barber.find(v => v.id === (b?.barberFinalId ?? pilihanBarber ?? p?.barberId))?.nama ?? p?.barber?.nama ?? "Belum ditentukan";
  const pesananId = b?.pesananId ?? p?.id, pendingProposal = b?.usulanBarber.some(v => v.status === "PENDING"), items = p?.items ?? b!.items;
  const mulaiKonfirmasi = b?.riwayat.filter(r => r.aksi === "RESCHEDULE").at(-1)?.dibuatPada ?? b?.dibuatPada;
  const konfirmasiBoleh = status === "PENDING_CONFIRMATION" && !!mulaiKonfirmasi && sekarang < Date.parse(mulaiKonfirmasi) + 30 * 60000 && sekarang < Date.parse(jadwal);
  return <HalamanStaff judul="Detail Pesanan" subjudul={b ? "Booking pelanggan" : "Walk-in"} kembali={() => nav.goBack()} refresh={() => void muat()} memuat={false}>
    <PesanStaff pesan={error}/><PanelStaff><View style={s.baris}><Text style={[s.h2, { flex: 1 }]}>{dokumen.pelanggan}</Text><Text style={s.badge}>{statusStaff[status] ?? status}</Text></View><Text style={s.kecil}>{b?.nomorBooking ?? p?.nomorPesanan}</Text><Text style={s.teks}>{tanggalStaff(jadwal)} · {jamStaff(jadwal)} WIB</Text><Text style={s.teks}>Barber: {petugas}</Text>{b && <Text style={s.kecil}>Slot Booking {b.durasiMenit} menit</Text>}{(b?.memberBebasDp || p?.membershipBerbayarId) && <Text style={s.teks}>Member{member?.nomorMember ? ` · ${member.nomorMember}` : ""}{b ? b.identitasMemberPada ? " · identitas terverifikasi" : " · perlu verifikasi identitas" : ""}</Text>}</PanelStaff>
    <PanelStaff><Text style={s.h2}>Layanan</Text>{items.map(i => <View style={s.baris} key={i.layananId}><Text style={[s.teks, { flex: 1 }]}>{i.namaLayanan} ×{i.qty}</Text><Text style={s.teks}>{rupiahStaff(i.subtotal)}</Text></View>)}</PanelStaff>
    <PanelStaff><Text style={s.h2}>Tagihan</Text><Text style={s.teks}>Subtotal {rupiahStaff(dokumen.subtotal)}</Text><Text style={s.teks}>Diskon / manfaat tercatat {rupiahStaff(dokumen.diskon)}</Text><Text style={s.teks}>Total {rupiahStaff(dokumen.total)}</Text><Text style={s.teks}>DP terverifikasi {rupiahStaff(uang?.dpTerverifikasi ? uang.nominalDpAwal : 0)}{b?.memberBebasDp ? " · Member tanpa DP" : ""}</Text><Text style={s.teks}>Pembayaran diterima {rupiahStaff(dokumen.dibayar)}</Text><Text style={s.h2}>Sisa {rupiahStaff(dokumen.balance)}</Text><Text style={s.kecil}>{statusStaff[dokumen.status] ?? "Periksa status pembayaran"}</Text><Text style={s.kecil}>Rincian mengikuti harga dan manfaat yang tercatat pada pesanan.</Text></PanelStaff>
    {b?.memberBebasDp && ["CONFIRMED", "CHECKED_IN"].includes(status) && !b.pesananId && <FormMemberStaff bookingId={b.id} nomorAwal={member?.nomorMember ?? ""} onVerifikasi={() => undefined} onPerubahanBooking={() => void muat()}/>}
    {konfirmasiBoleh && <TombolStaff judul="Konfirmasi Booking" nonaktif={sibuk} aksi={() => executer("Konfirmasi Booking", () => api.post(`/bookings/${id}/confirm`, {}))}/>}
    {b && status === "AWAITING_DP" && <Text style={s.kecil}>Menunggu DP terverifikasi. Pelayanan belum dapat dimulai.</Text>}
    {b && status === "CONFIRMED" && syarat && sekarang < Date.parse(jadwal) + 15 * 60000 && <TombolStaff judul="Check-in" nonaktif={sibuk} aksi={() => executer("Check-in", () => api.post(`/bookings/${id}/check-in`, {}))}/>}
    {((b && status === "CHECKED_IN" && syarat && !pendingProposal) || (!b && status === "WAITING")) && <PanelStaff><Text style={s.h2}>Barber pelayanan</Text>{tersedia.map(v => <TombolStaff key={v.id} judul={`${v.nama}${barberId === v.id ? " · dipilih" : ""}`} sekunder={barberId !== v.id} nonaktif={sibuk} aksi={() => aturBarber(v.id)}/>)}<TombolStaff judul="Mulai Layanan" nonaktif={sibuk || !tersedia.some(v => v.id === barberId)} aksi={() => executer("Mulai Layanan", () => b ? api.post(`/bookings/${id}/start`, { barberId }) : api.patch(`/orders/${id}/status`, { status: "IN_SERVICE", barberId }))}/></PanelStaff>}
    {status === "IN_SERVICE" && <TombolStaff judul="Selesaikan Layanan" nonaktif={sibuk} aksi={() => executer("Selesaikan Layanan", () => b ? api.post(`/bookings/${id}/complete`, {}) : api.patch(`/orders/${id}/status`, { status: "COMPLETED" }))}/>}
    {status === "COMPLETED" && pesananId && dokumen.balance > 0 && <TombolStaff judul="Pembayaran" nonaktif={sibuk} aksi={() => nav.navigate("BayarStaff", { jenis, id, pesananId })}/>}
    {(dokumen.struk.length > 0 || dokumen.final && dokumen.total === 0) && <TombolStaff judul="Lihat Struk" sekunder aksi={() => nav.navigate("StrukStaff", { jenis, id })}/>}
  </HalamanStaff>;
}
