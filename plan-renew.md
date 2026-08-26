# PRD: Sistem Stock Opname Multi Cabang dengan Isolasi Database dan Administrasi Tanpa Kode

## 1. Latar Belakang

Dokumen PRD sebelumnya, Sistem Stock Opname dengan Auto Generate PDF dan Share WhatsApp, merancang satu database tunggal di Google Sheets untuk satu toko. Implementasi aktual sistem, sebagaimana terlihat pada rencana refactor teknis yang lebih baru, sudah berkembang melampaui rancangan tersebut, termasuk penambahan konsep Cabang, fungsi setupCabang, dan folder Drive terpisah per cabang, yang sebelumnya berada di luar scope dokumen desain.

Dokumen ini menulis ulang rancangan sistem secara menyeluruh agar sinkron dengan arah pengembangan yang sudah berjalan, sekaligus menetapkan dua perubahan besar yang disengaja untuk tahap ini:

Pertama, setiap cabang memiliki spreadsheet data sendiri yang terpisah sepenuhnya dari cabang lain, bukan satu spreadsheet besar dengan kolom Cabang sebagai pembeda. Keputusan ini diambil karena volume data transaksi per cabang dapat tumbuh besar dalam jangka panjang, dan pemisahan penuh menghindari satu spreadsheet tunggal menjadi terlalu besar, lambat, atau berisiko tinggi jika terjadi kesalahan pada satu cabang memengaruhi cabang lain.

Kedua, seluruh proses administrasi operasional, yaitu menambah cabang baru, mengubah data karyawan, dan mengubah data item beserta threshold, harus dapat dilakukan oleh pemilik usaha yang tidak memiliki latar belakang teknis, sepenuhnya melalui antarmuka Web App atau spreadsheet, tanpa perlu membuka atau menyunting kode Apps Script sama sekali.

Dokumen ini menggantikan seluruh bagian arsitektur data dari PRD sebelumnya. Konsep shift, aturan status, dan mekanisme PDF serta WhatsApp tetap dipertahankan dengan penyesuaian mengikuti struktur data baru.

## 2. Tujuan

1. Memisahkan data transaksi setiap cabang ke dalam spreadsheet masing masing, sehingga pertumbuhan data satu cabang tidak memengaruhi performa atau ukuran data cabang lain.
2. Mempertahankan satu backend Apps Script tunggal yang melayani seluruh cabang, menghindari duplikasi kode dan mempermudah pemeliharaan jangka panjang.
3. Menyediakan mekanisme penambahan cabang baru yang sepenuhnya otomatis melalui form, termasuk pembuatan spreadsheet baru dan penyalinan struktur data yang diperlukan.
4. Menyediakan administrasi karyawan dan item, termasuk penambahan, pengubahan, dan penonaktifan, seluruhnya melalui antarmuka yang dapat digunakan pemilik usaha non teknis.
5. Memastikan seluruh keputusan desain dari PRD sebelumnya yang masih relevan, yaitu model dua shift, PDF otomatis, dan share WhatsApp, tetap berjalan konsisten pada arsitektur multi cabang.

## 3. Ruang Lingkup

### 3.1 Termasuk dalam Scope
- Struktur Registry pusat sebagai daftar seluruh cabang dan lokasi spreadsheet masing masing.
- Struktur spreadsheet per cabang, masing masing berisi salinan lengkap struktur tabel yang sama.
- Fungsi otomatis pembuatan spreadsheet cabang baru dari template, dipicu melalui form pada Web App.
- Administrasi karyawan melalui Web App, mencakup tambah, ubah, dan nonaktifkan, tanpa mengedit sheet secara langsung sebagai cara utama, meskipun edit langsung pada sheet tetap dimungkinkan sebagai jalur cadangan.
- Administrasi Master Item dan Threshold per cabang melalui Web App, dengan cara yang sama seperti administrasi karyawan.
- Penyesuaian mekanisme submitSO, generatePDF, dan seluruh fungsi backend lain agar sadar cabang, yaitu selalu beroperasi pada spreadsheet cabang yang benar sesuai sesi yang sedang berjalan.
- Mekanisme routing pada Apps Script yang menentukan spreadsheet cabang mana yang harus diakses berdasarkan cabang yang dipilih pengguna saat itu.

### 3.2 Tidak Termasuk dalam Scope
- Migrasi data cabang yang sudah ada dari struktur satu spreadsheet gabungan ke struktur multi spreadsheet. Jika diperlukan, migrasi data lama merupakan pekerjaan terpisah yang dilakukan sekali saat transisi, tidak dirancang detail pada dokumen ini.
- Laporan gabungan lintas cabang dalam satu tampilan, misalnya total penjualan seluruh cabang dalam satu dashboard. Setiap cabang tetap dilihat dan dilaporkan secara terpisah pada tahap ini, sesuai keputusan bahwa data cabang terisolasi.
- Hak akses berjenjang antara pemilik pusat dan penanggung jawab masing masing cabang. Pada tahap ini, siapa pun yang memiliki akses ke Web App dapat mengakses seluruh cabang yang terdaftar di Registry.
- Sinkronisasi Master Item otomatis antar cabang. Jika satu item ditambahkan di satu cabang, item tersebut tidak otomatis muncul di cabang lain, sesuai keputusan bahwa Master Item bersifat per cabang.
- Backup otomatis terjadwal untuk spreadsheet cabang, meskipun disebutkan sebagai kemungkinan pengembangan lanjutan.

## 4. Prinsip Arsitektur

1. Satu backend, banyak database. Kode Apps Script tetap berada pada satu proyek tunggal. Pemisahan terjadi pada tingkat data, bukan pada tingkat kode, sehingga perbaikan atau penambahan fitur cukup dilakukan sekali dan berlaku untuk seluruh cabang.
2. Registry sebagai peta, bukan tempat data operasional. Spreadsheet Registry hanya menyimpan daftar cabang dan referensi ke masing masing spreadsheet cabang. Tidak ada data transaksi, item, atau petugas yang tersimpan langsung di Registry.
3. Spreadsheet cabang bersifat mandiri dan lengkap. Setiap spreadsheet cabang berisi seluruh sheet yang diperlukan untuk operasional cabang tersebut secara independen, sehingga jika suatu saat satu cabang perlu dipindahkan, diarsipkan, atau dipisahkan sepenuhnya dari sistem, hal tersebut dapat dilakukan tanpa memengaruhi cabang lain.
4. Administrasi tanpa kode adalah prasyarat, bukan fitur tambahan. Setiap kebutuhan konfigurasi yang mungkin muncul secara rutin dalam operasional, seperti menambah cabang, menambah karyawan, atau menyesuaikan threshold, harus memiliki jalur antarmuka resmi sejak awal perancangan, bukan diserahkan sebagai penyesuaian manual pada spreadsheet atau kode di kemudian hari.
5. Template sebagai sumber kebenaran struktur. Struktur sheet pada setiap cabang baru berasal dari satu spreadsheet template tunggal yang dirawat terpisah. Perubahan struktur di masa depan dilakukan dengan memperbarui template, bukan mengubah satu per satu spreadsheet cabang yang sudah berjalan.

## 5. Struktur Registry Pusat

Registry adalah satu spreadsheet tunggal yang menjadi titik masuk sistem untuk mengetahui cabang apa saja yang ada dan di mana data masing masing berada.

### 5.1 Sheet: Daftar_Cabang

| Kolom | Nama Kolom | Tipe Data | Keterangan |
|---|---|---|---|
| A | Cabang_ID | Teks | Identifikasi unik cabang, format singkat seperti CBG001, dibuat otomatis saat cabang baru ditambahkan |
| B | Nama_Cabang | Teks | Nama yang tampil di seluruh antarmuka, contoh SO Bandung Malam |
| C | Alamat | Teks | Boleh kosong, informasi tambahan |
| D | Spreadsheet_ID | Teks | ID Google Sheets milik cabang tersebut, digunakan Apps Script untuk membuka spreadsheet yang benar |
| E | Folder_Drive_ID | Teks | ID folder Google Drive tempat PDF cabang tersebut disimpan |
| F | PIC_Nama | Teks | Nama penanggung jawab cabang, boleh kosong |
| G | Nomor_WA_Cabang | Teks | Nomor WhatsApp tujuan default untuk laporan cabang tersebut |
| H | Aktif | Boolean | Benar atau Salah, cabang yang sudah tidak beroperasi diset Salah, tidak dihapus, agar riwayat tetap tertelusur |
| I | Tanggal_Dibuat | Tanggal | Otomatis, kapan cabang tersebut didaftarkan |

### 5.2 Sheet: Template_Referensi

Satu baris tunggal berisi referensi ke spreadsheet template yang digunakan sebagai cetakan setiap kali cabang baru dibuat.

| Kolom | Nama Kolom | Tipe Data | Keterangan |
|---|---|---|---|
| A | Template_Spreadsheet_ID | Teks | ID Google Sheets template yang berisi seluruh sheet kosong dengan struktur baku |
| B | Template_Versi | Teks | Penanda versi struktur template, contoh v1, dinaikkan manual setiap kali template mengalami perubahan struktur |
| C | Terakhir_Diperbarui | Tanggal | Kapan template terakhir diubah |

### 5.3 Sheet: Settings_Global

Pengaturan yang berlaku untuk seluruh sistem, berbeda dari Settings per cabang yang akan dijelaskan pada bagian 6.

| Kolom | Nama Kolom | Tipe Data | Keterangan |
|---|---|---|---|
| A | Key | Teks | Nama pengaturan global |
| B | Value | Teks atau Angka | Nilai pengaturan |

Contoh baris:
- Key: Folder_Drive_Induk, Value: ID folder Google Drive tempat seluruh folder cabang berada
- Key: Nama_Sistem, Value: Sistem Stock Opname Multi Cabang

## 6. Struktur Spreadsheet Cabang

Setiap cabang memiliki satu spreadsheet independen dengan struktur berikut, seluruhnya identik antar cabang pada saat dibuat, mengikuti Template_Referensi.

### 6.1 Sheet: Master_Item

| Kolom | Nama Kolom | Tipe Data | Keterangan |
|---|---|---|---|
| A | Item_ID | Teks | Identifikasi unik item, unik dalam lingkup cabang tersebut, tidak perlu unik lintas cabang |
| B | Nama_Barang | Teks | Wajib unik dalam satu cabang |
| C | Area | Teks | Salah satu dari daftar area yang berlaku, dapat disesuaikan per cabang jika diperlukan pada pengembangan lanjutan, namun pada tahap ini menggunakan daftar tetap yang sama seperti PRD sebelumnya |
| D | Satuan | Teks | Contoh kg, gram, pcs, liter, tabung, kwh |
| E | Konversi_Isi | Angka | Boleh kosong |
| F | Konversi_Keterangan | Teks | Contoh 1 Plastik sama dengan 1 kg |
| G | Threshold | Angka | Batas minimum stok, khusus untuk cabang ini |
| H | Aktif | Boolean | Benar atau Salah |
| I | Tanggal_Dibuat | Tanggal | Otomatis |

### 6.2 Sheet: SO_Transaksi

Struktur identik dengan PRD sebelumnya, tidak lagi memerlukan kolom Cabang karena isolasi sudah terjadi pada tingkat spreadsheet, bukan pada tingkat baris.

| Kolom | Nama Kolom | Tipe Data | Keterangan |
|---|---|---|---|
| A | Transaksi_ID | Teks | Otomatis, format TRX000001, unik dalam lingkup cabang |
| B | Timestamp | Tanggal dan Waktu | Otomatis |
| C | Tanggal_Operasional | Tanggal | Dipilih petugas |
| D | Shift | Teks | Opening atau Closing |
| E | Item_ID | Teks | Merujuk Master_Item pada spreadsheet cabang yang sama |
| F | Nama_Barang | Teks | Disalin dari Master_Item |
| G | Area | Teks | Disalin dari Master_Item |
| H | Step1 | Angka | Hitungan stok utuh |
| I | Step2 | Angka | Hitungan stok terbuka |
| J | Total | Angka | Step1 ditambah Step2, disimpan sebagai nilai |
| K | Petugas | Teks | Dipilih dari daftar tetap pada sheet Petugas cabang yang sama |
| L | Sesi_ID | Teks | Identifikasi satu sesi input |

### 6.3 Sheet: Laporan_PDF

Struktur identik dengan PRD sebelumnya.

| Kolom | Nama Kolom | Tipe Data | Keterangan |
|---|---|---|---|
| A | Laporan_ID | Teks | Identifikasi unik laporan |
| B | Sesi_ID | Teks | Merujuk ke SO_Transaksi kolom L |
| C | Tanggal_Operasional | Tanggal | Disalin dari sesi terkait |
| D | Shift | Teks | Opening atau Closing |
| E | Petugas | Teks | Disalin dari sesi terkait |
| F | Waktu_Dibuat | Tanggal dan Waktu | Otomatis |
| G | Link_PDF | Teks | URL file PDF di folder Drive cabang tersebut |
| H | Jumlah_Kritis | Angka | Jumlah item berstatus Kritis |
| I | Jumlah_Hampir_Habis | Angka | Jumlah item berstatus Hampir Habis |
| J | Status_Kirim_WA | Teks | Belum Dikirim atau Sudah Dikirim |

### 6.4 Sheet: Petugas

| Kolom | Nama Kolom | Tipe Data | Keterangan |
|---|---|---|---|
| A | Petugas_ID | Teks | Identifikasi unik dalam lingkup cabang |
| B | Nama | Teks | Nama lengkap |
| C | Nomor_WA | Teks | Nomor WhatsApp petugas |
| D | Aktif | Boolean | Benar atau Salah |

### 6.5 Sheet: Settings

Pengaturan spesifik untuk cabang tersebut, berbeda dari Settings_Global pada Registry.

| Kolom | Nama Kolom | Tipe Data | Keterangan |
|---|---|---|---|
| A | Key | Teks | Nama pengaturan |
| B | Value | Teks atau Angka | Nilai pengaturan |

Contoh baris:
- Key: Daftar_Shift, Value: Opening, Closing
- Key: Kelipatan_Threshold_Hampir_Habis, Value: 2
- Key: Daftar_Area, Value: Meja Biru Depan, Chiller, Freezer Ayam dan Alat, Barang Alat dan Kebersihan, Meja Laci, Gas dan Utilitas

Nilai Nomor_WA_Owner, Folder_Drive_PDF, dan Nama_Toko yang pada PRD sebelumnya berada di Settings, sekarang dipindahkan ke sheet Daftar_Cabang pada Registry, karena nilai tersebut merupakan atribut cabang, bukan pengaturan operasional harian.

## 7. Mekanisme Routing Multi Cabang

### 7.1 Cara Kerja Routing

Setiap kali pengguna membuka Web App, langkah pertama adalah memilih cabang dari daftar yang diambil dari Registry sheet Daftar_Cabang. Pilihan cabang ini menjadi bagian dari sesi pengguna pada Web App, disimpan pada sisi klien selama sesi berlangsung.

Setiap pemanggilan fungsi backend yang memerlukan akses data operasional, seperti submitSO, getMasterItems, atau getDashboardHarian, menyertakan Cabang_ID sebagai parameter. Apps Script menggunakan Cabang_ID tersebut untuk mencari Spreadsheet_ID yang sesuai pada Registry, kemudian membuka spreadsheet tersebut menggunakan Spreadsheet_ID itu untuk membaca atau menulis data.

### 7.2 Cache Referensi Spreadsheet

Karena pencarian Spreadsheet_ID dari Cabang_ID pada Registry akan terjadi berulang kali dalam satu sesi penggunaan, Apps Script menyimpan hasil pencarian tersebut dalam cache sementara selama satu eksekusi fungsi, menghindari pembacaan berulang ke Registry dalam satu alur kerja yang sama. Cache ini bersifat sementara dan tidak disimpan permanen, mengikuti sifat eksekusi Apps Script yang memulai ulang setiap kali dipanggil.

### 7.3 Penanganan Cabang Tidak Ditemukan atau Tidak Aktif

Jika Cabang_ID yang diterima tidak ditemukan pada Registry, atau ditemukan namun berstatus Aktif bernilai Salah, seluruh fungsi backend yang bergantung pada cabang tersebut mengembalikan pesan kesalahan yang jelas kepada Web App, dan Web App menampilkan pesan tersebut kepada pengguna tanpa melanjutkan proses.

## 8. Fitur Tambah Cabang Baru Tanpa Kode

### 8.1 Alur Kerja

1. Pemilik usaha membuka halaman Administrasi Cabang pada Web App.
2. Pemilik usaha menekan tombol Tambah Cabang Baru, mengisi form berisi Nama_Cabang, Alamat, PIC_Nama, dan Nomor_WA_Cabang.
3. Pemilik usaha menekan tombol Simpan.
4. Apps Script menjalankan fungsi createCabang, yang melakukan langkah berikut secara berurutan: membaca Template_Spreadsheet_ID dari Registry sheet Template_Referensi, menyalin spreadsheet template tersebut menjadi spreadsheet baru menggunakan layanan Drive bawaan Apps Script, memberi nama spreadsheet baru sesuai Nama_Cabang, membuat folder baru pada Google Drive untuk menyimpan PDF cabang tersebut di dalam folder induk yang ditentukan pada Settings_Global, mencatat baris baru pada Registry sheet Daftar_Cabang dengan Spreadsheet_ID dan Folder_Drive_ID yang baru dibuat.
5. Setelah seluruh langkah berhasil, Web App menampilkan konfirmasi bahwa cabang baru sudah siap digunakan, dan cabang tersebut langsung muncul pada daftar pilihan cabang di halaman utama Web App.

### 8.2 Penanganan Kegagalan Sebagian

Karena proses ini melibatkan beberapa langkah berurutan yang masing masing dapat gagal, misalnya penyalinan spreadsheet berhasil namun pembuatan folder gagal, Apps Script mencatat setiap langkah yang berhasil sebelum melanjutkan ke langkah berikutnya. Jika terjadi kegagalan di tengah proses, Web App menampilkan pesan kesalahan yang menyebutkan langkah mana yang gagal, dan pemilik usaha dapat mencoba kembali. Apps Script memeriksa apakah spreadsheet atau folder untuk cabang tersebut sudah pernah dibuat sebagian sebelum mengulang, untuk menghindari duplikasi jika percobaan diulang.

## 9. Administrasi Tanpa Kode

Prinsip umum pada bagian ini berlaku untuk seluruh jenis administrasi yang dijelaskan di bawah. Setiap operasi hanya memerlukan pengguna mengisi form pada Web App dan menekan tombol simpan. Tidak ada langkah yang mengharuskan pengguna membuka Apps Script Editor, mengubah kode, atau menjalankan fungsi secara manual dari editor.

### 9.1 Administrasi Karyawan

Dilakukan pada halaman Administrasi Karyawan, tersedia untuk cabang yang sedang dipilih.

Kemampuan yang tersedia:
- Menambah petugas baru, mengisi Nama dan Nomor_WA, sistem otomatis membuat Petugas_ID dan menyimpan baris baru pada sheet Petugas milik cabang yang sedang dipilih.
- Mengubah data petugas yang sudah ada, misalnya memperbarui Nomor_WA.
- Menonaktifkan petugas, mengubah Aktif menjadi Salah tanpa menghapus baris, sehingga riwayat transaksi lama yang melibatkan petugas tersebut tetap dapat ditelusuri dengan nama yang benar.

### 9.2 Administrasi Master Item dan Threshold

Dilakukan pada halaman Master Item, tersedia untuk cabang yang sedang dipilih, konsisten dengan keputusan bahwa Master Item bersifat per cabang.

Kemampuan yang tersedia:
- Menambah item baru, mengisi Nama_Barang, Area, Satuan, Konversi, dan Threshold awal.
- Mengubah Threshold item yang sudah ada, perubahan langsung berlaku untuk perhitungan status berikutnya tanpa memerlukan langkah tambahan apa pun.
- Menonaktifkan item, mengubah Aktif menjadi Salah tanpa menghapus baris.

### 9.3 Administrasi Cabang

Dilakukan pada halaman Administrasi Cabang, sebagaimana dijelaskan pada bagian 8, ditambah kemampuan berikut yang tersedia setelah cabang terdaftar:
- Mengubah data cabang yang sudah ada, seperti Alamat, PIC_Nama, atau Nomor_WA_Cabang.
- Menonaktifkan cabang, mengubah Aktif pada Daftar_Cabang menjadi Salah. Cabang yang dinonaktifkan tidak lagi muncul pada pilihan cabang di halaman utama Web App, namun data dan spreadsheetnya tidak dihapus dan tetap dapat diakses melalui tautan langsung oleh pemilik usaha jika diperlukan.

### 9.4 Prinsip Validasi Form

Setiap form administrasi memvalidasi input sebelum menyimpan, mengikuti aturan yang sama seperti validasi pada submitSO di PRD sebelumnya, yaitu Apps Script melakukan validasi ulang pada sisi backend meskipun Web App sudah melakukan validasi pada sisi tampilan, sehingga data yang tersimpan tetap terjaga kebenarannya meskipun ada kesalahan pada sisi tampilan.

## 10. Aturan Perhitungan Status

Tidak berubah dari PRD sebelumnya. Status dihitung berdasarkan Total pada satu sesi dibandingkan Threshold pada Master_Item milik cabang yang sama, dengan hasil Kritis, Hampir Habis, Aman, atau Tidak Dipantau. Karena Threshold sekarang bersifat per cabang, dua cabang dapat memiliki status berbeda untuk item dengan nama yang sama meskipun jumlah stok yang tercatat kebetulan sama, karena Threshold masing masing berbeda.

## 11. Alur Perbandingan Data

Tidak berubah secara konsep dari PRD sebelumnya. PDF Opening dibandingkan dengan Closing hari sebelumnya, PDF Closing dibandingkan dengan Opening hari ini, seluruhnya diambil dari SO_Transaksi pada spreadsheet cabang yang sama dengan sesi yang sedang diproses. Data pembanding tidak pernah diambil lintas cabang.

## 12. Fungsi Backend Apps Script

| Nama Fungsi | Fungsi | Dipanggil Oleh |
|---|---|---|
| getCabangList | Mengambil seluruh cabang aktif dari Registry sheet Daftar_Cabang | Web App saat halaman utama dibuka, untuk mengisi pilihan cabang |
| resolveCabangSpreadsheet_ | Menerima Cabang_ID, mencari Spreadsheet_ID pada Registry, mengembalikan referensi objek spreadsheet yang sudah terbuka, menggunakan cache sesuai bagian 7.2 | Dipanggil internal oleh seluruh fungsi lain yang memerlukan akses data cabang |
| createCabang | Menerima Nama_Cabang, Alamat, PIC_Nama, Nomor_WA_Cabang, menjalankan alur pada bagian 8.1, mengembalikan Cabang_ID baru jika berhasil | Web App halaman Administrasi Cabang |
| updateCabang | Menerima Cabang_ID dan data yang diperbarui, memperbarui baris terkait pada Daftar_Cabang | Web App halaman Administrasi Cabang |
| setCabangActive | Menerima Cabang_ID dan status Aktif baru, memperbarui Daftar_Cabang | Web App halaman Administrasi Cabang |
| getMasterItems | Menerima Cabang_ID, menggunakan resolveCabangSpreadsheet_, mengambil seluruh item aktif dari Master_Item pada spreadsheet cabang tersebut | Web App saat form dibuka |
| addItem | Menerima Cabang_ID dan data item baru, menyimpan ke Master_Item pada spreadsheet cabang yang sesuai | Web App halaman Master Item |
| updateThreshold | Menerima Cabang_ID, Item_ID, dan Threshold baru, memperbarui Master_Item pada spreadsheet cabang yang sesuai | Web App halaman Master Item |
| setItemActive | Menerima Cabang_ID, Item_ID, dan status Aktif baru | Web App halaman Master Item |
| getPetugasList | Menerima Cabang_ID, mengambil daftar petugas aktif dari spreadsheet cabang tersebut | Web App saat form dibuka |
| addPetugas | Menerima Cabang_ID dan data petugas baru, menyimpan ke sheet Petugas pada spreadsheet cabang yang sesuai | Web App halaman Administrasi Karyawan |
| updatePetugas | Menerima Cabang_ID, Petugas_ID, dan data yang diperbarui | Web App halaman Administrasi Karyawan |
| setPetugasActive | Menerima Cabang_ID, Petugas_ID, dan status Aktif baru | Web App halaman Administrasi Karyawan |
| submitSO | Menerima Cabang_ID dan data seluruh item pada satu sesi, menggunakan resolveCabangSpreadsheet_, menyimpan ke SO_Transaksi pada spreadsheet cabang yang sesuai | Web App saat petugas menekan tombol Simpan |
| calculateStatus | Menghitung status berdasarkan Total dan Threshold, Threshold diambil dari Master_Item pada spreadsheet cabang yang sesuai | Dipanggil internal |
| getDataPembanding | Mengambil data sesi pembanding dari SO_Transaksi pada spreadsheet cabang yang sama dengan sesi yang sedang diproses | Dipanggil internal oleh generatePDF |
| generatePDF | Menyusun dan menyimpan PDF ke Folder_Drive_ID milik cabang yang bersangkutan sesuai Daftar_Cabang, mencatat ke Laporan_PDF pada spreadsheet cabang tersebut | Dipanggil internal oleh submitSO |
| getShareWhatsAppLink | Menyusun tautan wa.me menggunakan Nomor_WA_Cabang sebagai tujuan default, diambil dari Daftar_Cabang | Web App halaman konfirmasi laporan |
| updateStatusKirimWA | Memperbarui Status_Kirim_WA pada Laporan_PDF milik cabang yang sesuai | Web App halaman konfirmasi laporan |
| searchLaporan | Menerima Cabang_ID dan parameter pencarian, mengambil dari Laporan_PDF pada spreadsheet cabang tersebut | Web App halaman Riwayat Laporan |
| getDashboardHarian | Menerima Cabang_ID dan Tanggal_Operasional, mengambil dan menghitung ringkasan dari spreadsheet cabang tersebut | Web App Dashboard Harian |
| getDashboardMingguan | Menerima Cabang_ID dan rentang tanggal, mengambil dan menghitung tren dari spreadsheet cabang tersebut | Web App Dashboard Mingguan |

## 13. Rancangan Web App

### 13.1 Halaman Pemilihan Cabang

Halaman pertama yang tampil saat Web App dibuka. Menampilkan daftar cabang aktif dari getCabangList sebagai pilihan. Setelah cabang dipilih, Cabang_ID disimpan pada sesi Web App dan digunakan untuk seluruh halaman berikutnya selama sesi berlangsung. Terdapat tombol untuk berpindah cabang kapan saja tanpa perlu menutup Web App.

### 13.2 Halaman Input SO

Sama seperti PRD sebelumnya, seluruh data yang ditampilkan, yaitu daftar item dan daftar petugas, bersumber dari spreadsheet cabang yang sedang dipilih.

### 13.3 Halaman Konfirmasi Laporan

Tidak berubah dari PRD sebelumnya, dengan Link_PDF dan tujuan WhatsApp default mengikuti data cabang yang sedang dipilih.

### 13.4 Halaman Riwayat Laporan

Tidak berubah secara fungsi dari PRD sebelumnya, menampilkan data dari cabang yang sedang dipilih. Tidak menampilkan data lintas cabang sekaligus, sesuai batasan pada bagian 3.2.

### 13.5 Halaman Master Item

Tidak berubah secara fungsi, menampilkan dan mengubah data pada spreadsheet cabang yang sedang dipilih.

### 13.6 Halaman Administrasi Karyawan

Halaman baru, sebagaimana dijelaskan pada bagian 9.1.

### 13.7 Halaman Administrasi Cabang

Halaman baru, sebagaimana dijelaskan pada bagian 8 dan 9.3. Halaman ini menampilkan seluruh cabang, termasuk yang tidak aktif, berbeda dari Halaman Pemilihan Cabang yang hanya menampilkan cabang aktif.

## 14. Template Spreadsheet Cabang

Template adalah satu spreadsheet yang dirawat terpisah dari spreadsheet cabang mana pun, berisi seluruh sheet pada bagian 6 dalam keadaan kosong, lengkap dengan header kolom, format kolom, dan validasi data yang diperlukan, namun tanpa data transaksi maupun data item.

Perubahan struktur di masa depan, misalnya penambahan kolom baru pada SO_Transaksi, dilakukan dengan memperbarui Template terlebih dahulu, kemudian menerapkan perubahan yang sama secara manual atau melalui fungsi migrasi terpisah ke seluruh spreadsheet cabang yang sudah berjalan. Pekerjaan migrasi struktur pada cabang yang sudah berjalan berada di luar scope dokumen ini, disebutkan sebagai konsekuensi yang perlu disadari dari pendekatan template.

## 15. Gas dan Utilitas

Tidak berubah dari PRD sebelumnya, tetap sebagai baris biasa pada Master_Item dengan Area bernilai Gas dan Utilitas, khusus untuk cabang yang bersangkutan.

## 16. Batasan dan Risiko

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Jumlah cabang bertambah banyak, jumlah pemanggilan resolveCabangSpreadsheet_ meningkat | Setiap pembukaan spreadsheet cabang oleh Apps Script memerlukan waktu, performa keseluruhan bisa menurun jika satu eksekusi fungsi harus membuka banyak spreadsheet berbeda | Cache referensi spreadsheet dalam satu eksekusi sesuai bagian 7.2, hindari mengambil data lintas banyak cabang sekaligus dalam satu fungsi, konsisten dengan keputusan tidak ada laporan gabungan lintas cabang pada tahap ini |
| Proses createCabang gagal di tengah jalan | Bisa menyisakan spreadsheet atau folder yang sudah terbuat namun belum tercatat di Registry, berpotensi duplikat jika dicoba ulang tanpa pemeriksaan | Terapkan pemeriksaan sebelum mengulang sesuai bagian 8.2, catat setiap langkah yang berhasil |
| Template berubah setelah banyak cabang sudah berjalan | Cabang lama tidak otomatis mendapat struktur baru dari template yang diperbarui | Disadari sebagai konsekuensi arsitektur pada bagian 14, siapkan proses migrasi terpisah jika perubahan struktur benar benar diperlukan |
| Spreadsheet_ID pada Registry salah atau spreadsheet telah dihapus dari Drive | Seluruh fungsi untuk cabang tersebut gagal | Tangani sebagai kondisi pada bagian 7.3, tampilkan pesan jelas, jangan biarkan Web App gagal tanpa keterangan |
| Pemilik usaha menghapus spreadsheet cabang secara tidak sengaja langsung dari Google Drive, di luar kendali Web App | Data cabang tersebut hilang, Registry masih mencatat Spreadsheet_ID yang sudah tidak valid | Edukasi pengguna melalui dokumentasi penggunaan bahwa spreadsheet cabang tidak boleh dihapus manual, gunakan tombol Nonaktifkan Cabang pada Web App sebagai gantinya |
| Batas jumlah spreadsheet yang dapat dibuka Apps Script dalam satu akun Google dalam periode tertentu | Jika jumlah cabang sangat banyak, kuota Apps Script terkait operasi Drive dan Spreadsheet dapat tersentuh | Pantau kuota secara berkala, dipertimbangkan lebih lanjut jika jumlah cabang mendekati puluhan |

## 17. Kemungkinan Pengembangan Lanjutan

Bagian ini bersifat informatif, tidak termasuk scope pengerjaan dokumen ini.

1. Dashboard gabungan lintas cabang untuk pemilik usaha yang mengelola banyak cabang sekaligus, mengambil ringkasan dari setiap spreadsheet cabang tanpa menggabungkan data mentahnya menjadi satu tempat.
2. Hak akses berjenjang, membedakan pemilik pusat yang dapat melihat seluruh cabang dengan penanggung jawab cabang yang hanya dapat mengakses cabangnya sendiri.
3. Backup otomatis terjadwal untuk seluruh spreadsheet cabang ke lokasi Drive terpisah, dipicu oleh time based trigger pada Apps Script.
4. Fungsi migrasi struktur otomatis, menerapkan perubahan pada Template ke seluruh spreadsheet cabang yang sudah berjalan tanpa campur tangan manual.
5. Sinkronisasi sebagian Master Item antar cabang, misalnya untuk item yang secara bisnis memang seharusnya sama di seluruh cabang, sambil tetap mengizinkan Threshold berbeda per cabang.

## 18. Kriteria Selesai

1. Registry spreadsheet tersusun sesuai struktur pada bagian 5, dan dapat diakses oleh Apps Script untuk membaca daftar cabang.
2. Fungsi createCabang berhasil membuat spreadsheet baru dari template, membuat folder Drive baru, dan mencatat cabang baru pada Daftar_Cabang, seluruhnya melalui form pada Web App tanpa menyentuh Apps Script Editor.
3. Fungsi resolveCabangSpreadsheet_ berhasil mengarahkan seluruh fungsi backend ke spreadsheet cabang yang benar berdasarkan Cabang_ID yang dipilih pengguna.
4. Halaman Administrasi Karyawan dapat menambah, mengubah, dan menonaktifkan petugas pada cabang yang sedang dipilih, seluruhnya melalui Web App.
5. Halaman Master Item dapat menambah, mengubah Threshold, dan menonaktifkan item pada cabang yang sedang dipilih, seluruhnya melalui Web App.
6. Submit SO, generate PDF, dan share WhatsApp tetap berfungsi dengan benar pada arsitektur multi cabang, masing masing beroperasi pada data cabang yang sesuai tanpa tercampur dengan cabang lain.
7. Menonaktifkan satu cabang melalui Web App membuat cabang tersebut tidak lagi muncul pada Halaman Pemilihan Cabang, namun data dan spreadsheetnya tetap ada dan dapat diakses langsung jika diperlukan.
8. Tidak ada satu pun kebutuhan administrasi rutin, yaitu tambah cabang, tambah atau ubah karyawan, dan tambah atau ubah item beserta threshold, yang mengharuskan pengguna membuka Apps Script Editor.