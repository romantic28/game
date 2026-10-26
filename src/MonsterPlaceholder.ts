// V0.1 placeholder: one horned species for every color. No external art dependency.
export function monsterMask(w:number,h:number){
    const mask=new Laya.Sprite(),g=mask.graphics;
    const radius=Math.min(w,h)*.21;
    g.drawRoundRect(w*.045,h*.20,w*.91,h*.75,radius,radius,radius,radius,'#fff');
    g.drawPoly(0,0,[w*.13,h*.30,w*.17,h*.035,w*.37,h*.25],'#fff');
    g.drawPoly(0,0,[w*.63,h*.25,w*.83,h*.035,w*.87,h*.30],'#fff');
    return mask;
}
export function monsterFace(w:number,h:number){
    const face=new Laya.Sprite();face.name='monster-face';face.mouseEnabled=false;
    const g=face.graphics;
    // Fixed-color horns and facial features are above the body paint and light layers.
    g.drawPoly(0,0,[w*.155,h*.255,w*.18,h*.075,w*.32,h*.25],'#f4e6bd');
    g.drawPoly(0,0,[w*.68,h*.25,w*.82,h*.075,w*.845,h*.255],'#f4e6bd');
    for(const x of [.34,.66]){
        g.drawCircle(w*x,h*.49,w*.112,'#fffdf4');
        g.drawCircle(w*(x+.018),h*.505,w*.048,'#20253d');
        g.drawCircle(w*(x+.005),h*.485,w*.016,'#ffffff');
    }
    g.drawLines(0,0,[w*.41,h*.69,w*.46,h*.725,w*.54,h*.725,w*.59,h*.69],'#34304b',Math.max(1.5,w*.027));
    g.drawCircle(w*.23,h*.65,w*.045,'rgba(255,220,216,0.50)');
    g.drawCircle(w*.77,h*.65,w*.045,'rgba(255,220,216,0.50)');
    return face;
}
