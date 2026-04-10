// =====================
// DATA: Google Sheets & Komunitas Grid
// =====================

// sheetId didefinisikan di auth.js (shared)
const gidLeaderboard = '0';
const gidKomunitas = '1433263622';
const gidListEvent = '1205931844';
const gidTurnamen = '1506094915';
const gidNobar = '1959787644';

let masterKomunitas = [];
let currentLimit = 20;
let analyticsEvents = [];

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

function loadAnalyticsData() {
    analyticsEvents = [];
    const sheets = [
        {name: 'Turnamen', gid: gidTurnamen},
        {name: 'Nobar', gid: gidNobar}
    ];

    const requests = sheets.map(sheet => {
        if (!sheet.gid || sheet.gid.includes('INSERT')) return Promise.resolve();
        return fetch(`https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&tq&gid=${sheet.gid}`)
            .then(r => r.text())
            .then(t => {
                const rows = JSON.parse(t.substr(47).slice(0, -2)).table.rows;
                rows.slice(1).forEach(row => {
                    const c = row.c;
                    const status = normalizeAnalyticsStatus(c[1]?.v || c[1]?.f);
                    const date = parseAnalyticsDate(c[12]);
                    const kota = c[21]?.v || c[21]?.f || 'Unknown';
                    const onlineStatus = (c[8]?.v || c[8]?.f || '').toString().trim();
                    const mode = (c[14]?.v || c[14]?.f || '').toString().trim();
                    const eventTypeRaw = (c[22]?.v || c[22]?.f || '').toString().trim().toLowerCase();
                    const eventType = eventTypeRaw.includes('nobar') ? 'Nobar' : 'turnamen';
                    const eventName = c[5]?.v || c[5]?.f || 'Event';
                    if (!status || !date) return;
                    analyticsEvents.push({source: sheet.name, status, date, kota, onlineStatus, mode, eventType, eventName});
                });
            });
    });

    Promise.all(requests).then(() => {
        initAnalyticsFilters();
        updateAnalyticsDisplay();
    });
}

function normalizeAnalyticsStatus(value) {
    if (!value) return null;
    const text = value.toString().toLowerCase().trim();
    if (text.includes('ok') || text.includes('accept') || text.includes('accepted') || text.includes('approved')) return 'ok';
    if (text.includes('reject') || text.includes('no') || text.includes('not')) return 'reject';
    return null;
}

function parseAnalyticsDate(cell) {
    if (!cell) return null;
    const raw = cell.v || cell.f;
    if (!raw) return null;
    const rawString = raw.toString().trim();

    // Support Google Sheets raw Date(...) values from Google JSON export
    const jsDateMatch = rawString.match(/Date\((\d+),(\d+),(\d+)(?:,(\d+),(\d+),(\d+))?\)/);
    if (jsDateMatch) {
        const year = parseInt(jsDateMatch[1], 10);
        const monthIndex = parseInt(jsDateMatch[2], 10);
        const day = parseInt(jsDateMatch[3], 10);
        const hour = jsDateMatch[4] ? parseInt(jsDateMatch[4], 10) : 0;
        const minute = jsDateMatch[5] ? parseInt(jsDateMatch[5], 10) : 0;
        const second = jsDateMatch[6] ? parseInt(jsDateMatch[6], 10) : 0;
        const parsed = new Date(year, monthIndex, day, hour, minute, second);
        if (!isNaN(parsed)) return parsed;
    }

    const date = new Date(rawString);
    if (!isNaN(date)) return date;

    const parts = rawString.split(/[-\/\.]/).map(p => p.trim());
    if (parts.length >= 3) {
        let [first, second, third] = parts;
        if (third.length === 2) third = '20' + third;
        if (parseInt(first, 10) > 31) [first, second] = [second, first];
        const fixed = `${third}-${second.padStart(2, '0')}-${first.padStart(2, '0')}`;
        const parsed = new Date(fixed);
        if (!isNaN(parsed)) return parsed;
    }
    return null;
}

function initAnalyticsFilters() {
    const monthSelect = document.getElementById('analytics-month');
    const yearSelect = document.getElementById('analytics-year');
    const now = new Date();
    const years = analyticsEvents.length ? analyticsEvents.map(e => e.date.getFullYear()) : [now.getFullYear()];
    const minYear = Math.min(...years, now.getFullYear());
    const maxYear = Math.max(...years, now.getFullYear());

    if (yearSelect) {
        yearSelect.innerHTML = Array.from({length: maxYear - minYear + 1}, (_, index) => {
            const value = minYear + index;
            return `<option value="${value}">${value}</option>`;
        }).join('');
        yearSelect.value = now.getFullYear();
    }

    if (monthSelect) {
        monthSelect.value = now.getMonth();
    }
}

function updateAnalyticsDisplay() {
    const monthSelect = document.getElementById('analytics-month');
    const yearSelect = document.getElementById('analytics-year');
    const chartContainer = document.getElementById('analytics-daily-chart');
    const cityList = document.getElementById('analytics-city-list');
    const statusScheduled = document.getElementById('analytics-status-scheduled');
    const statusOngoing = document.getElementById('analytics-status-ongoing');
    const statusComplete = document.getElementById('analytics-status-complete');
    const totalOk = document.getElementById('analytics-total-ok');
    const totalEvents = document.getElementById('analytics-total-events');

    if (!chartContainer) return;
    if (gidTurnamen.includes('INSERT') || gidNobar.includes('INSERT')) {
        chartContainer.innerHTML = `<div class="p-6 text-center text-gray-400 italic">Silakan perbarui nilai <code>gidTurnamen</code> dan <code>gidNobar</code> di <strong>data.js</strong></div>`;
        if (cityList) cityList.innerHTML = '';
        if (statusScheduled) statusScheduled.innerText = '0';
        if (statusOngoing) statusOngoing.innerText = '0';
        if (statusComplete) statusComplete.innerText = '0';
        if (totalOk) totalOk.innerText = '0';
        if (totalEvents) totalEvents.innerText = '0';
        return;
    }

    const selectedMonth = monthSelect ? parseInt(monthSelect.value, 10) : new Date().getMonth();
    const selectedYear = yearSelect ? parseInt(yearSelect.value, 10) : new Date().getFullYear();
    const filtered = analyticsEvents.filter(e => e.date.getMonth() === selectedMonth && e.date.getFullYear() === selectedYear);
    const okEvents = filtered.filter(e => e.status === 'ok');

    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const dayCounts = Array.from({length: daysInMonth}, () => ({ok: 0}));
    okEvents.forEach(e => {
        const day = e.date.getDate();
        if (day >= 1 && day <= daysInMonth) dayCounts[day - 1].ok += 1;
    });

    const maxDayOk = Math.max(...dayCounts.map(d => d.ok), 1);
    const dailyChart = `<div class="bg-[#111111] p-4 rounded-2xl border border-gray-800 min-h-[280px]">
        <div class="space-y-3">${dayCounts.map((day, index) => {
            const width = maxDayOk ? Math.round((day.ok / maxDayOk) * 100) : 0;
            return `<div class="flex items-center gap-3 text-[10px] text-gray-400">
                <span class="w-6 text-right">${index + 1}</span>
                <div class="h-4 w-full rounded-full bg-[#0d0d0d] overflow-hidden border border-gray-800">
                    <div class="h-full bg-emerald-400" style="width:${width}%"></div>
                </div>
                <span class="w-8 text-right text-white">${day.ok}</span>
            </div>`;
        }).join('')}</div>
    </div>`;

    const okSummary = `<div class="bg-[#111111] p-4 rounded-2xl border border-gray-800 min-h-[280px]">
            <div class="flex flex-col justify-between h-full gap-4">
                <div>
                    <div class="flex justify-between items-center text-[10px] uppercase text-gray-400 mb-3"><span>Jumlah OK</span><span>${okEvents.length}</span></div>
                    <div class="flex justify-between items-center text-[10px] uppercase text-gray-400 mb-3"><span>Total Hari</span><span>${daysInMonth}</span></div>
                </div>
                <div class="grid grid-cols-1 gap-3">
                    <div class="rounded-2xl bg-white/5 p-3 text-[11px] uppercase text-gray-400">Rata-rata per hari: <span class="text-white">${Math.round(okEvents.length / daysInMonth || 0)}</span></div>
                    <div class="rounded-2xl bg-white/5 p-3 text-[11px] uppercase text-gray-400">Hari tersentuh OK: <span class="text-white">${dayCounts.filter(d => d.ok > 0).length}</span></div>
                </div>
            </div>
        </div>`;
    chartContainer.innerHTML = `<div class="grid grid-cols-1 xl:grid-cols-[3fr_1.1fr] gap-4">${dailyChart}${okSummary}</div>`;

    const today = new Date();
    const currentDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const scheduledCount = filtered.filter(e => e.date > currentDay && (e.date.getMonth() > today.getMonth() || e.date.getFullYear() > today.getFullYear())).length;
    const ongoingCount = filtered.filter(e => e.date >= currentDay && e.date.getMonth() === today.getMonth() && e.date.getFullYear() === today.getFullYear()).length;
    const completeCount = filtered.filter(e => e.date < currentDay).length;
    const onlineCount = okEvents.filter(x => x.onlineStatus.toLowerCase().includes('online')).length;
    const offlineCount = okEvents.filter(x => x.onlineStatus.toLowerCase().includes('offline')).length;
    const modeBrCount = okEvents.filter(x => /battle royale/i.test(x.mode) && !/clash squad/i.test(x.mode)).length;
    const modeCsCount = okEvents.filter(x => /clash squad/i.test(x.mode) && !/battle royale/i.test(x.mode)).length;
    const modeBothCount = okEvents.filter(x => /battle royale/i.test(x.mode) && /clash squad/i.test(x.mode)).length;

    if (statusScheduled) statusScheduled.innerText = scheduledCount;
    if (statusOngoing) statusOngoing.innerText = ongoingCount;
    if (statusComplete) statusComplete.innerText = completeCount;
    if (totalOk) totalOk.innerText = okEvents.length;
    if (totalEvents) totalEvents.innerText = filtered.length;
    const onlineCountEl = document.getElementById('analytics-online-count');
    const offlineCountEl = document.getElementById('analytics-offline-count');
    const modeBrEl = document.getElementById('analytics-mode-br');
    const modeCsEl = document.getElementById('analytics-mode-cs');
    const modeBothEl = document.getElementById('analytics-mode-both');
    if (onlineCountEl) onlineCountEl.innerText = onlineCount;
    if (offlineCountEl) offlineCountEl.innerText = offlineCount;
    if (modeBrEl) modeBrEl.innerText = modeBrCount;
    if (modeCsEl) modeCsEl.innerText = modeCsCount;
    if (modeBothEl) modeBothEl.innerText = modeBothCount;

    if (cityList) {
        const counts = okEvents.reduce((acc, curr) => {
            if (curr.eventType === 'Nobar') acc.nobar += 1;
            else if (curr.eventType === 'Turnamen') acc.turnamen += 1;
            else acc.other += 1;
            return acc;
        }, { nobar: 0, turnamen: 0, other: 0 });
        const total = counts.nobar + counts.turnamen + counts.other;
        cityList.innerHTML = total ? `
            <div class="grid gap-4">
                <div class="rounded-2xl border border-gray-800 bg-white/5 p-4">
                    <div class="flex justify-between text-[10px] uppercase text-gray-400 mb-2"><span>Total OK</span><span>${total}</span></div>
                    <div class="text-[11px] text-gray-300">${counts.nobar} Nobar • ${counts.turnamen} Turnamen${counts.other ? ` • ${counts.other} Lainnya` : ''}</div>
                </div>
                <div class="grid grid-cols-3 gap-3 text-center text-[11px] uppercase">
                    <div class="rounded-2xl border border-gray-800 bg-white/5 p-3">
                        <div class="text-gray-400 mb-1">Nobar</div>
                        <div class="text-2xl font-black-italic">${counts.nobar}</div>
                    </div>
                    <div class="rounded-2xl border border-gray-800 bg-white/5 p-3">
                        <div class="text-gray-400 mb-1">Turnamen</div>
                        <div class="text-2xl font-black-italic">${counts.turnamen}</div>
                    </div>
                    <div class="rounded-2xl border border-gray-800 bg-white/5 p-3">
                        <div class="text-gray-400 mb-1">OK</div>
                        <div class="text-2xl font-black-italic">${total}</div>
                    </div>
                </div>
            </div>` : `<p class="text-gray-400 text-[11px] italic">Belum ada data OK untuk bulan ini.</p>`;
    }
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
