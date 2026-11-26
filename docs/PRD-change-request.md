# PRD change request: Bootstrap 5

**Project:** FoodDispatch (PST_PD_031)  **To:** Madhushri Tangali  **From:** Vaishnavi Ayithepalli, Sampreeti Ghosh

**Requirement today:** HTML/CSS/JS with Bootstrap 5.

**Proposed change:** keep the existing hand-written CSS (`css/*.css`) and drop Bootstrap 5 as a hard requirement.

**Reason:** the three interfaces were designed and tested with their own CSS. Bootstrap defines classes with the same
names we already use (`.btn`, `.row`, `.card`, `.badge`), so adding it would restyle every page and could break layouts
that already work. Layout is responsive through our own flex/grid rules.

**Impact:** no change to features, data model or the other PRD requirements.

**Alternative if Bootstrap is mandatory:** load Bootstrap only on new pages, or rename our classes first (about a day of rework plus re-testing).

Approved by: ____________  Date: ________
