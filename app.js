(() => {
  'use strict';
  const cfg = window.CLEANOK_CONFIG;
  if (!cfg || !Array.isArray(cfg.prices)) return;
  document.documentElement.classList.add('js');

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const byId = id => document.getElementById(id);
  const escapeHtml = value => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const money = number => `${new Intl.NumberFormat('ru-RU',{maximumFractionDigits:0}).format(number)} ₽`;
  const prices = new Map(cfg.prices.map(item => [item.id, item]));
  const quantities = new Map();
  let toastTimer;

  // External contacts are configured in one place.
  $$('[data-phone]').forEach(a => {
    a.href = `tel:${cfg.business.phoneLink}`;
    if (a.matches('.header-phone')) $('span', a).textContent = cfg.business.phoneDisplay;
  });
  byId('copyright-year').textContent = String(new Date().getFullYear());

  // Mobile menu: handles internal navigation, Escape, outside clicks, and resize.
  const toggle = byId('menu-toggle');
  const mobileNav = byId('mobile-nav');
  const menuIcon = $('.icon use', toggle);
  const setMenu = open => {
    mobileNav.classList.toggle('open', open);
    mobileNav.inert = !open;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    menuIcon.setAttribute('href', open ? '#i-close' : '#i-menu');
  };
  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  mobileNav.addEventListener('click', event => { if (event.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') setMenu(false); });
  document.addEventListener('click', event => {
    if (mobileNav.classList.contains('open') && !event.target.closest('.site-header')) setMenu(false);
  });
  window.addEventListener('resize', () => { if (window.innerWidth > 990) setMenu(false); });

  const toast = (message) => {
    const box = byId('toast');
    box.textContent = message;
    box.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => box.classList.remove('show'), 2900);
  };
  const icon = (id) => `<svg class="icon" aria-hidden="true"><use href="#i-${id}"/></svg>`;

  // Pricing: published references are NOT a validated official price list.
  byId('price-list').innerHTML = cfg.prices.slice(0,5).map((item,index) => `
    <div class="price-row">
      <span class="price-num">${String(index+1).padStart(2,'0')}</span>
      <div><span class="price-name">${escapeHtml(item.name)}</span><small class="price-detail">${escapeHtml(item.unit)}</small></div>
      <strong class="price-val">${item.price === null ? 'По запросу' : money(item.price)}</strong>
      <button class="price-add" type="button" data-add="${escapeHtml(item.id)}" aria-label="Добавить ${escapeHtml(item.name)} в запрос">${icon('plus')}</button>
    </div>`).join('');

  // Every service can be selected, even when it has no published price.
  const optionRoot = byId('item-options');
  optionRoot.innerHTML = cfg.prices.map((item,index) => `
    <label class="option">
      <input type="checkbox" value="${escapeHtml(item.id)}" id="choice-${escapeHtml(item.id)}" />
      <span class="option-check">${icon('check')}</span>
      <span class="option-text"><span class="option-title">${escapeHtml(item.name)}</span><span class="option-hint">${item.price === null ? 'Стоимость уточняется' : item.calculable ? `Ориентир ${money(item.price)} за позицию` : `Ориентир ${money(item.price)} · без единицы`}</span></span>
    </label>`).join('');

  const itemsInOrder = () => cfg.prices.filter(item => quantities.has(item.id));
  const estimate = () => itemsInOrder().filter(item => item.calculable && Number.isFinite(item.price)).reduce((acc,item) => acc + item.price*quantities.get(item.id),0);
  const uncertain = () => itemsInOrder().some(item => !item.calculable);

  const renderSummary = () => {
    const items = itemsInOrder();
    const root = byId('selected-list');
    byId('copy-request').disabled = items.length === 0;
    byId('copy-label').textContent = 'Скопировать запрос';
    if (items.length === 0) {
      root.innerHTML = '<p class="empty-copy">Выберите хотя бы одну услугу, чтобы увидеть состав заявки.</p>';
      byId('estimate-total').textContent = 'Пока нет';
      byId('estimate-note').textContent = 'Точные цены и условия необходимо согласовать с исполнителем.';
      return;
    }
    root.innerHTML = items.map(item => {
      const n = quantities.get(item.id);
      return `<div class="selected-row"><div><span class="selected-name">${escapeHtml(item.name)}</span><span class="selected-hint">${item.calculable ? `${money(item.price)} · ориентир за позицию` : 'Стоимость уточняется'}</span></div>
        <div class="qty-wrap"><button class="qty-btn" data-qty="${escapeHtml(item.id)}" data-change="-1" type="button" aria-label="Уменьшить количество ${escapeHtml(item.name)}" ${n<=1?'disabled':''}>${icon('minus')}</button><span>${n}</span><button class="qty-btn" data-qty="${escapeHtml(item.id)}" data-change="1" type="button" aria-label="Увеличить количество ${escapeHtml(item.name)}" ${n>=20?'disabled':''}>${icon('plus')}</button></div></div>`;
    }).join('');
    const sum = estimate();
    const known = items.some(item => item.calculable);
    byId('estimate-total').textContent = known ? `≈ ${money(sum)}` : 'По запросу';
    byId('estimate-note').textContent = known ?
      (uncertain() ? 'Частичный арифметический ориентир: позиции без подтверждённой единицы цены не включены. Не является итоговой стоимостью.' : 'Арифметический ориентир по публичным предложениям. Минимальная сумма заказа, выезд и фактический тариф не подтверждены.') :
      'Для выбранных позиций неизвестна единица расчёта. Итоговая стоимость согласовывается напрямую с компанией.';
  };

  const select = (id) => {
    if (!prices.has(id)) return;
    if (!quantities.has(id)) quantities.set(id,1);
    const checkbox = byId(`choice-${id}`);
    if (checkbox) checkbox.checked = true;
    renderSummary();
  };
  const jumpToCalculator = () => byId('calculator').scrollIntoView({behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});

  optionRoot.addEventListener('change', event => {
    if (!event.target.matches('input[type=checkbox]')) return;
    const id = event.target.value;
    if (!prices.has(id)) return;
    if (event.target.checked) quantities.set(id,1); else quantities.delete(id);
    renderSummary();
  });
  byId('selected-list').addEventListener('click', event => {
    const button = event.target.closest('button[data-qty]');
    if (!button) return;
    const id = button.dataset.qty;
    if (!quantities.has(id)) return;
    const next = Math.max(1, Math.min(20, quantities.get(id)+Number(button.dataset.change)));
    quantities.set(id,next);
    renderSummary();
  });
  $$('.add-service').forEach(button => button.addEventListener('click', () => { select(button.dataset.item); jumpToCalculator(); toast('Услуга добавлена в запрос'); }));
  byId('price-list').addEventListener('click', event => {
    const button = event.target.closest('button[data-add]');
    if (!button) return;
    select(button.dataset.add);
    jumpToCalculator();
    toast('Услуга добавлена в запрос');
  });

  const makeRequest = () => {
    const items = itemsInOrder();
    const room = byId('room-detail').value.trim().replace(/\s+/g,' ');
    const comment = byId('comment').value.trim().replace(/\s+/g,' ');
    const object = byId('object-type').value;
    const lines = ['Здравствуйте! Хочу уточнить стоимость химчистки CleanOK в Челябинске.', '', `Объект: ${object.toLowerCase()}.`];
    if (room) lines.push(`Помещение или зона: ${room}.`);
    lines.push('Интересуют услуги:');
    items.forEach((item,index) => lines.push(`${index+1}. ${item.name} — ${quantities.get(item.id)} шт./позиции. ${item.calculable ? `Опубликованный ориентир за позицию: ${money(item.price)}.` : 'Цена и единица расчёта уточняются.'}`));
    if (comment) lines.push('',`Пожелания: ${comment}`);
    const known = items.some(item=>item.calculable);
    if (known) lines.push('',`Математическая сумма ориентиров по части позиций: около ${money(estimate())} (не финальная цена).`);
    lines.push('','Подскажите, пожалуйста, актуальную стоимость, минимальный заказ и возможные даты.');
    return lines.join('\n');
  };
  const copyFallback = text => {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly','');
    Object.assign(area.style,{position:'fixed',left:'-9999px',top:'0'});
    document.body.appendChild(area);
    area.select();
    try {return document.execCommand('copy');} finally {area.remove();}
  };
  byId('copy-request').addEventListener('click', async () => {
    if (!quantities.size) return;
    const text = makeRequest();
    let success = false;
    try { if (navigator.clipboard && window.isSecureContext) {await navigator.clipboard.writeText(text);success=true;} } catch(e) { /* fall back */ }
    if (!success) {try {success=copyFallback(text);} catch(e) {success=false;}}
    if (success) {
      byId('copy-label').textContent = 'Запрос скопирован';
      toast('Запрос скопирован. Можете отправить его самостоятельно.');
    } else toast('Не удалось скопировать. Откройте сайт по HTTPS или попробуйте другой браузер.');
  });
  byId('clear-selection').addEventListener('click', () => {
    quantities.clear();
    $$('input[type="checkbox"]',optionRoot).forEach(input => input.checked=false);
    byId('object-type').value = 'Квартира';
    byId('room-detail').value = '';
    byId('comment').value = '';
    renderSummary();
    toast('Выбор очищен');
  });
  renderSummary();

  // Reveal sections; CSS fallback leaves content visible if JavaScript is disabled.
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reducedMotion && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if(entry.isIntersecting){entry.target.classList.add('in-view');observer.unobserve(entry.target);}
    },{threshold:.05,rootMargin:'0px 0px -24px 0px'});
    $$('.reveal').forEach((el,index) => {el.style.transitionDelay = `${(index%3)*55}ms`;observer.observe(el);});
  } else $$('.reveal').forEach(el => el.classList.add('in-view'));
})();
