export interface WaveCell {r:number;c:number;dx:number;dy:number;distance:number;start:number;duration:number;direction:'center'|'left'|'right'|'top'|'bottom';}
// Only the frozen original region is eligible. Graph distance follows corridors, not straight-line distance.
export function planWave(changed:number[][],r:number,c:number):WaveCell[]{
 const allowed=new Set(changed.map(([y,x])=>`${y},${x}`));
 const queue=[[r,c,0]],seen=new Set([`${r},${c}`]);
 const starts=[0];const result:WaveCell[]=[];
 for(let i=0;i<queue.length;i++){
  const [y,x,d]=queue[i];if(!allowed.has(`${y},${x}`))continue;
  if(starts[d]===undefined)starts[d]=starts[d-1]+Math.max(100*Math.pow(.85,d-1),40);
  const duration=Math.max(380*Math.pow(.96,d),280);
  const direction=y===r&&x===c?'center':Math.abs(x-c)>=Math.abs(y-r)?(x>c?'left':'right'):(y>r?'top':'bottom');
  result.push({r:y,c:x,dx:x-c,dy:y-r,distance:d,start:starts[d],duration,direction});
  for(const [dy,dx] of [[1,0],[-1,0],[0,1],[0,-1]]){const ny=y+dy,nx=x+dx,key=`${ny},${nx}`;if(allowed.has(key)&&!seen.has(key)){seen.add(key);queue.push([ny,nx,d+1]);}}
 }
 return result;
}
export function waveProgress(elapsed:number,cell:WaveCell){const t=Math.max(0,Math.min(1,(elapsed-cell.start)/cell.duration));return t;}
