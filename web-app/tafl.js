const TERRAIN = Object.freeze({
    NORMAL: "normal",
    THRONE: "throne",
    CORNER: "corner",
    BLACK: "black",
    WHITE: "white",
    WHITE_DIAGONAL: "white-diagonal"
});

const PIECE = Object.freeze({
    EMPTY: null,
    BLACK: "black",
    WHITE: "white",
    KING: "king"
});

const CORNERS = [[0, 0], [0, 10], [10, 0], [10, 10]];
const THRONE = [5, 5];

const BLACK_START = [
    [0, 3], [0, 4], [0, 5], [0, 6], [0, 7], [1, 5],
    [10, 3], [10, 4], [10, 5], [10, 6], [10, 7], [9, 5],
    [3, 0], [4, 0], [5, 0], [6, 0], [7, 0], [5, 1],
    [3, 10], [4, 10], [5, 10], [6, 10], [7, 10], [5, 9]
];

const WHITE_START = [
    [3, 5], [4, 5], [6, 5], [7, 5],
    [5, 3], [5, 4], [5, 6], [5, 7]
];

const WHITE_DIAGONAL_START = [
    [4, 4], [4, 6], [6, 4], [6, 6]
];

/**
 * Creates a cell object representing a single square on the board.
 * @param {string} terrain - The permanent terrain type of the cell
 * @param {string|null} piece - The piece currently occupying the cell
 * @returns {{terrain: string, piece: string|null}}
 */
const makeCell = function (terrain, piece) {
    return {terrain, piece};
};

/**
 * Returns true if the given position is a corner square.
 * @param {number} row - Row index (0-10)
 * @param {number} col - Column index (0-10)
 * @returns {boolean}
 */
const isCorner = function (row, col) {
    return CORNERS.some(function (pos) {
        return pos[0] === row && pos[1] === col;
    });
};

/**
 * Returns true if the given position is the throne.
 * @param {number} row - Row index (0-10)
 * @param {number} col - Column index (0-10)
 * @returns {boolean}
 */
const isThrone = function (row, col) {
    return THRONE[0] === row && THRONE[1] === col;
};

/**
 * Returns true if the given position is a black terrain cell.
 * @param {number} row - Row index (0-10)
 * @param {number} col - Column index (0-10)
 * @returns {boolean}
 */
const isBlackStart = function (row, col) {
    return BLACK_START.some(function (pos) {
        return pos[0] === row && pos[1] === col;
    });
};

/**
 * Returns true if the given position is a straight white terrain cell.
 * @param {number} row - Row index (0-10)
 * @param {number} col - Column index (0-10)
 * @returns {boolean}
 */
const isWhiteStart = function (row, col) {
    return WHITE_START.some(function (pos) {
        return pos[0] === row && pos[1] === col;
    });
};

/**
 * Returns true if the given position is a diagonal white terrain cell.
 * @param {number} row - Row index (0-10)
 * @param {number} col - Column index (0-10)
 * @returns {boolean}
 */
const isWhiteDiagonalStart = function (row, col) {
    return WHITE_DIAGONAL_START.some(function (pos) {
        return pos[0] === row && pos[1] === col;
    });
};

/**
 * Returns all legal move positions for a piece at the given position.
 * @param {Array} board - 11x11 array of cell objects
 * @param {number} row - Row index of the piece (0-10)
 * @param {number} col - Column index of the piece (0-10)
 * @returns {Array} Array of [row, col] positions the piece can move to
 */
const getLegalMoves = function (board, row, col) {
    const piece = board[row][col].piece;
    const moves = [];
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];

    directions.forEach(function (dir) {
        let r = row + dir[0];
        let c = col + dir[1];

        while (r >= 0 && r <= 10 && c >= 0 && c <= 10) {

            // Stop if occupied
            if (board[r][c].piece !== null) {
                break;
            }

            const terrain = board[r][c].terrain;

            // Non-king pieces cannot land on corners
            if (terrain === TERRAIN.CORNER && piece !== PIECE.KING) {
                break;
            }

            // Non-king pieces can pass through throne but not land on it
            if (terrain !== TERRAIN.THRONE || piece === PIECE.KING) {
                moves.push([r, c]);
            }

            r += dir[0];
            c += dir[1];
        }
    });

    return moves;
};

/**
 * Creates the initial 11x11 board with all pieces in their starting positions.
 * @returns {Array<Array<{terrain: string, piece: string|null}>>}
 */
const createBoard = function () {
    // Create 11 rows
    return Array.from({length: 11}, function (ignore, row) {
        // For each, create 11 columns
        return Array.from({length: 11}, function (ignore, col) {

            // Define the terrain type for this cell
            const terrain = (
                isCorner(row, col)
                ? TERRAIN.CORNER
                : isThrone(row, col)
                ? TERRAIN.THRONE
                : isBlackStart(row, col)
                ? TERRAIN.BLACK
                : isWhiteDiagonalStart(row, col)
                ? TERRAIN.WHITE_DIAGONAL
                : isWhiteStart(row, col)
                ? TERRAIN.WHITE
                : TERRAIN.NORMAL
            );

            // Define which piece occupies this cell at game start
            const piece = (
                isThrone(row, col)
                ? PIECE.KING
                : isBlackStart(row, col)
                ? PIECE.BLACK
                : (
                    isWhiteStart(row, col)
                    || isWhiteDiagonalStart(row, col)
                )
                ? PIECE.WHITE
                : PIECE.EMPTY
            );

            return makeCell(terrain, piece);
        });
    });
};

/**
 * Creates the initial game state.
 * @returns {{board: Array, turn: string, history: Array, status: string}}
 */
const createGame = function () {
    return {
        board: createBoard(),
        turn: "black",
        history: [],
        status: "playing",
        selected: null,
        legalMoves: []
    };
};

/**
 * Moves a piece from one position to another, returning a new board.
 * @param {Array} board - 11x11 array of cell objects
 * @param {number} fromRow - Row index of the piece to move
 * @param {number} fromCol - Column index of the piece to move
 * @param {number} toRow - Row index of the destination
 * @param {number} toCol - Column index of the destination
 * @returns {Array} New 11x11 board with the piece moved
 */
const movePiece = function (board, fromRow, fromCol, toRow, toCol) {
    const piece = board[fromRow][fromCol].piece;
    return board.map(function (row, r) {
        return row.map(function (cell, c) {
            if (r === fromRow && c === fromCol) {
                return makeCell(cell.terrain, PIECE.EMPTY);
            }
            if (r === toRow && c === toCol) {
                return makeCell(cell.terrain, piece);
            }
            return cell;
        });
    });
};

/**
 * Returns the opposite turn.
 * @param {string} turn - The current turn ("black" or "white")
 * @returns {string} The next turn
 */
const switchTurn = function (turn) {
    return (
        turn === "black"
        ? "white"
        : "black"
    );
};

export {createGame, getLegalMoves, movePiece, switchTurn};