import { mountParty } from './app/MountParty';
import { loadStaticArt } from './characters/CharacterResources';
const { regClass } = Laya;
@regClass()
export class Main extends Laya.Script {
    private party: ReturnType<typeof mountParty>;
    private stopped = false;
    private startupError: Laya.Text;
    onStart() {
        Laya.stage.bgColor = '#171d36';
        loadStaticArt().then(() => {
            if (!this.stopped)
                this.party = mountParty();
        }).catch(error => {
            console.error('染色玩法开发预览启动失败', error);
            if (this.stopped)
                return;
            const message = new Laya.Text();
            message.text = '游戏启动失败，请查看控制台：\n' + String(error);
            message.fontSize = 22;
            message.color = '#ffb3b3';
            message.wordWrap = true;
            message.pos(20, 40);
            message.size(Math.max(260, Laya.stage.width - 40), 240);
            Laya.stage.addChild(message);
            this.startupError = message;
        });
    }
    onDestroy() {
        this.stopped = true;
        this.party?.dispose();
        this.startupError?.destroy(true);
    }
}
