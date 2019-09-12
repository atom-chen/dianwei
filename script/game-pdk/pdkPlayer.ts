import PdkGame from "./pdkGame";
import DiscardPlayer from "../game-share/dpPlayer";
import Game from "../game-share/game";
import PokerRes from "../game-share/pokerRes";
import * as util from "../common/util";
import { CARD_TYPE } from "./pdkCardTools";

export enum PlayerStates {
    /**未准备 */
    UNREADY,
    /**已准备 */
    READY,
    //开始了
    STARTED,
    // 开始游戏
    STARTGAME,
    //结算了
    RESULT,
    //end了
    END,
    //断线了
    OFFLINE
}

const { ccclass, property } = cc._decorator;

@ccclass
export default class PdkPlayer extends DiscardPlayer {
    @property(cc.Label)
    private labRemainCard: cc.Label = undefined;

    @property(cc.Node)
    private nodeAuto: cc.Node = undefined;

    @property(cc.Node)
    private nodeCenterPos: cc.Node = undefined;

    @property(cc.Node)
    private nodeEffSiren: cc.Node = undefined;

    @property(cc.Node)
    private nodeBomb: cc.Node = undefined;

    @property(cc.Node)
    private firstDiscard: cc.Node = undefined;

    @property(cc.Node)
    private endAnimNode: cc.Node = undefined;               // 被关


    @property(cc.Label)
    private lab_seat: cc.Label = undefined;

    private NOR_PLAYER_CARD_NUM = 16;                       // 手牌个数
    private SIREN_NUM = 2;                                  // 达到提示警报的牌数

    game: PdkGame;

    private _lastCards: number[] = [];
    private _bombPos: cc.Vec2 = undefined;
    private _firstPos: cc.Vec2 = undefined;
    private _remainNum: number;
    private _isFirst: boolean;

    get lastCards() {
        return this._lastCards;
    }

    set isFirst(i: boolean) {
        this._isFirst = i;
    }

    get isFirst() {
        return this._isFirst;
    }

    get remainNum() {
        return this._remainNum;
    }

    onLoad() {
        super.onLoad();
        this._bombPos = this.nodeBomb.getPosition();
        if (this.firstDiscard)
            this._firstPos = this.firstDiscard.getPosition();
    }

    init(game: Game) {
        super.init(game);
    }

    onEnable() {
        this.initUI();
    }

    private initUI() {
        this.nodeBomb.active = false;
        if (this.labRemainCard) {
            this.labRemainCard.node.parent.active = false;
        }

        this.hideAllStatus(false);
        this.setAuto(false);
        this.setSirenAnim(false);
        this.isFirst = false;
        this.endAnimNode.active = false;

        if (this.serverPos)
            this.lab_seat.string = this.serverPos.toString();
    }

    changeState(state: PlayerStates): void {
        this.state = state;

        switch (state) {
            case PlayerStates.UNREADY:
                this.cleanCards();
                break;
            case PlayerStates.READY:
                break;
            case PlayerStates.STARTGAME:
                break;
            case PlayerStates.END:

                break;
        }
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
            this.node.runAction(cc.scaleTo(0.3, 1, 1).easing(cc.easeBackIn()));
        }
    }

    leaveAni() {
        this.node.stopAllActions();
        this.node.runAction(cc.sequence(cc.scaleTo(0.3, 0, 0), cc.callFunc(this.hide, this)));
    }

    hideAllStatus(clean: boolean = true) {
        this.setFirst(false);
        this.setNoPlay(false);
        if (clean) {
            this.cleanCards();
        }
    }

    setFirst(visible: boolean) {
        if (visible) this.isFirst = true;
        if (!this.firstDiscard) return;
        this.firstDiscard.active = visible;
        if (visible) {
            this.firstDiscard.stopAllActions();
            this.firstDiscard.setPosition(this._firstPos);
            this.firstDiscard.scale = 0;
            let remainPos = this.labRemainCard.node.parent.getPosition();
            this.firstDiscard.runAction(cc.sequence(
                cc.scaleTo(0.3, 1).easing(cc.easeBounceOut()),
                cc.delayTime(2),
                cc.spawn(cc.scaleTo(0.5, 0), cc.moveTo(0.5, remainPos)),
            ));
        }
    }

    /**
     * 开始游戏
     */
    startGame() {
        this.hideAllStatus();
    }

    /**
     * 显示打出的牌
     * @param cards
     */
    showDiscard(cards: number[], shape?: CARD_TYPE) {
        this.endWaitTime();
        this.hideAllStatus();
        if (!this.isMe && shape) {
            this.showRemainCard(cards.length);
        }

        this.discardAction(cards, shape);
        if (shape === CARD_TYPE.CT_BOMB) {
            this.playBomb();
        }
        this._lastCards = cards;
    }

    /**
     * 设置当前的牌个数
     */
    setCurrCardNum(cardNum?: number) {
        if (cardNum) {
            this._remainNum = cardNum;
        } else {
            this._remainNum = this.NOR_PLAYER_CARD_NUM;
        }
        this.showRemainCard(0);
    }

    /**
     * 剩余牌数
     * @param discardNum
     */
    showRemainCard(discardNum: number) {
        if (!this._remainNum || !this.labRemainCard) {
            return;
        }
        this._remainNum -= discardNum;
        this.labRemainCard.node.parent.active = true;
        this.labRemainCard.string = this._remainNum.toString();

        if (this._remainNum <= 0) {
            this.labRemainCard.node.parent.active = false;
        }

        this.checkBaojing(this._remainNum);
    }

    hideRemain() {
        this.labRemainCard.node.parent.active = false;
    }

    checkBaojing(num: number) {
        // 小于两张时播放警报
        if (num <= this.SIREN_NUM && num > 0) {
            this.setSirenAnim(true);
            this.game.audioMgr.playBaojing(this.isMale, num);
        }
    }

    /**
     * 丢出炸弹
     */
    playBomb() {
        this.nodeBomb.active = true;
        this.nodeBomb.setPosition(this._bombPos);
        this.nodeBomb.setScale(0.5, 0.5);

        let centerPos = this.node.convertToNodeSpaceAR(cc.p(cc.winSize.width * 0.5, cc.winSize.height * 0.6));
        let time = this.game.bombDelayTime;
        this.nodeBomb.runAction(cc.sequence(
            cc.spawn(cc.jumpTo(time, centerPos, 80, 1), cc.scaleTo(time, 1), cc.rotateBy(time, 270)),
            cc.callFunc(() => {
                this.nodeBomb.active = false;
            })
        ));
    }

    /**
     * 托管
     * @param visible
     */
    setAuto(visible: boolean) {
        if (!this.nodeAuto) {
            return;
        }
        this.nodeAuto.active = visible;
    }

    /**
     * 轮到谁操作
     */
    turnPlay(leftTime: number) {
        this.hideAllStatus();
        this.setWaitTime(leftTime);
    }

    setSirenAnim(visible: boolean) {
        if (!this.nodeEffSiren) {
            return;
        }
        this.nodeEffSiren.active = visible;
        if (visible) {
            this.game.playSirenAnim(this.nodeEffSiren);
        }
    }

    /**
     * 是否播放被关动画
     * @param isClosed
     */
    playEndAnim(isClosed: boolean) {
        return new Promise((resolve) => {
            if (isClosed) {
                this.endAnimNode.stopAllActions();
                this.endAnimNode.active = true;
                let door = this.endAnimNode.getChildByName("door");
                door.active = true;
                door.scale = 5;
                door.opacity = 0;
                door.rotation = 0;
                let lab = this.endAnimNode.getChildByName("lab");
                lab.active = false;
                let scTime = 0.5;
                door.runAction(cc.sequence(
                    cc.spawn(cc.scaleTo(scTime, 1).easing(cc.easeBounceOut()), cc.fadeIn(scTime), cc.rotateTo(scTime, 0)),
                    cc.callFunc(() => {
                        lab.active = true;
                        lab.runAction(cc.sequence(
                            cc.delayTime(1),
                            cc.callFunc(() => {
                                this.endAnimNode.active = false;
                                resolve();
                            }),
                        ));
                    }),
                ));
                setTimeout(resolve, 1500);
            } else {
                resolve();
            }
        });
    }
}
