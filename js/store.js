/* Shared order store for the Customer, Restaurant and Driver pages (demo: this browser's localStorage).
   Everything that crosses pages lives under ONE key, fooddispatch_orders:
   the order, its status history, the assigned driver, driver position and ETA.
   The live driver's heartbeat (so the restaurant can include them in dispatch) is in fooddispatch_drivers. */
window.FDStore=(function(){
  var KEY='fooddispatch_orders',DKEY='fooddispatch_drivers';
  /* shared status rules: one step at a time, and only these roles may take each step */
  var FLOW=['Placed','Accepted','Preparing','Ready','Picked up','Delivered'];
  var WHO={Accepted:['restaurant'],Preparing:['restaurant'],Ready:['restaurant'],'Picked up':['driver','restaurant'],Delivered:['driver'],Cancelled:['customer','restaurant']};

  function read(){try{var d=JSON.parse(localStorage.getItem(KEY));if(d&&Array.isArray(d.orders))return d}catch(e){}return{v:1,orders:[]}}
  function write(d){try{localStorage.setItem(KEY,JSON.stringify(d));return true}catch(e){return false}}
  function find(d,id){for(var i=0;i<d.orders.length;i++)if(d.orders[i].id===id)return d.orders[i];return null}
  /* names typed by one user are shown in another user's page: drop markup characters at the boundary */
  function clean(s,n){return String(s==null?'':s).replace(/[<>&"`]/g,'').slice(0,n||60)}
  /* Browsers sync localStorage between tabs a few milliseconds late, so two tabs writing at the same moment can overwrite each other.
     After every important write we check again shortly after and put back anything that got lost. */
  function rank(o){return o.status==='Cancelled'?9:FLOW.indexOf(o.status)}
  function guard(o){var snap=JSON.parse(JSON.stringify(o)),n=0;
    (function chk(){setTimeout(function(){var d=read(),x=find(d,snap.id),fix=false,sp=snap.pk||{},xp=x&&x.pk||{};
      if(!x){d.orders.push(snap);fix=true}
      else if(rank(x)<rank(snap)||(snap.released&&(x.released||[]).length<snap.released.length)||(rank(x)===rank(snap)&&((sp.driver&&!xp.driver)||(sp.restaurant&&!xp.restaurant)))){
        ['status','history','pk','driver','offer','offerResp','released','driverAt','dpos'].forEach(function(k){x[k]=snap[k]});fix=true}
      if(fix)write(d);if(++n<2)chk()},n?700:150)})()}
  function fail(msg,o){return{ok:false,msg:msg,order:o||null}}

  /* false when the browser blocks storage; pages then fall back to their own local demo */
  function available(){try{var k='fd_probe';localStorage.setItem(k,'1');localStorage.removeItem(k);return true}catch(e){return false}}
  function all(){return read().orders}
  function get(id){return find(read(),id)}

  /* next unused order number >= start, so ids stay unique after a page refresh */
  function nextSeq(start){var m=start-1;read().orders.forEach(function(o){var n=+String(o.id).replace(/\D/g,'');if(n>=start&&n>m)m=n});return m+1}

  function create(o){
    var d=read();if(find(d,o.id))return false;
    o.status='Placed';o.createdAt=o.createdAt||Date.now();o.history=[{s:'Placed',at:o.createdAt}];
    d.orders.push(o);var ok=write(d);if(ok)guard(o);return ok}

  /* Move an order to its next status. actor: 'customer' | 'restaurant' | 'driver'.
     extra (optional) is merged in only when the move is allowed, e.g. the driver for a hand-over. */
  function advance(id,next,actor,extra){
    var d=read(),o=find(d,id);if(!o)return fail('Order '+id+' was not found.');
    var cur=o.status;
    if(WHO[next]&&WHO[next].indexOf(actor)<0)
      return fail(next==='Delivered'?'Restaurants can’t mark an order as Delivered. Only the assigned driver can.':'Only the '+WHO[next].join(' or ')+' can set an order to '+next+'.',o);
    if(next==='Cancelled'){
      if(cur!=='Placed'&&cur!=='Accepted')return fail('Orders can be cancelled only before preparing starts.',o)}
    else if(FLOW[FLOW.indexOf(cur)+1]!==next||FLOW.indexOf(cur)<0)
      return fail('This order is '+cur+'. Steps must go '+FLOW.join(' → ')+', in order.',o);
    var drv=extra&&extra.driver!==undefined?extra.driver:o.driver;
    if((next==='Picked up'||next==='Delivered')&&!drv)return fail('No driver is assigned to '+id+' yet.',o);
    if(extra)for(var k in extra)if(k!=='status'&&k!=='history')o[k]=extra[k];
    if(next==='Picked up'){   // hand-over needs both sides: the driver confirms pickup AND the restaurant confirms hand-over
      var pk=o.pk||(o.pk={});pk[actor==='driver'?'driver':'restaurant']=Date.now();
      if(!(pk.driver&&pk.restaurant)){if(!write(d))return fail('Your browser could not save this change.',o);guard(o);return{ok:true,pending:true,waitingFor:pk.driver?'restaurant':'driver',order:o}}}
    o.status=next;o.history.push({s:next,at:Date.now()});
    if(next==='Picked up'||next==='Delivered'){o.offer=null;o.offerResp=null}
    if(!write(d))return fail('Your browser could not save this change.',o);guard(o);return{ok:true,order:o}}

  /* a driver withdraws from an order before pickup: it stays Ready and goes back to dispatch */
  function release(id,driverId,why){
    var d=read(),o=find(d,id);if(!o)return fail('Order '+id+' was not found.');
    if(o.status!=='Ready')return fail(o.status==='Picked up'||o.status==='Delivered'?'The food is already with you, so this order can’t be cancelled now.':'Only a Ready order can be given back.',o);
    if(!o.driver||o.driver.id!==driverId)return fail('This order is not assigned to you.',o);
    var rel=o.released||(o.released=[]);rel.push({driver:driverId,name:o.driver.name,at:Date.now(),why:clean(why||'Driver cancelled',60)});
    o.driver=null;o.offer=null;o.offerResp=null;o.pk=null;o.driverAt=null;o.dpos=null;
    if(o.route){o.route.pickup=null;o.route.pickupDriver=null}
    if(!write(d))return fail('Your browser could not save this change.',o);guard(o);return{ok:true,order:o}}

  /* one route per order, shared by all three pages. pickup = driver -> restaurant, deliver = restaurant -> customer */
  function thin(pts){var n=250,st=Math.max(1,Math.ceil(pts.length/n)),out=[],i,r=function(p){return[+(+p[0]).toFixed(5),+(+p[1]).toFixed(5)]};
    for(i=0;i<pts.length;i+=st)out.push(r(pts[i]));var l=r(pts[pts.length-1]),e=out[out.length-1];if(e[0]!==l[0]||e[1]!==l[1])out.push(l);return out}
  function setRoute(id,leg,pts,driverId){
    if(!pts||pts.length<2)return false;var d=read(),o=find(d,id);if(!o)return false;var r=o.route||(o.route={});
    if(leg==='deliver'){if(r.deliver)return false;r.deliver=thin(pts)}
    else{if(r.pickup&&r.pickupDriver===driverId)return false;r.pickup=thin(pts);r.pickupDriver=driverId||null}
    return write(d)}

  /* order messages: customer <-> restaurant <-> driver */
  function addMsg(id,from,to,text){text=clean(text,300).trim();if(!text)return false;var d=read(),o=find(d,id);if(!o)return false;
    var m=o.msgs||(o.msgs=[]);m.push({from:from,to:to,text:text,at:Date.now()});if(m.length>100)m.splice(0,m.length-100);return write(d)}
  function thread(o,a,b){return(o.msgs||[]).filter(function(m){return(m.from===a&&m.to===b)||(m.from===b&&m.to===a)})}

  /* update non-status fields (driver, position, ETA, rating). Status can only change through advance(). */
  function patchMany(map){
    var d=read(),changed=false;
    Object.keys(map).forEach(function(id){var o=find(d,id);if(!o)return;
      Object.keys(map[id]).forEach(function(k){if(k==='status'||k==='history'||k==='id')return;
        if(JSON.stringify(o[k])!==JSON.stringify(map[id][k])){o[k]=map[id][k];changed=true}})});
    return changed?write(d):true}
  function patch(id,fields){var m={};m[id]=fields;return patchMany(m)}

  /* one time scale for all three pages: how many simulated minutes pass per real minute (the restaurant's speed setting) */
  var SKEY='fooddispatch_speed';
  function speed(){var n=+localStorage.getItem(SKEY);return n>0?n:10}
  function setSpeed(n){try{localStorage.setItem(SKEY,String(+n||10))}catch(e){}}

  /* the one customer-facing rule for cancelling: before the kitchen starts preparing */
  function canCancel(o){return o.status==='Placed'||o.status==='Accepted'}

  /* restaurant contact details, published by the restaurant page so customers and drivers can reach the right kitchen */
  var RKEY='fooddispatch_restaurants';
  function restaurants(){try{return JSON.parse(localStorage.getItem(RKEY))||{}}catch(e){return{}}}
  function putRestaurant(name,phone){name=clean(name,60);phone=clean(phone,20);var r=restaurants(),k=name.toLowerCase();
    if(r[k]&&r[k].phone===phone&&r[k].name===name)return;r[k]={name:name,phone:phone};try{localStorage.setItem(RKEY,JSON.stringify(r))}catch(e){}}
  function phoneOfRestaurant(name){var r=restaurants()[String(name||'').toLowerCase()];return r?r.phone:''}

  /* every kitchen a customer can order from (same names and map pins as the catalogue in customer.js), so the restaurant page can switch between them */
  var KITCHENS=[{n:'Spice Route Kitchen',pos:[12.9698,77.7500]},{n:'Napoli Pizzeria',pos:[12.9641,77.7338]},{n:'Mumbai Street Eats',pos:[12.9726,77.7421]},{n:'Udupi Tiffin House',pos:[12.9769,77.7288]},{n:'Dragon Wok',pos:[12.9890,77.7440]},{n:'Tandoor Tales',pos:[12.9577,77.7266]},{n:'Punjab Da Dhaba',pos:[12.9801,77.7567]},{n:'Sweet Tooth Bakery',pos:[12.9712,77.7205]},{n:'Chaat Corner',pos:[12.9862,77.7365]},{n:'Madras Cafe',pos:[12.9529,77.7402]},{n:'Little Italy Kitchen',pos:[12.9945,77.7289]}];
  /* open customer orders per kitchen (lower-case name -> count): lets the restaurant page show where orders are waiting */
  function openByKitchen(){var c={};read().orders.forEach(function(o){if(o.src==='customer'&&o.status!=='Delivered'&&o.status!=='Cancelled'){var k=String(o.k||'').trim().toLowerCase();c[k]=(c[k]||0)+1}});return c}

  /* presence: each page says "I am open" so the customer page can warn when no restaurant page shares this browser's storage */
  var PKEY='fooddispatch_presence';
  function ping(role){try{var d=JSON.parse(localStorage.getItem(PKEY))||{};d[role]=Date.now();localStorage.setItem(PKEY,JSON.stringify(d))}catch(e){}}
  function seen(role,maxAge){try{var t=(JSON.parse(localStorage.getItem(PKEY))||{})[role];return !!t&&Date.now()-t<(maxAge||15000)}catch(e){return false}}

  /* live driver heartbeat */
  function drivers(){try{return JSON.parse(localStorage.getItem(DKEY))||{}}catch(e){return{}}}
  function putDriver(rec){var d=drivers();rec.phone=/^\d{10}$/.test(rec.phone||'')?rec.phone:'';rec.name=clean(rec.name,40);rec.plate=clean(rec.plate,20);rec.seen=Date.now();d[rec.id]=rec;try{localStorage.setItem(DKEY,JSON.stringify(d))}catch(e){}}
  function liveDriver(maxAge){var r=drivers().LIVE;return r&&Date.now()-r.seen<(maxAge||120000)?r:null}   // generous: background tabs run timers slowly
  function dropDriver(){var d=drivers();delete d.LIVE;try{localStorage.setItem(DKEY,JSON.stringify(d))}catch(e){}}

  /* fires when ANOTHER tab changes the shared data */
  function onChange(fn){window.addEventListener('storage',function(e){if(e.key===KEY||e.key===DKEY)fn()})}

  return{ping:ping,seen:seen,KITCHENS:KITCHENS,openByKitchen:openByKitchen,speed:speed,setSpeed:setSpeed,KEY:KEY,FLOW:FLOW,clean:clean,thin:thin,release:release,setRoute:setRoute,addMsg:addMsg,thread:thread,putRestaurant:putRestaurant,phoneOfRestaurant:phoneOfRestaurant,dropDriver:dropDriver,drivers:drivers,available:available,all:all,get:get,nextSeq:nextSeq,create:create,advance:advance,patch:patch,patchMany:patchMany,canCancel:canCancel,putDriver:putDriver,liveDriver:liveDriver,onChange:onChange};
})();
