import { useCallback,useRef,useState } from "react";
import { useFocusEffect,useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ActivityIndicator,ScrollView,Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { DaftarRuteBooking } from "../navigasi/NavigasiBooking";
import { ambilDaftarBooking,ambilPermohonanMembership,keputusanMembership } from "../layanan/booking";
import { ambilPesanKesalahan } from "../layanan/api";
import { usePenyegaranRealtime } from "../hooks/usePenyegaranRealtime";
import { useSesiStore } from "../store/useSesiStore";
import type { Booking,PermohonanMembership } from "../tipe/booking";
import { gayaBooking as g,KartuBooking,TombolBooking,InputBooking,waktuBooking } from "../komponen/UiBooking";
import ModalAksi,{type KonfigurasiModalAksi} from "../komponen/ModalAksi";
export default function LayarBooking(){
 const navigasi=useNavigation<NativeStackNavigationProp<DaftarRuteBooking>>(),admin=useSesiStore(s=>s.pengguna?.role==="ADMIN");
 const [daftar,aturDaftar]=useState<Booking[]>([]),[member,aturMember]=useState<PermohonanMembership[]>([]),[memuat,aturMemuat]=useState(true),[error,aturError]=useState(""),[cari,aturCari]=useState(""),[pending,aturPending]=useState(false),[modal,aturModal]=useState<KonfigurasiModalAksi|null>(null);
 const urutan=useRef(0),kunciAksi=useRef(false);
 const muat=useCallback(async()=>{const nomor=++urutan.current;try{const data=await ambilDaftarBooking();if(nomor===urutan.current){aturDaftar(data);aturError("");}if(admin){const m=await ambilPermohonanMembership();if(nomor===urutan.current)aturMember(m);}}catch(e){if(nomor===urutan.current)aturError(ambilPesanKesalahan(e));}finally{if(nomor===urutan.current)aturMemuat(false);}},[admin]);
 useFocusEffect(useCallback(()=>{void muat();return()=>{urutan.current++;};},[muat]));usePenyegaranRealtime(["booking","pembayaran","membership","pelanggan"],muat);
 const putuskan=async(id:number,aksi:"approve"|"reject")=>{if(!admin||kunciAksi.current)return;kunciAksi.current=true;aturPending(true);try{await keputusanMembership(id,aksi);await muat();}catch(e){aturError(ambilPesanKesalahan(e));}finally{kunciAksi.current=false;aturPending(false);}};
 const hasil=daftar.filter(b=>`${b.pelanggan.nama} ${b.nomorBooking} ${b.status}`.toLowerCase().includes(cari.toLowerCase()));
 return <SafeAreaView style={g.area}><ScrollView contentContainerStyle={g.isi}><Text style={g.judul}>Booking Customer</Text><InputBooking judul="Cari customer / nomor / status" nilai={cari} ubah={aturCari}/><TombolBooking judul="Perbarui" aksi={()=>void muat()}/>{memuat&&<ActivityIndicator color="#818cf8"/>}{!!error&&<Text accessibilityRole="alert" style={g.error}>{error}</Text>}{!memuat&&!hasil.length&&<Text style={g.teks}>Belum ada booking sesuai pencarian.</Text>}{hasil.map(b=><KartuBooking key={b.id}><Text style={g.teks}>{b.pelanggan.nama} · {b.status}</Text><Text style={g.kecil}>{b.nomorBooking}</Text><Text style={g.teks}>{waktuBooking(b.mulaiPada)} · {b.durasiMenit} menit</Text>{b.riwayat.some(r=>r.aksi.startsWith("TIMEOUT"))&&<Text style={g.error}>Dibatalkan karena batas waktu.</Text>}{b.riwayat.some(r=>r.aksi==="RESCHEDULE")&&<Text style={g.kecil}>Memiliki riwayat reschedule.</Text>}<TombolBooking judul="Detail dan pembayaran" aksi={()=>navigasi.navigate("DetailBooking",{idBooking:b.id})}/></KartuBooking>)}
 {admin&&<><Text style={g.judul}>Pengajuan Membership</Text>{!member.length&&<Text style={g.teks}>Belum ada permohonan.</Text>}{member.map(m=><KartuBooking key={m.id}><Text style={g.teks}>{m.pelanggan.nama} · {m.status}</Text>{m.catatanKeputusan&&<Text style={g.kecil}>{m.catatanKeputusan}</Text>}{m.status==="PENDING_APPROVAL"&&<><TombolBooking judul="Setujui membership" nonaktif={pending||m.pelanggan.status!=="AKTIF"} aksi={()=>aturModal({judul:"Setujui Membership",pesan:"Setujui pengajuan customer ini?",teksTombolUtama:"Setujui",saatTombolUtama:()=>void putuskan(m.id,"approve"),teksTombolKedua:"Batal"})}/><TombolBooking judul="Tolak membership" nonaktif={pending} aksi={()=>aturModal({judul:"Tolak Membership",pesan:"Tolak pengajuan customer ini?",teksTombolUtama:"Tolak",saatTombolUtama:()=>void putuskan(m.id,"reject"),teksTombolKedua:"Batal"})}/></>}</KartuBooking>)}</>}
 </ScrollView><ModalAksi konfigurasi={modal} onTutup={()=>aturModal(null)}/></SafeAreaView>;
}
