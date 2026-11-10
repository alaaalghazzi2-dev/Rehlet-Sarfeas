import assert from 'node:assert/strict';
import {acceptFix,segments,prepareRecordedRoute,geometrySignature} from '../public/gps-track.js';
import {mergeDocumentRoutes,planJourneys,validateRoute} from '../public/network.js';
const t=Date.now(),track={points:[]},fix=(lat,lng,sec,accuracy=8)=>({coords:{latitude:lat,longitude:lng,accuracy},timestamp:t+sec*1000});
assert(acceptFix(track,fix(33.51,36.29,0),t).point);
assert(!acceptFix(track,fix(33.51,36.29001,1),t+1000).point); // stationary jitter
assert(!acceptFix(track,fix(33.52,36.3,2),t+2000).point); // teleport
assert(!acceptFix(track,fix(33.51,36.2902,3,90),t+3000).point);
assert(!acceptFix(track,fix(33.7,36.29,4),t+4000).point);
assert(acceptFix(track,fix(33.51,36.2902,5),t+5000).point);
assert(!acceptFix(track,fix(33.51,36.2904,4),t+30000).point); // stale
assert(acceptFix(track,fix(33.51,36.292,40),t+40000).point.breakBefore);
assert.equal(segments(track.points).length,2);
const path=[{lat:33.51,lng:36.29,name:'ساحة البداية',stop:true},{lat:33.51,lng:36.291,name:'انعطاف',stop:false},{lat:33.51,lng:36.292,name:'ساحة النهاية',stop:true}];
const r={id:'GPS-test',name:'خط اختبار',color:'#087f76',status:'verified',source:'',note:'تسجيل ميداني',directions:[path,[...path].reverse()],fieldRecordings:{0:geometrySignature(path)}};
prepareRecordedRoute(r);
assert.deepEqual(r.directionPending,[false,true]);assert.deepEqual(r.directionStatus,['verified','demo']);
validateRoute(r);
const merged=mergeDocumentRoutes([r]).find(x=>x.id===r.id);assert.equal(merged.trafficPending,false);
assert(planJourneys([merged],path[0],path.at(-1),false,500).some(j=>j.segments.some(s=>s.type!=='walk')));
assert(!planJourneys([merged],path.at(-1),path[0],true,500).some(j=>j.segments.some(s=>s.type!=='walk'&&s.direction===1))); // must not reverse unrecorded direction
const changed=structuredClone(r);changed.directions[0][1].lng+=.001;prepareRecordedRoute(changed,r);assert.equal(changed.directionPending[0],true);
console.log('GPS: filters, gaps, independent direction approval, route validation, persisted merge and journey planning passed.');
