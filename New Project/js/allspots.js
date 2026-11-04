/* ชั้นที่เที่ยวทั่วประเทศบนแผนที่ (ซูมแล้วเปลี่ยนระดับอัตโนมัติ)
   ซูม ≤ 7  : ชื่อจังหวัด (77 จังหวัด)
   ซูม 8–10 : ชื่ออำเภอในพื้นที่ที่มองเห็น
   ซูม ≥ 11 : สถานที่ท่องเที่ยวในพื้นที่ที่มองเห็น
   ข้อมูลมาจาก OpenStreetMap (Overpass API) ดึงตามพื้นที่ที่ดูอยู่ และเก็บแคชไว้ในเครื่อง */
(function(){
 var Z_DISTRICT=8,Z_SPOT=11;
 var EP=["https://overpass-api.de/api/interpreter","https://overpass.kumi.systems/api/interpreter"];
 var map=null,layer=null,on=true,seq=0,timer=null;
 var cache={};            /* คีย์ → ผลลัพธ์ในหน่วยความจำ */
 var ST=null;

 function esc(s){return String(s).replace(/[&<>"']/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
 function nm(t){return t["name:th"]||t.name||t["name:en"]||""}
 function lsGet(k){try{var v=JSON.parse(localStorage.getItem(k)||"null");if(v&&Date.now()-v.t<7*864e5)return v.d}catch(e){}return null}
 function lsSet(k,d){try{localStorage.setItem(k,JSON.stringify({t:Date.now(),d:d}))}catch(e){}}

 function post(q,i){
  i=i||0;
  return fetch(EP[i],{method:"POST",body:"data="+encodeURIComponent(q),headers:{"Content-Type":"application/x-www-form-urlencoded"}})
   .then(function(r){if(!r.ok)throw new Error("HTTP "+r.status);return r.json()})
   .catch(function(e){if(i+1<EP.length)return post(q,i+1);throw e});
 }
 function setStatus(t){if(ST)ST.textContent=t||""}

 /* ---- ชั้นข้อมูล ---- */
 function getProvinces(){
  if(cache.prov)return Promise.resolve(cache.prov);
  var c=lsGet("allspots_prov");if(c){cache.prov=c;return Promise.resolve(c)}
  var q='[out:json][timeout:60];area["ISO3166-1"="TH"]->.a;relation["boundary"="administrative"]["admin_level"="4"](area.a);out center tags;';
  return post(q).then(function(j){
   var d=j.elements.map(function(e){return e.center&&nm(e.tags)?{n:nm(e.tags),ll:[e.center.lat,e.center.lon]}:null}).filter(Boolean);
   cache.prov=d;lsSet("allspots_prov",d);return d;
  });
 }
 function bboxKey(b,step){
  return [Math.floor(b.getSouth()/step),Math.floor(b.getWest()/step),Math.floor(b.getNorth()/step),Math.floor(b.getEast()/step)].join(",");
 }
 function bb(b){return b.getSouth().toFixed(3)+","+b.getWest().toFixed(3)+","+b.getNorth().toFixed(3)+","+b.getEast().toFixed(3)}
 function getDistricts(b){
  var k="d"+bboxKey(b,0.5);
  if(cache[k])return Promise.resolve(cache[k]);
  var q='[out:json][timeout:60];relation["boundary"="administrative"]["admin_level"="5"]('+bb(b)+');out center tags 400;';
  return post(q).then(function(j){
   var d=j.elements.map(function(e){return e.center&&nm(e.tags)?{n:nm(e.tags),ll:[e.center.lat,e.center.lon]}:null}).filter(Boolean);
   cache[k]=d;return d;
  });
 }
 function getSpots(b){
  var k="s"+bboxKey(b,0.1);
  if(cache[k])return Promise.resolve(cache[k]);
  var a=bb(b);
  var q='[out:json][timeout:60];('+
   'nwr["tourism"~"^(attraction|viewpoint|museum|zoo|theme_park|aquarium|gallery)$"]["name"]('+a+');'+
   'nwr["natural"~"^(waterfall|beach|cave_entrance|hot_spring)$"]["name"]('+a+');'+
   'nwr["historic"~"^(archaeological_site|castle|ruins|monument|temple)$"]["name"]('+a+');'+
   'nwr["amenity"="place_of_worship"]["tourism"]["name"]('+a+');'+
   ');out center tags 600;';
  return post(q).then(function(j){
   var seen={},d=[];
   j.elements.forEach(function(e){
    var t=e.tags||{},n=nm(t),ll=e.center?[e.center.lat,e.center.lon]:(e.lat!=null?[e.lat,e.lon]:null);
    if(!n||!ll||seen[n+ll[0].toFixed(3)])return;
    seen[n+ll[0].toFixed(3)]=1;
    var kind=t.tourism||t.natural||t.historic||(t.boundary==="national_park"?"national_park":"")||"attraction";
    d.push({n:n,ll:ll,k:kind,en:t["name:en"]||""});
   });
   cache[k]=d;return d;
  });
 }

 /* ---- วาดหมุด ---- */
 var KIND={attraction:"ที่เที่ยว",viewpoint:"จุดชมวิว",museum:"พิพิธภัณฑ์",zoo:"สวนสัตว์",theme_park:"สวนสนุก",aquarium:"พิพิธภัณฑ์สัตว์น้ำ",gallery:"แกลเลอรี",waterfall:"น้ำตก",beach:"ชายหาด",cave_entrance:"ถ้ำ",hot_spring:"บ่อน้ำพุร้อน",archaeological_site:"แหล่งโบราณคดี",castle:"ปราสาท/ป้อม",ruins:"โบราณสถาน",monument:"อนุสาวรีย์",temple:"วัด/โบราณสถาน",national_park:"อุทยานแห่งชาติ"};
 function label(cls,text){
  return L.marker([0,0],{icon:L.divIcon({className:"as-lbl "+cls,html:'<span>'+esc(text)+'</span>',iconSize:null}),keyboard:false});
 }
 function drawNames(list,cls,zoomTo){
  list.forEach(function(p){
   var m=L.marker(p.ll,{icon:L.divIcon({className:"as-lbl "+cls,html:'<span>'+esc(p.n)+'</span>',iconSize:null}),keyboard:false});
   m.on("click",function(){map.flyTo(p.ll,zoomTo)});
   layer.addLayer(m);
  });
 }
 function drawSpots(list){
  list.forEach(function(p){
   var m=L.marker(p.ll,{icon:L.divIcon({className:"as-lbl as-spot",html:'<i></i><span>'+esc(p.n)+'</span>',iconSize:null})});
   var q=encodeURIComponent(p.n);
   m.bindPopup('<b>'+esc(p.n)+'</b><br>'+esc(KIND[p.k]||"ที่เที่ยว")+
    '<br><a href="https://www.google.com/maps/search/?api=1&query='+q+'+'+p.ll[0]+','+p.ll[1]+'" target="_blank" rel="noopener">เปิดใน Google Maps</a>');
   layer.addLayer(m);
  });
 }

 /* ---- อุทยานแห่งชาติทั่วไทย แยกตามจังหวัด ---- */
 var parkLayer=null,parkOn=true,PARKS=null,provList=null;
 function nearestProv(ll){
  var best=null,bd=1e9;
  (provList||[]).forEach(function(p){var d=Math.pow(p.ll[0]-ll[0],2)+Math.pow(p.ll[1]-ll[1],2);if(d<bd){bd=d;best=p.n}});
  return best||"ไม่ทราบจังหวัด";
 }
 function getParks(){
  if(PARKS)return Promise.resolve(PARKS);
  var c=lsGet("allspots_parks");if(c){PARKS=c;return Promise.resolve(c)}
  var q='[out:json][timeout:180];area["ISO3166-1"="TH"]->.th;'+
   'nwr["boundary"="national_park"]["name"](area.th)->.k;'+
   'foreach.k->.x(.x out center tags;.x is_in->.ia;area.ia["boundary"="administrative"]["admin_level"="4"];out tags;);';
  return Promise.all([post(q),getProvinces()]).then(function(r){
   provList=r[1];
   var out=[],cur=null,seen={};
   r[0].elements.forEach(function(e){
    var t=e.tags||{};
    if(e.type==="area"){if(cur&&!cur.pv&&nm(t))cur.pv=nm(t);return}
    var ll=e.center?[e.center.lat,e.center.lon]:(e.lat!=null?[e.lat,e.lon]:null),n=nm(t);
    cur=null;
    if(!n||!ll||seen[n])return;
    seen[n]=1;cur={n:n,ll:ll,pv:""};out.push(cur);
   });
   out.forEach(function(p){if(!p.pv)p.pv=nearestProv(p.ll)});  /* ถ้า Overpass ไม่บอกจังหวัด ใช้จังหวัดที่ใกล้ที่สุด */
   PARKS=out;lsSet("allspots_parks",out);return out;
  });
 }
 function drawParks(list){
  parkLayer.clearLayers();
  if(!parkOn)return;
  list.forEach(function(p){
   var m=L.marker(p.ll,{icon:L.divIcon({className:"as-lbl as-park",html:'<i></i><span>'+esc(p.n)+'</span>',iconSize:null})});
   var q=encodeURIComponent(p.n+" "+p.pv);
   m.bindPopup('<b>'+esc(p.n)+'</b><br>จังหวัด'+esc(p.pv)+
    '<br><a href="https://www.google.com/maps/search/?api=1&query='+q+'" target="_blank" rel="noopener">เปิดใน Google Maps</a>');
   parkLayer.addLayer(m);
  });
 }
 function fillParkSelect(list){
  var sel=document.getElementById("as-pv");if(!sel)return;
  var g={};list.forEach(function(p){(g[p.pv]=g[p.pv]||[]).push(p)});
  var pv=Object.keys(g).sort(function(a,b){return a.localeCompare(b,"th")});
  sel.innerHTML='<option value="">อุทยานแยกตามจังหวัด ('+list.length+')</option>'+pv.map(function(k){
   return '<optgroup label="'+esc(k)+' ('+g[k].length+')">'+g[k].map(function(p){return '<option value="'+p.ll[0]+','+p.ll[1]+'">'+esc(p.n)+'</option>'}).join("")+'</optgroup>';
  }).join("");
  sel.onchange=function(){if(!sel.value)return;var a=sel.value.split(",");map.flyTo([+a[0],+a[1]],11)};
 }
 function loadParks(){
  var st=document.getElementById("as-pst");if(st)st.textContent="กำลังโหลดอุทยาน…";
  getParks().then(function(l){drawParks(l);fillParkSelect(l);if(st)st.textContent=""})
   .catch(function(){if(st)st.textContent="โหลดอุทยานไม่สำเร็จ"});
 }
 function zoomClass(){
  var c=map.getContainer();
  if(map.getZoom()<9)c.classList.add("as-hide-lbl");else c.classList.remove("as-hide-lbl");
 }

 function refresh(){
  if(!map||!layer)return;
  var my=++seq;
  layer.clearLayers();
  if(!on){setStatus("");return}
  var z=map.getZoom(),b=map.getBounds();
  setStatus("กำลังโหลด…");
  var job,lvl;
  if(z<Z_DISTRICT){lvl="จังหวัด";job=getProvinces().then(function(d){if(my===seq)drawNames(d,"as-prov",Z_DISTRICT+1);return d.length})}
  else if(z<Z_SPOT){lvl="อำเภอ";job=getDistricts(b).then(function(d){if(my===seq)drawNames(d,"as-dist",Z_SPOT);return d.length})}
  else{lvl="สถานที่ท่องเที่ยว";job=getSpots(b).then(function(d){if(my===seq)drawSpots(d);return d.length})}
  job.then(function(n){if(my===seq)setStatus("แสดง"+lvl+" "+n+" รายการ"+(lvl==="สถานที่ท่องเที่ยว"&&n>=600?" (มากเกินไป ซูมเข้าเพิ่มเพื่อดูครบ)":""))})
   .catch(function(){if(my===seq)setStatus("โหลดข้อมูลไม่สำเร็จ (ลองซูมหรือเลื่อนแผนที่อีกครั้ง)")});
 }
 function later(){clearTimeout(timer);timer=setTimeout(refresh,450)}

 function init(){
  map=window.__tmap;
  if(!map)return false;
  var css=document.createElement("style");
  css.textContent=
   ".as-lbl{background:none;border:0;width:auto!important;height:auto!important}"+
   ".as-lbl span{display:inline-block;transform:translate(-50%,-50%);white-space:nowrap;font:600 12px/1.2 'IBM Plex Sans Thai',sans-serif;color:#fff;text-shadow:0 0 3px #000,0 0 3px #000,0 1px 2px #000;cursor:pointer}"+
   ".as-prov span{font-size:15px;font-family:Kanit,sans-serif;background:rgba(232,85,58,.88);padding:3px 10px;border-radius:999px;text-shadow:none;box-shadow:0 1px 4px rgba(0,0,0,.4)}"+
   ".as-dist span{font-size:13px;background:rgba(30,30,30,.72);padding:2px 8px;border-radius:999px;text-shadow:none}"+
   ".as-spot{display:flex;align-items:center;gap:4px}"+
   ".as-spot i{width:11px;height:11px;border-radius:50%;background:#e8553a;border:2px solid #fff;box-shadow:0 0 3px #000;flex:none}"+
   ".as-spot span{transform:none}"+
   ".as-park{display:flex;align-items:center;gap:4px}"+
   ".as-park i{width:13px;height:13px;border-radius:3px;background:#2e8b57;border:2px solid #fff;box-shadow:0 0 3px #000;flex:none}"+
   ".as-park span{transform:none;color:#d6ffe4}"+
   ".as-hide-lbl .as-park span{display:none}"+
   ".as-ctl select{max-width:210px;margin-top:4px;font:inherit}"+
   ".as-ctl{background:#fff;color:#222;padding:6px 10px;border-radius:8px;font:13px 'IBM Plex Sans Thai',sans-serif;box-shadow:0 1px 5px rgba(0,0,0,.35)}"+
   ".as-ctl label{display:flex;gap:6px;align-items:center;cursor:pointer}"+
   ".as-ctl small{display:block;color:#666;margin-top:2px}";
  document.head.appendChild(css);
  layer=L.layerGroup().addTo(map);
  var C=L.control({position:"topleft"});
  C.onAdd=function(){
   var d=L.DomUtil.create("div","as-ctl");
   d.innerHTML='<label><input type="checkbox" id="as-on" checked> ที่เที่ยวทั่วประเทศ</label><small id="as-st"></small>'+
    '<label style="margin-top:6px"><input type="checkbox" id="as-park" checked> อุทยานแห่งชาติ</label><small id="as-pst"></small>'+
    '<select id="as-pv"><option value="">อุทยานแยกตามจังหวัด</option></select>';
   L.DomEvent.disableClickPropagation(d);
   d.querySelector("#as-on").addEventListener("change",function(e){on=e.target.checked;refresh()});
   d.querySelector("#as-park").addEventListener("change",function(e){parkOn=e.target.checked;if(PARKS)drawParks(PARKS);else if(parkOn)loadParks()});
   return d;
  };
  C.addTo(map);
  ST=document.getElementById("as-st");
  parkLayer=L.layerGroup().addTo(map);
  map.on("moveend",function(){zoomClass();later()});
  zoomClass();
  try{var f=(new URLSearchParams(location.search).get("fly")||"").split(",");if(f.length>=2&&isFinite(+f[0])&&isFinite(+f[1]))map.setView([+f[0],+f[1]],+f[2]||11)}catch(e){}
  loadParks();
  refresh();
  return true;
 }

 var tries=0,iv=setInterval(function(){tries++;if(window.L&&init()||tries>80)clearInterval(iv)},250);
})();
