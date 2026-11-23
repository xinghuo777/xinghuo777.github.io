/* ================= 丁火个人站 · 应用逻辑 ================= */

/* Waline 评论配置：填入你的 serverURL 后，评论区自动启用。
   获取方式：注册 LeanCloud（国际版）→ 按 Waline 文档部署 → 得到形如
   https://your-app.vercel.app 的地址，填到下面引号里即可。 */
const WALINE_SERVER_URL = '';

(function () {
  'use strict';
  const S = window.DINGHUO_SITE;
  const N = window.DINGHUO_NOTES || { notes: [], extras: [] };

  /* ---------- 工具函数 ---------- */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  const notesByNum = {};
  N.notes.forEach(n => { notesByNum[n.num] = n; });
  const extrasByName = {};
  N.extras.forEach(e => { extrasByName[e.title] = e; });

  function renderBody(body) {
    const lines = body.split(/\r?\n/);
    const blocks = [];
    let para = [];
    const isHeading = (l) => l.trim().length <= 18 && !/[。！？…，、；：,.!?;:]$/.test(l.trim());
    const flush = () => { if (para.length) { blocks.push(['p', para.join('<br>')]); para = []; } };
    lines.forEach(l => {
      const t = l.trim();
      if (!t) { flush(); return; }
      if (para.length === 0 && /^>/.test(t)) {
        blocks.push(['q', t.replace(/^>\s*/, '')]);
      } else if (para.length === 0 && isHeading(t)) {
        blocks.push(['h4', t]);
      } else {
        para.push(t);
      }
    });
    flush();
    return blocks.map(b => {
      if (b[0] === 'h4') return '<h4>' + esc(b[1]) + '</h4>';
      if (b[0] === 'q') return '<blockquote>' + esc(b[1]) + '</blockquote>';
      return '<p>' + esc(b[1]) + '</p>';
    }).join('');
  }

  /* ---------- 导航 ---------- */
  const NAV = [
    ['#/', '总纲'], ['#/system', '体系'], ['#/wuxing', '道法术器势'],
    ['#/review', '每日复盘'], ['#/reviews', '复盘日志'], ['#/peak', '波峰'], ['#/notes', '笔记'], ['#/qa', '问答'],
  ];

  function head(kicker, title, desc) {
    const d = desc ? '<div class="desc">' + esc(desc) + '</div>' : '';
    return '<div class="section-head"><div class="kicker">' + esc(kicker) + '</div><h2>' + esc(title) + '</h2>' + d + '</div>';
  }

  /* ---------- 各页 ---------- */
  function pageHome() {
    return `
      <div class="hero">
        <div class="seal">丁火</div>
        <h1>从一个被市场逼出来的自己，<br>走到一个<span class="motto">稳得住的自己</span>。</h1>
        <p class="lead">${esc(S.site.desc)}</p>
        <p class="sub">${esc(S.site.motto)} —— 法是体系与规则，道是自知、自控、自诚。</p>
        <div class="hero-meta">
          <div class="item"><span class="num">62</span><span class="lab">篇笔记</span></div>
          <div class="item"><span class="num">4</span><span class="lab">大体系模块</span></div>
          <div class="item"><span class="num">5</span><span class="lab">层方法论 · 道法术器势</span></div>
          <div class="item"><span class="num">6</span><span class="lab">年交易修行</span></div>
        </div>
      </div>
      ${head('六年之路', '三个转身', '')}
      <div class="card">
        <div class="sys-points" style="margin-top:0">
          <div class="p"><b>从向外求，到向内扎根</b><span>不再四处翻牛股，答案全在自己的规则里。</span></div>
          <div class="p"><b>从想暴富，到享受慢富</b><span>不追涨停，追求账户曲线平稳向上。慢，才是快。</span></div>
          <div class="p"><b>从手忙脚乱，到肌肉记忆</b><span>面对暴跌，身体比大脑先执行——体系长成了本能。</span></div>
        </div>
      </div>
      ${head('核心铁律', '贯穿不变的六条', '散见各篇，是体系的底色。')}
      <div class="card tbl-wrap"><table><tbody>
        ${['不预测，只应对', '不战胜市场，与之共生', '把确定留给规则，把意外交给防范', '空仓是交易的一部分', '盈亏同源，向死而生', '认知决定结果']
          .map((t, i) => '<tr><td>0' + (i + 1) + '</td><td>' + esc(t) + '</td></tr>').join('')}
      </tbody></table></div>
    `;
  }

  function pageSystem() {
    const extend = '<div class="related-notes" style="margin-top:20px"><div class="lab">延伸文档</div><div class="note-chips">' +
      '<span class="chip" data-tool="交易体系全梳理">交易体系全梳理（全文）</span>' +
      '<span class="chip" data-tool="空仓期备战清单">空仓期备战清单</span></div></div>';
    return head('交易体系', '四大模块', '大盘环境 · 板块共振 · 信号执行 · 风控铁律。') +
      S.system.map(m => `
        <div class="card sys-card">
          <div class="tag">${esc(m.tag)}</div>
          <h3>${esc(m.title)}</h3>
          <div class="quote">${esc(m.quote)}</div>
          ${m.body.map(p => '<p>' + esc(p) + '</p>').join('')}
          <div class="sys-points">
            ${m.points.map(p => '<div class="p"><b>' + esc(p[0]) + '</b><span>' + esc(p[1]) + ' · ' + esc(p[2]) + '</span></div>').join('')}
          </div>
        </div>`).join('') + extend;
  }

  let wuxingCurrent = 'dao';

  function wuxingPanel(k) {
    const w = S.wuxing.find(x => x.key === k);
    if (!w) return '';
    const noteChips = w.notes.map(n => {
      const note = notesByNum[n];
      return note ? '<span class="chip" data-note="' + n + '">' + esc(note.num) + ' · ' + esc(note.title) + '</span>' : '';
    }).join('');
    const toolChips = (w.tools || []).map(t =>
      '<span class="chip" data-tool="' + esc(t) + '">' + esc(t) + '</span>').join('');
    const related = (noteChips || toolChips)
      ? '<div class="related-notes"><div class="lab">相关笔记</div><div class="note-chips">' + noteChips + toolChips + '</div></div>' : '';
    return `
      <div class="card wuxing-panel">
        <h3>${esc(w.name)}</h3>
        <div class="en">${esc(w.en)}</div>
        <div class="def">${esc(w.def)}</div>
        ${w.body.map(p => '<p>' + esc(p) + '</p>').join('')}
        ${related}
      </div>`;
  }

  function pageWuxing() {
    const navBtns = S.wuxing.map(w =>
      '<button data-w="' + w.key + '" class="' + (w.key === wuxingCurrent ? 'active' : '') + '">' +
      esc(w.name) + '<small>' + esc(w.en.split('·')[0]) + '</small></button>').join('');
    return head('道法术器势', '五层框架', '以道御术，术皆可成。') +
      '<div class="wuxing-order">' + esc(S.wuxingOrder) + '</div>' +
      '<div class="wuxing-nav">' + navBtns + '</div>' +
      '<div class="wuxing-body">' + wuxingPanel(wuxingCurrent) + '</div>';
  }

  let notesFilter = 'all';
  const NOTES_STAGES = ['筑基', '磨道', '升华', '落地'];

  function notesList() {
    const items = N.notes.filter(n => notesFilter === 'all' || n.stage === notesFilter);
    return '<div class="note-list">' + items.map(n => `
      <div class="note-item" data-note="${n.num}">
        <span class="num">${String(n.num).padStart(2, '0')}</span>
        <span class="tt">${esc(n.title)}</span>
        <span class="tags"><span>${esc(n.stage || '')}</span></span>
      </div>`).join('') + '</div>';
  }

  function pageNotes() {
    const btns = [['all', '全部'], ...NOTES_STAGES.map(s => [s, s])]
      .map(([v, l]) => '<button data-f="' + v + '" class="' + (notesFilter === v ? 'active' : '') + '">' + l + '</button>').join('');
    return head('笔记归档', '62 篇 · 按阶段', '从一个被市场逼出来的自己，走到一个稳得住的自己。') +
      '<div class="notes-toolbar">' + btns + '</div>' + notesList();
  }

  function pageReview() {
    const steps = S.review.steps.map(s =>
      '<div class="step"><div class="n">' + esc(s.n) + '</div><h4>' + esc(s.t) + '</h4><p>' + esc(s.d) + '</p></div>').join('');
    const score = S.review.score.map(r => '<tr><td>' + esc(r[0]) + '</td><td>' + esc(r[1]) + '</td></tr>').join('');
    const emo = S.review.emotion.map(r => '<tr><td>' + esc(r[0]) + '</td><td>' + esc(r[1]) + '</td></tr>').join('');
    return `
      ${head('每日复盘', '四步复盘法', S.review.intro)}
      <div class="steps">${steps}</div>
      <div class="rule-callout">${esc(S.review.note)}</div>
      ${head('执行评分', '操作执行 0–10 分', '')}
      <div class="card tbl-wrap"><table><tbody>${score}</tbody></table></div>
      ${head('情绪分级', '情绪是交易真正的对手盘', '')}
      <div class="card tbl-wrap"><table><tbody>${emo}</tbody></table></div>
    `;
  }

  function pagePeak() {
    const steps = S.peak.steps.map(s =>
      '<div class="step"><div class="n">' + esc(s.n) + '</div><h4>' + esc(s.t) + '</h4><p>' + esc(s.d) + '</p></div>').join('');
    const feats = S.peak.features.map(f => '<tr><td>' + esc(f[0]) + '</td><td>' + esc(f[1]) + '</td><td>' + esc(f[2]) + '</td></tr>').join('');
    return `
      ${head('波峰分析', '微积分方法', S.peak.intro)}
      <div class="steps">${steps}</div>
      <div class="rule-callout">${esc(S.peak.rule)}</div>
      ${head('特性', '多周期 · 收盘价口径', '')}
      <div class="card tbl-wrap"><table><tbody>${feats}</tbody></table></div>
      <div class="rule-callout" style="background:var(--accent-soft);border-color:var(--accent);color:#7a2d1f">${esc(S.peak.note)}</div>
    `;
  }

  function clsD(d) {
    if (d === 'up') return 'bd-up';
    if (d === 'down') return 'bd-down';
    if (d === 'dim') return 'bd-dim';
    return '';
  }
  function signCls(s) {
    const t = String(s || '').trim();
    if (t[0] === '+') return 'bd-up';
    if (t[0] === '-') return 'bd-down';
    return '';
  }

  function renderBoard(r) {
    const b = r.board;
    const env = b.env || {};
    const sig = b.signal || {};
    const sec = b.sectors || {};
    const emo = b.emotion || {};
    const ins = b.insight || {};

    const indices = (env.indices || []).map(x =>
      '<tr><td>' + esc(x.n) + '</td><td>' + esc(x.c) + '</td><td class="' + clsD(x.d) + '">' + esc(x.chg) + '</td></tr>').join('');
    const breadth = (env.breadth || []).map(x =>
      '<span class="bd-chip">' + esc(x.l) + ' <b class="' + clsD(x.d) + '">' + esc(x.v) + '</b></span>').join('');
    const tech = (env.tech || []).map(x =>
      '<div class="bd-kv"><span>' + esc(x.k) + '</span><span class="' + clsD(x.d) + '">' + esc(x.v) + '</span></div>').join('');
    const envVerdicts = (env.verdicts || []).map(v =>
      '<div class="bd-verdict' + (v.em ? ' em' : '') + '"><span class="bd-lead">' + esc(v.lead) + '</span><span>' + esc(v.body) + '</span></div>').join('');

    const layers = (sig.pathA && sig.pathA.layers || []).map(l =>
      '<div class="bd-layer"><span class="bd-mark ' + clsD(l.d) + '">' + esc(l.mark) + '</span><div><b>' + esc(l.t) + '</b> <span class="' + clsD(l.d) + '">' + esc(l.status) + '</span><br><span class="bd-dim">' + esc(l.body) + '</span></div></div>').join('');
    const pathBItems = (sig.pathB && sig.pathB.items || []).map(it =>
      '<div class="bd-layer"><div><b>' + esc(it.t) + '</b> <span class="' + clsD(it.d) + '">' + esc(it.status) + '</span><br><span class="bd-dim">' + esc(it.body) + '</span></div></div>').join('');

    const indRows = (sec.industries && sec.industries.rows || []).map(x =>
      '<tr><td>' + esc(x.n) + '</td><td class="' + signCls(x.d) + '">' + esc(x.d) + '</td><td class="' + signCls(x.d5) + '">' + esc(x.d5) + '</td><td class="' + signCls(x.d20) + '">' + esc(x.d20) + '</td><td class="bd-dim">' + esc(x.leader) + '</td></tr>').join('');
    const indHead = (sec.industries && sec.industries.head || []).map(h => '<th>' + esc(h) + '</th>').join('');
    const concepts = (sec.concepts && sec.concepts.items || []).map(x =>
      '<span class="bd-chip">' + esc(x.n) + ' <b class="' + signCls(x.chg) + '">' + esc(x.chg) + '</b> <span class="bd-dim">' + esc(x.d5) + '</span></span>').join('');
    const funds = (sec.funds && sec.funds.items || []).map(x =>
      '<span class="bd-chip">' + esc(x.n) + ' <b class="' + signCls(x.chg) + '">' + esc(x.chg) + '</b> ' +
      '<span class="' + signCls(x.day) + '">' + esc(x.day) + '</span> / <span class="' + signCls(x.d5) + '">' + esc(x.d5) + '</span> <span class="bd-dim">' + esc(x.ratio) + '</span></span>').join('');
    const secVerdicts = (sec.verdicts || []).map(v =>
      '<div class="bd-verdict"><span class="bd-lead">' + esc(v.lead) + '</span><span>' + esc(v.body) + '</span></div>').join('');

    const coach = (b.coach || []).map(c => '<div>' + esc(c) + '</div>').join('');

    return `
    <div class="card board">
      <div class="board-head">
        <span class="board-date">${esc(r.date)}</span>
        <span class="board-tag">${esc(r.tag || '')}</span>
      </div>

      <section class="bd-sec">
        <h3 class="bd-h"><span class="bd-num">壹</span>大盘环境</h3>
        ${indices ? '<table class="bd-table"><tbody><tr><th>指数</th><th>收盘</th><th>涨跌</th></tr>' + indices + '</tbody></table>' : ''}
        ${breadth ? '<div class="bd-chips">' + breadth + '</div>' : ''}
        ${env.shape ? '<div class="bd-box warn"><div class="bd-label">' + esc(env.shape.title) + '</div><div class="bd-boxbody">' + esc(env.shape.body) + '</div></div>' : ''}
        ${env.anchor ? '<div class="bd-box"><div class="bd-label">' + esc(env.anchor.title) + '</div>' + (env.anchor.body || []).map(p => '<div class="bd-boxbody">' + esc(p) + '</div>').join('') + (env.anchor.flag ? '<div class="bd-flag">' + esc(env.anchor.flag) + '</div>' : '') + '</div>' : ''}
        ${tech ? '<div class="bd-kvwrap">' + tech + '</div>' : ''}
        ${envVerdicts}
      </section>

      <section class="bd-sec">
        <h3 class="bd-h"><span class="bd-num">贰</span>止跌信号 · 双路径</h3>
        ${sig.pathA ? '<div class="bd-sub">' + esc(sig.pathA.title) + ' —— ' + esc(sig.pathA.desc) + '</div>' + layers : ''}
        ${sig.pathB ? '<div class="bd-box warn"><div class="bd-label">' + esc(sig.pathB.title) + '</div>' + (sig.pathB.note ? '<div class="bd-boxbody">' + esc(sig.pathB.note) + '</div>' : '') + pathBItems + (sig.pathB.flag ? '<div class="bd-flag">' + esc(sig.pathB.flag) + '</div>' : '') + '</div>' : ''}
      </section>

      <section class="bd-sec">
        <h3 class="bd-h"><span class="bd-num">叁</span>板块扫描</h3>
        ${indRows ? '<div class="bd-sub">' + esc(sec.industries.title) + '</div><table class="bd-table"><tbody><tr>' + indHead + '</tr>' + indRows + '</tbody></table>' : ''}
        ${concepts ? '<div class="bd-sub">' + esc(sec.concepts.title) + '</div><div class="bd-chips">' + concepts + '</div>' : ''}
        ${funds ? '<div class="bd-sub">' + esc(sec.funds.title) + '</div><div class="bd-chips">' + funds + '</div>' : ''}
        ${secVerdicts}
      </section>

      <section class="bd-sec">
        <h3 class="bd-h"><span class="bd-num">肆</span>情绪状态</h3>
        <div class="bd-state"><span class="bd-state-name">${esc(emo.state || '')}</span><span class="bd-dim">${esc(emo.tag || '')}</span></div>
        ${emo.body ? '<div class="bd-verdict"><span class="bd-lead">丁火自述</span><span>' + esc(emo.body) + '</span></div>' : ''}
        ${emo.record ? '<div class="bd-verdict"><span class="bd-lead">值得记一笔</span><span>' + esc(emo.record) + '</span></div>' : ''}
      </section>

      <section class="bd-sec">
        <h3 class="bd-h"><span class="bd-num">伍</span>心法碎片</h3>
        ${ins.text ? '<div class="bd-xin">' + esc(ins.text) + '<span class="bd-xin-src">— ' + esc(ins.src || '') + ' —</span></div>' : ''}
        ${ins.body ? '<div class="bd-verdict"><span>' + esc(ins.body) + '</span></div>' : ''}
      </section>

      ${coach ? '<div class="bd-coach">' + coach + '</div>' : ''}
    </div>`;
  }

  function pageReviews() {
    const R = window.DINGHUO_REVIEWS || [];
    const body = R.length
      ? R.map(r => r.board
          ? renderBoard(r)
          : `
        <div class="card review-item">
          <div class="review-head">
            <span class="review-date">${esc(r.date)}</span>
            <span class="review-env">${esc(r.env || '')}${r.emotion ? ' · ' + esc(r.emotion) : ''}</span>
          </div>
          ${r.envDetail ? '<p class="review-detail">' + esc(r.envDetail) + '</p>' : ''}
          ${(r.sectors || []).length ? '<div class="review-sectors">' + r.sectors.map(s => '<span class="chip">' + esc(s) + '</span>').join('') + '</div>' : ''}
          ${r.insight ? '<blockquote class="review-insight">' + esc(r.insight) + '</blockquote>' : ''}
          ${r.coach ? '<p class="review-coach">' + esc(r.coach) + '</p>' : ''}
        </div>`).join('')
      : '<div class="card"><p style="color:var(--muted)">暂无复盘记录。等复盘后，这里会一条条沉淀下来。</p></div>';
    return head('复盘日志', '每日 · 公开版', '完整看板：大盘环境、止跌信号、板块扫描、情绪状态、心法碎片、教练寄语——隐去操作与持仓。') + body;
  }

  function pageQA() {
    const ready = WALINE_SERVER_URL && WALINE_SERVER_URL.length > 3;
    const inner = ready
      ? '<div id="waline"></div>'
      : '<div class="rule-callout qa-note">评论与提问功能后续开放，先看看其他板块。</div>';
    return `
      ${head('问答', '评论 · 提问', '有问题直接问，我会看。')}
      <div class="qa-intro"><p>这里可以留言、提问、交流。你问，我答；你不问，我就安静。</p></div>
      <div class="card">${inner}</div>
    `;
  }

  /* ---------- 笔记弹层 ---------- */
  function openNote(num) {
    const n = notesByNum[num];
    if (!n) return;
    document.getElementById('modalTitle').textContent = '第 ' + n.num + ' 篇 · ' + n.title;
    document.getElementById('modalMeta').textContent = (n.stage ? n.stage + ' 阶段' : '') + (n.wuxing ? ' · 属' + n.wuxing : '');
    document.getElementById('modalBody').innerHTML = renderBody(n.body);
    document.getElementById('modal').classList.add('on');
    document.body.style.overflow = 'hidden';
  }

  function openTool(title) {
    const e = extrasByName[title];
    if (!e) return;
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalMeta').textContent = '工具文档';
    document.getElementById('modalBody').innerHTML = renderBody(e.body);
    document.getElementById('modal').classList.add('on');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    document.getElementById('modal').classList.remove('on');
    document.body.style.overflow = '';
  }

  /* ---------- 事件委托 ---------- */
  function delegate(e) {
    const t = e.target;
    const wBtn = t.closest('.wuxing-nav button');
    if (wBtn) {
      wuxingCurrent = wBtn.getAttribute('data-w');
      document.querySelectorAll('.wuxing-nav button').forEach(b =>
        b.classList.toggle('active', b === wBtn));
      document.querySelector('.wuxing-body').innerHTML = wuxingPanel(wuxingCurrent);
      return;
    }
    const fBtn = t.closest('.notes-toolbar button');
    if (fBtn) {
      notesFilter = fBtn.getAttribute('data-f');
      document.querySelectorAll('.notes-toolbar button').forEach(b =>
        b.classList.toggle('active', b === fBtn));
      const old = document.querySelector('.note-list');
      if (old) old.outerHTML = notesList();
      return;
    }
    const chip = t.closest('.chip');
    if (chip) {
      if (chip.hasAttribute('data-note')) openNote(parseInt(chip.getAttribute('data-note'), 10));
      else if (chip.hasAttribute('data-tool')) openTool(chip.getAttribute('data-tool'));
      return;
    }
    const ni = t.closest('.note-item');
    if (ni && ni.hasAttribute('data-note')) { openNote(parseInt(ni.getAttribute('data-note'), 10)); return; }
  }

  /* ---------- 路由 ---------- */
  const PAGES = {
    '': pageHome, 'system': pageSystem, 'wuxing': pageWuxing,
    'review': pageReview, 'reviews': pageReviews, 'peak': pagePeak, 'notes': pageNotes, 'qa': pageQA,
  };

  function route() {
    let h = location.hash.replace(/^#\/?/, '');
    if (!(h in PAGES)) h = '';
    document.getElementById('main').innerHTML = PAGES[h]();
    document.querySelectorAll('#nav a').forEach(a =>
      a.classList.toggle('active', a.getAttribute('data-hash') === '#/' + h));
    window.scrollTo({ top: 0 });
    initWaline();
  }

  /* ---------- Waline ---------- */
  function initWaline() {
    if (!WALINE_SERVER_URL || WALINE_SERVER_URL.length < 3) return;
    if (document.getElementById('waline') && typeof window.Waline === 'undefined') {
      const s = document.createElement('script');
      s.src = 'https://unpkg.com/@waline/client@3/dist/waline.js';
      s.onload = () => window.Waline.init({
        el: '#waline', serverURL: WALINE_SERVER_URL, dark: false, lang: 'zh-CN',
        locale: { placeholder: '写下你的问题或想法…' },
      });
      document.head.appendChild(s);
    } else if (document.getElementById('waline') && typeof window.Waline !== 'undefined' && window.Waline._instances) {
      // 已初始化则跳过
    }
  }

  /* ---------- 启动 ---------- */
  function boot() {
    document.getElementById('nav').innerHTML = NAV.map(([h, label]) =>
      '<a href="' + h + '" data-hash="' + h + '">' + label + '</a>').join('');
    window.addEventListener('hashchange', route);
    document.getElementById('main').addEventListener('click', delegate);
    document.getElementById('modalClose').addEventListener('click', closeModal);
    document.getElementById('modal').addEventListener('click', (e) => {
      if (e.target === document.getElementById('modal')) closeModal();
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
    const menuBtn = document.getElementById('menuBtn');
    menuBtn.addEventListener('click', () => document.getElementById('nav').classList.toggle('open'));
    document.getElementById('nav').addEventListener('click', () =>
      document.getElementById('nav').classList.remove('open'));
    route();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
