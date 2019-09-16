const { ccclass, property } = cc._decorator;


@ccclass
export default class Confirm extends cc.Component {

    @property(cc.Node)
    private bg: cc.Node = undefined;

    @property(cc.Node)
    private dlg: cc.Node = undefined;

    @property(cc.Label)
    protected info: cc.Label = undefined;

    @property(cc.Button)
    private ok: cc.Button = undefined;

    @property(cc.Button)
    private cancel: cc.Button = undefined;

    @property(cc.Button)
    private btnClose: cc.Button = undefined;

    autoClose: boolean;

    okFunc: Function;
    cancelFunc: Function;
    closeFunc: Function;

    onLoad() {
        this.node.active = false;
        if (this.btnClose)
            this.btnClose.node.active = false;
        this.bg.width = 1400;
    }

    start() {
        this.bg.opacity = 0;
        this.bg.runAction(cc.fadeTo(0.3, 125));
        this.dlg.scale = 0;
        this.dlg.runAction(cc.scaleTo(0.3, 1, 1).easing(cc.easeBackOut()));
    }

    show(info: string, okStr: string = "确定", cancelStr?: string) {
        this.node.active = true;
        this.cancel.node.active = !!cancelStr
        this.info.string = info;
        this.ok.getComponentInChildren(cc.Label).string = okStr;
        this.cancel.getComponentInChildren(cc.Label).string = cancelStr ? cancelStr : ""
    }
    /**
     * 显示关闭(close)按钮
     */
    showClose() {
        if (this.btnClose)
            this.btnClose.node.active = true;
    }

    private onClickOk() {
        this.close();
        if (this.okFunc) {
            this.okFunc();
        }
    }

    private onClickCancel() {
        this.close();
        if (this.cancelFunc) {
            this.cancelFunc();
        }
    }

    private onClickClose() {
        this.close();
    }

    close() {
        if (!this.isValid) return
        this.bg.runAction(cc.fadeTo(0.3, 0));
        this.dlg.runAction(cc.scaleTo(0.3, 0, 0).easing(cc.easeBackIn()));
        this.scheduleOnce(() => {
            if (this.closeFunc) {
                this.closeFunc();
            }
            this.node.active = false
            // this.node.emit("close");
            // this.node.destroy();
        }, 0.3);
    }
}
