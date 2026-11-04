// ส่งออกเป็นรูปภาพ / PDF
function lines(){
 const L=[],r=settle();
 L.push({t:tripName(),s:40,b:1,c:'#0f8b8d'});L.push({t:'สมาชิก: '+(S.mem.map(m=>m.name).join(', ')||'-'),s:22,c:'#444'});
 L.push({t:'ตารางเที่ยว',s:30,b:1,gap:14});
 let ld=0;planSorted().forEach(s=>{if(s.day!==ld){ld=s.day;L.push({t:'วันที่ '+s.day,s:26,b:1,c:'#0f8b8d',gap:6})}
  L.push({t:'  '+s.title+(pname(s.place)?'  📍'+pname(s.place):'')+'  –  '+thTime(s.time),s:22})});
 if(!S.plan.length)L.push({t:'(ยังไม่มีกิจกรรม)',s:22,c:'#666'});
 L.push({t:'สถานที่ยอดนิยม',s:30,b:1,gap:14});
 ranked().slice(0,5).forEach((p,i)=>L.push({t:`  ${i+1}. ${p.name} – ${cnt(p)} โหวต`,s:22}));
 L.push({t:'สรุปค่าใช้จ่าย  (รวม '+money(r.total)+')',s:30,b:1,gap:14});
 r.tx.forEach(t=>L.push({t:`  ${nm(t.from)} → ${nm(t.to)}  ${money(t.amt)}`,s:22}));
 if(!r.tx.length)L.push({t:'  ไม่มียอดค้างจ่าย',s:22,c:'#666'});
 return L}
function drawCanvas(){
 const L=lines(),W=900,P=40;let y=P;const cv=$('#cv'),H=L.reduce((a,l)=>a+l.s*1.5+(l.gap||0),0)+P*2;
 cv.width=W;cv.height=Math.ceil(H);const x=cv.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,W,cv.height);x.textBaseline='top';
 L.forEach(l=>{y+=l.gap||0;x.font=`${l.b?700:600} ${l.s}px 'Sarabun',sans-serif`;x.fillStyle=l.c||'#1d2a2a';
  let t=l.t;while(x.measureText(t).width>W-P*2&&t.length>3)t=t.slice(0,-2);if(t!==l.t)t+='…';x.fillText(t,P,y);y+=l.s*1.5});
}
const blobOf=()=>new Promise(r=>$('#cv').toBlob(r,'image/png'));
function save(name,blob){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1500)}
$('#png').onclick=async()=>{await document.fonts.ready;drawCanvas();save('trip-plan.png',await blobOf())};
$('#pdf').onclick=async()=>{await document.fonts.ready;drawCanvas();const cv=$('#cv');
 const jb=atob(cv.toDataURL('image/jpeg',.92).split(',')[1]),jpg=Uint8Array.from(jb,c=>c.charCodeAt(0));
 const pw=595,ph=Math.round(cv.height*pw/cv.width),en=new TextEncoder(),parts=[],off=[];let len=0;
 const put=b=>{if(typeof b==='string')b=en.encode(b);parts.push(b);len+=b.length};
 const obj=(n,s)=>{off[n]=len;put(`${n} 0 obj\n${s}\nendobj\n`)};
 put('%PDF-1.4\n');obj(1,'<</Type/Catalog/Pages 2 0 R>>');obj(2,'<</Type/Pages/Kids[3 0 R]/Count 1>>');
 obj(3,`<</Type/Page/Parent 2 0 R/MediaBox[0 0 ${pw} ${ph}]/Resources<</XObject<</Im0 4 0 R>>>>/Contents 5 0 R>>`);
 off[4]=len;put(`4 0 obj\n<</Type/XObject/Subtype/Image/Width ${cv.width}/Height ${cv.height}/ColorSpace/DeviceRGB/BitsPerComponent 8/Filter/DCTDecode/Length ${jpg.length}>>\nstream\n`);put(jpg);put('\nendstream\nendobj\n');
 const c=`q ${pw} 0 0 ${ph} 0 0 cm /Im0 Do Q`;obj(5,`<</Length ${c.length}>>\nstream\n${c}\nendstream`);
 const xr=len;put('xref\n0 6\n0000000000 65535 f \n');for(let i=1;i<=5;i++)put(String(off[i]).padStart(10,'0')+' 00000 n \n');
 put(`trailer\n<</Size 6/Root 1 0 R>>\nstartxref\n${xr}\n%%EOF`);
 save('trip-plan.pdf',new Blob(parts,{type:'application/pdf'}))};
