var R={lat:12.9352,lng:77.6245,speed:20};
var KEY='fooddispatch_state_v3';
function seed(){return{
drivers:[{id:'D1',name:'Rahul K.',rt:20,available:false,lat:12.9406,lng:77.6245},{id:'D2',name:'Meena S.',rt:30,available:true,lat:12.9301,lng:77.6290},{id:'D3',name:'Arjun P.',rt:null,hold:'FD-1047',available:true,lat:12.9450,lng:77.6150},{id:'D4',name:'Kiran B.',rt:40,available:true,lat:12.9210,lng:77.6180},{id:'D5',name:'Sneha L.',rt:60,available:false,lat:12.9380,lng:77.6300}],
orders:[
{id:'FD-1045',cust:'Ananya R.',items:['1× Veg Biryani','2× Butter Naan'],area:'Koramangala',at:'7:08 PM',status:'Placed',lat:12.9279,lng:77.6271,prep:25},
{id:'FD-1046',cust:'Kabir M.',items:['2× Paneer Butter Masala'],area:'HSR Layout',at:'7:10 PM',status:'Placed',lat:12.9116,lng:77.6389,prep:20},
{id:'FD-1043',cust:'Divya S.',items:['1× Paneer Butter Masala','1× Gulab Jamun'],area:'Indiranagar',at:'6:52 PM',status:'Preparing',lat:12.9784,lng:77.6408,prep:12},
{id:'FD-1044',cust:'Sameer T.',items:['3× Butter Naan','1× Masala Chai'],area:'Koramangala',at:'7:01 PM',status:'Ready',lat:12.9352,lng:77.6200,prep:0,driver:'D1'},
{id:'FD-1047',cust:'Priya V.',items:['1× Veg Biryani'],area:'BTM Layout',at:'7:12 PM',status:'Ready',lat:12.9166,lng:77.6101,prep:0,offer:{driver:'D3',t0:0},tried:['D3']}],
clock:0,
trips:[{id:'FD-1041',driver:'D5',lat:12.9500,lng:77.6350}],
events:[{t:'7:12 PM',m:'FD-1047 offered to Arjun P. (waiting for acceptance)'},{t:'7:01 PM',m:'FD-1044 assigned to Rahul K.'},{t:'6:58 PM',m:'FD-1041 handed to Sneha L.'}]}}
var S;
try{S=JSON.parse(localStorage.getItem(KEY))}catch(e){S=null}
if(!S||!S.orders)S=seed();
if(S.kitchen){R.lat=S.kitchen[0];R.lng=S.kitchen[1]}
S.trips=S.trips||[];S.clock=S.clock||0;
function seedStats(){return{day:new Date().toDateString(),hourly:{11:3,12:8,13:11,14:5,15:2,16:3,17:6,18:9},items:{'Veg Biryani':31,'Butter Naan':58,'Paneer Butter Masala':27,'Masala Chai':22,'Gulab Jamun':19},areas:{'Koramangala':14,'HSR Layout':9,'Indiranagar':8,'BTM Layout':7,'Jayanagar':5,'Whitefield':4},byDriver:{D1:11,D2:10,D3:9,D4:9,D5:7},acc:[95,140,210,60,120,85,175],delivered:46,cancelled:2,missed:3}}
function seedCancelled(){return[{id:'FD-1038',cust:'Rohan D.',items:['2\u00d7 Veg Biryani'],area:'Jayanagar',at:'1:14 PM',when:'1:20 PM',reason:'Customer request',lat:12.925,lng:77.5938,prep:20},{id:'FD-1040',cust:'Neha G.',items:['1\u00d7 Paneer Butter Masala','2\u00d7 Butter Naan'],area:'Koramangala',at:'6:05 PM',when:'6:09 PM',reason:'Item unavailable',lat:12.9279,lng:77.6271,prep:20}]}
function scale(o){var r={};for(var k in o)r[k]=o[k]*415;return r}
var askCancel=null;
if(!S.stats||S.stats.day!==new Date().toDateString()){S.stats=seedStats();S.cancelled=seedCancelled()}
S.cancelled=S.cancelled||seedCancelled();S.stats.sh=S.stats.sh||scale(S.stats.hourly);S.stats.sa=S.stats.sa||scale(S.stats.areas);
var PK='fooddispatch_profile_v1',P={name:'',rest:'Spice Route Kitchen',role:'Owner',email:'',phone:'',in:false,since:''};
try{Object.assign(P,JSON.parse(localStorage.getItem(PK))||{})}catch(e){}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){say('Data could not be saved on this device. Your current orders stay on screen.','err')}}
var filter='All',query='';
function now(){return new Date().toLocaleTimeString('en-IN',{hour:'numeric',minute:'2-digit'}).toUpperCase()}
function hav(a,b,c,d){var r=Math.PI/180,x=Math.sin((c-a)*r/2)**2+Math.cos(a*r)*Math.cos(c*r)*Math.sin((d-b)*r/2)**2;return 12742*Math.asin(Math.sqrt(x))}
function dName(id){var d=S.drivers.find(function(x){return x.id===id});return d?d.name:''}
function etaFor(o){var km=hav(R.lat,R.lng,o.lat,o.lng);return Math.ceil(km/R.speed*60+(o.prep||0))}
function say(t,type){var m=document.getElementById('msg');m.textContent=t;m.className='msg '+(type||'')}
function log(m){S.events.unshift({t:now(),m:m});S.events=S.events.slice(0,30)}
function drv(id){return S.drivers.find(function(x){return x.id===id})}
function fmt(t){t=Math.ceil(t);return Math.floor(t/60)+':'+('0'+t%60).slice(-2)}
/* a real person on the driver page gets about 2 real minutes to answer (at x10 speed 300 simulated seconds would be only 30 real seconds) */
function offerLim(o){var d=o&&o.offer&&drv(o.offer.driver);return d&&d.live?Math.max(300,120*mult):300}
function offer(o){var tried=o.tried||(o.tried=[]),best=null,bd=1e9;
 S.drivers.forEach(function(d){if(!d.available||d.hold||(d.live&&!o.shared)||(o.shared&&simBlocked(d,o))||tried.indexOf(d.id)>-1||(o.cx&&o.cx.indexOf(d.id)>-1))return;var k=hav(d.lat,d.lng,R.lat,R.lng);if(k<bd){bd=k;best=d}});
 if(best){best.hold=o.id;tried.push(best.id);o.offer={driver:best.id,t0:S.clock};delete o.wait;log(o.id+' offered to '+best.name+' ('+bd.toFixed(1)+' km away)');return best.name+' ('+bd.toFixed(1)+' km away) was asked to accept. 5:00 to respond.'}
 delete o.offer;o.tried=[];o.retryAt=S.clock+120;if(!o.wait){o.wait=1;log(o.id+' ready · no free driver, will keep trying')}return null}
function dispatch(o){return offer(o)}
function accept(o){var d=drv(o.offer.driver),el=S.clock-o.offer.t0;delete d.hold;d.available=false;o.driver=d.id;delete o.offer;S.stats.acc.push(el);S.stats.acc=S.stats.acc.slice(-60);log(o.id+' accepted by '+d.name+' in '+fmt(el));say(d.name+' accepted '+o.id+' within '+fmt(el)+' and is heading to the restaurant.','ok')}
function decline(o,why){var d=drv(o.offer.driver);delete d.hold;delete o.offer;
 var m=why==='timeout'?d.name+' did not accept '+o.id+' within 5 minutes.':why==='withdrawn'?d.name+' became unavailable for '+o.id+'.':d.name+' declined '+o.id+'.';
 S.stats.missed=(S.stats.missed||0)+1;log(m);var r=offer(o);say(m+' '+(r?'Reassigned: '+r:'No other free driver right now. We will keep trying.'))}
function processOffers(){var ch=false;S.orders.forEach(function(o){if(o.status!=='Ready'||o.driver)return;
 if(o.offer){var d=drv(o.offer.driver),el=S.clock-o.offer.t0;
  if(!d.available){decline(o,'withdrawn');ch=true}
  else if(el>=offerLim(o)){decline(o,'timeout');ch=true}
  else if(d.rt!=null&&el>=d.rt){accept(o);ch=true}}
 else if(S.clock>=(o.retryAt||0)){var r=offer(o);if(r){say(o.id+': '+r);ch=true}}});return ch}
function act(a,id,r){if(a!=='cancel')askCancel=null;var o=S.orders.find(function(x){return x.id===id});if(!o)return;
 if(a==='accept'){if(!sh(o,'Accepted'))return;o.status='Accepted';log(id+' accepted');say('Order '+id+' accepted. Start preparing when the kitchen is ready.','ok')}
 else if(a==='prep'){if(!sh(o,'Preparing'))return;o.status='Preparing';log(id+' preparing');say(id+' is now being prepared.','ok')}
 else if(a==='cancel'){if(o.status==='Preparing'||o.status==='Ready'){say('Orders can be cancelled only before preparing starts.','err');return}askCancel=id}
 else if(a==='keep'){askCancel=null}
 else if(a==='cancelas'){if(!sh(o,'Cancelled'))return;S.orders=S.orders.filter(function(x){return x!==o});S.cancelled.unshift({id:o.id,cust:o.cust,items:o.items,area:o.area,at:o.at,when:now(),reason:r||'Other',lat:o.lat,lng:o.lng,prep:o.prep});askCancel=null;log(id+' cancelled \u00b7 '+(r||'Other'));say('Order '+id+' cancelled ('+(r||'Other')+'). See Analytics for the cancellation log.','ok')}
 else if(a==='ready'){if(!sh(o,'Ready'))return;o.status='Ready';var r=dispatch(o);say(r?'Order '+id+' is ready. '+r:'Order '+id+' is ready. No driver is available yet; the ETA estimate stays visible.',r?'ok':'')}
 else if(a==='retry'){var r2=dispatch(o);say(r2?'Offer sent for '+id+'. '+r2:'Still no driver available for '+id+'. We will keep it Ready.',r2?'ok':'')}
 else if(a==='hand'){if(!o.driver){say('No driver is assigned to '+id+' yet. Wait for a driver, then hand over.','err');return}
  var dr=S.drivers.find(function(x){return x.id===o.driver}),dk=hav(dr.lat,dr.lng,R.lat,R.lng);
  if(dk>.15){say(dr.name+' is still '+dk.toFixed(1)+' km away. Hand over once the driver reaches the restaurant.','err');return}
  var pk=o.shared?shPick(o,dr):'done';if(pk==='pending'){o.handed=true;log(id+' handed over · waiting for '+dName(o.driver)+' to confirm pickup');say('Hand-over recorded. '+dName(o.driver)+' still has to confirm pickup on their side before leaving.','ok');save();render();return}if(!pk)return;S.orders=S.orders.filter(function(x){return x!==o});addTo(S.stats,o);S.trips.push({id:o.id,driver:o.driver,lat:o.lat,lng:o.lng,shared:o.shared});log(id+' handed to '+dName(o.driver));say(id+' handed to '+dName(o.driver)+'. The driver is now on the way to the customer.','ok')}
 else if(a==='deliv'){say('Unauthorized: “Restaurants can’t mark an order as Delivered. Only the assigned driver can.”','err');return}
 save();render()}
function match(o){var q=query.trim().toLowerCase();return !q||(o.id+' '+o.cust+' '+o.items.join(' ')+' '+o.area).toLowerCase().indexOf(q)>-1}
function card(o){var h='<article class="card" aria-label="Order '+o.id+'"><div class="row"><span class="id">#'+o.id+'</span>';
 var st=o.status;h+='<span class="badge '+(st==='Ready'?'ready':st==='Preparing'?'prep':'')+'">'+(st==='Placed'?'Placed':st)+'</span></div>';
 h+='<div class="items">'+o.items.join(' · ')+'</div><div class="meta">'+o.cust+' · '+(st==='Ready'?'Ready ':'Placed ')+o.at+' · '+o.area+'</div>';
 if(st==='Ready'){h+=(o.driver||o.offer)?'<div class="note'+(o.offer?' wait':'')+'" data-live="'+o.id+'">'+liveNote(o)+'</div>'
  :'<div class="note wait"><b>Waiting for driver.</b> No driver available yet. ETA estimate: about '+etaFor(o)+' min.</div>'}
 if(askCancel===o.id){return h+'<div class="note"><b>Why is this order being cancelled?</b></div><div class="acts">'+['Customer request','Item unavailable','Kitchen too busy','Other'].map(function(r){return '<button class="btn out sm" data-a="cancelas" data-id="'+o.id+'" data-r="'+r+'">'+r+'</button>'}).join('')+'<button class="btn sm" data-a="keep" data-id="'+o.id+'">Keep order</button></div></article>'}
 h+='<div class="acts">';
 if(st==='Placed')h+=B('accept',o,'Accept')+B('cancel',o,'Cancel',1);
 if(st==='Accepted')h+=B('prep',o,'Start preparing')+B('cancel',o,'Cancel',1);
 if(st==='Preparing')h+=B('ready',o,'Mark ready');
 if(st==='Ready'){h+=o.handed?'<button class=\"btn out\" disabled>Handed over · waiting for driver</button>':B('hand',o,'Handed to driver',1);if(!o.driver&&!o.offer)h+=B('retry',o,'Retry dispatch',1);h+='<button class="btn out sm" data-a="deliv" data-id="'+o.id+'">Mark delivered</button>'}
 if(o.shared)h+=FDContact.btn(o.id,'restaurant','customer','Message customer','btn out sm')+(o.driver?FDContact.btn(o.id,'restaurant','driver','Contact driver','btn out sm'):'');
 return h+'</div></article>'}
function B(a,o,t,out){return '<button class="btn'+(out?' out':'')+'" data-a="'+a+'" data-id="'+o.id+'">'+t+'</button>'}
function render(){
 var cols={New:[],Preparing:[],Ready:[]};
 S.orders.filter(match).forEach(function(o){(o.status==='Placed'?cols.New:o.status==='Ready'?cols.Ready:cols.Preparing).push(o)});
 var all={New:0,Preparing:0,Ready:0};S.orders.forEach(function(o){all[o.status==='Placed'?'New':o.status==='Ready'?'Ready':'Preparing']++});
 var chips=['All','New','Preparing','Ready'].map(function(c){return '<button class="chip" aria-pressed="'+(filter===c)+'" data-f="'+c+'">'+c+(c==='All'?'':' '+all[c])+'</button>'}).join('');
 document.getElementById('chips').innerHTML=chips;
 var cls={New:'col-n',Preparing:'col-p',Ready:'col-r'},hint={New:'No new orders. New orders appear here as customers place them.',Preparing:'Nothing is being prepared right now.',Ready:'No orders waiting for pickup.'};
 var shown=filter==='All'?['New','Preparing','Ready']:[filter],total=0,out='';
 shown.forEach(function(k){total+=cols[k].length;out+='<section class="'+cls[k]+'" aria-label="'+k+' orders"><h2>'+k+' <span class="count">'+cols[k].length+'</span></h2>'+(cols[k].length?cols[k].map(card).join(''):'<div class="empty">'+hint[k]+'</div>')+'</section>'});
 if(query&&!total)out='<div class="empty">No orders match “'+query.replace(/</g,'')+'”.<br><button class="btn out" id="reset" style="margin-top:10px">Reset filters</button></div>';
 var b=document.getElementById('board');b.innerHTML=out;b.className='board'+(shown.length===1||(query&&!total)?' one':'');
 var av=S.drivers.filter(function(d){return d.available}).length;
 document.getElementById('pool').innerHTML='<span>Drivers nearby ('+av+' available). Tap to set availability:</span>'+S.drivers.map(function(d){return '<button class="drv" aria-pressed="'+d.available+'" data-d="'+d.id+'"><i class="dot" style="background:'+dcol(d)+'"></i>'+d.name+(d.hold?' · offer pending':d.available?' · available':d.live?(d.why==='off'?' · set to unavailable by the driver':' · busy, on a delivery'):' · busy')+'</button>'}).join('');
 document.getElementById('log').innerHTML=S.events.slice(0,5).map(function(e){return '<li><b>'+e.t+'</b> · '+e.m+'</li>'}).join('');if(view==='analytics')renderAnalytics()}
document.addEventListener('click',function(e){var t=e.target.closest('button');if(!t)return;
 if(t.dataset.a)act(t.dataset.a,t.dataset.id,t.dataset.r);
 else if(t.dataset.f){filter=t.dataset.f;render()}
 else if(t.dataset.d){var d=S.drivers.find(function(x){return x.id===t.dataset.d});d.available=!d.available;save();render();say(d.name+' is now '+(d.available?'available':'busy')+'.')}
 else if(t.id==='reset'){query='';filter='All';document.getElementById('q').value='';render()}

 else if(t.dataset.ra){var oo=S.orders.find(function(x){return x.id===t.dataset.id});if(oo&&oo.offer){if(t.dataset.ra==='accept')accept(oo);else decline(oo,'declined');save();render();drawList(true);drawMap()}}
 else if(t.id==='fitall')fitAll()
 else if(t.id==='resetdata'){try{localStorage.removeItem(KEY)}catch(e){}location.reload()}
 else if(t.id==='pause'){run=!run;t.textContent=run?'Pause stream':'Resume stream';var g=document.getElementById('stag');g.textContent=run?'Live · simulated':'Stream paused';g.className='tag'+(run?' live':'');say(run?'Location stream resumed.':'Location stream paused. Use Refresh now to update positions manually.')}
 else if(t.id==='refresh')tick(true)
 else if(t.dataset.m){metric=t.dataset.m;renderAnalytics()}
 else if(t.dataset.k!==undefined){var cs=t.dataset.ch;sel[cs]=sel[cs]===t.dataset.k?null:t.dataset.k;renderAnalytics()}
 else if(t.dataset.rs)restore(t.dataset.rs)
 else if(t.id==='simtoggle')toggleSim()
 else if(t.id==='exportcsv')exportCsv()
 else if(t.id==='neworder')addOrder()
 else if(t.id==='signout')signOut();
 else if(t.dataset.v)setView(t.dataset.v)});
document.getElementById('q').addEventListener('input',function(e){query=e.target.value;render()});
var W=640,H=500,BB={a:12.900,b:12.985,c:77.585,d:77.665},run=true;
var roads=[[0,110,640,110],[0,235,640,235],[0,360,640,360],[120,0,120,500],[300,0,300,500],[480,0,480,500],[0,470,640,150]];
function px(lat,lng){return[Math.max(16,Math.min(W-16,(lng-BB.c)/(BB.d-BB.c)*W)),Math.max(16,Math.min(H-16,(BB.b-lat)/(BB.b-BB.a)*H))]}
function eta(km){return km<.06?0:Math.max(1,Math.ceil(km/R.speed*60))}
function job(d){var t=S.trips.find(function(x){return x.driver===d.id});if(t)return{k:'deliver',id:t.id,to:t};var o=S.orders.find(function(x){return x.driver===d.id});return o?{k:'pickup',id:o.id,to:R}:null}
function liveNote(o){if(o.offer){var f=drv(o.offer.driver);return '<b>Waiting for '+f.name+' to accept</b> · '+hav(f.lat,f.lng,R.lat,R.lng).toFixed(1)+' km away<br>Time left '+fmt(Math.max(0,offerLim(o)-(S.clock-o.offer.t0)))+'. If not accepted, the next nearest free driver is asked.'}var d=S.drivers.find(function(x){return x.id===o.driver}),km=rem(d,{k:'pickup',id:o.id,to:R});return '<b>Assigned to '+d.name+'</b> · '+(km<.06?'arrived at the restaurant':km.toFixed(1)+' km from restaurant · pickup in about '+eta(km)+' min')+'<br>Customer ETA about '+(eta(km)+etaFor(o))+' min'+(o.handed?'<br>You handed it over. Waiting for the driver to confirm pickup.':o.pkd?'<br>Driver confirmed pickup. Waiting for your hand-over.':'')}
var G=null,AM,RC,map,rmk,cust=[],custKey='',dm={},lines={},lastSig='',mult=10,RT={};
var DC={D1:'#e11d48',D2:'#2563eb',D3:'#16a34a',D4:'#9333ea',D5:'#ea580c'};
var KEYG=(window.FD_CONFIG&&FD_CONFIG.MAPS_KEY_DASHBOARD)||'';
function rkey(d,j){return d.id+'>'+j.k+j.id}
function dcol(d,j){return DC[d.id]||'#5c3a2e'}
function mk(ic,lb,col,cls){var e=document.createElement('div');e.className='dm '+(cls||'');e.style.setProperty('--c',col);e.innerHTML='<div class="ic">'+ic+'</div>'+(lb?'<div class="lb">'+lb+'</div>':'');return e}
function showErr(m){var n=document.getElementById("mapnote");n.hidden=false;n.textContent="Google Routes API said: "+m+". Check that the Routes API is enabled and allowed in the key's API restrictions. Using OpenStreetMap road routing meanwhile."}
function getRoute(d,j){if(d.live)return liveRoute(d,j);if(!G)return{pending:true};var k=rkey(d,j);if(RT[k])return RT[k];
 if(j.k==='deliver'){var sl=sharedLeg(j);if(sl){RT[k]={pts:sl.pts.slice(),i:0};return RT[k]}}
 RT[k]={pending:true};
 var done=function(p){RT[k]=p?{pts:window.FDStore?FDStore.thin(p):p,i:0}:{failed:true};drawMap();drawList()};
 RC.computeRoutes({origin:{lat:d.lat,lng:d.lng},destination:{lat:j.to.lat,lng:j.to.lng},travelMode:'DRIVING',fields:['path']}).then(function(res){
  done(res.routes[0].path.map(function(q){return[typeof q.lat==='function'?q.lat():q.lat,typeof q.lng==='function'?q.lng():q.lng]}))}).catch(function(e){
  showErr(e&&e.message?e.message:'request failed');
  fetch('https://router.project-osrm.org/route/v1/driving/'+d.lng+','+d.lat+';'+j.to.lng+','+j.to.lat+'?overview=full&geometries=geojson').then(function(r){return r.json()}).then(function(x){done(x.routes[0].geometry.coordinates.map(function(c){return[c[1],c[0]]}))}).catch(function(){done(null)})});
 return RT[k]}
function rem(d,j){var r=RT[rkey(d,j)];if(!r||!r.pts)return hav(d.lat,d.lng,j.to.lat,j.to.lng);var k=0,p=[d.lat,d.lng];for(var i=r.i+1;i<r.pts.length;i++){k+=hav(p[0],p[1],r.pts[i][0],r.pts[i][1]);p=r.pts[i]}return k}
function step(d,j,km){var r=getRoute(d,j),b=.0056*mult;
 if(r.pts){while(b>0&&r.i<r.pts.length-1){var n=r.pts[r.i+1],sg=hav(d.lat,d.lng,n[0],n[1]);if(sg<=b){d.lat=n[0];d.lng=n[1];b-=sg;r.i++}else{var f=b/sg;d.lat+=(n[0]-d.lat)*f;d.lng+=(n[1]-d.lng)*f;b=0}}}
 else if(r.failed){var f2=Math.min(km,b)/km;d.lat+=(j.to.lat-d.lat)*f2;d.lng+=(j.to.lng-d.lng)*f2}}
function fitPts(pts){if(!G)return;var b=new G.LatLngBounds();pts.forEach(function(p){b.extend(p)});map.fitBounds(b,70)}
function fitAll(){fitPts([{lat:R.lat,lng:R.lng}].concat(S.drivers.map(function(d){return{lat:d.lat,lng:d.lng}})))}
function focusDriver(id){var d=S.drivers.find(function(x){return x.id===id});if(G&&d){map.panTo({lat:d.lat,lng:d.lng});map.setZoom(16)}}
function drawMap(){if(!G)return;var pts=[{lat:R.lat,lng:R.lng}];
 if(!rmk)rmk=new AM({map:map,position:{lat:R.lat,lng:R.lng},content:mk('R',P.rest,'#3e2518','rs'),zIndex:50});
 var cs=S.orders.filter(function(o){return o.status==='Ready'}).concat(S.trips),ck=cs.map(function(o){return o.id+(o.driver||'')}).join();
 if(ck!==custKey){custKey=ck;cust.forEach(function(m){m.map=null});cust=cs.map(function(o){return new AM({map:map,position:{lat:o.lat,lng:o.lng},content:mk('','#'+o.id,o.driver&&drv(o.driver)?dcol(drv(o.driver)):'#b9814f','cu'),zIndex:20})})}
 cs.forEach(function(o){pts.push({lat:o.lat,lng:o.lng})});
 S.drivers.forEach(function(d){var j=job(d),L=lines[d.id];
  if(j){var r=getRoute(d,j),path=(r.pts?[[d.lat,d.lng]].concat(r.pts.slice(r.i+1)):[[d.lat,d.lng],[j.to.lat,j.to.lng]]).map(function(p){return{lat:p[0],lng:p[1]}});
   if(!L)L=lines[d.id]=[new G.Polyline({strokeColor:'#fff',strokeWeight:9,strokeOpacity:.95,zIndex:1}),new G.Polyline({strokeWeight:5,zIndex:2})];
   L[0].setPath(path);L[1].setPath(path);L[1].setOptions({strokeColor:dcol(d),strokeOpacity:r.pts?1:.6});L[0].setMap(map);L[1].setMap(map)}
  else if(L){L[0].setMap(null);L[1].setMap(null)}
  pts.push({lat:d.lat,lng:d.lng});
  var lab=d.name+(j?' · '+eta(rem(d,j))+' min':d.hold?' · offer sent':d.available?(simBlocked(d)?' · paused':' · free'):' · off');
  if(!dm[d.id])dm[d.id]={cur:[d.lat,d.lng],m:new AM({map:map,position:{lat:d.lat,lng:d.lng},content:mk(d.name.charAt(0),lab,dcol(d,j)),zIndex:100})};
  var o=dm[d.id];o.tgt=[d.lat,d.lng];o.m.content.style.setProperty('--c',dcol(d,j));o.m.content.classList.toggle('hold',!!d.hold);o.m.content.querySelector('.lb').textContent=lab});
 var sig=Object.keys(RT).length+'|'+S.trips.length;if(sig!==lastSig){lastSig=sig;fitPts(pts)}}
(function anim(){Object.keys(dm).forEach(function(k){var o=dm[k];if(!o.tgt)return;o.cur[0]+=(o.tgt[0]-o.cur[0])*.12;o.cur[1]+=(o.tgt[1]-o.cur[1])*.12;o.m.position={lat:o.cur[0],lng:o.cur[1]}});requestAnimationFrame(anim)})();
/* if Google Maps can't be used for any reason, switch to OpenStreetMap so the map is never blank */
function useOsm(why){if(window.__osm)return;window.__osm=1;G=null;map=null;rmk=null;cust=[];custKey='';dm={};lines={};RT={};
 var el=document.getElementById('map'),n=document.getElementById('mapnote');el.innerHTML='';n.hidden=false;n.textContent=why+'. Showing OpenStreetMap instead. To use Google Maps, fix the key in js/config.js (Maps JavaScript API on, this site allowed in its referrer list).';
 FDOsm.load(function(){var o=FDOsm.build(el,{lat:R.lat,lng:R.lng},14);G=o.G;AM=o.AM;RC=o.RC;map=o.map;drawMap();drawList()},function(){el.innerHTML='<div class="empty" style="margin:16px">The map could not load. Check your internet connection.</div>'})}
window.gm_authFailure=function(){useOsm('Google Maps refused this key')};
window.gmReady=function(){Promise.all([google.maps.importLibrary('maps'),google.maps.importLibrary('marker'),google.maps.importLibrary('routes')]).then(function(l){
 G=google.maps;AM=l[1].AdvancedMarkerElement;RC=l[2].Route;
 map=new l[0].Map(document.getElementById('map'),{center:{lat:R.lat,lng:R.lng},zoom:14,mapId:'DEMO_MAP_ID',mapTypeControl:false,streetViewControl:false});

 drawMap();drawList()}).catch(function(){useOsm('Google Maps libraries failed to load')})};
document.getElementById('dl').addEventListener('click',function(e){if(e.target.closest('button'))return;var li=e.target.closest('li');if(li)focusDriver(li.dataset.focus)});
document.getElementById('dl').addEventListener('keydown',function(e){var li=e.target.closest('li');if(li&&e.key==='Enter')focusDriver(li.dataset.focus)});
var gs=document.createElement('script');gs.async=true;gs.src='https://maps.googleapis.com/maps/api/js?key='+KEYG+'&loading=async&callback=gmReady&v=weekly';gs.onerror=function(){useOsm('Google Maps could not be reached')};
if(KEYG){document.body.appendChild(gs);setTimeout(function(){if(!G&&!window.__osm)useOsm('Google Maps is taking too long to load')},9000)}else setTimeout(function(){useOsm('No Google Maps key is set')},0);
function drawList(force){if(!force&&document.querySelector('#dl button:hover'))return;document.getElementById('dl').innerHTML=S.drivers.map(function(d){var j=job(d),t;
 if(j){var km=rem(d,j);t=j.k==='pickup'?(km<.06?'Waiting at the restaurant for '+j.id:'Heading to restaurant for '+j.id+' · '+km.toFixed(1)+' km · ETA '+eta(km)+' min'):'Delivering '+j.id+' · '+km.toFixed(1)+' km to customer · ETA '+eta(km)+' min'}
 else t=d.hold?'Order offered · waiting for response':d.available?(simBlocked(d)?'Paused · a live driver is online':'Available · waiting for an order'):'Busy · no active order';
 var of=d.hold&&S.orders.find(function(x){return x.id===d.hold}),oh=of&&of.offer?'<br><span><b style="display:inline">Offer: #'+of.id+'</b> · '+fmt(Math.max(0,offerLim(of)-(S.clock-of.offer.t0)))+' left</span><div class="acts"><button class="btn sm" data-ra="accept" data-id="'+of.id+'">Accept (driver app)</button><button class="btn out sm" data-ra="decline" data-id="'+of.id+'">Decline</button></div>':'';return '<li data-focus="'+d.id+'" tabindex="0" style="cursor:pointer"><b><i class="dot" style="background:'+dcol(d,j)+'"></i>'+d.name+'</b><span>'+t+'</span><br><span>Position '+d.lat.toFixed(4)+', '+d.lng.toFixed(4)+'</span>'+oh+'</li>'}).join('');var c={a:0,p:0,d:0};S.drivers.forEach(function(d){var j=job(d);if(j)c[j.k==='pickup'?'p':'d']++;else if(d.available&&!d.hold&&!simBlocked(d))c.a++});document.getElementById('sum').textContent=c.a+' free · '+c.p+' to pickup · '+c.d+' delivering'}
function tick(force){if(!run&&force!==true)return;var done=false;S.clock=(S.clock||0)+mult;var ch=processOffers();
 S.drivers.forEach(function(d){if(d.live)return;var j=job(d);if(!j){if(d.available){d.lat+=(Math.random()-.5)*.0006*mult/10;d.lng+=(Math.random()-.5)*.0006*mult/10}return}var km=hav(d.lat,d.lng,j.to.lat,j.to.lng);
  var rr=RT[rkey(d,j)];if(km<.06||(rr&&rr.pts&&rr.i>=rr.pts.length-1)){if(j.k==='pickup'){var po=S.orders.find(function(x){return x.id===j.id});if(po&&po.shared&&!po.drvAt0&&window.FDStore){po.drvAt0=1;FDStore.advance(po.id,'Picked up','driver')}}
  if(j.k==='deliver'){var tr=S.trips.find(function(x){return x.id===j.id});if(tr&&tr.shared&&window.FDStore)FDStore.advance(j.id,'Delivered','driver');S.trips=S.trips.filter(function(x){return x.id!==j.id});d.available=true;S.stats.delivered++;S.stats.byDriver[d.id]=(S.stats.byDriver[d.id]||0)+1;log(j.id+' delivered by '+d.name);say(j.id+' was delivered by '+d.name+'. The driver is available again.','ok');done=true}return}
  step(d,j,km)});
 if(done||ch){if(done)S.orders.filter(function(o){return o.status==='Ready'&&!o.driver&&!o.offer}).forEach(dispatch);save();render()}
 else{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}
  document.querySelectorAll('[data-live]').forEach(function(n){var o=S.orders.find(function(x){return x.id===n.dataset.live});if(o&&(o.driver||o.offer))n.innerHTML=liveNote(o)})}
 drawMap();drawList()}
var view='orders',PRICE={'Veg Biryani':220,'Butter Naan':45,'Paneer Butter Masala':280,'Gulab Jamun':90,'Masala Chai':40};
function $(i){return document.getElementById(i)}
function saveP(){try{localStorage.setItem(PK,JSON.stringify(P))}catch(e){}}
function inr(n){return '\u20b9'+Math.round(n).toLocaleString('en-IN')}
function hrOf(t){var m=/(\d+):\d+\s*(AM|PM)/i.exec(t||'');if(!m)return 12;var h=+m[1]%12;if(/PM/i.test(m[2]))h+=12;return h}
var PAL=['#D36228','#DAA520','#6E6F33','#B3342C','#4E6E58','#2C3E50','#B66E41','#8A3324'],REDS=['#B3342C','#D36228','#8A3324','#B66E41','#6E6F33'],sel={},metric='orders';
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function pItem(s){var m=/^(\d+)\s*\u00d7\s*(.+)$/.exec(s);return m?[m[2],+m[1]]:[s,1]}
function orderValue(o){var v=0;o.items.forEach(function(s){var p=pItem(s);v+=pr(p[0])*p[1]});return v}
function addTo(a,o){var h=hrOf(o.at),v=orderValue(o);a.hourly[h]=(a.hourly[h]||0)+1;a.sh[h]=(a.sh[h]||0)+v;
 o.items.forEach(function(s){var p=pItem(s);a.items[p[0]]=(a.items[p[0]]||0)+p[1]});
 a.areas[o.area]=(a.areas[o.area]||0)+1;a.sa[o.area]=(a.sa[o.area]||0)+v}
function hz(el,obj,lim,lab,money,zero,cols){var all=Object.keys(obj),k=all.filter(function(x){return zero||obj[x]>0}).sort(function(x,y){return obj[y]-obj[x]}).slice(0,lim),mx=Math.max(1,k.length?obj[k[0]]:1),tot=0,s=sel[el];
 all.forEach(function(x){tot+=obj[x]});var box=$(el);box.className='hz'+(s?' has-sel':'');
 box.innerHTML=k.length?k.map(function(x){var t=lab?lab(x):x,c=(cols||PAL)[all.indexOf(x)%(cols||PAL).length],v=money?inr(obj[x]):obj[x];
  return '<button type="button" class="'+(s===x?'sel':'')+'" data-ch="'+el+'" data-k="'+esc(x)+'" aria-pressed="'+(s===x)+'" title="'+esc(t)+': '+v+' ('+Math.round(tot?obj[x]/tot*100:0)+'% of total)"><span>'+esc(t)+'</span><span class="trk"><i style="width:'+(obj[x]?Math.max(4,obj[x]/mx*100):0)+'%;background:'+c+'"></i></span><b>'+v+'</b></button>'}).join(''):'<p class="meta">No data yet.</p>';
 var c2=$(el+'-c');if(c2)c2.textContent=s&&obj[s]!=null?(lab?lab(s):s)+': '+(money?inr(obj[s]):obj[s])+' \u00b7 '+Math.round(tot?obj[s]/tot*100:0)+'% of the total. Tap again to clear.':'Tap a bar to see its share of the total.'}
function kp(id,K){$(id).innerHTML=K.map(function(k){return '<div class="kpi"><span>'+k[0]+'</span><b>'+k[1]+'</b><small>'+k[2]+'</small></div>'}).join('')}
function renderAnalytics(){var a=JSON.parse(JSON.stringify(S.stats));S.orders.forEach(function(o){addTo(a,o)});
 var rec=0,sales=0,i,hs=[],mx=1,sm=metric==='sales',isl={},nc=S.cancelled.length,q={'New orders':0,'Preparing':0,'Ready for pickup':0,'On the road':S.trips.length};
 Object.keys(a.hourly).forEach(function(k){rec+=a.hourly[k]});
 Object.keys(a.items).forEach(function(n){var v=pr(n)*a.items[n];sales+=v;isl[n]=v});
 S.orders.forEach(function(o){q[o.status==='Placed'?'New orders':o.status==='Ready'?'Ready for pickup':'Preparing']++});
 var acc=a.acc.length?a.acc.reduce(function(x,y){return x+y},0)/a.acc.length:0;
 kp('kpis',[['Orders received',rec+nc,nc+' cancelled'],['Delivered',a.delivered,S.trips.length+' on the road now'],['Sales',inr(sales),'cancelled orders excluded'],['Average order',inr(rec?sales/rec:0),'per order'],['In the kitchen',S.orders.length,q['New orders']+' new \u00b7 '+q['Preparing']+' preparing \u00b7 '+q['Ready for pickup']+' ready'],['Driver acceptance',acc?fmt(acc):'\u2013','average time to accept'],['Cancelled',nc,Math.round(rec+nc?nc/(rec+nc)*100:0)+'% cancel rate \u00b7 '+inr(S.cancelled.reduce(function(t,o){return t+orderValue(o)},0))+' lost'],['Acceptance rate',Math.round((rec-q['New orders'])/Math.max(1,rec+nc)*100)+'%',q['New orders']+' waiting to be accepted']]);
 document.querySelectorAll('#mt button').forEach(function(b){b.setAttribute('aria-pressed',b.dataset.m===metric)});
 var src=sm?a.sh:a.hourly;for(i=11;i<=21;i++){var v=src[i]||0;hs.push(v);if(v>mx)mx=v}
 var pi=hs.indexOf(Math.max.apply(null,hs)),sh=sel['a-hour'],hb=$('a-hour');hb.className='hb'+(sh?' has-sel':'');
 function lb(h){return ((h%12)||12)+(h<12?' AM':' PM')}
 function val(v){return sm?inr(v):v+' orders'}
 hb.innerHTML=hs.map(function(v,j){var h=11+j,on=String(h)===sh;return '<button type="button" class="'+(on?'sel ':'')+(j===pi&&v?'pk':'')+'" data-ch="a-hour" data-k="'+h+'" aria-pressed="'+on+'" title="'+lb(h)+': '+val(v)+'"><b>'+(sm?(v?(v/1000).toFixed(1)+'k':'0'):v)+'</b><i style="height:'+Math.round(v/mx*130)+'px"></i><span>'+((h%12)||12)+(h<12?'a':'p')+'</span></button>'}).join('');
 var tot=hs.reduce(function(x,y){return x+y},0),ph=11+pi;
 $('a-peak').textContent=sh&&hs[sh-11]!=null?lb(+sh)+': '+val(hs[sh-11])+' \u00b7 '+Math.round(tot?hs[sh-11]/tot*100:0)+'% of the day. Tap again to clear.':(hs[pi]?'Busiest hour so far: '+lb(ph)+' with '+val(hs[pi])+'. Tap a bar for details.':'No orders yet today.');
 hz('a-items',sm?isl:a.items,6,null,sm);hz('a-area',sm?a.sa:a.areas,6,null,sm);hz('a-drv',a.byDriver,5,function(x){return dName(x)||x});hz('a-q',q,4,null,false,true,['#2C3E50','#D36228','#4E6E58','#DAA520']);
 $('a-miss').textContent=(a.missed||0)+' driver offers were declined or timed out today.';
 $('a-date').textContent=new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'});renderReceived();renderCancelled()}
function renderReceived(){var h=0,pl=0,nc=S.cancelled.length;Object.keys(S.stats.hourly).forEach(function(k){h+=S.stats.hourly[k]});S.orders.forEach(function(o){if(o.status==='Placed')pl++});
 var tot=h+S.orders.length+nc;
 hz('a-fun',{'Received':tot,'Accepted':h+S.orders.length-pl,'Handed to drivers':h,'Delivered':S.stats.delivered,'Cancelled':nc},5,null,false,true,['#2C3E50','#D36228','#DAA520','#4E6E58','#B3342C']);
 var SC={Placed:['New','#2C3E50'],Accepted:['Accepted','#D36228'],Preparing:['Preparing','#D36228'],Ready:['Ready','#4E6E58']};
 var L=S.orders.slice().sort(function(x,y){return(+String(y.id).replace(/\D/g,''))-(+String(x.id).replace(/\D/g,''))}).slice(0,6);
 $('a-recent').innerHTML=L.length?L.map(function(o){var c=SC[o.status]||['',''];c=SC[o.status]||['Preparing','#D36228'];return '<article class="crow" style="border-left-color:'+c[1]+'"><div><b>#'+esc(o.id)+'</b> \u00b7 '+esc(o.cust)+'<div class="meta">'+esc(o.items.join(' \u00b7 '))+' \u00b7 '+esc(o.area)+'</div><div class="meta">Received '+esc(o.at)+'</div></div><div class="cside"><span class="badge" style="background:'+c[1]+';color:#fff">'+c[0]+'</span><b>'+inr(orderValue(o))+'</b></div></article>'}).join(''):'<div class="empty">No orders in the queue right now.</div>'}
function renderCancelled(){var L=S.cancelled,lost=0,why={},it={},rec=0;
 Object.keys(S.stats.hourly).forEach(function(k){rec+=S.stats.hourly[k]});rec+=S.orders.length+L.length;
 L.forEach(function(o){lost+=orderValue(o);why[o.reason]=(why[o.reason]||0)+1;o.items.forEach(function(s){var p=pItem(s);it[p[0]]=(it[p[0]]||0)+p[1]})});
 var top=Object.keys(why).sort(function(x,y){return why[y]-why[x]})[0];
 hz('c-why',why,5,null,false,false,REDS);hz('c-items',it,5,null,false,false,['#8A3324','#B3342C','#D36228','#B66E41','#6E6F33']);
 var fr=sel['c-why'],fi=sel['c-items'],shown=L.filter(function(o){return(!fr||o.reason===fr)&&(!fi||o.items.some(function(s){return pItem(s)[0]===fi}))});
 $('c-count').textContent=shown.length===L.length?'Showing all '+L.length+' cancelled orders.':'Showing '+shown.length+' of '+L.length+' (filtered). Tap the selected bar again to clear.';
 $('c-list').innerHTML=shown.length?shown.map(function(o){return '<article class="crow"><div><b>#'+esc(o.id)+'</b> \u00b7 '+esc(o.cust)+'<div class="meta">'+esc(o.items.join(' \u00b7 '))+' \u00b7 '+esc(o.area)+'</div><div class="meta">Placed '+esc(o.at)+' \u00b7 Cancelled '+esc(o.when)+'</div></div><div class="cside"><span class="badge">'+esc(o.reason)+'</span><b>'+inr(orderValue(o))+'</b><button class="btn out sm" data-rs="'+esc(o.id)+'">Restore order</button></div></article>'}).join(''):'<div class="empty">No cancelled orders to show. Cancelled orders appear here with the reason.</div>';}
function restore(id){var i=S.cancelled.findIndex(function(o){return o.id===id});if(i<0)return;var o=S.cancelled.splice(i,1)[0];
 S.orders.push({id:o.id,cust:o.cust,items:o.items,area:o.area,at:o.at,status:'Placed',lat:o.lat,lng:o.lng,prep:o.prep||20});log(id+' restored from cancelled');save();render();say('Order '+id+' restored to New orders.','ok')}
var AREAS=[['Koramangala',12.9279,77.6271],['HSR Layout',12.9116,77.6389],['Indiranagar',12.9784,77.6408],['BTM Layout',12.9166,77.6101],['Jayanagar',12.9250,77.5938]],NAMES=['Asha P.','Vikram S.','Lakshmi N.','Imran K.','Tara M.','Rohit B.'];
function addOrder(o){o=o||{};var ar=AREAS[Math.floor(Math.random()*AREAS.length)],menu=Object.keys(PRICE),its=o.items;
 if(!its){its=[];var n=1+Math.floor(Math.random()*2);while(its.length<n){var m=menu[Math.floor(Math.random()*menu.length)];if(!its.some(function(x){return x.indexOf(m)>-1}))its.push((1+Math.floor(Math.random()*2))+'\u00d7 '+m)}}
 S.nextId=S.nextId||1048;var id=o.id||'FD-'+(S.nextId++);
 S.orders.push({id:id,cust:o.cust||NAMES[Math.floor(Math.random()*NAMES.length)],items:its,area:o.area||ar[0],at:now(),status:'Placed',lat:o.lat||ar[1],lng:o.lng||ar[2],prep:o.prep||15+Math.floor(Math.random()*15)});
 log(id+' placed');save();render();say('New order '+id+' received. Accept it to start the kitchen clock.','ok');return id}
function paintP(){$('pname').textContent=P.name;$('prole').textContent=P.role;$('av').textContent=P.name.charAt(0).toUpperCase();
 document.querySelectorAll('.js-rest').forEach(function(n){n.textContent=P.rest});document.title='FoodDispatch \u00b7 '+P.rest;
 if(rmk)rmk.content.querySelector('.lb').textContent=P.rest;
 $('pf-av').textContent=P.name.charAt(0).toUpperCase();$('pf-name').textContent=P.name;$('pf-rn').textContent=P.rest;$('pf-rr').textContent=P.role;$('pf-role').textContent='Signed in as '+P.role;$('pf-since').textContent=P.since||'\u2013'}
function fillForm(){$('f-name').value=P.name;$('f-rest').value=P.rest;$('f-role').value=P.role;$('f-email').value=P.email||'';$('f-phone').value=P.phone||'';$('pf-msg').hidden=true}
function setView(v){view=v;['orders','analytics','profile'].forEach(function(n){$('v-'+n).hidden=n!==v});
 document.querySelectorAll('.nav button').forEach(function(b){if(b.dataset.v===v)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')});
 if(v==='analytics')renderAnalytics();if(v==='profile')fillForm();
 if(v==='orders'&&G&&map)setTimeout(function(){G.event.trigger(map,'resize');fitAll()},60);window.scrollTo(0,0)}
function signOut(){try{localStorage.removeItem('fooddispatch_session')}catch(e){}window.FD_LOGIN_URL=window.FD_LOGIN_URL||'index.html#auth';P.in=false;P.name='';P.since='';saveP();var u=window.FD_LOGIN_URL;if(u){location.href=u;return}P.name='Guest';paintP();say('Signed out. Set window.FD_LOGIN_URL to send people to your login page.')}
function setUser(u){if(!u)return;['name','role','email','phone'].forEach(function(k){if(u[k])P[k]=String(u[k])});if(u.restaurant||u.rest)P.rest=String(u.restaurant||u.rest);P.in=true;if(!P.since)P.since=now();saveP();paintP()}
window.FoodDispatch={setUser:setUser,addOrder:function(o){return addOrder(o)},updateStats:function(x){Object.assign(S.stats,x||{});save();render()}};
$('pf-form').addEventListener('submit',function(e){e.preventDefault();var n=$('f-name').value.trim(),m=$('pf-msg');m.hidden=false;
 if(!n){m.className='msg err';m.textContent='Please enter your name.';return}
 P.name=n;P.rest=$('f-rest').value.trim()||'Spice Route Kitchen';P.role=$('f-role').value;P.email=$('f-email').value.trim();P.phone=$('f-phone').value.trim();saveP();paintP();syncShared();
 m.className='msg ok';m.textContent='Profile saved. Your name now shows in the header.'});
(function(){var q=new URLSearchParams(location.search);setUser(window.FD_USER);
 var su=window.FDSession&&FDSession.forRole('Restaurant');if(su){P.email=su.email;if(FDSession.fresh('restaurant',su)){P.name=FDSession.nameOf(su);P.phone='';P.in=true;P.since=now();saveP()}}
 if(q.get('name'))setUser({name:q.get('name'),restaurant:q.get('restaurant'),role:q.get('role')});
 if(!P.name)P.name='Guest';if(!P.since)P.since=now();paintP();setView('orders');say('Welcome, '+(P.name.split(' ')[0]||P.name)+'. Accept new orders to start the kitchen clock.')})();
/* ---- shared orders: Customer, Restaurant and Driver talk through FDStore (fooddispatch_orders) ---- */
var AR={};
function simBlocked(d,o){return !d.live&&!!S.liveOn&&!S.simAlso&&!(o&&o.cx&&o.cx.indexOf('LIVE')>-1)}   // when a real driver is online, offers go to them, not to the simulated ones
function paintSim(){var b=$('simtoggle');if(!b)return;b.hidden=!S.liveOn;b.textContent=S.simAlso?'Simulated drivers: also dispatching':'Simulated drivers: paused';b.title='A live driver is online. Click to '+(S.simAlso?'pause':'include')+' the simulated drivers in dispatch.'}
function toggleSim(){S.simAlso=!S.simAlso;save();paintSim();render();say(S.simAlso?'Simulated drivers will also get offers.':'Only the live driver gets offers while they are online.','ok')}
function shPick(o,dr){if(!window.FDStore)return 'done';var r=FDStore.advance(o.id,'Picked up','restaurant',{driver:driverRec(dr)});if(!r.ok){say(r.msg,'err');syncShared();save();render();return false}return r.pending?'pending':'done'}
function autoReply(r){var d=r.driver&&r.driver.id!=='LIVE'?drv(r.driver.id):null;if(!d)return;var m=FDStore.thread(r,'restaurant','driver'),l=m[m.length-1];
 if(l&&l.from==='restaurant'&&!AR[r.id+l.at]){AR[r.id+l.at]=1;setTimeout(function(){FDStore.addMsg(r.id,'driver','restaurant','Got it, thanks. (simulated driver '+d.name+')')},2000)}}
function sharedLeg(j){var r=window.FDStore&&FDStore.get(j.id);r=r&&r.route;if(!r)return null;var pts=j.k==='deliver'?r.deliver:(j.k==='pickup'&&r.pickupDriver==='LIVE'?r.pickup:null);return pts&&pts.length>1?{pts:pts,sig:j.k+pts.length+pts[0]+pts[pts.length-1]}:null}
function liveRoute(d,j){var sl=sharedLeg(j);if(!sl)return{pending:true};var k=rkey(d,j),c=RT[k];if(!c||c.sig!==sl.sig)c=RT[k]={pts:sl.pts.slice(),i:0,sig:sl.sig};
 var b=1e9,bi=0;c.pts.forEach(function(p,i){var x=hav(d.lat,d.lng,p[0],p[1]);if(x<b){b=x;bi=i}});c.i=bi;return c}   // the live driver moves on their own page; we only draw their shared route

var PLATES={D1:'KA 01 FD 4821',D2:'KA 03 FD 1175',D3:'KA 05 FD 9034',D4:'KA 02 FD 6618',D5:'KA 04 FD 2740'};
var AREA2=[['Whitefield',12.9698,77.7500],['Marathahalli',12.9591,77.6974],['Varthur',12.9390,77.7410],['ITPL',12.9850,77.7270],['Hoodi',12.9910,77.7160],['Brookefield',12.9660,77.7180],['Kadugodi',12.9980,77.7600]].concat(AREAS);
function pr(n){return PRICE[n]||(S.px&&S.px[n])||150}
function areaOf(ll){var b='Drop-off pin',bd=8;AREA2.forEach(function(a){var k=hav(ll[0],ll[1],a[1],a[2]);if(k<bd){bd=k;b=a[0]}});return b}
function tOf(ms){return new Date(ms).toLocaleTimeString('en-IN',{hour:'numeric',minute:'2-digit'}).toUpperCase()}
function plateOf(d){return d.live?(d.plate||'-'):(PLATES[d.id]||'KA 01 FD 0000')}
var PHONES={D1:'9800000111',D2:'9800000112',D3:'9800000113',D4:'9800000114',D5:'9800000115'};   // demo numbers for the simulated drivers
function driverRec(d){return{id:d.id,name:d.name,plate:plateOf(d),phone:d.live?(d.phone||''):(PHONES[d.id]||'')}}
function mineShared(r){return r.src==='customer'&&String(r.k||'').trim().toLowerCase()===String(P.rest).trim().toLowerCase()}
/* run a status change through the shared rules first; local-only demo orders skip this */
function sh(o,next,extra){if(!o.shared||!window.FDStore)return true;var r=FDStore.advance(o.id,next,'restaurant',extra);if(r.ok)return true;say(r.msg,'err');syncShared();save();render();return false}
function fromShared(r){S.px=S.px||{};var C=FDStore.clean,ls=r.lines||[];ls.forEach(function(l){S.px[C(l.n)]=+l.p||0});
 return{id:r.id,cust:C(r.name,60)||'Customer',items:ls.length?ls.map(function(l){return (+l.q||1)+'\u00d7 '+C(l.n)}):[C(r.items)],area:areaOf(r.drop),at:tOf(r.createdAt||Date.now()),status:r.status,lat:r.drop[0],lng:r.drop[1],prep:r.prep||15,shared:true}}
function releaseHold(o){S.drivers.forEach(function(d){if(d.hold===o.id)delete d.hold});if(o.driver){var dd=drv(o.driver);if(dd&&!dd.live)dd.available=true}}
/* the kitchen's position comes from its orders; idle simulated drivers are placed around it */
function setKitchen(p){if(hav(R.lat,R.lng,p[0],p[1])<.2)return;
 R.lat=p[0];R.lng=p[1];S.kitchen=[p[0],p[1]];RT={};
 var off=[[.012,-.008],[-.018,.010],[.006,.016],[-.010,-.014]],i=0;
 S.drivers.forEach(function(d){if(d.live||d.hold||job(d))return;var q=off[i++%off.length];d.lat=p[0]+q[0];d.lng=p[1]+q[1]});
 if(rmk)rmk.position={lat:p[0],lng:p[1]};setTimeout(fitAll,50)}
/* the person on the driver page joins the dispatch pool while their page is open */
function syncLive(){var rec=FDStore.liveDriver(),i=-1,d=null,wasOn=S.liveOn;S.liveOn=!!rec;if(wasOn!==S.liveOn)paintSim();
 S.drivers.forEach(function(x,k){if(x.live){i=k;d=x}});
 var busy=S.orders.some(function(o){return o.driver==='LIVE'})||S.trips.some(function(t){return t.driver==='LIVE'});
 if(!rec){if(d&&!busy&&!d.hold){S.drivers.splice(i,1);if(dm.LIVE){dm.LIVE.m.map=null;delete dm.LIVE}if(lines.LIVE){lines.LIVE[0].setMap(null);lines.LIVE[1].setMap(null);delete lines.LIVE}}else if(d)d.available=false;return}
 if(!d){d={id:'LIVE',live:true,rt:null};S.drivers.push(d)}
 d.name=rec.name;d.plate=rec.plate;d.phone=rec.phone;d.lat=rec.lat;d.lng=rec.lng;d.available=!!rec.available&&!busy;d.why=busy?'trip':(rec.available?'':'off')}
function syncShared(){if(!window.FDStore)return;
 FDStore.putRestaurant(P.rest,P.phone);
 var all=FDStore.all(),mine=all.filter(mineShared),ch=false,live=mine.filter(function(r){return r.status!=='Delivered'&&r.status!=='Cancelled'&&r.rpos});
 if(live.length)setKitchen(live[0].rpos);
 /* leftovers: this page remembers orders/trips for drivers, but the shared order no longer exists (data cleared, reset, restart). After a short grace period forget them so the driver is not stuck as busy */
 var MS=(window.__fdMissing=window.__fdMissing||{}),nowT=Date.now(),gone=function(id){if(all.some(function(x){return x.id===id})){delete MS[id];return false}MS[id]=MS[id]||nowT;return nowT-MS[id]>5000};
 S.orders=S.orders.filter(function(o){if(!o.shared||!gone(o.id))return true;releaseHold(o);log(o.id+' no longer exists in the shared orders, cleared');ch=true;return false});
 S.trips=S.trips.filter(function(t){if(!t.shared||!gone(t.id))return true;var dd=drv(t.driver);if(dd&&!dd.live)dd.available=true;log(t.id+' trip no longer exists in the shared orders, cleared');ch=true;return false});
 syncLive();
 var lsig=S.drivers.filter(function(x){return x.live}).map(function(x){return x.name+'|'+x.available+'|'+x.why+'|'+!!x.hold}).join(';');if(lsig!==window.__fdLsig){window.__fdLsig=lsig;ch=true}   // redraw the driver list when the live driver comes, goes, or changes availability
 S.orders=S.orders.filter(function(o){if(!o.shared)return true;var r=all.find(function(x){return x.id===o.id});if(!r||mineShared(r))return true;releaseHold(o);ch=true;return false});   // profile switched to another restaurant
 mine.forEach(function(r){
  var L=S.orders.find(function(x){return x.id===r.id}),T=S.trips.find(function(x){return x.id===r.id});
  if(r.status==='Cancelled'){if(L){S.orders=S.orders.filter(function(x){return x!==L});releaseHold(L);S.cancelled.unshift({id:L.id,cust:L.cust,items:L.items,area:L.area,at:L.at,when:now(),reason:'Customer request',lat:L.lat,lng:L.lng,prep:L.prep});log(r.id+' cancelled by the customer');say('Order '+r.id+' was cancelled by the customer.','ok');ch=true}return}
  if(!L&&!T){
   if(r.status==='Delivered'||S.cancelled.some(function(c){return c.id===r.id}))return;
   if(r.status==='Picked up'){if(r.driver&&drv(r.driver.id)){S.trips.push({id:r.id,driver:r.driver.id,lat:r.drop[0],lng:r.drop[1],shared:true});ch=true}return}
   L=fromShared(r);if(r.status==='Ready'&&r.driver&&drv(r.driver.id))L.driver=r.driver.id;
   S.orders.push(L);log(r.id+' placed');say('New order '+r.id+' received from '+L.cust+'. Accept it to start the kitchen clock.','ok');ch=true;return}
  autoReply(r);
  if(L){L.pkd=!!(r.pk&&r.pk.driver);L.handed=!!(r.pk&&r.pk.restaurant);
   if(L.pushedDrv&&L.driver===L.pushedDrv&&!r.driver&&r.status==='Ready'&&L.status==='Ready'){   // the driver cancelled: back to dispatch
    var gone=L.driver,gd=drv(gone);L.tried=L.tried||[];if(L.tried.indexOf(gone)<0)L.tried.push(gone);L.cx=L.cx||[];if(L.cx.indexOf(gone)<0)L.cx.push(gone);L.driver=null;delete L.pushedDrv;L.handed=false;L.pkd=false;L.drvAt0=0;if(gd&&!gd.live)gd.available=true;
    log(r.id+' · '+dName(gone)+' cancelled the delivery');say(dName(gone)+' cancelled '+r.id+'. Looking for the next nearest driver.','err');dispatch(L);ch=true}
   if(r.offerResp){var rs=r.offerResp;FDStore.patch(r.id,{offerResp:null});
    if(L.offer&&L.offer.driver==='LIVE'){if(rs==='accept')accept(L);else decline(L,'declined');ch=true}}
   if(r.status==='Picked up'&&L.status==='Ready'){   // the live driver confirmed pickup on the driver page
    if(!L.driver&&r.driver&&drv(r.driver.id))L.driver=r.driver.id;
    S.orders=S.orders.filter(function(x){return x!==L});addTo(S.stats,L);S.trips.push({id:L.id,driver:L.driver,lat:L.lat,lng:L.lng,shared:true});
    log(r.id+' picked up by '+dName(L.driver));say(r.id+' was picked up by '+dName(L.driver)+'.','ok');ch=true}}
  if(T&&r.status==='Delivered'){S.trips=S.trips.filter(function(x){return x!==T});var d2=drv(T.driver);if(d2&&!d2.live)d2.available=true;
   S.stats.delivered++;S.stats.byDriver[T.driver]=(S.stats.byDriver[T.driver]||0)+1;log(r.id+' delivered by '+dName(T.driver));say(r.id+' was delivered by '+dName(T.driver)+'.','ok');ch=true}});
 /* the real driver just opened the driver page (or became available): orders that are Ready but not yet collected by a simulated driver go to them first */
 var la=S.drivers.some(function(x){return x.live&&x.available});
 if(la&&!prevLiveAv&&reofferToLive())ch=true;
 prevLiveAv=la;
 if(ch){save();render();drawList(true);drawMap()}}
var prevLiveAv=false;
function reofferToLive(){var moved=false;
 S.orders.forEach(function(o){if(!o.shared||o.status!=='Ready'||o.pkd||o.handed)return;
  var d=o.driver?drv(o.driver):null,of=o.offer?drv(o.offer.driver):null;
  if((d&&d.live)||(of&&of.live))return;                       // already with the live driver
  var rec=FDStore.get(o.id);if(!rec||rec.status!=='Ready'||(rec.pk&&(rec.pk.driver||rec.pk.restaurant)))return;   // pickup already under way: leave it
  releaseHold(o);o.driver=null;delete o.offer;delete o.pushedDrv;o.drvAt0=0;o.tried=[];
  FDStore.patch(o.id,{driver:null,offer:null,offerResp:null,dpos:null,driverAt:null});
  var r=offer(o);log(o.id+' moved to the live driver');say(o.id+': '+(r||'the live driver page is open, waiting for a free driver.'),'ok');moved=true});
 return moved}
/* driver, position and ETA go back to the shared order so the customer can track it */
function pushShared(){if(!window.FDStore)return;var m={};
 S.orders.forEach(function(o){if(!o.shared)return;var d=o.driver?drv(o.driver):null,of=o.offer?drv(o.offer.driver):null,f={},cur=FDStore.get(o.id);
  f.driver=d?driverRec(d):null;
  f.offer=of?{driverId:of.id,expiresAt:Date.now()+Math.max(0,offerLim(o)-(S.clock-o.offer.t0))*1000/mult}:null;
  if(d)o.pushedDrv=d.id;
  if(d&&cur&&!cur.driverAt)f.driverAt=Date.now();
  if(d&&!d.live){f.dpos=[d.lat,d.lng];f.etaAt=Date.now()+(eta(rem(d,{k:'pickup',id:o.id,to:R}))+eta(hav(R.lat,R.lng,o.lat,o.lng)))*60000/mult}
  m[o.id]=f});
 S.trips.forEach(function(t){if(!t.shared)return;var d=drv(t.driver);if(d&&!d.live)m[t.id]={dpos:[d.lat,d.lng],etaAt:Date.now()+eta(rem(d,{k:'deliver',id:t.id,to:t}))*60000/mult}});
 FDStore.patchMany(m);
 /* routes: this page draws the delivery leg once for everyone and the simulated driver's pickup leg; the live driver page supplies its own pickup leg */
 S.orders.forEach(function(o){if(!o.shared)return;var cur=FDStore.get(o.id),rt=(cur&&cur.route)||{};
  if(!rt.deliver&&G){var lg=getRoute({id:'RT-'+o.id,lat:R.lat,lng:R.lng},{k:'leg',id:o.id,to:{lat:o.lat,lng:o.lng}});if(lg.pts)FDStore.setRoute(o.id,'deliver',lg.pts)}
  var d=o.driver?drv(o.driver):null;
  if(d&&!d.live&&rt.pickupDriver!==d.id){var rp=RT[rkey(d,{k:'pickup',id:o.id})];if(rp&&rp.pts)FDStore.setRoute(o.id,'pickup',rp.pts,d.id)}})}
/* export exactly the rows on the board: current status filter and search */
function visibleRows(){return S.orders.filter(match).filter(function(o){var c=o.status==='Placed'?'New':o.status==='Ready'?'Ready':'Preparing';return filter==='All'||filter===c})}
function csvCell(v){v=String(v==null?'':v);if(/^[=+\-@\t\r]/.test(v))v="'"+v;return /[",\n\r]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v}
function exportCsv(){var rows=visibleRows();
 if(!rows.length){say('Nothing to export: no orders are visible with the current filter and search.','err');return}
 var head=['Order ID','Status','Customer','Items','Area','Placed at','Driver','Value (INR)'],
  data=rows.map(function(o){return [o.id,o.status,o.cust,o.items.join('; '),o.area,o.at,o.driver?dName(o.driver):(o.offer?dName(o.offer.driver)+' (offered)':''),orderValue(o)]}),
  csv='\ufeff'+[head].concat(data).map(function(r){return r.map(csvCell).join(',')}).join('\r\n'),
  u=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');
 a.href=u;a.download='fooddispatch-orders-'+new Date().toISOString().slice(0,10)+'.csv';document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(u)},1500);
 say('Exported '+rows.length+' order'+(rows.length>1?'s':'')+' ('+(filter==='All'?'all columns':filter+' only')+(query.trim()?', search \u201c'+query.trim().replace(/[<>&]/g,'')+'\u201d':'')+').','ok')}
/* ---- kitchen switcher: customers can order from any restaurant, so this page can show any kitchen's queue ---- */
var kSig='';
function kitchenNames(){var ns=FDStore.KITCHENS.map(function(k){return k.n});if(ns.map(function(n){return n.toLowerCase()}).indexOf(String(P.rest).trim().toLowerCase())<0)ns.push(P.rest);return ns}
function paintKitchen(){if(!window.FDStore||!FDStore.KITCHENS)return;FDStore.ping('restaurant');autoFollow();var fo=$('kfollow');if(fo&&document.activeElement!==fo)fo.checked=P.follow!==false;var sel=$('kitchen'),cnt=FDStore.openByKitchen(),cur=String(P.rest).trim().toLowerCase(),names=kitchenNames(),
 others=names.filter(function(n){return n.toLowerCase()!==cur&&cnt[n.toLowerCase()]}),
 sig=P.rest+'|'+names.map(function(n){return n+':'+(cnt[n.toLowerCase()]||0)}).join(',');
 if(sig===kSig)return;if(document.activeElement===sel&&sel.options.length)return;kSig=sig;
 sel.innerHTML='';names.forEach(function(n){var o=document.createElement('option'),c=cnt[n.toLowerCase()]||0;o.value=n;o.textContent=n+(c?' ('+c+' open)':'');if(n.toLowerCase()===cur)o.selected=true;sel.appendChild(o)});
 var h=$('khint');h.textContent='';
 if(others.length){h.appendChild(document.createTextNode('Orders waiting at '+others.map(function(n){return n+' ('+cnt[n.toLowerCase()]+')'}).join(', ')+'.'));
  var b=document.createElement('button');b.type='button';b.textContent='Switch to '+others[0];b.setAttribute('data-k',others[0]);h.appendChild(b)}}
/* "Follow new orders": when this kitchen has nothing open and a customer places an order at another kitchen, show that kitchen automatically */
function autoFollow(){if(P.follow===false||!window.FDStore)return;
 var all=FDStore.all();if(all.some(function(r){return mineShared(r)&&r.status!=='Delivered'&&r.status!=='Cancelled'}))return;
 if(S.orders.some(function(o){return o.shared})||S.trips.some(function(t){return t.shared}))return;
 var c=all.filter(function(r){return r.src==='customer'&&r.status==='Placed'&&r.k}).sort(function(a,b){return (a.createdAt||0)-(b.createdAt||0)})[0];if(!c)return;
 switchKitchen(c.k);say('New order '+c.id+' arrived for '+c.k+', so this page now shows that kitchen.','ok')}
function switchKitchen(name){name=String(name||'').trim();if(!name||name.toLowerCase()===String(P.rest).trim().toLowerCase()){kSig='';paintKitchen();return}
 P.rest=name;saveP();paintP();if(view==='profile')fillForm();
 var k=FDStore.KITCHENS.filter(function(x){return x.n.toLowerCase()===name.toLowerCase()})[0];
 syncShared();if(k&&!S.orders.some(function(o){return o.shared})&&!S.trips.some(function(t){return t.shared}))setKitchen(k.pos);
 kSig='';paintKitchen();save();render();drawList(true);drawMap();
 say('Now showing orders for '+name+'.','ok')}
if(window.FDStore&&FDStore.KITCHENS){$('kitchen').addEventListener('change',function(e){switchKitchen(e.target.value)});$('kfollow').addEventListener('change',function(e){P.follow=e.target.checked;saveP();if(P.follow)autoFollow()});
 $('khint').addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('button[data-k]');if(b)switchKitchen(b.getAttribute('data-k'))})}
if(window.FDStore&&window.FDContact)FDContact.init('restaurant',function(o){return mineShared(o)});
if(window.FDStore){var sp0=FDStore.speed(),so=document.getElementById('spd');if([].some.call(so.options,function(x){return +x.value===sp0})){mult=sp0;so.value=String(sp0)}else FDStore.setSpeed(mult)}   // one time scale for all three pages
syncShared();paintSim();render();drawMap();drawList();document.getElementById('spd').addEventListener('change',function(e){mult=+e.target.value;if(window.FDStore)FDStore.setSpeed(mult)});setInterval(tick,1000);setInterval(function(){syncShared();pushShared();paintKitchen()},1000);if(window.FDStore)FDStore.onChange(function(){syncShared();pushShared();paintKitchen()});paintKitchen();
