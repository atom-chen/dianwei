import BrnnMsg, { GameStatus, BrnnBullHandle, Area, UserPersonInfo } from "./brnnMsg";
import BrnnPlayerMgr from "./brnnPlayerMgr";
import BrnnPlayer from "./brnnPlayer";
import BrnnAudio from "./brnnAudio";
import BrnnCard from "./brnnCard";

import CardGame from "../game-share/cardGame";
import { Gender } from "../common/user";
import * as util from "../common/util";
import Parabola from "../game-share/parabola";
import { GameId } from "../game-share/game";

const { ccclass, property } = cc._decorator;

interface BankerInfo {
    rPos: number,
    avatar: number,
    gender: number,
    location: string,
    money: string,
}

enum BullType {
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

enum PanelName {
    Main,
    Banker,
    Other,
    History,
    Bill,
}

@ccclass
export default class BrnnGame extends CardGame<BrnnCard> {
    @property([cc.Node])
    private areaLightArr: cc.Node[] = [];

    @property([cc.Node])
    private areaWinArr: cc.Node[] = [];

    @property([cc.Label])
    private areaAllMoneyArr: cc.Label[] = [];

    @property([cc.Node])
    private areaSelfMoneyBgArr: cc.Node[] = [];

    @property([cc.Label])
    private areaSelfMoneyArr: cc.Label[] = [];

    @property([cc.Node])
    private nnTypeBgArr: cc.Node[] = [];

    @property([cc.Sprite])
    private nnTypeArr: cc.Sprite[] = [];

    @property([cc.Label])
    private nnBoostArr: cc.Label[] = [];

    @property([cc.Label])
    private finalScoreArr: cc.Label[] = [];

    @property([cc.Sprite])
    private finalNoBetSprite: cc.Sprite[] = [];

    @property(cc.Node)
    private nodeBanker: cc.Node = undefined;

    @property(cc.Node)
    private waitTips: cc.Node = undefined;

    @property(cc.Node)
    private nodeChooseArea: cc.Node = undefined;

    @property(cc.Node)
    private nodeFlyPos: cc.Node = undefined;

    @property(cc.Node)
    private nodeCoin: cc.Node = undefined;

    @property(cc.Node)
    private nodeCard: cc.Node = undefined;


    @property(cc.Node)
    private panelTempShow: cc.Node = undefined;

    @property(cc.Node)
    private panelBanker: cc.Node = undefined;

    @property(cc.Node)
    private panelOther: cc.Node = undefined;

    @property(cc.Node)
    private panelZST: cc.Node = undefined;

    @property(cc.Node)
    private panelBill: cc.Node = undefined;

    @property(cc.Node)
    private panelEnd: cc.Node = undefined;


    @property(cc.Node)
    private betSvContent: cc.Node = undefined;

    @property(cc.Label)
    private btnLabBanker: cc.Label = undefined;

    @property(cc.Label)
    private labRule: cc.Label = undefined;
    @property(cc.Label)
    private labBankerCount: cc.Label = undefined;


    @property([cc.SpriteFrame])
    private sfBetSkinArr: cc.SpriteFrame[] = [];
    @property([cc.SpriteFrame])
    private sfBullType: cc.SpriteFrame[] = [];
    @property([cc.SpriteFrame])
    private spriteBgBullType: cc.SpriteFrame[] = [];

    @property([cc.Font])
    private fontScoreArr: cc.Font[] = [];

    @property(cc.Prefab)
    private preCoin: cc.Prefab = undefined;

    @property(cc.Prefab)
    private preAnimBetting: cc.Prefab = undefined;

    @property(cc.Prefab)
    private preAnimSend: cc.Prefab = undefined;

    @property(cc.Node)
    private animSuc: cc.Node = undefined;
    @property(cc.Node)
    private animFail: cc.Node = undefined;

    // 倒计时面板
    @property(cc.Node)
    private betTimePanel: cc.Node = undefined;

    @property(cc.Label)
    private labBetTime: cc.Label = undefined;

    @property(cc.Node)
    private nodeRest: cc.Node = undefined;

    @property(cc.Node)
    private animClock: cc.Node = undefined;

    // 庄家
    @property(cc.Sprite)
    private bankerHead: cc.Sprite = undefined;

    @property(cc.Label)
    private bankerName: cc.Label = undefined;

    @property(cc.Label)
    private bankerMoney: cc.Label = undefined;

    // 结算
    @property(cc.Node)
    private nodeEndBg: cc.Node = undefined;

    @property(cc.Label)
    private labEndSuc: cc.Label = undefined;

    @property(cc.Label)
    private labEndFail: cc.Label = undefined;

    // 上庄
    @property(cc.Label)
    private bLabLoc: cc.Label = undefined;
    @property(cc.Label)
    private bLabCount: cc.Label = undefined;
    @property(cc.Label)
    private bLabMoney: cc.Label = undefined;
    @property(cc.Label)
    private bLabPeople: cc.Label = undefined;
    @property(cc.Label)
    private bLabMinMoney: cc.Label = undefined;

    @property(cc.Label)
    private bLabMaxBankCount: cc.Label = undefined;

    @property(cc.Label)
    private bLabDesc: cc.Label = undefined;
    @property(cc.Node)
    private bSvContent: cc.Node = undefined;

    // 其他玩家
    @property(cc.Node)
    private oSvContent: cc.Node = undefined;

    @property(cc.Node)
    private oSvItem: cc.Node = undefined;

    @property([cc.SpriteFrame])
    private sfBg: cc.SpriteFrame[] = [];

    @property([cc.SpriteFrame])
    private goldBg: cc.SpriteFrame[] = [];

    // 走势图
    @property(cc.Node)
    private zsNodeNew: cc.Node = undefined;
    @property(cc.Node)
    private zsNodeContent: cc.Node = undefined;

    // 战绩
    @property(cc.Node)
    private billContent: cc.Node = undefined;

    @property(cc.Prefab)
    preAnimWin: cc.Prefab = undefined;
    @property(cc.Prefab)
    preParticle: cc.Prefab = undefined;


    gameName = GameId.BRNN;
    private BET_TOTAL_TIME = 10;            // 下注总时间
    private RES_TOTAL_TIME = 10;            // 结算总时间
    private MIN_BANKER_MONEY = 10000;       // 上庄下限
    private MAX_MULTIPLE = 3;               // 最大倍率场次
    private MAX_BANKER_PAY_POINT = 10000;    // 庄家最大赔付值
    private MAX_BANKER_LIST = 5;              // 上庄列表最大数
    private BET_POINT_LIST: string[] = [];    // 筹码数值列表
    private BANKER_RPOS = -1;                 // 庄家坐标
    MAX_BANK_COUNT = 0;                      // 上庄玩家总庄数
    private maxAreaCount: number = 30;        // 区域允许的最大筹码数
    private betTimePanelPosY: number;         // 闹钟初始坐标Y值

    private CARD_SCALE = 0.45;
    private BANKER_DESC_UP = "上庄";
    private BANKER_DESC_DOWN = "下庄";
    private BANKER_DESC_WANT = "我要上庄";
    private BANKER_DESC_EXIT = "我要下庄";
    private BANKER_DESC_WAIT = "等待下庄";

    // 庄
    private _sysBankInfo: BankerInfo;
    private _currBankerPos: number = -1;
    private _bankList: { uid: number, userPos: number }[];

    private _currBetPoint: string;
    private _beforeBettingMoney: number;      // 下注之前自己的金额
    private _totalBetMoneyArr: number[];
    private _selfBetMoneyArr: number[];
    private _gameAreaInfo: BrnnBullHandle[];
    private _currPanel: PanelName;


    // 容器
    private _betBtnArr: cc.Button[] = [];
    private _betLightArr: cc.Node[] = [];
    private _coinPool: cc.NodePool = undefined;

    // 组件

    private nnTypeBtnArr: cc.Button[] = [];
    private zstWinArr: cc.Node[][] = [];
    private zstFailArr: cc.Node[][] = [];

    //五堆牌
    private cardStacks: BrnnCard[][] = [];

    private canPlayCoinAudio = true;
    private coinAudioInterval = 0.1;//飞金币音效间隔

    playerMgr: BrnnPlayerMgr;
    msg: BrnnMsg;
    audioMgr: BrnnAudio;

    get currBankerPos() {
        return this._currBankerPos;
    }

    protected cardType = BrnnCard;
    dealRoomData(data: any): void {

    }
    onLoad() {
        for (let index = 0; index < this.nnTypeArr.length; index++) {
            let nnType = this.nnTypeArr[index];
            this.nnTypeBtnArr[index] = nnType.node.getComponent(cc.Button);
        }

        // 保存走势图的胜败图标
        for (let index = 0; index < this.zsNodeContent.childrenCount; index++) {
            let itemNode = this.zsNodeContent.getChildByName(index.toString());
            let winArr: cc.Node[] = [];
            let failArr: cc.Node[] = [];
            for (let idx = 0; idx < itemNode.childrenCount / 2; idx++) {
                let labWin = itemNode.getChildByName(`suc${idx}`);
                let labFail = itemNode.getChildByName(`fail${idx}`);
                winArr[idx] = labWin;
                failArr[idx] = labFail;
            }
            this.zstWinArr[index] = winArr;
            this.zstFailArr[index] = failArr;
        }

        this.initClickEvent();
        this.onClickClosePanel();

        this._currPanel = PanelName.Main;
        this._coinPool = new cc.NodePool();
        // 预先设置300个
        for (let index = 0; index < 200; index++) {
            let coin = util.instantiate(this.preCoin);
            this._coinPool.put(coin);
        }
        this.betTimePanelPosY = this.betTimePanel.y;
        super.onLoad();
    }

    initRound(): void {
        this.betTimePanel.active = false;
        this.waitTips.active = false;
        this.cardStacks = [];
        this.hideAllPanel();
        this.hideSelfArea();
        this.hideBet();
        this.nodeCard.removeAllChildren();
        this.recoverAllCoins();

        this._totalBetMoneyArr = [0, 0, 0, 0];
        this._selfBetMoneyArr = [0, 0, 0, 0];
        this.areaAllMoneyArr.forEach(lab => {
            lab.string = "0";
        });
    }

    initGame(): void {
        this.waitTips.active = false;
        this.msg = new BrnnMsg(this);
        this.msg.init();
        this.playerMgr = new BrnnPlayerMgr(this);
        this.menu.init(this);
    }

    //显示等待下局
    showWaitTips() {
        this.waitTips.active = true;
    }
    initOptBets() {
        if (this.betSvContent.childrenCount > 1) {
            return;
        }
        let svItem = this.betSvContent.getChildByName("item");
        svItem.active = false;
        for (let btnIdx = 0; btnIdx < this.sfBetSkinArr.length; btnIdx++) {
            let item = util.instantiate(svItem);
            item.active = true;
            this.betSvContent.addChild(item);
            let btnNode = item.getChildByName("btn");
            let btn = btnNode.getComponent(cc.Button);
            this._betBtnArr[btnIdx] = btn;

            let btnSpri = btnNode.getComponent(cc.Sprite);
            btnSpri.spriteFrame = this.sfBetSkinArr[btnIdx];
            let lab = btnNode.getChildByName("lab").getComponent(cc.Label);
            lab.string = this.BET_POINT_LIST[btnIdx];
            let light = btnNode.getChildByName("light");
            light.active = false;
            this._betLightArr[btnIdx] = light;

            let handler = new cc.Component.EventHandler();
            handler.target = this.node;
            handler.component = cc.js.getClassName(this);
            handler.handler = "onClickBet";
            handler.customEventData = btnIdx.toString();
            btn.clickEvents.push(handler);

            if (this.BET_POINT_LIST[btnIdx] === undefined) {
                item.active = false;
            }
        }
    }

    initClickEvent() {
        for (let idx = 0; idx < this.nodeChooseArea.childrenCount; idx++) {
            let chooseArea = this.nodeChooseArea.getChildByName(idx.toString());
            let btn = chooseArea.getComponent(cc.Button);
            let handler = new cc.Component.EventHandler();
            handler.target = this.node;
            handler.component = cc.js.getClassName(this);
            handler.handler = "onClickArea";
            handler.customEventData = idx.toString();
            btn.clickEvents.push(handler);
        }
    }

    changeState(s: number, left?: number) {
        super.changeState(s);
    }

    updateUI(): void {
        if (this.gameState === GameStatus.Balancing) {
            return;
        }
        this.hidePrepare();
        this.hideAllPanel();
        switch (this.gameState) {
            // 等待开始
            case GameStatus.Waiting:
                console.log("等待状态");
                this.initRound();
                if (this._currBankerPos !== this.BANKER_RPOS) {
                    this.setBankerCount();
                    let player = this.playerMgr.getPlayerByServerPos(this._currBankerPos);
                    if (player && player.isMe) {
                        this.isGaming = true;
                    }
                }
                break;
            // 下注
            case GameStatus.Betting:
                console.log("下注状态");
                this.audioMgr.playStartSound();
                this.playAnim(this.preAnimBetting);

                this.panelTempShow.active = true;
                this.betTimePanel.active = true;
                this.nodeRest.active = false;

                let selfPlayer = this.playerMgr.me;
                if (selfPlayer && (selfPlayer.balance !== undefined)) {
                    this._beforeBettingMoney = selfPlayer.balance;
                }
                this.setAllowBet();
                break;
            // 发牌、展示
            case GameStatus.CardDisplaying:
                console.log("发牌展示状态");
                this.panelTempShow.active = true;
                this.hideBet();
                break;
            // 服务器结算
            case GameStatus.Balancing:
                break;
            // 结算
            case GameStatus.ClientBalancing:
                console.log("结算状态");
                this.panelTempShow.active = true;
                this.betTimePanel.active = true;
                this.nodeRest.active = true;
                this.nodeCard.removeAllChildren();
                this.hideBet();
                break;
            // 结束
            case GameStatus.Finished:
                console.log("结束状态");
                this.updatePanel();
                break;
        }
        this.menu.hideChangeBtn();
    }

    setRoomInfo(config: any): void {
        this.BET_TOTAL_TIME = config.betTime / 1000;
        this.RES_TOTAL_TIME = config.clientBalanceTime / 1000;
        this.MAX_BANKER_PAY_POINT = config.maxAllBetPoint;
        this.MIN_BANKER_MONEY = config.bankMinMoney;
        this.BET_POINT_LIST = config.betPointList;
        this.MAX_MULTIPLE = config.maxBetBoost;
        this.MAX_BANK_COUNT = config.bankMaxCount;

        let avatar = config.sysBankerAvator;
        let gender = config.sysBankerGender;
        let location = config.sysBankerNamer;
        let money = config.sysBankerMoney;
        this._sysBankInfo = { rPos: config.sysBankerId, avatar: avatar, gender: gender, location: location, money: money };

        this.labRule.string = `1~${this.MAX_MULTIPLE}倍场`;
        this.bLabMaxBankCount.string = this.MAX_BANK_COUNT.toString();
        this.bLabMinMoney.string = util.toCNMoney(this.MIN_BANKER_MONEY.toString()).toString();
        this.initOptBets();
    }
    refreshRoomInfo() {
        this.setAllowBet();
        this.isGaming = false;
    }

    /**
     * 刷新已打开面板内容
     */
    updatePanel() {
        if (this._currPanel === PanelName.Banker) {
            this.msg.sendBankList();
        } else if (this._currPanel === PanelName.Other) {
            this.onClickOtherPlayer();
        } else if (this._currPanel === PanelName.History) {
            this.msg.sendGameHistory();
        } else if (this._currPanel === PanelName.Bill) {
            this.msg.sendGamerHistory();
        }
    }

    /**
     * 上庄界面
     * @param bankInfos
     * @param continueCount
     */
    showBanker(bankInfos: { uid: number, userPos: number }[], continueCount?: number) {
        this._currPanel = PanelName.Banker;
        this.panelBanker.active = true;
        let bankInfo: any;
        if (this._currBankerPos === -1) {
            bankInfo = this._sysBankInfo;
            this.bLabCount.node.active = false;
        } else {
            bankInfo = this.playerMgr.getInfoByPos(this._currBankerPos);
        }
        if (bankInfo) {
            this.bLabLoc.string = bankInfo.location;
            if (this._currBankerPos === -1) {
                this.bLabMoney.string = "Max";
            } else {
                this.bLabMoney.string = util.toCNMoney(bankInfo.money);
            }
        }

        if (bankInfos && bankInfos.length > 0) {
            this._bankList = bankInfos;
            this.bLabPeople.string = bankInfos.length.toString();
            this.bSvContent.active = true;

            let itemNode = this.bSvContent.getChildByName("item");
            this.bSvContent.children.forEach((v) => {
                v.destroy();
            });
            for (let index = 0; index < bankInfos.length; index++) {
                let bankInfo = bankInfos[index];
                let playerInfo = this.playerMgr.getInfoByPos(bankInfo.userPos);

                let item = util.instantiate(itemNode);
                item.active = true;
                this.bSvContent.addChild(item);
                let sort = item.getChildByName("sort").getComponent(cc.Label);
                let loc = item.getChildByName("loc").getComponent(cc.Label);
                let money = item.getChildByName("money").getComponent(cc.Label);
                sort.string = `${index + 1}`;
                loc.string = playerInfo.location;
                money.string = util.toCNMoney(playerInfo.money);
            }
        } else {
            this._bankList = [];
            this.bLabPeople.string = "0";
            this.bSvContent.active = false;
        }
        this.bLabDesc.string = this.BANKER_DESC_UP;
        if (continueCount !== undefined) {
            this.bLabCount.string = `第${continueCount}轮`;
        }

        // 判断自己是否在庄或在排队列表中
        this._bankList.forEach(info => {
            let player = this.playerMgr.getPlayerByServerPos(info.userPos);
            if (player && player.isMe) {
                this.bLabDesc.string = this.BANKER_DESC_DOWN;
            }
        });
        if (this._currBankerPos !== undefined) {
            let player = this.playerMgr.getPlayerByServerPos(this._currBankerPos);
            if (player && player.isMe) {
                this.bLabDesc.string = this.BANKER_DESC_DOWN;
            }
        }
    }

    /**
     * 走势图界面
     * @param historyArr
     */
    showHistory(historyArr: { EAST: number, WEST: number, NORTH: number, SOUTH: number }[]) {
        this._currPanel = PanelName.History;
        this.panelZST.active = true;
        historyArr.reverse();
        if (historyArr.length > 0) {
            this.zsNodeNew.active = true;
            this.zsNodeContent.active = true;

            for (let idx = 0; idx < this.zsNodeContent.childrenCount; idx++) {
                let itemNode = this.zsNodeContent.getChildByName(idx.toString());
                if (idx < historyArr.length) {
                    itemNode.opacity = 255;

                    let histInfo = historyArr[idx];
                    let winArr = this.zstWinArr[idx];
                    winArr[0].active = !!histInfo.EAST;
                    winArr[1].active = !!histInfo.SOUTH;
                    winArr[2].active = !!histInfo.WEST;
                    winArr[3].active = !!histInfo.NORTH;
                    let failArr = this.zstFailArr[idx];
                    failArr[0].active = !histInfo.EAST;
                    failArr[1].active = !histInfo.SOUTH;
                    failArr[2].active = !histInfo.WEST;
                    failArr[3].active = !histInfo.NORTH;
                } else {
                    itemNode.opacity = 0;
                }
            }
        } else {
            this.zsNodeNew.active = false;
            this.zsNodeContent.active = false;
        }
    }

    showMyBill(billArr: { uid: number, startDate: string, winPoint: string, tax: string }[]) {
        this._currPanel = PanelName.Bill;
        this.panelBill.active = true;
        if (billArr.length > 0) {
            let itemNode = this.billContent.getChildByName("item");
            this.billContent.children.forEach((v) => {
                v.destroy();
            });

            for (let idx = 0; idx < billArr.length; idx++) {
                let bill = billArr[idx];
                let col = (+bill.winPoint >= 0) ? cc.hexToColor("#e3b86b") : cc.hexToColor("#7ee36a");

                let item = util.instantiate(itemNode);
                item.active = true;
                this.billContent.addChild(item);

                let labNumber = item.getChildByName("number").getComponent(cc.Label);
                let labTime = item.getChildByName("time").getComponent(cc.Label);
                let labMoney = item.getChildByName("money").getComponent(cc.Label);
                let labTax = item.getChildByName("tax").getComponent(cc.Label);
                labNumber.string = `(${idx})`;
                let dateStr = util.formatTimeStr('m', bill.startDate)
                labTime.string = dateStr;
                labMoney.string = bill.winPoint;
                labMoney.node.color = col;
                labTax.string = bill.tax;
            }
        }
    }

    /**
     * 下注阶段时，服务器发送过来的玩家金额是下注之前的，并不是及时的，需要客户端再减去当前的下注金额
     * @param betPoint
     */
    resetSelfMoney(betPoint?: string) {
        if (betPoint !== undefined) {
            let selfPlayer = this.playerMgr.me;
            if (selfPlayer && selfPlayer.balance !== undefined) {
                selfPlayer.balance = util.sub(selfPlayer.balance, betPoint).toNumber();
                selfPlayer.updateBalance();
            }
        }
    }

    /**
     * 点击下注区
     * @param ev
     * @param idx
     */
    onClickArea(ev: cc.Event.EventTouch, idx: string) {
        // 排除自己是庄家的情况
        let player = this.playerMgr.getPlayerByServerPos(this._currBankerPos);
        if (player && player.isMe) {
            return;
        }
        if (this._currBankerPos && this.gameState === GameStatus.Betting) {
            let player = this.playerMgr.me;
            if (player.balance > +this._currBetPoint) {
                let areaTotalPoint = 0;
                this._totalBetMoneyArr.forEach(money => {
                    areaTotalPoint = util.add(areaTotalPoint, money).toNumber();
                });
                let currTotalPoint = util.add(areaTotalPoint, this._currBetPoint).toNumber();
                currTotalPoint = util.mul(currTotalPoint, this.MAX_MULTIPLE).toNumber();

                let minPayMoney = this.getBankerPayMoney();
                if (currTotalPoint < minPayMoney) {
                    // 自己下注的区域总金额不能大于自己最大赔付率
                    let selfTotalAreaMoney = 0;
                    this._selfBetMoneyArr.forEach(money => {
                        selfTotalAreaMoney = util.add(selfTotalAreaMoney, money).toNumber();
                    });

                    let currSelfPoint = util.add(selfTotalAreaMoney, this._currBetPoint);
                    let maxBetPoint = util.mul(currSelfPoint, this.MAX_MULTIPLE).toNumber();

                    if (maxBetPoint <= this._beforeBettingMoney) {
                        //下注区域闪烁
                        this.areaLightArr[+idx].active = false;
                        this.scheduleOnce(() => {
                            this.areaLightArr[+idx].active = true;
                        }, 0.05);

                        this.msg.sendDoBet(+idx + 1, this._currBetPoint);
                        this.flyCoin(+idx + 1, this._currBetPoint, player.getPlayerPos());
                        this.audioMgr.playDoBeting();
                    } else {
                        util.showTip("不能下注了，您的余额已经不足最大赔率咯~~");
                    }
                    this.setAllowBet();
                } else {
                    util.showTip("不能下注了，超过本局游戏最大押注值咯~~");
                }
            } else {
                console.warn("钱不够了");
            }
        }
    }

    // 不能大于 (庄家自己的本钱和最大赔付值的最小值)
    private getBankerPayMoney() {
        let bankInfo: any;
        if (this._currBankerPos === -1) {
            bankInfo = this._sysBankInfo;
        } else {
            bankInfo = this.playerMgr.getInfoByPos(this._currBankerPos);
        }
        let bankerMoney = this.MAX_BANKER_PAY_POINT;
        if (bankInfo) {
            bankerMoney = bankInfo.money;
        }
        let minPayMoney = (bankerMoney > this.MAX_BANKER_PAY_POINT) ? this.MAX_BANKER_PAY_POINT : bankerMoney;
        return minPayMoney;
    }

    onClickBet(ev: cc.Event.EventTouch, idx: string) {
        let btnIdx = +idx;
        let btn = this._betBtnArr[btnIdx];
        if (btn.interactable && (this.gameState === GameStatus.Betting)) {
            this._currBetPoint = this.BET_POINT_LIST[btnIdx];
            this.setBetLight(btnIdx);
        }
    }

    onClickShowBanker() {
        let btnText = this.btnLabBanker.string;
        if (btnText === this.BANKER_DESC_WANT) {
            this.msg.sendBankList();
        } else if (btnText === this.BANKER_DESC_EXIT) {
            this.msg.sendExitBank();
            this.btnLabBanker.string = this.BANKER_DESC_WAIT;
        } else if (btnText === this.BANKER_DESC_WAIT) {
            util.showTip("此轮结束即可下庄噢~~");
        }
    }

    onClickDoBanker() {
        if (this._bankList.length >= this.MAX_BANKER_LIST) {
            util.showTip(`排队人数已达${this.MAX_BANKER_LIST}人上限，请稍后再来噢~~`);
        } else {
            let btnText = this.bLabDesc.string;
            if (btnText === this.BANKER_DESC_UP) {
                console.log("上庄");
                let player = this.playerMgr.me;
                if (player.balance >= this.MIN_BANKER_MONEY) {
                    this.msg.sendDoBank();
                } else {
                    util.showTip(`亲，金币不足不能上庄噢~~`);
                }
            } else if (btnText === this.BANKER_DESC_DOWN) {
                console.log("下庄");
                this.msg.sendExitBank();
                this.msg.sendBankList();
            }
        }
    }

    onClickOtherPlayer() {
        this._currPanel = PanelName.Other;
        this.panelOther.active = true;

        let people = this.playerMgr.getAllPlayerInfo().concat();
        if (!people || people.length === 0) return;
        people.sort((a, b) => {
            return b.totalBets - a.totalBets;
        })

        for (let idx = 0; idx < people.length; idx++) {
            let playInfo = people[idx];
            let item;
            if (idx < this.oSvContent.childrenCount - 1) {
                item = this.oSvContent.children[idx];
            } else {
                item = util.instantiate(this.oSvItem);
                this.oSvContent.addChild(item);
            }
            item.active = true;

            let bg = item.getComponent(cc.Sprite);
            let logo2 = item.getChildByName("logo2");
            let sort1 = logo2.getComponentInChildren(cc.Label);
            let logo3 = item.getChildByName("logo3");
            let sort2 = logo3.getComponentInChildren(cc.Label);
            let head = item.getChildByName("def1").getComponentInChildren(cc.Sprite);
            let loc = item.getChildByName("loc").getComponent(cc.Label);
            let money = item.getChildByName("bg").getComponentInChildren(cc.Label);
            let bet = item.getChildByName("bet").getComponent(cc.Label);
            let winNum = item.getChildByName("win").getComponent(cc.Label);
            let goldBg = item.getChildByName("bg").getComponent(cc.Sprite);
            if (idx < 8) {
                logo2.active = true;
                logo3.active = false;
                sort1.string = (idx + 1).toString();
            } else {
                logo2.active = false;
                logo3.active = true;
                sort2.string = (idx + 1).toString();
            }
            if (idx == 0) {
                bg.spriteFrame = this.sfBg[0];
                goldBg.spriteFrame = this.goldBg[0];
            } else {
                bg.spriteFrame = this.sfBg[1];
                goldBg.spriteFrame = this.goldBg[1];
            }

            head.spriteFrame = util.getAvatar((playInfo.gender === Gender.MALE), playInfo.avatar);
            loc.string = util.parseLocation(playInfo.location) ? util.parseLocation(playInfo.location) : "--";
            money.string = playInfo.money;
            if (playInfo.totalBets !== undefined && playInfo.winCount !== undefined) {
                bet.string = playInfo.totalBets.toString();
                winNum.string = playInfo.winCount.toString();
            } else {
                bet.string = "0";
                winNum.string = "0";
            }
        }

        if (people.length < this.oSvContent.childrenCount) {
            for (let idx = people.length; idx < this.oSvContent.childrenCount; idx++) {
                let item = this.oSvContent.children[idx];
                item.active = false;
            }
        }
    }

    onClickBill() {
        this.msg.sendGamerHistory();
    }

    onClickZoushi() {
        this.msg.sendGameHistory();
    }

    onClickGame() {
        this.panelEnd.active = false;
        this.animSuc.active = false;
        this.animFail.active = false;
    }

    /**
     * 取消下注
     */
    onClickCancel() {
        let player = this.playerMgr.me;
        player.balance = this._beforeBettingMoney;
        player.updateBalance();

        for (let idx = 0; idx < this._selfBetMoneyArr.length; idx++) {
            this._selfBetMoneyArr[idx] = 0;
        }
        this.hideSelfArea();
        this.setAllowBet();
        // this.setBtnCancelGray(true);

        this.msg.sendCancelBet();
        this.isGaming = false;
    }

    onClickClosePanel() {
        let currPanel: cc.Node;
        if (this.panelBanker.active) {
            currPanel = this.panelBanker;
        }
        if (this.panelOther.active) {
            currPanel = this.panelOther;
        }
        if (this.panelZST.active) {
            currPanel = this.panelZST;
        }
        if (this.panelBill.active) {
            currPanel = this.panelBill;
        }
        if (currPanel) {
            currPanel.runAction(cc.sequence(
                cc.fadeTo(0.3, 0),
                cc.callFunc(() => {
                    currPanel.opacity = 255;
                    currPanel.active = false;
                }),
            ));
        }
        this._currPanel = PanelName.Main;
    }

    /**
     * 上庄
     * @param bankerPos
     * @param bankerCount
     */
    setBankerUI(bankerPos: number, bankerCount: number) {
        this._currBankerPos = bankerPos;

        let bankInfo: any;
        if (bankerPos === -1) {
            bankInfo = this._sysBankInfo;
            this.labBankerCount.node.active = false;
        } else {
            bankInfo = this.playerMgr.getInfoByPos(bankerPos);
            this.setBankerCount(bankerCount);
        }

        if (bankInfo) {
            this.bankerHead.spriteFrame = util.getAvatar(bankInfo.gender === Gender.MALE, bankInfo.avatar);
            this.bankerName.string = util.parseLocation(bankInfo.location);
            if (bankerPos === -1) {
                this.bankerMoney.string = "Max";
            } else {
                this.bankerMoney.string = util.toCNMoney(bankInfo.money)
            }
            // 自己当庄的话要屏蔽所有按钮
            let player = this.playerMgr.getPlayerByServerPos(this._currBankerPos);
            if (player && player.isMe) {
                this.btnLabBanker.string = this.BANKER_DESC_EXIT;
                this.hideBet();
                // 关闭上庄界面
                this.onClickClosePanel();
                this.isGaming = true;
            } else {
                this.btnLabBanker.string = this.BANKER_DESC_WANT;
            }
        }
    }

    /**
     * 挑选自己可选择的筹码
     */
    setAllowBet() {
        if (this.playerMgr.me.balance === undefined)
            return;
        let player = this.playerMgr.getPlayerByServerPos(this._currBankerPos);
        if (player && player.isMe)
            return;

        // 自己当前所有下注额
        let selfTotalAreaMoney = 0;
        this._selfBetMoneyArr.forEach(money => {
            selfTotalAreaMoney = util.add(selfTotalAreaMoney, money).toNumber();
        });

        let money = this.playerMgr.me.balance;
        let onRowNum = 5;
        let allowNum = 0;
        let currChooseNum = 0;
        for (let idx = 0; idx < this._betBtnArr.length; idx++) {
            let btn = this._betBtnArr[idx];
            let btnScore = +this.BET_POINT_LIST[idx];

            let currSelfPoint = util.add(selfTotalAreaMoney, btnScore);
            let maxBetPoint = util.mul(currSelfPoint, this.MAX_MULTIPLE).toNumber();

            if (money >= btnScore * this.MAX_MULTIPLE && maxBetPoint <= this._beforeBettingMoney) {
                btn.node.opacity = 255;
                btn.interactable = true;
                allowNum += 1;

                if (this._currBetPoint && (this._currBetPoint === this.BET_POINT_LIST[idx])) {
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
            let maxBetVal = this.BET_POINT_LIST[allowNum - 1];
            this._currBetPoint = maxBetVal;

            this.setBetLight(allowNum - 1);
        } else {
            this.setBetLight(-1);
        }
    }

    /**
     * 设置该区域所有的筹码
     */
    setTotalAreaMoney(pos: number, bet: string, showDefaultBet = false) {
        if (!this._totalBetMoneyArr) {
            return;
        }
        if (pos > this._totalBetMoneyArr.length)
            return
        if (!+bet) {
            return;
        }
        let areaIdx = pos - 1;
        this._totalBetMoneyArr[areaIdx] = util.add(this._totalBetMoneyArr[areaIdx], bet).toNumber();
        this.areaAllMoneyArr[areaIdx].string = this._totalBetMoneyArr[areaIdx].toString();

        if (showDefaultBet) {
            let betNum = Math.floor(+bet / 10);
            betNum = (betNum < 2) ? 2 : betNum;
            betNum = (betNum > 25) ? 25 : betNum;
            let box = this.nodeChooseArea.getChildByName(areaIdx.toString());
            for (let index = 0; index < betNum; index++) {
                let endX = box.x + cc.randomMinus1To1() * box.width * 0.38;
                let endY = box.y + cc.randomMinus1To1() * box.height * 0.24;
                let coin = this.getBetCoin();
                coin.setPosition(endX, endY);
                coin.name = areaIdx.toString();
            }
        }
    }

    /**
     * 设置该区域自己的筹码
     */
    setSelfAreaMoney(pos: number, bet?: string) {
        if (pos > this._totalBetMoneyArr.length)
            return;
        if (!+bet) {
            return;
        }
        let areaIdx = pos - 1;
        this._selfBetMoneyArr[areaIdx] = util.add(this._selfBetMoneyArr[areaIdx], bet).toNumber();
        let labArea = this.areaSelfMoneyArr[areaIdx];
        labArea.node.active = true;
        labArea.string = this._selfBetMoneyArr[areaIdx].toString();
        this.areaSelfMoneyBgArr[areaIdx].active = true;
        this.isGaming = true;
    }

    /**
     * 设置筹码按钮选中效果
     * @param betIdx
     */
    setBetLight(betIdx: number) {
        for (let idx = 0; idx < this._betLightArr.length; idx++) {
            let sprite = this._betLightArr[idx];
            if (idx === betIdx) {
                sprite.active = true;
                this._betBtnArr[idx].node.setPositionY(8);
            } else {
                sprite.active = false;
                this._betBtnArr[idx].node.setPositionY(0);
            }
        }
    }

    /**
     * 设置坐庄轮数
     * @param count
     */
    setBankerCount(count?: number) {
        this.labBankerCount.node.active = true;
        if (count === undefined) {
            let desc = this.labBankerCount.string;
            count = +desc.substring(desc.length - 1);
            count += 1;
        }
        this.labBankerCount.string = `连庄 X ${count}`;
    }

    /**
     * 取消下注
     * @param userPos
     * @param gameChgInfo
     */
    setCleanGamerInfo(userPos: number, gameChgInfo: BrnnBullHandle[]) {
        let player = this.playerMgr.getPlayerByServerPos(userPos);
        gameChgInfo.forEach((areaInfo) => {
            let areaIdx = areaInfo.areaPos - 1;
            this._totalBetMoneyArr[areaIdx] = +areaInfo.betPoint;
            this.areaAllMoneyArr[areaIdx].string = this._totalBetMoneyArr[areaIdx].toString();

            // 金币变化
            let areaTotalMoney = this._totalBetMoneyArr[areaIdx];
            let coinArr: cc.Node[] = [];
            this.nodeCoin.children.forEach((coin) => {
                if (coin.name === areaIdx.toString()) {
                    coinArr.push(coin);
                }
            });

            // 该区域若自己下注则清空该区域金币，否则清空一半
            let removeNum = coinArr.length;
            if (areaTotalMoney !== 0) {
                removeNum = coinArr.length * 0.5;
            }
            for (let idx = 0; idx < coinArr.length; idx++) {
                let coin = coinArr[idx];
                if (idx < removeNum) {
                    this.recoverCoin(coin);
                }
            }
        });
    }

    /**
     * 设置胜利区域的特效
     * @param areaIdx
     */
    setWinAreaEff(areaIdx: number) {
        let area = this.areaWinArr[areaIdx];
        area.active = true;
        area.stopAllActions();

        let binkTime = 0.3;
        area.runAction(cc.repeatForever(cc.sequence(
            cc.fadeTo(binkTime, 255),
            cc.fadeTo(binkTime, 0),
            cc.fadeTo(binkTime, 255),
        )));
    }

    setTimer(time: number) {
        let totalTime = time;
        let clockTime = 6;
        if (this.labBetTime) {
            this.labBetTime.string = `${Math.floor(totalTime)}`;
            let parNode = this.animClock.parent.parent;
            let self = this;
            this.schedule(function countDown(dt: number) {
                totalTime -= dt;
                if (totalTime < 1) {
                    // self.audioMgr.playStopBet();
                    self.labBetTime.string = "0";
                    self.unschedule(countDown);

                    self.showAction(parNode, false, () => {
                        self.betTimePanel.active = false;
                    });
                    return;
                }
                if (self.gameState === GameStatus.Betting) {
                    if (totalTime <= clockTime) {
                        self.audioMgr.playClock();
                        self.animClock.stopAllActions();
                        self.animClock.scale = 1;
                        self.animClock.opacity = 255;
                        let actionTime = 0.5;
                        self.animClock.runAction(cc.spawn(cc.scaleTo(actionTime, 2), cc.fadeTo(actionTime, 0)));
                    }
                }
                self.labBetTime.string = `${Math.floor(totalTime)}`;
            }, 0.95);
            this.showAction(parNode, true);
        }
    }

    private showAction(node: cc.Node, show: boolean, callFunc?: Function) {
        callFunc = callFunc || function () { };
        if (show) {
            node.stopAllActions();
            node.scale = 0;
            node.y = this.betTimePanelPosY - 45;
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
                    node.y = this.betTimePanelPosY + 45;
                    callFunc();
                })
            ));
        }
    }

    /**
     * 隐藏所有面板
     */
    hideAllPanel() {
        this.betTimePanel.active = false;
        this.nodeRest.active = false;
        this.panelTempShow.active = false;

        this.panelEnd.active = false;
        this.animSuc.active = false;
        this.animFail.active = false;

        this.areaLightArr.forEach(light => {
            light.active = false;
        });
        this.areaWinArr.forEach(area => {
            area.stopAllActions();
            area.active = false;
        });
        this.nnTypeBgArr.forEach(node => {
            node.active = false;
        });
        this.nnTypeArr.forEach(sprite => {
            sprite.node.active = false;
        });
        this.nnBoostArr.forEach(lab => {
            lab.node.active = false;
        });
        this.finalScoreArr.forEach(lab => {
            lab.node.active = false;
        });
        // this.setBtnCancelGray(true);
    }

    // setBtnCancelGray(isGray: boolean) {
    //     this.btnCancel.interactable = !isGray;
    //     util.setGray(this.btnCancel, isGray);
    //     let lab = this.btnCancel.getComponentInChildren(cc.LabelOutline);
    //     lab.color = isGray ? cc.hexToColor("#7B7E86") : cc.hexToColor("#225C24");
    // }

    /**
     * 隐藏自己所下注区域
     */
    hideSelfArea() {
        this.areaSelfMoneyArr.forEach(lab => {
            lab.node.active = false;
        });
        this.areaSelfMoneyBgArr.forEach(bg => {
            bg.active = false;
        });
    }

    /**
     * 隐藏所有筹码按钮
     */
    hideBet() {
        for (let idx = 0; idx < this._betBtnArr.length; idx++) {
            let btn = this._betBtnArr[idx];
            btn.node.opacity = 150;
            btn.interactable = false;
        }
        this.setBetLight(-1);
    }

    /**
     * 飞牌动作
     * @param areaInfos
     */
    async flySendCard(areaInfos: BrnnBullHandle[]) {
        this.audioMgr.playStartSound();
        await this.playAnim(this.preAnimSend);

        this._gameAreaInfo = areaInfos;
        let sendBox = this.nodeFlyPos.getChildByName("sendCard");
        this._gameAreaInfo.sort((a, b) => { return a.areaPos - b.areaPos });
        //先发庄家牌
        await this.cardFlyAnim(this._gameAreaInfo[this._gameAreaInfo.length - 1], sendBox.getPosition());
        //再发四家
        for (let idx = 0; idx < this._gameAreaInfo.length - 1; idx++) {
            let areaInfo = this._gameAreaInfo[idx];
            this.audioMgr.playSendCard();
            await this.cardFlyAnim(areaInfo, sendBox.getPosition());
        }

        //by wangdong 一起翻开
        for (let idx = 0; idx < this._gameAreaInfo.length; idx++) {
            let areaInfo = this._gameAreaInfo[idx];
            this.turn4Cards(areaInfo);
        }

        await this.delay(1);

        //庄家开牌
        await this.turn5Cards(this._gameAreaInfo[this._gameAreaInfo.length - 1]);
        //四家开牌
        for (let idx = 0; idx < this._gameAreaInfo.length - 1; idx++) {
            let areaInfo = this._gameAreaInfo[idx];
            this.audioMgr.playSendCard();
            await this.turn5Cards(areaInfo);
        }

        // 展示胜利区域
        for (let idx1 = 0; idx1 < this._gameAreaInfo.length - 1; idx1++) {
            let areaInfo = this._gameAreaInfo[idx1];
            if (areaInfo.areaPos < Area.BANKER && !!areaInfo.isWin) {
                this.setWinAreaEff(areaInfo.areaPos - 1);
            }
        }
    }

    showAllCards(areaInfos: BrnnBullHandle[]) {
        this._gameAreaInfo = areaInfos;
        for (let idx = 0; idx < this._gameAreaInfo.length; idx++) {
            let areaInfo = this._gameAreaInfo[idx];

            let cardBox = this.nodeFlyPos.getChildByName(`card${areaInfo.areaPos - 1}`);
            areaInfo.cardRunes.forEach((cardInfo, idx) => {
                let card = this.genCardByVal(cardInfo.rune, cardInfo.pretendRune);
                let node = card.node;
                this.nodeCard.addChild(node);
                node.setPosition(cc.v2(cardBox.x + idx * 22, cardBox.y));
                card.turn(true, true, this.CARD_SCALE);
            });
            this.cardNNType(areaInfo, 0.2);

            if (areaInfo.areaPos < Area.BANKER && !!areaInfo.isWin) {
                this.setWinAreaEff(areaInfo.areaPos - 1);
            }
        }
    }

    private cardFlyAnim(areaInfo: BrnnBullHandle, beginPos: cc.Vec2) {
        return new Promise(resolve => {
            this.cardStacks[areaInfo.areaPos - 1] = [];
            areaInfo.cardRunes.forEach((cardInfo, idx) => {
                let card = this.genCardByVal(cardInfo.rune, cardInfo.pretendRune);
                let node = card.node;
                this.nodeCard.addChild(node);
                node.setPosition(beginPos.x, beginPos.y);
                card.turn(false, false, this.CARD_SCALE);
                node.scale = 0;
                this.cardStacks[areaInfo.areaPos - 1][idx] = card;
            });

            let cardBox = this.nodeFlyPos.getChildByName(`card${areaInfo.areaPos - 1}`);
            for (let cardIdx1 = 0; cardIdx1 < 5; cardIdx1++) {
                let card = this.cardStacks[areaInfo.areaPos - 1][cardIdx1];
                let nodeCard = card.node;

                let moveTime = 0.3;
                nodeCard.runAction(cc.sequence(
                    cc.delayTime(cardIdx1 * 0.05),
                    cc.spawn(
                        cc.scaleTo(moveTime, this.CARD_SCALE, this.CARD_SCALE),
                        Parabola.move(moveTime, nodeCard.position, cc.v2(cardBox.x + cardIdx1 * 22, cardBox.y))
                    ),
                    //翻牌
                    cc.callFunc(() => {
                        //发第1张牌时，开始发下一个堆
                        if (cardIdx1 === 0) {
                            resolve(true);
                        }
                    }),
                ));
            }
        });
    }

    //by wangdong
    private turn4Cards(areaInfo: BrnnBullHandle) {
        // return new Promise(resolve => {
        //let cardBox = this.nodeFlyPos.getChildByName(`card${areaInfo.areaPos - 1}`);
        for (let cardIdx1 = 0; cardIdx1 < this.cardStacks[areaInfo.areaPos - 1].length; cardIdx1++) {
            let card = this.cardStacks[areaInfo.areaPos - 1][cardIdx1];
            let nodeCard = card.node;

            let moveTime = 0.2;
            nodeCard.runAction(cc.sequence(
                cc.delayTime(cardIdx1 * 0.05),
                //翻牌
                cc.callFunc(() => {
                    if (cardIdx1 == 3) {
                        card.turn(false, false, this.CARD_SCALE);
                    } else {
                        card.turn(true, true, this.CARD_SCALE);
                    }
                }),
                //cc.delayTime(0.5),
                cc.callFunc(() => {
                    if (cardIdx1 === this.cardStacks[areaInfo.areaPos - 1].length - 1) {
                        // resolve(true);
                    }
                }),
            ));
        }
        // });
    }
    private delay(d: number) {
        return new Promise(resolve => {
            this.scheduleOnce(() => {
                resolve(true);
            }, d);
        });
    }
    private turn5Cards(areaInfo: BrnnBullHandle) {
        return new Promise(resolve => {
            //中心坐标和每张牌原始坐标存下来
            let centerX = this.cardStacks[areaInfo.areaPos - 1][2].node.x;
            let oriXArr = [];
            for (let cardIdx1 = 0; cardIdx1 < this.cardStacks[areaInfo.areaPos - 1].length; cardIdx1++) {
                oriXArr.push(this.cardStacks[areaInfo.areaPos - 1][cardIdx1].node.x);
            }
            for (let cardIdx1 = 0; cardIdx1 < this.cardStacks[areaInfo.areaPos - 1].length; cardIdx1++) {
                let card = this.cardStacks[areaInfo.areaPos - 1][cardIdx1];
                let nodeCard = card.node;

                let moveTime = 0.2;
                nodeCard.runAction(cc.sequence(
                    cc.moveTo(moveTime, new cc.Vec2(centerX, nodeCard.y)),
                    cc.callFunc(() => {
                        if (cardIdx1 == 3) {
                            card.turn(true, false, this.CARD_SCALE);
                        }
                    }),
                    cc.moveTo(moveTime, new cc.Vec2(oriXArr[cardIdx1], nodeCard.y)),
                    cc.callFunc(() => {
                        if (cardIdx1 === this.cardStacks[areaInfo.areaPos - 1].length - 1) {
                            this.cardNNType(areaInfo, 0.5);
                            resolve(true);
                        }
                    }),
                ));
            }
        });
    }

    /**
     * 展示牌类型和自己的输赢
     * @param areaInfo
     * @param animTime
     */
    private cardNNType(areaInfo: BrnnBullHandle, animTime: number) {
        // 用庄家的声音
        let playInfo;
        if (this._currBankerPos === -1) {
            playInfo = this._sysBankInfo;
        } else {
            playInfo = this.playerMgr.getInfoByPos(this._currBankerPos);
        }
        if (playInfo) {
            if (areaInfo.type === BullType.BullBoom) {
                this.audioMgr.playBullBoom(playInfo.gender === Gender.MALE);
            } else if (areaInfo.type === BullType.BullMarble) {
                this.audioMgr.playBullMarbled(playInfo.gender === Gender.MALE);
            } else if (areaInfo.type === BullType.BullSmall) {
                this.audioMgr.playBullSmall(playInfo.gender === Gender.MALE);
            } else {
                this.audioMgr.playBull(playInfo.gender === Gender.MALE, areaInfo.type);
            }
        }

        let areaIdx = areaInfo.areaPos - 1;
        let nnTypeBgNode = this.nnTypeBgArr[areaIdx];
        let nnTypeBgSprite = nnTypeBgNode.getComponent(cc.Sprite);
        if (areaInfo.type > 0) {
            nnTypeBgSprite.spriteFrame = this.spriteBgBullType[0];
        } else {
            nnTypeBgSprite.spriteFrame = this.spriteBgBullType[1];
        }
        nnTypeBgNode.active = true;
        let nnType = this.nnTypeArr[areaIdx];
        nnType.node.active = true;
        nnType.spriteFrame = this.sfBullType[areaInfo.type];
        nnType.node.stopAllActions();
        nnType.node.scale = 0;
        nnType.node.runAction(cc.scaleTo(animTime, 1, 1).easing(cc.easeBounceOut()));

        // if (!areaInfo.isWin && areaInfo.areaPos < Area.BANKER) {
        //     this.nnTypeBtnArr[areaIdx].interactable = false;
        // } else {
        //     this.nnTypeBtnArr[areaIdx].interactable = true;
        // }

        if (areaInfo.areaPos < Area.BANKER) {
            let lab_score = this.finalScoreArr[areaIdx];
            lab_score.node.active = true;
            lab_score.string = "";
            let lab_boost = this.nnBoostArr[areaIdx];
            lab_boost.node.active = true;
            let noBetSprite = this.finalNoBetSprite[areaIdx]
            noBetSprite.node.active = false;
            let selfBet = +this._selfBetMoneyArr[areaIdx];
            //下注了的文字
            if (selfBet > 0) {
                // lab_score.fontSize = 25;
                if (areaInfo.isWin > 0) {
                    lab_score.font = this.fontScoreArr[0];
                    lab_boost.font = this.fontScoreArr[0];
                } else {
                    selfBet = -selfBet;
                    lab_score.font = this.fontScoreArr[1];
                    lab_boost.font = this.fontScoreArr[1];
                }
                lab_boost.string = "x" + areaInfo.boost;
                let score = util.mul(selfBet, areaInfo.boost);
                if (areaInfo.isWin > 0) {
                    lab_score.string = "+" + score;
                } else {
                    lab_score.string = score.toString();
                }
            }
            //没下注的文字
            else {
                // lab_score.font = null;
                // lab_score.fontSize = 18;
                // lab_score.string = "未下注";
                lab_score.node.active = false;
                lab_boost.node.active = false;
                noBetSprite.node.active = true;
            }
            // lab_score.node.stopAllActions();

            // if (areaInfo.boost) {
            //     lab_boost.string = `x${areaInfo.boost}`;
            // } else {
            //     lab_boost.string = "";
            // }
            // lab_boost.node.stopAllActions();
        }
    }

    /**
     * 结算动画
     */
    async showStatisticsAnim(showUserInfo: UserPersonInfo[]) {
        let flyTime = 0.35;
        let winAnimTime = 0.4;                  // 赢家动作总时间
        let failAnimTime = 0.4;                 // 输家动作总时间
        let delayTime = 1.0;                    // 飞向庄家和庄家飞向玩家之间的间隔时间
        let flyPlayerTime = 0.3;                // 最后飞向赢钱玩家的时间

        // 先播各区域与庄家之间的输赢动画
        let bankerPos = this.nodeFlyPos.getChildByName("sendCard");
        let otherPos = this.nodeFlyPos.getChildByName("otherCard");

        let sucPromiseArr: Promise<{}>[] = [];
        let failPromiseArr: Promise<{}>[] = [];
        for (let idx = 0; idx < this._gameAreaInfo.length; idx++) {
            let areaInfo = this._gameAreaInfo[idx];
            let areaIdx = areaInfo.areaPos - 1;
            if (areaInfo.areaPos < Area.BANKER) {
                let currAreaMoney = this._totalBetMoneyArr[areaIdx];
                // 没人投掷的区域不播放动画
                if (currAreaMoney < +this.BET_POINT_LIST[0]) {
                    continue;
                }

                if (areaInfo.isWin > 0) {
                    // 庄家输的区域，金币从庄家位置飞向这些区域
                    let box = this.nodeChooseArea.getChildByName(areaIdx.toString());
                    let minFlyCoinNum = util.mul(currAreaMoney.toString().substring(0, 1), 5).toNumber();
                    // let coinNum = minFlyCoinNum * areaInfo.boost;
                    //固定写死数量
                    let coinNum = 25;
                    for (let idx1 = 0; idx1 < coinNum; idx1++) {
                        let pro = new Promise(resolve => {
                            let coin = this.getBetCoin();
                            coin.name = areaIdx.toString();
                            coin.setPosition(bankerPos.getPosition());

                            let endX = box.x + cc.randomMinus1To1() * box.width * 0.38;
                            let endY = box.y + cc.randomMinus1To1() * box.height * 0.24;
                            coin.opacity = 0;

                            let delay = delayTime + (winAnimTime / coinNum) * idx1;
                            coin.runAction(cc.sequence(
                                cc.delayTime(delay),
                                cc.spawn(
                                    Parabola.move(flyTime, coin.position, cc.v2(endX, endY), 0, 0),
                                    cc.fadeTo(flyTime, 255)),
                                cc.callFunc(function () {
                                    resolve(true);
                                }),
                            ));
                        });
                        sucPromiseArr.push(pro);
                    }
                } else {
                    // 庄家赢的区域，金币从这些区域飞向庄家位置
                    let coinArr: cc.Node[] = [];
                    this.nodeCoin.children.forEach(coin => {
                        if (coin.name === areaIdx.toString()) {
                            coinArr.push(coin);
                        }
                    });
                    coinArr.sort((a, b) => { return a.getLocalZOrder() - b.getLocalZOrder(); });

                    for (let coinIdx = 0; coinIdx < coinArr.length; coinIdx++) {
                        let pro = new Promise(resolve => {
                            let coin = coinArr[coinIdx];
                            let delay = (failAnimTime / coinArr.length) * coinIdx;
                            coin.runAction(cc.sequence(
                                cc.delayTime(delay),
                                cc.spawn(
                                    cc.fadeTo(flyTime, 100),
                                    cc.moveTo(flyTime, bankerPos.getPosition())
                                ),
                                cc.callFunc(() => {
                                    this.recoverCoin(coin);
                                    resolve(true);
                                }),
                            ));
                        });
                        failPromiseArr.push(pro);
                    }
                }
            }
        }

        if (failPromiseArr.length > 0) {
            this.audioMgr.playCoins();
            await Promise.all(failPromiseArr);
        }
        if (sucPromiseArr.length > 0) {
            if (failPromiseArr.length < 1) {
                this.audioMgr.playCoins();
            }
            await Promise.all(sucPromiseArr);
        }

        //----------------------------赢钱区域的金币飞向投掷了该区域的玩家
        let flyPromiseArr: Promise<{}>[] = [];
        // 按赢钱区域来存储玩家
        let winPlayersAtArea: { [area: number]: BrnnPlayer[] } = {};
        showUserInfo.forEach(info => {
            let player = this.playerMgr.getPlayerByServerPos(info.userPos);
            if (player) {
                if (info.winAreaPos && +info.chgGold >= 0) {
                    info.winAreaPos.forEach(winArea => {
                        if (winPlayersAtArea[winArea] === undefined) {
                            winPlayersAtArea[winArea] = [];
                        }
                        winPlayersAtArea[winArea].push(player);
                    });
                }
            }
        });

        // 玩家数超过桌子上所有玩家时才显示飞向其他玩家
        let isFull = this.playerMgr.isPlayerFull();
        // 从区域飞向赢钱的桌上玩家和其他玩家
        for (let areaPos = Area.EAST; areaPos < Area.BANKER; areaPos++) {
            let areaIdx = areaPos - 1;
            // 把该区域的金币加起来
            let coinArr: cc.Node[] = [];
            this.nodeCoin.children.forEach(coin => {
                if (coin.name === areaIdx.toString()) {
                    coinArr.push(coin);
                }
            });
            coinArr.sort((a, b) => { return a.getLocalZOrder() - b.getLocalZOrder(); });
            // 赢钱区域的金币分别飞向桌上玩家和其他玩家
            let currCoinNum = 0;
            let winPlayers = winPlayersAtArea[areaPos];
            if (winPlayers) {
                let flyNum;
                if (isFull) {
                    flyNum = Math.floor(coinArr.length / (winPlayers.length + 1));
                } else {
                    flyNum = Math.floor(coinArr.length / winPlayers.length);
                }
                winPlayers.forEach((player, playIdx) => {
                    let playerPos = player.getPlayerPos();
                    let flyNum = Math.floor(coinArr.length / (winPlayers.length + 1));
                    for (let idx = 0; idx < flyNum; idx++) {
                        let coinIdx = idx + currCoinNum;
                        let coin = coinArr[coinIdx];
                        let pro = this.flyCoinWinPlayer(coin, playerPos, flyTime, (flyPlayerTime / flyNum * idx));
                        flyPromiseArr.push(pro);
                    }
                    currCoinNum += flyNum;


                    if (!isFull && (playIdx === (winPlayers.length - 1))) {
                        for (let coinIdx = currCoinNum; coinIdx < coinArr.length; coinIdx++) {
                            let animIdx = coinIdx - currCoinNum;
                            let coin = coinArr[coinIdx];
                            this.flyCoinWinPlayer(coin, playerPos, flyTime, (flyPlayerTime / (coinArr.length - currCoinNum) * animIdx));
                        }
                    }
                    //赢家动画，会有重复的，因为一个人可能赢几堆
                    this.playWinAnim(player);
                });
            }
            if (isFull) {
                for (let coinIdx = currCoinNum; coinIdx < coinArr.length; coinIdx++) {
                    let animIdx = coinIdx - currCoinNum;
                    let coin = coinArr[coinIdx];
                    let pro = this.flyCoinWinPlayer(coin, otherPos.getPosition(), flyTime, (flyPlayerTime / (coinArr.length - currCoinNum) * animIdx));
                    //赢家动画
                    //this.playWinAnim(player);
                    flyPromiseArr.push(pro);
                }
            }
        }

        if (flyPromiseArr.length > 0) {
            this.audioMgr.playCoins();
            await Promise.all(flyPromiseArr);
        }

        //--------------------------------展示最终得分
        let finalScore = { score: "0", tax: "0" };
        showUserInfo.forEach(info => {
            if (info.userPos === this._currBankerPos) {
                if (this._currBankerPos === -1) {
                    this.bankerMoney.string = "Max";
                } else {
                    this.bankerMoney.string = util.toCNMoney(info.totalGold);
                }
                // 上庄界面及时更新庄家钱
            }
            // 更新玩家信息
            let player = this.playerMgr.getPlayerByServerPos(info.userPos);
            if (player) {
                if (player.isMe) {
                    finalScore.score = info.chgGold;
                    finalScore.tax = info.tax;
                }
                player.balance = util.add(info.totalGold, 0).toNumber();
                player.updateBalance();
                this.playerMgr.updatePlayerInfo(info.userPos, info.totalGold);

                // 输赢飘字
                let money = +info.chgGold;
                let winMoney: string;
                let loseMoney: string;
                if (money > 0) {
                    winMoney = `+${info.chgGold}`;
                } else if (money < 0) {
                    loseMoney = info.chgGold;
                }
                if (+info.chgGold !== 0) {
                    player.showGetAndLost({ get: winMoney, lost: loseMoney });
                }
            }
            // 同步下注额、连胜次数
            this.playerMgr.updatePlayerInfo(info.userPos, info.totalGold);
            this.playerMgr.updateTotalBets(info.userPos, info.totalBets, info.winCount);
        });

        // 自己下注了才展示结算（非庄家情况）
        let selfBetPoint = 0;
        let player = this.playerMgr.getPlayerByServerPos(this._currBankerPos);
        if (player && player.isMe) {
            selfBetPoint = 1;
        } else {
            this._selfBetMoneyArr.forEach(info => {
                selfBetPoint += info;
            });
        }
        if (selfBetPoint !== 0) {
            this.panelEnd.active = true;
            this.labEndSuc.node.active = true;
            this.nodeEndBg.scale = 0;
            if (+finalScore.score >= 0) {
                this.audioMgr.playWin();
                this.animSuc.getComponent(cc.Animation).setCurrentTime(0);
                this.playRepeatAnim(this.animSuc);
                this.labEndSuc.font = this.fontScoreArr[0];
                this.labEndSuc.string = `+${finalScore.score}`;
                this.labEndFail.node.active = false;
                this.labEndFail.string = `税-${finalScore.tax}`;
            } else {
                this.audioMgr.playLose();
                this.animFail.getComponent(cc.Animation).setCurrentTime(0);
                this.playRepeatAnim(this.animFail);
                this.labEndSuc.font = this.fontScoreArr[1];
                this.labEndSuc.string = finalScore.score;
                this.labEndFail.node.active = false;
            }
            this.nodeEndBg.runAction(cc.sequence(
                cc.delayTime(0),
                cc.scaleTo(0.2, 1, 1).easing(cc.easeBounceOut()),
            ));
        }

        // 清空显示金额‘
        for (let idx = 1; idx < Area.BANKER; idx++) {
            let areaIdx = idx - 1;
            this.areaAllMoneyArr[areaIdx].string = "0";
        }

        this.playerMgr.updateTablePlayer();
        if (this.panelOther.active) {
            this.onClickOtherPlayer();
        }
    }

    private flyCoinWinPlayer(coin: cc.Node, endPos: cc.Vec2, flyTime: number, delayTime: number) {
        return new Promise(resolve => {
            coin.opacity = 255;
            coin.runAction(cc.sequence(
                cc.delayTime(delayTime),
                cc.spawn(
                    cc.fadeTo(flyTime, 200),
                    Parabola.move(flyTime, coin.getPosition(), endPos, cc.random0To1() * 50)
                ),
                cc.callFunc(() => {
                    this.recoverCoin(coin);
                    resolve(true);
                }),
            ));
        });
    }

    /**
     * 下注播放飞金币动作
     * @param pos
     * @param point 下注数量
     * @param beginPos
     */
    flyCoin(pos: number, point: string, beginPos?: cc.Vec2) {
        if (this.canPlayCoinAudio) {
            this.audioMgr.playCoin();
            this.canPlayCoinAudio = false;
            this.scheduleOnce(() => {
                this.canPlayCoinAudio = true;
            }, this.coinAudioInterval);
        }

        let coinNum = 1;
        if (this.BET_POINT_LIST) {
            for (let i = 0; i < this.BET_POINT_LIST.length; i++) {
                if (+point <= +this.BET_POINT_LIST[i]) {
                    coinNum = i + 1;
                    break;
                }
            }
        }

        let areaIdx = pos - 1;
        let box = this.nodeChooseArea.getChildByName(areaIdx.toString());
        let beginX: number;
        let beginY: number;
        if (beginPos) {
            beginX = beginPos.x;
            beginY = beginPos.y;
        } else {
            let otherPos = this.nodeFlyPos.getChildByName("otherCard");
            beginX = otherPos.x;
            beginY = otherPos.y;
            //适当减少其他玩家下注的金币数量
            coinNum = 1 + Math.floor(coinNum / 3);
        }

        let width = box.width;
        let height = box.height;
        if (beginX !== undefined && beginY !== undefined) {
            for (let index = 0; index < coinNum; index++) {
                let coin = this.getBetCoin();
                if (!coin) {
                    return;
                }
                coin.name = areaIdx.toString();
                coin.opacity = 100;

                let endX = box.x + cc.randomMinus1To1() * width * 0.38;
                let endY = box.y + cc.randomMinus1To1() * height * 0.24;
                let endRotation = cc.randomMinus1To1() * 30;

                coin.setPosition(beginX, beginY);
                let moveTime = 0.3;
                coin.runAction(cc.sequence(
                    cc.delayTime(0.02 * index),
                    cc.spawn(cc.moveTo(moveTime, endX, endY).easing(cc.easeSineOut()), cc.rotateTo(moveTime, endRotation), cc.fadeTo(moveTime, 255))
                ));
            }

            // 区域金币过多时回收
            let children = this.nodeCoin.children;
            let areaCoins = [];
            for (let idx = 0; idx < children.length; idx++) {
                const coin = children[idx];
                if (+coin.name === areaIdx) {
                    areaCoins.push(coin);
                }
            }
            if (areaCoins.length > this.maxAreaCount) {
                let recycleCount = Math.floor(areaCoins.length * 0.3);
                for (let idx = 0; idx < areaCoins.length; idx++) {
                    if (idx < recycleCount) {
                        const coin = areaCoins[idx];
                        coin.runAction(cc.sequence(
                            cc.fadeTo(0.3, 0),
                            cc.callFunc(() => {
                                this.recoverCoin(coin);
                            })
                        ))
                    } else {
                        break;
                    }
                }
            }
        }
    }

    /**
     * 金币池
     */
    private getBetCoin(): cc.Node {
        let coin: cc.Node;
        if (this._coinPool.size() > 0) {
            coin = this._coinPool.get();
        } else {
            coin = util.instantiate(this.preCoin);
        }
        this.nodeCoin.addChild(coin);
        return coin;
    }
    private recoverCoin(coin: cc.Node) {
        coin.removeFromParent(true);
        coin.opacity = 255;
        coin.name = "";
        this._coinPool.put(coin);
    }

    recoverAllCoins() {
        let coins = this.nodeCoin.children;
        for (let index = 0; index < coins.length; index++) {
            let coin = coins[index];
            this.recoverCoin(coin);
        }
        if (this.nodeCoin.children.length > 0) {
            this.recoverAllCoins();
        }
    }

    // --------------------------动画
    async playWinAnim(player: BrnnPlayer) {
        let anim = <cc.Node>util.instantiate(this.preAnimWin);
        this.nodeAnimation.addChild(anim);
        anim.setPosition(player.convertToNodePos(this.nodeAnimation));

        let nodeParticle = util.instantiate(this.preParticle);
        anim.addChild(nodeParticle);
        await this.playRepeatAnim(anim, false);

        anim.removeAllChildren();
        anim.removeFromParent();
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
    }


}
