class Alumno{
    constructor(nombre,apellidos,dni,fechaNacimiento,notas,localidad) {
        this._nombre = nombre;
        this._apellidos = apellidos;
        this._dni = dni;
        this._fechaNacimiento = fechaNacimiento;
        this._notas = notas;
        this._localidad = localidad
    }

    get nombre(){return this._nombre}
    set nombre(v){this._nombre=v}
    get apellidos(){return this._apellidos}
    set apellidos(v){this._apellidos=v}
    get dni(){return this._dni}
    set dni(v){this._dni=v}
    get fechaNacimiento(){return this._fechaNacimiento}
    set fechaNacimiento(v){this._fechaNacimiento=v}
    get notas(){return this._notas}
    set notas(v){this._notas=v}
    get localidad(){return this._localidad}
    set localidad(v){this._localidad=v}
    
    edad(){
        /*
        var hoy = new Date();
        var ms = hoy - fechaNacimiento.getTime()  
        var tiempo = new Date(ms)                 
        return tiempo.toString()   
        */
        var ms = Date.now() - this.fechaNacimiento.getTime();
        var tiempo = new Date(ms);

        var anios  = Math.abs(tiempo.getUTCFullYear() - 1970);
        var meses  = tiempo.getUTCMonth();
        var dias   = tiempo.getUTCDate() - 1; 

        return `${anios} años, ${meses} meses y ${dias} días`;
    }
    notaMedia(){
        /*
        return (this._notas.reduce((acc, nota) => acc + nota, 0)
        / this._notas.length).toFixed(2);
        */ 
        var suma=0;
        this._notas.forEach(nota => {
            suma+=nota
        });
        return (suma/this._notas.length).toFixed(2);
    }
    notaMaxima(){
        return Math.max(...this._notas);
    }
    notaMinima(){
        return Math.min(...this._notas);
    }
    agregarNota(nota){
        this._notas.push(nota)
    }
    eliminarNota(posicion){
        this._notas.splice(posicion,1)
    }
    nombreCompleto(){
        return `El alumno con ${this.nombre} ${this.apellidos}`
    }
    aprobar(){
        return Number(this.notaMedia())>=5;
    }
    generarCal(){
        var nota=Number(this.notaMedia());
        if(nota<5){
            return 'Insuficiente';
        }else if(nota===5){
            return 'Suficiente';
        }else if(nota===6){
            return 'Bien';
        }else if(nota===7 || nota===8){
            return 'Notable';
        }else{
            return 'Sobresaliente';
        }
    }
}