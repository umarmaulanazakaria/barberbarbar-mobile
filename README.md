# BARBER BARBAR — React Native Staff

Aplikasi operasional ADMIN/STAFF berbasis Expo SDK 57, React Native 0.86 dan React 19. Backend dan database tetap berada di repository Admin/Backend.

## Arsitektur

Tiga aplikasi memakai satu API Express/Prisma dan PostgreSQL yang sama. Admin memakai desain **Admin Minimal**, Customer memakai **mobile-first**, Staff memakai **Minimal V3**. Harga, slot, kelayakan Member, keputusan operasional dan pembayaran ditetapkan backend. Socket.IO hanya memberi sinyal refetch REST.

- [Admin Web dan Backend](https://github.com/umarmaulanazakaria/barberbarbar/tree/feature/project5-integration)
- [React Native Staff](https://github.com/umarmaulanazakaria/barberbarbar-mobile/tree/feature/project5-integration)
- [Customer Web](https://github.com/umarmaulanazakaria/barberbarbar-customer/tree/feat/project5-react-web-mobile-first)

## Fitur dan desain Minimal V3

- Beranda ringkas dengan KPI backend, antrean Booking/Walk-in, perhatian dan kartu slim.
- Pesanan: Semua/Aktif/Selesai, pencarian, filter bawah, pagination dan detail.
- Walk-in Reguler/Member, pencarian profil existing, barber opsional, quote resmi, footer total dan konfirmasi idempotent. Pembuatan profil baru dilakukan ADMIN.
- Riwayat berkelompok tanggal penutupan WIB, filter periode/jenis/status/pembayaran, pemilih tanggal native dan Muat lainnya.
- Verifikasi Kartu Member + KTP tanpa mengetik ulang identitas; backend memeriksa kelayakan dan menyimpan audit.
- Detail/tindakan, check-in, penugasan barber, layanan, Tunai/Transfer/QRIS, invoice/struk.
- Login JWT operator dengan SecureStore, refetch realtime, foreground dan reconnect. Lima menu bottom navigation tetap dipertahankan.

## Struktur

```text
src/staff/          Layar operasional Minimal V3
src/layar/          Layar existing dan workflow detail
src/layanan/        HTTP dan realtime
src/penyimpanan/    SecureStore
src/store/         Sesi aplikasi
src/komponen/      Komponen bersama
scripts/           Integrasi teknis
docs/              Audit dan panduan
```

## Instalasi dan konfigurasi

Gunakan Node/npm dan lockfile repository. Pada clone baru:

```powershell
npm.cmd ci
# Buat .env lokal lalu jalankan:
npm.cmd start
```

```dotenv
EXPO_PUBLIC_API_URL=http://IP_LAN_BACKEND:3000
```

Ganti placeholder dengan IP komputer saat ini. HP dan komputer harus dapat terhubung; localhost pada HP menunjuk HP sendiri. Variabel ini publik, jangan isi credential. Backend harus aktif, origin/jaringan sesuai dan operator sudah dibuat melalui alur resmi. Tidak menyediakan password contoh. Gunakan development build/Expo Go yang mendukung SDK dan modul native yang terpasang; dukungan perangkat harus diverifikasi.

## Workflow

Booking Customer masuk melalui backend yang sama. Reguler memerlukan DP sah, Member memerlukan kelayakan dan pemeriksaan fisik. Staff melanjutkan check-in, barber final, layanan dan selesai; pembayaran/invoice selalu berasal dari backend. Walk-in memakai quote terbaru dan UUID yang sama saat recovery. Realtime meminta REST ulang, bukan mengubah status pembayaran secara lokal.

## Pemeriksaan

```powershell
node node_modules/typescript/bin/tsc --noEmit
npx.cmd expo export --platform android --output-dir dist
```

Audit terbaru: TypeScript dan export Android/Hermes snapshot commit lulus. Ini bukan build APK terpasang atau pengujian perangkat. Script integrasi lama jangan dijalankan pada database operasional; gunakan runner fixture terisolasi.

## Batas verifikasi

Audit 18 Oktober 2026 memisahkan snapshot commit dari WIP lokal. TypeScript / build bukan bukti seluruh alur UI atau pembayaran provider. Lihat [laporan audit pusat](https://github.com/umarmaulanazakaria/barberbarbar/blob/feature/project5-integration/docs/audit/AUDIT-SISTEM-TERKINI.md). Pengujian integrasi memakai PostgreSQL fixture dan provider mock; bukan settlement Sandbox baru. Perangkat Android/iOS dan printer fisik belum diuji dalam audit ini. Advisory dependency masih terbuka. **Belum siap dinyatakan rilis penuh; bukan Production.**

[Catatan operasional dan desain](docs/OPERASIONAL-TERKINI.md). Dokumentasi lama di docs dipertahankan sebagai arsip, bukan bukti verifikasi UI terbaru.
