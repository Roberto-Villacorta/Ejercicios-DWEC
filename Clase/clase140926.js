//diferencias en var y let
//var se puede usar en cualquier parte de la función
//let solo se puede usar en el bloque donde se define
//las variables se pueden definir con _ o en camel case
//Ej: mi_variable o miVariable
//prompt pide datos a los usuarios

//Funciones

function nombre(dato1, dato2) {
    //cuerpo de la función
    //si poner return la función devuelve lo que necesitemos
    let variable = dato1 + dato2;
    return variable;
}
//llamada a la función
let resultado = nombre(1, 2);