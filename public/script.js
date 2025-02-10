const searchButton = document.getElementById('search-button');
const board = document.getElementById('board');
const message = document.getElementById('message');
const turnMessage = document.getElementById('turn-message');
const restartButton = document.getElementById('restart-button');
const cells = document.querySelectorAll('.cell'); 
const scoreX = document.getElementById('score-x');
const scoreO = document.getElementById('score-o');
const scoreboard = document.getElementById('scoreboard');

let ws;
let currentPlayer = null;
let gameover = false;
let scores = { X: 0, O: 0 };

function loadScores() {
    const savedScores = JSON.parse(localStorage.getItem("tic_tac_toe_scores")) || { X: 0, O: 0 };
    scores = savedScores;
    scoreX.textContent = scores.X;
    scoreO.textContent = scores.O;
}

function updateScore(winner) {
    if (winner === 'X') {
        scores.X++;
    } else if (winner === 'O') {
        scores.O++;
    }
    localStorage.setItem("tic_tac_toe_scores", JSON.stringify(scores));
    scoreX.textContent = scores.X;
    scoreO.textContent = scores.O;
}

function resetScores() {
    scores = { X: 0, O: 0 };
    localStorage.setItem("tic_tac_toe_scores", JSON.stringify(scores));
    scoreX.textContent = scores.X;
    scoreO.textContent = scores.O;
}

window.onload = loadScores;

searchButton.addEventListener('click', () => {
    if (ws && ws.readyState === WebSocket.OPEN) return;

    ws = new WebSocket('wss://x-o-x-project.onrender.com');

    ws.onopen = () => {
        board.style.display = 'grid';
        searchButton.style.display = 'none';
    };

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === 'start') {
            currentPlayer = data.currentPlayer;
            turnMessage.textContent = currentPlayer ? 'Your turn' : 'Opponent\'s turn';
            message.textContent = '';
            scoreboard.style.display = 'block';
        } else if (data.type === 'move') {
            updateBoard(data.board);
            currentPlayer = data.currentPlayer;
            turnMessage.textContent = currentPlayer ? 'Your turn' : 'Opponent\'s turn';
        } else if (data.type === 'win') {
            message.textContent = `Player ${data.winner} wins!`;
            gameover = true;
            updateScore(data.winner);
        } else if (data.type === 'draw') {
            message.textContent = 'It\'s a draw!';
            gameover = true;
        }
    };
});

function updateBoard(boardState) {
    cells.forEach((cell, index) => {
        cell.textContent = boardState[index] || '';
    });
}
