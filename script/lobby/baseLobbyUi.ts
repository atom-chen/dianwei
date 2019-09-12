import { GameId } from "../game-share/game";
import LobbyUser from "./lobbyUser";

const { ccclass, property } = cc._decorator;

@ccclass
export default abstract class BaseLobbyUi extends cc.Component {
    @property(cc.Node)
    nodeLeft: cc.Node = undefined;

    @property(cc.Node)
    nodeRight: cc.Node = undefined;

    private leftX: number;
    private rightX: number;



    protected onLoad() {
        this.leftX = this.nodeLeft.x;
        this.rightX = this.nodeRight.x;
        this.node.active = false;
    }

    async beforeShow(...args: any[]) {
        return true;
    }

    show() {
        // 先判断onLoad方法是否被调用过,等于0则否
        if (this._isOnLoadCalled === 0)
            this.node.active = true;
        this.node.active = true; // active两次是因为节点可能没加载过，没掉过onLoad，导致又被设为false，所以active两次

        let duration = 0.2;
        let winWidth = cc.winSize.width;
        let leftParts = this.nodeLeft;
        let rightParts = this.nodeRight;

        leftParts.x = this.leftX - winWidth;
        rightParts.x = this.rightX + winWidth;
        leftParts.stopAllActions();
        leftParts.runAction(
            cc.moveTo(duration, cc.p(this.leftX, leftParts.y)).easing(cc.easeSineOut())
        );
        rightParts.stopAllActions();
        rightParts.runAction(
            cc.moveTo(duration, cc.p(this.rightX, rightParts.y)).easing(cc.easeSineOut())
        );
    }

    hide() {
        let duration = 0.2;
        let winWidth = cc.winSize.width;
        let leftParts = this.nodeLeft;
        let rightParts = this.nodeRight;

        leftParts.x = this.leftX;
        rightParts.x = this.rightX;
        leftParts.stopAllActions();
        leftParts.runAction(
            cc.moveTo(duration, cc.p(this.leftX - winWidth, leftParts.y)).easing(cc.easeSineIn())
        );
        rightParts.stopAllActions();
        rightParts.runAction(cc.sequence(
            cc.moveTo(duration, cc.p(this.rightX + winWidth, rightParts.y)).easing(cc.easeSineIn()),
            cc.callFunc(() => {
                this.node.active = false;
            })
        ));
    }
}
