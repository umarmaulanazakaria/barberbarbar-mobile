# Kesetaraan operasional Admin Web dan Staff

Tanggal pemeriksaan: 18 Oktober 2026. Source acuan: Admin Web existing, bukan workflow baru.

| Modul | Sebelum | Implementasi sekarang | Sumber kebenaran |
|---|---|---|---|
| Beranda | Tiga metrik dan enam antrean dari daftar terpadu | Empat KPI Dashboard, aktivitas Booking/Walk-in berhalaman, pencarian, seluruh kategori perhatian dan halaman kategori | `GET /management/dashboard` sama dengan Admin; cakupan tanggal dan definisi KPI tidak diubah |
| Pesanan | Filter ringkas, tanpa pencarian atau rentang | Seluruh status Backend, jenis, pembayaran, tanggal, pencarian, urutan dan pagination | `GET /management/orders` |
| Detail dan tindakan | Lifecycle utama saja | Ditambah pemeriksaan DP, penolakan pending, usulan Barber, tidak hadir, perubahan layanan Booking IN_SERVICE, riwayat dan catatan | Endpoint Booking existing; Backend menentukan prasyarat dan transisi |
| Walk-in | Barber wajib sebelum pembuatan | Barber opsional sampai mulai layanan; anonim/profil existing dan satu item per jenis sama dengan form Admin | `POST /orders/walk-in`; Member memakai endpoint verifikasi terikat permintaan existing |
| Pelanggan | Pencarian untuk Walk-in saja | Pencarian, detail dan riwayat operasional baca saja dari Beranda | `GET /management/customers` dan detail; tidak ada pembuatan/ubah/arsip profil |
| Membership | Pemeriksaan Kartu Member + KTP sudah tersedia | Dipertahankan; tidak menambah input identitas atau membuka penjualan/perpanjangan | Kontrak fisik Staff existing dengan audit dan pemeriksaan kelayakan Backend |
| Pembayaran | Metode sama, riwayat operasional belum ditampilkan | Riwayat transaksi/operator, status pemeriksaan provider, pemeriksaan QRIS berkala, jumlah transfer mengikuti seluruh balance seperti Admin | `/management/payments`; tidak menambah kredit di frontend, kunci retry dipertahankan |
| Riwayat dan dokumen | Hanya COMPLETED dari daftar aktif, preview struk | Arsip penutupan dengan filter selesai/batal/kedaluwarsa dan detail arsip; invoice sementara/final serta subtotal/diskon/pembayaran dari dokumen resmi | `/management/history`, `/management/finance/documents/:id` |
| Real-time | Socket bersama dan subscriber layar existing | Layar baru memakai bus Socket yang sama; refresh setelah mutasi, polling saat fokus dan refresh manual sebagai fallback | `RealtimeOperator`, `usePenyegaranRealtime`, `sinyalRealtime` |

Backend hanya menambah metadata kartu (Barber, layanan, Member) pada DTO Dashboard/Riwayat. Filter, pengurutan, kategori, uang, status dan schema tidak diganti. Metadata dibaca berkelompok dalam transaksi proyeksi yang sama. Admin tidak perlu mengubah kontraknya.

Koreksi Member/harga normal, pengaitan profil, penerbitan ulang kode tracking, pembuatan pelanggan dan pengaturan tetap pada jalur Admin. Mobile tidak memasok flag pergantian Barber khusus Admin. Usulan pengganti Staff tetap membutuhkan keputusan customer sesuai Backend.

## Pemeriksaan aktual

- TypeScript Mobile, Backend dan Admin: lulus.
- Query Dashboard Booking/Walk-in dan arsip diuji terhadap DB lokal dengan `SET TRANSACTION READ ONLY`. Metadata kartu dan hari WIB sesuai kontrak. Saat pemeriksaan terdapat 1 baris aktivitas Booking, 2 Walk-in dan 4 arsip selesai. Tidak ada arsip batal/kedaluwarsa pada data yang tersedia; filter keduanya mengembalikan nol. Kategori perhatian kosong, sehingga pagination kategori belum terbukti dengan data nyata.
- HTTP tanpa JWT ke Dashboard, Riwayat, Pelanggan dan Pembayaran: 401.
- Alamat API publik Mobile tetap `http://192.168.1.9:3000`; akses `/public/services` melalui alamat LAN dari komputer: 200. Ini bukan bukti koneksi HP.
- Uji terarah bus real-time dengan Socket mock: perubahan order memicu subscriber Staff, event duplikat diabaikan, listener/subscriber dibersihkan. Tidak membuktikan pengiriman event lintas perangkat.
- Tidak menjalankan full suite, browser automation, screenshot, seed, migration, pembayaran provider atau mutasi data historis.
- WIP awal dan staged Prisma dilindungi; commit lokal saja.
- Pembacaan Prisma memunculkan peringatan deprecation `pg` mengenai query pada client yang sedang menjalankan query; seluruh assertion tetap lulus. Asal peringatan belum ditelusuri dalam lingkup ini.

## File terkait

Backend (3):

- `server/src/services/dashboard-final.service.ts`
- `server/src/services/riwayat-pesanan.service.ts`
- `server/src/services/metadata-operasional.service.ts` (baru)

Mobile (14, termasuk laporan ini):

- `src/staff/LayarDaftarStaff.tsx`
- `src/staff/BerandaOperasionalStaff.tsx` (baru)
- `src/staff/PesananOperasionalStaff.tsx` (baru)
- `src/staff/RiwayatOperasionalStaff.tsx` (baru)
- `src/staff/PelangganOperasionalStaff.tsx` (baru)
- `src/staff/operasionalStaff.ts` (baru)
- `src/staff/TindakanBookingTambahanStaff.tsx` (baru)
- `src/staff/LayarDetailStaff.tsx`
- `src/staff/LayarWalkinStaff.tsx`
- `src/staff/LayarBayarStaff.tsx`
- `src/staff/LayarStrukStaff.tsx`
- `src/staff/NavigasiStaff.tsx`
- `src/staff/layananStaff.ts`
- `docs/audit/KESETARAAN-OPERASIONAL.md`

## Batas verifikasi dan uji manual HP

Implementasi source tersedia. Kesetaraan visual/perilaku perangkat, mutation lifecycle, pembayaran dan sinkronisasi dua aplikasi belum dinyatakan PASS runtime pada pekerjaan ini.

1. Login Staff di HP pada LAN yang sama. Bandingkan empat KPI dan aktivitas dengan Admin, jenis/pencarian/halaman yang sama. Cakupan mengikuti Dashboard existing, termasuk perhatian semua tanggal.
2. Buka Pesanan; samakan jenis, status, pembayaran, rentang WIB dan urutan. Bandingkan nomor dan jumlah dengan endpoint/Admin pada filter yang sama.
3. Pada Booking sah yang memang akan dilayani, verifikasi kartu/KTP, check-in, tentukan Barber, mulai dan selesaikan layanan. Periksa perubahan di Admin tanpa refresh manual. Balik arah: perubahan Admin harus masuk ke Mobile. Jangan membuat transaksi uji yang tertinggal.
4. Periksa usulan Barber yang menunggu keputusan customer; Staff tidak boleh mengganti Barber reservasi secara paksa. Aksi yang ditolak Backend harus menampilkan pesan, tanpa menganggap berhasil.
5. Buat Walk-in nyata sesuai kebutuhan operasional, dengan Barber ditentukan nanti. Periksa anonimitas/profil existing, harga dan manfaat yang sama. Tindakan manajemen pelanggan tidak tersedia di Mobile.
6. Untuk pembayaran yang memang diperlukan, periksa balance, lakukan satu permintaan, dan pastikan replay tidak mencatat dua pembayaran. QRIS harus menunggu verifikasi provider. DP Booking tidak ditambahkan lagi ke nominal pelunasan.
7. Bandingkan arsip dan invoice/struk. Uji loading, offline, fokus kembali, refresh manual dan pergantian tanggal WIB. Kartu pesanan tetap memakai `KartuSlimStaff` existing sekitar 70 px dan lima bottom tab tidak diubah.

Printer fisik belum terintegrasi. Preview thermal 58/80 mm bukan bukti cetak perangkat; PDF/cetak tetap melalui mekanisme Web Admin existing.
