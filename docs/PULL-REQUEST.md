> Dokumen historis dipindahkan dari `barberbarbar-mobile/PULL-REQUEST.md`. Hasil dan path bukti mencatat waktu audit; panduan aktif ada di README utama dan laporan cleanup. Arsip privat kini berada di luar Stage 2.

# Hubungkan operasi staf dengan booking customer dan sinkronisasi realtime

Booking customer masuk ke daftar Staff melalui API pusat dan sinyal Socket;
Staff dapat confirm/reject/check-in, memilih barber saat mulai layanan,
mengubah item dan menyelesaikan layanan sesuai DP/consent yang sah. Pelunasan,
membership dan alur walk-in tetap mengikuti wewenang operator existing.

Validasi terbaru: lihat [audit utama](../../barberbarbar/docs/audit/F14-AUDIT.md).
TypeScript, Expo dependency check, Hermes Android dan layanan/API/SDK diuji;
native SecureStore, keyboard, navigasi dan device E2E belum diverifikasi.
Patch Expo57.0.29 tetap; advisory tooling memerlukan penilaian lanjutan.
Finalisasi repo Staff hanya menambah dokumentasi, tidak mengubah desain/API.

Dependency deployment: backend beserta migration/kontrak harus siap di staging
terlebih dahulu, lalu origin API LAN/HTTPS Mobile diverifikasi. Jangan
memasukkan env atau file historis lokal. Simulasi merge awal tanpa konflik;
periksa ulang sebelum review. Draft ini bukan persetujuan merge/Production.
