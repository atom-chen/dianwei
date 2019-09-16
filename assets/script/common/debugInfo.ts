import g from "../g";

const { ccclass, property } = cc._decorator;

@ccclass
export default class DebugInfo extends cc.Component {
    @property(cc.RichText)
    info: cc.RichText = undefined;

    onLoad() {
        this.refresh();
        this.schedule(this.refresh, 0.2);
    }

    refresh() {
        this.info.string = g.debugInfo;
    }

    closeUI() {
        this.node.removeFromParent();
    }
}