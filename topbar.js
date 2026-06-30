// =============================================================
// Persistent dashboard top bar.
// Drop this on any page with:
//     <script src="topbar.js" defer></script>
// It self-injects HTML + CSS, reads progress from the same
// localStorage keys the dashboard's tabs already use, and a
// water "+1" button writes to localStorage and (if configured)
// pushes a merged update to the Supabase health row so the
// new bottle appears on every device within ~1 second.
// =============================================================
(function () {
  'use strict';

  // -------- Supabase config (same project as the rest of the dashboard) --------
  // For your audience's standalone, replace these with placeholders
  // and have them paste their own values, just like the other pages.
  // Prefer Vercel env vars (served via /api/config → window.DASH_*),
  // otherwise fall back to these defaults.
  const TOPBAR_SUPABASE_URL = (window.DASH_SUPABASE_URL) || 'https://srajryooffirbroltjmg.supabase.co';
  const TOPBAR_SUPABASE_KEY = (window.DASH_SUPABASE_KEY) || 'sb_publishable_5142ZwTLF_DkSVRzciNuRA_bHwRAu4c';

  // -------- CSS --------
  const css = `
.topbar {
  position: sticky; top: 0; z-index: 40;
  display: flex; justify-content: flex-end; align-items: center;
  gap: 8px;
  padding: max(10px, env(safe-area-inset-top)) 14px 8px;
  background: #0a0a0b;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, sans-serif;
}
.topbar-water-wrap {
  display: flex; align-items: stretch;
}
.topbar-water-pill {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 9px 14px;
  background: rgba(125, 211, 252, 0.08);
  border: 1px solid rgba(125, 211, 252, 0.16);
  border-right: none;
  border-radius: 12px 0 0 12px;
  text-decoration: none;
  color: #FAFAFA;
  -webkit-tap-highlight-color: transparent;
}
.topbar-water-pill .topbar-pill-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: #7DD3FC; flex-shrink: 0;
}
.topbar-water-pill.warn .topbar-pill-dot { background: #fbbf24; }
.topbar-water-pill.miss .topbar-pill-dot {
  background: #ff8a8a;
  animation: topbar-miss-pulse 1.6s ease-in-out infinite;
}
@keyframes topbar-miss-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.5); }
  50%      { box-shadow: 0 0 0 5px rgba(239, 68, 68, 0); }
}
.topbar-pill-count {
  font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
  font-size: 13px; font-weight: 700;
  color: #FAFAFA;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.topbar-water-add {
  width: 44px;
  border: 1px solid rgba(125, 211, 252, 0.16);
  background: linear-gradient(180deg, rgba(125, 211, 252, 0.28), rgba(110, 231, 183, 0.28));
  color: #FFFFFF;
  font-family: inherit; font-size: 20px; font-weight: 700; line-height: 1;
  cursor: pointer;
  border-radius: 0 12px 12px 0;
  -webkit-tap-highlight-color: transparent;
  transition: background 0.15s, transform 0.10s;
}
.topbar-water-add:active { transform: scale(0.94); }
.topbar-water-add.flash {
  background: linear-gradient(180deg, rgba(125, 211, 252, 0.7), rgba(110, 231, 183, 0.7));
}
/* Bottom tab bar — Instagram-style */
.bottombar {
  position: fixed; bottom: 0; left: 0; right: 0; z-index: 40;
  display: flex; justify-content: space-around; align-items: stretch;
  padding: 6px 0 calc(6px + env(safe-area-inset-bottom));
  background: #0a0a0b;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, sans-serif;
}
.bottombar-tab {
  flex: 1;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 3px;
  padding: 6px 0 4px;
  text-decoration: none;
  color: rgba(255, 255, 255, 0.45);
  font-size: 10px; font-weight: 600;
  letter-spacing: 0.04em;
  -webkit-tap-highlight-color: transparent;
  transition: color 0.15s;
}
.bottombar-tab-icon {
  font-size: 24px; line-height: 1;
  filter: grayscale(100%) brightness(1.2);
  opacity: 0.55;
  transition: opacity 0.15s, filter 0.15s, transform 0.10s;
}
.bottombar-tab.active {
  color: #FAFAFA;
}
.bottombar-tab.active .bottombar-tab-icon {
  filter: grayscale(100%) brightness(1.6);
  opacity: 1;
}
.bottombar-tab:active .bottombar-tab-icon { transform: scale(0.92); }

/* Push page content above the fixed bottom bar + AI command bar */
body.has-bottombar {
  padding-bottom: calc(132px + env(safe-area-inset-bottom)) !important;
}

/* AI command bar — fixed, sits just above the bottom tab bar */
.ai-cmd-wrap {
  position: fixed; left: 0; right: 0;
  bottom: calc(64px + env(safe-area-inset-bottom));
  z-index: 41;
  padding: 8px 12px 10px;
  background: linear-gradient(180deg, rgba(10,10,11,0) 0%, #0a0a0b 30%);
  pointer-events: none;
}
.ai-cmd-bar {
  pointer-events: auto;
  max-width: 720px; margin: 0 auto;
  display: flex; align-items: center; gap: 8px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 14px;
  padding: 5px 5px 5px 12px;
  box-shadow: 0 8px 30px rgba(0,0,0,0.55);
  backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
  transition: opacity 0.15s;
}
.ai-cmd-bar.busy { opacity: 0.6; }
.ai-cmd-spark { font-size: 15px; opacity: 0.85; flex-shrink: 0; }
.ai-cmd-input {
  flex: 1; min-width: 0;
  background: transparent; border: none; outline: none;
  color: #FAFAFA; font-family: inherit; font-size: 14px;
  padding: 8px 0;
}
.ai-cmd-input::placeholder { color: rgba(255,255,255,0.4); }
.ai-cmd-send {
  flex: 0 0 auto; border: none; border-radius: 10px;
  background: linear-gradient(180deg, #ffffff, #e8e5dd); color: #0a0a0b;
  font-family: inherit; font-size: 16px; font-weight: 700; line-height: 1;
  padding: 9px 13px; cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.ai-cmd-send:active { transform: scale(0.94); }
.ai-cmd-send:disabled { opacity: 0.5; cursor: default; }
.ai-toast {
  position: fixed; left: 50%; transform: translateX(-50%) translateY(8px);
  bottom: calc(124px + env(safe-area-inset-bottom));
  z-index: 60; max-width: 88%;
  background: rgba(20,20,22,0.97); color: #FAFAFA;
  border: 1px solid rgba(255,255,255,0.14);
  border-radius: 12px; padding: 10px 16px;
  font-size: 13px; font-weight: 600; line-height: 1.4; text-align: center;
  font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, sans-serif;
  box-shadow: 0 12px 36px rgba(0,0,0,0.6);
  opacity: 0; pointer-events: none;
  transition: opacity 0.2s, transform 0.2s;
}
.ai-toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
.ai-toast.err { border-color: rgba(255,138,138,0.45); color: #ffb4b4; }

@media (max-width: 480px) {
  .topbar { padding-left: 10px; padding-right: 10px; gap: 6px; }
  .topbar-water-pill { padding: 8px 11px; gap: 6px; }
  .topbar-pill-count { font-size: 12px; }
  .topbar-water-add { width: 40px; font-size: 18px; }
  .bottombar-tab-icon { font-size: 22px; }
  .bottombar-tab { font-size: 10px; }
}

/* === Global mobile lockdown ===
   1) Hide the right-side scrollbar on phones (iOS uses overlay scrollbars anyway).
   2) Stop iOS auto-text-size-adjust.
   3) touch-action: pan-y prevents pinch-zoom while still allowing vertical scroll.
   4) overscroll-behavior on every common modal class stops scroll chaining —
      scrolling inside a settings popup won't drag the page behind it.
   5) When body has .topbar-modal-open, the page can't scroll at all (locked).
*/
html, body {
  -webkit-text-size-adjust: 100%;
}
@media (max-width: 768px) {
  html { touch-action: pan-y; }
  ::-webkit-scrollbar { width: 0; height: 0; display: none; }
  html, body { scrollbar-width: none; -ms-overflow-style: none; }
}
.modal-bg, .modal, .po-modal-bg, .po-modal, .wt-overlay, .wt-viewer {
  overscroll-behavior: contain;
}
body.topbar-modal-open {
  overflow: hidden;
  touch-action: none;
}
/* On phones, blow the modals up to full screen and let them be the only
   scrolling element. Way less "is this scrolling the page or the modal?"
   confusion. */
@media (max-width: 480px) {
  .modal-bg, .po-modal-bg {
    padding: 0 !important;
    align-items: stretch !important;
    justify-content: stretch !important;
  }
  .modal, .po-modal {
    width: 100% !important;
    max-width: 100% !important;
    max-height: 100vh !important;
    height: 100vh !important;
    border-radius: 0 !important;
    padding-top: max(20px, env(safe-area-inset-top)) !important;
    padding-bottom: max(28px, env(safe-area-inset-bottom)) !important;
    overflow-y: auto !important;
    overscroll-behavior: contain;
  }
}
`;

  // -------- HTML --------
  const topbarHtml = `
<header class="topbar" id="topbar" role="navigation" aria-label="Quick actions">
  <div class="topbar-water-wrap">
    <a href="health.html#water" class="topbar-water-pill" id="topbarWater" aria-label="Water progress">
      <span class="topbar-pill-dot"></span>
      <span class="topbar-pill-count" id="topbarWaterCount">0/0</span>
    </a>
    <button class="topbar-water-add" id="topbarWaterAdd" aria-label="Log one drink" type="button">+</button>
  </div>
</header>
`;

  const bottombarHtml = `
<nav class="bottombar" id="bottombar" role="navigation" aria-label="Main tabs">
  <a href="index.html" class="bottombar-tab" data-page="main">
    <span class="bottombar-tab-icon">🏠</span>
    <span>Main</span>
  </a>
  <a href="health.html" class="bottombar-tab" data-page="health">
    <span class="bottombar-tab-icon">💊</span>
    <span>Health</span>
  </a>
  <a href="gym.html" class="bottombar-tab" data-page="fitness">
    <span class="bottombar-tab-icon">💪</span>
    <span>Fitness</span>
  </a>
  <a href="journal.html" class="bottombar-tab" data-page="journal">
    <span class="bottombar-tab-icon">📓</span>
    <span>Journal</span>
  </a>
  <a href="insights.html" class="bottombar-tab" data-page="insights">
    <span class="bottombar-tab-icon">📈</span>
    <span>Insights</span>
  </a>
</nav>
`;

  // AI command bar — natural-language input injected on every page.
  const aiBarHtml = `
<div class="ai-cmd-wrap" id="aiCmdWrap">
  <form class="ai-cmd-bar" id="aiCmdBar" autocomplete="off">
    <span class="ai-cmd-spark">✨</span>
    <input class="ai-cmd-input" id="aiCmdInput" type="text" enterkeyhint="send"
      placeholder="Tell me what you did… e.g. had 6g creatine + my zinc" aria-label="AI command bar" />
    <button class="ai-cmd-send" id="aiCmdSend" type="submit" aria-label="Send">↑</button>
  </form>
</div>
`;

  // When the water tracker is iframed inside health.html, the embedded
  // page shouldn't render its own chrome again.
  function isEmbedded() {
    try { return window.self !== window.top; } catch (e) { return true; }
  }
  function shouldShowChrome() {
    return !isEmbedded();
  }
  function currentPageKey() {
    const p = (window.location.pathname || '').toLowerCase();
    if (p.endsWith('health.html')) return 'health';
    if (p.endsWith('gym.html')) return 'fitness';
    if (p.endsWith('journal.html')) return 'journal';
    if (p.endsWith('insights.html')) return 'insights';
    return 'main'; // index.html, /, or anything else falls back to main
  }

  function injectStyleAndHTML() {
    if (document.getElementById('topbar') || document.getElementById('bottombar')) return;
    if (!shouldShowChrome()) return;

    const style = document.createElement('style');
    style.id = 'topbar-style';
    style.textContent = css;
    document.head.appendChild(style);

    const topWrap = document.createElement('div');
    topWrap.innerHTML = topbarHtml.trim();
    document.body.insertBefore(topWrap.firstChild, document.body.firstChild);

    const bottomWrap = document.createElement('div');
    bottomWrap.innerHTML = bottombarHtml.trim();
    document.body.appendChild(bottomWrap.firstChild);

    const aiWrap = document.createElement('div');
    aiWrap.innerHTML = aiBarHtml.trim();
    document.body.appendChild(aiWrap.firstChild);

    // Highlight the active bottom tab.
    const active = currentPageKey();
    document.querySelectorAll('.bottombar-tab').forEach((t) => {
      t.classList.toggle('active', t.getAttribute('data-page') === active);
    });

    // Reserve room above the fixed bottom bar so page content can scroll
    // past it without being hidden.
    document.body.classList.add('has-bottombar');
  }

  // -------- Active-date helpers (match the goals page 6 AM rollover) --------
  function activeDateKey() {
    const now = new Date();
    const d = new Date(now);
    if (now.getHours() < 6) d.setDate(d.getDate() - 1);
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }
  function calendarDateKey() {
    const d = new Date();
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }

  // -------- Read progress from localStorage --------
  function getGoalsProgress() {
    const key = 'goals:' + activeDateKey();
    let goals = [];
    try { goals = JSON.parse(localStorage.getItem(key)) || []; } catch (e) {}
    const total = Array.isArray(goals) ? goals.length : 0;
    const done = total ? goals.filter(g => g && g.done).length : 0;
    return { done, total };
  }

  function getStackProgress() {
    let items = [];
    try { items = JSON.parse(localStorage.getItem('stack:items')) || []; } catch (e) {}
    let taken = {};
    try { taken = JSON.parse(localStorage.getItem('stack:taken:' + activeDateKey())) || {}; } catch (e) {}
    const total = Array.isArray(items) ? items.length : 0;
    const done = total ? items.filter(i => i && taken[i.id]).length : 0;
    return { done, total };
  }

  function getWaterProgress() {
    let state = null;
    try { state = JSON.parse(localStorage.getItem('po_water_v1')); } catch (e) {}
    if (!state) return { done: 0, total: 0 };
    const todayKey = calendarDateKey();
    const done = (state.logs || {})[todayKey] || 0;
    const p = state.profile || { weightKg: 75 };
    const wKg = state.weightUnit === 'lb' ? (p.weightKg || 0) / 2.20462 : (p.weightKg || 0);
    const base = wKg * 35;
    const exercise = (p.activityHrsPerWeek || 0) / 7 * 500;
    const caffeine = Math.max(0, (state.caffeineMgPerDay || 0) - 200) * 1.5;
    const subs = (state.substances || []).reduce((s, x) => {
      const dose = (x && x.dose != null ? x.dose : (x && x.defaultDose)) || 0;
      return s + Math.max(0, dose * ((x && x.mlPerUnit) || 0));
    }, 0);
    let adjust = 0;
    if (p.sex === 'm') adjust += 200;
    if ((p.age || 0) >= 50) adjust += 100;
    const totalMl = base + exercise + caffeine + subs + adjust;
    let unitVol;
    if (state.unit === 'glass') unitVol = state.glassMl || 250;
    else if (state.unit === 'oz') unitVol = 30;
    else if (state.unit === 'ml') unitVol = 1;
    else unitVol = state.bottleMl || 500;
    const total = Math.max(1, Math.ceil(totalMl / unitVol));
    return { done, total };
  }

  function classifyStatus(done, total) {
    if (total === 0) return 'idle';
    if (done >= total) return 'good';
    if (done >= total * 0.5) return 'warn';
    // Past 6pm and still under half → flag as missed
    const h = new Date().getHours();
    if (h >= 18 && done < total * 0.5) return 'miss';
    return 'warn';
  }

  function setPillStatus(pillEl, status) {
    pillEl.classList.remove('good', 'warn', 'miss');
    if (status === 'warn' || status === 'miss') pillEl.classList.add(status);
  }

  function render() {
    const waterEl = document.getElementById('topbarWater');
    if (!waterEl) return; // not injected yet

    const w = getWaterProgress();
    const countEl = document.getElementById('topbarWaterCount');
    if (countEl) countEl.textContent = w.total ? w.done + '/' + w.total : '0/0';
    setPillStatus(waterEl, classifyStatus(w.done, w.total));
  }

  // -------- Water +1 (works from any page) --------
  function defaultWaterState() {
    return {
      unit: 'bottle', bottleMl: 500, glassMl: 250, weightUnit: 'kg',
      profile: { weightKg: 75, age: 25, sex: 'm', activityHrsPerWeek: 5 },
      caffeineMgPerDay: 200, substances: [], logs: {}
    };
  }

  async function pushWaterMergedToSupabase(localWater) {
    // Only do this when we're NOT on the health page — health page
    // has its own sync that already detects the localStorage change.
    if (window.location.pathname.endsWith('/health.html') ||
        window.location.pathname.endsWith('health.html')) return;

    if (!window.supabase || !TOPBAR_SUPABASE_URL || !TOPBAR_SUPABASE_KEY) return;
    if (TOPBAR_SUPABASE_URL.indexOf('PASTE-') === 0) return;

    try {
      const supa = window.supabase.createClient(TOPBAR_SUPABASE_URL, TOPBAR_SUPABASE_KEY);
      const { data } = await supa
        .from('app_state').select('data').eq('key', 'health').maybeSingle();
      const current = (data && data.data) || {};
      const merged = Object.assign({}, current, { po_water_v1: localWater });
      await supa.from('app_state').upsert(
        { key: 'health', data: merged, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      );
    } catch (e) { /* offline — local change will sync next time user visits health */ }
  }

  function addWater() {
    let state = null;
    try { state = JSON.parse(localStorage.getItem('po_water_v1')); } catch (e) {}
    if (!state || typeof state !== 'object') state = defaultWaterState();
    state.logs = state.logs || {};
    const k = calendarDateKey();
    state.logs[k] = (state.logs[k] || 0) + 1;
    try { localStorage.setItem('po_water_v1', JSON.stringify(state)); } catch (e) {}
    render();

    const btn = document.getElementById('topbarWaterAdd');
    if (btn) {
      btn.classList.add('flash');
      setTimeout(() => btn.classList.remove('flash'), 220);
    }

    pushWaterMergedToSupabase(state);
  }

  // -------- Mobile lockdown helpers --------
  // Belt-and-suspenders zoom prevention — iOS Safari sometimes ignores
  // user-scalable=no, so we also kill the gesture events directly.
  function blockGesture(e) { e.preventDefault(); }
  function lockGestures() {
    document.addEventListener('gesturestart', blockGesture, { passive: false });
    document.addEventListener('gesturechange', blockGesture, { passive: false });
    document.addEventListener('gestureend', blockGesture, { passive: false });
    // Also kill the iOS double-tap-to-zoom on any tap.
    let lastTouch = 0;
    document.addEventListener('touchend', (e) => {
      const now = Date.now();
      if (now - lastTouch <= 300) e.preventDefault();
      lastTouch = now;
    }, { passive: false });
  }

  // Watch every known modal-bg / overlay class — when any one of them
  // gets `.show` or `.is-open`, lock the body scroll. When the last
  // one closes, unlock.
  function startModalLock() {
    const MODAL_SELECTORS = [
      '.modal-bg', '.po-modal-bg', '.wt-overlay', '.wt-viewer', '.wt-cam'
    ];
    function anyOpen() {
      for (const sel of MODAL_SELECTORS) {
        const els = document.querySelectorAll(sel);
        for (const el of els) {
          if (el.classList.contains('show') || el.classList.contains('is-open')) {
            return true;
          }
        }
      }
      return false;
    }
    function sync() {
      document.body.classList.toggle('topbar-modal-open', anyOpen());
    }
    const observer = new MutationObserver(sync);
    // Observe class changes anywhere in body — modal toggles are rare so
    // a global subtree observer is cheap.
    observer.observe(document.body, {
      attributes: true, attributeFilter: ['class'], subtree: true
    });
    sync();
  }

  // ====================================================================
  // AI COMMAND BAR — natural language → actions across the dashboard.
  // Reuses Nova's Anthropic key (localStorage 'nova_lite_api_key').
  // ====================================================================
  const AI_SEED_BEHAVIORS = [
    { key:'alcohol', label:'Alcohol', emoji:'🍺' },
    { key:'caffeine', label:'Caffeine', emoji:'☕' },
    { key:'meditation', label:'Meditated', emoji:'🧘' },
    { key:'screens_late', label:'Screens late', emoji:'📱' },
    { key:'read', label:'Read', emoji:'📖' },
    { key:'sunlight', label:'Sunlight', emoji:'☀️' },
    { key:'walk', label:'Walk', emoji:'🚶' },
    { key:'cold', label:'Cold shower', emoji:'🥶' },
    { key:'ate_late', label:'Ate late', emoji:'🌙' },
    { key:'stress', label:'Stressful day', emoji:'😣' },
    { key:'social', label:'Socialised', emoji:'🫂' },
    { key:'good_sleep', label:'Slept well', emoji:'😴' }
  ];

  function aiSlug(s){ return String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,''); }

  function getApiKey() {
    let k=''; try{ k = localStorage.getItem('nova_lite_api_key') || ''; }catch(e){}
    if (!k) {
      k = (window.prompt('Paste your Anthropic API key (Claude). Stored only in this browser — used for the AI bar + Nova:') || '').trim();
      if (k) { try { localStorage.setItem('nova_lite_api_key', k); } catch(e){} }
    }
    return k;
  }

  function aiBuildContext() {
    const ctx = { today: activeDateKey() };
    try { ctx.stackItems = (JSON.parse(localStorage.getItem('stack:items'))||[]).map(i=>i.name); } catch(e){ ctx.stackItems=[]; }
    try { const g = JSON.parse(localStorage.getItem('po_coach_v1'))||{}; ctx.exercises=(g.exercises||[]).map(e=>e.name); ctx.gymUnits=g.units||'kg'; } catch(e){ ctx.exercises=[]; ctx.gymUnits='kg'; }
    try { ctx.waterUnit = (JSON.parse(localStorage.getItem('po_water_v1'))||{}).unit || 'bottle'; } catch(e){ ctx.waterUnit='bottle'; }
    try { ctx.journalBehaviors = (JSON.parse(localStorage.getItem('journal:behaviors'))||[]).map(b=>({key:b.key,label:b.label})); } catch(e){ ctx.journalBehaviors=[]; }
    return ctx;
  }

  const AI_SYSTEM = [
    'You convert the user\'s short message about what they did into structured actions for a personal health/fitness dashboard.',
    'Reply with ONLY a JSON object (no prose, no markdown fences): {"actions":[...],"reply":"<short confirmation, max 8 words>"}.',
    'Each action object is exactly one of:',
    '  {"type":"stack","name":"<supplement/vitamin>","dose":"<optional, e.g. 6g>"}',
    '  {"type":"water","count":<number of drinks, default 1>}',
    '  {"type":"caffeine","name":"<optional drink>","mg":<milligrams>}   (coffee~95, espresso shot~75, energy drink~160, tea~40)',
    '  {"type":"gym","exercise":"<name>","weight":<number, or null for bodyweight>,"reps":<number>,"sets":<number, default 1>}',
    '  {"type":"goal","text":"<goal>","done":<true if already completed, else false>}',
    '  {"type":"journal","note":"<optional free text>","behaviors":[{"key":"<slug>","label":"<Title Case>","emoji":"<one emoji>","value":<optional, e.g. 2 or "10m" or 7>}]}',
    'Routing:',
    '- Supplements/vitamins/creatine/protein -> stack (prefer matching a name in context.stackItems).',
    '- Water/hydration -> water. Coffee/energy drink/tea -> caffeine.',
    '- Lifts/sets/reps/exercises -> gym (prefer matching context.exercises; weight is in context.gymUnits).',
    '- Tasks done or to-do -> goal.',
    '- Mood, sleep quality, alcohol, meditation, screens, stress, soreness, naps, weather, or any lifestyle/observation -> journal. Mood like "felt a 7/10" -> behavior {"key":"mood","label":"Mood","emoji":"🙂","value":7}.',
    '- One message can yield MULTIPLE actions of different types. For journal behaviors reuse an existing key from context.journalBehaviors when it clearly matches; else make a sensible new slug.',
    '- If nothing is actionable, return {"actions":[],"reply":"..."}.'
  ].join('\n');

  async function aiParse(text) {
    const key = getApiKey();
    if (!key) { const e = new Error('no key'); e.noKey = true; throw e; }
    const sys = AI_SYSTEM + '\n\nCONTEXT:\n' + JSON.stringify(aiBuildContext());
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: 'claude-opus-4-8', max_tokens: 1024,
        system: sys,
        messages: [{ role: 'user', content: text }]
      })
    });
    if (!res.ok) { const t = await res.text(); throw new Error('HTTP ' + res.status + ' ' + t.slice(0,160)); }
    const data = await res.json();
    let out = (data.content && data.content[0] && data.content[0].text) || '';
    out = out.trim().replace(/^```(json)?/i,'').replace(/```$/,'').trim();
    return JSON.parse(out);
  }

  // ---- appliers (each writes localStorage; sync.js mirrors to Supabase) ----
  function applyStack(a){
    const name=(a.name||'').trim(); if(!name) return null;
    let items=[]; try{items=JSON.parse(localStorage.getItem('stack:items'))||[];}catch(e){}
    const lc=name.toLowerCase();
    let it=items.find(i=>{const n=(i.name||'').toLowerCase(); return n.includes(lc)||lc.includes(n);});
    if(!it){ it={id:'custom_'+Date.now()+'_'+Math.random().toString(36).slice(2,6),name:name,dose:a.dose||'',window:a.window||'anytime',note:'',tag:null,ordered:true}; items.push(it); }
    else if(a.dose){ it.dose=a.dose; }
    localStorage.setItem('stack:items', JSON.stringify(items));
    const tk='stack:taken:'+activeDateKey(); let taken={}; try{taken=JSON.parse(localStorage.getItem(tk))||{};}catch(e){}
    taken[it.id]=Date.now(); localStorage.setItem(tk, JSON.stringify(taken));
    return '✓ '+it.name+(a.dose?(' '+a.dose):'');
  }
  function applyWater(a){
    let s=null; try{s=JSON.parse(localStorage.getItem('po_water_v1'));}catch(e){}
    if(!s||typeof s!=='object') s=defaultWaterState();
    s.logs=s.logs||{}; const k=calendarDateKey(); const n=Math.max(1, a.count||1);
    s.logs[k]=(s.logs[k]||0)+n; localStorage.setItem('po_water_v1', JSON.stringify(s));
    return '💧 +'+n+' water';
  }
  function applyCaffeine(a){
    let logs=[]; try{logs=JSON.parse(localStorage.getItem('caf:logs'))||[];}catch(e){}
    const mg=Math.round(a.mg||0); if(mg<=0 && !a.name) return null;
    logs.push({id:'c'+Date.now()+Math.floor(Math.random()*1000),n:a.name||'Caffeine',mg:mg,e:'☕',ts:Date.now()});
    localStorage.setItem('caf:logs', JSON.stringify(logs));
    return '☕ '+(a.name?a.name+' ':'')+(mg?mg+'mg':'');
  }
  function applyGym(a){
    const name=(a.exercise||'').trim(); const reps=parseInt(a.reps,10);
    if(!name||!reps) return null;
    let st=null; try{st=JSON.parse(localStorage.getItem('po_coach_v1'));}catch(e){}
    if(!st||typeof st!=='object'){ st={units:'kg',gyms:[{id:'gym1',name:'My Gym'}],days:[{id:'day1',name:'Workouts'}],exercises:[],logs:{},filterGym:'gym1',filterDay:'day1',splitRotation:['Workouts'],splitAnchor:{date:calendarDateKey(),index:0}}; }
    st.exercises=st.exercises||[]; st.logs=st.logs||{};
    const lc=name.toLowerCase();
    let ex=st.exercises.find(e=>{const n=(e.name||'').toLowerCase(); return n.includes(lc)||lc.includes(n);});
    const w=(a.weight==null||a.weight==='')?null:Number(a.weight);
    if(!ex){ const day=(st.days&&st.days[0]&&st.days[0].id)||'day1'; ex={id:'ex_'+Date.now()+'_'+Math.floor(Math.random()*9999),name:name,gym:'both',day:day,bw:(w==null),startWeight:(w==null?0:w),step:2.5,repMin:5,repMax:10}; st.exercises.push(ex); }
    const arr=st.logs[ex.id]||[]; const sets=Math.max(1, parseInt(a.sets,10)||1);
    for(let i=0;i<sets;i++){ arr.push({weight:(w==null?0:w),reps:reps,date:new Date().toISOString()}); }
    st.logs[ex.id]=arr; localStorage.setItem('po_coach_v1', JSON.stringify(st));
    return '💪 '+ex.name+' '+(w!=null?(w+'×'):'')+reps+(sets>1?(' ×'+sets+' sets'):'');
  }
  function applyGoal(a){
    const text=(a.text||'').trim(); if(!text) return null;
    const k='goals:'+activeDateKey(); let g=[]; try{g=JSON.parse(localStorage.getItem(k))||[];}catch(e){}
    if(a.done){ const m=g.find(x=>(x.text||'').toLowerCase()===text.toLowerCase()); if(m){m.done=true;m.doneAt=Date.now();} else g.push({text:text,done:true,doneAt:Date.now()}); }
    else { g.push({text:text,done:false}); }
    localStorage.setItem(k, JSON.stringify(g));
    try{ window.dispatchEvent(new CustomEvent('goals-changed')); }catch(e){}
    return (a.done?'✓ ':'+ ')+text;
  }
  function applyJournal(a){
    let beh=[]; try{beh=JSON.parse(localStorage.getItem('journal:behaviors'))||[];}catch(e){}
    if(!beh.length) beh=AI_SEED_BEHAVIORS.slice();
    const k='journal:'+activeDateKey(); let entry={}; try{entry=JSON.parse(localStorage.getItem(k))||{};}catch(e){}
    entry.behaviors=entry.behaviors||{}; if(typeof entry.note!=='string') entry.note='';
    let n=0;
    (a.behaviors||[]).forEach(b=>{
      const key=(b.key||aiSlug(b.label||'')); if(!key) return;
      if(!beh.find(x=>x.key===key)) beh.push({key:key,label:b.label||key,emoji:b.emoji||'•'});
      entry.behaviors[key]=(b.value!=null && b.value!=='')?b.value:true; n++;
    });
    if(a.note){ entry.note = entry.note ? (entry.note+'\n'+a.note) : a.note; }
    entry.updatedAt=Date.now();
    localStorage.setItem('journal:behaviors', JSON.stringify(beh));
    localStorage.setItem(k, JSON.stringify(entry));
    return '📓 journal'+(n?(' · '+n+' tag'+(n>1?'s':'')):'')+(a.note?' · note':'');
  }
  function applyActions(actions){
    const out=[];
    (actions||[]).forEach(a=>{
      try{
        let r=null;
        if(a.type==='stack') r=applyStack(a);
        else if(a.type==='water') r=applyWater(a);
        else if(a.type==='caffeine') r=applyCaffeine(a);
        else if(a.type==='gym') r=applyGym(a);
        else if(a.type==='goal') r=applyGoal(a);
        else if(a.type==='journal') r=applyJournal(a);
        if(r) out.push(r);
      }catch(e){}
    });
    return out;
  }

  function showToast(msg, isErr){
    let t=document.getElementById('aiToast');
    if(!t){ t=document.createElement('div'); t.id='aiToast'; t.className='ai-toast'; document.body.appendChild(t); }
    t.textContent=msg; t.classList.toggle('err', !!isErr);
    requestAnimationFrame(()=>t.classList.add('show'));
    clearTimeout(showToast._t); showToast._t=setTimeout(()=>t.classList.remove('show'), 4000);
  }

  async function aiSubmit(){
    const input=document.getElementById('aiCmdInput');
    const bar=document.getElementById('aiCmdBar');
    const send=document.getElementById('aiCmdSend');
    if(!input) return;
    const text=(input.value||'').trim(); if(!text) return;
    bar.classList.add('busy'); input.disabled=true; if(send) send.disabled=true;
    try{
      const parsed=await aiParse(text);
      const summary=applyActions(parsed && parsed.actions);
      if(summary.length){
        try{ sessionStorage.setItem('aiCmdToast', JSON.stringify({msg:summary.join('   ·   '), ok:true})); }catch(e){}
        input.value='';
        setTimeout(()=>location.reload(), 400);
        return;
      }
      showToast((parsed && parsed.reply) || 'Nothing to apply — try rephrasing.', false);
      input.value='';
    }catch(e){
      showToast(e&&e.noKey ? 'Add your Anthropic API key to use the AI bar.' : ('AI error — '+((e&&e.message)||e)), true);
    }
    bar.classList.remove('busy'); input.disabled=false; if(send) send.disabled=false; input.focus();
  }

  // -------- Boot --------
  function boot() {
    injectStyleAndHTML();
    const btn = document.getElementById('topbarWaterAdd');
    if (btn) btn.addEventListener('click', (e) => { e.preventDefault(); addWater(); });

    // AI command bar: submit on Enter / send button.
    const aiForm = document.getElementById('aiCmdBar');
    if (aiForm) aiForm.addEventListener('submit', (e) => { e.preventDefault(); aiSubmit(); });
    // After a command applies, the page reloads — surface the confirmation toast.
    try {
      const stashed = JSON.parse(sessionStorage.getItem('aiCmdToast') || 'null');
      if (stashed && stashed.msg) { sessionStorage.removeItem('aiCmdToast'); showToast(stashed.msg, !stashed.ok); }
    } catch (e) {}

    render();
    lockGestures();
    startModalLock();

    // Re-render when localStorage changes from another tab/window OR when
    // the page becomes visible (sync may have pulled in the background).
    window.addEventListener('storage', render);
    window.addEventListener('focus', render);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) render(); });

    // Periodic refresh so counts stay current after midnight rollover etc.
    setInterval(render, 30 * 1000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
