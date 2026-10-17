import { useState } from "react";
import { Alert, Text } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { api, ambilPesanKesalahan } from "../layanan/api";
import { cekMemberStaff, identitasCocok, pesanStaff, tanggalStaff, type MemberStaff as DataMemberStaff, type ProfilStaff } from "./layananStaff";
import { HalamanStaff, InputStaff, PanelStaff, PesanStaff, s, TombolStaff } from "./UiStaff";
export type MemberTerverifikasiStaff = { member: DataMemberStaff; profil: ProfilStaff };
export function FormMemberStaff({ nomorAwal = "", bookingId, onVerifikasi, onReset, onPerubahanBooking }: { nomorAwal?: string; bookingId?: number; onVerifikasi: (m: MemberTerverifikasiStaff) => void; onReset?: () => void; onPerubahanBooking?: () => void }) {
  const [nomor, aturNomor] = useState(nomorAwal), [nama, aturNama] = useState(""), [hp, aturHp] = useState(""), [sibuk, aturSibuk] = useState(false), [error, aturError] = useState(""), [hasil, aturHasil] = useState<DataMemberStaff | null>(null);
  const reset = () => { aturHasil(null); onReset?.(); };
  const verifikasi = async () => {
    if (sibuk) return; aturSibuk(true); aturError(""); aturHasil(null);
    try {
      if (!nomor.trim() || nomor.trim().length > 60 || !nama.trim() || !hp.trim()) throw Error("Isi Nomor Member, nama, dan HP pelanggan yang hadir.");
      const m = await cekMemberStaff(nomor);
      if (!identitasCocok(m.member, nama, hp)) throw Error("Identitas tidak cocok. Periksa bersama pelanggan; manfaat belum dapat digunakan.");
      if (bookingId) { await api.put(`/management/membership-benefits/booking/${bookingId}`, { nomorMember: m.member.nomorMember, nama: nama.trim(), nomorTelepon: hp.trim(), hargaNormal: false, konfirmasi: true }); onPerubahanBooking?.(); }
      aturHasil(m.member); onVerifikasi(m);
    } catch (e) { onReset?.(); aturError(pesanStaff(e) ?? ambilPesanKesalahan(e)); } finally { aturSibuk(false); }
  };
  const reguler = () => Alert.alert("Gunakan harga Reguler?", "Manfaat Member dilepas. Isi nama dan HP orang yang hadir. Booking dapat memerlukan DP sebelum pelayanan.", [{ text: "Batal", style: "cancel" }, { text: "Gunakan Reguler", onPress: () => { void (async () => { if (!bookingId || sibuk) return; aturSibuk(true); try { await api.put(`/management/membership-benefits/booking/${bookingId}`, { nomorMember: "", nama: nama.trim(), nomorTelepon: hp.trim(), hargaNormal: true, konfirmasi: true }); reset(); onPerubahanBooking?.(); } catch (e) { aturError(ambilPesanKesalahan(e)); } finally { aturSibuk(false); } })(); } }]);
  return <PanelStaff><Text style={s.h2}>Verifikasi Membership</Text><Text style={[s.kecil, { marginBottom: 14 }]}>Cocokkan nama dan HP pelanggan di toko. Mendukung nomor angka dan nomor legacy, tanpa PIN atau OTP.</Text>
    <InputStaff label="Nomor Member" nilai={nomor} nonaktif={sibuk} ubah={v => { aturNomor(v); reset(); }}/><InputStaff label="Nama pelanggan yang hadir" nilai={nama} nonaktif={sibuk} ubah={v => { aturNama(v); reset(); }}/><InputStaff label="Nomor HP pelanggan" nilai={hp} telepon nonaktif={sibuk} ubah={v => { aturHp(v); reset(); }}/><PesanStaff pesan={error}/><TombolStaff judul={sibuk ? "Memverifikasi..." : "Verifikasi Member"} nonaktif={sibuk || !nomor.trim() || !nama.trim() || !hp.trim()} aksi={() => void verifikasi()}/>
    {hasil && <Text style={s.teks}>Member aktif · {hasil.nama}{"\n"}Berlaku hingga {hasil.berlakuSampai ? tanggalStaff(hasil.berlakuSampai) : "—"}. Manfaat layanan mengikuti pemeriksaan pesanan.</Text>}
    {bookingId && <TombolStaff judul="Koreksi menjadi Reguler" sekunder nonaktif={sibuk || !nama.trim() || !hp.trim()} aksi={reguler}/>}
  </PanelStaff>;
}
export default function CekMemberStaff() { const nav = useNavigation(); return <HalamanStaff judul="Cek Member" kembali={() => nav.goBack()}><FormMemberStaff onVerifikasi={() => undefined}/></HalamanStaff>; }
