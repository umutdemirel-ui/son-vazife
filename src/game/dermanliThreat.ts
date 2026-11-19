import type { BoxCollider } from './collision';
import { pushOutsideBox } from './collision';
import { wallBetween } from './nightPatrol';
/** Outdoor night pursuer. Cannot spot the player through walls or enter safe areas. */
export class DermanliThreat {
  x=0; z=0; active=false; private next=35; private grace=0;
  tick(dt:number,enabled:boolean,safe:boolean,player:{x:number;z:number;yaw:number},walls:readonly BoxCollider[]): 'none'|'hit' {
    if(!enabled||safe){this.active=false;this.next=Math.max(this.next,15);return 'none';}
    this.grace=Math.max(0,this.grace-dt);
    if(!this.active){
      this.next-=dt;
      if(this.next<=0){
        this.x=player.x+Math.sin(player.yaw)*12;this.z=player.z+Math.cos(player.yaw)*12;
        for(const wall of walls)pushOutsideBox(this,wall,.4);
        this.active=true;
      }
      return 'none';
    }
    const dx=player.x-this.x,dz=player.z-this.z,d=Math.hypot(dx,dz);
    if(d>28){this.active=false;this.next=35;return 'none';}
    if(!wallBetween(this.x,this.z,player.x,player.z,walls,.15) && d>.01){
      this.x+=dx/d*dt*2.35;this.z+=dz/d*dt*2.35;
      for(const wall of walls)pushOutsideBox(this,wall,.35);
    }
    if(d<1.15&&this.grace===0){this.active=false;this.next=45;this.grace=8;return 'hit';}
    return 'none';
  }
}
