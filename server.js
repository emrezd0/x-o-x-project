const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const path = require("path");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3001;

let waitingPlayers = [];
let games = [];

app.use(express.static(path.join(__dirname, "public")));

wss.on("connection", (ws) => {
    console.log("Yeni bir oyuncu bağlandı.");
    waitingPlayers.push(ws);

    if (waitingPlayers.length >= 2) {
        const player1 = waitingPlayers.shift();
        const player2 = waitingPlayers.shift();

        const game = {
            players: [player1, player2],
            board: Array(9).fill(null),
            currentPlayer: Math.random() < 0.5 ? player1 : player2,
            gameover: false,
        };
        games.push(game);

        game.players.forEach(player => player.send(JSON.stringify({
            type: "start",
            currentPlayer: game.currentPlayer === player
        })));
    }

    ws.on("message", (message) => {
        const data = JSON.parse(message);
        const game = games.find(g => g.players.includes(ws));

        if (!game || game.gameover) return;

        if (data.type === "move" && game.currentPlayer === ws && game.board[data.index] === null) {
            game.board[data.index] = game.currentPlayer === game.players[0] ? "X" : "O";
            game.currentPlayer = game.currentPlayer === game.players[0] ? game.players[1] : game.players[0];
            
            game.players.forEach(player => player.send(JSON.stringify({
                type: "move",
                board: game.board,
                currentPlayer: game.currentPlayer === player
            })));

            checkWinner(game);
        }
    });

    ws.on("close", () => {
        console.log("Bir oyuncu ayrıldı.");
        const game = games.find(g => g.players.includes(ws));
        if (game) {
            const opponent = game.players.find(player => player !== ws);
            if (opponent) {
                opponent.send(JSON.stringify({ type: "disconnect" }));
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
            game.gameover = true;
            game.players.forEach(player => player.send(JSON.stringify({
                type: "win",
                winner: game.board[a]
            })));
            return;
        }
    }

    if (game.board.every(cell => cell !== null)) {
        game.gameover = true;
        game.players.forEach(player => player.send(JSON.stringify({ type: "draw" }))); 
    }
}

server.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda çalışıyor.`);
});
