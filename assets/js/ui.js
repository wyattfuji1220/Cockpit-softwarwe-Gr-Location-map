/* =============================================================
   サイドバー・フィルタ・詳細パネル
   ============================================================= */

const UI = (function () {

  let scope = [];
  const CONF_LABEL = { high: '確度 高（公式に住所）', medium: '確度 中（公式に都市）', low: '確度 低（要確認）' };
  const CONF_COLOR = { high: '#4E7C74', medium: '#A98F5F', low: '#B5793F' };

  const state = {
    companies: new Set(),
    types: new Set(Object.keys(FACILITY_TYPES)),
    regions: new Set(),
    confs: new Set(['high', 'medium', 'low']),
    q: ''
  };

  /* ---------- 起動 ---------- */
  function init(viewName) {
    const r = MapApp.init(viewName);
    scope = r.scope;

    COMPANIES.forEach(c => state.companies.add(c.id));
    regionsInScope().forEach(rg => state.regions.add(rg));

    buildSidebar(viewName);
    buildLegend();
    apply();

    document.getElementById('detailClose').addEventListener('click', closeDetail);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDetail(); });
  }

  function regionsInScope() {
    return REGIONS.filter(rg => scope.some(s => s.reg === rg));
  }

  /* ---------- サイドバー構築 ---------- */
  function buildSidebar(viewName) {
    const el = document.getElementById('filters');
    const showRegions = viewName === 'world';

    el.innerHTML = `
      <div class="fgroup">
        <div class="fgroup__head"><span class="fgroup__title">検索</span></div>
        <input class="search" id="q" type="search"
               placeholder="拠点名・住所・製品で絞り込み" autocomplete="off">
      </div>

      <div class="fgroup">
        <div class="fgroup__head">
          <span class="fgroup__title">施設種別</span>
          <button class="fgroup__act" data-all="types">すべて</button>
        </div>
        <div id="fTypes"></div>
      </div>

      ${showRegions ? `
      <div class="fgroup">
        <div class="fgroup__head">
          <span class="fgroup__title">地域</span>
          <button class="fgroup__act" data-all="regions">すべて</button>
        </div>
        <div id="fRegions"></div>
      </div>` : ''}

      <div class="fgroup">
        <div class="fgroup__head">
          <span class="fgroup__title">データ確度</span>
          <button class="fgroup__act" data-all="confs">すべて</button>
        </div>
        <div id="fConfs"></div>
      </div>

      <div class="fgroup">
        <div class="fgroup__head">
          <span class="fgroup__title">企業</span>
          <button class="fgroup__act" data-all="companies">すべて</button>
        </div>
        <div id="fCompanies"></div>
      </div>

      <div class="fgroup">
        <div class="fgroup__head"><span class="fgroup__title">マーカー表示</span></div>
        <div class="seg" id="seg">
          <button class="seg__b is-on" data-mode="auto">自動</button>
          <button class="seg__b" data-mode="logo">ロゴ</button>
          <button class="seg__b" data-mode="mono">記号</button>
        </div>
        <div class="sidebar__note" style="margin-top:8px">
          「自動」（既定）はズーム${MapApp.LOGO_ZOOM}未満で記号、以上で公式ロゴに切り替わります。<br>
          常にロゴを出したい場合は「ロゴ」、拠点密度を見たい場合は「記号」を選んでください。
        </div>
      </div>

      <div class="fgroup">
        <button class="btn" id="btnFit" style="width:100%;margin-bottom:8px">表示中の拠点にズーム</button>
        <button class="btn" id="btnReset" style="width:100%">初期表示に戻す</button>
      </div>
    `;

    document.getElementById('seg').addEventListener('click', e => {
      const b = e.target.closest('.seg__b');
      if (!b) return;
      document.querySelectorAll('.seg__b').forEach(x => x.classList.toggle('is-on', x === b));
      MapApp.setMarkerMode(b.dataset.mode);
    });

    /* 施設種別 */
    document.getElementById('fTypes').innerHTML = Object.keys(FACILITY_TYPES)
      .sort((a, b) => FACILITY_TYPES[a].order - FACILITY_TYPES[b].order)
      .map(k => row('types', k, FACILITY_TYPES[k].label, TYPE_COLOR[k])).join('');

    /* 地域 */
    if (showRegions) {
      document.getElementById('fRegions').innerHTML =
        regionsInScope().map(rg => row('regions', rg, rg, null)).join('');
    }

    /* データ確度 */
    document.getElementById('fConfs').innerHTML = ['high', 'medium', 'low']
      .map(k => row('confs', k, CONF_LABEL[k], CONF_COLOR[k])).join('');

    /* 企業 */
    document.getElementById('fCompanies').innerHTML = COMPANIES
      .filter(c => scope.some(s => s.c === c.id))
      .map(c => row('companies', c.id, c.short, c.color)).join('');

    el.addEventListener('change', e => {
      const cb = e.target.closest('input[type=checkbox]');
      if (!cb) return;
      const set = state[cb.dataset.group];
      cb.checked ? set.add(cb.value) : set.delete(cb.value);
      apply();
    });

    el.addEventListener('click', e => {
      const btn = e.target.closest('[data-all]');
      if (!btn) return;
      const g = btn.dataset.all;
      const boxes = [...el.querySelectorAll(`input[data-group="${g}"]`)];
      const turnOn = boxes.some(b => !b.checked);
      boxes.forEach(b => { b.checked = turnOn; turnOn ? state[g].add(b.value) : state[g].delete(b.value); });
      apply();
    });

    document.getElementById('q').addEventListener('input', e => {
      state.q = e.target.value.trim().toLowerCase();
      apply();
    });

    document.getElementById('btnFit').addEventListener('click', () => MapApp.fitAll(filtered()));
    document.getElementById('btnReset').addEventListener('click', () => {
      MapApp.reset(); closeDetail();
    });
  }

  function row(group, value, label, color) {
    const sw = color ? `<span class="chk__swatch" style="background:${color}"></span>` : '';
    return `<label class="chk">
      <input type="checkbox" data-group="${group}" value="${value}" checked>
      <span class="chk__box"></span>${sw}
      <span class="chk__label">${label}</span>
      <span class="chk__count" data-count="${group}:${value}"></span>
    </label>`;
  }

  /* ---------- フィルタ適用 ---------- */
  function filtered() {
    return scope.filter(s =>
      state.companies.has(s.c) &&
      s.t.some(t => state.types.has(t)) &&
      state.regions.has(s.reg) &&
      state.confs.has(s.conf) &&
      (!state.q || matches(s))
    );
  }

  function matches(s) {
    const co = COMPANY_MAP[s.c];
    return (s.n + s.ln + s.addr + s.prod + s.ctry + (s.pref || '') + co.name + co.short)
      .toLowerCase().includes(state.q);
  }

  function apply() {
    const list = filtered();
    MapApp.render(list);
    updateCounts(list);
    updateStats(list);
  }

  function updateCounts(list) {
    document.querySelectorAll('[data-count]').forEach(el => {
      const [g, v] = el.dataset.count.split(/:(.+)/);
      let n;
      if (g === 'companies')   n = list.filter(s => s.c === v).length;
      else if (g === 'types')  n = list.filter(s => s.t.includes(v)).length;
      else if (g === 'confs')  n = list.filter(s => s.conf === v).length;
      else                     n = list.filter(s => s.reg === v).length;
      el.textContent = n;
      el.closest('.chk').classList.toggle('is-off', n === 0);
    });
  }

  function updateStats(list) {
    const n = t => list.filter(s => s.t.includes(t)).length;
    document.getElementById('statTotal').textContent = list.length;
    document.getElementById('statHq').textContent  = n('hq');
    document.getElementById('statRd').textContent  = n('rd');
    document.getElementById('statMfg').textContent = n('mfg');
    const cEl = document.getElementById('statCountries');
    if (cEl) cEl.textContent = new Set(list.map(s => s.ctry)).size;
  }

  /* ---------- 凡例 ---------- */
  function buildLegend() {
    document.getElementById('legendRows').innerHTML = Object.keys(FACILITY_TYPES)
      .sort((a, b) => FACILITY_TYPES[a].order - FACILITY_TYPES[b].order)
      .map(k => `<div class="legend__row">
        <span class="legend__ico" style="background:${TYPE_COLOR[k]}">${TYPE_ICON[k]}</span>
        <span>${FACILITY_TYPES[k].label}　<span style="color:var(--ink-4)">${FACILITY_TYPES[k].desc}</span></span>
      </div>`).join('') + `
      <div class="legend__row" style="margin-top:9px;padding-top:9px;border-top:1px solid var(--line)">
        <span class="legend__ico" style="background:var(--conf-low);font-size:8px;color:#fff;font-weight:700">!</span>
        <span>所在地 要確認　<span style="color:var(--ink-4)">二次情報ベース</span></span>
      </div>
      <div class="legend__row">
        <span class="legend__ico" style="background:var(--conf-low);font-size:7.5px;color:#fff;font-weight:700">都</span>
        <span>都市未特定　<span style="color:var(--ink-4)">首都に仮プロット</span></span>
      </div>`;
  }

  /* ---------- 詳細パネル ---------- */
  function openDetail(site) {
    const co = COMPANY_MAP[site.c];
    const tags = typeLabels(site.t).map(l => {
      const key = Object.keys(FACILITY_TYPES).find(k => FACILITY_TYPES[k].label === l);
      return `<span class="tag tag--${key}">${l}</span>`;
    }).join(' ');

    const confLabel = { high: '高（公式サイトに住所記載）', medium: '中（公式に都市名まで記載）', low: '低（二次情報・要確認）' }[site.conf];
    const geoLabel  = { exact: '住所ベース', city: '市区町村中心',
                        country: `首都（${site.capital || '—'}）に仮プロット` }[site.geo];

    document.getElementById('detailBody').innerHTML = `
      <div class="detail__head">
        <div class="tt__brand">
          <span class="tt__wm">${wordmarkHtml(co, 22)}</span>
          <span class="tt__cot" style="border-color:${co.color}">${co.short}</span>
        </div>
        <div class="h2">${site.n}</div>
        <div style="font-size:12px;color:var(--ink-2);margin:6px 0 12px">${site.ln}</div>
        <div>${tags}${site.conf === 'low' ? ' <span class="tag tag--warn">要確認</span>' : ''}</div>
      </div>

      ${site.capital ? `<div class="detail__sec" style="background:rgba(181,121,63,.06)">
        <div class="detail__k" style="color:var(--conf-low)">⚠ 所在都市 未特定</div>
        <div class="detail__v">
          公開情報では国名までしか確認できていないため、<b>${site.ctry}の首都（${site.capital}）に仮プロット</b>しています。
          実際の所在地は異なります。仕入先への確認が必要です。
        </div>
      </div>` : site.conf === 'low' ? `<div class="detail__sec" style="background:rgba(181,121,63,.06)">
        <div class="detail__k" style="color:var(--conf-low)">⚠ 所在地 要確認</div>
        <div class="detail__v">二次情報をもとにしたプロットです。番地・施設の特定には確認が必要です。</div>
      </div>` : ''}

      <div class="detail__sec">
        <div class="detail__k">所在地</div>
        <div class="detail__v">${site.addr}</div>
        <div style="margin-top:10px">
          <a class="btn" target="_blank" rel="noopener"
             href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(site.addr)}">
             Google マップで開く ↗</a>
        </div>
      </div>

      <div class="detail__sec">
        <div class="detail__k">主要製品／機能</div>
        <div class="detail__v">${site.prod}</div>
      </div>

      <div class="detail__sec">
        <div class="detail__k">企業プロファイル</div>
        <div class="detail__v">
          <div style="margin-bottom:6px"><b>担当領域</b>　${co.category}</div>
          <div style="margin-bottom:6px"><b>主要製品</b>　${co.products}</div>
          <div style="margin-bottom:6px"><b>備考</b>　${co.note}</div>
          <a href="${co.url}" target="_blank" rel="noopener"
             style="color:var(--accent-2);border-bottom:1px solid var(--line-2)">公式サイト ↗</a>
        </div>
      </div>

      <div class="detail__sec" style="border-bottom:0">
        <div class="detail__k">データ品質</div>
        <div class="detail__v">
          <div>出典　${site.src}</div>
          <div>確度　${confLabel}</div>
          <div>座標　${geoLabel}（${site.lat.toFixed(4)}, ${site.lng.toFixed(4)}）</div>
        </div>
      </div>
    `;
    document.getElementById('detail').classList.add('is-open');
  }

  function closeDetail() {
    document.getElementById('detail').classList.remove('is-open');
    MapApp.select(null);
  }

  return { init, openDetail, closeDetail, filtered };
})();
