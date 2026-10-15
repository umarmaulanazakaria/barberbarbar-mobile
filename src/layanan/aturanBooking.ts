import type { Booking,RingkasanBooking } from "../tipe/booking";
export const batasKonfirmasi=(b:Booking)=>new Date(b.riwayat.filter(r=>r.aksi==="RESCHEDULE").at(-1)?.dibuatPada??b.dibuatPada).getTime()+30*60000;
export function izinBooking(b:Booking,u:RingkasanBooking|null,sekarang=Date.now()) {
 const pending=b.status==="PENDING_CONFIRMATION"&&sekarang<batasKonfirmasi(b),dp=u?.dpTerverifikasi===true;
 return{konfirmasi:pending&&sekarang<new Date(b.mulaiPada).getTime(),tolak:pending||(["CONFIRMED","CHECKED_IN"].includes(b.status)&&dp),checkIn:b.status==="CONFIRMED"&&dp&&sekarang<new Date(b.mulaiPada).getTime()+15*60000,mulai:b.status==="CHECKED_IN"&&dp&&!b.usulanBarber.some(p=>p.status==="PENDING"),usulkan:["CONFIRMED","CHECKED_IN"].includes(b.status)&&b.barberPilihanId!==null&&!b.usulanBarber.some(p=>p.status==="PENDING"),ubahLayanan:b.status==="IN_SERVICE"&&dp,selesai:b.status==="IN_SERVICE",lunasi:b.status==="COMPLETED"&&dp&&(u?.balance??0)>0&&!u?.transaksi.some(t=>t.tujuan==="PELUNASAN"&&t.status==="PENDING")};
}
