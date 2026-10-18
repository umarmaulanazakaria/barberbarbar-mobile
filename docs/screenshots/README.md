# Capture Staff Minimal V3 pada perangkat asli

Status 18 Oktober 2026: galeri [enam visual presentasi hasil olahan](../showcase/README.md) sudah tersedia. Materi tersebut bukan screenshot native mentah atau bukti pengujian perangkat. Pemeriksaan perangkat sebelumnya belum menemukan perangkat/AVD; tidak mengulang pengujian perangkat pada tugas dokumentasi ini. Beranda belum tersedia, Profil belum dipublikasikan karena privasi.

## Screenshot perangkat asli tanpa edit yang masih perlu dilengkapi

| Berkas yang disarankan | Layar |
| --- | --- |
| beranda.jpg | Beranda, KPI dan antrean Minimal V3 |
| pesanan.jpg | Pesanan dan filter |
| walk-in.jpg | Walk-in Reguler/Member |
| riwayat.jpg | Riwayat dan tanggal WIB |
| profil.jpg | Profil operator tanpa email/telepon pribadi atau credential |

Jalankan versi main pada HP/emulator Android yang kompatibel dengan Expo SDK 57; gunakan backend/data demo terisolasi. Login sebelum capture. Jangan membuat transaksi provider untuk memperoleh gambar. Tidak menyimpan NIK/foto KTP. Hindari kode tracking, QR pembayaran privat, token, credential, kontak pelanggan asli dan notifikasi pribadi.

Ambil gambar dari perangkat, misalnya melalui tombol screenshot Android atau `adb exec-out screencap -p` dengan redirection biner yang sesuai. Catat tanggal, SHA build, model/perangkat tanpa serial, resolusi dan asal data. Simpan PNG/JPEG yang terbaca; target JPEG di bawah 400 KB bila memungkinkan. Periksa gambar satu per satu sebelum menambahkannya ke README.

Bukti native tanpa edit hanya boleh disebut lengkap setelah kelima file asli tersedia dan ditinjau. Galeri presentasi hasil olahan tetap diberi label terpisah.
