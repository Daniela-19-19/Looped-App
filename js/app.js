/* ==========================================================
   Looped · Comportamiento de la app
   ========================================================== */
(function () {
  // ---------- A00 · Splash ----------
  // A los 3,5 s pasa sola a la bienvenida; un toque (o una tecla) lo adelanta.
  // Con «reducir movimiento», pasa en menos de 1 s.
  const splash = document.querySelector('.splash');
  if (splash) {
    const reducir = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const salida = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--duracion-salida')) || 0;
    const total = reducir ? 900 : 3500; // milisegundos hasta llegar a la bienvenida
    let saliendo = false;

    function irABienvenida() {
      if (saliendo) return;
      saliendo = true;
      clearTimeout(espera);
      splash.classList.add('splash--saliendo');
      // replace: el botón «atrás» del celular no vuelve al splash
      setTimeout(() => location.replace('pages/bienvenida.html'), salida);
    }

    const espera = setTimeout(irABienvenida, total - salida);
    splash.addEventListener('click', irABienvenida);
    document.addEventListener('keydown', irABienvenida);
  }
})();
