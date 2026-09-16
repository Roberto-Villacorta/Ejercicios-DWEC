/**
 * Solitario Clásico (Klondike)
 * Desarrollo Web en Entorno Cliente (DWEC)
 */

(function () {
    'use strict';

    // --- Definición de Constantes y Palos ---
    const PALOS = [
        { id: 'corazones', simbolo: '♥', color: 'rojo', nombre: 'Corazones' },
        { id: 'diamantes', simbolo: '♦', color: 'rojo', nombre: 'Diamantes' },
        { id: 'treboles', simbolo: '♣', color: 'negro', nombre: 'Tréboles' },
        { id: 'picas', simbolo: '♠', color: 'negro', nombre: 'Picas' }
    ];

    const VALORES = [
        { valor: 1, etiqueta: 'A', nombre: 'As' },
        { valor: 2, etiqueta: '2', nombre: '2' },
        { valor: 3, etiqueta: '3', nombre: '3' },
        { valor: 4, etiqueta: '4', nombre: '4' },
        { valor: 5, etiqueta: '5', nombre: '5' },
        { valor: 6, etiqueta: '6', nombre: '6' },
        { valor: 7, etiqueta: '7', nombre: '7' },
        { valor: 8, etiqueta: '8', nombre: '8' },
        { valor: 9, etiqueta: '9', nombre: '9' },
        { valor: 10, etiqueta: '10', nombre: '10' },
        { valor: 11, etiqueta: 'J', nombre: 'Sota' },
        { valor: 12, etiqueta: 'Q', nombre: 'Reina' },
        { valor: 13, etiqueta: 'K', nombre: 'Rey' }
    ];

    // --- Estado Principal del Juego ---
    let estado = {
        dificultad: 'facil', // 'facil' | 'medio' | 'dificil'
        mazo: [],
        descarte: [],
        fundaciones: [[], [], [], []], // 0: corazones, 1: diamantes, 2: tréboles, 
        // 3: picas
        tablero: [[], [], [], [], [], [], []], // 7 columnas
        movimientos: 0,
        puntuacion: 0,
        tiempoTranscurrido: 0,
        temporizadorActivo: false,
        partidaGanada: false
    };

    let dificultadSeleccionadaEnPantalla = 'facil';
    let pilaHistorial = [];
    let instantaneaBarajaInicial = null;
    let identificadorTemporizador = null;
    let elementoSeleccionado = null; // { origen: 'descarte'|'tablero'|'fundacion'
    // , indiceColumna, indiceCarta }
    let datosArrastre = null; // Información de la carta/secuencia en arrastre
    let estaAutocompletando = false;

    // --- Elementos del DOM ---
    const dom = {
        mazo: document.getElementById('mazo'),
        descarte: document.getElementById('descarte'),
        fundaciones: [
            document.getElementById('fundacion-0'),
            document.getElementById('fundacion-1'),
            document.getElementById('fundacion-2'),
            document.getElementById('fundacion-3')
        ],
        tableros: [
            document.getElementById('tablero-0'),
            document.getElementById('tablero-1'),
            document.getElementById('tablero-2'),
            document.getElementById('tablero-3'),
            document.getElementById('tablero-4'),
            document.getElementById('tablero-5'),
            document.getElementById('tablero-6')
        ],
        estTiempo: document.getElementById('est-tiempo'),
        estMovimientos: document.getElementById('est-movimientos'),
        estPuntuacion: document.getElementById('est-puntuacion'),
        btnDeshacer: document.getElementById('btn-deshacer'),
        btnReiniciar: document.getElementById('btn-reiniciar'),
        btnNuevaPartida: document.getElementById('btn-nueva-partida'),
        btnDificultad: document.getElementById('btn-dificultad'),
        textoDificultad: document.getElementById('texto-dificultad'),
        iconoDificultad: document.getElementById('icono-dificultad'),
        btnPista: document.getElementById('btn-pista'),
        badgeSolucionable: document.getElementById('badge-solucionable'),
        pantallaDificultad: document.getElementById('pantalla-dificultad'),
        tarjetasDificultad: document.querySelectorAll('.tarjeta-dificultad'),
        btnComenzarJuego: document.getElementById('btn-comenzar-juego'),
        btnCerrarPantallaDificultad: document.getElementById('btn-cerrar-pantalla-dificultad'),
        btnVictoriaCambiarDificultad: document.getElementById('btn-victoria-cambiar-dificultad'),
        btnVictoriaNuevaPartida: document.getElementById('btn-victoria-nueva-partida'),
        modalVictoria: document.getElementById('modal-victoria'),
        victoriaTiempo: document.getElementById('victoria-tiempo'),
        victoriaMovimientos: document.getElementById('victoria-movimientos'),
        victoriaPuntuacion: document.getElementById('victoria-puntuacion'),
        bannerAutocompletar: document.getElementById('banner-autocompletar'),
        notificacion: document.getElementById('notificacion')
    };

    // --- Generación y Barajado de Cartas ---
    function crearBaraja() {
        const baraja = [];
        let contadorId = 1;

        for (const palo of PALOS) {
            for (const val of VALORES) {
                baraja.push({
                    id: `carta-${contadorId++}`,
                    palo: palo.id,
                    simboloPalo: palo.simbolo,
                    color: palo.color,
                    valor: val.valor,
                    etiquetaValor: val.etiqueta,
                    nombreCarta: `${val.nombre} de ${palo.nombre}`,
                    bocaArriba: false
                });
            }
        }
        return baraja;
    }

    // Algoritmo de barajado Fisher-Yates
    function barajarBaraja(baraja) {
        const barajada = [...baraja];
        for (let i = barajada.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [barajada[i], barajada[j]] = [barajada[j], barajada[i]];
        }
        return barajada;
    }

    // --- Motor de Verificación y Generación de Partidas 100% Solucionables ---
    const MotorSolucionador = {
        // Resuelve un reparto en modo abierto (thoughtful Klondike) para comprobar si existe una ruta ganadora
        esSolucionable(baraja, modoRobo = 1, limiteNodos = 1500) {
            let idx = 0;
            const tablero = [];
            for (let c = 0; c < 7; c++) {
                const col = [];
                for (let r = 0; r <= c; r++) {
                    const carta = baraja[idx++];
                    col.push({ valor: carta.valor, palo: carta.palo, color: carta.color, visible: r === c });
                }
                tablero.push(col);
            }
            const mazo = baraja.slice(idx).map(c => ({ valor: c.valor, palo: c.palo, color: c.color, visible: false }));
            const descarte = [];
            const fundaciones = [0, 0, 0, 0];
            const paloAIndice = { 'corazones': 0, 'diamantes': 1, 'treboles': 2, 'picas': 3 };

            function serializar(f, t, m, d) {
                let k = f.join(',') + '|' + d.length + '|' + (d.length > 0 ? (d[d.length - 1].valor + d[d.length - 1].palo) : '') + '|';
                for (let c = 0; c < 7; c++) {
                    const col = t[c];
                    k += col.length + ':';
                    for (let i = 0; i < col.length; i++) {
                        k += col[i].visible ? (col[i].valor + col[i].palo) : '?';
                    }
                    k += ';';
                }
                return k;
            }

            const cola = [{ f: fundaciones, t: tablero, m: mazo, d: descarte }];
            const visitados = new Set();
            let nodos = 0;

            while (cola.length > 0 && nodos < limiteNodos) {
                nodos++;
                const actual = cola.pop();
                const { f, t, m, d } = actual;

                if (f[0] === 13 && f[1] === 13 && f[2] === 13 && f[3] === 13) {
                    return { solucionable: true, nodos };
                }

                const clave = serializar(f, t, m, d);
                if (visitados.has(clave)) continue;
                visitados.add(clave);

                // 1. Movimientos seguros a fundaciones
                let movioSeguro = false;
                for (let c = 0; c < 7; c++) {
                    const col = t[c];
                    if (col.length > 0) {
                        const carta = col[col.length - 1];
                        const idxF = paloAIndice[carta.palo];
                        if (carta.valor === f[idxF] + 1) {
                            const indicesOpuestos = carta.color === 'rojo' ? [2, 3] : [0, 1];
                            const esSeguro = (carta.valor <= 2) || (f[indicesOpuestos[0]] >= carta.valor - 1 && f[indicesOpuestos[1]] >= carta.valor - 1);
                            if (esSeguro) {
                                const nuevoF = [...f];
                                nuevoF[idxF]++;
                                const nuevoT = t.map((columna, colIdx) => {
                                    if (colIdx !== c) return columna;
                                    const nc = columna.slice(0, -1);
                                    if (nc.length > 0 && !nc[nc.length - 1].visible) {
                                        nc[nc.length - 1] = { ...nc[nc.length - 1], visible: true };
                                    }
                                    return nc;
                                });
                                cola.push({ f: nuevoF, t: nuevoT, m: [...m], d: [...d] });
                                movioSeguro = true;
                                break;
                            }
                        }
                    }
                }
                if (movioSeguro) continue;

                if (d.length > 0) {
                    const carta = d[d.length - 1];
                    const idxF = paloAIndice[carta.palo];
                    if (carta.valor === f[idxF] + 1) {
                        const indicesOpuestos = carta.color === 'rojo' ? [2, 3] : [0, 1];
                        const esSeguro = (carta.valor <= 2) || (f[indicesOpuestos[0]] >= carta.valor - 1 && f[indicesOpuestos[1]] >= carta.valor - 1);
                        if (esSeguro) {
                            const nuevoF = [...f];
                            nuevoF[idxF]++;
                            cola.push({ f: nuevoF, t, m: [...m], d: d.slice(0, -1) });
                            continue;
                        }
                    }
                }

                // 2. Robar de mazo / reciclar descarte
                if (m.length > 0) {
                    const cant = Math.min(modoRobo, m.length);
                    const robadas = m.slice(m.length - cant).map(c => ({ ...c, visible: true }));
                    const nuevoM = m.slice(0, m.length - cant);
                    cola.push({ f, t, m: nuevoM, d: [...d, ...robadas] });
                } else if (d.length > 0) {
                    const nuevoM = d.map(c => ({ ...c, visible: false })).reverse();
                    cola.push({ f, t, m: nuevoM, d: [] });
                }

                // 3. Mover entre columnas de tablero
                for (let cOrigen = 0; cOrigen < 7; cOrigen++) {
                    const colOrigen = t[cOrigen];
                    if (colOrigen.length === 0) continue;

                    let primerVisible = -1;
                    for (let i = 0; i < colOrigen.length; i++) {
                        if (colOrigen[i].visible) {
                            primerVisible = i;
                            break;
                        }
                    }
                    if (primerVisible === -1) continue;

                    for (let ki = primerVisible; ki < colOrigen.length; ki++) {
                        const cartaBase = colOrigen[ki];
                        if (ki === 0 && cartaBase.valor === 13) continue;

                        for (let cDest = 0; cDest < 7; cDest++) {
                            if (cDest === cOrigen) continue;
                            const colDest = t[cDest];
                            let puede = false;
                            if (colDest.length === 0) {
                                puede = (cartaBase.valor === 13);
                            } else {
                                const sup = colDest[colDest.length - 1];
                                puede = (cartaBase.color !== sup.color && cartaBase.valor === sup.valor - 1);
                            }

                            if (puede) {
                                const sub = colOrigen.slice(ki);
                                const nuevoT = t.map((col, idxCol) => {
                                    if (idxCol === cOrigen) {
                                        const nc = col.slice(0, ki);
                                        if (nc.length > 0 && !nc[nc.length - 1].visible) {
                                            nc[nc.length - 1] = { ...nc[nc.length - 1], visible: true };
                                        }
                                        return nc;
                                    }
                                    if (idxCol === cDest) return [...col, ...sub];
                                    return col;
                                });
                                cola.push({ f, t: nuevoT, m: [...m], d: [...d] });
                            }
                        }
                    }
                }

                // 4. Mover de descarte a tablero
                if (d.length > 0) {
                    const carta = d[d.length - 1];
                    for (let cDest = 0; cDest < 7; cDest++) {
                        const colDest = t[cDest];
                        let puede = false;
                        if (colDest.length === 0) {
                            puede = (carta.valor === 13);
                        } else {
                            const sup = colDest[colDest.length - 1];
                            puede = (carta.color !== sup.color && carta.valor === sup.valor - 1);
                        }
                        if (puede) {
                            const nuevoT = t.map((col, idxCol) => {
                                if (idxCol === cDest) return [...col, carta];
                                return col;
                            });
                            cola.push({ f, t: nuevoT, m: [...m], d: d.slice(0, -1) });
                        }
                    }
                }

                // 5. Movimientos estándar a fundaciones
                for (let c = 0; c < 7; c++) {
                    const col = t[c];
                    if (col.length > 0) {
                        const carta = col[col.length - 1];
                        const idxF = paloAIndice[carta.palo];
                        if (carta.valor === f[idxF] + 1) {
                            const nuevoF = [...f];
                            nuevoF[idxF]++;
                            const nuevoT = t.map((columna, colIdx) => {
                                if (colIdx !== c) return columna;
                                const nc = columna.slice(0, -1);
                                if (nc.length > 0 && !nc[nc.length - 1].visible) {
                                    nc[nc.length - 1] = { ...nc[nc.length - 1], visible: true };
                                }
                                return nc;
                            });
                            cola.push({ f: nuevoF, t: nuevoT, m: [...m], d: [...d] });
                        }
                    }
                }
            }

            return { solucionable: false, nodos };
        }
    };

    // Generador de partidas 100% resolubles en tiempo real sin semillas predefinidas
    function generarBarajaSolucionable(dificultad = 'facil') {
        const modoRobo = dificultad === 'dificil' ? 3 : 1;
        const limiteNodos = dificultad === 'dificil' ? 2500 : (dificultad === 'medio' ? 1800 : 1200);
        const barajaBase = crearBaraja();

        // Bucle puramente aleatorio y dinámico: baraja y valida en milisegundos hasta verificar la victoria
        while (true) {
            const candidata = barajarBaraja(barajaBase);

            if (dificultad === 'facil') {
                // En modo fácil, aseguramos que haya al menos un As o 2 entre las cartas descubiertas
                const cartasVisiblesIniciales = [candidata[0], candidata[2], candidata[5], candidata[9], candidata[14], candidata[20], candidata[27]];
                const tieneBajaInicial = cartasVisiblesIniciales.some(c => c.valor === 1 || c.valor === 2);
                if (!tieneBajaInicial) continue;
            }

            const resultado = MotorSolucionador.esSolucionable(candidata, modoRobo, limiteNodos);
            if (resultado.solucionable) {
                return candidata;
            }
        }
    }

    // --- Inicialización del Juego ---
    function iniciarPartida(barajaParaUsar = null, dificultadDeseada = null) {
        detenerTemporizador();
        if (dificultadDeseada) {
            estado.dificultad = dificultadDeseada;
        }

        estado.movimientos = 0;
        estado.puntuacion = 0;
        estado.tiempoTranscurrido = 0;
        estado.temporizadorActivo = false;
        estado.partidaGanada = false;
        pilaHistorial = [];
        elementoSeleccionado = null;
        estaAutocompletando = false;

        dom.modalVictoria.classList.remove('activo');
        dom.bannerAutocompletar.style.display = 'none';

        // Actualizar indicadores de dificultad en la interfaz
        actualizarIndicadorDificultad();
        actualizarEstadisticas();

        // Generar una baraja 100% matemáticamente solucionable para la dificultad
        const baraja = barajaParaUsar ? JSON.parse(JSON.stringify(barajaParaUsar)) : generarBarajaSolucionable(estado.dificultad);
        if (!barajaParaUsar) {
            instantaneaBarajaInicial = JSON.parse(JSON.stringify(baraja));
        }

        // Limpiar fundaciones, tablero y descarte
        estado.fundaciones = [[], [], [], []];
        estado.tablero = [[], [], [], [], [], [], []];
        estado.descarte = [];

        // Reparto a las 7 columnas del tablero (1 carta en col 0, 2 en col 1, ..., 7 en col 6)
        let indiceCarta = 0;
        for (let col = 0; col < 7; col++) {
            for (let fila = 0; fila <= col; fila++) {
                const carta = baraja[indiceCarta++];
                carta.bocaArriba = (fila === col);
                estado.tablero[col].push(carta);
            }
        }

        // Las cartas restantes pasan al mazo de robo (boca abajo)
        estado.mazo = baraja.slice(indiceCarta).map(carta => {
            carta.bocaArriba = false;
            return carta;
        });

        renderizar();
        actualizarBotonDeshacer();
    }

    function actualizarIndicadorDificultad() {
        const config = {
            facil: { nombre: 'Fácil', clase: 'facil' },
            medio: { nombre: 'Medio', clase: 'medio' },
            dificil: { nombre: 'Difícil', clase: 'dificil' }
        }[estado.dificultad] || { nombre: 'Fácil', clase: 'facil' };

        dom.textoDificultad.textContent = config.nombre;
        if (dom.iconoDificultad) {
            dom.iconoDificultad.className = `indicador-dificultad-dot ${config.clase}`;
            dom.iconoDificultad.textContent = '';
        }
    }

    // --- Control del Temporizador ---
    function iniciarTemporizadorSiEsNecesario() {
        if (!estado.temporizadorActivo && !estado.partidaGanada) {
            estado.temporizadorActivo = true;
            identificadorTemporizador = setInterval(() => {
                estado.tiempoTranscurrido++;
                actualizarEstadisticas();
            }, 1000);
        }
    }

    function detenerTemporizador() {
        if (identificadorTemporizador) {
            clearInterval(identificadorTemporizador);
            identificadorTemporizador = null;
        }
        estado.temporizadorActivo = false;
    }

    function formatearTiempo(segundos) {
        const minutos = Math.floor(segundos / 60).toString().padStart(2, '0');
        const segs = (segundos % 60).toString().padStart(2, '0');
        return `${minutos}:${segs}`;
    }

    function actualizarEstadisticas() {
        dom.estTiempo.textContent = formatearTiempo(estado.tiempoTranscurrido);
        dom.estMovimientos.textContent = estado.movimientos;
        dom.estPuntuacion.textContent = estado.puntuacion;
    }

    function mostrarNotificacion(mensaje) {
        dom.notificacion.textContent = mensaje;
        dom.notificacion.classList.add('visible');
        clearTimeout(dom.notificacion._temporizador);
        dom.notificacion._temporizador = setTimeout(() => {
            dom.notificacion.classList.remove('visible');
        }, 1800);
    }

    // --- Gestión de Historial (Deshacer) ---
    function guardarEstadoParaDeshacer() {
        const instantanea = {
            mazo: JSON.parse(JSON.stringify(estado.mazo)),
            descarte: JSON.parse(JSON.stringify(estado.descarte)),
            fundaciones: JSON.parse(JSON.stringify(estado.fundaciones)),
            tablero: JSON.parse(JSON.stringify(estado.tablero)),
            movimientos: estado.movimientos,
            puntuacion: estado.puntuacion
        };
        pilaHistorial.push(instantanea);
        if (pilaHistorial.length > 50) pilaHistorial.shift();
        actualizarBotonDeshacer();
    }

    function actualizarBotonDeshacer() {
        dom.btnDeshacer.disabled = pilaHistorial.length === 0;
    }

    function deshacer() {
        if (pilaHistorial.length === 0) return;
        const anterior = pilaHistorial.pop();
        estado.mazo = anterior.mazo;
        estado.descarte = anterior.descarte;
        estado.fundaciones = anterior.fundaciones;
        estado.tablero = anterior.tablero;
        estado.movimientos = anterior.movimientos;
        estado.puntuacion = anterior.puntuacion;
        elementoSeleccionado = null;

        actualizarEstadisticas();
        actualizarBotonDeshacer();
        renderizar();
        mostrarNotificacion('Movimiento deshecho');
    }

    // --- Validaciones de Movimientos ---
    function puedeMoverAFundacion(carta, indiceFundacion) {
        const fundacion = estado.fundaciones[indiceFundacion];
        const paloEsperado = PALOS[indiceFundacion].id;

        if (carta.palo !== paloEsperado) return false;

        if (fundacion.length === 0) {
            return carta.valor === 1; // As
        } else {
            const cartaSuperior = fundacion[fundacion.length - 1];
            return carta.valor === cartaSuperior.valor + 1;
        }
    }

    function puedeMoverATablero(cartaAMover, indiceColumna) {
        const columna = estado.tablero[indiceColumna];
        if (columna.length === 0) {
            return cartaAMover.valor === 13; // Solo el Rey en columnas vacías
        }
        const cartaSuperior = columna[columna.length - 1];
        if (!cartaSuperior.bocaArriba) return false;
        // Colores alternos y valor decreciente en 1
        return (cartaAMover.color !== cartaSuperior.color) && (cartaAMover.valor === cartaSuperior.valor - 1);
    }

    function buscarFundacionParaCarta(carta) {
        for (let i = 0; i < 4; i++) {
            if (puedeMoverAFundacion(carta, i)) {
                return i;
            }
        }
        return -1;
    }

    function comprobarVolteoAutomatico(indiceColumna) {
        const columna = estado.tablero[indiceColumna];
        if (columna.length > 0) {
            const superior = columna[columna.length - 1];
            if (!superior.bocaArriba) {
                superior.bocaArriba = true;
                estado.puntuacion += 5; // Puntos por descubrir carta
                return true;
            }
        }
        return false;
    }

    // --- Acciones de Juego ---

    // 1. Clic en el Mazo de cartas
    function alHacerClicEnMazo() {
        iniciarTemporizadorSiEsNecesario();
        guardarEstadoParaDeshacer();
        elementoSeleccionado = null;

        if (estado.mazo.length > 0) {
            // Robar carta(s) del mazo al montón de descarte según la dificultad
            const cantidadARobar = estado.dificultad === 'dificil' ? Math.min(3, estado.mazo.length) : 1;
            for (let i = 0; i < cantidadARobar; i++) {
                const carta = estado.mazo.pop();
                carta.bocaArriba = true;
                estado.descarte.push(carta);
            }
            estado.movimientos++;
        } else {
            // Reciclar el descarte de vuelta al mazo
            if (estado.descarte.length === 0) return;
            estado.mazo = estado.descarte.map(c => {
                c.bocaArriba = false;
                return c;
            }).reverse();
            estado.descarte = [];
            estado.movimientos++;
            estado.puntuacion = Math.max(0, estado.puntuacion - 10);
            mostrarNotificacion('Mazo reiniciado');
        }

        actualizarEstadisticas();
        renderizar();
        comprobarEstadoJuego();
    }

    // 2. Ejecutar movimiento entre zonas
    function ejecutarMovimiento(origen, destino) {
        iniciarTemporizadorSiEsNecesario();
        guardarEstadoParaDeshacer();

        let cartasAMover = [];

        // Extraer cartas de la zona de origen
        if (origen.tipo === 'descarte') {
            cartasAMover = [estado.descarte.pop()];
        } else if (origen.tipo === 'fundacion') {
            cartasAMover = [estado.fundaciones[origen.indiceFundacion].pop()];
        } else if (origen.tipo === 'tablero') {
            const columna = estado.tablero[origen.indiceColumna];
            cartasAMover = columna.splice(origen.indiceCarta);
        }

        // Depositar cartas en la zona de destino
        if (destino.tipo === 'fundacion') {
            estado.fundaciones[destino.indiceFundacion].push(...cartasAMover);
            estado.puntuacion += 10;
        } else if (destino.tipo === 'tablero') {
            estado.tablero[destino.indiceColumna].push(...cartasAMover);
            if (origen.tipo === 'descarte') {
                estado.puntuacion += 5;
            } else if (origen.tipo === 'fundacion') {
                estado.puntuacion = Math.max(0, estado.puntuacion - 15);
            }
        }

        // Si el origen fue el tablero, voltear la carta que haya quedado boca abajo
        if (origen.tipo === 'tablero') {
            comprobarVolteoAutomatico(origen.indiceColumna);
        }

        estado.movimientos++;
        elementoSeleccionado = null;
        actualizarEstadisticas();
        renderizar();
        comprobarEstadoJuego();
    }

    // 3. Auto-mover carta con doble clic
    function intentarMovimientoAutomatico(carta, infoOrigen) {
        const indiceFundacion = buscarFundacionParaCarta(carta);
        if (indiceFundacion !== -1) {
            ejecutarMovimiento(infoOrigen, { tipo: 'fundacion', indiceFundacion });
            return true;
        }

        // Si no cabe en la fundación, verificar si cabe en alguna columna del tablero
        for (let c = 0; c < 7; c++) {
            if (infoOrigen.tipo === 'tablero' && infoOrigen.indiceColumna === c) continue;
            if (puedeMoverATablero(carta, c)) {
                if (infoOrigen.tipo === 'tablero' && carta.valor === 13 && estado.tablero[infoOrigen.indiceColumna].length === 0) {
                    continue;
                }
                ejecutarMovimiento(infoOrigen, { tipo: 'tablero', indiceColumna: c });
                return true;
            }
        }

        return false;
    }

    // 4. Manejo de Selección y Clic Simple
    function manejarClicEnCarta(carta, infoOrigen) {
        if (!carta.bocaArriba) return;

        // Si no hay nada seleccionado, seleccionar esta carta
        if (!elementoSeleccionado) {
            elementoSeleccionado = { ...infoOrigen, carta };
            renderizar();
            return;
        }

        // Clic en la misma carta: deseleccionar
        if (elementoSeleccionado.carta.id === carta.id) {
            elementoSeleccionado = null;
            renderizar();
            return;
        }

        // Intentar colocar la carta seleccionada sobre esta carta
        if (infoOrigen.tipo === 'tablero') {
            const columnaDestino = infoOrigen.indiceColumna;
            const columna = estado.tablero[columnaDestino];
            const esCartaSuperior = (columna.length - 1 === infoOrigen.indiceCarta);

            if (esCartaSuperior && puedeMoverATablero(elementoSeleccionado.carta, columnaDestino)) {
                ejecutarMovimiento(elementoSeleccionado, { tipo: 'tablero', indiceColumna: columnaDestino });
                return;
            }
        } else if (infoOrigen.tipo === 'fundacion') {
            if (puedeMoverAFundacion(elementoSeleccionado.carta, infoOrigen.indiceFundacion)) {
                ejecutarMovimiento(elementoSeleccionado, { tipo: 'fundacion', indiceFundacion: infoOrigen.indiceFundacion });
                return;
            }
        }

        // Si el movimiento no era válido, seleccionar la nueva carta
        elementoSeleccionado = { ...infoOrigen, carta };
        renderizar();
    }

    // Clic en una casilla vacía
    function manejarClicEnCasillaVacia(infoDestino) {
        if (!elementoSeleccionado) return;

        if (infoDestino.tipo === 'tablero') {
            if (puedeMoverATablero(elementoSeleccionado.carta, infoDestino.indiceColumna)) {
                ejecutarMovimiento(elementoSeleccionado, { tipo: 'tablero', indiceColumna: infoDestino.indiceColumna });
                return;
            }
        } else if (infoDestino.tipo === 'fundacion') {
            if (puedeMoverAFundacion(elementoSeleccionado.carta, infoDestino.indiceFundacion)) {
                ejecutarMovimiento(elementoSeleccionado, { tipo: 'fundacion', indiceFundacion: infoDestino.indiceFundacion });
                return;
            }
        }
        elementoSeleccionado = null;
        renderizar();
    }

    // --- Renderizado Visual en el DOM ---
    function crearElementoCarta(carta, infoOrigen) {
        const el = document.createElement('div');
        el.className = `carta ${carta.color} ${carta.bocaArriba ? 'boca-arriba' : 'boca-abajo'}`;
        el.dataset.idCarta = carta.id;
        el.title = carta.bocaArriba ? carta.nombreCarta : 'Carta cubierta';

        // Resaltar si está seleccionada
        if (elementoSeleccionado && elementoSeleccionado.carta && elementoSeleccionado.carta.id === carta.id) {
            el.classList.add('seleccionada');
        }

        if (carta.bocaArriba) {
            el.draggable = true;

            // Esquina superior
            const esquinaSuperior = document.createElement('div');
            esquinaSuperior.className = 'esquina-carta superior';
            esquinaSuperior.innerHTML = `<span>${carta.etiquetaValor}</span><span class="palo-esquina">${carta.simboloPalo}</span>`;

            // Centro
            const centro = document.createElement('div');
            centro.className = 'centro-carta';
            if (carta.valor >= 11 && carta.valor <= 13) {
                centro.innerHTML = `<span class="letra-figura">${carta.etiquetaValor}</span><span class="palo-centro">${carta.simboloPalo}</span>`;
            } else {
                centro.innerHTML = `<span class="palo-centro">${carta.simboloPalo}</span>`;
            }

            // Esquina inferior invertida
            const esquinaInferior = document.createElement('div');
            esquinaInferior.className = 'esquina-carta inferior';
            esquinaInferior.innerHTML = `<span>${carta.etiquetaValor}</span><span class="palo-esquina">${carta.simboloPalo}</span>`;

            el.appendChild(esquinaSuperior);
            el.appendChild(centro);
            el.appendChild(esquinaInferior);

            // Arrastrar (Drag & Drop)
            el.addEventListener('dragstart', (e) => {
                e.stopPropagation();
                datosArrastre = {
                    carta,
                    origen: infoOrigen
                };
                el.classList.add('arrastrando');
                e.dataTransfer.setData('text/plain', carta.id);
                e.dataTransfer.effectAllowed = 'move';
            });

            el.addEventListener('dragend', () => {
                el.classList.remove('arrastrando');
                datosArrastre = null;
                limpiarResaltadosDestino();
            });

            // Clic simple
            el.addEventListener('click', (e) => {
                e.stopPropagation();
                manejarClicEnCarta(carta, infoOrigen);
            });

            // Doble clic para auto-mover
            el.addEventListener('dblclick', (e) => {
                e.stopPropagation();
                intentarMovimientoAutomatico(carta, infoOrigen);
            });
        }

        return el;
    }

    function limpiarResaltadosDestino() {
        document.querySelectorAll('.zona-destino').forEach(el => el.classList.remove('zona-destino'));
    }

    function renderizar() {
        // 1. Renderizar Mazo de robo
        dom.mazo.classList.toggle('vacio', estado.mazo.length === 0);
        dom.mazo.innerHTML = '';
        if (estado.mazo.length === 0) {
            dom.mazo.innerHTML = `
                <svg class="icono-recargar-mazo" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21.5 2v6h-6"></path>
                    <path d="M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.19"></path>
                </svg>
            `;
        } else {
            const cartaMazo = document.createElement('div');
            cartaMazo.className = 'carta boca-abajo';
            cartaMazo.style.top = '0';
            cartaMazo.style.left = '0';
            dom.mazo.appendChild(cartaMazo);
        }

        // 2. Renderizar Montón de Descarte
        dom.descarte.innerHTML = '';
        if (estado.dificultad === 'dificil') {
            dom.descarte.classList.add('descarte-modo-tres');
            if (estado.descarte.length > 0) {
                const total = estado.descarte.length;
                const inicio = Math.max(0, total - 3);
                const cartasVisibles = estado.descarte.slice(inicio);

                cartasVisibles.forEach((carta, idx) => {
                    const esSuperior = (idx === cartasVisibles.length - 1);
                    const elCarta = crearElementoCarta(carta, { tipo: 'descarte' });
                    elCarta.classList.add('carta-descarte-abanico', `carta-descarte-abanico-${idx}`);
                    if (!esSuperior) {
                        elCarta.draggable = false;
                        elCarta.style.pointerEvents = 'none';
                    }
                    dom.descarte.appendChild(elCarta);
                });
            }
        } else {
            dom.descarte.classList.remove('descarte-modo-tres');
            if (estado.descarte.length > 0) {
                const cartaSuperior = estado.descarte[estado.descarte.length - 1];
                const elCarta = crearElementoCarta(cartaSuperior, { tipo: 'descarte' });
                dom.descarte.appendChild(elCarta);
            }
        }

        // 3. Renderizar las 4 Fundaciones
        for (let i = 0; i < 4; i++) {
            const casillaFundacion = dom.fundaciones[i];
            const marcaAgua = casillaFundacion.querySelector('.marca-agua-casilla');
            casillaFundacion.innerHTML = '';
            casillaFundacion.appendChild(marcaAgua);

            const cartas = estado.fundaciones[i];
            if (cartas.length > 0) {
                const cartaSuperior = cartas[cartas.length - 1];
                const elCarta = crearElementoCarta(cartaSuperior, { tipo: 'fundacion', indiceFundacion: i });
                casillaFundacion.appendChild(elCarta);
            }
        }

        // 4. Renderizar las 7 Columnas del Tablero
        const desplazamiento = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--desplazamiento-tablero')) || 28;

        for (let c = 0; c < 7; c++) {
            const casillaColumna = dom.tableros[c];
            casillaColumna.innerHTML = '<div class="casilla-carta casilla-tablero"></div>';
            const cartas = estado.tablero[c];

            cartas.forEach((carta, idx) => {
                const elCarta = crearElementoCarta(carta, { tipo: 'tablero', indiceColumna: c, indiceCarta: idx });
                elCarta.style.top = `${idx * desplazamiento}px`;
                elCarta.style.zIndex = idx + 1;

                if (elementoSeleccionado && elementoSeleccionado.tipo === 'tablero' && elementoSeleccionado.indiceColumna === c && idx >= elementoSeleccionado.indiceCarta) {
                    elCarta.classList.add('seleccionada');
                }

                casillaColumna.appendChild(elCarta);
            });
        }
    }

    // --- Configurar Zonas para Soltar Cartas (Drop Targets) ---
    function configurarZonasSoltado() {
        // Fundaciones
        dom.fundaciones.forEach((casillaF, indiceF) => {
            casillaF.addEventListener('dragover', (e) => {
                e.preventDefault();
                if (datosArrastre && puedeMoverAFundacion(datosArrastre.carta, indiceF)) {
                    casillaF.classList.add('zona-destino');
                }
            });

            casillaF.addEventListener('dragleave', () => {
                casillaF.classList.remove('zona-destino');
            });

            casillaF.addEventListener('drop', (e) => {
                e.preventDefault();
                limpiarResaltadosDestino();
                if (datosArrastre && puedeMoverAFundacion(datosArrastre.carta, indiceF)) {
                    ejecutarMovimiento(datosArrastre.origen, { tipo: 'fundacion', indiceFundacion: indiceF });
                }
            });

            casillaF.addEventListener('click', () => {
                manejarClicEnCasillaVacia({ tipo: 'fundacion', indiceFundacion: indiceF });
            });
        });

        // Columnas del tablero
        dom.tableros.forEach((columnaEl, indiceCol) => {
            columnaEl.addEventListener('dragover', (e) => {
                e.preventDefault();
                if (datosArrastre && puedeMoverATablero(datosArrastre.carta, indiceCol)) {
                    columnaEl.classList.add('zona-destino');
                }
            });

            columnaEl.addEventListener('dragleave', () => {
                columnaEl.classList.remove('zona-destino');
            });

            columnaEl.addEventListener('drop', (e) => {
                e.preventDefault();
                limpiarResaltadosDestino();
                if (datosArrastre && puedeMoverATablero(datosArrastre.carta, indiceCol)) {
                    ejecutarMovimiento(datosArrastre.origen, { tipo: 'tablero', indiceColumna: indiceCol });
                }
            });

            columnaEl.addEventListener('click', (e) => {
                if (e.target === columnaEl || e.target.classList.contains('casilla-tablero')) {
                    manejarClicEnCasillaVacia({ tipo: 'tablero', indiceColumna: indiceCol });
                }
            });
        });
    }

    // --- Comprobación de Estado: Victoria y Auto-completar ---
    function comprobarEstadoJuego() {
        // Comprobar si las 4 fundaciones están completas (52 cartas en total)
        const totalCartasFundaciones = estado.fundaciones.reduce((total, f) => total + f.length, 0);
        if (totalCartasFundaciones === 52) {
            activarVictoria();
            return;
        }

        // Comprobar si se puede autocompletar: mazo y descarte vacíos, y todas las cartas del tablero descubiertas
        if (estado.mazo.length === 0 && estado.descarte.length === 0) {
            const todasDescubiertas = estado.tablero.every(col => col.every(carta => carta.bocaArriba));
            if (todasDescubiertas && !estado.partidaGanada && !estaAutocompletando) {
                dom.bannerAutocompletar.style.display = 'inline-flex';
            } else {
                dom.bannerAutocompletar.style.display = 'none';
            }
        } else {
            dom.bannerAutocompletar.style.display = 'none';
        }
    }

    // Rutina de Auto-completar
    function autocompletar() {
        if (estaAutocompletando) return;
        estaAutocompletando = true;
        dom.bannerAutocompletar.style.display = 'none';

        const paso = () => {
            let seMovio = false;
            for (let c = 0; c < 7; c++) {
                const col = estado.tablero[c];
                if (col.length > 0) {
                    const cartaSuperior = col[col.length - 1];
                    const indiceFundacion = buscarFundacionParaCarta(cartaSuperior);
                    if (indiceFundacion !== -1) {
                        ejecutarMovimiento(
                            { tipo: 'tablero', indiceColumna: c, indiceCarta: col.length - 1 },
                            { tipo: 'fundacion', indiceFundacion }
                        );
                        seMovio = true;
                        break;
                    }
                }
            }

            if (seMovio && !estado.partidaGanada) {
                setTimeout(paso, 140);
            } else {
                estaAutocompletando = false;
            }
        };

        paso();
    }

    function activarVictoria() {
        estado.partidaGanada = true;
        detenerTemporizador();

        dom.victoriaTiempo.textContent = formatearTiempo(estado.tiempoTranscurrido);
        dom.victoriaMovimientos.textContent = estado.movimientos;
        dom.victoriaPuntuacion.textContent = estado.puntuacion + 500;

        dom.modalVictoria.classList.add('activo');
    }

    // --- Sistema de Pistas ---
    function obtenerPista() {
        document.querySelectorAll('.resaltada-pista').forEach(el => el.classList.remove('resaltada-pista'));
        document.querySelectorAll('.resaltada-destino').forEach(el => el.classList.remove('resaltada-destino'));

        // 1. Prioridad: Mover a Fundaciones (desde Tablero o Descarte)
        for (let c = 0; c < 7; c++) {
            const col = estado.tablero[c];
            if (col.length > 0) {
                const carta = col[col.length - 1];
                const idxF = buscarFundacionParaCarta(carta);
                if (idxF !== -1) {
                    resaltarPista(
                        { tipo: 'tablero', indiceColumna: c, indiceCarta: col.length - 1 },
                        { tipo: 'fundacion', indiceFundacion: idxF },
                        `Mueve el ${carta.nombreCarta} a su base`
                    );
                    return;
                }
            }
        }

        if (estado.descarte.length > 0) {
            const carta = estado.descarte[estado.descarte.length - 1];
            const idxF = buscarFundacionParaCarta(carta);
            if (idxF !== -1) {
                resaltarPista(
                    { tipo: 'descarte' },
                    { tipo: 'fundacion', indiceFundacion: idxF },
                    `Mueve el ${carta.nombreCarta} del descarte a su base`
                );
                return;
            }
        }

        // 2. Mover en Tablero para descubrir cartas ocultas
        for (let cOrigen = 0; cOrigen < 7; cOrigen++) {
            const colOrigen = estado.tablero[cOrigen];
            if (colOrigen.length === 0) continue;

            let primerIdxVisible = -1;
            for (let i = 0; i < colOrigen.length; i++) {
                if (colOrigen[i].bocaArriba) {
                    primerIdxVisible = i;
                    break;
                }
            }
            if (primerIdxVisible <= 0) continue;

            const cartaBase = colOrigen[primerIdxVisible];
            for (let cDest = 0; cDest < 7; cDest++) {
                if (cDest === cOrigen) continue;
                if (puedeMoverATablero(cartaBase, cDest)) {
                    const colDest = estado.tablero[cDest];
                    const nombreDest = colDest.length > 0 ? colDest[colDest.length - 1].nombreCarta : 'columna vacía';
                    resaltarPista(
                        { tipo: 'tablero', indiceColumna: cOrigen, indiceCarta: primerIdxVisible },
                        { tipo: 'tablero', indiceColumna: cDest },
                        `Mueve ${cartaBase.nombreCarta} a ${nombreDest} para liberar una carta oculta`
                    );
                    return;
                }
            }
        }

        // 3. Mover de Descarte a Tablero
        if (estado.descarte.length > 0) {
            const carta = estado.descarte[estado.descarte.length - 1];
            for (let cDest = 0; cDest < 7; cDest++) {
                if (puedeMoverATablero(carta, cDest)) {
                    const colDest = estado.tablero[cDest];
                    const nombreDest = colDest.length > 0 ? colDest[colDest.length - 1].nombreCarta : 'columna vacía';
                    resaltarPista(
                        { tipo: 'descarte' },
                        { tipo: 'tablero', indiceColumna: cDest },
                        `Mueve ${carta.nombreCarta} del descarte a ${nombreDest}`
                    );
                    return;
                }
            }
        }

        // 4. Cualquier otro movimiento válido entre columnas
        for (let cOrigen = 0; cOrigen < 7; cOrigen++) {
            const colOrigen = estado.tablero[cOrigen];
            if (colOrigen.length === 0) continue;

            let primerIdxVisible = -1;
            for (let i = 0; i < colOrigen.length; i++) {
                if (colOrigen[i].bocaArriba) {
                    primerIdxVisible = i;
                    break;
                }
            }
            if (primerIdxVisible === -1) continue;

            const cartaBase = colOrigen[primerIdxVisible];
            if (primerIdxVisible === 0 && cartaBase.valor === 13) continue;

            for (let cDest = 0; cDest < 7; cDest++) {
                if (cDest === cOrigen) continue;
                if (puedeMoverATablero(cartaBase, cDest)) {
                    const colDest = estado.tablero[cDest];
                    const nombreDest = colDest.length > 0 ? colDest[colDest.length - 1].nombreCarta : 'columna vacía';
                    resaltarPista(
                        { tipo: 'tablero', indiceColumna: cOrigen, indiceCarta: primerIdxVisible },
                        { tipo: 'tablero', indiceColumna: cDest },
                        `Mueve ${cartaBase.nombreCarta} sobre ${nombreDest}`
                    );
                    return;
                }
            }
        }

        // 5. Sugerir robar del mazo o reciclar
        if (estado.mazo.length > 0) {
            dom.mazo.classList.add('resaltada-destino');
            mostrarNotificacion('Roba una carta del mazo para encontrar nuevas opciones');
            setTimeout(() => dom.mazo.classList.remove('resaltada-destino'), 2500);
            return;
        } else if (estado.descarte.length > 0) {
            dom.mazo.classList.add('resaltada-destino');
            mostrarNotificacion('Pasa de nuevo el mazo para revisar las cartas del descarte');
            setTimeout(() => dom.mazo.classList.remove('resaltada-destino'), 2500);
            return;
        }

        mostrarNotificacion('No hay movimientos sugeridos en este momento');
    }

    function resaltarPista(origen, destino, mensaje) {
        let elOrigen = null;
        if (origen.tipo === 'tablero') {
            const col = dom.tableros[origen.indiceColumna];
            const cartas = col.querySelectorAll('.carta');
            if (cartas[origen.indiceCarta]) elOrigen = cartas[origen.indiceCarta];
        } else if (origen.tipo === 'descarte') {
            const cartas = dom.descarte.querySelectorAll('.carta');
            if (cartas.length > 0) elOrigen = cartas[cartas.length - 1];
        }

        let elDestino = null;
        if (destino.tipo === 'fundacion') {
            elDestino = dom.fundaciones[destino.indiceFundacion];
        } else if (destino.tipo === 'tablero') {
            const col = dom.tableros[destino.indiceColumna];
            const cartas = col.querySelectorAll('.carta');
            elDestino = cartas.length > 0 ? cartas[cartas.length - 1] : col.querySelector('.casilla-tablero');
        }

        if (elOrigen) elOrigen.classList.add('resaltada-pista');
        if (elDestino) elDestino.classList.add('resaltada-destino');

        mostrarNotificacion(mensaje);

        setTimeout(() => {
            if (elOrigen) elOrigen.classList.remove('resaltada-pista');
            if (elDestino) elDestino.classList.remove('resaltada-destino');
        }, 2800);
    }

    // --- Control de Pantalla de Dificultad ---
    function abrirPantallaDificultad(permitirCancelar = false) {
        dificultadSeleccionadaEnPantalla = estado.dificultad;
        dom.tarjetasDificultad.forEach(t => {
            t.classList.toggle('seleccionada', t.dataset.dificultad === estado.dificultad);
        });
        dom.btnCerrarPantallaDificultad.style.display = permitirCancelar ? 'inline-block' : 'none';
        dom.pantallaDificultad.classList.add('activa');
    }

    function cerrarPantallaDificultad() {
        dom.pantallaDificultad.classList.remove('activa');
    }

    // --- Enlace de Eventos Generales ---
    function configurarEscuchadoresEventos() {
        dom.mazo.addEventListener('click', alHacerClicEnMazo);

        dom.btnDeshacer.addEventListener('click', deshacer);

        dom.btnReiniciar.addEventListener('click', () => {
            if (confirm('¿Deseas reiniciar la misma partida?')) {
                iniciarPartida(instantaneaBarajaInicial);
                mostrarNotificacion('Partida reiniciada');
            }
        });

        dom.btnNuevaPartida.addEventListener('click', () => {
            iniciarPartida();
            mostrarNotificacion('Nueva partida iniciada');
        });

        dom.btnPista.addEventListener('click', obtenerPista);

        dom.btnDificultad.addEventListener('click', () => {
            abrirPantallaDificultad(true);
        });

        // Selector de dificultad en la pantalla inicial
        dom.tarjetasDificultad.forEach(tarjeta => {
            tarjeta.addEventListener('click', () => {
                dom.tarjetasDificultad.forEach(t => t.classList.remove('seleccionada'));
                tarjeta.classList.add('seleccionada');
                dificultadSeleccionadaEnPantalla = tarjeta.dataset.dificultad;
            });

            // Doble clic para iniciar de inmediato
            tarjeta.addEventListener('dblclick', () => {
                const nombresDificultad = { facil: 'Fácil', medio: 'Medio', dificil: 'Difícil' };
                dificultadSeleccionadaEnPantalla = tarjeta.dataset.dificultad;
                cerrarPantallaDificultad();
                iniciarPartida(null, dificultadSeleccionadaEnPantalla);
                mostrarNotificacion(`Partida iniciada en nivel ${nombresDificultad[dificultadSeleccionadaEnPantalla] || 'Fácil'}`);
            });
        });

        dom.btnComenzarJuego.addEventListener('click', () => {
            const nombresDificultad = { facil: 'Fácil', medio: 'Medio', dificil: 'Difícil' };
            cerrarPantallaDificultad();
            iniciarPartida(null, dificultadSeleccionadaEnPantalla);
            mostrarNotificacion(`Partida iniciada en nivel ${nombresDificultad[dificultadSeleccionadaEnPantalla] || 'Fácil'}`);
        });

        dom.btnCerrarPantallaDificultad.addEventListener('click', cerrarPantallaDificultad);

        dom.btnVictoriaCambiarDificultad.addEventListener('click', () => {
            dom.modalVictoria.classList.remove('activo');
            abrirPantallaDificultad(false);
        });

        dom.btnVictoriaNuevaPartida.addEventListener('click', () => {
            dom.modalVictoria.classList.remove('activo');
            iniciarPartida();
        });

        dom.bannerAutocompletar.addEventListener('click', autocompletar);

        // Deseleccionar al hacer clic fuera de las cartas
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.carta') && !e.target.closest('.casilla-carta') && !e.target.closest('.columna-tablero')) {
                if (elementoSeleccionado) {
                    elementoSeleccionado = null;
                    renderizar();
                }
            }
        });

        // Atajos de teclado: Ctrl+Z para Deshacer, N para Nueva partida, P para Pista, D para Dificultad
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
                e.preventDefault();
                deshacer();
            } else if (e.key.toLowerCase() === 'n' && !e.ctrlKey) {
                iniciarPartida();
            } else if (e.key.toLowerCase() === 'p' && !e.ctrlKey) {
                obtenerPista();
            } else if (e.key.toLowerCase() === 'd' && !e.ctrlKey) {
                abrirPantallaDificultad(true);
            }
        });
    }

    // --- Inicio del Juego ---
    configurarZonasSoltado();
    configurarEscuchadoresEventos();
    // La pantalla de inicio aparece activa al cargar para que el jugador elija la dificultad
    iniciarPartida(null, 'facil');

    // Exportar para acceso o depuración
    window.Solitario = {
        estado,
        iniciarPartida,
        deshacer,
        autocompletar,
        activarVictoria,
        obtenerPista,
        abrirPantallaDificultad,
        MotorSolucionador
    };

})();

