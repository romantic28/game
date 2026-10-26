import { Rules, levels, Color, Board } from './Rules';
import { planWave, waveProgress, WaveCell } from './Wave';
import { paintFront } from './PaintFront';
import { monsterMask, monsterFace } from './MonsterPlaceholder';
const colors:Record<Color,string>={R:'#fa4b49',Y:'#e8e575',B:'#6da4e9',G:'#52bf79'};
const names:Record<Color,string>={R:'红',Y:'黄',B:'蓝',G:'绿'};
interface Tile {sprite:Laya.Sprite;label:Laya.Text;progress:number;surface:Laya.Sprite;pulse:Laya.Sprite;}
export class PartyView extends Laya.Sprite {
    rules=new Rules(levels[0]); index=0;
    private tiles:Tile[][]=[];
    private movesText:Laya.Text;
    private statusText:Laya.Text;
    private animation:{old:Board;cells:WaveCell[];start:number;end:number;color:Color}|null=null;
    constructor(){super();this.size(600,1000);this.refreshUI();}
    private text(value:string,x:number,y:number,w:number,size=24,color='#edf0ff'){
        const t=new Laya.Text();t.text=value;t.font='Microsoft YaHei';t.fontSize=size;t.color=color;t.pos(x,y);t.width=w;t.height=60;t.align='center';t.wordWrap=true;t.mouseEnabled=false;this.addChild(t);return t;
    }
    private button(label:string,x:number,y:number,w:number,h:number,fill:string,action:()=>void,selected=false,border=true){
        const b=new Laya.Sprite();b.pos(x,y);b.size(w,h);b.graphics.drawRect(0,0,w,h,fill,border?(selected?'#ffffff':'#434c71'):null,selected?4:1);b.mouseEnabled=true;this.addChild(b);
        const t=new Laya.Text();t.text=label;t.font='Microsoft YaHei';t.fontSize=24;t.color='#fff';t.width=w;t.height=h;t.align='center';t.valign='middle';t.mouseEnabled=false;b.addChild(t);b.on(Laya.Event.CLICK,this,action);return b;
    }
    private styleTile(sprite:Laya.Sprite,r:number,c:number){
        const w=sprite.width,h=sprite.height;
        // Clip both static color and animated coverage to the same rounded silhouette.
        const mask=monsterMask(w,h);
        sprite.mask=mask;
        const surface=new Laya.Sprite();surface.mouseEnabled=false;
        // A handful of broad curved polygons replaces thousands of tiny rectangles.
        for(let band=0;band<4;band++){
            const points:number[]=[];
            for(let i=0;i<=16;i++){
                const x=i*w/16;
                const y=(.08+band*.26)*h+Math.sin(i/16*3+c*.7+r*.4)*h*.12;
                points.push(x,y);
            }
            for(let i=16;i>=0;i--){
                const x=i*w/16;
                const y=(.08+band*.26)*h+Math.sin(i/16*3+c*.7+r*.4)*h*.12+h*.13;
                points.push(x,y);
            }
            surface.graphics.drawPoly(0,0,points,band%2?'rgba(0,0,0,0.055)':'rgba(255,255,255,0.075)');
        }
        for(let i=0;i<6;i++)surface.graphics.drawRect(0,i*h*.018,w,h*.018,`rgba(255,255,255,${.065*(1-i/6)})`);
        sprite.addChild(surface);
        const pulse=new Laya.Sprite();pulse.mouseEnabled=false;pulse.alpha=0;
        pulse.graphics.drawRect(0,0,w,h,'#fff6df');sprite.addChild(pulse);
        sprite.addChild(monsterFace(w,h));
        return {surface,pulse};
    }
    private cancelAnimation(){Laya.timer.clearAll(this);this.animation=null;}
    destroy(destroyChild=true){this.cancelAnimation();super.destroy(destroyChild);}
    restart(){this.cancelAnimation();this.rules.reset();this.refreshUI();}
    load(index:number){this.cancelAnimation();this.index=index;this.rules=new Rules(levels[index]);this.refreshUI();}
    cell(r:number,c:number){
        if(this.rules.busy)return;
        const old=this.rules.board.map(row=>row.slice());
        if(!this.rules.start(r,c))return;
        const cells=planWave(this.rules.changed,r,c);
        this.animation={old,cells,start:Laya.timer.currTimer,end:Math.max(...cells.map(v=>v.start+v.duration)),color:this.rules.selected};
        for(const cell of cells)this.tiles[cell.r][cell.c].progress=-1;
        this.updateStatus();
        this.tickAnimation();Laya.timer.frameLoop(1,this,this.tickAnimation);
    }
    private tickAnimation(){
        const animation=this.animation;if(!animation)return;
        const elapsed=Laya.timer.currTimer-animation.start;
        for(const cell of animation.cells){
            if(elapsed<cell.start)continue;
            const tile=this.tiles[cell.r][cell.c],p=waveProgress(elapsed,cell);
            if(tile.progress===p)continue;
            tile.progress=p;
            this.paintTransition(tile,colors[animation.old[cell.r][cell.c]],colors[animation.color],p,cell);
            tile.label.text=names[p>=.5?animation.color:animation.old[cell.r][cell.c]];
            // Animate light and texture, never move the tile or its hit area.
            const energy=Math.sin(Math.PI*p);
            tile.pulse.alpha=energy*energy*.12;
            tile.surface.pos(Math.sin(p*Math.PI*2)*2,energy*2);
            tile.surface.alpha=1-energy*.08;
        }
        if(elapsed>=animation.end){this.cancelAnimation();this.rules.finish();this.updateStatus();}
    }
    // A directional, slightly uneven paint front. Draws only inside the original tile bounds.
    private paintTransition(tile:Tile,oldColor:string,newColor:string,p:number,cell:WaveCell){
        const g=tile.sprite.graphics,w=tile.sprite.width,h=tile.sprite.height;
        g.clear();g.drawRect(0,0,w,h,p>=1?newColor:oldColor);
        if(p<=0||p>=1)return;
        const front=paintFront(w,h,p,cell);
        g.drawPoly(0,0,front.fill,newColor);
        // Wide translucent halo plus a white core: closer to the reference threshold band.
        g.drawLines(0,0,front.edge,'rgba(255,245,211,0.22)',Math.min(w,h)*.11);
        g.drawLines(0,0,front.edge,'rgba(255,255,240,0.9)',Math.min(w,h)*.035);
    }
    private updateStatus(){
        this.movesText.text=`目标：${names[this.rules.level.target]}色   ·   剩余 ${this.rules.moves} 步`;
        this.statusText.text=this.rules.busy?'变装接力中…':this.rules.result==='win'?'成功！全员完成变装':this.rules.result==='fail'?'步数用完 · 可撤销或重来':'先选颜色，再点任意同色队伍';
        this.statusText.color=this.rules.result==='fail'?'#ffb3b3':'#e5edff';
    }
    private refreshUI(board:Board=this.rules.board){
        while(this.numChildren)this.getChildAt(0).destroy(true);this.tiles=[];this.graphics.clear();this.graphics.drawRect(0,0,600,1000,'#171d36');
        this.text('怪兽变装派对',20,30,560,36);this.text('V0.1  /  小角怪变装排练',20,82,560,18,'#a8b4d5');
        levels.forEach((l,i)=>this.button(`样板 ${i+1}`,24+i*190,132,172,48,i===this.index?'#6575b7':'#303951',()=>this.load(i)));
        this.text(this.rules.level.name,20,207,560,28);
        this.movesText=this.text('',20,257,560,26);
        this.text(this.rules.level.purpose,30,312,540,20,'#b8c5e4');
        const rows=board.length,cols=board[0].length,size=Math.min(112,520/cols,320/rows),left=(600-cols*size)/2,top=400+(320-rows*size)/2;
        board.forEach((row,r)=>{this.tiles[r]=[];row.forEach((color,c)=>{
            const sprite=this.button(names[color],left+c*size+1.5,top+r*size+1.5,size-3,size-3,colors[color],()=>this.cell(r,c),false,false);
            const label=sprite.getChildAt(0) as Laya.Text;label.visible=false;
            const effect=this.styleTile(sprite,r,c);
            this.tiles[r][c]={sprite,label,progress:-1,...effect};
        });});
        this.statusText=this.text('',20,742,560,24);
        this.updateStatus();
        (['R','Y','B','G'] as Color[]).forEach((c,i)=>this.button(names[c],36+i*135,810,120,58,colors[c],()=>{if(this.rules.busy)return;this.rules.select(c);this.refreshUI();},this.rules.selected===c));
        this.button('撤销',50,903,230,56,'#343f60',()=>{if(this.rules.busy)return;this.rules.undo();this.refreshUI();});
        this.button('重来',320,903,230,56,'#343f60',()=>this.restart());
    }
}




