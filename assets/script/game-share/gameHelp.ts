
import ScrollViewBox from "../lobby/scrollViewBox";

const { ccclass, property } = cc._decorator;

@ccclass
export default class GameHelp extends ScrollViewBox {

    @property(cc.Label)
    protected label: cc.Label = undefined;

    protected onLoad() {
        // init logic
        super.onLoad();
        this.label.string = "暂无说明";
    }

    showContent(str: string) {
        this.label.string = str;
    }
}
