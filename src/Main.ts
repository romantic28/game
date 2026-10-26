import { mountParty } from './MountParty';
const { regClass } = Laya;
@regClass()
export class Main extends Laya.Script {
    private party:ReturnType<typeof mountParty>;
    onStart(){ Laya.stage.bgColor='#171d36';this.party=mountParty(); }
    onDestroy(){this.party?.dispose();}
}
