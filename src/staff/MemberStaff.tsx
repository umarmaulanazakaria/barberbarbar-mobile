import { useEffect, useRef, useState } from "react";
import { Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ambilPesanKesalahan } from "../layanan/api";
import { cekMemberStaff, pesanStaff, putuskanMemberStaff, type IdentitasMemberStaff, type KonteksIdentitasStaff } from "./layananStaff";
import { HalamanStaff, InputStaff, PanelStaff, PesanStaff, s, TombolStaff, warnaStaff } from "./UiStaff";
export type MemberTerverifikasiStaff = IdentitasMemberStaff & { verifikasiId: number };
export function FormMemberStaff({ nomorAwal = "", bookingId, kunciPermintaan, onVerifikasi, onReset, onPerubahanBooking }: { nomorAwal?: string; bookingId?: number; kunciPermintaan?: string; onVerifikasi: (m: MemberTerverifikasiStaff) => void; onReset?: () => void; onPerubahanBooking?: () => void }) {
  const [nomor, aturNomor] = useState(nomorAwal), [data, aturData] = useState<IdentitasMemberStaff | null>(null), [sibuk, aturSibuk] = useState(false), [error, aturError] = useState(""), [pesan, aturPesan] = useState("");
  const berjalan = useRef(false), versi = useRef(0);
  useEffect(() => {
    if (!bookingId) return;
    const v = ++versi.current; aturSibuk(true);
    void cekMemberStaff(undefined, bookingId).then(d => { if (v === versi.current) aturData(d); }).catch(e => { if (v === versi.current) aturError(pesanStaff(e) ?? ambilPesanKesalahan(e)); }).finally(() => { if (v === versi.current) aturSibuk(false); });
    return () => { versi.current++; };
  }, [bookingId]);
  const cari = async () => { if (berjalan.current) return; berjalan.current = true; aturSibuk(true); aturError(""); aturPesan(""); onReset?.(); try { if (!nomor.trim() || nomor.trim().length > 60) throw Error("Masukkan Nomor Member pada kartu."); aturData(await cekMemberStaff(nomor)); } catch (e) { aturData(null); aturError(pesanStaff(e) ?? ambilPesanKesalahan(e)); } finally { berjalan.current = false; aturSibuk(false); } };
  const putuskan = async (cocok: boolean) => {
    if (!data || berjalan.current) return; berjalan.current = true; aturSibuk(true); aturError(""); aturPesan(""); onReset?.();
    const konteks: KonteksIdentitasStaff = bookingId ? { jenis: "BOOKING", bookingId } : kunciPermintaan ? { jenis: "WALK_IN", kunciPermintaan } : { jenis: "CEK_MEMBER" };
    try { const hasil = await putuskanMemberStaff(konteks, data.member.nomorMember, cocok); aturData(hasil);
      if (hasil.terverifikasi && hasil.verifikasiId) { onVerifikasi({ ...hasil, verifikasiId: hasil.verifikasiId }); aturPesan("Verifikasi identitas berhasil."); }
      else aturPesan("Identitas tidak cocok. Manfaat Member tidak dapat digunakan. Minta bantuan Admin; jangan ubah harga Booking tanpa pemeriksaan.");
      if (bookingId) onPerubahanBooking?.();
    } catch (e) { aturError(pesanStaff(e) ?? ambilPesanKesalahan(e)); try { aturData(await cekMemberStaff(bookingId ? undefined : data.member.nomorMember, bookingId)); } catch { aturData(null); } }
    finally { berjalan.current = false; aturSibuk(false); }
  };
  return <PanelStaff><Text style={s.h2}>VERIFIKASI MEMBERSHIP</Text>
    {!data ? <>{!bookingId && <InputStaff label="Nomor Member pada kartu" nilai={nomor} nonaktif={sibuk} ubah={v => { aturNomor(v); aturPesan(""); onReset?.(); }}/>}<TombolStaff judul={sibuk ? "Memuat Member..." : "Cari Member"} nonaktif={sibuk || !bookingId && !nomor.trim()} aksi={() => { if (bookingId) { void cekMemberStaff(undefined, bookingId).then(aturData).catch(e => aturError(ambilPesanKesalahan(e))); } else void cari(); }}/></> : <>
      <Text style={[s.teks, { marginBottom: 12 }]}>Status: <Text style={{ fontWeight: "700", color: data.member.status === "AKTIF" ? warnaStaff.ungu : warnaStaff.redup }}>{data.member.status === "AKTIF" ? "AKTIF" : data.member.status === "KEDALUWARSA" ? "KEDALUWARSA" : data.member.status === "MENUNGGU_PEMBAYARAN" ? "MENUNGGU PEMBAYARAN" : "BELUM AKTIF"}</Text></Text>
      <Text style={s.teks}>Nomor Member: <Text style={{ fontWeight: "700" }}>{data.member.nomorMember}</Text></Text><Text style={s.teks}>Nama Member: <Text style={{ fontWeight: "700" }}>{data.member.nama}</Text></Text>
      <View style={{ borderTopWidth: 1, borderTopColor: warnaStaff.garis, marginTop: 16, paddingTop: 16, marginBottom: 16 }}><Text style={s.label}>Pemeriksaan Identitas</Text><Text style={s.teks}>Cocokkan:</Text><Text style={s.teks}>1. Nomor Member pada kartu dengan nomor di aplikasi.</Text><Text style={s.teks}>2. Nama pada KTP dengan nama Member di aplikasi.</Text><Text style={s.teks}>3. Foto pada KTP dengan orang yang hadir.</Text></View>
      {!data.layak && <Text style={[s.kecil, { marginBottom: 12 }]}>Membership belum memenuhi syarat untuk digunakan. Minta pemeriksaan Admin.</Text>}
      <TombolStaff judul={sibuk ? "Memproses..." : "✓ Identitas Cocok — Verifikasi"} nonaktif={sibuk || !data.layak} aksi={() => void putuskan(true)}/><TombolStaff judul="Identitas Tidak Cocok" sekunder nonaktif={sibuk} aksi={() => void putuskan(false)}/>
    </>}
    <PesanStaff pesan={error}/>{!!pesan && <Text accessibilityRole="alert" style={[s.teks, { marginTop: 9 }]}>{pesan}</Text>}
  </PanelStaff>;
}
export default function CekMemberStaff() { const nav = useNavigation(); return <HalamanStaff judul="Cek Member" kembali={() => nav.goBack()}><FormMemberStaff onVerifikasi={() => undefined}/></HalamanStaff>; }
