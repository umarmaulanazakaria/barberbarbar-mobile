import { useEffect } from "react";
import { AppState } from "react-native";
import { io } from "socket.io-client";
import { useSesiStore } from "../store/useSesiStore";
import { asalSocket } from "../layanan/alamatSocket";
import { pasangSinyalMobile } from "../layanan/sinyalRealtime";
export default function RealtimeOperator() {
 const token=useSesiStore(s=>s.token),role=useSesiStore(s=>s.pengguna?.role),id=useSesiStore(s=>s.pengguna?.id),siap=useSesiStore(s=>s.sudahMemuatSesi);
 useEffect(()=>{
  if(!token||!role||!siap)return;
  const socket=io(asalSocket(process.env.EXPO_PUBLIC_API_URL??""),{auth:{token},autoConnect:false,forceNew:true});
  const bersihkan=pasangSinyalMobile(socket,role==="ADMIN",AppState);
  const hentikan=()=>{bersihkan();socket.removeAllListeners();socket.disconnect();socket.auth={};};
  const lepas=useSesiStore.subscribe(s=>{if(s.token!==token||s.pengguna?.id!==id||s.pengguna?.role!==role)hentikan();});
  socket.connect();return()=>{lepas();hentikan();};
 },[token,role,id,siap]);
 return null;
}
