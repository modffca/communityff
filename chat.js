// =====================
// CHAT: Firebase Realtime
// =====================

function sendMessage() {
    const user = JSON.parse(localStorage.getItem('userFF'));
    const input = document.getElementById('chat-input');
    if (!input || !input.value.trim()) return;
    db.ref("messages").push().set({
        nama: user.nama,
        email: user.email,
        pesan: input.value,
        timestamp: Date.now()
    });
    input.value = "";
}

function initChat() {
    const user = JSON.parse(localStorage.getItem('userFF'));
    const chatBox = document.getElementById('chat-messages');
    if (!chatBox) return;
    chatBox.innerHTML = "";

    db.ref("messages").limitToLast(50).on("child_added", (snap) => {
        const data = snap.val();
        const isMe = user && data.email === user.email;
        const row = document.createElement("div");
        row.className = `chat-row ${isMe ? 'chat-right' : 'chat-left'}`;
        row.innerHTML = `<div class="chat-bubble shadow-lg">
            <p class="text-[9px] font-black uppercase italic ${isMe ? 'text-black' : 'accent-yellow'}">${data.nama}</p>
            <p class="text-sm font-medium leading-tight">${data.pesan}</p>
        </div>`;
        chatBox.appendChild(row);
        chatBox.scrollTop = chatBox.scrollHeight;
    });
}

function initChatInputUI() {
    const user = JSON.parse(localStorage.getItem('userFF'));
    const container = document.getElementById('chat-input-container');
    if (!container) return;

    if (user) {
        container.innerHTML = `<div class="flex gap-2">
            <input type="text" id="chat-input" class="flex-1 bg-[#1a1a1a] border border-gray-800 p-2 rounded-lg italic text-white text-sm outline-none">
            <button onclick="sendMessage()" class="bg-yellow-500 text-black px-6 rounded-lg font-black italic uppercase text-[10px]">Kirim</button>
        </div>`;
        initChat();
    } else {
        container.innerHTML = `<p class="text-center accent-yellow font-black italic text-[10px] uppercase">Login untuk Chat</p>`;
    }
}
