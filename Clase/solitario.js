/**
 * Solitario Klondike Clásico
 * Desarrollo Web en Entorno Cliente (DWEC)
 */

(function () {
    'use strict';

    // --- Definición de Constantes y Palos ---
    const SUITS = [
        { id: 'hearts', symbol: '♥', color: 'red', name: 'Corazones' },
        { id: 'diamonds', symbol: '♦', color: 'red', name: 'Diamantes' },
        { id: 'clubs', symbol: '♣', color: 'black', name: 'Tréboles' },
        { id: 'spades', symbol: '♠', color: 'black', name: 'Picas' }
    ];

    const RANKS = [
        { rank: 1, label: 'A', name: 'As' },
        { rank: 2, label: '2', name: '2' },
        { rank: 3, label: '3', name: '3' },
        { rank: 4, label: '4', name: '4' },
        { rank: 5, label: '5', name: '5' },
        { rank: 6, label: '6', name: '6' },
        { rank: 7, label: '7', name: '7' },
        { rank: 8, label: '8', name: '8' },
        { rank: 9, label: '9', name: '9' },
        { rank: 10, label: '10', name: '10' },
        { rank: 11, label: 'J', name: 'Jota' },
        { rank: 12, label: 'Q', name: 'Reina' },
        { rank: 13, label: 'K', name: 'Rey' }
    ];

    // --- Estado del Juego ---
    let state = {
        stock: [],
        waste: [],
        foundations: [[], [], [], []], // 0: hearts, 1: diamonds, 2: clubs, 3: spades
        tableau: [[], [], [], [], [], [], []], // 7 columnas
        moves: 0,
        score: 0,
        timeElapsed: 0,
        timerActive: false,
        gameWon: false
    };

    let historyStack = [];
    let initialDeckSnapshot = null;
    let timerInterval = null;
    let selectedItem = null; // { source: 'waste'|'tableau'|'foundation', colIndex, cardIndex }
    let draggedData = null; // Para Drag & Drop
    let isAutoCompleting = false;

    // Elementos del DOM
    const dom = {
        stock: document.getElementById('stock'),
        waste: document.getElementById('waste'),
        foundations: [
            document.getElementById('foundation-0'),
            document.getElementById('foundation-1'),
            document.getElementById('foundation-2'),
            document.getElementById('foundation-3')
        ],
        tableaus: [
            document.getElementById('tableau-0'),
            document.getElementById('tableau-1'),
            document.getElementById('tableau-2'),
            document.getElementById('tableau-3'),
            document.getElementById('tableau-4'),
            document.getElementById('tableau-5'),
            document.getElementById('tableau-6')
        ],
        statTime: document.getElementById('stat-time'),
        statMoves: document.getElementById('stat-moves'),
        statScore: document.getElementById('stat-score'),
        btnUndo: document.getElementById('btn-undo'),
        btnRestart: document.getElementById('btn-restart'),
        btnNewGame: document.getElementById('btn-new-game'),
        btnWinNewGame: document.getElementById('btn-win-new-game'),
        winModal: document.getElementById('win-modal'),
        winTime: document.getElementById('win-time'),
        winMoves: document.getElementById('win-moves'),
        winScore: document.getElementById('win-score'),
        autocompleteBanner: document.getElementById('autocomplete-banner'),
        toast: document.getElementById('toast')
    };

    // --- Creación y Barajado de Cartas ---
    function createDeck() {
        const deck = [];
        let idCounter = 1;

        for (const suit of SUITS) {
            for (const rankInfo of RANKS) {
                deck.push({
                    id: `card-${idCounter++}`,
                    suit: suit.id,
                    suitSymbol: suit.symbol,
                    color: suit.color,
                    rank: rankInfo.rank,
                    rankLabel: rankInfo.label,
                    faceUp: false
                });
            }
        }
        return deck;
    }

    // Barajado Fisher-Yates
    function shuffleDeck(deck) {
        const shuffled = [...deck];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    // --- Inicialización del Juego ---
    function initGame(deckToUse = null) {
        stopTimer();
        state.moves = 0;
        state.score = 0;
        state.timeElapsed = 0;
        state.timerActive = false;
        state.gameWon = false;
        historyStack = [];
        selectedItem = null;
        isAutoCompleting = false;

        dom.winModal.classList.remove('active');
        dom.autocompleteBanner.style.display = 'none';
        updateStats();

        // Si se pasa deckToUse (Reiniciar), usar copia; sino barajar nuevo
        const deck = deckToUse ? JSON.parse(JSON.stringify(deckToUse)) : shuffleDeck(createDeck());
        if (!deckToUse) {
            initialDeckSnapshot = JSON.parse(JSON.stringify(deck));
        }

        // Reparto del Solitario Klondike
        state.foundations = [[], [], [], []];
        state.tableau = [[], [], [], [], [], [], []];
        state.waste = [];

        let cardIdx = 0;
        for (let col = 0; col < 7; col++) {
            for (let row = 0; row <= col; row++) {
                const card = deck[cardIdx++];
                // Solo la última carta de cada columna se descubre
                card.faceUp = (row === col);
                state.tableau[col].push(card);
            }
        }

        // Las cartas restantes van al mazo de robo (cubiertas)
        state.stock = deck.slice(cardIdx).map(card => {
            card.faceUp = false;
            return card;
        });

        render();
        updateUndoButton();
    }

    // --- Control del Cronómetro ---
    function startTimerIfNeeded() {
        if (!state.timerActive && !state.gameWon) {
            state.timerActive = true;
            timerInterval = setInterval(() => {
                state.timeElapsed++;
                updateStats();
            }, 1000);
        }
    }

    function stopTimer() {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        state.timerActive = false;
    }

    function formatTime(seconds) {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    }

    function updateStats() {
        dom.statTime.textContent = formatTime(state.timeElapsed);
        dom.statMoves.textContent = state.moves;
        dom.statScore.textContent = state.score;
    }

    function showToast(msg) {
        dom.toast.textContent = msg;
        dom.toast.classList.add('show');
        clearTimeout(dom.toast._timer);
        dom.toast._timer = setTimeout(() => {
            dom.toast.classList.remove('show');
        }, 1800);
    }

    // --- Gestión del Historial (Deshacer / Undo) ---
    function saveStateForUndo() {
        const snapshot = {
            stock: JSON.parse(JSON.stringify(state.stock)),
            waste: JSON.parse(JSON.stringify(state.waste)),
            foundations: JSON.parse(JSON.stringify(state.foundations)),
            tableau: JSON.parse(JSON.stringify(state.tableau)),
            moves: state.moves,
            score: state.score
        };
        historyStack.push(snapshot);
        if (historyStack.length > 50) historyStack.shift();
        updateUndoButton();
    }

    function updateUndoButton() {
        dom.btnUndo.disabled = historyStack.length === 0;
    }

    function undo() {
        if (historyStack.length === 0) return;
        const previous = historyStack.pop();
        state.stock = previous.stock;
        state.waste = previous.waste;
        state.foundations = previous.foundations;
        state.tableau = previous.tableau;
        state.moves = previous.moves;
        state.score = previous.score;
        selectedItem = null;

        updateStats();
        updateUndoButton();
        render();
        showToast('↩ Movimiento deshecho');
    }

    // --- Validaciones de Movimiento ---
    function canMoveToFoundation(card, foundationIndex) {
        const foundation = state.foundations[foundationIndex];
        const expectedSuit = SUITS[foundationIndex].id;

        if (card.suit !== expectedSuit) return false;

        if (foundation.length === 0) {
            return card.rank === 1; // As
        } else {
            const topCard = foundation[foundation.length - 1];
            return card.rank === topCard.rank + 1;
        }
    }

    function canMoveToTableau(movingCard, colIndex) {
        const column = state.tableau[colIndex];
        if (column.length === 0) {
            return movingCard.rank === 13; // Solo el Rey en columnas vacías
        }
        const topCard = column[column.length - 1];
        if (!topCard.faceUp) return false;
        // Alternar colores y orden descendente
        return (movingCard.color !== topCard.color) && (movingCard.rank === topCard.rank - 1);
    }

    // Comprobar si una carta puede ir automáticamente a alguna fundación
    function findFoundationForCard(card) {
        for (let i = 0; i < 4; i++) {
            if (canMoveToFoundation(card, i)) {
                return i;
            }
        }
        return -1;
    }

    // Voltear la última carta descubierta en una columna si quedó boca abajo
    function checkAutoFlip(colIndex) {
        const column = state.tableau[colIndex];
        if (column.length > 0) {
            const top = column[column.length - 1];
            if (!top.faceUp) {
                top.faceUp = true;
                state.score += 5; // Puntos por descubrir carta
                return true;
            }
        }
        return false;
    }

    // --- Acciones del Jugador ---

    // 1. Clic en el Mazo (Stock)
    function onStockClick() {
        startTimerIfNeeded();
        saveStateForUndo();
        selectedItem = null;

        if (state.stock.length > 0) {
            // Robar carta del mazo al descarte
            const card = state.stock.pop();
            card.faceUp = true;
            state.waste.push(card);
            state.moves++;
        } else {
            // Reciclar descarte al mazo
            if (state.waste.length === 0) return;
            state.stock = state.waste.map(c => {
                c.faceUp = false;
                return c;
            }).reverse();
            state.waste = [];
            state.moves++;
            state.score = Math.max(0, state.score - 10);
            showToast('🔄 Mazo reciclado');
        }

        updateStats();
        render();
        checkGameState();
    }

    // 2. Mover cartas de origen a destino
    function executeMove(source, target) {
        startTimerIfNeeded();
        saveStateForUndo();

        let movingCards = [];

        // Extraer cartas de origen
        if (source.type === 'waste') {
            movingCards = [state.waste.pop()];
        } else if (source.type === 'foundation') {
            movingCards = [state.foundations[source.fIndex].pop()];
        } else if (source.type === 'tableau') {
            const col = state.tableau[source.colIndex];
            movingCards = col.splice(source.cardIndex);
        }

        // Añadir cartas a destino
        if (target.type === 'foundation') {
            state.foundations[target.fIndex].push(...movingCards);
            state.score += 10;
        } else if (target.type === 'tableau') {
            state.tableau[target.colIndex].push(...movingCards);
            if (source.type === 'waste') {
                state.score += 5;
            } else if (source.type === 'foundation') {
                state.score = Math.max(0, state.score - 15);
            }
        }

        // Si el origen era tableau, voltear la carta anterior si es necesario
        if (source.type === 'tableau') {
            checkAutoFlip(source.colIndex);
        }

        state.moves++;
        selectedItem = null;
        updateStats();
        render();
        checkGameState();
    }

    // 3. Auto-mover carta (Doble clic o clic derecho)
    function tryAutoMoveCard(card, sourceInfo) {
        const targetFoundation = findFoundationForCard(card);
        if (targetFoundation !== -1) {
            executeMove(sourceInfo, { type: 'foundation', fIndex: targetFoundation });
            return true;
        }

        // Si no va a fundación, ver si va a alguna columna del tablero
        for (let c = 0; c < 7; c++) {
            if (sourceInfo.type === 'tableau' && sourceInfo.colIndex === c) continue;
            if (canMoveToTableau(card, c)) {
                // Solo mover si no es un movimiento trivial rey a columna vacía sin liberar carta
                if (sourceInfo.type === 'tableau' && card.rank === 13 && state.tableau[sourceInfo.colIndex].length === 0) {
                    continue;
                }
                executeMove(sourceInfo, { type: 'tableau', colIndex: c });
                return true;
            }
        }

        return false;
    }

    // 4. Manejo de Clic y Selección
    function handleCardClick(card, sourceInfo) {
        if (!card.faceUp) return;

        // Si no hay nada seleccionado, seleccionar esta carta
        if (!selectedItem) {
            selectedItem = { ...sourceInfo, card };
            render();
            return;
        }

        // Si ya hay algo seleccionado
        // Caso A: clic en la misma carta -> deseleccionar
        if (selectedItem.card.id === card.id) {
            selectedItem = null;
            render();
            return;
        }

        // Caso B: intentar mover la carta seleccionada sobre esta carta
        if (sourceInfo.type === 'tableau') {
            const targetCol = sourceInfo.colIndex;
            const targetColumn = state.tableau[targetCol];
            const isTopCard = (targetColumn.length - 1 === sourceInfo.cardIndex);

            if (isTopCard && canMoveToTableau(selectedItem.card, targetCol)) {
                executeMove(selectedItem, { type: 'tableau', colIndex: targetCol });
                return;
            }
        } else if (sourceInfo.type === 'foundation') {
            if (canMoveToFoundation(selectedItem.card, sourceInfo.fIndex)) {
                executeMove(selectedItem, { type: 'foundation', fIndex: sourceInfo.fIndex });
                return;
            }
        }

        // Caso C: cambiar selección a la nueva carta si es una carta válida
        selectedItem = { ...sourceInfo, card };
        render();
    }

    // Clic en hueco vacío
    function handleEmptySlotClick(targetInfo) {
        if (!selectedItem) return;

        if (targetInfo.type === 'tableau') {
            if (canMoveToTableau(selectedItem.card, targetInfo.colIndex)) {
                executeMove(selectedItem, { type: 'tableau', colIndex: targetInfo.colIndex });
                return;
            }
        } else if (targetInfo.type === 'foundation') {
            if (canMoveToFoundation(selectedItem.card, targetInfo.fIndex)) {
                executeMove(selectedItem, { type: 'foundation', fIndex: targetInfo.fIndex });
                return;
            }
        }
        selectedItem = null;
        render();
    }

    // --- Renderizado Visual ---
    function createCardElement(card, sourceInfo) {
        const el = document.createElement('div');
        el.className = `card ${card.color} ${card.faceUp ? 'face-up' : 'face-down'}`;
        el.dataset.cardId = card.id;

        // Resaltar si está seleccionada
        if (selectedItem && selectedItem.card && selectedItem.card.id === card.id) {
            el.classList.add('selected');
        }

        if (card.faceUp) {
            el.draggable = true;

            // Esquina superior izquierda
            const topCorner = document.createElement('div');
            topCorner.className = 'card-corner top';
            topCorner.innerHTML = `<span>${card.rankLabel}</span><span class="corner-suit">${card.suitSymbol}</span>`;

            // Centro
            const center = document.createElement('div');
            center.className = 'card-center';
            if (card.rank >= 11 && card.rank <= 13) {
                center.innerHTML = `<span class="royal-letter">${card.rankLabel}</span><span class="center-suit">${card.suitSymbol}</span>`;
            } else {
                center.innerHTML = `<span class="center-suit">${card.suitSymbol}</span>`;
            }

            // Esquina inferior derecha
            const btmCorner = document.createElement('div');
            btmCorner.className = 'card-corner bottom';
            btmCorner.innerHTML = `<span>${card.rankLabel}</span><span class="corner-suit">${card.suitSymbol}</span>`;

            el.appendChild(topCorner);
            el.appendChild(center);
            el.appendChild(btmCorner);

            // Eventos de Arrastre (Drag and Drop)
            el.addEventListener('dragstart', (e) => {
                e.stopPropagation();
                draggedData = {
                    card,
                    source: sourceInfo
                };
                el.classList.add('is-dragging');
                e.dataTransfer.setData('text/plain', card.id);
                e.dataTransfer.effectAllowed = 'move';
            });

            el.addEventListener('dragend', () => {
                el.classList.remove('is-dragging');
                draggedData = null;
                clearDropHighlights();
            });

            // Clic sencillo
            el.addEventListener('click', (e) => {
                e.stopPropagation();
                handleCardClick(card, sourceInfo);
            });

            // Doble clic para auto-mover
            el.addEventListener('dblclick', (e) => {
                e.stopPropagation();
                tryAutoMoveCard(card, sourceInfo);
            });
        }

        return el;
    }

    function clearDropHighlights() {
        document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
    }

    function render() {
        // 1. Renderizar Mazo (Stock)
        dom.stock.classList.toggle('empty', state.stock.length === 0);
        // Limpiar cartas previas en stock dejando el icono
        const reloadIcon = dom.stock.querySelector('.stock-reload-icon');
        dom.stock.innerHTML = '';
        if (state.stock.length === 0) {
            dom.stock.appendChild(reloadIcon);
        } else {
            // Mostrar carta cubierta
            const stockCard = document.createElement('div');
            stockCard.className = 'card face-down';
            stockCard.style.top = '0';
            stockCard.style.left = '0';
            dom.stock.appendChild(stockCard);
        }

        // 2. Renderizar Pila de Descarte (Waste)
        dom.waste.innerHTML = '';
        if (state.waste.length > 0) {
            // Mostrar las últimas cartas escalonadas levemente
            const topCard = state.waste[state.waste.length - 1];
            const cardEl = createCardElement(topCard, { type: 'waste' });
            dom.waste.appendChild(cardEl);
        }

        // 3. Renderizar Fundaciones
        for (let i = 0; i < 4; i++) {
            const fSlot = dom.foundations[i];
            // Conservar la marca de agua
            const watermark = fSlot.querySelector('.slot-watermark');
            fSlot.innerHTML = '';
            fSlot.appendChild(watermark);

            const cards = state.foundations[i];
            if (cards.length > 0) {
                const topCard = cards[cards.length - 1];
                const cardEl = createCardElement(topCard, { type: 'foundation', fIndex: i });
                fSlot.appendChild(cardEl);
            }
        }

        // 4. Renderizar Columnas del Tablero (Tableau)
        for (let c = 0; c < 7; c++) {
            const colSlot = dom.tableaus[c];
            // Vaciar excepto el contenedor del slot base
            colSlot.innerHTML = '<div class="card-slot tableau-slot"></div>';
            const cards = state.tableau[c];

            const offset = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--tableau-offset')) || 28;

            cards.forEach((card, idx) => {
                const cardEl = createCardElement(card, { type: 'tableau', colIndex: c, cardIndex: idx });
                cardEl.style.top = `${idx * offset}px`;
                cardEl.style.zIndex = idx + 1;

                // Si esta carta es parte de una secuencia seleccionada, resaltarla
                if (selectedItem && selectedItem.type === 'tableau' && selectedItem.colIndex === c && idx >= selectedItem.cardIndex) {
                    cardEl.classList.add('selected');
                }

                colSlot.appendChild(cardEl);
            });
        }
    }

    // --- Configurar Zonas de Arrastre y Soltado (Drop Targets) ---
    function setupDropZones() {
        // Fundaciones como destinos
        dom.foundations.forEach((fSlot, fIndex) => {
            fSlot.addEventListener('dragover', (e) => {
                e.preventDefault();
                if (draggedData && canMoveToFoundation(draggedData.card, fIndex)) {
                    fSlot.classList.add('drag-over');
                }
            });

            fSlot.addEventListener('dragleave', () => {
                fSlot.classList.remove('drag-over');
            });

            fSlot.addEventListener('drop', (e) => {
                e.preventDefault();
                clearDropHighlights();
                if (draggedData && canMoveToFoundation(draggedData.card, fIndex)) {
                    executeMove(draggedData.source, { type: 'foundation', fIndex });
                }
            });

            fSlot.addEventListener('click', () => {
                handleEmptySlotClick({ type: 'foundation', fIndex });
            });
        });

        // Columnas del tablero como destinos
        dom.tableaus.forEach((colEl, colIndex) => {
            colEl.addEventListener('dragover', (e) => {
                e.preventDefault();
                if (draggedData && canMoveToTableau(draggedData.card, colIndex)) {
                    colEl.classList.add('drag-over');
                }
            });

            colEl.addEventListener('dragleave', () => {
                colEl.classList.remove('drag-over');
            });

            colEl.addEventListener('drop', (e) => {
                e.preventDefault();
                clearDropHighlights();
                if (draggedData && canMoveToTableau(draggedData.card, colIndex)) {
                    executeMove(draggedData.source, { type: 'tableau', colIndex });
                }
            });

            colEl.addEventListener('click', (e) => {
                // Clic en la columna (si está vacía o sobre espacio vacío inferior)
                if (e.target === colEl || e.target.classList.contains('tableau-slot')) {
                    handleEmptySlotClick({ type: 'tableau', colIndex });
                }
            });
        });
    }

    // --- Comprobación de Estado: Victoria y Auto-completar ---
    function checkGameState() {
        // Comprobar Victoria: Las 4 fundaciones tienen 13 cartas (52 en total)
        const totalFoundationCards = state.foundations.reduce((acc, f) => acc + f.length, 0);
        if (totalFoundationCards === 52) {
            triggerWin();
            return;
        }

        // Comprobar si se puede auto-completar:
        // Todas las cartas restantes en el tablero están descubiertas y no quedan en el mazo ni descarte
        if (state.stock.length === 0 && state.waste.length === 0) {
            const allFaceUp = state.tableau.every(col => col.every(card => card.faceUp));
            if (allFaceUp && !state.gameWon && !isAutoCompleting) {
                dom.autocompleteBanner.style.display = 'inline-flex';
            } else {
                dom.autocompleteBanner.style.display = 'none';
            }
        } else {
            dom.autocompleteBanner.style.display = 'none';
        }
    }

    // Auto-completar automático
    function autoComplete() {
        if (isAutoCompleting) return;
        isAutoCompleting = true;
        dom.autocompleteBanner.style.display = 'none';

        const step = () => {
            let moved = false;
            // Buscar la carta más baja posible que pueda ir a una fundación
            for (let c = 0; c < 7; c++) {
                const col = state.tableau[c];
                if (col.length > 0) {
                    const topCard = col[col.length - 1];
                    const fIdx = findFoundationForCard(topCard);
                    if (fIdx !== -1) {
                        executeMove({ type: 'tableau', colIndex: c, cardIndex: col.length - 1 }, { type: 'foundation', fIndex: fIdx });
                        moved = true;
                        break;
                    }
                }
            }

            if (moved && !state.gameWon) {
                setTimeout(step, 140);
            } else {
                isAutoCompleting = false;
            }
        };

        step();
    }

    function triggerWin() {
        state.gameWon = true;
        stopTimer();

        dom.winTime.textContent = formatTime(state.timeElapsed);
        dom.winMoves.textContent = state.moves;
        dom.winScore.textContent = state.score + 500; // Bonus de victoria

        dom.winModal.classList.add('active');
    }

    // --- Enlace de Eventos Generales ---
    function setupEventListeners() {
        dom.stock.addEventListener('click', onStockClick);

        dom.btnUndo.addEventListener('click', undo);

        dom.btnRestart.addEventListener('click', () => {
            if (confirm('¿Deseas reiniciar la misma partida?')) {
                initGame(initialDeckSnapshot);
                showToast('Partida reiniciada');
            }
        });

        dom.btnNewGame.addEventListener('click', () => {
            initGame();
            showToast('Nueva partida iniciada');
        });

        dom.btnWinNewGame.addEventListener('click', () => {
            dom.winModal.classList.remove('active');
            initGame();
        });

        dom.autocompleteBanner.addEventListener('click', autoComplete);

        // Deseleccionar al hacer clic fuera del tablero de juego
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.card') && !e.target.closest('.card-slot') && !e.target.closest('.tableau-column')) {
                if (selectedItem) {
                    selectedItem = null;
                    render();
                }
            }
        });

        // Atajos de teclado: Ctrl+Z para Deshacer, N para Nuevo Juego
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
                e.preventDefault();
                undo();
            } else if (e.key.toLowerCase() === 'n' && !e.ctrlKey) {
                initGame();
            }
        });
    }

    // --- Arranque ---
    setupDropZones();
    setupEventListeners();
    initGame();

    // Exportar para depuración en consola si se desea
    window.Solitario = {
        state,
        initGame,
        undo,
        autoComplete,
        triggerWin
    };

})();
