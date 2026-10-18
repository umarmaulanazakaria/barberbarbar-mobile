import { useState } from "react";
import { Share, Text } from "react-native";
import { api } from "../layanan/api";
import type { Layanan } from "../tipe/layanan";
import type { Barber } from "../tipe/barber";
import { useOperasionalStaff } from "./operasionalStaff";
import { jamStaff, rupiahStaff, tanggalStaff, type BookingStaff, type PesananStaff } from "./layananStaff";
import { InputStaff, PanelStaff, s, TombolStaff } from "./UiStaff";

type Aksi = (judul: string, kerja: () => Promise<unknown>) => void;
type KonteksDp = { dp: { nominal: number; deadline: string | null; statusProvider: string; urlPembayaran: string | null } };
export function PemeriksaanDpStaff({ id, sibuk, aksi }: { id: number; sibuk: boolean; aksi: Aksi }) {
  const { data, error } = useOperasionalStaff<KonteksDp>(`/management/actions/BOOKING/${id}/context`);
  return <PanelStaff><Text style={s.h2}>Menunggu DP terverifikasi</Text>{data && <><Text style={s.teks}>DP {rupiahStaff(data.dp.nominal)}</Text><Text style={s.kecil}>Status provider: {data.dp.statusProvider}</Text>{data.dp.deadline && <Text style={s.kecil}>Batas: {tanggalStaff(data.dp.deadline)} {jamStaff(data.dp.deadline)} WIB</Text>}{data.dp.urlPembayaran && <TombolStaff judul="Bagikan tautan pembayaran" sekunder nonaktif={sibuk} aksi={() => aksi("Bagikan tautan pembayaran", () => Share.share({ message: data.dp.urlPembayaran! }))}/>}</>}{!!error && <Text style={s.kecil}>{error}</Text>}<TombolStaff judul="Periksa Midtrans" sekunder nonaktif={sibuk} aksi={() => aksi("Periksa DP melalui provider", () => api.post(`/management/actions/BOOKING/${id}/sync-dp`, {}))}/><Text style={s.kecil}>DP hanya sah setelah verifikasi Backend dan provider.</Text></PanelStaff>;
}
export default function TindakanBookingTambahanStaff({ b, p, layanan, barber, sekarang, sibuk, aksi }: { b: BookingStaff; p: PesananStaff | null; layanan: Layanan[]; barber: Barber[]; sekarang: number; sibuk: boolean; aksi: Aksi }) {
  const [terbuka, aturTerbuka] = useState(false), [alasan, aturAlasan] = useState(""), [pengganti, aturPengganti] = useState(0), [items, aturItems] = useState<{ layananId: number; qty: number }[] | null>(null);
  const proposal = b.usulanBarber.some(u => u.status === "PENDING"), pilihan = b.barberDisetujuiId ?? b.barberPilihanId;
  return <>
    {!!b.usulanBarber.length && <PanelStaff><Text style={s.h2}>Usulan Barber</Text>{b.usulanBarber.map(u => <Text key={u.id} style={s.teks}>{barber.find(v => v.id === u.barberId)?.nama ?? `Barber #${u.barberId}`} · {u.status}{"\n"}{u.alasan}</Text>)}{proposal && <Text style={s.kecil}>Tunggu keputusan pelanggan sebelum mulai layanan.</Text>}</PanelStaff>}
    <TombolStaff judul={terbuka ? "Tutup tindakan tambahan" : "Tindakan Booking lainnya"} sekunder nonaktif={sibuk} aksi={() => aturTerbuka(v => !v)}/>
    {terbuka && <PanelStaff>
      {["PENDING_CONFIRMATION", "CONFIRMED", "CHECKED_IN"].includes(b.status) && <InputStaff label="Alasan tindakan" nilai={alasan} nonaktif={sibuk} ubah={aturAlasan}/>}
      {b.status === "PENDING_CONFIRMATION" && <TombolStaff judul="Tolak Booking" sekunder nonaktif={sibuk || !alasan.trim() || alasan.trim().length > 500} aksi={() => aksi("Tolak Booking", () => api.post(`/bookings/${b.id}/reject`, { alasan: alasan.trim() }))}/>}
      {["CONFIRMED", "CHECKED_IN"].includes(b.status) && b.barberPilihanId !== null && !proposal && <><Text style={s.h2}>Usulkan Barber pengganti</Text>{barber.filter(v => v.id !== pilihan).map(v => <TombolStaff key={v.id} judul={v.nama} sekunder={pengganti !== v.id} nonaktif={sibuk} aksi={() => aturPengganti(v.id)}/>)}<TombolStaff judul="Kirim usulan ke pelanggan" nonaktif={sibuk || !pengganti || !alasan.trim() || alasan.trim().length > 500} aksi={() => aksi("Usulkan pergantian Barber", () => api.post(`/bookings/${b.id}/barber-proposals`, { barberId: pengganti, alasan: alasan.trim() }))}/></>}
      {b.status === "CONFIRMED" && sekarang >= Date.parse(b.mulaiPada) && !b.pesananId && <TombolStaff judul="Tandai Tidak Hadir" sekunder nonaktif={sibuk} aksi={() => aksi("Tandai pelanggan tidak hadir", () => api.post(`/bookings/${b.id}/no-show`, {}))}/>}
      {b.status === "IN_SERVICE" && p && <><TombolStaff judul="Ubah layanan aktual" sekunder nonaktif={sibuk} aksi={() => aturItems(p.items.map(i => ({ layananId: i.layananId, qty: i.qty })))}/>{items && <>
        <Text style={s.kecil}>Harga, manfaat, dan kecukupan pembayaran dihitung ulang oleh Backend. Snapshot reservasi tetap disimpan.</Text>
        {layanan.map(l => { const i = items.find(v => v.layananId === l.id); return <TombolStaff key={l.id} judul={`${i ? "✓ " : ""}${l.nama}`} sekunder={!i} nonaktif={sibuk} aksi={() => aturItems(v => v!.some(j => j.layananId === l.id) ? v!.filter(j => j.layananId !== l.id) : [...v!, { layananId: l.id, qty: 1 }])}/>; })}
        {items.map(i => <InputStaff key={i.layananId} label={`Jumlah ${layanan.find(l => l.id === i.layananId)?.nama ?? i.layananId} (1–10)`} numerik nilai={String(i.qty)} nonaktif={sibuk} ubah={v => aturItems(daftar => daftar!.map(j => j.layananId === i.layananId ? { ...j, qty: Number(v) } : j))}/>)}
        <TombolStaff judul="Simpan perubahan layanan" nonaktif={sibuk || !items.length || items.length > 20 || items.some(i => !Number.isInteger(i.qty) || i.qty < 1 || i.qty > 10)} aksi={() => aksi("Ubah layanan dan tagihan aktual", async () => { const hasil = await api.put(`/bookings/${b.id}/services`, { items }); aturItems(null); return hasil; })}/>
      </>}</>}
      <Text style={s.kecil}>Tindakan, ketersediaan dan izin diperiksa kembali Backend. Koreksi Member, pengaitan profil dan pemulihan kode tetap melalui Admin.</Text>
    </PanelStaff>}
  </>;
}
