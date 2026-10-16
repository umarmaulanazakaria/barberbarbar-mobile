import { Text } from "react-native";
import { gayaBooking as g, KartuBooking, TombolBooking, waktuBooking, rupiahBooking } from "./UiBooking";
import { statusRamah } from "../layanan/teks";
import { tenggatOperasional, type EntriOperasional } from "../layanan/operasionalTerpadu";

export default function KartuOperasional({entri: e, sekarang, buka}: {
  entri: EntriOperasional; sekarang: number; buka: () => void;
}) {
  const b = e.booking, p = e.pesanan, tenggat = tenggatOperasional(e, sekarang);
  const statusBayar = b ? e.pembayaran?.statusPembayaran : p?.statusPembayaran;
  return <KartuBooking>
    <Text style={g.kecil}>{e.asal} · {b?.nomorBooking ?? p?.nomorPesanan}</Text>
    <Text style={g.teks}>{b?.pelanggan.nama ?? p?.pelanggan.nama} · {statusRamah(b?.status ?? p?.status ?? "")}</Text>
    <Text style={g.teks}>{waktuBooking(e.jadwal)}</Text>
    <Text style={g.kecil}>Layanan: {(p?.items ?? b?.items ?? []).map(i => `${i.namaLayanan} ×${i.qty}`).join(", ")}</Text>
    {p && <Text style={g.kecil}>Barber: {p.barber?.nama ?? "Belum ditentukan"}</Text>}
    {tenggat && <Text style={g.kecil}>{tenggat.label}: {waktuBooking(new Date(tenggat.waktu).toISOString())}</Text>}
    <Text style={g.kecil}>{statusBayar ? `Pembayaran: ${statusRamah(statusBayar)}` : b?.status === "COMPLETED" ? "Status pembayaran belum dapat dimuat. Periksa detail." : "Pembayaran tersedia di detail."}</Text>
    <Text style={g.teks}>{rupiahBooking(e.pembayaran?.total ?? p?.total ?? b?.total ?? 0)}</Text>
    {e.pembayaran?.invoice && <Text style={g.kecil}>Invoice: {e.pembayaran.invoice.nomorInvoice}</Text>}
    <TombolBooking judul={b ? "Detail booking dan pembayaran" : "Detail pesanan"} aksi={buka}/>
  </KartuBooking>;
}
