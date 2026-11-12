"use strict";

/**
 * Clase Humano.
 * Las validaciones se hacen con JavaScript. Los setters validan y lanzan un
 * Error si el valor no es correcto; el constructor y los métodos usan
 * siempre getters y setters.
 */
class Humano {
    static LETRAS = "A-Za-zÁÉÍÓÚÜáéíóúüÑñÇç";

    #nombre;
    #peso;
    #edad;

    constructor(nombre, peso, edad) {
        this.nombre = nombre;
        this.peso = peso;
        this.edad = edad;
    }

    // ---------- Validaciones (estáticas, reutilizadas por la interfaz) ----------
    static validarNombre(valor) {
        valor = String(valor);
        if (valor.length === 0 || valor.length > 20) {
            return "Nombre: debe tener entre 1 y 20 caracteres.";
        }
        if (!new RegExp(`^[${Humano.LETRAS}]+$`).test(valor)) {
            return "Nombre: solo se permiten caracteres alfabéticos (incluidas ñ, ç y vocales acentuadas).";
        }
        return "";
    }

    static validarPeso(valor) {
        return /^[0-9]{1,3}$/.test(String(valor))
            ? "" : "Peso: solo caracteres numéricos del 0 al 9 (máximo 3 cifras).";
    }

    static validarEdad(valor) {
        return /^[0-9]{1,3}$/.test(String(valor))
            ? "" : "Edad: solo caracteres numéricos del 0 al 9 (máximo 3 cifras).";
    }

    static comprobar(error) {
        if (error) throw new Error(error);
    }

    // ---------- Getters y Setters ----------
    get nombre() { return this.#nombre; }
    set nombre(v) { Humano.comprobar(Humano.validarNombre(v)); this.#nombre = String(v); }

    get peso() { return this.#peso; }
    set peso(v) { Humano.comprobar(Humano.validarPeso(v)); this.#peso = Number(v); }

    get edad() { return this.#edad; }
    set edad(v) { Humano.comprobar(Humano.validarEdad(v)); this.#edad = Number(v); }

    // ---------- Métodos ----------
    /** Incrementa en uno el peso. */
    comer() {
        this.peso = this.peso + 1;
    }

    /** Decrementa en uno el peso (no baja de 0). */
    correr() {
        if (this.peso > 0) this.peso = this.peso - 1;
    }

    /** Devuelve la categoría según la edad. */
    categoria() {
        const e = this.edad;
        if (e < 10 || e > 79) return "Fuera de categoría";
        if (e <= 11) return "Benjamín";
        if (e <= 13) return "Alevín";
        if (e <= 15) return "Infantil";
        if (e <= 17) return "Cadete";
        if (e <= 19) return "Junior";
        if (e <= 29) return "Senior 20";
        if (e <= 39) return "Senior 30";
        if (e <= 49) return "Senior 40";
        if (e <= 59) return "Senior 50";
        if (e <= 69) return "Senior 60";
        return "Senior 70";
    }

    /** Método estático: listado de todos los humanos del array. */
    static listado(array) {
        Humano.#abrirVentana("Listado", array, "Cerrar");
    }

    /** Método estático: listado del humano que está en ese momento en el navegador. */
    static muestraUnaPersona(humano) {
        Humano.#abrirVentana("Muestra una persona", [humano], "Cerrar");
    }

    // ---------- Auxiliares privados ----------
    static #esc(texto) {
        return String(texto).replace(/[&<>"']/g, c =>
            ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    }

    static #abrirVentana(titulo, lista, textoBoton) {
        const w = window.open("", "_blank", "width=480,height=360,scrollbars=yes,resizable=yes");
        if (!w) { alert("El navegador ha bloqueado la ventana emergente. Permítela e inténtalo de nuevo."); return; }
        w.document.open();
        w.document.write(Humano.#html(titulo, lista, textoBoton));
        w.document.close();
    }

    /** HTML de una tabla Nombre / Peso / Edad / Categoría (también usado por el listado externo). */
    static #html(titulo, lista, textoBoton, cabecera = "") {
        const filas = lista.map(h => `
            <tr><td>${Humano.#esc(h.nombre)}</td><td>${h.peso}</td><td>${h.edad}</td><td>${Humano.#esc(h.categoria())}</td></tr>`).join("");
        return `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><title>${Humano.#esc(titulo)}</title>
<style>
    body { font-family: Times New Roman, serif; text-align: center; margin: 12px; }
    table { margin: 0 auto; border: 3px double #444; border-collapse: separate; border-spacing: 2px; }
    th, td { border: 1px solid #444; padding: 2px 5px; text-align: left; }
    button { margin-top: 14px; }
</style></head><body>
${cabecera}
<table>
    <tr><th>Nombre</th><th>Peso</th><th>Edad</th><th>Categoria</th></tr>
    ${filas}
</table>
<button onclick="window.close()">${textoBoton}</button>
</body></html>`;
    }

    /** Solo para uso del listado externo (otroListado), que NO forma parte de la clase. */
    static htmlTabla(titulo, lista, textoBoton, cabecera) {
        return Humano.#html(titulo, lista, textoBoton, cabecera);
    }
}
