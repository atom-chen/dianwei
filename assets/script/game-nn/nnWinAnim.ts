import * as util from "../common/util";
const { ccclass, property } = cc._decorator;

@ccclass
export default class NNWinAnim extends cc.Component {
    @property(cc.Prefab)
    private preParticle: cc.Prefab = undefined;

    private nodeParticle: cc.Node = undefined;

    onEnable() {
        if (!this.nodeParticle) {
            this.nodeParticle = util.instantiate(this.preParticle);
            this.node.addChild(this.nodeParticle);
        }
        this.nodeParticle.active = false;
    }

    hide() {
        this.node.active = false;
    }

    onWinCompleted() {
        cc.log("onWinCompleted");
        this.nodeParticle.active = true;
    }
}
