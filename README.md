# BARBER BARBAR — Mobile Staff

Aplikasi Android untuk ADMIN dan STAFF barbershop, menggunakan backend pusat BARBER BARBAR. Aplikasi mengelola operasional harian tanpa backend atau database terpisah.

Project untuk **tugas kuliah, pembelajaran Fullstack, portofolio, dan demonstrasi lokal**; bukan aplikasi Production. Hosting berbayar bukan kebutuhan demo. Mobile berhasil menurut laporan pengguna (**USER-REPORTED**); bukti rinci UI native/checkout Android belum lengkap. Email nyata, refund historis dan advisory tetap dicatat jujur. Lihat [acceptance demo](https://github.com/umarmaulanazakaria/barberbarbar/blob/feature/project5-integration/docs/DEMO-ACCEPTANCE.md).

## Teknologi dan fitur

React Native 0.86, Expo SDK 57, React 19, TypeScript, React Navigation, Axios, SecureStore, Zustand, dan Socket.IO.

- Login operator dan penyimpanan sesi melalui SecureStore.
- Pelanggan, booking, walk-in, penentuan barber, check-in, dan proses layanan.
- Pembayaran kasir, status pelunasan, membership, dan pengajuan sesuai peran.
- Realtime serta refetch ketika aplikasi kembali aktif.
- Keputusan khusus ADMIN tetap diperiksa backend; hak STAFF terbatas.

```text
App.tsx / index.ts       Entry aplikasi
src/layar/              Layar operasional
src/komponen/           Komponen bersama
src/layanan/            HTTP dan integrasi backend
src/                    Navigasi, sesi, tipe, dan utilitas
assets/                 Identitas visual dan ikon Expo
scripts/                Pengujian integrasi
docs/                   Panduan historis dan bukti audit
```

## Instalasi dan konfigurasi lokal

Gunakan Node.js/npm sesuai lockfile (baseline Node 24) dan backend Project 3 yang aktif. Dari folder repository:

```powershell
npm.cmd ci
```

Buat `.env` lokal dengan variabel publik berikut. Ganti placeholder dengan IP LAN komputer backend saat ini:

```dotenv
EXPO_PUBLIC_API_URL=http://<IP-LAN-KOMPUTER>:3000
```

File `.env` diabaikan Git. Variabel `EXPO_PUBLIC_*` masuk bundle; jangan mengisinya dengan JWT, password, atau key Midtrans. Socket memakai origin backend yang sama. Pada HP, `localhost` menunjuk HP sendiri.

```powershell
npm.cmd start -- --lan --port 8081
```

Hubungkan HP dan komputer ke LAN yang sama, izinkan akses backend sesuai kebijakan firewall, lalu pindai QR dengan Expo Go yang mendukung SDK 57. Jika Expo Go tidak kompatibel, gunakan development build sesuai SDK setelah menyiapkan toolchain Android. Instalasi toolchain tidak dilakukan otomatis. Restart Metro setelah perubahan environment.

## Pengujian

```powershell
node node_modules/typescript/bin/tsc --noEmit
npx.cmd expo install --check
npx.cmd expo export --platform android --output-dir dist
node scripts/test-integrasi-mobile.mjs
```

Regresi backend dan browser lintas proyek tersedia di runner Project 3 dengan database lokal dan fixture terisolasi. Ekspor Hermes membuktikan bundling Android; login, UI, jaringan, dan kasir pada HP tetap memerlukan acceptance nyata. Output `dist`, `.expo`, cache, dan environment lokal tidak dilacak Git.

## Integrasi dan batas rilis

- [Web Management + Backend](https://github.com/umarmaulanazakaria/barberbarbar): autentikasi, booking, pembayaran, invoice, scheduler, dan event.
- [Mobile Staff](https://github.com/umarmaulanazakaria/barberbarbar-mobile): operasional ADMIN/STAFF.
- [Customer Web](https://github.com/umarmaulanazakaria/barberbarbar-customer): React/Vite, booking tanpa akun dan tracking melalui sesi guest.

Checkout Sandbox langsung dari Customer App, refund historis Rp2.000, pengiriman recovery email, advisory dependency, dan sebagian keputusan bisnis belum tuntas. Ekosistem belum siap Production. Bukti dan penundaan dipertahankan dalam [audit](docs/audit/F14-AUDIT.md).

## Demonstrasi dan portofolio

[Menjalankan ekosistem](https://github.com/umarmaulanazakaria/barberbarbar/blob/feature/project5-integration/docs/PANDUAN-JALANKAN-DEMO.md) | [Presentasi](https://github.com/umarmaulanazakaria/barberbarbar/blob/feature/project5-integration/docs/PANDUAN-PRESENTASI.md) | [Naskah](https://github.com/umarmaulanazakaria/barberbarbar/blob/feature/project5-integration/docs/NASKAH-DEMO.md) | [Review Git/PR](https://github.com/umarmaulanazakaria/barberbarbar/blob/feature/project5-integration/docs/PORTFOLIO-RELEASE-REVIEW.md).

### Screenshot perangkat

Belum ada screenshot native terverifikasi dalam repository. [Panduan capture](docs/screenshots/README.md) menentukan layar yang diperlukan. Tidak memakai screenshot Web atau gambar fiktif sebagai pengganti Android.
