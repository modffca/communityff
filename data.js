// =====================
// DATA: Google Sheets & Komunitas Grid
// =====================

// sheetId didefinisikan di auth.js (shared)
const gidLeaderboard = '0';
const gidKomunitas = '1433263622';
const gidListEvent = '1205931844';

let masterKomunitas = [];
let currentLimit = 20;

async function loadData() {
    // Leaderboard
    fetch(`https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&tq&gid=${gidLeaderboard}`)
        .then(r => r.text())
        .then(t => {
            const rows = JSON.parse(t.substr(47).slice(0, -2)).table.rows;
            let hO = "", hM = "";
            let topKota = '';
            for (let i = 1; i < 11; i++) {
                const c = rows[i] ? rows[i].c : null;
                if (c && c[2]) {
                    if (i === 1) topKota = c[2].v;
                    hO += `<tr><td class="accent-yellow italic font-bold">#${c[1].v}</td><td class="font-bold italic uppercase">${c[2].v}</td><td class="text-center">${c[3].v}</td><td class="text-center accent-yellow font-black italic">${c[4].f || c[4].v}</td><td class="text-center text-gray-500">${c[5].f || c[5].v}</td></tr>`;
                }
                if (c && c[12]) hM += `<tr><td class="accent-yellow italic font-bold">#${c[11].v}</td><td class="font-bold italic uppercase">${c[12].v}</td><td class="text-center accent-yellow font-black italic">${c[14].f || c[14].v}</td></tr>`;
            }
            document.getElementById('overall-list').innerHTML = hO;
            document.getElementById('monthly-list').innerHTML = hM;

            // FFCA Dashboard - Top 5
            const top5El = document.getElementById('ffca-top5');
            const statTopKota = document.getElementById('stat-topkota');
            if (top5El) {
                let top5html = '';
                for (let i = 1; i <= 5 && i < rows.length; i++) {
                    const c = rows[i] ? rows[i].c : null;
                    if (!c || !c[2]) continue;
                    const colors = ['accent-yellow', 'text-gray-300', 'text-orange-400', 'text-gray-400', 'text-gray-400'];
                    top5html += `<div class="flex items-center justify-between p-2 rounded-lg bg-black/30 border border-gray-800">
                        <div class="flex items-center gap-2">
                            <span class="font-black-italic italic text-sm ${colors[i-1]}">#${c[1].v}</span>
                            <span class="font-bold italic uppercase text-[10px]">${c[2].v}</span>
                        </div>
                        <span class="font-black-italic italic accent-yellow text-[11px]">${c[4].f || c[4].v}</span>
                    </div>`;
                }
                top5El.innerHTML = top5html;
            }
            if (statTopKota) statTopKota.innerText = topKota || '—';
        });

    // Komunitas
    fetch(`https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&tq&gid=${gidKomunitas}`)
        .then(r => r.text())
        .then(t => {
            masterKomunitas = JSON.parse(t.substr(47).slice(0, -2)).table.rows.slice(1).map(r => ({
                kota: r.c[0]?.v, prov: r.c[2]?.v, pic: r.c[3]?.v, ig: r.c[4]?.v,
                tahun: r.c[5]?.v, logo: r.c[6]?.v, event: r.c[7]?.v
            })).filter(k => k.kota);
            updateDisplay();

            // FFCA Dashboard stats
            const statKomunitas = document.getElementById('stat-komunitas');
            const statEvent = document.getElementById('stat-event');
            const ffcaList = document.getElementById('ffca-komunitas-list');

            if (statKomunitas) statKomunitas.innerText = masterKomunitas.length;
            if (statEvent) {
                const totalEvent = masterKomunitas.reduce((sum, k) => sum + (parseInt(k.event) || 0), 0);
                statEvent.innerText = totalEvent;
            }
            if (ffcaList) {
                ffcaList.innerHTML = masterKomunitas.map(k => `
                    <tr class="hover:bg-white/5 transition">
                        <td class="font-bold italic uppercase">${k.kota}</td>
                        <td class="text-gray-400 italic">${k.pic || '-'}</td>
                        <td class="text-center accent-yellow font-black italic">${k.event || 0}</td>
                        <td class="text-center text-gray-500 text-[9px] italic uppercase">${k.prov || '-'}</td>
                    </tr>`).join('');
            }
        });
}

function updateDisplay() {
    const search = document.getElementById('search-kota').value.toLowerCase();
    const filtered = masterKomunitas.filter(k => k.kota.toString().toLowerCase().includes(search));
    document.getElementById('komunitas-grid').innerHTML = filtered.slice(0, currentLimit).map(k => `
        <div class="bg-card p-6 border border-gray-800 flex flex-col items-center text-center relative italic hover:border-yellow-500 transition">
            <div class="absolute top-3 right-3 bg-yellow-500 text-black text-[9px] font-black px-2 py-1 rounded italic uppercase">${k.event || 0} EVENTS</div>
            <img src="${k.logo || 'https://placehold.co/100/121212/FFD700?text=LOGO'}" class="w-20 h-20 rounded-full mb-4 border-2 border-gray-800 object-cover shadow-lg">
            <h4 class="text-xl font-black-italic accent-yellow mb-1 tracking-tighter uppercase italic">${k.kota}</h4>
            <p class="text-gray-500 text-[10px] uppercase font-bold italic mb-4">EST. ${k.tahun || '-'}</p>
            <div class="w-full text-left bg-black/40 p-3 rounded-lg border border-gray-800 mb-4">
                <div class="flex justify-between mb-1 italic"><span class="text-[9px] text-gray-500 font-bold uppercase italic">PIC Area</span><span class="text-[10px] text-white font-bold uppercase italic">${k.pic || '-'}</span></div>
                <div class="flex justify-between italic"><span class="text-[9px] text-gray-500 font-bold uppercase italic">Provinsi</span><span class="text-[10px] text-gray-400 uppercase italic">${k.prov || '-'}</span></div>
            </div>
            <div class="w-full flex gap-2">
                <button onclick="showEventDetail('${k.kota}')" class="flex-1 py-2 rounded-lg text-[10px] font-black uppercase bg-white/5 border border-white/10 italic">Detail</button>
                <a href="${k.ig}" target="_blank" class="flex-1 py-2 rounded-lg text-[10px] font-black uppercase bg-gradient-to-r from-orange-500 to-pink-600 text-center italic">IG</a>
            </div>
        </div>`).join('');
    document.getElementById('more-container').classList.toggle('hidden', filtered.length <= currentLimit);
}

function loadMore() {
    currentLimit += 20;
    updateDisplay();
}

async function showEventDetail(kota) {
    const dataKomunitas = masterKomunitas.find(k => k.kota.toLowerCase() === kota.toLowerCase());
    document.getElementById('event-title-kota').innerText = kota;
    const logoImg = document.getElementById('modal-kota-logo');
    logoImg.src = (dataKomunitas && dataKomunitas.logo) ? dataKomunitas.logo : 'https://placehold.co/100/121212/FFD700?text=LOGO';
    switchTab('list-event');
    openModal('event');
    document.getElementById('event-detail-list').innerHTML = `<tr><td colspan="4" class="text-center py-10 accent-yellow italic font-black">SYNCING...</td></tr>`;

    try {
        const res = await fetch(`https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&tq&gid=${gidListEvent}`);
        const text = await res.text();
        const json = JSON.parse(text.substr(47).slice(0, -2));
        const rows = json.table.rows;
        let html = "", count = 0;

        for (let i = 2; i < rows.length; i++) {
            const c = rows[i].c;
            if (c[7] && c[7].v.toString().trim().toLowerCase() === kota.toLowerCase().trim()) {
                html += `<tr class="hover:bg-white/5 transition border-b border-white/5">
                    <td class="py-4 font-bold text-white text-[10px] uppercase italic">${c[8] ? c[8].v : '-'}</td>
                    <td class="text-center text-gray-500 font-bold">${c[5] ? c[5].v : '-'}</td>
                    <td class="text-center accent-yellow font-black italic text-lg">${c[12] ? c[12].v : 0}</td>
                    <td class="text-right text-[9px] text-gray-400 italic">${c[13] ? (c[13].f || c[13].v) : '-'}</td>
                </tr>`;
                count++;
            }
        }
        document.getElementById('event-detail-list').innerHTML = count > 0 ? html : `<tr><td colspan="4" class="text-center py-10 italic">Belum ada data</td></tr>`;
    } catch (e) {
        document.getElementById('event-detail-list').innerHTML = `<tr><td colspan="4" class="text-center py-10 text-red-500 font-black italic uppercase">Error Koneksi Database</td></tr>`;
    }
}
