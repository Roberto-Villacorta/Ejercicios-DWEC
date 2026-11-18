class Web {
    constructor(titulo, fechaCreacion, visita) {
        this._titulo = titulo;
        this._fechaCreacion = fechaCreacion;
        this._visita = visita;
    }

    get titulo() { return this._titulo }
    set titulo(v) { this._titulo = v }
    get fechaCreacion() { return this._fechaCreacion }
    set fechaCreacion(v) { this._fechaCreacion = v }
    get visita() { return this._titulo }
    set visita(v) { this._titulo = v }

    diasEnLaWeb() {
        const hoy = new Date();
        const arrF = this.fechaCreacion.split("/");
        const fechaCreacion = new Date(arrF[2], arrF[1] - 1, arrF[0]); // año, mes-1, día
        const diferenciaMs = hoy - fechaCreacion;
        return Math.floor(diferenciaMs / (1000 * 60 * 60 * 24)); // ms → días
    }
    mostrarWeb() {
        let tabla = "<table><tr><th>Título</th><th>Fecha de creación</th><th>Visitas</th></tr>";
        tabla += `<tr><td>${this.titulo}</td><td>${this.fechaCreacion}</td><td>${this.visita}</td></tr>`;
        tabla += "</table>";
        const miVentana = window.open("", "_blank", "width=500,height=400");
        miVentana.document.write(
            "<!DOCTYPE html>",
            "<html lang='es'>",
            "<head>",
            '<meta charset="UTF-8">',
            '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
            "<title>Document</title>",
            "</head>",
            "<body>",
            tabla,
            "<button onclick='window.close()'>Volver a la página anterior</button>",
            "</body>",
            "</html>"
        );
        miVentana.document.close();
    }

    static mostrarWebs(webs) {
        let tabla = "<table><tr><th>Título</th><th>Fecha de creación</th><th>Visitas</th></tr>";
        for (const web of webs) {
            tabla += `<tr><td>${web.titulo}</td><td>${web.fechaCreacion}</td><td>${web.visita}</td></tr>`;
        }
        tabla += "</table>";
        const miVentana = window.open("", "_blank", "width=500,height=400");
        miVentana.document.write(
            "<!DOCTYPE html>",
            "<html lang='es'>",
            "<head>",
            '<meta charset="UTF-8">',
            '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
            "<title>Document</title>",
            "</head>",
            "<body>",
            tabla,
            "<button onclick='window.close()'>Volver a la página anterior</button>",
            "</body>",
            "</html>"
        );
        miVentana.document.close();
    }
}


