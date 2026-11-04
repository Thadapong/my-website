/* ตัวช่วยเพิ่มจังหวัดแบบรวมไทย/อังกฤษ/ที่พัก/ร้านอาหารไว้ในก้อนเดียว
   ต้องโหลดหลัง provinces.js, provinces-en.js, stays.js, foods.js
   รูปแบบ: addProv({key, region, th:{...}, en:{...}, stays:[[ประเภท,โซน,ราคา,คำค้นแผนที่,type,area]x3], foods:[[เมนู,พื้นที่,dish,area,คำค้นแผนที่],...]}) */
function addProv(d){
 var TH=d.th,tiers=["ประหยัด","ปานกลาง","สบาย"];
 PROV.push({key:d.key,region:d.region,name:TH.name,tag:TH.tag,best:TH.best,from:TH.from,days:TH.days,budget:TH.budget,stay:TH.stay,spots:TH.spots,food:TH.food,tips:TH.tips});
 PROV_EN[d.key]=d.en;
 STAYS[d.key]=d.stays.map(function(s,i){return {tier:tiers[i],type:s[0],area:s[1],price:s[2],q:s[3]}});
 STAYS_EN[d.key]=d.stays.map(function(s){return [s[4],s[5]]});
 FOODS[d.key]=d.foods;
}
