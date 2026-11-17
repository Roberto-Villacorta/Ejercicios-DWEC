"use strict";

class Persona {
    static LETRAS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZáéíóúüÁÉÍÓÚÜñÑçÇ";
    static DIGITOS = "0123456789";

    static REGLAS = {
        nombre:    { min: 3, max: 20, numeros: false, etiqueta: "Nombre" },
        apellidos: { min: 3, max: 30, numeros: false, etiqueta: "Apellidos" },
        direccion: { min: 3, max: 35, numeros: true,  etiqueta: "Dirección" }
    };

    #nombre;
    #apellidos;
    #direccion;
    #fechaNacimiento; 
    #genero;
    #codigoPostal;

    constructor(nombre, apellidos, direccion, fechaNacimiento, genero, codigoPostal) {
        this.nombre = nombre;
        this.apellidos = apellidos;
        this.direccion = direccion;
        this.fechaNacimiento = fechaNacimiento;
        this.genero = genero;
        this.codigoPostal = codigoPostal;
    }
    static esDigitos(texto) {
        if (typeof texto !== "string" || texto.length === 0) return false;
        for (let i = 0; i < texto.length; i++) {
            if (!Persona.DIGITOS.includes(texto[i])) return false;
        }
        return true;
    }

    static validarTexto(campo, valor) {
        const r = Persona.REGLAS[campo];
        if (typeof valor !== "string") valor = String(valor);

        if (valor !== valor.trim()) {
            return `${r.etiqueta}: no puede haber espacios en blanco ni al principio ni al final.`;
        }
        if (valor.length < r.min || valor.length > r.max) {
            return `${r.etiqueta}: debe tener entre ${r.min} y ${r.max} caracteres.`;
        }

        const permitidos = Persona.LETRAS + (r.numeros ? Persona.DIGITOS : "") + " -";
        for (let i = 0; i < valor.length; i++) {
            if (!permitidos.includes(valor[i])) {
                return `${r.etiqueta}: solo se permiten letras${r.numeros ? ", números" : ""}, espacios, ñ, ç y guion (-).`;
            }
        }
        return "";
    }

    static parseFecha(texto) {
        if (typeof texto !== "string") return null;
        const partes = texto.split("/");
        if (partes.length !== 3) return null;

        const [diaStr, mesStr, anioStr] = partes;
        if (diaStr.length < 1 || diaStr.length > 2 || !Persona.esDigitos(diaStr)) return null;
        if (mesStr.length < 1 || mesStr.length > 2 || !Persona.esDigitos(mesStr)) return null;
        if (anioStr.length !== 4 || !Persona.esDigitos(anioStr)) return null;

        const d = Number(diaStr);
        const mes = Number(mesStr);
        const a = Number(anioStr);

        const f = new Date(a, mes - 1, d);
        if (f.getFullYear() !== a || f.getMonth() !== mes - 1 || f.getDate() !== d) return null;
        return f;
    }

    static validarFecha(texto) {
        const f = Persona.parseFecha(texto);
        if (f === null) return "Fecha de nacimiento: debe ser una fecha válida con formato dd/mm/aaaa.";
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        if (f >= hoy) return "Fecha de nacimiento: debe ser anterior a la fecha actual.";
        return "";
    }

    static validarGenero(valor) {
        return (valor === "Masculino" || valor === "Femenino")
            ? "" : "Género: solo puede ser Masculino o Femenino.";
    }

    static validarCodigoPostal(valor) {
        const str = String(valor);
        return (str.length === 5 && Persona.esDigitos(str))
            ? "" : "Código Postal: debe tener exactamente 5 caracteres numéricos (0-9).";
    }

    static validar(campo, valor) {
        switch (campo) {
            case "nombre":
            case "apellidos":
            case "direccion":       return Persona.validarTexto(campo, valor);
            case "fechaNacimiento": return Persona.validarFecha(valor);
            case "genero":          return Persona.validarGenero(valor);
            case "codigoPostal":    return Persona.validarCodigoPostal(valor);
            default:                return "Campo desconocido.";
        }
    }

    static comprobar(campo, valor) {
        const error = Persona.validar(campo, valor);
        if (error) throw new Error(error);
    }

    get nombre() { return this.#nombre; }
    set nombre(v) { Persona.comprobar("nombre", v); this.#nombre = v; }

    get apellidos() { return this.#apellidos; }
    set apellidos(v) { Persona.comprobar("apellidos", v); this.#apellidos = v; }

    get direccion() { return this.#direccion; }
    set direccion(v) { Persona.comprobar("direccion", v); this.#direccion = v; }

    get fechaNacimiento() { return this.#fechaNacimiento; }
    set fechaNacimiento(v) {
        Persona.comprobar("fechaNacimiento", v);
        this.#fechaNacimiento = Persona.parseFecha(v);
    }

    get genero() { return this.#genero; }
    set genero(v) { Persona.comprobar("genero", v); this.#genero = v; }

    get codigoPostal() { return this.#codigoPostal; }
    set codigoPostal(v) { Persona.comprobar("codigoPostal", v); this.#codigoPostal = v; }


    fechaTexto() {
        const f = this.#fechaNacimiento;
        return `${f.getDate()}/${f.getMonth() + 1}/${f.getFullYear()}`;
    }

    edad() {
        const hoy = new Date();
        const n = this.#fechaNacimiento;
        let e = hoy.getFullYear() - n.getFullYear();
        const dm = hoy.getMonth() - n.getMonth();
        if (dm < 0 || (dm === 0 && hoy.getDate() < n.getDate())) e--;
        return e;
    }

    senorOSenora() {
        return this.#genero === "Masculino" ? "Sr" : "Sra";
    }

    listarPersona() {
        Persona.#abrirVentana("Listado de una persona", [this]);
    }

    static listarPersonas(array) {
        Persona.#abrirVentana("Listado Array de todas las personas", array);
    }

    static #esc(texto) {
        return String(texto)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#39;");
    }

    static #abrirVentana(titulo, personas) {
        const filas = personas.map(p => `
            <tr>
                <td>${Persona.#esc(p.senorOSenora() + ". " + p.nombre + " " + p.apellidos)}</td>
                <td>${Persona.#esc(p.direccion)}</td>
                <td>${p.fechaTexto()}</td>
                <td>${p.edad()}</td>
                <td>${Persona.#esc(p.genero)}</td>
                <td>${p.codigoPostal}</td>
            </tr>`).join("");

        const html = `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><title>${Persona.#esc(titulo)}</title>
<style>
    body { font-family: Times New Roman, serif; text-align: center; margin: 12px; }
    table { margin: 0 auto; border: 3px double #444; border-collapse: separate; border-spacing: 2px; }
    th, td { border: 1px solid #444; padding: 3px 6px; text-align: left; }
    th { text-align: center; }
    button { margin-top: 14px; }
</style></head><body>
<p>${Persona.#esc(titulo)}</p>
<table>
    <tr><th>Nombre y Apellidos</th><th>Dirección</th><th>Fecha de Nacimiento</th>
        <th>Edad</th><th>Género</th><th>Código Postal</th></tr>
    ${filas}
</table>
<button onclick="window.close()">Cerrar ventana</button>
</body></html>`;

        const w = window.open("", "_blank", "width=780,height=460,scrollbars=yes,resizable=yes");
        if (!w) { alert("El navegador ha bloqueado la ventana emergente. Permítela e inténtalo de nuevo."); return; }
        w.document.open();
        w.document.write(html);
        w.document.close();
    }
}
