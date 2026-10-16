# Audit daftar operasional Mobile Staff

Tanggal verifikasi: 16 Oktober 2026. Branch `feat/staff-booking-order-terpadu`, dibuat dari `origin/main` `90ade8e80ce0c6d17bc6df2ecda90303710708a2` pada clone terpisah di luar Stage 2.

## Perilaku akhir

- Beranda memakai satu daftar booking dan walk-in. Pending hari ini, besok, dan tujuh hari lagi tetap tersedia, diurutkan berdasarkan tenggat konfirmasi. Preview tujuh kartu dilengkapi Lihat Semua tanpa pembatasan array aktif.
- Bagian Kelola booking terpisah tidak lagi dipasang pada Beranda. Konfirmasi tetap melalui detail booking existing. Angka Status Pesanan, Revenue, dan Overview tetap respons `/dashboard`, tanpa menambahkan booking yang belum menjadi pesanan.
- Tab Booking memfilter `mulaiPada` pada interval `[00.00 WIB, 00.00 WIB besok)`, termasuk status terminal sesuai visibilitas daftar existing. Search nama/nomor/status dan Perbarui dipertahankan, termasuk pengajuan membership ADMIN.
- Order mempertahankan pilihan tahun, bulan, tanggal dan drill-down. Tanggal domain memakai jadwal layanan booking dan `checkInTime` walk-in (fallback tanggal pembuatan). Hanya tanggal sebelum awal hari WIB masuk riwayat. Mode Pesanan Hari Ini dari Status Pesanan tetap order-only berdasarkan tanggal pembuatan pesanan operasional.
- `booking.pesananId` dan `order.booking.id` dipakai untuk satu entri per layanan; booking tanpa order tidak dibuatkan order. Booking membuka DetailBooking, walk-in membuka DetailPesanan existing.
- Clock pada layar fokus menghapus pending dari antrean tepat deadline, memperbarui filter/refetch saat tengah malam WIB dan foreground. Socket existing tetap sinyal refetch REST; bukan penyimpan data bisnis. Respons refresh lama ditolak dengan nomor generasi.
- Status dan nominal pembayaran berasal dari REST. Ringkasan ledger dibaca untuk CONFIRMED/COMPLETED, maksimal empat request bersamaan; DP terverifikasi tidak ditampilkan sebagai tagihan DP lagi. Kegagalan ringkasan tidak dianggap PAID: kartu diberi pesan untuk memeriksa detail. Tidak ada perhitungan uang baru.

## Audit API dan kompatibilitas

API existing cukup; Project 3 dan Project 5 tidak diubah.

| Endpoint existing | Pemakaian |
| --- | --- |
| `GET /dashboard` | Metrik operasional dan keuangan existing |
| `GET /bookings` | Seluruh booking operator, tanpa pagination backend |
| `GET /orders` | Seluruh pesanan operator, tanpa pagination backend |
| `GET /bookings/:id` | Melengkapi booking terkait yang belum terbaca pada daftar karena perbedaan waktu respons |
| `GET /bookings/:id/payments` | Status ledger, total, DP, invoice dari backend |

Audit source backend: `operasional-booking.service.ts` mengambil seluruh booking diurutkan `mulaiPada`; `pesanan.service.ts` mengambil seluruh order beserta relasi booking. Pesanan booking baru dibuat saat start; detail existing tetap menangani confirm, check-in, barber final, DP, layanan, pelunasan dan invoice. Tenggat konfirmasi existing berasal dari RESCHEDULE terakhir atau waktu pembuatan +30 menit. Backend tetap memvalidasi waktu dan izin menggunakan database, sedangkan clock perangkat hanya untuk penyajian.

Tidak ada endpoint baru, perubahan JWT/RBAC, scheduler, schema, migration, database, pembayaran atau refund. Suite database lama tidak dijalankan karena membuat fixture pembayaran; suite baru memakai server HTTP dan data di memori tanpa membaca `.env`.

## Hasil pengujian

`node scripts/test-operasional-terpadu.mjs`: **19 kelompok PASS**, dengan skenario berikut.

| Kelompok | Hasil |
| --- | --- |
| Beranda: pending hari ini, besok, +7 hari; urutan tenggat | PASS |
| Batas tepat 30 menit, jadwal terlewati, RESCHEDULE; stale pending tidak confirmable | PASS |
| Future setelah keputusan; walk-in aktif; selesai PAID keluar | PASS |
| Deduplikasi dua arah, ID booking/order sama, data array berulang | PASS |
| Preview 7; seluruh 84 entri aktif dapat diakses lewat Lihat Semua | PASS |
| Dua Lihat Semua mempertahankan tujuan berbeda; metrik dashboard tidak diganti | PASS |
| Booking: hari ini/besok/kemarin, tanggal layanan bukan dibuat, WIB | PASS |
| Search nama, nomor dan status ramah; Perbarui REST | PASS |
| Booking valid di posisi 80 tetap ditemukan; endpoint mengembalikan array lengkap | PASS |
| Riwayat booking/walk-in satu hari; terminal tanpa order; hari ini/future tidak masuk | PASS |
| Tahun, bulan, tanggal valid/tidak valid; drill-down | PASS |
| Rute detail booking dan walk-in; nilai invoice/status ledger dipertahankan | PASS |
| Ringkasan gagal tidak dinyatakan lunas; DP sah tidak ditagih ulang | PASS |
| Refresh respons terlambat; kegagalan REST tidak menghapus data terakhir | PASS |
| Pergantian hari saat terbuka, foreground, perpindahan riwayat; cleanup listener/timer | PASS |
| MOCK customer membuat booking, Staff confirm, customer membaca perubahan, check-in dengan DP fixture, start linked order, COMPLETED/PAID | PASS (fixture HTTP) |
| Controller socket, reconnect/foreground -> REST; transport Socket.IO aktual di localhost | PASS (backend fixture) |
| Lima tab existing dan kontrak navigasi TypeScript | PASS |
| TypeScript `npx.cmd tsc --noEmit --incremental false` | PASS |
| Expo `npx.cmd expo install --check` setelah patch 57.0.30 | PASS |
| Android Hermes export setelah patch: 992 modules, 37 assets, `.hbc` sekitar 2.7 MB | PASS |
| Uji sentuh/visual Android, perangkat dan backend pusat end-to-end | DEFERRED: ADB tidak menemukan perangkat; tidak mengakses database existing |

Pengujian host/hook merender komponen source aktual melalui adapter native dan hook; bukan simulator UI Android. Integrasi memakai SDK REST/Axios dan penyimpanan sesi adapter. Transport Socket.IO nyata hanya terhubung server fixture localhost. Fixture DP/lunas berupa objek respons yang telah disiapkan, tidak menjalankan endpoint pembayaran/refund atau provider. Semua fixture HTTP hanya hidup di memori; bundle pengujian sementara dibersihkan setelah suite.

Perintah reproduksi dari folder Mobile Staff, dengan Project 3 sebagai sibling dan dependency existing terpasang:

```powershell
node scripts/test-operasional-terpadu.mjs
npx.cmd tsc --noEmit --incremental false
npx.cmd expo install --check
$env:EXPO_PUBLIC_API_URL='http://127.0.0.1:3000'
npx.cmd expo export --platform android --output-dir '..\android-export'
```

Untuk clone yang tidak memiliki sibling Project 3, set `BB_ESBUILD_PATH` ke file `esbuild/lib/main.js` existing milik client Project 3 dan `BB_BACKEND_PACKAGE` ke `server/package.json` Project 3 sebelum suite. Keduanya hanya lokasi dependency, tidak memuat environment/database backend. Tidak diperlukan instalasi dependency pengujian baru.

## Dependency dan batasan

User menyetujui patch Expo `57.0.29 -> ~57.0.30`. Dependency clone dipisahkan dari junction menjadi salinan privat sebelum instalasi; dependency asli tetap 57.0.29. Lockfile hanya berubah mengikuti perintah patch Expo yang disetujui (termasuk dependency Expo turunannya).

`npm audit` pada original dan clone sama-sama menemukan **22 advisory: 7 moderate, 15 high, 0 critical**, dengan kumpulan paket terdampak yang sama. Temuan existing ini belum diperbaiki; tidak menjalankan audit fix/force atau upgrade di luar persetujuan. Export bukan jaminan bebas advisory maupun bukti perangkat nyata.

API saat ini tidak dipaginasi. Membaca seluruh riwayat dan ringkasan completed dapat bertambah mahal saat volume naik; konkurensi ringkasan dibatasi empat, tanpa membuang data. Jika backend nanti menambah pagination, adapter wajib diubah untuk mengambil seluruh halaman sebelum filter. Clock perangkat yang tidak akurat dapat mempengaruhi penyajian deadline; backend tetap menolak tindakan yang tidak sah.

## Perlindungan dan status

Pekerjaan dilakukan pada clone privat, tidak mengganti branch working tree asli. File historis `server/src/lib/prisma.ts`, `src/layar/LayarTambahPelanggan.tsx`, dan `src/layanan/booking.ts` tidak masuk perubahan fitur. Semua source detail, autentikasi, kasir dan Project 5 di luar lingkup tetap dipertahankan.

Status penerimaan: **PARTIAL** untuk validasi menyeluruh karena pengujian perangkat nyata masih DEFERRED; implementasi source, pengujian otomatis terisolasi, dependency check dan export selesai. Draft PR disiapkan untuk review, tanpa merge ke main.

Verifikasi akhir working tree original: seluruh tracked source, HEAD, status dan hash index Project 3 serta Mobile Staff identik dengan baseline awal audit. Project 5 menunjukkan tambahan perubahan lokal pada enam file di luar baseline awal (`App.tsx`, `app.json`, dan empat script test); tidak ada operasi tulis tugas ini ke Project 5, sehingga perubahan tersebut dibiarkan utuh. HEAD dan index Project 5 tetap sama. Tidak ada perubahan lokal pengguna yang disalin ke commit fitur.
