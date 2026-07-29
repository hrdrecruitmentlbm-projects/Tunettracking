# TuTrack - Panduan Pengguna Tunet Division

**Versi:** 1.0
**Terakhir diperbarui:** Juni 2026

---

## Daftar Isi

- [BAGIAN 1: Pendahuluan (General Intro)](#bagian-1-pendahuluan)
  - [1.1 Apa itu TuTrack](#11-apa-itu-tutrack)
  - [1.2 Akses Aplikasi](#12-akses-aplikasi)
  - [1.3 Login dengan PIN](#13-login-dengan-pin)
  - [1.4 Navigasi Sidebar](#14-navigasi-sidebar)
  - [1.5 Notifikasi](#15-notifikasi)
  - [1.6 Pengaturan (Settings)](#16-pengaturan-settings)
  - [1.7 Logout](#17-logout)
- [BAGIAN 2: Admin](#bagian-2-admin)
  - [2.1 Dashboard Admin](#21-dashboard-admin)
  - [2.2 Manajemen Tim (User CRUD)](#22-manajemen-tim-user-crud)
  - [2.3 Papan Tugas (Kanban Board)](#23-papan-tugas-kanban-board)
  - [2.4 Manajemen Tag](#24-manajemen-tag)
  - [2.5 Absensi (Attendance Overview)](#25-absensi-attendance-overview)
  - [2.6 Peta Radar](#26-peta-radar)
  - [2.7 Manajemen Marketing](#27-manajemen-marketing)
- [BAGIAN 3: NOC](#bagian-3-noc)
  - [3.1 Dashboard NOC](#31-dashboard-noc)
  - [3.2 Papan Tugas](#32-papan-tugas)
  - [3.3 Peta Radar](#33-peta-radar)
  - [3.4 Absensi](#34-absensi)
- [BAGIAN 4: FOC](#bagian-4-foc)
  - [4.1 Dashboard FOC](#41-dashboard-foc)
    - [4.1.1 Membuka Dashboard FOC](#411-membuka-dashboard-foc)
    - [4.1.2 Memahami Tata Letak Dashboard FOC](#412-memahami-tata-letak-dashboard-foc)
    - [4.1.3 Bar Navigasi Bawah (Mobile)](#413-bar-navigasi-bawah-mobile)
    - [4.1.4 Melihat Kartu Berbagi Lokasi GPS](#414-melihat-kartu-berbagi-lokasi-gps)
    - [4.1.5 Melihat Daftar Tugas Aktif](#415-melihat-daftar-tugas-aktif)
    - [4.1.6 Melihat Daftar Tugas Selesai](#416-melihat-daftar-tugas-selesai)
    - [4.1.7 Melihat Status Kosong (Empty State)](#417-melihat-status-kosong-empty-state)
    - [4.1.8 Membuka Detail Tugas dari Dashboard](#418-membuka-detail-tugas-dari-dashboard)
  - [4.2 Tugas Saya (My Tasks)](#42-tugas-saya-my-tasks)
    - [4.2.1 Membuka Halaman Tugas Saya](#421-membuka-halaman-tugas-saya)
    - [4.2.2 Memahami Kartu Tugas](#422-memahami-kartu-tugas)
    - [4.2.3 Mengubah Status Tugas (Alur Kerja)](#423-mengubah-status-tugas-alur-kerja)
    - [4.2.4 Melihat Detail Tugas](#424-melihat-detail-tugas)
    - [4.2.5 Membuka Lokasi Tugas di Peta](#425-membuka-lokasi-tugas-di-peta)
    - [4.2.6 Memahami Batasan Akses FOC di Papan Tugas](#426-memahami-batasan-akses-foc-di-papan-tugas)
  - [4.3 Berbagi Lokasi (GPS Sharing)](#43-berbagi-lokasi-gps-sharing)
    - [4.3.1 Mengaktifkan Berbagi Lokasi](#431-mengaktifkan-berbagi-lokasi)
    - [4.3.2 Memahami Pembaruan Otomatis](#432-memahami-pembaruan-otomatis)
    - [4.3.3 Memperbarui Lokasi Secara Manual](#433-memperbarui-lokasi-secara-manual)
    - [4.3.4 Mengintegrasikan dengan Telegram Bot](#434-mengintegrasikan-dengan-telegram-bot)
    - [4.3.5 Menonaktifkan Berbagi Lokasi](#435-menonaktifkan-berbagi-lokasi)
    - [4.3.6 Troubleshooting Berbagi Lokasi](#436-troubleshooting-berbagi-lokasi)
  - [4.4 Absensi (Berangkat/Pulang)](#44-absensi-berangkatpulang)
    - [4.4.1 Membuka Halaman Absensi](#441-membuka-halaman-absensi)
    - [4.4.2 Mencatat Kehadiran Berangkat (Check-in)](#442-mencatat-kehadiran-berangkat-check-in)
    - [4.4.3 Mencatat Kehadiran Pulang (Check-out)](#443-mencatat-kehadiran-pulang-check-out)
    - [4.4.4 Memahami Aturan Kehadiran](#444-memahami-aturan-kehadiran)
    - [4.4.5 Melihat Riwayat Absensi](#445-melihat-riwayat-absensi)
    - [4.4.6 Melihat Detail Kehadiran](#446-melihat-detail-kehadiran)
    - [4.4.7 Melihat Statistik Kehadiran](#447-melihat-statistik-kehadiran)
  - [4.5 Peta](#45-peta)
    - [4.5.1 Membuka Halaman Peta](#451-membuka-halaman-peta)
    - [4.5.2 Memahami Pin di Peta](#452-memahami-pin-di-peta)
    - [4.5.3 Melihat Posisi Sendiri](#453-melihat-posisi-sendiri)
    - [4.5.4 Melihat Lokasi Tugas di Peta](#454-melihat-lokasi-tugas-di-peta)
    - [4.5.5 Melihat Anggota Tim Lainnya](#455-melihat-anggota-tim-lainnya)
    - [4.5.6 Menyaring Pin di Peta](#456-menyaring-pin-di-peta)
    - [4.5.7 Mencari Pengguna atau Tugas di Peta](#457-mencari-pengguna-atau-tugas-di-peta)
    - [4.5.8 Zoom dan Navigasi Peta](#458-zoom-dan-navigasi-peta)
    - [4.5.9 Melihat Rute Perjalanan](#459-melihat-rute-perjalanan)
- [BAGIAN 5: Marketing](#bagian-5-marketing)
  - [5.1 Dashboard Marketing](#51-dashboard-marketing)
  - [5.2 Prospek (CRUD + Status Tracking)](#52-prospek-crud--status-tracking)
  - [5.3 Tower Sites](#53-tower-sites)
  - [5.4 Kunjungan (Visit Logging)](#54-kunjungan-visit-logging)
  - [5.5 Peta](#55-peta)
- [BAGIAN 6: Troubleshooting / FAQ](#bagian-6-troubleshooting--faq)
  - [6.1 Login Issues](#61-login-issues)
    - [6.1.1 PIN Tidak Berfungsi](#611-pin-tidak-berfungsi)
    - [6.1.2 Pesan "Akun Tidak Aktif"](#612-pesan-akun-tidak-aktif)
    - [6.1.3 Masalah Kompatibilitas Browser](#613-masalah-kompatibilitas-browser)
    - [6.1.4 Masalah Koneksi Jaringan](#614-masalah-koneksi-jaringan)
  - [6.2 Session Expired](#62-session-expired)
    - [6.2.1 Sesi Berakhir Setelah 50 Menit](#621-sesi-berakhir-setelah-50-menit)
    - [6.2.2 Cara Menghindari Sesi Berakhir](#622-cara-menghindari-sesi-berakhir)
    - [6.2.3 Data yang Hilang Saat Sesi Berakhir](#623-data-yang-hilang-saat-sesi-berakhir)
  - [6.3 Location Sharing Problems](#63-location-sharing-problems)
    - [6.3.1 GPS Tidak Berfungsi di Browser](#631-gps-tidak-berfungsi-di-browser)
    - [6.3.2 Lokasi Tidak Terupdate di Peta](#632-lokasi-tidak-terupdate-di-peta)
    - [6.3.3 Telegram Bot Tidak Terhubung](#633-telegram-bot-tidak-terhubung)
    - [6.3.4 Pembaruan Lokasi Manual Tidak Berfungsi](#634-pembaruan-lokasi-manual-tidak-berfungsi)
  - [6.4 Task Board Issues](#64-task-board-issues)
    - [6.4.1 Tugas Tidak Muncul di Papan Tugas](#641-tugas-tidak-muncul-di-papan-tugas)
    - [6.4.2 Drag and Drop Tidak Berfungsi](#642-drag-and-drop-tidak-berfungsi)
    - [6.4.3 Tugas Tidak Ditemukan dengan Pencarian](#643-tugas-tidak-ditemukan-dengan-pencarian)
    - [6.4.4 Status Tugas Tidak Bisa Diubah](#644-status-tugas-tidak-bisa-diubah)
  - [6.5 Map Not Loading](#65-map-not-loading)
    - [6.5.1 Peta Tampil Kosong (Blank Map)](#651-peta-tampil-kosong-blank-map)
    - [6.5.2 Tile Peta Tidak Memuat](#652-tile-peta-tidak-memuat)
    - [6.5.3 Pin Anggota Tim Tidak Muncul](#653-pin-anggota-tim-tidak-muncul)
    - [6.5.4 Garis Route Tidak Muncul](#654-garis-route-tidak-muncul)
  - [6.6 Photo Upload Issues](#66-photo-upload-issues)
    - [6.6.1 Kamera Tidak Berfungsi](#661-kamera-tidak-berfungsi)
    - [6.6.2 Foto Terlalu Besar](#662-foto-terlalu-besar)
    - [6.6.3 Upload Foto Gagal](#663-upload-foto-gagal)
    - [6.6.4 Sesi Upload Foto Berakhir](#664-sesi-upload-foto-berakhir)
  - [FAQ (Pertanyaan yang Sering Diajukan)](#faq-pertanyaan-yang-sering-diajukan)

---

# BAGIAN 1: Pendahuluan

## 1.1 Apa itu TuTrack

TuTrack adalah aplikasi manajemen operasi jaringan dan pelacakan operasi lapangan untuk divisi Tunet. Aplikasi ini memungkinkan tim untuk:

- Mengelola tugas dan pekerjaan secara real-time
- Melacak lokasi anggota tim di lapangan
- Mencatat absensi harian (berangkat dan pulang)
- Mengelola prospek dan kunjungan marketing
- Melihat peta radar dengan posisi semua anggota tim

**[SCREENSHOT: Halaman login TuTrack]**

### Peran Pengguna

TuTrack memiliki 4 peran pengguna dengan akses yang berbeda:

| Peran | Keterangan | Akses Utama |
|-------|-----------|-------------|
| **Admin** | Pengelola penuh | Semua fitur: dashboard, tim, tugas, absensi, marketing, peta |
| **NOC** | Operator Network Operations Center | Dashboard, peta radar, papan tugas, absensi |
| **FOC** | Field Operations Crew (petugas lapangan) | Tugas saya, berbagi lokasi GPS, absensi, peta |
| **Marketing** | Tim marketing | Dashboard, prospek, tower sites, kunjungan, peta |

---

## 1.2 Akses Aplikasi

### Langkah 1: Buka Browser

Buka browser web di komputer atau ponsel Anda. Gunakan salah satu browser berikut:
- Google Chrome (disarankan)
- Mozilla Firefox
- Microsoft Edge
- Safari (untuk pengguna iPhone/Mac)

**[SCREENSHOT: Ikon browser di desktop/ponsel]**

### Langkah 2: Ketik URL Aplikasi

Di bilah alamat (address bar) di bagian atas browser, ketik URL TuTrack yang diberikan oleh admin Anda. Tekan tombol **Enter** di keyboard.

**[SCREENSHOT: Bilah alamat browser dengan URL TuTrack]**

### Langkah 3: Tunggu Halaman Memuat

Tunggu beberapa detik hingga halaman login muncul. Anda akan melihat layar gelap dengan logo TuTrack di bagian tengah.

**[SCREENSHOT: Halaman login TuTrack yang sudah termuat]**

---

## 1.3 Login dengan PIN

### Langkah 1: Lokasi Input PIN

Di halaman login, Anda akan melihat:
- Logo TuTrack di bagian atas
- Judul "TuTrack" dan subjudul "Tunet Operations Center"
- Kotak input PIN berwarna gelap di bagian tengah
- Tombol "Masuk" di bawah kotak input

**[SCREENSHOT: Area input PIN di halaman login]**

### Langkah 2: Masukkan PIN

Klik pada kotak input PIN. Ketik PIN 4 digit Anda. Setiap angka yang Anda ketik akan muncul sebagai titik (•) untuk keamanan.

Contoh: Jika PIN Anda adalah `1234`, Anda akan melihat `••••` di kotak input.

**[SCREENSHOT: Kotak input PIN dengan titik-titik]**

### Langkah 3: Klik Tombol Masuk

Setelah memasukkan PIN, klik tombol **"Masuk"** yang berwarna hijau di bawah kotak input.

**[SCREENSHOT: Tombol Masuk]**

### Langkah 4: Redirect ke Dashboard

Jika PIN benar, Anda akan dialihkan ke dashboard sesuai peran Anda:
- **Admin** → Dashboard Admin
- **NOC** → Dashboard NOC
- **FOC** → Dashboard FOC
- **Marketing** → Dashboard Marketing

Jika PIN salah, Anda akan melihat pesan kesalahan merah: "PIN tidak valid" atau "Akun tidak aktif". Coba lagi atau hubungi admin.

**[SCREENSHOT: Dashboard setelah login berhasil]**

### Catatan Penting tentang Sesi

- Sesi Anda akan berakhir setelah 50 menit tidak aktif
- Jika sesi berakhir, Anda akan melihat pesan "Sesi anda telah berakhir" dan dialihkan ke halaman login
- Untuk menghindari ini, pastikan Anda tetap aktif menggunakan aplikasi

---

## 1.4 Navigasi Sidebar

Setelah login, Anda akan melihat sidebar di sisi kiri layar (di desktop) atau tombol menu di pojok kiri atas (di ponsel).

### Sidebar Desktop

**[SCREENSHOT: Sidebar lengkap di desktop]**

Sidebar berisi komponen berikut dari atas ke bawah:

1. **Logo TuTrack** — Ikon dan teks "TuTrack" di bagian paling atas sidebar
2. **Tombol Menu** — Ikon garis tiga (☰) untuk membuka/menutup sidebar di ponsel
3. **Navigasi Menu** — Daftar halaman yang bisa diakses sesuai peran Anda
4. **Panel Notifikasi** — Ikon lonceng (🔔) dengan jumlah notifikasi belum dibaca
5. **Informasi Pengguna** — Nama dan peran Anda di bagian bawah sidebar
6. **Tombol Logout** — Ikon keluar (🚪) untuk keluar dari aplikasi

### Menu Navigasi Peran

Menu yang muncul di sidebar tergantung peran Anda:

**Admin melihat:**
- Dashboard
- Peta Radar
- Papan Tugas
- Absensi
- Manajemen Tim
- Ringkasan Absensi
- Marketing
- Pengaturan

**NOC melihat:**
- Dashboard
- Peta Radar
- Papan Tugas
- Absensi
- Pengaturan

**FOC melihat:**
- Tugas Saya
- Absensi
- Peta
- Pengaturan

**Marketing melihat:**
- Dashboard
- Peta
- Prospek
- Kunjungan
- Absensi
- Pengaturan

### Cara Menggunakan Sidebar

1. **Klik menu navigasi** untuk pindah ke halaman lain. Menu yang aktif akan memiliki latar belakang lebih terang.
2. **Gulir ke bawah** jika daftar menu lebih panjang dari layar.
3. **Klik ikon sidebar** (☰) di ponsel untuk membuka/menutup sidebar.

**[SCREENSHOT: Menu navigasi yang aktif dengan latar belakang terang]**

### Sidebar Ponsel (Mobile)

Di ponsel, sidebar muncul sebagai panel geser dari kiri. Untuk membukanya:

1. Klik ikon hamburger (☰) di pojok kiri atas layar
2. Sidebar akan muncul dari kiri dengan efek geser
3. Klik di luar sidebar untuk menutupnya

**[SCREENSHOT: Sidebar ponsel yang terbuka]**

---

## 1.5 Notifikasi

### Melihat Notifikasi

1. Di sidebar, klik ikon lonceng (🔔) yang terletak di bagian atas, dekat logo TuTrack
2. Panel notifikasi akan terbuka
3. Anda akan melihat daftar notifikasi dengan informasi:
   - Judul notifikasi (contoh: "Tugas baru ditugaskan")
   - Pesan singkat tentang notifikasi
   - Waktu notifikasi dikirim
   - Status sudah dibaca atau belum (titik biru untuk belum dibaca)

**[SCREENSHOT: Panel notifikasi yang terbuka]**

### Menandai Notifikasi Sudah Dibaca

1. **Satu notifikasi**: Klik notifikasi yang ingin ditandai sudah dibaca. Notifikasi akan导航 ke halaman terkait (contoh: jika notifikasi tentang tugas, Anda akan dibawa ke papan tugas).

2. **Semua notifikasi**: Klik tombol **"Tandai semua sudah dibaca"** di bagian atas panel notifikasi untuk menandai semua notifikasi sudah dibaca sekaligus.

**[SCREENSHOT: Tombol "Tandai semua sudah dibaca"]**

### Memahami Jenis Notifikasi

| Jenis Notifikasi | Keterangan |
|-------------------|-----------|
| **Tugas baru ditugaskan** | Anda mendapat tugas baru dari admin atau NOC |
| **Status diperbarui** | Status tugas berubah (contoh: dari "Assigned" ke "In Progress") |
| **Tugas terlambat** | Tugas melewati batas waktu yang ditentukan |
| **Tugas selesai** | Tugas yang Anda tangani telah selesai |

---

## 1.6 Pengaturan (Settings)

### Membuka Pengaturan

1. Di sidebar, klik menu **"Pengaturan"** di bagian bawah daftar menu
2. Halaman Pengaturan akan terbuka

**[SCREENSHOT: Halaman Pengaturan]**

### Mengedit Profil

1. Di bagian "Profil", Anda akan melihat:
   - **Nama** — Kolom input dengan nama Anda saat ini
   - **Telepon** — Kolom input dengan nomor telepon Anda saat ini
2. Klik pada kolom **Nama** dan ketik nama baru Anda
3. Klik pada kolom **Telepon** dan ketik nomor telepon baru Anda
4. Klik tombol **"Simpan"** untuk menyimpan perubahan

**[SCREENSHOT: Form profil di halaman Pengaturan]**

### Mengatur Preferensi Notifikasi

1. Di bagian "Notifikasi", Anda akan melihat beberapa opsi toggle:
   - **Tugas ditugaskan** — Aktifkan jika ingin mendapat notifikasi saat ditugaskan tugas baru
   - **Perubahan status** — Aktifkan jika ingin mendapat notifikasi saat status tugas berubah
   - **Tugas terlambat** — Aktifkan jika ingin mendapat notifikasi saat tugas melewati deadline
2. Klik toggle untuk mengaktifkan atau menonaktifkan setiap opsi
3. Perubahan disimpan secara otomatis

**[SCREENSHOT: Toggle preferensi notifikasi]**

### Mengelola Tag (Hanya Admin)

Jika Anda adalah admin, Anda akan melihat bagian tambahan "Tag" di halaman Pengaturan:

1. **Melihat daftar tag**: Anda akan melihat daftar semua tag yang ada dengan warna dan nama masing-masing
2. **Menambah tag baru**: Klik tombol **"Tambah Tag"**, masukkan nama tag, pilih warna, lalu klik **"Simpan"**
3. **Mengedit tag**: Klik ikon pensil (✏️) di samping tag yang ingin diubah, edit informasi, lalu klik **"Simpan"**
4. **Menghapus tag**: Klik ikon tempat sampah (🗑️) di samping tag yang ingin dihapus, lalu konfirmasi penghapusan

**[SCREENSHOT: Bagian Manajemen Tag di Pengaturan]**

---

## 1.7 Logout

### Cara Logout

1. Di sidebar, cari tombol logout di bagian paling bawah. Ikonnya berupa pintu keluar (🚪) dengan teks "Keluar"
2. Klik tombol **"Keluar"**
3. Anda akan dikembalikan ke halaman login

**[SCREENSHOT: Tombol logout di sidebar]**

### Penting tentang Logout

- **Selalu logout** jika menggunakan komputer bersama atau komputer umum
- Sesi Anda juga akan berakhir otomatis setelah 50 menit tidak aktif
- Setelah logout, Anda perlu memasukkan PIN lagi untuk login kembali

---

# BAGIAN 2: Admin

Bagian ini menjelaskan semua fitur yang tersedia untuk pengguna dengan peran **Admin**. Admin memiliki akses penuh ke seluruh fitur TuTrack, termasuk manajemen tim, tugas, absensi, marketing, dan peta radar.

---

## 2.1 Dashboard Admin

Dashboard Admin adalah halaman utama yang menampilkan ringkasan seluruh operasi. Setelah login sebagai admin, Anda akan langsung melihat dashboard ini.

### 2.1.1 Melihat Statistik Utama

Di bagian paling atas dashboard, Anda akan melihat empat kartu statistik:

1. **Total Tim** — Jumlah seluruh anggota tim yang terdaftar
2. **Tugas Aktif** — Jumlah tugas yang sedang dalam pengerjaan (status: Baru Ditugaskan, Sedang Dikerjakan, atau Sedang di Review)
3. **Tugas Selesai** — Jumlah tugas yang telah selesai hari ini
4. **Tim di Lapangan** — Jumlah anggota tim yang sedang berbagi lokasi GPS

**[SCREENSHOT: Empat kartu statistik di bagian atas Dashboard Admin]**

### 2.1.2 Melihat Grafik Distribusi Tugas

Di bawah kartu statistik, terdapat grafik donat yang menunjukkan distribusi tugas berdasarkan status:

- **Biru** — Baru Ditugaskan (Assigned)
- **Kuning** — Sedang Dikerjakan (In Progress)
- **Ungu** — Sedang di Review
- **Hijau** — Selesai (Done)

Grafik ini membantu Anda melihat secara sekilas bagaimana beban kerja tim terdistribusi.

**[SCREENSHOT: Grafik donat distribusi tugas]**

### 2.1.3 Melihat Heatmap Aktivitas

Di sebelah grafik donat, terdapat heatmap yang menunjukkan aktivitas tugas selama 7 hari terakhir. Warna yang lebih gelap menunjukkan lebih banyak aktivitas pada hari tersebut.

- **Klik pada kotak heatmap** untuk melihat detail aktivitas pada hari tertentu
- **Gulir ke atas/bawah** untuk melihat heatmap minggu sebelumnya

**[SCREENSHOT: Heatmap aktivitas 7 hari]**

### 2.1.4 Melihat Tugas yang Akan Habis

Di bagian bawah dashboard, terdapat tabel "Tugas yang Akan Habis" yang menampilkan tugas-tugas yang mendekati batas waktu (deadline). Tabel ini memiliki kolom:

| Kolom | Keterangan |
|-------|-----------|
| **Judul** | Nama tugas |
| **Penanggung Jawab** | Nama anggota tim yang ditugaskan |
| **Deadline** | Batas waktu tugas |
| **Status** | Status tugas saat ini |
| **Sisa Waktu** | Berapa lama lagi sebelum deadline |

Tugas yang sudah melewati deadline akan ditampilkan dengan warna merah dan label "Terlambat".

**[SCREENSHOT: Tabel tugas yang akan habis deadline]**

### 2.1.5 Melihat Tabel Performa Tim

Di bagian paling bawah dashboard, terdapat tabel "Performa Tim" yang menampilkan ringkasan kinerja setiap anggota tim:

| Kolom | Keterangan |
|-------|-----------|
| **Nama** | Nama anggota tim |
| **Peran** | Role (Admin, NOC, FOC, Marketing) |
| **Tugas Selesai** | Jumlah tugas yang telah diselesaikan |
| **Tugas Aktif** | Jumlah tugas yang sedang dikerjakan |
| **Tingkat Penyelesaian** | Persentase tugas selesai dari total tugas |

Anda bisa mengurutkan tabel ini dengan meng klik pada header kolom.

**[SCREENSHOT: Tabel performa tim]**

---

## 2.2 Manajemen Tim (User CRUD)

Menu Manajemen Tim memungkinkan Anda untuk mengelola seluruh pengguna TuTrack: membuat akun baru, mengedit informasi, menonaktifkan, dan menghapus pengguna.

### 2.2.1 Membuka Halaman Manajemen Tim

1. Di sidebar, klik menu **"Manajemen Tim"**
2. Halaman Manajemen Tim akan terbuka menampilkan daftar seluruh pengguna

**[SCREENSHOT: Halaman Manajemen Tim dengan daftar pengguna]**

### 2.2.2 Melihat Daftar Pengguna

Di halaman Manajemen Tim, Anda akan melihat tabel dengan kolom-kolom berikut:

| Kolom | Keterangan |
|-------|-----------|
| **Nama** | Nama lengkap pengguna |
| **Peran** | Role pengguna (Admin, NOC, FOC, Marketing) |
| **PIN** | PIN 4 digit untuk login (hanya ditampilkan untuk admin) |
| **Telepon** | Nomor telepon pengguna |
| **Status** | Aktif atau Tidak Aktif |
| **Aksi** | Tombol untuk mengedit, menonaktifkan, atau menghapus |

**[SCREENSHOT: Tabel daftar pengguna dengan semua kolom]**

### 2.2.3 Membuat Pengguna Baru

1. Klik tombol **"Tambah Pengguna"** di pojok kanan atas halaman
2. Formulir "Tambah Pengguna Baru" akan muncul
3. Isi kolom-kolom berikut:
   - **Nama** — Ketik nama lengkap pengguna (contoh: "Budi Santoso")
   - **Peran** — Pilih salah satu dari dropdown: Admin, NOC, FOC, atau Marketing
   - **PIN** — Ketik PIN 4 digit untuk pengguna ini (contoh: "5678")
   - **Telepon** — Ketik nomor telepon pengguna (contoh: "081234567890")
4. Klik tombol **"Simpan"** untuk membuat pengguna baru
5. Pengguna baru akan muncul di daftar

**[SCREENSHOT: FormulirTambah Pengguna Baru]**

**Catatan Penting:**
- PIN harus berupa 4 digit angka
- Setiap pengguna harus memiliki PIN yang unik
- Peran menentukan menu dan fitur apa saja yang bisa diakses pengguna

### 2.2.4 Mengedit Informasi Pengguna

1. Di tabel daftar pengguna, cari pengguna yang ingin diedit
2. Klik ikon pensil (✏️) di kolom "Aksi" pada baris pengguna tersebut
3. Formulir "Edit Pengguna" akan muncul dengan data yang sudah terisi
4. Ubah informasi yang ingin diubah:
   - **Nama** — Edit nama pengguna
   - **Peran** — Ubah role pengguna (hati-hati: mengubah role akan mengubah akses pengguna)
   - **PIN** — Ubah PIN pengguna (jika diperlukan)
   - **Telepon** — Ubah nomor telepon
5. Klik tombol **"Simpan"** untuk menyimpan perubahan

**[SCREENSHOT: Formulir Edit Pengguna]**

### 2.2.5 Menonaktifkan Pengguna

Menonaktifkan pengguna membuat pengguna tidak bisa login tetapi data tetap tersimpan.

1. Di tabel daftar pengguna, cari pengguna yang ingin dinonaktifkan
2. Klik ikon tempat sampah (🗑️) di kolom "Aksi" pada baris pengguna tersebut
3. Dialog konfirmasi akan muncul: "Apakah Anda yakin ingin menonaktifkan pengguna [Nama]?"
4. Klik tombol **"Ya, Nonaktifkan"** untuk mengonfirmasi
5. Status pengguna akan berubah menjadi "Tidak Aktif" (ditampilkan dengan warna abu-abu)

**[SCREENSHOT: Dialog konfirmasi nonaktifkan pengguna]**

### 2.2.6 Menghapus Pengguna

**Perhatian:** Menghapus pengguna akan menghapus data secara permanen. Tindakan ini tidak bisa dibatalkan.

1. Di tabel daftar pengguna, cari pengguna yang ingin dihapus
2. Klik ikon tempat sampah (🗑️) di kolom "Aksi" pada baris pengguna tersebut
3. Jika pengguna memiliki tugas aktif, sistem akan menampilkan peringatan: "Pengguna ini memiliki tugas aktif. Hapus tugas terlebih dahulu atau reassign ke pengguna lain."
4. Jika tidak ada tugas aktif, dialog konfirmasi akan muncul: "Apakah Anda yakin ingin menghapus pengguna [Nama]?"
5. Klik tombol **"Ya, Hapus"** untuk mengonfirmasi penghapusan permanen

**[SCREENSHOT: Dialog konfirmasi hapus pengguna]**

### 2.2.7 Mencari Pengguna

1. Di bagian atas tabel, terdapat kolom pencarian
2. Ketik nama pengguna atau nomor telepon yang ingin dicari
3. Tabel akan secara otomatis memfilter hasil pencarian
4. Untuk menghapus filter, hapus teks dari kolom pencarian

**[SCREENSHOT: Kolom pencarian pengguna]**

---

## 2.3 Papan Tugas (Kanban Board)

Papan Tugas adalah fitur utama untuk mengelola pekerjaan tim. Papan ini menggunakan tampilan Kanban dengan empat kolom yang mewakili alur kerja tugas.

### 2.3.1 Membuka Papan Tugas

1. Di sidebar, klik menu **"Papan Tugas"**
2. Halaman Papan Tugas akan terbuka menampilkan empat kolom Kanban

**[SCREENSHOT: Papan Tugas dengan empat kolom Kanban]**

### 2.3.2 Memahami Kolom Kanban

Papan Tugas memiliki empat kolom dari kiri ke kanan:

| Kolom | Warna | Keterangan |
|-------|-------|-----------|
| **Baru Ditugaskan** | Biru | Tugas baru yang belum dikerjakan |
| **Sedang Dikerjakan** | Kuning | Tugas yang sedang dalam pengerjaan |
| **Sedang di Review** | Ungu | Tugas yang menunggu review |
| **Selesai** | Hijau | Tugas yang telah selesai |

Setiap kolom menampilkan jumlah tugas dalam kurung di samping judul kolom.

**[SCREENSHOT: Empat kolom Kanban dengan jumlah tugas]**

### 2.3.3 Membuat Tugas Baru

1. Klik tombol **"Tambah Tugas"** di pojok kanan atas halaman
2. Formulir "Tambah Tugas Baru" akan muncul
3. Isi kolom-kolom berikut:
   - **Judul** — Ketik judul tugas (contoh: "Perbaikan jaringan di area Cikini")
   - **Deskripsi** — Ketik deskripsi detail tugas (opsional)
   - **Penanggung Jawab** — Pilih anggota tim dari dropdown
   - **Prioritas** — Pilih salah satu: Urgent, Tinggi, Sedang, atau Rendah
   - **Deadline** — Pilih tanggal dan waktu deadline menggunakan date picker
   - **Tag** — Pilih tag yang relevan (opsional, bisa lebih dari satu)
4. Klik tombol **"Simpan"** untuk membuat tugas baru
5. Tugas baru akan muncul di kolom "Baru Ditugaskan"

**[SCREENSHOT: FormulirTambah Tugas Baru]**

### 2.3.4 Mengedit Tugas

1. Di papan tugas, cari tugas yang ingin diedit
2. Klik pada kartu tugas tersebut
3. Detail tugas akan terbuka di panel samping
4. Klik tombol **"Edit"** di bagian atas panel detail
5. Ubah informasi yang ingin diubah
6. Klik tombol **"Simpan"** untuk menyimpan perubahan

**[SCREENSHOT: Panel detail tugas dengan tombol Edit]**

### 2.3.5 Memindahkan Tugas (Drag and Drop)

Anda bisa memindahkan tugas antar kolom dengan cara drag and drop:

1. Klik dan tahan kartu tugas yang ingin dipindahkan
2. Seret kartu ke kolom目标 (contoh: dari "Baru Ditugaskan" ke "Sedang Dikerjakan")
3. Lepaskan kartu di kolom目标
4. Status tugas akan otomatis diperbarui

**[SCREENSHOT: Proses drag and drop kartu tugas]**

### 2.3.6 Menghapus Tugas

1. Klik pada kartu tugas yang ingin dihapus
2. Detail tugas akan terbuka di panel samping
3. Klik tombol **"Hapus"** di bagian atas panel detail
4. Dialog konfirmasi akan muncul: "Apakah Anda yakin ingin menghapus tugas ini?"
5. Klik tombol **"Ya, Hapus"** untuk mengonfirmasi
6. Tugas akan dipindahkan ke trash (data tidak dihapus permanen)

**[SCREENSHOT: Dialog konfirmasi hapus tugas]**

### 2.3.7 Mengubah Penanggung Jawab

1. Klik pada kartu tugas yang ingin diubah penanggung jawabnya
2. Detail tugas akan terbuka di panel samping
3. Klik tombol **"Edit"**
4. Di kolom "Penanggung Jawab", pilih anggota tim baru dari dropdown
5. Klik tombol **"Simpan"**

**[SCREENSHOT: Mengubah penanggung jawab tugas]**

### 2.3.8 Mencari dan Menyaring Tugas

Di bagian atas papan tugas, terdapat fitur pencarian dan penyaringan:

1. **Pencarian**: Ketik kata kunci di kolom pencarian untuk mencari tugas berdasarkan judul atau deskripsi
2. **Penyaringan Prioritas**: Klik tombol filter dan pilih prioritas: Urgent, Tinggi, Sedang, atau Rendah
3. **Penyaringan Penanggung Jawab**: Klik tombol filter dan pilih anggota tim tertentu
4. **Penyaringan Tag**: Klik tombol filter dan pilih tag tertentu

**[SCREENSHOT: Kolom pencarian dan tombol filter di papan tugas]**

### 2.3.9 Beralih ke Tampilan Daftar

Selain tampilan Kanban, Anda juga bisa beralih ke tampilan daftar:

1. Klik tombol **"Daftar"** di pojok kanan atas halaman (sebelah tombol "Tambah Tugas")
2. Papan tugas akan berubah menjadi tabel dengan kolom: Judul, Penanggung Jawab, Prioritas, Status, Deadline
3. Anda bisa mengurutkan tabel dengan mengklik header kolom
4. Klik tombol **"Kanban"** untuk kembali ke tampilan papan

**[SCREENSHOT: Tampilan daftar papan tugas]**

### 2.3.10 Mengelola Trash (Tugas yang Dihapus)

1. Di pojok kanan atas halaman papan tugas, klik ikon tempat sampah (🗑️)
2. Panel "Trash" akan terbuka menampilkan daftar tugas yang telah dihapus
3. Untuk memulihkan tugas:
   - Klik tugas yang ingin dipulihkan
   - Klik tombol **"Pulihkan"**
   - Tugas akan kembali ke kolom "Baru Ditugaskan"
4. Untuk menghapus permanen:
   - Klik tugas yang ingin dihapus permanen
   - Klik tombol **"Hapus Permanen"**
   - Konfirmasi penghapusan

**[SCREENSHOT: Panel Trash dengan daftar tugas yang dihapus]**

---

## 2.4 Manajemen Tag

Tag membantu mengkategorikan tugas dan prospek. Admin bisa membuat, mengedit, dan menghapus tag di halaman Pengaturan.

### 2.4.1 Membuka Pengaturan Tag

1. Di sidebar, klik menu **"Pengaturan"**
2. Gulir ke bawah ke bagian **"Manajemen Tag"**

**[SCREENSHOT: Bagian Manajemen Tag di halaman Pengaturan]**

### 2.4.2 Melihat Daftar Tag

Di bagian Manajemen Tag, Anda akan melihat daftar tag yang ada. Setiap tag memiliki:
- **Nama tag** — Label tag (contoh: "Jaringan", "Maintenance", "Instalasi")
- **Warna** — Kotak berwarna yang mewakili tag
- **Aksi** — Tombol edit dan hapus

**[SCREENSHOT: Daftar tag dengan warna dan aksi]**

### 2.4.3 Membuat Tag Baru

1. Klik tombol **"Tambah Tag"** di bagian atas daftar tag
2. Formulir "Tambah Tag Baru" akan muncul
3. Isi kolom-kolom berikut:
   - **Nama Tag** — Ketik nama tag (contoh: "Tower")
   - **Warna** — Klik pada pemilih warna dan pilih warna yang diinginkan
4. Klik tombol **"Simpan"** untuk membuat tag baru
5. Tag baru akan muncul di daftar

**[SCREENSHOT: FormulirTambah Tag Baru dengan pemilih warna]**

### 2.4.4 Mengedit Tag

1. Di daftar tag, cari tag yang ingin diubah
2. Klik ikon pensil (✏️) di samping tag tersebut
3. Formulir "Edit Tag" akan muncul dengan data yang sudah terisi
4. Ubah nama atau warna tag sesuai kebutuhan
5. Klik tombol **"Simpan"** untuk menyimpan perubahan

**[SCREENSHOT: Formulir Edit Tag]**

### 2.4.5 Menghapus Tag

**Perhatian:** Menghapus tag akan menghapus tag dari semua tugas dan prospek yang menggunakannya.

1. Di daftar tag, cari tag yang ingin dihapus
2. Klik ikon tempat sampah (🗑️) di samping tag tersebut
3. Dialog konfirmasi akan muncul: "Apakah Anda yakin ingin menghapus tag [Nama Tag]?"
4. Klik tombol **"Ya, Hapus"** untuk mengonfirmasi
5. Tag akan dihapus dari daftar dan dari semua tugas/prospek

**[SCREENSHOT: Dialog konfirmasi hapus tag]**

---

## 2.5 Absensi (Attendance Overview)

Menu Absensi memungkinkan Anda untuk melihat catatan kehadiran seluruh tim berdasarkan rentang tanggal.

### 2.5.1 Membuka Halaman Absensi

1. Di sidebar, klik menu **"Absensi"** (atau "Ringkasan Absensi")
2. Halaman Absensi akan terbuka menampilkan tabel kehadiran

**[SCREENSHOT: Halaman Absensi dengan tabel kehadiran]**

### 2.5.2 Memilih Rentang Tanggal

Di bagian atas halaman, terdapat pemilih rentang tanggal:

1. Klik pada kolom **"Tanggal Mulai"** dan pilih tanggal awal menggunakan date picker
2. Klik pada kolom **"Tanggal Akhir"** dan pilih tanggal akhir menggunakan date picker
3. Tabel akan secara otomatis memperbarui data berdasarkan rentang tanggal yang dipilih
4. Atau, gunakan tombol cepat:
   - **Hari Ini** — Menampilkan data hari ini saja
   - **7 Hari Terakhir** — Menampilkan data 7 hari terakhir
   - **30 Hari Terakhir** — Menampilkan data 30 hari terakhir

**[SCREENSHOT: Pemilih rentang tanggal dengan tombol cepat]**

### 2.5.3 Melihat Tabel Kehadiran

Tabel kehadiran memiliki kolom-kolom berikut:

| Kolom | Keterangan |
|-------|-----------|
| **Nama** | Nama anggota tim |
| **Peran** | Role pengguna |
| **Tanggal** | Tanggal kehadiran |
| **Waktu Masuk** | Jam berapa pengguna mulai bekerja (check-in) |
| **Waktu Keluar** | Jam berapa pengguna selesai bekerja (check-out) |
| **Durasi** | Total waktu kerja |
| **Status** | Hadir, Terlambat, atau Tidak Hadir |

**[SCREENSHOT: Tabel kehadiran dengan semua kolom]**

### 2.5.4 Menyaring Berdasarkan Pengguna

1. Di bagian atas tabel, terdapat kolom pencarian
2. Ketik nama anggota tim untuk memfilter hasil
3. Tabel hanya akan menampilkan baris yang cocok dengan pencarian

**[SCREENSHOT: Filter pencarian pengguna di tabel absensi]**

### 2.5.5 Mengekspor Data Absensi

1. Klik tombol **"Ekspor"** di pojok kanan atas halaman
2. Pilih format ekspor: CSV atau PDF
3. File akan diunduh ke komputer Anda
4. Buka file untuk melihat data absensi dalam format spreadsheet atau dokumen

**[SCREENSHOT: Tombol ekspor dan dialog pilihan format]**

---

## 2.6 Peta Radar

Peta Radar menampilkan lokasi实时 seluruh anggota tim di peta interaktif. Peta menggunakan Leaflet dengan peta CartoDB Dark Matter (latar belakang gelap).

### 2.6.1 Membuka Peta Radar

1. Di sidebar, klik menu **"Peta Radar"**
2. Peta akan terbuka menampilkan seluruh area cakupan dengan pin-pin anggota tim

**[SCREENSHOT: Peta Radar dengan pin-pin anggota tim]**

### 2.6.2 Memahami Pin di Peta

Setiap pin di peta merepresentasikan satu anggota tim. Warna pin menunjukkan peran:

| Warna Pin | Peran |
|-----------|-------|
| **Biru** | Admin |
| **Hijau** | NOC |
| **Kuning** | FOC |
| **Ungu** | Marketing |

Klik pada pin untuk melihat detail anggota tim:
- Nama anggota tim
- Peran
- Waktu terakhir update lokasi
- Status: Bergerak atau Berhenti

**[SCREENSHOT: Detail anggota tim setelah klik pin]**

### 2.6.3 Memilih Tanggal

Di bagian atas peta, terdapat pemilih tanggal:

1. Klik pada kolom tanggal
2. Pilih tanggal yang ingin dilihat menggunakan date picker
3. Peta akan menampilkan lokasi anggota tim pada tanggal tersebut
4. Garis-garis route akan menunjukkan perjalanan anggota tim sepanjang hari

**[SCREENSHOT: Peta dengan garis route dan pemilih tanggal]**

### 2.6.4 Menyaring Berdasarkan Peran

Di bagian atas peta, terdapat tombol filter peran:

1. Klik tombol **"Filter"**
2. Pilih peran yang ingin ditampilkan:
   - ✅ Admin
   - ✅ NOC
   - ✅ FOC
   - ✅ Marketing
3. Peta hanya akan menampilkan pin untuk peran yang dipilih
4. Klik **"Terapkan"** untuk memperbarui peta

**[SCREENSHOT: Tombol filter peran di peta]**

### 2.6.5 Mencari Pengguna

1. Di bagian atas peta, terdapat kolom pencarian
2. Ketik nama anggota tim yang ingin dicari
3. Peta akan menyorot pin untuk anggota tim tersebut
4. Peta akan otomatis zoom ke lokasi pin

**[SCREENSHOT: Kolom pencarian pengguna di peta]**

### 2.6.6 Melihat Route Perjalanan

1. Pilih tanggal yang ingin dilihat
2. Peta akan menampilkan garis route perjalanan anggota tim
3. Garis berwarna menunjukkan perjalanan aktif (bergerak)
4. Titik-titik menunjukkan lokasi berhenti (statis)
5. Klik pada titik untuk melihat waktu berhenti dan durasi

**[SCREENSHOT: Peta dengan garis route perjalanan]**

### 2.6.7 Zoom dan Navigasi Peta

- **Scroll mouse** untuk zoom in/out
- **Klik dan seret** untuk menggeser peta
- **Tombol +/-** di pojok kiri bawah untuk zoom
- **Tombol home** untuk kembali ke tampilan awal

**[SCREENSHOT: Kontrol zoom dan navigasi peta]**

---

## 2.7 Manajemen Marketing

Menu Marketing memungkinkan Anda untuk mengelola prospek, tower site, dan log kunjungan. Admin memiliki akses penuh untuk membuat, mengedit, dan menghapus data marketing.

### 2.7.1 Membuka Dashboard Marketing

1. Di sidebar, klik menu **"Marketing"**
2. Dashboard Marketing akan terbuka menampilkan statistik marketing

**[SCREENSHOT: Dashboard Marketing dengan statistik]**

### 2.7.2 Melihat Statistik Marketing

Di bagian atas dashboard, terdapat kartu statistik:

1. **Total Prospek** — Jumlah seluruh prospek yang terdaftar
2. **Prospek Aktif** — Jumlah prospek yang sedang dalam proses
3. **Tower Site** — Jumlah tower site yang terdaftar
4. **Kunjungan Hari Ini** — Jumlah kunjungan yang tercatat hari ini

**[SCREENSHOT: Kartu statistik Marketing]**

### 2.7.3 Mengelola Prospek

#### Membuka Halaman Prospek

1. Di sidebar, klik menu **"Prospek"** di bawah menu Marketing
2. Halaman Prospek akan terbuka menampilkan daftar prospek

**[SCREENSHOT: Halaman Prospek dengan daftar prospek]**

#### Membuat Prospek Baru

1. Klik tombol **"Tambah Prospek"** di pojok kanan atas
2. Formulir "Tambah Prospek Baru" akan muncul
3. Isi kolom-kolom berikut:
   - **Nama Perusahaan** — Ketik nama perusahaan atau organisasi (contoh: "PT Telkom Indonesia")
   - **Kontak Person** — Ketik nama kontak person (contoh: "Budi Hartono")
   - **Telepon** — Ketik nomor telepon kontak
   - **Email** — Ketik alamat email kontak (opsional)
   - **Alamat** — Ketik alamat lengkap
   - **Catatan** — Ketik catatan tambahan (opsional)
4. Klik tombol **"Simpan"** untuk membuat prospek baru
5. Prospek baru akan muncul di daftar dengan status "Belum Diproses"

**[SCREENSHOT: FormulirTambah Prospek Baru]**

#### Mengedit Prospek

1. Di daftar prospek, cari prospek yang ingin diedit
2. Klik ikon pensil (✏️) di kolom "Aksi"
3. Formulir "Edit Prospek" akan muncul dengan data yang sudah terisi
4. Ubah informasi yang ingin diubah
5. Klik tombol **"Simpan"** untuk menyimpan perubahan

**[SCREENSHOT: Formulir Edit Prospek]**

#### Memperbarui Status Prospek

1. Di daftar prospek, cari prospek yang ingin diperbarui statusnya
2. Klik pada nama prospek untuk membuka detail
3. Di panel detail, klik tombol **"Update Status"**
4. Pilih status baru dari dropdown:
   - **Belum Diproses** — Prospek baru, belum ada tindakan
   - **Sudah Followup** — Sudah melakukan kontak awal
   - **ACC** — Prospek disetujui/diterima
   - **Tidak** — Prospek ditolak atau tidak memenuhi syarat
5. Klik tombol **"Simpan"** untuk memperbarui status
6. Riwayat perubahan status akan tercatat di bagian "Riwayat Status"

**[SCREENSHOT: Panel detail prospek dengan tombol Update Status]**

#### Melihat Riwayat Status Prospek

1. Di panel detail prospek, gulir ke bawah ke bagian "Riwayat Status"
2. Anda akan melihat daftar perubahan status dari waktu ke waktu:
   - **Tanggal/Waktu** — Kapan perubahan terjadi
   - **Status Lama** — Status sebelumnya
   - **Status Baru** — Status yang baru dipilih
   - **Diubah Oleh** — Siapa yang mengubah status
3. Riwayat ini membantu melacak perkembangan prospek

**[SCREENSHOT: Riwayat status prospek]**

#### Menghapus Prospek

1. Di daftar prospek, cari prospek yang ingin dihapus
2. Klik ikon tempat sampah (🗑️) di kolom "Aksi"
3. Dialog konfirmasi akan muncul: "Apakah Anda yakin ingin menghapus prospek [Nama Perusahaan]?"
4. Klik tombol **"Ya, Hapus"** untuk mengonfirmasi
5. Prospek akan dipindahkan ke trash (data tidak dihapus permanen)

**[SCREENSHOT: Dialog konfirmasi hapus prospek]**

#### Mengelola Trash Prospek

1. Di pojok kanan atas halaman prospek, klik ikon tempat sampah (🗑️)
2. Panel "Trash" akan terbuka menampilkan daftar prospek yang telah dihapus
3. Untuk memulihkan prospek:
   - Klik prospek yang ingin dipulihkan
   - Klik tombol **"Pulihkan"**
   - Proses akan kembali ke daftar utama
4. Untuk menghapus permanen:
   - Klik prospek yang ingin dihapus permanen
   - Klik tombol **"Hapus Permanen"**
   - Konfirmasi penghapusan

**[SCREENSHOT: Panel Trash prospek]**

### 2.7.4 Mengelola Tower Site

#### Membuka Halaman Tower Site

1. Di sidebar, klik menu **"Tower Sites"** di bawah menu Marketing
2. Halaman Tower Sites akan terbuka menampilkan daftar tower site

**[SCREENSHOT: Halaman Tower Sites dengan daftar tower]**

#### Membuat Tower Site Baru

1. Klik tombol **"Tambah Tower Site"** di pojok kanan atas
2. Formulir "Tambah Tower Site Baru" akan muncul
3. Isi kolom-kolom berikut:
   - **Nama Tower** — Ketik nama atau ID tower (contoh: "Tower Cikini-01")
   - **Lokasi** — Ketik alamat lokasi tower
   - **Latitude** — Ketik koordinat lintang (contoh: -6.123456)
   - **Longitude** — Ketik koordinat bujur (contoh: 106.123456)
   - **Tipe** — Pilih tipe lokasi: Village, School, Corporate, Government, atau Other
   - **Status** — Pilih status: Baru Ditugaskan, Pending, Diproses, ACC, atau Rejected
   - **Catatan** — Ketik catatan tambahan (opsional)
4. Klik tombol **"Simpan"** untuk membuat tower site baru
5. Tower site baru akan muncul di daftar

**[SCREENSHOT: FormulirTambah Tower Site Baru]**

#### Mengedit Tower Site

1. Di daftar tower site, cari tower yang ingin diedit
2. Klik ikon pensil (✏️) di kolom "Aksi"
3. Formulir "Edit Tower Site" akan muncul dengan data yang sudah terisi
4. Ubah informasi yang ingin diubah
5. Klik tombol **"Simpan"** untuk menyimpan perubahan

**[SCREENSHOT: Formulir Edit Tower Site]**

#### Memperbarui Status Tower Site

1. Di daftar tower site, cari tower yang ingin diperbarui statusnya
2. Klik pada nama tower untuk membuka detail
3. Di panel detail, klik tombol **"Update Status"**
4. Pilih status baru dari dropdown:
   - **Baru Ditugaskan** — Tower baru didaftarkan
   - **Pending** — Menunggu proses lebih lanjut
   - **Diproses** — Sedang dalam proses
   - **ACC** — Tower disetujui
   - **Rejected** — Tower ditolak
5. Klik tombol **"Simpan"** untuk memperbarui status
6. Riwayat perubahan status akan tercatat

**[SCREENSHOT: Panel detail tower site dengan tombol Update Status]**

#### Menghapus Tower Site

1. Di daftar tower site, cari tower yang ingin dihapus
2. Klik ikon tempat sampah (🗑️) di kolom "Aksi"
3. Dialog konfirmasi akan muncul: "Apakah Anda yakin ingin menghapus tower [Nama Tower]?"
4. Klik tombol **"Ya, Hapus"** untuk mengonfirmasi
5. Tower site akan dihapus dari daftar

**[SCREENSHOT: Dialog konfirmasi hapus tower site]**

### 2.7.5 Mengelola Log Kunjungan

#### Membuka Halaman Kunjungan

1. Di sidebar, klik menu **"Kunjungan"** di bawah menu Marketing
2. Halaman Kunjungan akan terbuka menampilkan daftar kunjungan

**[SCREENSHOT: Halaman Kunjungan dengan daftar kunjungan]**

#### Mencatat Kunjungan Baru

1. Klik tombol **"Tambah Kunjungan"** di pojok kanan atas
2. Formulir "Tambah Kunjungan Baru" akan muncul
3. Isi kolom-kolom berikut:
   - **Prospek** — Pilih prospek dari dropdown (opsional)
   - **Tower Site** — Pilih tower site dari dropdown (opsional)
   - **Tanggal Kunjungan** — Pilih tanggal kunjungan menggunakan date picker
   - **Catatan Kunjungan** — Ketik catatan tentang kunjungan
   - **GPS Lokasi** — Klik tombol **"Ambil Lokasi Saat Ini"** untuk mendapatkan koordinat GPS dari perangkat Anda
4. Klik tombol **"Simpan"** untuk mencatat kunjungan
5. Kunjungan baru akan muncul di daftar

**[SCREENSHOT: FormulirTambah Kunjungan Baru dengan tombol GPS]**

#### Melihat Detail Kunjungan

1. Di daftar kunjungan, klik pada kunjungan yang ingin dilihat detailnya
2. Panel detail akan terbuka menampilkan:
   - Informasi prospek atau tower site yang dikunjungi
   - Tanggal dan waktu kunjungan
   - Catatan kunjungan
   - Koordinat GPS lokasi kunjungan
   - Peta kecil yang menunjukkan lokasi kunjungan

**[SCREENSHOT: Panel detail kunjungan dengan peta lokasi]**

#### Menghapus Kunjungan

1. Di daftar kunjungan, cari kunjungan yang ingin dihapus
2. Klik ikon tempat sampah (🗑️) di kolom "Aksi"
3. Dialog konfirmasi akan muncul: "Apakah Anda yakin ingin menghapus kunjungan ini?"
4. Klik tombol **"Ya, Hapus"** untuk mengonfirmasi
5. Kunjungan akan dihapus dari daftar

**[SCREENSHOT: Dialog konfirmasi hapus kunjungan]**

### 2.7.6 Melihat Peta Marketing

1. Di sidebar, klik menu **"Peta"** di bawah menu Marketing
2. Peta Marketing akan terbuka menampilkan lokasi prospek dan tower site

**[SCREENSHOT: Peta Marketing dengan pin prospek dan tower site]**

#### Memahami Pin di Peta Marketing

| Warna Pin | Keterangan |
|-----------|-----------|
| **Biru** | Prospek |
| **Oranye** | Tower Site |

Klik pada pin untuk melihat detail:
- Nama prospek atau tower site
- Status saat ini
- Alamat atau lokasi
- Tindakan selanjutnya

**[SCREENSHOT: Detail pin setelah diklik]**

#### Menyaring Pin di Peta

1. Di bagian atas peta, terdapat tombol filter
2. Klik tombol **"Filter"**
3. Pilih jenis pin yang ingin ditampilkan:
   - ✅ Prospek
   - ✅ Tower Site
4. Klik **"Terapkan"** untuk memperbarui peta
5. Peta hanya akan menampilkan pin yang dipilih

**[SCREENSHOT: Filter pin di peta Marketing]**

---

**Selesai!** Anda sekarang telah memahami semua fitur yang tersedia untuk peran Admin di TuTrack. Lanjutkan ke BAGIAN 3 untuk mempelajari fitur NOC, atau ke BAGIAN 4 untuk fitur FOC.

---

# BAGIAN 3: NOC

Bagian ini menjelaskan semua fitur yang tersedia untuk pengguna dengan peran **NOC** (Network Operations Center). NOC memiliki akses ke Dashboard NOC dengan tampilan 60/40 (peta dan tugas), Papan Tugas, Peta Radar, dan Absensi. Beberapa fitur identik dengan Admin dan akan dirujuk ke bagian terkait.

---

## 3.1 Dashboard NOC

Dashboard NOC adalah halaman utama yang ditampilkan setelah login sebagai pengguna NOC. Dashboard ini memiliki tata letak unik dengan pembagian 60/40: peta radar di sebelah kiri (60% lebar layar) dan sidebar tugas di sebelah kanan (40% lebar layar).

### 3.1.1 Membuka Dashboard NOC

1. Login menggunakan PIN Anda (lihat Bagian 1.3 untuk panduan login)
2. Setelah login berhasil, Anda akan langsung melihat Dashboard NOC
3. Jika sudah berada di halaman lain, klik menu **"Dashboard"** di sidebar untuk kembali ke Dashboard NOC

**[SCREENSHOT: Dashboard NOC dengan tata letak 60/40 — peta di kiri, tugas di kanan]**

### 3.1.2 Memahami Tata Letak Dashboard NOC

Dashboard NOC dibagi menjadi dua area utama:

| Area | Posisi | Keterangan |
|------|--------|------------|
| **Peta Radar** | Kiri (60%) | Peta interaktif yang menampilkan lokasi anggota tim secara real-time |
| **Sidebar Tugas** | Kanan (40%) | Daftar tugas terbaru beserta status dan ringkasan |

**[SCREENSHOT: Anotasi tata letak dashboard NOC dengan label area]**

### 3.1.3 Melihat Peta Radar di Dashboard

Di area kiri dashboard, Anda akan melihat peta radar yang sama dengan Peta Radar utama (lihat Bagian 3.3 untuk panduan detail). Peta ini menampilkan:

- Pin-pin lokasi anggota tim berwarna sesuai peran
- Garis route perjalanan anggota tim
- Kontrol zoom dan navigasi

Anda bisa berinteraksi dengan peta langsung dari dashboard:
- **Zoom in/out**: Gunakan scroll mouse atau tombol +/- di pojok kiri bawah peta
- **Geser peta**: Klik dan seret peta ke arah yang diinginkan
- **Klik pin**: Klik pada pin anggota tim untuk melihat detail informasi

**[SCREENSHOT: Peta radar di area kiri dashboard NOC dengan pin-pin anggota tim]**

### 3.1.4 Melihat Sidebar Tugas di Dashboard

Di area kanan dashboard, Anda akan melihat sidebar tugas yang berisi:

1. **Judul "Tugas Terbaru"** — Header bagian tugas
2. **Ringkasan Status Tugas** — Jumlah tugas per status dalam bentuk kartu kecil:
   - **Baru Ditugaskan** — Jumlah tugas baru yang belum dikerjakan (warna biru)
   - **Sedang Dikerjakan** — Jumlah tugas yang sedang dalam pengerjaan (warna kuning)
   - **Sedang di Review** — Jumlah tugas yang menunggu review (warna ungu)
   - **Selesai** — Jumlah tugas yang telah selesai hari ini (warna hijau)
3. **Daftar Tugas Terbaru** — Daftar tugas terbaru yang ditampilkan dalam format kartu

**[SCREENSHOT: Sidebar tugas di area kanan dashboard NOC]**

### 3.1.5 Melihat Kartu Tugas di Sidebar

Setiap tugas di sidebar ditampilkan sebagai kartu dengan informasi berikut:

- **Judul Tugas** — Nama tugas
- **Penanggung Jawab** — Nama anggota tim yang ditugaskan
- **Prioritas** — Label prioritas: Urgent (merah), Tinggi (oranye), Sedang (kuning), Rendah (hijau)
- **Deadline** — Batas waktu tugas
- **Status** — Status tugas: Baru Ditugaskan, Sedang Dikerjakan, Sedang di Review, atau Selesai

Kartu tugas memiliki warna tepi sesuai status tugas. Klik pada kartu tugas untuk melihat detail lebih lanjut.

**[SCREENSHOT: Kartu tugas di sidebar dengan informasi lengkap]**

### 3.1.6 Menyaring Tugas di Sidebar

Di bagian atas sidebar tugas, terdapat fitur penyaringan:

1. **Pencarian**: Ketik kata kunci di kolom pencarian untuk mencari tugas berdasarkan judul
2. **Filter Status**: Klik tombol filter dan pilih status tugas yang ingin ditampilkan
3. **Filter Prioritas**: Klik tombol filter dan pilih prioritas tugas yang ingin ditampilkan

**[SCREENSHOT: Fitur pencarian dan filter di sidebar tugas dashboard NOC]**

### 3.1.7 Membuka Papan Tugas dari Dashboard

Untuk membuka Papan Tugas lengkap dari dashboard:

1. Di sidebar tugas, klik tombol **"Lihat Semua Tugas"** di bagian bawah daftar tugas
2. Anda akan dialihkan ke halaman Papan Tugas (lihat Bagian 3.2 untuk panduan detail)

**[SCREENSHOT: Tombol "Lihat Semua Tugas" di sidebar dashboard NOC]**

### 3.1.8 Memperbarui Data Dashboard

Dashboard NOC memperbarui data secara otomatis. Namun, jika Anda ingin memperbarui data secara manual:

1. Klik ikon segarkan (🔄) di pojok kanan atas dashboard
2. Peta dan daftar tugas akan memperbarui data dari server

**[SCREENSHOT: Tombol segarkan di dashboard NOC]**

---

## 3.2 Papan Tugas

Papan Tugas NOC memiliki fitur yang identik dengan Papan Tugas Admin. Anda bisa membuat tugas baru, mengedit, menghapus, memindahkan, dan mengubah penanggung jawab tugas. Untuk panduan detail menggunakan papan tugas, lihat **Bagian 2.3**.

Bagian ini hanya menjelaskan perbedaan dan catatan khusus untuk pengguna NOC.

### 3.2.1 Membuka Papan Tugas

1. Di sidebar, klik menu **"Papan Tugas"**
2. Halaman Papan Tugas akan terbuka menampilkan empat kolom Kanban

**[SCREENSHOT: Papan Tugas dengan empat kolom Kanban untuk pengguna NOC]**

### 3.2.2 Akses dan Hak NOC di Papan Tugas

Pengguna NOC memiliki akses penuh ke Papan Tugas, sama seperti Admin:

| Fitur | Akses NOC | Keterangan |
|-------|-----------|------------|
| **Membuat Tugas** | ✅ Ya | NOC bisa membuat tugas baru dan menugaskannya ke anggota tim |
| **Mengedit Tugas** | ✅ Ya | NOC bisa mengedit semua informasi tugas |
| **Menghapus Tugas** | ✅ Ya | NOC bisa menghapus tugas (akan dipindahkan ke trash) |
| **Memindahkan Tugas** | ✅ Ya | NOC bisa memindahkan tugas antar kolom dengan drag and drop |
| **Mengubah Penanggung Jawab** | ✅ Ya | NOC bisa mengubah penanggung jawab tugas |
| **Mencari dan Menyaring** | ✅ Ya | NOC bisa mencari dan menyaring tugas |
| **Mengelola Trash** | ✅ Ya | NOC bisa memulihkan atau menghapus permanen tugas dari trash |

**[SCREENSHOT: Papan Tugas NOC dengan tombol "Tambah Tugas" aktif]**

### 3.2.3 Membuat Tugas Baru (NOC)

1. Klik tombol **"Tambah Tugas"** di pojok kanan atas halaman
2. Formulir "Tambah Tugas Baru" akan muncul
3. Isi kolom-kolom berikut:
   - **Judul** — Ketik judul tugas (contoh: "Perbaikan jaringan di area Cikini")
   - **Deskripsi** — Ketik deskripsi detail tugas (opsional)
   - **Penanggung Jawab** — Pilih anggota tim dari dropdown (anda bisa menugaskan ke anggota tim mana saja)
   - **Prioritas** — Pilih salah satu: Urgent, Tinggi, Sedang, atau Rendah
   - **Deadline** — Pilih tanggal dan waktu deadline menggunakan date picker
   - **Tag** — Pilih tag yang relevan (opsional, bisa lebih dari satu)
4. Klik tombol **"Simpan"** untuk membuat tugas baru
5. Tugas baru akan muncul di kolom "Baru Ditugaskan"

**[SCREENSHOT: FormulirTambah Tugas Baru untuk pengguna NOC]**

### 3.2.4 Memindahkan Tugas dengan Drag and Drop

1. Klik dan tahan kartu tugas yang ingin dipindahkan
2. Seret kartu ke kolom目标 (contoh: dari "Baru Ditugaskan" ke "Sedang Dikerjakan")
3. Lepaskan kartu di kolom目标
4. Status tugas akan otomatis diperbarui

**[SCREENSHOT: Proses drag and drop kartu tugas di Papan Tugas NOC]**

### 3.2.5 Beralih ke Tampilan Daftar

Selain tampilan Kanban, Anda juga bisa beralih ke tampilan daftar:

1. Klik tombol **"Daftar"** di pojok kanan atas halaman (sebelah tombol "Tambah Tugas")
2. Papan tugas akan berubah menjadi tabel dengan kolom: Judul, Penanggung Jawab, Prioritas, Status, Deadline
3. Anda bisa mengurutkan tabel dengan mengklik header kolom
4. Klik tombol **"Kanban"** untuk kembali ke tampilan papan

**[SCREENSHOT: Tampilan daftar Papan Tugas NOC]**

### 3.2.6 Mengelola Trash Tugas

1. Di pojok kanan atas halaman papan tugas, klik ikon tempat sampah (🗑️)
2. Panel "Trash" akan terbuka menampilkan daftar tugas yang telah dihapus
3. Untuk memulihkan tugas:
   - Klik tugas yang ingin dipulihkan
   - Klik tombol **"Pulihkan"**
   - Tugas akan kembali ke kolom "Baru Ditugaskan"
4. Untuk menghapus permanen:
   - Klik tugas yang ingin dihapus permanen
   - Klik tombol **"Hapus Permanen"**
   - Konfirmasi penghapusan

**[SCREENSHOT: Panel Trash di Papan Tugas NOC]**

---

## 3.3 Peta Radar

Peta Radar NOC memiliki fitur yang identik dengan Peta Radar Admin. Anda bisa melihat lokasi real-time anggota memilih tanggal, menyaring berdasarkan peran, mencari pengguna, dan melihat route perjalanan. Untuk panduan detail menggunakan Peta Radar, lihat **Bagian 2.6**.

Bagian ini hanya menjelaskan perbedaan dan catatan khusus untuk pengguna NOC.

### 3.3.1 Membuka Peta Radar

1. Di sidebar, klik menu **"Peta Radar"**
2. Peta akan terbuka menampilkan seluruh area cakupan dengan pin-pin anggota tim

**[SCREENSHOT: Peta Radar untuk pengguna NOC]**

### 3.3.2 Akses dan Hak NOC di Peta Radar

Pengguna NOC memiliki akses penuh ke Peta Radar, sama seperti Admin:

| Fitur | Akses NOC | Keterangan |
|-------|-----------|------------|
| **Melihat Lokasi Real-time** | ✅ Ya | NOC bisa melihat lokasi semua anggota tim |
| **Memilih Tanggal** | ✅ Ya | NOC bisa melihat lokasi anggota tim pada tanggal tertentu |
| **Menyaring Berdasarkan Peran** | ✅ Ya | NOC bisa menyaring pin berdasarkan peran (Admin, NOC, FOC, Marketing) |
| **Mencari Pengguna** | ✅ Ya | NOC bisa mencari anggota tim tertentu di peta |
| **Melihat Route Perjalanan** | ✅ Ya | NOC bisa melihat garis route perjalanan anggota tim |
| **Zoom dan Navigasi** | ✅ Ya | NOC bisa zoom in/out dan menggeser peta |

**[SCREENSHOT: Peta Radar NOC dengan semua kontrol aktif]**

### 3.3.3 Memilih Tanggal di Peta

1. Di bagian atas peta, terdapat pemilih tanggal
2. Klik pada kolom tanggal
3. Pilih tanggal yang ingin dilihat menggunakan date picker
4. Peta akan menampilkan lokasi anggota tim pada tanggal tersebut
5. Garis-garis route akan menunjukkan perjalanan anggota tim sepanjang hari

**[SCREENSHOT: Peta dengan pemilih tanggal dan garis route]**

### 3.3.4 Menyaring Berdasarkan Peran

1. Di bagian atas peta, terdapat tombol filter peran
2. Klik tombol **"Filter"**
3. Pilih peran yang ingin ditampilkan:
   - ✅ Admin
   - ✅ NOC
   - ✅ FOC
   - ✅ Marketing
4. Peta hanya akan menampilkan pin untuk peran yang dipilih
5. Klik **"Terapkan"** untuk memperbarui peta

**[SCREENSHOT: Filter peran di Peta Radar NOC]**

### 3.3.5 Mencari Pengguna di Peta

1. Di bagian atas peta, terdapat kolom pencarian
2. Ketik nama anggota tim yang ingin dicari
3. Peta akan menyorot pin untuk anggota tim tersebut
4. Peta akan otomatis zoom ke lokasi pin

**[SCREENSHOT: Kolom pencarian pengguna di Peta Radar NOC]**

### 3.3.6 Melihat Route Perjalanan

1. Pilih tanggal yang ingin dilihat
2. Peta akan menampilkan garis route perjalanan anggota tim
3. Garis berwarna menunjukkan perjalanan aktif (bergerak)
4. Titik-titik menunjukkan lokasi berhenti (statis)
5. Klik pada titik untuk melihat waktu berhenti dan durasi

**[SCREENSHOT: Peta dengan garis route perjalanan dan titik berhenti]**

### 3.3.7 Zoom dan Navigasi Peta

- **Scroll mouse** untuk zoom in/out
- **Klik dan seret** untuk menggeser peta
- **Tombol +/-** di pojok kiri bawah untuk zoom
- **Tombol home** untuk kembali ke tampilan awal

**[SCREENSHOT: Kontrol zoom dan navigasi di Peta Radar NOC]**

---

## 3.4 Absensi

Menu Absensi NOC memungkinkan Anda untuk mencatat kehadiran harian (berangkat dan pulang) serta melihat riwayat absensi. Fitur ini sama dengan Absensi FOC.

### 3.4.1 Membuka Halaman Absensi

1. Di sidebar, klik menu **"Absensi"**
2. Halaman Absensi akan terbuka menampilkan dua bagian utama:
   - **Formulir Absensi** — Untuk mencatat kehadiran berangkat atau pulang
   - **Riwayat Absensi** — Daftar catatan kehadiran sebelumnya

**[SCREENSHOT: Halaman Absensi NOC dengan formulir dan riwayat]**

### 3.4.2 Mencatat Kehadiran Berangkat (Check-in)

Kehadiran berangkat mencatat waktu Anda mulai bekerja. Proses ini memerlukan foto, daftar tugas harian, dan lokasi GPS.

#### Langkah 1: Klik Tombol Berangkat

1. Di halaman Absensi, klik tombol **"Berangkat"** yang berwarna hijau
2. Formulir kehadiran berangkat akan muncul

**[SCREENSHOT: Tombol Berangkat di halaman Absensi NOC]**

#### Langkah 2: Unggah Foto Selfie

1. Di bagian "Foto", klik area unggah foto atau ikon kamera
2. Pilih salah satu cara mengunggah foto:
   - **Kamera langsung**: Jika menggunakan ponsel, pilih "Ambil Foto" untuk membuka kamera
   - **Galeri foto**: Pilih "Pilih dari Galeri" untuk memilih foto yang sudah ada
3. Pastikan foto wajah Anda terlihat jelas (foto selfie)
4. Foto akan muncul di area unggah setelah berhasil diunggah

**[SCREENSHOT: Formulir unggah foto selfie untuk kehadiran berangkat]**

#### Langkah 3: Isi Daftar Tugas Harian

1. Di bagian "Tugas Hari Ini", Anda akan melihat kolom input untuk daftar tugas
2. Ketik tugas-tugas yang akan Anda kerjakan hari ini
3. Untuk menambah tugas baru, klik tombol **"+ Tambah Tugas"**
4. Untuk menghapus tugas, klik ikon tempat sampah (🗑️) di samping tugas tersebut
5. Isi minimal satu tugas harian

**Contoh daftar tugas harian:**
- Perbaikan jaringan di area Cikini
- Instalasi router di kantor cabang
- Pengecekan server di data center

**[SCREENSHOT: Formulir daftar tugas harian dengan beberapa tugas]**

#### Langkah 4: Ambil Lokasi GPS

1. Di bagian "Lokasi", klik tombol **"Ambil Lokasi Saat Ini"**
2. Browser akan meminta izin untuk mengakses lokasi Anda
3. Klik **"Izinkan"** atau **"Allow"** untuk memberikan izin
4. Sistem akan mengambil koordinat GPS dari perangkat Anda
5. Koordinat akan ditampilkan di bagian lokasi (contoh: -6.123456, 106.123456)

**Penting:** Pastikan GPS perangkat Anda aktif dan Anda berada di lokasi yang tepat sebelum mengambil lokasi GPS.

**[SCREENSHOT: Tombol Ambil Lokasi GPS dan hasil koordinat]**

#### Langkah 5: Simpan Kehadiran Berangkat

1. Setelah semua kolom terisi (foto, tugas harian, lokasi GPS), klik tombol **"Simpan"**
2. Sistem akan memproses kehadiran Anda
3. Jika berhasil, Anda akan melihat pesan sukses: "Kehadiran berangkat berhasil dicatat"
4. Kehadiran akan muncul di riwayat absensi

**[SCREENSHOT: Pesan sukses kehadiran berangkat berhasil dicatat]**

### 3.4.3 Mencatat Kehadiran Pulang (Check-out)

Kehadiran pulang mencatat waktu Anda selesai bekerja. Proses ini hanya memerlukan lokasi GPS.

#### Langkah 1: Klik Tombol Pulang

1. Di halaman Absensi, klik tombol **"Pulang"** yang berwarna oranye
2. Formulir kehadiran pulang akan muncul

**[SCREENSHOT: Tombol Pulang di halaman Absensi NOC]**

#### Langkah 2: Ambil Lokasi GPS

1. Di bagian "Lokasi", klik tombol **"Ambil Lokasi Saat Ini"**
2. Browser akan meminta izin untuk mengakses lokasi Anda (jika belum diberikan)
3. Klik **"Izinkan"** atau **"Allow"** untuk memberikan izin
4. Sistem akan mengambil koordinat GPS dari perangkat Anda
5. Koordinat akan ditampilkan di bagian lokasi

**[SCREENSHOT: Formulir kehadiran pulang dengan tombol Ambil Lokasi GPS]**

#### Langkah 3: Simpan Kehadiran Pulang

1. Setelah lokasi GPS berhasil diambil, klik tombol **"Simpan"**
2. Sistem akan memproses kehadiran pulang Anda
3. Jika berhasil, Anda akan melihat pesan sukses: "Kehadiran pulang berhasil dicatat"
4. Kehadiran pulang akan muncul di riwayat absensi

**[SCREENSHOT: Pesan sukses kehadiran pulang berhasil dicatat]**

### 3.4.4 Memahami Aturan Kehadiran

Sistem kehadiran memiliki beberapa aturan penting:

| Aturan | Keterangan |
|--------|-----------|
| **Pencegahan Duplikat** | Anda tidak bisa mencatat kehadiran berangkat dua kali dalam satu hari yang sama. Jika sudah mencatat berangkat, tombol berangkat akan dinonaktifkan untuk hari itu. |
| **Pencegahan Duplikat Pulang** | Anda tidak bisa mencatat kehadiran pulang dua kali dalam satu hari yang sama. Jika sudah mencatat pulang, tombol pulang akan dinonaktifkan untuk hari itu. |
| **Urutan Wajar** | Sebaiknya catat kehadiran berangkat sebelum pulang dalam satu hari. |
| **Lokasi GPS Wajib** | Kehadiran berangkat dan pulang memerlukan lokasi GPS. Pastikan GPS perangkat aktif. |
| **Foto Wajib (Berangkat)** | Kehadiran berangkat memerlukan foto selfie. Pastikan foto wajah terlihat jelas. |

**[SCREENSHOT: Tombol Berangkat/Pulang yang dinonaktifkan karena sudah dicatat hari ini]**

### 3.4.5 Melihat Riwayat Absensi

Di bagian bawah halaman Absensi, Anda akan melihat riwayat kehadiran:

#### Format Daftar Riwayat

Setiap entri riwayat menampilkan:
- **Tanggal** — Tanggal kehadiran
- **Jenis** — Berangkat atau Pulang
- **Waktu** — Jam kehadiran dicatat
- **Lokasi** — Koordinat GPS lokasi kehadiran
- **Status** — Berhasil atau Gagal

**[SCREENSHOT: Daftar riwayat absensi dengan beberapa entri]**

#### Menyaring Riwayat Berdasarkan Tanggal

1. Di bagian atas riwayat, terdapat pemilih rentang tanggal
2. Klik pada kolom **"Tanggal Mulai"** dan pilih tanggal awal
3. Klik pada kolom **"Tanggal Akhir"** dan pilih tanggal akhir
4. Riwayat akan secara otomatis memperbarui data berdasarkan rentang tanggal yang dipilih

**[SCREENSHOT: Pemilih rentang tanggal untuk riwayat absensi]**

#### Menyaring Riwayat Berdasarkan Jenis

1. Di bagian atas riwayat, terdapat tombol filter jenis
2. Klik tombol **"Filter"**
3. Pilih jenis kehadiran yang ingin ditampilkan:
   - ✅ Berangkat
   - ✅ Pulang
4. Riwayat hanya akan menampilkan jenis kehadiran yang dipilih

**[SCREENSHOT: Filter jenis kehadiran di riwayat absensi]**

### 3.4.6 Melihat Detail Kehadiran

1. Di daftar riwayat absensi, klik pada entri kehadiran yang ingin dilihat detailnya
2. Panel detail akan terbuka menampilkan:
   - **Tanggal dan Waktu** — Kapan kehadiran dicatat
   - **Jenis** — Berangkat atau Pulang
   - **Lokasi GPS** — Koordinat lokasi kehadiran
   - **Foto Selfie** — Foto selfie saat kehadiran berangkat (hanya untuk berangkat)
   - **Daftar Tugas** — Tugas-tugas yang akan dikerjakan hari ini (hanya untuk berangkat)
   - **Peta Lokasi** — Peta kecil yang menunjukkan lokasi kehadiran

**[SCREENSHOT: Panel detail kehadiran dengan foto selfie dan peta lokasi]**

### 3.4.7 Mengekspor Data Absensi

1. Klik tombol **"Ekspor"** di pojok kanan atas halaman absensi
2. Pilih format ekspor: CSV atau PDF
3. File akan diunduh ke komputer Anda
4. Buka file untuk melihat data absensi dalam format spreadsheet atau dokumen

**[SCREENSHOT: Tombol ekspor dan dialog pilihan format di halaman Absensi NOC]**

---

**Selesai!** Anda sekarang telah memahami semua fitur yang tersedia untuk peran NOC di TuTrack. Lanjutkan ke BAGIAN 4 untuk mempelajari fitur FOC, atau ke BAGIAN 5 untuk fitur Marketing.

---

# BAGIAN 4: FOC

Bagian ini menjelaskan semua fitur yang tersedia untuk pengguna dengan peran **FOC** (Field Operations Crew). FOC adalah petugas lapangan yang fokus pada pengerjaan tugas, berbagi lokasi GPS secara real-time, dan pencatatan absensi harian. Berbeda dengan Admin dan NOC, FOC memiliki tampilan yang dioptimalkan untuk penggunaan di ponsel (mobile-first) dengan navigasi bawah (bottom navigation bar).

**Catatan Penting tentang Akses FOC:**

| Fitur | Akses FOC | Keterangan |
|-------|-----------|------------|
| **Melihat Tugas** | ✅ Ya (read-only) | FOC hanya melihat tugas yang ditugaskan kepada dirinya |
| **Mengubah Status Tugas** | ✅ Ya | FOC bisa mengubah status tugas sesuai alur kerja |
| **Membuat Tugas** | ❌ Tidak | Hanya Admin dan NOC |
| **Menghapus Tugas** | ❌ Tidak | Hanya Admin dan NOC |
| **Mengubah Penanggung Jawab** | ❌ Tidak | Hanya Admin dan NOC |
| **Berbagi Lokasi GPS** | ✅ Ya | Fitur utama FOC — berbagi lokasi real-time |
| **Absensi (Berangkat/Pulang)** | ✅ Ya | Pencatatan kehadiran harian |
| **Peta** | ✅ Ya | Melihat posisi sendiri dan anggota tim |
| **Pengaturan** | ✅ Ya | Mengedit profil dan preferensi |

---

## 4.1 Dashboard FOC

Dashboard FOC adalah halaman utama yang ditampilkan setelah login sebagai pengguna FOC. Dashboard ini dirancang mobile-first dan menampilkan tiga bagian utama: kartu berbagi lokasi GPS, daftar tugas aktif, dan daftar tugas selesai. Di ponsel, navigasi dilakukan melalui bar navigasi bawah (bottom navigation bar).

### 4.1.1 Membuka Dashboard FOC

1. Login menggunakan PIN Anda (lihat Bagian 1.3 untuk panduan login)
2. Setelah login berhasil, Anda akan langsung melihat Dashboard FOC
3. Jika sudah berada di halaman lain, klik menu **"Tugas Saya"** di sidebar (desktop) atau gunakan bar navigasi bawah (ponsel) untuk kembali ke dashboard

**[SCREENSHOT: Dashboard FOC setelah login berhasil]**

### 4.1.2 Memahami Tata Letak Dashboard FOC

Dashboard FOC memiliki tata letak yang berbeda dari Admin dan NOC karena dirancang untuk penggunaan di ponsel:

| Bagian | Posisi | Keterangan |
|--------|--------|------------|
| **Header** | Paling atas | Judul "Tugas Saya", subjudul, dan badge jumlah tugas aktif |
| **Kartu Berbagi Lokasi** | Di bawah header | Kartu kontrol berbagi lokasi GPS (selalu terlihat) |
| **Tugas Aktif** | Di bawah kartu lokasi | Daftar tugas yang sedang dikerjakan atau belum selesai |
| **Tugas Selesai** | Di bawah tugas aktif | Daftar tugas yang sudah selesai |
| **Bar Navigasi Bawah** | Paling bawah (ponsel) | Tombol navigasi: Tugas, Absensi, Peta, Pengaturan |

**[SCREENSHOT: Anotasi tata letak Dashboard FOC dengan label bagian]**

### 4.1.3 Bar Navigasi Bawah (Mobile)

Di ponsel, Dashboard FOC memiliki bar navigasi bawah yang memudahkan akses cepat ke fitur utama. Bar navigasi ini terdiri dari empat tombol:

| Ikon | Teks | Fungsi |
|------|------|--------|
| **Clipboard** (📋) | Tugas | Membuka halaman Tugas Saya (dashboard) |
| **Clock** (🕐) | Absensi | Membuka halaman Absensi (Berangkat/Pulang) |
| **Map** (🗺️) | Peta | Membuka halaman Peta untuk melihat lokasi |
| **Gear** (⚙️) | Pengaturan | Membuka halaman Pengaturan profil |

Untuk berpindah halaman:
1. Klik salah satu ikon di bar navigasi bawah
2. Halaman akan berubah sesuai ikon yang dipilih
3. Ikon yang aktif akan memiliki warna lebih terang (hijau)

**[SCREENSHOT: Bar navigasi bawah di ponsel dengan empat ikon]**

**Catatan:** Di desktop, bar navigasi bawah tidak ditampilkan. Penggunaan sidebar desktop sama dengan peran lain (lihat Bagian 1.4).

### 4.1.4 Melihat Kartu Berbagi Lokasi GPS

Di bagian atas dashboard (setelah header), Anda akan melihat kartu **"Bagikan Lokasi Saya"** yang selalu terlihat. Kartu ini memiliki dua kondisi:

#### Kondisi: Lokasi Nonaktif

Saat pertama kali login atau setelah menonaktifkan berbagi lokasi, kartu akan menampilkan:
- **Ikon SignalTower** — Ikon abu-abu di sebelah kiri
- **Judul** — "Bagikan Lokasi Saya"
- **Subjudul** — "Aktifkan agar NOC dapat melacak posisi Anda"
- **Tombol "Aktifkan"** — Tombol hijau di sebelah kanan

**[SCREENSHOT: Kartu berbagi lokasi GPS dalam kondisi nonaktif]**

#### Kondisi: Lokasi Aktif

Setelah mengaktifkan berbagi lokasi, kartu akan menampilkan informasi tambahan:
- **Ikon SignalTower berkedip** — Ikon hijau dengan animasi berkedip
- **Judul** — "Bagikan Lokasi Saya"
- **Subjudul** — "Aktif • Pembaruan otomatis setiap 2 menit"
- **Tombol "Nonaktifkan"** — Tombol outline hijau di sebelah kanan
- **Koordinat GPS** — latitude, longitude (format: -6.123456, 106.123456)
- **Timer mundur** — Waktu tersisa hingga pembaruan otomatis berikutnya
- **Terakhir diperbarui** — Waktu terakhir lokasi dikirim ke server
- **Tombol "Perbarui Lokasi Saya Sekarang"** — Tombol untuk pembaruan manual

**[SCREENSHOT: Kartu berbagi lokasi GPS dalam kondisi aktif dengan informasi lengkap]**

Untuk panduan detail tentang berbagi lokasi GPS, lihat Bagian 4.3.

### 4.1.5 Melihat Daftar Tugas Aktif

Di bawah kartu berbagi lokasi, Anda akan melihat bagian **"Tugas Aktif"** yang menampilkan tugas-tugas yang belum selesai:

1. **Judul bagian** — "Tugas Aktif" dengan jumlah tugas di sebelah kanan (contoh: "3 tugas aktif")
2. **Daftar kartu tugas** — Setiap tugas ditampilkan sebagai kartu dengan informasi:
   - **Judul tugas** — Nama tugas
   - **Penanggung jawab** — Nama Anda (karena FOC hanya melihat tugas sendiri)
   - **Prioritas** — Badge berwarna: Urgent (merah), Tinggi (oranye), Sedang (kuning), Rendah (hijau)
   - **Deadline** — Batas waktu tugas
   - **Status** — Badge status tugas: Baru Ditugaskan (biru), Sedang Dikerjakan (kuning), Sedang di Review (ungu)
   - **Tag** — Badge tag jika ada

3. **Tombol Ubah Status** — Setiap kartu tugas memiliki tombol untuk mengubah status sesuai alur kerja

**[SCREENSHOT: Daftar tugas aktif di Dashboard FOC dengan kartu-kartu tugas]**

### 4.1.6 Melihat Daftar Tugas Selesai

Di bawah daftar tugas aktif, Anda akan melihat bagian **"Tugas Selesai"** yang menampilkan tugas-tugas yang sudah selesai:

1. **Ikon centang** — Ikon hijau CheckCircle di samping judul
2. **Judul bagian** — "Selesai" dengan jumlah tugas dalam kurung
3. **Garis vertikal** — Garis hijau tipis di sisi kiri kartu tugas selesai
4. **Kartu tugas** — Sama seperti tugas aktif tetapi dengan status "Selesai" (hijau)

Tugas selesai ditampilkan lebih redup dibandingkan tugas aktif untuk membedakan secara visual.

**[SCREENSHOT: Daftar tugas selesai di Dashboard FOC dengan garis vertikal hijau]**

### 4.1.7 Melihat Status Kosong (Empty State)

Jika Anda tidak memiliki tugas yang ditugaskan, dashboard akan menampilkan pesan kosong:

1. **Ikon centang besar** — Ikon hijau CheckCircle di tengah layar
2. **Judul** — "Tidak ada tugas aktif"
3. **Deskripsi** — Penjelasan bahwa saat ini tidak ada tugas yang ditugaskan

**[SCREENSHOT: Status kosong (empty state) di Dashboard FOC]**

### 4.1.8 Membuka Detail Tugas dari Dashboard

Untuk melihat detail lengkap suatu tugas:

1. Di daftar tugas aktif atau selesai, klik pada kartu tugas yang ingin dilihat
2. Panel detail tugas akan terbuka di samping layar (desktop) atau sebagai overlay (ponsel)
3. Panel detail menampilkan informasi lengkap tugas termasuk deskripsi, tag, dan lokasi (jika ada)
4. Klik tombol **"Buka di Peta"** untuk melihat lokasi tugas di peta (jika tugas memiliki koordinat GPS)
5. Klik ikon **X** atau klik di luar panel untuk menutup detail tugas

**[SCREENSHOT: Panel detail tugas yang terbuka dari Dashboard FOC]**

---

## 4.2 Tugas Saya (My Tasks)

Halaman Tugas Saya adalah fitur utama FOC untuk melihat dan mengelola tugas yang ditugaskan kepada mereka. Berbeda dengan Papan Tugas Admin/NOC (lihat Bagian 2.3), FOC tidak bisa membuat, menghapus, atau mengubah penanggung jawab tugas — mereka hanya bisa melihat tugas sendiri dan mengubah status sesuai alur kerja.

### 4.2.1 Membuka Halaman Tugas Saya

**Di Desktop:**
1. Di sidebar, klik menu **"Tugas Saya"**
2. Halaman Tugas Saya akan terbuka (sebenarnya sama dengan Dashboard FOC)

**Di Ponsel:**
1. Klik ikon **Clipboard** (📋) di bar navigasi bawah
2. Halaman Tugas Saya akan terbuka

**[SCREENSHOT: Halaman Tugas Saya di desktop dan ponsel]**

### 4.2.2 Memahami Kartu Tugas

Setiap tugas ditampilkan sebagai kartu dengan informasi berikut:

| Elemen | Keterangan |
|--------|-----------|
| **Judul Tugas** | Nama tugas (contoh: "Perbaikan jaringan di area Cikini") |
| **Prioritas** | Badge berwarna: Urgent (merah), Tinggi (oranye), Sedang (kuning), Rendah (hijau) |
| **Status** | Badge status: Baru Ditugaskan (biru), Sedang Dikerjakan (kuning), Sedang di Review (ungu), Selesai (hijau) |
| **Deadline** | Batas waktu tugas — tampil merah jika sudah melewati deadline |
| **Tag** | Badge tag jika tugas memiliki tag (contoh: "Jaringan", "Maintenance") |
| **Tombol Status** | Tombol untuk mengubah status tugas ke tahap berikutnya |

**[SCREENSHOT: Kartu tugas dengan semua elemen informasi]**

### 4.2.3 Mengubah Status Tugas (Alur Kerja)

FOC bisa mengubah status tugas sesuai alur kerja yang telah ditentukan. Alur kerja tugas mengikuti urutan berikut:

```
Baru Ditugaskan → Sedang Dikerjakan → Sedang di Review → Selesai
```

| Status | Label | Warna | Keterangan |
|--------|-------|-------|-----------|
| **assigned** | Baru Ditugaskan | Biru | Tugas baru, belum dikerjakan |
| **in_progress** | Sedang Dikerjakan | Kuning | Tugas sedang dalam pengerjaan |
| **review** | Sedang di Review | Ungu | Tugas selesai dikerjakan, menunggu review |
| **done** | Selesai | Hijau | Tugas telah selesai dan disetujui |

#### Cara Mengubah Status Tugas

1. Di kartu tugas, cari tombol status di bagian bawah kartu
2. Tombol status menunjukkan tahap berikutnya (contoh: jika status "Baru Ditugaskan", tombol akan menampilkan "Mulai Kerjakan")
3. Klik tombol status tersebut
4. Status tugas akan berubah ke tahap berikutnya
5. Anda akan melihat pesan sukses: "Status tugas berhasil diperbarui"
6. Kartu tugas akan berpindah ke bagian yang sesuai (aktif atau selesai)

**Contoh perubahan status:**

| Status Saat Ini | Tombol yang Ditampilkan | Status Setelah Diklik |
|-----------------|------------------------|----------------------|
| Baru Ditugaskan | "Mulai Kerjakan" | Sedang Dikerjakan |
| Sedang Dikerjakan | "Kirim untuk Review" | Sedang di Review |
| Sedang di Review | "Tandai Selesai" | Selesai |

**[SCREENSHOT: Tombol status pada kartu tugas dan proses perubahan status]**

**Catatan Penting:**
- FOC hanya bisa mengubah status ke tahap berikutnya (tidak bisa mundur kecuali via drag and drop yang tidak tersedia untuk FOC)
- Perubahan status akan langsung terlihat oleh Admin dan NOC
- Jika terjadi kesalahan, Admin atau NOC bisa mengubah status kembali

### 4.2.4 Melihat Detail Tugas

Untuk melihat informasi lengkap suatu tugas:

1. Klik pada kartu tugas yang ingin dilihat
2. Panel detail tugas akan terbuka
3. Panel detail menampilkan:
   - **Judul Tugas** — Nama tugas
   - **Deskripsi** — Deskripsi detail tugas (jika ada)
   - **Penanggung Jawab** — Nama Anda
   - **Prioritas** — Urgent, Tinggi, Sedang, atau Rendah
   - **Deadline** — Batas waktu tugas
   - **Status** — Status tugas saat ini
   - **Tag** — Tag yang terkait dengan tugas
   - **Tanggal Dibuat** — Kapan tugas dibuat
   - **Terakhir Diperbarui** — Kapan tugas terakhir diubah
4. Klik tombol **"Buka di Peta"** untuk melihat lokasi tugas di peta (jika tugas memiliki koordinat GPS)
5. Klik ikon **X** atau klik di luar panel untuk menutup

**[SCREENSHOT: Panel detail tugas lengkap di Dashboard FOC]**

### 4.2.5 Membuka Lokasi Tugas di Peta

Jika tugas memiliki lokasi GPS (koordinat latitude dan longitude), Anda bisa membuka lokasi tugas di peta:

1. Buka detail tugas (lihat Bagian 4.2.4)
2. Di panel detail, klik tombol **"Buka di Peta"** atau ikon MapPin
3. Peta akan terbuka menampilkan pin di lokasi tugas
4. Anda bisa memperbesar (zoom in) atau memperkecil (zoom out) peta
5. Klik tombol **"Navigasi"** untuk membuka aplikasi peta di ponsel (Google Maps atau Apple Maps) dengan rute ke lokasi tugas

**[SCREENSHOT: Peta dengan lokasi tugas dan tombol Navigasi]**

### 4.2.6 Memahami Batasan Akses FOC di Papan Tugas

Berbeda dengan Admin dan NOC yang memiliki akses penuh ke Papan Tugas, FOC memiliki keterbatasan:

| Fitur | Admin/NOC | FOC |
|-------|-----------|-----|
| Membuat Tugas | ✅ Ya | ❌ Tidak |
| Mengedit Tugas | ✅ Ya | ❌ Tidak |
| Menghapus Tugas | ✅ Ya | ❌ Tidak |
| Mengubah Penanggung Jawab | ✅ Ya | ❌ Tidak |
| Melihat Tugas Sendiri | ✅ Ya | ✅ Ya |
| Mengubah Status Tugas | ✅ Ya | ✅ Ya |
| Mencari Tugas | ✅ Ya | ✅ Ya |
| Menyaring Tugas | ✅ Ya | ✅ Ya |

FOC tidak memiliki tombol "Tambah Tugas" atau ikon hapus pada kartu tugas. Semua pengelolaan tugas dilakukan oleh Admin dan NOC.

**[SCREENSHOT: Tampilan Dashboard FOC tanpa tombol "Tambah Tugas"]**

---

## 4.3 Berbagi Lokasi (GPS Sharing)

Berbagi Lokasi GPS adalah fitur utama yang membedakan FOC dari peran lain. Fitur ini memungkinkan NOC dan Admin untuk melacak posisi FOC di lapangan secara real-time. Lokasi diperbarui otomatis setiap 2 menit saat fitur aktif.

### 4.3.1 Mengaktifkan Berbagi Lokasi

#### Langkah 1: Temukan Kartu Berbagi Lokasi

1. Di Dashboard FOC, cari kartu **"Bagikan Lokasi Saya"** di bagian atas
2. Kartu ini selalu terlihat di dashboard, tidak tersembunyi di menu lain

**[SCREENSHOT: Kartu Bagikan Lokasi Saya dalam kondisi nonaktif]**

#### Langkah 2: Klik Tombol "Aktifkan"

1. Klik tombol **"Aktifkan"** yang berwarna hijau di sebelah kanan kartu
2. Browser akan meminta izin untuk mengakses lokasi Anda
3. Klik **"Izinkan"** atau **"Allow"** untuk memberikan izin akses lokasi
4. Sistem akan mengambil koordinat GPS pertama dari perangkat Anda
5. Kartu akan berubah menampilkan informasi lokasi aktif

**[SCREENSHOT: Dialog izin akses lokasi di browser]**

#### Langkah 3: Verifikasi Aktivasi

Setelah berhasil diaktifkan, kartu akan menampilkan:
- Ikon SignalTower berkedip (animasi hijau)
- Subjudul: "Aktif • Pembaruan otomatis setiap 2 menit"
- Tombol berubah menjadi "Nonaktifkan" (outline hijau)
- Koordinat GPS saat ini (format: -6.123456, 106.123456)
- Timer mundur untuk pembaruan otomatis berikutnya
- Waktu terakhir diperbarui

**[SCREENSHOT: Kartu berbagi lokasi dalam kondisi aktif dengan informasi lengkap]**

### 4.3.2 Memahami Pembaruan Otomatis

Saat berbagi lokasi aktif, sistem akan secara otomatis mengirim lokasi Anda ke server setiap 2 menit (120 detik):

| Elemen | Keterangan |
|--------|-----------|
| **Interval** | 2 menit (120 detik) |
| **Timer Mundur** | Menampilkan waktu tersisa hingga pembaruan berikutnya (format: M:SS) |
| **Metode** | GPS perangkat dengan akurasi tinggi |
| **Penyimpanan** | Lokasi disimpan di database Supabase dan terlihat di Peta Radar |

**[SCREENSHOT: Timer mundur pembaruan otomatis di kartu berbagi lokasi]**

**Catatan Penting:**
- Pembaruan otomatis hanya berfungsi jika halaman tetap terbuka di browser
- Jika browser ditutup atau beralih ke aplikasi lain di ponsel, pembaruan otomatis mungkin terhenti
- Untuk berbagi lokasi yang lebih stabil saat browser ditutup, gunakan integrasi Telegram (lihat Bagian 4.3.4)

### 4.3.3 Memperbarui Lokasi Secara Manual

Selain pembaruan otomatis, Anda juga bisa memperbarui lokasi secara manual kapan saja:

1. Di kartu berbagi lokasi (kondisi aktif), klik tombol **"Perbarui Lokasi Saya Sekarang"**
2. Tombol akan berubah menjadi "Memperbarui..." dengan ikon berputar (loading)
3. Sistem akan mengambil koordinat GPS terbaru dari perangkat
4. Koordinat akan diperbarui di kartu
5. Waktu "Terakhir diperbarui" akan diperbarui
6. Timer mundur akan di-reset ke 2:00

**[SCREENSHOT: Proses pembaruan lokasi manual dengan tombol loading]**

**Kapan menggunakan pembaruan manual:**
- Saat baru tiba di lokasi tugas
- Saat berpindah lokasi sebelum pembaruan otomatis berikutnya
- Saat ingin memastikan lokasi terkini tercatat

### 4.3.4 Mengintegrasikan dengan Telegram Bot

Untuk berbagi lokasi yang lebih stabil (tetap berfungsi bahkan saat browser ditutup), FOC bisa menggunakan bot Telegram. Bot Telegram akan mengambil lokasi dari perangkat Anda dan mengirimkannya ke server TuTrack.

#### Langkah 1: Buka Bot Telegram

1. Di kartu berbagi lokasi, cari bagian **"Bot Telegram"** di bagian bawah
2. Jika sudah terhubung, Anda akan melihat: "Terhubung: [username Telegram Anda]"
3. Klik tombol **"Buka"** untuk membuka bot Telegram
4. Atau, buka Telegram dan cari: **@TuTrackTrackingBot**

**[SCREENSHOT: Bagian Bot Telegram di kartu berbagi lokasi]**

#### Langkah 2: Mulai Bot Telegram

1. Di Telegram, buka chat dengan **@TuTrackTrackingBot**
2. Klik tombol **"Start"** atau ketik perintah: `/start`
3. Bot akan merespon dengan pesan selamat datang dan instruksi

**[SCREENSHOT: Chat Telegram dengan @TuTrackTrackingBot setelah /start]**

#### Langkah 3: Berbagi Lokasi via Telegram

1. Di chat bot Telegram, klik ikon **lampiran** (📎) di sebelah kiri kolom pesan
2. Pilih **"Lokasi"** dari menu lampiran
3. Ponsel akan menampilkan peta dengan posisi Anda saat ini
4. Geser peta jika perlu untuk menyesuaikan lokasi
5. Klik tombol **"Kirim Lokasi"** atau **"Send Location"**
6. Bot akan menerima lokasi Anda dan mengirimkannya ke server TuTrack

**[SCREENSHOT: Proses mengirim lokasi via Telegram bot — ikon lampiran, pilihan Lokasi, dan tombol Kirim]**

#### Langkah 4: Verifikasi Koneksi Telegram

1. Kembali ke Dashboard FOC
2. Di kartu berbagi lokasi, bagian Bot Telegram akan menampilkan: "Terhubung: [username Telegram Anda]"
3. Koordinat GPS akan diperbarui dengan lokasi yang dikirim via Telegram

**[SCREENSHOT: Verifikasi koneksi Telegram di Dashboard FOC]**

**Keunggulan Integrasi Telegram:**
- Lokasi bisa dikirim bahkan saat browser TuTrack ditutup
- Berfungsi saat beralih ke aplikasi lain di ponsel
- Lebih stabil untuk penggunaan lapangan jangka panjang
- Tidak memerlukan izin GPS berulang kali di browser

### 4.3.5 Menonaktifkan Berbagi Lokasi

Untuk berhenti berbagi lokasi:

1. Di kartu berbagi lokasi, klik tombol **"Nonaktifkan"** yang berwarna outline hijau
2. Pembaruan otomatis akan berhenti
3. Lokasi terakhir yang dikirim akan tetap tersimpan di server
4. NOC dan Admin tidak akan melihat pembaruan lokasi baru
5. Kartu akan kembali ke kondisi nonaktif

**[SCREENSHOT: Kartu berbagi lokasi setelah dinonaktifkan]**

**Catatan:** Status berbagi lokasi disimpan di perangkat (localStorage). Jika Anda login di perangkat lain, Anda perlu mengaktifkan berbagi lokasi lagi di perangkat baru tersebut.

### 4.3.6 Troubleshooting Berbagi Lokasi

| Masalah | Kemungkinan Penyebab | Solusi |
|---------|---------------------|--------|
| Tombol "Aktifkan" tidak berfungsi | Browser meminta izin lokasi | Klik "Izinkan" atau "Allow" di dialog izin browser |
| Koordinat tidak muncul | GPS perangkat tidak aktif | Aktifkan GPS di pengaturan ponsel |
| Pembaruan otomatis terhenti | Browser menutup halaman | Buka kembali halaman TuTrack di browser |
| Pesan "Lokasi ditolak" | Izin lokasi dicabut | Buka pengaturan browser → izin lokasi → izinkan TuTrack |
| Lokasi tidak akurat | Sinyal GPS lemah | Berpindah ke lokasi terbuka untuk sinyal yang lebih baik |

---

## 4.4 Absensi (Berangkat/Pulang)

Menu Absensi memungkinkan FOC untuk mencatat kehadiran harian: Berangkat (check-in saat mulai bekerja) dan Pulang (check-out saat selesai bekerja). Fitur ini sama dengan Absensi NOC (lihat Bagian 3.4). Bagian ini akan menjelaskan langkah-langkah detail untuk FOC.

### 4.4.1 Membuka Halaman Absensi

**Di Desktop:**
1. Di sidebar, klik menu **"Absensi"**
2. Halaman Absensi akan terbuka

**Di Ponsel:**
1. Klik ikon **Clock** (🕐) di bar navigasi bawah
2. Halaman Absensi akan terbuka menampilkan dua bagian utama:
   - **Formulir Absensi** — Untuk mencatat kehadiran berangkat atau pulang
   - **Riwayat Absensi** — Daftar catatan kehadiran sebelumnya

**[SCREENSHOT: Halaman Absensi di ponsel dengan formulir dan riwayat]**

### 4.4.2 Mencatat Kehadiran Berangkat (Check-in)

Kehadiran berangkat mencatat waktu Anda mulai bekerja. Proses ini memerlukan **foto selfie**, **daftar tugas harian**, dan **lokasi GPS**.

#### Langkah 1: Klik Tombol Berangkat

1. Di halaman Absensi, klik tombol **"Berangkat"** yang berwarna hijau
2. Formulir kehadiran berangkat akan muncul

**[SCREENSHOT: Tombol Berangkat di halaman Absensi FOC]**

#### Langkah 2: Unggah Foto Selfie

1. Di bagian "Foto", klik area unggah foto atau ikon kamera
2. Pilih salah satu cara mengunggah foto:
   - **Kamera langsung**: Jika menggunakan ponsel, pilih "Ambil Foto" untuk membuka kamera
   - **Galeri foto**: Pilih "Pilih dari Galeri" untuk memilih foto yang sudah ada
3. Pastikan foto wajah Anda terlihat jelas (foto selfie)
4. Foto akan muncul di area unggah setelah berhasil diunggah

**[SCREENSHOT: Formulir unggah foto selfie untuk kehadiran berangkat]**

#### Langkah 3: Isi Daftar Tugas Harian

1. Di bagian "Tugas Hari Ini", Anda akan melihat kolom input untuk daftar tugas
2. Ketik tugas-tugas yang akan Anda kerjakan hari ini
3. Untuk menambah tugas baru, klik tombol **"+ Tambah Tugas"**
4. Untuk menghapus tugas, klik ikon tempat sampah (🗑️) di samping tugas tersebut
5. Isi minimal satu tugas harian

**Contoh daftar tugas harian:**
- Perbaikan jaringan di area Cikini
- Instalasi router di kantor cabang
- Pengecekan server di data center

**[SCREENSHOT: Formulir daftar tugas harian dengan beberapa tugas]**

#### Langkah 4: Ambil Lokasi GPS

1. Di bagian "Lokasi", klik tombol **"Ambil Lokasi Saat Ini"**
2. Browser akan meminta izin untuk mengakses lokasi Anda
3. Klik **"Izinkan"** atau **"Allow"** untuk memberikan izin
4. Sistem akan mengambil koordinat GPS dari perangkat Anda
5. Koordinat akan ditampilkan di bagian lokasi (contoh: -6.123456, 106.123456)

**Penting:** Pastikan GPS perangkat Anda aktif dan Anda berada di lokasi yang tepat sebelum mengambil lokasi GPS.

**[SCREENSHOT: Tombol Ambil Lokasi GPS dan hasil koordinat]**

#### Langkah 5: Simpan Kehadiran Berangkat

1. Setelah semua kolom terisi (foto, tugas harian, lokasi GPS), klik tombol **"Simpan"**
2. Sistem akan memproses kehadiran Anda
3. Jika berhasil, Anda akan melihat pesan sukses: "Kehadiran berangkat berhasil dicatat"
4. Kehadiran akan muncul di riwayat absensi

**[SCREENSHOT: Pesan sukses kehadiran berangkat berhasil dicatat]**

### 4.4.3 Mencatat Kehadiran Pulang (Check-out)

Kehadiran pulang mencatat waktu Anda selesai bekerja. Proses ini lebih sederhana — hanya memerlukan **lokasi GPS**.

#### Langkah 1: Klik Tombol Pulang

1. Di halaman Absensi, klik tombol **"Pulang"** yang berwarna oranye
2. Formulir kehadiran pulang akan muncul

**[SCREENSHOT: Tombol Pulang di halaman Absensi FOC]**

#### Langkah 2: Ambil Lokasi GPS

1. Di bagian "Lokasi", klik tombol **"Ambil Lokasi Saat Ini"**
2. Browser akan meminta izin untuk mengakses lokasi Anda (jika belum diberikan)
3. Klik **"Izinkan"** atau **"Allow"** untuk memberikan izin
4. Sistem akan mengambil koordinat GPS dari perangkat Anda
5. Koordinat akan ditampilkan di bagian lokasi

**[SCREENSHOT: Formulir kehadiran pulang dengan tombol Ambil Lokasi GPS]**

#### Langkah 3: Simpan Kehadiran Pulang

1. Setelah lokasi GPS berhasil diambil, klik tombol **"Simpan"**
2. Sistem akan memproses kehadiran pulang Anda
3. Jika berhasil, Anda akan melihat pesan sukses: "Kehadiran pulang berhasil dicatat"
4. Kehadiran pulang akan muncul di riwayat absensi

**[SCREENSHOT: Pesan sukses kehadiran pulang berhasil dicatat]**

### 4.4.4 Memahami Aturan Kehadiran

Sistem kehadiran memiliki beberapa aturan penting:

| Aturan | Keterangan |
|--------|-----------|
| **Pencegahan Duplikat** | Anda tidak bisa mencatat kehadiran berangkat dua kali dalam satu hari yang sama. Jika sudah mencatat berangkat, tombol berangkat akan dinonaktifkan untuk hari itu. |
| **Pencegahan Duplikat Pulang** | Anda tidak bisa mencatat kehadiran pulang dua kali dalam satu hari yang sama. Jika sudah mencatat pulang, tombol pulang akan dinonaktifkan untuk hari itu. |
| **Urutan Wajar** | Sebaiknya catat kehadiran berangkat sebelum pulang dalam satu hari. |
| **Lokasi GPS Wajib** | Kehadiran berangkat dan pulang memerlukan lokasi GPS. Pastikan GPS perangkat aktif. |
| **Foto Wajib (Berangkat)** | Kehadiran berangkat memerlukan foto selfie. Pastikan foto wajah terlihat jelas. |

**[SCREENSHOT: Tombol Berangkat/Pulang yang dinonaktifkan karena sudah dicatat hari ini]**

### 4.4.5 Melihat Riwayat Absensi

Di bagian bawah halaman Absensi, Anda akan melihat riwayat kehadiran:

#### Format Daftar Riwayat

Setiap entri riwayat menampilkan:
- **Tanggal** — Tanggal kehadiran
- **Jenis** — Berangkat atau Pulang
- **Waktu** — Jam kehadiran dicatat
- **Lokasi** — Koordinat GPS lokasi kehadiran
- **Status** — Berhasil atau Gagal

**[SCREENSHOT: Daftar riwayat absensi dengan beberapa entri]**

#### Menyaring Riwayat Berdasarkan Tanggal

1. Di bagian atas riwayat, terdapat pemilih rentang tanggal
2. Klik pada kolom **"Tanggal Mulai"** dan pilih tanggal awal
3. Klik pada kolom **"Tanggal Akhir"** dan pilih tanggal akhir
4. Riwayat akan secara otomatis memperbarui data berdasarkan rentang tanggal yang dipilih

**[SCREENSHOT: Pemilih rentang tanggal untuk riwayat absensi]**

#### Menyaring Riwayat Berdasarkan Jenis

1. Di bagian atas riwayat, terdapat tombol filter jenis
2. Klik tombol **"Filter"**
3. Pilih jenis kehadiran yang ingin ditampilkan:
   - ✅ Berangkat
   - ✅ Pulang
4. Riwayat hanya akan menampilkan jenis kehadiran yang dipilih

**[SCREENSHOT: Filter jenis kehadiran di riwayat absensi]**

### 4.4.6 Melihat Detail Kehadiran

1. Di daftar riwayat absensi, klik pada entri kehadiran yang ingin dilihat detailnya
2. Panel detail akan terbuka menampilkan:
   - **Tanggal dan Waktu** — Kapan kehadiran dicatat
   - **Jenis** — Berangkat atau Pulang
   - **Lokasi GPS** — Koordinat lokasi kehadiran
   - **Foto Selfie** — Foto selfie saat kehadiran berangkat (hanya untuk berangkat)
   - **Daftar Tugas** — Tugas-tugas yang akan dikerjakan hari ini (hanya untuk berangkat)
   - **Peta Lokasi** — Peta kecil yang menunjukkan lokasi kehadiran

**[SCREENSHOT: Panel detail kehadiran dengan foto selfie dan peta lokasi]**

### 4.4.7 Melihat Statistik Kehadiran

Di bagian atas halaman Absensi, terdapat kartu statistik kehadiran:

| Kartu | Keterangan |
|-------|-----------|
| **Hari Ini** | Status kehadiran hari ini: sudah berangkat, sudah pulang, atau belum absen |
| **Total Berangkat** | Jumlah hari kehadiran berangkat dalam periode tertentu |
| **Total Pulang** | Jumlah hari kehadiran pulang dalam periode tertentu |

**[SCREENSHOT: Kartu statistik kehadiran di halaman Absensi FOC]**

---

## 4.5 Peta

Halaman Peta memungkinkan FOC untuk melihat posisi sendiri di peta, melihat lokasi tugas, dan melihat posisi anggota tim lainnya. Peta menggunakan Leaflet dengan peta CartoDB Dark Matter (latar belakang gelap).

### 4.5.1 Membuka Halaman Peta

**Di Desktop:**
1. Di sidebar, klik menu **"Peta"**
2. Peta akan terbuka menampilkan posisi Anda dan anggota tim

**Di Ponsel:**
1. Klik ikon **Map** (🗺️) di bar navigasi bawah
2. Peta akan terbuka dalam tampilan layar penuh

**[SCREENSHOT: Halaman Peta di ponsel dengan tampilan layar penuh]**

### 4.5.2 Memahami Pin di Peta

Peta menampilkan beberapa jenis pin:

| Warna Pin | Keterangan |
|-----------|-----------|
| **Kuning** | Posisi Anda (FOC) — pin bergerak mengikuti lokasi GPS Anda |
| **Biru** | Admin |
| **Hijau** | NOC |
| **Ungu** | Marketing |
| **Oranye** | Lokasi tugas (jika tugas memiliki koordinat GPS) |

Klik pada pin untuk melihat detail:
- Nama anggota tim atau nama tugas
- Peran (untuk pin anggota tim)
- Waktu terakhir update lokasi
- Status: Bergerak atau Berhenti

**[SCREENSHOT: Peta dengan berbagai warna pin dan detail setelah diklik]**

### 4.5.3 Melihat Posisi Sendiri

1. Saat peta terbuka, posisi Anda akan ditampilkan dengan pin kuning
2. Peta akan otomatis zoom ke posisi Anda
3. Jika berbagi lokasi aktif, pin akan bergerak mengikuti pergerakan Anda
4. Koordinat posisi Anda akan ditampilkan di bagian bawah peta

**[SCREENSHOT: Peta dengan pin kuning menunjukkan posisi FOC]**

### 4.5.4 Melihat Lokasi Tugas di Peta

1. Di peta, cari pin oranye yang menunjukkan lokasi tugas
2. Klik pada pin oranye untuk melihat detail tugas
3. Informasi yang ditampilkan:
   - **Nama Tugas** — Judul tugas
   - **Prioritas** — Urgent, Tinggi, Sedang, atau Rendah
   - **Status** — Status tugas saat ini
   - **Deadline** — Batas waktu tugas
4. Klik tombol **"Navigasi"** untuk membuka aplikasi peta di ponsel dengan rute ke lokasi tugas

**[SCREENSHOT: Pin oranye lokasi tugas di peta dengan detail tugas]**

### 4.5.5 Melihat Anggota Tim Lainnya

1. Di peta, Anda akan melihat pin-pin anggota tim lainnya dengan warna sesuai peran
2. Klik pada pin anggota tim untuk melihat:
   - **Nama** — Nama anggota tim
   - **Peran** — Admin, NOC, FOC, atau Marketing
   - **Waktu Terakhir Update** — Kapan lokasi terakhir dikirim
   - **Status** — Bergerak atau Berhenti
3. Pin anggota tim yang sedang berbagi lokasi akan memiliki animasi berkedip

**[SCREENSHOT: Peta dengan pin-pin anggota tim dan detail setelah diklik]**

### 4.5.6 Menyaring Pin di Peta

1. Di bagian atas peta, terdapat tombol filter
2. Klik tombol **"Filter"**
3. Pilih jenis pin yang ingin ditampilkan:
   - ✅ Admin (biru)
   - ✅ NOC (hijau)
   - ✅ FOC (kuning)
   - ✅ Marketing (ungu)
   - ✅ Lokasi Tugas (oranye)
4. Klik **"Terapkan"** untuk memperbarui peta
5. Peta hanya akan menampilkan pin yang dipilih

**[SCREENSHOT: Filter pin di peta untuk FOC]**

### 4.5.7 Mencari Pengguna atau Tugas di Peta

1. Di bagian atas peta, terdapat kolom pencarian
2. Ketik nama anggota tim atau nama tugas yang ingin dicari
3. Peta akan menyorot pin yang cocok
4. Peta akan otomatis zoom ke lokasi pin

**[SCREENSHOT: Kolom pencarian di peta]**

### 4.5.8 Zoom dan Navigasi Peta

- **Scroll mouse** (desktop) atau **cubit** (ponsel) untuk zoom in/out
- **Klik dan seret** untuk menggeser peta
- **Tombol +/-** di pojok kiri bawah untuk zoom
- **Tombol lokasi** untuk kembali ke posisi Anda

**[SCREENSHOT: Kontrol zoom dan navigasi peta]**

### 4.5.9 Melihat Rute Perjalanan

1. Di bagian atas peta, terdapat pemilih tanggal
2. Klik pada kolom tanggal dan pilih tanggal yang ingin dilihat
3. Peta akan menampilkan garis route perjalanan Anda sepanjang hari
4. Garis berwarna menunjukkan perjalanan aktif (bergerak)
5. Titik-titik menunjukkan lokasi berhenti (statis)
6. Klik pada titik untuk melihat waktu berhenti dan durasi

**[SCREENSHOT: Peta dengan garis route perjalanan dan titik berhenti]**

---

**Selesai!** Anda sekarang telah memahami semua fitur yang tersedia untuk peran FOC di TuTrack. Lanjutkan ke BAGIAN 5 untuk mempelajari fitur Marketing, atau ke BAGIAN 6 untuk panduan Troubleshooting dan FAQ.

---

# BAGIAN 5: Marketing

Bagian ini menjelaskan semua fitur yang tersedia untuk pengguna dengan peran **Marketing**. Marketing memiliki akses ke Dashboard Marketing dengan ringkasan pipeline prospek dan tower, manajemen prospek (CRUD + status tracking), data tower sites, pencatatan kunjungan lapangan, peta, dan absensi. Berbeda dengan Admin dan NOC, Marketing tidak memiliki akses ke Papan Tugas (Kanban Board).

**Catatan Penting tentang Akses Marketing:**

| Fitur | Akses Marketing | Keterangan |
|-------|-----------------|------------|
| **Dashboard Marketing** | ✅ Ya | Ringkasan statistik dan pipeline marketing |
| **Manajemen Prospek** | ✅ Ya | CRUD prospek, perubahan status, riwayat |
| **Tower Sites** | ✅ Ya | Melihat data tower dan pipeline status |
| **Kunjungan (Visit Logging)** | ✅ Ya | Pencatatan kunjungan lapangan dengan GPS |
| **Peta** | ✅ Ya | Melihat posisi anggota tim (FOC + Marketing) |
| **Absensi (Berangkat/Pulang)** | ✅ Ya | Pencatatan kehadiran harian |
| **Papan Tugas** | ❌ Tidak | Hanya Admin dan NOC |
| **Manajemen Tim** | ❌ Tidak | Hanya Admin |

---

## 5.1 Dashboard Marketing

Dashboard Marketing adalah halaman utama yang ditampilkan setelah login sebagai pengguna Marketing. Dashboard ini menampilkan ringkasan seluruh aktivitas marketing: statistik utama, pipeline prospek, pipeline tower, dan daftar kunjungan terakhir.

### 5.1.1 Membuka Dashboard Marketing

1. Login menggunakan PIN Anda (lihat Bagian 1.3 untuk panduan login)
2. Setelah login berhasil, Anda akan langsung melihat Dashboard Marketing
3. Jika sudah berada di halaman lain, klik menu **"Dashboard"** di sidebar untuk kembali ke Dashboard Marketing

**[SCREENSHOT: Dashboard Marketing setelah login berhasil]**

### 5.1.2 Memahami Tata Letak Dashboard Marketing

Dashboard Marketing memiliki tata letak berikut dari atas ke bawah:

| Bagian | Posisi | Keterangan |
|--------|--------|------------|
| **Header** | Paling atas | Judul "Dasbor Marketing" dan subjudul "Ringkasan aktivitas marketing" |
| **Kartu Statistik** | Di bawah header | Empat kartu statistik utama dalam satu baris |
| **Pipeline** | Di bawah kartu statistik | Dua grafik pipeline: Prospek dan Tower (sebelahan) |
| **Kunjungan Terakhir** | Paling bawah | Daftar kunjungan yang baru saja dilakukan |

**[SCREENSHOT: Anotasi tata letak Dashboard Marketing dengan label bagian]**

### 5.1.3 Melihat Kartu Statistik Utama

Di bagian paling atas dashboard (di bawah header), Anda akan melihat empat kartu statistik dalam satu baris:

| Kartu | Ikon | Keterangan |
|-------|------|------------|
| **Prospek Aktif** | Ikon Users (biru) | Jumlah prospek yang sedang dalam proses (status belum "Acc" atau "Tidak") |
| **Kunjungan Hari Ini** | Ikon ClipboardCheck (hijau) | Jumlah kunjungan yang tercatat hari ini |
| **Tower Disetujui** | Ikon Building (oranye) | Jumlah tower site yang sudah disetujui (status "ACC") |
| **Total Kunjungan** | Ikon Target (ungu) | Total seluruh kunjungan yang pernah tercatat |

Setiap kartu memiliki:
- **Label** — Nama statistik di bagian kiri atas
- **Angka** — Nilai statistik berukuran besar
- **Ikon** — Ikon berwarna di dalam kotak berlatar belakang senada di sebelah kanan

**[SCREENSHOT: Empat kartu statistik Marketing — Prospek Aktif, Kunjungan Hari Ini, Tower Disetujui, Total Kunjungan]**

### 5.1.4 Melihat Pipeline Prospek

Di bawah kartu statistik, di sebelah kiri, terdapat grafik **Pipeline Prospek** yang menunjukkan distribusi prospek berdasarkan status:

| Status | Label | Warna Bar |
|--------|-------|-----------|
| **Belum Diproses** | Belum Diproses | Abu-abu (#6B7280) |
| **Sudah di Followup** | Sudah di Followup | Biru (#3B82F6) |
| **Acc** | Acc | Hijau (#10B981) |
| **Tidak** | Tidak | Merah (#EF4444) |

Setiap baris pipeline menampilkan:
- **Label status** — Di sebelah kiri
- **Bar horizontal** — Panjang bar proporsional terhadap jumlah prospek
- **Angka jumlah** — Di sebelah kanan bar

Grafik ini membantu Anda melihat secara sekilas berapa banyak prospek di setiap tahap pipeline.

**[SCREENSHOT: Grafik Pipeline Prospek dengan empat status dan bar horizontal]**

### 5.1.5 Melihat Pipeline Tower

Di bawah kartu statistik, di sebelah kanan, terdapat grafik **Pipeline Tower** yang menunjukkan distribusi tower site berdasarkan status:

| Status | Label | Warna Bar |
|--------|-------|-----------|
| **Baru Ditugaskan** | Baru Ditugaskan | Abu-abu (#6B7280) |
| **Pending** | Pending | Kuning (#F59E0B) |
| **Diproses** | Diproses | Biru (#3B82F6) |
| **Acc** | Acc | Hijau (#10B981) |
| **Rejected** | Rejected | Merah (#EF4444) |

Cara membaca grafik sama dengan Pipeline Prospek: label status di kiri, bar horizontal di tengah, dan angka jumlah di kanan.

**[SCREENSHOT: Grafik Pipeline Tower dengan lima status dan bar horizontal]**

### 5.1.6 Melihat Daftar Kunjungan Terakhir

Di bagian paling bawah dashboard, terdapat bagian **"Kunjungan Terakhir"** yang menampilkan daftar 5 kunjungan terbaru:

Setiap entri kunjungan menampilkan:
- **Ikon bulat** — Ikon berwarna biru untuk kunjungan prospek, oranye untuk kunjungan tower
- **Nama** — Nama prospek atau tower site yang dikunjungi
- **Catatan** — Ringkasan catatan kunjungan (dipotong jika terlalu panjang)
- **Badge Status** — Badge berwarna yang menunjukkan status saat kunjungan dilakukan
- **Tanggal** — Tanggal kunjungan

Jika belum ada kunjungan, Anda akan melihat pesan kosong: **"Belum ada kunjungan"** dengan deskripsi **"Riwayat kunjungan akan muncul di sini."**

**[SCREENSHOT: Daftar Kunjungan Terakhir di Dashboard Marketing]**

### 5.1.7 Memperbarui Data Dashboard

Dashboard Marketing memperbarui data secara otomatis saat pertama kali dimuat. Untuk memperbarui data:

1. Muat ulang halaman dashboard dengan menekan **F5** atau klik tombol refresh browser
2. Data statistik dan pipeline akan diperbarui dari server

**[SCREENSHOT: Tombol refresh browser]**

---

## 5.2 Prospek (CRUD + Status Tracking)

Menu Manajemen Prospek memungkinkan Anda untuk mengelola data prospek: membuat prospek baru, mengedit informasi, mengubah status, melihat riwayat perubahan status, dan menghapus prospek (soft delete).

### 5.2.1 Membuka Halaman Prospek

1. Di sidebar, klik menu **"Prospek"**
2. Halaman Manajemen Prospek akan terbuka menampilkan daftar seluruh prospek dalam format tabel

**[SCREENSHOT: Halaman Manajemen Prospek dengan daftar prospek dalam tabel]**

### 5.2.2 Memahami Tabel Prospek

Tabel prospek memiliki kolom-kolom berikut:

| Kolom | Keterangan |
|-------|-----------|
| **Nama** | Nama prospek dengan avatar huruf pertama dalam lingkaran biru |
| **Telepon** | Nomor telepon kontak prospek |
| **Area** | Area lokasi prospek |
| **Status** | Badge status berwarna dengan dropdown untuk perubahan status |
| **Penanggung Jawab** | Nama anggota tim marketing yang ditugaskan |
| **Aksi** | Tombol Edit (pensil) dan Hapus (tempat sampah) |

**[SCREENSHOT: Tabel prospek dengan semua kolom terlihat]**

### 5.2.3 Mencari Prospek

1. Di bagian atas halaman, sebelah kanan, terdapat kolom pencarian dengan ikon kaca pembesar
2. Ketik kata kunci di kolom pencarian (placeholder: "Cari prospek...")
3. Pencarian bekerja berdasarkan **nama**, **nomor telepon**, atau **area**
4. Tabel akan secara otomatis memfilter hasil pencarian saat Anda mengetik
5. Untuk menghapus filter, hapus teks dari kolom pencarian

**[SCREENSHOT: Kolom pencarian prospek dengan ikon kaca pembesar]**

### 5.2.4 Membuat Prospek Baru

#### Langkah 1: Klik Tombol "Tambah Prospek"

1. Di pojok kanan atas halaman, klik tombol **"Tambah Prospek"** yang berwarna hijau
2. Formulir dialog **"Tambah Prospek Baru"** akan muncul di tengah layar

**[SCREENSHOT: Tombol "Tambah Prospek" di pojok kanan atas]**

#### Langkah 2: Isi Formulir Prospek

Formulir memiliki field-field berikut:

| Field | Tipe | Keterangan | Wajib? |
|-------|------|------------|--------|
| **Nama** | Input teks | Nama prospek atau perusahaan | ✅ Ya |
| **Telepon** | Input teks | Nomor telepon kontak | Tidak |
| **Area** | Input teks | Area lokasi prospek | Tidak |
| **Alamat** | Input teks | Alamat lengkap prospek | Tidak |
| **Status** | Dropdown | Status prospek (default: "Belum Diproses") | Tidak |
| **Tugaskan ke** | Dropdown | Penanggung jawab dari tim marketing | ✅ Ya |
| **Catatan** | Input teks | Catatan tambahan tentang prospek | Tidak |

**Langkah-langkah pengisian:**

1. Klik pada kolom **"Nama"** dan ketik nama prospek (contoh: "PT Telkom Indonesia")
2. Klik pada kolom **"Telepon"** dan ketik nomor telepon kontak (contoh: "081234567890")
3. Klik pada kolom **"Area"** dan ketik area lokasi (contoh: "Jakarta Selatan")
4. Klik pada kolom **"Alamat"** dan ketik alamat lengkap (contoh: "Jl. Gatot Subroto No. 52")
5. Klik dropdown **"Status"** dan pilih salah satu status:
   - **Belum Diproses** — Prospek baru, belum ada tindakan
   - **Sudah di Followup** — Sudah melakukan kontak awal
   - **Acc** — Prospek disetujui/diterima
   - **Tidak** — Prospek ditolak
6. Dropdown **"Tugaskan ke"** akan menampilkan daftar anggota tim marketing. Pilih nama yang bertanggung jawab atas prospek ini
7. Klik kolom **"Catatan"** dan ketik catatan tambahan (opsional)

**[SCREENSHOT: Formulir "Tambah Prospek Baru" dengan semua field]**

#### Langkah 3: Simpan Prospek

1. Setelah semua field wajib terisi, klik tombol **"Simpan"** di pojok kanan bawah formulir
2. Jika berhasil, Anda akan melihat notifikasi sukses: **"Prospek berhasil dibuat!"**
3. Dialog akan tertutup secara otomatis
4. Prospek baru akan muncul di daftar tabel dengan status yang dipilih
5. Jika ada kesalahan (contoh: nama kosong), Anda akan melihat pesan error: **"Nama dan penanggung jawab wajib diisi"**

**[SCREENSHOT: Notifikasi sukses "Prospek berhasil dibuat!"]**

**Catatan Penting:**
- Field **Nama** dan **Tugaskan ke** wajib diisi
- Saat membuat prospek baru, koordinat lokasi default digunakan (latitude: -6.2088, longitude: 106.8456)
- Status default untuk prospek baru adalah "Belum Diproses"

### 5.2.5 Mengedit Prospek

#### Langkah 1: Klik Ikon Edit

1. Di tabel prospek, cari prospek yang ingin diedit
2. Di kolom **"Aksi"**, klik ikon pensil (pensil) pada baris prospek tersebut
3. Formulir dialog **"Edit Prospek"** akan muncul dengan data yang sudah terisi

**[SCREENSHOT: Ikon pensil (edit) di kolom Aksi]**

#### Langkah 2: Ubah Informasi

1. Formulir edit memiliki field yang sama dengan formulir tambah prospek
2. Semua field sudah terisi dengan data saat ini
3. Ubah informasi yang ingin diubah:
   - **Nama** — Edit nama prospek
   - **Telepon** — Ubah nomor telepon
   - **Area** — Ubah area lokasi
   - **Alamat** — Ubah alamat
   - **Status** — Ubah status prospek
   - **Tugaskan ke** — Ubah penanggung jawab
   - **Catatan** — Ubah catatan

**[SCREENSHOT: Formulir "Edit Prospek" dengan data yang sudah terisi]**

#### Langkah 3: Simpan Perubahan

1. Setelah perubahan selesai, klik tombol **"Simpan"**
2. Jika berhasil, notifikasi sukses: **"Prospek berhasil diperbarui!"**
3. Dialog akan tertutup dan tabel akan memperbarui data

**[SCREENSHOT: Notifikasi sukses "Prospek berhasil diperbarui!"]**

### 5.2.6 Mengubah Status Prospek (Langsung dari Tabel)

Anda bisa mengubah status prospek langsung dari tabel tanpa membuka formulir edit.

#### Langkah 1: Temukan Dropdown Status

1. Di tabel prospek, lihat kolom **"Status"**
2. Setiap prospek memiliki badge status berwarna yang juga berfungsi sebagai dropdown
3. Warna badge menunjukkan status saat ini:
   - **Abu-abu** — Belum Diproses
   - **Biru** — Sudah di Followup
   - **Hijau** — Acc
   - **Merah** — Tidak

**[SCREENSHOT: Badge status prospek di kolom Status]**

#### Langkah 2: Ubah Status

1. Klik pada dropdown status prospek yang ingin diubah
2. Pilih status baru dari daftar yang muncul:
   - **Belum Diproses**
   - **Sudah di Followup**
   - **Acc**
   - **Tidak**
3. Status akan langsung diperbarui
4. Anda akan melihat notifikasi sukses: **"Status berhasil diperbarui"**
5. Riwayat perubahan status akan otomatis tercatat

**[SCREENSHOT: Dropdown status prospek dengan empat opsi]**

### 5.2.7 Melihat Riwayat Perubahan Status Prospek

Setiap perubahan status prospek tercatat dalam riwayat. Riwayat ini mencatat siapa yang mengubah status, kapan, dan dari status apa ke status apa.

#### Langkah 1: Klik Ikon Riwayat

1. Di kolom **"Status"** tabel prospek, sebelah kanan dropdown, terdapat ikon riwayat (ikon jam)
2. Klik ikon tersebut pada prospek yang ingin dilihat riwayatnya
3. Dialog **"Riwayat Status"** akan muncul

**[SCREENSHOT: Ikon riwayat (jam) di sebelah kanan dropdown status]**

#### Langkah 2: Membaca Riwayat

Dialog riwayat menampilkan daftar perubahan status dari yang terbaru ke yang terlama. Setiap entri riwayat menampilkan:

| Elemen | Keterangan |
|--------|------------|
| **Avatar** | Huruf pertama nama pengubah dalam lingkaran hijau |
| **Nama Pengubah** | Nama anggota tim yang mengubah status |
| **Teks "mengubah status"** | Keterangan bahwa ini adalah perubahan status |
| **Status Lama** | Badge status sebelumnya (dengan warna) |
| **Tanda panah (→)** | Pemisah antara status lama dan baru |
| **Status Baru** | Badge status yang baru dipilih (dengan warna) |
| **Tanggal/Waktu** | Kapan perubahan terjadi (format: "25 Jun 2026, 14:30") |

**[SCREENSHOT: Dialog "Riwayat Status" dengan beberapa entri riwayat]**

#### Langkah 3: Menutup Dialog Riwayat

1. Klik tombol **X** di pojok kanan atas dialog, atau klik di luar dialog
2. Dialog akan tertutup

**Catatan:** Jika belum ada riwayat perubahan status, Anda akan melihat pesan: **"Belum ada riwayat perubahan status"**

### 5.2.8 Menghapus Prospek (Soft Delete)

Menghapus prospek menggunakan mekanisme soft delete — data tidak dihapus permanen, melainkan dipindahkan ke sampah dan bisa dipulihkan.

#### Langkah 1: Klik Ikon Hapus

1. Di tabel prospek, cari prospek yang ingin dihapus
2. Di kolom **"Aksi"**, klik ikon tempat sampah (🗑️) pada baris prospek tersebut

**[SCREENSHOT: Ikon tempat sampah (hapus) di kolom Aksi]**

#### Langkah 2: Konfirmasi Penghapusan

1. Dialog konfirmasi akan muncul dengan pesan: **"Yakin ingin menghapus [Nama Prospek]? Data akan dipindahkan ke sampah."**
2. Klik tombol **"Hapus"** (merah) untuk mengonfirmasi
3. Atau klik tombol **"Batal"** untuk membatalkan

**[SCREENSHOT: Dialog konfirmasi hapus prospek]**

#### Langkah 3: Verifikasi Penghapusan

1. Jika berhasil, notifikasi sukses: **"Prospek dipindahkan ke sampah"**
2. Prospek akan hilang dari daftar tabel
3. Data masih tersimpan di sistem dan bisa dipulihkan oleh admin

**[SCREENSHOT: Notifikasi sukses "Prospek dipindahkan ke sampah"]**

### 5.2.9 Memahami Status Prospek

Berikut penjelasan lengkap keempat status prospek:

| Status | Label | Warna | Keterangan |
|--------|-------|-------|------------|
| **belum_diproses** | Belum Diproses | Abu-abu (#6B7280) | Prospek baru, belum ada tindakan follow-up |
| **sudah_followup** | Sudah di Followup | Biru (#3B82F6) | Sudah melakukan kontak awal dengan prospek |
| **acc** | Acc | Hijau (#10B981) | Prospek disetujui atau diterima sebagai klien |
| **tidak** | Tidak | Merah (#EF4444) | Prospek ditolak atau tidak memenuhi syarat |

**Alur Status yang Disarankan:**
```
Belum Diproses → Sudah di Followup → Acc (diterima)
                                   → Tidak (ditolak)
```

**[SCREENSHOT: Empat badge status prospek dengan warna berbeda]**

---

## 5.3 Tower Sites

Tower Sites adalah data lokasi tower yang dikelola oleh tim marketing. Data tower ditampilkan di Dashboard Marketing dalam bentuk pipeline status dan digunakan saat mencatat kunjungan. Setiap tower site memiliki informasi nama, jenis lokasi, kontak, status, dan koordinat GPS.

### 5.3.1 Melihat Data Tower di Dashboard

Data tower site ditampilkan di Dashboard Marketing melalui dua komponen:

#### Pipeline Tower

Di Dashboard Marketing, grafik **Pipeline Tower** menunjukkan distribusi tower site berdasarkan status:

| Status | Label | Warna | Keterangan |
|--------|-------|-------|------------|
| **baru_ditugaskan** | Baru Ditugaskan | Abu-abu (#6B7280) | Tower baru yang belum diproses |
| **pending** | Pending | Kuning (#F59E0B) | Tower menunggu proses lebih lanjut |
| **diproses** | Diproses | Biru (#3B82F6) | Tower sedang dalam proses |
| **acc** | Acc | Hijau (#10B981) | Tower sudah disetujui |
| **rejected** | Rejected | Merah (#EF4444) | Tower ditolak |

#### Kartu Statistik "Tower Disetujui"

Kartu statistik **"Tower Disetujui"** di dashboard menampilkan jumlah tower dengan status "ACC" (disetujui). Angka ini membantu Anda melihat berapa banyak tower yang sudah lolos proses.

**[SCREENSHOT: Pipeline Tower dan Kartu Tower Disetujui di Dashboard Marketing]**

### 5.3.2 Memahami Tipe Tower Site

Setiap tower site memiliki jenis lokasi (site type) yang menunjukkan tipe area di mana tower berada:

| Tipe | Label | Ikon | Keterangan |
|------|-------|------|------------|
| **village** | Kampung | 🏘️ | Tower di area pemukiman/kampung |
| **school** | Sekolah | 🏫 | Tower di area sekolah |
| **corporate** | Perusahaan | 🏢 | Tower di area kantor/perusahaan |
| **government** | Pemerintah | 🏛️ | Tower di area pemerintahan |
| **other** | Lainnya | 📍 | Tipe lokasi lainnya |

**[SCREENSHOT: Daftar tipe tower site dengan ikon]**

### 5.3.3 Menggunakan Tower Saat Mencatat Kunjungan

Tower site dapat dipilih sebagai target kunjungan saat Anda mencatat kunjungan lapangan. Untuk panduan lengkap mencatat kunjungan ke tower, lihat **Bagian 5.4.4**.

Saat mencatat kunjungan tower:
1. Pilih tab **"Tower"** pada formulir kunjungan
2. Pilih tower site dari dropdown
3. Pilih status baru untuk tower
4. Isi catatan kunjungan
5. Bagikan lokasi GPS

Status tower akan otomatis diperbarui setelah kunjungan tercatat.

**[SCREENSHOT: Formulir kunjungan dengan tab "Tower" aktif dan dropdown tower]**

---

## 5.4 Kunjungan (Visit Logging)

Menu Kunjungan memungkinkan Anda untuk mencatat kunjungan lapangan ke prospek atau tower site. Setiap kunjungan tercatat dengan GPS coordinates, catatan, status snapshot, dan nama pengunjung. Kunjungan dibagi menjadi dua kategori: kunjungan ke prospek dan kunjungan ke tower.

### 5.4.1 Membuka Halaman Kunjungan

1. Di sidebar, klik menu **"Kunjungan"**
2. Halaman Log Kunjungan akan terbuka menampilkan daftar kunjungan

**[SCREENSHOT: Halaman Log Kunjungan dengan tab dan daftar kunjungan]**

### 5.4.2 Memahami Tata Letak Halaman Kunjungan

Halaman Kunjungan memiliki tata letak berikut:

| Bagian | Posisi | Keterangan |
|--------|--------|------------|
| **Header** | Paling atas | Judul "Log Kunjungan", subjudul, dan tombol "Catat Kunjungan" |
| **Tab Navigasi** | Di bawah header | Dua tab: "Prospek" dan "Tower" |
| **Daftar Kunjungan** | Di bawah tab | Kartu-kartu kunjungan yang sudah tercatat |

**[SCREENSHOT: Anotasi tata letak halaman Kunjungan]**

### 5.4.3 Beralih Antara Tab Prospek dan Tower

Halaman Kunjungan memiliki dua tab untuk memisahkan kunjungan berdasarkan jenis target:

1. **Tab "Prospek"** — Menampilkan kunjungan ke prospek
2. **Tab "Tower"** — Menampilkan kunjungan ke tower site

Untuk beralih:
1. Klik tab **"Prospek"** untuk melihat kunjungan ke prospek
2. Klik tab **"Tower"** untuk melihat kunjungan ke tower site
3. Tab yang aktif akan memiliki latar belakang hijau muda dengan teks hijau

**[SCREENSHOT: Dua tab "Prospek" dan "Tower" dengan tab "Prospek" aktif]**

### 5.4.4 Mencatat Kunjungan Baru

#### Langkah 1: Klik Tombol "Catat Kunjungan"

1. Di pojok kanan atas halaman kunjungan, klik tombol **"Catat Kunjungan"** yang berwarna hijau
2. Formulir dialog kunjungan akan muncul di tengah layar

**[SCREENSHOT: Tombol "Catat Kunjungan" di pojok kanan atas]**

#### Langkah 2: Pilih Tipe Kunjungan

Di bagian atas formulir, terdapat dua tab:
1. Klik tab **"Prospek"** jika kunjungan ditujukan ke prospek
2. Klik tab **"Tower"** jika kunjungan ditujukan ke tower site
3. Tab yang dipilih akan memiliki latar belakang hijau muda

**[SCREENSHOT: Tab tipe kunjungan "Prospek" dan "Tower" di formulir]**

#### Langkah 3: Pilih Item yang Dikunjungi

1. Di field **"Pilih item"**, klik dropdown
2. Jika tab "Prospek" dipilih, dropdown akan menampilkan daftar prospek yang tersedia
3. Jika tab "Tower" dipilih, dropdown akan menampilkan daftar tower site yang tersedia
4. Pilih item yang ingin dikunjungi dari daftar
5. Jika tidak ada data tersedia, Anda akan melihat pesan: **"Tidak ada data tersedia"**

**[SCREENSHOT: Dropdown "Pilih item" dengan daftar prospek/tower]**

#### Langkah 4: Pilih Status

1. Di field **"Pilih status"**, klik dropdown
2. Pilih status baru untuk item yang dikunjungi:
   - **Untuk Prospek:** Belum Diproses, Sudah di Followup, Acc, Tidak
   - **Untuk Tower:** Baru Ditugaskan, Pending, Diproses, Acc, Rejected
3. Status ini akan menjadi status snapshot kunjungan dan juga akan memperbarui status item secara otomatis

**[SCREENSHOT: Dropdown "Pilih status" dengan opsi status]**

#### Langkah 5: Isi Catatan Kunjungan

1. Di field **"Catatan"**, ketik hasil atau ringkasan kunjungan
2. Placeholder: "Isi hasil kunjungan..."
3. Contoh catatan: "Bertemu dengan Bapak Suryadi, membahas potensi kerja sama. Menunggu konfirmasi dari divisi procurement."

**[SCREENSHOT: Field catatan kunjungan dengan contoh teks]**

#### Langkah 6: Bagikan Lokasi GPS

1. Di bagian bawah formulir, terdapat area **Lokasi GPS**
2. Jika lokasi belum diambil, Anda akan melihat teks: **"Lokasi wajib dibagikan saat mencatat kunjungan"**
3. Klik tombol **"Bagikan Lokasi"** (dengan ikon kompas) di sebelah kanan
4. Browser akan meminta izin untuk mengakses lokasi Anda
5. Klik **"Izinkan"** atau **"Allow"**
6. Sistem akan mengambil koordinat GPS dari perangkat Anda
7. Koordinat akan ditampilkan (format: -6.123456, 106.123456)
8. Jika ingin memperbarui lokasi, klik tombol **"Bagikan Lokasi"** lagi

**Penting:** Lokasi GPS wajib dibagikan sebelum kunjungan bisa disimpan. Jika GPS tidak diaktifkan atau izin ditolak, Anda akan melihat pesan error: **"Lokasi wajib dibagikan saat mencatat kunjungan"**

**[SCREENSHOT: Area lokasi GPS dengan tombol "Bagikan Lokasi" dan koordinat]**

#### Langkah 7: Simpan Kunjungan

1. Setelah semua field terisi (tipe, item, status, catatan, lokasi GPS), klik tombol **"Simpan"**
2. Tombol akan berubah menjadi **"Menyimpan..."** dengan animasi loading
3. Jika berhasil:
   - Notifikasi sukses: **"Kunjungan berhasil dicatat!"**
   - Dialog akan tertutup
   - Status item (prospek/tower) akan otomatis diperbarui
   - Lokasi Anda akan diperbarui di peta
   - Kunjungan baru akan muncul di daftar kunjungan
4. Jika gagal, Anda akan melihat pesan error: **"Gagal menyimpan kunjungan"**

**[SCREENSHOT: Notifikasi sukses "Kunjungan berhasil dicatat!"]**

### 5.5.5 Melihat Daftar Kunjungan

Setelah kunjungan tercatat, Anda akan melihatnya di daftar kunjungan. Setiap kartu kunjungan menampilkan:

| Elemen | Keterangan |
|--------|------------|
| **Ikon bulat** | Biru untuk kunjungan prospek, oranye untuk kunjungan tower |
| **Nama** | Nama prospek atau tower site yang dikunjungi |
| **Badge Status** | Status saat kunjungan dilakukan (dengan warna sesuai status) |
| **Catatan** | Ringkasan catatan kunjungan |
| **Ikon MapPin + Koordinat** | Lokasi GPS kunjungan (format: -6.1234, 106.8456) |
| **Tanggal/Waktu** | Kapan kunjungan dilakukan (format Indonesia) |
| **Oleh** | Nama anggota tim yang melakukan kunjungan |

**[SCREENSHOT: Kartu kunjungan dengan semua elemen informasi]**

### 5.5.6 Memahami Pembaruan Status Otomatis

Saat Anda mencatat kunjungan dan memilih status baru, sistem akan:

1. **Mencatat kunjungan** — Data kunjungan disimpan dengan status snapshot
2. **Memperbarui status item** — Status prospek atau tower site akan otomatis diperbarui ke status yang Anda pilih
3. **Memperbarui lokasi** — Koordinat GPS Anda akan diperbarui di peta

Contoh:
- Anda mencatat kunjungan ke prospek "PT Telkom" dengan status "Sudah di Followup"
- Status prospek "PT Telkom" akan otomatis berubah dari "Belum Diproses" ke "Sudah di Followup"
- Riwayat perubahan status juga akan tercatat

**[SCREENSHOT: Ilustrasi pembaruan status otomatis setelah kunjungan]**

### 5.4.7 Memahami Status Kunjungan

Setiap kunjungan memiliki **status snapshot** — status item pada saat kunjungan dilakukan. Status ini ditampilkan sebagai badge berwarna pada kartu kunjungan.

Untuk kunjungan **Prospek:**

| Status | Label | Warna Badge |
|--------|-------|-------------|
| belum_diproses | Belum Diproses | Abu-abu |
| sudah_followup | Sudah di Followup | Biru |
| acc | Acc | Hijau |
| tidak | Tidak | Merah |

Untuk kunjungan **Tower:**

| Status | Label | Warna Badge |
|--------|-------|-------------|
| baru_ditugaskan | Baru Ditugaskan | Abu-abu |
| pending | Pending | Kuning |
| diproses | Diproses | Biru |
| acc | Acc | Hijau |
| rejected | Rejected | Merah |

**[SCREENSHOT: Berbagai badge status kunjungan dengan warna berbeda]**

---

## 5.5 Peta

Halaman Peta memungkinkan Anda melihat posisi anggota tim (FOC dan Marketing) di peta interaktif. Peta menggunakan Leaflet dengan CartoDB Dark Matter (latar belakang gelap) dan menampilkan pin-pin berwarna sesuai peran.

### 5.5.1 Membuka Halaman Peta

1. Di sidebar, klik menu **"Peta"**
2. Peta akan terbuka menampilkan area cakupan dengan pin-pin anggota tim

**[SCREENSHOT: Halaman Peta dengan pin-pin anggota tim]**

### 5.5.2 Memahami Pin di Peta

Peta menampilkan pin-pin berwarna sesuai peran anggota tim:

| Warna Pin | Peran | Keterangan |
|-----------|-------|------------|
| **Kuning** | FOC | Petugas lapangan yang sedang berbagi lokasi |
| **Ungu** | Marketing | Tim marketing (termasuk Anda) |

Klik pada pin untuk melihat detail:
- **Nama** — Nama anggota tim
- **Peran** — FOC atau Marketing
- **Waktu Terakhir Update** — Kapan lokasi terakhir dikirim
- **Status** — Bergerak atau Berhenti

Pin anggota tim yang sedang berbagi lokasi akan memiliki animasi berkedip.

**[SCREENSHOT: Peta dengan pin kuning (FOC) dan ungu (Marketing) beserta detail]**

### 5.5.3 Melihat Posisi Sendiri

1. Saat peta terbuka, posisi Anda (Marketing) akan ditampilkan dengan pin ungu
2. Peta akan otomatis zoom ke posisi Anda
3. Koordinat posisi Anda akan ditampilkan di bagian bawah peta

**[SCREENSHOT: Peta dengan pin ungu menunjukkan posisi Marketing]**

### 5.5.4 Melihat Anggota Tim Lainnya

1. Di peta, Anda akan melihat pin-pin anggota tim lainnya
2. Klik pada pin anggota tim untuk melihat detail informasi:
   - Nama
   - Peran (FOC atau Marketing)
   - Waktu terakhir update lokasi
   - Status: Bergerak atau Berhenti

**[SCREENSHOT: Detail anggota tim setelah pin diklik]**

### 5.5.5 Menyaring Pin di Peta

1. Di bagian atas peta, terdapat tombol **"Filter"**
2. Klik tombol filter
3. Pilih peran yang ingin ditampilkan:
   - ✅ FOC (kuning)
   - ✅ Marketing (ungu)
4. Klik **"Terapkan"** untuk memperbarui peta
5. Peta hanya akan menampilkan pin untuk peran yang dipilih

**[SCREENSHOT: Filter peran di peta Marketing]**

### 5.5.6 Mencari Pengguna di Peta

1. Di bagian atas peta, terdapat kolom pencarian
2. Ketik nama anggota tim yang ingin dicari
3. Peta akan menyorot pin yang cocok
4. Peta akan otomatis zoom ke lokasi pin

**[SCREENSHOT: Kolom pencarian pengguna di peta]**

### 5.5.7 Zoom dan Navigasi Peta

- **Scroll mouse** (desktop) atau **cubit** (ponsel) untuk zoom in/out
- **Klik dan seret** untuk menggeser peta
- **Tombol +/-** di pojok kiri bawah untuk zoom
- **Tombol lokasi** untuk kembali ke posisi Anda

**[SCREENSHOT: Kontrol zoom dan navigasi peta]**

---

**Selesai!** Anda sekarang telah memahami semua fitur yang tersedia untuk peran Marketing di TuTrack. Lanjutkan ke BAGIAN 6 untuk panduan Troubleshooting dan FAQ.

---

# BAGIAN 6: Troubleshooting / FAQ

Bagian ini membantu Anda mengatasi masalah umum yang mungkin terjadi saat menggunakan TuTrack. Setiap masalah dilengkapi dengan kemungkinan penyebab, langkah penyelesaian, dan kapan harus menghubungi admin.

---

## 6.1 Login Issues

### 6.1.1 PIN Tidak Berfungsi

**Masalah:** Anda memasukkan PIN tetapi tidak bisa login. Muncul pesan "PIN tidak valid" atau aplikasi tidak merespon.

**Kemungkinan Penyebab:**
- PIN yang dimasukkan salah (ketik ulang dengan hati-hati)
- Anda telah melebihi batas percobaan login
- Akun Anda telah dinonaktifkan oleh admin

**Langkah Penyelesaian:**

1. **Periksa ketikan PIN Anda**
   - Pastikan Anda memasukkan tepat 4 digit angka
   - Perhatikan bahwa PIN ditampilkan sebagai titik (••••) untuk keamanan
   - Jika ragu, hapus isian dan ketik ulang perlahan

2. **Jika muncul pesan "Terlalu banyak percobaan login"**
   - Sistem memiliki batas 5 percobaan login per menit per alamat IP
   - Tunggu 1 menit sebelum mencoba lagi
   - Jika masih gagal setelah menunggu, hubungi admin

3. **Jika muncul pesan "PIN tidak valid"**
   - PIN yang Anda masukkan tidak cocok dengan yang terdaftar di sistem
   - Hubungi admin untuk memverifikasi PIN Anda
   - Admin bisa melihat PIN di menu Manajemen Tim

4. **Jika muncul pesan "Akun tidak aktif"**
   - Akun Anda telah dinonaktifkan oleh admin
   - Hubungi admin untuk mengaktifkan kembali akun Anda

**[SCREENSHOT: Pesan error "PIN tidak valid" di halaman login]**

**Kapan Menghubungi Admin:**
- Setelah 3 kali mencoba PIN yang benar namun tetap gagal
- Ketika muncul pesan "Akun tidak aktif"
- Ketika Anda lupa PIN Anda

### 6.1.2 Pesan "Akun Tidak Aktif"

**Masalah:** Saat mencoba login, muncul pesan "Akun tidak aktif" meskipun PIN benar.

**Kemungkinan Penyebab:**
- Admin telah menonaktifkan akun Anda dari sistem
- Akun Anda belum pernah diaktifkan setelah dibuat

**Langkah Penyelesaian:**

1. Hubungi admin Anda dan minta aktivasi akun
2. Admin akan membuka menu **Manajemen Tim** dan mengubah status akun Anda dari "Tidak Aktif" menjadi "Aktif"
3. Setelah akun diaktifkan, coba login kembali

**[SCREENSHOT: Status "Tidak Aktif" di tabel Manajemen Tim]**

### 6.1.3 Masalah Kompatibilitas Browser

**Masalah:** Halaman login tidak muncul dengan benar, form PIN tidak bisa diklik, atau tampilan berantakan.

**Kemungkinan Penyebab:**
- Browser yang Anda gunakan sudah usang atau tidak didukung
- JavaScript dinonaktifkan di browser Anda
- Cache browser bermasalah

**Langkah Penyelesaian:**

1. **Gunakan browser yang didukung:**
   - Google Chrome (versi terbaru) — disarankan
   - Mozilla Firefox (versi terbaru)
   - Microsoft Edge (versi terbaru)
   - Safari (untuk pengguna iPhone/Mac)

2. **Aktifkan JavaScript:**
   - Buka pengaturan browser Anda
   - Pastikan JavaScript aktif (biasanya di menu Pengaturan → Privasi atau Keamanan)
   - Muat ulang halaman

3. **Hapus cache browser:**
   - Tekan `Ctrl + Shift + Delete` (Windows) atau `Cmd + Shift + Delete` (Mac)
   - Pilih "Cache" dan "Cookie"
   - Klik "Hapus data"
   - Muat ulang halaman TuTrack

4. **Coba browser lain:**
   - Jika masalah berlanjut, coba buka TuTrack di browser berbeda

**[SCREENSHOT: Pesan error browser yang tidak kompatibel]**

### 6.1.4 Masalah Koneksi Jaringan

**Masalah:** Halaman login tidak termuat, loading sangat lambat, atau muncul pesan error jaringan.

**Kemungkinan Penyebab:**
- Koneksi internet Anda terputus atau tidak stabil
- Server TuTrack sedang dalam pemeliharaan
- Firewall atau VPN memblokir akses

**Langkah Penyelesaian:**

1. **Periksa koneksi internet Anda:**
   - Buka situs web lain untuk memastikan internet berfungsi
   - Jika menggunakan Wi-Fi, coba restart router
   - Jika menggunakan data seluler, pastikan sinyal kuat

2. **Nonaktifkan VPN atau proxy:**
   - VPN kadang memblokir akses ke server TuTrack
   - Nonaktifkan VPN lalu coba login lagi

3. **Coba jaringan berbeda:**
   - Jika memungkinkan, beralih ke jaringan Wi-Fi atau data seluler lain

4. **Hubungi admin:**
   - Jika masalah berlanjut, mungkin server sedang dalam pemeliharaan
   - Admin bisa memeriksa status server

**[SCREENSHOT: Pesan error koneksi jaringan]**

---

## 6.2 Session Expired

### 6.2.1 Sesi Berakhir Setelah 50 Menit

**Masalah:** Anda sedang menggunakan TuTrack tiba-tiba melihat pesan "Sesi anda telah berakhir, harap login kembali" dan dialihkan ke halaman login.

**Kemungkinan Penyebab:**
- Sesi login memiliki waktu aktif 45 menit (dihitung sejak login)
- Setelah waktu aktif habis, sistem secara otomatis mengakhiri sesi
- Anda tidak melakukan aktivitas apa pun di aplikasi selama periode tersebut

**Langkah Penyelesaian:**

1. **Catatan penting:** Sesi akan berakhir otomatis setelah 45 menit tidak aktif
2. Ketika sesi berakhir, Anda akan melihat pesan: **"Sesi anda telah berakhir, harap login kembali"**
3. Setelah 2 detik, Anda akan otomatis dialihkan ke halaman login
4. Masukkan PIN Anda lagi untuk melanjutkan

**[SCREENSHOT: Pesan "Sesi anda telah berakhir" dengan animasi loading]**

### 6.2.2 Cara Menghindari Sesi Berakhir

**Langkah Pencegahan:**

1. **Tetap aktif di aplikasi:**
   - Lakukan interaksi minimal setiap 30 menit (klik menu, scroll, atau perbarui data)
   - Buka tab atau halaman baru di aplikasi
   - Periksa notifikasi secara berkala

2. **Perpanjang sesi secara aktif:**
   - Setiap kali Anda melakukan interaksi, timer sesi akan di-reset
   - Anda bisa melanjutkan bekerja tanpa batas waktu selama tetap aktif

3. **Gunakan browser dengan bijak:**
   - Jangan membuka TuTrack di tab tersembunyi lama
   - Jika harus meninggalkan komputer, simpan pekerjaan dan logout
   - Login kembali saat akan melanjutkan

**[SCREENSHOT: Ilustrasi interaksi yang memperpanjang sesi]**

### 6.2.3 Data yang Hilang Saat Sesi Berakhir

**Tenang!** Tidak ada data yang hilang saat sesi berakhir. Berikut yang terjadi:

| Aspek | Status |
|-------|--------|
| **Tugas yang sedang dikerjakan** | Tersimpan di server, tidak hilang |
| **Perubahan status tugas** | Sudah tersimpan otomatis |
| **Lokasi GPS** | Sudah tercatat di sistem |
| **Absensi** | Sudah tercatat dengan benar |
| **Data di form yang belum disimpan** | Bisa hilang (form belum terkirim) |

**Yang perlu dilakukan:**
- Login kembali dengan PIN Anda
- Semua data dan pekerjaan Anda masih tersimpan di server
- Lanjutkan dari posisi terakhir Anda

---

## 6.3 Location Sharing Problems

### 6.3.1 GPS Tidak Berfungsi di Browser

**Masalah:** Saat mencoba mengaktifkan berbagi lokasi, muncul pesan "Geolocation tidak didukung" atau lokasi tidak bisa diambil.

**Kemungkinan Penyebab:**
- Browser Anda tidak mendukung fitur geolocation
- GPS perangkat Anda tidak aktif
- Izin lokasi belum diberikan ke browser

**Langkah Penyelesaian:**

1. **Periksa apakah browser mendukung geolocation:**
   - Pastikan Anda menggunakan browser terbaru (Chrome, Firefox, Edge, atau Safari)
   - Browser lama mungkin tidak mendukung fitur ini

2. **Aktifkan GPS perangkat:**
   - **Di ponsel Android:** Buka Pengaturan → Lokasi → Aktifkan
   - **Di iPhone:** Buka Pengaturan → Privasi → Layanan Lokasi → Aktifkan
   - **Di komputer:** Pastikan GPS internal atau adapter GPS tersambung

3. **Berikan izin lokasi ke browser:**
   - Saat browser meminta izin, klik **"Izinkan"** atau **"Allow"**
   - Jika sebelumnya ditolak, hapus izin di pengaturan browser:
     - Chrome: Pengaturan → Privasi → Setelan Situs → Lokasi → Hapus blokir
     - Firefox: Pengaturan → Privasi → Izin → Lokasi → Hapus blokir
     - Edge: Pengaturan → Cookie dan izin situs → Lokasi → Hapus blokir

4. **Muat ulang halaman:**
   - Setelah mengaktifkan GPS dan izin, muat ulang halaman TuTrack
   - Coba aktifkan berbagi lokasi lagi

**[SCREENSHOT: Dialog izin lokasi di browser]**

### 6.3.2 Lokasi Tidak Terupdate di Peta

**Masalah:** Anda sudah mengaktifkan berbagi lokasi tetapi posisi Anda tidak bergerak di peta atau tidak muncul sama sekali.

**Kemungkinan Penyebab:**
- Koneksi internet tidak stabil (Supabase Realtime terputus)
- Lokasi terakhir sudah lama dan tidak ada pembaruan baru
- Masalah dengan koneksi Supabase Realtime

**Langkah Penyelesaian:**

1. **Periksa koneksi internet:**
   - Pastikan Anda memiliki koneksi internet yang stabil
   - Supabase Realtime membutuhkan koneksi aktif untuk memperbarui lokasi secara real-time

2. **Perbarui lokasi secara manual:**
   - Di dashboard FOC, klik tombol **"Perbarui Lokasi"** atau **"Bagikan Lokasi"**
   - Tunggu beberapa detik hingga lokasi terkirim ke server
   - Periksa apakah pin Anda bergerak di peta

3. **Muat ulang halaman:**
   - Tekan `F5` atau klik tombol refresh browser
   - Tunggu halaman memuat sepenuhnya
   - Periksa apakah pin muncul di peta

4. **Periksa status berbagi lokasi:**
   - Pastikan tombol "Berbagi Lokasi" dalam posisi aktif (hijau)
   - Jika tidak aktif, klik untuk mengaktifkannya kembali

**[SCREENSHOT: Tombol "Perbarui Lokasi" di dashboard FOC]**

### 6.3.3 Telegram Bot Tidak Terhubung

**Masalah:** Anda tidak bisa mengirim lokasi atau foto melalui Telegram, atau bot tidak merespon.

**Kemungkinan Penyebab:**
- Akun Telegram Anda belum terhubung dengan TuTrack
- Anda belum mengirim perintah `/start` ke bot
- Username Telegram di profil TuTrack tidak cocok dengan akun Telegram Anda

**Langkah Penyelesaian:**

1. **Pastikan bot sudah aktif:**
   - Cari bot **@TuTrackTrackingBot** di Telegram
   - Buka chat dengan bot tersebut

2. **Kirim perintah `/start`:**
   - Ketik `/start` di chat dengan bot
   - Bot akan merespon dengan pesan selamat datang
   - Jika bot meminta username, pastikan username Telegram Anda sudah diatur di profil TuTrack

3. **Periksa username Telegram di profil:**
   - Buka menu **Pengaturan** di TuTrack
   - Pastikan kolom **Telegram** diisi dengan username Telegram Anda (contoh: `@namapengguna`)
   - Jika belum diisi, minta admin untuk memperbarui profil Anda

4. **Kirim lokasi via Telegram:**
   - Setelah bot terhubung, kirim lokasi dari Telegram:
     - Tap ikon lampiran (📎) → Pilih **Lokasi** → **Bagikan Lokasi Terkini**
   - Lokasi Anda akan otomatis terupdate di peta TuTrack

**[SCREENSHOT: Chat dengan @TuTrackTrackingBot di Telegram]**

### 6.3.4 Pembaruan Lokasi Manual Tidak Berfungsi

**Masalah:** Tombol "Perbarui Lokasi" atau "Bagikan Lokasi" tidak merespon atau lokasi tidak terkirim.

**Kemungkinan Penyebab:**
- Izin lokasi browser ditolak
- GPS perangkat tidak aktif
- Koneksi internet terputus saat pengiriman

**Langkah Penyelesaian:**

1. **Periksa izin lokasi:**
   - Pastikan browser memiliki izin untuk mengakses lokasi Anda
   - Jika ditolak, hapus blokir izin di pengaturan browser (lihat Bagian 6.3.1)

2. **Aktifkan GPS:**
   - Pastikan GPS perangkat Anda aktif dan memiliki sinyal yang baik
   - Tunggu beberapa detik hingga GPS menemukan posisi Anda

3. **Periksa koneksi internet:**
   - Pastikan Anda memiliki koneksi internet yang aktif
   - Coba buka situs web lain untuk memastikan internet berfungsi

4. **Coba metode alternatif:**
   - Jika tombol web tidak berfungsi, gunakan Telegram bot sebagai alternatif
   - Kirim lokasi melalui Telegram (lihat Bagian 6.3.3)

---

## 6.4 Task Board Issues

### 6.4.1 Tugas Tidak Muncul di Papan Tugas

**Masalah:** Papan tugas kosong atau tidak menampilkan tugas yang seharusnya ada.

**Kemungkinan Penyebab:**
- Koneksi ke server Supabase terputus
- Filter pencarian atau penyaringan menyembunyikan tugas
- Tugas belum dibuat oleh admin atau NOC

**Langkah Penyelesaian:**

1. **Periksa koneksi internet:**
   - Pastikan Anda memiliki koneksi internet yang aktif
   - Muat ulang halaman dengan menekan `F5`

2. **Periksa filter pencarian:**
   - Pastikan kolom pencarian kosong (hapus teks di kolom pencarian)
   - Pastikan filter status tidak aktif atau pilih "Semua Status"
   - Pastikan filter penanggung jawab tidak aktif atau pilih "Semua"

3. **Periksa kolom tugas:**
   - Pastikan Anda melihat keempat kolom: Baru Ditugaskan, Sedang Dikerjakan, Sedang di Review, Selesai
   - Gulir ke kanan jika kolom tersembunyi (di layar kecil)

4. **Hubungi admin atau NOC:**
   - Jika tugas seharusnya ada tetapi tidak muncul, hubungi admin atau NOC
   - Mungkin tugas belum dibuat atau belum ditugaskan kepada Anda

**[SCREENSHOT: Papan tugas dengan kolom kosong]**

### 6.4.2 Drag and Drop Tidak Berfungsi

**Masalah:** Anda tidak bisa memindahkan tugas antar kolom dengan cara drag and drop.

**Kemungkinan Penyebab:**
- Browser tidak mendukung fitur drag and drop dengan baik
- Anda mencoba drag and drop di perangkat sentuh (ponsel) dengan cara yang salah
- Akses untuk mengubah status tugas tidak diberikan

**Langkah Penyelesaian:**

1. **Di komputer (desktop):**
   - Klik dan tahan kartu tugas selama 1 detik
   - Seret kartu ke kolom目标 (contoh: dari "Baru Ditugaskan" ke "Sedang Dikerjakan")
   - Lepaskan kartu di kolom目标
   - Status tugas akan otomatis diperbarui

2. **Di ponsel (mobile):**
   - Ketuk dan tahan kartu tugas selama 1 detik
   - Seret kartu ke kolom目标
   - Lepaskan kartu di kolom目标
   - Jika tidak berfungsi, gunakan tombol status di detail tugas

3. **Gunakan metode alternatif:**
   - Klik pada kartu tugas untuk membuka detail
   - Klik tombol **"Edit"** atau tombol status
   - Pilih status baru dari dropdown
   - Klik **"Simpan"**

4. **Periksa hak akses:**
   - Pastikan Anda memiliki akses untuk mengubah status tugas
   - FOC hanya bisa mengubah status tugas yang ditugaskan kepada mereka
   - Admin dan NOC bisa mengubah semua tugas

**[SCREENSHOT: Proses drag and drop kartu tugas]**

### 6.4.3 Tugas Tidak Ditemukan dengan Pencarian

**Masalah:** Anda mencari tugas tertentu tetapi tidak muncul di hasil pencarian.

**Kemungkinan Penyebab:**
- Kata kunci pencarian salah atau tidak cocok
- Tugas sedang dalam status terhapus (di trash)
- Tugas belum dibuat

**Langkah Penyelesaian:**

1. **Periksa kata kunci pencarian:**
   - Pastikan ejaan kata kunci benar
   - Coba gunakan kata kunci yang lebih umum
   - Hapus filter pencarian dan coba lagi

2. **Periksa filter:**
   - Pastikan filter status tidak menyembunyikan tugas yang dicari
   - Pilih "Semua Status" untuk melihat semua tugas
   - Periksa filter penanggung jawab dan tag

3. **Periksa trash tugas:**
   - Klik ikon tempat sampah (🗑️) di pojok kanan atas papan tugas
   - Periksa apakah tugas yang dicari ada di trash
   - Jika ada, klik **"Pulihkan"** untuk memulihkan tugas

4. **Hubungi admin atau NOC:**
   - Jika tugas seharusnya ada tetapi tidak ditemukan, hubungi admin atau NOC
   - Mungkin tugas belum dibuat atau sudah dihapus permanen

**[SCREENSHOT: Kolom pencarian tugas di papan tugas]**

### 6.4.4 Status Tugas Tidak Bisa Diubah

**Masalah:** Anda mencoba mengubah status tugas tetapi tombol status tidak aktif atau tidak merespon.

**Kemungkinan Penyebab:**
- Anda tidak memiliki akses untuk mengubah status tugas tersebut
- Tugas bukan milik Anda (untuk pengguna FOC)
- Ada masalah koneksi saat menyimpan perubahan

**Langkah Penyelesaian:**

1. **Periksa hak akses Anda:**
   - **FOC** hanya bisa mengubah status tugas yang ditugaskan kepada mereka
   - **Admin dan NOC** bisa mengubah semua tugas
   - **Marketing** tidak memiliki akses ke papan tugas utama

2. **Periksa status tugas saat ini:**
   - Beberapa transisi status mungkin tidak diizinkan (contoh: dari "Selesai" ke "Baru Ditugaskan")
   - Periksa apakah transisi status yang Anda inginkan diizinkan

3. **Gunakan metode alternatif:**
   - Klik pada kartu tugas untuk membuka detail
   - Klik tombol **"Edit"** di panel detail
   - Ubah status dari dropdown
   - Klik **"Simpan"**

4. **Periksa koneksi internet:**
   - Pastikan Anda memiliki koneksi internet yang aktif
   - Coba lagi beberapa saat kemudian

**[SCREENSHOT: Tombol status tugas di panel detail]**

---

## 6.5 Map Not Loading

### 6.5.1 Peta Tampil Kosong (Blank Map)

**Masalah:** Peta tidak muncul sama sekali atau hanya menampilkan latar belakang gelap tanpa peta.

**Kemungkinan Penyebab:**
- JavaScript dinonaktifkan di browser Anda
- Leaflet membutuhkan rendering di sisi klien (client-side)
- Koneksi internet terputus saat memuat peta

**Langkah Penyelesaian:**

1. **Aktifkan JavaScript:**
   - Buka pengaturan browser Anda
   - Pastikan JavaScript aktif
   - Muat ulang halaman

2. **Periksa koneksi internet:**
   - Peta memuat dari server CartoDB (OpenStreetMap)
   - Pastikan Anda memiliki koneksi internet yang aktif
   - Muat ulang halaman dengan menekan `F5`

3. **Hapus cache browser:**
   - Tekan `Ctrl + Shift + Delete` (Windows) atau `Cmd + Shift + Delete` (Mac)
   - Pilih "Cache" dan "Gambar yang di-cache"
   - Klik "Hapus data"
   - Muat ulang halaman

4. **Coba browser lain:**
   - Jika masalah berlanjut, coba buka peta di browser berbeda
   - Gunakan Chrome atau Firefox versi terbaru

**[SCREENSHOT: Peta kosong tanpa tile]**

### 6.5.2 Tile Peta Tidak Memuat

**Masalah:** Peta muncul tetapi tile (ubin peta) tidak memuat dengan benar, hanya menampilkan kotak-kotak abu-abu.

**Kemungkinan Penyebab:**
- Koneksi internet terputus saat memuat tile
- Server CartoDB tidak dapat diakses
- Firewall atau pemblokir iklan memblokir tile

**Langkah Penyelesaian:**

1. **Periksa koneksi internet:**
   - Pastikan koneksi internet stabil dan aktif
   - Muat ulang halaman dan tunggu beberapa detik

2. **Nonaktifkan pemblokir iklan:**
   - Pemblokir iklan kadang memblokir tile peta
   - Nonaktifkan pemblokir iklan untuk situs TuTrack
   - Muat ulang halaman

3. **Periksa firewall:**
   - Pastikan firewall tidak memblokir akses ke `basemaps.cartocdn.com`
   - Jika menggunakan firewall kantor, hubungi tim IT

4. **Coba jaringan berbeda:**
   - Beralih ke jaringan Wi-Fi atau data seluler lain
   - Beberapa jaringan mungkin membatasi akses ke CDN tertentu

**[SCREENSHOT: Peta dengan tile yang tidak memuat]**

### 6.5.3 Pin Anggota Tim Tidak Muncul

**Masalah:** Peta memuat dengan benar tetapi tidak ada pin atau markor yang menunjukkan lokasi anggota tim.

**Kemungkinan Penyebab:**
- Tidak ada anggota tim yang sedang berbagi lokasi GPS
- Filter peran menyembunyikan pin yang ingin dilihat
- Lokasi anggota tim belum diperbarui hari ini

**Langkah Penyelesaian:**

1. **Periksa filter peran:**
   - Klik tombol **"Filter"** di bagian atas peta
   - Pastikan peran yang ingin dilihat sudah dipilih (Admin, NOC, FOC, Marketing)
   - Klik **"Terapkan"** untuk memperbarui peta

2. **Periksa tanggal:**
   - Pastikan tanggal yang dipilih adalah hari ini atau tanggal yang diinginkan
   - Jika melihat tanggal di masa lalu, pin hanya akan muncul jika ada data lokasi untuk tanggal tersebut

3. **Periksa aktivitas anggota tim:**
   - Pin hanya muncul untuk anggota tim yang sedang berbagi lokasi GPS
   - Jika tidak ada yang berbagi lokasi, peta akan kosong
   - Hubungi anggota tim untuk mengaktifkan berbagi lokasi

4. **Muat ulang peta:**
   - Tekan `F5` untuk memuat ulang halaman
   - Tunggu beberapa detik hingga data lokasi dimuat

**[SCREENSHOT: Peta tanpa pin anggota tim]**

### 6.5.4 Garis Route Tidak Muncul

**Masalah:** Pin anggota tim muncul tetapi garis route perjalanan tidak terlihat.

**Kemungkinan Penyebab:**
- Layanan OSRM (Open Source Routing Machine) sedang down
- Tidak ada cukup titik lokasi untuk membuat route
- Koneksi ke server OSRM terputus

**Langkah Penyelesaian:**

1. **Periksa jumlah titik lokasi:**
   - Garis route hanya muncul jika ada minimal 2 titik lokasi
   - Jika hanya ada 1 titik, hanya pin yang muncul tanpa garis

2. **Tunggu layanan OSRM pulih:**
   - OSRM adalah layanan eksternal yang bisa mengalami gangguan sementara
   - Tunggu beberapa menit dan muat ulang peta
   - Garis route akan muncul setelah layanan pulih

3. **Garis route lurus sebagai fallback:**
   - Jika OSRM tidak tersedia, sistem akan menampilkan garis lurus sebagai alternatif
   - Garis lurus tetap menunjukkan arah perjalanan meskipun tidak mengikuti jalan

4. **Muat ulang peta:**
   - Tekan `F5` untuk memuat ulang halaman
   - Tunggu beberapa detik hingga route dimuat

**[SCREENSHOT: Peta dengan pin tanpa garis route]**

---

## 6.6 Photo Upload Issues

### 6.6.1 Kamera Tidak Berfungsi

**Masalah:** Saat mencoba mengambil foto dengan kamera, tidak ada yang terjadi atau muncul pesan error.

**Kemungkinan Penyebab:**
- Izin kamera belum diberikan ke browser atau aplikasi
- Kamera perangkat tidak tersedia atau rusak
- Browser tidak mendukung akses kamera

**Langkah Penyelesaian:**

1. **Berikan izin kamera:**
   - Saat browser meminta izin kamera, klik **"Izinkan"** atau **"Allow"**
   - Jika sebelumnya ditolak, hapus izin di pengaturan browser:
     - Chrome: Pengaturan → Privasi → Setelan Situs → Kamera → Hapus blokir
     - Firefox: Pengaturan → Privasi → Izin → Kamera → Hapus blokir

2. **Periksa kamera perangkat:**
   - Pastikan kamera perangkat berfungsi dengan benar
   - Tutup aplikasi lain yang mungkin menggunakan kamera
   - Restart perangkat jika diperlukan

3. **Gunakan metode alternatif:**
   - Jika kamera tidak berfungsi, gunakan opsi **"Upload dari Galeri"**
   - Pilih foto yang sudah ada di galeri perangkat Anda

4. **Periksa format foto:**
   - TuTrack mendukung format: JPEG, PNG, WebP, HEIC
   - Pastikan foto yang dipilih memiliki format yang didukung

**[SCREENSHOT: Dialog izin kamera di browser]**

### 6.6.2 Foto Terlalu Besar

**Masalah:** Saat mengunggah foto, muncul pesan error bahwa ukuran foto terlalu besar.

**Kemungkinan Penyebab:**
- Foto yang dipilih memiliki ukuran file melebihi batas
- Resolusi kamera terlalu tinggi
- Foto belum dikompresi

**Langkah Penyelesaian:**

1. **Kompres foto:**
   - Gunakan aplikasi pengompres foto di perangkat Anda
   - Kompres foto hingga ukuran di bawah 5 MB
   - Banyak aplikasi gratis yang tersedia untuk kompresi foto

2. **Ubah resolusi kamera:**
   - Buka pengaturan kamera perangkat
   - Turunkan resolusi ke Medium atau Low
   - Ambil foto dengan resolusi yang lebih rendah

3. **Gunakan format yang lebih ringan:**
   - Format JPEG biasanya lebih ringan dari PNG atau WebP
   - Pilih format JPEG saat mengambil atau mengunggah foto

4. **Gunakan foto dari galeri:**
   - Pilih foto yang sudah ada di galeri (biasanya sudah terkompresi)
   - Gunakan opsi **"Upload dari Galeri"** alih-alih mengambil foto baru

**[SCREENSHOT: Pesan error ukuran foto terlalu besar]**

### 6.6.3 Upload Foto Gagal

**Masalah:** Foto gagal diunggah, muncul pesan error atau proses upload tidak selesai.

**Kemungkinan Penyebab:**
- Koneksi internet terputus saat upload
- Server TuTrack sedang sibuk atau down
- Format foto tidak didukung
- Sesi upload foto telah berakhir

**Langkah Penyelesaian:**

1. **Periksa koneksi internet:**
   - Pastikan koneksi internet stabil selama proses upload
   - Jika koneksi terputus, sambungkan kembali dan coba lagi

2. **Periksa format foto:**
   - Pastikan foto memiliki format: JPEG, PNG, WebP, atau HEIC
   - Jika format tidak didukung, konversi foto ke format yang didukung

3. **Muat ulang halaman:**
   - Tekan `F5` untuk memuat ulang halaman
   - Coba upload foto lagi

4. **Gunakan Telegram sebagai alternatif:**
   - Kirim foto melalui bot Telegram @TuTrackTrackingBot
   - Pilih tugas yang sesuai saat bot meminta
   - Foto akan otomatis terunggah ke tugas tersebut

5. **Hubungi admin:**
   - Jika masalah berlanjut, hubungi admin
   - Admin bisa memeriksa status server dan log error

**[SCREENSHOT: Pesan error upload foto gagal]**

### 6.6.4 Sesi Upload Foto Berakhir

**Masalah:** Saat mencoba mengunggah foto melalui Telegram, muncul pesan "Sesi upload foto telah berakhir".

**Kemungkinan Penyebab:**
- Waktu untuk mengunggah foto setelah mengirim foto ke bot telah habis
- Anda terlalu lama memilih tugas sebelum mengunggah foto
- Bot menunggu konfirmasi tugas tetapi tidak ada respons

**Langkah Penyelesaian:**

1. **Kirim foto lagi:**
   - Kirim ulang foto yang sama ke bot Telegram
   - Pilih tugas dengan cepat saat bot meminta
   - Jangan menunggu terlalu lama setelah bot memberikan opsi

2. **Pilih tugas dengan cepat:**
   - Setelah mengirim foto, bot akan meminta Anda memilih tugas
   - Pilih tugas dalam waktu singkat (sebelum sesi berakhir)
   - Jika sesi berakhir, ulangi langkah dari awal

3. **Gunakan web app sebagai alternatif:**
   - Buka TuTrack di browser web
   - Pilih tugas yang ingin diberi foto
   - Unggah foto langsung dari web app

**[SCREENSHOT: Pesan "Sesi upload foto telah berakhir" di Telegram]**

---

## FAQ (Pertanyaan yang Sering Diajukan)

### Q: Berapa lama sesi login berakhir?

**A:** Sesi login berakhir setelah **45 menit** tidak aktif. Timer dihitung sejak Anda login. Setiap kali Anda melakukan interaksi di aplikasi, timer akan di-reset.

### Q: Apakah data saya hilang saat sesi berakhir?

**A:** **Tidak.** Tidak ada data yang hilang. Semua tugas, lokasi, dan absensi sudah tersimpan di server. Anda hanya perlu login kembali untuk melanjutkan.

### Q: Bagaimana cara mengaktifkan berbagi lokasi GPS?

**A:** Buka dashboard FOC, klik tombol **"Bagikan Lokasi"** atau **"Berbagi Lokasi"**. Pastikan GPS perangkat aktif dan browser memiliki izin lokasi. Untuk panduan lengkap, lihat Bagian 4.3.

### Q: Bagaimana cara mengirim foto bukti kerja?

**A:** Ada dua cara:
1. **Melalui Telegram:** Kirim foto ke @TuTrackTrackingBot, lalu pilih tugas yang sesuai
2. **Melalui Web App:** Buka detail tugas, klik tombol **"Ambil / Upload Foto"**, pilih foto dari kamera atau galeri

### Q: Kenapa saya tidak bisa drag and drop tugas?

**A:** Beberapa kemungkinan:
- **Di ponsel:** Ketuk dan tahan kartu selama 1 detik sebelum menyeret
- **Hak akses:** FOC hanya bisa mengubah status tugas yang ditugaskan kepada mereka
- **Alternatif:** Gunakan tombol status di detail tugas untuk mengubah status

### Q: Bagaimana cara mengatasi peta yang tidak memuat?

**A:** Coba langkah berikut:
1. Aktifkan JavaScript di browser
2. Hapus cache browser
3. Periksa koneksi internet
4. Nonaktifkan pemblokir iklan
5. Gunakan browser yang didukung (Chrome, Firefox, Edge, Safari)

### Q: Apakah TuTrack bisa digunakan di semua browser?

**A:** TuTrack bekerja dengan baik di:
- Google Chrome (versi terbaru) — disarankan
- Mozilla Firefox (versi terbaru)
- Microsoft Edge (versi terbaru)
- Safari (untuk pengguna iPhone/Mac)

Hindari menggunakan browser usang atau tidak dikenal.

### Q: Bagaimana cara menghubungi admin jika ada masalah?

**A:** Hubungi admin Anda melalui:
- Telepon atau WhatsApp (nomor yang terdaftar di profil)
- Email kantor
- Chat langsung jika tersedia

Saat menghubungi admin, sertakan:
- Deskripsi masalah yang jelas
- Screenshot error jika memungkinkan
- Nama pengguna dan peran Anda di TuTrack

### Q: Apakah data lokasi saya aman?

**A:** Ya. Data lokasi hanya digunakan untuk keperluan operasional dan tidak dibagikan ke pihak ketiga. Data disimpan di server Supabase yang aman dan memiliki masa simpan 30 hari.

### Q: Bisakah saya menggunakan TuTrack tanpa internet?

**A:** **Tidak.** TuTrack membutuhkan koneksi internet untuk:
- Login dan autentikasi
- Memuat dan menyimpan data tugas
- Mengirim dan memperbarui lokasi GPS
- Memuat peta dan tile

Pastikan Anda memiliki koneksi internet yang stabil saat menggunakan TuTrack.

### Q: Bagaimana cara melihat riwayat lokasi anggota tim?

**A:** Buka Peta Radar, pilih tanggal yang ingin dilihat menggunakan pemilih tanggal di bagian atas peta. Peta akan menampilkan route perjalanan anggota tim pada tanggal tersebut. Untuk panduan lengkap, lihat Bagian 2.6 atau 3.3.

---

**Selesai!** Anda sekarang memiliki panduan lengkap untuk mengatasi masalah umum di TuTrack. Jika masalah Anda tidak tercantum di sini, hubungi admin untuk bantuan lebih lanjut.
