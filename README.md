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
