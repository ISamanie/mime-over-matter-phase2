// Load the exact script list from index.html. The fake canvas supports
// headless rule tests; browser checks separately verify the actual artwork.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
module.exports=function harness() {
  const root=path.join(__dirname,'..'),listeners={};
  const context=new Proxy({}, {
    get:(t,k)=>k in t?t[k]:k==='measureText'?()=>({width:10}):k==='createLinearGradient'?()=>({addColorStop(){}}):()=>{},
    set:(t,k,v)=>{t[k]=v;return true;},
  });
  const canvas={getContext:()=>context},math=Object.assign(Object.create(Math),{random:()=>0.9});
  const sandbox={console,Math:math,document:{getElementById:()=>canvas,createElement:()=>({...canvas})},
    performance:{now:()=>0},requestAnimationFrame(){},addEventListener:(type,fn)=>(listeners[type]||=[]).push(fn)};
  sandbox.window=sandbox;vm.createContext(sandbox);
  for(const [,src] of fs.readFileSync(path.join(root,'index.html'),'utf8').matchAll(/<script src="([^"]+)"/g))
    vm.runInContext(fs.readFileSync(path.join(root,src),'utf8'),sandbox,{filename:src});
  const get=code=>vm.runInContext(code,sandbox);
  const key=(type,k)=>(listeners[type]||[]).forEach(fn=>fn({key:k,preventDefault(){}}));
  const tick=seconds=>{for(let i=0;i<Math.ceil(seconds*60);i++){get('Game.update(1/60);Input.endFrame()');}};
  get(`CONFIG.helper.chance=0;CONFIG.clowns.noseChance=0;
    function arena(type='pieTosser',x=500) {
      Game.restart(); Game.rightHand.reset(); Game.leftHand.reset();
      Game.panel={platforms:[],clowns:[{type,x}],walls:[]};Game.surfaces=surfacesOf(Game.panel);Game.hazards=[];
      Game.clowns=[makeClown({type,x},Game.surfaces)];Game.clowns[0].active=true;
      Game.totalClowns=1;Game.pierre.invincible=100;
      return Game.clowns[0];
    }
  `);
  return {get,key,tick,sandbox};
};
