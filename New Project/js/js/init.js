// มีรหัสห้องเสมอ (ไม่ทำให้หน้ารีโหลด) และจำไว้ให้หน้าแรกพากลับมาทริปเดิมได้
if(!location.hash)history.replaceState(null,'','#'+Math.random().toString(36).slice(2,8));
try{localStorage.setItem('tp_room',location.hash)}catch(e){}
// เริ่มทำงาน: ต่อ Firebase (ถ้าตั้งค่าไว้) แล้ววาดหน้าจอ
window.addEventListener('hashchange',()=>location.reload());
(async()=>{
 const FC=window.FIREBASE_CONFIG;
 if(window.firebase&&FC&&FC.apiKey&&!FC.apiKey.startsWith('YOUR')){
  try{firebase.initializeApp(FC);uid=(await firebase.auth().signInAnonymously()).user.uid;
   if(!location.hash)location.hash=Math.random().toString(36).slice(2,8);
   fs=firebase.firestore().collection('trips').doc(location.hash.slice(1));
   ['places','plan','exp','mem','meta','guest'].forEach(c=>fs.collection(c).onSnapshot(q=>{S[c]=q.docs.map(d=>({id:d.id,...d.data()}));render()},console.error));
   if(myName)store.set('mem',uid,{name:myName});
  }catch(e){console.error(e);fs=null}
 }
 if(!fs){$('#off').textContent='ยังไม่ได้ตั้งค่า Firebase – ข้อมูลอยู่เฉพาะในหน้านี้ (ไม่เรียลไทม์)';$('#off').style.display='block';if(myName)S.mem.push({id:uid,name:myName})}
 render()})();
render();
