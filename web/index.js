module.exports = {
  render: () => {
    return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Plateau d'Échecs avec Règles Complètes</title>
    <style>
        body {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background-color: #f0f0f0;
        }
        canvas {
            border: 2px solid #333;
        }
    </style>
</head>
<body>
    <canvas id="chessboard" width="480" height="480"></canvas>
    <script>
        const canvas = document.getElementById('chessboard');
        const ctx = canvas.getContext('2d');
        const size = 480;
        const squareSize = size / 8;

        // Définition des images SVG pour les pièces
        const pieceImages = {
            'wP': 'http://localhost:80/imgs/PW.svg', // Pion blanc
            'wR': 'http://localhost:80/imgs/RW.svg', // Tour blanche
            'wN': 'http://localhost:80/imgs/KW.svg', // Cavalier blanc
            'wB': 'http://localhost:80/imgs/BW.svg', // Fou blanc
            'wQ': 'http://localhost:80/imgs/QW.svg', // Dame blanche
            'wK': 'http://localhost:80/imgs/KW2.svg', // Roi blanc
            'bP': 'http://localhost:80/imgs/PR.svg', // Pion noir
            'bR': 'http://localhost:80/imgs/BR.svg', // Tour noire
            'bN': 'http://localhost:80/imgs/KB.svg', // Cavalier noir
            'bB': 'http://localhost:80/imgs/BB.svg', // Fou noir
            'bQ': 'http://localhost:80/imgs/BQ.svg', // Dame noire
            'bK': 'http://localhost:80/imgs/KB2.svg'  // Roi noir
        };

        // Précharger les images
        const pieces = {};
        for (let piece in pieceImages) {
            pieces[piece] = new Image();
            pieces[piece].src = pieceImages[piece];
        }

        // Position initiale des pièces
        let board = [
            ['bR', 'bN', 'bB', 'bQ', 'bK', 'bB', 'bN', 'bR'],
            ['bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP'],
            ['', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', ''],
            ['wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP'],
            ['wR', 'wN', 'wB', 'wQ', 'wK', 'wB', 'wN', 'wR']
        ];

        // Variables pour gérer le jeu
        let currentPlayer = 'w'; // 'w' pour blancs, 'b' pour noirs
        let selectedPiece = null;
        let selectedRow = -1;
        let selectedCol = -1;
        let offsetX = 0;
        let offsetY = 0;
        let isDragging = false;
        let gameState = ''; // 'check', 'checkmate', ou vide
        let castlingAvailability = {
            'w': { kingMoved: false, kingSideRookMoved: false, queenSideRookMoved: false },
            'b': { kingMoved: false, kingSideRookMoved: false, queenSideRookMoved: false }
        };

        // Fonction pour vérifier si une case est vide ou contient une pièce adverse
        function isValidTarget(row, col, pieceColor) {
            if (row < 0 || row >= 8 || col < 0 || col >= 8) return false;
            const targetPiece = board[row][col];
            if (targetPiece === '') return true;
            const targetColor = targetPiece[0];
            return targetColor !== pieceColor;
        }

        // Fonction pour vérifier si le chemin est dégagé
        function isPathClear(startRow, startCol, endRow, endCol, boardState = board) {
            const rowStep = endRow === startRow ? 0 : (endRow > startRow ? 1 : -1);
            const colStep = endCol === startCol ? 0 : (endCol > startCol ? 1 : -1);
            let row = startRow + rowStep;
            let col = startCol + colStep;
            while (row !== endRow || col !== endCol) {
                if (row < 0 || row >= 8 || col < 0 || col >= 8 || boardState[row][col] !== '') {
                    return false;
                }
                row += rowStep;
                col += colStep;
            }
            return true;
        }

        // Fonction pour valider le déplacement selon les règles des échecs
        function isValidMove(piece, startRow, startCol, endRow, endCol, checkCastling = true, boardState = board) {
            const pieceType = piece[1];
            const pieceColor = piece[0];
            const rowDiff = endRow - startRow;
            const colDiff = endCol - startCol;
            const absRowDiff = Math.abs(rowDiff);
            const absColDiff = Math.abs(colDiff);

            if (startRow === endRow && startCol === endCol) return false;
            if (!isValidTarget(endRow, endCol, pieceColor)) return false;

            switch (pieceType) {
                case 'P': // Pion
                    const direction = pieceColor === 'w' ? -1 : 1;
                    const startRowForColor = pieceColor === 'w' ? 6 : 1;
                    if (colDiff === 0 && rowDiff === direction && boardState[endRow][endCol] === '') {
                        return true;
                    }
                    if (colDiff === 0 && startRow === startRowForColor && rowDiff === 2 * direction &&
                        boardState[endRow][endCol] === '' && boardState[startRow + direction][startCol] === '') {
                        return true;
                    }
                    if (absColDiff === 1 && rowDiff === direction && boardState[endRow][endCol] !== '') {
                        return true;
                    }
                    return false;

                case 'R': // Tour
                    if (rowDiff === 0 || colDiff === 0) {
                        return isPathClear(startRow, startCol, endRow, endCol, boardState);
                    }
                    return false;

                case 'N': // Cavalier
                    return (absRowDiff === 2 && absColDiff === 1) || (absRowDiff === 1 && absColDiff === 2);

                case 'B': // Fou
                    if (absRowDiff === absColDiff) {
                        return isPathClear(startRow, startCol, endRow, endCol, boardState);
                    }
                    return false;

                case 'Q': // Dame
                    if (rowDiff === 0 || colDiff === 0 || absRowDiff === absColDiff) {
                        return isPathClear(startRow, startCol, endRow, endCol, boardState);
                    }
                    return false;

                case 'K': // Roi
                    if (absRowDiff <= 1 && absColDiff <= 1) {
                        return true;
                    }
                    if (checkCastling && rowDiff === 0 && absColDiff === 2 && !isKingInCheck(pieceColor, boardState)) {
                        const isKingSide = colDiff === 2;
                        const rookCol = isKingSide ? 7 : 0;
                        const rook = boardState[startRow][rookCol];
                        if (rook !== (pieceColor + 'R')) return false;
                        if (pieceColor === 'w' && (castlingAvailability.w.kingMoved || (isKingSide ? castlingAvailability.w.kingSideRookMoved : castlingAvailability.w.queenSideRookMoved))) return false;
                        if (pieceColor === 'b' && (castlingAvailability.b.kingMoved || (isKingSide ? castlingAvailability.b.kingSideRookMoved : castlingAvailability.b.queenSideRookMoved))) return false;
                        const colStep = isKingSide ? 1 : -1;
                        for (let col = startCol + colStep; col !== rookCol; col += colStep) {
                            if (boardState[startRow][col] !== '' || isSquareUnderAttack(pieceColor, startRow, col, boardState)) return false;
                        }
                        return true;
                    }
                    return false;

                default:
                    return false;
            }
        }

        // Vérifier si une case est attaquée par l'adversaire
        function isSquareUnderAttack(color, row, col, boardState = board) {
            const opponentColor = color === 'w' ? 'b' : 'w';
            for (let r = 0; r < 8; r++) {
                for (let c = 0; c < 8; c++) {
                    const piece = boardState[r][c];
                    if (piece && piece[0] === opponentColor) {
                        if (isValidMove(piece, r, c, row, col, false, boardState)) {
                            return true;
                        }
                    }
                }
            }
            return false;
        }

        // Trouver la position du roi
        function findKing(color, boardState = board) {
            const kingPiece = color + 'K';
            for (let r = 0; r < 8; r++) {
                for (let c = 0; c < 8; c++) {
                    if (boardState[r][c] === kingPiece) {
                        return { row: r, col: c };
                    }
                }
            }
            return null;
        }

        // Vérifier si le roi est en échec
        function isKingInCheck(color, boardState = board) {
            const kingPos = findKing(color, boardState);
            if (!kingPos) return false;
            const inCheck = isSquareUnderAttack(color, kingPos.row, kingPos.col, boardState);
            if (inCheck && boardState === board) {
                console.log(\`\${color === 'w' ? 'Blancs' : 'Noirs'} en échec !\`);
            }
            return inCheck;
        }

        // Vérifier si un mouvement résout l'échec
        function doesMoveResolveCheck(piece, startRow, startCol, endRow, endCol) {
            const pieceColor = piece[0];
            const originalPiece = board[startRow][startCol];
            const targetPiece = board[endRow][endCol];
            const isCastling = piece[1] === 'K' && Math.abs(endCol - startCol) === 2;
            // Simuler le mouvement
            board[startRow][startCol] = '';
            board[endRow][endCol] = originalPiece;
            if (isCastling) {
                executeCastling(startRow, startCol, endRow, endCol);
            }
            const stillInCheck = isKingInCheck(pieceColor);
            // Annuler le mouvement
            board[startRow][startCol] = originalPiece;
            board[endRow][endCol] = targetPiece;
            if (isCastling) {
                const isKingSide = endCol - startCol === 2;
                const rookCol = isKingSide ? 7 : 0;
                const rookNewCol = isKingSide ? 5 : 3;
                board[startRow][rookCol] = pieceColor + 'R';
                board[startRow][rookNewCol] = '';
            }
            return !stillInCheck;
        }

        // Vérifier si une pièce est clouée
        function isPiecePinned(piece, startRow, startCol) {
            const pieceColor = piece[0];
            if (piece[1] === 'K') return false; // Le roi ne peut pas être cloué
            // Simuler le retrait de la pièce
            const originalPiece = board[startRow][startCol];
            board[startRow][startCol] = '';
            const isPinned = isKingInCheck(pieceColor);
            board[startRow][startCol] = originalPiece;
            if (isPinned) {
                console.log(\`Pièce \${piece} en (\${startRow}, \${startCol}) est clouée\`);
            }
            return isPinned;
        }

        // Vérifier si le joueur est en échec et mat
        function isCheckmate(color) {
            if (!isKingInCheck(color)) return false;
            for (let r = 0; r < 8; r++) {
                for (let c = 0; c < 8; c++) {
                    const piece = board[r][c];
                    if (piece && piece[0] === color) {
                        for (let newRow = 0; newRow < 8; newRow++) {
                            for (let newCol = 0; newCol < 8; newCol++) {
                                if (isValidMove(piece, r, c, newRow, newCol) && doesMoveResolveCheck(piece, r, c, newRow, newCol)) {
                                    return false;
                                }
                            }
                        }
                    }
                }
            }
            console.log(\`Échec et mat pour \${color === 'w' ? 'Blancs' : 'Noirs'}\`);
            return true;
        }

        // Gérer la promotion des pions
        function handlePawnPromotion(piece, row, col) {
            if (piece[1] === 'P' && (row === 0 || row === 7)) {
                const promotionOptions = ['Q', 'R', 'N', 'B'];
                let choice = prompt('Promouvoir en (Q, R, N, B) :').toUpperCase();
                if (!promotionOptions.includes(choice)) choice = 'Q';
                return piece[0] + choice;
            }
            return piece;
        }

        // Exécuter le roque
        function executeCastling(startRow, startCol, endRow, endCol) {
            const colDiff = endCol - startCol;
            const isKingSide = colDiff === 2;
            const rookCol = isKingSide ? 7 : 0;
            const rookNewCol = isKingSide ? 5 : 3;
            board[startRow][rookNewCol] = board[startRow][rookCol];
            board[startRow][rookCol] = '';
        }

        // Fonction pour dessiner le plateau
        function drawChessboard() {
            // Dessiner les cases
            for (let row = 0; row < 8; row++) {
                for (let col = 0; col < 8; col++) {
                    ctx.fillStyle = (row + col) % 2 === 0 ? '#ffffff' : '#769656';
                    ctx.fillRect(col * squareSize, row * squareSize, squareSize, squareSize);
                }
            }

            // Dessiner les bordures
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.strokeRect(0, 0, size, size);

            // Ajouter les coordonnées
            ctx.fillStyle = '#000000';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
            for (let col = 0; col < 8; col++) {
                ctx.fillText(letters[col], col * squareSize + squareSize / 2, 10);
                ctx.fillText(letters[col], col * squareSize + squareSize / 2, size - 10);
            }
            for (let row = 0; row < 8; row++) {
                const rank = 8 - row;
                ctx.fillText(rank, 10, row * squareSize + squareSize / 2);
                ctx.fillText(rank, size - 10, row * squareSize + squareSize / 2);
            }

            // Dessiner les pièces
            for (let row = 0; row < 8; row++) {
                for (let col = 0; col < 8; col++) {
                    const piece = board[row][col];
                    if (piece && pieces[piece].complete && !(isDragging && row === selectedRow && col === selectedCol)) {
                        ctx.drawImage(pieces[piece], col * squareSize, row * squareSize, squareSize, squareSize);
                    }
                }
            }

            // Dessiner la pièce en cours de déplacement
            if (isDragging && selectedPiece && pieces[selectedPiece].complete) {
                ctx.drawImage(pieces[selectedPiece], offsetX - squareSize / 2, offsetY - squareSize / 2, squareSize, squareSize);
            }

            // Afficher l'état du jeu
            ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
            ctx.font = '24px Arial';
            ctx.textAlign = 'center';
            if (gameState === 'check') {
                ctx.fillText(\`Échec (\${currentPlayer === 'w' ? 'Blancs' : 'Noirs'})\`, size / 2, size / 2);
            } else if (gameState === 'checkmate') {
                ctx.fillText(\`Échec et mat (\${currentPlayer === 'w' ? 'Blancs' : 'Noirs'})\`, size / 2, size / 2);
            }
        }

        // Fonction pour obtenir la position de la souris
        function getMousePos(event) {
            const rect = canvas.getBoundingClientRect();
            return {
                x: event.clientX - rect.left,
                y: event.clientY - rect.top
            };
        }

        // Gestion du clic pour sélectionner une pièce
        canvas.addEventListener('mousedown', (event) => {
            if (gameState === 'checkmate') return;
            const pos = getMousePos(event);
            const col = Math.floor(pos.x / squareSize);
            const row = Math.floor(pos.y / squareSize);
            if (row >= 0 && row < 8 && col >= 0 && col < 8 && board[row][col] !== '' && board[row][col][0] === currentPlayer) {
                const piece = board[row][col];
                if (isPiecePinned(piece, row, col)) {
                    console.log(\`Impossible de sélectionner \${piece} : pièce clouée\`);
                    return;
                }
                selectedPiece = piece;
                selectedRow = row;
                selectedCol = col;
                offsetX = pos.x;
                offsetY = pos.y;
                isDragging = true;
            }
        });

        // Gestion du déplacement de la souris
        canvas.addEventListener('mousemove', (event) => {
            if (isDragging) {
                const pos = getMousePos(event);
                offsetX = pos.x;
                offsetY = pos.y;
                drawChessboard();
            }
        });

        // Gestion du relâchement de la souris
        canvas.addEventListener('mouseup', (event) => {
            if (isDragging) {
                const pos = getMousePos(event);
                const newCol = Math.floor(pos.x / squareSize);
                const newRow = Math.floor(pos.y / squareSize);
                let moveMade = false;
                if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                    if (isValidMove(selectedPiece, selectedRow, selectedCol, newRow, newCol)) {
                        const inCheck = isKingInCheck(currentPlayer);
                        if (!inCheck || doesMoveResolveCheck(selectedPiece, selectedRow, selectedCol, newRow, newCol)) {
                            const isCastling = selectedPiece[1] === 'K' && Math.abs(newCol - selectedCol) === 2;
                            // Effectuer le mouvement
                            const originalPiece = board[selectedRow][selectedCol];
                            const targetPiece = board[newRow][newCol];
                            board[selectedRow][selectedCol] = '';
                            board[newRow][newCol] = originalPiece;
                            if (isCastling) {
                                executeCastling(selectedRow, selectedCol, newRow, newCol);
                            }
                            // Gérer la promotion
                            board[newRow][newCol] = handlePawnPromotion(originalPiece, newRow, newCol);
                            // Mettre à jour la disponibilité du roque
                            if (selectedPiece[1] === 'K') castlingAvailability[currentPlayer].kingMoved = true;
                            if (selectedPiece[1] === 'R') {
                                if (selectedCol === 7) castlingAvailability[currentPlayer].kingSideRookMoved = true;
                                if (selectedCol === 0) castlingAvailability[currentPlayer].queenSideRookMoved = true;
                            }
                            // Changer de joueur
                            currentPlayer = currentPlayer === 'w' ? 'b' : 'w';
                            // Vérifier l'échec ou échec et mat
                            gameState = isCheckmate(currentPlayer) ? 'checkmate' : isKingInCheck(currentPlayer) ? 'check' : '';
                            moveMade = true;
                        } else {
                            console.log(\`Mouvement \${selectedPiece} de (\${selectedRow}, \${selectedCol}) à (\${newRow}, \${newCol}) refusé : ne résout pas l'échec\`);
                        }
                        // Annuler le mouvement si invalide
                        if (!moveMade) {
                            board[selectedRow][selectedCol] = selectedPiece;
                            board[newRow][newCol] = targetPiece;
                        }
                    } else {
                        console.log(\`Mouvement \${selectedPiece} de (\${selectedRow}, \${selectedCol}) à (\${newRow}, \${newCol}) invalide selon les règles\`);
                    }
                }
                isDragging = false;
                selectedPiece = null;
                selectedRow = -1;
                selectedCol = -1;
                drawChessboard();
            }
        });

        // Gestion du cas où la souris quitte le canvas
        canvas.addEventListener('mouseout', () => {
            if (isDragging) {
                isDragging = false;
                selectedPiece = null;
                selectedRow = -1;
                selectedCol = -1;
                drawChessboard();
            }
        });

        // Attendre que toutes les images soient chargées avant de dessiner
        let loadedImages = 0;
        for (let piece in pieces) {
            pieces[piece].onload = () => {
                loadedImages++;
                if (loadedImages === Object.keys(pieces).length) {
                    drawChessboard();
                    // Vérifier l'état initial
                    if (isKingInCheck(currentPlayer)) {
                        gameState = isCheckmate(currentPlayer) ? 'checkmate' : 'check';
                        drawChessboard();
                    }
                }
            };
            pieces[piece].onerror = () => {
                console.log('Erreur de chargement pour ' + piece);
                loadedImages++;
                if (loadedImages === Object.keys(pieces).length) {
                    drawChessboard();
                    if (isKingInCheck(currentPlayer)) {
                        gameState = isCheckmate(currentPlayer) ? 'checkmate' : 'check';
                        drawChessboard();
                    }
                }
            };
        }
    </script>
</body>
</html>
    `;
  }
};