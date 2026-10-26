import { WaveCell } from './Wave';
// A continuous low-frequency contour approximates a noise-threshold front without per-pixel CPU work.
export function paintFront(w:number,h:number,p:number,cell:WaveCell){
 const phase=cell.r*.73+cell.c*1.13;
 if(cell.direction==='center'){
  const radius=Math.hypot(w,h)*.5*p;
  const edge:number[]=[];
  for(let i=0;i<=40;i++){
   const angle=i/40*Math.PI*2;
   const ripple=1+(.075*Math.sin(angle*3+phase)+.035*Math.sin(angle*7-phase))*Math.sin(Math.PI*p);
   edge.push(w/2+Math.cos(angle)*radius*ripple,h/2+Math.sin(angle)*radius*ripple);
  }
  return {fill:edge.slice(0,-2),edge};
 }
 // The original shader distinguishes diagonals. Retain that direction instead of collapsing to one axis.
 const length=Math.hypot(cell.dx,cell.dy),nx=cell.dx/length,ny=cell.dy/length;
 const extent=(Math.abs(nx)*w+Math.abs(ny)*h)/2;
 const span=(Math.abs(ny)*w+Math.abs(nx)*h)/2+2;
 const edge:number[]=[];
 for(let i=0;i<=32;i++){
  const cross=-span+2*span*i/32;
  const ripple=(Math.sin(i/32*7+phase)*.06+Math.sin(i/32*17-phase)*.025)*Math.min(w,h)*Math.sin(Math.PI*p);
  const along=-extent+p*extent*2+ripple;
  edge.push(w/2+nx*along-ny*cross,h/2+ny*along+nx*cross);
 }
 const back=-extent-Math.min(w,h)*.2;
 return {fill:[w/2+nx*back+ny*span,h/2+ny*back-nx*span,...edge,w/2+nx*back-ny*span,h/2+ny*back+nx*span],edge};
}
