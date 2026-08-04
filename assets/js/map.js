/* =============================================================
   地図共通ロジック（Leaflet）
   ============================================================= */

const MapApp = (function () {

  const VIEWS = {
    world: { center: [24, 24], zoom: 2,  minZoom: 2, maxZoom: 17, scope: () => SITES },
    japan: { center: [37.0, 137.4], zoom: 5, minZoom: 4, maxZoom: 18,
             scope: () => SITES.filter(s => s.reg === '日本') }
  };

  /* 「自動」モードでロゴ表示に切り替わるズーム閾値 */
  const LOGO_ZOOM = 4;

  let map, layer, view, scope;
  const markers = new Map();   // site.id -> L.Marker
  let selectedId = null;
  let lastList = [];
  let markerMode = 'logo';     // 'logo'（既定） | 'auto' | 'mono'

  /* 現在の実効表示モード */
  function effectiveMode() {
    if (markerMode !== 'auto') return markerMode;
    return map && map.getZoom() >= LOGO_ZOOM ? 'logo' : 'mono';
  }

  function setMarkerMode(m) {
    markerMode = m;
    render(lastList);
  }

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

    /* ズーム閾値をまたいだらマーカー表現を切り替えて再描画 */
    let prevMode = effectiveMode();
    map.on('zoomend', () => {
      const m = effectiveMode();
      if (m !== prevMode) { prevMode = m; render(lastList); }
    });

    return { map, scope };
  }

  /* ---------- マーカー生成 ---------- */
  function buildMarker(site, mode) {
    const co = COMPANY_MAP[site.c];
    const pt = primaryType(site.t);

    /* 確度低＝破線リング、都市未特定（首都に仮プロット）＝「都」バッジで区別 */
    const flag = site.conf === 'low'
      ? '<div class="mk__flag' + (site.capital ? ' mk__flag--cap' : '') + '" title="' +
        (site.capital ? '都市未特定：' + site.capital + 'に仮プロット' : '所在地要確認') + '">' +
        (site.capital ? '都' : '!') + '</div>'
      : '';
    const cls = site.conf === 'low' ? ' mk--unconfirmed' : '';

    const vars = '--co:' + co.color + ';--tc:' + TYPE_COLOR[pt];

    let html, w, h;
    if (mode === 'logo' && co.logo && !isSquarish(co)) {
      /* 横長ワードマーク → ピル型。背景色つきロゴは地色を合わせて余白なしで敷き詰める */
      const m = pillMetrics(co);
      w = m.w; h = PILL.H;
      const pillStyle = 'width:' + w + 'px' + (m.full ? ';background:' + co.bg + ';padding:0' : '');
      html =
        '<div class="mk mk--pill' + cls + '" style="' + vars + '">' +
          '<div class="mk__pin mk__pin--pill" style="' + pillStyle + '">' +
            (m.full ? wordmarkFillHtml(co) : wordmarkHtml(co, m.logoH)) + '</div>' +
          '<div class="mk__badge">' + TYPE_ICON[pt] + '</div>' + flag +
        '</div>';
    } else if (mode === 'logo' && co.logo) {
      /* 正方形に近いロゴ → 円形ピンの中にロゴを収める */
      w = 30; h = 30;
      html =
        '<div class="mk' + cls + '" style="' + vars + '">' +
          '<div class="mk__pin mk__pin--sq">' + wordmarkHtml(co, Math.round(24 / co.ar)) + '</div>' +
          '<div class="mk__badge">' + TYPE_ICON[pt] + '</div>' + flag +
        '</div>';
    } else {
      w = 30; h = 30;
      html =
        '<div class="mk' + cls + '" style="' + vars + '">' +
          '<div class="mk__pin">' + monogramHtml(co, 24) + '</div>' +
          '<div class="mk__badge">' + TYPE_ICON[pt] + '</div>' + flag +
        '</div>';
    }

    const marker = L.marker([site.lat, site.lng], {
      icon: L.divIcon({
        html: html,
        className: 'mk-wrap',
        iconSize: [w, h],
        iconAnchor: [w / 2, h / 2]
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

    /* 都市未特定の拠点は首都への仮プロットであることを明示する */
    const capNote = site.capital
      ? '<div class="tt__alert">⚠ 所在都市は未特定です。国内の首都（' + site.capital +
        '）に仮プロットしています。</div>'
      : (site.conf === 'low'
          ? '<div class="tt__alert">⚠ 所在地は二次情報ベースです。確認が必要です。</div>'
          : '');

    const geoNote = site.geo === 'country' ? '首都に仮プロット'
                  : site.geo === 'city' ? '市区町村レベル'
                  : '住所ベース';

    return '' +
      '<div class="tt__body">' +
        '<div class="tt__brand"><span class="tt__wm">' + wordmarkHtml(co, 20) + '</span>' +
          '<span class="tt__cot" style="border-color:' + co.color + '">' + co.short + '</span></div>' +
        '<div class="tt__name">' + site.n + '</div>' +
        '<div class="tt__ln">' + site.ln + '</div>' +
        '<div class="tt__tags">' + tags + warn + '</div>' +
        capNote +
        '<div class="tt__row"><div class="tt__k">所在地</div><div class="tt__v">' + site.addr + '</div></div>' +
        '<div class="tt__row"><div class="tt__k">主要製品<br>／機能</div><div class="tt__v">' + site.prod + '</div></div>' +
        '<div class="tt__foot"><span>出典: ' + site.src + '</span><span>座標: ' + geoNote + '</span></div>' +
      '</div>';
  }

  /* ---------- 描画更新 ---------- */
  function render(sites) {
    lastList = sites;
    const mode = effectiveMode();
    layer.clearLayers();
    markers.clear();
    sites.forEach(s => {
      const m = buildMarker(s, mode);
      markers.set(s.id, m);
      layer.addLayer(m);
    });
    if (selectedId && markers.has(selectedId)) select(selectedId);
    else selectedId = null;
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

  return { init, render, select, focus, fitAll, reset, setMarkerMode,
           getScope: () => scope, LOGO_ZOOM };
})();
