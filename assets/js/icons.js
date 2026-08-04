/* =============================================================
   ピクトグラム定義
   施設種別アイコン（ライン基調のピクトグラム調）
   ============================================================= */

const TYPE_ICON = {
  /* 本社：オフィスタワー */
  hq: '<svg viewBox="0 0 24 24" aria-hidden="true">' +
      '<path d="M5 21V6l7-3 7 3v15"/><path d="M3 21h18"/>' +
      '<path d="M9.5 9.5h.01M14.5 9.5h.01M9.5 13.5h.01M14.5 13.5h.01"/>' +
      '<path d="M10.5 21v-3.5h3V21"/></svg>',

  /* 開発：フラスコ（研究開発） */
  rd: '<svg viewBox="0 0 24 24" aria-hidden="true">' +
      '<path d="M9.5 3v6.2L4.6 17.6A2 2 0 0 0 6.3 20.7h11.4a2 2 0 0 0 1.7-3.1L14.5 9.2V3"/>' +
      '<path d="M8 3h8"/><path d="M7.2 14.5h9.6"/></svg>',

  /* 製造：工場 */
  mfg: '<svg viewBox="0 0 24 24" aria-hidden="true">' +
       '<path d="M3 21V10l5.5 3.5V10L14 13.5V10l5.5 3.5V21z"/>' +
       '<path d="M2 21h20"/><path d="M5 10V4.5h3V10"/></svg>',

  /* 営業：ブリーフケース */
  sales: '<svg viewBox="0 0 24 24" aria-hidden="true">' +
         '<rect x="2.5" y="7.5" width="19" height="12.5" rx="1.6"/>' +
         '<path d="M8.5 7.5V5.4A1.4 1.4 0 0 1 9.9 4h4.2a1.4 1.4 0 0 1 1.4 1.4v2.1"/>' +
         '<path d="M2.5 12.5h19"/></svg>'
};

/* 施設種別カラー（CSS変数と対応） */
const TYPE_COLOR = {
  hq:    '#23405C',
  rd:    '#4E7C74',
  mfg:   '#9A6B4A',
  sales: '#7C7A8C'
};

/*
  企業ロゴの描画。

  - monogramHtml : 正方形のモノグラムマーク（円形ピン・狭い場所用）
  - wordmarkHtml : 公式ロゴのワードマーク（横に余裕がある場所用）

  公式ロゴは assets/logos/official/ に配置し、COMPANIES の logo / ar で参照する。
  logo が null の企業（サイト側の制約で未取得）はモノグラムにフォールバックする。
*/

/* 正方形モノグラム */
function monogramHtml(co, size) {
  const px = size || 24;
  return '<svg viewBox="0 0 40 40" width="' + px + '" height="' + px + '" ' +
         'role="img" aria-label="' + co.short + '">' +
         '<text x="20" y="20" text-anchor="middle" dominant-baseline="central" ' +
         'font-family="Arial,Helvetica,sans-serif" font-size="' + monoSize(co.mono) + '" ' +
         'font-weight="700" letter-spacing="-0.4" fill="' + co.color + '">' + co.mono + '</text></svg>';
}

/* 公式ワードマーク（未取得の企業はモノグラムを返す） */
function wordmarkHtml(co, height) {
  const h = height || 18;
  if (!co.logo) return monogramHtml(co, h);

  /* 縦分割スプライトのロゴは指定行だけを切り出して表示する */
  if (co.crop) {
    const w = Math.round(h * co.ar);
    return '<span class="wm wm--clip" style="height:' + h + 'px;width:' + w + 'px">' +
             '<img src="' + co.logo + '" alt="' + co.short + '" ' +
             'style="width:' + w + 'px;height:' + (h * co.crop.rows) + 'px;' +
             'transform:translateY(-' + (h * co.crop.row) + 'px)">' +
           '</span>';
  }
  return '<img class="wm" src="' + co.logo + '" alt="' + co.short + '" ' +
         'style="height:' + h + 'px;width:auto;max-width:100%;object-fit:contain">';
}

/* 後方互換：既存呼び出し用のエイリアス */
function logoHtml(co, size) { return monogramHtml(co, size); }

function monoSize(mono) {
  return mono.length >= 3 ? 13 : mono.length === 2 ? 17 : 23;
}

/* ピン内でワードマークを表示する際の幅（高さ22px基準、上限78px） */
function wordmarkWidth(co, h) {
  const height = h || 22;
  if (!co.logo || !co.ar) return height;
  return Math.min(78, Math.max(26, Math.round(height * co.ar)));
}

/* 施設種別を優先度順に並べた代表種別（バッジ表示用） */
function primaryType(types) {
  const order = ['hq', 'mfg', 'rd', 'sales'];
  return order.find(t => types.includes(t)) || types[0];
}

/* 施設種別ラベルの整形 */
function typeLabels(types) {
  return types
    .slice()
    .sort((a, b) => FACILITY_TYPES[a].order - FACILITY_TYPES[b].order)
    .map(t => FACILITY_TYPES[t].label);
}
