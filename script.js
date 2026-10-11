/* hæßlig-magazin – Skript
   Vergrößert die Fotos der Galerien (Klick auf ein Bild). Navigation mit Pfeiltasten und Esc. */

(function () {
  'use strict';

  var lb = null, lbImg, lbCount, liste = [], index = 0, titel = '';

  function bauen() {
    lb = document.createElement('dialog');
    lb.className = 'lightbox';
    lb.setAttribute('aria-label', 'Bildansicht');
    lb.innerHTML =
      '<button type="button" class="lb-close">schließen</button>' +
      '<button type="button" class="lb-prev" aria-label="Vorheriges Bild">zurück</button>' +
      '<img alt="">' +
      '<button type="button" class="lb-next" aria-label="Nächstes Bild">weiter</button>' +
      '<p class="lb-count" aria-live="polite"></p>';
    document.body.appendChild(lb);
    lbImg = lb.querySelector('img');
    lbCount = lb.querySelector('.lb-count');

    lb.querySelector('.lb-close').addEventListener('click', function () { lb.close(); });
    lb.querySelector('.lb-prev').addEventListener('click', function () { zeigen(index - 1); });
    lb.querySelector('.lb-next').addEventListener('click', function () { zeigen(index + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) lb.close(); });
    lb.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') zeigen(index - 1);
      if (e.key === 'ArrowRight') zeigen(index + 1);
    });
    lb.addEventListener('close', function () { document.body.style.overflow = ''; });
  }

  function zeigen(i) {
    index = (i + liste.length) % liste.length;
    lbImg.src = liste[index];
    lbImg.alt = titel + ', Bild ' + (index + 1);
    lbCount.textContent = (index + 1) + ' / ' + liste.length;
  }

  document.querySelectorAll('.gallery').forEach(function (galerie) {
    var shots = Array.prototype.slice.call(galerie.querySelectorAll('.shot'));
    var quellen = shots.map(function (s) { return s.getAttribute('data-full'); });
    shots.forEach(function (shot, n) {
      shot.addEventListener('click', function () {
        if (!lb) bauen();
        liste = quellen;
        titel = galerie.getAttribute('data-title') || '';
        document.body.style.overflow = 'hidden';
        lb.showModal();
        zeigen(n);
      });
    });
  });
})();
