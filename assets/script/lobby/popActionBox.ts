import * as util from "../common/util";
import LobbyUser from "./lobbyUser";
const { ccclass, property } = cc._decorator;

@ccclass
export default class PopActionBox extends cc.Component {
    @property(cc.Node)
    protected nodeBg: cc.Node = undefined;

    @property(cc.Node)
    protected nodeBox: cc.Node = undefined;

    @property(cc.Button)
    protected btnClose?: cc.Button = undefined

    private bgOpacity: number;
    protected _canvas: cc.Node
    private _user: LobbyUser;
    public autoDestroy = true;
    get user() {
        if (!this._user) {
            let topNode = cc.find("Canvas/top");
            this._user = topNode.getComponent(LobbyUser);
        }
        return this._user;
    }
    protected onLoad() {
        this.nodeBg.width = 1400;
        this.nodeBg.active = false;
        this.nodeBox.active = false;
        this.bgOpacity = this.nodeBg.opacity;
        if (this.btnClose) {
            let handler = new cc.Component.EventHandler()
            handler.target = this.node
            handler.component = cc.js.getClassName(this)
            handler.handler = 'closeAction'
            util.addSingleEvent(this.btnClose, handler)
        }
    }

    protected start() {
        this.openAnim();
    }
    get canvas() {
        if (!this._canvas)
            this._canvas = cc.find("Canvas")
        return this._canvas
    }
    openAction(parent: cc.Node, child: cc.Prefab) {
        util.showLoading("");
        let ui = util.instantiate(child);
        parent.addChild(ui);
        util.hideLoading();
        return ui;
    }

    protected closeAction(cb?: Function) {
        util.playClickSound();
        let animTime = 0.3;
        this.nodeBg.runAction(cc.fadeTo(animTime, 0));
        this.nodeBox.runAction(cc.sequence(
            cc.scaleTo(animTime, 0).easing(cc.easeBackIn()),
            cc.callFunc(() => {
                if (cb && typeof cb === "function")
                    cb();
                this.node.active = false;
                this.node.emit("close");
                if (this.autoDestroy) {
                    this.node.removeFromParent(true);
                    this.node.destroy();
                }
            }))
        );
    }

    openAnim(cb?: Function) {
        this.node.active = true;
        this.node.position = cc.p(0, 0);
        this.nodeBg.active = true;
        this.nodeBox.active = true;
        let animTime = 0.3;
        this.nodeBg.opacity = 0;
        this.nodeBg.runAction(cc.fadeTo(animTime, this.bgOpacity));
        this.nodeBox.scale = 0;
        this.nodeBox.runAction(cc.sequence(
            cc.scaleTo(animTime, 1, 1).easing(cc.easeBackOut()),
            cc.callFunc(() => {
                this.node.emit("open");
                if (cb) cb();
            }),
        ));
    }
}
