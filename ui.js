// =====================
// UI: Modal, Tab, Navigasi
// =====================

function openModal(t) {
    closeModal();
    document.getElementById('modal-' + t).style.display = 'flex';
}

function closeModal() {
    document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
}

function showSection(id) {
    document.querySelectorAll('.page-section').forEach(s => s.classList.add('hidden-section'));
    document.getElementById('section-' + id).classList.remove('hidden-section');
    if (id === 'chat') {
        setTimeout(() => {
            const cb = document.getElementById('chat-messages');
            if (cb) cb.scrollTop = cb.scrollHeight;
        }, 100);
    }
    if (id === 'ffns-spring') {
        if (typeof initFFNS === 'function') initFFNS();
    }
}

function switchTab(tab) {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('tab-' + tab).classList.remove('hidden');
    document.getElementById('btn-tab-' + (tab === 'list-event' ? 'list' : 'ach')).classList.add('active');
}

function switchFFNSTab(tab) {
    document.querySelectorAll('.ffns-tab-content').forEach(c => c.classList.add('hidden'));
    document.querySelectorAll('.ffns-tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('ffns-content-' + tab).classList.remove('hidden');
    document.getElementById('ffns-tab-' + tab).classList.add('active');
}

function filterSlot() {
    const q = document.getElementById('search-slot').value.toLowerCase();
    document.querySelectorAll('#ffns-slot-body tr').forEach(tr => {
        const kota = tr.querySelector('td:nth-child(2)');
        if (kota) tr.style.display = kota.innerText.toLowerCase().includes(q) ? '' : 'none';
    });
}

function filterJuara() {
    const q = document.getElementById('search-juara').value.toLowerCase();
    document.querySelectorAll('#ffns-juara-grid .juara-card').forEach(card => {
        card.style.display = card.dataset.kota && card.dataset.kota.toLowerCase().includes(q) ? '' : 'none';
    });
}
