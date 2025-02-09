const express = require('express');
const http = require('http');
const websocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new websocket.Server({ 
    server,
    perMessageDeflate: false // Render için WebSocket Proxy sorunu çözer
});

let waitingPlayers = [];
let games = [];

app.use(express.static(path.join(__dirname, 'public')));

wss.on('connection', (ws) => {
    waitingPlayers.push(ws);

    if (waitingPlayers.length >= 2)  {
        const player1 = waitingPlayers.shift();
        const player2 = waitingPlayers.shift();
        const game = {
            players: [player1, player2],
            board: Array(9).fill(null),
            currentPlayer: Math.random() < 0.5 ? player1 : player2,
            winner: null,
            gameover: false,
        };
        games.push(game);

        game.players.forEach(player => player.send(JSON.stringify({ type: 'start',
            currentPlayer: game.currentPlayer === player
        })));
    }
    
    ws.on('message', (message) =>  {
        const data = JSON.parse(message);
        const game = games.find(g => g.players.includes(ws));

        if (data.type === 'move' && game && !game.gameover) {
            if (game.currentPlayer === ws && game.board[data.index] === null) {
                game.board[data.index] = game.currentPlayer === game.players[0] ? 'X' : 'O';
                game.currentPlayer = game.currentPlayer === game.players[0] ? game.players[1] : game.players[0];
                game.players.forEach(player => player.send(JSON.stringify({ type: 'move', board: game.board,
                    currentPlayer: game.currentPlayer === player
                })));

                checkWinner(game);
            }
        } 
        else if (data.type === 'chat' && game) {
            // Sohbet mesajını diğer oyuncuya gönder
            game.players.forEach(player => {
                if (player !== ws) { // Mesajı sadece karşı tarafa gönder
                    player.send(JSON.stringify({ type: 'chat', message: data.message }));
                }
            });
        }
        else if (data.type === 'restart' && game) {
            game.board = Array(9).fill(null);
            game.currentPlayer = Math.random() < 0.5 ? game.players[0] : game.players[1];
            game.winner = null;
            game.gameover = false;
            game.players.forEach(player => player.send(JSON.stringify({ type: 'restart',
                currentPlayer: game.currentPlayer === player
            })));
        }
    });

    ws.on('close', () => {
        const game = games.find(g => g.players.includes(ws));
        if (game) {
            const opponent = game.players.find(player => player !== ws);
            if (opponent) {
                opponent.send(JSON.stringify({ type: 'disconnect' }));
            }
            games = games.filter(g => g !== game);
        }
        waitingPlayers = waitingPlayers.filter(player => player !== ws);
    });
});

function checkWinner(game) {
    const winningCombinations = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6],
    ];

    for (let combination of winningCombinations) {
        const [a, b, c] = combination;
        if (game.board[a] && game.board[a] === game.board[b] && game.board[a] === game.board[c]) {
            game.winner = game.board[a];
            game.gameover = true;
            game.players.forEach(player => player.send(JSON.stringify({ type: 'win', winner: game.winner })));
            return;
        }
    }

    if (game.board.every(cell => cell !== null)) {
        game.gameover = true;
        game.players.forEach(player => player.send(JSON.stringify({ type: 'draw' })));
    }
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda çalışıyor`);
});
