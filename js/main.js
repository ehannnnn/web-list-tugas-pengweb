/* =================================================
   main.js — Logika aplikasi pengumpulan tugas

   Perubahan utama:
   - Menyimpan waktu pengumpulan (`createdAt`) untuk setiap tugas.
   - Menyediakan opsi unggah file; file disimpan sebagai data URL di localStorage.
   - Menampilkan tautan unduh bila file diunggah, atau membuka link eksternal bila diberikan.
================================================= */

// Ambil elemen penting dari DOM
const taskForm = document.getElementById('taskForm');
const taskList = document.getElementById('taskList');
const taskCount = document.getElementById('taskCount');
const clearAllBtn = document.getElementById('clearAll');
const fileInput = document.getElementById('fileUpload');

// Ambil data dari localStorage atau inisialisasi array kosong
let tasks = JSON.parse(localStorage.getItem('tasks_v1')) || [];

// Fungsi menyimpan ke localStorage
function saveTasks() {
    localStorage.setItem('tasks_v1', JSON.stringify(tasks));
}

// Format tanggal dari ISO ke representasi lokal singkat
function formatDate(iso) {
    try {
        const d = new Date(iso);
        // Format: DD MMM YYYY, HH:MM (24-hour)
        const opts = {
            year: 'numeric', month: 'short', day: '2-digit',
            hour: '2-digit', minute: '2-digit', hour12: false
        };
        return d.toLocaleString(undefined, opts);
    } catch (e) {
        return iso;
    }
}

// Fungsi untuk merender semua tugas
function renderTasks() {
    taskList.innerHTML = '';

    if (tasks.length === 0) {
        taskList.innerHTML = '<div class="empty">Belum ada tugas yang dikumpulkan.</div>';
        taskCount.textContent = '0 Tugas';
        return;
    }

    taskCount.textContent = `${tasks.length} Tugas`;

    tasks.slice().reverse().forEach(task => {
        // Buat elemen kartu tugas
        const el = document.createElement('article');
        el.className = 'task-item';

        // Tampilkan sesuai permintaan: Nama, Waktu unggah, Deskripsi, Lihat File
        const fileHref = task.fileData ? task.fileData : task.fileLink;
        const fileTarget = task.fileData ? '' : ' target="_blank" rel="noopener"';

        el.innerHTML = `
            <div class="task-actions">
                <button class="icon-btn" title="Hapus" data-id="${task.id}"><i class="fa-solid fa-trash-can"></i></button>
            </div>
            <h3 class="task-title">${escapeHtml(task.title)}</h3>
            <div class="task-student">Nama: ${escapeHtml(task.studentName)}</div>
            <div class="task-time">${formatDate(task.createdAt)}</div>
            <p class="task-desc">${escapeHtml(task.description)}</p>
            <a class="task-link" href="${escapeAttr(fileHref)}"${fileTarget}>Lihat File</a>
        `;

        // Event hapus per kartu (delegasi sederhana)
        const btn = el.querySelector('[data-id]');
        if (btn) {
            btn.addEventListener('click', function () {
                const id = Number(this.getAttribute('data-id'));
                deleteTask(id);
            });
        }

        taskList.appendChild(el);
    });
}

// Escape sederhana untuk mencegah injeksi HTML saat menampilkan data
function escapeHtml(str) {
    return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Escape untuk atribut (URL / nama file)
function escapeAttr(s) {
    return String(s || '').replace(/"/g, '%22');
}

// Bantu fungsi baca file sebagai data URL
function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Tambah tugas baru ketika form disubmit
taskForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    const studentName = document.getElementById('studentName').value.trim();
    const title = document.getElementById('title').value.trim();
    const description = document.getElementById('description').value.trim();
    const fileLink = document.getElementById('fileLink').value.trim();
    const course = document.getElementById('course').value;

    // Ambil file jika ada
    const file = fileInput && fileInput.files && fileInput.files[0] ? fileInput.files[0] : null;

    // Validasi: minimal salah satu antara file atau link harus ada
    if (!studentName || !title || !description || (!file && !fileLink)) {
        alert('Lengkapi semua kolom dan sertakan link atau unggah file sebelum menyimpan tugas.');
        return;
    }

    // Jika terdapat file, baca sebagai data URL
    let fileData = null;
    let fileName = '';
    let fileType = '';

    if (file) {
        try {
            fileData = await readFileAsDataURL(file);
            fileName = file.name;
            fileType = file.type;
        } catch (err) {
            console.error('Gagal membaca file:', err);
            alert('Terjadi kesalahan saat membaca file. Coba lagi.');
            return;
        }
    }

    const newTask = {
        id: Date.now(),
        studentName,
        course,
        title,
        description,
        fileLink: fileData ? '' : fileLink,
        fileData: fileData, // data URL bila diunggah
        fileName: fileName,
        fileType: fileType,
        createdAt: new Date().toISOString()
    };

    tasks.push(newTask);
    saveTasks();
    renderTasks();

    // Reset form dan fokus ke nama
    taskForm.reset();
    if (fileInput) fileInput.value = '';
    document.getElementById('studentName').focus();

    // Umpan balik singkat
    showToast('Tugas berhasil disimpan.');
});

// Hapus tugas berdasarkan id
function deleteTask(id) {
    if (!confirm('Yakin ingin menghapus tugas ini?')) return;
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    renderTasks();
}

// Hapus semua tugas
clearAllBtn.addEventListener('click', function () {
    if (!confirm('Hapus semua tugas dari peramban? Tindakan ini tidak bisa dibatalkan.')) return;
    tasks = [];
    saveTasks();
    renderTasks();
});

// Simple toast / notifikasi kecil di pojok bawah
function showToast(message) {
    const t = document.createElement('div');
    t.textContent = message;
    t.style.position = 'fixed';
    t.style.right = '20px';
    t.style.bottom = '20px';
    t.style.background = 'rgba(15,23,42,0.95)';
    t.style.color = '#fff';
    t.style.padding = '10px 14px';
    t.style.borderRadius = '8px';
    t.style.boxShadow = '0 6px 20px rgba(2,6,23,0.4)';
    t.style.zIndex = 9999;
    t.style.fontWeight = 600;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2200);
}

// Inisialisasi render pertama kali ketika halaman dimuat
renderTasks();
