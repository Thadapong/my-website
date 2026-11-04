// ถ้าเปิดลิงก์ทริปที่มีรหัสท้าย # (ที่เพื่อนส่งมา) ข้ามหน้าแรกเข้าแอปเลย
if(location.hash.length>1)location.replace('app.html'+location.hash);
addEventListener('DOMContentLoaded',()=>{
 let room='';try{room=localStorage.getItem('tp_room')||''}catch(e){}
 if(room.length>1){ // เคยเข้าทริปไว้แล้ว: ปุ่มหลักพากลับทริปเดิม
  const b=document.getElementById('start');b.textContent='กลับเข้าทริปของฉัน';b.href='app.html'+room;
  document.getElementById('newtrip').hidden=false;
 }
 const f=document.getElementById('join');
 f.onsubmit=e=>{e.preventDefault();
  const c=f.elements.code.value.trim().replace(/^.*#/,'');
  if(c)location.href='app.html#'+encodeURIComponent(c)};
});
