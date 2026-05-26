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
