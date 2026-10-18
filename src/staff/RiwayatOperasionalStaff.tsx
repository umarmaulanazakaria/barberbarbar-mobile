import { ScrollView, Text, View } from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { jamStaff, rupiahStaff, tanggalStaff } from "./layananStaff";
import { useOperasionalStaff, type DetailArsipStaff } from "./operasionalStaff";
import type { RuteStaff } from "./NavigasiStaff";
import { HalamanStaff, MemuatStaff, PanelStaff, PesanStaff, s, TombolStaff } from "./UiStaff";

export function PilihanOperasional({ nilai, opsi, ubah }: { nilai: string; opsi: readonly (readonly [string, string])[]; ubah: (v: string) => void }) {
  return <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>{opsi.map(([v, label]) => <View key={v} style={{ marginRight: 7 }}><TombolStaff judul={label} sekunder={nilai !== v} aksi={() => ubah(v)}/></View>)}</ScrollView>;
}
export { default } from "./RiwayatMinimalStaff";
export function DetailArsipOperasionalStaff() {
  const nav = useNavigation<NativeStackNavigationProp<RuteStaff>>(), { params: { jenis, id } } = useRoute<RouteProp<RuteStaff, "ArsipStaff">>();
  const { data: d, memuat, error, muat } = useOperasionalStaff<DetailArsipStaff>(`/management/history/${jenis}/${id}`);
  return <HalamanStaff judul="Detail Riwayat" kembali={() => nav.goBack()} refresh={() => void muat()} memuat={memuat}><PesanStaff pesan={error}/>{memuat && !d && <MemuatStaff/>}{d && <>
    <PanelStaff><Text style={s.h2}>{d.nomor}</Text><Text style={s.teks}>{d.pelanggan} · {d.nomorTelepon || "Tanpa nomor HP"}</Text><Text style={s.teks}>Status akhir: {d.statusAkhir} · {d.statusBackend}</Text><Text style={s.kecil}>Jadwal: {tanggalStaff(d.jadwal)} {jamStaff(d.jadwal)} WIB</Text><Text style={s.kecil}>Penutupan: {d.penutupan ? `${tanggalStaff(d.penutupan)} ${jamStaff(d.penutupan)} WIB` : "Tidak tersedia"}</Text><Text style={s.teks}>Barber: {d.barber ?? "Belum ditentukan"}</Text></PanelStaff>
    <PanelStaff><Text style={s.h2}>Layanan & Pembayaran</Text>{d.items.map((i, n) => <Text key={n} style={s.teks}>{i.namaLayanan} ×{i.qty} · {rupiahStaff(i.subtotal)}</Text>)}<Text style={s.teks}>Total {rupiahStaff(d.pembayaran.total)}</Text><Text style={s.teks}>Dibayar {rupiahStaff(d.pembayaran.jumlahDibayar)}</Text><Text style={s.teks}>Sisa {rupiahStaff(d.pembayaran.balance)} · {d.pembayaran.statusPembayaran}</Text>{d.pembayaran.invoice && <Text style={s.teks}>Invoice: {d.pembayaran.invoice.nomorInvoice}</Text>}</PanelStaff>
    <PanelStaff><Text style={s.h2}>Perkembangan</Text>{d.riwayat.map(r => <Text key={r.id} style={s.kecil}>{r.aksi} · {r.sebelum ?? "—"} → {r.setelah}{"\n"}{tanggalStaff(r.waktu)} {jamStaff(r.waktu)} WIB</Text>)}{d.catatan && <Text style={s.teks}>{d.catatan}</Text>}{d.alasan && <Text style={s.teks}>Alasan: {d.alasan}</Text>}</PanelStaff>
    {d.statusBackend === "COMPLETED" && <TombolStaff judul="Detail pembayaran & struk" sekunder aksi={() => nav.navigate("DetailStaff", { jenis, id })}/>}
  </>}</HalamanStaff>;
}
