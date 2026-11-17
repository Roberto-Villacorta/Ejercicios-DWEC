class Producto {
    constructor(nombre, precio, unidades, fechaCaducidad, codigo) {
        this._nombre = nombre;
        this._precio = precio;
        this._unidades = unidades;
        this._fechaCaducidad = fechaCaducidad;
        this._codigo = codigo;
    }
    //getters y setters
    get nombre() { return this._nombre }
    get precio() { return this._precio }
    get unidades() { return this._unidades }
    get fechaCaducidad() { return this._fechaCaducidad }
    get codigo() { return this._codigo }
    //métodos propios
    estaCaducado() {
        if (this.fechaCaducidad.getTime() < Date.now()) {
            return true;
        } else { return false }
    }
    diasParaCaducar() {
        if (!this.estaCaducado()) {
            return Math.floor((this.fechaCaducidad.getTime() - Date.now()) / (1000 * 60 * 24))
        } else {
            return "Ya está caducado"
        }
    }
    vender(cantidad) {
        if (cantidad > this.unidades) {
            return "No puedes vender más de tú inventario"
        } else {
            this.unidades -= cantidad;
            return "venta realizada"
        }
    }
    reponer(cantidad) {
        this.unidades += cantidad
    }
    precioConDescuento(porcentaje) {
        return Number((this.precio * (porcentaje / 100)).toFixed(2))
    }
    nombreMayus() {
        return this.nombre?.toUpperCase() ?? ''
    }
}