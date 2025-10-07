Halaman web ini merupakan aplikasi kasir berbasis web yang dirancang untuk memproses transaksi penjualan secara end-to-end mulai dari input barang, pengelolaan keranjang, perhitungan total, hingga pencetakan struk dalam format PDF yang kompatibel dengan printer termal 58 mm. Aplikasi ini mendukung format angka Indonesia (pemisah ribuan dengan titik) dan menyediakan perhitungan kembalian secara otomatis.

Gambaran umum
Aplikasi menampilkan antarmuka modern dan ringkas yang memfasilitasi pencatatan barang, pengaturan jumlah pembelian, kalkulasi total, penerimaan pembayaran tunai, serta keluaran kembalian secara real-time. Seluruh fungsi dipusatkan pada satu halaman untuk mempercepat alur kasir dan meminimalkan kesalahan input.

Struktur antarmuka
Bagian kepala memuat judul aplikasi dan subjudul sebagai identitas sistem kasir digital. Bagian input menyediakan kolom “Nama Barang” dan “Harga Barang (Rp)” dengan tombol “Tambah Barang” untuk memasukkan item ke keranjang. Bagian keranjang menampilkan daftar item lengkap dengan nama, harga satuan, kuantitas, kontrol tambah/kurang, tombol hapus, dan subtotal per item, serta total transaksi di bagian bawah.

Pembayaran dan kembalian
Bagian pembayaran menyediakan kolom “Uang Diterima” yang otomatis menghitung “Uang Kembalian” berdasarkan total transaksi dan nominal yang dimasukkan. Perhitungan dilakukan hingga dua desimal untuk menjaga akurasi pembulatan dan kesesuaian nilai transaksi tunai.

Format angka Indonesia
Input harga dan nilai pembayaran diformat menggunakan pemisah ribuan berupa titik untuk meningkatkan keterbacaan sesuai kebiasaan lokal. Validasi input mencegah nilai negatif serta menjaga agar hanya karakter numerik yang diterima pada kolom nilai mata uang.

Kontrol keranjang
Setiap baris item menyediakan kontrol tambah dan kurang untuk menyesuaikan kuantitas serta tombol hapus untuk mengeluarkan item sepenuhnya. Tersedia pula opsi “Kosongkan” untuk menghapus seluruh isi keranjang sehingga transaksi baru dapat dimulai dengan cepat.

Pencetakan struk PDF
Aplikasi menyertakan tombol “Cetak Struk” yang menghasilkan struk dalam format PDF berukuran lebar 58 mm agar sesuai dengan printer termal mini. Struk memuat judul “STRUK PEMBELIAN”, tanggal dan waktu, daftar item beserta kuantitas dan harga, total transaksi, uang diterima, kembalian, serta penutup “Terima Kasih”.

Penamaan dan tata letak struk
Berkas PDF dinamai secara otomatis menggunakan pola tanggal pembelian “struk_YYYY-MM-DD_HH-MM.pdf” untuk memudahkan arsip transaksi. Tata letak struk disusun vertikal dengan tipografi sederhana agar terbaca jelas pada kertas termal kecil.

Keandalan perhitungan
Seluruh kalkulasi subtotal, total, dan kembalian dilakukan secara deterministik dan konsisten, dengan pembaruan nilai secara langsung saat item dimodifikasi atau saat jumlah uang diterima diubah. Mekanisme ini meminimalkan risiko salah hitung pada saat beban transaksi tinggi.

Responsivitas dan aksesibilitas
Antarmuka dirancang responsif sehingga berfungsi baik pada perangkat desktop maupun seluler, dengan penataan komponen yang adaptif. Pemisahan visual melalui kartu dan spasi memadai memastikan navigasi yang mudah serta pengalaman penggunaan yang efisien di lingkungan ritel.
