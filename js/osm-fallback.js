/* If Google Maps can't load (bad or restricted key, API not enabled, no connection) the restaurant page still gets a real map:
   this is a small google.maps-compatible layer (map, markers, polylines, bounds, routes) on top of Leaflet + OpenStreetMap + OSRM. */
window.FDOsm=(function(){
  var BASE='https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min';
  function load(ok,fail){
    if(window.L)return ok();
    var c=document.createElement('link');c.rel='stylesheet';c.href=BASE+'.css';document.head.appendChild(c);
    var s=document.createElement('script');s.src=BASE+'.js';s.onload=ok;s.onerror=fail;document.head.appendChild(s)}
  function build(el,center,zoom){
    var lm=L.map(el).setView([center.lat,center.lng],zoom||14);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).addTo(lm);
    var map={
      panTo:function(p){lm.panTo([p.lat,p.lng])},
      setZoom:function(z){lm.setZoom(z)},
      fitBounds:function(b,pad){if(b.pts.length)lm.fitBounds(b.pts,{padding:[pad||40,pad||40],maxZoom:16})}};
    function Bounds(){this.pts=[]}
    Bounds.prototype.extend=function(p){this.pts.push([p.lat,p.lng])};
    /* marker: same shape as google.maps.marker.AdvancedMarkerElement (content element, position, map) */
    function Marker(o){
      var self=this,m=null,w=document.createElement('div');
      w.style.cssText='position:absolute;transform:translate(-50%,-100%)';w.appendChild(o.content);
      var icon=L.divIcon({className:'fdosm-m',html:w,iconSize:[0,0]});
      self.content=o.content;self._p=o.position;
      Object.defineProperty(self,'position',{get:function(){return self._p},set:function(p){self._p=p;if(m)m.setLatLng([p.lat,p.lng])}});
      Object.defineProperty(self,'map',{get:function(){return m?map:null},set:function(v){
        if(v){if(!m)m=L.marker([self._p.lat,self._p.lng],{icon:icon,keyboard:false,zIndexOffset:(o.zIndex||0)*10}).addTo(lm)}
        else if(m){lm.removeLayer(m);m=null}}});
      self.map=o.map}
    function Polyline(o){
      var pl=null,opt=o||{},pts=[];
      function style(){return{color:opt.strokeColor||'#2563eb',weight:opt.strokeWeight||5,opacity:opt.strokeOpacity==null?1:opt.strokeOpacity,lineCap:'round',lineJoin:'round'}}
      this.setPath=function(p){pts=p.map(function(q){return[q.lat,q.lng]});if(pl)pl.setLatLngs(pts)};
      this.setOptions=function(x){for(var k in x)opt[k]=x[k];if(pl)pl.setStyle(style())};
      this.setMap=function(v){if(v){if(!pl)pl=L.polyline(pts,style()).addTo(lm);else if(!lm.hasLayer(pl))pl.addTo(lm)}else if(pl){lm.removeLayer(pl);pl=null}}}
    var RC={computeRoutes:function(r){var a=r.origin,b=r.destination;
      return fetch('https://router.project-osrm.org/route/v1/driving/'+a.lng+','+a.lat+';'+b.lng+','+b.lat+'?overview=full&geometries=geojson').then(function(x){return x.json()}).then(function(j){
        if(!j.routes||!j.routes[0])throw new Error('no road route found');
        return{routes:[{path:j.routes[0].geometry.coordinates.map(function(c){return{lat:c[1],lng:c[0]}})}]}})}};
    return{G:{LatLngBounds:Bounds,Polyline:Polyline,event:{trigger:function(){lm.invalidateSize()}}},AM:Marker,RC:RC,map:map}}
  return{load:load,build:build};
})();
