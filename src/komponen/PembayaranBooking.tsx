import { statusRamah, pesanPembayaranPercobaan } from '../layanan/teks';
import { useRef,useState } from "react";
import { Text,View } from "react-native";
import axios from "axios";
import type { Booking,RingkasanBooking } from "../tipe/booking";
import type { DataPembayaran,MetodePembayaran } from "../tipe/pesanan";
import { izinBooking } from "../layanan/aturanBooking";
import { pelunasanBooking } from "../layanan/booking";
import { ambilPesanKesalahan } from "../layanan/api";
import { gayaBooking as g,KartuBooking,TombolBooking,InputBooking,rupiahBooking,waktuBooking } from "./UiBooking";
import ModalAksi,{type KonfigurasiModalAksi} from "./ModalAksi";
export default function PembayaranBooking({booking,ringkasan,muat}:{booking:Booking;ringkasan:RingkasanBooking;muat:()=>Promise<void>}){
 const [metode,aturMetode]=useState<MetodePembayaran>("CASH"),[jumlah,aturJumlah]=useState(""),[catatan,aturCatatan]=useState(""),[sibuk,aturSibuk]=useState(false),[error,aturError]=useState(""),[modal,aturModal]=useState<KonfigurasiModalAksi|null>(null);
 const kunci=useRef<(DataPembayaran&{kunciIdempotensi:string})|null>(null),sedang=useRef(false);
 const nominal=jumlah===""?ringkasan.balance:Number(jumlah),boleh=izinBooking(booking,ringkasan).lunasi;
 const bayar=async()=>{
  if(sedang.current||!boleh)return;sedang.current=true;aturSibuk(true);
  if(!kunci.current)kunci.current={metode,jumlahDiterima:nominal,kunciIdempotensi:`mobile-${Date.now()}-${Math.random().toString(36).slice(2)}`,...(catatan.trim()?{catatan:catatan.trim()}:{})};
  try{await pelunasanBooking(booking.id,kunci.current);kunci.current=null;aturError("");await muat();}
  catch(e){if(axios.isAxiosError(e)&&[400,401,403,404].includes(e.response?.status??0))kunci.current=null;aturError(ambilPesanKesalahan(e));await muat();}
  finally{sedang.current=false;aturSibuk(false);}
 };
 return <KartuBooking><Text style={g.judul}>Pembayaran</Text>{ringkasan.pembayaranPercobaan === true && <Text style={g.kecil}>Online: {pesanPembayaranPercobaan}</Text>}<Text style={g.teks}>{statusRamah(ringkasan.statusPembayaran)}</Text><Text style={g.teks}>Subtotal {rupiahBooking(ringkasan.subtotal)} · Diskon booking {booking.discountPercent}% ({rupiahBooking(ringkasan.diskon)})</Text><Text style={g.teks}>Total {rupiahBooking(ringkasan.total)}</Text><Text style={g.teks}>DP awal {rupiahBooking(ringkasan.nominalDpAwal)} · {ringkasan.dpTerverifikasi?"Terverifikasi":"Belum terverifikasi"}</Text><Text style={g.teks}>Dibayar {rupiahBooking(ringkasan.jumlahDibayar)} · Sisa {rupiahBooking(ringkasan.balance)}</Text><Text style={g.kecil}>Uang muka dibayar online. Layanan selesai belum berarti tagihan lunas. Tagihan lewat batas waktu tetap dapat dibayar.</Text>{ringkasan.kelebihan>0&&<Text style={g.teks}>Kelebihan {rupiahBooking(ringkasan.kelebihan)} · periksa status pengembalian dana</Text>}{ringkasan.invoice?<Text style={g.teks}>Invoice final {ringkasan.invoice.nomorInvoice}</Text>:<Text style={g.kecil}>Invoice sementara, belum final.</Text>}{ringkasan.transaksi.map(t=><View key={t.id}><Text style={g.teks}>{statusRamah(t.tujuan)} · {statusRamah(t.kanal)} · {statusRamah(t.status)} · {rupiahBooking(t.nominal)}</Text><Text style={g.kecil}>{waktuBooking(t.dibuatPada)}</Text></View>)}
 {boleh&&<><Text style={g.teks}>Metode kasir: {metode}</Text><View style={{flexDirection:"row",flexWrap:"wrap",gap:6}}>{(["CASH","QRIS","CARD","TRANSFER","OTHER"] as MetodePembayaran[]).map(m=><TombolBooking key={m} judul={statusRamah(m)} nonaktif={sibuk||kunci.current!==null} aksi={()=>aturMetode(m)}/>)}</View><InputBooking judul="Jumlah diterima (kosong = sisa tagihan)" angka nilai={jumlah} ubah={aturJumlah} nonaktif={sibuk||kunci.current!==null}/><View style={{flexDirection:"row",flexWrap:"wrap",gap:6}}>{[10000,20000,50000,100000].map(n=><TombolBooking key={n} judul={rupiahBooking(n)} nonaktif={sibuk||kunci.current!==null} aksi={()=>aturJumlah(String(n))}/>)}<TombolBooking judul="Uang pas" nonaktif={sibuk||kunci.current!==null} aksi={()=>aturJumlah(String(ringkasan.balance))}/></View><InputBooking judul="Catatan pembayaran" nilai={catatan} ubah={aturCatatan} nonaktif={sibuk||kunci.current!==null}/>{kunci.current&&<Text style={g.kecil}>Hasil pembayaran sebelumnya belum pasti. Periksa status sebelum mencoba kembali.</Text>}<TombolBooking judul={sibuk?"Memproses…":kunci.current?"Periksa / ulangi pelunasan yang sama":"Lunasi melalui kasir"} nonaktif={sibuk||!Number.isSafeInteger(nominal)||nominal<ringkasan.balance||nominal>2147483647} aksi={()=>aturModal({judul:"Konfirmasi Pelunasan",pesan:`Sisa tagihan terbaru ${rupiahBooking(ringkasan.balance)}. Lanjutkan pelunasan?`,teksTombolUtama:"Lunasi",saatTombolUtama:()=>void bayar(),teksTombolKedua:"Batal"})}/></>}
 {!!error&&<Text style={g.error}>{error}</Text>}<ModalAksi konfigurasi={modal} onTutup={()=>aturModal(null)}/></KartuBooking>;
}
