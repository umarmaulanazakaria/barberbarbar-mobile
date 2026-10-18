# Capture Staff Minimal V3 pada perangkat asli

Status 18 Oktober 2026: **0 screenshot native terverifikasi**. ADB tidak menemukan perangkat; daftar emulator/AVD kosong. Screenshot Web bukan pengganti screenshot React Native.

## Lima gambar yang perlu disediakan

| Berkas yang disarankan | Layar |
| --- | --- |
| beranda.jpg | Beranda, KPI dan antrean Minimal V3 |
| pesanan.jpg | Pesanan dan filter |
| walk-in.jpg | Walk-in Reguler/Member |
| riwayat.jpg | Riwayat dan tanggal WIB |
| profil.jpg | Profil operator tanpa email/telepon pribadi atau credential |

Jalankan versi main pada HP/emulator Android yang kompatibel dengan Expo SDK 57; gunakan backend/data demo terisolasi. Login sebelum capture. Jangan membuat transaksi provider untuk memperoleh gambar. Tidak menyimpan NIK/foto KTP. Hindari kode tracking, QR pembayaran privat, token, credential, kontak pelanggan asli dan notifikasi pribadi.

Ambil gambar dari perangkat, misalnya melalui tombol screenshot Android atau `adb exec-out screencap -p` dengan redirection biner yang sesuai. Catat tanggal, SHA build, model/perangkat tanpa serial, resolusi dan asal data. Simpan PNG/JPEG yang terbaca; target JPEG di bawah 400 KB bila memungkinkan. Periksa gambar satu per satu sebelum menambahkannya ke README.

Galeri hanya boleh disebut lengkap setelah kelima file asli tersedia dan ditinjau.
