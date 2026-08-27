(() => {
  const rep = { dialogs: 0, screens: [], externalLinks: 0, dialogRoles: 0, popups: 0, vpDrift: 0 };
  ['alert','confirm','prompt'].forEach(k => { window[k] = () => { rep.dialogs++; }; });
  const _open = window.open; window.open = () => { rep.popups++; return null; };

  const setSeg = (label, val) => {
    const b = [...document.querySelectorAll('.seg button')].find(x => x.dataset.k === label && x.dataset.v === val);
    if (b) b.click();
  };
  setSeg('vp', '768'); // 고른 뷰포트가 화면 이동 후에도 유지되는지 확인용

  const users = ['new','returning','operator'];
  const datas = ['normal','empty','loading','error','overflow'];
  const idxBtns = () => [...document.querySelectorAll('.index button[data-go]')];
  const n = idxBtns().length;

  for (let i = 0; i < n; i++) {
    for (const u of users) {
      setSeg('user', u);
      for (const d of datas) {
        setSeg('data', d);
        idxBtns()[i].click();
        const dev = document.getElementById('device');
        if (!dev.classList.contains('vp768')) rep.vpDrift++;
        const frame = document.getElementById('frame');
        rep.dialogRoles += frame.querySelectorAll('[role="dialog"],dialog,.modal,.overlay').length;
        rep.externalLinks += frame.querySelectorAll('a[href],[target="_blank"]').length;
        if (u === 'new' && d === 'normal') {
          const t = frame.innerText;
          rep.screens.push({
            i: i + 1,
            id: document.querySelector('.panel h3').innerText,
            chars: t.length,
            hasNav: !!frame.querySelector('.nav .item'),
            perfInNav: /성과/.test((frame.querySelector('.nav') || {innerText:''}).innerText),
            hasNumbers: /[0-9]{3,}/.test(t)
          });
        }
      }
    }
  }
  rep.total = n;
  rep.externalLinksWholeDoc = document.querySelectorAll('a[href],[target="_blank"]').length;
  return JSON.stringify(rep);
})()
