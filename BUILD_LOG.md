# BUILD_LOG — best-cooking-game-20261125-0137 "Dapur Kilat — Warung Kilat"

Game masak orisinal: koki Warung Kilat melayani pesanan di papan pesanan
ber-timer. Ambil bahan dari 6 peti (Nasi, Mie, Ayam, Telur, Sayur, Cabai),
potong di talenan (tahan SPASI), masak di wajan (otomatis), rakit di meja
plating, sajikan di jendela saji sebelum waktu pesanan habis. Tip makin
besar kalau cepat, combo beruntun melipatgandakan koin, 30 detik terakhir
jadi JAM RAMAI (pesanan lebih cepat). 6 hidangan dengan kombinasi
potong/masak berbeda, 3 hati reputasi, shift 150 detik, layar
judul/jeda/hasil + grade. Keyboard + mouse (klik stasiun = jalan ke sana
+ pakai). Suara synth WebAudio, tanpa file/network. Semua file statis
offline, tanpa library.

- 08:49 WIB: competition JSON difetch segar (escrow $250 terdanai,
  entry gratis 0.00, buka 08:37 WIB, deadline 20:37 WIB, blind round 1
  cutoff 11:37 WIB); kit diunduh + RULES.txt dibaca seluruhnya;
  vendor/makefun-game.ts disalin byte-identik dari kit (sha256
  dc671875...6129); LICENSE MIT dari starter.
- 08:5x WIB: config.js, random.js, audio.js, input.js, recipes.js
  ditulis (konstanta/palet/stasiun; RNG seed; synth WebAudio; keyboard+
  mouse; 6 bahan + 6 hidangan + aturan prep).
- 09:0x WIB: world.js (state, pesanan, potong/masak, plating, saji,
  skor/kombo/rush), render.js (dapur, koki, tiket pesanan, HUD, layar),
  shots.js (4 scene deterministik), main.js (loop fixed-step) ditulis.
- 09:0x WIB: main.ts + serve.ts + README.md (badge make.fun) +
  shots.json + .makefun/owner.json (wallet agen) ditulis sendiri.
- 09:03 WIB: 4 screenshot percobaan pertama via Playwright Chromium
  headless (1280x720 JPEG) — semua state benar, tapi ada tumpang-tindih
  teks: nama hidangan + harga di tiket, teks wajan menabrak lingkaran,
  teks plating menabrak ikon, "PELANGGAN" tertutup jeruji jendela.
- 09:0x WIB: layout render.js diperbaiki (tiket 3 baris: nama / harga+
  timer / bahan; wajan lingkaran kecil + teks di kanan; teks progres
  piring di dalam piring; jendela: jeruji pendek + teks di bawah).
  Screenshot ulang — semua bersih.
- 09:1x WIB: play-test end-to-end di headless Chrome (klik + Spasi):
  Nasi Goreng lengkap — nasi diambil, telur dimasak di wajan, cabai
  dipotong di talenan, 3 bahan di-plating, piring diangkat, disajikan:
  skor 75, tersaji 1, 3 hati, tanpa error. Jeda/resume (P) terverifikasi.
  Dua temuan selama play-test: (1) game time headless ~0.2x wall time
  (dt clamp 0.1) — test diubah menunggu state, bukan sleep tetap;
  (2) BUG NYATA diperbaiki: `pressed` dulu dibersihkan tiap frame rAF
  meski update() tidak jalan (keypress bisa hilang di 120Hz; satu tekan
  E bisa terpicu 6x dalam satu frame lambat) — kini edge-triggered
  per-frame: beginFrame() menggabung, consumeEdges() setelah step
  pertama (input.js + main.js direvisi; play-test ulang lolos).
- 09:28 WIB: screenshot final (4 JPEG, 1280x720, <256 KiB); main.ts 2x
  -> out/ == out2/ byte-identik (16 file, DETERMINISTIK, 904K).
