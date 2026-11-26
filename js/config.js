/* Google Maps browser keys: the ONLY place a key is set (restaurant.js, driver.js and customer.js read it from here).
   A browser key is visible to anyone who opens the site, so it is safe only when restricted in Google Cloud Console:
     1. Credentials > the key > Application restrictions > HTTP referrers: your GitHub Pages URL (and http://localhost:* while testing)
     2. API restrictions > Restrict key: Maps JavaScript API and Routes API (plus Directions API if enabled)
     3. Set a daily quota / budget alert.
   Keys that were committed or shared earlier should be rotated (create a new key, paste it below, delete the old one). */
window.FD_CONFIG={
  MAPS_KEY_DASHBOARD:'AIzaSyC_cCdLu-qCxazOjKUYs3US7O0ToJsJANk',   // restaurant.html and driver.html
  MAPS_KEY_CUSTOMER:'AIzaSyDnXChpaGFfSHWRwcKigh2Rd3qb33KaavE'     // customer.html
};
