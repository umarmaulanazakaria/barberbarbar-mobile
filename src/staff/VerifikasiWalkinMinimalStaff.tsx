import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { ambilPesanKesalahan } from "../layanan/api";
import { cekMemberStaff, pesanStaff, putuskanMemberStaff, type IdentitasMemberStaff } from "./layananStaff";
import type { MemberTerverifikasiStaff } from "./MemberStaff";

// Presentasi khusus Walk-in; kontrak fisik, audit dan bukti server existing tidak diubah.
export default function VerifikasiWalkinMinimalStaff({ kunciPermintaan, onVerifikasi, onReset }: { kunciPermintaan: string; onVerifikasi: (m: MemberTerverifikasiStaff) => void; onReset: () => void }) {
  const [nomor, aturNomor] = useState(""), [data, aturData] = useState<IdentitasMemberStaff | null>(null), [sibuk, aturSibuk] = useState(false), [pesan, aturPesan] = useState("");
  const guard = useRef(false);
  const aktif = useRef(true);
  useEffect(() => { aktif.current = true; return () => { aktif.current = false; }; }, []);
  const periksa = async () => {
    if (guard.current) return; guard.current = true; aturSibuk(true); aturPesan(""); onReset();
    try { const hasil = await cekMemberStaff(nomor); if (aktif.current) aturData(hasil); } catch (e) { if (aktif.current) { aturData(null); aturPesan(pesanStaff(e) ?? ambilPesanKesalahan(e)); } }
    finally { guard.current = false; if (aktif.current) aturSibuk(false); }
  };
  const putuskan = async (cocok: boolean) => {
    if (!data || guard.current) return; guard.current = true; aturSibuk(true); aturPesan(""); onReset();
    try {
      const hasil = await putuskanMemberStaff({ jenis: "WALK_IN", kunciPermintaan }, data.member.nomorMember, cocok);
      if (!aktif.current) return;
      aturData(hasil);
      if (hasil.terverifikasi && hasil.verifikasiId) { onVerifikasi({ ...hasil, verifikasiId: hasil.verifikasiId }); aturPesan("Verifikasi identitas berhasil."); }
      else aturPesan("Identitas tidak cocok. Manfaat Member tidak dapat digunakan. Minta bantuan Admin.");
    } catch (e) { if (aktif.current) { aturData(null); aturPesan(pesanStaff(e) ?? ambilPesanKesalahan(e)); } }
    finally { guard.current = false; if (aktif.current) aturSibuk(false); }
  };
  return <View>
    {!data ? <><Text style={s.label}>Nomor Member</Text><View style={s.cari}><TextInput accessibilityLabel="Nomor Member" value={nomor} maxLength={60} editable={!sibuk} onChangeText={aturNomor} placeholder="Nomor pada Kartu Member" autoCapitalize="characters" style={s.input}/><Pressable accessibilityRole="button" disabled={sibuk || !nomor.trim()} onPress={() => void periksa()} style={[s.periksa, (sibuk || !nomor.trim()) && s.nonaktif]}><Text style={s.putih}>{sibuk ? "…" : "Periksa"}</Text></Pressable></View></> : <>
      <Text style={s.judul}>VERIFIKASI MEMBERSHIP</Text><Text style={s.teks}>Status: <Text style={s.kuat}>{data.member.status.replaceAll("_", " ")}</Text></Text>
      <Text style={s.teks}>Nomor Member: <Text style={s.kuat}>{data.member.nomorMember}</Text></Text><Text style={s.teks}>Nama Member: <Text style={s.kuat}>{data.member.nama}</Text></Text>
      <View style={s.identitas}><Text style={s.label}>Pemeriksaan Identitas</Text><Text style={s.teks}>1. Nomor pada Kartu Member sesuai aplikasi.</Text><Text style={s.teks}>2. Nama pada KTP sesuai nama Member.</Text><Text style={s.teks}>3. Foto KTP sesuai orang yang hadir.</Text></View>
      <Pressable accessibilityRole="button" disabled={sibuk || !data.layak} onPress={() => void putuskan(true)} style={[s.tombol, (sibuk || !data.layak) && s.nonaktif]}><Text style={s.putih}>Identitas Cocok — Verifikasi</Text></Pressable>
      <Pressable accessibilityRole="button" disabled={sibuk} onPress={() => void putuskan(false)} style={s.sekunder}><Text style={s.ungu}>Identitas Tidak Cocok</Text></Pressable>
      {!data.layak && <Text style={s.catatan}>Membership belum memenuhi syarat. Minta pemeriksaan Admin.</Text>}
      <Pressable accessibilityRole="button" disabled={sibuk} onPress={() => { onReset(); aturData(null); aturPesan(""); }} hitSlop={8}><Text style={s.ungu}>Periksa Member lain →</Text></Pressable>
    </>}
    {!!pesan && <Text accessibilityRole="alert" style={s.catatan}>{pesan}</Text>}
  </View>;
}
const s = StyleSheet.create({ label: { fontSize: 10, color: "#69758b", fontWeight: "600", marginBottom: 6 }, cari: { flexDirection: "row", gap: 8 }, input: { flex: 1, minWidth: 0, minHeight: 39, borderWidth: 1, borderColor: "#e8ebf2", borderRadius: 9, paddingHorizontal: 10, fontSize: 11, color: "#18233b" }, periksa: { backgroundColor: "#7553dd", justifyContent: "center", borderRadius: 8, paddingHorizontal: 13 }, putih: { color: "#fff", fontSize: 11, fontWeight: "600" }, judul: { fontSize: 11, color: "#18233b", fontWeight: "700", marginBottom: 8 }, teks: { color: "#69758b", fontSize: 11, lineHeight: 19 }, kuat: { color: "#18233b", fontWeight: "600" }, identitas: { borderTopWidth: 1, borderTopColor: "#e8ebf2", marginTop: 10, paddingTop: 10, marginBottom: 10 }, tombol: { backgroundColor: "#7553dd", borderRadius: 8, alignItems: "center", padding: 11 }, sekunder: { backgroundColor: "#f0ecfc", borderRadius: 8, alignItems: "center", padding: 10, marginVertical: 7 }, ungu: { color: "#7553dd", fontSize: 10, fontWeight: "600" }, catatan: { fontSize: 10, color: "#7c8599", lineHeight: 17, marginTop: 8 }, nonaktif: { opacity: .4 } });
