// =====================
// AUTH: Login, Logout, Session
// =====================

const sheetId = '1QIslj02Ck56I4yHZtmkk8RJeNZZOQFd6XLQFypV3CPk';
const gidAkun = '1447972257';

async function handleLoginDirect() {
    const email = document.getElementById('l-email').value.trim().toLowerCase();
    const pass = document.getElementById('l-pass').value.trim();

    const res = await fetch(`https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&tq&gid=${gidAkun}`);
    const text = await res.text();
    const rows = JSON.parse(text.substr(47).slice(0, -2)).table.rows;

    let userFound = null;
    for (let i = 0; i < rows.length; i++) {
        const c = rows[i].c;
        if (c[3] && c[3].v.toString().toLowerCase() === email && c[4] && c[4].v.toString() === pass) {
            userFound = { nama: c[0].v, email: c[3].v, role: c[6] ? c[6].v : 'Member' };
            break;
        }
    }

    if (userFound) {
        localStorage.setItem('userFF', JSON.stringify(userFound));
        location.reload();
    } else {
        alert("Email/Password Salah!");
    }
}

function logout() {
    localStorage.removeItem('userFF');
    location.reload();
}

function initAuthUI() {
    const user = JSON.parse(localStorage.getItem('userFF'));
    if (user) {
        document.getElementById('welcome-area').classList.remove('hidden');
        document.getElementById('user-display-name').innerText = user.nama;
        document.getElementById('btn-login-nav').classList.add('hidden');
        if (user.role === 'FFCA') {
            document.getElementById('dropdown-ffca').classList.remove('hidden');
            document.getElementById('btn-nav-chat').classList.remove('hidden');
            document.getElementById('btn-nav-point').classList.remove('hidden');
        }
    }
}
