import PopActionBox from "../lobby/popActionBox"

const { ccclass, property } = cc._decorator;

@ccclass
export default class ScrollViewBox extends PopActionBox {
    @property(cc.ScrollView)
    protected scrollView: cc.ScrollView = undefined;

    private isOpenAnim = false;

    protected onLoad() {
        super.onLoad();
        this.scrollView.node.active = false;
    }

    openAnim(cb?: Function) {
        if (this.isOpenAnim) {
            return;
        }
        this.isOpenAnim = true;
        this.scrollView.node.active = false;
        super.openAnim(() => {
            this.scrollView.node.active = true;
            if (cb) {
                cb();
            }
            this.isOpenAnim = false;
        });
    }
}
