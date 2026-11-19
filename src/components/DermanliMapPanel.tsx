import { DERMANLI_PATHS, DERMANLI_SITES as S, type Point } from '../game/dermanliMap';
const places: readonly {name:string; pos:Point; dx?:number; dz?:number}[] = [
 {name:'Giriş',pos:S.entrance,dz:5}, {name:'Meydan',pos:S.square,dz:5}, {name:'Muhtarlık',pos:S.office,dx:4},
 {name:'Gasilhane',pos:S.gasilhane,dx:4}, {name:'Cami',pos:S.mosque,dx:-2,dz:-4},
 {name:'Mezarlık',pos:S.cemetery,dz:-4}, {name:'Gassal evi',pos:S.gassalHome,dx:4},
 {name:'Kuyu',pos:S.well,dx:-2,dz:-4}, {name:'Okul',pos:S.school,dx:-2,dz:-4},
 {name:'Değirmen',pos:S.mill,dx:4}, {name:'Ahır',pos:S.barn,dx:-3,dz:5},
 {name:'Tarla',pos:S.field,dx:4}, {name:'Köprü',pos:S.bridge,dx:4},
];
export function DermanliMapPanel({x,z,yaw,onClose}:{x:number;z:number;yaw:number;onClose:()=>void}) {
 return <div role="dialog" aria-modal="true" aria-label="Dermanlı haritası" style={{position:'absolute',inset:'3% 15%',zIndex:4,background:'#e6dcc3',color:'#29271f',boxShadow:'0 8px 40px #000',display:'flex',flexDirection:'column',padding:'12px 20px'}}>
  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><div><strong>DERMANLI KÖYÜ</strong><span style={{fontSize:12,marginLeft:12}}>Kuzey ↑ · Konumun kırmızı okla gösterilir</span></div><button onClick={onClose} style={{cursor:'pointer'}}>Kapat</button></div>
  <svg viewBox="-65 -85 130 180" preserveAspectRatio="xMidYMid meet" style={{minHeight:0,width:'100%',height:'100%',flex:1}} aria-label="Yollar ve köyün önemli yerleri">
   <rect x="-65" y="-85" width="130" height="180" fill="#e1d7bc"/>
   {DERMANLI_PATHS.map(p=><polyline key={p.id} points={[...p.points,...(p.closed?[p.points[0]]:[])].map(v=>v.join(',')).join(' ')} fill="none" stroke={p.kind==='water'?'#7d9da0':p.kind==='trail'?'#8b7964':'#ab9271'} strokeWidth={Math.max(1,p.width)} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={p.kind==='trail'?'1 1':undefined}/>)}
   {places.map(p=><g key={p.name}><circle cx={p.pos[0]} cy={p.pos[1]} r="1.3" fill="#4b463a"/><text x={p.pos[0]+(p.dx??2)} y={p.pos[1]+(p.dz??-1.5)} fontSize="3.2" fill="#2c2921" stroke="#e1d7bc" strokeWidth=".6" paintOrder="stroke">{p.name}</text></g>)}
   <g transform={`translate(${x} ${z}) rotate(${-yaw*180/Math.PI})`}><path d="M 0 -3 L 1.7 2 L 0 1 L -1.7 2 Z" fill="#a0322c" stroke="#f5e7d0" strokeWidth=".35"/></g>
  </svg>
  <small>Kesik çizgiler kestirme patikaları gösterir. Harita açıkken zaman durur.</small>
 </div>;
}
