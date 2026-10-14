import { useCallback,useState } from "react";
import { useFocusEffect,useNavigation } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { DaftarRuteTabUtama } from "../navigasi/NavigasiTabUtama";
import { Text } from "react-native";
import { ambilDaftarBooking } from "../layanan/booking";
import { ambilPesanKesalahan } from "../layanan/api";
import { usePenyegaranRealtime } from "../hooks/usePenyegaranRealtime";
import type { Booking } from "../tipe/booking";
import { KartuBooking,TombolBooking,gayaBooking as g } from "./UiBooking";
export default function RingkasanBookingBeranda(){
 const navigasi=useNavigation<BottomTabNavigationProp<DaftarRuteTabUtama>>(),[data,aturData]=useState<Booking[]|null>(null),[error,aturError]=useState("");
 const muat=useCallback(async()=>{try{aturData(await ambilDaftarBooking());aturError("");}catch(e){aturError(ambilPesanKesalahan(e));}},[]);
 useFocusEffect(useCallback(()=>{void muat();},[muat]));usePenyegaranRealtime(["booking","pembayaran"],muat);
 return <KartuBooking><Text style={g.teks}>Booking Customer</Text><Text style={g.kecil}>{data===null?"Memuat booking…":`Menunggu konfirmasi ${data.filter(b=>b.status==="PENDING_CONFIRMATION").length} · Dikonfirmasi ${data.filter(b=>b.status==="CONFIRMED").length} · Check-in ${data.filter(b=>b.status==="CHECKED_IN").length}`}</Text>{!!error&&<Text style={g.error}>{error}</Text>}<TombolBooking judul="Kelola booking" aksi={()=>navigasi.navigate("Booking",{screen:"DaftarBooking"})}/></KartuBooking>;
}
