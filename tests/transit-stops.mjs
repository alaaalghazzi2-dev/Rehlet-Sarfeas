import assert from 'node:assert/strict';
import {SEED,mergeDocumentRoutes,planJourneys,destinationPlaces} from '../public/network.js';
const routes=mergeDocumentRoutes(SEED);let proposed=0;
for(const r of routes){assert.equal(r.returnMode,'independent');proposed+=r.directions[0].filter(p=>p.generatedStop).length;}
assert(proposed>500);assert(destinationPlaces(routes).some(p=>p.generatedStop));assert.deepEqual(mergeDocumentRoutes(routes),routes);
const p=(name,lat,lng)=>({name,lat,lng,stop:true});const west=p('غرب',33.51,36.27),cross=p('تبديل',33.51,36.29),east=p('شرق',33.51,36.31),south=p('جنوب',33.49,36.29),north=p('شمال',33.53,36.29);
const line=(id,points)=>({id,name:id,status:'verified',color:'#087f76',directions:[points,[...points].reverse()]});const network=[line('A',[west,cross,east]),line('B',[south,cross,north])];
const journeys=planJourneys(network,west,north,false,500);assert(journeys.some(t=>t.legs.length===2&&t.legs[0].alight.name==='تبديل'&&t.legs[1].board.name==='تبديل'));
assert(planJourneys(network,east,west,false,500).some(t=>t.legs.length===1&&t.legs[0].direction===1));
console.log({proposed,independentDirections:'passed',transfer:'passed',destinations:'passed'});
