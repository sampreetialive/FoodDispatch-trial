/* Contact / help for an order: call (tel:) and in-app messages between customer, restaurant and driver.
   Messages live on the shared order (FDStore, fooddispatch_orders), so each side only needs the order id.
   Pages call FDContact.init(role, filter) once and render buttons with FDContact.btn(...). */
window.FDContact=(function(){
  var me=null,keep=function(){return true},cur=null,ov,lastN=Date.now(),seenKey,seen={};
  var QUICK={
    'customer>restaurant':['Is my order on its way?','Please call me','Please keep it less spicy','I need to change something'],
    'driver>restaurant':['I have arrived for pickup','Is the order ready?','I can’t find the pickup point'],
    'restaurant>driver':['Order is ready at the counter','Please use the back entrance','Where are you now?'],
    'restaurant>customer':['We are preparing your order','An item is unavailable. Can we replace it?','Sorry for the delay']};
  var LABEL={restaurant:'restaurant',driver:'delivery partner',customer:'customer'};

  function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
  function load(){try{seen=JSON.parse(localStorage.getItem(seenKey))||{}}catch(e){seen={}}}
  function store(){try{localStorage.setItem(seenKey,JSON.stringify(seen))}catch(e){}}
  function info(o,peer){
    if(peer==='restaurant')return{name:o.k,phone:FDStore.phoneOfRestaurant(o.k)};
    if(peer==='driver')return o.driver?{name:o.driver.name,phone:o.driver.phone||''}:{name:'',phone:''};
    return{name:o.name,phone:o.phone||''}}
  function mine(o,peer){return FDStore.thread(o,me,peer)}
  function unread(o,peer){var t=seen[o.id+'>'+peer]||0;return mine(o,peer).filter(function(m){return m.to===me&&m.at>t}).length}
  function markSeen(o,peer){var t=mine(o,peer),l=t.length?t[t.length-1].at:Date.now();seen[o.id+'>'+peer]=l;store()}

  /* HTML for a contact button; cls lets each page use its own button style */
  function btn(orderId,as,peer,label,cls){return'<button type="button" class="fdc-btn '+(cls||'')+'" data-fdc-o="'+esc(orderId)+'" data-fdc-as="'+as+'" data-fdc-p="'+peer+'">'+esc(label)+'<span class="fdc-b" hidden></span></button>'}

  function build(){
    ov=document.createElement('div');ov.className='fdc-ov';ov.hidden=true;
    ov.innerHTML='<div class="fdc-m" role="dialog" aria-modal="true" aria-labelledby="fdcT"><div class="fdc-h"><div><h2 id="fdcT"></h2><p id="fdcS"></p></div><button type="button" class="fdc-x" aria-label="Close">×</button></div>'+
      '<div class="fdc-call" id="fdcC"></div><div class="fdc-log" id="fdcL" role="log" aria-live="polite" tabindex="0"></div><div class="fdc-q" id="fdcQ"></div>'+
      '<div class="fdc-f"><input id="fdcI" maxlength="300" autocomplete="off" aria-label="Type a message" placeholder="Type a message"><button type="button" id="fdcSend">Send</button></div></div>';
    document.body.appendChild(ov);
    ov.addEventListener('click',function(e){if(e.target===ov||e.target.closest('.fdc-x'))close();
      var q=e.target.closest('[data-q]');if(q)send(q.dataset.q);if(e.target.id==='fdcSend')send(document.getElementById('fdcI').value)});
    ov.addEventListener('keydown',function(e){if(e.key==='Escape')close();if(e.key==='Enter'&&e.target.id==='fdcI'){e.preventDefault();send(e.target.value)}})}
  function open(id,peer){
    var o=FDStore.get(id);if(!o)return;if(!ov)build();cur={id:id,peer:peer};var p=info(o,peer);
    document.getElementById('fdcT').textContent='Contact the '+LABEL[peer]+(p.name?' · '+p.name:'');
    document.getElementById('fdcS').textContent='Order '+id;
    ov.hidden=false;draw(true);markSeen(o,peer);document.getElementById('fdcI').focus()}
  function close(){if(ov)ov.hidden=true;cur=null}
  function draw(force){
    if(!cur)return;var o=FDStore.get(cur.id);if(!o)return;var p=info(o,cur.peer),t=mine(o,cur.peer),has=cur.peer!=='driver'||!!o.driver;
    var sig=t.length+'|'+p.phone+'|'+has;if(!force&&cur.sig===sig)return;cur.sig=sig;
    var digits=String(p.phone).replace(/\D/g,''),href=digits.length===10?'+91'+digits:digits;
    document.getElementById('fdcC').innerHTML=!has?'No delivery partner is assigned yet. You can message them once one accepts.':href?'<a href="tel:'+esc(href)+'">Call '+esc(p.name||LABEL[cur.peer])+' · '+esc(p.phone)+'</a>':'No phone number is listed for the '+LABEL[cur.peer]+'. Send a message instead.';
    var L=document.getElementById('fdcL');
    L.innerHTML=t.length?t.map(function(m){return'<div class="fdc-i '+(m.from===me?'me':'')+'"><span>'+esc(m.text)+'</span><time>'+new Date(m.at).toLocaleTimeString('en-IN',{hour:'numeric',minute:'2-digit'})+'</time></div>'}).join(''):'<p class="fdc-e">No messages yet. Send one below.</p>';
    L.scrollTop=L.scrollHeight;
    document.getElementById('fdcQ').innerHTML=has?(QUICK[me+'>'+cur.peer]||[]).map(function(q){return'<button type="button" data-q="'+esc(q)+'">'+esc(q)+'</button>'}).join(''):'';
    document.getElementById('fdcI').disabled=!has;document.getElementById('fdcSend').disabled=!has}
  function send(text){
    if(!cur||!String(text).trim())return;var o=FDStore.get(cur.id);if(!o||(cur.peer==='driver'&&!o.driver))return;
    FDStore.addMsg(cur.id,me,cur.peer,text);document.getElementById('fdcI').value='';draw(true);markSeen(o,cur.peer);document.getElementById('fdcI').focus()}

  function toast(o,peer,m){
    var n=document.createElement('div');n.className='fdc-t';n.setAttribute('role','status');
    n.innerHTML='<b>'+esc(info(o,peer).name||LABEL[peer])+'</b> · '+esc(o.id)+'<br>'+esc(m.text.slice(0,70))+'<button type="button">Open</button>';
    n.querySelector('button').onclick=function(){n.remove();open(o.id,peer)};document.body.appendChild(n);setTimeout(function(){n.remove()},7000)}
  function tickAll(){
    var orders=FDStore.all(),fresh=[];
    document.querySelectorAll('[data-fdc-o]').forEach(function(b){var o=FDStore.get(b.dataset.fdcO);if(!o)return;var n=unread(o,b.dataset.fdcP),s=b.querySelector('.fdc-b');if(!s)return;s.hidden=!n;s.textContent=n||''});
    orders.forEach(function(o){if(!keep(o))return;(o.msgs||[]).forEach(function(m){if(m.to===me&&m.at>lastN){fresh.push([o,m])}})});
    if(fresh.length){lastN=Math.max.apply(null,fresh.map(function(x){return x[1].at}));
      fresh.forEach(function(x){var open1=cur&&cur.id===x[0].id&&cur.peer===x[1].from&&!ov.hidden;if(!open1)toast(x[0],x[1].from,x[1]);else markSeen(x[0],x[1].from)});
      if(document.hidden)document.title='(new message) '+document.title.replace(/^\(new message\) /,'')}
    else if(!document.hidden)document.title=document.title.replace(/^\(new message\) /,'');
    if(cur)draw()}
  function init(role,filter){me=role;if(filter)keep=filter;seenKey='fd_chat_seen_'+role;load();build();
    document.addEventListener('click',function(e){var b=e.target.closest('[data-fdc-o]');if(b&&b.dataset.fdcAs===me){e.preventDefault();open(b.dataset.fdcO,b.dataset.fdcP)}});
    setInterval(tickAll,1000);window.addEventListener('storage',function(e){if(e.key===FDStore.KEY)tickAll()})}
  return{init:init,btn:btn,open:open};
})();
