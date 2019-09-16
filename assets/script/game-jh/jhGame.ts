import { GameId } from "../game-share/game";
import JHOperation from "./jhOperation";
import JHMsg from "./jhMsg";
import JHPlayerMgr from "./jhPlayerMgr";
import { PlayerStates } from "../game-share/player";
import JHInfo from "./jhInfo";
import { mul, cmp, mod, sub, div, add, getGameName } from "../common/util";
import PokerRes from "../game-share/pokerRes";
import JHAudio from "./jhAudio";
import JHPk from "./jhPk";
import CardGame from "../game-share/cardGame";
import { Rune } from "../game-share/pokerCard";
import JHCard from "./jhCard";
import * as util from "../common/util";

const { ccclass, property } = cc._decorator;

export enum State {
    WaitPrepare,
    WaitStart,
    Start,
    ChooseBankerAndMagic,
    Dealing, //发牌，上底分
    Turning,
    Balancing,//数据库
    WaitResult,
    Result,
    End,
}

export enum CardTypes {
    High,//散牌
    Pair,//对子
    Straight,//顺子
    Flush,//金花
    StraightFlush,//顺金
    Leopard,//其他豹子
    AAA, //豹子
}

export enum BetType {
    None = -1,
    Base,
    Call,
    Raise,
    AllIn,
    Challenge,//挑战需下钱
}

@ccclass
export default class JHGame extends CardGame<JHCard> {

    @property(JHPk)
    pk: JHPk = undefined;

    @property(JHInfo)
    info: JHInfo = undefined;

    @property(cc.Node)
    chipsPool: cc.Node = undefined;

    @property(JHOperation)
    operation: JHOperation = undefined;

    @property([cc.Prefab])
    private prefabChips: cc.Prefab[] = [];

    @property([cc.SpriteFrame])
    private cardTypes: cc.SpriteFrame[] = [];

    @property(cc.Prefab)
    private animLeopard: cc.Prefab = undefined;

    @property(cc.Prefab)
    private animStraightGold: cc.Prefab = undefined;

    @property(cc.Prefab)
    private animJoker: cc.Prefab = undefined;

    @property(cc.Node)
    private waitTips: cc.Node = undefined;

    @property([cc.Node])
    private particleEffAllIn: cc.Node[] = [];

    gameName = GameId.JH;
    private _blindRound: number;//闷几轮，>这个值才能看牌
    get blindRound() {
        return this._blindRound;
    }
    private _no2To6: boolean;//去掉2-6
    get no2To6() {
        return this._no2To6;
    }
    private _hasJoker: boolean;//有王
    get hasJoker() {
        return this._hasJoker;
    }
    private _special235: boolean;//特殊235
    get special235() {
        return this._special235;
    }

    private _allInRound: number;//all in轮，>=这个值才能all in
    get allInRound() {
        return this._allInRound;
    }
    private _hasMagic: boolean;//是否有癞子
    get hasMagic() {
        return this._hasMagic;
    }
    get canRaise() {
        return this.lastBetType !== BetType.AllIn && (this.curSingleBet < this.baseScore * this.raiseRates[4]);
    }
    /**
     * 这局总下注
     *
     * @type {number}
     * @memberof JHGame
     */
    totalBets: number;
    /**
     * 当前轮数
     *
     * @readonly
     * @memberof JHGame
     */
    round: number;
    /**
     * 一局游戏总轮数
     *
     * @readonly
     * @memberof JHGame
     */
    totalRound: number;
    /**
     * 当前单注
     *
     * @readonly
     * @memberof JHGame
     */
    curSingleBet: number;
    magicSymbol?: number;
    playerMgr: JHPlayerMgr;
    lastBetType: BetType;
    readonly raiseRates = [1, 2, 5, 8, 10];
    /**
     * 是否已经过了闷牌轮，可以看牌了
     *
     * @readonly
     * @memberof JHGame
     */
    get canLookCard() {
        return this.round > this._blindRound;
    }

    /**
     * 我是否在游戏中
     *
     * @readonly
     * @memberof JHGame
     */
    get amIInGame() {
        if (!this || !this.playerMgr) {
            return false;
        }
        let me = this.playerMgr.me;
        return me && me.uid && !me.isLooker;
    }

    /**
     * 是否正在结算阶段
     *
     * @readonly
     * @memberof JHGame
     */
    get isResulting() {
        return this.gameState >= State.Balancing;
    }

    get audioMgr() {
        return this.audioRes as JHAudio;
    }

    msg: JHMsg;
    protected cardType = JHCard;

    private chipsNodePool: cc.NodePool[];
    private initChipsNodePool() {
        this.chipsNodePool = [];
        for (let i = 0; i < this.raiseRates.length; i++) {
            let pool = new cc.NodePool();
            this.chipsNodePool.push(pool);
        }
    }
    dealRoomData(data: any): void {

    }


    initGame(): void {
        this.checkTouched = true;
        this.waitTips.active = false;
        this.info.node.active = true;
        this.chipsPool.active = false;
        this.operation.node.active = true;
        this.pk.node.active = false;
        this.nodeAnimation.active = true;
        this.operation.game = this;
        this.info.game = this;
        this.msg = new JHMsg(this);
        this.msg.init();
        this.playerMgr = new JHPlayerMgr(this);
        this.menu.init(this);
        this.pk.init(this);
        this.initChipsNodePool();
        this.showOrHideAllInParticle(false);
    }
    initRound(): void {
        this.pk.clearPK();
        this.waitTips.active = false;
        this.setWaitPrepare();
        this.totalBets = undefined;
        this.round = undefined;
        this.curSingleBet = undefined;
        this.lastBetType = BetType.None;
        if (!this.dontPrepare)
            this.doPrepare();
        else {
            this.dontPrepare = false;
        }
        this.hideTicker();
        this.playerMgr.hidePlayers();
        this.playerMgr.changeState(PlayerStates.UNREADY);
        this.playerMgr.clearCards();
        this.playerMgr.setPlayersActive();
        this.clearChips();
        this.operation.init();
        this.refreshRoomInfo();
        this.showOrHideAllInParticle(false);
        this.operation.resetAllInAndDiscardBtnState();
    }

    // 全压特效显隐控制
    showOrHideAllInParticle(show: boolean) {
        this.particleEffAllIn.forEach(element => {
            element.active = show;
        });
    }
    //显示等待下局
    showWaitTips() {
        this.waitTips.active = true;
    }

    setRoomInfo(config: any): void {
        this._blindRound = config.blindFollowRound;
        this._no2To6 = config.discard2To6;
        this._hasJoker = config.hasJoker;
        this._special235 = config.special235;
        this._allInRound = config.allowAllInRound;
        this._hasMagic = !!config.hasMagic;
        this.totalRound = config.maxRound;
    }
    refreshRoomInfo(): void {
        this.info.updateBetsPool();
        this.info.updateLeft();
        this.info.updateRight();
    }
    showTicker(time: number): void {
        this.info.showTicker(time);
    }
    hideTicker(): void {
        this.info.hideTicker();
    }

    updateUI(): void {
    }

    recycleChips(c: cc.Node) {
        let tag = c.tag;
        let pool = this.chipsNodePool[tag];
        if (!pool) {
            return;
        }
        c.removeFromParent(true);
        c.opacity = 255;
        c.scale = 1;
        c.rotation = 0;
        pool.put(c);
    }

    clearChips() {
        // this.chipsPool.children.forEach(c => {
        //     this.recycleChips(c);
        // });
        let len = this.chipsNodePool.length;
        for (let i = 0; i < len; i++) {
            this.chipsNodePool[i].clear();
        }
        this.chipsPool.destroyAllChildren();
    }

    /**
     * 在桌面添加一定额度的筹码
     *
     * @param {number} amount
     * @param {boolean} double
     * @returns
     * @memberof Room
     */
    addChips(amount: number) {
        let baseScore = this.baseScore/* this.isCustom ? 1 : 0.01 */;
        let chips: cc.Node[] = [];
        for (let i = this.raiseRates.length - 1; i >= 0; i--) {
            let prefab = this.prefabChips[i];
            if (!prefab) {
                continue;
            }
            let num = mul(this.raiseRates[i], baseScore);
            if (cmp(amount, num) === -1) {
                continue;
            }
            let count = Math.floor(div(amount, num).toNumber());
            //限制最大个数
            if (count > 50) {
                count = 50;
            }

            if (count < 1) {
                continue;
            }
            while (count-- > 0) {
                let node = this.chipsNodePool[i].get();
                if (!node) {
                    node = util.instantiate(prefab);
                }
                node.tag = i;
                let lbl = node.getComponentInChildren(cc.Label);
                if (lbl) {
                    lbl.string = num.toString();
                }
                node.scale = 0.8;
                this.chipsPool.addChild(node);
                chips.push(node);
                node.rotation = cc.randomMinus1To1() * 30;
                let x = cc.randomMinus1To1() * (this.chipsPool.width / 2 - node.width) * cc.random0To1();
                let y = cc.randomMinus1To1() * (this.chipsPool.height / 2 - node.height / 2 * node.scale) * cc.random0To1();
                node.setPosition(x, y);
            }
            amount = mod(amount, num).toNumber();
            if (amount === 0) {
                break;
            }
        }
        this.chipsPool.active = true;
        return chips;
    }

    getCardTypeSf(type: CardTypes) {
        if (type === CardTypes.High) {
            return undefined;
        } else if (type === CardTypes.AAA) {
            return this.cardTypes[4];
        } else {
            return this.cardTypes[type - 1];
        }
    }
    setWaitPrepare(): void {
        this.changeState(State.WaitPrepare);
    }
    setWaitStart(): void {
        this.changeState(State.WaitStart);
    }
    setStarted(): void {
        this.changeState(State.Start);
    }
    setGameEnd(): void {
        this.changeState(State.End);
    }
    playAnimWin() {
        this.audioMgr.playSoundWin();
        return this.playAnim(this.animWin);
    }

    playDealerAnim(node: cc.Node) {
        return this.playRepeatAnim(node);
    }

    playAnimJoker(rune: number) {
        this.audioMgr.playSoundMagic();
        let animPrefab = this.animJoker;
        let node = this.nodeAnimation.getChildByName(animPrefab.name);
        if (!node) {
            node = util.instantiate(animPrefab);
            this.nodeAnimation.addChild(node);
        }
        node.y = 24;
        let anim = node.getComponent(cc.Animation);
        let card = this.genCardByVal(rune);
        node.addChild(card.node);
        card.node.setPosition(0, 0);
        card.node.active = false;
        this.scheduleOnce(() => {
            //this.info.showMagic(card, true);
        }, 0.5);
        return this.playAnim(this.animJoker);
    }
    onDestroy() {
        super.onDestroy();
        if (!this.chipsNodePool) {
            return;
        }
        for (let i = this.chipsNodePool.length - 1; i >= 0; i--) {
            let p = this.chipsNodePool[i];
            p.clear();
        }
    }
}
