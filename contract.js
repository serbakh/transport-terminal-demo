// Copyright (c) 2026 Serhii Bakhariev. SPDX-License-Identifier: MIT
(() => {
  const el=id=>document.getElementById(id),cash=v=>Number(v).toLocaleString('uk-UA',{minimumFractionDigits:2,maximumFractionDigits:2}),M=window.CONTRACT_MATH,D=window.STUDY;
  let mode='baseline',forecastKey='';
  const baselineOptions=el('scenario').innerHTML,baselineLoad=load,baseEstimate=estimateEconomics;
  const originals=new Map();
  const remember=selector=>document.querySelectorAll(selector).forEach(e=>originals.set(e,e.textContent));
  remember('#forecast-view .view-note, #forecast-view .forecast-cards article>span, #forecast-view .forecast-cards article>small, #forecast-view .forecast-head p, #forecast-view .economic-tag, #forecast-view .forecast-table-wrap th, #economics .economic-cards article>span, #economics .economic-rules p, #economics>.economic-note, #resource-view .replay-mode p, #resource-view>.view-note, header p, .kpi-grid article>small');
  const notes=[...document.querySelectorAll('#forecast-view .view-note')];
  const econLabels=[...document.querySelectorAll('#economics .economic-cards article>span')];
  const econRules=[...document.querySelectorAll('#economics .economic-rules p')];
  const info=document.createElement('p');info.id='contract-forecast-note';document.querySelector('.forecast-head').after(info);info.hidden=true;
  const cost=p=>M.cost(p,ECONOMIC_RATES),conf=k=>k.split('_').slice(0,3).join('/');
  const currentKey=()=>['n','l','b','external','road'].map(k=>el('forecast-'+k).value).join('_');
  window.isContractMode=()=>mode==='contract';
  function setInputs(key){const v=key.split('_');['n','l','b','external','road'].forEach((k,i)=>el('forecast-'+k).value=v[i]);forecastKey='';}
  function fillFleet(){el('fleet').replaceChildren();for(let i=1;i<=sc.trucks;i++){const b=document.createElement('button');b.textContent='А'+String(i).padStart(2,'0');b.onclick=()=>{selected=i;draw();};el('fleet').append(b);}}
  window.loadContract=function(key,sync=true){
    const s=CONTRACT_REPLAYS.find(x=>x.configuration===key)||CONTRACT_REPLAYS.find(x=>x.configuration==='11_2_2_0_0');
    sc=s;segments=new Map();for(let i=1;i<=sc.trucks;i++)segments.set(i,sc.segments.filter(s=>s.truck===i));
    events=[...new Set(sc.segments.flatMap(s=>[s.start,s.end]).concat(sc.summary.loading_finish_min,sc.summary.all_returns_finish_min))].sort((a,b)=>a-b);
    time=495;playing=false;selected=Math.min(selected,sc.trucks);el('scenario').value=sc.configuration;el('seek').step='any';el('seek').max=sc.summary.all_returns_finish_min;
    fillFleet();if(sync)setInputs(sc.configuration);el('totals').textContent=`Партія: 10 000 т · ${sc.deliveries} доставок · seed 10000`;
    forecastKey='';draw();renderContractForecast();
  };
  estimateEconomics=function(s,t,r=ECONOMIC_RATES){
    if(!s.contract)return baseEstimate(s,t,r);
    const p=M.physical(s,t),parts=M.parts(p,r),total=Object.values(parts).reduce((a,b)=>a+b,0),tonnes=s.trips.filter(x=>x.finish_time<=t+1e-6).reduce((a,x)=>a+x.cargo_weight,0);
    return {hours:Math.max(0,t-495)/60,deliveries:p.trips,tonnes,loaderHours:p.loader_active_hours,powerHours:p.feeder_active_hours,parts,total,unit:tonnes?total/tonnes:null};
  };
  function restoreText(){for(const [e,text]of originals)e.textContent=text;}
  function setMode(next){
    mode=next;playing=false;forecastKey='';document.body.classList.toggle('contract-mode',mode==='contract');
    el('mode-baseline').classList.toggle('active',mode==='baseline');el('mode-contract').classList.toggle('active',mode==='contract');
    restoreText();notes.forEach(e=>e.classList.toggle('contract-hide',mode==='contract'));info.hidden=mode!=='contract';
    el('forecast-volume').disabled=mode==='contract';el('forecast-target').disabled=mode==='contract';
    el('contract-milestones').hidden=mode!=='contract';el('daily-results').hidden=mode!=='contract';
    if(mode==='contract'){
      el('model-caption').textContent='Повний цикл · норма 4000 т за кожні повні 24 години';
      document.querySelector('header p').textContent='Повний цикл партії · прогноз, контроль і записане відтворення';
      document.querySelector('#forecast-view .forecast-head p').textContent='Нова модель повного циклу · 1836 сценаріїв';
      document.querySelector('#forecast-view .economic-tag').textContent='Вибір за витратами · партія 10 000 т';
      el('forecast-volume').value=10000;el('forecast-target').value=4000;
      const captions=['ПРОГНОЗ ПЕРШОЇ ДОБИ','КОНТРОЛЬ: СЕРЕДНЄ ПЕРШОЇ ДОБИ','ПРОГНОЗНІ ВИТРАТИ ПАРТІЇ','ДОПУСК ЗА ДОБОВОЮ НОРМОЮ'];
      document.querySelectorAll('#forecast-view .forecast-cards article>span').forEach((e,i)=>e.textContent=captions[i]);
      document.querySelectorAll('#forecast-view .forecast-cards article>small')[1].textContent='Середнє п’яти контрольних прогонів';
      document.querySelector('.kpi-grid article>small').textContent='Початковий обсяг партії 10 000 т';
      document.querySelectorAll('#forecast-view .forecast-box h3')[0].textContent='Економічний підбір ресурсів';
      document.querySelectorAll('#forecast-view .forecast-box h3')[1].textContent='Прогноз повного циклу';
      document.querySelectorAll('#forecast-view .forecast-table-wrap th')[3].textContent='Витрати, грн';
      document.querySelector('#resource-view .replay-mode p').textContent='Відтворення повного журналу нової симуляції. Показано всі прийняті рейси, добові результати та фінальні повернення автомобілів.';
      document.querySelector('#resource-view>.view-note').textContent='Спільна черга вагової: тара й брутто. Порядок автомобілів відповідає журналу; після індивідуального фінального повернення робота автомобіля завершена.';
      econLabels[1].textContent='ВИТРАТИ НА ДОСТАВЛЕНУ ТОННУ';econLabels[2].textContent='ВИТРАТИ НА ВСЮ ПАРТІЮ';
      econRules[0].textContent='Час кожної одиниці враховано до її власного завершення роботи. Автомобілі й водії — до фінального повернення; механік — до останньої тонни на судні.';
      econRules[1].textContent='Оренда мехлопат і електроенергія нараховуються за активними інтервалами, без перерв. Часові статті включають очікування та перерви в межах індивідуального залучення.';
      econRules[2].textContent='Пальне відноситься на завершену доставку за ставкою всього рейсу з поверненням. Це правило вартісного обліку, а не вимірювання щохвилинного споживання.';
      document.querySelector('#economics>.economic-note').textContent='Сценарні витрати за врахованими статтями. ПДВ, загальні накладні витрати та доходи не визначені. Підсумок не є підтвердженою повною собівартістю підприємства.';
      el('scenario').innerHTML=CONTRACT_REPLAYS.map(s=>`<option value="${s.configuration}">${conf(s.configuration)} · вагова ${s.external}% · дорога до ${s.road}%</option>`).join('');
      window.loadContract('11_2_2_0_0');
    }else{
      el('model-caption').textContent='Вихідний добовий експеримент · три записані сценарії';el('scenario').innerHTML=baselineOptions;el('seek').step='.01';el('seek').max=1935;setInputs('9_2_2_0_0');
      document.querySelectorAll('#forecast-view .forecast-box h3')[0].textContent='Підбір під добовий план';document.querySelectorAll('#forecast-view .forecast-box h3')[1].textContent='Оцінка партії за прогнозною продуктивністю';
      const box=el('econ-day').parentElement;box.lastChild.textContent=' грн/т';baselineLoad(9);window.renderForecast();
    }
  }
  function renderContractForecast(){
    if(mode!=='contract')return;
    const key=currentKey(),cache=key+JSON.stringify(ECONOMIC_RATES);if(cache===forecastKey)return;forecastKey=cache;
    const p=D.predictions.find(x=>x.configuration===key);if(!p)return;
    const c=D.controls[key],context=p.context,eligible=D.predictions.filter(x=>x.context===context&&x.admissible).sort((a,b)=>cost(a)-cost(b)||a.configuration.localeCompare(b.configuration));
    const best=eligible[0],reference=D.predictions.filter(x=>x.context===context&&D.controls[x.configuration].passed===5).sort((a,b)=>cost(D.controls[a.configuration])-cost(D.controls[b.configuration]))[0];
    el('forecast-error').hidden=true;el('forecast-q').textContent=fmt(p.first_day_tons)+' т';el('forecast-observed').textContent=fmt(c.first_day_tons)+' т';el('forecast-delta').textContent=cash(cost(p))+' грн';el('forecast-delta-percent').textContent=cash(cost(p)/10000)+' грн/т';
    el('forecast-status').textContent=p.admissible?'Попередньо допущено':'Норму не підтверджено';el('forecast-status').className=p.admissible?'forecast-pass':'forecast-fail';el('forecast-threshold').textContent=`Контроль: ${c.passed}/${c.runs} · мінімум повних діб прогнозно ${fmt(p.minimum_full_day_tons)} т`;
    el('forecast-bottleneck').textContent='Правило допуску: класифікатор + прогноз мінімальної повної доби ≥ 4000 т';
    info.textContent=`Планування: ${conf(key)} · вагова ${el('forecast-external').value}% · дорога до ${el('forecast-road').value}%. Контроль — середні п’яти прогонів. Відтворення — окремий запис seed 10000. Виконання 5/5 не гарантує майбутнього результату.`;
    const bars=el('forecast-bars');bars.replaceChildren();const max=Math.max(p.first_day_tons,p.minimum_full_day_tons,4000)*1.05;
    for(const [label,value,color]of [['Прогноз першої доби',p.first_day_tons,'#68d5c5'],['Прогноз мінімальної повної доби',p.minimum_full_day_tons,'#81a7d1'],['Норма',4000,'#d9b466']]){const row=document.createElement('div');row.innerHTML=`<label>${label}<b>${fmt(value)} т</b></label><div class="forecast-bar-track"><i style="width:${value/max*100}%;background:${color}"></i></div>`;bars.append(row);}
    el('forecast-recommendation').textContent=best?`${conf(best.configuration)} · ${cash(cost(best))} грн`:'Допустимого складу в цій сітці немає.';
    el('forecast-eligible').classList.remove('contract-hide');el('forecast-eligible').textContent=`Допущено ${eligible.length} із 153 складів. Контрольний вибір: ${reference?conf(reference.configuration):'немає'}. ${best&&reference?'Перевищення контрольного мінімуму для вибору ML: '+cash(cost(D.controls[best.configuration])-cost(D.controls[reference.configuration]))+' грн.':''}`;
    el('forecast-candidates').replaceChildren();eligible.slice(0,5).forEach(x=>{const tr=document.createElement('tr');for(const val of [...x.configuration.split('_').slice(0,3),cash(cost(x))]){const td=document.createElement('td');td.textContent=val;tr.append(td);}const td=document.createElement('td'),button=document.createElement('button');button.textContent='Переглянути';button.onclick=()=>{setInputs(x.configuration);renderContractForecast();};td.append(button);tr.append(td);el('forecast-candidates').append(tr);});
    el('forecast-hours').textContent=fmt(p.loading_hours)+' год';el('forecast-cost').textContent=cash(cost(p))+' грн';el('forecast-unit').textContent=cash(cost(p)/10000)+' грн/т';
    el('forecast-cost-inputs').classList.remove('contract-hide');el('forecast-cost-inputs').textContent=`Партія 10 000 т · середні контрольні витрати ${cash(cost(c))} грн · середня тривалість ${fmt(c.loading_hours)} год. Прогноз фізичних показників; ціни перераховуються окремо.`;
    const replay=CONTRACT_REPLAYS.find(x=>x.configuration===key);el('forecast-replay').disabled=!replay;el('forecast-replay').textContent=replay?'Відкрити цей склад у відтворенні':'Для цього складу повний запис не підготовлено';
  }
  const originalReplayClick=el('forecast-replay').onclick;
  el('forecast-replay').onclick=()=>{if(mode==='contract'){window.loadContract(currentKey());document.querySelector('[data-view="resources"]').click();}else originalReplayClick();};
  ['n','l','b','external','road'].forEach(k=>el('forecast-'+k).addEventListener('input',renderContractForecast));
  el('economic-rates').addEventListener('input',()=>{forecastKey='';renderContractForecast();});el('economic-reset').addEventListener('click',()=>{forecastKey='';renderContractForecast();});
  function renderContractFrame(){
    if(mode!=='contract'||!sc.contract)return;
    const end=sc.summary.all_returns_finish_min,loaded=time>=sc.summary.loading_finish_min-1e-6,returned=time>=end-1e-6;
    el('clock').textContent=clock(time)+' · доба '+(Math.floor((time-495)/1440)+1);
    el('kpi-fleet').textContent=`${sc.trucks} авто · ${sc.loaders} мехлопати / ${sc.unloaders} комплекти`;
    el('contract-milestones').innerHTML=`<div>Вантаж на судні: <b>${loaded?'10 000 т · завершено':'погрузка триває'}</b><br><small>${fmt(sc.summary.loading_hours)} год від початку</small></div><div>Фінальні повернення: <b>${returned?'усі автомобілі повернулися':loaded?'автомобілі повертаються':'попереду'}</b><br><small>${fmt(sc.summary.all_returns_hours)} год від початку</small></div>`;
    const complete=sc.usage.filter(u=>u.resource==='truck'&&u.accounting_finish_min<=time+1e-6).map(u=>'А'+u.unit_id.split(':')[1]);
    const outside=(sc.external_intervals||[]).find(o=>o.arrival<=time&&time<o.end);
    if(outside){const col=el('resource-columns').children[3],active=outside.start<=time,note=document.createElement('div');note.className='calendar-wait';note.textContent=active?'Стороннє зважування · платформа зайнята':'Сторонній потік очікує платформу';col.append(note);if(active){col.querySelector('.resource-column-head b').textContent='1 / 1';const empty=col.querySelector('.empty-slot');if(empty)empty.textContent='Обслуговування стороннього звернення';}}
    if(complete.length){const note=document.createElement('p');note.className='view-note complete-fleet';note.textContent='Роботу завершили: '+complete.join(', ');el('resource-columns').append(note);}
    if(!get(selected)&&complete.includes('А'+selected))el('resource-detail').textContent=`Автомобіль А${String(selected).padStart(2,'0')} повернувся після останнього рейсу. Роботу завершено.`;
    el('unknown').textContent='';
    el('daily-results').innerHTML='<table class="daily-table"><thead><tr><th>Період від 08:15</th><th>Доставлено</th><th>Норма</th></tr></thead><tbody>'+sc.days.map(d=>`<tr><td>${d.full_day?'Доба '+d.day_from_start:'Залишок · '+fmt(d.observed_hours)+' год'}</td><td>${fmt(d.delivered_tons)} т</td><td class="${d.meets_minimum===false?'failed':'passed'}">${d.full_day?(d.meets_minimum?'Виконано':'Не виконано'):'Неповний період'}</td></tr>`).join('')+'</tbody></table>';
    const chart=el('chart-content');for(let t=495+1440;t<end;t+=1440){const x=63+(t-495)/(end-495)*(1370-63),line=document.createElementNS(NS,'path');line.setAttribute('d',`M${x} 10V120`);line.setAttribute('stroke','#d8b66c');line.setAttribute('stroke-dasharray','4 4');chart.append(line);}
    const actual=estimateEconomics(sc,time),final=estimateEconomics(sc,end);
    el('econ-time').textContent=`На ${clock(time)} · ${fmt(actual.hours)} год від початку`;
    el('econ-day').textContent=cash(final.total);el('econ-day').parentElement.lastChild.textContent=' грн';el('econ-day-total').textContent=`${cash(final.unit)} грн/т · ${fmt(sc.summary.loading_hours)} год погрузки`;
    el('econ-volume').textContent=actual.tonnes?'На '+fmt(actual.tonnes)+' т доставленого вантажу':'Доставок поки немає';
    if(document.querySelector('[data-view="forecast"]').classList.contains('active'))renderContractForecast();
  }
  const previousDraw=draw;draw=function(){previousDraw();renderContractFrame();};
  el('mode-baseline').onclick=()=>setMode('baseline');el('mode-contract').onclick=()=>setMode('contract');
  setMode('contract');
})();
