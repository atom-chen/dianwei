import BrnnGame from "./brnnGame";

import Player from "../game-share/player";
import * as util from "../common/util";
import Game from "../game-share/game";

export enum PlayerStates {
    /**未准备 */
    UNREADY,
    /**已准备 */
    READY,
    //开始了
    STARTED,
    //开始下注
    BETTING,
    //结算了
    RESULT,
    //end了
    END,
    //断线了
    OFFLINE
}

const { ccclass, property } = cc._decorator;

@ccclass
export default class BrnnPlayer extends Player {
    game: BrnnGame;

    private selfPos: cc.Vec2;

    onLoad() {
        super.onLoad();
        this.selfPos = this.node.getPosition();
    }

    init(game: Game) {
        super.init(game);
    }

    onEnable() {
        this.initUI();
    }

    private initUI() {

    }

    initRound() {

    }

    changeState(state: PlayerStates): void {
        this.state = state;
    };

    get isLooker() {
        return false;
    }

    enterAni(doAnim = true) {
        this.show();
        if (doAnim) {
            this.node.stopAllActions();
            this.node.scaleX = 0;
            this.node.scaleY = 0;
            this.node.runAction(cc.sequence(cc.scaleTo(0.1, 1, 1).easing(cc.easeQuadraticActionOut()), cc.callFunc((() => {
                this.node.scaleX = 1;
                this.node.scaleY = 1;
            }))));
        }
    }

    leaveAni() {
        this.node.stopAllActions();
        this.node.runAction(cc.sequence(cc.scaleTo(0.1, 0, 0), cc.callFunc(this.hide, this)));
    }

    show() {
        if (!!this.isMale && !!this.avatar) {
            this.spriteAvatar.spriteFrame = util.getAvatar(this.isMale, this.avatar);
        }
        this.lblLocation.node.active = true;
        this.spriteBalanceIcon.node.active = true;
        this.lblBalance.node.active = true;
    }

    hide() {
        this.spriteAvatar.spriteFrame = util.getAvatar(this.isMale, -1);
        this.lblLocation.node.active = false;
        this.spriteBalanceIcon.node.active = false;
        this.lblBalance.node.active = false;
    }

    doBeting(betPoint: string, isAni = true) {
        if (this.balance !== undefined) {
            this.balance = util.sub(this.balance, betPoint).toNumber();
            this.updateBalance();
        }

        if (isAni) {
            this.node.stopAllActions();
            this.node.setPosition(this.selfPos);
            this.node.scaleX = 1;
            this.node.scaleY = 1;

            let worldPos = this.node.convertToWorldSpaceAR(cc.v2(0, 0));
            let moveOff = 20;
            if (worldPos.x > cc.winSize.width * 0.5) {
                moveOff = -moveOff;
            }
            let moveTime = 0.2;
            this.node.runAction(cc.sequence(
                cc.moveBy(moveTime, cc.v2(moveOff, 0)).easing(cc.easeBackOut()),
                cc.moveBy(moveTime * 0.5, cc.v2(-moveOff, 0)),
            ));
        }
    }

    getPlayerPos(): cc.Vec2 {
        return this.node.getPosition();
    }

    convertToNodePos(node: cc.Node): cc.Vec2 {
        let worldPos = this.node.convertToWorldSpaceAR(this.spriteAvatar.node.position);
        return node.convertToNodeSpaceAR(worldPos);
    }
}
