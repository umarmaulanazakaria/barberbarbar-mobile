import { useCallback, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import axios from "axios";
import { api, ambilPesanKesalahan } from "../layanan/api";
import { useSesiStore } from "../store/useSesiStore";
import type { Barber } from "../tipe/barber";
import type { Layanan } from "../tipe/layanan";
import { FormMemberStaff, type MemberTerverifikasiStaff } from "./MemberStaff";
import { bacaPermintaanStaff, hapusPermintaanStaff, katalogStaff, kunciStaff, pesanStaff, profilStaff, rupiahStaff, simpanPermintaanStaff, type ProfilStaff } from "./layananStaff";
import { HalamanStaff, InputStaff, MemuatStaff, PanelStaff, PesanStaff, s, TombolStaff, warnaStaff } from "./UiStaff";
import type { RuteStaff } from "./NavigasiStaff";
type Permintaan = { pelanggan: { jenis: "ANONIM" } | { jenis: "LAMA"; id: number }; barberId: number; konfirmasiMember?: true; verifikasiId?: number; items: { layananId: number; qty: 1; hargaDiharapkan: number }[]; totalDiharapkan: number; kunciIdempotensi: string };
type Hasil = { data: { id: number } };
export default function LayarWalkinStaff() {
  const nav = useNavigation<NativeStackNavigationProp<RuteStaff>>(), user = useSesiStore(v => v.pengguna), penyimpanan = `bb-staff-walkin-${user?.id}`, kunci = useRef(kunciStaff()), kirimAktif = useRef(false);
  const [barber, aturBarber] = useState<Barber[]>([]), [layanan, aturLayanan] = useState<Layanan[]>([]), [muat, aturMuat] = useState(true), [barberId, aturBarberId] = useState(0), [items, aturItems] = useState<number[]>([]);
  const [mode, aturMode] = useState(false), [member, aturMember] = useState<MemberTerverifikasiStaff | null>(null), [cari, aturCari] = useState(""), [profil, aturProfil] = useState<ProfilStaff | null>(null), [opsi, aturOpsi] = useState<ProfilStaff[]>([]);
  const [harga, aturHarga] = useState<{ sidik: string; total: number; items: { layananId: number; harga: number; subtotal: number }[] } | null>(null), [error, aturError] = useState(""), [sibuk, aturSibuk] = useState(false), [tertunda, aturTertunda] = useState<Permintaan | null>(null);
  const pilihan = layanan.filter(l => items.includes(l.id)), pemilik = mode ? member?.profil : profil, sidik = JSON.stringify({ items, profilId: pemilik?.id, member: mode, terverifikasi: member?.member.id });
  const total = harga?.sidik === sidik ? harga.total : null, subtotal = pilihan.reduce((n, l) => n + l.harga, 0);
  const muatAwal = useCallback(async () => { aturMuat(true); aturError(""); try { const [k, pending] = await Promise.all([katalogStaff(), bacaPermintaanStaff<Permintaan>(penyimpanan)]); aturBarber(k.barber); aturLayanan(k.layanan); aturTertunda(pending); if (pending) kunci.current = pending.kunciIdempotensi; } catch (e) { aturError(ambilPesanKesalahan(e)); } finally { aturMuat(false); } }, [penyimpanan]);
  useFocusEffect(useCallback(() => { void muatAwal(); }, [muatAwal]));
  const periksaHarga = async () => { if (sibuk || !pilihan.length) return; aturSibuk(true); aturError(""); try {
    if (mode && !member) throw Error("Verifikasi Member bersama pelanggan terlebih dahulu.");
    if (!mode && cari.trim() && !profil) throw Error("Pilih profil hasil pencarian, atau kosongkan nama untuk Walk-in anonim. Profil baru dibuat oleh Admin.");
    if (pemilik) { const q = (await api.post<{ member: boolean; total: number; items: { layananId: number; harga: number; subtotal: number }[] }>("/management/membership-benefits/quote", { profilId: pemilik.id, items: pilihan.map(l => ({ layananId: l.id, qty: 1 })) })).data;
      if (q.member && !member) throw Error("Profil ini memiliki Membership aktif. Pilih Member dan verifikasi identitas.");
      if (mode && !q.member) throw Error("Manfaat Member belum dapat digunakan. Periksa masa aktif bersama Admin.");
      aturHarga({ sidik, total: q.total, items: q.items });
    } else aturHarga({ sidik, total: subtotal, items: pilihan.map(l => ({ layananId: l.id, harga: l.harga, subtotal: l.harga })) });
  } catch (e) { aturHarga(null); aturError(pesanStaff(e) ?? ambilPesanKesalahan(e)); } finally { aturSibuk(false); } };
  const selesai = async (id: number) => { await hapusPermintaanStaff(penyimpanan); aturTertunda(null); kunci.current = kunciStaff(); aturItems([]); aturHarga(null); aturProfil(null); aturMember(null); aturCari(""); nav.navigate("DetailStaff", { jenis: "WALK_IN", id }); };
  const kirim = async () => { if (kirimAktif.current || !tertunda && (total === null || !barberId || mode && !member)) return; kirimAktif.current = true; aturSibuk(true); aturError("");
    const body: Permintaan = tertunda ?? { pelanggan: pemilik ? { jenis: "LAMA", id: pemilik.id } : { jenis: "ANONIM" }, barberId, ...(mode ? { konfirmasiMember: true, verifikasiId: member!.verifikasiId } : {}), items: pilihan.map(l => ({ layananId: l.id, qty: 1, hargaDiharapkan: l.harga })), totalDiharapkan: total!, kunciIdempotensi: kunci.current };
    try { await simpanPermintaanStaff(penyimpanan, body); aturTertunda(body); if (body.konfirmasiMember && !body.verifikasiId) throw Error("Verifikasi fisik Member diperlukan untuk permintaan ini."); const r = (await api.post<Hasil>(body.konfirmasiMember ? "/management/membership-benefits/staff/walk-in" : "/orders/walk-in", body, { timeout: 25000 })).data; await selesai(r.data.id); }
    catch (e) { aturError(pesanStaff(e) ?? ambilPesanKesalahan(e)); if (axios.isAxiosError(e) && e.response?.status === 409 && e.response.data?.kode === "VERIFIKASI_MEMBER_TIDAK_SAH") { const ulang = {...body, verifikasiId: undefined}; await simpanPermintaanStaff(penyimpanan, ulang); aturTertunda(ulang); } else if (axios.isAxiosError(e) && e.response?.status === 409 && e.response.data?.kode && !["IDEMPOTENSI_BERBEDA", "DATA_TERPAKAI"].includes(e.response.data.kode)) { await hapusPermintaanStaff(penyimpanan); aturTertunda(null); aturHarga(null); } }
    finally { kirimAktif.current = false; aturSibuk(false); }
  };
  return <HalamanStaff judul="Tambah Walk-in" subjudul="Daftarkan pelanggan di toko">
    <PesanStaff pesan={error}/>{muat && <MemuatStaff/>}{!muat && !layanan.length && <TombolStaff judul="Muat ulang katalog" aksi={() => void muatAwal()}/>}
    {tertunda ? <PanelStaff><Text style={s.teks}>Permintaan tersimpan dan hasilnya belum dipastikan. Jangan membuat pesanan pengganti.</Text>{tertunda.konfirmasiMember && !tertunda.verifikasiId && <FormMemberStaff kunciPermintaan={tertunda.kunciIdempotensi} onVerifikasi={m=>{const baru={...tertunda,verifikasiId:m.verifikasiId};if(baru.pelanggan.jenis!=="LAMA"||baru.pelanggan.id!==m.profil.id){aturError("Member tidak sesuai dengan permintaan tersimpan. Minta pemeriksaan Admin.");return;}void simpanPermintaanStaff(penyimpanan,baru).then(()=>aturTertunda(baru)).catch(e=>aturError(ambilPesanKesalahan(e)));}}/>}<TombolStaff judul="Kirim ulang permintaan yang sama" nonaktif={sibuk} aksi={() => void kirim()}/><TombolStaff judul="Periksa pesanan" sekunder nonaktif={sibuk} aksi={() => { void api.get<Hasil>(`/orders/walk-in/requests/${tertunda.kunciIdempotensi}`).then(r => selesai(r.data.data.id)).catch(e => aturError(ambilPesanKesalahan(e))); }}/></PanelStaff> : <>
      <View style={{ flexDirection: "row", gap: 9, marginBottom: 8 }}>{[false, true].map(v => <View key={String(v)} style={{ flex: 1 }}><TombolStaff judul={v ? "Member" : "Reguler"} sekunder={mode !== v} nonaktif={sibuk} aksi={() => { aturMode(v); aturHarga(null); aturMember(null); }}/></View>)}</View>
      {mode ? <FormMemberStaff kunciPermintaan={kunci.current} onVerifikasi={m => { aturMember(m); aturHarga(null); }} onReset={() => { aturMember(null); aturHarga(null); }}/> : <PanelStaff><InputStaff label="Nama pelanggan / profil (opsional)" nilai={cari} ubah={v => { aturCari(v); aturProfil(null); aturHarga(null); aturOpsi([]); }}/><TombolStaff judul="Cari profil" sekunder nonaktif={sibuk || !cari.trim()} aksi={() => { void profilStaff(cari).then(aturOpsi).catch(e => aturError(ambilPesanKesalahan(e))); }}/>{opsi.map(p => <TombolStaff key={p.id} judul={`${p.nama}${profil?.id === p.id ? " · dipilih" : ""}`} sekunder aksi={() => { aturProfil(p); aturHarga(null); }}/>) }<Text style={s.kecil}>{profil ? `Profil dipilih: ${profil.nama}` : "Kosongkan untuk pelanggan anonim. Pembuatan profil baru hanya oleh Admin."}</Text></PanelStaff>}
      <PanelStaff><Text style={s.h2}>Pilih Barber</Text>{barber.map(b => <TombolStaff key={b.id} judul={`${b.nama}${barberId === b.id ? " · dipilih" : ""}`} sekunder={barberId !== b.id} nonaktif={sibuk} aksi={() => aturBarberId(b.id)}/>)}</PanelStaff>
      <PanelStaff><Text style={s.h2}>Pilih layanan</Text>{layanan.map(l => <Pressable disabled={sibuk} key={l.id} onPress={() => { aturItems(v => v.includes(l.id) ? v.filter(i => i !== l.id) : [...v, l.id]); aturHarga(null); }} style={[s.baris, { paddingVertical: 8 }]}><Text style={[s.teks, { flex: 1 }]}>{items.includes(l.id) ? "☑" : "☐"} {l.nama}</Text><Text style={{ color: warnaStaff.ungu, fontSize: 12 }}>{rupiahStaff(l.harga)}</Text></Pressable>)}<Text style={s.kecil}>Setiap jenis layanan dapat dipilih satu kali.</Text></PanelStaff>
      <PanelStaff><Text style={s.h2}>Rincian harga</Text><Text style={s.teks}>Subtotal {rupiahStaff(subtotal)}</Text>{total !== null && <><Text style={s.teks}>Manfaat Member {rupiahStaff(subtotal - total)}</Text>{harga?.items.map(i => <Text key={i.layananId} style={s.kecil}>{layanan.find(l => l.id === i.layananId)?.nama}: {rupiahStaff(i.subtotal)}</Text>)}<Text style={[s.h2, { marginTop: 12 }]}>Total {rupiahStaff(total)}</Text></>}<TombolStaff judul="Periksa rincian harga" sekunder nonaktif={sibuk || !items.length || mode && !member} aksi={() => void periksaHarga()}/><TombolStaff judul={sibuk ? "Memproses..." : "Buat Walk-in"} nonaktif={sibuk || !barberId || total === null || mode && !member} aksi={() => void kirim()}/></PanelStaff>
    </>}
  </HalamanStaff>;
}
