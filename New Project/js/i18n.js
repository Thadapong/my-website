/* ตัวช่วยสลับภาษาไทย/อังกฤษ สำหรับหน้า book.html และ province.html
   อ่านภาษาปัจจุบันจากปุ่ม EN ใน header (ซึ่ง site.js จัดการอยู่แล้ว) จึงสลับพร้อมกับทั้งเว็บ */
(function(){
 var last=null,cbs=[];
 function cur(){
  var b=document.getElementById("lang");
  if(b){
   var l=b.getAttribute("aria-label")||"",t=(b.textContent||"").trim();
   if(/english/i.test(l)||t==="EN"){return "th"}
   return "en";
  }
  return document.documentElement.lang==="en"?"en":"th";
 }
 var forced=false,forcedSig="";
 function sig(){
  var b=document.getElementById("lang");
  return b?((b.getAttribute("aria-label")||"")+"|"+(b.textContent||"").trim()):"";
 }
 function emit(c){last=c;cbs.forEach(function(f){f(c)})}
 function check(){
  if(forced){if(sig()===forcedSig){return}forced=false}
  var c=cur();
  if(c!==last){emit(c)}
 }
 /* ถ้าหลังกดปุ่ม EN แล้ว site.js ไม่เปลี่ยนข้อความ/ป้ายของปุ่ม ให้สลับภาษาเองเพื่อให้หน้านี้เปลี่ยนตามอยู่ดี */
 function onClick(){
  var before=sig(),prev=last||cur();
  setTimeout(function(){
   if(sig()!==before){check();return}
   forced=true;forcedSig=sig();
   emit(prev==="th"?"en":"th");
  },200);
 }
 var D={
  th:{
   home:"หน้าหลัก",back:"← ที่เที่ยวแนะนำ",
   h1:"ที่เที่ยวแนะนำแต่ละจังหวัด",
   sub:"แตะชื่อจังหวัดเพื่อดูที่เที่ยว ช่วงเวลาที่เหมาะ การเดินทาง และงบโดยประมาณ",
   best:"ช่วงที่เหมาะ",from:"การเดินทาง",days:"ควรเที่ยวกี่วัน",budget:"งบโดยประมาณ",
   spots:"ที่เที่ยวแนะนำ",stay:"ที่พักแนะนำ",food:"ของกินห้ามพลาด",tips:"ข้อควรรู้",
   info:"ข้อมูลจาก ททท.",official:"เว็บไซต์ทางการ",map:"ดูแผนที่",
   perNight:" / ห้อง / คืน",
   stayNote:"ราคาเป็นค่าประมาณช่วงปกติ ช่วงไฮซีซันและวันหยุดยาวมักสูงกว่า เปรียบเทียบราคาและรีวิวล่าสุดก่อนจอง",
   stayMap:"ดูที่พักแถวนี้",
   foodH:"ร้านอาหารห้ามพลาด",foodMap:"ดูร้านบนแผนที่",
   foodNote:"ผลลัพธ์จาก Google Maps ตรวจรีวิว เวลาเปิด-ปิด และราคาล่าสุดก่อนไปทุกครั้ง",
   plan:"วางแผนทริปกับเพื่อน",hotels:"ดูที่พัก",acts:"ดูกิจกรรม",
   note:"ราคาและช่วงเวลาเป็นค่าประมาณ ควรตรวจสอบก่อนเดินทาง ลิงก์ที่พัก/กิจกรรมเป็นลิงก์พันธมิตร",
   nf:"ไม่พบจังหวัดนี้",nfs:"ลิงก์อาจไม่ถูกต้อง กลับไปเลือกจังหวัดจากหน้ารวมได้เลย",
   nodata:"โหลดไฟล์ข้อมูลไม่สำเร็จ ตรวจสอบว่าไฟล์ js/provinces.js อยู่ในโฟลเดอร์ js ข้างๆ ไฟล์นี้",
   t1:"ที่เที่ยวแนะนำแต่ละจังหวัด – เที่ยวด้วยกัน",t2:" – ที่เที่ยวแนะนำ – เที่ยวด้วยกัน"
  },
  en:{
   home:"Home",back:"← Destinations",
   h1:"Recommended places by province",
   sub:"Tap a province to see what to visit, the best time to go, how to get there and a rough budget",
   best:"Best time",from:"Getting there",days:"Suggested stay",budget:"Rough budget",
   spots:"Places to visit",stay:"Where to stay",food:"Must-try food",tips:"Good to know",
   info:"Info from TAT",official:"Official website",map:"View map",
   perNight:" / room / night",
   stayNote:"Prices are rough estimates for the regular season and are usually higher in peak season and on long holidays. Compare current prices and reviews before booking.",
   stayMap:"Find stays nearby",
   foodH:"Where to eat",foodMap:"Find places on Google Maps",
   foodNote:"Results come from Google Maps. Check recent reviews, opening hours and prices before you go.",
   plan:"Plan the trip with friends",hotels:"Find hotels",acts:"Find activities",
   note:"Prices and timing are estimates; check before you travel. Hotel and activity links are affiliate links.",
   nf:"Province not found",nfs:"The link may be wrong. Go back and pick a province from the list.",
   nodata:"Could not load the data file. Make sure js/provinces.js is in the js folder next to this page.",
   t1:"Recommended places by province – Travel Together",t2:" – Destinations – Travel Together"
  }
 };
 var REG={"ภาคเหนือ":"North","ภาคกลาง":"Central","ภาคตะวันออก":"East","ภาคตะวันตก":"West","ภาคตะวันออกเฉียงเหนือ":"Northeast (Isan)","ภาคใต้":"South"};
 var TIER={"ประหยัด":"Budget","ปานกลาง":"Mid-range","สบาย":"Comfort"};
 window.I18N={
  lang:function(){return last||cur()},
  t:function(k){return (D[window.I18N.lang()]||D.th)[k]},
  region:function(r,l){return l==="en"?(REG[r]||r):r},
  tier:function(r,l){return l==="en"?(TIER[r]||r):r},
  days:function(s,l){return l==="en"?s.replace(/\s*วัน/,(/^1\D*$/.test(s)?" day":" days")):s},
  money:function(s,l){return l==="en"?s.replace(/ประมาณ\s*/,"About ").replace("บาท/คน/วัน","THB/person/day").replace(/\s*บาท/g," THB"):s},
  on:function(f){cbs.push(f);var c=window.I18N.lang();last=last||c;f(c)}
 };
 function boot(){
  var b=document.getElementById("lang");
  if(b){
   b.addEventListener("click",onClick);
   new MutationObserver(check).observe(b,{attributes:true,childList:true,characterData:true,subtree:true});
  }
  new MutationObserver(check).observe(document.documentElement,{attributes:true,attributeFilter:["lang"]});
  check();setTimeout(check,200);setTimeout(check,800);
 }
 if(document.readyState==="loading"){document.addEventListener("DOMContentLoaded",boot)}else{boot()}
 window.addEventListener("load",check);
})();
