(() => {
  const rows = {
    1: [
      ['Gemini 3.1 Pro','0.3402','0.3202','0.3348','0.3634','0.3567','0.3431'],
      ['Codex + DeepSeek','0.3225','0.3252','0.3641','0.3509','0.3472','0.3419'],
      ['GPT-5.6-sol','0.3042','0.3144','0.3571','0.3599','0.3556','0.3382'],
      ['DeepSeek-v4-flash','0.3154','0.3114','0.3383','0.3564','0.3431','0.3329'],
      ['Claude Opus 4.6','0.2851','0.3061','0.3329','0.3480','0.3401','0.3224'],
      ['Gemma4-12B-it','0.2963','0.2930','0.3284','0.3262','0.3096','0.3107'],
      ['Qwen3.5-4B','0.2720','0.2574','0.2852','0.2827','0.2590','0.2712'],
      ['Repeat recent K','0.1950','0.1802','0.1957','0.2002','0.1868','0.1916']
    ],
    10: [
      ['GPT-5.6-sol','0.1950','0.2042','0.2160','0.1909','0.1625','0.1943'],
      ['Gemini 3.1 Pro','0.1965','0.1987','0.2046','0.1792','0.1505','0.1867'],
      ['Claude Opus 4.6','0.1900','0.1965','0.2063','0.1774','0.1555','0.1858'],
      ['Codex + DeepSeek','0.1910','0.2003','0.2037','0.1731','0.1459','0.1836'],
      ['DeepSeek-v4-flash','0.1834','0.1896','0.1949','0.1710','0.1377','0.1761'],
      ['Gemma4-12B-it','0.1820','0.1852','0.1804','0.1534','0.1091','0.1632'],
      ['Repeat recent K','0.1519','0.1564','0.1510','0.1242','0.0947','0.1367'],
      ['Qwen3.5-4B','0.1622','0.1541','0.1445','0.1143','0.0727','0.1310']
    ]
  };
  function showHorizon(k) {
    const tbody=document.querySelector('.leaderboard-table tbody');
    tbody.replaceChildren(...rows[k].map((values,index)=>{const tr=document.createElement('tr');if(index===0)tr.className='winner';if(values[0]==='Repeat recent K')tr.className='baseline';values.forEach((value,i)=>{const cell=document.createElement(i?'td':'th');if(!i)cell.scope='row';cell.textContent=value;tr.append(cell);});return tr;}));
    const summary=document.querySelector('.leaderboard-summary');
    summary.querySelector('strong').textContent=k===1?'0.3431':'0.1943';
    summary.querySelector('span').innerHTML=k===1?'best reported K=1 score<br>Gemini 3.1 Pro':'best reported K=10 score<br>GPT-5.6-sol';
    document.getElementById('examples-k1').hidden=k!==1;
    document.getElementById('examples-k10').hidden=k!==10;
    document.querySelectorAll('[data-horizon]').forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.horizon)===k)));
  }
  document.querySelectorAll('[data-horizon]').forEach(button=>button.addEventListener('click',()=>showHorizon(Number(button.dataset.horizon))));
  document.querySelectorAll('.review-switch a').forEach(a=>{if(a.getAttribute('href')===document.documentElement.dataset.design+'.html')a.setAttribute('aria-current','page');});
  showHorizon(1);
})();
