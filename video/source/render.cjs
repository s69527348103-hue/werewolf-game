// usage: node render.js <html> <outdir> <width> <height> [times_ms_csv]
const {chromium}=require('playwright');const [,,path,out,W,H,only]=process.argv;
(async()=>{const b=await chromium.launch();const pg=await b.newPage({viewport:{width:+W,height:+H},deviceScaleFactor:2});
await pg.goto('file://'+require('path').resolve(path));await pg.evaluate(()=>window.ready);await pg.waitForTimeout(300);
const times=only?only.split(',').map(Number):[...Array(450).keys()].map(i=>i*1000/30);
for(let i=0;i<times.length;i++){await pg.evaluate(t=>window.setT(t),times[i]);
await pg.screenshot({path:`${out}/f${String(i).padStart(4,'0')}.jpg`,type:'jpeg',quality:96});}
await b.close();})();
