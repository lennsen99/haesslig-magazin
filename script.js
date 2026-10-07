/* hæßlig-magazin – Skript
   Findet die Bilder jeder Ausgabe automatisch (panik1, panik2, ... drueben1, drueben2, ...),
   zeigt das erste Bild als Cover und alle Bilder im Betrachter. */

(function () {
  'use strict';

  /* ===== Hier anpassen ===== */
  var MAIL = 'kontakt@haesslig-magazin.de'; // TODO: echte E-Mail-Adresse eintragen
  var BILDER_ORDNER = 'images/';             // Ordner mit den Bildern
  var ENDUNGEN = ['jpg', 'jpeg', 'png', 'webp', 'JPG', 'JPEG', 'PNG', 'WEBP'];
  var MAX_BILDER = 80;                       // Sicherheitsgrenze pro Ausgabe
  /* ========================= */

  var endungMerken = {};
  var coverCache = {};
  var listenCache = {};

  function laden(src) {
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = function () { resolve(true); };
      img.onerror = function () { resolve(false); };
      img.src = src;
    });
  }

  // Sucht Bild Nummer n einer Ausgabe und probiert dabei mehrere Dateiendungen
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

  function alleBilder(slug) {
    if (!listenCache[slug]) {
      listenCache[slug] = (async function () {
        var liste = [];
        for (var n = 1; n <= MAX_BILDER; n++) {
          var src = await bildFinden(slug, n);
          if (!src) break;
          liste.push(src);
        }
        return liste;
      })();
    }
    return listenCache[slug];
  }

  function coverFinden(slug) {
    if (!coverCache[slug]) coverCache[slug] = bildFinden(slug, 1);
    return coverCache[slug];
  }

  /* ----- Cover einsetzen ----- */
  document.querySelectorAll('[data-cover]').forEach(async function (el) {
    var slug = el.getAttribute('data-cover');
    var src = await coverFinden(slug);
    if (!src) return;
    var img = document.createElement('img');
    img.src = src;
    img.alt = '';
    img.decoding = 'async';
    el.appendChild(img);
  });

  /* ----- Bildbetrachter ----- */
  var viewer = document.getElementById('viewer');
  var galerie = viewer.querySelector('.gallery');
  var titel = viewer.querySelector('.viewer-title');
  var aktuell = null;

  document.addEventListener('click', async function (e) {
    var ausloeser = e.target.closest('[data-open]');
    if (ausloeser) {
      var slug = ausloeser.getAttribute('data-open');
      var name = ausloeser.getAttribute('data-title') || slug;
      aktuell = slug;

      titel.textContent = name;
      galerie.replaceChildren();
      var hinweis = document.createElement('p');
      hinweis.textContent = 'Bilder werden geladen …';
      galerie.appendChild(hinweis);

      viewer.showModal();
      document.body.classList.add('locked');
      viewer.scrollTop = 0;

      var bilder = await alleBilder(slug);
      if (aktuell !== slug) return; // inzwischen andere Ausgabe geöffnet

      galerie.replaceChildren();
      if (!bilder.length) {
        var leer = document.createElement('p');
        leer.textContent = 'Für diese Ausgabe wurden noch keine Bilder gefunden.';
        galerie.appendChild(leer);
        return;
      }
      bilder.forEach(function (src, i) {
        var img = document.createElement('img');
        img.src = src;
        img.alt = name + ', Bild ' + (i + 1);
        img.loading = 'lazy';
        img.decoding = 'async';
        galerie.appendChild(img);
      });
      return;
    }

    if (e.target.closest('[data-close]')) viewer.close();
  });

  viewer.addEventListener('close', function () {
    document.body.classList.remove('locked');
    aktuell = null;
  });

  /* ----- Mail-Links ----- */
  document.querySelectorAll('[data-mail]').forEach(function (a) {
    var betreff = a.getAttribute('data-mail');
    a.href = 'mailto:' + MAIL + '?subject=' + encodeURIComponent(betreff);
    if (a.hasAttribute('data-show')) a.textContent = MAIL;
  });
})();
