// Copyright (c) 2026 Serhii Bakhariev. SPDX-License-Identifier: MIT
(function(root){
  function parts(p,r){return {'Автотранспорт':r.fuelTrip*p.trips+(r.driverShift+r.truckRepairShift)/12*p.truck_hours,'Навантаження':r.loaderActive*p.loader_active_hours+r.loaderRepairShift/12*p.loader_hours,'Вагова':r.weigherHour*p.scale_hours,'Подача на судно':(r.kitHour+r.operatorShift/12)*p.feeder_hours+r.powerActive*p.feeder_active_hours,'Спільний механік':r.mechanicShift/12*p.loading_hours};}
  function cost(p,r){return Object.values(parts(p,r)).reduce((a,b)=>a+b,0);}
  function physical(s,t){const hours=kind=>s.usage.filter(u=>u.resource===kind).reduce((a,u)=>a+Math.max(0,Math.min(t,u.accounting_finish_min)-u.engaged_from_min)/60,0);const active=kind=>s.active.filter(o=>o.resource===kind).reduce((a,o)=>a+o.segments.reduce((v,[from,to])=>v+Math.max(0,Math.min(t,to)-from)/60,0),0);return {trips:s.trips.filter(x=>x.finish_time<=t+1e-6).length,truck_hours:hours('truck'),loader_hours:hours('loader'),scale_hours:hours('scale'),feeder_hours:hours('unload'),loader_active_hours:active('loader'),feeder_active_hours:active('unload'),loading_hours:Math.max(0,Math.min(t,s.summary.loading_finish_min)-s.summary.start_min)/60};}
  root.CONTRACT_MATH={parts,cost,physical};
})(typeof window==='undefined'?globalThis:window);
