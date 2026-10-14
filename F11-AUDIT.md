# Integrasi Mobile ADMIN/STAFF

## Verifikasi ulang integrasi customer, 15 Oktober 2026

Regresi Mobile 10 kelompok PASS; cleanup membuktikan 22 model domain identik.
Harness kini menghentikan semua subscriber/socket sebelum mengganti api.get
untuk simulasi pemulihan sesi tertunda. Callback refetch sebelumnya dapat
mengambil Promise simulasi tersebut dan membuat tes macet. Ini perbaikan
harness saja; source alur operator dan file historis tidak diubah.
Satu percobaan awal tumpang tindih dengan fixture backend tidak dipakai sebagai
bukti snapshot. Fixture harness yang sempat macet dibersihkan berdasarkan
identitas dummy acak terverifikasi dalam transaksi; seluruh record di luar
fixture pada 22 model identik. Pengujian ulang dijalankan terpisah dan lulus.
Pengujian UI Android tetap DEFERRED; hasil ini bukan bukti device E2E.

14 Oktober 2026, branch feature/project5-integration pada kedua repository.
**F11 PARSIAL untuk acceptance perangkat:** source/API/realtime terintegrasi dan
tes lokal lulus; UI Android fisik/emulator serta klik lintas aplikasi DEFERRED.
Tidak mengklaim E2E seluruh ekosistem atau hasil UI dari TypeScript/bundle saja.

## Baseline dan persetujuan

Project3 baseline63652eb8de9471487369078885346f1925637ba9, upstream0/0;
server/src/lib/prisma.ts masih staged historis, blob index
6594970f6d44cfae4ac899cd83f14f6991dce0a0. Tidak diedit/stage ulang/commit.
Project4 baselineae042ae27d898dd2ec05f46017572bd0492a0d30, branch/upstream
feature/project5-integration,0/0, working tree bersih sebelum task.
src/layar/LayarTambahPelanggan.tsx tidak disentuh. Commit lama tidak diubah.

AGENTS.md Project4 dibaca; dokumentasi [Expo SDK57](https://docs.expo.dev/versions/v57.0.0/)
dibaca sebelum menulis kode. Master PRD v2.0 lengkap belum tersedia; menggunakan
prompt lengkap, keputusan pengguna dan source/audit F2–F10, bukan menebak PRD.

Persetujuan eksplisit pengguna sebelum tindakan:

1. socket.io-client4.8.4 Mobile, kompatibel backend4.8.4, tanpa modul native baru.
2. Migration terbatas untuk barber walk-in nullable + CHECK dan backup.
3. Expo patch57.0.24→57.0.28 dan npm update shell-quote. Hasil shell-quote1.12.0,
   masih major1 dan mencakup perbaikan sejak1.11.0. React Native tetap0.86.3.
4. Hanya EXPO_PUBLIC_API_URL Mobile/.env diperbarui dari192.168.1.7 ke192.168.1.9
   setelah Get-NetIPAddress memastikan Wi-Fi komputer192.168.1.9.

Tidak menambah React Query, software/emulator, environment secret atau membuat
ZIP/checksum/paket replace/README-INSTALASI baru. .env tetap diabaikan Git.

## Network dan session

REST memakai EXPO_PUBLIC_API_URL existing; Socket.IO memakai origin hasil URL
tersebut, tidak ikut path REST. Tidak menyalin IP ke layar. Nilai dev sekarang
http://192.168.1.9:3000, tanpa userinfo/query. server/.env tidak diubah.
Android emulator dapat memakai10.0.2.2 jika konfigurasi diarahkan ke komputer;
localhost perangkat tidak dianggap alamat komputer. Physical device perlu LAN
yang sama, backend listening dan izin firewall yang sesuai. Reachability perangkat
belum diuji; standalone build/cleartext HTTPS policy juga memerlukan device test.
Pergantian IP LAN berikutnya cukup memperbarui satu variabel publik, tidak source.

Zustand/SecureStore dipertahankan. Versi sesi mencegah response pemulihan/login
lama memulihkan akun setelah logout/pergantian akun. Operasi SecureStore diserialkan;
penghapusan conditional hanya untuk token yang sama. 401 dari request token lama
tidak menghapus token session baru. Tidak mencetak JWT/credential.

App memasang satu RealtimeOperator per identitas/token setelah session siap.
Auth memakai auth{token}, bukan query URL. Store subscription memutus socket saat
logout/pergantian akun, kemudian effect cleanup melepas observer, AppState,
listeners/timer dan auth. SDK reconnect otomatis; reconnect/realtime.ready,
foreground dan polling visible/active30detik menyegarkan REST. Event dibatch100ms,
dedup1000 signal, tanpa menulis payload socket menjadi status/nominal authoritative.
useFocusEffect memasang refetch subscriber hanya untuk layar aktif; cleanup saat
blur/unmount. Subscriber diserialkan/coalesce agar tidak ada request event paralel
yang saling menimpa. Layar baru juga menolak hasil request lama dengan urutan request.

| Event | Topik refetch Mobile |
|---|---|
| booking.changed | beranda, booking, pesanan, pembayaran |
| order.changed | beranda, pesanan, booking, pembayaran |
| payment.changed | beranda, pembayaran, pesanan, booking |
| membership.changed | beranda, pelanggan, membership |
| refund.changed | beranda, refund, pembayaran, booking ADMIN |
| customer.changed | beranda, pelanggan, pesanan, booking |
| account-link.changed | pengaitan, pelanggan ADMIN |
| catalog.changed | beranda, katalog |

Tidak menambahkan listener dekoratif, suara atau popup booking baru. Native
socket tanpa Origin tetap wajib JWT sesuai kontrak server. Operator hanya login
melalui /auth/login, bukan endpoint CUSTOMER. Event bukan authority pembayaran.

## Layar dan kontrak

- Navigasi tab menambah Booking, stack daftar/detail sesuai pola existing.
  Beranda menambah ringkasan jumlah booking dan akses pengelolaan.
- Daftar booking/search mencakup seluruh status backend, timeout dan reschedule;
  detail menampilkan customer, snapshot layanan, jadwal WIB/durasi, preference/
  approved/final barber, deadline, riwayat booking serta usulan customer.
- ADMIN/STAFF memakai endpoint existing /bookings untuk confirm, reject alasan
  wajib, early check-in, start, service/qty dan complete. Pending proposal menahan
  start; operator tidak menyediakan accept/reject atas nama CUSTOMER. Barber any
  dipilih saat start; specific mengikuti keputusan customer. Reschedule tetap
  oleh customer, kemudian operator memutuskan round PENDING terbaru.
- Pembayaran booking memakai ringkasan REST ledger, status DP/OVERDUE/paid/balance,
  transaksi dan invoice. DP tidak bisa dibayar manual. Kasir pelunasan hanya
  COMPLETED, DP sah dan balance positif, tanpa pelunasan online pending. Body dan
  idempotency key dipertahankan ketika hasil request ambigu. Ada guard ref sinkron
  untuk double tap, konfirmasi, nominal/metode/catatan dan tombol Rupiah/uang pas.
  Tidak mengubah status PAID dari frontend untuk booking.
- Detail order linked booking mengarahkan ke detail booking; edit/status/payment
  legacy diblokir untuk linked order. Layar Payment langsung yang menerima linked
  order juga mengarahkan ke booking. Walk-in mempertahankan create/dropdown
  searchable pelanggan/barber, qty, status, history, metode dan nominal cepat.
- Buat Order tidak mewajibkan barber; existing pilihan barber tetap opsional.
  Untuk null, detail order menawarkan pencarian/pilihan barber saat mulai layanan.
  Start tanpa barber diblokir; assignment+status satu request/transaksi backend.
- Detail customer menyajikan NON_MEMBER/PENDING_APPROVAL/ACTIVE/INACTIVE dari
  endpoint status operator minimal. Pendaftaran membership existing ADMIN/STAFF
  dipertahankan. Daftar pengajuan/keputusan customer hanya ADMIN pada tab Booking;
  STAFF tidak memuat endpoint keputusan ADMIN.
- ADMIN melihat status/nominal refund pada detail booking, tanpa membuat layar
  approval/retry baru. Keputusan tetap melalui Web Management. STAFF melihat
  informasi ledger operasional yang tersedia, tidak meminta daftar refund ADMIN.
  PROCESSING tidak ditampilkan sebagai SUCCEEDED; tidak ada retry otomatis.

## Backend dan database

Audit read-only menemukan17Pesanan existing, barberId integer NOT NULL. TypeScript
menolak percobaan API nullable sebelum schema tersedia; perubahan API parsial
dikembalikan dahulu, lalu rancangan dan operasi migration disetujui pengguna.

Backup sebelum deploy:
../backup-database/integrasi-mobile-2026-10-14T16-13-35-632Z/database.dump,
125601bytes. pg_restore --list dan rendering seluruh SQL berhasil; snapshot.json
22model domain berada di folder backup di luar kedua repo, tidak masuk Git.
Tidak membuat checksum. Snapshot identik sebelum/sesudah migration dan setelah
regresi/harness cleanup. Migrations/sequence bukan bagian klaim22model identik.

Migration20261014170000_barber_walkin_saat_mulai_layanan dijalankan setelah
backup terverifikasi: DROP NOT NULL pada kolom yang sama, CHECK agar IN_SERVICE/
COMPLETED tetap memiliki barber, FK Restrict dipertahankan. SQL dibungkus transaksi;
tidak DROP tabel, reset, menghapus record atau backfill. Kini18migration up-to-date.
Prisma generate dan validate berhasil. Tidak mengubah file Prisma historis.

POST/orders menerima barberId omitted/null atau payload angka lama.
PATCH/orders/:id/status menerima barberId opsional hanya untuk IN_SERVICE;
barber aktif wajib, assignment/status/history atomik, jadwal advisory lock yang
sama dengan booking mencegah race dua start memakai barber yang sedang melayani.
Pesanan linked booking tetap wajib flow operasional booking. Payload legacy
yang sudah punya barber masih didukung, kecuali barber unavailable/inactive.
GET/pelanggan/:id/membership-status (alias customers juga) mengikuti autentikasi
operator existing; whitelist hanya status dan diskonPersen, tanpa permohonan/hash.

Commit backend35f99717d61fbf330573245ff55a8e3110d771ac:
**Dukung pesanan tanpa barber dan status membership operator**.
Push ke origin/feature/project5-integration berhasil.8file source/migration/backup
script, tidak termasuk staged Prisma. Hasil commit/push Mobile pada laporan akhir.

## Pengujian aktual

| Pengujian | Hasil | Bukti/batas |
|---|---|---|
| TypeScript Mobile strict/noUnused | PASS | Setelah integrasi dan patch |
| Expo install --check | PASS | Dependencies are up to date pada57.0.28 |
| Expo export Android | PASS |989modules, Hermes2.7MB,37assets; bukan APK install/device UI |
| test-integrasi-mobile.mjs | PASS10kelompok | Layanan Axios/Zustand aktual dibundle dengan adapter SecureStore; socket nyata, AppState adapter, HTTP/DB lokal |
| F2 foundation/reset/public | PASS24/11/4kelompok | Auth/rate limit/races/IDOR/secret whitelist |
| F3 membership | PASS12kelompok | ADMIN-only dan operator flow |
| F4 booking | PASS15kelompok | Slot/snapshot/concurrency/kasir legacy |
| F5 operasional | PASS11kelompok | Foundation/gate DP/consent/reschedule |
| F6 ledger/kasir | PASS8kelompok | Balance/invoice/concurrency/rollback |
| F7 provider | PASS12kelompok MOCK via F9 | Tidak mengulang pembayaran Sandbox nyata/refund lama |
| F8 scheduler | PASS26kelompok | Timeout/no-show/overdue/race/restart |
| F9 realtime | PASS23kelompok | JWT/rooms/reconnect/postcommit/rollback/webhook/scheduler |
| F10 Web harness | PASS9kelompok | React rendering dan query/REST; browser E2E tetap deferred |
| Backend TS/noUnused/build dan Web build | PASS | Bundle Web warning601KB/pure annotations existing |
| Prisma validate/generate/status | PASS |18migration, snapshot existing tetap |
| Perangkat/emulator Android | DEFERRED | adb devices -l dan emulator -list-avds kosong |
| Klik UI Web↔Mobile, layout/scroll/keyboard/native SecureStore | DEFERRED | Tidak diklaim dari harness/bytecode |
| F7 refund historis final | DEFERRED | Tidak ada bukti provider final baru |

Harness10kelompok membuktikan: login Mobile/token adapter/REST/socket; origin
API/Socket dan admin topic; invalidJWT/role spoof; booking baru tanpa refresh,
confirm STAFF/reject wajib alasan/gate DP; Mobile mutation→commit→Web controller
refetch REST serta customer/API-equivalent→Mobile; background/foreground dan
SDK reconnect tanpa duplicate listener; walk-in tanpa barber, CHECK DB langsung,
race dua request hanya satu start, kasir/kembalian/invoice/double-payment guard;
status membership pending/STAFF forbidden; logout/late restore/401 cleanup;
aturan UI timeout/consent/OVERDUE. Bukan bukti klik browser atau perangkat.

Menggunakan esbuild existing di workspace Project3 untuk menguji layanan Mobile,
tanpa memasang test library tambahan. Node24 menjalankan modul aturan/core TS;
module-typeless warning khusus harness tidak dijadikan alasan mengubah Metro
module mode. PG concurrent-query warning existing tetap dicatat. Fixture unik
.invalid/UUID dibersihkan;22model existing identik,17pesanan existing tetap.

Percobaan awal export Hermes/esbuild/check-cache/ADB tertahan sandbox, diulang
dengan izin yang sesuai. Satu assertion background harness diperbaiki karena
request REST yang sudah berjalan boleh selesai sesudah background; checkpoint
menunggu quiescence. Semua hasil akhir suites yang dijalankan lulus. Tidak
memodifikasi business rule untuk meloloskan fixture.

## Dependency/security dan batas berikutnya

Audit Mobile awal lengkap48paket (7moderate,18high,23critical), sementara output
install menyebut25 karena perbedaan hitung advisory-chain. Setelah patch audit
lengkap43paket (7moderate,36high,0critical); output install menyebut22. Rantai
shell-quote critical telah hilang, bukan menyatakan semua dependency aman.
[Advisory maintainer shell-quote](https://github.com/ljharb/shell-quote/security/advisories/GHSA-pqg4-j6r4-53mv).
High/moderate tersisa berasal dari braces (pola deeply nested), node-forge
(verifikasi RSA certificate tooling), uuid (buffer bounds); banyak entry inherited
Expo/Metro/React Native tooling. Tidak audit fix --force/major SDK upgrade atau
mengubah unrelated dependency untuk mengurangi angka. Device/runtime exposure
belum dibuktikan bebas risiko; perlu audit dependency terpisah sebelum release.

F7 tetap PARSIAL: refund historis Rp2.000/F7-REFUND-48 belum final, fixture lokal
lama sudah tidak ada; tidak di-recreate, dicek provider baru, di-retry atau debit
ledger. Hasil MOCK tidak membuktikan refund historis. F10 browser E2E tetap
DEFERRED. F12 dapat memakai fondasi API yang tersedia, tetapi acceptance perangkat,
browser Web dan E2E seluruh ekosistem masih harus diselesaikan; tidak menyatakan
F13 selesai atau mengerjakan aplikasi customer penuh pada task ini.

## File yang diubah

Project4: App.tsx, package.json/package-lock.json; layar Beranda/BuatPesanan/
DetailPelanggan/DetailPesanan/Payment/Pelanggan/Pesanan; navigasi Pesanan/TabUtama;
layanan api/pelanggan/pesanan; penyimpananSesi/useSesiStore/tipe pesanan.
Baru: hooks/usePenyegaranRealtime, komponen PembayaranBooking/PenentuanBarberWalkin/
RealtimeOperator/RingkasanBookingBeranda/UiBooking; layanan alamatSocket/
aturanBooking/booking/sinyalRealtime; layar Booking/DetailBooking; NavigasiBooking,
tipe booking, scripts/test-integrasi-mobile.mjs, laporan ini.
Satu variabel publik .env lokal berubah dengan persetujuan, tidak di-commit.

Project3: server/prisma/schema.prisma, migration terbatas, backup-integrasi-mobile,
controllers pelanggan/pesanan, routes pelanggan, schemas pesanan dan services
pesanan. File historis di kedua repo dikecualikan dari staging/commit. Tidak
menghapus dokumentasi/source lama atau membuat package replace.
