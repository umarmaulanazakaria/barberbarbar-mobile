# Hubungkan operasi staf dengan booking customer dan sinkronisasi realtime

Draft PR feature/project5-integration ke main; belum dibuat/merge. Dibanding origin/main 5e0db67, baseline awal memiliki tujuh commit feature tanpa commit main-only. merge-tree exit0 tanpa konflik saat audit; periksa ulang jika main berubah.

Booking customer masuk melalui API pusat dan sinyal Socket.IO. Staff dapat confirm/reject, check-in setelah DP sah, menetapkan barber final, memulai/mengubah/menyelesaikan layanan dan pelunasan sesuai wewenang. Sesi JWT operator dan refetch saat reconnect/AppState menjaga isolasi akun; keputusan ADMIN tetap diverifikasi backend. Alur walk-in tetap memakai kontrak pusat.

File signifikan: src/layar/LayarBooking.tsx, LayarDetailBooking.tsx, LayarBeranda.tsx, LayarDetailPesanan.tsx, LayarPayment.tsx; src/layanan/sinyalRealtime.ts, aturanBooking.ts, api.ts; src/komponen/RealtimeOperator.tsx, PembayaranBooking.tsx, PenentuanBarberWalkin.tsx; navigasi/tipe dan scripts/test-integrasi-mobile.mjs. Daftar lengkap: git diff --name-status origin/main...HEAD.

Tugas demo terbaru hanya menyunting README, dokumen PR dan panduan screenshot; tidak mengubah kode Staff atau dependency. LayarTambahPelanggan.tsx dan perubahan format lokal src/layanan/booking.ts dilindungi; perubahan lokal itu tidak ikut commit.

Validasi terbaru: TypeScript, Expo dependency check, Android Hermes export, integrasi Staff/session PASS sebagai bagian 29/29 regresi lintas repo. Booking/lifecycle/kasir/realtime diuji backend, Web asli dan SDK Staff/Customer; bukan tap Android. [Acceptance terpusat](https://github.com/umarmaulanazakaria/barberbarbar/blob/feature/project5-integration/docs/DEMO-ACCEPTANCE.md).

DEMO READY WITH LIMITATIONS, bukan Production. Mobile berhasil USER-REPORTED; detail skenario/perangkat dan screenshot native belum terdokumentasi. Advisory Expo/tooling terbuka, tidak upgrade tanpa izin. Backend/schema existing harus kompatibel sebelum aplikasi dipakai. Tidak memuat environment/password, mengubah default branch atau merge otomatis.
