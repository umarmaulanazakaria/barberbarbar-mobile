import { statusRamah, rincianRamah } from '../layanan/teks';
import { useCallback,useEffect,useRef,useState } from "react";
import { useFocusEffect,useRoute,useNavigation } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import { ActivityIndicator,ScrollView,Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { DaftarRuteBooking } from "../navigasi/NavigasiBooking";
import { ambilDetailBooking,ambilPembayaranBooking,ambilRefundAdmin,tindakanBooking,ubahLayananBooking } from "../layanan/booking";
import { ambilSemuaBarber } from "../layanan/barber";
import { ambilSemuaLayanan } from "../layanan/layanan";
import { ambilPesananBerdasarkanId } from "../layanan/pesanan";
import { ambilPesanKesalahan } from "../layanan/api";
import { izinBooking,batasKonfirmasi } from "../layanan/aturanBooking";
import { useSesiStore } from "../store/useSesiStore";
import { usePenyegaranRealtime } from "../hooks/usePenyegaranRealtime";
import type { Booking,RingkasanBooking,RefundBooking } from "../tipe/booking";
import type { Barber } from "../tipe/barber";
import type { Layanan } from "../tipe/layanan";
import type { Pesanan } from "../tipe/pesanan";
import { gayaBooking as g,KartuBooking,TombolBooking,InputBooking,waktuBooking,rupiahBooking } from "../komponen/UiBooking";
import PembayaranBooking from "../komponen/PembayaranBooking";
import TombolKembaliExisting from "../komponen/TombolKembali";
function TombolKembali(){const navigasi=useNavigation();return <TombolKembaliExisting onPress={()=>navigasi.goBack()}/>;}
import ModalAksi,{type KonfigurasiModalAksi} from "../komponen/ModalAksi";
export default function LayarDetailBooking(){
 const {idBooking}=useRoute<RouteProp<DaftarRuteBooking,"DetailBooking">>().params;
 return <DetailBooking key={idBooking} id={idBooking}/>;
}
function DetailBooking({id}:{id:number}){
 const admin=useSesiStore(s=>s.pengguna?.role==="ADMIN"),[b,aturB]=useState<Booking|null>(null),[uang,aturUang]=useState<RingkasanBooking|null>(null),[barbers,aturBarbers]=useState<Barber[]>([]),[layanan,aturLayanan]=useState<Layanan[]>([]),[pesanan,aturPesanan]=useState<Pesanan|null>(null),[refund,aturRefund]=useState<RefundBooking[]>([]);
 const [alasan,aturAlasan]=useState(""),[barber,aturBarber]=useState(0),[usulan,aturUsulan]=useState(0),[alasanUsulan,aturAlasanUsulan]=useState(""),[items,aturItems]=useState<{layananId:number;qty:number}[]|null>(null),[sibuk,aturSibuk]=useState(false),[error,aturError]=useState(""),[modal,aturModal]=useState<KonfigurasiModalAksi|null>(null),[sekarang,aturSekarang]=useState(Date.now());
 const urutan=useRef(0),berjalan=useRef(false);
 const muat=useCallback(async()=>{const nomor=++urutan.current;try{
  const [booking,u,bb,ll]=await Promise.all([ambilDetailBooking(id),ambilPembayaranBooking(id),ambilSemuaBarber(),ambilSemuaLayanan()]);
  const order=booking.pesananId?await ambilPesananBerdasarkanId(booking.pesananId):null;
  if(nomor!==urutan.current)return;aturB(booking);aturUang(u);aturBarbers(bb);aturLayanan(ll);aturPesanan(order);aturError("");
  if(admin){const r=await ambilRefundAdmin();if(nomor===urutan.current)aturRefund(r.filter(x=>x.bookingId===id));}
 }catch(e){if(nomor===urutan.current)aturError(ambilPesanKesalahan(e));}},[id,admin]);
 useFocusEffect(useCallback(()=>{void muat();return()=>{urutan.current++;};},[muat]));usePenyegaranRealtime(["booking","pembayaran","katalog","refund","pesanan"],muat);
 useEffect(()=>{const timer=setInterval(()=>aturSekarang(Date.now()),1000);return()=>clearInterval(timer);},[]);
 const kerjakan=async(kerja:()=>Promise<unknown>)=>{if(berjalan.current)return;berjalan.current=true;aturSibuk(true);try{await kerja();aturItems(null);await muat();}catch(e){aturError(ambilPesanKesalahan(e));}finally{berjalan.current=false;aturSibuk(false);}};
 const konfirmasi=(judul:string,kerja:()=>Promise<unknown>)=>aturModal({judul,pesan:"Lanjutkan tindakan ini pada booking? Status dan prasyarat terbaru akan diperiksa.",teksTombolUtama:"Lanjutkan",saatTombolUtama:()=>void kerjakan(kerja),teksTombolKedua:"Batal"});
 if(!b||!uang)return <SafeAreaView style={g.area}><TombolKembali/>{error?<><Text style={g.error}>{error}</Text><TombolBooking judul="Coba lagi" aksi={()=>void muat()}/></>:<ActivityIndicator color="#818cf8"/>}</SafeAreaView>;
 const izin=izinBooking(b,uang,sekarang),pilihan=b.barberDisetujuiId??b.barberPilihanId,nama=(idBarber:number|null)=>idBarber===null?"Siapa saja":barbers.find(x=>x.id===idBarber)?.nama??`Barber #${idBarber}`;
 const daftarItems=items??(pesanan?.items??b.items).map(i=>({layananId:i.layananId,qty:i.qty}));
 const validItems=daftarItems.length>0&&daftarItems.length<=50&&new Set(daftarItems.map(i=>i.layananId)).size===daftarItems.length&&daftarItems.every(i=>Number.isInteger(i.qty)&&i.qty>=1&&i.qty<=100&&layanan.some(l=>l.id===i.layananId&&l.aktif));
 const nonaktif=sibuk||!!error;
 return <SafeAreaView style={g.area}><ScrollView contentContainerStyle={g.isi}><TombolKembali/><Text style={g.judul}>Detail Booking</Text>{!!error&&<Text style={g.error}>{error}</Text>}<TombolBooking judul="Perbarui data" nonaktif={sibuk} aksi={()=>void muat()}/><KartuBooking><Text style={g.teks}>{b.pelanggan.nama} · {statusRamah(b.status)}</Text><Text style={g.kecil}>{b.nomorBooking}</Text><Text style={g.teks}>{waktuBooking(b.mulaiPada)} – {waktuBooking(b.selesaiPada)} · {b.durasiMenit} menit</Text><Text style={g.teks}>Preferensi: {nama(b.barberPilihanId)} · Disetujui: {nama(pilihan)}</Text><Text style={g.teks}>Final: {b.barberFinalId?nama(b.barberFinalId):"Belum ditetapkan"}</Text>{b.catatan&&<Text style={g.teks}>{b.catatan}</Text>}{b.alasanPenolakan&&<Text style={g.error}>Penolakan: {b.alasanPenolakan}</Text>}{b.items.map(i=><Text key={i.layananId} style={g.teks}>{i.namaLayanan} × {i.qty} · {rupiahBooking(i.subtotal)}</Text>)}<Text style={g.kecil}>Layanan saat booking {rupiahBooking(b.total)} · diskon {b.discountPercent}%</Text>
 {b.status==="PENDING_CONFIRMATION"&&<Text style={g.kecil}>Batas konfirmasi: {waktuBooking(new Date(batasKonfirmasi(b)).toISOString())}{sekarang>=batasKonfirmasi(b)&&" · Terlewati; pembatalan otomatis sedang diproses"}</Text>}{b.deadlineDp&&<Text style={g.kecil}>Batas DP {waktuBooking(b.deadlineDp)}</Text>}{b.deadlinePelunasan&&<Text style={g.kecil}>Batas pelunasan {waktuBooking(b.deadlinePelunasan)}</Text>}
 {izin.konfirmasi&&<TombolBooking judul="Konfirmasi booking" nonaktif={nonaktif} aksi={()=>konfirmasi("Konfirmasi Booking",()=>tindakanBooking(id,"confirm"))}/>}{izin.tolak&&<><InputBooking judul="Alasan penolakan wajib" nilai={alasan} ubah={aturAlasan}/><TombolBooking judul="Tolak booking" nonaktif={nonaktif||!alasan.trim()} aksi={()=>konfirmasi("Tolak Booking",()=>tindakanBooking(id,"reject",{alasan:alasan.trim()}))}/></>}
 {b.status==="CONFIRMED"&&<TombolBooking judul="Check-in pelanggan" nonaktif={nonaktif||!izin.checkIn} aksi={()=>konfirmasi("Check-in Pelanggan",()=>tindakanBooking(id,"check-in"))}/>}
 {b.status==="CHECKED_IN"&&<><Text style={g.teks}>Pilih barber final {pilihan!==null?`(mengikuti ${nama(pilihan)})`:""}</Text>{pilihan===null&&barbers.filter(x=>x.aktif).map(x=><TombolBooking key={x.id} judul={`${x.nama}${barber===x.id?" ✓":""}`} nonaktif={nonaktif} aksi={()=>aturBarber(x.id)}/>)}<TombolBooking judul="Mulai layanan" nonaktif={nonaktif||!izin.mulai||!barbers.some(x=>x.aktif&&x.id===(pilihan??barber))} aksi={()=>konfirmasi("Mulai Layanan",()=>tindakanBooking(id,"start",{barberId:pilihan??barber}))}/></>}
 {izin.usulkan&&<><Text style={g.teks}>Usulkan barber pengganti</Text>{barbers.filter(x=>x.aktif&&x.id!==pilihan).map(x=><TombolBooking key={x.id} judul={`${x.nama}${usulan===x.id?" ✓":""}`} nonaktif={nonaktif} aksi={()=>aturUsulan(x.id)}/>)}<InputBooking judul="Alasan penggantian wajib" nilai={alasanUsulan} ubah={aturAlasanUsulan}/><TombolBooking judul="Kirim usulan kepada pelanggan" nonaktif={nonaktif||!usulan||!alasanUsulan.trim()} aksi={()=>konfirmasi("Usulkan Barber",()=>tindakanBooking(id,"barber-proposals",{barberId:usulan,alasan:alasanUsulan.trim()}))}/></>}
 {b.usulanBarber.map(p=><Text key={p.id} style={g.teks}>{nama(p.barberId)} · {statusRamah(p.status)} · {p.alasan}{p.status==="PENDING"?" · Menunggu persetujuan pelanggan.":""}</Text>)}</KartuBooking>
 {b.status==="IN_SERVICE"&&<KartuBooking><Text style={g.judul}>Layanan aktual</Text>{daftarItems.map((i,n)=><KartuBooking key={i.layananId}><Text style={g.teks}>{layanan.find(l=>l.id===i.layananId)?.nama??`Layanan #${i.layananId}`}</Text><InputBooking judul="Jumlah" angka nilai={String(i.qty)} nonaktif={nonaktif} ubah={v=>aturItems(daftarItems.map((x,j)=>j===n?{...x,qty:Number(v)}:x))}/><TombolBooking judul="Hapus layanan" nonaktif={nonaktif||daftarItems.length<=1} aksi={()=>aturItems(daftarItems.filter((_,j)=>j!==n))}/></KartuBooking>)}{layanan.filter(l=>l.aktif&&!daftarItems.some(i=>i.layananId===l.id)).map(l=><TombolBooking key={l.id} judul={`Tambah ${l.nama}`} nonaktif={nonaktif} aksi={()=>aturItems([...daftarItems,{layananId:l.id,qty:1}])}/>)}<TombolBooking judul="Simpan layanan" nonaktif={nonaktif||!izin.ubahLayanan||!items||!validItems} aksi={()=>konfirmasi("Simpan Layanan",()=>ubahLayananBooking(id,daftarItems))}/><TombolBooking judul="Batalkan edit" nonaktif={nonaktif||!items} aksi={()=>aturItems(null)}/><TombolBooking judul="Selesaikan layanan" nonaktif={nonaktif||!izin.selesai||items!==null} aksi={()=>konfirmasi("Selesaikan Layanan",()=>tindakanBooking(id,"complete"))}/></KartuBooking>}
 <PembayaranBooking key={id} booking={b} ringkasan={uang} muat={muat}/>
 {admin&&refund.map(r=><KartuBooking key={r.id}><Text style={g.teks}>Pengembalian Dana {rupiahBooking(r.nominal)} · {statusRamah(r.status)}</Text><Text style={g.kecil}>{r.alasan}</Text><Text style={g.kecil}>Pengelola memproses pengembalian dana melalui Web Management. Status sedang diproses belum berarti dana kembali.</Text></KartuBooking>)}
 <KartuBooking><Text style={g.judul}>Riwayat Booking</Text>{!b.riwayat.length&&<Text style={g.kecil}>Belum ada riwayat.</Text>}{b.riwayat.map((r,i)=><Text key={i} style={g.teks}>{statusRamah(r.aksi)} · {statusRamah(r.statusSebelum)} → {statusRamah(r.statusSetelah)} · {waktuBooking(r.dibuatPada)}{r.rincian?`\n${rincianRamah(r.rincian)}`:""}</Text>)}</KartuBooking>
 </ScrollView><ModalAksi konfigurasi={modal} onTutup={()=>aturModal(null)}/></SafeAreaView>;
}
