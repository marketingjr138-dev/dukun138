# DUKUN138 Guide PWA v1.5

PWA mobile-first untuk panduan member:
- Cara Daftar
- Deposit QRIS
- Transfer saldo ke game tujuan
- Cara Withdraw
- Promo
- FAQ
- Media tutorial 9:16 per menu
- Native video player, bukan embed YouTube
- Google Apps Script Sync untuk update global via Google Sheet
- Owner Settings private dengan PIN

## Deploy Cloudflare Pages
Pastikan file `index.html` ada di root repo.

Build settings:
- Framework preset: None
- Build command: kosong
- Build output directory: .

## Google Apps Script
Gunakan file `google-apps-script-v1.5.gs`.

Cara:
1. Buat Google Sheet baru.
2. Extensions > Apps Script.
3. Paste isi `google-apps-script-v1.5.gs`.
4. Save.
5. Run `setupSheet()` sekali.
6. Deploy > New deployment > Web app.
7. Execute as: Me.
8. Who has access: Anyone.
9. Copy Web App URL.
10. Masuk PWA > Owner Settings > isi Google Apps Script API URL.
11. Klik Pull Config Online / Push ke Google Sheet.

## Media 9:16
Isi media di Owner Settings atau Google Sheet field `media`.

Gunakan video direct `.mp4`, bukan link halaman YouTube.


## v1.5.1
- Fix bottom navigation supaya tombol Home/Daftar/Deposit/Transfer/WD/Promo berfungsi.
- Tombol Admin bawah sekarang membuka PIN Owner Settings, bukan link chat admin.
- Tombol admin header dibuat sedikit lebih terlihat tapi tetap kecil/private.


## v1.5.2
- Fix total event handler tombol agar tidak mati karena JS cache/error.
- Bottom nav memakai event delegation.
- Tombol Admin header dan bottom nav membuka PIN Owner Settings.
- CTA Daftar/Login/Chat tetap direct link dari config/settings.


## v1.6 Media Upload dari HP
- Owner Settings sekarang punya input upload file dari galeri untuk logo, banner, gambar tutorial, dan video tutorial.
- File diupload ke Google Drive lewat Apps Script.
- Link Drive otomatis masuk ke field media.
- Setelah upload, klik `Push ke Google Sheet` agar semua member ikut update.
- Batas saran: gambar maksimal 5MB, video maksimal 30MB.
- Gunakan file video MP4 portrait 9:16 agar paling stabil.
- Update Apps Script memakai file `google-apps-script-v1.6.gs`.


## v1.6.1
- Fix tombol Pilih Panduan bagian atas agar bisa diklik langsung.
- Tab Daftar/Deposit/Transfer/WD/Promo sekarang memakai event delegation yang lebih aman.
- Rapihin spacing teks langkah agar tidak terbaca menempel seperti `Langkah 1Cek`.
- Cache PWA dinaikkan agar update lebih mudah kebaca.


## v1.7
- Media upload jadi mode utama. Field logo/banner/gambar/video tidak perlu diisi link manual.
- Field teknis media dibuat readonly dan default kosong.
- Upload dari galeri HP tetap otomatis menyimpan link Drive di belakang layar.
- Tombol hapus/reset media per field.
- Ganti PIN wajib memakai PIN lama, PIN baru, dan konfirmasi PIN baru.
- Apps Script update ke `google-apps-script-v1.7.gs`.
- Untuk gambar Google Drive, Apps Script memakai URL thumbnail agar lebih stabil tampil di `<img>`.


## v1.7.1 PWA Install + Favicon
- Favicon dan app icon diganti memakai logo DUKUN138 yang baru.
- Manifest dibuat lebih lengkap untuk install PWA.
- Tambah tombol Install kecil di header saat browser mendukung install prompt.
- Fallback logo header memakai `assets/logo-dukun138.png`.
- Cache PWA dinaikkan ke v1.7.1.


## v1.7.3 Recovery Fix
- Rebuild app.js dari basis stabil supaya tombol tidak mati.
- Pilih Panduan atas, bottom nav, Admin, Install, Upload, Save, Pull, Push kembali aktif.
- Link/path teknis media tetap disembunyikan.
- Field media default kosong.
- Cache PWA dinaikkan ke v1.7.3.


## v1.7.4
- Tombol Admin di header dihapus.
- Tombol Admin di bottom nav dihapus.
- Akses admin disamarkan sebagai footer `© 2026`.
- Tombol Install dinaikkan dan dirapikan agar tidak numpuk dengan tagline/header.
- PIN memakai fallback `7788` kalau config pin kosong/rusak.
- Tambah tombol reset PIN lokal ke `7788` di dialog PIN.
- Cache PWA dinaikkan ke v1.7.4.
