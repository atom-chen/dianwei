import Audio from "../common/audio";

const { ccclass, property } = cc._decorator;

@ccclass
export default class ErmjTicker extends cc.Component {
    @property(Audio)
    protected audioMgr: Audio = undefined;


    startTick(time: number) {
        this.node.getComponent(cc.Label).string = time + '';
        this.unschedule(this.tick);
        this.schedule(this.tick, 1, time - 1);
    }

    private tick() {
        let lab = this.node.getComponent(cc.Label);
        let str = '';
        if (+lab.string - 1 < 0) {
            str = 0 + '';
        } else {
            str = +lab.string - 1 + ''
        }
        lab.string = str;

        if (this.audioMgr) {
            this.audioMgr.playClock();
        }
    }

}
