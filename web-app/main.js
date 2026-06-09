import {createGame, getLegalMoves, movePiece, switchTurn} from "./tafl.js";

let game = createGame();
let onCellClick = null;

/**
 * Returns the SVG file path for a given terrain type.
 * @param {string} terrain - The terrain type of the cell
 * @returns {string} Path to the SVG file
 */
function getTerrainSVG(terrain) {
    if (terrain === "corner") {
        return "assets/cell-corner.svg";
    }
    if (terrain === "throne") {
        return "assets/cell-throne.svg";
    }
    if (terrain === "black") {
        return "assets/cell-black.svg";
    }
    if (terrain === "white") {
        return "assets/cell-white.svg";
    }
    if (terrain === "white-diagonal") {
        return "assets/cell-white-diagonal.svg";
    }
    return "assets/cell-normal.svg";
}

/**
 * Returns the SVG file path for a given piece type.
 * @param {string} piece - The piece type
 * @returns {string} Path to the SVG file
 */
function getPieceSVG(piece) {
    if (piece === "black") {
        return "assets/piece-black.svg";
    }
    if (piece === "white") {
        return "assets/piece-white.svg";
    }
    if (piece === "king") {
        return "assets/piece-king.svg";
    }
    return "";
}

/**
 * Returns the rotation in degrees for a terrain cell based on its position.
 * @param {string} terrain - The terrain type of the cell
 * @param {number} row - Row index (0-10)
 * @param {number} col - Column index (0-10)
 * @returns {number} Rotation in degrees
 */
function getRotation(terrain, row, col) {
    if (terrain === "black") {
        if (row === 0 || row === 1) {
            return 180;
        }
        if (row === 9 || row === 10) {
            return 0;
        }
        if (col === 0 || col === 1) {
            return 90;
        }
        if (col === 9 || col === 10) {
            return 270;
        }
    }
    if (terrain === "white") {
        if (row === 3 || row === 4) {
            return 0;
        }
        if (row === 6 || row === 7) {
            return 180;
        }
        if (col === 3 || col === 4) {
            return 270;
        }
        if (col === 6 || col === 7) {
            return 90;
        }
    }
    if (terrain === "white-diagonal") {
        if (row === 4 && col === 4) {
            return 0;
        }
        if (row === 4 && col === 6) {
            return 90;
        }
        if (row === 6 && col === 4) {
            return 270;
        }
        if (row === 6 && col === 6) {
            return 180;
        }
    }
    return 0;
}

/**
 * Updates the info board with current game state.
 */
function updateInfoBoard() {
    const turnElement = document.getElementById("info-turn");
    const selectedElement = document.getElementById("info-selected");
    const historyElement = document.getElementById("info-history");
    const isBlackTurn = game.turn === "black";
    document.body.style.backgroundColor = (
        isBlackTurn
        ? "#2C2C2C"
        : "#FFF8F1"
    );
    turnElement.textContent = "Turn: " + game.turn;

    if (game.selected !== null) {
        const row = game.selected.row;
        const col = game.selected.col;
        const piece = game.board[row][col].piece;
        selectedElement.textContent = (
            "Selected: " + piece + " at [" + row + ", " + col + "]"
        );
    } else {
        selectedElement.textContent = "Selected: none";
    }

    if (game.history.length > 0) {
        const last = game.history[game.history.length - 1];
        historyElement.textContent = (
            "Last move: " + last.piece
            + " [" + last.from.row + "," + last.from.col + "]"
            + " to [" + last.to.row + "," + last.to.col + "]"
        );
    } else {
        historyElement.textContent = "Last move: none";
    }

    // Update label colours to stay visible
    const labelColour = isBlackTurn ? "#F5F0E8" : "#242424";
    document.querySelectorAll(".board-label").forEach(function (label) {
        label.style.color = labelColour;
    });
}

/**
 * Handles a click on a cell, updating the selected piece in game state.
 * @param {object} cell - The cell object
 * @param {number} rowIndex - Row index of the cell
 * @param {number} colIndex - Column index of the cell
 */
function handleCellClick(cell, rowIndex, colIndex) {

    // If a piece is selected and this is a legal move, execute it
    const isLegalMove = game.legalMoves.some(
        function (move) {
            return move[0] === rowIndex && move[1] === colIndex;
        }
    );

    if (game.selected !== null && isLegalMove) {
        const fromRow = game.selected.row;
        const fromCol = game.selected.col;
        const piece = game.board[fromRow][fromCol].piece;

        game.board = movePiece(
            game.board,
            fromRow,
            fromCol,
            rowIndex,
            colIndex
        );
        game.history.push({
            piece,
            from: {row: fromRow, col: fromCol},
            to: {row: rowIndex, col: colIndex}
        });
        game.turn = switchTurn(game.turn);
        game.selected = null;
        game.legalMoves = [];
        return;
    }

    if (cell.piece !== null) {

        // Only allow selecting pieces belonging to the current turn
        const isWhitePiece = (
            cell.piece === "white" || cell.piece === "king"
        );
        if (game.turn === "white" && !isWhitePiece) { return; }
        if (game.turn === "black" && cell.piece !== "black") { return; }

        if (
            game.selected !== null
            && game.selected.row === rowIndex
            && game.selected.col === colIndex
        ) {
            game.selected = null;
            game.legalMoves = [];
        } else {
            game.selected = {row: rowIndex, col: colIndex};
            game.legalMoves = getLegalMoves(
                game.board,
                rowIndex,
                colIndex
            );
        }
    } else {
        game.selected = null;
        game.legalMoves = [];
    }
}

/**
 * Renders the board into the #board element.
 * @param {Array} board - 11x11 array of cell objects
 */
function renderBoard(board) {
    const boardElement = document.getElementById("board");
    board.forEach(function (row, rowIndex) {
        row.forEach(function (cell, colIndex) {

            // Create a div for the cell and an img for the terrain
            const cellElement = document.createElement("div");
            const img = document.createElement("img");

            // Set the correct svg and rotation for this cells terrain
            img.src = getTerrainSVG(cell.terrain);
            img.style.transform = `rotate(${getRotation(
                cell.terrain,
                rowIndex,
                colIndex
            )}deg)`;
            img.alt = cell.terrain;

            // Accessibility attributes
            cellElement.setAttribute("tabindex", "0");
            cellElement.setAttribute("role", "button");
            cellElement.setAttribute(
                "aria-label",
                "row " + rowIndex + " column " + colIndex
                + (cell.piece !== null ? " " + cell.piece : "")
            );

            // Add click handler — updates state then re-renders via callback
            cellElement.addEventListener("click", function () {
                handleCellClick(cell, rowIndex, colIndex);
                if (onCellClick !== null) {
                    onCellClick();
                }
            });

            // Add keyboard handler for Enter and Space
            cellElement.addEventListener("keydown", function (event) {
                if (event.key === "Enter" || event.key === " ") {
                    handleCellClick(cell, rowIndex, colIndex);
                    if (onCellClick !== null) {
                        onCellClick();
                    }
                }
            });

            cellElement.classList.add("cell");
            cellElement.appendChild(img);

            // If a piece occupies this cell, add a piece image on top
            if (cell.piece !== null) {
                const pieceImg = document.createElement("img");
                pieceImg.src = getPieceSVG(cell.piece);
                pieceImg.alt = cell.piece;
                pieceImg.classList.add("piece");
                cellElement.appendChild(pieceImg);

                // Add highlight ring if this cell is selected
                if (
                    game.selected !== null
                    && game.selected.row === rowIndex
                    && game.selected.col === colIndex
                ) {
                    const highlightImg = document.createElement("img");
                    highlightImg.src = "assets/piece-highlight.svg";
                    highlightImg.alt = "selected";
                    highlightImg.classList.add("highlight");
                    cellElement.appendChild(highlightImg);
                }
            }

            // If this cell is a legal move, add a move highlight
            const isLegalMove = game.legalMoves.some(
                function (move) {
                    return move[0] === rowIndex && move[1] === colIndex;
                }
            );
            if (isLegalMove) {
                const moveHighlight = document.createElement("img");
                moveHighlight.src = "assets/cell-highlight.svg";
                moveHighlight.alt = "legal move";
                moveHighlight.classList.add("move-highlight");
                cellElement.appendChild(moveHighlight);
            }

            boardElement.appendChild(cellElement);
        });
    });
}

/**
 * Renders row and column index labels around the board.
 */
function renderLabels() {
    const rowLabels = document.getElementById("row-labels");
    const colLabels = document.getElementById("col-labels");

    // Create a label for each row and column index (0 to 10)
    let i = 0;
    while (i < 11) {

        // Row label on the left
        const rowLabel = document.createElement("div");
        rowLabel.textContent = i;
        rowLabel.classList.add("row-label", "board-label");
        rowLabels.appendChild(rowLabel);

        // Column label underneath
        const colLabel = document.createElement("div");
        colLabel.textContent = i;
        colLabel.classList.add("col-label", "board-label");
        colLabels.appendChild(colLabel);

        i += 1;
    }
}

/**
 * Clears and re-renders the board and info panel.
 */
function render() {
    const boardElement = document.getElementById("board");
    boardElement.innerHTML = "";
    renderBoard(game.board);
    updateInfoBoard();
}

// Assign render as the callback for cell clicks
onCellClick = render;

render();
renderLabels();
window.game = game;