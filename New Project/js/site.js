(function(){
var en={brand:"Trip Together",menu:"Menu",tl1:"Search before you book",tl1p:"Type your destination, then choose stays, activities or transport.",lbd:"Destination",bs:"Find stays",ba:"Find activities",bt:"Find transport",hn:"Your destination is copied. Paste it into the search box on the site that opened.",tl2:"Estimate the budget",lbdays:"Days",lbppl:"People",lblvl:"Travel style",lv1:"Budget",lv2:"Comfortable",lv3:"Relaxed",bl0:"Stay",bl1:"Transport",bl2:"Food",bl3:"Activities",lt:"Per person",lg:"Whole group",bn:"Rough estimate for domestic trips, with two people sharing a room. Real prices depend on season and destination.",bg:"Split costs in the app",f1:"Create and invite",f2:"Vote",f3:"Plan",f4:"Split costs",f5:"Summary and export",h1t:"Create a trip and send the link",h1p:"Name your trip and yourself, then copy the link into your group chat. Friends open it, type their name and they are in.",wk:"How it works",h1w:"Every trip has its own code inside the link. Anyone who opens the same link sees the same data and sees friends’ changes in real time. Sign-in is anonymous and automatic, so no account is needed.",m1a:"Trip name",m1av:"Chiang Mai 3-day trip",m1b:"My name",n1:"Ton",m1btn:"Copy invite link",m1j:"Joined",n2:"Phrae",n3:"Mai",h2t:"Pin places and let everyone vote",h2p:"Tap the map to drop a pin and name it, or search for suggested places near where you are looking. Each friend votes for places they want to visit and the ranking updates instantly.",h2w:"Each person gets one vote per place and can only change their own vote. You can delete only pins you created, so nobody can edit another person’s votes.",m2:"Vote ranking",doi:"Doi Inthanon",pai:"Pai",mhs:"Mae Hong Son",h3t:"Plan the schedule day by day",h3p:"Pick a day, set a time, add an activity and link it to a voted place. The app sorts items by time, so the order never gets mixed up.",h3w:"The schedule is stored with the trip. Everyone in the trip can edit it together and see each other’s edits.",d1:"Day 1",a1:"Breakfast",a2:"Visit Doi Inthanon",a3:"Night market",h4t:"Split the costs fairly",h4p:"Add the people sharing costs, then log each expense: who paid, how much and who shares it. The app then tells you who should transfer to whom.",k1:"Add up everything and work out each person’s share",k2:"Compare with what each person actually paid. Overpayers get money back, underpayers owe more",k3:"Match those who owe with those owed, to keep the number of transfers low",ex:"Example: ฿4,800 in total split among 3 people, ฿1,600 each",e1:"Fuel",lp:"Paid",owe:"Owes",e2:"Accommodation",get:"Gets back",e3:"Food",h5t:"See the summary and export it",h5p:"The summary tab puts the time-sorted schedule and the transfer list on one page. Save it as an image or PDF to send to the group or keep for the trip.",x1:"Save as image",x2:"Save as PDF",tp:"Good to know",q1:"No sign-up. Open the link and start.",q2:"Anyone with the link can join the trip, so share it only with people you trust.",q3:"If you see the “sync not connected” banner, data stays on that page only and friends will not see it in real time.",hw:"How to use it, from starting a trip to settling up",hws:"Read it once and you can use it. Each step has an example picture and explains how the app works.",t1:"Home",t2:"How it works",t3:"Book",nav:"Book your trip",h1:"Where to go?<br>Let your friends decide",
lead:"Drop pins, let everyone vote, plan the days, and split the costs, all on one page. No sign-up needed.",
start:"Start planning a trip",newtrip:"Start a new trip instead",label:"Already have a trip code or link?",
ph:"Paste the code or link your friend sent",join:"Join trip",
aria:"Example route with four stops and votes from friends in the group",
cm:"Chiang Mai",pai:"Pai",mhs:"Mae Hong Son",doi:"Doi Inthanon",
how:"Everything about your trip, in one link",
howsub:"Send the link to your friends. Everyone sees the same plan in real time, so no more chasing answers in the chat.",
s1:"Vote on places",s1d:"Drop pins on the map, let friends vote, and see the ranking instantly.",
s2:"Plan the schedule",s2d:"Split activities by day, sorted by time automatically.",
s3:"Split the costs",s3d:"See who pays whom, with the fewest transfers possible.",
ph2:"Place decided? Book it now",phsub:"Services people use most when preparing a trip. Compare prices as you like.",
c1:"Stays",c1d:"Compare hotels, resorts and homestays across Thailand.",c1l:"Browse stays",
c2:"Activities and tickets",c2d:"Tours, attraction passes and airport transfers.",c2l:"Browse activities",
c3:"Transport",c3d:"Flights, buses and trains.",c3l:"Search tickets",
note:"Links in this section are affiliate links. If you book through them, we may earn a commission at no extra cost to you.",
foot:"Trip Together – plan trips with friends. Free, no sign-up.",
title_home:"Trip Together – Where to go? Let friends decide",desc_home:"Drop pins, let friends vote, plan each day and split costs on one page. No sign-up needed.",
title_how:"How it works – Trip Together",desc_how:"Vote on places, plan each day and split costs in three simple steps.",
title_book:"Book your trip – Trip Together",desc_book:"Compare stays, activities and transport for your trip."};
var page=document.body.getAttribute("data-page")||"home";
var th={},els=document.querySelectorAll("[data-t]"),
inp=document.querySelector("[data-tp]"),svg=document.querySelector("[data-ta]"),
meta=document.querySelector('meta[name="description"]'),btn=document.getElementById("lang");
els.forEach(function(e){th[e.getAttribute("data-t")]=e.innerHTML});
if(inp)th.ph=inp.placeholder;
if(svg)th.aria=svg.getAttribute("aria-label");
th.title=document.title;th.desc=meta.content;
function apply(l){
 var d=l==="en"?en:th,en_=l==="en";
 els.forEach(function(e){e.innerHTML=d[e.getAttribute("data-t")]});
 if(inp)inp.placeholder=d.ph;
 if(svg)svg.setAttribute("aria-label",d.aria);
 document.title=en_?en["title_"+page]:th.title;
 meta.content=en_?en["desc_"+page]:th.desc;
 document.documentElement.lang=l;
 btn.textContent=en_?"TH":"EN";
 btn.setAttribute("aria-label",en_?"เปลี่ยนเป็นภาษาไทย":"Switch to English");
 try{localStorage.setItem("lang",l)}catch(x){}
}
btn.addEventListener("click",function(){apply(document.documentElement.lang==="en"?"th":"en")});
var saved=null;try{saved=localStorage.getItem("lang")}catch(x){}
if(saved==="en")apply("en");
})();
(function(){
var m=document.getElementById("menu"),mt=document.getElementById("mt");
if(!m)return;
function set(o){m.classList.toggle("open",o);mt.setAttribute("aria-expanded",o?"true":"false")}
mt.addEventListener("click",function(e){e.stopPropagation();set(!m.classList.contains("open"))});
document.addEventListener("click",function(e){if(!m.contains(e.target))set(false)});
document.addEventListener("keydown",function(e){if(e.key==="Escape"){set(false);mt.focus()}});
})();
