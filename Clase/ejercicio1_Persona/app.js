"use strict";

const personas = [
    new Persona("Pepe", "Perez", "Su casa", "12/12/1987", "Masculino", "25267"),
    new Persona("Juan", "Gomez", "La casa Verde", "11/10/1990", "Masculino", "25567"),
    new Persona("Luisa", "Fernandez", "Argumosa 23", "2/2/2000", "Femenino", "29894"),
    new Persona("Antonio", "Suarez", "Avenida de Irun 34", "9/1/1999", "Masculino", "25567")
];

let indice = 0;          
let modo = "navegar";    

const $ = id => document.getElementById(id);
const CAMPOS = ["nombre", "apellidos", "direccion", "fechaNacimiento", "genero", "codigoPostal"];

function mostrar() {
    const p = personas[indice];
    if (!p) {
        CAMPOS.forEach(c => { $(c).value = ""; });
        $("genero").value = "Masculino";
        $("posicion").textContent = "No hay personas en el array";
    } else {
        $("nombre").value = p.nombre;
        $("apellidos").value = p.apellidos;
        $("direccion").value = p.direccion;
        $("fechaNacimiento").value = p.fechaTexto();
        $("genero").value = p.genero;
        $("codigoPostal").value = p.codigoPostal;
        $("posicion").textContent = `Persona ${indice + 1} de ${personas.length}`;
    }
    actualizarBotones();
}

function limpiar() {
    CAMPOS.forEach(c => { $(c).value = ""; });
    $("genero").value = "Masculino";
    $("posicion").textContent = "Nueva persona";
}

function validarFormulario() {
    for (const campo of CAMPOS) {
        const valor = $(campo).value;
        const error = Persona.validar(campo, valor);
        if (error) {
            alert(error);
            $(campo).focus();
            return false;
        }
    }
    return true;
}

function crearDesdeFormulario() {
    return new Persona($("nombre").value, $("apellidos").value, $("direccion").value,
        $("fechaNacimiento").value, $("genero").value, $("codigoPostal").value);
}

function actualizarBotones() {
    const hay = personas.length > 0;
    const navegando = modo === "navegar";
    const editable = modo === "alta" || modo === "modificacion";

    CAMPOS.forEach(c => {
        const el = $(c);
        if (c === "genero") el.disabled = !editable; else el.readOnly = !editable;
    });

    const navOn = hay && modo !== "alta";
    ["btnPrimera", "btnAnterior", "btnSiguiente", "btnUltima"].forEach(id => { $(id).disabled = !navOn; });
    $("btnAnterior").disabled = !navOn || indice === 0;
    $("btnPrimera").disabled = !navOn || indice === 0;
    $("btnSiguiente").disabled = !navOn || indice === personas.length - 1;
    $("btnUltima").disabled = !navOn || indice === personas.length - 1;

    $("btnAlta").disabled = !navegando;
    $("btnBaja").disabled = !navegando || !hay;
    $("btnModificacion").disabled = !navegando || !hay;

    $("btnListado").disabled = !hay;
    $("btnListarUna").disabled = !hay || modo === "alta";

    $("btnAceptar").hidden = navegando;
    $("btnCancelar").hidden = navegando;
}

function cambiarModo(nuevo) {
    modo = nuevo;
    actualizarBotones();
}

function primera()   { indice = 0; mostrar(); }
function anterior()  { if (indice > 0) { indice--; mostrar(); } }
function siguiente() { if (indice < personas.length - 1) { indice++; mostrar(); } }
function ultima()    { indice = personas.length - 1; mostrar(); }

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
            if (!confirm("¿Desea dar de alta a esta persona?")) return;
            personas.push(crearDesdeFormulario());
            indice = personas.length - 1;
        } else if (modo === "baja") {
            const p = personas[indice];
            if (!confirm(`¿Desea dar de baja a ${p.senorOSenora()}. ${p.nombre} ${p.apellidos}?`)) return;
            personas.splice(indice, 1);
            if (indice >= personas.length) indice = personas.length - 1;
            if (indice < 0) indice = 0;
        } else if (modo === "modificacion") {
            if (!validarFormulario()) return;
            if (!confirm("¿Desea guardar las modificaciones?")) return;
            personas[indice] = crearDesdeFormulario();
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

function listado()  { Persona.listarPersonas(personas); }
function listarUna() { personas[indice].listarPersona(); }

$("btnPrimera").onclick = primera;
$("btnAnterior").onclick = anterior;
$("btnSiguiente").onclick = siguiente;
$("btnUltima").onclick = ultima;
$("btnAlta").onclick = alta;
$("btnBaja").onclick = baja;
$("btnModificacion").onclick = modificacion;
$("btnListado").onclick = listado;
$("btnListarUna").onclick = listarUna;
$("btnAceptar").onclick = aceptar;
$("btnCancelar").onclick = cancelar;

mostrar();
