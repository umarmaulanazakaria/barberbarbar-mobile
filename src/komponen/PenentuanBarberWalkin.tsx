import { useCallback,useRef,useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { Text } from "react-native";
import { ambilSemuaBarber } from "../layanan/barber";
import { ubahStatusPesanan } from "../layanan/pesanan";
import { ambilPesanKesalahan } from "../layanan/api";
import { usePenyegaranRealtime } from "../hooks/usePenyegaranRealtime";
import type { Barber } from "../tipe/barber";
import { KartuBooking,TombolBooking,InputBooking,gayaBooking as g } from "./UiBooking";
import ModalAksi,{type KonfigurasiModalAksi} from "./ModalAksi";
export default function PenentuanBarberWalkin({idPesanan,muat}:{idPesanan:number;muat:()=>Promise<void>}){
 const [barbers,aturBarbers]=useState<Barber[]>([]),[pilihan,aturPilihan]=useState(0),[cari,aturCari]=useState(""),[error,aturError]=useState(""),[sibuk,aturSibuk]=useState(false),[modal,aturModal]=useState<KonfigurasiModalAksi|null>(null),sedang=useRef(false);
 const muatBarber=useCallback(async()=>{try{aturBarbers((await ambilSemuaBarber()).filter(b=>b.aktif));}catch(e){aturError(ambilPesanKesalahan(e));}},[]);
 useFocusEffect(useCallback(()=>{void muatBarber();},[muatBarber]));usePenyegaranRealtime(["katalog"],muatBarber);
 const mulai=async()=>{if(sedang.current||!pilihan)return;sedang.current=true;aturSibuk(true);try{await ubahStatusPesanan(idPesanan,"IN_SERVICE",pilihan);await muat();}catch(e){aturError(ambilPesanKesalahan(e));}finally{sedang.current=false;aturSibuk(false);}};
 return <KartuBooking><Text style={g.teks}>Barber ditentukan saat mulai layanan</Text><InputBooking judul="Cari barber" nilai={cari} ubah={aturCari}/>{barbers.filter(b=>b.nama.toLowerCase().includes(cari.toLowerCase())).map(b=><TombolBooking key={b.id} judul={`${b.nama}${pilihan===b.id?" ✓":""}`} nonaktif={sibuk} aksi={()=>aturPilihan(b.id)}/>)}{!barbers.length&&<Text style={g.kecil}>Belum ada barber aktif yang tersedia.</Text>}<TombolBooking judul="Tetapkan barber dan mulai layanan" nonaktif={sibuk||!barbers.some(b=>b.id===pilihan)} aksi={()=>aturModal({judul:"Mulai Layanan Walk-in",pesan:"Tetapkan barber ini dan mulai layanan?",teksTombolUtama:"Mulai",saatTombolUtama:()=>void mulai(),teksTombolKedua:"Batal"})}/>{!!error&&<Text style={g.error}>{error}</Text>}<ModalAksi konfigurasi={modal} onTutup={()=>aturModal(null)}/></KartuBooking>;
}
