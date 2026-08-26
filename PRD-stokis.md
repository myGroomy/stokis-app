# PRD: Sistem Stock Opname Multi Cabang dengan Arsitektur Terpisah — Frontend Vercel dan Backend API Apps Script

## 1. Latar Belakang

PRD sebelumnya, *Sistem Stock Opname Multi Cabang dengan Isolasi Database dan Administrasi Tanpa Kode*, merancang seluruh sistem sebagai satu Web App Apps Script tunggal: kode backend, tampilan HTML, dan database (Google Sheets) berada dalam satu proyek Apps Script yang sama. Pendekatan ini memudahkan deployment awal, namun membatasi kualitas antarmuka, kecepatan iterasi tampilan, dan kemampuan menggunakan tooling frontend modern.

Dokumen ini menetapkan perubahan arsitektur: tampilan (frontend) dipisahkan sepenuhnya dari backend, dipindahkan ke aplikasi web yang di-deploy di Vercel, sementara Apps Script diubah perannya menjadi murni API backend yang mengembalikan data JSON, tanpa lagi menyajikan halaman HTML apa pun. Google Sheets tetap menjadi database, tidak berubah dari PRD sebelumnya, baik struktur Registry maupun struktur spreadsheet per cabang.

Dua keputusan yang dikonfirmasi untuk dokumen ini:

1. Skema autentikasi API menggunakan **API key sederhana**: satu kunci rahasia yang disertakan pada header setiap request ke API.
2. Web App HTML Apps Script yang lama **dihapus total**, bukan dipertahankan sebagai fallback. Apps Script setelah perubahan ini hanya menjalankan `doGet`/`doPost` yang mengembalikan JSON, tidak lagi memiliki file HTML apa pun.

Seluruh keputusan desain dari PRD sebelumnya yang berkaitan dengan struktur data, isolasi per cabang, administrasi tanpa kode, aturan status, dan mekanisme PDF/WhatsApp tetap berlaku dan tidak ditulis ulang secara rinci di sini kecuali bagian yang terpengaruh langsung oleh pemisahan frontend dan backend.

## 2. Tujuan

1. Memisahkan tampilan dari logika backend, sehingga frontend dapat dikembangkan dan di-deploy secara independen menggunakan Vercel, tanpa terikat pada keterbatasan `HtmlService` Apps Script.
2. Mengubah seluruh fungsi Apps Script yang sebelumnya dipanggil melalui `google.script.run` menjadi endpoint HTTP yang dapat dipanggil dari luar Apps Script, dengan format request dan response yang konsisten.
3. Menjaga agar Google Sheets (Registry dan spreadsheet per cabang) tetap menjadi satu-satunya sumber data, tanpa migrasi ke database lain.
4. Menerapkan autentikasi API key sederhana yang cukup untuk skala penggunaan internal, tanpa kompleksitas OAuth atau sistem login pengguna.
5. Menghapus total Web App HTML Apps Script yang lama, memastikan tidak ada dua jalur akses (lama dan baru) yang berjalan bersamaan setelah migrasi selesai.

## 3. Ruang Lingkup

### 3.1 Termasuk dalam Scope

- Konversi seluruh fungsi backend pada bagian 12 PRD sebelumnya menjadi endpoint API yang diakses melalui `doGet`/`doPost` pada Apps Script.
- Perancangan skema autentikasi API key sederhana, termasuk validasi kunci di sisi Apps Script dan penyimpanan kunci di sisi Vercel sebagai environment variable, tidak pernah dikirim ke browser pengguna.
- Perancangan pola komunikasi Vercel-ke-Apps Script yang menghindari keterbatasan CORS pada Apps Script Web App, menggunakan API Route/Server Function di Vercel sebagai perantara (proxy) antara browser dan Apps Script.
- Pembangunan ulang seluruh halaman yang sebelumnya berupa `HtmlService` menjadi halaman frontend di Vercel (disebutkan kerangkanya, bukan implementasi detail komponen).
- Rencana penghapusan total file HTML, CSS, dan JavaScript sisi klien yang sebelumnya berada di dalam proyek Apps Script.
- Penyesuaian format response Apps Script dari yang sebelumnya berupa objek JavaScript biasa (dikembalikan ke `google.script.run`) menjadi JSON terstruktur dengan status yang konsisten.

### 3.2 Tidak Termasuk dalam Scope

- Perubahan struktur data Registry maupun spreadsheet per cabang. Struktur pada bagian 5 dan 6 PRD sebelumnya tetap berlaku tanpa perubahan.
- Perubahan logika bisnis: aturan status, alur perbandingan data, mekanisme dua shift, dan cara kerja `createCabang` tidak berubah, hanya cara aksesnya yang berubah dari pemanggilan fungsi langsung menjadi pemanggilan API.
- Migrasi ke database selain Google Sheets. Keputusan tetap menggunakan Sheets sebagai database dipertahankan pada tahap ini.
- Sistem login pengguna dengan akun individual, role, atau sesi per pengguna. API key yang digunakan bersifat tunggal dan sama untuk seluruh pengguna aplikasi, konsisten dengan keputusan yang sudah dikonfirmasi.
- Rancangan detail komponen UI, styling, atau pemilihan framework frontend spesifik (Next.js, React murni, atau lainnya). Dokumen ini menetapkan kontrak API dan struktur halaman pada tingkat fungsi, bukan implementasi visual.
- Pemeliharaan paralel Web App HTML lama sebagai fallback. Karena keputusan yang dikonfirmasi adalah penghapusan total, tidak ada rencana rollback ke versi HTML lama sebagai bagian dari scope ini.

## 4. Prinsip Arsitektur

1. **Apps Script sebagai API murni.** Setelah perubahan ini, Apps Script tidak lagi bertanggung jawab menyajikan tampilan apa pun. Satu-satunya keluaran Apps Script adalah JSON, baik untuk request berhasil maupun gagal.
2. **Vercel sebagai satu-satunya lapisan tampilan.** Seluruh halaman yang dilihat pengguna dirender oleh aplikasi di Vercel. Apps Script tidak pernah diakses langsung oleh browser pengguna.
3. **Kunci API tidak pernah sampai ke browser.** Karena API key bersifat rahasia tunggal, kunci tersebut hanya boleh berada di sisi server Vercel (environment variable), dipakai oleh Server Function/API Route Vercel saat memanggil Apps Script, tidak pernah dikirim sebagai bagian dari kode atau response yang diterima klien.
4. **Kontrak API tetap sadar cabang.** Prinsip dari PRD sebelumnya bahwa hampir seluruh fungsi menerima `Cabang_ID` sebagai parameter tetap dipertahankan, kini dalam bentuk parameter query atau body JSON, bukan argumen fungsi `google.script.run`.
5. **Google Sheets tidak menyadari adanya perubahan ini.** Struktur Registry, struktur spreadsheet cabang, dan logika `resolveCabangSpreadsheet_` pada PRD sebelumnya tidak berubah. Perubahan arsitektur ini murni terjadi pada lapisan penyajian dan komunikasi, bukan pada lapisan data.

## 5. Komponen Sistem

| Komponen | Peran | Lokasi |
|---|---|---|
| Frontend Web | Menampilkan seluruh halaman, mengelola state pemilihan cabang di sisi klien, memanggil API Route Vercel | Vercel |
| API Route / Server Function | Perantara antara browser dan Apps Script, menyimpan API key, meneruskan request ke Apps Script, meneruskan response ke browser | Vercel (server-side) |
| Backend API | Menjalankan seluruh logika bisnis, memvalidasi API key, mengakses Registry dan spreadsheet cabang, menghasilkan PDF, menyusun tautan WhatsApp | Google Apps Script (Web App, deploy sebagai API) |
| Registry | Daftar cabang dan referensi spreadsheet masing masing, tidak berubah dari PRD sebelumnya | Google Sheets |
| Spreadsheet Cabang | Data operasional per cabang, tidak berubah dari PRD sebelumnya | Google Sheets |
| Folder Drive per Cabang | Penyimpanan file PDF hasil `generatePDF` | Google Drive |

## 6. Skema Autentikasi API

Skema yang digunakan adalah **API key sederhana**: satu kunci rahasia yang harus disertakan pada header setiap request ke Apps Script.

### 6.1 Alur Autentikasi

1. Kunci rahasia disimpan sebagai environment variable di Vercel, contoh nama variabel `STOKIS_API_KEY`, tidak pernah muncul di kode sisi klien maupun di response yang dikirim ke browser.
2. Setiap kali browser memanggil API Route Vercel (misalnya `/api/master-item`), API Route tersebut yang menambahkan header `X-API-Key` berisi kunci rahasia sebelum meneruskan request ke Apps Script.
3. Apps Script, pada awal setiap `doGet`/`doPost`, membaca header `X-API-Key` dari request, membandingkan dengan kunci rahasia yang disimpan di `PropertiesService` Apps Script (Script Properties), bukan ditulis langsung di kode.
4. Jika kunci tidak cocok atau tidak ada, Apps Script mengembalikan response JSON dengan status gagal dan kode HTTP yang sesuai, tanpa memproses permintaan lebih lanjut.
5. Karena browser pengguna tidak pernah memanggil Apps Script secara langsung, kunci API tidak pernah terekspos melalui DevTools browser atau file JavaScript yang di-*serve* ke klien.

### 6.2 Penyimpanan Kunci

| Sisi | Tempat Penyimpanan | Catatan |
|---|---|---|
| Vercel | Environment Variable pada project settings, tidak diawali `NEXT_PUBLIC_` atau prefiks setara agar tidak ikut terbundel ke kode klien | Hanya dapat dibaca oleh kode yang berjalan di server Vercel |
| Apps Script | Script Properties (`PropertiesService.getScriptProperties()`) | Tidak ditulis sebagai string literal di kode, agar tidak ikut ter-commit jika kode di-versionkan |

### 6.3 Rotasi Kunci

Jika kunci perlu diganti, langkah yang dilakukan adalah memperbarui nilai pada Script Properties Apps Script dan pada Environment Variable Vercel secara bersamaan, kemudian melakukan redeploy pada kedua sisi. Karena hanya ada satu kunci untuk seluruh sistem, tidak ada mekanisme kunci per pengguna atau kedaluwarsa otomatis pada tahap ini.

## 7. Alasan Menggunakan Proxy Vercel, Bukan Panggilan Langsung Browser ke Apps Script

Dipertimbangkan juga opsi browser memanggil Apps Script secara langsung dengan menyertakan API key dari sisi klien. Opsi ini ditolak karena dua alasan:

1. **Kunci akan terekspos.** API key yang dikirim dari kode yang berjalan di browser dapat dilihat siapa pun melalui DevTools, membuat kunci rahasia tidak lagi rahasia.
2. **Keterbatasan CORS pada Apps Script Web App.** Apps Script Web App tidak mendukung penanganan *preflight request* (`OPTIONS`) secara fleksibel seperti server API pada umumnya, sehingga request dengan header kustom seperti `X-API-Key` langsung dari browser berisiko gagal akibat kebijakan CORS, terutama pada metode selain `GET` sederhana.

Dengan seluruh request dari browser diarahkan ke API Route Vercel terlebih dahulu, dua masalah di atas tidak muncul: komunikasi browser-ke-Vercel berada dalam satu origin (atau CORS yang dikontrol sendiri), sementara komunikasi Vercel-ke-Apps Script terjadi sepenuhnya di sisi server, tanpa batasan CORS karena bukan request dari browser.

## 8. Kontrak API

Seluruh fungsi backend pada bagian 12 PRD sebelumnya dipertahankan secara logika, hanya berubah bentuk pemanggilan dari `google.script.run.namaFungsi()` menjadi endpoint HTTP. Tabel berikut memetakan fungsi lama ke endpoint API baru. Seluruh endpoint diakses melalui satu Web App URL Apps Script dengan parameter `action` untuk menentukan fungsi yang dipanggil, mengikuti pola umum Apps Script Web App sebagai API tunggal.

| Fungsi Lama | Method | Endpoint (via API Route Vercel) | Parameter Utama |
|---|---|---|---|
| getCabangList | GET | `/api/cabang` | – |
| createCabang | POST | `/api/cabang` | Nama_Cabang, Alamat, PIC_Nama, Nomor_WA_Cabang |
| updateCabang | PUT | `/api/cabang/{cabangId}` | field yang diperbarui |
| setCabangActive | PATCH | `/api/cabang/{cabangId}/status` | Aktif |
| getMasterItems | GET | `/api/master-item?cabang={cabangId}` | Cabang_ID |
| addItem | POST | `/api/master-item` | Cabang_ID, data item |
| updateThreshold | PATCH | `/api/master-item/{itemId}/threshold` | Cabang_ID, Threshold |
| setItemActive | PATCH | `/api/master-item/{itemId}/status` | Cabang_ID, Aktif |
| getPetugasList | GET | `/api/petugas?cabang={cabangId}` | Cabang_ID |
| addPetugas | POST | `/api/petugas` | Cabang_ID, Nama, Nomor_WA |
| updatePetugas | PUT | `/api/petugas/{petugasId}` | Cabang_ID, field yang diperbarui |
| setPetugasActive | PATCH | `/api/petugas/{petugasId}/status` | Cabang_ID, Aktif |
| submitSO | POST | `/api/so` | Cabang_ID, data seluruh item satu sesi |
| generatePDF | – | dipanggil internal oleh `/api/so`, tidak diekspos sebagai endpoint terpisah | – |
| getShareWhatsAppLink | GET | `/api/laporan/{laporanId}/wa-link` | Cabang_ID |
| updateStatusKirimWA | PATCH | `/api/laporan/{laporanId}/status-wa` | Cabang_ID |
| searchLaporan | GET | `/api/laporan?cabang={cabangId}&...` | Cabang_ID, parameter pencarian |
| getDashboardHarian | GET | `/api/dashboard/harian?cabang={cabangId}&tanggal=...` | Cabang_ID, Tanggal_Operasional |
| getDashboardMingguan | GET | `/api/dashboard/mingguan?cabang={cabangId}&dari=...&sampai=...` | Cabang_ID, rentang tanggal |

Catatan: kolom Method pada tabel di atas menggambarkan method HTTP yang diekspos oleh API Route Vercel kepada frontend. Karena Apps Script Web App native hanya mengenal `doGet` dan `doPost`, API Route Vercel yang menerjemahkan method `PUT`/`PATCH`/`DELETE` dari frontend menjadi satu request `doPost` ke Apps Script dengan parameter `action` yang sesuai (contoh: `action=updateCabang`).

## 9. Format Request dan Response

### 9.1 Request ke Apps Script

Seluruh request dari API Route Vercel ke Apps Script dikirim sebagai `POST` dengan body JSON, termasuk untuk operasi yang secara semantik bersifat "read", agar penanganan di sisi Apps Script tetap seragam dan menghindari batasan panjang URL pada `GET` untuk parameter yang kompleks.

Struktur umum body request:

```json
{
  "action": "getMasterItems",
  "cabangId": "CBG001",
  "payload": {}
}
```

### 9.2 Response dari Apps Script

Seluruh response, baik berhasil maupun gagal, mengikuti struktur yang sama agar mudah ditangani secara generik oleh API Route Vercel.

Response berhasil:

```json
{
  "success": true,
  "data": {}
}
```

Response gagal:

```json
{
  "success": false,
  "error": {
    "code": "CABANG_TIDAK_DITEMUKAN",
    "message": "Cabang dengan ID tersebut tidak ditemukan atau tidak aktif"
  }
}
```

Kode error yang digunakan konsisten dengan kondisi yang sudah didefinisikan pada bagian 7.3 dan bagian 16 PRD sebelumnya (cabang tidak ditemukan, cabang tidak aktif, Spreadsheet_ID tidak valid), ditambah `UNAUTHORIZED` untuk kegagalan validasi API key.

## 10. Struktur Data

Struktur Registry (bagian 5 PRD sebelumnya) dan struktur spreadsheet per cabang (bagian 6 PRD sebelumnya), termasuk sheet Master_Item, SO_Transaksi, Laporan_PDF, Petugas, dan Settings, tidak berubah sama sekali akibat perubahan arsitektur ini. Perubahan pada dokumen ini murni terjadi pada cara data tersebut diakses dari luar, bukan pada bentuk penyimpanannya.

## 11. Rancangan Halaman Frontend (Vercel)

Halaman yang sebelumnya dirancang sebagai `HtmlService` pada bagian 13 PRD sebelumnya dipetakan ulang menjadi halaman pada aplikasi Vercel. Pemilihan cabang, yang sebelumnya disimpan sebagai sesi Web App, kini disimpan sebagai state di sisi klien (misalnya localStorage atau state management frontend), dikirim sebagai `cabangId` pada setiap pemanggilan API Route.

| Halaman Lama | Rute Frontend (Vercel) | Perubahan |
|---|---|---|
| Halaman Pemilihan Cabang | `/` | Data cabang diambil dari `/api/cabang`, pilihan disimpan di state klien, bukan sesi server |
| Halaman Input SO | `/so/input` | Tidak berubah secara fungsi, sumber data kini dari API bukan `google.script.run` |
| Halaman Konfirmasi Laporan | `/so/konfirmasi/{laporanId}` | Tidak berubah secara fungsi |
| Halaman Riwayat Laporan | `/laporan` | Tidak berubah secara fungsi |
| Halaman Master Item | `/master-item` | Tidak berubah secara fungsi |
| Halaman Administrasi Karyawan | `/petugas` | Tidak berubah secara fungsi |
| Halaman Administrasi Cabang | `/cabang` | Tidak berubah secara fungsi |
| Dashboard Harian | `/dashboard/harian` | Tidak berubah secara fungsi |
| Dashboard Mingguan | `/dashboard/mingguan` | Tidak berubah secara fungsi |

## 12. Konfigurasi Deployment

### 12.1 Vercel

- Environment variable `STOKIS_API_KEY` (kunci rahasia) dan `APPS_SCRIPT_URL` (URL Web App Apps Script) disetel pada Project Settings Vercel, tidak di-commit ke repository.
- Seluruh API Route berada di bawah `/api/*`, berjalan sebagai server function, satu-satunya bagian kode yang membaca `STOKIS_API_KEY`.
- Tidak ada konfigurasi khusus untuk database karena aplikasi Vercel tidak pernah terhubung langsung ke Google Sheets.

### 12.2 Apps Script

- Deploy ulang sebagai Web App dengan akses "Siapa saja" pada level eksekusi, karena validasi keamanan yang sesungguhnya terjadi melalui pemeriksaan API key di dalam kode, bukan melalui pembatasan akses deployment Apps Script.
- `doGet` dan `doPost` menjadi satu-satunya titik masuk, keduanya membaca `action` untuk menentukan fungsi yang dijalankan, dan keduanya melakukan validasi API key sebagai langkah pertama sebelum logika lain dijalankan.
- Seluruh fungsi lama (`getCabangList`, `createCabang`, `resolveCabangSpreadsheet_`, dan lainnya pada bagian 12 PRD sebelumnya) tetap ada sebagai fungsi internal, dipanggil dari dalam `doGet`/`doPost` berdasarkan nilai `action`, bukan dipanggil langsung dari klien.

## 13. Rencana Dekomisioning Apps Script HTML Lama

Karena keputusan yang dikonfirmasi adalah penghapusan total tanpa fallback, langkah dekomisioning berikut dilakukan sebagai bagian dari migrasi:

1. Seluruh file `.html` pada proyek Apps Script (halaman Input SO, Konfirmasi Laporan, Riwayat Laporan, Master Item, Administrasi Karyawan, Administrasi Cabang, dan file JavaScript/CSS pendukungnya) dihapus dari proyek.
2. Seluruh fungsi `doGet` yang sebelumnya mengembalikan `HtmlService.createTemplateFromFile(...)` diganti sepenuhnya dengan fungsi `doGet` baru yang hanya menangani request API dan mengembalikan JSON melalui `ContentService`.
3. URL Web App Apps Script yang lama, yang sebelumnya dibagikan sebagai tautan langsung ke pengguna, tidak lagi dibagikan sebagai tautan aplikasi. URL yang tampil kepada pengguna sepenuhnya adalah domain Vercel.
4. Setelah frontend Vercel dipastikan berjalan penuh menggunakan seluruh endpoint pada bagian 8, deployment Apps Script versi HTML lama dinonaktifkan, deployment baru versi API-only dipublikasikan sebagai pengganti.
5. Tidak ada periode transisi paralel dengan dua antarmuka berjalan bersamaan; migrasi dilakukan sebagai satu kali *cutover*, sesuai keputusan "ganti total" yang sudah dikonfirmasi.

## 14. Batasan dan Risiko

| Risiko | Dampak | Mitigasi |
|---|---|---|
| API key bocor jika environment variable Vercel salah dikonfigurasi (tanpa sengaja diberi prefiks yang membuatnya terbundel ke klien) | Kunci rahasia dapat terlihat oleh siapa pun melalui kode sisi klien | Pastikan nama environment variable tidak menggunakan prefiks yang di-*expose* ke klien, verifikasi dengan memeriksa bundel JavaScript yang dikirim ke browser setelah deployment |
| Apps Script Web App memiliki batas kuota eksekusi dan waktu eksekusi per request | Request yang memproses banyak data (misalnya `generatePDF` untuk sesi besar) berisiko timeout | Pantau waktu eksekusi, pertimbangkan pemrosesan asinkron untuk operasi berat jika mendekati batas waktu Apps Script |
| Latensi tambahan karena request melewati dua loncatan (browser ke Vercel, Vercel ke Apps Script) dibandingkan akses langsung pada arsitektur lama | Waktu respons total sedikit lebih lambat | Diterima sebagai konsekuensi arsitektur demi keamanan kunci API dan penghindaran masalah CORS, dipertimbangkan lebih lanjut jika latensi terbukti mengganggu penggunaan sehari hari |
| Kesalahan pada pemetaan `action` antara API Route Vercel dan Apps Script | Request gagal diproses meskipun kedua sisi berjalan normal | Jaga daftar `action` pada bagian 8 sebagai referensi tunggal yang disinkronkan di kedua sisi setiap ada penambahan endpoint |
| Deployment Apps Script baru tidak menggantikan URL lama secara otomatis, setiap `doGet`/`doPost` baru pada Apps Script memerlukan versi deployment baru agar perubahan berlaku | Perubahan kode Apps Script tidak langsung berlaku pada URL yang sudah dipakai Vercel jika deployment tidak diperbarui | Gunakan deployment versi "Tetap gunakan URL yang sama" saat memperbarui kode Apps Script, dan uji setiap kali sebelum mengumumkan siap dipakai |
| Tidak ada log terpusat antara Vercel dan Apps Script, kesulitan menelusuri kegagalan yang berasal dari sisi mana | Waktu debugging bertambah saat terjadi kegagalan | Sertakan `action` dan `cabangId` pada setiap log Apps Script (`Logger.log` atau Stackdriver), serta log request/response pada API Route Vercel |

## 15. Kemungkinan Pengembangan Lanjutan

Bagian ini bersifat informatif, tidak termasuk scope pengerjaan dokumen ini.

1. Penggantian API key tunggal dengan autentikasi berbasis pengguna (misalnya token per PIC cabang), jika hak akses berjenjang antar cabang pada akhirnya dibutuhkan.
2. Caching response API tertentu (misalnya `getCabangList` atau `getMasterItems`) pada sisi API Route Vercel untuk mengurangi jumlah request langsung ke Apps Script.
3. Rate limiting pada API Route Vercel sebagai lapisan tambahan sebelum request mencapai Apps Script.
4. Observability tambahan seperti logging terstruktur yang dikirim ke layanan pihak ketiga, memudahkan pemantauan tanpa harus membuka Apps Script Editor.

## 16. Kriteria Selesai

1. Seluruh fungsi pada bagian 12 PRD sebelumnya dapat diakses sebagai endpoint API sesuai pemetaan pada bagian 8, dan menghasilkan response JSON sesuai format pada bagian 9.
2. Validasi API key berjalan pada setiap request ke Apps Script; request tanpa kunci yang benar selalu ditolak dengan kode `UNAUTHORIZED`.
3. Tidak ada API key yang terlihat pada kode atau network request yang dapat diakses dari browser pengguna.
4. Seluruh halaman pada bagian 11 berjalan penuh di Vercel, memanggil API Route, tanpa satu pun bagian aplikasi yang memuat halaman dari `HtmlService` Apps Script.
5. Seluruh file HTML, CSS, dan JavaScript sisi klien pada proyek Apps Script sudah dihapus, deployment Web App Apps Script yang aktif hanya melayani `doGet`/`doPost` berbasis JSON.
6. Fungsi Submit SO, generate PDF, dan share WhatsApp tetap berjalan dengan benar melalui alur Vercel-ke-Apps Script, tanpa penyimpangan hasil dibandingkan versi Apps Script HTML lama.
7. Tidak ada URL Web App Apps Script versi lama yang masih dibagikan sebagai jalur akses aplikasi kepada pengguna akhir.
