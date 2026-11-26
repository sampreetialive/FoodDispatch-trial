# FoodDispatch testing

Setup: serve the folder (`python3 -m http.server 8765`), open `customer.html`, `restaurant.html`, `driver.html` in three tabs of one browser. Restaurant profile = Spice Route Kitchen (default). Set Demo speed to x10 or higher.

| ID | Steps | Expected |
|---|---|---|
| TC-01 | Customer: order from Spice Route Kitchen | Order appears in restaurant queue within ~1 s, no refresh |
| TC-02 | Refresh the customer page | Order, status and history still there; new order gets a new number |
| TC-03 | Restaurant: Accept, then Start preparing | Customer tracking moves to Accepted, then Preparing |
| TC-04 | Customer cancels while Placed or Accepted | Restaurant card disappears and is logged as Customer request |
| TC-05 | Customer tries to cancel while Preparing | Cancel button is gone / refused |
| TC-06 | Restaurant: Mark ready | Nearest free driver gets the offer (see Assigned to ... and distance) |
| TC-07 | Customer tracking after assignment | Driver name, plate, distance and ETA countdown; marker moves if map loads |
| TC-08 | Driver page: Accept the offer (make other drivers unavailable first) | Order becomes the active delivery; customer sees the same driver |
| TC-09 | Driver: Confirm pickup, then enter wrong OTP | Delivery refused, tries counted |
| TC-10 | Enter the customer's OTP | Delivered everywhere; restaurant trip cleared |
| TC-11 | Try Delivered from the restaurant | Refused (only the driver can) |
| TC-12 | Restaurant: set filter to Ready, type a search, Export CSV | File contains exactly the visible rows |
| TC-13 | Customer name containing `<b>x</b>` | Shown as plain text on restaurant and driver pages |
| TC-14 | Driver Decline on an offer | Restaurant offers it to the next nearest driver |
| TC-15 | Customer: Track order > Contact restaurant (or Help in the orders list); send a message | Restaurant gets a notification and can reply; phone link shows the number from the restaurant profile |
| TC-16 | Driver: active order > Contact <restaurant>; restaurant: Contact driver | Messages go to the restaurant that owns that order, with notifications on both sides |
| TC-17 | Driver: Cancel this order (tap twice) before pickup | Order stays Ready, restaurant is told and offers it to another driver, customer sees "Finding you a delivery partner" |
| TC-18 | After pickup the driver tries to cancel | Refused: the food is already with the driver |
| TC-19 | Log in on the driver page with your own name | Restaurant shows that name and sends offers to you first; simulated drivers are paused (toggle on the restaurant page) |
| TC-20 | Driver confirms pickup but the restaurant has not handed over (and the other way round) | Driver icon stays at the restaurant on every page until BOTH confirm, then moves to the customer |
| TC-22 | Block or break the Google key (or go offline), reload the restaurant page | Map still shows (OpenStreetMap) with a note saying why |
| TC-23 | Change Demo speed on the restaurant page | Driver page and customer countdown follow the same pace |
| TC-21 | Compare the route on the customer, restaurant and driver maps | Same pickup route and same delivery route on all three |
| TC-24 | Driver online; restaurant marks a restaurant-only demo order Ready | Offer goes to a simulated driver, never to the live driver |
| TC-25 | Break the Google key, open the driver page and accept an order | Driver trip map shows OpenStreetMap with the reason |
| TC-26 | Customer: order from Napoli Pizzeria (not the default kitchen). Restaurant page: look under the title | Notice "Orders waiting at Napoli Pizzeria (1)"; Kitchen dropdown shows "Napoli Pizzeria (1 open)"; choosing it shows the order and moves the map to that kitchen |

## Usability notes
- Restaurant must keep its tab open: it runs the simulated drivers.
- The restaurant queue is per kitchen; use the Kitchen switcher on the restaurant page to move between the 11 restaurants.
- Customers see an ETA countdown and distance; the first ETA is an estimate and is refined once a driver is assigned.
- Ask testers: could they find Export CSV, did they understand why Cancel disappears, was the OTP step clear?
