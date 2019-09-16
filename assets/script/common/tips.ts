const { ccclass, property } = cc._decorator;

const TIPS_TOTAL = 5;
const TIPS_INTERVAL = 50;

@ccclass
export default class Tips extends cc.Component {

    @property(cc.Label)
    info: cc.Label = undefined;

    @property(cc.Node)
    private tipsBg: cc.Node = undefined;

    @property
    private TIPS_WIDTH = 600;

    private tipsWidth: number = 0;
    static tipsArr: cc.Node[] = [];

    onLoad() {
        // init logic
        this.info.string = "请稍候";
        let node = this.node;
        node.y = cc.winSize.height / 2 + node.height;
        node.active = false;
    }

    start() {
        let node = this.node;
        this.tipsBg.width = this.tipsWidth;
        let height = cc.winSize.height * 0.05;
        node.setPositionY(height);
        node.runAction(cc.sequence(
            cc.delayTime(1),
            cc.fadeOut(0.3),
            cc.callFunc(() => {
                Tips.tipsArr.shift();
                // node.removeFromParent();
                // node.destroy();
                node.active = false;
            })
        ))
        Tips.tipsArr.push(node);

        if (Tips.tipsArr.length > TIPS_TOTAL) {
            let node = Tips.tipsArr.shift();
            node.stopAllActions();
            node.removeFromParent();
            node.destroy();

        }
        let tipsNum = Tips.tipsArr.length;
        for (let idx = 0; idx < tipsNum; idx++) {
            const tips = Tips.tipsArr[idx];
            if (tips && tips.isValid) {
                tips.runAction(cc.moveTo(0.1, cc.p(0, height + (tipsNum - idx) * TIPS_INTERVAL)));
            }
        }
    }

    /**
     * 显示提示信息
     * @param info 输出的文字信息
     * @param width undefined|0:默认预设值的宽度, -1:auto width, >1:制定宽度
     */
    show(info: string, width: number = -1) {
        if (info) {
            this.info.string = info;
        }
        this.tipsWidth = width > 0 ? width : this.TIPS_WIDTH;
        this.node.active = true;
    }

    static clean() {
        for (let idx = 0; idx < Tips.tipsArr.length; idx++) {
            let node = Tips.tipsArr[idx];
            node.stopAllActions();
            node.removeFromParent();
            node.destroy();
        }
        Tips.tipsArr = [];
    }
}