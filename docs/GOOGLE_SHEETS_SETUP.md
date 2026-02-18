# Setup Google Sheets untuk Broadcast

## Masalah Akses Spreadsheet

Ketika halaman Broadcast mencoba mengakses spreadsheet, ada beberapa cara yang bisa digunakan:

### Opsi 1: Menggunakan Google Sheets API Key (Recommended untuk Production)

1. **Buat Google Cloud Project**:
   - Buka [Google Cloud Console](https://console.cloud.google.com/)
   - Buat project baru atau pilih project yang ada

2. **Enable Google Sheets API**:
   - Pergi ke **APIs & Services** → **Library**
   - Cari "Google Sheets API"
   - Klik **Enable**

3. **Buat API Key**:
   - Pergi ke **APIs & Services** → **Credentials**
   - Klik **Create Credentials** → **API Key**
   - Copy API key yang dibuat

4. **Restrict API Key (Optional tapi Recommended)**:
   - Klik pada API key yang baru dibuat
   - Di **API restrictions**, pilih **Restrict key**
   - Pilih **Google Sheets API**
   - Klik **Save**

5. **Buat Spreadsheet Public (View Only)**:
   - Buka spreadsheet di Google Sheets
   - Klik **Share** → **Change to anyone with the link**
   - Pilih **Viewer** (bukan Editor)
   - Copy link

6. **Tambahkan ke Environment Variables**:
   ```env
   GOOGLE_SHEETS_API_KEY=your-api-key-here
   ```

### Opsi 2: Menggunakan Browser Session (Current Implementation)

Jika tidak menggunakan API key, sistem akan mencoba fetch dari browser menggunakan session Google user.

**Persyaratan**:
1. User harus login ke Google di browser yang sama dengan akun yang punya akses ke spreadsheet
2. Spreadsheet harus di-share dengan akun Google tersebut
3. Browser harus mengizinkan cookies untuk Google

**Cara Setup**:
1. Pastikan Anda sudah login ke Google di browser (buka gmail.com atau drive.google.com)
2. Share spreadsheet dengan akun Google yang login
3. Pastikan browser mengizinkan cookies untuk domain Google

### Opsi 3: Menggunakan Service Account (Required untuk Edit/Tambah/Hapus FAQ)

**PENTING**: Untuk fitur **tambah/edit/hapus FAQ**, service account **WAJIB** dikonfigurasi dengan akses **Editor**.

1. **Buat Service Account**:
   - Buka [Google Cloud Console](https://console.cloud.google.com/)
   - Pilih project Anda (atau buat project baru)
   - Pergi ke **IAM & Admin** → **Service Accounts**
   - Klik **Create Service Account**
   - Isi nama (mis. "diuk-sheets-editor")
   - Klik **Create and Continue**
   - Skip role assignment (tidak perlu)
   - Klik **Done**

2. **Buat Key untuk Service Account**:
   - Klik service account yang baru dibuat
   - Pergi ke tab **Keys**
   - Klik **Add Key** → **Create new key**
   - Pilih format **JSON**
   - Klik **Create** (file JSON akan otomatis terdownload)

3. **Enable Google Sheets API**:
   - Di Google Cloud Console, pergi ke **APIs & Services** → **Library**
   - Cari "Google Sheets API"
   - Klik **Enable** (jika belum enabled)

4. **Share Spreadsheet dengan Service Account**:
   - Buka spreadsheet di Google Sheets
   - Klik **Share** (tombol di kanan atas)
   - Paste email service account (format: `xxx@xxx.iam.gserviceaccount.com`)
   - **PENTING**: Pilih akses **Editor** (bukan Viewer) agar bisa edit/tambah/hapus
   - Klik **Send** (atau **Done**)

5. **Setup Environment Variables**:

   **Opsi A (Recommended untuk hosting seperti Vercel/Railway)**:
   ```env
   GOOGLE_SERVICE_ACCOUNT_EMAIL=xxx@xxx.iam.gserviceaccount.com
   GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   ```
   
   Untuk mendapatkan `private_key`:
   - Buka file JSON yang didownload
   - Copy value dari field `private_key` (termasuk `-----BEGIN PRIVATE KEY-----` dan `-----END PRIVATE KEY-----`)
   - Paste ke env variable, pastikan tetap ada `\n` untuk newline

   **Opsi B (Development/local)**:
   ```env
   GOOGLE_SERVICE_ACCOUNT_KEY=/path/to/key.json
   ```
   
   Atau bisa juga paste seluruh isi JSON sebagai string:
   ```env
   GOOGLE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"...","private_key_id":"...","private_key":"...","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}'
   ```

6. **Restart aplikasi** setelah menambahkan env variables

## Setup untuk Fitur FAQ (Edit/Tambah/Hapus)

Fitur FAQ membutuhkan **Service Account dengan akses Editor** untuk bisa edit/tambah/hapus data.

### Quick Setup:

1. **Buat Service Account** (ikuti langkah di Opsi 3 di atas)
2. **Share spreadsheet dengan akses Editor** ke email service account
3. **Set environment variables**:
   ```env
   GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
   GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   ```
4. **Restart aplikasi**

### Verifikasi Setup:

- **GET FAQ** (lihat data): Bisa tanpa service account (cukup spreadsheet public)
- **POST/PUT/DELETE FAQ** (edit/tambah/hapus): Butuh service account dengan akses Editor

Jika masih error "Service account belum dikonfigurasi", pastikan:
- ✅ Env variables sudah di-set dengan benar
- ✅ Service account sudah di-share ke spreadsheet dengan akses **Editor**
- ✅ Google Sheets API sudah enabled di Google Cloud Console
- ✅ Aplikasi sudah di-restart setelah set env variables

## Troubleshooting

### Error: "Gagal mengakses spreadsheet"

**Kemungkinan penyebab**:
1. Spreadsheet tidak public dan user tidak login ke Google dengan akun yang benar
2. Spreadsheet tidak di-share dengan akun Google user
3. Browser memblokir cookies untuk Google

**Solusi**:
1. Pastikan login ke Google di browser dengan akun yang punya akses
2. Share spreadsheet dengan akun tersebut
3. Atau gunakan Opsi 1 (API Key dengan spreadsheet public)

### Error: "Kolom tidak ditemukan"

**Kemungkinan penyebab**:
- Header spreadsheet tidak sesuai dengan yang diharapkan

**Kolom yang diperlukan**:
- **Nama** (case-insensitive, bisa "Nama", "nama", dll)
- **NO WA** atau **ID WA** (minimal salah satu harus ada)

**Format header yang didukung**:
- "Nama", "NO WA", "ID WA"
- "Nama", "No. WA", "ID. WA"
- "Nama", "Nomor WA", "ID WA"
- dll (case-insensitive)

## Testing

Untuk test apakah spreadsheet bisa diakses:

1. Buka spreadsheet di browser
2. Pastikan bisa melihat data
3. Coba akses CSV export URL:
   ```
   https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/export?format=csv&gid=0
   ```
4. Jika bisa download CSV, berarti akses OK

