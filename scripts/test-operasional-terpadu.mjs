import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import { io } from "socket.io-client";
import { createRequire } from "node:module";
import { mkdtemp, writeFile, rm, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

// Tidak membaca .env, tidak terhubung PostgreSQL/provider. Semua data di memori.
const require = createRequire(import.meta.url);
const esbuild = process.env.BB_ESBUILD_PATH
  ? require(process.env.BB_ESBUILD_PATH)
  : createRequire(path.resolve("../barberbarbar/client/package.json"))("esbuild");
const sementara = await mkdtemp(path.join(os.tmpdir(), "bb-staff-terpadu-"));
const asliSekarang = Date.now;
let sekarang = Date.parse("2026-10-16T10:00:00+07:00");
Date.now = () => sekarang;
const hari = (n, jam = "14:00") => `2026-10-${String(16+n).padStart(2,"0")}T${jam}:00+07:00`;
const booking = (id, tambah = {}) => ({id, nomorBooking:`BK-${id}`, status:"PENDING_CONFIRMATION",
  mulaiPada:hari(0), selesaiPada:hari(0,"14:30"), dibuatPada:new Date(sekarang-60_000).toISOString(),
  durasiMenit:30, pelanggan:{id,nama:`Pelanggan ${id}`}, barberPilihanId:null,barberDisetujuiId:null,barberFinalId:null,
  pesananId:null,subtotal:10000,total:10000,diskon:0,discountPercent:0,nominalDp:5000,catatan:null,alasanPenolakan:null,
  deadlineDp:null,deadlinePelunasan:null,items:[{layananId:1,namaLayanan:"Cukur",harga:10000,qty:1,subtotal:10000,durasiMenit:30}],usulanBarber:[],riwayat:[],...tambah});
const order = (id, tambah = {}) => ({id,nomorPesanan:`PS-${id}`,pelangganId:id,barberId:null,barber:null,
  pelanggan:{id,nama:`Walk-in ${id}`},status:"WAITING",statusPembayaran:"UNPAID",checkInTime:hari(0,"09:00"),
  dibuatPada:hari(0,"09:00"),diperbaruiPada:hari(0,"09:00"),total:10000,subtotal:10000,discountPercent:0,diskon:0,
  pembayaran:null,riwayatStatus:[],items:[{namaLayanan:"Cukur",qty:1}],...tambah});
const lunas = {statusPembayaran:"PAID",balance:0,total:10000,dpTerverifikasi:true,invoice:{id:1,nomorInvoice:"INV-FIXTURE",total:10000,dibuatPada:hari(-1)}};
let bookings=[],orders=[],ringkasan=new Map(),gagalRingkasan=new Set(),sembunyi=new Set(),gagalDaftar=false;
const permintaan=[];
let tahanBerikut=null,ioNyata,klienNyata;
const metrik={waiting:31,inService:22,completedUnpaid:13,paidToday:7,revenueToday:765432,pelanggan:5,barberAktif:3,layananAktif:4,pesananTerbaru:[]};
const http=createServer(async(req,res)=>{
  let body="";for await(const bagian of req)body+=bagian;
  permintaan.push({metode:req.method,url:req.url,body,auth:req.headers.authorization});
  const jawab=(data,kode=200)=>{res.writeHead(kode,{"Content-Type":"application/json"});res.end(JSON.stringify(data));};
  if(req.url==="/customer/bookings"&&req.method==="POST"&&req.headers.authorization==="Bearer fixture-customer") {bookings.push(booking(80,JSON.parse(body)));return jawab({booking:bookings.at(-1)},201);}
  if(req.url==="/customer/bookings/80"&&req.headers.authorization==="Bearer fixture-customer")return jawab({booking:bookings.find(b=>b.id===80)});
  if(req.headers.authorization!=="Bearer fixture-operator")return jawab({pesan:"Unauthorized"},401);
  if(req.url==="/bookings"){
    const data=structuredClone(bookings.filter(b=>!sembunyi.has(b.id)));
    if(tahanBerikut){const t=tahanBerikut;tahanBerikut=null;t.mulai();await t.tunggu;}
    return gagalDaftar?jawab({pesan:"Fixture failure"},503):jawab({data});
  }
  if(req.url==="/orders")return jawab(orders);
  if(req.url==="/dashboard")return jawab(metrik);
  if(req.url==="/membership-requests")return jawab({data:[]});
  const detail=req.url.match(/^\/bookings\/(\d+)(\/payments)?$/);
  if(detail){const id=Number(detail[1]);return detail[2]?jawab({ringkasan:ringkasan.get(id)},gagalRingkasan.has(id)?503:200):jawab({booking:bookings.find(b=>b.id===id)});}
  // Lifecycle fixture menggantikan backend. Tidak menguji ulang atau mengubah aturan backend.
  const aksi=req.url.match(/^\/bookings\/(\d+)\/(confirm|check-in|start|complete)$/);
  if(aksi&&req.method==="POST"){
    const b=bookings.find(b=>b.id===Number(aksi[1]));
    if(aksi[2]==="confirm")b.status="CONFIRMED";
    if(aksi[2]==="check-in")b.status="CHECKED_IN";
    if(aksi[2]==="start"){b.status="IN_SERVICE";b.pesananId=900;orders.push(order(900,{booking:{id:b.id,nomorBooking:b.nomorBooking},status:"IN_SERVICE"}));}
    if(aksi[2]==="complete"){b.status="COMPLETED";orders.find(p=>p.id===b.pesananId).status="COMPLETED";}
    return jawab({booking:b});
  }
  return jawab({pesan:"Endpoint fixture tidak tersedia"},404);
});
await new Promise(r=>http.listen(0,"127.0.0.1",r));
process.env.EXPO_PUBLIC_API_URL=`http://127.0.0.1:${http.address().port}`;
const modul={
  react:`let nilai=[],i=0,antrian=[],berubah=false;export function mulai(){i=0;berubah=false;}export function efek(){for(const f of antrian.splice(0))f();return berubah;}export function bersihkan(){for(const v of nilai)if(v?.cleanup)v.cleanup();nilai=[];antrian=[];i=0;}export function useState(x){const k=i++;if(!(k in nilai))nilai[k]=typeof x==='function'?x():x;return[nilai[k],v=>{const n=typeof v==='function'?v(nilai[k]):v;if(!Object.is(n,nilai[k])){nilai[k]=n;berubah=true;}}];}export function useRef(x){const k=i++;return nilai[k]??={current:x};}export function useMemo(f,d){const k=i++,v=nilai[k];if(!v||d.some((x,j)=>!Object.is(x,v.d[j])))nilai[k]={d,value:f()};return nilai[k].value;}export function useCallback(f,d){return useMemo(()=>f,d);}export function useEffect(f,d){const k=i++,v=nilai[k];if(!v||d.some((x,j)=>!Object.is(x,v.d[j]))){antrian.push(()=>{v?.cleanup?.();nilai[k]={d,cleanup:f()};});}}`,
  "@react-navigation/native":`import {useEffect} from 'react';let mode='history';export const navigation=[];export const useNavigation=()=>({navigate:(...x)=>navigation.push(x)});export const useRoute=()=>({params:{mode}});export const changeMode=x=>mode=x;export const useFocusEffect=f=>useEffect(f,[f]);`,
  "react-native":`const listeners=new Set();export const AppState={currentState:'active',addEventListener:(k,f)=>{listeners.add(f);return{remove:()=>listeners.delete(f)}}};export const foreground=s=>{AppState.currentState=s;for(const f of listeners)f(s);};export const listenerCount=()=>listeners.size;export const Text='Text',View='View',ActivityIndicator='ActivityIndicator',FlatList='FlatList',Modal='Modal',Pressable='Pressable',RefreshControl='RefreshControl',ScrollView='ScrollView',TextInput='TextInput',StyleSheet={create:x=>x};`,
  "react-native-safe-area-context":`export const SafeAreaView='SafeAreaView';`,
  "@expo/vector-icons":`export const Ionicons='Ionicons';`,
  "expo-secure-store":`let token=null;export async function getItemAsync(){return token;}export async function setItemAsync(k,v){token=v;}export async function deleteItemAsync(){token=null;}`,
  "../store/useSesiStore":`export const useSesiStore=f=>f({pengguna:{role:'STAFF'}});`,
  "../komponen/ModalAksi":`export default 'ModalAksi';`,
};
let m,jumlah=0;
const pass=pesan=>{jumlah++;console.log(`PASS ${jumlah}: ${pesan}`);};
const ticks=new Map(),setIntervalAsli=global.setInterval,clearIntervalAsli=global.clearInterval;
// Jam hook dapat digerakkan deterministik tanpa menunggu lewat tengah malam.
global.setInterval=(fn,ms,...arg)=>{if(ms===1000||ms===30000){const id={};ticks.set(id,{fn,ms});return id;}return setIntervalAsli(fn,ms,...arg);};
global.clearInterval=id=>{if(!ticks.delete(id))clearIntervalAsli(id);};
const tick=()=>{for(const t of [...ticks.values()])if(t.ms===1000)t.fn();};
const tunggu=async cek=>{for(let i=0;i<1000;i++){if(await cek())return;await new Promise(r=>setTimeout(r,5));}throw Error("Fixture timeout");};
// Host/hook adapter merender komponen source aktual; bukan bukti UI perangkat.
const semua=n=>Array.isArray(n)?n.flatMap(semua):n&&typeof n==='object'?
  typeof n.type==='function'?semua(n.type(n.props)):[n,...semua(n.props?.children),...semua(n.props?.ListHeaderComponent),...semua(n.props?.refreshControl),...semua(n.type==='FlatList'?n.props.data.map((item,index)=>n.props.renderItem({item,index})):null)]:[];
const teks=n=>Array.isArray(n)?n.map(teks).join(' '):n&&typeof n==='object'?teks(n.props?.children):String(n??'');
const nodes=()=>semua(root);
let root,layar;
const render=()=>{for(let i=0;i<12;i++){m.mulai();root=layar();if(!m.efek())return nodes();}throw Error('Render tidak stabil');};
const tampil=async fn=>{m.bersihkan();layar=fn;render();await new Promise(r=>setTimeout(r,45));return render();};
const selesai=async()=>{await new Promise(r=>setTimeout(r,45));return render();};
const tombol=label=>nodes().find(n=>n.type==='Pressable'&&(n.props.accessibilityLabel===label||teks(n).trim()===label));
try{
  const isi=`export * from './src/layanan/operasionalTerpadu';export * from './src/layanan/sinyalRealtime';export * from './src/layanan/aturanBooking';export * from './src/layanan/booking';export {simpanToken} from './src/penyimpanan/penyimpananSesi';export {default as Beranda} from './src/layar/LayarBeranda';export {default as Booking} from './src/layar/LayarBooking';export {default as Pesanan} from './src/layar/LayarPesanan';export {mulai,efek,bersihkan} from 'react';export {navigation,changeMode} from '@react-navigation/native';export {foreground,AppState,listenerCount} from 'react-native';`;
  const hasil=await esbuild.build({stdin:{contents:isi,resolveDir:process.cwd(),sourcefile:'fixture-staff.ts'},bundle:true,write:false,platform:'node',format:'cjs',packages:'external',jsx:'automatic',plugins:[{name:'native-fixture',setup(b){b.onResolve({filter:/.*/},a=>Object.hasOwn(modul,a.path)?{path:a.path,namespace:'fixture'}:undefined);b.onLoad({filter:/.*/,namespace:'fixture'},a=>({contents:modul[a.path],loader:'js'}));}}]});
  // Output sementara di luar repository; dependency resolve tetap dari proyek.
  const keluaran=path.join(sementara,'uji.cjs');await writeFile(keluaran,hasil.outputFiles[0].text);
  const Module=require('node:module');const compiled=new Module(keluaran);compiled.filename=keluaran;compiled.paths=Module._nodeModulePaths(process.cwd());compiled._compile(hasil.outputFiles[0].text,keluaran);m=compiled.exports;
  await m.simpanToken('fixture-operator');
  assert.equal(m.hariOperasional(Date.parse('2026-10-15T17:00:00Z')).kunci,'2026-10-16');
  assert.equal(m.hariOperasional(Date.parse('2026-10-16T16:59:59.999Z')).kunci,'2026-10-16');
  assert.equal(m.hariOperasional(Date.parse('2026-10-16T17:00:00Z')).kunci,'2026-10-17');
  pass('Batas numerik WIB inklusif 00.00, eksklusif 24.00; bebas zona perangkat');
  const awal=[booking(1),booking(2,{mulaiPada:hari(1)}),booking(3,{mulaiPada:hari(7)})];
  let gabung=m.gabungkanOperasional(awal,[order(1)]);
  assert.equal(m.daftarAktif(gabung,sekarang).length,4);
  pass('Beranda memuat pending hari ini, besok, +7 hari dan walk-in aktif');
  const prioritas=booking(4,{mulaiPada:hari(7),dibuatPada:new Date(sekarang-29*60000).toISOString()});
  assert.equal(m.daftarAktif(m.gabungkanOperasional([...awal,prioritas],[]),sekarang)[0].booking.id,4);
  const basi=booking(5,{dibuatPada:new Date(sekarang-30*60000).toISOString()});
  assert.equal(m.daftarAktif(m.gabungkanOperasional([basi],[]),sekarang).length,0);
  assert.match(m.tenggatOperasional(m.gabungkanOperasional([basi],[])[0],sekarang).label,/terlewati/);
  assert.equal(m.izinBooking(basi,null,sekarang).konfirmasi,false);
  const ulang={...basi,riwayat:[{aksi:'RESCHEDULE',dibuatPada:new Date(sekarang-60000).toISOString()}]};
  assert.equal(m.daftarAktif(m.gabungkanOperasional([ulang],[]),sekarang).length,1);
  assert.equal(m.daftarAktif(m.gabungkanOperasional([booking(6,{mulaiPada:hari(0,'09:00')})],[]),sekarang).length,0);
  pass('Prioritas tenggat, batas tepat 30 menit, jadwal terlewati, dan tenggat RESCHEDULE');
  const status=['CONFIRMED','CHECKED_IN','IN_SERVICE','REJECTED','CANCELLED','NO_SHOW'];
  gabung=m.gabungkanOperasional(status.map((s,i)=>booking(10+i,{status:s,mulaiPada:hari(7)})),[order(9,{status:'COMPLETED',statusPembayaran:'PAID'}),order(8,{status:'COMPLETED'}),order(7,{status:'CANCELLED'})]);
  assert.deepEqual(m.daftarAktif(gabung,sekarang).map(e=>e.booking?.status??e.pesanan.status).sort(),['CHECKED_IN','COMPLETED','CONFIRMED','IN_SERVICE'].sort());
  pass('Status future diputuskan mengikuti lifecycle; walk-in selesai lunas/terminal keluar dari aktif');
  const terkait=booking(20,{status:'COMPLETED',pesananId:21,mulaiPada:hari(-1)}),pesananTerkait=order(21,{booking:{id:20,nomorBooking:'BK-20'},status:'COMPLETED',statusPembayaran:'PAID'});
  gabung=m.gabungkanOperasional([terkait,terkait],[pesananTerkait,pesananTerkait],new Map([[20,lunas]]));
  assert.equal(gabung.length,1);assert.equal(m.daftarAktif(gabung,sekarang).length,0);
  assert.equal(m.gabungkanOperasional([{...terkait,pesananId:null}],[pesananTerkait]).length,1);
  assert.equal(m.gabungkanOperasional([terkait],[{...pesananTerkait,booking:null}]).length,1);
  assert.equal(m.daftarAktif(m.gabungkanOperasional([terkait],[],new Map([[20,{...lunas,statusPembayaran:'OVERDUE',balance:5000}]])),sekarang).length,1);
  const dikonfirmasi=m.gabungkanOperasional([booking(22,{status:'CONFIRMED',deadlineDp:hari(0,'11:00')})],[],new Map([[22,{...lunas,statusPembayaran:'DP_PAID',dpTerverifikasi:true}]]))[0];
  assert.equal(m.tenggatOperasional(dikonfirmasi,sekarang),null);
  assert.equal(m.tenggatOperasional({...dikonfirmasi,pembayaran:{...lunas,dpTerverifikasi:false}},sekarang).label,'Batas DP');
  pass('Dedup dua arah dan duplikat array; ledger PAID/OVERDUE backend menentukan aktif; DP sah tidak ditagih ulang');
  const kemarin=booking(30,{status:'REJECTED',mulaiPada:hari(-1),dibuatPada:hari(-2)});
  const walkKemarin=order(31,{checkInTime:hari(-1),dibuatPada:hari(-2)});
  gabung=m.gabungkanOperasional([kemarin,booking(32),booking(33,{mulaiPada:hari(1)})],[walkKemarin]);
  const riwayat=m.riwayatOperasional(gabung,sekarang);assert.equal(riwayat.length,2);
  assert.equal(m.hariOperasional(Date.parse(riwayat[0].jadwal)).kunci,m.hariOperasional(Date.parse(riwayat[1].jadwal)).kunci);
  assert.deepEqual(m.ruteOperasional(riwayat.find(e=>e.booking)),{screen:'DetailBooking',params:{idBooking:30}});
  assert.deepEqual(m.ruteOperasional(riwayat.find(e=>e.pesanan)),{screen:'DetailPesanan',params:{idPesanan:31}});
  pass('Riwayat tanggal layanan/check-in, terminal tanpa order, tanpa hari ini/future, rute booking/walk-in tepat');
  const banyak=Array.from({length:80},(_,i)=>booking(100+i,{mulaiPada:i===79?hari(0,'23:00'):hari(1)}));
  assert.equal(m.bookingHariIni(banyak,sekarang).length,1);
  assert.equal(m.bookingHariIni(banyak,sekarang,'BK-179').length,1);
  pass('Filter jadwal bukan tanggal pembuatan; item ke-80 tetap ditemukan tanpa pagination terpotong');
  bookings=[...awal,terkait,...banyak];orders=[order(1),pesananTerkait];ringkasan=new Map([[20,lunas]]);
  sembunyi=new Set([20]);const sebelum=permintaan.length;
  const data=await m.ambilOperasionalTerpadu();assert.equal(data.filter(e=>e.booking?.id===20).length,1);assert.equal(data.length,85);
  assert.ok(permintaan.slice(sebelum).every(p=>p.metode==='GET'));
  assert.ok(permintaan.slice(sebelum).every(p=>p.auth==='Bearer fixture-operator'));
  assert.equal(data.find(e=>e.booking?.id===20).pembayaran.invoice.nomorInvoice,'INV-FIXTURE');
  sembunyi.clear();gagalRingkasan.add(20);const rusak=await m.ambilOperasionalTerpadu();assert.ok(m.daftarAktif(rusak,sekarang).some(e=>e.booking?.id===20));gagalRingkasan.clear();
  pass('SDK REST/JWT aktual: GET-only, array lengkap, relasi belum di daftar dilengkapi, invoice asli dan gagal ledger tidak dianggap lunas');
  await tampil(m.Beranda);
  const kartu=nodes().filter(n=>n.type==='Pressable'&&n.props.accessibilityLabel?.startsWith('Detail'));
  assert.equal(kartu.length,7);assert.ok(!nodes().some(n=>teks(n)==='Kelola booking'));
  assert.ok(nodes().some(n=>teks(n).includes('Menampilkan 7 dari')));
  for(const x of [31,22,13,7,5,3,4])assert.ok(nodes().some(n=>n.type==='Text'&&teks(n)===String(x)));
  const lihat=nodes().filter(n=>n.type==='Pressable'&&teks(n)==='Lihat Semua');assert.equal(lihat.length,2);
  lihat[0].props.onPress();assert.deepEqual(m.navigation.at(-1),['Pesanan',{screen:'DaftarPesanan',params:{mode:'hariIni'}}]);
  lihat[1].props.onPress();assert.deepEqual(m.navigation.at(-1),['Pesanan',{screen:'DaftarPesanan',params:{mode:'aktif'}}]);
  kartu[0].props.onPress();assert.equal(m.navigation.at(-1)[0],'Booking');assert.equal(m.navigation.at(-1)[1].screen,'DetailBooking');
  pass('Layar Beranda: 7 preview + seluruh aktif, dua Lihat Semua tepat, booking ke detail booking, metrik dashboard dipertahankan');
  m.changeMode('aktif');await tampil(m.Pesanan);
  assert.equal(nodes().find(n=>n.type==='FlatList').props.data.length,84);
  const allCards=nodes().filter(n=>n.type==='Pressable'&&n.props.accessibilityLabel?.startsWith('Detail'));assert.equal(allCards.length,84);
  const walkButton=allCards.find(n=>n.props.accessibilityLabel==='Detail pesanan');walkButton.props.onPress();assert.deepEqual(m.navigation.at(-1),['DetailPesanan',{idPesanan:1}]);
  m.changeMode('hariIni');await tampil(m.Pesanan);assert.equal(nodes().find(n=>n.type==='FlatList').props.data.length,2);
  pass('Lihat Semua aktif tidak terpotong; rute walk-in dan mode operasional hari ini tetap order-only');
  bookings=[...awal,booking(40,{mulaiPada:hari(-1)}),booking(41,{mulaiPada:hari(0,'22:00'),status:'CONFIRMED'}),...banyak];
  await tampil(m.Booking);assert.equal(nodes().filter(n=>n.props.accessibilityLabel==='Detail dan pembayaran').length,3);
  let input=nodes().find(n=>n.type==='TextInput');input.props.onChangeText('Pelanggan 179');render();assert.equal(nodes().filter(n=>n.props.accessibilityLabel==='Detail dan pembayaran').length,1);
  input=nodes().find(n=>n.type==='TextInput');input.props.onChangeText('dikonfirmasi');render();assert.equal(nodes().filter(n=>n.props.accessibilityLabel==='Detail dan pembayaran').length,1);
  input=nodes().find(n=>n.type==='TextInput');input.props.onChangeText('BK-1');render();assert.equal(nodes().filter(n=>n.props.accessibilityLabel==='Detail dan pembayaran').length,2);
  const beforeRefresh=permintaan.length;tombol('Perbarui').props.onPress();await selesai();assert.ok(permintaan.length>beforeRefresh);
  pass('Layar Booking: hari WIB, search nama/nomor/status ramah, Refresh REST, item urutan akhir tetap tampil');
  bookings=[kemarin,terkait,booking(50),booking(51,{mulaiPada:hari(1)}),booking(52,{mulaiPada:'2025-01-03T14:00:00+07:00',status:'CANCELLED'})];orders=[walkKemarin,pesananTerkait];
  m.changeMode('history');await tampil(m.Pesanan);let list=nodes().find(n=>n.type==='FlatList');assert.equal(list.props.data.length,1);assert.equal(list.props.data[0].pesanan.length,3);
  list.props.renderItem({item:list.props.data[0]}).props.onPress();render();list=nodes().find(n=>n.type==='FlatList');assert.equal(list.props.data.length,3);
  assert.ok(nodes().some(n=>/Invoice:\s+INV-FIXTURE/.test(teks(n))));
  const detailBooking=nodes().find(n=>n.props.accessibilityLabel==='Detail booking dan pembayaran');detailBooking.props.onPress();assert.equal(m.navigation.at(-1)[0],'DetailBooking');
  await tampil(m.Pesanan);let tanggalInput=nodes().find(n=>n.type==='TextInput');tanggalInput.props.onChangeText('03012025');render();assert.equal(nodes().find(n=>n.type==='FlatList').props.data[0].kunci,'2025-01-03');
  tanggalInput=nodes().find(n=>n.type==='TextInput');tanggalInput.props.onChangeText('31022026');render();assert.equal(nodes().find(n=>n.type==='FlatList').props.data.length,0);
  pass('Layar riwayat: kelompok sama, 1 booking/order, drill-down, invoice dan filter tanggal valid/tidak valid');
  await tampil(m.Pesanan);const tahun=nodes().find(n=>n.type==='Pressable'&&teks(n)==='2025');tahun.props.onPress();render();assert.equal(nodes().find(n=>n.type==='FlatList').props.data[0].tahun,2025);
  const januari=nodes().find(n=>n.type==='Pressable'&&teks(n)==='Januari');januari.props.onPress();render();assert.equal(nodes().find(n=>n.type==='FlatList').props.data.length,1);
  const februari=nodes().find(n=>n.type==='Pressable'&&teks(n)==='Februari');februari.props.onPress();render();assert.equal(nodes().find(n=>n.type==='FlatList').props.data.length,0);
  pass('Filter tahun dan bulan existing tetap bekerja');
  bookings=[booking(90)];orders=[];await tampil(m.Beranda);
  let sudahMulai,bukaTahan;const dimulai=new Promise(r=>sudahMulai=r);tahanBerikut={mulai:sudahMulai,tunggu:new Promise(r=>bukaTahan=r)};
  nodes().find(n=>n.type==='RefreshControl').props.onRefresh();await dimulai;
  bookings=[booking(91)];nodes().find(n=>n.type==='RefreshControl').props.onRefresh();await selesai();
  assert.ok(nodes().some(n=>/BK-91/.test(teks(n))));bukaTahan();await selesai();
  assert.ok(!nodes().some(n=>/BK-90/.test(teks(n))));
  gagalDaftar=true;nodes().find(n=>n.type==='RefreshControl').props.onRefresh();await selesai();
  assert.ok(nodes().some(n=>/BK-91/.test(teks(n))));assert.ok(nodes().some(n=>teks(n).includes('Data terbaru belum dapat dimuat.')));gagalDaftar=false;
  pass('Respons refresh lama tidak menimpa data baru; kegagalan REST mempertahankan data dan menampilkan peringatan');
  // Berganti hari saat layar terbuka, lalu foreground; filter berubah sebelum REST selesai sekalipun.
  sekarang=Date.parse('2026-10-16T23:59:59+07:00');bookings=[booking(60,{status:'CONFIRMED',mulaiPada:hari(0,'23:00')}),booking(61,{status:'CONFIRMED',mulaiPada:hari(1)})];orders=[];
  await tampil(m.Booking);assert.ok(nodes().some(n=>n.type==='Text'&&teks(n)==='BK-60'));
  const awalMidnight=permintaan.length;sekarang+=1000;tick();render();assert.ok(!nodes().some(n=>n.type==='Text'&&teks(n)==='BK-60'));assert.ok(nodes().some(n=>n.type==='Text'&&teks(n)==='BK-61'));await selesai();assert.ok(permintaan.length>awalMidnight);
  m.foreground('background');sekarang+=86400000;m.foreground('active');render();assert.equal(nodes().filter(n=>n.props.accessibilityLabel==='Detail dan pembayaran').length,0);
  m.changeMode('history');await tampil(m.Pesanan);assert.equal(nodes().find(n=>n.type==='FlatList').props.data.length,2);
  m.bersihkan();assert.equal(m.listenerCount(),0);assert.equal(ticks.size,0);
  pass('Pergantian hari terbuka/foreground: filter langsung, refetch, riwayat bergulir, cleanup timer/listener');
  sekarang=Date.parse('2026-10-16T10:00:00+07:00');bookings=[booking(70,{dibuatPada:new Date(sekarang-29*60000-59000).toISOString()})];orders=[];
  await tampil(m.Beranda);assert.equal(nodes().filter(n=>n.props.accessibilityLabel==='Detail booking dan pembayaran').length,1);sekarang+=1000;tick();render();assert.equal(nodes().filter(n=>n.props.accessibilityLabel==='Detail booking dan pembayaran').length,0);
  pass('Antrean konfirmasi hilang tepat deadline tanpa menunggu event scheduler');
  // Socket controller source aktual, fake transport; payload hanya sinyal -> GET REST.
  m.bersihkan();const handlers=new Map();const socket={connected:true,on(e,f){const a=handlers.get(e)??[];a.push(f);handlers.set(e,a);},off(e,f){handlers.set(e,(handlers.get(e)??[]).filter(x=>x!==f));},connect(){this.connected=true;for(const f of handlers.get('connect')??[])f();}};
  const stop=m.pasangSinyalMobile(socket,false,m.AppState);let hasilRealtime=[],refetch=0;
  const lepas=m.langgananRealtime(['booking'],async()=>{hasilRealtime=await m.ambilOperasionalTerpadu();refetch++;});
  const emit=e=>{for(const f of handlers.get(e)??[])f({id:80,aksi:'fixture',versi:String(refetch),refetch:true});};
  bookings=[];orders=[];
  const customer=await fetch(process.env.EXPO_PUBLIC_API_URL+'/customer/bookings',{method:'POST',headers:{Authorization:'Bearer fixture-customer','Content-Type':'application/json'},body:JSON.stringify({mulaiPada:hari(1)})});assert.equal(customer.status,201);
  ringkasan=new Map([[80,{...lunas,statusPembayaran:'PARTIAL',balance:5000}]]);
  emit('booking.changed');await tunggu(()=>hasilRealtime.some(e=>e.booking?.id===80));assert.equal(m.daftarAktif(hasilRealtime,sekarang).length,1);
  await m.tindakanBooking(80,'confirm');emit('booking.changed');await tunggu(()=>hasilRealtime[0]?.booking?.status==='CONFIRMED');
  assert.equal((await m.ambilDetailBooking(80)).status,'CONFIRMED');
  const customerDetail=await fetch(process.env.EXPO_PUBLIC_API_URL+'/customer/bookings/80',{headers:{Authorization:'Bearer fixture-customer'}});assert.equal((await customerDetail.json()).booking.status,'CONFIRMED');
  const dp=await m.ambilPembayaranBooking(80);assert.equal(m.izinBooking(await m.ambilDetailBooking(80),dp,sekarang).checkIn,true);
  await m.tindakanBooking(80,'check-in');await m.tindakanBooking(80,'start');emit('order.changed');await tunggu(()=>hasilRealtime[0]?.booking?.status==='IN_SERVICE');assert.equal(hasilRealtime.length,1);assert.equal(hasilRealtime[0].pesanan.id,900);
  await m.tindakanBooking(80,'complete');ringkasan.set(80,lunas);emit('payment.changed');await tunggu(()=>hasilRealtime[0]?.pembayaran?.statusPembayaran==='PAID');assert.equal(m.daftarAktif(hasilRealtime,sekarang).length,0);
  const sebelumReconnect=refetch;emit('connect');await tunggu(()=>refetch>sebelumReconnect);
  const sebelumForeground=refetch;m.foreground('background');m.foreground('active');await tunggu(()=>refetch>sebelumForeground);
  lepas();stop();assert.equal(m.listenerCount(),0);assert.ok([...handlers.values()].every(a=>a.length===0));
  assert.ok(!permintaan.some(p=>/payment|refund/.test(p.url)&&p.metode!=='GET'));
  pass('Integrasi MOCK: customer fixture -> REST Staff -> confirm -> check-in DP fixture -> linked order -> COMPLETED/PAID; Socket -> REST, reconnect/foreground, tanpa mutasi pembayaran/refund');
  // Transport Socket.IO aktual di localhost, backend tetap fixture HTTP di memori.
  const {Server}=createRequire(path.resolve(process.env.BB_BACKEND_PACKAGE??'../barberbarbar/server/package.json'))('socket.io');
  ioNyata=new Server(http);ioNyata.use((s,next)=>next(s.handshake.auth.token==='fixture-operator'?undefined:new Error('Unauthorized')));
  klienNyata=io(process.env.EXPO_PUBLIC_API_URL,{autoConnect:false,transports:['websocket'],auth:{token:'fixture-operator'}});
  const hentikan=m.pasangSinyalMobile(klienNyata,false,m.AppState);let segar=0,hasilJaringan=[];
  const berhenti=m.langgananRealtime(['booking'],async()=>{hasilJaringan=await m.ambilOperasionalTerpadu();segar++;});
  klienNyata.connect();await once(klienNyata,'connect');await tunggu(()=>segar>0);
  bookings=[booking(95,{mulaiPada:hari(7)})];orders=[];ioNyata.emit('booking.changed',{id:95,aksi:'CREATED',versi:'fixture-1',refetch:true});
  await tunggu(()=>hasilJaringan.some(e=>e.booking?.id===95));assert.equal(m.daftarAktif(hasilJaringan,sekarang).length,1);
  const sebelumJaringan=segar;klienNyata.io.engine.close();await tunggu(()=>klienNyata.connected&&segar>sebelumJaringan);
  berhenti();hentikan();klienNyata.disconnect();await new Promise(r=>ioNyata.close(r));ioNyata=null;
  pass('Transport Socket.IO nyata localhost: event -> REST authoritative, future booking, reconnect dan listener cleanup; backend fixture');
  const tab=await readFile('src/navigasi/NavigasiTabUtama.tsx','utf8');assert.deepEqual([...tab.matchAll(/<Tab.Screen\s+name="(\w+)"/g)].map(x=>x[1]),['Beranda','Booking','Pesanan','Pelanggan','Profile']);
  pass('Lima tab serta entry Order history dipertahankan');
  console.log(`TOTAL ${jumlah} kelompok PASS; fixture HTTP/native/hooks/socket, bukan backend PostgreSQL atau perangkat Android.`);
}finally{
  m?.bersihkan();Date.now=asliSekarang;global.setInterval=setIntervalAsli;global.clearInterval=clearIntervalAsli;
  klienNyata?.disconnect();if(ioNyata)await new Promise(r=>ioNyata.close(r));await new Promise(r=>http.close(r));assert.equal(path.dirname(sementara),path.resolve(os.tmpdir()));assert.ok(path.basename(sementara).startsWith('bb-staff-terpadu-'));await rm(sementara,{recursive:true,force:true});
}
