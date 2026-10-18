import { Alert, Text } from "react-native";
import { useSesiStore } from "../store/useSesiStore";
import { HalamanStaff, PanelStaff, s, TombolStaff, warnaStaff } from "./UiStaff";
export { default as BerandaStaff } from "./BerandaOperasionalStaff";
export { default as DaftarPesananStaff } from "./PesananOperasionalStaff";
export { default as RiwayatStaff } from "./RiwayatOperasionalStaff";
export function ProfilStaff() {
  const pengguna = useSesiStore(v => v.pengguna), logout = useSesiStore(v => v.logout);
  return <HalamanStaff judul="Profil" subjudul="Akun operasional"><PanelStaff><Text style={s.h2}>{pengguna?.name}</Text><Text style={s.teks}>{pengguna?.email}</Text><Text style={{ color: warnaStaff.ungu, fontSize: 12, fontWeight: "700", marginTop: 10 }}>{pengguna?.role}</Text></PanelStaff><PanelStaff><Text style={s.h2}>Akses operasional</Text><Text style={s.teks}>Antrean dan pelayanan, verifikasi Member, Walk-in, pembayaran, dan struk.</Text><Text style={s.kecil}>Tindakan mengikuti izin akun. Pengaturan, persetujuan, dan perubahan data khusus Admin tidak tersedia di sini.</Text></PanelStaff><TombolStaff judul="Keluar" sekunder aksi={() => Alert.alert("Keluar", "Keluar dari akun ini?", [{ text: "Batal", style: "cancel" }, { text: "Keluar", style: "destructive", onPress: () => void logout() }])}/></HalamanStaff>;
}
