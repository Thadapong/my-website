// แท็บ + ปุ่มต่างๆ + คำนวณหารเงิน + วาดหน้าจอ (render)
['โหวตสถานที่','ตารางเที่ยว','ค่าใช้จ่าย','สรุป & ส่งออก'].forEach((n,i)=>{
 $('#tabs').append(h('button',{on:{click:()=>{tab=i;render()}}},n))});
for(let i=1;i<=7;i++)$('#d').append(h('option',{value:i},'วันที่ '+i));

$('#padd').onclick=()=>{const n=$('#pn').value.trim();if(!n)return $('#pn').focus();
 if(!pend)return alert('แตะบนแผนที่หรือค้นหาสถานที่ก่อน');
 store.add('places',{name:n,note:$('#pd').value.trim(),lat:pend.lat,lng:pend.lng,by:uid,votes:{[uid]:true}});
 pend=null;$('#pn').value='';$('#pd').value=''};
$('#tadd').onclick=()=>{const t=$('#ti').value.trim();if(!t)return $('#ti').focus();
 store.add('plan',{day:+$('#d').value,time:$('#tm').value||'00:00',title:t,place:$('#tp').value});$('#ti').value=''};
// เพิ่มชื่อคนที่ยังไม่ได้เข้าห้อง (ใครก็เพิ่มได้ ใช้เป็นคนจ่าย/คนหารได้เหมือนสมาชิกทั่วไป)
const addGuest=()=>{const n=$('#gn').value.trim().slice(0,40);if(!n)return $('#gn').focus();
 if(S.mem.some(m=>m.name===n))return alert('มีชื่อนี้ในทริปแล้ว');
 store.set('mem','g_'+Math.random().toString(36).slice(2,9),{name:n,guest:true});$('#gn').value=''};
$('#gadd').onclick=addGuest;
$('#gn').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();addGuest()}});
const delGuest=m=>{if(S.exp.some(e=>e.paidBy===m.id||(e.split||[]).includes(m.id)))return alert('ลบไม่ได้ เพราะ '+m.name+' มีอยู่ในรายการค่าใช้จ่าย ลบรายการนั้นก่อน');
 store.del('mem',m.id)};
$('#eadd').onclick=()=>{const t=$('#et').value.trim(),a=parseFloat($('#ea').value);
 const sp=S.mem.map(m=>m.id).filter(i=>!unchecked.has(i));
 if(!t||!(a>0)||!sp.length||!$('#ep').value)return;
 store.add('exp',{title:t,amount:a,paidBy:$('#ep').value,split:sp});$('#et').value='';$('#ea').value=''};
let myName='';try{myName=localStorage.getItem('tp_name')||''}catch(e){}
$('#me').value=myName;
const saveMe=()=>{const v=$('#me').value.trim();if(!v)return;try{localStorage.setItem('tp_name',v)}catch(e){}
 if(nm(uid)!==v)store.set('mem',uid,{name:v})};
$('#me').onchange=saveMe;
$('#trip').onchange=()=>store.set('meta','trip',{name:$('#trip').value.trim()});

function settle(){
 const bal={};S.mem.forEach(m=>bal[m.id]=0);
 S.exp.forEach(e=>{const sp=(e.split||[]).filter(i=>i in bal);if(!sp.length||!(e.paidBy in bal))return;
  bal[e.paidBy]+=e.amount;sp.forEach(i=>bal[i]-=e.amount/sp.length)});
 const cr=[],de=[];for(const i in bal){if(bal[i]>0.005)cr.push([i,bal[i]]);else if(bal[i]<-0.005)de.push([i,-bal[i]])}
 cr.sort((a,b)=>b[1]-a[1]);de.sort((a,b)=>b[1]-a[1]);const tx=[];
 while(cr.length&&de.length){const a=Math.min(cr[0][1],de[0][1]);tx.push({from:de[0][0],to:cr[0][0],amt:a});
  cr[0][1]-=a;de[0][1]-=a;if(cr[0][1]<.005)cr.shift();if(de[0][1]<.005)de.shift()}
 return{bal,tx,total:S.exp.reduce((s,e)=>s+e.amount,0)}
}
const planSorted=()=>[...S.plan].sort((a,b)=>a.day-b.day||(a.time||'').localeCompare(b.time||''));
const pname=id=>S.places.find(p=>p.id===id)?.name||'';
// เวลาแบบพูดไทย เช่น 09:00 -> "9 โมงเช้า", 14:30 -> "บ่าย 2 โมง 30 นาที", 19:00 -> "1 ทุ่ม"
function thTime(t){
 const [H,M]=(t||'00:00').split(':').map(Number),m=M?' '+M+' นาที':'';
 let w;
 if(H===0)w='เที่ยงคืน';
 else if(H<=5)w='ตี '+H;
 else if(H<=11)w=H+' โมงเช้า';
 else if(H===12)w='เที่ยง';
 else if(H===13)w='บ่ายโมง';
 else if(H<=15)w='บ่าย '+(H-12)+' โมง';
 else if(H<=18)w=(H-12)+' โมงเย็น';
 else w=(H-18)+' ทุ่ม';
 return w+m;
}

function render(){
 document.querySelectorAll('#tabs button').forEach((b,i)=>b.className=i===tab?'on':'');
 document.querySelectorAll('.tab').forEach((s,i)=>s.className='tab'+(i===tab?' on':''));
 if(document.activeElement!==$('#trip'))$('#trip').value=S.meta.find(m=>m.id==='trip')?.name||'';
 const top=ranked()[0];
 // map (Google Maps)
 if(typeof drawMarkers==='function'){drawMarkers();drawRecs()}
 // places
 const pl=$('#plist');pl.replaceChildren(h('b',{},'สถานที่ที่เสนอ ('+S.places.length+')'));
 if(!S.places.length)pl.append(h('div',{class:'mut'},'ยังไม่มีสถานที่ – ลองปักหมุดแรกเลย'));
 S.places.forEach((p,i)=>{const on=(p.votes||{})[uid];
  pl.append(h('div',{class:'place'},h('div',{class:'num'},i+1),
   h('div',{class:'grow'},h('div',{},p.name,top&&top.id===p.id&&cnt(p)>0?h('span',{class:'crown'},' 👑'):null),
    h('div',{class:'mut'},[p.note,'เสนอโดย '+nm(p.by)].filter(Boolean).join(' · ')),h('a',{href:'https://www.google.com/maps/search/?api=1&query='+(p.lat!=null?p.lat+','+p.lng:encodeURIComponent(p.name)),target:'_blank',rel:'noopener',class:'mut'},'🗺️ เปิดใน Google Maps')),
   h('button',{class:'vote'+(on?' on':''),on:{click:()=>store.upd('places',p.id,{['votes.'+uid]:!on})}},(on?'👍 ':'')+cnt(p)),
   p.by===uid?h('button',{class:'x',on:{click:()=>store.del('places',p.id)}},'ลบ'):null))});
 // plan form place select
 const tp=$('#tp'),tv=tp.value;tp.replaceChildren(h('option',{value:''},'(ไม่ระบุสถานที่)'),...S.places.map(p=>h('option',{value:p.id},p.name)));tp.value=tv;
 const pln=$('#pl');pln.replaceChildren();let ld=0;
 planSorted().forEach(s=>{if(s.day!==ld){ld=s.day;pln.append(h('div',{class:'day'},'วันที่ '+s.day))}
  pln.append(h('div',{class:'place'},h('b',{},s.time),h('div',{class:'grow'},s.title,pname(s.place)?h('span',{class:'mut'},' 📍'+pname(s.place)):null),
   h('button',{class:'x',on:{click:()=>store.del('plan',s.id)}},'ลบ')))});
 if(!S.plan.length)pln.append(h('div',{class:'mut'},'ยังไม่มีกิจกรรม – เพิ่มด้านบนได้เลย ทุกคนเห็นพร้อมกัน'));
 // expense form
 const ep=$('#ep'),ev=ep.value;ep.replaceChildren(...S.mem.map(x=>h('option',{value:x.id},x.name)));ep.value=ev||(S.mem.some(x=>x.id===uid)?uid:'');if(!ep.value&&ep.options.length)ep.selectedIndex=0;
 $('#es').replaceChildren(...S.mem.flatMap(x=>[h('label',{class:'chk'},h('input',{type:'checkbox',...(unchecked.has(x.id)?{}:{checked:''}),on:{change:e=>{e.target.checked?unchecked.delete(x.id):unchecked.add(x.id)}}}),x.name),
  x.guest?h('button',{type:'button',class:'x',title:'ลบชื่อนี้',on:{click:()=>delGuest(x)}},'✕'):null].filter(Boolean)));
 const el=$('#el');el.replaceChildren(h('b',{},'รายการค่าใช้จ่าย'));
 S.exp.forEach(e=>el.append(h('div',{class:'place'},h('div',{class:'grow'},e.title,h('div',{class:'mut'},nm(e.paidBy)+' จ่าย · หาร '+(e.split||[]).length+' คน')),h('b',{},money(e.amount)),
  h('button',{class:'x',on:{click:()=>store.del('exp',e.id)}},'ลบ'))));
 if(!S.exp.length)el.append(h('div',{class:'mut'},'ยังไม่มีรายการ'));
 // สรุปตารางเที่ยว: เรียงตามวัน แล้วเรียงตามเวลา (ชื่อกิจกรรม + เวลา)
 const tl=$('#tl');tl.replaceChildren();let td=0;
 planSorted().forEach(s=>{if(s.day!==td){td=s.day;tl.append(h('div',{class:'day'},'วันที่ '+s.day))}
  tl.append(h('div',{class:'place'},h('div',{class:'grow'},s.title,pname(s.place)?h('span',{class:'mut'},' 📍'+pname(s.place)):null),h('b',{},thTime(s.time))))});
 if(!S.plan.length)tl.append(h('div',{class:'mut'},'ยังไม่มีกิจกรรม – เพิ่มได้ที่แท็บตารางเที่ยว'));
 // settle
 const r=settle(),st=$('#st');st.replaceChildren(h('div',{class:'mut'},'ยอดรวม '+money(r.total)+(S.mem.length?' · เฉลี่ยคนละ '+money(r.total/S.mem.length):'')));
 r.tx.forEach(t=>st.append(h('div',{class:'tx'},h('b',{},nm(t.from)),' จ่ายคืน ',h('b',{},nm(t.to)),' ',h('b',{},money(t.amt)))));
 if(!r.tx.length)st.append(h('div',{class:'tx'},'ไม่มียอดค้างจ่าย 🎉'));
 if(tab===3)drawCanvas();
}

$('#share').onclick=async e=>{const b=e.currentTarget;
 try{await navigator.clipboard.writeText(location.href);b.textContent='คัดลอกแล้ว'}catch{prompt('คัดลอกลิงก์นี้ส่งให้เพื่อน',location.href)}
 setTimeout(()=>b.textContent='คัดลอกลิงก์ชวนเพื่อน',1800)};
