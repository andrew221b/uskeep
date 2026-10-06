// Website analytics only run after a visitor opts in. No app records are sent.
const metricsScript = document.currentScript;
const counterId = Number(metricsScript?.dataset.counterId);
if (Number.isSafeInteger(counterId) && counterId > 0) {
  const choiceKey = 'uskeep-website-analytics';
  const readChoice = () => { try { return localStorage.getItem(choiceKey); } catch { return null; } };
  const saveChoice = (value) => { try { localStorage.setItem(choiceKey, value); } catch { /* private browsing */ } };
  let loaded = false;

  function loadMetrica() {
    if (loaded) return;
    loaded = true;
    window[`disableYaCounter${counterId}`] = false;
    window.ym = window.ym || function () { (window.ym.a = window.ym.a || []).push(arguments); };
    window.ym.l = Date.now();
    const tag = document.createElement('script');
    tag.async = true;
    tag.src = 'https://mc.yandex.ru/metrika/tag.js';
    document.head.append(tag);
    window.ym(counterId, 'init', { clickmap: false, trackLinks: false, accurateTrackBounce: false, webvisor: false, trackHash: false });
  }

  const banner = document.createElement('section');
  banner.className = 'metrics-banner';
  banner.setAttribute('aria-label', 'Optional website analytics');
  banner.innerHTML = '<div><strong>Help us understand visits to this website?</strong><p>Optional Yandex Metrica measures page visits. It stays off unless you allow it. <a href="/privacy/">Privacy details</a></p></div><div class="metrics-actions"><button class="metrics-decline" type="button">No thanks</button><button class="metrics-allow" type="button">Allow analytics</button></div>';
  document.body.append(banner);

  const settings = document.createElement('button');
  settings.className = 'metrics-settings';
  settings.type = 'button';
  settings.textContent = 'Analytics settings';
  document.querySelector('.footer-bottom')?.append(settings);
  settings.addEventListener('click', () => { banner.hidden = false; banner.querySelector('.metrics-decline').focus(); });

  banner.querySelector('.metrics-allow').addEventListener('click', () => {
    saveChoice('allow');
    banner.hidden = true;
    loadMetrica();
  });
  banner.querySelector('.metrics-decline').addEventListener('click', () => {
    saveChoice('decline');
    window[`disableYaCounter${counterId}`] = true;
    banner.hidden = true;
    if (loaded) location.reload();
  });

  const choice = readChoice();
  banner.hidden = choice === 'allow' || choice === 'decline';
  if (choice === 'allow') loadMetrica();
}
