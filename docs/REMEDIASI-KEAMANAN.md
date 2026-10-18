# Remediasi keamanan Staff — 18 Oktober 2026

Audit npm lengkap dan --omit=dev: **44 → 37 package reports**, Moderate **7 → 0**, High **37 → 37**, Critical **0 → 0**. Tiga akar advisory menjadi dua; 37 laporan tersisa bukan 37 cacat independen pada UI.

## Patch terpasang

Expo 57.0.29 → 57.0.30 dalam SDK 57, dengan CLI 57.0.31/preset 57.0.16 dan dependency parent yang kompatibel. React Native tetap 0.86.3 dan React 19.2.3. Tidak mengubah Metro/Hermes config, desain Minimal V3, native modules, navigasi, safe area, Membership, pembayaran atau source layar.

Override hanya pada xcode.uuid=11.1.1 mengganti uuid 7.0.3. Parent xcode stable 3.0.1 belum memperbarui range. Source hanya memakai CommonJS uuid.v4(); kompatibilitas diperiksa sebelum pemasangan lalu melalui [script regresi](../scripts/test-kompatibilitas-keamanan.cjs): resolusi versi konsumen, bounds check v3/v5/v6, 10.000 ID unik 24 hex, addPbxGroup dan write/parse PBX fixture. Tidak memaksa override global. Ini menutup [akar uuid](https://github.com/advisories/GHSA-w5hq-g745-h8pq) dan tujuh laporan propagasi; bukan klaim menutup High Staff. Periksa ulang override bila parent berubah.

## Risiko yang belum mempunyai patch resmi

- [braces <=3.0.3](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm), melalui micromatch → metro-file-map → Metro/Expo/RN. Input pola glob rekursif dapat menghabiskan stack pada toolchain. Registry stable terbaru masih 3.0.3. Pakai repository/pola/plugin tepercaya; jangan memproses glob eksternal atau mengekspos Metro ke Internet.
- [node-forge <=1.4.0](https://github.com/advisories/GHSA-86w9-cpqp-85rv), melalui certificate/signing CLI Expo. Source benar memanggil verifikasi certificate dan RSA; jangan menganggapnya false positive. Belum ada patched version; stable terakhir 1.4.0. Batasi material signing/key/certificate pada sumber tepercaya, tinjau code signing/update sebelum deployment dan pantau rilis resmi. App tidak mendeklarasikan expo-updates atau custom code signing saat audit.

Pada source map export Android produksi yang diuji (975 source), node-forge/braces/micromatch/xcode/uuid tidak disertakan. Risiko saat ini teramati pada build/development/signing, bukan modul aplikasi Android hasil export tersebut. Ini tidak menghapus risiko toolchain, tidak menjamin seluruh iOS/deployment aman, dan tidak menjadi alasan mengabaikan advisory. Audit --omit=dev tetap menghitung toolchain karena berada pada dependency graph Expo.

Tidak menggunakan force, downgrade tak aman, prerelease, patch kriptografi buatan sendiri, atau menghapus dependency penting. Upgrade SDK major tidak dilakukan dan tidak otomatis menjamin akar tanpa patch hilang.

## Verifikasi

- PASS: TypeScript working tree/snapshot; Expo install --check menyatakan Dependencies are up to date.
- PASS: autolinking verify serta resolve Android, 11 modul Expo tanpa konflik pemeriksaan.
- PASS: export Android/Hermes (997 modul), source map dan tes kompatibilitas Xcode/UUID. Ini bukan build iOS/Xcode/IPA.
- PASS: Metro offline di port uji tersendiri, /status dan dev bundle 200 (1.158 modul); proses uji dihentikan.
- PASS: API lokal public/services 200 dan kontrak operator/backend read-only; bukan pengujian koneksi perangkat LAN.
- PASS: 14 suite backend dengan Prisma patch baru, DB fixture dan provider mock, cleanup terverifikasi.
- BELUM TERVERIFIKASI: klik UI native, HP, printer dan pembayaran provider nyata pada remediasi.

Source WIP empat file dan source historis tetap tidak masuk commit; hash/index dibandingkan. [Laporan pusat, seluruh advisory dan bukti](https://github.com/umarmaulanazakaria/barberbarbar/blob/feature/project5-integration/docs/audit/REMEDIASI-KEAMANAN.md). Angka 44 pada dokumen operasional sebelumnya merupakan baseline sebelum patch ini.
