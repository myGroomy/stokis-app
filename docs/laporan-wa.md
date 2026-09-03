# Panduan Aplikasi Stokis untuk Manager

Pesan untuk manager. Copy paste ke WhatsApp atau kirim sebagai dokumen.

---

Pak, ini aplikasi Stokis yang sudah jadi. Aplikasi ini buat catat stok harian semua cabang. Datanya otomatis tersimpan di Google Sheets dan laporan Excel bisa langsung diunduh dari aplikasi.

Saya jelaskan cara pakainya satu per satu ya Pak.

---

## 1. Login

Pak, buka link aplikasi yang sudah saya kirim. Nanti muncul halaman login seperti ini.

![Login Page](screenshots/login.png)

Masukkan username dan PIN yang sudah saya daftarkan. Klik tombol "Masuk". Setelah itu Pak akan langsung masuk ke halaman utama.

Berikut contoh tampilan setelah username dan PIN terisi.

![Login Terisi](screenshots/login-filled.png)

---

## 2. Setelah Login

Setelah berhasil login, Pak akan langsung masuk ke halaman Input Stock Opname. Di bagian atas ada navbar untuk navigasi ke berbagai menu. Di pojok kanan atas ada dropdown untuk memilih cabang.

![Halaman Utama](screenshots/home-after-login.png)

---

## 3. Ganti Cabang

Pak, kalau mau lihat atau input stok cabang tertentu, pilih cabangnya dulu di dropdown pojok kanan atas (lihat gambar nomor 2 di atas). Klik dropdown lalu pilih nama cabang yang diinginkan.

Semua data yang tampil akan otomatis menyesuaikan dengan cabang yang dipilih. Stok cabang A tidak tercampur dengan stok cabang B. Aman Pak, datanya terisolasi per cabang.

---

## 4. Input Stock Opname

Pak, ini yang paling sering dipakai. Klik menu "Input SO" di bagian atas. Nanti muncul halaman seperti ini. Pilih tanggal operasional dan shiftnya (Opening atau Closing).

![Form Input SO](screenshots/input-so.png)

Setelah itu, isi jumlah stok setiap barang. Perhatikan ada dua kolom:

- Kolom "Step 1" = isi jumlah stok yang masih dalam kemasan utuh, misal masih segel atau masih dalam dus
- Kolom "Step 2" = isi jumlah stok yang sudah dibuka atau sisa di rak

Contoh Pak: kalau ada 3 dus beras masih segel dan 5 kg beras sisa di rak, maka Step 1 diisi 3 dan Step 2 diisi 5.

Berikut tampilan lengkap form input SO nya.

![Step 1 dan Step 2](screenshots/step1-step2.png)

Kalau semua barang sudah terisi, scroll ke bawah lalu klik tombol "Simpan & Buat Laporan". Aplikasi akan otomatis menghitung selisih stok dan menentukan status setiap barang.

Status barang ditentukan oleh sistem:
- Warna merah = Kritis, stok di bawah batas minimum, segera pesan
- Warna kuning = Hampir Habis, stok mendekati batas minimum
- Warna hijau = Aman, stok mencukupi

---

## 5. Lihat Laporan

Pak, untuk melihat semua laporan yang sudah dibuat, klik menu "Laporan" di bagian atas. Nanti muncul daftar semua laporan seperti ini. Di sini Pak bisa lihat tanggal, shift, dan petugas yang mengisi.

![Daftar Laporan](screenshots/laporan-list.png)

Untuk mengunduh laporan Excel, klik tombol "XLSX" di samping laporan yang diinginkan. File Excel akan langsung terunduh ke HP atau komputer Pak.

Isi laporan Excel nya berisi tabel perbandingan stok sebelumnya dengan stok sekarang. Kolom "Pemakaian" menunjukkan selisihnya dengan tanda plus (+) kalau bertambah atau minus (-) kalau berkurang. Warna status juga otomatis muncul di Excel.

---

## 6. Kirim Laporan ke Grup WhatsApp

Pak, kalau mau kirim laporan ke grup WhatsApp owner atau ke saya, caranya gampang. Di halaman laporan, klik tombol "WhatsApp" di samping laporan yang mau dikirim.

Nanti muncul template pesan yang sudah berisi ringkasan stok dan link untuk mengunduh file Excel. Tinggal klik "Salin Pesan" lalu paste ke grup WhatsApp. Link di dalam pesan akan langsung membuka file Excel yang bisa diunduh oleh siapa saja yang punya link.

---

## 7. Lihat Dashboard

Pak, kalau mau lihat gambaran besar stok secara cepat, klik menu "Dashboard" di bagian atas. Ada dua jenis dashboard.

Dashboard Harian menunjukkan grafik status stok untuk satu tanggal. Pak bisa lihat berapa barang yang kritis, hampir habis, dan aman dalam satu hari.

![Dashboard Harian](screenshots/dashboard-harian.png)

Dashboard Mingguan menunjukkan tren stok selama seminggu terakhir. Berguna untuk melihat pola konsumsi stok dari hari ke hari.

![Dashboard Mingguan](screenshots/dashboard-mingguan.png)

---

## 8. Tambah atau Edit Data Barang (Admin)

Pak, kalau ada barang baru atau mau edit data barang, klik menu "Item" di bagian atas. Menu ini hanya bisa diakses oleh admin.

![Master Item](screenshots/master-item.png)

Halaman master item seperti ini. Di sini ada daftar semua barang beserta data lengkapnya.

Untuk menambah barang baru, klik tombol "Tambah Item" di pojok kanan atas. Isi data barangnya:
- Nama Barang = nama produk
- Area = lokasi penempatan, misal "Meja Biru", "Freezer", "Meja Laci"
- Satuan = unit pengukuran, misal "kg", "pcs", "pax"
- Threshold = batas minimum stok. Kalau stok di bawah angka ini, status otomatis jadi Kritis

Untuk mengedit data barang yang sudah ada, langsung klik nama barangnya. Nanti muncul form edit. Ubah datanya lalu klik "Simpan".

Untuk menonaktifkan barang yang sudah tidak dipakai, klik ikon toggle di kolom "Aktif". Barang yang dinonaktifkan tidak akan muncul di form input SO.

---

## 9. Tambah Cabang Baru (Admin)

Pak, kalau ada cabang baru, tinggal klik menu "Cabang" di bagian atas.

![Cabang](screenshots/cabang.png)

Klik tombol "Tambah Cabang". Isi nama cabang, alamat, nama PIC, dan nomor WhatsApp cabang.

Setelah diklik "Simpan", sistem akan otomatis:
- Membuat spreadsheet baru untuk cabang tersebut di Google Sheets
- Membuat folder baru di Google Drive untuk menyimpan laporan Excel
- Menyalin semua master item dari template ke spreadsheet cabang baru

Jadi Pak tidak perlu setting ulang dari nol. Tinggal isi datanya, selesai.

---

## 10. Tambah Petugas Baru (Admin)

Pak, kalau ada petugas baru, klik menu "Petugas" di bagian atas.

![Petugas](screenshots/petugas.png)

Klik "Tambah Petugas". Isi data petugas:
- Username = nama untuk login
- PIN = 6 digit angka untuk login
- Nama lengkap
- Role = pilih "Admin" atau "Petugas"
- Cabang = pilih cabang yang bisa diakses petugas

Kalau role nya "Petugas", petugas hanya bisa mengisi stock opname dan melihat laporan. Kalau role nya "Admin", petugas bisa mengedit data barang, cabang, dan melihat semua fitur.

---

## 11. Dokumentasi

Pak, kalau butuh panduan lengkap, klik menu "Dokumentasi" di bagian atas. Semua cara pakai sudah ada di sini.

![Dokumentasi](screenshots/docs-index.png)

---

## 12. Tips Penggunaan

Pak, beberapa tips supaya data akurat:

1. Login sebelum jam operasional dimulai
2. Isi stock opname setiap hari secara konsisten, jangan skip
3. Periksa barang yang berwarna merah (kritis) dan segera lakukan pemesanan
4. Setelah selesai mengisi, kirim laporan via WhatsApp ke grup owner
5. Gunakan dashboard mingguan untuk melihat tren konsumsi stok

---

## 13. Tampilan di HP

Pak, aplikasi ini juga bisa diakses dari HP. Berikut tampilan login dan input SO di HP.

![Login di HP](screenshots/mobile-login.png)

![Input SO di HP](screenshots/mobile-input-so.png)

---

## Ringkasan Menu

| Menu | Fungsi | Siapa yang Bisa Akses |
|------|--------|----------------------|
| Input SO | Isi data stok harian | Semua user |
| Laporan | Lihat dan unduh laporan Excel | Semua user |
| Dashboard | Lihat grafik status stok | Semua user |
| Item | Tambah, edit, nonaktifkan barang | Admin saja |
| Cabang | Tambah dan kelola cabang | Admin saja |
| Petugas | Tambah dan kelola petugas | Admin saja |
| Dokumentasi | Panduan penggunaan | Semua user |

---

Pak, aplikasi Stokis sudah siap digunakan. Kalau ada pertanyaan atau kendala, langsung hubungi saya saja. Terima kasih Pak.
