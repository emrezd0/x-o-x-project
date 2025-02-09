const searchButton = document.getElementById('search-button');
const board = document.getElementById('board');
const message = document.getElementById('message');
const turnMessage = document.getElementById('turn-message');
const restartButton = document.getElementById('restart-button');
const chatInput = document.getElementById('chat-input');
const chatButton = document.getElementById('chat-button');
const chatMessages = document.getElementById('chat-messages');
const cells = document.querySelectorAll('.cell'); 

let ws;
let currentPlayer = null;
let gameover = false;

searchButton.addEventListener('click', () => {
    if (ws && ws.readyState === WebSocket.OPEN) return;

    ws = new WebSocket('wss://x-o-x-project.onrender.com');

    ws.onopen = () => {
        console.log('WebSocket bağlantısı kuruldu.');
        board.style.display = 'none';
        searchButton.style.display = 'none';
    };

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === 'start') {
            currentPlayer = data.currentPlayer;
            turnMessage.textContent = currentPlayer ? 'Your turn' : 'Opponent\'s turn';
            board.style.display = 'grid';
            restartButton.style.display = 'inline-block';
        } else if (data.type === 'move') {
            updateBoard(data.board);
            currentPlayer = data.currentPlayer;
            turnMessage.textContent = currentPlayer ? 'Your turn' : 'Opponent\'s turn';
        } else if (data.type === 'chat') {
            // Sohbet mesajlarını ekrana yazdır
            const msgElement = document.createElement('p');
            msgElement.textContent = `Opponent: ${data.message}`;
            chatMessages.appendChild(msgElement);
        }
    };

    ws.onclose = () => {
        message.textContent = 'Disconnected. Click "Player Search" to find a new opponent.';
        searchButton.style.display = 'inline-block';
    };
});

// Sohbet gönderme işlevi
chatButton.addEventListener('click', () => {
    const msg = chatInput.value.trim();
    if (msg && ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'chat', message: msg }));
        
        // Mesajı kendi ekranına da ekle
        const msgElement = document.createElement('p');
        msgElement.textContent = `You: ${msg}`;
        chatMessages.appendChild(msgElement);

        chatInput.value = '';
    }
});
