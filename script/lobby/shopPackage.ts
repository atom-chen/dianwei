import PopActionBox from "./popActionBox"
import g from "../g";

const { ccclass, property } = cc._decorator;

@ccclass
export default class ShopPackage extends PopActionBox {

    @property(cc.Label)
    content: cc.Label = undefined;

    @property(cc.Label)
    title: cc.Label = undefined;

    start() {
        super.start();
    }
    onClickBg() {
        this.node.parent.removeChild(this.node);
        this.node.destroy();
    }

    onClickUpdate() {
        let url = g.updateUrl;
        cc.sys.openURL(url);
    }

    setContent(info: string) {
        this.content.getComponent(cc.Label).string = info;
    }
    setTitle(info: string) {
        this.title.getComponent(cc.Label).string = info;
    }
}
