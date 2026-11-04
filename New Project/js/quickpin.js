/* quickpin.js
   1) แผนที่ดูได้เฉพาะในประเทศไทย (ล็อกขอบเขต + ปักหมุดนอกไทยไม่ได้)
   2) แสดงที่ท่องเที่ยวเด่นในไทย เล็กใหญ่ตามระดับซูม กดที่ชื่อแล้วปักหมุดให้ทันที
   3) แตะตรงไหนบนแผนที่ก็ปักหมุดและตั้งชื่อให้เอง ตามสเกลที่ซูมอยู่
        ซูมออก = ชื่อจังหวัด/อำเภอ, ซูมเข้า = ย่าน/ถนน, ซูมใกล้สุด = ชื่อสถานที่ตรงจุด (ร้าน วัด ที่พัก ฯลฯ)
   ทำงานโดยดักแผนที่ Leaflet ตอนถูกสร้าง แล้วเติม #pn และกด #padd แทนผู้ใช้
   ต้องโหลดหลัง leaflet.js และก่อน ui.js / init.js
   ชื่อจากพิกัดใช้ Nominatim (OpenStreetMap) ไม่ต้องมีคีย์ */
(function () {
  "use strict";
  var map = null, timer = null, busy = 0, skip = false, poiGroup = null, poiMarkers = [];
  var $ = function (id) { return document.getElementById(id); };

  /* ขอบเขตประเทศไทย (ใต้สุด-เหนือสุด, ตะวันตกสุด-ตะวันออกสุด) */
  var TH = [[5.5, 97.3], [20.6, 105.7]];

  /* ที่ท่องเที่ยวเด่น: [ชื่อ, lat, lng, ระดับ]  ระดับ 1 = เห็นตั้งแต่ซูมไกล, 2 = ซูมกลาง, 3 = ซูมใกล้ */
  var SPOTS = [
    ["กรุงเทพฯ (พระบรมมหาราชวัง)", 13.7500, 100.4913, 1],
    ["เชียงใหม่ (ดอยสุเทพ)", 18.8048, 98.9217, 1],
    ["ภูเก็ต (หาดป่าตอง)", 7.8961, 98.2965, 1],
    ["กระบี่ (อ่าวนาง)", 8.0310, 98.8239, 1],
    ["พัทยา", 12.9276, 100.8771, 1],
    ["อยุธยา (วัดมหาธาตุ)", 14.3563, 100.5677, 1],
    ["สุโขทัย (อุทยานประวัติศาสตร์)", 17.0178, 99.7036, 1],
    ["เกาะสมุย (หาดเฉวง)", 9.5320, 100.0610, 1],
    ["เชียงราย (วัดร่องขุ่น)", 19.8239, 99.7633, 1],
    ["กาญจนบุรี (สะพานข้ามแม่น้ำแคว)", 14.0405, 99.5036, 1],
    ["หัวหิน", 12.5684, 99.9577, 1],
    ["ปาย", 19.3583, 98.4410, 1],
    ["เกาะพีพี", 7.7407, 98.7784, 2],
    ["เกาะเต่า", 10.0956, 99.8403, 2],
    ["เกาะพะงัน", 9.7500, 100.0330, 2],
    ["เกาะช้าง", 12.0500, 102.3300, 2],
    ["เกาะเสม็ด", 12.5646, 101.4530, 2],
    ["เกาะหลีเป๊ะ", 6.4850, 99.3040, 2],
    ["เขาใหญ่", 14.4300, 101.3700, 2],
    ["ดอยอินทนนท์", 18.5883, 98.4867, 2],
    ["แม่ฮ่องสอน", 19.3010, 97.9680, 2],
    ["น่าน", 18.7756, 100.7730, 2],
    ["ลำปาง (วัดพระธาตุลำปางหลวง)", 18.2290, 99.3810, 2],
    ["พิษณุโลก (วัดพระศรีรัตนมหาธาตุ)", 16.8211, 100.2658, 2],
    ["นครราชสีมา (อนุสาวรีย์ท้าวสุรนารี)", 14.9738, 102.0836, 2],
    ["หนองคาย", 17.8783, 102.7420, 2],
    ["สุราษฎร์ธานี (เขื่อนเชี่ยวหลาน/เขาสก)", 8.9100, 98.5330, 2],
    ["พังงา (อ่าวพังงา)", 8.2740, 98.5010, 2],
    ["หาดใหญ่", 7.0086, 100.4747, 2],
    ["นครศรีธรรมราช (วัดพระมหาธาตุ)", 8.4108, 99.9628, 2],
    ["เชียงราย (สามเหลี่ยมทองคำ)", 20.3519, 100.0833, 3],
    ["ลำพูน (วัดพระธาตุหริภุญชัย)", 18.5748, 99.0090, 3],
    ["ลพบุรี (พระปรางค์สามยอด)", 14.8004, 100.6150, 3],
    ["นครปฐม (พระปฐมเจดีย์)", 13.8197, 100.0590, 3],
    ["ราชบุรี (ตลาดน้ำดำเนินสะดวก)", 13.5190, 99.9560, 3],
    ["สมุทรสงคราม (ตลาดร่มหุบ)", 13.4083, 99.9982, 3],
    ["เพชรบุรี (พระนครคีรี)", 13.1578, 99.9486, 3],
    ["บุรีรัมย์ (ปราสาทพนมรุ้ง)", 14.5330, 102.9410, 3],
    ["พิมาย (ปราสาทหินพิมาย)", 15.2200, 102.4940, 3],
    ["เลย (ภูกระดึง)", 16.8800, 101.7800, 3],
    ["จันทบุรี", 12.6100, 102.1040, 3],
    ["เกาะกูด", 11.6500, 102.5500, 3]
  ];
  var MINZ = { 1: 5, 2: 7, 3: 9 };
  var touched = false;

  function onReady(fn) {
    if (document.readyState === "loading") { document.addEventListener("DOMContentLoaded", fn); }
    else { fn(); }
  }

  if (window.L && L.Map && L.Map.addInitHook) {
    L.Map.addInitHook(function () {
      if (map) { return; }
      map = this;
      lockToThailand();
      onReady(attach);
    });
  }

  /* สำรอง: ถ้าไม่ได้ดักตอนสร้างแผนที่ (เช่นโหลดสคริปต์ช้ากว่า) ให้หาแผนที่จากตัวแปรของหน้า */
  (function findLater() {
    var tries = 0, iv = setInterval(function () {
      if (map || ++tries > 50 || !window.L) { clearInterval(iv); return; }
      for (var k in window) {
        try {
          if (window[k] instanceof L.Map) {
            map = window[k]; clearInterval(iv); lockToThailand(); onReady(attach); return;
          }
        } catch (e) { /* ข้ามตัวแปรที่อ่านไม่ได้ */ }
      }
    }, 200);
  })();

  function overview() {
    map.fitBounds(TH, { padding: [8, 8] });
    refreshSpots();
  }

  function lockToThailand() {
    var b = L.latLngBounds(TH);
    setLock(b);
  }

  /* ล็อกให้ดูได้เฉพาะกรอบประเทศไทย และซูมออกได้ไม่เกินขนาดที่เห็นทั้งประเทศพอดี */
  function setLock(b) {
    map.options.maxBoundsViscosity = 1.0;
    map.setMaxBounds(b.pad(0.02));
    fitMin();
  }

  function fitMin() {
    var sz = map.getSize();
    if (!sz.x || !sz.y) { return; }
    var b = map.options.maxBounds || L.latLngBounds(TH);
    var fit = map.getBoundsZoom(b, false);
    if (!isFinite(fit)) { return; }
    /* ซูมออกได้อีกหนึ่งระดับจากขนาดที่เห็นทั้งประเทศพอดี ปุ่ม − จึงไม่ค้าง และซูมเข้าได้ปกติ */
    var z = Math.max(4, fit - 1);
    map.setMinZoom(z);
    if (map.getZoom() < z) { map.setZoom(z); }
  }

  function say(text, kind) {
    var st = $("qpst");
    if (!st) { return; }
    st.textContent = text || "";
    st.className = "qp-st" + (kind ? " " + kind : "");
  }

  function getJSON(url) {
    var ctl = ("AbortController" in window) ? new AbortController() : null;
    var t = setTimeout(function () { if (ctl) { ctl.abort(); } }, 6000);
    return fetch(url, { headers: { "Accept": "application/json" }, signal: ctl ? ctl.signal : undefined })
      .then(function (r) { clearTimeout(t); if (!r.ok) { throw new Error("http " + r.status); } return r.json(); });
  }

  function addPin(name) {
    var pn = $("pn"), btn = $("padd");
    if (!pn || !btn) { return false; }
    pn.value = name;
    btn.click();
    return true;
  }

  /* ให้โค้ดเดิมจำจุดนี้ก่อน (เหมือนผู้ใช้แตะที่จุดนั้น) แล้วปักหมุดพร้อมชื่อ */
  function pinAt(ll, name) {
    skip = true;
    try {
      map.fire("click", { latlng: ll, layerPoint: map.latLngToLayerPoint(ll), containerPoint: map.latLngToContainerPoint(ll) });
    } finally { skip = false; }
    return addPin(name);
  }

  function inThailand(ll) {
    return L.latLngBounds(TH).contains(ll);
  }

  function coordName(ll) {
    return "จุดที่ปัก " + ll.lat.toFixed(4) + ", " + ll.lng.toFixed(4);
  }

  /* ชื่อสถานที่จริง ใช้เมื่อจุดที่แตะอยู่ใกล้ (ประมาณ 45 พิกเซลบนหน้าจอ) */
  function poiName(j, ll) {
    var nm = j.name || (j.namedetails && (j.namedetails["name:th"] || j.namedetails.name)) || "";
    if (!nm) { return ""; }
    var lat = parseFloat(j.lat), lon = parseFloat(j.lon);
    if (isNaN(lat) || isNaN(lon)) { return nm; }
    var mpp = 156543.03 * Math.cos(ll.lat * Math.PI / 180) / Math.pow(2, map.getZoom());
    return ll.distanceTo(L.latLng(lat, lon)) <= Math.max(30, 45 * mpp) ? nm : "";
  }

  /* ตั้งชื่อตามสเกล: ซูมออก = จังหวัด/อำเภอ, ซูมกลาง = ย่าน, ซูมเข้า = ถนน + ย่าน */
  function placeName(j, ll) {
    if (!j || j.error) { return coordName(ll); }
    var p = poiName(j, ll);
    if (p) { return p; }
    var a = j.address || {}, z = map.getZoom();
    if (z <= 10) {
      var b = a.city || a.town || a.municipality || a.county || a.state;
      if (b) { return b; }
    } else if (z <= 14) {
      var m = a.suburb || a.village || a.town || a.city_district || a.neighbourhood || a.city || a.county;
      if (m) { return m; }
    }
    var road = a.road || a.pedestrian || a.path || "";
    var area = a.suburb || a.neighbourhood || a.quarter || a.village || a.town || a.city_district || a.city || a.county || "";
    if (road && area) { return road + ", " + area; }
    if (road || area) { return road || area; }
    var dn = String(j.display_name || "").split(",").slice(0, 2).join(",").trim();
    return dn || coordName(ll);
  }

  function isTH(j) {
    var cc = j && j.address && j.address.country_code;
    return !cc || cc === "th";
  }

  function reverse(ll, zoom, layer) {
    return getJSON("https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&namedetails=1" +
      "&accept-language=th,en&zoom=" + zoom + (layer ? "&layer=" + layer : "") + "&lat=" + ll.lat + "&lon=" + ll.lng);
  }

  function resolve(ll) {
    if (!inThailand(ll) || !onLand(ll)) { say("ปักหมุดได้เฉพาะบนพื้นที่แผ่นดินในประเทศไทย", "warn"); return; }
    var id = ++busy, z = map.getZoom();
    say("กำลังตั้งชื่อหมุด…", "wait");
    /* ซูมใกล้: ลองหาสถานที่ที่มีชื่อตรงจุดก่อน (ร้าน วัด ที่พัก ฯลฯ) */
    var first = z >= 15
      ? reverse(ll, 18, "poi").then(function (j) { return { j: j, nm: isTH(j) ? poiName(j, ll) : "" }; }, function () { return { j: null, nm: "" }; })
      : Promise.resolve({ j: null, nm: "" });
    first.then(function (r) {
      if (r.nm) { return r.nm; }
      return reverse(ll, Math.max(3, Math.min(18, z))).then(function (j) {
        if (j && j.error) { return undefined; }
        return isTH(j) ? placeName(j, ll) : null;
      }, function () { return coordName(ll); });
    }).then(function (name) {
      if (id !== busy) { return; }
      if (name === undefined) { say("จุดนี้ไม่ใช่พื้นที่แผ่นดิน ปักหมุดได้เฉพาะบนแผ่นดินไทย", "warn"); return; }
      if (name === null) { say("จุดนี้อยู่นอกประเทศไทย ปักหมุดได้เฉพาะในไทย", "warn"); return; }
      if (addPin(name)) { say("ปักหมุด “" + name + "” แล้ว", "ok"); }
      else { say("ปักหมุดไม่สำเร็จ ลองแตะอีกครั้ง", "warn"); }
    });
  }

  /* ---------- ที่ท่องเที่ยวเด่น ---------- */
  function buildSpots() {
    poiGroup = L.layerGroup();
    SPOTS.forEach(function (s) {
      var ll = L.latLng(s[1], s[2]);
      var icon = L.divIcon({
        className: "qp-poi t" + s[3],
        html: "<i></i><span>" + s[0] + "</span>",
        iconSize: null, iconAnchor: [8, 8]
      });
      var mk = L.marker(ll, { icon: icon, title: "กดเพื่อปักหมุด " + s[0], keyboard: true, riseOnHover: true });
      mk.on("click", function () {
        var ok = pinAt(ll, s[0]);
        say(ok ? "ปักหมุด “" + s[0] + "” แล้ว" : "ปักหมุดไม่สำเร็จ ลองอีกครั้ง", ok ? "ok" : "warn");
      });
      poiMarkers.push({ mk: mk, z: MINZ[s[3]] });
    });
    poiGroup.addTo(map);
    refreshSpots();
  }

  /* ซูมไกลเห็นแค่แห่งหลัก ซูมใกล้เห็นเพิ่มขึ้น */
  function refreshSpots() {
    if (!poiGroup) { return; }
    var sw = $("qppoi"), on = !sw || sw.checked, z = map.getZoom();
    poiMarkers.forEach(function (o) {
      var show = on && z >= o.z;
      var has = poiGroup.hasLayer(o.mk);
      if (show && !has) { poiGroup.addLayer(o.mk); }
      if (!show && has) { poiGroup.removeLayer(o.mk); }
    });
  }


  /* ---------- เหลือเฉพาะแผ่นดินไทย: ถมทะเลและประเทศอื่นด้วยสีพื้นหลังทึบ + ใช้เช็กว่าจุดที่แตะเป็นแผ่นดินไทย ---------- */
  var BLANK = "#f1efe9";
  var WORLD_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json";
  var TOPO_URL = "https://cdn.jsdelivr.net/npm/topojson-client@3/dist/topojson-client.min.js";
  var landRings = [], landDiscs = [], landReady = false;

  function loadScript(src) {
    return new Promise(function (ok, no) {
      if (window.topojson) { ok(); return; }
      var s = document.createElement("script");
      s.src = src; s.onload = ok; s.onerror = no;
      document.head.appendChild(s);
    });
  }

  function pip(ring, lng, lat) {
    var inside = false, i, k;
    for (i = 0, k = ring.length - 1; i < ring.length; k = i++) {
      var xi = ring[i][0], yi = ring[i][1], xk = ring[k][0], yk = ring[k][1];
      if (((yi > lat) !== (yk > lat)) && (lng < (xk - xi) * (lat - yi) / (yk - yi) + xi)) { inside = !inside; }
    }
    return inside;
  }

  function hitLand(ll) {
    var i;
    for (i = 0; i < landRings.length; i++) { if (pip(landRings[i], ll.lng, ll.lat)) { return true; } }
    for (i = 0; i < landDiscs.length; i++) { if (ll.distanceTo(landDiscs[i].c) <= landDiscs[i].r) { return true; } }
    return false;
  }

  /* แตะใกล้ชายฝั่งเล็กน้อยก็นับ (ข้อมูลขอบเขตหยาบกว่าแผนที่จริงเล็กน้อย) */
  function onLand(ll) {
    if (!landReady) { return true; }
    if (hitLand(ll)) { return true; }
    var d = 0.012, o = [[d, 0], [-d, 0], [0, d], [0, -d]];
    for (var i = 0; i < o.length; i++) { if (hitLand(L.latLng(ll.lat + o[i][0], ll.lng + o[i][1]))) { return true; } }
    return false;
  }

  function disc(c, rKm) {
    var pts = [], dLat = rKm / 111, dLng = rKm / (111 * Math.cos(c.lat * Math.PI / 180));
    for (var a = 0; a < 24; a++) {
      var t = a * Math.PI / 12;
      pts.push([c.lat + dLat * Math.sin(t), c.lng + dLng * Math.cos(t)]);
    }
    return pts;
  }

  function maskOutside() {
    if (!map.getPane("qpmask")) {
      var p = map.createPane("qpmask");
      p.style.zIndex = 350;
    }
    Promise.all([loadScript(TOPO_URL), fetch(WORLD_URL).then(function (r) { if (!r.ok) { throw new Error("world"); } return r.json(); })])
      .then(function (res) {
        var topo = res[1], g = null;
        topo.objects.countries.geometries.forEach(function (x) { if (String(x.id) === "764") { g = x; } });
        if (!g) { throw new Error("no th"); }
        var f = topojson.feature(topo, g), geom = f.geometry;
        var polys = geom.type === "Polygon" ? [geom.coordinates] : geom.coordinates;
        landRings = polys.map(function (pl) { return pl[0]; });          /* [lng,lat] */
        var holes = landRings.map(function (r) { return r.map(function (c) { return [c[1], c[0]]; }); });
        /* เกาะท่องเที่ยวที่ข้อมูลหยาบไม่มี: เปิดเป็นวงกลมเล็ก ๆ ให้เห็นและปักได้ */
        SPOTS.forEach(function (s) {
          var c = L.latLng(s[1], s[2]);
          if (s[0].indexOf("เกาะ") === 0 && !hitLand(c)) {
            landDiscs.push({ c: c, r: 6000 });
            holes.push(disc(c, 6));
          }
        });
        var world = [[-85, -179], [-85, 179], [85, 179], [85, -179]];
        var blocker = L.polygon([world].concat(holes), {
          pane: "qpmask", renderer: L.svg({ pane: "qpmask" }), interactive: true, bubblingMouseEvents: false,
          className: "qp-blocked", stroke: false, fillColor: BLANK, fillOpacity: 1, fillRule: "evenodd"
        }).addTo(map);
        /* คลิกบนพื้นที่ที่ซ่อนไว้ไม่ถึงแผนที่ จึงปักหมุดไม่ได้ (โค้ดเดิมก็ไม่ได้รับคลิก) */
        blocker.on("click", function () { say("พื้นที่นี้ปักหมุดไม่ได้ ปักได้เฉพาะบนแผ่นดินไทย", "warn"); });
        /* ล็อกกรอบแผนที่ตามขอบเขตจริงของประเทศไทย */
        var real = L.latLngBounds([]);
        holes.forEach(function (h) { h.forEach(function (c) { real.extend(c); }); });
        if (real.isValid()) { setLock(real); }
        L.geoJSON(f, { pane: "qpmask", interactive: false, style: function () { return { fill: false, color: "#f26b3a", weight: 2, opacity: 0.85 }; } }).addTo(map);
        landReady = true;
        say("แสดงเฉพาะแผ่นดินประเทศไทย ปักหมุดได้เฉพาะบนแผ่นดินไทย", "ok");
      })
      .catch(function () { say("โหลดเส้นพรมแดนไม่ได้ (ทะเลและประเทศอื่นจึงยังไม่ถูกซ่อน)", "warn"); });
  }

  /* ---------- ภาพคมขึ้น + ปุ่มเปลี่ยนสไตล์แผนที่ ---------- */
  var styles = [], styleIdx = 0;

  function sharpenTiles() {
    var hi = (window.devicePixelRatio || 1) >= 1.5, base = [];
    try {
      map.eachLayer(function (l) { if (l instanceof L.TileLayer && l._url) { base.push(l); } });
      base.forEach(function (l, i) {
        if (!hi || l.options.detectRetina) { if (i === 0) { styles.push({ name: "แผนที่ถนน", layer: l }); } return; }
        var nl = L.tileLayer(l._url, L.Util.extend({}, l.options, { detectRetina: true }));
        map.removeLayer(l);
        nl.addTo(map);
        nl.bringToBack();
        if (i === 0) { styles.push({ name: "แผนที่ถนน", layer: nl }); }
      });
    } catch (e) { /* ใช้แผนที่เดิมต่อ */ }
    styles.push({ name: "แผนที่ OSM (ตัวหนังสือคมชัด)", layer: L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, detectRetina: hi, attribution: "© OpenStreetMap" }) });
    styles.push({ name: "ภาพดาวเทียม", layer: L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", { maxZoom: 19, maxNativeZoom: 18, detectRetina: false, attribution: "Tiles © Esri" }) });
    var btn = $("qpstyle");
    if (!btn) { return; }
    function label() { btn.textContent = "สไตล์: " + styles[styleIdx].name; }
    label();
    btn.addEventListener("click", function () {
      styles.forEach(function (s) { if (map.hasLayer(s.layer)) { map.removeLayer(s.layer); } });
      styleIdx = (styleIdx + 1) % styles.length;
      styles[styleIdx].layer.addTo(map);
      styles[styleIdx].layer.bringToBack();
      label();
    });
  }

  /* ---------- ขยายแผนที่ ---------- */
  function bigToggle() {
    var el = $("map"), btn = $("qpbig");
    if (!el || !btn) { return; }
    btn.addEventListener("click", function () {
      var on = el.classList.toggle("qp-big");
      btn.textContent = on ? "ย่อแผนที่" : "ขยายแผนที่";
      setTimeout(function () { map.invalidateSize(); if (on) { el.scrollIntoView({ behavior: "smooth", block: "start" }); } }, 60);
    });
  }

  function attach() {
    map.on("click", function (e) {
      var sw = $("qpauto");
      if (skip || !sw || !sw.checked) { return; }
      var ll = e.latlng;
      clearTimeout(timer);
      /* รอสักครู่: ถ้าเป็นดับเบิลคลิกเพื่อซูมจะไม่ปักหมุด และให้โค้ดเดิมจำจุดที่แตะก่อน */
      timer = setTimeout(function () { resolve(ll); }, 320);
    });
    map.on("dblclick zoomstart", function () { clearTimeout(timer); });
    map.on("zoomend", refreshSpots);
    map.on("resize", fitMin);
    var tg = $("qppoi");
    if (tg) { tg.addEventListener("change", refreshSpots); }
    buildSpots();
    /* เอาไอคอนธงออกจากแถบอ้างอิงมุมขวาล่าง (ยังคงลิงก์ Leaflet และเครดิตแผนที่ไว้) */
    function noFlag() {
      if (map.attributionControl) { map.attributionControl.setPrefix('<a href="https://leafletjs.com" title="Leaflet" target="_blank" rel="noopener">Leaflet</a>'); }
    }
    noFlag();
    setTimeout(noFlag, 1000);
    maskOutside();
    sharpenTiles();
    bigToggle();
    map.once("mousedown touchstart wheel keydown", function () { touched = true; });
    var home = $("qphome");
    if (home) { home.addEventListener("click", function () { overview(); say("แสดงที่เที่ยวเด่นทั่วประเทศไทย", "ok"); }); }
    /* เปิดหน้ามาให้เห็นที่เที่ยวเด่นทั้งประเทศทันที (ถ้ายังไม่ได้ซูมเข้าไปเอง) */
    function firstView() {
      if (touched) { return; }
      if (map.getZoom() > 9 || !L.latLngBounds(TH).contains(map.getCenter())) { overview(); }
      refreshSpots();
      var n = poiGroup ? poiGroup.getLayers().length : 0;
      if (n) { say("แสดงที่เที่ยวเด่น " + n + " แห่ง กดที่จุดเพื่อปักหมุด หรือซูมเข้าไปดูเพิ่ม", "ok"); }
    }
    firstView();
    setTimeout(firstView, 800);
    setTimeout(firstView, 2000);
  }
})();
