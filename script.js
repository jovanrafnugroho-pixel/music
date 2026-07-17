const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxqXtpz0peSHEoMolnrNpuYA1q1c0eyCPAPn56g-87bGRrka2gj8fMiKmpjApMXxFfZ/exec";

const audio = document.getElementById('myAudio');
const audioToggleBtn = document.getElementById('audioToggleBtn');
const lyricsBox = document.getElementById('lyricsBox');
const particleContainer = document.getElementById('particleContainer');
const albumArt = document.getElementById('albumArt');

let currentTheme = 'love';

// Database Kata Klik Rancangan Awal Berdasarkan Tema
const wordsData = {
    love: ["misteri", "waktu", "rasa", "merah", "melodi", "flicker", "hati", "tenang", "berlari"],
    heartbreak: ["labirin", "filsuf", "ilmuwan", "jenius", "redup", "masa lalu", "kabut", "dingin", "asing"]
};

// 9 Daftar Pertanyaan Kuesioner Karakter Hidup / Percintaan
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

// Algoritma Pengacakan Pertanyaan Otomatis (Fisher-Yates Shuffle)
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

// --- AUDIO CONTROLLER ENGINE & SMART FREE SCROLL ---
let isUserScrolling = false;
let userScrollTimeout = null;

// Deteksi jika user melakukan scroll manual di dalam lyricsBox
if (lyricsBox) {
    lyricsBox.addEventListener('scroll', () => {
        // Jika trigger scroll bukan dari sistem (smooth scroll otomatis)
        if (!lyricsBox.classList.contains('system-scrolling')) {
            isUserScrolling = true;
            
            // Reset timeout agar waktu tunggu diulang selama user masih menggeser lirik
            clearTimeout(userScrollTimeout);
            userScrollTimeout = setTimeout(() => {
                isUserScrolling = false;
            }, 3500); // 3.5 detik setelah geser manual selesai, autoscroll aktif lagi
        }
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
        const lyricLines = document.querySelectorAll('.lyric-line');
        const currentTime = audio.currentTime;
        let activeIndex = -1;

        for (let i = 0; i < lyricLines.length; i++) {
            if (currentTime >= parseFloat(lyricLines[i].getAttribute('data-time'))) {
                activeIndex = i;
            } else {
                break;
            }
        }

        if (activeIndex !== -1 && lyricsBox) {
            // Tetap update class active agar lirik yang sedang bernyanyi tetap berubah warna
            lyricLines.forEach(line => line.classList.remove('active'));
            const activeLine = lyricLines[activeIndex];
            activeLine.classList.add('active');
            
            // JIKA user tidak sedang menggeser lirik bebas, lakukan autoscroll secara halus
            if (!isUserScrolling) {
                const scrollPosition = activeLine.offsetTop - (lyricsBox.clientHeight / 2) + (activeLine.clientHeight / 2);
                
                // Beri penanda bahwa ini scroll dari sistem agar tidak bentrok dengan detektor manual
                lyricsBox.classList.add('system-scrolling');
                lyricsBox.scrollTo({ top: scrollPosition, behavior: 'smooth' });
                
                // Hapus penanda setelah animasi scroll selesai
                setTimeout(() => {
                    lyricsBox.classList.remove('system-scrolling');
                }, 400); 
            }
        }
    });
}


// --- SUB-SISTEM ALUR MODAL KUESIONER ---
function startMysteryFlow() {
    document.getElementById('nameOverlay').classList.add('show');
    
    const grid = document.getElementById('giftGrid');
    grid.innerHTML = "";
    for (let i = 1; i <= 9; i++) {
        grid.innerHTML += `<div class="gift-box" onclick="selectGift(${i})">🎁<span>${i}</span></div>`;
    }
}

function submitName() {
    const nameInput = document.getElementById('userNickname').value.trim();
    if (!nameInput) {
        alert("Mohon masukkan nickname kamu terlebih dahulu ya!");
        return;
    }
    dataUserSekarang.nickname = nameInput;
    document.getElementById('nameOverlay').classList.remove('show');
    document.getElementById('giftOverlay').classList.add('show');
}

function selectGift(nomorKado) {
    dataUserSekarang.nomorKado = nomorKado;
    document.getElementById('giftOverlay').classList.remove('show');
    document.getElementById('questionOverlay').classList.add('show');

    const giftAnimate = document.getElementById('giftAnimate');
    giftAnimate.className = "gift-opening-animation wobble-animate";

    setTimeout(() => { giftAnimate.className = "gift-opening-animation open-animate"; }, 1500);
    setTimeout(() => { setupPertanyaan(); }, 2200);
}

function setupPertanyaan() {
    const qContainer = document.getElementById('questionContainer');
    qContainer.innerHTML = "";
    selectedOptionIndex = null;

    const currentQ = pertanyaanTeracak[indeksPertanyaanSekarang];
    dataUserSekarang.pertanyaanDapat = currentQ.tanya;

    let htmlContent = `<div class="question-text">${currentQ.tanya}</div>`;

    if (currentQ.tipe === "pilihan") {
        currentQ.opsi.forEach((opsi, index) => {
            htmlContent += `<button class="option-btn" onclick="selectOpsi(this, ${index}, '${opsi}')">${opsi}</button>`;
        });
    } else if (currentQ.tipe === "essay") {
        htmlContent += `<textarea class="essay-input" id="essayAnswer" placeholder="Ketik pandangan/jawaban jujurmu di sini..."></textarea>`;
    }

    htmlContent += `<button class="mystery-btn-main" id="btnLanjut" onclick="saveAndNext('${currentQ.tipe}')">Lanjut</button>`;
    
    qContainer.innerHTML = htmlContent;
    qContainer.classList.add('show');
}

function selectOpsi(btn, index, teksOpsi) {
    const allButtons = document.querySelectorAll('.option-btn');
    allButtons.forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    selectedOptionIndex = index;
    dataUserSekarang.jawabanUser = teksOpsi;
}

function saveAndNext(tipe) {
    if (tipe === 'pilihan' && selectedOptionIndex === null) {
        alert("Silakan pilih salah satu jawaban sebelum menekan Lanjut.");
        return;
    }
    if (tipe === 'essay') {
        const essayVal = document.getElementById('essayAnswer').value.trim();
        if (!essayVal) {
            alert("Kolom isian tidak boleh kosong.");
            return;
        }
        dataUserSekarang.jawabanUser = essayVal;
    }

    const btnLanjut = document.getElementById('btnLanjut');
    btnLanjut.innerText = "Mengirim...";
    btnLanjut.disabled = true;

    dataUserSekarang.waktu = new Date().toLocaleString('id-ID');

    fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataUserSekarang)
    })
    .then(() => {
        const cardMisteri = document.getElementById('dynamicMysteryCard');
        cardMisteri.innerHTML = `
            <div style="padding: 20px 10px;">
                <h3 style="color: #ff416c; font-size: 24px; margin-bottom: 12px;">Thank You! ✨</h3>
                <p style="color: rgba(255,255,255,0.75); font-size: 13.5px; line-height: 1.6; margin-bottom: 20px;">
                    Terima kasih banyak, <b>${dataUserSekarang.nickname}</b>. <br>
                    Jawaban misterimu sudah berhasil tersimpan dengan aman ke database.
                </p>
                <button class="mystery-btn-main" onclick="closeMysterySystem()">Kembali</button>
            </div>
        `;
    })
    .catch(err => {
        alert("Gagal mengirim data. Coba cek koneksi internet.");
        btnLanjut.innerText = "Lanjut";
        btnLanjut.disabled = false;
    });
}

function closeMysterySystem() {
    document.getElementById('questionOverlay').classList.remove('show');
    location.reload(); 
}

// --- EFEK KLIK TEKS MELAYANG RANCANGAN AWAL ---
window.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON' || e.target.closest('.mystery-card') || e.target.classList.contains('lyric-line') || e.target.closest('.gift-box')) return;
    
    const wordEl = document.createElement('div');
    wordEl.classList.add('click-word');
    
    const activeWords = wordsData[currentTheme];
    const randomWord = activeWords[Math.floor(Math.random() * activeWords.length)];
    
    wordEl.innerText = randomWord;
    wordEl.style.color = currentTheme === 'love' ? `hsl(${340 + Math.random() * 20}, 100%, 75%)` : `hsl(${210 + Math.random() * 20}, 100%, 75%)`;
    wordEl.style.left = e.clientX + 'px';
    wordEl.style.top = e.clientY + 'px';
    
    document.body.appendChild(wordEl);
    setTimeout(() => { wordEl.remove(); }, 2000);
});

// --- PENGGANTI TEMA RANCANGAN AWAL ---
function switchTheme(theme) {
    currentTheme = theme;
    if (particleContainer) particleContainer.innerHTML = '';
    if (theme === 'love') {
        document.body.className = 'theme-love';
        if (albumArt) albumArt.innerText = '💝';
        document.getElementById('btnLove').classList.add('active-love');
        document.getElementById('btnBreak').classList.remove('active-break');
    } else {
        document.body.className = 'theme-heartbreak';
        if (albumArt) albumArt.innerText = '💧';
        document.getElementById('btnBreak').classList.add('active-break');
        document.getElementById('btnLove').classList.remove('active-love');
    }
}

// --- GENERATOR PARTIKEL JALAN OTOMATIS ---
function createParticle() {
    if (!particleContainer || particleContainer.childElementCount > 25) return;
    const particle = document.createElement('div');
    if (currentTheme === 'love') {
        particle.classList.add('particle-love');
        const size = Math.random() * 12 + 8;
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';
        if (Math.random() > 0.4) {
            particle.innerHTML = "<span style='color: rgba(255,75,107,0.3); font-size:12px;'>❤️</span>";
            particle.style.background = "none";
        }
        particle.style.left = Math.random() * 95 + 'vw';
        particle.style.animationDuration = (Math.random() * 3 + 5) + 's';
    } else {
        particle.classList.add('particle-snow');
        const size = Math.random() * 4 + 2;
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';
        particle.style.left = Math.random() * 95 + 'vw';
        particle.style.animationDuration = (Math.random() * 3 + 4) + 's';
    }
    particleContainer.appendChild(particle);
    setTimeout(() => { particle.remove(); }, 6000);
}
setInterval(createParticle, 400);
