const audio = document.getElementById('myAudio');
const audioToggleBtn = document.getElementById('audioToggleBtn');
const lyricsBox = document.getElementById('lyricsBox');
const lyricLines = document.querySelectorAll('.lyric-line');
const particleContainer = document.getElementById('particleContainer');
const albumArt = document.getElementById('albumArt');
const modal = document.getElementById('philosophyModal');

let currentTheme = 'love';

// 1. Tombol Musik Audio Kustom
function toggleAudio() {
    if (audio.paused) {
        audio.play();
        audioToggleBtn.innerText = "Pause ⏸";
        audioToggleBtn.classList.add('playing');
    } else {
        audio.pause();
        audioToggleBtn.innerText = "Play ▶";
        audioToggleBtn.classList.remove('playing');
    }
}

audio.addEventListener('ended', () => {
    audioToggleBtn.innerText = "Play ▶";
    audioToggleBtn.classList.remove('playing');
});

// 2. Auto Scroll Lirik Berjalan
audio.addEventListener('timeupdate', () => {
    const currentTime = audio.currentTime;
    let activeIndex = -1;

    for (let i = 0; i < lyricLines.length; i++) {
        if (currentTime >= parseFloat(lyricLines[i].getAttribute('data-time'))) {
            activeIndex = i;
        } else {
            break;
        }
    }

    if (activeIndex !== -1) {
        lyricLines.forEach(line => line.classList.remove('active'));
        const activeLine = lyricLines[activeIndex];
        activeLine.classList.add('active');

        const boxHeight = lyricsBox.clientHeight;
        const lineTop = activeLine.offsetTop;
        const lineHeight = activeLine.clientHeight;
        
        const scrollPosition = lineTop - (boxHeight / 2) + (lineHeight / 2);
        lyricsBox.scrollTo({ top: scrollPosition, behavior: 'smooth' });
    }
});

// 3. Klik Lirik untuk Lompat Detik Lagu
lyricLines.forEach(line => {
    line.addEventListener('click', () => {
        const targetTime = parseFloat(line.getAttribute('data-time'));
        audio.currentTime = targetTime;
        if (audio.paused) {
            audio.play();
            audioToggleBtn.innerText = "Pause ⏸";
            audioToggleBtn.classList.add('playing');
        }
    });
});

// 4. Pengendali Tema Suasana (Red / Blue) & Reset Partikel Bersih
function switchTheme(theme) {
    currentTheme = theme;
    const btnLove = document.getElementById('btnLove');
    const btnBreak = document.getElementById('btnBreak');
    
    // Bersihkan semua partikel lama saat ganti tema agar tidak tercampur
    particleContainer.innerHTML = '';

    if (theme === 'love') {
        document.body.className = 'theme-love';
        albumArt.innerText = '💝';
        btnLove.classList.add('active-love');
        btnBreak.classList.remove('active-break');
        if (!audio.paused) audioToggleBtn.className = 'audio-toggle-btn playing';
    } else {
        document.body.className = 'theme-heartbreak';
        albumArt.innerText = '💧';
        btnBreak.classList.add('active-break');
        btnLove.classList.remove('active-love');
        if (!audio.paused) audioToggleBtn.className = 'audio-toggle-btn playing';
    }
}

// 5. Fungsi Pop-Up Modal
function toggleModal(open) {
    if (open) {
        modal.classList.add('show');
    } else {
        modal.classList.remove('show');
    }
}

// 6. Sistem Pembentukan Efek Latar Belakang Desain Baru
function createParticle() {
    if (particleContainer.childElementCount > 35) return;

    const particle = document.createElement('div');
    
    if (currentTheme === 'love') {
        // Efek Tema Red: Cahaya hangat & Love melayang ke atas
        particle.classList.add('particle-love');
        const size = Math.random() * 15 + 10;
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';
        
        // Sesekali memunculkan bentuk bentuk cinta murni secara acak
        if (Math.random() > 0.4) {
            particle.innerHTML = "<span style='color: rgba(255,75,107,0.4); font-size:12px;'>❤️</span>";
            particle.style.background = "none";
        }
        
        particle.style.left = Math.random() * 100 + 'vw';
        particle.style.animationDuration = (Math.random() * 3 + 5) + 's';
        
    } else {
        // Efek Tema Blue: Butiran es salju jatuh dari atas langit Tokyo
        particle.classList.add('particle-snow');
        const size = Math.random() * 5 + 3;
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';
        particle.style.left = Math.random() * 100 + 'vw';
        particle.style.animationDuration = (Math.random() * 3 + 4) + 's';
        particle.style.opacity = Math.random() * 0.6 + 0.4;
    }

    particleContainer.appendChild(particle);
    
    // Hapus otomatis setelah animasi selesai agar memori tetap ringan
    setTimeout(() => { particle.remove(); }, 7000);
}

setInterval(createParticle, 300);
