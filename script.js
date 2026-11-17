/* Pookie Caption – style engine + UI. Vanilla JS, no dependencies. */
(() => {
'use strict';
const $ = s => document.querySelector(s);
const BN = /[\u0980-\u09FF]/, SAMPLE = 'Pookie Caption', BSAMPLE = 'আমার সোনার বাংলা';
const U = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', W = 'abcdefghijklmnopqrstuvwxyz', D = '0123456789';
const cp = String.fromCodePoint;

/* ---------- 1. Mapping builders (code-point offsets + exceptions) ---------- */
// x('ab','AB') -> {a:'A', b:'B'}; Array.from keeps surrogate pairs intact
const x = (a, b) => { const r = Array.from(b); return Object.fromEntries(Array.from(a).map((c, i) => [c, r[i]])); };
// mk(upperStart, lowerStart, digitStart, exceptions) -> char map
const mk = (u, l, d, e) => {
  const m = {};
  for (let i = 0; i < 26; i++) { m[U[i]] = cp(u + i); m[W[i]] = cp(l + i); }
  if (d) for (let i = 0; i < 10; i++) m[D[i]] = cp(d + i);
  return Object.assign(m, e);
};
const both = s => ({ ...x(W, s), ...x(U, s) });
const M = {
  bold: mk(0x1D400, 0x1D41A, 0x1D7CE),
  ital: mk(0x1D434, 0x1D44E, 0, x('h', 'ℎ')),
  bi: mk(0x1D468, 0x1D482),
  sans: mk(0x1D5A0, 0x1D5BA, 0x1D7E2),
  sb: mk(0x1D5D4, 0x1D5EE, 0x1D7EC),
  si: mk(0x1D608, 0x1D622),
  sbi: mk(0x1D63C, 0x1D656),
  mono: mk(0x1D670, 0x1D68A, 0x1D7F6),
  ds: mk(0x1D538, 0x1D552, 0x1D7D8, x('CHNPQRZ', 'ℂℍℕℙℚℝℤ')),
  scr: mk(0x1D49C, 0x1D4B6, 0, x('BEFHILMRego', 'ℬℰℱℋℐℒℳℛℯℊℴ')),
  bs: mk(0x1D4D0, 0x1D4EA),
  fr: mk(0x1D504, 0x1D51E, 0, x('CHIRZ', 'ℭℌℑℜℨ')),
  bf: mk(0x1D56C, 0x1D586),
  fw: mk(0xFF21, 0xFF41, 0xFF10),
  circ: mk(0x24B6, 0x24D0, 0, x(D, '⓪①②③④⑤⑥⑦⑧⑨')),
  bcirc: mk(0x1F150, 0x1F150, 0, x(D, '⓿❶❷❸❹❺❻❼❽❾')),
  sq: mk(0x1F130, 0x1F130),
  bsq: mk(0x1F170, 0x1F170),
  par: mk(0x1F110, 0x249C, 0, x('123456789', '⑴⑵⑶⑷⑸⑹⑺⑻⑼')),
  sc: both('ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘǫʀꜱᴛᴜᴠᴡxʏᴢ'),
  sup: { ...both('ᵃᵇᶜᵈᵉᶠᵍʰⁱʲᵏˡᵐⁿᵒᵖᑫʳˢᵗᵘᵛʷˣʸᶻ'), ...x(D, '⁰¹²³⁴⁵⁶⁷⁸⁹') },
  sub: { ...both('ₐbcdₑfgₕᵢⱼₖₗₘₙₒₚqᵣₛₜᵤᵥwₓyz'), ...x(D, '₀₁₂₃₄₅₆₇₈₉') },
  ud: { ...x(W, 'ɐqɔpǝɟɓɥᴉɾʞlɯuodbɹsʇnʌʍxʎz'), ...x(U, '∀ᗺƆᗡƎℲ⅁HIſ⋊˥WNOԀΌᴚS⊥∩ΛMX⅄Z'), ...x(D, '0ƖᄅƐㄣϛ9ㄥ86'), ...x('.,?!\'"()[]<>&_', '˙\'¿¡,„)(][><⅋‾') },
  mr: x('bdpq()[]<>/\\', 'dbqp)(][><\\/')
};

/* ---------- 2. Pure transform functions ---------- */
// Map each code point; unmapped characters (spaces, emoji, Bengali…) pass through
const mp = m => t => Array.from(t).map(c => m[c] || c).join('');
// Reverse text; Bengali runs are kept intact (reversing would break conjuncts)
const rev = m => t => t.split(/([\u0980-\u09FF]+)/).reverse()
  .map(s => BN.test(s) ? s : Array.from(s).reverse().map(c => m[c] || c).join('')).join('');
// Append a mark after every non-Bengali letter/number
const cm = k => t => Array.from(t).map(c => /[\p{L}\p{N}]/u.test(c) && !BN.test(c) ? c + k : c).join('');
const pipe = (...f) => t => f.reduce((a, g) => g(a), t);
const alt = t => { let i = 0; return Array.from(t).map(c => /[A-Za-z]/.test(c) ? (i++ % 2 ? c.toUpperCase() : c.toLowerCase()) : c).join(''); };
// Light Zalgo: deterministic (no flicker on re-render), n marks per ASCII letter
const Z = '\u0300\u0301\u0302\u0303\u0304\u0306\u0307\u0308\u030A\u030B\u030C\u0315\u031B\u0323\u0324\u0325\u0327\u0328\u032E\u0330\u0331\u0338\u033F\u0346\u034A';
const zg = n => t => { let i = 0; return Array.from(t).map(c => { if (!/[A-Za-z0-9]/.test(c)) return c; let s = c; for (let k = 0; k < n; k++) s += Z[(i * 7 + k * 11 + 3) % Z.length]; i++; return s; }).join(''); };
const BD = '০১২৩৪৫৬৭৮৯';
const digits = t => /[০-৯]/.test(t) ? t.replace(/[০-৯]/g, c => D[BD.indexOf(c)]) : t.replace(/[0-9]/g, c => BD[+c]);
// Wrap text in a template; function replacer avoids "$&" surprises in user text
const applyDecoration = (t, tpl) => tpl.replace('{t}', () => t);

/* ---------- 3. Style registry ---------- */
const S = [], add = (n, c, f) => S.push({ n, c, f });
[['Bold','bold','bold'],['Sans Bold','bold','sb'],['Italic','ital','ital'],['Bold Italic','ital','bi'],['Sans Italic','ital','si'],
 ['Sans Bold Italic','ital','sbi'],['Monospace','sym','mono'],['Double-Struck','sym','ds'],['Sans','sym','sans'],['Fullwidth','sym','fw'],
 ['Parenthesized','sym','par'],['Script','script','scr'],['Bold Script','script','bs'],['Fraktur','goth','fr'],['Bold Fraktur','goth','bf'],
 ['Circled','bubble','circ'],['Black Circled','bubble','bcirc'],['Squared','sq','sq'],['Black Squared','sq','bsq'],
 ['Small Caps','tiny','sc'],['Superscript','tiny','sup'],['Subscript','tiny','sub']].forEach(([n, c, k]) => add(n, c, mp(M[k])));
add('Upside-Down', 'flip', rev(M.ud)); add('Reversed', 'flip', rev({})); add('Mirror', 'flip', rev(M.mr));
[['Strikethrough','\u0336'],['Underline','\u0332'],['Double Underline','\u0333'],['Slash Through','\u0338'],['Overline','\u0305'],['Wavy','\u0330']]
  .forEach(([n, m]) => add(n, 'sym', cm(m)));
add('Dotted', 'cute', cm('\u0307'));
add('Spaced', 'cute', t => cm(' ')(t).trimEnd());
add('Alternating Case', 'cute', alt);
add('Heart After Each Letter', 'cute', cm('♡'));
add('Sparkle After Each Letter', 'cute', cm('✧'));
['Light', 'Medium', 'Heavy'].forEach((l, i) => add('Glitch ' + l, 'glitch', zg(i + 1)));
// Base style + line/heart combos
const NM = { bold: 'Bold', bi: 'Bold Italic', scr: 'Script', bs: 'Bold Script', fr: 'Fraktur', ds: 'Double-Struck', sb: 'Sans Bold', mono: 'Monospace', sc: 'Small Caps', fw: 'Fullwidth' };
Object.keys(NM).forEach(k => [['Strikethrough','\u0336'],['Underline','\u0332'],['Hearts','♡']]
  .forEach(([l, m]) => add(NM[k] + ' + ' + l, 'dec', pipe(mp(M[k]), cm(m)))));
// Decorated templates ({t} = the text)
const TPL = ['˚₊‧꒰ა {t} ໒꒱ ‧₊˚','꒰ ♡ {t} ♡ ꒱','✧･ﾟ: *✧･ﾟ:* {t} *:･ﾟ✧*:･ﾟ✧','୨୧ ┈┈┈┈ {t} ┈┈┈┈ ୨୧','⋆｡°✩ {t} ✩°｡⋆','☁︎ {t} ☁︎','ᡣ𐭩 {t} ᡣ𐭩','ꕤ {t} ꕤ',
 '⊹ ࣪ ˖ {t} ˖ ࣪ ⊹','ʚ♡⃛ɞ {t} ʚ♡⃛ɞ','✿ {t} ✿','･ﾟ✧ {t} ✧ﾟ･','🎀 {t} 🎀','♡ {t} ♡','⋆˚࿔ {t} ࿔˚⋆','✦ {t} ✦','⭑.ᐟ {t} ⭑','🦋 {t} 🦋',
 '☆彡 {t} 彡☆','˗ˏˋ {t} ˎˊ˗','♡ ₊˚ {t} ₊˚ ♡','(っ◔◡◔)っ ♡ {t} ♡','✧｡٩(ˊᗜˋ )و✧*｡ {t}','【 {t} 】','❀ {t} ❀','꒰ᐢ. .ᐢ꒱ {t}',
 '⟡ {t} ⟡','★彡 {t} 彡★','˚ʚ🍓ɞ˚ {t} ˚ʚ🍓ɞ˚','˖⁺‧₊˚♡˚₊‧⁺˖ {t} ˖⁺‧₊˚♡˚₊‧⁺˖','♡⃛ {t} ♡⃛','✩ {t} ✩','‧₊˚ ☁️ {t} ☁️ ˚₊‧','౨ৎ {t} ౨ৎ',
 '➳♡ {t} ♡➳','⋆ ˚｡⋆୨୧˚ {t} ˚୨୧⋆｡˚ ⋆'];
const BASE = [t => t, mp(M.bold), mp(M.sc), mp(M.scr), mp(M.sb)];
TPL.forEach((p, i) => add(applyDecoration('…', p), 'dec', t => applyDecoration(BASE[i % 5](t), p)));
// Bengali tab: plain decorations (Bengali text is never transformed)
TPL.forEach(p => add('Bengali · ' + applyDecoration('…', p), 'bn', t => applyDecoration(t, p)));
add('Digits: Bengali ↔ English', 'bn', digits);

/* ---------- 4. State, storage, helpers ---------- */
const CATS = [['all','All'],['fav','Favorites ♡'],['cute','Cute & Aesthetic'],['bold','Bold'],['ital','Italic'],['script','Cursive / Script'],['goth','Gothic / Fraktur'],
 ['bubble','Bubble'],['sq','Squares'],['tiny','Small Caps & Tiny'],['sym','Fancy Symbols'],['dec','Decorated'],['flip','Upside-Down & Mirror'],['glitch','Glitch'],['bn','Bengali']];
const st = { cat: 'all', q: '', n: 30, fav: new Set(), bn: false };
let cur = [];
try { st.fav = new Set(JSON.parse(localStorage.getItem('pc_fav') || '[]')); } catch (e) {}
const saveFav = () => { try { localStorage.setItem('pc_fav', JSON.stringify([...st.fav])); } catch (e) {} };
const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const txt = () => { const v = $('#inp').value; return v.trim() ? v : (st.cat === 'bn' ? BSAMPLE : SAMPLE); };
const toast = m => { const e = $('#toast'); e.textContent = m; e.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => e.classList.remove('on'), 1600); };

async function copy(s, via = true) {
  if (via && $('#via').checked) s += '\n— via Pookie Caption';
  let ok = false;
  try { await navigator.clipboard.writeText(s); ok = true; }
  catch (e) { // fallback for older browsers / insecure contexts
    try { const a = document.createElement('textarea'); a.value = s; a.setAttribute('readonly', ''); a.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(a); a.select(); ok = document.execCommand('copy'); a.remove(); } catch (e2) {}
  }
  toast(ok ? 'Copied! ♡' : 'Copy failed – please select the text and copy it manually');
}

/* ---------- 5. Rendering ---------- */
function render() {
  const t = txt(), q = st.q.toLowerCase();
  const l = S.filter(s => (st.cat === 'all' ? s.c !== 'bn' : st.cat === 'fav' ? st.fav.has(s.n) : s.c === st.cat) && s.n.toLowerCase().includes(q));
  cur = l.slice(0, st.n).map(s => ({ s, o: s.f(t) })); // only render a page of cards
  $('#grid').innerHTML = cur.map((r, i) => { const f = st.fav.has(r.s.n), n = esc(r.s.n);
    return `<article class="card"><div class="top"><span class="nm">${n}</span><span><button class="btn sm" data-a="c" data-i="${i}" aria-label="Copy ${n}">Copy</button> <button class="btn sm fv" data-a="f" data-i="${i}" aria-pressed="${f}" aria-label="Favorite ${n}">${f ? '♥' : '♡'}</button></span></div><div class="out" data-a="c" data-i="${i}">${esc(r.o)}</div></article>`; }).join('')
    || '<p class="empty">No styles found ♡</p>';
  $('#more').hidden = l.length <= st.n;
  $('#bnp').hidden = st.cat !== 'bn';
  if (st.cat === 'bn') fonts();
}

/* ---------- 6. Bengali font previews + PNG export ---------- */
// Only Google Fonts families that include the Bengali subset
const F = [['Hind Siliguri',400],['Hind Siliguri',700],['Noto Sans Bengali',400],['Noto Sans Bengali',800],['Noto Serif Bengali',400],['Noto Serif Bengali',700],
 ['Baloo Da 2',500],['Baloo Da 2',800],['Galada',400],['Atma',400],['Atma',700],['Mina',400],['Mina',700],['Tiro Bangla',400],['Anek Bangla',400],['Anek Bangla',800]];
function vars() {
  const f = $('#fonts').style, m = $('#bgm').value;
  f.setProperty('--fs', $('#sz').value + 'px'); f.setProperty('--pfg', $('#fg').value);
  f.setProperty('--pbg', m === 'g' ? 'linear-gradient(135deg,#FFE4EE,#E3D5FF)' : m === 't' ? 'transparent' : $('#bg').value);
}
function fonts() {
  const t = txt();
  $('#fonts').innerHTML = F.map(([n, w], i) => `<div class="fc"><small>${n}${w === 400 ? '' : ' · ' + w}</small><div class="pv" style="font-family:'${n}',sans-serif;font-weight:${w}">${esc(t)}</div><div><button class="btn sm" data-d="${i}">Download PNG</button> <button class="btn sm" data-p="1">Copy plain text</button></div></div>`).join('');
  vars();
}
async function png([n, w]) {
  const t = txt(), fs = +$('#sz').value, font = `${w} ${fs}px "${n}",sans-serif`, r = Math.max(window.devicePixelRatio || 1, 2);
  try { await Promise.all([document.fonts.load(font, t), document.fonts.load('700 14px Quicksand')]); } catch (e) {}
  const c = document.createElement('canvas'), g = c.getContext('2d'), mw = 900, ls = [];
  g.font = font;
  t.split('\n').forEach(p => { let l = ''; p.split(' ').forEach(wd => { const k = l ? l + ' ' + wd : wd; if (l && g.measureText(k).width > mw) { ls.push(l); l = wd; } else l = k; }); ls.push(l); });
  const lh = fs * 1.6, pd = 44, wm = $('#wm').checked, m = $('#bgm').value;
  const CW = Math.ceil(Math.max(...ls.map(l => g.measureText(l).width))) + pd * 2, CH = Math.ceil(ls.length * lh + pd * 2 + (wm ? 20 : 0));
  c.width = CW * r; c.height = CH * r; g.scale(r, r); // sharp output
  if (m !== 't') { let f = $('#bg').value; if (m === 'g') { f = g.createLinearGradient(0, 0, CW, CH); f.addColorStop(0, '#FFE4EE'); f.addColorStop(1, '#E3D5FF'); } g.fillStyle = f; g.fillRect(0, 0, CW, CH); }
  g.font = font; g.fillStyle = $('#fg').value; g.textBaseline = 'middle';
  ls.forEach((l, i) => g.fillText(l, pd, pd + lh * (i + .5)));
  if (wm) { g.font = '700 14px Quicksand,sans-serif'; g.globalAlpha = .6; g.textAlign = 'right'; g.fillText('Pookie Caption', CW - 16, CH - 16); }
  c.toBlob(b => { if (!b) return toast('Export failed'); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'pookie-caption.png'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); toast('Downloaded! ♡'); });
}

/* ---------- 7. Events ---------- */
const setCat = k => { st.cat = k; st.n = 30; document.querySelectorAll('.chip').forEach(b => b.setAttribute('aria-pressed', b.dataset.k === k)); };
$('#chips').innerHTML = CATS.map(([k, l]) => `<button class="chip" data-k="${k}" aria-pressed="${k === 'all'}">${esc(l)}</button>`).join('');
$('#chips').addEventListener('click', e => { const b = e.target.closest('.chip'); if (b) { setCat(b.dataset.k); render(); } });
$('#grid').addEventListener('click', e => {
  const el = e.target.closest('[data-a]'), r = el && cur[el.dataset.i]; if (!r) return;
  if (el.dataset.a === 'c') return copy(r.o);
  const k = r.s.n; st.fav.has(k) ? st.fav.delete(k) : st.fav.add(k); saveFav();
  if (st.cat === 'fav') render(); else { el.textContent = st.fav.has(k) ? '♥' : '♡'; el.setAttribute('aria-pressed', st.fav.has(k)); }
});
$('#fonts').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.d) png(F[b.dataset.d]); else copy(txt(), false); });
let tm;
$('#inp').addEventListener('input', () => {
  const v = $('#inp').value, b = BN.test(v);
  $('#cnt').textContent = Array.from(v).length + ' characters';
  if (b && !st.bn) { setCat('bn'); toast('Bengali text detected ✨'); } // auto-switch once
  st.bn = b; clearTimeout(tm); tm = setTimeout(render, v.length > 200 ? 250 : 40);
});
$('#smp').onclick = () => { $('#inp').value = 'pookie caption'; $('#inp').dispatchEvent(new Event('input')); };
$('#clr').onclick = () => { $('#inp').value = ''; $('#inp').dispatchEvent(new Event('input')); $('#inp').focus(); };
$('#q').addEventListener('input', e => { st.q = e.target.value; st.n = 30; render(); });
$('#more').onclick = () => { st.n += 30; render(); };
['sz', 'fg', 'bg', 'bgm'].forEach(id => $('#' + id).addEventListener('input', vars));
// Cute swatches for text / background colors
const PAL = ['#FFE4EE', '#E3D5FF', '#BFF0DC', '#FFFBF2', '#FFB3CF', '#3B2A3F', '#FF6FA5', '#B79CFF'];
$('#sw').innerHTML = [['fg', 'Text'], ['bg', 'Background']].map(([k, l]) => `<span class="sws">${l} ${PAL.map(c => `<button class="sw" data-k="${k}" data-c="${c}" style="background:${c}" aria-label="${l} ${c}"></button>`).join('')}</span>`).join('');
$('#sw').addEventListener('click', e => { const b = e.target.closest('.sw'); if (b) { $('#' + b.dataset.k).value = b.dataset.c; if (b.dataset.k === 'bg' && $('#bgm').value !== 's') $('#bgm').value = 's'; vars(); } });

/* ---------- 8. Theme (saved preference → system preference) ---------- */
let th; try { th = localStorage.getItem('pc_theme'); } catch (e) {}
if (!th) th = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
const setT = v => { document.documentElement.dataset.theme = v; $('#theme').textContent = v === 'dark' ? '☀️' : '🌙'; $('#theme').setAttribute('aria-pressed', v === 'dark'); };
setT(th);
$('#theme').onclick = () => { th = th === 'dark' ? 'light' : 'dark'; setT(th); try { localStorage.setItem('pc_theme', th); } catch (e) {} };

/* ---------- 9. Floating decorations + first render ---------- */
$('.deco').innerHTML = Array.from({ length: 14 }, (_, i) => `<span style="left:${(i * 73) % 100}%;font-size:${14 + (i * 5) % 16}px;animation-duration:${14 + (i * 3) % 12}s;animation-delay:-${(i * 2) % 14}s">${'✦♡✧♥✿'[i % 5]}</span>`).join('');
render();
$('#inp').focus();
})();
