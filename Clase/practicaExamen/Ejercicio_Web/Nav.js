var webs = [];
var indice = 0;

//validaciones
function validaFechaSinObjeto(fechaTexto) {
    if (!fechaTexto || typeof fechaTexto !== "string") return false;
    fechaTexto = fechaTexto.trim();

    var partes = fechaTexto.split("/");
    if (partes.length !== 3) return false;

    var diaStr = partes[0].trim();
    var mesStr = partes[1].trim();
    var anioStr = partes[2].trim();

    if (diaStr.length !== 2 || mesStr.length !== 2 || anioStr.length !== 4) return false;

    var esSoloDigitos = function (cadena) {
        for (var i = 0; i < cadena.length; i++) {
            if (cadena.charAt(i) < '0' || cadena.charAt(i) > '9') return false;
        }
        return true;
    };
    if (!esSoloDigitos(diaStr) || !esSoloDigitos(mesStr) || !esSoloDigitos(anioStr)) return false;
    var dia = parseInt(diaStr, 10);
    var mes = parseInt(mesStr, 10);
    var anio = parseInt(anioStr, 10);
    if (mes < 1 || mes > 12) return false;
    var diasPorMes = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    var esBisiesto = (anio % 4 === 0 && anio % 100 !== 0) || (anio % 400 === 0);
    if (esBisiesto) {
        diasPorMes[1] = 29;
    }
    if (dia < 1 || dia > diasPorMes[mes - 1]) return false;
    return true;
}
function validaTexto(texto) {
    if (!texto || typeof texto !== "string") return false;
    texto = texto.trim();
    var letrasPermitidas = "abcdefghijklmnñopqrstuvwxyzáéíóúüABCDEFGHIJKLMNÑOPQRSTUVWXYZÁÉÍÓÚÜ ";
    for (var i = 0; i < texto.length; i++) {
        if (letrasPermitidas.indexOf(texto.charAt(i)) === -1) {
            return false;
        }
    }
    return true;
}

function validaNumero(valor) {
    if (valor === null || valor === undefined) return false;
    var str = valor.toString().trim();
    if (str === "") return false;

    var nums = "0123456789";
    for (var i = 0; i < str.length; i++) {
        if (nums.indexOf(str.charAt(i)) === -1) {
            return false;
        }
    }
    return true;
}

function validacion(web) {
    var textoError = ""
    if (!validaTexto(web.titulo)) {
        textoError += 'Titulo inválido'
    }
    if (!validaNumero(web.visitas)) {
        textoError += "Las visitas deben ser un número"
    } if (!validaFechaSinObjeto(web.fechaCreacion)) {
        textoError += "La fecha debe ser correcta"
    }
    return textoError;

}
function primera() {
    if (webs.length === 0) return;
    indice = 0;
    muestraRegistro();
}

function anterior() {
    if (webs.length === 0) return;
    if (indice > 0) {
        indice--;
    } else {
        indice = webs.length - 1; // Circular
    }
    muestraRegistro();
}

function siguiente() {
    if (webs.length === 0) return;
    if (indice < webs.length - 1) {
        indice++;
    } else {
        indice = 0; // Circular
    }
    muestraRegistro();
}

function ultima() {
    if (webs.length === 0) return;
    indice = webs.length - 1;
    muestraRegistro();
}

var accionAceptar = 0;
function bloquearNavegacion(deshabilitar) {
    document.getElementById("btnPrimera").disabled = deshabilitar;
    document.getElementById("btnAnterior").disabled = deshabilitar;
    document.getElementById("btnSiguiente").disabled = deshabilitar;
    document.getElementById("btnUltima").disabled = deshabilitar;
}

function muestraRegistro() {
    if (webs.length === 0) return;
    document.getElementById("miTitulo").value = webs[indice].titulo;
    document.getElementById("miFecha").value = webs[indice].fechaCreacion;
    document.getElementById("miVisita").value = webs[indice].visitas;
}

function navega(direccion) {
    muestraRegistro();
}
function botones(deshabilitarAcciones, visibilidadAceptarCancelar) {
    document.getElementById("btnAlta").disabled = deshabilitarAcciones;
    document.getElementById("btnBaja").disabled = deshabilitarAcciones;
    document.getElementById("btnMod").disabled = deshabilitarAcciones;
    document.getElementById("btnAcep").style.visibility = visibilidadAceptarCancelar;
    document.getElementById("btnCancel").style.visibility = visibilidadAceptarCancelar;
    var divErr = document.getElementById("miDivErr");
    if (divErr) divErr.innerHTML = "";
}

function limpiarFormulario() {
    document.getElementById("miTitulo").value = "";
    document.getElementById("miVisita").value = "";
    document.getElementById("miFecha").value = "";
}

function alta() {
    bloquearNavegacion(true);
    botones(true, "visible");
    limpiarFormulario();
    accionAceptar = 1;
}

function baja() {
    if (webs.length === 0) {
        alert("No hay registros para eliminar");
        return;
    }
    botones(true, "visible");
    accionAceptar = 2;
}

function modificacion() {
    if (webs.length === 0) {
        alert("No hay registros para modificar");
        return;
    }
    botones(true, "visible");
    accionAceptar = 3;
}

function cancelar() {
    bloquearNavegacion(false);
    botones(false, "hidden");
    accionAceptar = 0;
    navega(2);
}
function listadoVentana() {
    if (webs.length === 0) return;
    webs[indice].mostrarWeb();
}
function listadoVentana3() {
    Web.mostrarWebs(webs);
}
function aceptar() {
    switch (accionAceptar) {
        case 1: // ALTA
            var web = new Web(
                document.getElementById("miTitulo").value,
                document.getElementById("miFecha").value,
                parseInt(document.getElementById("miVisita").value, 10)
            );
            if (validacion(web) === "") {
                webs.push(web);
                cancelar();
            } else {
                document.getElementById("miDivErr").innerHTML = validacion(web);
            }
            break;

        case 2: // BAJA
            if (confirm("¿Seguro que desea eliminar este registro?")) {
                webs.splice(indice, 1);
                if (indice >= webs.length) indice = webs.length - 1;
                cancelar();
            }
            break;

        case 3: // MODIFICACIÓN
            var webTemp = new Web(
                document.getElementById("miTitulo").value,
                document.getElementById("miFecha").value,
                parseInt(document.getElementById("miVisita").value, 10)
            );
            if (validacion(webTemp) === "") {
                webs[indice] = webTemp;
                cancelar();
            } else {
                document.getElementById("miDivErr").innerHTML = validacion(webTemp);
            }
            break;
    }
}   