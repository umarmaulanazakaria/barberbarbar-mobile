# Operasional Staff dan desain terkini

> Pembaruan berikutnya: audit Staff **44 → 37**, patch Expo 57.0.30 dan override UUID terbatas telah diuji. Lihat [remediasi keamanan](REMEDIASI-KEAMANAN.md). Angka dan baseline di bawah dipertahankan sebagai hasil sebelum remediasi.

Snapshot audit 18 Oktober 2026, baseline b4859fc. Desain Minimal V3 tetap dipertahankan; tidak ada redesign atau perubahan source Mobile dalam audit ini.

Beranda, Pesanan, Walk-in dan Riwayat berada di src/staff. Kartu slim, lima tab, panel navy/putih/ungu, filter bottom sheet dan footer Walk-in tetap mengikuti source. Detail existing, pembayaran dan struk tetap digunakan.

Beranda/Pesanan membaca /management/dashboard dan /management/orders. Riwayat membaca /management/history, memfilter di backend, mengelompokkan waktu penutupan WIB dan mempertahankan pagination. Walk-in memanggil quote backend sebelum konfirmasi; nilai yang ditampilkan tidak mengotorisasi harga sendiri. Booking Reguler memiliki prasyarat DP; Member tanpa DP tetap wajib identitas fisik dan status terkini.

Bukti Walk-in Member terikat operator login, profil, Member dan kunci request, berlaku15 menit, serta dicatat backend. Tindakan mismatch tidak memberikan manfaat baru atau mengubah harga/status diam-diam. Tidak menyimpan NIK/foto KTP. STAFF tidak mendapat hak membuat profil atau keputusan khusus ADMIN dari flag aplikasi.

Token operator berada pada SecureStore. Sinyal realtime/refocus/reconnect memicu pembacaan REST. Bukti settlement/QRIS harus berasal dari backend/provider, bukan event. Layar invoice dan preview struk tidak membuktikan printer fisik bekerja.

## Hasil aktual

- PASS: TypeScript pada working tree dan snapshot commit; export Android/Hermes pada snapshot.
- PASS teknis backend: kontrak operator, Member fisik/Walk-in, role dan realtime pada fixture.
- BELUM TERVERIFIKASI: klik UI native, date picker perangkat, keyboard/safe area, restore SecureStore perangkat, checkout provider dari HP, Bluetooth/USB printer, performa daftar panjang.
- FAIL gerbang dependency bersih: npm audit44 advisory (7 moderate,37 high;0 critical). Banyak merupakan propagasi rantai Expo/RN. Jumlah bukan bukti44 eksploitasi mandiri; jangkauan runtime belum disimpulkan. Tidak menjalankan audit fix/upgrade otomatis.

WIP empat file layanan/layar lama tetap lokal dan bukan bagian snapshot yang dipublikasikan. Jangan menimpa src/layar/LayarTambahPelanggan.tsx atau src/layanan/booking.ts ketika mengulang audit.

[Laporan pusat dan langkah lanjutan](https://github.com/umarmaulanazakaria/barberbarbar/blob/feature/project5-integration/docs/audit/AUDIT-SISTEM-TERKINI.md). Dokumen lama tetap arsip sesuai tanggal; tidak ada file lama dipindahkan/dihapus.
