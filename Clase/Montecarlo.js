  const canvas = document.getElementById('simulacionCanvas');
        const ctx = canvas.getContext('2d');
        const btnIniciar = document.getElementById('btnIniciar');
        const valPi = document.getElementById('valPi');
        const valPuntos = document.getElementById('valPuntos');

        const TAMANO = canvas.width; // 400x400
        let totalPuntos = 0;
        let puntosDentro = 0;
        let animacionId = null;

        // Dibuja el cuarto de círculo inicial como referencia gráfica
        function inicializarLienzo() {
            ctx.clearRect(0, 0, TAMANO, TAMANO);
            ctx.strokeStyle = '#ccc';
            ctx.lineWidth = 2;
            ctx.beginPath();
            // Arco con centro en (0, TAMANO) y radio igual al TAMANO
            ctx.arc(0, TAMANO, TAMANO, 0, Math.PI * 1.5, true);
            ctx.stroke();
        }

        function ejecutarSimulacion() {
            // Generamos un lote de 200 puntos por cada fotograma para que sea rápido y visible
            const puntosPorFrame = 200;

            for (let i = 0; i < puntosPorFrame; i++) {
                // Generar coordenadas aleatorias entre 0 y 1
                const x = Math.random();
                const y = Math.random();

                // Verificar si cae dentro del círculo de radio 1 (x^2 + y^2 <= 1)
                const estaDentro = (x * x + y * y) <= 1;

                totalPuntos++;
                if (estaDentro) {
                    puntosDentro++;
                }

                // Mapear coordenadas (0 a 1) a los píxeles del canvas
                // El origen (0,0) del círculo matemático lo fijamos en la esquina inferior izquierda (0, TAMANO)
                const canvasX = x * TAMANO;
                const canvasY = TAMANO - (y * TAMANO);

                // Pintar el punto
                ctx.fillStyle = estaDentro ? '#28a745' : '#dc3545'; // Verde dentro, Rojo fuera
                ctx.fillRect(canvasX, canvasY, 1.5, 1.5);
            }

            // Calcular la aproximación actual de Pi
            const piEstimado = 4 * (puntosDentro / totalPuntos);

            // Actualizar los textos en el HTML
            valPi.textContent = piEstimado.toFixed(4);
            valPuntos.textContent = totalPuntos.toLocaleString();

            // Continuar la animación en el siguiente fotograma
            animacionId = requestAnimationFrame(ejecutarSimulacion);
        }

        btnIniciar.addEventListener('click', () => {
            // Si ya está corriendo, reinicia
            if (animacionId) {
                cancelAnimationFrame(animacionId);
            }
            totalPuntos = 0;
            puntosDentro = 0;
            inicializarLienzo();
            ejecutarSimulacion();
        });

        // Dibujar el arco guía al cargar la página
        inicializarLienzo();