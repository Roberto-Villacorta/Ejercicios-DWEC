var num1 = 12;
var num2 = 95.3;
var txt = "Lorem Ipsum dolor sit amet";
var bool = false;
var fecha = new Date("2005-07-11");
var cindefinir;
var resultado = "";

resultado = "La variable \'num 1\' que contiene:" + num1 + " y su tipo es: " + typeof(num1) + "<br>" +
    "La variable \'num 2\' que contiene:" + num2 + " y su tipo es: " + typeof num2 + "<br>" +
    "La variable \'txt\' que contiene:" + txt + " y su tipo es: " + typeof(txt) + "<br>" +
    "La variable \'bool\' que contiene:" + bool + " y su tipo es: " + typeof(bool) + "<br>" +
    "La variable \'fecha\' que contiene:" + fecha + " y su tipo es: " + typeof(fecha) + "<br>" +
    "La variable \'cindefinir\' que contiene:" + cindefinir + " y su tipo es: " + typeof(cindefinir) + "<br>";
document.getElementById("miDiv").innerHTML = resultado;


