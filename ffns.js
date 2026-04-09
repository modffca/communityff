// =====================
// FFNS 2026 SPRING DATA
// sheetId diambil dari auth.js (shared)
// =====================

const gidFFNS = '1455356831';

// Cache data agar tidak fetch ulang
let ffnsDataCache = null;

async function loadFFNSData() {
    if (ffnsDataCache) return ffnsDataCache;
    const res = await fetch(`https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&tq&gid=${gidFFNS}`);
    const text = await res.text();
    const json = JSON.parse(text.substr(47).slice(0, -2));
    ffnsDataCache = json.table.rows;
    return ffnsDataCache;
}

// =======================
// GRAND FINAL (Gambar 1)
// Kolom: A=0(Rank), B=1(Logo), C=2(Team), D=3(Booyah), E=4(PlacementPts), F=5(Elims), G=6(TotalPts)
// Baris data mulai index 2 (baris 3 di sheet, karena baris 1=judul, baris 2=header)
// =======================
async function renderGrandFinal() {
    try {
        const rows = await loadFFNSData();
        const tbody = document.getElementById('ffns-klasemen-body');
        const podiumEl = document.getElementById('ffns-podium');
        if (!tbody) return;

        let html = '';
        let podiumData = [];

        for (let i = 2; i < rows.length; i++) {
            const c = rows[i].c;
            if (!c || !c[2] || !c[2].v) continue; // skip baris kosong

            const rank  = c[0] ? c[0].v : (i - 1);
            const team  = c[2] ? c[2].v : '—';
            const booyah = c[3] ? (c[3].v === '-' ? '—' : c[3].v) : '—';
            const place  = c[4] ? c[4].v : 0;
            const elims  = c[5] ? c[5].v : 0;
            const total  = c[6] ? c[6].v : 0;

            const isTop3 = rank <= 3;
            const rankStyle = rank === 1
                ? 'accent-yellow font-black italic text-xl'
                : rank <= 3 ? 'text-orange-400 font-black italic text-lg'
                : 'text-gray-500 font-black italic';
            const rowStyle = rank === 1
                ? 'border-b border-yellow-500/30 bg-yellow-500/5'
                : rank === 2 ? 'border-b border-gray-700 bg-white/[0.02]'
                : rank === 3 ? 'border-b border-orange-900/30 bg-orange-900/5'
                : 'border-b border-gray-800 hover:bg-white/[0.02] transition';

            html += `<tr class="${rowStyle}">
                <td class="${rankStyle}">#${rank}</td>
                <td class="font-bold italic uppercase">${team}</td>
                <td class="text-center font-bold ${booyah !== '—' ? 'text-green-400' : 'text-gray-600'}">${booyah}</td>
                <td class="text-center font-bold">${place}</td>
                <td class="text-center font-bold text-blue-400">${elims}</td>
                <td class="text-center accent-yellow font-black italic text-base">${total}</td>
            </tr>`;

            if (isTop3) podiumData.push({ rank, team, total });
        }

        tbody.innerHTML = html || '<tr><td colspan="6" class="text-center py-8 text-gray-500 italic">Data tidak tersedia</td></tr>';
        renderPodium(podiumData, podiumEl);
    } catch(e) {
        const tbody = document.getElementById('ffns-klasemen-body');
        if (tbody) tbody.innerHTML = '<tr><td colspan="6" class="text-center py-8 text-red-500 font-black italic uppercase">Gagal memuat data</td></tr>';
    }
}

function renderPodium(data, el) {
    if (!el || data.length < 3) return;
    const medals = ['🏆','🥈','🥉'];
    const colors = ['accent-yellow','text-gray-300','text-orange-400'];
    const borderColors = ['border-yellow-500','border-gray-400','border-orange-700'];
    const bgColors = ['bg-yellow-500/10','bg-gray-800','bg-orange-900/30'];
    const heights = [110, 80, 60];
    const podiumBg = ['bg-yellow-500/20 border border-yellow-500/30','bg-gray-700','bg-orange-900/30'];
    const labels = ['Grand Champion','Runner Up','3rd Place'];

    // Urutan podium: 2nd, 1st, 3rd
    const order = [1, 0, 2];
    el.innerHTML = order.map(idx => {
        const d = data[idx];
        if (!d) return '';
        return `<div class="flex flex-col items-center gap-2">
            <div class="w-${idx===0?20:16} h-${idx===0?20:16} rounded-full border-4 ${borderColors[idx]} flex items-center justify-center ${bgColors[idx]} text-${idx===0?'3xl':'2xl'}">${medals[idx]}</div>
            <p class="font-black-italic italic uppercase ${idx===0?'text-xl':''} ${colors[idx]}">${d.team}</p>
            <p class="text-[9px] text-gray-500 italic uppercase">${labels[idx]}</p>
            <p class="text-[9px] accent-yellow font-black italic">${d.total} pts</p>
            <div class="w-${idx===0?28:24} ${podiumBg[idx]} rounded-t-lg flex items-center justify-center" style="height:${heights[idx]}px">
                <span class="font-black-italic italic text-${idx===0?'4xl':'2xl'} ${colors[idx]}">#${d.rank}</span>
            </div>
        </div>`;
    }).join('');
}

// =======================
// FIX SLOT CITY QUALIFIER (Gambar 3)
// Kolom: R=17(No), S=18(Kota), T=19(Week), U=20(Deposit), V=21(WebRegist), W=22(Fixed)
// Baris data mulai index 1 (baris 2 di sheet)
// =======================
let slotDataAll = [];

async function renderFixSlot() {
    try {
        const rows = await loadFFNSData();
        const tbody = document.getElementById('ffns-slot-body');
        if (!tbody) return;

        slotDataAll = [];

        for (let i = 1; i < rows.length; i++) {
            const c = rows[i].c;
            if (!c || !c[18] || !c[18].v) continue;

            const no      = c[17] ? c[17].v : i;
            const kota    = c[18] ? c[18].v : '—';
            const week    = c[19] ? c[19].v : '—';
            const deposit = c[20] ? c[20].v : 0;
            const webreg  = c[21] ? c[21].v : 0;
            const fixed   = c[22] ? c[22].v : 0;

            slotDataAll.push({ no, kota, week, deposit, webreg, fixed });
        }

        renderSlotTable(slotDataAll);
    } catch(e) {
        const tbody = document.getElementById('ffns-slot-body');
        if (tbody) tbody.innerHTML = '<tr><td colspan="6" class="text-center py-8 text-red-500 font-black italic uppercase">Gagal memuat data</td></tr>';
    }
}

function renderSlotTable(data) {
    const tbody = document.getElementById('ffns-slot-body');
    if (!tbody) return;

    // Kelompokkan per Week untuk row separator
    let html = '';
    let lastWeek = '';

    data.forEach(d => {
        if (d.week !== lastWeek) {
            lastWeek = d.week;
            html += `<tr class="bg-yellow-500/5">
                <td colspan="6" class="py-2 px-2 text-[9px] font-black italic uppercase text-yellow-500/70 border-b border-yellow-500/10">${d.week}</td>
            </tr>`;
        }
        html += `<tr class="border-b border-gray-800/50 hover:bg-white/[0.02] transition">
            <td class="text-gray-600 font-bold italic">${d.no}</td>
            <td class="font-bold italic uppercase">${d.kota}</td>
            <td class="text-center text-gray-400 text-[9px] italic">${d.week}</td>
            <td class="text-center font-bold text-blue-300">${d.deposit}</td>
            <td class="text-center font-bold text-purple-300">${d.webreg}</td>
            <td class="text-center accent-yellow font-black italic text-base">${d.fixed}</td>
        </tr>`;
    });

    tbody.innerHTML = html || '<tr><td colspan="6" class="text-center py-8 text-gray-500 italic">Data tidak tersedia</td></tr>';
}

// Override filterSlot untuk gunakan data cache
function filterSlot() {
    const q = document.getElementById('search-slot') ? document.getElementById('search-slot').value.toLowerCase() : '';
    if (!q) { renderSlotTable(slotDataAll); return; }
    const filtered = slotDataAll.filter(d => d.kota.toLowerCase().includes(q));
    renderSlotTable(filtered);
}

// =======================
// JUARA CITY QUALIFIER (Gambar 2)
// Kolom: I=8(Kota), J=9(Region), K=10(Juara1), L=11(Juara2), M=12(Juara3), N=13(LinkJ1), O=14(LinkJ2), P=15(LinkJ3)
// Baris data mulai index 1 (baris 2 di sheet)
// =======================
let juaraDataAll = [];

async function renderJuaraKota() {
    try {
        const rows = await loadFFNSData();
        const grid = document.getElementById('ffns-juara-grid');
        if (!grid) return;

        juaraDataAll = [];

        for (let i = 1; i < rows.length; i++) {
            const c = rows[i].c;
            if (!c || !c[8] || !c[8].v) continue;

            juaraDataAll.push({
                kota   : c[8] ? c[8].v : '—',
                region : c[9] ? c[9].v : '—',
                j1     : c[10] ? c[10].v : '—',
                j2     : c[11] ? c[11].v : '—',
                j3     : c[12] ? c[12].v : '—',
                linkJ1 : c[13] ? c[13].v : '',
                linkJ2 : c[14] ? c[14].v : '',
                linkJ3 : c[15] ? c[15].v : '',
            });
        }

        renderJuaraGrid(juaraDataAll);
    } catch(e) {
        const grid = document.getElementById('ffns-juara-grid');
        if (grid) grid.innerHTML = '<div class="col-span-full text-center py-8 text-red-500 font-black italic uppercase">Gagal memuat data</div>';
    }
}

function renderJuaraGrid(data) {
    const grid = document.getElementById('ffns-juara-grid');
    if (!grid) return;

    const regionColors = {
        'West 1': 'border-blue-500/30 bg-blue-500/5',
        'West 2': 'border-blue-400/30 bg-blue-400/5',
        'East 1': 'border-orange-500/30 bg-orange-500/5',
        'East 2': 'border-orange-400/30 bg-orange-400/5',
        'North 1': 'border-green-500/30 bg-green-500/5',
        'North 2': 'border-green-400/30 bg-green-400/5',
        'South 1': 'border-purple-500/30 bg-purple-500/5',
        'South 2': 'border-purple-400/30 bg-purple-400/5',
        'South 3': 'border-pink-400/30 bg-pink-400/5',
        'South 4': 'border-red-400/30 bg-red-400/5',
        'South 5': 'border-red-500/30 bg-red-500/5',
        'South 6': 'border-yellow-600/30 bg-yellow-600/5',
    };

    grid.innerHTML = data.map(d => {
        const borderClass = regionColors[d.region] || 'border-gray-800 bg-black/20';
        const j1Link = d.linkJ1 ? `href="${d.linkJ1}" target="_blank"` : '';
        const j2Link = d.linkJ2 ? `href="${d.linkJ2}" target="_blank"` : '';
        const j3Link = d.linkJ3 ? `href="${d.linkJ3}" target="_blank"` : '';

        return `<div class="juara-card bg-card p-4 border ${borderClass} rounded-xl" data-kota="${d.kota}">
            <div class="flex justify-between items-start mb-3">
                <div>
                    <p class="font-black-italic italic uppercase accent-yellow text-base leading-none">${d.kota}</p>
                    <p class="text-[9px] text-gray-500 italic uppercase font-bold mt-0.5">${d.region}</p>
                </div>
                <span class="text-[8px] font-black uppercase italic px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-500/80 border border-yellow-500/20">${d.region}</span>
            </div>
            <div class="space-y-1.5">
                <div class="flex items-center gap-2">
                    <span class="text-base">🥇</span>
                    <a ${j1Link} class="font-bold italic uppercase text-[10px] text-white ${d.linkJ1 ? 'hover:accent-yellow underline decoration-dotted' : ''} truncate flex-1">${d.j1 || '—'}</a>
                </div>
                <div class="flex items-center gap-2">
                    <span class="text-base">🥈</span>
                    <a ${j2Link} class="font-bold italic uppercase text-[10px] text-gray-300 ${d.linkJ2 ? 'hover:accent-yellow underline decoration-dotted' : ''} truncate flex-1">${d.j2 || '—'}</a>
                </div>
                <div class="flex items-center gap-2">
                    <span class="text-base">🥉</span>
                    <a ${j3Link} class="font-bold italic uppercase text-[10px] text-gray-400 ${d.linkJ3 ? 'hover:accent-yellow underline decoration-dotted' : ''} truncate flex-1">${d.j3 || '—'}</a>
                </div>
            </div>
        </div>`;
    }).join('') || '<div class="col-span-full text-center py-8 text-gray-500 italic">Data tidak tersedia</div>';
}

// Override filterJuara untuk gunakan data cache
function filterJuara() {
    const q = document.getElementById('search-juara') ? document.getElementById('search-juara').value.toLowerCase() : '';
    if (!q) { renderJuaraGrid(juaraDataAll); return; }
    renderJuaraGrid(juaraDataAll.filter(d => d.kota.toLowerCase().includes(q)));
}

// =======================
// Init: dipanggil saat section FFNS dibuka
// =======================
function initFFNS() {
    renderGrandFinal();
    renderFixSlot();
    renderJuaraKota();
}
