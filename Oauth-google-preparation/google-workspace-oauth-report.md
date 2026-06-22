
# Integrasi Aplikasi Web dengan Google Workspace API dan Proses OAuth App Verification

## Ringkasan Eksekutif

Dokumen ini membahas persyaratan dan praktik terbaik untuk mendaftarkan aplikasi web di Google Cloud Console agar dapat menggunakan Google Workspace API, serta strategi mempercepat proses OAuth app verification.[web:8][web:62] Fokus utamanya mencakup pembuatan project, aktivasi API, konfigurasi OAuth consent screen, klasifikasi scope (non‑sensitive, sensitive, restricted), penyusunan demo video, dan tips agar permohonan verifikasi lebih cepat disetujui.[web:1][web:58][web:45]

## 1. Dasar Arsitektur Integrasi Google Workspace API

### 1.1 Peran Google Cloud Project

Google mewajibkan setiap integrasi API berada dalam sebuah Google Cloud project yang menjadi container untuk konfigurasi API, OAuth consent screen, dan kredensial (OAuth client ID maupun service account).[web:8][web:25] Project ini juga mengikat pengaturan billing, IAM, dan kuota untuk semua panggilan ke Google Workspace API yang dilakukan aplikasi.[web:13][web:58]

### 1.2 Tipe Aplikasi dan Pola Auth

Untuk aplikasi web, pola umum adalah:

- **3‑legged OAuth 2.0 (Authorization Code Flow)**: user login dengan akun Google, memberikan consent terhadap scope tertentu, dan aplikasi mendapatkan access token/refresh token untuk bertindak atas nama user.[web:38][web:41]
- **Service account + domain‑wide delegation**: digunakan untuk skenario server‑to‑server di lingkungan Google Workspace, di mana service account dapat meng‑impersonate user di domain setelah disetujui oleh super admin.[web:28][web:6]

Kedua pola ini dikonfigurasi di level project yang sama, tetapi menggunakan tipe kredensial yang berbeda.[web:28][web:5]

## 2. Prasyarat dan Konfigurasi Dasar di Google Cloud Console

### 2.1 Membuat Project dan Mengaktifkan Workspace API

Langkah awal integrasi adalah:

1. Membuat atau memilih Google Cloud project melalui project selector di Cloud Console dan memberi nama project yang relevan dengan aplikasi.[web:8][web:21]
2. Membuka menu **APIs & Services → Library** dan mengaktifkan Google Workspace API yang dibutuhkan, misalnya Admin SDK, Gmail API, Drive API, Calendar API, Docs API, dan lainnya.[web:1][web:10]
3. Jika diminta, mengaktifkan billing pada project untuk memastikan kuota API dapat digunakan secara penuh, meskipun sebagian besar Workspace API tidak mengenakan biaya langsung dalam batas kuota standar.[web:13][web:58]

### 2.2 Konfigurasi OAuth Consent Screen

OAuth consent screen adalah layar yang ditampilkan Google kepada user ketika aplikasi meminta akses ke data Google mereka.[web:24][web:62]

Langkah konfigurasi utama:

- Memilih **User type**: 
  - **Internal**: hanya user di dalam domain Google Workspace organisasi; tidak memerlukan verifikasi eksternal untuk produksi.[web:24][web:67]
  - **External**: tersedia untuk semua akun Google dan mewajibkan verifikasi jika aplikasi menggunakan scope sensitif atau restricted untuk rilis penuh.[web:18][web:62]
- Mengisi informasi aplikasi: nama aplikasi, logo, user support email, developer contact email, dan authorized domains.[web:24][web:21]
- Mendefinisikan **Scopes for Google APIs** yang akan digunakan aplikasi, yang akan muncul di consent screen dan menjadi dasar proses verifikasi.[web:24][web:58]

### 2.3 Kredensial OAuth Client untuk Aplikasi Web

Untuk web app yang melakukan login/authorization flow:

- Di **APIs & Services → Credentials**, membuat **OAuth client ID** dengan Application type **Web application**.[web:5][web:23]
- Menambahkan **Authorized redirect URIs** yang menunjuk ke endpoint callback aplikasi (misalnya `https://app.example.com/oauth/google/callback` atau URL callback yang disediakan platform seperti n8n).[web:2][web:19]
- Menyimpan **Client ID** dan **Client secret** yang akan digunakan aplikasi dalam implementasi OAuth 2.0 flow.[web:5][web:29]

## 3. Service Account dan Domain‑Wide Delegation (Opsional)

Untuk skenario server‑to‑server di domain Google Workspace:

- Membuat **service account** di menu **IAM & Admin → Service accounts**, dan mengaktifkan opsi **Enable G Suite domain‑wide delegation** bila diperlukan.[web:28][web:17]
- Di **Google Workspace Admin console**, super admin membuka **Security → API controls → Domain‑wide delegation** dan mendaftarkan client ID service account atau OAuth client, beserta daftar scope yang diizinkan.[web:6][web:3]
- Service account kemudian dapat meng‑impersonate user tertentu dalam domain dengan batasan scope yang sudah diberikan.

Domain‑wide delegation adalah fitur powerful yang harus dibatasi scope‑nya dengan ketat untuk mengurangi risiko keamanan.[web:6][web:12]

## 4. Kategori Scope: Non‑Sensitive, Sensitive, dan Restricted

### 4.1 Klasifikasi Scope Menurut Google

Google mengelompokkan OAuth scope menjadi tiga kategori:[web:58][web:62]

- **Non‑sensitive**: scope dengan akses yang sangat terbatas atau informasi dasar, misalnya login/identitas user dengan `openid`, `email`, dan `profile`. Biasanya hanya membutuhkan proses verifikasi ringan atau tidak sama sekali jika tidak dipublikasikan luas.[web:58][web:62]
- **Sensitive**: scope yang memberikan akses ke data user yang signifikan namun masih dalam area aplikasi tertentu (email, kalender, kontak, dsb.) dan memerlukan OAuth app verification standar.[web:58][web:61]
- **Restricted**: scope dengan tingkat risiko tinggi, misalnya akses penuh ke Gmail, Drive, Google Fit, dan berbagai data portabilitas lintas produk Google; dapat memerlukan proses verifikasi tambahan termasuk security assessment eksternal.[web:59][web:62]

### 4.2 Contoh Scope yang Relevan dengan Workspace

Tabel berikut merangkum beberapa contoh scope yang sering digunakan:

| API / Use case                  | Scope                                           | Kategori      |
|---------------------------------|-------------------------------------------------|---------------|
| OAuth basic login / identitas   | `openid`, `email`, `profile`                    | Non‑sensitive[cite:41][cite:62] |
| Gmail kirim email               | `https://www.googleapis.com/auth/gmail.send`    | Sensitive[cite:61] |
| Gmail add‑on baca pesan aktif   | `.../gmail.addons.current.message.readonly`     | Sensitive[cite:61] |
| Gmail full access               | `https://mail.google.com/`                      | Restricted[cite:61][cite:59] |
| Gmail read‑only penuh           | `https://www.googleapis.com/auth/gmail.readonly`| Restricted[cite:61][cite:59] |
| Drive full                      | `https://www.googleapis.com/auth/drive`         | Restricted[cite:59] |
| Drive read‑only/metadata luas   | `.../drive.readonly`, `.../drive.metadata`      | Restricted[cite:59] |
| Health / Google Fit             | Berbagai scope `fitness.*`/`googlehealth.*`     | Banyak Restricted, sebagian Sensitive[cite:59][cite:60] |
| Data Portability API            | Berbagai scope portabilitas data                | Banyak Restricted[cite:59][cite:63] |

Google menekankan agar developer selalu memilih scope paling sempit yang cukup untuk kebutuhan fitur, alih‑alih scope full yang tidak diperlukan.[web:58][web:61]

## 5. Proses dan Persyaratan OAuth App Verification

### 5.1 Kapan Verifikasi Diperlukan

OAuth app verification diperlukan jika:

- Aplikasi bertipe **External** dan akan digunakan oleh publik (bukan hanya internal domain Workspace).[web:67][web:62]
- Aplikasi menggunakan scope **sensitive** atau **restricted**, terutama jika digunakan di luar mode testing atau jika jumlah user yang diizinkan melebihi batas tester.[web:32][web:62]

Untuk mode **Internal** (Workspace) atau **External dalam status Testing** dengan jumlah tester terbatas, aplikasi dapat digunakan tanpa completing full verification, meskipun user akan melihat peringatan “unverified app” untuk scope tertentu.[web:32][web:41]

### 5.2 Persyaratan Non‑Teknis

Agar proses verifikasi berjalan, Google mensyaratkan:

- **Verified domain** yang digunakan sebagai authorized domain di consent screen, diverifikasi melalui Search Console oleh owner yang sama dengan project.[web:18][web:44]
- **Homepage**, **privacy policy**, dan sering kali **terms of service** yang di‑host di domain tersebut dan di‑link dari consent screen.[web:20][web:18]
- Konten privacy policy yang menjelaskan jenis data yang diakses, tujuan penggunaan, penyimpanan, pembagian ke pihak ketiga, dan mekanisme revoke.[web:20][web:62]
- Konsistensi brand: nama dan logo app di consent screen harus sesuai dengan website, materials, dan (jika ada) listing di Marketplace.[web:43][web:22]

Ketidaksesuaian branding, privacy policy generik, atau domain yang tidak diverifikasi sering menjadi alasan penolakan awal.[web:18][web:64]

## 6. Demo Video untuk Proses Verifikasi

### 6.1 Fungsi dan Harapan Google terhadap Demo Video

Dalam banyak kasus, terutama untuk scope sensitif dan restricted, Google meminta **demo video** yang memperlihatkan bagaimana aplikasi menggunakan scope yang diminta.[web:45][web:52]

Video ini diharapkan untuk:

- Menunjukkan **end‑to‑end OAuth flow**: user mengklik login, melihat consent screen dengan semua scope yang diminta, memberikan izin, dan kembali ke aplikasi.[web:45][web:49]
- Memperlihatkan di dalam aplikasi bagaimana setiap scope digunakan dalam fitur nyata, sehingga reviewer dapat memverifikasi bahwa penggunaan data sesuai dengan penjelasan di form.[web:45][web:51][web:52]

Google atau reviewer pihak ketiga kerap meminta rekaman ulang jika video tidak dengan jelas menunjukkan penggunaan seluruh scope.[web:47][web:54]

### 6.2 Struktur Video yang Disarankan

Praktik yang muncul dari panduan resmi dan pengalaman developer:

1. **Intro singkat**: jelaskan nama aplikasi, use case utama, dan target pengguna.
2. **OAuth flow**: rekam layar mulai dari tombol “Sign in with Google” hingga user kembali ke aplikasi setelah consent.
3. **Penjelasan scope per fitur**: untuk setiap scope sensitif/restricted, tunjukkan fitur yang memanfaatkan data terkait (misalnya membaca email, membuat event kalender, meng‑upload file ke Drive) dan beri konteks mengapa data tersebut diperlukan.
4. **Penekanan keamanan & batasan**: sebutkan jika data hanya disimpan sementara, tidak dibagikan ke pihak ketiga, atau dibatasi pada subset file tertentu.

Contoh video yang dinyatakan berhasil biasanya secara eksplisit menyebut dan mendemonstrasikan semua scope yang diminta, bukan hanya menampilkan UI secara umum.[web:51][web:43][web:56]

## 7. Strategi Mempercepat Persetujuan OAuth

### 7.1 Minimalkan dan Persempit Scope

Cara paling efektif untuk mempercepat verifikasi adalah dengan mengurangi jumlah dan cakupan scope:[web:58][web:61]

- Gunakan scope yang lebih sempit seperti `gmail.send` alih‑alih `https://mail.google.com/` jika hanya perlu mengirim email, atau `drive.file`/Picker jika tidak butuh akses penuh ke semua file Drive.[web:61][web:59]
- Hapus scope yang tidak benar‑benar digunakan dari consent screen dan implementasi kode; reviewer memeriksa kecocokan antara scope, penjelasan, dan demo video.[web:58][web:62]

### 7.2 Hindari Restricted Scope Bila Memungkinkan

Restricted scope memerlukan compliance tambahan dan sering kali memperpanjang waktu review:[web:59][web:62]

- Banyak kasus menunjukkan proses menjadi lebih cepat setelah developer mengganti scope restricted menjadi kombinasi scope sensitive atau pendekatan lain (misalnya menggunakan Google Picker untuk file selection).[web:59][web:55]
- Jika penggunaan restricted tidak bisa dihindari (misalnya untuk produk backup/email archiving), perlu dipersiapkan bahwa Google dapat meminta security assessment eksternal.[web:59][web:62]

### 7.3 Persiapkan Konsent Screen dan Data Access dengan Rapi Sebelum Submit

Beberapa hal yang mempercepat approval:

- Pastikan semua URL (homepage, privacy policy, redirect URIs, JavaScript origins) menggunakan HTTPS dan menggunakan domain yang telah diverifikasi.[web:31][web:44]
- Konfigurasi halaman **Manage App Data Access / Scopes** di Cloud Console agar mencerminkan kategori scope yang benar dan sesuai dengan yang diminta aplikasi.[web:58][web:62]
- Jangan mengirim permohonan verifikasi jika masih ada placeholder text atau ketidaksesuaian antara deskripsi aplikasi, scope, dan functionality yang ditunjukkan di video.[web:18][web:64]

### 7.4 Justifikasi Scope yang Spesifik dan Konsisten

Form verifikasi meminta developer menjelaskan alasan penggunaan masing‑masing scope:[web:62][web:64]

- Justifikasi sebaiknya menjelaskan *fitur apa* yang memakai scope tersebut, *data apa* yang diakses, dan *mengapa cakupan scope tersebut diperlukan*.
- Penjelasan generik seperti "untuk meningkatkan pengalaman pengguna" sering menyebabkan permintaan klarifikasi atau penolakan.[web:64][web:41]
- Isi form ini harus konsisten dengan perilaku aplikasi di demo video dan dengan teks di privacy policy.[web:43][web:52]

### 7.5 Respons Cepat dan Lengkap terhadap Email Reviewer

Tim verifikasi biasanya mengirim email jika ada hal yang perlu diperbaiki atau diklarifikasi:[web:33][web:62]

- Menjawab email dengan dokumentasi lengkap (screenshot, link halaman, video baru jika diminta) membantu menghindari siklus tanya‑jawab berkepanjangan.[web:33][web:60]
- Mengirim resubmission berkali‑kali tanpa mengaddress seluruh feedback dapat membuat antrian semakin lama dan berpotensi mem‑reset posisi request.[web:30][web:55]

### 7.6 Manfaatkan Mode Internal/Testing untuk Go‑To‑Market Cepat

Sementara menunggu atau mempersiapkan verifikasi production, aplikasi masih dapat digunakan terbatas:

- Untuk domain Google Workspace, set **User type = Internal** sehingga hanya user di domain tersebut yang dapat mengotorisasi aplikasi tanpa perlu verifikasi publik.[web:67][web:32]
- Untuk aplikasi External dalam tahap awal, gunakan mode **Testing** dengan daftar tester yang eksplisit; ini mengizinkan pengujian real tanpa harus menunggu verifikasi selesai.[web:32][web:41]

Pendekatan ini memungkinkan tim produk mempercepat iterasi dan onboarding klien early‑access, sembari menyiapkan materi verifikasi yang komprehensif.

## 8. Rekomendasi Praktis untuk Pengembang SaaS/Agentic Systems

Berdasarkan dokumentasi resmi dan pengalaman praktis developer lain, beberapa best practice berikut relevan untuk pengembang SaaS dan sistem agentic berbasis Google Workspace:

1. **Pisahkan lingkungan**: gunakan project Cloud terpisah untuk development/testing dan production untuk menjaga kebersihan konfigurasi consent screen dan scopes.[web:62][web:64]
2. **Mulai dengan scope minimal**: rilis pertama cukup dengan login (openid/email/profile) dan satu atau dua scope sensitif yang paling penting, lalu tambah scope lain secara bertahap dengan justifikasi jelas.[web:58][web:61]
3. **Standardisasi narasi verifikasi**: siapkan template internal yang berisi deskripsi produk, daftar scope dan justifikasi, pola penyimpanan data, serta outline demo video, sehingga setiap project baru bisa mengikuti pola yang sama.[web:43][web:56]
4. **Monitor perubahan kebijakan Google**: halaman OAuth App Verification Help Center dan Manage App Data Access rutin diperbarui, sehingga penting untuk menyesuaikan integrasi saat ada perubahan kategori scope atau requirement baru.[web:62][web:58]
5. **Pertimbangkan support berbayar**: untuk produk mission‑critical, dukungan Cloud Support dapat membantu jika proses verifikasi mengalami hambatan teknis atau tidak kunjung diproses.[web:33][web:30]

## 9. Kesimpulan

Integrasi aplikasi web dengan Google Workspace API dan proses OAuth app verification bergantung pada desain scope yang hemat, konfigurasi consent screen dan authorized domains yang rapi, serta dokumentasi yang meyakinkan (privacy policy dan demo video).[web:58][web:24][web:45]
Meminimalkan scope, menghindari restricted scope jika memungkinkan, dan menunjukkan secara transparan bagaimana data digunakan adalah kunci untuk mempercepat persetujuan dari Google.[web:59][web:61][web:62]
