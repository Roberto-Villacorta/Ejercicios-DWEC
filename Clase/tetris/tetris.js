//-------------------------------------------------------------------------
// Funciones auxiliares base
//-------------------------------------------------------------------------

function obtenerElemento(identificador) {
  return document.getElementById(identificador);
}

function ocultarElemento(identificador) {
  obtenerElemento(identificador).style.visibility = 'hidden';
}

function mostrarElemento(identificador) {
  obtenerElemento(identificador).style.visibility = null;
}

function asignarHtml(identificador, contenidoHtml) {
  obtenerElemento(identificador).innerHTML = contenidoHtml;
}

function obtenerMarcaTiempo() {
  return new Date().getTime();
}

function obtenerAleatorio(minimo, maximo) {
  return minimo + (Math.random() * (maximo - minimo));
}

function elegirAleatorio(opciones) {
  return opciones[Math.round(obtenerAleatorio(0, opciones.length - 1))];
}

if (!window.requestAnimationFrame) {
  window.requestAnimationFrame = window.webkitRequestAnimationFrame ||
                                 window.mozRequestAnimationFrame    ||
                                 window.oRequestAnimationFrame      ||
                                 window.msRequestAnimationFrame     ||
                                 function(retrollamada, elemento) {
                                   window.setTimeout(retrollamada, 1000 / 60);
                                 };
}

//-------------------------------------------------------------------------
// Constantes del juego
//-------------------------------------------------------------------------

var TECLAS = {
  ESCAPE: 27,
  ESPACIO: 32,
  IZQUIERDA: 37,
  ARRIBA: 38,
  DERECHA: 39,
  ABAJO: 40
};

var DIRECCIONES = {
  ARRIBA: 0,
  DERECHA: 1,
  ABAJO: 2,
  IZQUIERDA: 3,
  MIN: 0,
  MAX: 3
};

var instanciaEstadisticas = new Estadisticas();
var lienzoPrincipal       = obtenerElemento('lienzo-juego');
var contextoLienzo        = lienzoPrincipal.getContext('2d');
var lienzoSiguiente       = obtenerElemento('lienzo-siguiente');
var contextoSiguiente     = lienzoSiguiente.getContext('2d');

var configuracionVelocidad = {
  inicial: 0.6,    // Segundos antes de que la pieza caiga 1 fila
  decremento: 0.005,
  minima: 0.1
};

var columnasTablero   = 10; // Ancho del tablero en bloques
var filasTablero      = 20; // Alto del tablero en bloques
var tamanoVistaPrevia = 5;  // Tamaño del visor de la siguiente pieza en bloques

//-------------------------------------------------------------------------
// Variables del juego (inicializadas durante el reinicio)
//-------------------------------------------------------------------------

var anchoBloque;                // Ancho en píxeles de cada bloque
var altoBloque;                 // Alto en píxeles de cada bloque
var matrizTablero;              // Matriz bidimensional del tablero de bloques
var colaAcciones;               // Cola de movimientos introducidos por el usuario
var enPartida;                  // Booleano: verdadero si la partida está en curso
var tiempoAcumulado;            // Tiempo transcurrido para la caída
var piezaActual;                // La pieza activa que cae actualmente
var piezaSiguiente;             // La próxima pieza que aparecerá
var puntuacionActual;           // Puntuación actual
var puntuacionVisual;           // Puntuación mostrada en pantalla con efecto gradual
var filasCompletadas;           // Filas eliminadas en la partida
var intervaloCaida;             // Tiempo restante antes de que la pieza descienda

//-------------------------------------------------------------------------
// Piezas del Tetris (Tetrominoes)
// Cada elemento en 'bloques' representa una rotación de la pieza
// en una máscara hexadecimal de 16 bits en cuadrícula de 4x4
//-------------------------------------------------------------------------

var piezaI = { tamano: 4, bloques: [0x0F00, 0x2222, 0x00F0, 0x4444], color: 'cyan'   };
var piezaJ = { tamano: 3, bloques: [0x44C0, 0x8E00, 0x6440, 0x0E20], color: 'blue'   };
var piezaL = { tamano: 3, bloques: [0x4460, 0x0E80, 0xC440, 0x2E00], color: 'orange' };
var piezaO = { tamano: 2, bloques: [0xCC00, 0xCC00, 0xCC00, 0xCC00], color: 'yellow' };
var piezaS = { tamano: 3, bloques: [0x06C0, 0x8C40, 0x6C00, 0x4620], color: 'green'  };
var piezaT = { tamano: 3, bloques: [0x0E40, 0x4C40, 0x4E00, 0x4640], color: 'purple' };
var piezaZ = { tamano: 3, bloques: [0x0C60, 0x4C80, 0xC600, 0x2640], color: 'red'    };

//-------------------------------------------------------------------------
// Manipulación de bits para recorrer cada bloque ocupado de una pieza
//-------------------------------------------------------------------------

function recorrerBloquesPieza(tipoPieza, posicionX, posicionY, direccion, callback) {
  var mascaraBit, fila = 0, columna = 0, mascaraBloques = tipoPieza.bloques[direccion];
  for (mascaraBit = 0x8000; mascaraBit > 0; mascaraBit = mascaraBit >> 1) {
    if (mascaraBloques & mascaraBit) {
      callback(posicionX + columna, posicionY + fila);
    }
    if (++columna === 4) {
      columna = 0;
      ++fila;
    }
  }
}

//-------------------------------------------------------------------------
// Comprobación de límites y colisiones en la cuadrícula
//-------------------------------------------------------------------------

function estaCasillaOcupada(tipoPieza, posicionX, posicionY, direccion) {
  var estaOcupado = false;
  recorrerBloquesPieza(tipoPieza, posicionX, posicionY, direccion, function(bloqueX, bloqueY) {
    if ((bloqueX < 0) || (bloqueX >= columnasTablero) || (bloqueY < 0) || (bloqueY >= filasTablero) || obtenerBloque(bloqueX, bloqueY)) {
      estaOcupado = true;
    }
  });
  return estaOcupado;
}

function estaCasillaLibre(tipoPieza, posicionX, posicionY, direccion) {
  return !estaCasillaOcupada(tipoPieza, posicionX, posicionY, direccion);
}

//-------------------------------------------------------------------------
// Generación aleatoria con bolsa de piezas
//-------------------------------------------------------------------------

var bolsaPiezas = [];

function generarPiezaAleatoria() {
  if (bolsaPiezas.length === 0) {
    bolsaPiezas = [
      piezaI, piezaI, piezaI, piezaI,
      piezaJ, piezaJ, piezaJ, piezaJ,
      piezaL, piezaL, piezaL, piezaL,
      piezaO, piezaO, piezaO, piezaO,
      piezaS, piezaS, piezaS, piezaS,
      piezaT, piezaT, piezaT, piezaT,
      piezaZ, piezaZ, piezaZ, piezaZ
    ];
  }
  var tipoElegido = bolsaPiezas.splice(Math.round(obtenerAleatorio(0, bolsaPiezas.length - 1)), 1)[0];
  return {
    tipo: tipoElegido,
    direccion: DIRECCIONES.ARRIBA,
    posicionX: Math.round(obtenerAleatorio(0, columnasTablero - tipoElegido.tamano)),
    posicionY: 0
  };
}

//-------------------------------------------------------------------------
// Bucle principal de juego (Game loop)
//-------------------------------------------------------------------------

function iniciarJuego() {
  mostrarEstadisticas();
  configurarEventos();

  var tiempoAnterior = obtenerMarcaTiempo();
  var tiempoActual = tiempoAnterior;

  function cicloAnimacion() {
    tiempoActual = obtenerMarcaTiempo();
    actualizarEstadoJuego(Math.min(1, (tiempoActual - tiempoAnterior) / 1000.0));
    renderizarJuego();
    if (instanciaEstadisticas && typeof instanciaEstadisticas.actualizar === 'function') {
      instanciaEstadisticas.actualizar();
    }
    tiempoAnterior = tiempoActual;
    requestAnimationFrame(cicloAnimacion, lienzoPrincipal);
  }

  ajustarDimensiones();
  reiniciarPartida();
  cicloAnimacion();
}

function mostrarEstadisticas() {
  if (instanciaEstadisticas && instanciaEstadisticas.elementoDom) {
    instanciaEstadisticas.elementoDom.id = 'estadisticas-fps';
    obtenerElemento('menu-lateral').appendChild(instanciaEstadisticas.elementoDom);
  }
}

function configurarEventos() {
  document.addEventListener('keydown', manejarTeclaPulsada, false);
  window.addEventListener('resize', ajustarDimensiones, false);
}

function ajustarDimensiones(evento) {
  lienzoPrincipal.width   = lienzoPrincipal.clientWidth;
  lienzoPrincipal.height  = lienzoPrincipal.clientHeight;
  lienzoSiguiente.width   = lienzoSiguiente.clientWidth;
  lienzoSiguiente.height  = lienzoSiguiente.clientHeight;
  anchoBloque = lienzoPrincipal.width  / columnasTablero;
  altoBloque  = lienzoPrincipal.height / filasTablero;
  marcarRedibujadoTablero();
  marcarRedibujadoSiguiente();
}

function manejarTeclaPulsada(eventoTeclado) {
  var teclaProcesada = false;
  if (enPartida) {
    switch (eventoTeclado.keyCode) {
      case TECLAS.IZQUIERDA:
        colaAcciones.push(DIRECCIONES.IZQUIERDA);
        teclaProcesada = true;
        break;
      case TECLAS.DERECHA:
        colaAcciones.push(DIRECCIONES.DERECHA);
        teclaProcesada = true;
        break;
      case TECLAS.ARRIBA:
        colaAcciones.push(DIRECCIONES.ARRIBA);
        teclaProcesada = true;
        break;
      case TECLAS.ABAJO:
        colaAcciones.push(DIRECCIONES.ABAJO);
        teclaProcesada = true;
        break;
      case TECLAS.ESCAPE:
        finalizarPartida();
        teclaProcesada = true;
        break;
    }
  } else if (eventoTeclado.keyCode === TECLAS.ESPACIO) {
    comenzarPartida();
    teclaProcesada = true;
  }
  if (teclaProcesada) {
    eventoTeclado.preventDefault();
  }
}

//-------------------------------------------------------------------------
// Lógica interna del juego
//-------------------------------------------------------------------------

function comenzarPartida() {
  ocultarElemento('enlace-iniciar');
  reiniciarPartida();
  enPartida = true;
}

function finalizarPartida() {
  mostrarElemento('enlace-iniciar');
  actualizarPuntuacionVisual();
  enPartida = false;
}

function actualizarPuntuacionVisual(puntos) {
  puntuacionVisual = puntos || puntuacionActual;
  marcarRedibujadoPuntuacion();
}

function asignarPuntuacion(puntos) {
  puntuacionActual = puntos;
  actualizarPuntuacionVisual(puntos);
}

function sumarPuntuacion(puntos) {
  puntuacionActual = puntuacionActual + puntos;
}

function reiniciarPuntuacion() {
  asignarPuntuacion(0);
}

function reiniciarFilas() {
  asignarFilas(0);
}

function asignarFilas(cantidadFilas) {
  filasCompletadas = cantidadFilas;
  intervaloCaida = Math.max(
    configuracionVelocidad.minima,
    configuracionVelocidad.inicial - (configuracionVelocidad.decremento * filasCompletadas)
  );
  marcarRedibujadoFilas();
}

function sumarFilas(cantidadFilas) {
  asignarFilas(filasCompletadas + cantidadFilas);
}

function obtenerBloque(posicionX, posicionY) {
  return (matrizTablero && matrizTablero[posicionX] ? matrizTablero[posicionX][posicionY] : null);
}

function asignarBloque(posicionX, posicionY, tipoPieza) {
  matrizTablero[posicionX] = matrizTablero[posicionX] || [];
  matrizTablero[posicionX][posicionY] = tipoPieza;
  marcarRedibujadoTablero();
}

function vaciarTablero() {
  matrizTablero = [];
  marcarRedibujadoTablero();
}

function limpiarColaAcciones() {
  colaAcciones = [];
}

function establecerPiezaActual(pieza) {
  piezaActual = pieza || generarPiezaAleatoria();
  marcarRedibujadoTablero();
}

function establecerPiezaSiguiente(pieza) {
  piezaSiguiente = pieza || generarPiezaAleatoria();
  marcarRedibujadoSiguiente();
}

function reiniciarPartida() {
  tiempoAcumulado = 0;
  limpiarColaAcciones();
  vaciarTablero();
  reiniciarFilas();
  reiniciarPuntuacion();
  establecerPiezaActual(piezaSiguiente);
  establecerPiezaSiguiente();
}

function actualizarEstadoJuego(deltaSegundos) {
  if (enPartida) {
    if (puntuacionVisual < puntuacionActual) {
      actualizarPuntuacionVisual(puntuacionVisual + 1);
    }
    procesarAccion(colaAcciones.shift());
    tiempoAcumulado = tiempoAcumulado + deltaSegundos;
    if (tiempoAcumulado > intervaloCaida) {
      tiempoAcumulado = tiempoAcumulado - intervaloCaida;
      bajarPieza();
    }
  }
}

function procesarAccion(accion) {
  switch (accion) {
    case DIRECCIONES.IZQUIERDA:
      desplazarPieza(DIRECCIONES.IZQUIERDA);
      break;
    case DIRECCIONES.DERECHA:
      desplazarPieza(DIRECCIONES.DERECHA);
      break;
    case DIRECCIONES.ARRIBA:
      rotarPieza();
      break;
    case DIRECCIONES.ABAJO:
      bajarPieza();
      break;
  }
}

function desplazarPieza(direccion) {
  var nuevaPosX = piezaActual.posicionX;
  var nuevaPosY = piezaActual.posicionY;

  switch (direccion) {
    case DIRECCIONES.DERECHA:
      nuevaPosX = nuevaPosX + 1;
      break;
    case DIRECCIONES.IZQUIERDA:
      nuevaPosX = nuevaPosX - 1;
      break;
    case DIRECCIONES.ABAJO:
      nuevaPosY = nuevaPosY + 1;
      break;
  }

  if (estaCasillaLibre(piezaActual.tipo, nuevaPosX, nuevaPosY, piezaActual.direccion)) {
    piezaActual.posicionX = nuevaPosX;
    piezaActual.posicionY = nuevaPosY;
    marcarRedibujadoTablero();
    return true;
  } else {
    return false;
  }
}

function rotarPieza() {
  var nuevaDireccion = (piezaActual.direccion === DIRECCIONES.MAX ? DIRECCIONES.MIN : piezaActual.direccion + 1);
  if (estaCasillaLibre(piezaActual.tipo, piezaActual.posicionX, piezaActual.posicionY, nuevaDireccion)) {
    piezaActual.direccion = nuevaDireccion;
    marcarRedibujadoTablero();
  }
}

function bajarPieza() {
  if (!desplazarPieza(DIRECCIONES.ABAJO)) {
    sumarPuntuacion(10);
    fijarPiezaEnTablero();
    limpiarLineasCompletas();
    establecerPiezaActual(piezaSiguiente);
    establecerPiezaSiguiente(generarPiezaAleatoria());
    limpiarColaAcciones();
    if (estaCasillaOcupada(piezaActual.tipo, piezaActual.posicionX, piezaActual.posicionY, piezaActual.direccion)) {
      finalizarPartida();
    }
  }
}

function fijarPiezaEnTablero() {
  recorrerBloquesPieza(piezaActual.tipo, piezaActual.posicionX, piezaActual.posicionY, piezaActual.direccion, function(bloqueX, bloqueY) {
    asignarBloque(bloqueX, bloqueY, piezaActual.tipo);
  });
}

function limpiarLineasCompletas() {
  var columna, fila, filaCompleta, totalLineasEliminadas = 0;
  for (fila = filasTablero; fila > 0; --fila) {
    filaCompleta = true;
    for (columna = 0; columna < columnasTablero; ++columna) {
      if (!obtenerBloque(columna, fila)) {
        filaCompleta = false;
      }
    }
    if (filaCompleta) {
      eliminarLinea(fila);
      fila = fila + 1; // Volver a evaluar la misma fila
      totalLineasEliminadas++;
    }
  }
  if (totalLineasEliminadas > 0) {
    sumarFilas(totalLineasEliminadas);
    sumarPuntuacion(100 * Math.pow(2, totalLineasEliminadas - 1)); // 1: 100, 2: 200, 3: 400, 4: 800
  }
}

function eliminarLinea(filaObjetivo) {
  var columna, fila;
  for (fila = filaObjetivo; fila >= 0; --fila) {
    for (columna = 0; columna < columnasTablero; ++columna) {
      asignarBloque(columna, fila, (fila === 0) ? null : obtenerBloque(columna, fila - 1));
    }
  }
}

//-------------------------------------------------------------------------
// Renderizado y dibujo en Canvas
//-------------------------------------------------------------------------

var elementosPendientesRedibujado = {};

function marcarRedibujadoTablero()    { elementosPendientesRedibujado.tablero    = true; }
function marcarRedibujadoSiguiente()  { elementosPendientesRedibujado.siguiente  = true; }
function marcarRedibujadoPuntuacion() { elementosPendientesRedibujado.puntuacion = true; }
function marcarRedibujadoFilas()      { elementosPendientesRedibujado.filas      = true; }

function renderizarJuego() {
  contextoLienzo.save();
  contextoLienzo.lineWidth = 1;
  contextoLienzo.translate(0.5, 0.5); // Líneas nítidas de 1px
  dibujarTablero();
  dibujarPiezaSiguiente();
  dibujarPuntuacion();
  dibujarFilas();
  contextoLienzo.restore();
}

function dibujarTablero() {
  if (elementosPendientesRedibujado.tablero) {
    contextoLienzo.clearRect(0, 0, lienzoPrincipal.width, lienzoPrincipal.height);
    if (enPartida) {
      dibujarPieza(contextoLienzo, piezaActual.tipo, piezaActual.posicionX, piezaActual.posicionY, piezaActual.direccion);
    }
    var columna, fila, bloqueTablero;
    for (fila = 0; fila < filasTablero; fila++) {
      for (columna = 0; columna < columnasTablero; columna++) {
        bloqueTablero = obtenerBloque(columna, fila);
        if (bloqueTablero) {
          dibujarBloque(contextoLienzo, columna, fila, bloqueTablero.color);
        }
      }
    }
    contextoLienzo.strokeRect(0, 0, columnasTablero * anchoBloque - 1, filasTablero * altoBloque - 1);
    elementosPendientesRedibujado.tablero = false;
  }
}

function dibujarPiezaSiguiente() {
  if (elementosPendientesRedibujado.siguiente) {
    var margenCentrado = (tamanoVistaPrevia - piezaSiguiente.tipo.tamano) / 2;
    contextoSiguiente.save();
    contextoSiguiente.translate(0.5, 0.5);
    contextoSiguiente.clearRect(0, 0, tamanoVistaPrevia * anchoBloque, tamanoVistaPrevia * altoBloque);
    dibujarPieza(contextoSiguiente, piezaSiguiente.tipo, margenCentrado, margenCentrado, piezaSiguiente.direccion);
    contextoSiguiente.strokeStyle = 'black';
    contextoSiguiente.strokeRect(0, 0, tamanoVistaPrevia * anchoBloque - 1, tamanoVistaPrevia * altoBloque - 1);
    contextoSiguiente.restore();
    elementosPendientesRedibujado.siguiente = false;
  }
}

function dibujarPuntuacion() {
  if (elementosPendientesRedibujado.puntuacion) {
    asignarHtml('marcador-puntuacion', ("00000" + Math.floor(puntuacionVisual)).slice(-5));
    elementosPendientesRedibujado.puntuacion = false;
  }
}

function dibujarFilas() {
  if (elementosPendientesRedibujado.filas) {
    asignarHtml('marcador-filas', filasCompletadas);
    elementosPendientesRedibujado.filas = false;
  }
}

function dibujarPieza(contexto, tipoPieza, posX, posY, direccion) {
  recorrerBloquesPieza(tipoPieza, posX, posY, direccion, function(bloqueX, bloqueY) {
    dibujarBloque(contexto, bloqueX, bloqueY, tipoPieza.color);
  });
}

function dibujarBloque(contexto, bloqueX, bloqueY, colorRelleno) {
  contexto.fillStyle = colorRelleno;
  contexto.fillRect(bloqueX * anchoBloque, bloqueY * altoBloque, anchoBloque, altoBloque);
  contexto.strokeRect(bloqueX * anchoBloque, bloqueY * altoBloque, anchoBloque, altoBloque);
}

//-------------------------------------------------------------------------
// Inicio de la ejecución
//-------------------------------------------------------------------------

iniciarJuego();

