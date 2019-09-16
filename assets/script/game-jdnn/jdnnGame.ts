import JDNNDock from "./jdnnDock";
import JDNNOperation from "./jdnnOperation";
import JDNNInfo from "./jdnnInfo";
import JDNNPlayerMgr from "./jdnnPlayerMgr";
import JDNNMsg from "./jdnnMsg";
import JDNNAudio from "./jdnnAudio";
import CardGame from "../game-share/cardGame";
import JDNNPlayer, { PlayerStates } from "./jdnnPlayer";
import JDNNCard from "./jdnnCard";
import { Rune } from "../game-share/pokerCard";
import { GameId } from "../game-share/game";
import * as util from "../common/util";

const { ccclass, property } = cc._decorator;

export enum JokerType {
    None = -1,
    Any = 0,
    Ten = 10
}

export enum BullType {
    None,
    Bull1,
    Bull2,
    Bull3,
    Bull4,
    Bull5,
    Bull6,
    Bull7,
    Bull8,
    Bull9,
    DoubleBull,
    BullBoom,
    BullMarble,
    BullSmall
}

export enum RoundType {
    Turn,
    Grab
}

export enum GameState {
    WaitPrepare,
    Waiting,
    Start,
    GrabDealer,//抢庄
    ShowDealer, //播放选中庄家的特效
    DoBet,//押注
    Deal,//发牌
    BullCalculate,//出牌
    Balance, //结算(数据库)
    Result,//结算(展示)
    End //结束
}


@ccclass
export default class JDNNGame extends CardGame<JDNNCard> {

    @property(cc.Node)
    readonly nodeDock: cc.Node = undefined;

    @property(JDNNOperation)
    readonly operation: JDNNOperation = undefined;

    @property(JDNNInfo)
    readonly info: JDNNInfo = undefined;

    @property(cc.Font)
    readonly fontGrab: cc.Font = undefined;

    @property(cc.Font)
    readonly fontBet: cc.Font = undefined;

    @property(cc.SpriteFrame)
    readonly sfCalComplete: cc.SpriteFrame = undefined;

    @property(cc.Node)
    readonly nodeCardBox: cc.Node = undefined;

    @property([cc.SpriteFrame])
    readonly sfBullType: cc.SpriteFrame[] = [];

    @property([cc.SpriteFrame])
    readonly sfBullTypeBg: cc.SpriteFrame[] = [];

    @property(cc.Prefab)
    readonly prefabAnimWinAll: cc.Prefab = undefined;

    @property(cc.Prefab)
    readonly prefabAnimLose: cc.Prefab = undefined;

    @property(cc.Prefab)
    readonly prefabAnimBullBoom: cc.Prefab = undefined;

    @property(cc.Prefab)
    readonly prefabAnimBullMarble: cc.Prefab = undefined;

    @property(cc.Prefab)
    readonly prefabAnimBullSmall: cc.Prefab = undefined;

    @property(cc.Prefab)
    readonly prefabCoin: cc.Prefab = undefined;

    @property(cc.Node)
    readonly nodeCoinBox: cc.Node = undefined;

    @property(cc.Node)
    readonly waitTips: cc.Node = undefined;

    gameName = GameId.JDNN;
    dock: JDNNDock;
    playerMgr: JDNNPlayerMgr;
    audioMgr: JDNNAudio;
    msg: JDNNMsg;

    jokerAs: JokerType;
    riverBull: BullType;
    bullMultiple: number;
    specialMultiple: number;
    roundType: RoundType;
    // static descForLooker = "";//旁观
    // static descForGrab = "抢庄开始，请选择分数抢庄...";
    // static descForDealerBet = "请等待其他玩家押分";
    // static descForBet = "请选择压分的倍数...";
    // static descForCal = "请选择三张牌来斗牛牛...";
    // static descForWaitCal = "请等待其他玩家努力计算牛牛...";

    private descForLooker = 4;      //旁观
    private descGameReadyStart = 0; //等待游戏开始
    private descForGrab = 1;        //请抢庄
    private descForDealerBet = 4;   //等待其他玩家投注
    private descForBet = 2;         //请投注
    private descForCal = 3;         //请摊牌
    private descForWaitCal = 4;     //等待其他玩家摊牌

    dealerMultiple: number;
    private _coinPool: cc.NodePool;
    protected cardType = JDNNCard;

    get shouldShowCard() {
        return this.gameState >= GameState.Balance;
    }

    onLoad() {
        super.onLoad();
        this._coinPool = new cc.NodePool();
        for (let i = 0; i < 23; i++) {
            let coin = util.instantiate(this.prefabCoin);
            this._coinPool.put(coin);
        }
    }

    getCoin() {
        let coin = this._coinPool.get();
        if (!coin) {
            coin = util.instantiate(this.prefabCoin);
        }
        return coin;
    }

    retrieveCoin(coin: cc.Node) {
        this._coinPool.put(coin);
    }
    dealRoomData(data: any): void { }

    initGame(): void {
        cc.log("jdnn initgame check touched=true")
        this.checkTouched = true;
        this.waitTips.active = false;
        this.info.node.active = false;
        this.operation.node.active = true;
        this.nodeAnimation.active = true;
        this.dock = this.nodeDock.getComponent(JDNNDock);
        this.nodeDock.active = true;
        this.dock.init(this);
        this.operation.init(this);
        this.info.init(this);
        this.menu.init(this);
        this.playerMgr = new JDNNPlayerMgr(this);
        this.msg = new JDNNMsg(this);
        this.msg.init();
    }
    initRound(): void {
        this.waitTips.active = false;
        this.setWaitPrepare();
        if (!this.dontPrepare)
            this.doPrepare();
        else {
            this.dontPrepare = false;
        }
        this.hideTicker();
        this.playerMgr.hidePlayers();
        this.playerMgr.changeState(PlayerStates.UNREADY);
        this.playerMgr.clearCards();
        this.operation.initRound();
        this.dock.initRound();
        this.refreshRoomInfo();
    }
    //显示等待下局
    showWaitTips() {
        this.waitTips.active = true;
    }
    setRoomInfo(config: any): void {
        this.jokerAs = config.joker;
    }
    refreshRoomInfo(): void {
        this.info.node.active = true;
        this.info.updateBetsPool();
    }
    showTicker(time: number): void {
        this.info.showTicker(time);
    }
    hideTicker(): void {
        this.info.hideTicker();
    }

    updateUI(): void {
        let me = this.playerMgr.me;
        this.info.hidePrompt();
        this.operation.hideGrab();
        this.operation.hideBet();
        switch (this.gameState) {
            case GameState.WaitPrepare:
                if (!me.isLooker) {
                    this.info.showPrompt(this.descGameReadyStart);
                }
                break;
            case GameState.GrabDealer:
                if (!me.isLooker) {
                    this.info.showPrompt(this.descForGrab);
                    this.operation.showGrab();
                }
                break;
            case GameState.DoBet:
                if (!me.isLooker) {
                    if (me.isDealer) {
                        this.info.showPrompt(this.descForDealerBet);
                    } else {
                        this.info.showPrompt(this.descForBet);
                        this.operation.showBet();
                    }
                }
                break;
            case GameState.BullCalculate:
                if (!me.isLooker) {
                    this.info.showPrompt(this.descForCal);
                    this.dock.showCalculate();
                }
                break;
            case GameState.End:
                break;
        }
        if (me.isLooker
            && this.gameState >= GameState.Deal
            && this.gameState < GameState.Result) {
            // this.info.showPrompt(this.descForLooker);
        }
        this.menu.updateBtnState();
    }
    setWaitPrepare(): void {
        this.changeState(GameState.WaitPrepare);
    }
    setWaitStart(): void {
        this.changeState(GameState.Waiting);
    }
    setStarted(): void {
        this.changeState(GameState.Start);
    }
    setGameEnd(): void {
        this.changeState(GameState.End);
    }

    dealCard(p: JDNNPlayer, card: JDNNCard, doAnim = true, toLeft = false) {
        let node = card.node;
        this.nodeCardBox.addChild(node);
        node.setPosition(0, 0);
        if (doAnim) {
            card.turn(false, false);
            node.scale = 0.2;
        }
        if (p.isMe && this.gameState < GameState.Balance) {
            this.dock.addCard(card, doAnim, toLeft);
        } else {
            p.addCard(card, doAnim, toLeft);
        }
        this.audioMgr.playDeal();
    }

    async dealCards(p: JDNNPlayer, runes: number[], doAnim = true) {
        let cards = [];
        for (let r of runes) {
            let card = this.genCardByVal(r);
            cards.push(card);
        }
        for (let c of cards) {
            this.dealCard(p, c, doAnim, true);
            await new Promise(resolve => setTimeout(resolve, 50));
        }
    }

    playAnimWin() {
        this.audioMgr.playWin();
        return super.playAnimWin();
    }

    playAnimWinAll() {
        this.audioMgr.playWinAll();
        return this.playAnim(this.prefabAnimWinAll);
    }

    playAnimLose() {
        this.audioMgr.playLose();
        return this.playAnim(this.prefabAnimLose);
    }

    private playAnimBull(prefab: cc.Prefab, runes: Rune[]) {
        let cards: cc.Node[] = [];
        runes.forEach(r => {
            let c = this.genCardByVal(r.rune, r.pretendRune);
            cards.push(c.node);
        });
        return this.playAnim(prefab, cards);
    }

    playAnimBullBoom(runes: Rune[]) {
        return this.playAnimBull(this.prefabAnimBullBoom, runes);
    }

    playAnimBullMarble(runes: Rune[]) {
        return this.playAnimBull(this.prefabAnimBullMarble, runes);
    }

    playAnimBullSmall(runes: Rune[]) {
        return this.playAnimBull(this.prefabAnimBullSmall, runes);
    }

    playDealerAnim(node: cc.Node) {
        return this.playRepeatAnim(node);
    }

    playWinAnim(node: cc.Node) {
        return this.playRepeatAnim(node, false);
    }

    async chooseDealer(dealer: JDNNPlayer, targets: JDNNPlayer[]) {
        let duration = 50;
        targets.sort((a, b) => a.seat - b.seat);
        let lastShow;
        let start = Date.now();
        for (let i = 0; ; i++) {
            if (!this.isValid) {
                return;
            }
            if (i >= targets.length) {
                i = 0;
            }
            if (lastShow) {
                lastShow.showDealerFrame(false);
            }
            let t = targets[i];
            t.showDealerFrame(true);
            lastShow = t;

            let now = Date.now();
            if (now - start >= 1000 && t === dealer) {
                dealer.becomeDealer(true, true);
                this.audioMgr.playDealerChoose();
                return;
            }

            await new Promise(resolve => setTimeout(resolve, duration));
            duration += duration / (2 * targets.length);
            if (duration <= 0) {
                break;
            }
        }
    }
}