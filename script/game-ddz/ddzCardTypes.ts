import PopActionBox from "../lobby/popActionBox"
const { ccclass, property } = cc._decorator;

@ccclass
export default class CardTypes extends PopActionBox {
    @property(cc.ScrollView)
    private svList: cc.ScrollView = undefined;

    @property(cc.Node)
    private svItem: cc.Node = undefined;

    onLoad() {
        super.onLoad();
        this.svList.node.active = false;
    }

    protected start() {
        this.openAnim(() => {
            this.svList.node.active = true;
            // this.svItem.active = false;
        });
    }

}
