import Game, { GameId } from "../game-share/game";
import PokerRes from "../game-share/pokerRes";
import * as util from "../common/util";
import ItemNames from "../common/itemNames";

import Msg from "./pdkMsg";
import Audio from "./pdkAudio";
import pdkPlayerMgr from "./pdkPlayerMgr";
import RecordCard from "./pdkRecordCard";
import HoldMgr from "./pdkHoldMgr";
import Result from "./pdkResult";
import { CARD_TYPE } from "./pdkCardTools";
import Poker from "./pdkPoker";

export enum State {
    WaitPrepare,
    WaitStart,
    Start,
    End
}

const enum AutoDesc {
    Auto = "自动出牌",
    Cancel = "取消自动",
}

const { ccclass, property } = cc._decorator;

@ccclass
export default class PdkGame extends Game {
    @property(RecordCard)
    recordCardPanel: RecordCard = undefined;

    @property(HoldMgr)
    private holdMgr: HoldMgr = undefined;

    @property(Result)
    resultPanel: Result = undefined;

    @property(cc.Label)
    private lblClock: cc.Label = undefined;

    @property(cc.Label)
    private labBaseScore: cc.Label = undefined;


    @property(cc.Node)
    private outCardPanel: cc.Node = undefined;

    @property(cc.Node)
    private abandonPanel: cc.Node = undefined;

    @property(cc.Node)
    private autoPanel: cc.Node = undefined;

    @property(cc.Node)
    private nodeRecord: cc.Node = undefined;

    @property(cc.Node)
    private nodePayNotice: cc.Node = undefined;// 包赔提示

    @property(cc.Node)
    private nodeAdvanceTips: cc.Node = undefined;// 提前亮牌提示

    @property(cc.Node)
    private nodeHideHold: cc.Node = undefined;

    @property(cc.Node)
    private payPanel: cc.Node = undefined;

    @property(cc.Label)
    labTips: cc.Label = undefined;

    @property(cc.Button)
    private btnPrompt: cc.Button = undefined;

    @property(cc.Button)
    private btnOutCard: cc.Button = undefined;

    @property(cc.Node)
    private btnHosted: cc.Node = undefined;

    @property(cc.Prefab)
    private preEffAirplane: cc.Prefab = undefined;

    @property(cc.Prefab)
    private spBoom: cc.Prefab = undefined;

    @property(cc.Prefab)
    private prePokerRes: cc.Prefab = undefined;

    gameName = GameId.PDK;
    playerMgr: pdkPlayerMgr;
    audioMgr: Audio;
    msg: Msg;

    private _pokerRes: PokerRes;

    private _lastCardSuit: CARD_TYPE;
    private _lastCardData: number[];
    private _isFirstWaitOut: boolean; // 在本局游戏中第一个出牌
    private _isReturnGame: boolean; // 正在回到游戏
    private _isFirstPlay: boolean; // 在本伦游戏中是否先手

    private _isHosted: boolean;
    private _isShowOpt: boolean;

    private tickerPos: cc.Vec2 = undefined;

    readonly bombDelayTime = 0.5;// 炸弹特效等待时间
    readonly MIN_REMAIN_NUM = 1; // 特殊处理玩家剩余最低牌数


    get pokerRes() {
        if (!this._pokerRes) {
            this._pokerRes = util.instantiate(this.prePokerRes).getComponent(PokerRes);
        }
        return this._pokerRes;
    }

    set returnGame(visible: boolean) {
        this._isReturnGame = visible;
    }

    onLoad() {
        super.onLoad();
        this.tickerPos = this.lblClock.node.parent.getPosition();
    }

    initRound(): void {
        cc.log("初始化一局");

        this.lblClock.node.parent.active = false;
        this.outCardPanel.active = false;
        this.abandonPanel.active = false;
        this.nodeRecord.active = false;
        this.nodePayNotice.active = false;

        this.meHosted(false);
        this.btnHosted.active = false;

        this.recordCardPanel.hide();
        this.hideOptPanel();

        this._isFirstWaitOut = true;
        this._isReturnGame = false;
        this._lastCardSuit = undefined;
        this._lastCardData = undefined;

        // // 测试
        // this.scheduleOnce(() => {
        //     let msg = {
        //         leftTime: 20,
        //         // handleCards: [272, 526, 525, 1036, 779, 778, 521, 264, 263, 262, 517, 1028, 1027],
        //         handleCards: [1037,1037,1037,781,780,780,780,771,515],
        //     }
        //     this.msg.handleDealData(msg);
        // }, 2);

        // // 出牌
        // this.scheduleOnce(() => {
        //     let sss = [521, 521, 521];
        //     this.holdMgr.setPlayerData(sss);
        // }, 4);
    }
    dealRoomData(data: any): void {
        this.labBaseScore.string = this.baseScore + "";
    }
    initGame(): void {
        cc.log("初始化 init");

        this.msg = new Msg(this);
        this.msg.init();
        this.playerMgr = new pdkPlayerMgr(this);
        this.menu.init(this);
        this.holdMgr.addGame(this);
        this.resultPanel.setGame(this);

    }

    get ableStart() {
        return this.playerMgr.readyCount > 3;
    }

    setRoomInfo(config: any): void {
        cc.log("---config---",config);
        this.labBaseScore.string = util.add(config.bets, 0).toString();
    }

    refreshRoomInfo() {
        this.holdMgr.clearCards();
        this.resultPanel.hide();
    }

    showTicker(time: number): void {
        let node = this.lblClock.node.parent;
        node.active = true;
        let t = Math.round(time);
        this.lblClock.string = t.toString();
        this.unschedule(this.countdownStart);
        this.schedule(this.countdownStart, 1, t, 1);

        node.y = this.tickerPos.y + 45;
        this.tickerShowAction(node, 1);
    }

    hideTicker(): void {
        this.tickerHideAction(this.lblClock.node.parent);
    }

    private countdownStart() {
        let t = +this.lblClock.string || 0;
        t--;
        t = Math.max(t, 0);
        this.lblClock.string = t.toString();

        if (t > 0)
            this.audioMgr.playClock();
    }


    changeState(s: number, left?: number) {
        super.changeState(s);
    }

    updateUI(): void {
        let me = this.playerMgr.me;
        this.hidePrepare();

        switch (this.gameState) {
            // 等待开始
            case State.WaitStart:
                break;
            // 开始
            case State.Start:
                this.isGaming = true;
                this.hideStartTicker();

                this.recordCardPanel.resetNum();
                this.meHosted(false);

                break;
            case State.End:
                this.isGaming = false;
                break;
        }
        this.menu.updateBtnState();
    }

    setWaitPrepare(): void {
        // this.changeState(State.WaitPrepare);
    }
    setWaitStart(): void {
        // this.changeState(State.WaitStart);
    }
    setStarted(): void {
        this.playerMgr.initEnable();
        this.changeState(State.Start);
    }
    setGameEnd(): void {
        this.changeState(State.End);
    }

    initHolds(cards: number[]) {
        this.holdMgr.initCards(cards);
        this.holdMgr.sendCardsAnimation();
        this.recordCardPanel.saveDiscardNum(cards);

        this.audioMgr.playInitHolds();
    }

    sendCard(cards: number[]) {
        this.initHolds(cards);
        this.playerMgr.setRemainCard();
    }

    /**
     * 隐藏手牌
     * @param visible
     */
    hideHold(visible: boolean) {
        this.nodeHideHold.active = visible;
        this.holdMgr.setCardBack(visible);
    }

    /**
     * 轮到玩家出牌
     * @param rPos
     * @param first
     * @param leftTime
     */
    turnPlayerPlay(rPos: number, first: number = 1, leftTime?: number) {
        this._isFirstPlay = !!first;
        let player = this.playerMgr.getPlayerByServerPos(rPos);
        if (player) {
            player.turnPlay(leftTime);
            if (player.isMe) {
                // 当下家只剩一张牌时提示
                let nextPlayer = this.playerMgr.getNextPlayer();
                if (nextPlayer && (nextPlayer.remainNum === this.MIN_REMAIN_NUM) && !this._isHosted) {
                    this.nodePayNotice.active = true;
                } else {
                    this.nodePayNotice.active = false;
                }

                if (!!first) {
                    this.holdMgr.setPlayerData();
                } else {
                    this.holdMgr.setPlayerData(this._lastCardData);
                }
                this.hideHold(false);
            } else {
                this.nodePayNotice.active = false;
                // ♥️3非自己时要隐藏手牌
                if (this._isFirstWaitOut && !this._isReturnGame) {
                    this.hideHold(true);
                }
            }
        }
        // 第一次轮到玩家出牌
        if (this._isFirstWaitOut) {
            this._isFirstWaitOut = false;
            this.nodeRecord.active = true;
            this.recordCardPanel.show();
            if (!this._isReturnGame) {
                for (const player of this.playerMgr.playerArr) {
                    if (player && player.uid) {
                        player.hideAllStatus();
                    }
                }
                if (player) {
                    player.setFirst(true);
                }
            }
        }
    }

    /**
     * 展示玩家出牌
     * @param rPos
     * @param cards
     * @param shape
     */
    showPlayerDiscard(rPos: number, cards: number[], shape?: CARD_TYPE) {
        this._lastCardSuit = shape;
        this._lastCardData = cards;
        let player = this.playerMgr.getPlayerByServerPos(rPos);
        if (player) {
            player.showDiscard(cards, shape);
            this.audioMgr.playOutCard();
            if (shape) {
                // shape用来处理断线重连
                if (player.isMe) {
                    this.hideOptPanel();
                    this.holdMgr.removePlayCards(cards);

                    this._isShowOpt = undefined;
                    player.checkBaojing(this.holdMgr.getCardNum());
                } else {
                    this.recordCardPanel.saveDiscardNum(cards);
                }

                this.playCardAnim(shape);
                // 不是先手出牌则可播放大你音效
                if (this._isFirstPlay || (shape === CARD_TYPE.CT_BOMB)) {
                    this.playCardSound(player.isMale, shape, cards);
                } else {
                    let random = Math.floor(Math.random() * 2);
                    if (random === 0) {
                        this.playCardSound(player.isMale, shape, cards);
                    } else {
                        this.audioMgr.playDani(player.isMale);
                    }
                }
            }
        }
    }

    showPlayerNoPlay(rPos: number) {
        let player = this.playerMgr.getPlayerByServerPos(rPos);
        if (player) {
            player.showNoPlay();
            this.audioMgr.playBuyao(player.isMale);
            if (player.isMe) {
                this._isShowOpt = undefined;
                this.hideOptPanel();
                if (!this._isHosted)
                    this.holdMgr.enableCards(true);
            }
        }
    }

    /**
     * 显示操作按钮
     */
    showOptPanel(isShowOpt: boolean) {
        this._isShowOpt = isShowOpt;
        if (this._isHosted) {
            return;
        }

        if (isShowOpt) {
            this.outCardPanel.active = true;
            this.outCardPanel.children.forEach(node => {
                node.stopAllActions();
                node.scale = 1;
            });
        } else {
            this.abandonPanel.active = true;
            this.abandonPanel.children.forEach(node => {
                node.stopAllActions();
                node.scale = 1;
            });
            this.holdMgr.enableCards(false);
            this.nodePayNotice.active = false;
        }
    }

    hideOptPanel() {
        this.outCardPanel.active = false;
        this.abandonPanel.active = false;
        this.holdMgr.setHoldsSort();
    }

    setPlayCardBtn(visible: boolean) {
        this.btnOutCard.interactable = visible;
        let lab = this.btnOutCard.getComponentInChildren(cc.LabelOutline);
        lab.color = visible ? cc.hexToColor("#7E581D") : cc.hexToColor("#7B7E86");
    }

    setPayAnim(payName: string) {
        this.payPanel.active = true;
        this.payPanel.children.forEach(node => {
            node.active = false;
        });
        let node = this.payPanel.getChildByName(payName);
        if (node) {
            node.active = true;
            node.stopAllActions();
            node.scale = 0;
            node.runAction(cc.sequence(
                cc.scaleTo(0.5, 1).easing(cc.easeBounceOut()),
                cc.delayTime(1),
                cc.callFunc(() => {
                    this.payPanel.active = false;
                })
            ));
        }
    }

    showAdvanceTips() {
        return new Promise((resolve) => {
            this.nodeAdvanceTips.active = true;
            this.nodeAdvanceTips.stopAllActions();
            this.nodeAdvanceTips.scaleY = 0;
            this.nodeAdvanceTips.runAction(cc.sequence(
                cc.scaleTo(0.5, 1, 1).easing(cc.easeBounceOut()),
                cc.delayTime(1),
                cc.scaleTo(0.1, 1, 0).easing(cc.easeBounceIn()),
                cc.callFunc(resolve),
            ));
        });
    }

    // -------------------------------------------点击事件
    /**
     * 记牌器
     */
    onClickRecord() {
        if (this.recordCardPanel) {
            this.recordCardPanel.click();
        }
    }

    /**
     * 不出或要不起
     */
    onClickAbandon() {
        this.hideOptPanel();
        this.msg.sendNotPlay();
    }

    /**
     * 提示
     */
    onClickPrompt() {
        this.holdMgr.setPromptCard();
    }

    /**
     * 出牌
     */
    onClickOutCard() {
        this.outCardPanel.active = false;
        let data = this.holdMgr.getReadyDisCardsInfo();
        if (data) {
            this.msg.sendPlayCards(data.cardType, data.cardData);
        }
    }

    /**
     * 托管
     */
    onClickHosted() {
        this.msg.sendHosted();
    }

    meHosted(hosted: boolean) {
        this._isHosted = hosted;

        this.btnHosted.active = !hosted;
        this.autoPanel.active = hosted;
        this.holdMgr.enableCards(!hosted);

        if (hosted) {
            this.hideOptPanel();
        } else if (this._isShowOpt !== undefined) {
            this.showOptPanel(this._isShowOpt);
        }
    }

    /**
     * 取消托管
     */
    onClickCancel() {
        this.msg.sendHosted();
    }

    /**
     * 自动出牌
     */
    onClickAuto() {
        this.msg.sendHosted();
    }

    onClickNext() {
        this.resultPanel.hide();
        this.doPrepare();
        this.playerMgr.clearCards();
        this.holdMgr.clearCards();
        this.playerMgr.initEnable();
    }

    //-----------------------------声音、动画

    playCardAnim(cardType: CARD_TYPE) {
        if (cardType === CARD_TYPE.CT_THREE_STRAIGHT
            || cardType === CARD_TYPE.CT_THREE_STRAIGHT_ONE
            || cardType === CARD_TYPE.CT_THREE_STRAIGHT_TWO) {
            // 飞机
            this.playAirplaneAnim();
        } else if (cardType === CARD_TYPE.CT_BOMB) {
            // 炸弹
            this.playBombAnim();
        }
    }

    playCardSound(isMale: boolean, cardType: CARD_TYPE, cards: number[]) {
        if (cardType === CARD_TYPE.CT_SINGLE) {
            // 单牌
            this.audioMgr.playSingle(isMale, cards[0]);
        } else if (cardType === CARD_TYPE.CT_DOUBLE) {
            // 对子
            this.audioMgr.playDouble(isMale, cards[0]);
        } else if (cardType === CARD_TYPE.CT_THREE) {
            // 三条
            this.audioMgr.playTuple(isMale);
        } else if (cardType === CARD_TYPE.CT_SINGLE_STRAIGHT) {
            // 顺子
            this.audioMgr.playShunzi(isMale);
        } else if (cardType === CARD_TYPE.CT_DOUBLE_STRAIGHT) {
            // 连对
            this.audioMgr.playLiandui(isMale);
        } else if (cardType === CARD_TYPE.CT_THREE_STRAIGHT) {
            // 飞机
            this.audioMgr.playFeiji(isMale);
        } else if (cardType === CARD_TYPE.CT_THREE_STRAIGHT_ONE
            || cardType === CARD_TYPE.CT_THREE_STRAIGHT_TWO) {
            // 飞机带翅膀
            this.audioMgr.playFjWings(isMale);
        } else if (cardType === CARD_TYPE.CT_THREE_TAKE_ONE) {
            // 三带一单
            this.audioMgr.playSandaiyi(isMale);
        } else if (cardType === CARD_TYPE.CT_THREE_TAKE_TWO) {
            // 三带两单
            this.audioMgr.playSandaier(isMale);
        } else if (cardType === CARD_TYPE.CT_FOUR_TAKE_ONE) {
            // 四带一
            this.audioMgr.playSidaiyi(isMale);
        } else if (cardType === CARD_TYPE.CT_FOUR_TAKE_TWO) {
            // 四带二
            this.audioMgr.playSidaier(isMale);
        } else if (cardType === CARD_TYPE.CT_FOUR_TAKE_THREE) {
            // 四带三
            this.audioMgr.playSidaisan(isMale);
        } else if (cardType === CARD_TYPE.CT_BOMB) {
            // 炸弹
            this.audioMgr.playZhadan(isMale);
        }
    }

    playSirenAnim(node: cc.Node) {
        this.playRepeatAnim(node);
        this.audioMgr.playAlert();
    }

    playAirplaneAnim() {
        this.audioMgr.playAnimPlane();
        this.playAnim(this.preEffAirplane);
    }

    playBombAnim() {
        /*this.scheduleOnce(() => {
            this.audioMgr.playAnimBomb();
            this.spBoom.node.active = true;
            this.spBoom.animation = "animation";
            this.shake();
        }, this.bombDelayTime);*/
        this.audioMgr.playAnimBomb();
        this.playAnim(this.spBoom);
        this.shake();
    }

    shake() {
        let t = 0.08;
        let action = cc.sequence(cc.moveBy(t / 2, cc.p(10, 10)), cc.moveBy(t, cc.p(-20, -20)),
            cc.moveBy(t / 2, cc.p(10, 10)), cc.moveBy(t / 2, cc.p(0, 10)), cc.moveBy(t, cc.p(0, -20)), cc.moveBy(t / 2, cc.p(0, 10)),
            cc.moveTo(0, cc.p(0, 0)));


        this.node.parent.children[0].children[0].runAction(action);
    }

    playSucAnim(node: cc.Node) {
        this.audioMgr.playSuc();
        this.playRepeatAnim(node);
    }

    playFailAnim(node: cc.Node) {
        this.audioMgr.playFail();
        this.playRepeatAnim(node);
    }

    showPrepareTicker(timer?: number) {
        if (!this.dontPrepare) {
            this.doPrepare();
        } else {
            this.resultPanel.showTicker(timer);
            this.dontPrepare = false;
        }
    }
}