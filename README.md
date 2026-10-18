<div align="center">

# BARBER BARBAR

**Not Cutting Heads, Just Hair.**

### React Native Staff · Minimal V3

Operasional barbershop yang ringkas: kedatangan, pelayanan, pembayaran dan riwayat.

[Admin & Backend](https://github.com/umarmaulanazakaria/barberbarbar/tree/main) · [Staff Mobile](https://github.com/umarmaulanazakaria/barberbarbar-mobile/tree/main) · [Customer Web](https://github.com/umarmaulanazakaria/barberbarbar-customer/tree/main)

</div>

## Bukti visual Android

**Screenshot Android terbaru belum tersedia.** Pemeriksaan 18 Oktober 2026 tidak menemukan perangkat ADB tersambung atau emulator/AVD. Tidak ada gambar Web, desain konsep atau mockup yang dipakai untuk menggantikan bukti native.

| Layar Minimal V3 yang perlu diambil | Yang ditampilkan |
| --- | --- |
| Beranda | KPI, antrean dan kartu operasional ringkas. |
| Pesanan | Daftar dan filter pesanan aktual. |
| Walk-in | Alur Reguler/Member dan ringkasan quote. |
| Riwayat | Pengelompokan tanggal WIB dan filter. |
| Profil | Profil operator tanpa credential atau data pribadi tambahan. |

[Petunjuk capture perangkat dan daftar gambar yang masih diperlukan](docs/screenshots/README.md).

## Jelajahi sistem yang terhubung

Screenshot berikut berasal dari aplikasi Web pendamping, **bukan layar Staff Android**:

| Admin Web | Customer Web mobile-first |
| --- | --- |
| <a href="https://github.com/umarmaulanazakaria/barberbarbar/tree/main"><img src="https://raw.githubusercontent.com/umarmaulanazakaria/barberbarbar/main/docs/showcase/dashboard.jpg" alt="Aplikasi Admin Web pendamping, bukan Android Staff" width="480" /></a> | <a href="https://github.com/umarmaulanazakaria/barberbarbar-customer/tree/main"><img src="https://raw.githubusercontent.com/umarmaulanazakaria/barberbarbar-customer/main/docs/showcase/hero.jpg" alt="Aplikasi Customer Web pendamping, bukan Android Staff" width="480" /></a> |

*Data kedua gambar sintetis; bukan bukti pembayaran nyata. Galeri Staff akan diisi hanya setelah capture perangkat asli tersedia.*

## Tiga aplikasi, satu backend

| Aplikasi | Peran |
| --- | --- |
| [Admin Web & Backend](https://github.com/umarmaulanazakaria/barberbarbar/tree/main) | Dashboard operasional, pelanggan, Membership, pesanan, kasir dan laporan. |
| [React Native Staff](https://github.com/umarmaulanazakaria/barberbarbar-mobile/tree/main) | Pelayanan di toko dengan desain Minimal V3: Beranda, Pesanan, Walk-in, Riwayat dan Profil. |
| [Customer Web mobile-first](https://github.com/umarmaulanazakaria/barberbarbar-customer/tree/main) | Katalog, booking tanpa akun, pembayaran dan tracking dari browser HP maupun desktop. |

Ketiganya memakai **Express REST API + Prisma + PostgreSQL** yang sama. Socket.IO memberi sinyal untuk mengambil ulang data REST; harga, kelayakan Member dan status pembayaran tetap ditetapkan backend.

## Dari booking sampai layanan selesai

| Alur | Ringkasan |
| --- | --- |
| Booking Reguler | Pilih layanan, barber dan jadwal; isi identitas tanpa membuat akun. Satu booking memakai slot **45 menit**. |
| DP & konfirmasi | **DP 50%**, batas **15 menit** dari backend. Snap Sandbox bukan penentu status; backend memverifikasi provider sebelum booking dikonfirmasi. |
| Membership | Paket aktif 12 bulan: Haircut + Wash gratis dan layanan lain diskon 10% sesuai kelayakan backend. Booking Member layak tanpa DP; Kartu Member + KTP diperiksa fisik di toko tanpa menyimpan NIK/foto. |
| Walk-in | Operator membuat pesanan Reguler/Member dari toko, memakai quote dan validasi backend yang sama. |
| Pelayanan & pembayaran | Check-in, barber final, pelayanan, selesai, pelunasan sesuai saldo backend, lalu invoice final. Tunai, Transfer dan QRIS mengikuti workflow operator; Snap untuk pembayaran online customer. |

## Teknologi

**Expo SDK 57 · React Native 0.86 · React 19 · TypeScript · Axios · Socket.IO · SecureStore · React Navigation · Native DateTimePicker**

## Menjalankan aplikasi

```powershell
npm.cmd ci
# Siapkan .env lokal dengan EXPO_PUBLIC_API_URL=http://IP_LAN_BACKEND:3000
npm.cmd start
```

Backend harus berjalan dan akun operator dibuat melalui alur resmi. Gunakan perangkat/development build atau Expo Go yang kompatibel dengan SDK dan modul native. Jangan mengisi credential pada variabel publik.

## Bukti pengujian dan batas

TypeScript, pemeriksaan kompatibilitas UUID/Xcode dan ekspor **Android/Hermes** lulus saat finalisasi `main`. Ekspor bundle bukan bukti APK terpasang, interaksi perangkat, printer atau pembayaran provider nyata. Pengujian dan gambar native **belum diverifikasi pada tahap showcase ini**; advisory dependency tersisa dijelaskan di [laporan remediasi](docs/REMEDIASI-KEAMANAN.md).

**Untuk pembelajaran, portofolio dan demo tugas magang dengan batas yang jelas.**

<details>
<summary><strong>Instalasi, konfigurasi, struktur source dan laporan teknis</strong></summary>

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

Audit 18 Oktober 2026 memisahkan snapshot commit dari WIP lokal. TypeScript / build bukan bukti seluruh alur UI atau pembayaran provider. Lihat [laporan audit pusat](https://github.com/umarmaulanazakaria/barberbarbar/blob/main/docs/audit/AUDIT-SISTEM-TERKINI.md). Pengujian integrasi memakai PostgreSQL fixture dan provider mock; bukan settlement Sandbox baru. Perangkat Android/iOS dan printer fisik belum diuji dalam audit ini. Advisory dependency masih terbuka. **Belum siap dinyatakan rilis penuh; bukan Production.**

[Catatan operasional dan desain](docs/OPERASIONAL-TERKINI.md). Dokumentasi lama di docs dipertahankan sebagai arsip, bukan bukti verifikasi UI terbaru.

## Pembaruan keamanan dependency

Expo kini 57.0.30 dalam SDK 57, dengan override UUID terbatas pada perkakas Xcode yang sudah diuji. Audit **44 → 37**; tujuh Moderate tertutup, dua akar High tanpa patch resmi masih tersisa. [Bukti dan batas remediasi](docs/REMEDIASI-KEAMANAN.md).

## Versi demo pada main

Branch `main` memuat snapshot fitur terbaru yang digabungkan dengan tetap mempertahankan riwayat. Verifikasi rilis memakai build/TypeScript dan fixture/mock lokal; tidak membuat transaksi nyata atau mengubah data operasional. Jalankan demo dengan konfigurasi lokal dan Midtrans Sandbox existing. Pengujian perangkat HP, printer fisik dan pembayaran provider langsung tidak diklaim lulus dari pengujian ini. WIP lokal tetap terpisah dari versi GitHub.

</details>
