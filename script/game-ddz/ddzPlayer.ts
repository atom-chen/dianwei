import DDZGame, { ScoreStatus } from "./ddzGame";
import DiscardPlayer from "../game-share/dpPlayer";
import Game from "../game-share/game";
import PokerRes from "../game-share/pokerRes";
import * as util from "../common/util";
import { CARD_TYPE } from "./ddzCardTools";

export enum PlayerStates {
    /**未准备 */
    UNREADY,
    /**已准备 */
    READY,
    //开始了
    STARTED,
    //叫分
    CALLSCORE,
    CALLSCORE_END,
    //加倍
    DOUBLE,
    DOUBLE_END,
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
export default class DdzPlayer extends DiscardPlayer {
    @property(cc.Label)
    private labRemainCard: cc.Label = undefined;

    @property(cc.Node)
    private nodeMul: cc.Node = undefined;

    @property(cc.Node)
    private nodeStatus: cc.Node = undefined;

    @property(cc.Node)
    private nodeAuto: cc.Node = undefined;

    @property(cc.Node)
    private nodeCenterPos: cc.Node = undefined;

    @property(cc.Node)
    private nodeEffSiren: cc.Node = undefined;

    @property(cc.Node)
    private nodeBomb: cc.Node = undefined;

    @property([cc.Node])
    private nodeDoubleArr: cc.Node[] = [];

    @property([cc.SpriteFrame])
    private sfHeadArr: cc.SpriteFrame[] = [];

    @property(cc.Label)
    private labSeat: cc.Label = undefined;

    private NOR_PLAYER_CARD_NUM = 17;                       // 手牌个数
    private DEALER_CARD_NUM = 20;
    private SIREN_NUM = 2;                                   // 达到提示警报的牌数

    private nodeScoreArr: cc.Node[] = [];

    game: DDZGame;

    private _lastCards: number[] = [];
    private bombPos: cc.Vec2 = undefined;
    private _remainNum: number;
    private _addMul: number;

    get lastCards() {
        return this._lastCards;
    }

    get addMul() {
        return this._addMul;
    }

    onLoad() {
        super.onLoad();

        // 显示状态分为分数、不出、加倍
        for (let i = ScoreStatus.ZERO; i <= ScoreStatus.THREE; i++) {
            let node = this.nodeStatus.getChildByName(i.toString());
            this.nodeScoreArr[i] = node;
        }

        this.bombPos = this.nodeBomb.getPosition();
    }

    init(game: Game) {
        super.init(game);
    }

    onEnable() {
        this.initUI();
    }

    private initUI() {
        this.nodeMul.active = false;
        this.nodeBomb.active = false;
        if (this.labRemainCard) {
            this.labRemainCard.node.parent.active = false;
        }

        this.nodeStatus.active = true;
        this.hideAllStatus(false);

        this.setDealer(false);
        this.setAuto(false);
        this.setSirenAnim(false);
        this.setDealerHead(false);

        this._addMul = 0;
    }

    changeState(state: PlayerStates): void {
        this.state = state;

        switch (state) {
            case PlayerStates.UNREADY:
                this.cleanCards();
                break;
            case PlayerStates.READY:
                break;
            case PlayerStates.CALLSCORE:
                break;
            case PlayerStates.CALLSCORE_END:
                this.nodeScoreArr.forEach(node => {
                    node.active = false;
                })
                break;
            case PlayerStates.DOUBLE:
                break;
            case PlayerStates.DOUBLE_END:
                this.hideAllStatus();
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
        this.labSeat.string = this.serverPos.toString();
    }

    leaveAni() {
        this.node.stopAllActions();
        this.node.runAction(cc.sequence(cc.scaleTo(0.3, 0, 0), cc.callFunc(this.hide, this)));
    }

    updateHead() {
    }

    setDealerHead(visible: boolean) {
        let headIdx = visible ? 1 : 0;
        this.spriteAvatar.spriteFrame = this.sfHeadArr[headIdx];
    }

    setDealer(visible: boolean, action = true) {
        this.isDealer = visible;
        this.spriteDealer.node.active = visible;
        if (visible) {
            let scale = 0.5;
            let oldPos = this.spriteDealer.node.getPosition();
            if (action) {
                this.spriteDealer.node.scale = 1;
                let centerPos = this.node.convertToNodeSpaceAR(cc.p(cc.winSize.width * 0.5, cc.winSize.height * 0.5));
                this.spriteDealer.node.setPosition(centerPos);
                let moveTime = 0.3;
                return new Promise(resolve => {
                    this.spriteDealer.node.runAction(cc.sequence(
                        cc.spawn(cc.scaleTo(moveTime, scale, scale), cc.moveTo(moveTime, oldPos).easing(cc.easeSineOut())),
                        cc.callFunc(() => {
                            this.setCurrCardNum();
                            this.setDealerHead(true);
                            resolve(true);
                        })
                    ));
                });
            } else {
                this.spriteDealer.node.scale = scale;
                this.spriteDealer.node.setPosition(oldPos);
                this.setDealerHead(true);
            }
        }
    }

    hideAllStatus(clean: boolean = true) {
        this.nodeScoreArr.forEach(node => {
            node.active = false;
        })
        this.nodeDoubleArr.forEach(node => {
            node.active = false;
        })
        this.setNoPlay(false);
        if (clean) {
            this.cleanCards();
        }
    }

    turnJiaoFen(left: number) {
        this.setWaitTime(left);
    }

    /**
     * 叫分
     * @param score
     */
    showScoreStatus(score: number) {
        this.endWaitTime();
        this.nodeScoreArr.forEach((node, i) => {
            node.active = false;
            if (i === score) {
                node.active = true;
            }
        });
    }

    /**
     * 是否加倍
     */
    showMulStatus(mul: number) {
        this.endWaitTime();
        this.nodeDoubleArr[mul - 1].active = true;
        if (mul > 1) {
            this.nodeMul.active = true;
        }
        this._addMul = mul;
    }

    /**
     * 叫地主结束,开始游戏
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
        } else if (this.isDealer) {
            this._remainNum = this.DEALER_CARD_NUM;
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
        this.nodeBomb.setPosition(this.bombPos);
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
}
