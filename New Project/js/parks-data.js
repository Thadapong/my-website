/* โหลดรายชื่ออุทยานแห่งชาติทั่วไทย (พร้อมจังหวัด) จาก OpenStreetMap ใช้ร่วมกันในหน้าจองทริป หน้าจังหวัด และแผนที่
   เก็บแคชใน localStorage 7 วัน (คีย์เดียวกับ allspots.js) แล้วเรียก: loadParks().then(function(list){ ... })
   list = [{n:"ชื่ออุทยาน", ll:[lat,lng], pv:"ชื่อจังหวัด"}] */
(function(){
 var EP=["https://overpass-api.de/api/interpreter","https://overpass.kumi.systems/api/interpreter"];
 var memo=null;
 function nm(t){return t["name:th"]||t.name||t["name:en"]||""}
 function lsGet(k){try{var v=JSON.parse(localStorage.getItem(k)||"null");if(v&&Date.now()-v.t<7*864e5)return v.d}catch(e){}return null}
 function lsSet(k,d){try{localStorage.setItem(k,JSON.stringify({t:Date.now(),d:d}))}catch(e){}}
 function post(q,i){
  i=i||0;
  return fetch(EP[i],{method:"POST",body:"data="+encodeURIComponent(q),headers:{"Content-Type":"application/x-www-form-urlencoded"}})
   .then(function(r){if(!r.ok)throw new Error("HTTP "+r.status);return r.json()})
   .catch(function(e){if(i+1<EP.length)return post(q,i+1);throw e});
 }
 function provinces(){
  var c=lsGet("allspots_prov");if(c)return Promise.resolve(c);
  var q='[out:json][timeout:60];area["ISO3166-1"="TH"]->.a;relation["boundary"="administrative"]["admin_level"="4"](area.a);out center tags;';
  return post(q).then(function(j){
   var d=j.elements.map(function(e){return e.center&&nm(e.tags)?{n:nm(e.tags),ll:[e.center.lat,e.center.lon]}:null}).filter(Boolean);
   lsSet("allspots_prov",d);return d;
  });
 }
 function nearest(list,ll){
  var best="ไม่ทราบจังหวัด",bd=1e9;
  list.forEach(function(p){var d=Math.pow(p.ll[0]-ll[0],2)+Math.pow(p.ll[1]-ll[1],2);if(d<bd){bd=d;best=p.n}});
  return best;
 }
 window.loadParks=function(){
  if(memo)return memo;
  var c=lsGet("allspots_parks");if(c){memo=Promise.resolve(c);return memo}
  var q='[out:json][timeout:180];area["ISO3166-1"="TH"]->.th;'+
   'nwr["boundary"="national_park"]["name"](area.th)->.k;'+
   'foreach.k->.x(.x out center tags;.x is_in->.ia;area.ia["boundary"="administrative"]["admin_level"="4"];out tags;);';
  memo=Promise.all([post(q),provinces()]).then(function(r){
   var out=[],cur=null,seen={};
   r[0].elements.forEach(function(e){
    var t=e.tags||{};
    if(e.type==="area"){if(cur&&!cur.pv&&nm(t))cur.pv=nm(t);return}
    var ll=e.center?[e.center.lat,e.center.lon]:(e.lat!=null?[e.lat,e.lon]:null),n=nm(t);
    cur=null;
    if(!n||!ll||seen[n])return;
    seen[n]=1;cur={n:n,ll:ll,pv:""};out.push(cur);
   });
   out.forEach(function(p){if(!p.pv)p.pv=nearest(r[1],p.ll)});
   lsSet("allspots_parks",out);
   return out;
  }).catch(function(e){memo=null;throw e});
  return memo;
 };
})();
