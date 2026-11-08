// Copyright (c) 2026 Serhii Bakhariev. SPDX-License-Identifier: MIT
// Presentation only: saved predictions, replay data and cost formulas are unchanged.
(() => {
  const by = id => document.getElementById(id);
  const fold = (title, nodes, parent) => {
    const details = document.createElement('details');
    details.className = 'supporting-details';
    const summary = document.createElement('summary');
    summary.textContent = title;
    details.append(summary);
    nodes.filter(Boolean).forEach(node => details.append(node));
    parent.append(details);
    return details;
  };
  const tabs = document.querySelector('.view-tabs');
  document.querySelector('.model-switch').after(tabs);
  const forecast = by('forecast-view');
  const explanation = [by('contract-forecast-note'), ...forecast.querySelectorAll('.view-note')];
  const compare = forecast.querySelector('.forecast-compare');
  const replayButton = by('forecast-replay');
  const replayAction = document.createElement('div');
  replayAction.className = 'replay-action';
  replayAction.append(replayButton);
  forecast.querySelector('.forecast-cards').after(replayAction);
  fold('Як отримано результат і що перевірено', [compare, ...explanation], forecast);
  // The second estimate repeats the summary cards in the full-party mode.
  const estimate = forecast.querySelectorAll('.forecast-box')[1];
  fold('Додаткові розрахунки', [estimate], forecast).classList.add('extra-estimate');
  const resources = by('resource-view');
  fold('Про записане відтворення', [resources.querySelector('.replay-mode'), resources.querySelector(':scope > .view-note'), document.querySelector('.metrics')], resources);
  const rules = document.querySelector('.economic-rules');
  fold('Як нараховуються витрати', [rules], by('economics'));
  const note = document.createElement('p');
  note.className = 'demo-scope';
  note.textContent = 'Демонстрація на модельних даних. Ставки можна змінювати; результати потребують перевірки на виробництві.';
  document.querySelector('.simple-footer').before(note);
  by('show-economics').hidden = true;
  by('mode-baseline').textContent = 'Добовий план · 24 години';
  tabs.querySelector('[data-view="forecast"]').textContent = 'Підбір техніки';
  tabs.querySelector('[data-view="resources"]').textContent = 'Відтворення';
  tabs.querySelector('[data-view="tonnage"]').textContent = 'Добові обсяги';
  tabs.querySelector('[data-view="economics"]').textContent = 'Витрати та ставки';
  const update = () => {
    const view = tabs.querySelector('.active').dataset.view;
    document.body.dataset.screen = view;
    if (view === 'forecast' && playing) {
      playing = false;
      by('play').textContent = '▶ Відтворити';
    }
    const contract = window.isContractMode();
    by('model-caption').textContent = contract ? 'Партія 10 000 т · не менше 4000 т за повну добу' : 'Плани 3000 і 4000 т · порівняння техніки';
    document.querySelector('header p').textContent = 'Планування перевалки та порівняння варіантів техніки';
    document.querySelector('#economics h2').textContent = 'Витрати на перевалку';
    document.querySelector('#forecast-view h2').textContent = 'Підбір техніки';
    const target = by('forecast-target').closest('label');
    const volume = by('forecast-volume').closest('label');
    target.classList.toggle('fixed-condition', contract);
    volume.classList.toggle('fixed-condition', contract);
    by('forecast-b').closest('label').firstChild.textContent = 'Комплекти подачі';
    by('forecast-road').closest('label').firstChild.textContent = 'Дорожня надбавка, до';
    const extra = forecast.querySelector('.extra-estimate');
    extra.hidden = contract;
  };
  tabs.addEventListener('click', update);
  [by('mode-baseline'), by('mode-contract')].forEach(button => button.addEventListener('click', update));
  tabs.querySelector('[data-view="forecast"]').click();
  update();
})();
