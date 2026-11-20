import * as THREE from 'three';
import {block} from './villageCraft';

/** South wall of the Dermanlı mortuary: true openings with glazing and iron bars. */
export function createGasilSouthWall(parent:THREE.Object3D,wall:THREE.Material,glass:THREE.Material,wood:THREE.Material,metal:THREE.Material) {
  const width=6.8,height=3.4,z=4.4,sill=1.665,top=2.695,windowWidth=.9;
  const centers=[-1.7,.63];
  let left=-width/2;
  for(const x of centers){
    const start=x-windowWidth/2,end=x+windowWidth/2;
    const span=start-left;
    block(parent,wall,span,height,.24,(left+start)/2,height/2,z,2);
    block(parent,wall,windowWidth,sill,.24,x,sill/2,z,2);
    block(parent,wall,windowWidth,height-top,.24,x,(top+height)/2,z,2);
    const pane=new THREE.Mesh(new THREE.PlaneGeometry(windowWidth,top-sill),glass);
    pane.position.set(x,(sill+top)/2,z);parent.add(pane);
    for(const dx of [-.48,.48])block(parent,wood,.07,top-sill+.12,.3,x+dx,(sill+top)/2,z,1);
    for(const y of [sill,top])block(parent,wood,1.03,.07,.3,x,y,z,1);
    for(const dx of [-.25,0,.25])block(parent,metal,.025,top-sill,.035,x+dx,(sill+top)/2,z+.15);
    left=end;
  }
  block(parent,wall,width/2-left,height,.24,(left+width/2)/2,height/2,z,2);
}
