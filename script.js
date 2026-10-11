/* hæßlig-magazin – Skript
   Findet die Bilder jeder Ausgabe automatisch (panik1, panik2, ... drueben1, drueben2, ...),
   zeigt das erste Bild als Cover und alle Bilder in einer Galerie mit Vergrößerung. */

(function () {
  'use strict';

  /* ===== Hier anpassen ===== */
  var BILDER_ORDNER = 'images/';
  var ENDUNGEN = ['jpg', 'jpeg', 'png', 'webp', 'JPG', 'JPEG', 'PNG', 'WEBP'];
  var MAX_BILDER = 80;
  /* ========================= */

  var endungMerken = {};
  var coverCache = {};

  function laden(src) {
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = function () { resolve(true); };
      img.onerror = function () { resolve(false); };
      img.src = src;
    });
  }

  // Sucht Bild Nummer n einer Ausgabe und probiert mehrere Dateiendungen
  async function bildFinden(slug, n) {
    var bekannt = endungMerken[slug];
    var reihenfolge = bekannt
      ? [bekannt].concat(ENDUNGEN.filter(function (e) { return e !== bekannt; }))
      : ENDUNGEN;
    for (var i = 0; i < reihenfolge.length; i++) {
      var src = BILDER_ORDNER + slug + n + '.' + reihenfolge[i];
      if (await laden(src)) {
        endungMerken[slug] = reihenfolge[i];
        return src;
      }
    }
    return null;
  }

  function coverFinden(slug) {
    if (!coverCache[slug]) coverCache[slug] = bildFinden(slug, 1);
    return coverCache[slug];
  }

  /* ----- Cover ----- */
  document.querySelectorAll('[data-cover]').forEach(async function (el) {
    var src = await coverFinden(el.getAttribute('data-cover'));
    if (!src) return;
    var img = document.createElement('img');
    img.src = src;
    img.alt = '';
    img.decoding = 'async';
    el.appendChild(img);
  });

  /* ----- Lightbox ----- */
  var lb = null, lbImg, lbCount, lbListe = [], lbIndex = 0, lbTitel = '';

  function lightboxBauen() {
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
    lb.querySelector('.lb-prev').addEventListener('click', function () { zeigen(lbIndex - 1); });
    lb.querySelector('.lb-next').addEventListener('click', function () { zeigen(lbIndex + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) lb.close(); });
    lb.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') zeigen(lbIndex - 1);
      if (e.key === 'ArrowRight') zeigen(lbIndex + 1);
    });
    lb.addEventListener('close', function () { document.body.style.overflow = ''; });
  }

  function zeigen(i) {
    if (!lbListe.length) return;
    lbIndex = (i + lbListe.length) % lbListe.length;
    lbImg.src = lbListe[lbIndex];
    lbImg.alt = lbTitel + ', Bild ' + (lbIndex + 1);
    lbCount.textContent = (lbIndex + 1) + ' / ' + lbListe.length;
  }

  function lightboxOeffnen(liste, index, titel) {
    if (!lb) lightboxBauen();
    lbListe = liste;
    lbTitel = titel;
    document.body.style.overflow = 'hidden';
    lb.showModal();
    zeigen(index);
  }

  /* ----- Galerien (Bilder erscheinen nacheinander, sobald sie gefunden sind) ----- */
  document.querySelectorAll('[data-gallery]').forEach(async function (galerie) {
    var slug = galerie.getAttribute('data-gallery');
    var titel = galerie.getAttribute('data-title') || slug;
    var gefunden = [];

    for (var n = 1; n <= MAX_BILDER; n++) {
      var src = await bildFinden(slug, n);
      if (!src) break;
      gefunden.push(src);

      var knopf = document.createElement('button');
      knopf.type = 'button';
      knopf.className = 'shot';
      knopf.setAttribute('aria-label', 'Bild ' + n + ' vergrößern');
      var img = document.createElement('img');
      img.src = src;
      img.alt = titel + ', Bild ' + n;
      img.decoding = 'async';
      knopf.appendChild(img);
      knopf.addEventListener('click', (function (index) {
        return function () { lightboxOeffnen(gefunden, index, titel); };
      })(n - 1));
      galerie.appendChild(knopf);
    }

    if (!gefunden.length) {
      var p = document.createElement('p');
      p.textContent = 'Für diese Ausgabe sind noch keine Bilder hinterlegt.';
      galerie.appendChild(p);
    }
  });
})();
