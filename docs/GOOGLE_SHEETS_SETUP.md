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

### Opsi 3: Menggunakan Service Account (Advanced)

Untuk production dengan banyak user, bisa menggunakan Service Account:

1. **Buat Service Account**:
   - Di Google Cloud Console, buat Service Account
   - Download JSON key file

2. **Share Spreadsheet dengan Service Account**:
   - Buka spreadsheet
   - Share dengan email service account (format: `xxx@xxx.iam.gserviceaccount.com`)
   - Berikan akses **Viewer**

3. **Setup Environment Variables**:
   ```env
   GOOGLE_SERVICE_ACCOUNT_EMAIL=xxx@xxx.iam.gserviceaccount.com
   GOOGLE_SERVICE_ACCOUNT_KEY=path/to/key.json
   ```

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

