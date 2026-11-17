const {chromium}=require('playwright');const path=process.argv[2];const out=process.argv[3];const only=process.argv[4];
(async()=>{const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1080,height:1920}});
await pg.goto('file://'+path);await pg.evaluate(()=>window.ready);await pg.waitForTimeout(300);
const times=only?only.split(',').map(Number):[...Array(450).keys()].map(i=>i*1000/30);
for(let i=0;i<times.length;i++){await pg.evaluate(t=>window.setT(t),times[i]);
await pg.screenshot({path:`${out}/f${String(i).padStart(4,'0')}.jpg`,type:'jpeg',quality:93});}
await b.close();})();
