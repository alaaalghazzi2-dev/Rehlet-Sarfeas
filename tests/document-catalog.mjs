import assert from 'node:assert/strict';
import {DOCUMENT_ROUTES} from '../public/document-routes.js';
import {SEED,mergeDocumentRoutes,validateRoute,within,planJourneys} from '../public/network.js';
assert.equal(DOCUMENT_ROUTES.length,58);assert.equal(new Set(DOCUMENT_ROUTES.map(r=>r.documentNumber)).size,58);assert.equal(new Set(DOCUMENT_ROUTES.map(r=>r.color)).size,58);
const merged=mergeDocumentRoutes(SEED);assert.equal(merged.length,58);
for(const r of DOCUMENT_ROUTES){if(!r.directions[0].length){assert.equal(r.directions[1].length,0);continue;}validateRoute(r);for(const d of r.directions){assert(d.length>2);assert(d.every(within));assert(d[0].stop&&d.at(-1).stop);}}
const custom={...structuredClone(SEED[0]),id:'R-personal',name:'جادات سلمية',note:'رسم المالك'};
const edited=structuredClone(SEED[0]);edited.directions[0][0].lat+=.001;
const saved=[...SEED.slice(1),edited,custom];const withEdits=mergeDocumentRoutes(saved);
assert.deepEqual(withEdits.find(r=>r.id===edited.id).directions[0].filter(p=>!p.generatedStop),edited.directions[0]);
assert.deepEqual(withEdits.find(r=>r.id===custom.id).directions[0].filter(p=>!p.generatedStop),custom.directions[0]);
assert.equal(withEdits.filter(r=>r.documentNumber===22).length,1);
assert.equal(withEdits.find(r=>r.id===custom.id).note,'رسم المالك');
assert.deepEqual(mergeDocumentRoutes(withEdits),withEdits);
const ready=DOCUMENT_ROUTES.filter(r=>r.directions[0].length);
assert(planJourneys(merged,ready[0].directions[0][0],ready[0].directions[0].at(-1),true).length>0);
assert(planJourneys(merged,ready[0].directions[0][0],ready[0].directions[0].at(-1),false).every(r=>r.walkingOnly));
console.log(JSON.stringify({catalog:58,mapped:ready.length,pending:DOCUMENT_ROUTES.filter(r=>!r.directions[0].length).map(r=>r.documentNumber),preservation:'passed',validation:'passed'}));
