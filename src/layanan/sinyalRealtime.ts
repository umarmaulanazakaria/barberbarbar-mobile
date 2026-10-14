import type { Socket } from "socket.io-client";
export const eventRealtime = ["booking.changed","order.changed","payment.changed","membership.changed","refund.changed","customer.changed","account-link.changed","catalog.changed"] as const;
export type TopikRealtime = "beranda" | "pesanan" | "booking" | "pembayaran" | "pelanggan" | "membership" | "katalog" | "refund" | "pengaitan";
export function topikEvent(event: typeof eventRealtime[number], admin: boolean): TopikRealtime[] {
  switch(event) {
    case "booking.changed": return ["beranda","booking","pesanan","pembayaran"];
    case "order.changed": return ["beranda","pesanan","booking","pembayaran"];
    case "payment.changed": return ["beranda","pembayaran","pesanan","booking"];
    case "membership.changed": return ["beranda","pelanggan","membership"];
    case "refund.changed": return admin ? ["beranda","refund","pembayaran","booking"] : [];
    case "customer.changed": return ["beranda","pelanggan","pesanan","booking"];
    case "account-link.changed": return admin ? ["pengaitan","pelanggan"] : [];
    case "catalog.changed": return ["beranda","katalog"];
  }
}
type Pengamat = { topik: TopikRealtime[]; kerja: () => void | Promise<void>; aktif: boolean; berjalan: boolean; ulang: boolean };
const pengamat = new Set<Pengamat>();
async function jalankan(p: Pengamat) {
  if (!p.aktif) return;
  if(p.berjalan){p.ulang=true;return;}
  p.berjalan=true;
  try { do { p.ulang=false; await p.kerja(); } while(p.aktif && p.ulang); }
  catch { /* Layar menampilkan error REST; kegagalan subscriber tidak mematikan socket. */ }
  finally { p.berjalan=false; }
}
export function langgananRealtime(topik: TopikRealtime[], kerja: Pengamat["kerja"]) {
  const p:Pengamat={topik,kerja,aktif:true,berjalan:false,ulang:false};pengamat.add(p);
  return()=>{p.aktif=false;p.ulang=false;pengamat.delete(p);};
}
export function segarkanRealtime(topik?: TopikRealtime[]) {
  for(const p of pengamat)if(!topik||p.topik.some(t=>topik.includes(t)))void jalankan(p);
}
export function pasangSinyalMobile(socket: Socket, admin: boolean, statusAplikasi: { currentState: string | null; addEventListener: (jenis: "change", kerja: (status: string) => void) => { remove: () => void } }) {
  let aktif=true, depan=statusAplikasi.currentState==="active";
  let timer:ReturnType<typeof setTimeout>|undefined;
  const tertunda=new Set<TopikRealtime>(),seen=new Set<string>();
  const handlers=eventRealtime.map(event=>{
    const handler=(s:{id:number;aksi:string;versi:string;refetch:boolean})=>{
      if(!aktif||!s||!Number.isSafeInteger(s.id)||s.id<1||s.refetch!==true||typeof s.aksi!=="string"||typeof s.versi!=="string")return;
      const key=`${event}:${s.id}:${s.aksi}:${s.versi}`;if(seen.has(key))return;seen.add(key);if(seen.size>1000)seen.delete(seen.values().next().value!);
      for(const t of topikEvent(event,admin))tertunda.add(t);
      if(timer)return;timer=setTimeout(()=>{timer=undefined;if(aktif&&depan)segarkanRealtime([...tertunda]);tertunda.clear();},100);
    };socket.on(event,handler);return{event,handler};
  });
  const pulihkan=()=>{if(aktif&&depan)segarkanRealtime();};
  socket.on("connect",pulihkan);socket.on("realtime.ready",pulihkan);
  const aplikasi=statusAplikasi.addEventListener("change",status=>{depan=status==="active";if(depan){if(!socket.connected)socket.connect();pulihkan();}});
  const polling=setInterval(pulihkan,30000);
  return()=>{aktif=false;if(timer)clearTimeout(timer);clearInterval(polling);aplikasi.remove();for(const{event,handler}of handlers)socket.off(event,handler);socket.off("connect",pulihkan);socket.off("realtime.ready",pulihkan);tertunda.clear();seen.clear();};
}
