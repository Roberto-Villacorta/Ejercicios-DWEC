class Vehiculo {
    constructor(marca, modelo, matricula, kilometros, fechaMatricula, precio) {
        this._marca = marca;
        this._modelo = modelo;
        this._matricula = matricula;
        this._kilometros = kilometros;
        this._fechaMatricula = fechaMatricula;
        this._precio = precio;
    }
    get marca() { return this._marca }
    set marca(v) { this._marca = v }
    get modelo() { return this._modelo }
    set modelo(v) { this._modelo = v }
    get matricula() { return this._matricula }
    set matricula(v) { this._matricula = v }
    get kilometros() { return this._kilometros }
    set kilometros(v) { this._kilometros = v }
    get fechaMatricula() { return this._fechaMatricula }
    set fechaMatricula(v) { this._fechaMatricula = v }
    get precio() { return this._precio }
    set precio(v) { this._precio = v }

    antiguedad() {
        var hoy = new Date();
        var ano;
        ano = hoy.getFullYear() - this._fechaMatricula.getFullYear();
        return ano;
    }
    actualizarKm(km) {
        this.kilometros += km;
    }
    calcularPrecioFinal(descuento) {
        return this._precio - descuento
    }
    esClasico() {
        if (this.antiguedad >= 25) {
            return true
        } else {
            return false
        }
    }
    descripcion() {
        return `Marca del coche ${this.marca},Modelo: ${this.modelo},Matricula:${this.matricula}`
    }
}