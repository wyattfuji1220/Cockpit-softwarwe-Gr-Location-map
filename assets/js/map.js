/* =============================================================
   地図共通ロジック（Leaflet）
   ============================================================= */

const MapApp = (function () {

  const VIEWS = {
    world: { center: [24, 24], zoom: 2,  minZoom: 2, maxZoom: 17, scope: () => SITES },
    japan: { center: [37.0, 137.4], zoom: 5, minZoom: 4, maxZoom: 18,
             scope: () => SITES.filter(s => s.reg === '日本') }
  };

  let map, layer, view, scope;
  const markers = new Map();   // site.id -> L.Marker
  let selectedId = null;

  /* ---------- 初期化 ---------- */
  function init(viewName) {
    view = VIEWS[viewName];
    scope = view.scope();

    map = L.map('map', {
      center: view.center,
      zoom: view.zoom,
      minZoom: view.minZoom,
      maxZoom: view.maxZoom,
      zoomControl: false,
      worldCopyJump: true,
      attributionControl: true
    });

    /* 淡色グレー基調タイル（CARTO Positron） */
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    layer = L.layerGroup().addTo(map);

    map.on('click', () => UI.closeDetail());

    return { map, scope };
  }

  /* ---------- マーカー生成 ---------- */
  function buildMarker(site) {
    const co = COMPANY_MAP[site.c];
    const pt = primaryType(site.t);

    const html =
      '<div class="mk" style="--co:' + co.color + ';--tc:' + TYPE_COLOR[pt] + '">' +
        '<div class="mk__pin">' + logoHtml(co, 24) + '</div>' +
        '<div class="mk__badge">' + TYPE_ICON[pt] + '</div>' +
        (site.conf === 'low' ? '<div class="mk__flag" title="要確認">!</div>' : '') +
      '</div>';

    const marker = L.marker([site.lat, site.lng], {
      icon: L.divIcon({
        html: html,
        className: 'mk-wrap',
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      }),
      riseOnHover: true
    });

    marker.bindTooltip(tooltipHtml(site, co), {
      className: 'tt',
      direction: 'top',
      offset: [0, -18],
      opacity: 1,
      sticky: false
    });

    marker.on('click', e => {
      L.DomEvent.stopPropagation(e);
      select(site.id);
      UI.openDetail(site);
    });

    return marker;
  }

  /* ---------- ツールチップ ---------- */
  function tooltipHtml(site, co) {
    const tags = typeLabels(site.t)
      .map(l => {
        const key = Object.keys(FACILITY_TYPES).find(k => FACILITY_TYPES[k].label === l);
        return '<span class="tag tag--' + key + '">' + l + '</span>';
      }).join('');

    const warn = site.conf === 'low'
      ? '<span class="tag tag--warn">要確認</span>' : '';

    const geoNote = site.geo === 'country' ? '国レベル概算'
                  : site.geo === 'city' ? '市区町村レベル'
                  : '住所ベース';

    return '' +
      '<div class="tt__body">' +
        '<div class="tt__co"><i style="background:' + co.color + '"></i>' + co.short + '</div>' +
        '<div class="tt__name">' + site.n + '</div>' +
        '<div class="tt__ln">' + site.ln + '</div>' +
        '<div class="tt__tags">' + tags + warn + '</div>' +
        '<div class="tt__row"><div class="tt__k">所在地</div><div class="tt__v">' + site.addr + '</div></div>' +
        '<div class="tt__row"><div class="tt__k">主要製品<br>／機能</div><div class="tt__v">' + site.prod + '</div></div>' +
        '<div class="tt__foot"><span>出典: ' + site.src + '</span><span>座標: ' + geoNote + '</span></div>' +
      '</div>';
  }

  /* ---------- 描画更新 ---------- */
  function render(sites) {
    layer.clearLayers();
    markers.clear();
    sites.forEach(s => {
      const m = buildMarker(s);
      markers.set(s.id, m);
      layer.addLayer(m);
    });
    if (selectedId && !markers.has(selectedId)) selectedId = null;
  }

  /* ---------- 選択状態 ---------- */
  function select(id) {
    if (selectedId && markers.has(selectedId)) {
      const el = markers.get(selectedId).getElement();
      if (el) el.querySelector('.mk').classList.remove('is-sel');
    }
    selectedId = id;
    if (id && markers.has(id)) {
      const el = markers.get(id).getElement();
      if (el) el.querySelector('.mk').classList.add('is-sel');
    }
  }

  function focus(site) {
    if (!site) return;
    const z = Math.max(map.getZoom(), site.geo === 'exact' ? 13 : 9);
    map.flyTo([site.lat, site.lng], z, { duration: .7 });
    select(site.id);
  }

  function fitAll(sites) {
    if (!sites.length) return;
    map.fitBounds(L.latLngBounds(sites.map(s => [s.lat, s.lng])), { padding: [70, 70], maxZoom: 10 });
  }

  function reset() {
    map.flyTo(view.center, view.zoom, { duration: .6 });
    select(null);
  }

  return { init, render, select, focus, fitAll, reset, getScope: () => scope };
})();
