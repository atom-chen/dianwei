import Game, { GameId } from "../game-share/game";
import PokerRes from "../game-share/pokerRes";
import * as util from "../common/util";
import ItemNames from "../common/itemNames";
import Msg from "./ddzMsg";
import Audio from "./ddzAudio";
import DdzPlayerMgr from "./ddzPlayerMgr";
import RecordCard from "./ddzRecordCard";
import HoldMgr from "./ddzHoldMgr";
import { CARD_TYPE } from "./ddzCardTools";
import DdzResult from "./ddzResult";
import Poker from "./ddzPoker";

/**
 * 可叫的分数
 */
export enum ScoreStatus {
    ZERO = 0,
    ONE,
    TWO,
    THREE
}

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
export default class DdzGame extends Game {

    @property(cc.Label)
    private lblClock: cc.Label = undefined;

    @property(RecordCard)
    recordCardPanel: RecordCard = undefined;

    @property(DdzResult)
    resultPanel: DdzResult = undefined;

    @property(cc.Node)
    private nodeLordCards: cc.Node = undefined;

    @property(cc.Node)
    private showLordCardsPanel: cc.Node = undefined;

    @property(HoldMgr)
    private holdMgr: HoldMgr = undefined;

    @property(cc.Node)
    private scorePanel: cc.Node = undefined;

    @property(cc.Node)
    private addMulPanel: cc.Node = undefined;

    @property(cc.Node)
    private outCardPanel: cc.Node = undefined;

    @property(cc.Node)
    private abandonPanel: cc.Node = undefined;

    @property(cc.Node)
    private autoPanel: cc.Node = undefined;

    @property(cc.Node)
    private nodeRecord: cc.Node = undefined;

    @property(cc.Label)
    private labBaseScore: cc.Label = undefined;

    @property(cc.Label)
    labMul: cc.Label = undefined;

    @property(cc.Label)
    labTips: cc.Label = undefined;

    @property(cc.Button)
    private btnNoPlay: cc.Button = undefined;

    @property(cc.Button)
    private btnPrompt: cc.Button = undefined;

    @property(cc.Button)
    private btnOutCard: cc.Button = undefined;

    @property(cc.Node)
    private btnHosted: cc.Node = undefined;

    @property(cc.Node)
    private btnAuto: cc.Node = undefined;

    @property(cc.Prefab)
    private preEffLords: cc.Prefab = undefined;
    @property(cc.Prefab)
    private preEffSraight: cc.Prefab = undefined;

    @property(cc.Prefab)
    private preEffSpring: cc.Prefab = undefined;



    @property(cc.Prefab)
    private preAirplane: cc.Prefab = undefined;

    /*@property(sp.Skeleton)
    private spBoom: sp.Skeleton = undefined;

    @property(sp.Skeleton)
    private dzWangzha: sp.Skeleton = undefined;*/

    @property(cc.Prefab)
    private spBoom: cc.Prefab = undefined;

    @property(cc.Prefab)
    private dzWangzha: cc.Prefab = undefined;

    @property(cc.Prefab)
    private prePokerRes: cc.Prefab = undefined;

    private DOUBLE_MUL = 2;// 加倍

    gameName = GameId.DDZ;
    playerMgr: DdzPlayerMgr;
    audioMgr: Audio;
    msg: Msg;

    private _pokerRes: PokerRes;

    private _currScore: number; // 当前叫分的分数
    private _lastCardSuit: CARD_TYPE;
    private _lastCardData: number[];
    private _isFirstWaitOut: boolean; // 在本局游戏中第一个出牌
    private _isReturnGame: boolean; // 正在回到游戏
    private _isFirstPlay: boolean; // 在本伦游戏中是否先手

    private MAX_BET = 3;               // 最大倍率
    private _isHosted: boolean;
    private _minScore: number;
    private _addingMul: boolean;
    private _isShowOpt: boolean;

    private tickerPos: cc.Vec2 = undefined;

    bombDelayTime = 0.5;// 炸弹特效等待时间

    set currScore(score: number) {
        this._currScore = score;
    }

    get pokerRes() {
        if (!this._pokerRes) {
            this._pokerRes = util.instantiate(this.prePokerRes).getComponent(PokerRes);
        }
        return this._pokerRes;
    }


    onLoad() {
        // init logic
        super.onLoad();

        this.tickerPos = this.lblClock.node.parent.getPosition();
    }

    initRound(): void {
        cc.log("初始化一局");
        //this.spBoom.node.active = false;
        //this.dzWangzha.node.active = false;
        //提示显示与否
        let times = cc.sys.localStorage.getItem(ItemNames.ddzTimes) || 0;
        times = +times + 1;
        cc.sys.localStorage.setItem(ItemNames.ddzTimes, times);
        if (times > 10) {
            this.labTips.node.active = false;
        }

        this.lblClock.node.parent.active = false;
        this.scorePanel.active = false;
        this.outCardPanel.active = false;
        this.abandonPanel.active = false;

        this._minScore = undefined;
        this.meHosted(false);
        this.btnHosted.active = false;

        this.nodeRecord.active = false;
        this.showLordCardsPanel.active = false;
        this.setAddMulPanel(false);

        //this.hideDealerCards();
        this.recordCardPanel.hide();
        this.recordCardPanel.resetNum();
        this.hideOptPanel();
        this.hideAutoBtn();

        this._currScore = 0;
        this._isFirstWaitOut = true;

        this._lastCardSuit = undefined;
        this._lastCardData = undefined;

        this.labMul.string = "0";

        // // 测试
        // this.scheduleOnce(() => {
        //     let msg = {
        //         handleCards: [1038,782,781,1036,268,1035,1034,777,265,1032,520,264,775,519,518],
        //     }
        //     this.msg.handleSendCard(msg);
        // }, 2);

        // // 出牌
        // this.scheduleOnce(()=>{
        //     let sss = [259,1027];
        //     this.holdMgr.setPlayerData(sss);
        // }, 4);
    }
    dealRoomData(data: any): void {

    }
    initGame(): void {
        cc.log("初始化 init");

        this.msg = new Msg(this);
        this.msg.init();
        this.playerMgr = new DdzPlayerMgr(this);
        this.menu.init(this);
        this.holdMgr.addGame(this);
        this.resultPanel.setGame(this);

        this.nodeLordCards.removeAllChildren();
        for (let index = 0; index < 3; index++) {
            let card = this.pokerRes.getDdzCard(272);
            card.setPosition(0, 0);
            card.scale = 0.4;
            this.nodeLordCards.addChild(card);
            card.active = false;
            let poker = card.addComponent(Poker);
        }
        this.hideDealerCards();
    }

    get ableStart() {
        return this.playerMgr.readyCount > 3;
    }

    setRoomInfo(config: any): void {
        this.labBaseScore.string = util.add(config.bets, 0).toString();
        this.MAX_BET = config.maxBet;
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
        if (t > 0) {
            this.lblClock.string = t.toString();
            this.audioMgr.playClock();
        }
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
        // this.changeState(State.Start);
    }
    setGameEnd(): void {
        this.changeState(State.End);
    }

    initHolds(cards: number[]) {
        this.holdMgr.initCards(cards);
        this.recordCardPanel.saveDiscardNum(cards);

        this.audioMgr.playInitHolds();
        this.audioMgr.playMusic();
    }

    sendCardsAnimation() {
        this.holdMgr.sendCardsAnimation();
    }

    delayShowBtnHosted() {
        this.scheduleOnce(() => {
            this.btnHosted.active = true;
        }, .8);
    }

    /**
     * 轮到玩家叫分
     * @param leftTime
     * @param rPos
     */
    turnPlayerScore(leftTime: number, rPos: number) {
        let player = this.playerMgr.getPlayerByServerPos(rPos);
        if (player) {
            player.turnJiaoFen(leftTime);
            if (player.isMe) {
                this.showScorePanel(this._currScore);
            }
        }
    }

    showPlayerScore(point: number, rPos: number) {
        if (point > 0) {
            this._currScore = point;
            this.labMul.string = point.toString();
        }
        let player = this.playerMgr.getPlayerByServerPos(rPos);
        if (player) {
            player.showScoreStatus(point);
            this.audioMgr.playScore(player.isMale, point);
            if (player.isMe) {
                this.scorePanel.active = false;
            }
        }
    }

    /**
     * 叫分
     * @param minScore
     */
    showScorePanel(minScore: number) {
        this._minScore = minScore;
        if (this._isHosted) {
            return;
        }

        this.scorePanel.active = true;
        this.scorePanel.children.forEach(node => {
            node.stopAllActions();
            node.scale = 1;
        });
        for (let idx = ScoreStatus.ONE; idx <= ScoreStatus.THREE; idx++) {
            let node = this.scorePanel.getChildByName(`btn_${idx}`);
            let btn = node.getComponent(cc.Button);
            if (idx > minScore) {
                btn.interactable = true;
            } else {
                btn.interactable = false;
            }
            let lab = btn.getComponentInChildren(cc.LabelOutline);
            lab.color = btn.interactable ? cc.hexToColor("#7E581D") : cc.hexToColor("#7B7E86");
        }
    }

    /**
     * 展示地主牌
     * @param rPos
     * @param cards
     */
    showDealer(rPos: number, cards: number[]) {
        this._minScore = undefined;

        this.scorePanel.active = false;
        let player = this.playerMgr.getPlayerByServerPos(rPos);
        if (player) {
            player.isDealer = true;

            if (player.isMe) {
                this.holdMgr.addDealerCard(cards);
                this.recordCardPanel.saveDiscardNum(cards);
            }
        }
        // 先居中展示地主牌
        this.showLordCardsPanel.active = true;
        this.showLordCardsPanel.stopAllActions();
        this.showLordCardsPanel.scale = 1;
        this.showLordCardsPanel.setPosition(0, 140);
        this.showLordCardsPanel.removeAllChildren();
        for (let idx = 0; idx < cards.length; idx++) {
            let card = this.pokerRes.getDdzCard(cards[idx]);
            card.scale = 0.7;
            card.setPosition(0, 0);
            this.showLordCardsPanel.addChild(card);
        }
        let moveTime = 0.3;
        this.showLordCardsPanel.runAction(cc.sequence(
            cc.delayTime(1),
            cc.spawn(cc.moveTo(moveTime, this.nodeLordCards.getPosition()), cc.scaleTo(moveTime, 0.40, 0.40)),
            cc.callFunc(() => {
                this.showLordCardsPanel.active = false;
                this.setDealerCards(cards);
            })
        ));

        this.playLordsAnim(rPos);
    }

    setDealerCards(cards: number[]) {
        this.nodeLordCards.children.forEach((card, idx) => {
            card.active = true;
            this.pokerRes.setDdzCard(card, cards[idx]);
            let poker = card.getComponent(Poker);
            poker.setBack(false);
        });
    }

    hideDealerCards() {
        this.nodeLordCards.children.forEach(card => {
            card.active = true;
            let poker = card.getComponent(Poker);
            poker.setBack(true);
        });
    }

    /**
     * 等待玩家选择是否加倍
     */
    waitPlayerAdd(leftTime: number) {
        this.playerMgr.turnAddMul(leftTime);
        let player = this.playerMgr.me;
        if (!player.isDealer) {
            this._addingMul = true;
            if (this._isHosted) {
                return;
            }

            this.setAddMulPanel(true);
        }
    }

    setAddMulPanel(visible: boolean) {
        this.addMulPanel.active = visible;
        if (true) {
            this.addMulPanel.children.forEach(node => {
                node.stopAllActions();
                node.scale = 1;
            });
        }
    }

    /**
     * 展示玩家加倍
     * @param rPos
     * @param addMul
     */
    showPlayerAdd(rPos: number, addMul: number) {
        let player = this.playerMgr.getPlayerByServerPos(rPos);
        if (player) {
            player.showMulStatus(addMul);
            this.audioMgr.playAddMul(player.isMale, addMul);
            if (player.isMe) {
                this._addingMul = undefined;
                this.setAddMulPanel(false);
                // 加倍
                if (addMul === this.DOUBLE_MUL) {
                    this.addGameMul();
                }
            }
        }
    }

    /**
     * 轮到玩家出牌
     * @param leftTime
     * @param rPos
     * @param first
     */
    turnPlayerPlay(leftTime: number, rPos: number, first: number) {
        this._isFirstPlay = !!first;
        let player = this.playerMgr.getPlayerByServerPos(rPos);
        if (player) {
            player.turnPlay(leftTime);
            if (player.isMe) {
                if (!!first) {
                    this.holdMgr.setPlayerData();
                } else {
                    this.holdMgr.setPlayerData(this._lastCardData);
                    if (this._lastCardSuit && this._lastCardSuit === CARD_TYPE.CT_ROCKET) {
                        this.msg.sendNotPlay();
                    }
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
                if (this._isFirstPlay || (shape === CARD_TYPE.CT_BOMB) || (shape === CARD_TYPE.CT_ROCKET)) {
                    this.playCardSound(player.isMale, shape, cards);
                } else {
                    let random = Math.floor(Math.random() * 2);
                    if (random === 0) {
                        this.playCardSound(player.isMale, shape, cards);
                    } else {
                        this.audioMgr.playDani(player.isMale);
                    }
                }
            } else {
                this._isReturnGame = true;
            }
        }

        // 刷新总倍数
        if (shape) {
            if (shape === CARD_TYPE.CT_BOMB || shape === CARD_TYPE.CT_ROCKET) {
                this.addGameMul();
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
     * 添加倍数
     */
    addGameMul() {
        let mul = +this.labMul.string * 2;
        if (mul <= this.MAX_BET)
            this.labMul.string = mul.toString();
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
            this.autoPlay();
        } else {
            this.abandonPanel.active = true;
            this.abandonPanel.children.forEach(node => {
                node.stopAllActions();
                node.scale = 1;
            });
            this.holdMgr.enableCards(false);
            this.scheduleOnce(() => {
                if (this.abandonPanel.active) {
                    this.msg.sendNotPlay();
                }
            }, 5);
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

    /**
     * 自己先手出牌则隐藏不出、提示按钮
     * @param visible
     */
    setFirstPlayPanel(visible: boolean) {
        this.btnNoPlay.interactable = visible;
    }

    /**
     * 显示自动出牌按钮
     */
    showAutoBtn() {
        if (!this._isHosted) {
            this.btnAuto.active = true;
            this.setAutoStatus(true);
        }
    }

    hideAutoBtn() {
        this.btnAuto.active = false;
        this.setAutoStatus(true);
    }

    setAutoStatus(auto: boolean) {
        let str = auto ? AutoDesc.Auto : AutoDesc.Cancel;
        let lab = this.btnAuto.getComponentInChildren(cc.Label);
        lab.string = str;
    }

    /**
     * 自动出牌
     */
    autoPlay() {
        let desc = this.btnAuto.getComponentInChildren(cc.Label).string;
        if (this.btnAuto.active && desc === AutoDesc.Cancel) {
            let cardData = this.holdMgr.getFinalCard();
            this.msg.sendPlayCards(CARD_TYPE.CT_SINGLE, [cardData]);
        }
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
     * 选择分数
     * @param ev
     * @param info
     */
    onClickScore(ev: cc.Event.EventTouch, info: string) {
        this.scorePanel.active = false;
        let score = +info;
        this.msg.sendJiaoFen(score);
    }

    onClickAddMul(ev: cc.Event.EventTouch, info: string) {
        this.setAddMulPanel(false);
        let mul = +info;
        this.msg.sendAddMulti(mul);
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
            this.scorePanel.active = false;
            this.setAddMulPanel(false);
            this.hideOptPanel();
            this.btnAuto.active = false;
        } else {
            if (this._minScore !== undefined)
                this.showScorePanel(this._minScore);
            if (this._addingMul !== undefined)
                this.setAddMulPanel(true);
            if (this._isShowOpt !== undefined)
                this.showOptPanel(this._isShowOpt);
            if (this.holdMgr.getCardNum() === 1)
                this.showAutoBtn();
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

        // let desc = this.btnAuto.getComponentInChildren(cc.Label).string;
        // if (desc === AutoDesc.Auto) {
        //     cc.log("自动出牌");
        //     this.setAutoStatus(false);
        //     this.autoPlay();
        // } else if (desc === AutoDesc.Cancel) {
        //     cc.log("取消");
        //     this.setAutoStatus(true);
        // }
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
        } else if (cardType === CARD_TYPE.CT_ROCKET) {
            // 火箭
            this.playRocketAnim();
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
            this.audioMgr.playTuple(isMale, cards[0]);
        } else if (cardType === CARD_TYPE.CT_SINGLE_STRAIGHT) {
            // 顺子
            this.audioMgr.playShunzi(isMale);
            this.playAnim(this.preEffSraight);
        } else if (cardType === CARD_TYPE.CT_DOUBLE_STRAIGHT) {
            // 连对
            this.audioMgr.playLiandui(isMale);
        } else if (cardType === CARD_TYPE.CT_THREE_STRAIGHT
            || cardType === CARD_TYPE.CT_THREE_STRAIGHT_ONE
            || cardType === CARD_TYPE.CT_THREE_STRAIGHT_TWO) {
            // 飞机
            this.audioMgr.playFeiji(isMale);
        } else if (cardType === CARD_TYPE.CT_THREE_TAKE_ONE) {
            // 三带一单
            this.audioMgr.playSandaiyi(isMale);
        } else if (cardType === CARD_TYPE.CT_THREE_TAKE_TWO) {
            // 三带一对
            this.audioMgr.playSandaiyidui(isMale);
        } else if (cardType === CARD_TYPE.CT_FOUR_TAKE_ONE) {
            // 四带两单
            this.audioMgr.playSidaier(isMale);
        } else if (cardType === CARD_TYPE.CT_FOUR_TAKE_TWO) {
            // 四带两对
            this.audioMgr.playSidailiangdui(isMale);
        } else if (cardType === CARD_TYPE.CT_BOMB) {
            // 炸弹
            this.audioMgr.playZhadan(isMale);
        } else if (cardType === CARD_TYPE.CT_ROCKET) {
            // 火箭
            this.audioMgr.playWangZha(isMale);
        }
    }

    playSirenAnim(node: cc.Node) {
        this.playRepeatAnim(node);
        this.audioMgr.playAlert();
    }

    async playLordsAnim(rPos: number) {
        let ok = await this.playAnim(this.preEffLords);
        if (ok) {
            let player = this.playerMgr.getPlayerByServerPos(rPos);
            player.setDealer(true);
        }
        this.audioMgr.playQuRenDizhu();
    }

    playAirplaneAnim() {
        this.audioMgr.playAnimPlane();
        this.playAnim(this.preAirplane);
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

    playRocketAnim() {
        /*this.audioMgr.playAnimWangBomb();
        this.dzWangzha.node.active = true;
        this.dzWangzha.animation = "ddz_wz";

        this.scheduleOnce(() => {
            this.shake();
        }, 0.7);*/
        this.audioMgr.playAnimWangBomb();
        this.playAnim(this.dzWangzha);
        this.scheduleOnce(() => {
            this.shake();
        }, 0.7);
    }

    playSpringAnim() {
        this.audioMgr.playAnimCT();
        return this.playAnim(this.preEffSpring);
        // this.audioMgr.playAnimCT();
        // this.spSpring.node.active = true;
        // this.spSpring.animation = "animation";

        // this.scheduleOnce(() => {
        //     return new Promise(resolve => {
        //         resolve();
        //     });
        // }, 1);
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

        if (!this.dontPrepare)
            this.doPrepare();
        else {
            this.resultPanel.showTicker(timer);
            this.dontPrepare = false;
        }
    }
}