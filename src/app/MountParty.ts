import { PartyView } from '../board/PartyView';
import { fitPortrait } from './Layout';
export function mountParty() {
    // showall keeps a 600x1000 logical stage: center the canvas in its host too.
    Laya.stage.alignH = Laya.Stage.ALIGN_CENTER;
    Laya.stage.alignV = Laya.Stage.ALIGN_MIDDLE;
    const view = new PartyView();
    const resize = () => {
        const fit = fitPortrait(Laya.stage.width, Laya.stage.height);
        view.scale(fit.scale, fit.scale);
        view.pos(fit.x, fit.y);
    };
    Laya.stage.addChild(view);
    Laya.stage.on(Laya.Event.RESIZE, view, resize);
    resize();
    return { view, dispose: () => {
            Laya.stage.off(Laya.Event.RESIZE, view, resize);
            view.destroy(true);
        } };
}
