// แผนที่ฟรี (Leaflet + OpenStreetMap) ไม่ต้องใช้คีย์หรือบัตรเครดิต
// ค้นหาสถานที่ = Nominatim, สถานที่แนะนำ = Overpass (ข้อมูล OpenStreetMap)
let gmap=null,markers=[];
const pinIcon=(n,pending)=>L.divIcon({className:'',html:'<div class="pin'+(pending?' pend':'')+'">'+(pending?'+':n)+'</div>',iconSize:[28,28],iconAnchor:[14,14]});
const mkLayer=()=>gmap?gmap._mk||(gmap._mk=L.layerGroup().addTo(gmap)):null;

function initMap(){
 if(!window.L){$('#map').replaceChildren(h('div',{class:'mut',style:'padding:16px'},'โหลดแผนที่ไม่สำเร็จ ตรวจอินเทอร์เน็ตแล้วรีเฟรชหน้า'));return}
 gmap=L.map('map',{center:[13.7563,100.5018],zoom:6});
 // เปิดเป็นเว็บจริง (http/https) ใช้ OpenStreetMap; เปิดไฟล์ตรงจากเครื่อง (file://) OSM จะบล็อก จึงใช้ Esri แทน
 if(location.protocol==='file:')
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',{maxZoom:19,attribution:'Tiles &copy; Esri'}).addTo(gmap);
 else
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'}).addTo(gmap);
 gmap.on('click',e=>{pend={lat:e.latlng.lat,lng:e.latlng.lng};render()});
 initSearch();
 render();
}

// ---------- ช่องค้นหาสถานที่ (Nominatim: กดค้นหาทีละครั้ง ไม่ยิงทุกตัวอักษร) ----------
function initSearch(){
 const box=$('#ps'),inp=h('input',{class:'f',placeholder:'ค้นหาสถานที่ เช่น วัดพระธาตุดอยสุเทพ',style:'width:100%'}),
  btn=h('button',{type:'button'},'ค้นหา'),out=h('div',{});
 const go=async()=>{
  const q=inp.value.trim();if(!q)return inp.focus();
  out.replaceChildren(h('div',{class:'mut'},'กำลังค้นหา…'));
  try{
   const r=await fetch('https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&accept-language=th&q='+encodeURIComponent(q));
   const list=await r.json();
   if(!list.length)return out.replaceChildren(h('div',{class:'mut'},'ไม่พบสถานที่ ลองพิมพ์ชื่อให้ละเอียดขึ้น'));
   out.replaceChildren(...list.map(x=>h('div',{class:'place'},
    h('div',{class:'grow'},h('div',{},x.name||x.display_name.split(',')[0]),h('div',{class:'mut'},x.display_name)),
    h('button',{type:'button',class:'g',on:{click:()=>{
     const lat=+x.lat,lng=+x.lon;gmap.setView([lat,lng],15);pend={lat,lng};
     $('#pn').value=x.name||x.display_name.split(',')[0];out.replaceChildren();render()}}},'เลือก'))));
  }catch(e){console.error(e);out.replaceChildren(h('div',{class:'mut'},'ค้นหาไม่ได้ในตอนนี้ ลองใหม่อีกครั้ง หรือแตะบนแผนที่เพื่อปักหมุดเอง'))}
 };
 btn.onclick=go;inp.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();go()}});
 box.append(h('div',{class:'row'},inp,btn),out);
}

function drawMarkers(){
 const lay=mkLayer();if(!lay)return;
 lay.clearLayers();
 S.places.forEach((p,i)=>{if(p.lat==null)return;
  L.marker([p.lat,p.lng],{icon:pinIcon(i+1),title:p.name}).addTo(lay)});
 if(pend)L.marker([pend.lat,pend.lng],{icon:pinIcon(0,true)}).addTo(lay);
}

// ---------- สถานที่เที่ยวแนะนำ (Overpass API ข้อมูล OpenStreetMap) ----------
let recs=[];
async function findRecs(){
 if(!gmap)return alert('แผนที่ยังไม่พร้อม ลองรีเฟรชหน้า');
 const z=gmap.getZoom();
 if(z<9)return alert('ซูมเข้าไปที่เมืองหรือย่านที่อยากเที่ยวก่อน แล้วกดค้นหาอีกครั้ง');
 $('#reclist').replaceChildren(h('div',{class:'mut'},'กำลังค้นหา…'));
 const c=gmap.getCenter(),rad=z>=13?5000:z>=11?15000:30000;
 const q='[out:json][timeout:20];nwr["tourism"~"^(attraction|viewpoint|museum|zoo|theme_park)$"]["name"](around:'+rad+','+c.lat+','+c.lng+');out center 60;';
 try{
  const r=await fetch('https://overpass-api.de/api/interpreter',{method:'POST',body:'data='+encodeURIComponent(q),headers:{'Content-Type':'application/x-www-form-urlencoded'}});
  const j=await r.json();
  recs=(j.elements||[]).map(e=>{const t=e.tags||{},la=e.lat??e.center?.lat,ln=e.lon??e.center?.lon;
    return{name:t['name:th']||t.name,lat:la,lng:ln,kind:t.tourism,score:(t.wikipedia||t.wikidata?2:0)+(t['name:th']?1:0)}})
   .filter(x=>x.name&&x.lat!=null).sort((a,b)=>b.score-a.score).slice(0,6);
 }catch(e){console.error(e);recs=[];$('#reclist').replaceChildren(h('div',{class:'mut'},'ค้นหาไม่ได้ในตอนนี้ (เซิร์ฟเวอร์ข้อมูลแผนที่ไม่ว่าง) รอสักครู่แล้วลองใหม่'));return}
 if(!recs.length)return $('#reclist').replaceChildren(h('div',{class:'mut'},'ไม่พบสถานที่แนะนำแถวนี้ ลองเลื่อนหรือซูมออกแล้วค้นหาใหม่'));
 drawRecs();
}
function drawRecs(){
 if(!recs.length)return;
 $('#reclist').replaceChildren(...recs.map((r,i)=>{const added=S.places.some(p=>p.name===r.name);
  return h('div',{class:'place'},h('div',{class:'num'},i+1),
   h('div',{class:'grow'},h('div',{},r.name),h('div',{class:'mut'},r.kind||'')),
   h('button',{class:'g',on:{click:()=>{gmap.setView([r.lat,r.lng],15)}}},'ดูแผนที่'),
   added?h('span',{class:'mut'},'เพิ่มแล้ว'):h('button',{on:{click:()=>store.add('places',{name:r.name,note:'แนะนำจากแผนที่',lat:r.lat,lng:r.lng,by:uid,votes:{[uid]:true}})}},'เสนอเข้าทริป'))}));
}
$('#recbtn').onclick=findRecs;
initMap();
