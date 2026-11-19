import {ENDING_BEATS,ENDING_TITLES} from '../game/dermanliEndings';
import type {Ending} from '../game/dermanliRitual';
export function DermanliEnding({ending,stage,onStage,onExit}:{ending:Ending;stage:number;onStage:(n:number)=>void;onExit:()=>void}){
 const beats=ENDING_BEATS[ending],index=Math.max(0,Math.min(beats.length-1,stage)),last=index===beats.length-1;
 return <section role="region" aria-label={`${ENDING_TITLES[ending]} sonu`} style={{position:'absolute',bottom:'6%',left:'50%',transform:'translateX(-50%)',width:'min(86%,620px)',padding:'20px 24px',boxSizing:'border-box',background:'#101510e8',border:'1px solid #b3ab8a',boxShadow:'0 10px 40px #000a',color:'#eee5d2',textAlign:'center'}}>
  <div style={{fontSize:11,letterSpacing:'.24em',opacity:.7}}>SON VAZİFE · {index+1} / {beats.length}</div>
  <h2 style={{margin:'8px 0',fontFamily:'Georgia, serif',letterSpacing:'.12em'}}>{last?ENDING_TITLES[ending]:'DERMANLI'}</h2>
  <p aria-live="polite" style={{lineHeight:1.6,margin:'8px 0 16px'}}>{beats[index].text}</p>
  <div style={{display:'flex',gap:10,justifyContent:'center',flexWrap:'wrap'}}>
   {!last&&<button onClick={()=>onStage(index+1)} style={{padding:'8px 18px',cursor:'pointer'}}>Devam</button>}
   {!last&&<button onClick={()=>onStage(beats.length-1)} style={{padding:'8px 18px',cursor:'pointer'}}>Sonu göster</button>}
   <button onClick={onExit} style={{padding:'8px 18px',cursor:'pointer'}}>Menüye dön</button>
  </div>
 </section>;
}
