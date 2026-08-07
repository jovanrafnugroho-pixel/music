const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxqXtpz0peSHEoMolnrNpuYA1q1c0eyCPAPn56g-87bGRrka2gj8fMiKmpjApMXxFfZ/exec";

const audio = document.getElementById('myAudio');
const audioToggleBtn = document.getElementById('audioToggleBtn');
const lyricsBox = document.getElementById('lyricsBox');
const particleContainer = document.getElementById('particleContainer');
const albumArt = document.getElementById('albumArt');

let currentTheme = 'love';
let particleInterval = null;
let lyricLines = [];
let isUserScrolling = false;
let scrollTimeout = null;
let lastActiveIndex = -1;

// Database Kata Klik
const wordsData = {
    love: ["misteri", "waktu", "rasa", "merah", "melodi", "hati", "tenang", "berlari", "cinta", "hangat", "indah", "mimpi"],
    heartbreak: ["labirin", "filsuf", "ilmuwan", "jenius", "redup", "masa lalu", "kabut", "dingin", "asing", "salju", "sepi", "hampa", "sunyi", "luka"]
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

// ============= AUDIO & LYRIC ENGINE =============
function toggleAudio() {
    if (!audio) return;
    if (audio.paused) {
        audio.play().then(() => {
            audioToggleBtn.innerText = "⏸ Pause";
            audioToggleBtn.classList.add('playing');
        }).catch(err => {
            alert("Error: Gagal memutar berkas audio. Pastikan berkas bernama audio.mp3 sudah berada di root repositori GitHub kamu.");
        });
    } else {
        audio.pause();
        audioToggleBtn.innerText = "▶ Play";
        audioToggleBtn.classList.remove('playing');
    }
}

// Deteksi scroll user
if (lyricsBox) {
    lyricLines = document.querySelectorAll('.lyric-line');
    
    lyricsBox.addEventListener('scroll', function() {
        isUserScrolling = true;
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            isUserScrolling = false;
        }, 2000);
    });
}

// Core: Update lirik dan scroll otomatis
if (audio) {
    audio.addEventListener('timeupdate', function() {
        const currentTime = audio.currentTime;
        let activeIndex = -1;

        // Cari lirik aktif
        for (let i = 0; i < lyricLines.length; i++) {
            const time = parseFloat(lyricLines[i].getAttribute('data-time'));
            if (currentTime >= time) {
                activeIndex = i;
            } else {
                break;
            }
        }

        // Hanya proses jika ada perubahan lirik
        if (activeIndex !== -1 && activeIndex !== lastActiveIndex) {
            lastActiveIndex = activeIndex;
            
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

            // SCROLL OTOMATIS - hanya jika user tidak sedang scroll
            if (!isUserScrolling) {
                const boxHeight = lyricsBox.clientHeight;
                const activeLine = lyricLines[activeIndex];
                const lineTop = activeLine.offsetTop;
                const lineHeight = activeLine.clientHeight;
                
                const targetScroll = lineTop - (boxHeight / 2) + (lineHeight / 2);
                
                lyricsBox.scrollTo({
                    top: targetScroll,
                    behavior: 'smooth'
                });
            }
        }
    });
}

// ============= PARTIKEL SYSTEM =============
function createWarmParticle() {
    if (!particleContainer) return;
    
    const particle = document.createElement('div');
    particle.classList.add('particle-warm');
    
    // PARTIKEL WARNA MERAH - Berbagai bentuk dan ukuran
    const shapes = ['●', '♥', '♦', '●', '♥', '♦', '●', '♥'];
    const redColors = [
        '#ff1744', '#d50000', '#ff5252', '#ff8a80', 
        '#f44336', '#e53935', '#ff6b6b', '#ff4757'
    ];
    
    particle.textContent = shapes[Math.floor(Math.random() * shapes.length)];
    particle.style.color = redColors[Math.floor(Math.random() * redColors.length)];
    particle.style.fontSize = (Math.random() * 20 + 12) + 'px';
    particle.style.left = (Math.random() * 95 + 2) + 'vw';
    particle.style.animationDuration = (Math.random() * 4 + 5) + 's';
    particle.style.animationDelay = (Math.random() * 5) + 's';
    particle.style.textShadow = `0 0 20px ${redColors[Math.floor(Math.random() * redColors.length)]}`;
    
    // Efek glow untuk beberapa partikel
    if (Math.random() > 0.7) {
        particle.style.filter = 'blur(1px) brightness(1.5)';
    }
    
    particleContainer.appendChild(particle);
    setTimeout(() => { 
        if (particle.parentNode) particle.remove(); 
    }, 12000);
}

function createColdParticle() {
    if (!particleContainer) return;
    
    const particle = document.createElement('div');
    particle.classList.add('particle-cold');
    
    const size = Math.random() * 10 + 3;
    particle.style.width = size + 'px';
    particle.style.height = size + 'px';
    particle.style.left = (Math.random() * 95 + 2) + 'vw';
    particle.style.animationDuration = (Math.random() * 4 + 4) + 's';
    particle.style.animationDelay = (Math.random() * 6) + 's';
    particle.style.opacity = (Math.random() * 0.6 + 0.2);
    
    if (Math.random() > 0.6) {
        particle.style.boxShadow = '0 0 20px rgba(200, 220, 255, 0.6), 0 0 40px rgba(200, 220, 255, 0.2)';
        particle.style.background = 'rgba(200, 220, 255, 0.9)';
    }
    
    particleContainer.appendChild(particle);
    setTimeout(() => { 
        if (particle.parentNode) particle.remove(); 
    }, 12000);
}

function startParticles(theme) {
    if (particleInterval) {
        clearInterval(particleInterval);
        particleInterval = null;
    }
    
    if (particleContainer) {
        particleContainer.innerHTML = '';
    }
    
    if (theme === 'love') {
        // Warm particles - merah, interval lebih rapat
        particleInterval = setInterval(createWarmParticle, 150);
        for (let i = 0; i < 25; i++) {
            setTimeout(createWarmParticle, i * 120);
        }
    } else {
        // Cold particles
        particleInterval = setInterval(createColdParticle, 150);
        for (let i = 0; i < 30; i++) {
            setTimeout(createColdParticle, i * 100);
        }
    }
}

// ============= MYSTERY SYSTEM =============
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
    
    setTimeout(() => {
        const cardMisteri = document.getElementById('dynamicMysteryCard');
        cardMisteri.innerHTML = `
            <div class="gift-opening-animation" id="giftAnimate">🎁</div>
            <div class="question-container" id="questionContainer"></div>
        `;
        indeksPertanyaanSekarang = (indeksPertanyaanSekarang + 1) % pertanyaanTeracak.length;
    }, 400);
}

// ============= EFEK KLIK =============
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

// ============= SWITCH THEME =============
function switchTheme(theme) {
    currentTheme = theme;
    
    if (theme === 'love') {
        document.body.className = 'theme-love';
        if (albumArt) albumArt.innerText = '❤️';
        document.getElementById('btnLove').classList.add('active-love');
        document.getElementById('btnBreak').classList.remove('active-break');
    } else {
        document.body.className = 'theme-heartbreak';
        if (albumArt) albumArt.innerText = '❄️';
        document.getElementById('btnBreak').classList.add('active-break');
        document.getElementById('btnLove').classList.remove('active-love');
    }
    
    startParticles(theme);
}

// ============= INISIALISASI =============
document.addEventListener('DOMContentLoaded', function() {
    lyricLines = document.querySelectorAll('.lyric-line');
    startParticles('love');
});