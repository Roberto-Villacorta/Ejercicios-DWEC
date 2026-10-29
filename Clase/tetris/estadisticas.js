// estadisticas.js - Monitor de rendimiento (FPS, MS, MB)
var Estadisticas = function() {
  function trazarGrafica(datosPixeles, alturaGrafica, tipoPanel) {
    var columna, fila, indicePixel;
    for (fila = 0; fila < 30; fila++) {
      for (columna = 0; columna < 73; columna++) {
        indicePixel = (columna + fila * 74) * 4;
        datosPixeles[indicePixel]     = datosPixeles[indicePixel + 4];
        datosPixeles[indicePixel + 1] = datosPixeles[indicePixel + 5];
        datosPixeles[indicePixel + 2] = datosPixeles[indicePixel + 6];
      }
    }
    for (fila = 0; fila < 30; fila++) {
      indicePixel = (73 + fila * 74) * 4;
      if (fila < alturaGrafica) {
        datosPixeles[indicePixel]     = configuracionColores[tipoPanel].fondo.rojo;
        datosPixeles[indicePixel + 1] = configuracionColores[tipoPanel].fondo.verde;
        datosPixeles[indicePixel + 2] = configuracionColores[tipoPanel].fondo.azul;
      } else {
        datosPixeles[indicePixel]     = configuracionColores[tipoPanel].primerPlano.rojo;
        datosPixeles[indicePixel + 1] = configuracionColores[tipoPanel].primerPlano.verde;
        datosPixeles[indicePixel + 2] = configuracionColores[tipoPanel].primerPlano.azul;
      }
    }
  }

  var modoActual = 0;
  var cantidadModos = 2;
  var contenedorElemento;
  var totalFotogramas = 0;
  var tiempoActual = (new Date()).getTime();
  var tiempoPrevio = tiempoActual;
  var tiempoUltimoCalculo = tiempoActual;
  var valorFpsCalculado = 0;
  var valorFpsMinimo = 1000;
  var valorFpsMaximo = 0;
  var panelFps, textoFps, lienzoFps, contextoFps, imagenFps;
  var diferenciaMilisegundos = 0, milisegundosMinimo = 1000, milisegundosMaximo = 0;
  var panelMs, textoMs, lienzoMs, contextoMs, imagenMs;
  var valorMemoriaMb = 0, memoriaMbMinima = 1000, memoriaMbMaxima = 0;
  var panelMb, textoMb, lienzoMb, contextoMb, imagenMb;

  var configuracionColores = {
    fps: { fondo: { rojo: 16, verde: 16, azul: 48 }, primerPlano: { rojo: 0, verde: 255, azul: 255 } },
    ms:  { fondo: { rojo: 16, verde: 48, azul: 16 }, primerPlano: { rojo: 0, verde: 255, azul: 0 } },
    mb:  { fondo: { rojo: 48, verde: 16, azul: 26 }, primerPlano: { rojo: 255, verde: 0, azul: 128 } }
  };

  contenedorElemento = document.createElement("div");
  contenedorElemento.style.cursor = "pointer";
  contenedorElemento.style.width = "80px";
  contenedorElemento.style.opacity = "0.9";
  contenedorElemento.style.zIndex = "10001";

  contenedorElemento.addEventListener("click", function() {
    modoActual++;
    if (modoActual === cantidadModos) {
      modoActual = 0;
    }
    panelFps.style.display = "none";
    panelMs.style.display = "none";
    panelMb.style.display = "none";
    switch (modoActual) {
      case 0: panelFps.style.display = "block"; break;
      case 1: panelMs.style.display = "block"; break;
      case 2: panelMb.style.display = "block"; break;
    }
  }, false);

  // Panel FPS
  panelFps = document.createElement("div");
  panelFps.style.backgroundColor = "rgb(" + Math.floor(configuracionColores.fps.fondo.rojo / 2) + "," + Math.floor(configuracionColores.fps.fondo.verde / 2) + "," + Math.floor(configuracionColores.fps.fondo.azul / 2) + ")";
  panelFps.style.padding = "2px 0px 3px 0px";
  contenedorElemento.appendChild(panelFps);

  textoFps = document.createElement("div");
  textoFps.style.fontFamily = "Helvetica, Arial, sans-serif";
  textoFps.style.textAlign = "left";
  textoFps.style.fontSize = "9px";
  textoFps.style.color = "rgb(" + configuracionColores.fps.primerPlano.rojo + "," + configuracionColores.fps.primerPlano.verde + "," + configuracionColores.fps.primerPlano.azul + ")";
  textoFps.style.margin = "0px 0px 1px 3px";
  textoFps.innerHTML = '<span style="font-weight:bold">FPS</span>';
  panelFps.appendChild(textoFps);

  lienzoFps = document.createElement("canvas");
  lienzoFps.width = 74;
  lienzoFps.height = 30;
  lienzoFps.style.display = "block";
  lienzoFps.style.marginLeft = "3px";
  panelFps.appendChild(lienzoFps);

  contextoFps = lienzoFps.getContext("2d");
  contextoFps.fillStyle = "rgb(" + configuracionColores.fps.fondo.rojo + "," + configuracionColores.fps.fondo.verde + "," + configuracionColores.fps.fondo.azul + ")";
  contextoFps.fillRect(0, 0, lienzoFps.width, lienzoFps.height);
  imagenFps = contextoFps.getImageData(0, 0, lienzoFps.width, lienzoFps.height);

  // Panel MS
  panelMs = document.createElement("div");
  panelMs.style.backgroundColor = "rgb(" + Math.floor(configuracionColores.ms.fondo.rojo / 2) + "," + Math.floor(configuracionColores.ms.fondo.verde / 2) + "," + Math.floor(configuracionColores.ms.fondo.azul / 2) + ")";
  panelMs.style.padding = "2px 0px 3px 0px";
  panelMs.style.display = "none";
  contenedorElemento.appendChild(panelMs);

  textoMs = document.createElement("div");
  textoMs.style.fontFamily = "Helvetica, Arial, sans-serif";
  textoMs.style.textAlign = "left";
  textoMs.style.fontSize = "9px";
  textoMs.style.color = "rgb(" + configuracionColores.ms.primerPlano.rojo + "," + configuracionColores.ms.primerPlano.verde + "," + configuracionColores.ms.primerPlano.azul + ")";
  textoMs.style.margin = "0px 0px 1px 3px";
  textoMs.innerHTML = '<span style="font-weight:bold">MS</span>';
  panelMs.appendChild(textoMs);

  lienzoMs = document.createElement("canvas");
  lienzoMs.width = 74;
  lienzoMs.height = 30;
  lienzoMs.style.display = "block";
  lienzoMs.style.marginLeft = "3px";
  panelMs.appendChild(lienzoMs);

  contextoMs = lienzoMs.getContext("2d");
  contextoMs.fillStyle = "rgb(" + configuracionColores.ms.fondo.rojo + "," + configuracionColores.ms.fondo.verde + "," + configuracionColores.ms.fondo.azul + ")";
  contextoMs.fillRect(0, 0, lienzoMs.width, lienzoMs.height);
  imagenMs = contextoMs.getImageData(0, 0, lienzoMs.width, lienzoMs.height);

  try {
    if (performance && performance.memory && performance.memory.totalJSHeapSize) {
      cantidadModos = 3;
    }
  } catch (errorMemoria) {}

  // Panel MB
  panelMb = document.createElement("div");
  panelMb.style.backgroundColor = "rgb(" + Math.floor(configuracionColores.mb.fondo.rojo / 2) + "," + Math.floor(configuracionColores.mb.fondo.verde / 2) + "," + Math.floor(configuracionColores.mb.fondo.azul / 2) + ")";
  panelMb.style.padding = "2px 0px 3px 0px";
  panelMb.style.display = "none";
  contenedorElemento.appendChild(panelMb);

  textoMb = document.createElement("div");
  textoMb.style.fontFamily = "Helvetica, Arial, sans-serif";
  textoMb.style.textAlign = "left";
  textoMb.style.fontSize = "9px";
  textoMb.style.color = "rgb(" + configuracionColores.mb.primerPlano.rojo + "," + configuracionColores.mb.primerPlano.verde + "," + configuracionColores.mb.primerPlano.azul + ")";
  textoMb.style.margin = "0px 0px 1px 3px";
  textoMb.innerHTML = '<span style="font-weight:bold">MB</span>';
  panelMb.appendChild(textoMb);

  lienzoMb = document.createElement("canvas");
  lienzoMb.width = 74;
  lienzoMb.height = 30;
  lienzoMb.style.display = "block";
  lienzoMb.style.marginLeft = "3px";
  panelMb.appendChild(lienzoMb);

  contextoMb = lienzoMb.getContext("2d");
  contextoMb.fillStyle = "#301010";
  contextoMb.fillRect(0, 0, lienzoMb.width, lienzoMb.height);
  imagenMb = contextoMb.getImageData(0, 0, lienzoMb.width, lienzoMb.height);

  function registrarActualizacion() {
    totalFotogramas++;
    tiempoActual = (new Date()).getTime();
    diferenciaMilisegundos = tiempoActual - tiempoPrevio;
    milisegundosMinimo = Math.min(milisegundosMinimo, diferenciaMilisegundos);
    milisegundosMaximo = Math.max(milisegundosMaximo, diferenciaMilisegundos);

    trazarGrafica(imagenMs.data, Math.min(30, 30 - (diferenciaMilisegundos / 200) * 30), "ms");
    textoMs.innerHTML = '<span style="font-weight:bold">' + diferenciaMilisegundos + ' MS</span> (' + milisegundosMinimo + '-' + milisegundosMaximo + ')';
    contextoMs.putImageData(imagenMs, 0, 0);
    tiempoPrevio = tiempoActual;

    if (tiempoActual > tiempoUltimoCalculo + 1000) {
      valorFpsCalculado = Math.round((totalFotogramas * 1000) / (tiempoActual - tiempoUltimoCalculo));
      valorFpsMinimo = Math.min(valorFpsMinimo, valorFpsCalculado);
      valorFpsMaximo = Math.max(valorFpsMaximo, valorFpsCalculado);

      trazarGrafica(imagenFps.data, Math.min(30, 30 - (valorFpsCalculado / 100) * 30), "fps");
      textoFps.innerHTML = '<span style="font-weight:bold">' + valorFpsCalculado + ' FPS</span> (' + valorFpsMinimo + '-' + valorFpsMaximo + ')';
      contextoFps.putImageData(imagenFps, 0, 0);

      if (cantidadModos === 3) {
        valorMemoriaMb = performance.memory.usedJSHeapSize * 9.54e-7;
        memoriaMbMinima = Math.min(memoriaMbMinima, valorMemoriaMb);
        memoriaMbMaxima = Math.max(memoriaMbMaxima, valorMemoriaMb);
        trazarGrafica(imagenMb.data, Math.min(30, 30 - valorMemoriaMb / 2), "mb");
        textoMb.innerHTML = '<span style="font-weight:bold">' + Math.round(valorMemoriaMb) + ' MB</span> (' + Math.round(memoriaMbMinima) + '-' + Math.round(memoriaMbMaxima) + ')';
        contextoMb.putImageData(imagenMb, 0, 0);
      }

      tiempoUltimoCalculo = tiempoActual;
      totalFotogramas = 0;
    }
  }

  return {
    elementoDom: contenedorElemento,
    domElement: contenedorElemento,
    actualizar: registrarActualizacion,
    update: registrarActualizacion
  };
};

var Stats = Estadisticas;

