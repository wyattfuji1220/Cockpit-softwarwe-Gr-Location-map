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
  assets/logos/<id>.svg を読み込み、失敗した場合はモノグラムにフォールバックする。
  公式ロゴ画像に差し替える場合は同ディレクトリのファイルを置き換えるだけでよい。
*/
function logoHtml(co, size) {
  const px = size || 24;
  const fallback =
    '<svg viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'>' +
    '<text x=\'20\' y=\'20\' text-anchor=\'middle\' dominant-baseline=\'central\' ' +
    'font-family=\'Arial,Helvetica,sans-serif\' font-size=\'' + monoSize(co.mono) + '\' ' +
    'font-weight=\'700\' fill=\'' + co.color + '\'>' + co.mono + '</text></svg>';
  return '<img src="assets/logos/' + co.id + '.svg" alt="' + co.short + '" ' +
         'width="' + px + '" height="' + px + '" ' +
         'onerror="this.outerHTML=' + JSON.stringify(fallback).replace(/"/g, '&quot;') + '">';
}

function monoSize(mono) {
  return mono.length >= 3 ? 13 : mono.length === 2 ? 17 : 23;
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
