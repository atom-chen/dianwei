
const { ccclass, property } = cc._decorator;

@ccclass
export default class SlideBox extends cc.Component {
    @property(cc.ScrollView)
    private svList: cc.ScrollView = undefined

    private rightX = 1400
    onLoad() {
        this.node.x = this.rightX
        if (this.svList)
            this.svList.node.active = false
    }

    protected start() {
        this.openBox(() => {
            if (this.svList)
                this.svList.node.active = true
        })
    }

    openBox(cb?: Function) {
        this.node.active = true
        this.node.x = this.rightX
        this.node.runAction(cc.sequence(
            cc.moveTo(0.2, cc.p(cc.winSize.width / 2, 0)).easing(cc.easeSineOut()),
            cc.callFunc(() => {
                this.node.emit("open");
                if (cb) cb();
            })
        ))
    }

    closeBox(cb?: Function) {
        this.node.runAction(cc.sequence(
            cc.moveTo(0.2, cc.p(this.rightX, 0)).easing(cc.easeSineOut()),
            cc.callFunc(() => {
                this.node.active = false
                this.node.emit("close");
                if (cb && typeof cb === "function")
                    cb()
            })
        ))
    }

    onClickClose() {
        this.closeBox()
    }
}
