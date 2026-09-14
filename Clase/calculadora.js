function suma(n1, n2) {
    document.getElementById("resultado").innerHTML = parseInt(n1) + parseInt(n2);
}
function resta(n1, n2) {
    document.getElementById("resultado").innerHTML = parseInt(n1) - parseInt(n2);
}
function multiplicacion(n1, n2) {
    document.getElementById("resultado").innerHTML = parseInt(n1) * parseInt(n2);
}
function division(n1, n2) {
    if(n2 != 0){
    document.getElementById("resultado").innerHTML = parseInt(n1) / parseInt(n2);
    }else{
        document.getElementById("resultado").innerHTML = "No se puede dividir entre 0";
    }
}
