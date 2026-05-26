/**
 * SLOT GUIDE PWA v1.4 - Google Apps Script Sync
 * Fungsi: Google Sheet sebagai master config ringan untuk PWA tutorial member.
 *
 * Cara deploy:
 * 1. Buat Google Sheet baru.
 * 2. Extensions > Apps Script.
 * 3. Paste semua kode ini.
 * 4. Save.
 * 5. Run sekali: setupSheet()
 * 6. Deploy > New deployment > Web app.
 * 7. Execute as: Me.
 * 8. Who has access: Anyone.
 * 9. Copy Web App URL ke PWA Owner Settings > Google Apps Script API URL.
 */

const SHEET_NAME = 'CONFIG';
const LOG_SHEET_NAME = 'LOGS';

const DEFAULT_CONFIG = {
  version: '1.4.0',
  pin: '7788',
  brandName: 'PANDUAN MEMBER',
  tagline: 'Daftar • Deposit QRIS • Transfer Saldo Game',
  heroTitle: 'Belum paham cara daftar, deposit, atau masuk game?',
  heroSubtitle: 'Ikuti tutorial step-by-step di bawah ini. Semua dibuat singkat, jelas, dan gampang dipahami dari HP.',
  logo: 'assets/logo-placeholder.svg',
  banner: 'assets/banner-placeholder.svg',
  video: '',
  daftarLink: '#',
  loginLink: '#',
  adminLink: 'https://cutt.ly/adminresmi',
  guides: {
    daftar: [
      'Klik tombol Daftar Sekarang.',
      'Isi username, password, nomor WhatsApp, dan data rekening dengan benar.',
      'Pastikan semua data sesuai, lalu klik daftar.',
      'Setelah akun jadi, login menggunakan username dan password.'
    ],
    deposit: [
      'Login ke akun member.',
      'Pilih menu Deposit.',
      'Pilih metode QRIS atau tujuan pembayaran yang tersedia.',
      'Transfer sesuai nominal yang diminta.',
      'Upload bukti transfer jika diminta, lalu tunggu saldo masuk.'
    ],
    transfer: [
      'Login dan pastikan saldo utama sudah masuk.',
      'Pilih menu Transfer.',
      'Pilih dari Saldo Utama ke provider/game tujuan.',
      'Masukkan nominal transfer.',
      'Klik transfer, lalu buka game tujuan untuk mulai main.'
    ],
    promo: [
      'Cek promo aktif sebelum deposit.',
      'Baca syarat dan ketentuan promo.',
      'Hubungi admin kalau ingin klaim bonus tertentu.',
      'Pastikan username benar saat klaim promo.'
    ]
  },
  faq: [
    ['Kenapa saldo belum masuk?', 'Pastikan nominal dan tujuan transfer benar. Kalau masih belum masuk, kirim bukti transfer ke admin.'],
    ['Bisa deposit pakai QRIS?', 'Bisa, ikuti panduan Deposit QRIS di halaman ini.'],
    ['Kenapa saldo belum ada di game?', 'Saldo biasanya masih di saldo utama. Transfer dulu ke provider/game tujuan.'],
    ['Kalau lupa password bagaimana?', 'Hubungi admin dan siapkan username atau nomor WhatsApp terdaftar.']
  ]
};

function setupSheet() {
  const ss = SpreadsheetApp.getActive();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  sheet.clear();

  sheet.getRange(1, 1, 1, 3).setValues([['key', 'value', 'note']]);
  sheet.getRange(1, 1, 1, 3).setFontWeight('bold');

  const rows = [
    ['version', DEFAULT_CONFIG.version, 'versi config'],
    ['pin', DEFAULT_CONFIG.pin, 'PIN admin PWA'],
    ['brandName', DEFAULT_CONFIG.brandName, 'nama brand'],
    ['tagline', DEFAULT_CONFIG.tagline, 'tagline kecil'],
    ['heroTitle', DEFAULT_CONFIG.heroTitle, 'judul utama'],
    ['heroSubtitle', DEFAULT_CONFIG.heroSubtitle, 'subjudul utama'],
    ['logo', DEFAULT_CONFIG.logo, 'URL/path logo'],
    ['banner', DEFAULT_CONFIG.banner, 'URL/path banner'],
    ['video', DEFAULT_CONFIG.video, 'URL/path video MP4'],
    ['daftarLink', DEFAULT_CONFIG.daftarLink, 'link daftar'],
    ['loginLink', DEFAULT_CONFIG.loginLink, 'link login'],
    ['adminLink', DEFAULT_CONFIG.adminLink, 'link chat admin/cutt.ly'],
    ['guides', JSON.stringify(DEFAULT_CONFIG.guides), 'JSON panduan'],
    ['faq', JSON.stringify(DEFAULT_CONFIG.faq), 'JSON FAQ']
  ];

  sheet.getRange(2, 1, rows.length, 3).setValues(rows);
  sheet.autoResizeColumns(1, 3);

  let logSheet = ss.getSheetByName(LOG_SHEET_NAME);
  if (!logSheet) logSheet = ss.insertSheet(LOG_SHEET_NAME);
  if (logSheet.getLastRow() === 0) {
    logSheet.getRange(1, 1, 1, 4).setValues([['time', 'action', 'status', 'detail']]);
    logSheet.getRange(1, 1, 1, 4).setFontWeight('bold');
  }
}

function doGet(e) {
  const action = (e.parameter.action || 'getConfig').trim();
  if (action === 'getConfig') return jsonResponse({ ok: true, config: getConfigFromSheet() });
  if (action === 'ping') return jsonResponse({ ok: true, message: 'PWA GAS Sync aktif', time: new Date().toISOString() });
  return jsonResponse({ ok: false, error: 'Unknown action' });
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || '{}');
    if (body.action === 'saveConfig') {
      saveConfigToSheet(body.config || {});
      logAction('saveConfig', 'ok', 'Config updated from PWA');
      return jsonResponse({ ok: true, message: 'Config saved' });
    }
    return jsonResponse({ ok: false, error: 'Unknown action' });
  } catch (err) {
    logAction('doPost', 'error', String(err));
    return jsonResponse({ ok: false, error: String(err) });
  }
}

function getConfigFromSheet() {
  const ss = SpreadsheetApp.getActive();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    setupSheet();
    sheet = ss.getSheetByName(SHEET_NAME);
  }

  const values = sheet.getDataRange().getValues();
  const config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));

  for (let i = 1; i < values.length; i++) {
    const key = String(values[i][0] || '').trim();
    const raw = values[i][1];
    if (!key) continue;

    if (key === 'guides' || key === 'faq') {
      try {
        config[key] = typeof raw === 'string' ? JSON.parse(raw) : raw;
      } catch (err) {
        config[key] = DEFAULT_CONFIG[key];
      }
    } else {
      config[key] = raw;
    }
  }

  config.updatedAt = new Date().toISOString();
  return config;
}

function saveConfigToSheet(config) {
  const ss = SpreadsheetApp.getActive();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    setupSheet();
    sheet = ss.getSheetByName(SHEET_NAME);
  }

  const merged = Object.assign({}, DEFAULT_CONFIG, config || {});
  const rows = [
    ['version', merged.version || '1.4.0', 'versi config'],
    ['pin', merged.pin || '7788', 'PIN admin PWA'],
    ['brandName', merged.brandName || '', 'nama brand'],
    ['tagline', merged.tagline || '', 'tagline kecil'],
    ['heroTitle', merged.heroTitle || '', 'judul utama'],
    ['heroSubtitle', merged.heroSubtitle || '', 'subjudul utama'],
    ['logo', merged.logo || '', 'URL/path logo'],
    ['banner', merged.banner || '', 'URL/path banner'],
    ['video', merged.video || '', 'URL/path video MP4'],
    ['daftarLink', merged.daftarLink || '', 'link daftar'],
    ['loginLink', merged.loginLink || '', 'link login'],
    ['adminLink', merged.adminLink || '', 'link chat admin/cutt.ly'],
    ['guides', JSON.stringify(merged.guides || DEFAULT_CONFIG.guides), 'JSON panduan'],
    ['faq', JSON.stringify(merged.faq || DEFAULT_CONFIG.faq), 'JSON FAQ']
  ];

  sheet.clear();
  sheet.getRange(1, 1, 1, 3).setValues([['key', 'value', 'note']]);
  sheet.getRange(1, 1, 1, 3).setFontWeight('bold');
  sheet.getRange(2, 1, rows.length, 3).setValues(rows);
  sheet.autoResizeColumns(1, 3);
}

function logAction(action, status, detail) {
  const ss = SpreadsheetApp.getActive();
  let sheet = ss.getSheetByName(LOG_SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(LOG_SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, 4).setValues([['time', 'action', 'status', 'detail']]);
    sheet.getRange(1, 1, 1, 4).setFontWeight('bold');
  }
  sheet.appendRow([new Date(), action, status, detail]);
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
