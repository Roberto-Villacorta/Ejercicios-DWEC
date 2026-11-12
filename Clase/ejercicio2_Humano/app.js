"use strict";

const humanos = [
    new Humano("Pepe", 67, 30),
    new Humano("Juan", 59, 23),
    new Humano("Andrés", 73, 40),
    new Humano("Antonio", 90, 40)
];

let indice = 0;
let modo = "navegar"; 
const $ = id => document.getElementById(id);
const CAMPOS = ["nombre", "peso", "edad"];

function mostrar() {
    const h = humanos[indice];
    if (h) {
        $("nombre").value = h.nombre;  
        $("peso").value = h.peso;
        $("edad").value = h.edad;
    } else {
        CAMPOS.forEach(c => { $(c).value = ""; });
    }
    actualizarBotones();
}

function limpiar() {
    CAMPOS.forEach(c => { $(c).value = ""; });
}

function validarFormulario() {
    const reglas = {
        nombre: Humano.validarNombre,
        peso: Humano.validarPeso,
        edad: Humano.validarEdad
    };
    for (const campo of CAMPOS) {
        const error = reglas[campo]($(campo).value);
        if (error) {
            alert(error);
            $(campo).focus();
            return false;
        }
    }
    return true;
}

function actualizarBotones() {
    const hay = humanos.length > 0;
    const navegando = modo === "navegar";
    const editable = modo === "alta" || modo === "modificacion";

    CAMPOS.forEach(c => { $(c).readOnly = !editable; });

    const navOn = hay && modo !== "alta";
    $("btnPrimera").disabled = !navOn || indice === 0;
    $("btnAnterior").disabled = !navOn || indice === 0;
    $("btnSiguiente").disabled = !navOn || indice === humanos.length - 1;
    $("btnUltima").disabled = !navOn || indice === humanos.length - 1;

    $("btnComer").disabled = !navegando || !hay;
    $("btnCorrer").disabled = !navegando || !hay;

    $("btnAlta").disabled = !navegando;
    $("btnBaja").disabled = !navegando || !hay;
    $("btnModificacion").disabled = !navegando || !hay;

    $("btnListado").disabled = !hay;
    $("btnOtroListado").disabled = !hay;
    $("btnMuestraUna").disabled = !hay || modo === "alta";

    $("btnAceptar").hidden = navegando;
    $("btnCancelar").hidden = navegando;
}

function cambiarModo(nuevo) {
    modo = nuevo;
    actualizarBotones();
}

function primera()   { indice = 0; mostrar(); }
function anterior()  { if (indice > 0) { indice--; mostrar(); } }
function siguiente() { if (indice < humanos.length - 1) { indice++; mostrar(); } }
function ultima()    { indice = humanos.length - 1; mostrar(); }

function comer() {
    try {
        humanos[indice].comer();
        mostrar();
    } catch (e) { alert(e.message); }
}

function correr() {
    try {
        humanos[indice].correr();
        mostrar();
    } catch (e) { alert(e.message); }
}

function alta() {
    cambiarModo("alta");
    limpiar();
    $("nombre").focus();
}

function baja() {
    cambiarModo("baja");
}

function modificacion() {
    cambiarModo("modificacion");
    $("nombre").focus();
}

function aceptar() {
    try {
        if (modo === "alta") {
            if (!validarFormulario()) return;
            if (!confirm("¿Desea dar de alta a este humano?")) return;
            humanos.push(new Humano($("nombre").value, $("peso").value, $("edad").value));
            indice = humanos.length - 1;
        } else if (modo === "baja") {
            if (!confirm(`¿Desea dar de baja a ${humanos[indice].nombre}?`)) return;
            humanos.splice(indice, 1);
            if (indice >= humanos.length) indice = humanos.length - 1;
            if (indice < 0) indice = 0;
        } else if (modo === "modificacion") {
            if (!validarFormulario()) return;
            if (!confirm("¿Desea guardar las modificaciones?")) return;
            const h = humanos[indice];
            h.nombre = $("nombre").value;  // setters
            h.peso = $("peso").value;
            h.edad = $("edad").value;
        }
    } catch (e) {
        alert(e.message);
        return;
    }
    modo = "navegar";
    mostrar();
}

function cancelar() {
    modo = "navegar";
    mostrar();
}

function listado() {
    Humano.listado(humanos);         
}
function otroListado(array) {
    const w = window.open("", "_blank", "width=420,height=420,scrollbars=yes,resizable=yes");
    if (!w) { alert("El navegador ha bloqueado la ventana emergente. Permítela e inténtalo de nuevo."); return; }
    w.document.open();
    w.document.write(Humano.htmlTabla("Listado en Ventana", array, "Cerrar ventana",
        "<p>Listado de personas NO FORMA PARTE DE LA CLASE</p>"));
    w.document.close();
}

function muestraUna() {
    Humano.muestraUnaPersona(humanos[indice]);
}

$("btnPrimera").onclick = primera;
$("btnAnterior").onclick = anterior;
$("btnSiguiente").onclick = siguiente;
$("btnUltima").onclick = ultima;
$("btnComer").onclick = comer;
$("btnCorrer").onclick = correr;
$("btnAlta").onclick = alta;
$("btnBaja").onclick = baja;
$("btnModificacion").onclick = modificacion;
$("btnListado").onclick = listado;
$("btnOtroListado").onclick = () => otroListado(humanos);
$("btnMuestraUna").onclick = muestraUna;
$("btnAceptar").onclick = aceptar;
$("btnCancelar").onclick = cancelar;

mostrar();
