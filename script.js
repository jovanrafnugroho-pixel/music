const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxqXtpz0peSHEoMolnrNpuYA1q1c0eyCPAPn56g-87bGRrka2gj8fMiKmpjApMXxFfZ/exec";

const audio = document.getElementById('myAudio');
const audioToggleBtn = document.getElementById('audioToggleBtn');
const lyricsBox = document.getElementById('lyricsBox');
const particleContainer = document.getElementById('particleContainer');
const albumArt = document.getElementById('albumArt');

let currentTheme = 'love';
let particleInterval = null;

// Database Kata Klik
const wordsData = {
    love: ["misteri", "waktu", "rasa", "merah", "melodi", "flicker", "hati", "tenang", "berlari", "sakura", "cinta", "hangat"],
    heartbreak: ["labirin", "filsuf", "ilmuwan", "jenius", "redup", "masa lalu", "kabut", "dingin", "asing", "salju", "sepi", "hampa"]
};

// 9 Daftar Pertanyaan
const listPertanyaan = [
    { id: 1, tipe: "pilihan", tanya: "Jika cinta adalah sebuah ruang, mana situasi yang paling menggambarkan dirimu saat ini?", opsi: ["Penuh kehangatan, namun pintunya terkunci rapat.", "Jendelanya terbuka lebar, siap menerima siapa saja.", "Kosong dan berdebu, malas untuk merawatnya lagi.", "Sedang sibuk merenovasi struktur fondasi diri."] },
    { id: 2, tipe: "pilihan", tanya: "Saat seseorang yang berharga perlahan berubah menjadi asing, apa tindakan spontanmu?", opsi: ["Mengejarnya mati-matian mencari penjelasan.", "Mundur perlahan tanpa sepatah kata pun.", "Berpura-pura tidak peduli padahal mengawasi dari jauh.", "Menerima keadaan dengan cepat karena logis."] },
    { id: 3, tipe: "pilihan", tanya: "Dalam sebuah komitmen, hal mana yang paling menakutkan bagimu?", opsi: ["Kehilangan kebebasan dan ambisi pribadi.", "Dikhianati setelah memberikan segalanya.", "Rasa bosan yang membunuh percikan awal.", "Menyadari bahwa dia bukan orang yang tepat di akhir."] },
    { id: 4, tipe: "pilihan", tanya: "Jika kamu bisa membaca pikiran pasangan/orang terdekatmu selama 5 menit, apakah kamu akan melakukannya?", opsi: ["Ya, aku butuh kepastian mutlak atas raguku.", "Tidak, ketidaktahuan terkadang adalah pelindung terbaik.", "Hanya jika hubunganku sedang di ambang kehancuran.", "Lebih memilih bertanya langsung secara jujur."] },
    { id: 5, tipe: "essay", tanya: "Tuliskan secara jujur, apa definisi 'keterikatan emosional yang sehat' menurut sudut pandang pribadimu?" },
    { id: 6, tipe: "pilihan", tanya: "Bagaimana caramu berdamai dengan ekspektasi cinta yang patah di masa lalu?", opsi: ["Menjadikannya benteng pertahanan yang super ketat.", "Mencoba melupakannya dengan mencari distraksi baru.", "Menerimanya sebagai guru filsafat hidup terbaik.", "Masih sering terjebak dalam siklus penyesalan."] },
    { id: 7, tipe: "pilihan", tanya: "Manakah yang lebih bernilai tinggi bagimu dalam mempertahankan sebuah hubungan?", opsi: ["Kecocokan intelektual & jalan pikiran.", "Kehadiran fisik & afeksi yang intens.", "Komitmen emosional & rasa aman jangka panjang.", "Kebebasan untuk tetap tumbuh secara mandiri."] },
    { id: 8, tipe: "essay", tanya: "Bila kamu dihadapkan pada pilihan: 'Mencintai dengan risiko hancur' atau 'Tidak pernah mencintai agar aman', mana yang kamu pilih dan mengapa?" },
    { id: 9, tipe: "essay", tanya: "Sebutkan satu sifat atau kebiasaan burukmu dalam hubungan yang saat ini sedang coba kamu perbaiki secara mandiri." }
];

// Algoritma Pengacakan
function acakPertanyaan(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

const pertanyaanTeracak = acakPertanyaan([...listPertanyaan]);
let indeksPertanyaanSekarang = 0;

let dataUserSekarang = { nickname: "", nomorKado: null, pertanyaanDapat: "", jawabanUser: "" };
let selectedOptionIndex = null;

// --- AUDIO CONTROLLER ENGINE ---
let isUserScrolling = false;
let lastScrollTop = 0;
let lyricLines = [];

if (lyricsBox) {
    lyricLines = document.querySelectorAll('.lyric-line');
    
    lyricsBox.addEventListener('scroll', () => {
        if (lyricsBox.classList.contains('system-scrolling')) return;
        const currentScrollTop = lyricsBox.scrollTop;
        if (currentScrollTop > lastScrollTop) {
            isUserScrolling = true;
        } else if (currentScrollTop === 0) {
            isUserScrolling = false;
        }
        lastScrollTop = currentScrollTop <= 0 ? 0 : currentScrollTop;
    });
}

function toggleAudio() {
    if (!audio) return;
    if (audio.paused) {
        audio.play().then(() => {
            audioToggleBtn.innerText = "Pause ⏸";
            audioToggleBtn.classList.add('playing');
        }).catch(err => {
            alert("Error: Gagal memutar berkas audio. Pastikan berkas bernama audio.mp3 sudah berada di root repositori GitHub kamu.");
        });
    } else {
        audio.pause();
        audioToggleBtn.innerText = "Play ▶";
        audioToggleBtn.classList.remove('playing');
    }
}

if (audio) {
    audio.addEventListener('timeupdate', () => {
        const currentTime = audio.currentTime;
        let activeIndex = -1;

        // Cari lirik aktif
        for (let i = 0; i < lyricLines.length; i++) {
            if (currentTime >= parseFloat(lyricLines[i].getAttribute('data-time'))) {
                activeIndex = i;
            } else {
                break;
            }
        }

        if (activeIndex !== -1 && lyricsBox) {
            // Reset semua kelas
            lyricLines.forEach(line => {
                line.classList.remove('active', 'prev-active', 'next-active');
            });

            // Set active
            lyricLines[activeIndex].classList.add('active');

            // Set prev (activeIndex - 1)
            if (activeIndex > 0) {
                lyricLines[activeIndex - 1].classList.add('prev-active');
            }

            // Set next (activeIndex + 1)
            if (activeIndex < lyricLines.length - 1) {
                lyricLines[activeIndex + 1].classList.add('next-active');
            }

            // Scroll otomatis
            if (!isUserScrolling) {
                const boxHeight = lyricsBox.clientHeight;
                const activeLine = lyricLines[activeIndex];
                const lineTop = activeLine.offsetTop;
                const line