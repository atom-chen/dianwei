import HHPlayerMgr from "./hhPlayerMgr";
import HHPlayer from "./hhPlayer";
import HHAudio from "./hhAudio";
import HHCard from "./hhCard";
import HHRecord from "./hhRecord";
import HHTrend from "./hhTrend";
import HHOther from "./hhOther";
import HHMsg, { GameStatus, HHUser, HHCardsInfo, areaBetInfo, WinLoseRecord } from "./hhMsg";

import Game from "../game-share/game";
import { Gender } from "../common/user";
import * as util from "../common/util";
import Parabola from "../game-share/parabola";
import { GameId } from "../game-share/game";
import PokerRes from "../game-share/pokerRes";
// import { GameState } from "../game-sh/shGame";

const { ccclass, property } = cc._decorator;

export enum Area {
    Error = -1,
    AreaBlack,          //黑
    AreaRed,            //红
    AreaSpecial         //特殊
}

export enum Shape {
    ShapeInvalid,                       //无效类型
    ShapePoint = 1,                     //点子牌
    ShapePairSmall = 2,                 //对子(2~8)
    ShapePairBig = 3,                   //对子(9~A)
    ShapeStraight = 4,                  //顺子
    ShapeFlush = 5,                     //金花
    ShapeFlushStraight = 6,             //顺金
    ShapeTreeOfAKind = 7                //豹子
}

export const SHAPE_NAME = ["无效", "单牌", "对子", "对子", "顺子", "金花", "顺金", "豹子"];

@ccclass
export default class HHGame extends Game {
    @property([cc.Node])
    private blackRedCards: cc.Node[] = [];

    @property([cc.Sprite])
    private blackRedShape: cc.Sprite[] = [];

    @property([cc.Node])
    private betArea: cc.Node[] = [];

    @property([cc.Node])
    private betLightArea: cc.Node[] = [];

    @property([cc.Node])
    private winLightArea: cc.Node[] = [];

    @property([cc.Node])
    private dsBetLogoArr: cc.Node[] = [];// 赌神下注区域

    @property([cc.Label])
    private totalBetMoney: cc.Label[] = [];

    @property([cc.Node])
    private selfBetMoneyBg: cc.Node[] = [];

    @property([cc.Label])
    private selfBetMoney: cc.Label[] = [];

    @property(cc.Label)
    private noGoldTips: cc.Label = undefined;

    @property(cc.Node)
    private waitTips: cc.Node = undefined;

    @property([cc.Button])
    private chooseBetBtn: cc.Button[] = [];

    @property([cc.Node])
    private chooseBetLight: cc.Node[] = [];

    @property([cc.Prefab])
    private prefabChips: cc.Prefab[] = [];

    @property(cc.Node)
    private nodeClips: cc.Node = undefined;

    @property(cc.Node)
    private betTimePanel: cc.Node = undefined;

    @property(cc.Label)
    private labBetTime: cc.Label = undefined;

    @property(cc.Node)
    private nodeRest: cc.Node = undefined;

    @property(cc.Node)
    private nodeClock: cc.Node = undefined;

    @property(cc.Node)
    private animClock: cc.Node = undefined;

    @property(cc.Node)
    private nodeVs: cc.Node = undefined;

    @property(cc.Node)
    private nodeOther: cc.Node = undefined;

    @property(cc.Button)
    private btnCancel: cc.Button = undefined;

    @property(cc.Prefab)
    private prePokerRes: cc.Prefab = undefined;

    @property([cc.SpriteFrame])
    private sfShape: cc.SpriteFrame[] = [];

    @property(sp.Skeleton)
    private spVs: sp.Skeleton = undefined;

    @property(cc.Prefab)
    private preEndBetting: cc.Prefab = undefined;

    @property(cc.Prefab)
    preAnimWin: cc.Prefab = undefined;

    @property(cc.Prefab)
    preParticle: cc.Prefab = undefined;

    @property(HHPlayer)
    fhPlayer: HHPlayer = undefined;// 富豪

    @property(HHPlayer)
    dsPlayer: HHPlayer = undefined;// 赌神


    @property(HHRecord)
    hhRecord: HHRecord = undefined;

    @property(HHTrend)
    hhTrend: HHTrend = undefined;

    @property(HHOther)
    hhOther: HHOther = undefined;

    @property
    private maxAreaCount: number = 50; // 区域允许的最大筹码数

    gameName = GameId.HH;
    playerMgr: HHPlayerMgr;
    msg: HHMsg;
    audioMgr: HHAudio;

    isExistFh: boolean;
    isExistDs: boolean;

    private canPlayCoinAudio = true;
    private coinAudioInterval = 0.1;

    private POINT_LIST: number[];                                             // 筹码数值列表
    private BET_TOTAL_TIME: number;                                           // 下注总时间
    private MAX_AREA_BET: number = 20000;                                     // 红黑单区域最大下注额
    private MAX_SPECIAL_AREA_BET: number = 20000;                             // 特殊单区域最大下注额
    MIN_BET: number = 50;                                                     // 最小可下注额
    private betTimePanelPosY: number;                                         // 闹钟初始坐标Y值
    private nodeVsPosY: number;                                               // vs初始坐标Y值

    private dsLogoPosArr: cc.Vec2[] = [];                                      // 赌神在各区域的标志
    private cardsScale: number;

    private _currBetArea: number;
    private _currBetPoint: number;
    private _totalBetMoneyArr: number[];
    private _selfBetMoneyArr: number[];
    private _beforeBettingMoney: number;                                        // 下注之前自己的金额

    private _records: WinLoseRecord[] = [];

    setRecords(re: WinLoseRecord[], isStation = false) {
        this._records = re;
        this.hhRecord.setRecord(this._records);
        this.hhTrend.setRecord(this._records, isStation);
    }

    get records() {
        return this._records;
    }

    private _pokerRes: PokerRes;
    get pokerRes() {
        if (!this._pokerRes) {
            this._pokerRes = util.instantiate(this.prePokerRes).getComponent(PokerRes);
        }
        return this._pokerRes;
    }

    private chipsNodePool: cc.NodePool[];
    private initChipsNodePool() {
        this.chipsNodePool = [];
        for (let i = 0; i < this.POINT_LIST.length; i++) {
            let pool = new cc.NodePool();
            this.chipsNodePool.push(pool);
        }
    }

    onLoad() {
        for (let idx = 0; idx < this.dsBetLogoArr.length; idx++) {
            const logo = this.dsBetLogoArr[idx];
            logo.setLocalZOrder(1);
            this.dsLogoPosArr[idx] = logo.getPosition();
        }
        this.cardsScale = this.blackRedCards[0].children[0].scale;
        this.betTimePanelPosY = this.betTimePanel.y
        this.nodeVsPosY = this.nodeVs.y;
        super.onLoad();
    }


    dealRoomData(data: any): void {

    }


    initRound(): void {
        cc.log("初始化一局");
        this.waitTips.active = false;
        this.spVs.node.active = false;
        this.cleanBet();
        this.hideAllPanel();

        this.setAllowBet();
        this.hideBet();
        this.setBtnCancelGray(true);

        this._currBetArea = undefined;
        this.betTimePanel.active = false;
        this.setRestShow(false);
        this.setVsShow(false);

        this.playerMgr.initBets();
        if (this.fhPlayer) this.fhPlayer.initBets();
        if (this.dsPlayer) this.dsPlayer.initBets();

        // 遮牌
        this.blackRedCards.forEach(cards => {
            cards.children.forEach(card => {
                card.stopAllActions();
                card.scale = this.cardsScale;
                this.pokerRes.setBack(card);
            })
        })

        this.blackRedShape.forEach(shape => {
            shape.node.stopAllActions();
            shape.node.scale = 0;
            shape.node.parent.active = false;
        });
        // 清空桌上的筹码
        let clips = this.nodeClips.children.concat();
        for (let idx = 0; idx < clips.length; idx++) {
            let clip = clips[idx];
            this.recycleChips(clip);
        }
    }

    initGame(): void {
        cc.log("初始化 init ");
        this.waitTips.active = false;
        this.msg = new HHMsg(this);
        this.msg.init();
        this.playerMgr = new HHPlayerMgr(this);
        this.menu.init(this);
        this.hhTrend.hide();
        this.hhOther.setGame(this);
        this.hhOther.hide();
        this.noGoldTips.node.active = false;
    }

    changeState(s: number, left?: number) {
        super.changeState(s);
    }

    //显示等待下局
    showWaitTips() {
        this.waitTips.active = true;
    }

    hideWaitTips() {
        this.waitTips.active = false;
    }

    updateUI(): void {
        this.hidePrepare();
        switch (this.gameState) {
            // 等待开始
            case GameStatus.FREE:
                console.log("等待状态");
                break;
            // 下注
            case GameStatus.BET:
                console.log("下注状态");
                this.setCardsStatus(true);
                this.setVsShow(false);
                this.audioMgr.playStartBet();
                this.hideClockNode();
                this.beginBet();
                break;
            // 展示牌
            case GameStatus.DEAL_CARD:
                console.log("展示牌状态");
                this.audioMgr.playStopBet();
                this.setVsShow(true);
                this.hideBet();
                this.hideClockNode();
                break;
            // 结算
            case GameStatus.RESULT:
                console.log("结算状态");
                if (this.hhOther.node.active) {
                    this.hhOther.show();
                }
                this.playerMgr.setBigRegalGambleGodPos();
                this.playerMgr.updateTablePlayer();
                break;
        }
        this.menu.hideChangeBtn();
    }

    setRoomInfo(config: any): void {
        this.POINT_LIST = config.betPointList;
        this.BET_TOTAL_TIME = config.betTime / 1000;
        this.MAX_AREA_BET = config.blackOrRedMaxMoney;
        this.MAX_SPECIAL_AREA_BET = config.specialMaxMoney;
        this.MIN_BET = config.allowBetMinMoney;
    }

    refreshRoomInfo() {
        this.initClickEvent();
        this.initRound();
        this.isGaming = false;
    }

    showTicker(time: number): void {
    }
    hideTicker(): void {
    }


    showFinalResult(data: any) {
    }

    setWaitPrepare(): void {
    }
    setWaitStart(): void {
    }
    setStarted(): void {
    }
    setGameEnd(): void {
        this.gameState = GameStatus.END;
    }

    initClickEvent() {
        for (let idx = 0; idx < this.POINT_LIST.length; idx++) {
            const point = this.POINT_LIST[idx];

            let btn = this.chooseBetBtn[idx];
            let lab = btn.node.getComponentInChildren(cc.Label);
            lab.string = point.toString();
            let handler = new cc.Component.EventHandler();
            handler.target = this.node;
            handler.component = cc.js.getClassName(this);
            handler.handler = "onClickBet";
            handler.customEventData = idx.toString();
            btn.clickEvents.push(handler);
        }

        for (let idx = 0; idx < this.betArea.length; idx++) {
            const node = this.betArea[idx];
            let btn = node.getComponent(cc.Button);
            let handler = new cc.Component.EventHandler();
            handler.target = this.node;
            handler.component = cc.js.getClassName(this);
            handler.handler = "onClickArea";
            handler.customEventData = idx.toString();
            btn.clickEvents.push(handler);
        }
        this.initChipsNodePool();
    }

    /**
     * 休息时间
     * @param active
     */
    setRestShow(active: boolean) {
        this.nodeRest.active = active;
    }

    setVsShow(active: boolean) {
        if (active) {
            this.nodeVs.active = true;
            this.showAction(this.nodeVs, true, true, () => {
                this.setRestShow(false);
            })
        } else {
            this.showAction(this.nodeVs, false, true);
        }
    }

    /**
     * 设置展示牌
     * @param show
     */
    setCardsStatus(show: boolean) {
        this.blackRedCards.forEach(cards => {
            cards.active = show;
        })
        if (!show) {
            return;
        }

        // 发牌动作
        this.blackRedCards.forEach(cards => {
            let interval = -62;
            for (let idx = 0; idx < cards.children.length; idx++) {
                let card = cards.children[idx];
                card.stopAllActions();
                card.scale = this.cardsScale;
                card.runAction(cc.sequence(
                    cc.moveTo(0.1, cc.p(0, 2)),
                    cc.delayTime(0.3),
                    cc.moveTo(0.3, cc.p(interval * (1 - idx), 2)).easing(cc.easeBackOut())
                ));
            }
        })
    }

    /**
     *  开始下注
     */
    beginBet(left?: number) {
        this.gameState = GameStatus.BET;
        this.betTimePanel.active = true;
        this.setAllowBet();
        this._beforeBettingMoney = this.playerMgr.me.balance;
        if (left) {
            this.setTimer(left);
        }
    }

    /**
     * 开牌
     * @param cardsInfo
     */
    async setRedBlackCards(cardsInfo: HHCardsInfo[]) {
        this.audioMgr.playShow();
        await this.playAnim(this.preEndBetting);
        await this.drawCards(cardsInfo);
    }

    quickShowCards(cardsInfo: HHCardsInfo[]) {
        this.drawCards(cardsInfo, true);
    }

    /**
     * 翻牌动作
     * @param cardsInfo
     * @param isQuick
     */
    async drawCards(cardsInfo: HHCardsInfo[], isQuick: boolean = false) {
        cardsInfo.sort((a, b) => {
            return a.area - b.area;
        })

        for (const info of cardsInfo) {
            let nodeCard = this.blackRedCards[info.area];
            nodeCard.active = true;
            let sprShape = this.blackRedShape[info.area];
            let nodes = nodeCard.children;
            let cards = info.cards;
            let shape = info.shape;
            cards.sort(this.cardsSort);

            // 先翻牌，再显示牌型
            sprShape.node.parent.active = false;
            for (let idx = 0; idx < cards.length; idx++) {
                const data = cards[idx];
                let node = nodes[idx];
                if (isQuick) {
                    this.cardTurnAnim(node, data, false);
                } else {
                    let delay = false;
                    if (idx === cards.length - 1) {
                        delay = true;
                    }
                    await this.cardTurnAnim(node, data, delay);
                }
            }

            let scaleTime = isQuick ? 0.1 : 0.5;
            if (shape >= Shape.ShapePoint) {
                sprShape.node.parent.active = true;
                sprShape.spriteFrame = this.sfShape[shape];
                let nodeShape = sprShape.node;
                nodeShape.stopAllActions();
                nodeShape.scale = 0;
                nodeShape.runAction(cc.scaleTo(scaleTime, 1, 1).easing(cc.easeBounceOut()));

                this.audioMgr.playShape(shape);
            }
        }
    }
    private cardTurnAnim(node: cc.Node, data: number, delay: boolean) {
        let turnTime = 0.1;
        let scale1 = this.cardsScale;
        let scale2 = scale1;
        let delayTime = delay ? 0.3 : 0;
        return new Promise(resolve => {
            if (delay) {
                scale1 += 0.3;
                node.runAction(cc.scaleTo(0.5, scale1));
            }
            node.runAction(cc.sequence(
                cc.delayTime(delayTime),
                cc.scaleTo(turnTime + delayTime * 0.5, 0, scale1),
                cc.callFunc(() => {
                    this.audioMgr.playFlip();
                    this.pokerRes.setHHCard(node, data);
                }),
                cc.scaleTo(turnTime + delayTime * 0.5, scale2, scale2),
                cc.callFunc(() => {
                    resolve();
                })
            ));
        })
    }
    private cardsSort(a: number, b: number) {
        let aPoint = a & 0x0f;
        let bPoint = b & 0x0f;
        return aPoint - bPoint;
    }

    /**
     * 用户下注
     * @param rPos
     * @param area
     * @param bets
     */
    userDoBets(rPos: number, area: number, bets: string) {
        let player: HHPlayer = this.getBetPlayer(rPos);
        let playerPos: cc.Vec2;
        if (player) {
            if (player.balance < +bets) return;
            player.doBet(area, bets);
            playerPos = player.convertToNodePos(this.nodeClips);
            if (player.isMe) {
                // 记录自己红黑下注区域
                if (this._currBetArea === undefined && area !== Area.AreaSpecial) {
                    this._currBetArea = area;
                }

                this.setSelfAreaMoney(area, +bets);
                let selfBalance = player.balance;
                if (selfBalance <= this._currBetPoint || selfBalance <= this.MIN_BET) {
                    if (selfBalance > this._currBetPoint) {
                        this._currBetPoint = undefined;
                    }
                    this.setAllowBet();
                }
            } else {
                // 玩家金额不足则替换掉
                if (player.balance <= this.MIN_BET) {
                    this.playerMgr.setPlayerLeave(player.serverPos);
                }
            }
        } else {
            if (Math.random() < 0.5) {
                return;
            }
            let worldPos = this.nodeOther.convertToWorldSpaceAR(cc.v2(0, 0));
            playerPos = this.nodeClips.convertToNodeSpaceAR(worldPos);
        }

        // 自己的话就不用再飞了
        if (!player || !player.isMe) {
            this.clipsFlyArea(+bets, area, playerPos);
            if (this.canPlayCoinAudio) {
                this.audioMgr.playBet();
                this.canPlayCoinAudio = false;
                this.scheduleOnce(() => {
                    this.canPlayCoinAudio = true;
                }, this.coinAudioInterval);
            }
        }

        // 若筹码过多则适当减少点
        let areaClips: cc.Node[] = [];
        for (const node of this.nodeClips.children) {
            if (+node.name === area) {
                areaClips.push(node);
            }
        }
        let clipsLength = areaClips.length;
        if (clipsLength > this.maxAreaCount) {
            let recycleCount = Math.floor(clipsLength * 0.3);
            for (let idx = 0; idx < clipsLength; idx++) {
                const clip = areaClips[idx];
                if (idx < recycleCount) {
                    clip.runAction(cc.sequence(
                        cc.fadeTo(0.5, 0),
                        cc.callFunc(() => {
                            this.recycleChips(clip);
                        })
                    ))
                }
            }
        }

        // 赌神下注
        let dsPos = this.dsPlayer.serverPos;
        let fhPos = this.fhPlayer.serverPos;
        if (dsPos === rPos && this.isExistDs) {
            this.dsLogoFly(area);
        }
    }

    /**
     * 赌神下注
     * @param areaIdx
     */
    private dsLogoFly(areaIdx: number) {
        let areaLogo = this.dsBetLogoArr[areaIdx];
        if (areaLogo.active) return;
        areaLogo.active = true;

        let playerNode = this.dsPlayer.node;
        let worldPos = playerNode.convertToWorldSpaceAR(cc.v2(0, 0));
        let dsAreaPos = areaLogo.parent.convertToNodeSpaceAR(worldPos);

        let motionStreakFunc = () => {
            let logoTemp = util.instantiate(areaLogo);
            areaLogo.parent.addChild(logoTemp, 0);
            let time = 1;
            logoTemp.runAction(cc.sequence(
                cc.spawn(cc.scaleTo(time, 0, 0), cc.fadeTo(time, 0)),
                cc.callFunc(logoTemp.destroy, logoTemp),
            ));
        }

        areaLogo.stopAllActions();
        areaLogo.setPosition(dsAreaPos);
        let jump = cc.jumpTo(1, this.dsLogoPosArr[areaIdx], 50, 1);
        areaLogo.runAction(cc.sequence(jump, cc.callFunc(() => {
            this.unschedule(motionStreakFunc);
        })));
        this.schedule(motionStreakFunc, 0.1);
    }

    /**
     * 清楚玩家下注
     * @param rPos
     * @param areaBetInfo
     */
    cleanPlayerBet(rPos: number, betPointAll: areaBetInfo[]) {
        // 统计各个区域的筹码
        let areaClips: cc.Node[][] = [];
        let bets = this.nodeClips.children.concat();
        for (let idx = 0; idx < bets.length; idx++) {
            let bet = bets[idx];
            let area = +bet.name;
            if (!areaClips[area]) {
                areaClips[area] = [];
            }
            areaClips[area].push(bet);
        }

        let totalBets = 0;
        for (const betPointInfo of betPointAll) {
            let areaIdx = betPointInfo.area;
            let betPoint = betPointInfo.betPoint;

            // 减少区域的筹码
            let percentage = util.add(betPoint, 0).toNumber() / this._totalBetMoneyArr[areaIdx];
            let clips = areaClips[areaIdx];
            if (clips) {
                let cleanTotal = Math.floor(clips.length * percentage);
                let cleanNum = 0;
                for (let idx = 0; idx < clips.length; idx++) {
                    let bet = clips[idx];
                    if (bet.name === areaIdx.toString()) {
                        this.recycleChips(bet);
                        cleanNum += 1;
                        if (cleanNum >= cleanTotal) {
                            break;
                        }
                    }
                }
            }

            // 减少总共下注金额
            totalBets = util.add(totalBets, betPoint).toNumber();
            this._totalBetMoneyArr[areaIdx] = util.sub(this._totalBetMoneyArr[areaIdx], betPoint).toNumber();
            this.totalBetMoney[areaIdx].string = this._totalBetMoneyArr[areaIdx].toString();
        }
        let player = this.getBetPlayer(rPos);
        if (player && !player.isMe) {
            player.doBet(0, totalBets.toString(), false);
            player.initBets();
        }
    }

    /**
     * 获取下注玩家
     */
    getBetPlayer(rPos: number): HHPlayer | undefined {
        if (rPos === undefined)
            return;

        let player = this.playerMgr.getPlayerByServerPos(rPos);
        if (player) {
            return player;
        }
        let dsPos = this.dsPlayer.serverPos;
        let fhPos = this.fhPlayer.serverPos;
        if (rPos === dsPos && this.isExistDs) {
            return this.dsPlayer;
        }
        if (rPos === fhPos && this.isExistFh) {
            return this.fhPlayer;
        }
        return undefined;
    }

    /**
     * 玩家最终结算动画
     * @param winShape
     * @param redWin
     * @param users
     */
    async userStatistics(winShape: number, redWin: number, users: HHUser[]) {
        let winArea = !!redWin ? Area.AreaRed : Area.AreaBlack;
        let isWinShape = winShape > Shape.ShapePoint ? true : false;

        // 筹码飞向胜利区域
        if (users && users.length > 0) {
            this.audioMgr.playWinBet();
            for (let index = 0; index < users.length; index++) {
                let userInfo = users[index];

                let player = this.getBetPlayer(userInfo.rPos);
                if (!player) {
                    continue;
                }
                if (+userInfo.chgMoney <= 0) {
                    continue;
                }
                let betInfos = player.areaBetInfos;
                if (betInfos && betInfos.length === 0) {
                    continue;
                }

                let pWorldPos = player.node.convertToWorldSpaceAR(cc.v2(0, 0));
                // 玩家下注的区域
                let betAreaArr: number[] = [];
                for (const betInfo of betInfos) {
                    let areaIdx = betInfo.area;
                    if (betAreaArr.indexOf(areaIdx) === -1) {
                        betAreaArr.push(areaIdx);
                    }
                }

                // 先根据玩家赢的钱生存筹码飞向玩家
                for (const betArea of betAreaArr) {
                    if (betArea === winArea || (isWinShape && betArea === Area.AreaSpecial)) {
                        let nodeArea = this.betArea[betArea];
                        let pPos = this.nodeClips.convertToNodeSpaceAR(pWorldPos);
                        let money = +userInfo.chgMoney;
                        this.clipsFlyPlayer(money, betArea, pPos);
                    }
                }
                if (+userInfo.chgMoney > 0) {
                    this.playWinAnim(player);
                }
            }
        }

        // 再把桌上剩下的筹码飞向其他玩家
        let otherWorldPos = this.nodeOther.convertToWorldSpaceAR(cc.v2(0, 0));
        let oPos = this.nodeClips.convertToNodeSpaceAR(otherWorldPos);
        let bets = this.nodeClips.children.concat();
        let moveTime = 0.5;
        for (let idx = 0; idx < bets.length; idx++) {
            let bet = bets[idx];
            if (+bet.name === Area.Error) {
                continue;
            }
            bet.runAction(cc.sequence(
                cc.delayTime(0.01 * idx),
                cc.spawn(Parabola.move(moveTime, bet.getPosition(), oPos), cc.fadeTo(moveTime, 200)),
                cc.callFunc(() => {
                    this.recycleChips(bet);
                })
            ));
        }
        await new Promise(resolve => {
            this.scheduleOnce(() => { resolve() }, 0.8);
        });;
        cc.log("fly player over" + users.length);

        // 刷新玩家的金币、展示输赢
        for (const user of users) {
            let player = this.getBetPlayer(user.rPos);
            if (!player) {
                continue;
            }

            // 所下注金额
            let points: number = 0;
            let betInfos = player.areaBetInfos;
            if (betInfos) {
                // 把之前下注的金额补回来
                for (const betInfo of betInfos) {
                    let point = betInfo.betPoint;
                    points = util.add(points, point).toNumber();
                }

                // 只有在结算状态才同步
                if (!player.isMe || this.gameState !== GameStatus.END) {
                    points = util.add(points, user.chgMoney).toNumber();
                    player.statisticsBalance(points);
                }

                let money = +user.chgMoney;
                let winMoney: string;
                let loseMoney: string;
                if (money > 0) {
                    winMoney = `+${user.chgMoney}`;
                } else if (money < 0) {
                    loseMoney = user.chgMoney;
                }
                player.showGetAndLost({ get: winMoney, lost: loseMoney });
            }

            // 玩家金额不足则替换掉
            if (!player.isMe && player.balance <= this.MIN_BET) {
                this.playerMgr.setPlayerLeave(player.serverPos);
            }
        }
        this.changeState(GameStatus.RESULT);
    }

    setTimer(time: number) {
        let totalTime = time;
        let isShake = false;
        let countDown1: Function;
        let countDown2: Function;
        if (this.labBetTime) {
            this.labBetTime.string = `${Math.floor(totalTime)}`;
            let parNode = this.animClock.parent.parent;
            let self = this;
            this.schedule(countDown1 = function (dt: number) {
                totalTime -= dt;
                if (totalTime <= 0) {
                    self.labBetTime.string = "0";
                    self.unschedule(countDown1);
                    self.unschedule(countDown2);
                    return;
                }

                if (totalTime <= self.BET_TOTAL_TIME * 0.5) {
                    self.audioMgr.playClock();
                    self.animClock.stopAllActions();
                    self.animClock.scale = 1;
                    self.animClock.opacity = 255;
                    let actionTime = 0.5;
                    self.animClock.runAction(cc.spawn(cc.scaleTo(actionTime, 2), cc.fadeTo(actionTime, 0)));
                }
                self.labBetTime.string = `${Math.floor(totalTime)}`;
            }, 0.95);
            this.showAction(parNode, true, false);
        }
    }

    private showAction(node: cc.Node, show: boolean, isNodeVs: boolean, callFunc?: Function) {
        callFunc = callFunc || function () { };
        if (show) {
            node.stopAllActions();
            node.scale = 0;
            if (isNodeVs) {
                node.y = this.nodeVsPosY - 45;
            } else {
                node.y = this.betTimePanelPosY - 45;
            }
            node.runAction(cc.spawn(
                cc.scaleTo(0.1, 1, 1),
                cc.moveBy(0.3, 0, 45).easing(cc.easeBackOut()),
                cc.fadeIn(0.3)
            )
            );
        } else {
            node.stopAllActions();
            node.scale = 1;
            node.runAction(cc.sequence(
                cc.spawn(
                    cc.scaleTo(0.1, 0, 0),
                    cc.moveBy(0.3, 0, -45).easing(cc.easeBackIn()),
                    cc.fadeOut(0.3)
                ),
                cc.callFunc(() => {
                    if (isNodeVs) {
                        node.y = this.nodeVsPosY + 45;
                    } else {
                        node.y = this.betTimePanelPosY + 45;
                    }
                    callFunc();
                })
            ));
        }
    }

    private hideClockNode() {
        let parNode = this.animClock.parent.parent;
        this.showAction(parNode, false, false, () => {
            this.betTimePanel.active = false;
        });
    }

    onClickTrend() {
        this.hhTrend.show();
    }

    onClickOther() {
        this.hhOther.show();
    }

    // ----------------------------------区域效果
    /**
     * 设置胜利区域的特效
     * @param redWin
     * @param winShape
     */
    setWinAreaEff(redWin: number, winShape: number) {
        if (!!redWin) {
            this.setAreaEff(Area.AreaRed);
        } else {
            this.setAreaEff(Area.AreaBlack);
        }
        if (winShape > Shape.ShapePairSmall) {
            this.setAreaEff(Area.AreaSpecial);
        }
    }

    private setAreaEff(areaIdx: number) {
        let area = this.winLightArea[areaIdx];
        area.active = true;
        area.stopAllActions();
        area.opacity = 255;

        let binkTime = 0.3;
        area.runAction(cc.repeatForever(cc.sequence(
            cc.fadeTo(binkTime, 255),
            cc.fadeTo(binkTime, 0),
            cc.fadeTo(binkTime, 255),
        )));
    }

    private hideAllPanel() {
        this.hideArea();
    };

    /**
     * 隐藏下注区域
     */
    private hideArea() {
        this.betLightArea.forEach(node => {
            node.active = false;
        });
        this.winLightArea.forEach(node => {
            node.stopAllActions();
            node.active = false;
        });
        for (let idx = 0; idx < this.dsBetLogoArr.length; idx++) {
            const logo = this.dsBetLogoArr[idx];
            logo.stopAllActions();
            logo.setPosition(this.dsLogoPosArr[idx]);
            logo.active = false;
        }
    }

    //--------------------------------------下注区域
    /**
     * 选择下注区域
     * @param ev
     * @param idx
     */
    private onClickArea(ev: cc.Event.EventTouch, idx: string) {
        let areaIdx = +idx;
        if (this.gameState === GameStatus.BET) {
            if (this._currBetPoint) {
                // 不能大于该区域的最大下注额
                let areaBet = this._selfBetMoneyArr[areaIdx];
                let currMaxBet = util.add(areaBet, this._currBetPoint).toNumber();
                let maxBet = (Area.AreaSpecial === areaIdx) ? this.MAX_SPECIAL_AREA_BET : this.MAX_AREA_BET;
                if (currMaxBet > maxBet) {
                    util.showTip("下注额超过下注上限～");
                    return;
                }

                // 不能同时下红黑
                if (this._currBetArea !== undefined && areaIdx !== Area.AreaSpecial && areaIdx !== this._currBetArea) {
                    util.showTip("不能同时在红黑方下注～");
                    return;
                }

                let player = this.playerMgr.me;
                if (player.balance >= this._currBetPoint) {
                    //下注区域闪烁
                    this.betLightArea[areaIdx].active = false;
                    this.scheduleOnce(() => {
                        this.betLightArea[areaIdx].active = true;
                    }, 0.05);

                    this.msg.sendDoBets(areaIdx, this._currBetPoint);

                    let playerPos = player.convertToNodePos(this.nodeClips);
                    this.clipsFlyArea(this._currBetPoint, areaIdx, playerPos);
                    this.audioMgr.playDoBeting();
                } else {
                    util.showTip("金额不足～");
                }
            } else {
                util.showTip(`金币不足${this.MIN_BET}不能下注，请您充值～`);
            }
        } else {
            cc.log("非下注时间");
        }
    }

    /**
     * 设置该区域所有的筹码
     */
    setTotalAreaMoney(areaIdx: number, money: number, showDefaultClips = false) {
        if (!this._totalBetMoneyArr) {
            return;
        }
        if (areaIdx > this._totalBetMoneyArr.length - 1)
            return
        if (!money) {
            return;
        }
        this._totalBetMoneyArr[areaIdx] = util.add(this._totalBetMoneyArr[areaIdx], money).toNumber();
        this.totalBetMoney[areaIdx].string = this._totalBetMoneyArr[areaIdx].toString();

        if (showDefaultClips) {
            let clips = this.getFlyClips(money);
            if (clips) {
                for (const clip of clips) {
                    clip.name = areaIdx.toString();
                    let areaPos = this.getAreaRandomPos(areaIdx);
                    clip.setPosition(areaPos);
                }
            }
        }
    }

    /**
     * 设置该区域自己的筹码
     */
    setSelfAreaMoney(areaIdx: number, bet: number) {
        if (areaIdx > this._totalBetMoneyArr.length - 1)
            return
        if (!bet) {
            return;
        }
        this.selfBetMoneyBg[areaIdx].active = true;
        this._selfBetMoneyArr[areaIdx] = util.add(this._selfBetMoneyArr[areaIdx], bet).toNumber();
        let labArea = this.selfBetMoney[areaIdx];
        labArea.string = this._selfBetMoneyArr[areaIdx].toString();
        this.setBtnCancelGray(false);
        this.isGaming = true;
    }

    /**
    * 取消下注
    */
    onClickCancel() {
        if (this.gameState !== GameStatus.BET) return;
        let player = this.playerMgr.me;
        player.balance = this._beforeBettingMoney;
        player.updateBalance();
        if (player.serverPos === this.fhPlayer.serverPos) {
            this.fhPlayer.balance = this._beforeBettingMoney;
            this.fhPlayer.updateBalance();
        }
        if (player.serverPos === this.dsPlayer.serverPos) {
            this.dsPlayer.balance = this._beforeBettingMoney;
            this.dsPlayer.updateBalance();
        }

        this.cleanSelfBet();
        this.setAllowBet();
        this.setBtnCancelGray(true);
        this.msg.sendCancelBet();

        this._currBetArea = undefined;
        this.isGaming = false;
    }

    //---------------------------------------- 己方筹码
    /**
     * 选择筹码
     */
    private onClickBet(ev: cc.Event.EventTouch, idx: string) {
        let btnIdx = +idx;
        let btn = this.chooseBetBtn[btnIdx];
        if (btn.interactable && (this.gameState === GameStatus.BET)) {
            this._currBetPoint = this.POINT_LIST[btnIdx];
            this.setBetLight(btnIdx);
        }
    }

    /**
     * 挑选自己可选择的筹码
     */
    setAllowBet() {
        if (!this.playerMgr.me || this.playerMgr.me.balance === undefined || !this.POINT_LIST)
            return;

        let money = this.playerMgr.me.balance;
        // 金额低于50不能下注
        if (money < this.MIN_BET) {
            for (let idx = 0; idx < this.chooseBetBtn.length; idx++) {
                let btn = this.chooseBetBtn[idx];
                btn.node.opacity = 150;
                btn.interactable = false;
            }
            this._currBetPoint = undefined;
            this.setBetLight(-1);

            this.noGoldTips.node.active = true;
            this.noGoldTips.string = `金币不足${this.MIN_BET}不能下注，请您充值～`;
            return;
        } else {
            this.noGoldTips.node.active = false;
        }

        let allowNum = 0;
        let currChooseNum = 0;
        for (let idx = 0; idx < this.chooseBetBtn.length; idx++) {
            let btn = this.chooseBetBtn[idx];
            let btnScore = this.POINT_LIST[idx];
            if (money >= btnScore) {
                btn.node.opacity = 255;
                btn.interactable = true;
                allowNum += 1;

                if (this._currBetPoint && (this._currBetPoint === this.POINT_LIST[idx])) {
                    currChooseNum = allowNum;
                }
            } else {
                btn.node.opacity = 150;
                btn.interactable = false;
            }
        }

        if (allowNum > 0) {
            if (currChooseNum) {
                allowNum = currChooseNum;
            } else if (!this._currBetPoint) {
                allowNum = 1;
            }
            let maxBetVal = this.POINT_LIST[allowNum - 1];
            this._currBetPoint = maxBetVal;

            this.setBetLight(allowNum - 1);
        } else {
            this.setBetLight(-1);
        }
    }

    /**
    * 设置筹码按钮选中效果
    * @param betIdx
    */
    private setBetLight(betIdx: number) {
        for (let idx = 0; idx < this.chooseBetLight.length; idx++) {
            let sprite = this.chooseBetLight[idx];
            if (idx === betIdx) {
                sprite.active = true;
                this.chooseBetBtn[idx].node.setPositionY(8);
            } else {
                sprite.active = false;
                this.chooseBetBtn[idx].node.setPositionY(0);
            }
        }
    }

    /**
     * 隐藏所有筹码按钮
     */
    hideBet() {
        for (let idx = 0; idx < this.chooseBetBtn.length; idx++) {
            let btn = this.chooseBetBtn[idx];
            btn.node.opacity = 150;
            btn.interactable = false;
        }
        this.setBetLight(-1);
    }

    /**
     * 随机生成区域内筹码坐标
     * @param areaIdx
     */
    private getAreaRandomPos(areaIdx: number): cc.Vec2 {
        let area = this.betArea[areaIdx];
        let areaSize = area.getContentSize();
        let areaX = area.getPositionX();
        let areaY = area.getPositionY();

        let x = cc.randomMinus1To1() * areaSize.width * 0.32 + areaX;
        let y = cc.randomMinus1To1() * (areaSize.height - 50) * 0.43 + areaY;
        let areaWorldPos = area.convertToWorldSpaceAR(cc.v2(x, y));
        let areaPos = this.nodeClips.convertToNodeSpaceAR(areaWorldPos);
        return areaPos;
    }

    private setBtnCancelGray(isGray: boolean) {
        this.btnCancel.interactable = !isGray;
        util.setGray(this.btnCancel, isGray);
        let lab = this.btnCancel.getComponentInChildren(cc.LabelOutline);
        lab.color = isGray ? cc.hexToColor("#7B7E86") : cc.hexToColor("#225C24");
    }

    private cleanBet() {
        this._totalBetMoneyArr = [0, 0, 0];
        for (const lab of this.totalBetMoney) {
            lab.string = "0";
        }
        this.cleanSelfBet();
    }

    private cleanSelfBet() {
        this._selfBetMoneyArr = [0, 0, 0];
        this.selfBetMoneyBg.forEach(bg => {
            bg.active = false;
        });
        for (const lab of this.selfBetMoney) {
            lab.string = "0";
        }
        this.betLightArea.forEach(node => {
            node.active = false;
        });
    }

    //------------------------------------ 生成筹码

    /**
     * 筹码从下注区飞向赢钱玩家
     * @param money
     * @param areaIdx
     * @param playerPos
     */
    clipsFlyPlayer(money: number, areaIdx: number, playerPos: cc.Vec2) {
        if (money <= 0) {
            return;
        }
        return new Promise(resolve => {
            let clips = this.getFlyClips(money);
            if (clips) {
                let moveTime = 0.5;
                for (let idx = 0; idx < clips.length; idx++) {
                    let clip = clips[idx];
                    if (idx > this.maxAreaCount * 0.3) {
                        this.recycleChips(clip);
                    } else {
                        clip.name = Area.Error.toString();
                        let areaPos = this.getAreaRandomPos(areaIdx);
                        clip.setPosition(areaPos);

                        clip.runAction(cc.sequence(
                            cc.delayTime(0.05 * idx),
                            cc.spawn(Parabola.move(moveTime, areaPos, playerPos), cc.fadeTo(moveTime, 200)),
                            cc.callFunc(() => {
                                this.recycleChips(clip);
                                if (idx === clips.length - 1) {
                                    resolve();
                                }
                            })
                        ));
                    }
                }
            }
        })
    }

    /**
     * 筹码从玩家飞向下注区
     * @param money
     * @param pos
     * @param areaIdx
     */
    clipsFlyArea(money: number, areaIdx: number, beginPos: cc.Vec2) {
        if (money <= 0) {
            return;
        }
        return new Promise(resolve => {
            let clips = this.getFlyClips(money);
            if (clips) {
                let moveTime = 0.5;
                for (let idx = 0; idx < clips.length; idx++) {
                    let clip = clips[idx];
                    clip.name = areaIdx.toString();
                    clip.setPosition(beginPos);
                    clip.opacity = 100;
                    let areaPos = this.getAreaRandomPos(areaIdx);
                    let oldScale = clip.getScale();

                    clip.runAction(cc.sequence(
                        cc.delayTime(0.02 * idx),
                        cc.spawn(cc.moveTo(moveTime, areaPos).easing(cc.easeSineOut()), cc.fadeTo(moveTime, 255), cc.scaleTo(moveTime, oldScale)),
                        cc.callFunc(() => {
                            if (idx === clips.length - 1) {
                                resolve();
                            }
                        })
                    ));
                }
            }
        })
    }

    /**
     * 生成飞向下注区域的筹码
     */
    private getFlyClips(amount: number) {
        let baseScore = this.baseScore;
        let chips: cc.Node[] = [];
        for (let i = this.POINT_LIST.length - 1; i >= 0; i--) {
            let prefab = this.prefabChips[i];
            if (!prefab) {
                continue;
            }
            let num = util.mul(this.POINT_LIST[i], baseScore);
            if (util.cmp(amount, num) === -1) {
                continue;
            }
            let count = Math.floor(util.div(amount, num).toNumber());
            if (count < 1) {
                continue;
            }
            while (count-- > 0) {
                let node = this.chipsNodePool[i].get();
                if (!node) {
                    node = util.instantiate(prefab);
                }
                node.tag = i;
                node.rotation = cc.randomMinus1To1() * 30;
                chips.push(node);
                this.nodeClips.addChild(node);
            }
            amount = util.mod(amount, num).toNumber();
            if (amount === 0) {
                break;
            }
        }
        return chips;
    }

    private recycleChips(c: cc.Node) {
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

    // --------------------------动画
    async playWinAnim(player: HHPlayer) {
        let anim = <cc.Node>util.instantiate(this.preAnimWin);
        this.nodeAnimation.addChild(anim);
        anim.setPosition(player.convertToNodePos(this.nodeAnimation));

        let nodeParticle = util.instantiate(this.preParticle);
        anim.addChild(nodeParticle);
        await this.playRepeatAnim(anim, false);

        anim.removeAllChildren();
        anim.removeFromParent();
    }

    playVsAnim() {
        this.spVs.node.active = true;
        this.spVs.animation = "animation";
        this.audioMgr.playAlert();
    }
}
