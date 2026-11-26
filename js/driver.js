const KEY='fooddispatch_driver_v1', SPEED=20; let SCALE=window.FDStore?60000/FDStore.speed():3000; // ms per simulated minute: follows the restaurant's speed setting
const now=()=>Date.now();
const fmt=t=>new Date(t).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
const rad=d=>d*Math.PI/180;
function hav(a,b,c,d){const R=6371,x=rad(c-a),y=rad(d-b),h=Math.sin(x/2)**2+Math.cos(rad(a))*Math.cos(rad(c))*Math.sin(y/2)**2;return 2*R*Math.asin(Math.sqrt(h))}
const eta=(km,prep=0)=>Math.max(1,Math.ceil(km/SPEED*60+prep));
function seed(){
  const o=(id,r,rl,rg,c,it,tot,ar,dl,dg,st,pay)=>({id,rest:r,rLat:rl,rLng:rg,cust:c,items:it,total:tot,area:ar,dLat:dl,dLng:dg,status:st,pay,mine:false,ev:[{s:'Placed',at:now()-9e5}]});
  return {prof:{name:'Ravi Kumar',phone:'9876543210',vehicle:'Motorbike',plate:'KA 01 AB 1234',zone:'Indiranagar & Koramangala'},drv:{lat:12.9716,lng:77.5946},active:null,orders:[
   o('FD-1042','Dosa Darbar',12.9750,77.6010,'Ananya R.','2 × Masala dosa, 1 × Filter coffee',420,'Indiranagar, Block C',12.9784,77.6408,'Ready',68),
   o('FD-1043','Biryani Bay',12.9611,77.6387,'Karthik S.','1 × Chicken biryani, Raita',360,'HAL 2nd Stage',12.9719,77.6412,'Ready',54),
   o('FD-1044','Pizza Pagoda',12.9352,77.6245,'Meera N.','Large paneer pizza, Garlic bread',640,'Koramangala 5th Block',12.9279,77.6271,'Ready',72),
   o('FD-1045','Green Bowl',12.9698,77.7499,'Rohit P.','Quinoa salad, Cold-pressed juice',390,'Whitefield Main Rd',12.9857,77.7480,'Preparing',60),
   o('FD-1046','Chai & Chaat',12.9304,77.5834,'Divya K.','Pani puri, Masala chai ×2',210,'Jayanagar 4th Block',12.9250,77.5938,'Preparing',40),
   {...{id:'FD-1031',rest:'Burger Barn',cust:'Sana M.',area:'MG Road',total:480,pay:58,status:'Delivered',mine:true,items:'2 × Burger',ev:[{s:'Delivered',at:now()-864e5}]}},
   {...{id:'FD-1029',rest:'Dosa Darbar',cust:'Arjun V.',area:'Domlur',total:300,pay:44,status:'Delivered',mine:true,items:'Set dosa',ev:[{s:'Delivered',at:now()-1728e5}]}}
  ]}}
let S, tab='q', q='', f='All', storeErr=false;
const avail=()=>S.avail!==false;
function toggleAvail(){if(act())return toast('Finish your current delivery before going unavailable.',1);S.avail=!avail();save();render();toast(avail()?'You are available. Orders can be accepted.':'You are unavailable. Order acceptance is paused.')}
function load(){try{S=JSON.parse(localStorage.getItem(KEY))}catch(e){S=null;storeErr=true}if(!S||!S.orders)S=seed();if(!S.prof)S.prof=seed().prof}
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const RA={'Dosa Darbar':'12, 100 Feet Road, Indiranagar','Biryani Bay':'48, HAL 2nd Stage Main Road','Pizza Pagoda':'5th Block, Koramangala Industrial Layout','Green Bowl':'22, ITPL Main Road, Whitefield','Chai & Chaat':'4th Block, Jayanagar Shopping Complex'};
const CP={'Ananya R.':'+919800000001','Karthik S.':'+919800000002','Meera N.':'+919800000003','Rohit P.':'+919800000004','Divya K.':'+919800000005'};
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){storeErr=true;toast('Data could not be saved. Your current order stays on screen.',1)}}
function toast(m,e){document.querySelectorAll('.toast').forEach(t=>t.remove());const t=document.createElement('div');t.className='toast'+(e?' err':'');t.setAttribute('role',e?'alert':'status');t.textContent=m;document.body.appendChild(t);setTimeout(()=>t.remove(),3200)}
const act=()=>S.orders.find(o=>o.id===S.active);
const byId=id=>S.orders.find(o=>o.id===id);
// StatusEngine: drivers may only do Picked up and Delivered
function allowed(o,next){
  if(o.status==='Ready'&&o.mine&&next==='Picked up'){if(o.accAt&&now()<o.accAt+o.d1)return{ok:false,msg:'You have not reached the restaurant yet.'};return{ok:true}}
  if(o.status==='Picked up'&&next==='Delivered'){
    if(now()<o.startedAt+o.dur)return{ok:false,msg:'Not yet. Delivered unlocks when the estimated time ends.'};
    return{ok:true}}
  return{ok:false,msg:'Only the assigned driver can change this step, and only in order.'}}
function ev(o,s){o.status=s;o.ev.push({s,at:now()})}
function accept(id){
  if(!avail())return toast('You are unavailable. Turn availability on to accept orders.',1);
  if(S.active)return toast('Finish your current delivery before accepting another.',1);
  const o=byId(id);if(!o||o.status!=='Ready')return toast('This order is not ready yet.',1);
  if(o.shared)return acceptShared(o);
  o.mine=true;S.active=id;o.from={lat:S.drv.lat,lng:S.drv.lng};o.accAt=now();o.km1=hav(o.from.lat,o.from.lng,o.rLat,o.rLng);o.d1=eta(o.km1)*SCALE;o.ev.push({s:'Accepted by you',at:now()});save();tab='a';render();toast('Order accepted. Head to '+o.rest+'.')}
function pickup(){const o=act(),r=allowed(o,'Picked up');if(!r.ok)return toast(r.msg,1);
  if(o.shared){const x=FDStore.advance(o.id,'Picked up','driver');if(x.ok&&x.pending){o.pkWait=true;save();render();return toast('Pickup confirmed. Waiting for the restaurant to hand the order over.')}if(!x.ok&&!(x.order&&x.order.status==='Picked up'))return toast(x.msg,1)}
  o.startedAt=now();o.otp=o.shared&&o.otp?o.otp:String(Math.floor(1000+Math.random()*9000));o.tries=0;const km=hav(o.rLat,o.rLng,o.dLat,o.dLng);o.km=km;o.etaMin=eta(km);o.dur=o.etaMin*SCALE;
  S.drv={lat:o.rLat,lng:o.rLng};ev(o,'Picked up');save();render();toast('Picked up. Live location is now streaming.')}
function deliver(){const o=act(),r=allowed(o,'Delivered');if(!r.ok)return toast(r.msg,1);
  const v=(document.getElementById('otp')||{}).value||'';
  if(o.tries>=3)return toast('Too many wrong codes. Tap Resend code.',1);
  if(!/^\d{4}$/.test(v))return toast('Enter the 4-digit code from the customer.',1);
  if(v!==o.otp){o.tries=(o.tries||0)+1;save();render();return toast(o.tries>=3?'Wrong code. Delivery locked. Tap Resend code.':'Wrong code. '+(3-o.tries)+' tries left.',1)}
  if(o.shared){const x=FDStore.advance(o.id,'Delivered','driver');if(!x.ok)return toast(x.msg,1)}
  ev(o,'Delivered');S.drv={lat:o.dLat,lng:o.dLng};S.active=null;save();tab='h';render();toast('Delivered. You can now pick your next order.')}
function prog(o){return Math.min(1,(now()-o.startedAt)/o.dur)}
function pos(o){const p=prog(o),L=legPts(o,'deliver');if(L)return pathAt(L,p);return{lat:o.rLat+(o.dLat-o.rLat)*p,lng:o.rLng+(o.dLng-o.rLng)*p}}
function mapSvg(o,p){
  const la=[o.rLat,o.dLat],ln=[o.rLng,o.dLng],a=Math.min(...la),b=Math.max(...la),c=Math.min(...ln),d=Math.max(...ln);
  const X=g=>30+(g-c)/((d-c)||1e-4)*240,Y=g=>150-(g-a)/((b-a)||1e-4)*120;
  const dr=p?{x:X(p.lng),y:Y(p.lat)}:{x:X(o.rLng),y:Y(o.rLat)};
  return `<svg viewBox="0 0 300 180" role="img" aria-label="Map area with restaurant, customer and driver"><defs><pattern id="g" width="30" height="30" patternUnits="userSpaceOnUse"><path d="M30 0H0V30" fill="none" stroke="#E8D5C2"/></pattern></defs><rect width="300" height="180" fill="url(#g)"/><line x1="${X(o.rLng)}" y1="${Y(o.rLat)}" x2="${X(o.dLng)}" y2="${Y(o.dLat)}" stroke="#9A6A4B" stroke-width="3" stroke-dasharray="6 5"/><rect x="${X(o.rLng)-9}" y="${Y(o.rLat)-9}" width="18" height="18" rx="4" fill="#3B2316"/><text x="${X(o.rLng)}" y="${Y(o.rLat)+4}" font-size="10" text-anchor="middle" fill="#fff">R</text><circle cx="${X(o.dLng)}" cy="${Y(o.dLat)}" r="10" fill="#fff" stroke="#6F4630" stroke-width="3"/><text x="${X(o.dLng)}" y="${Y(o.dLat)+4}" font-size="10" text-anchor="middle" fill="#6F4630">C</text><circle cx="${dr.x}" cy="${dr.y}" r="8" fill="#C2410C" stroke="#fff" stroke-width="3"/></svg>`}
function mapSvg2(o,p){
  const pts=[[o.rLat,o.rLng],[o.dLat,o.dLng]];if(!p)pts.push([S.drv.lat,S.drv.lng]);
  const la=pts.map(x=>x[0]),ln=pts.map(x=>x[1]),a=Math.min(...la),b=Math.max(...la),c=Math.min(...ln),d=Math.max(...ln);
  const X=g=>30+(g-c)/((d-c)||1e-4)*240,Y=g=>150-(g-a)/((b-a)||1e-4)*120;
  const dp=p||S.drv,dx=X(dp.lng),dy=Y(dp.lat),rx=X(o.rLng),ry=Y(o.rLat),cx=X(o.dLng),cy=Y(o.dLat);
  const leg=p?'':`<line x1="${dx}" y1="${dy}" x2="${rx}" y2="${ry}" stroke="#C2410C" stroke-width="4"/>`;
  return `<svg viewBox="0 0 300 180" role="img" aria-label="Map with your position, the restaurant and the customer"><defs><pattern id="g" width="30" height="30" patternUnits="userSpaceOnUse"><path d="M30 0H0V30" fill="none" stroke="#E8D5C2"/></pattern></defs><rect width="300" height="180" fill="url(#g)"/><line x1="${rx}" y1="${ry}" x2="${cx}" y2="${cy}" stroke="#9A6A4B" stroke-width="3" stroke-dasharray="6 5"/>${leg}<rect x="${rx-10}" y="${ry-10}" width="20" height="20" rx="5" fill="#3B2316"/><text x="${rx}" y="${ry+4}" font-size="11" text-anchor="middle" fill="#fff">R</text><circle cx="${cx}" cy="${cy}" r="10" fill="#fff" stroke="#6F4630" stroke-width="3"/><text x="${cx}" y="${cy+4}" font-size="11" text-anchor="middle" fill="#6F4630">C</text><circle cx="${dx}" cy="${dy}" r="8" fill="#C2410C" stroke="#fff" stroke-width="3"/></svg>`}
function mapSvg3(o){
  if(!o.from){o.from={lat:S.drv.lat,lng:S.drv.lng};o.accAt=o.accAt||now();o.km1=hav(o.from.lat,o.from.lng,o.rLat,o.rLng);o.d1=eta(o.km1)*SCALE}
  const pk=o.status==='Picked up',f=o.from,RP=legPts(o,'pickup'),RD=legPts(o,'deliver'),pts=[[f.lat,f.lng],[o.rLat,o.rLng],[o.dLat,o.dLng],...(RP||[]),...(RD||[])];
  const la=pts.map(x=>x[0]),ln=pts.map(x=>x[1]),a=Math.min(...la),b=Math.max(...la),c=Math.min(...ln),d=Math.max(...ln);
  const X=g=>30+(g-c)/((d-c)||1e-4)*240,Y=g=>150-(g-a)/((b-a)||1e-4)*110;
  const F={x:X(f.lng),y:Y(f.lat)},R={x:X(o.rLng),y:Y(o.rLat)},C={x:X(o.dLng),y:Y(o.dLat)};
  const sd=o.id.split('').reduce((h,c)=>(h*31+c.charCodeAt(0))|0,7),rn=k=>{const v=Math.sin(sd+k*12.9898)*43758.5453;return v-Math.floor(v)};
  const el=(s,e,k)=>{const dx=e.x-s.x,dy=e.y-s.y,f1=.22+rn(k)*.2,f2=.58+rn(k+1)*.2,ym=.35+rn(k+2)*.3;return[s,{x:s.x+dx*f1,y:s.y},{x:s.x+dx*f1,y:s.y+dy*ym},{x:s.x+dx*f2,y:s.y+dy*ym},{x:s.x+dx*f2,y:e.y},e]};
  const at=(P,t)=>{const L=[];let tot=0;for(let i=1;i<P.length;i++){const l=Math.hypot(P[i].x-P[i-1].x,P[i].y-P[i-1].y);L.push(l);tot+=l}let s=t*(tot||1);for(let i=0;i<L.length;i++){if(s<=L[i]||i===L.length-1){const u=L[i]?Math.min(1,s/L[i]):0;return{x:P[i].x+(P[i+1].x-P[i].x)*u,y:P[i].y+(P[i+1].y-P[i].y)*u}}s-=L[i]}return P[P.length-1]};
  const P1=RP?RP.map(q=>({x:X(q[1]),y:Y(q[0])})):el(F,R,1),P2=RD?RD.map(q=>({x:X(q[1]),y:Y(q[0])})):el(R,C,5),t1=pk?1:Math.min(1,Math.max(0,(now()-o.accAt)/o.d1));
  const dg=pk?(RD?pathAt(RD,prog(o)):null):(RP?pathAt(RP,t1):null),D=dg?{x:X(dg.lng),y:Y(dg.lat)}:(pk?at(P2,prog(o)):at(P1,t1));
  const pl=(P,col,w,da)=>`<polyline points='${P.map(q=>q.x+','+q.y).join(' ')}' fill='none' stroke='${col}' stroke-width='${w}' stroke-linecap='round' stroke-linejoin='round'${da?` stroke-dasharray='${da}'`:''}/>`;
  const lab=(q,t)=>`<text x='${q.x}' y='${q.y+23}' font-size='10' font-weight='700' text-anchor='middle' fill='#3B2316' stroke='#fff' stroke-width='3' paint-order='stroke'>${t}</text>`;
  const road=pk?pl(P1,'#B9A594',4)+pl(P2,'#fff',9)+pl(P2,'#6F4630',5):pl(P2,'#fff',7)+pl(P2,'#9A6A4B',3,'6 6')+pl(P1,'#fff',9)+pl(P1,'#C2410C',5);
  const svg=`<svg viewBox='0 0 300 190' role='img' aria-label='${pk?'Route from the restaurant to the customer':'Route from you to the restaurant'}'><defs><pattern id='g' width='40' height='40' patternUnits='userSpaceOnUse'><rect width='40' height='40' fill='#F3E6D8'/><path d='M0 20H40M20 0V40' stroke='#fff' stroke-width='7'/></pattern></defs><rect width='300' height='190' fill='url(#g)'/><path d='M0 158 Q80 112 150 138 T300 96' fill='none' stroke='#CFE3EA' stroke-width='14'/><rect x='6' y='8' width='46' height='30' rx='8' fill='#DDE8C8'/><rect x='238' y='148' width='52' height='34' rx='8' fill='#DDE8C8'/><path d='M0 36 L300 132' stroke='#fff' stroke-width='5'/><path d='M60 0 L120 190' stroke='#fff' stroke-width='4'/>${road}<rect x='${R.x-10}' y='${R.y-10}' width='20' height='20' rx='5' fill='#3B2316'/><text x='${R.x}' y='${R.y+4}' font-size='11' text-anchor='middle' fill='#fff'>R</text>${lab(R,o.rest)}<circle cx='${C.x}' cy='${C.y}' r='10' fill='#fff' stroke='#6F4630' stroke-width='3'/><text x='${C.x}' y='${C.y+4}' font-size='11' text-anchor='middle' fill='#6F4630'>C</text>${lab(C,'Customer')}<circle class='pulse' cx='${D.x}' cy='${D.y}' r='8' fill='#C2410C'/><circle cx='${D.x}' cy='${D.y}' r='8' fill='#C2410C' stroke='#fff' stroke-width='3'/></svg>`;
  return{svg,km1:o.km1*(1-t1),arr:!pk&&now()>=o.accAt+o.d1,lat:a+(150-D.y)/110*(b-a),lng:c+(D.x-30)/240*(d-c)}}
// ---- Real Google Maps (optional): paste a Google Maps JavaScript API key here (Maps JavaScript + Directions APIs enabled)
const GMAPS_KEY=(window.FD_CONFIG&&FD_CONFIG.MAPS_KEY_DASHBOARD)||'';
let gm=null,gmEl=null,gmReady=false,gmMark=null,gmRend=null,gmPath=[],gmPhase='';
let osmOn=false,osmReady=false,osmWhy='',lm=null,osmEl=null,osmL={},osmPath=[],osmSk='',osmPhase='';
const mapLive=()=>!!(GMAPS_KEY&&gmReady)||osmReady;
/* Google unusable (key refused, blocked, offline, too slow, no key): use OpenStreetMap so the driver always gets a real map */
function useOsmMap(why){if(osmOn)return;osmOn=true;osmWhy=why;gmReady=false;console.info('[FoodDispatch] driver map: OpenStreetMap because',why);
  FDOsm.load(()=>{osmReady=true;render()},()=>{osmOn=false;osmReady=false;render()});render()}
function loadGM(){if(document.getElementById('gmjs'))return;
  if(!GMAPS_KEY){useOsmMap('no Google Maps key is set');return}
  window.__gmcb=()=>{if(osmOn)return;gmReady=true;render()};
  window.gm_authFailure=()=>{useOsmMap('Google refused the map key (check the key, billing, Maps JavaScript API and the allowed website list)')};
  const s=document.createElement('script');s.id='gmjs';s.async=true;s.src='https://maps.googleapis.com/maps/api/js?key='+encodeURIComponent(GMAPS_KEY)+'&callback=__gmcb';
  s.onerror=()=>useOsmMap('Google Maps could not be reached');document.head.appendChild(s);
  setTimeout(()=>{if(!gmReady&&!osmOn)useOsmMap('Google Maps did not respond')},9000)}
function updateMap(){
  const o=act(),ph=document.getElementById('gmap');if(!o||!ph)return;if(!gmReady){if(osmReady)osmUpdate(o);return}
  const pk=o.status==='Picked up';
  if(!gmEl){gmEl=document.createElement('div');gmEl.id='gmap';gmEl.style.cssText='width:100%;height:280px';ph.replaceWith(gmEl);gm=new google.maps.Map(gmEl,{center:{lat:o.rLat,lng:o.rLng},zoom:14,disableDefaultUI:true,zoomControl:true});gmMark=new google.maps.Marker({map:gm,zIndex:9,icon:{path:google.maps.SymbolPath.CIRCLE,scale:9,fillColor:'#C2410C',fillOpacity:1,strokeColor:'#fff',strokeWeight:3}});gmRend=new google.maps.DirectionsRenderer({map:gm})}
  if(ph.isConnected&&ph!==gmEl)ph.replaceWith(gmEl);
  const key=o.id+(pk?'P':'R'),SL=legPts(o,pk?'deliver':'pickup'),sk=SL?key+SL.length+SL[0]+SL[SL.length-1]:'';
  if(SL){if(gmSk!==sk){gmSk=sk;gmPhase=key;gmRend.setMap(null);gmLines.forEach(l=>l.setMap(null));gmPath=SL.map(p=>new google.maps.LatLng(p[0],p[1]));gmLines=[new google.maps.Polyline({map:gm,path:gmPath,strokeColor:pk?'#6F4630':'#C2410C',strokeWeight:6})];const bd=new google.maps.LatLngBounds();gmPath.forEach(p=>bd.extend(p));gm.fitBounds(bd);google.maps.event.trigger(gm,'resize')}gmTick(o);return}   // same route as the restaurant and customer pages
  if(gmPhase!==key){gmPhase=key;gmPath=[];const f=o.from||S.drv,org=pk?{lat:o.rLat,lng:o.rLng}:{lat:f.lat,lng:f.lng},dst=pk?{lat:o.dLat,lng:o.dLng}:{lat:o.rLat,lng:o.rLng};
    new google.maps.DirectionsService().route({origin:org,destination:dst,travelMode:'DRIVING'},(r,st)=>{if(st!=='OK'){gmRoutes(org,dst,pk,o);return}gmLines.forEach(l=>l.setMap(null));gmLines=[];gmRend.setMap(gm);
      gmRend.setOptions({polylineOptions:{strokeColor:pk?'#6F4630':'#C2410C',strokeWeight:6}});gmRend.setDirections(r);gmPath=r.routes[0].overview_path;google.maps.event.trigger(gm,'resize');gmTick(o)})}
  gmTick(o)}
let gmLines=[];

/* ---- OpenStreetMap (Leaflet) version of the driver map: same shared route, same driver dot ---- */
function osmRoute(pts,pk){if(osmL.line)lm.removeLayer(osmL.line);if(osmL.dst)lm.removeLayer(osmL.dst);osmPath=pts;
  osmL.line=L.polyline(pts,{color:pk?'#6F4630':'#C2410C',weight:6,lineCap:'round',lineJoin:'round'}).addTo(lm);
  const e=pts[pts.length-1];osmL.dst=L.circleMarker(e,{radius:8,color:'#3B2316',weight:3,fillColor:'#fff',fillOpacity:1}).addTo(lm);
  lm.invalidateSize();lm.fitBounds(pts,{padding:[30,30],maxZoom:16})}
function osmUpdate(o){const ph=document.getElementById('gmap');if(!ph||!window.L)return;const pk=o.status==='Picked up';
  if(!osmEl){osmEl=document.createElement('div');osmEl.id='gmap';osmEl.style.cssText='width:100%;height:280px';ph.replaceWith(osmEl);
    lm=L.map(osmEl).setView([o.rLat,o.rLng],14);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).addTo(lm);
    osmL.me=L.circleMarker([o.rLat,o.rLng],{radius:9,color:'#fff',weight:3,fillColor:'#C2410C',fillOpacity:1}).addTo(lm)}
  else if(ph.isConnected&&ph!==osmEl){ph.replaceWith(osmEl);lm.invalidateSize()}
  const key=o.id+(pk?'P':'R'),SL=legPts(o,pk?'deliver':'pickup'),sk=SL?key+SL.length+SL[0]+SL[SL.length-1]:'';
  if(SL){if(osmSk!==sk){osmSk=sk;osmPhase=key;osmRoute(SL,pk)}}
  else if(osmPhase!==key){osmPhase=key;osmSk='';const f=o.from||S.drv,org=pk?{lat:o.rLat,lng:o.rLng}:{lat:f.lat,lng:f.lng},dst=pk?{lat:o.dLat,lng:o.dLng}:{lat:o.rLat,lng:o.rLng};
    fetchLeg(org,dst).then(p=>{if(osmPhase===key&&!osmSk)osmRoute(p,pk)})}
  osmTick(o)}
function osmTick(o){const pk=o.status==='Picked up',L0=legPts(o,pk?'deliver':'pickup'),pts=L0||osmPath;if(!pts||pts.length<2||!osmL.me)return;
  const q=pathAt(pts,pk?prog(o):Math.min(1,Math.max(0,(now()-o.accAt)/(o.d1||1))));osmL.me.setLatLng([q.lat,q.lng])}
const osmNote=()=>osmReady&&!gmReady?`<p class="sub" style="margin:6px 2px;font-size:12px">Showing OpenStreetMap because ${esc(osmWhy)}.</p>`:'';
async function gmOsrm(org,dst,pk,o){try{const u='https://router.project-osrm.org/route/v1/driving/'+org.lng+','+org.lat+';'+dst.lng+','+dst.lat+'?overview=full&geometries=geojson';const j=await (await fetch(u)).json();const cs=j.routes[0].geometry.coordinates;gmRend.setMap(null);gmLines.forEach(l=>l.setMap(null));gmPath=cs.map(c=>new google.maps.LatLng(c[1],c[0]));gmLines=[new google.maps.Polyline({map:gm,path:gmPath,strokeColor:pk?'#6F4630':'#C2410C',strokeWeight:6})];const bd=new google.maps.LatLngBounds();gmPath.forEach(p=>bd.extend(p));gm.fitBounds(bd);google.maps.event.trigger(gm,'resize');gmTick(o)}catch(e){toast('Could not draw the road route. Check your internet connection and try again.',1)}}
async function gmRoutes(org,dst,pk,o){try{const {Route}=await google.maps.importLibrary('routes');const r=await Route.computeRoutes({origin:org,destination:dst,travelMode:'DRIVING',fields:['path','viewport']});const rt=r.routes[0];gmRend.setMap(null);gmLines.forEach(l=>l.setMap(null));gmPath=rt.path.map(p=>new google.maps.LatLng(p.lat,p.lng));gmLines=[new google.maps.Polyline({map:gm,path:gmPath,strokeColor:pk?'#6F4630':'#C2410C',strokeWeight:6})];if(rt.viewport)gm.fitBounds(rt.viewport);google.maps.event.trigger(gm,'resize');gmTick(o)}catch(e){gmOsrm(org,dst,pk,o)}}
function gmTick(o){if(!gmPath.length||!gmMark)return;{const k0=o.status==='Picked up',L0=legPts(o,k0?'deliver':'pickup');if(L0){gmMark.setPosition(pathAt(L0,k0?prog(o):Math.min(1,Math.max(0,(now()-o.accAt)/o.d1))));return}}const pk=o.status==='Picked up',t=pk?prog(o):Math.min(1,Math.max(0,(now()-o.accAt)/o.d1)),n=gmPath.length-1,i=Math.min(n,Math.floor(t*n)),a=gmPath[i],b=gmPath[Math.min(n,i+1)],u=t*n-i;gmMark.setPosition({lat:a.lat()+(b.lat()-a.lat())*u,lng:a.lng()+(b.lng()-a.lng())*u})}
function pView(){
  const P=S.prof,done=S.orders.filter(o=>o.status==='Delivered'&&o.mine),earn=done.reduce((s,o)=>s+o.pay,0);
  const st=(n,l)=>`<div style="flex:1;text-align:center"><b class="cap" style="font-size:26px;color:var(--cocoa)">${n}</b><br><span class="sub">${l}</span></div>`;
  return `<h1>Your <span class="kau">profile</span></h1><div class="card" style="display:flex;gap:14px;align-items:center"><div class="av" style="width:64px;height:64px;font-size:30px;flex:none">${esc(P.name.trim().charAt(0).toUpperCase())}</div><div><h3 class="rn">${esc(P.name)}</h3><p class="meta" style="margin:0">${esc(P.vehicle)} • ${esc(P.plate)}<br>Zone: ${esc(P.zone)}${P.email?'<br>'+esc(P.email):''}</p></div></div>
  <div class="card row">${st(done.length,'Deliveries')}${st('₹'+earn,'Earned')}${st('4.8','Rating')}</div>
  <h2>Edit <em>details</em></h2><div class="card"><div style="margin-bottom:10px"><label for="pn">Full name</label><input id="pn" value="${esc(P.name)}"></div><div style="margin-bottom:10px"><label for="pp">Phone (10 digits)</label><input id="pp" inputmode="numeric" value="${esc(P.phone)}"></div><div style="margin-bottom:10px"><label for="pv">Vehicle</label><select id="pv">${['Motorbike','Scooter','Bicycle'].map(v=>`<option ${v===P.vehicle?'selected':''}>${v}</option>`).join('')}</select></div><div style="margin-bottom:10px"><label for="pl">Vehicle number</label><input id="pl" value="${esc(P.plate)}"></div><div style="margin-bottom:14px"><label for="pz">Delivery zone</label><input id="pz" value="${esc(P.zone)}"></div><button class="btn" id="ps">Save profile</button></div>${window.FDSession&&FDSession.forRole('Delivery partner')?'<button class="btn alt" id="so">Sign out</button>':''}`}
function qView(){
  const a=act(),dr=S.drv;
  const list=S.orders.filter(o=>['Ready','Preparing'].includes(o.status)&&!(a&&o.id===a.id));
  let h=`<h1>Pick one, <span class="kau">deliver</span> it well</h1><p class="sub">Orders near you from any restaurant. You can carry one at a time.</p>`;
  if(a)h+=`<div class="note w" role="status">You are on a delivery (${a.id}). Finish it to unlock new orders. <a href="#" data-go="a" style="color:inherit;font-weight:700">Open my trip</a></div>`;
  h+=`<div class="card row" style="align-items:center"><div><b>${avail()?'You are available':'You are unavailable'}</b><p class="meta" style="margin:2px 0 0">${avail()?'Orders can be accepted.':'Orders are paused. Turn back on when ready.'}</p></div><button class="btn ${avail()?'alt':''}" id="av2" style="width:auto;padding:0 16px">${avail()?'Go unavailable':'Go available'}</button></div><h2>Orders <em>nearby</em></h2>`;
  if(!list.length)h+=`<div class="empty">No orders waiting. New ones appear here as kitchens finish preparing.</div>`;
  list.forEach(o=>{const d=hav(dr.lat,dr.lng,o.rLat,o.rLng),t=hav(o.rLat,o.rLng,o.dLat,o.dLng),rdy=o.status==='Ready';
    h+=`<article class="card ${rdy?'':'lock'}"><div class="row"><h3 class="rn">${o.rest}</h3><span class="pay">₹${o.pay}</span></div>
    <p class="meta">${o.id} • ${o.items}<br>Deliver to ${o.area}</p>
    <p class="meta"><b>${d.toFixed(1)} km</b> to restaurant • <b>${t.toFixed(1)} km</b> trip • about <b>${eta(t)} min</b> ride &nbsp;<span class="badge ${rdy?'ready':'prep'}">${rdy?'Ready':'Preparing'}</span></p>
    <button class="btn" data-acc="${o.id}" ${(!rdy||a||!avail())?'disabled':''}>${rdy?(a?'Finish current trip first':(avail()?'Accept order':'You are unavailable')):'Waiting for kitchen'}</button>${o.shared&&rdy&&!a?`<button class=\"btn alt\" data-dec=\"${o.id}\" style=\"margin-top:8px\">Decline</button>`:''}</article>`});
  return h}
function otpBlock(o){const lk=o.tries>=3;
  return `<div class="note i"><label for="otp">Customer's 4-digit delivery code</label><input id="otp" inputmode="numeric" maxlength="4" autocomplete="one-time-code" placeholder="••••" style="font-size:24px;letter-spacing:10px;text-align:center" ${lk?'disabled':''}>${o.tries?`<p role="alert" style="color:var(--err);margin:6px 0 0;font-weight:600">${lk?'Locked after 3 wrong codes.':'Wrong code. '+(3-o.tries)+' tries left.'}</p>`:''}<p class="sub" style="margin:8px 0 0">Ask the customer for the code in their app. <a href="#" id="demo" style="color:var(--cocoa);font-weight:700">Show demo code</a></p>${lk?'<button class="btn alt" id="rsd" style="margin-top:8px">Resend code</button>':''}</div>`}
function aView(){
  const o=act();
  if(!o)return `<h1>My <span class="kau">trip</span></h1><div class="empty card">No active delivery. Accept a ready order from Deliveries.<br><br><button class="btn" data-go="q">Browse orders</button></div>`;
  const picked=o.status==='Picked up',p=picked?pos(o):null,pr=picked?prog(o):0,left=picked?Math.max(0,Math.ceil((o.startedAt+o.dur-now())/SCALE)):o.etaMin,done=picked&&now()>=o.startedAt+o.dur;
  const m=mapSvg3(o),left1=Math.max(0,Math.ceil((o.accAt+o.d1-now())/SCALE)),km=picked?(o.km*(1-pr)):m.km1;
  const steps=['Placed','Accepted by you','Picked up','Delivered'];
  const tl=steps.map(s=>{const e=o.ev.find(x=>x.s===s);return `<li class="${e?'d':''}">${s}${e?' – '+fmt(e.at):''}</li>`}).join('');
  let h=`<h1>${picked?'On the <span class="kau">road</span>':'Go to <span class="kau">pickup</span>'}</h1><div class="map">${mapLive()?'<div id="gmap"></div>':m.svg}</div>${osmNote()}<p class="sub" style="margin:6px 2px">${picked?'Dark line: route to the customer. Grey line: the leg you already drove.':'Orange line: route to the restaurant. Dashed line: next leg to the customer.'} The orange dot is you.</p>
  <div class="eta"><span class="sub" style="color:#E2B48C">${picked?'Estimated arrival':'Arrive at restaurant in'}</span><br><b>${picked?left:left1} min</b>
  <div aria-live="polite" style="font-size:14px;margin-top:4px">${picked?(done?'You have arrived at '+o.area+'.':'Driver position: '+m.lat.toFixed(4)+', '+m.lng.toFixed(4)+' • '+km.toFixed(1)+' km to go'):(m.arr?'You are at '+o.rest+'. Confirm pickup.':km.toFixed(1)+' km to '+o.rest)}</div>
  ${picked?`<div class="bar" role="progressbar" aria-valuenow="${Math.round(pr*100)}" aria-valuemin="0" aria-valuemax="100"><i style="width:${pr*100}%"></i></div>`:''}</div>
  <article class="card"><div class="row"><h3 class="rn">${o.rest}</h3><span class="badge del">${o.status}</span></div>
  <p class="meta">${o.id} • ${o.items}<br>Customer: ${o.cust} • ${o.area}<br>Order total ₹${o.total} • Your pay ₹${o.pay}</p><a class="btn alt" href="tel:${o.phone?'+91'+o.phone:(CP[o.cust]||'+919800000000')}" aria-label="Call customer ${o.cust}" style="display:flex;align-items:center;justify-content:center;text-decoration:none;margin-bottom:10px">Call ${o.cust}</a>${picked?'':`<div class="note i"><b>Pickup at ${o.rest}</b><br>${RA[o.rest]||o.area}<br>${km.toFixed(1)} km from you • about ${eta(km)} min<br>The route is shown on the map above.</div>`}`;
  h+=picked?`${done?otpBlock(o):''}<button class="btn" id="dv" ${done&&!(o.tries>=3)?'':'disabled'}>${done?'Verify code & mark delivered':'Delivered unlocks at arrival ('+left+' min)'}</button>`:`<button class="btn" id="pk" ${!o.pkWait&&m.arr?'':'disabled'}>${o.pkWait?'Waiting for the restaurant to hand over':(m.arr?'Confirm pickup':'Reaching restaurant ('+left1+' min)')}</button>${o.shared&&o.pkRest&&!o.pkWait?'<p class="meta" style="margin:6px 0 0">The restaurant is ready to hand it over.</p>':''}`;
  h+=`${o.shared?`<div style="margin-top:10px">${FDContact.btn(o.id,'driver','restaurant','Contact '+o.rest,'btn alt')}</div>`:''}${!picked?`<button class="btn alt" id="cxo" style="margin-top:10px">${o.cxAsk?'Tap again to cancel this order':'Cancel this order'}</button>`:''}</article><h2>Order <em>steps</em></h2><div class="card"><ol class="tl">${tl}</ol></div>`;
  return h}
function hView(){
  const rows=S.orders.filter(o=>o.status==='Delivered'&&o.mine).filter(o=>(f==='All'||o.status===f)&&(o.rest+o.id+o.cust+o.area).toLowerCase().includes(q.toLowerCase()));
  let h=`<h1>Past <span class="kau">runs</span></h1><div class="tools"><div style="flex:1"><label for="sq">Search</label><input id="sq" value="${q.replace(/"/g,'&quot;')}" placeholder="Restaurant, order or area"></div></div>`;
  if(!rows.length)return h+`<div class="empty card">No deliveries match.<br><br><button class="btn alt" id="rs">Reset search</button></div>`;
  h+=rows.map(o=>`<article class="card"><div class="row"><h3 class="rn">${o.rest}</h3><span class="pay">₹${o.pay}</span></div><p class="meta">${o.id} • ${o.area} • ${fmt(o.ev[o.ev.length-1].at)}</p><span class="badge del">Delivered</span></article>`).join('');
  return h+`<button class="btn alt" id="ex">Export CSV</button>`}
function iView(){return `<h1>How it <span class="kau">works</span></h1>
<div class="card"><p><b>One at a time.</b> Accept a ready order from any restaurant. Other orders lock until you deliver.</p><p><b>Your steps.</b> Accept, Pick up, Delivered. Kitchens control Preparing and Ready; drivers cannot change those.</p><p><b>Delivered unlock.</b> Marking Delivered is available only after the estimated time ends, and only with the customer’s 4-digit code. Three wrong codes lock the step until you resend.</p><p><b>Availability.</b> Go unavailable when you need a break and turn it back on when ready. You cannot switch off during a delivery.</p><p><b>Simulated stream.</b> Driver position is a timer on sample data, not GPS. In this demo 1 estimated minute runs as 3 seconds.</p><p>ETA = distance ÷ 20 km/h, rounded up. Data stays in this browser.</p><button class="btn alt" id="rst">Reload sample data</button></div>`}
function render(){
  document.getElementById('wel').textContent='Welcome back, '+S.prof.name.trim().split(' ')[0]+'! '+(act()?'Ride safe on your delivery.':avail()?'Pick an order to start earning.':'You are unavailable right now.');const ab=document.getElementById('avb');ab.textContent=S.prof.name.trim().charAt(0).toUpperCase();ab.onclick=()=>{tab='p';render()};
  const a=act(),sb=document.getElementById('stat');sb.textContent=a?'On delivery':(avail()?'Available':'Unavailable');sb.className='chip'+(!a&&avail()?' on':'');sb.onclick=toggleAvail;
  document.querySelectorAll('nav button').forEach(b=>b.toggleAttribute('aria-current',false)||(b.dataset.t===tab&&b.setAttribute('aria-current','page')));
  const el=document.getElementById('v');el.innerHTML={q:qView,a:aView,h:hView,p:pView,i:iView}[tab]();
  if(tab==='h'&&document.activeElement.id!=='sq'){}
  wire();updateMap()}
function wire(){
  const $=s=>document.querySelector(s);
  document.querySelectorAll('[data-acc]').forEach(b=>b.onclick=()=>accept(b.dataset.acc));
  document.querySelectorAll('[data-dec]').forEach(b=>b.onclick=()=>declineShared(b.dataset.dec));
  document.querySelectorAll('[data-go]').forEach(b=>b.onclick=e=>{e.preventDefault();tab=b.dataset.go;render()});
  $('#ps')&&($('#ps').onclick=()=>{const n=$('#pn').value.trim(),ph=$('#pp').value.trim();if(n.length<2)return toast('Enter your full name, at least 2 letters.',1);if(!/^\d{10}$/.test(ph))return toast('Enter a 10-digit phone number.',1);S.prof={email:S.prof.email,name:n,phone:ph,vehicle:$('#pv').value,plate:$('#pl').value.trim()||'-',zone:$('#pz').value.trim()||'-'};save();render();toast('Profile saved.')});
  $('#demo')&&($('#demo').onclick=e=>{e.preventDefault();toast('Demo only: the customer\u2019s code is '+act().otp)});
  $('#rsd')&&($('#rsd').onclick=()=>{const o=act();if(!o.shared)o.otp=String(Math.floor(1000+Math.random()*9000));o.tries=0;save();render();toast(o.shared?'Try again. Ask the customer for the code shown in their app.':'New code sent to the customer.')});
  $('#av2')&&($('#av2').onclick=toggleAvail);
  $('#so')&&($('#so').onclick=()=>FDSession.signOut());
  $('#pk')&&($('#pk').onclick=pickup);$('#cxo')&&($('#cxo').onclick=cancelTrip);$('#dv')&&($('#dv').onclick=deliver);
  $('#sq')&&($('#sq').oninput=e=>{q=e.target.value;const p=e.target.selectionStart;render();const n=$('#sq');n.focus();n.setSelectionRange(p,p)});
  $('#rs')&&($('#rs').onclick=()=>{q='';render()});
  $('#rst')&&($('#rst').onclick=()=>{S=seed();save();tab='q';render();toast('Sample data reloaded.')});
  $('#ex')&&($('#ex').onclick=()=>{const rows=S.orders.filter(o=>o.status==='Delivered'&&o.mine&&(o.rest+o.id+o.cust+o.area).toLowerCase().includes(q.toLowerCase()));
    const csv=['Order,Restaurant,Area,Pay,Delivered at',...rows.map(o=>[o.id,o.rest,o.area,o.pay,new Date(o.ev[o.ev.length-1].at).toISOString()].join(','))].join('\n');
    const u=URL.createObjectURL(new Blob([csv],{type:'text/csv'})),l=document.createElement('a');l.href=u;l.download='fooddispatch-history.csv';l.click();toast('Exported '+rows.length+' rows.')})}
document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>{tab=b.dataset.t;render()});
load();
// logged-in delivery partner: profile takes the details used at log in / sign up
(function(){const u=window.FDSession&&FDSession.forRole('Delivery partner');if(!u)return;S.prof.email=u.email;if(FDSession.fresh('driver',u)){S.prof.name=FDSession.nameOf(u);S.prof.phone='';S.prof.plate='-';S.prof.zone='-';try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}})();
// ---- shared orders: the restaurant offers a Ready order to the nearest free driver, and everything flows through FDStore ----
const SHARED=!!window.FDStore&&FDStore.available();
function dFrom(r){const C=FDStore.clean,km=hav(r.rpos[0],r.rpos[1],r.drop[0],r.drop[1]);
  return{id:r.id,rest:C(r.k),rLat:r.rpos[0],rLng:r.rpos[1],cust:C(r.name,60)||'Customer',phone:/^\d{10}$/.test(r.phone||'')?r.phone:'',items:(r.lines||[]).map(l=>(+l.q||1)+' × '+C(l.n)).join(', ')||C(r.items),total:+r.total||0,area:'Drop-off pin '+r.drop[0].toFixed(3)+', '+r.drop[1].toFixed(3),dLat:r.drop[0],dLng:r.drop[1],status:r.status,pay:Math.round(40+km*6+(+r.tip||0)),mine:false,shared:true,otp:r.otp,ev:[{s:'Placed',at:r.createdAt||now()}]}}
function adopt(o,r){o.mine=true;S.active=o.id;o.from={lat:S.drv.lat,lng:S.drv.lng};o.accAt=now();o.km1=hav(o.from.lat,o.from.lng,o.rLat,o.rLng);o.d1=eta(o.km1)*SCALE;o.ev.push({s:'Accepted by you',at:now()});
  if(r.status==='Picked up')startTrip(o,r);
  tab='a';toast('Order accepted. Head to '+o.rest+'.')}
function startTrip(o,r){o.pkWait=false;const e=(r.history||[]).filter(x=>x.s==='Picked up')[0];o.startedAt=e?e.at:now();o.tries=0;o.otp=r.otp||o.otp;const km=hav(o.rLat,o.rLng,o.dLat,o.dLng);o.km=km;o.etaMin=eta(km);o.dur=o.etaMin*SCALE;S.drv={lat:o.rLat,lng:o.rLng};ev(o,'Picked up')}
function acceptShared(o){const r=FDStore.get(o.id);
  if(r&&r.driver&&r.driver.id==='LIVE'){syncShared();render();return}   // the restaurant already assigned you: just open it
  if(!r||r.driver||!(r.offer&&r.offer.driverId==='LIVE')){S.orders=S.orders.filter(x=>x!==o);save();render();return toast('This offer is no longer available. The restaurant may have given it to another driver.',1)}
  o.accSent=now();o.accN=1;FDStore.patch(o.id,{offerResp:'accept'});save();toast('Accepted. Waiting for the restaurant to confirm you…')}
function declineShared(id){FDStore.patch(id,{offerResp:'decline'});S.orders=S.orders.filter(o=>o.id!==id);render();toast('Order declined. The restaurant will offer it to the next driver.')}
function syncShared(){if(!SHARED)return;let ch=false;
  /* leftovers: an offer or trip kept on this page whose shared order no longer exists (data cleared, reset). Forget it after a short grace period so the driver is not stuck busy. Delivered history is kept. */
  {const all0=FDStore.all(),MS=window.__fdMiss=window.__fdMiss||{};
   S.orders=S.orders.filter(o=>{if(!o.shared||o.status==='Delivered')return true;if(all0.some(r=>r.id===o.id)){delete MS[o.id];return true}MS[o.id]=MS[o.id]||Date.now();if(Date.now()-MS[o.id]<=5000)return true;if(S.active===o.id)S.active=null;ch=true;return false})}
  FDStore.all().filter(r=>r.src==='customer'&&r.rpos&&r.drop).forEach(r=>{
    const mineRec=!!(r.driver&&r.driver.id==='LIVE'),offered=!!(r.offer&&r.offer.driverId==='LIVE'&&!r.driver);
    const relevant=r.status==='Preparing'||(r.status==='Ready'&&(offered||mineRec))||((r.status==='Picked up'||r.status==='Delivered')&&mineRec);
    let o=byId(r.id);
    if(!o){if(!relevant||r.status==='Delivered')return;o=dFrom(r);S.orders.push(o);ch=true;if(offered&&document.hidden)document.title='(New order offer) '+BASE_TITLE}
    if(!o.shared||o.status==='Delivered')return;
    o.route=r.route||null;o.pkRest=!!(r.pk&&r.pk.restaurant);if(o.pkWait&&!(r.pk&&r.pk.driver))o.pkWait=false;
    const sg=JSON.stringify(r.route&&[r.route.pickupDriver,r.route.pickup&&r.route.pickup.length,r.route.deliver&&r.route.deliver.length]);if(o.rsg!==sg){o.rsg=sg;ch=true}
    if(!o.mine){
      if(!relevant||r.status==='Cancelled'){S.orders=S.orders.filter(x=>x!==o);ch=true;if(o.accSent)toast('The restaurant gave that order to someone else.',1);return}
      if(o.status!==r.status&&r.status==='Preparing'){o.status='Preparing';ch=true}
      if(r.status==='Ready'&&o.status!=='Ready'){o.status='Ready';ch=true}
      if(mineRec&&S.active&&S.active!==o.id){const cur=byId(S.active);if(cur&&!cur.shared&&cur.status==='Ready'){cur.mine=false;cur.ev=cur.ev.filter(e=>e.s==='Placed');delete cur.from;delete cur.accAt;S.active=null}}   // a demo order you had picked gives way to the real assignment
      if(o.accSent&&!mineRec&&r.status==='Ready'&&r.offer&&r.offer.driverId==='LIVE'&&now()-o.accSent>3000&&o.accN<5){o.accSent=now();o.accN++;FDStore.patch(o.id,{offerResp:'accept'})}   // the restaurant has not answered yet: ask again
      if(mineRec&&(r.status==='Ready'||r.status==='Picked up')&&(!S.active||S.active===o.id)){o.status=r.status==='Ready'?'Ready':o.status;adopt(o,r);ch=true}}
    else if(r.status==='Picked up'&&o.status==='Ready'){startTrip(o,r);toast('The restaurant handed over the order. Head to the customer.');ch=true}});
  if(ch){save();if(tab==='q'||tab==='a'){if(document.activeElement.tagName!=='INPUT')render()}}}
/* heartbeat: lets the restaurant include this driver in nearest-driver dispatch, and streams position + ETA to the customer */
function publish(){if(!SHARED)return;FDStore.ping('driver');SCALE=60000/FDStore.speed();const a=act(),p=a&&a.mine?drvPos(a):S.drv;
  FDStore.putDriver({id:'LIVE',name:S.prof.name,phone:S.prof.phone,plate:S.prof.plate,lat:p.lat,lng:p.lng,available:avail()&&!a});
  if(a&&a.shared&&a.mine)ensureLegs(a);
  if(a&&a.shared&&a.mine)FDStore.patch(a.id,{dpos:[p.lat,p.lng],etaAt:a.status==='Picked up'?a.startedAt+a.dur:a.accAt+a.d1+eta(hav(a.rLat,a.rLng,a.dLat,a.dLng))*SCALE})}
setInterval(()=>{syncShared();publish()},1000);
if(SHARED){FDContact.init('driver',o=>!!(o.driver&&o.driver.id==='LIVE'));FDStore.onChange(()=>{syncShared();publish()});window.addEventListener('pagehide',()=>FDStore.dropDriver())}
const BASE_TITLE=document.title;document.addEventListener('visibilitychange',()=>{if(!document.hidden)document.title=BASE_TITLE});
/* the cancel button: before pickup a driver can give the order back; it returns to the restaurant for another driver */
function cancelTrip(){const o=act();if(!o||o.status!=='Ready')return toast('The food is already with you, so this order can’t be cancelled now.',1);
  if(!o.cxAsk){o.cxAsk=true;render();setTimeout(()=>{if(o.cxAsk){o.cxAsk=false;if(act()===o)render()}},4000);return}
  if(o.shared){const x=FDStore.release(o.id,'LIVE','Driver cancelled');if(!x.ok)return toast(x.msg,1);delete legBusy[o.id+'p'];S.orders=S.orders.filter(y=>y!==o)}
  else{o.mine=false;o.cxAsk=false;o.pkWait=false;o.ev=o.ev.filter(e=>e.s==='Placed');delete o.from;delete o.accAt}   // a demo order simply goes back to the list
  S.active=null;tab='q';save();render();toast('Order cancelled. It goes back to the restaurant for another driver.')}
/* routes shared with the restaurant and customer pages: this page supplies the live driver's pickup leg (and the delivery leg if nobody else has) */
const legBusy={};let gmSk='';
function pathAt(pts,t){let tot=0;const L=[];for(let i=1;i<pts.length;i++){const l=hav(pts[i-1][0],pts[i-1][1],pts[i][0],pts[i][1]);L.push(l);tot+=l}
  let s=Math.min(1,Math.max(0,t))*tot;for(let i=0;i<L.length;i++){if(s<=L[i]||i===L.length-1){const u=L[i]?Math.min(1,s/L[i]):0;return{lat:pts[i][0]+(pts[i+1][0]-pts[i][0])*u,lng:pts[i][1]+(pts[i+1][1]-pts[i][1])*u}}s-=L[i]}return{lat:pts[pts.length-1][0],lng:pts[pts.length-1][1]}}
function legPts(o,leg){const r=o.route;if(!r)return null;if(leg==='pickup')return r.pickupDriver==='LIVE'&&r.pickup&&r.pickup.length>1?r.pickup:null;return r.deliver&&r.deliver.length>1?r.deliver:null}
function drvPos(a){if(a.status==='Picked up')return pos(a);const f=a.from||S.drv,t=Math.min(1,Math.max(0,(now()-a.accAt)/(a.d1||1))),L=legPts(a,'pickup');return L?pathAt(L,t):{lat:f.lat+(a.rLat-f.lat)*t,lng:f.lng+(a.rLng-f.lng)*t}}
function fetchLeg(a,b){return new Promise(res=>{const straight=()=>res([[a.lat,a.lng],[b.lat,b.lng]]),
  osrm=()=>fetch(`https://router.project-osrm.org/route/v1/driving/${a.lng},${a.lat};${b.lng},${b.lat}?overview=full&geometries=geojson`).then(r=>r.json()).then(j=>res(j.routes[0].geometry.coordinates.map(c=>[c[1],c[0]]))).catch(straight);
  if(gmReady&&window.google&&google.maps&&google.maps.DirectionsService)new google.maps.DirectionsService().route({origin:a,destination:b,travelMode:'DRIVING'},(r,st)=>st==='OK'?res(r.routes[0].overview_path.map(p=>[p.lat(),p.lng()])):osrm());else osrm()})}
function ensureLegs(o){const r=o.route||{};
  if(o.status==='Ready'&&r.pickupDriver!=='LIVE'&&(!legBusy[o.id+'p']||Date.now()-legBusy[o.id+'p']>5000)){legBusy[o.id+'p']=Date.now();const f=o.from||S.drv;fetchLeg({lat:f.lat,lng:f.lng},{lat:o.rLat,lng:o.rLng}).then(p=>FDStore.setRoute(o.id,'pickup',p,'LIVE'))}
  if(!r.deliver){if(!legBusy[o.id+'d'])legBusy[o.id+'d']=Date.now();else if(legBusy[o.id+'d']!==1&&Date.now()-legBusy[o.id+'d']>3000){legBusy[o.id+'d']=1;fetchLeg({lat:o.rLat,lng:o.rLng},{lat:o.dLat,lng:o.dLng}).then(p=>FDStore.setRoute(o.id,'deliver',p))}}}   // the restaurant normally supplies the delivery leg first
loadGM();syncShared();publish();render();
if(storeErr)toast('Saved data could not be read, so sample data was loaded.',1);
// timers: kitchens finish preparing; live stream refresh while on trip
setInterval(()=>{let ch=false;S.orders.forEach(o=>{if(!o.shared&&o.status==='Preparing'&&now()-o.ev[0].at>9e5+25000){ev(o,'Ready');ch=true}});if(ch){save();if(tab==='q'&&document.activeElement.tagName!=='INPUT')render()}},5000);
setInterval(()=>{const o=act();if(tab!=='a'||!o)return;
  if(o.status==='Ready'){const was=document.getElementById('pk')?.disabled;if(was===false)return;render();const b=document.getElementById('pk');if(was&&b&&!b.disabled)toast('You have reached '+o.rest+'. Confirm pickup.');return}
  if(o.status==='Picked up'){const was=document.getElementById('dv')?.disabled;if(was===false)return;render();const d=document.getElementById('dv');if(was&&d&&!d.disabled)toast('You have arrived. Ask the customer for their delivery code.')}},1000);
