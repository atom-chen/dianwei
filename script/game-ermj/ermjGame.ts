import Game, { GameId } from "../game-share/game";
import ErmjResult from "./ermjResult";
import ErmjTimer from "./ermjTimer";
import ErmjPlayerMgr from "./ermjPlayerMgr";
import ErmjMsg from "./ermjMsg";
import ErmjPromptOpt from "./ermjPromptOpt";
import ErmjChooseGang from "./ermjChooseGang";
import ErmjAudio from "./ermjAudio";
import * as ErmjType from "./ermj";
import MahjongRes from "../game-share/mahjongRes";
import * as util from "../common/util";
import { TingPaiData } from "./ermjTingHuPai";
import ErmjChooseChi from "./ermjChooseChi";
import ErmjBaoTing from "./ermjBaoTing";

const { ccclass, property } = cc._decorator;

export enum State {
    WaitStart,
    Start,
    state_send_card,
    state_wait_user_out_card,
    state_chi_peng_gang_hu,
    state_round_result,
    End
}
@ccclass
export default class ErmjGame extends Game {
    @property(cc.Node)
    btnTing: cc.Node = undefined;

    @property(cc.Node)
    private btnBill: cc.Node = undefined;

    @property(cc.Node)
    btnNew: cc.Node = undefined;

    @property(ErmjTimer)
    mjTimer: ErmjTimer = undefined;

    @property(cc.Sprite)
    quanFeng: cc.Sprite = undefined;
    @property(cc.Sprite)
    menFeng: cc.Sprite = undefined;
    @property([cc.SpriteFrame])
    fengs: cc.SpriteFrame[] = [];

    @property(ErmjPromptOpt)
    mjOptPanel: ErmjPromptOpt = undefined;

    @property(ErmjBaoTing)
    baoTingPanel: ErmjBaoTing = undefined;

    @property(ErmjChooseGang)
    mjChooseGang: ErmjChooseGang = undefined;

    @property(ErmjChooseChi)
    mjChooseChi: ErmjChooseChi = undefined;

    @property(ErmjResult)
    mjResult: ErmjResult = undefined;

    @property(cc.Node)
    nodeBaoTingCover: cc.Node = undefined;

    @property(cc.Node)
    private nodeCover: cc.Node = undefined;

    @property(cc.Label)
    private lblClock: cc.Label = undefined;

    @property(cc.Node)
    oppTingPanel: cc.Node = undefined;
    @property(cc.Label)
    oppDoubleCount: cc.Label = undefined;
    @property(cc.Node)
    tingPanel: cc.Node = undefined;
    @property(cc.Label)
    doubleCount: cc.Label = undefined;



    @property(cc.Prefab)
    preTaxRebate: cc.Prefab = undefined;

    @property(cc.Prefab)
    private preMjRes: cc.Prefab = undefined;

    @property(cc.Prefab)
    private preTingItem: cc.Prefab = undefined;


    @property(cc.Prefab)
    private preAnimPeng: cc.Prefab = undefined;
    @property(cc.Prefab)
    private preAnimChi: cc.Prefab = undefined;
    @property(cc.Prefab)
    private preAnimGang: cc.Prefab = undefined;
    @property(cc.Prefab)
    private preAnimXy: cc.Prefab = undefined;
    @property(cc.Prefab)
    private preAnimGf: cc.Prefab = undefined;
    @property(cc.Prefab)
    private preAnimHu: cc.Prefab = undefined;
    @property(cc.Prefab)
    private preAnimZimo: cc.Prefab = undefined;
    @property(cc.Prefab)
    private preAnimGskh: cc.Prefab = undefined;
    @property(cc.Prefab)
    private preAnimYpdx: cc.Prefab = undefined;
    @property(cc.Prefab)
    private preAnimQgh: cc.Prefab = undefined;
    @property(cc.Prefab)
    private preAnimHjzy: cc.Prefab = undefined;

    @property(cc.Label)
    private labBaseScore: cc.Label = undefined;

    gameName = GameId.ERMJ;
    playerMgr: ErmjPlayerMgr;
    msg: ErmjMsg;
    audioMgr: ErmjAudio;

    // 自动托管面板
    coverPanel: cc.Node;
    private trusteeshipPanel: cc.Node;
    // 听牌面板
    private tPanelBg: cc.Node;
    private tPanelAuto: cc.Toggle;
    private tPanelData: cc.Node;
    // 账单
    private billIcon: cc.Node;
    private billScore: cc.Label;
    private billSvContent: cc.Node;
    private billSvItem: cc.Node;

    private tingPanelPosX: number = undefined; // 听牌的位置记录（解决宽屏判断错误）
    private tickerPos: cc.Vec2 = undefined;
    private _currOptPlayer: number;                                                       // 当前操作的玩家
    private _lastDiscardInfo: ErmjType.SaveDiscardInfo = { outPos: -1, outPaiVal: [] };    // 最后出牌的玩家信息(用于碰和杠的取值)
    roomConfig: any;
    isTrusteeship: number = 0;     // 客户端是否托管判断 0 初始值  1 客户端发消息出牌  2 服务器发消息出牌  3 主动出牌

    private _mahjongRes: MahjongRes;
    get mahjongRes() {
        if (!this._mahjongRes) {
            this._mahjongRes = util.instantiate(this.preMjRes).getComponent(MahjongRes);
        }
        return this._mahjongRes;
    }

    set lastDiscardInfo(info: ErmjType.SaveDiscardInfo) {
        this._lastDiscardInfo.outPos = info.outPos;
        this._lastDiscardInfo.outPaiVal = info.outPaiVal;
    }

    get lastDiscardInfo(): ErmjType.SaveDiscardInfo {
        let info = this.playerMgr.me.checkSelfGangPaiVal();
        if (-1 === this._lastDiscardInfo.outPos) {
            return info;
        } else {
            return this._lastDiscardInfo;
        }
    }

    get lastDiscardPos(): number {
        return this._lastDiscardInfo.outPos;
    }

    set currOptPlayer(rPos: number) {
        this._currOptPlayer = rPos;
    }

    get currOptPlayer(): number {
        return this._currOptPlayer;
    }

    onLoad() {
        this.coverPanel = this.nodeCover.getChildByName("coverNode");
        this.trusteeshipPanel = this.nodeCover.getChildByName("cancelAuto");

        this.tPanelBg = this.tingPanel.getChildByName("bg");
        this.tPanelAuto = this.tPanelBg.getChildByName("tgAuto").getComponent(cc.Toggle);
        this.tPanelData = this.tPanelBg.getChildByName("data");

        super.onLoad();

        this.tickerPos = this.lblClock.node.parent.getPosition();

        cc.find("Canvas").on(cc.Node.EventType.TOUCH_END, () => {
            let player = this.playerMgr.me;
            if (this.isGaming && player) {
                player.setHoldsResetStatus();
            }
        }, this);
    }
    dealRoomData(data: any): void {
        this.labBaseScore.string = this.baseScore + "";
    }

    initRound(): void {
        cc.log("初始化一局");

        // 设置手牌时必须要把四个玩家的信息在game里面填了
        // this.scheduleOnce(() => {
        //     let data = {
        //         bankerPos: 1,
        //         handlePai: [15, 11, 35, 16, 18, 32, 17, 16, 11, 11, 25, 22, 26, 29],
        //     };
        //     this.msg.handleSendPai(data);
        // }, 1);

        // 换三张完毕
        // this.scheduleOnce(() => {
        // for (var index = 0; index < 4; index++) {
        //     this.msg.handleHasSelected({ rPos: index });
        // }
        // }, 5)

        // 定缺
        // this.scheduleOnce(() => {
        //     let data = { "status": 4, "leftTime": 10 };
        //     this.msg.handleGameStatus(data);
        // }, 3)

        // 结束换三张
        // this.scheduleOnce(() => {
        //     this.mjExchange3.show();
        //     let data = {
        //         "changeType": 2, "paisInfo": [{ "rPos": 1, "pais": [25, 22, 26] }, { "rPos": 2, "pais": [31, 31, 31] }]
        //     }
        //     this.msg.handleChange3Card(data);
        // }, 1);

        // 结束定缺
        // this.scheduleOnce(() => {
        //     let data = { "queInfo": [{ "rPos": 0, "queType": 3 }, { "rPos": 1, "queType": 3 }, { "rPos": 2, "queType": 2 }, { "rPos": 3, "queType": 1 }] }
        //     this.msg.handleDingQue(data);
        // }, 5);

        // 操作
        // this.scheduleOnce(()=>{
        //      let data = { peng: 1, gang: 1, hu: 1, leftTime: 60 };
        //      this.msg.handlePengGangHu(data);
        // }, 5);

        // 摸牌
        // this.scheduleOnce(() => {
        //     let data = {
        //         uprPos: 3,
        //         upPai: 39,
        //     };
        //     this.msg.handleUpPai(data);
        // }, 6);


        // this.scheduleOnce(() => {
        //     try {
        //         let data = {
        //             "rPos": 3,
        //             "info": { type: MjType.GangType.GANG_TYPE_DARK, pai: 11 },
        //         };
        //         this.msg.handleGangCard(data);
        //     } catch (error) {
        //         cc.log("计时器出错了");
        //     }
        // }, 3);

        this.isTrusteeship = 0;
        this.mjResult.resetData();
        this.mjOptPanel.hide();
        this.mjChooseGang.hide();
        this.mjTimer.reset();
        this.mjTimer.setRemainPaiTotal(0, true);

        this.lblClock.node.parent.active = false;
        this.nodeCover.active = true;
        this.coverPanel.active = false;
        this.trusteeshipPanel.active = false;
        this.oppTingPanel.active = false;
        this.tingPanel.active = false;
        this.tPanelAuto.uncheck();
        this.btnTing.active = false;
        this.btnBill.active = false;
        this.btnNew.active = false;

        this.nodeAnimation.active = true;
        this.nodeAnimation.children.forEach((node) => {
            node.active = false;
        });

        if (!this.dontPrepare)
            this.doPrepare();
        this.playerMgr.initRound();

        this.quanFeng.spriteFrame = undefined;
        this.menFeng.spriteFrame = undefined;
        this.nodeBaoTingCover.active = false;
        this.oppDoubleCount.string = '1';
        this.doubleCount.string = '1';
    }

    initGame(): void {
        cc.log("初始化 init");
        this.msg = new ErmjMsg(this);
        this.msg.init();
        this.playerMgr = new ErmjPlayerMgr(this);
        this.menu.init(this);
        this.mjChooseGang.game = this;
        this.mjResult.game = this;
        this.mjResult.node.active = false;
    }

    get ableStart() {
        return this.playerMgr.readyCount > 3;
    }

    setRoomInfo(config: any): void {
        this.roomConfig = config;

        // this.mjRoom.node.active = false;
        this.mjTimer.setMode(config.change3Pai);
        this.mjTimer.setBet(this.baseScore);
    }

    refreshRoomInfo() {
        // this.mjRoom.setRoomInfo({ ...this.roomConfig, rid: this.id });
    }

    showTicker(time: number): void {
        this.mjTimer.clockTick(time);
    }
    hideTicker(): void {
        this.mjTimer.hideClock();
    }

    changeState(s: number, left?: number) {
        super.changeState(s);
        if (left !== undefined)
            this.mjTimer.setGameTicker(left);
    }

    updateUI(): void {
        let me = this.playerMgr.me;
        this.hidePrepare();

        switch (this.gameState) {
            // 开始
            case State.Start:
                this.isGaming = true;
                this.hideStartTicker();
                break;
            case State.state_send_card:
                console.log("STATE.state_send_card");
                break;
            case State.state_wait_user_out_card:
                console.log("STATE.state_wait_user_out_card");
                break;
            case State.state_chi_peng_gang_hu:
                console.log("STATE.state_chi_peng_gang_hu");
                break;
            case State.state_round_result:
                break;
            case State.End:
                this.isGaming = false;
                break;
        }
        this.menu.updateBtnState();
    }

    startGame(holdData: number[]) {
        this.btnBill.active = false;
        // 设置自己手牌
        this.playerMgr.initHold(holdData);
    }

    setQuanMen(q: number, m: number) {
        this.quanFeng.spriteFrame = this.fengs[q];
        this.menFeng.spriteFrame = this.fengs[m];
    }

    setWaitOutPai(rPos: number, leftTime: number) {
        this.mjOptPanel.hide();
        this.mjChooseChi.hide();
        this.mjChooseGang.hide();
        for (let posIdx = 0; posIdx < this.playerMgr.playerCount; posIdx++) {
            let player = this.playerMgr.getPlayerByServerPos(posIdx);
            if (player) {
                if (posIdx === rPos) {
                    player.showNewDrawPai();
                    this.mjTimer.setWait(leftTime, player.seat);
                    player.showWaitingTimer(0, leftTime);
                    if (player.isMe) {
                        this.coverPanel.active = false;
                        let self = this;
                        if (this.isTrusteeship === 2) {
                            self.setShowCancelAutoVisb(true);
                        }
                    }
                } else {
                    player.clearWaitingTimer();
                }
            }
        }
        this.currOptPlayer = rPos;
    }

    setPlayerDraw(rPos: number, paiVal: number) {
        this.mjTimer.setPlayerDraw();
        let player = this.playerMgr.getPlayerByServerPos(rPos);
        if (player) {
            player.addHoldsPai(paiVal);
        }
        this.currOptPlayer = rPos;

        if (player && player.isMe && this.getIsAutoDraw()) {
            let isHu = player.isHuPai();
            if (isHu) {
                this.msg.sendHu();
            } else {
                this.scheduleOnce(() => {
                    if (this.getIsAutoDraw()) {
                        this.msg.sendOutPai(paiVal);
                    }
                }, 3);
            }
        }
    }

    double(opp = false) {
        let lab = opp ? this.oppDoubleCount : this.doubleCount;
        lab.string = `${+lab.string * 2}`;
    }

    setWaitPrepare(): void {
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




    //////////////////////////////////////////////////  听牌
    setTingData(tingPaiDataArr: TingPaiData[], opp = false) {
        if (tingPaiDataArr.length > 0) {
            let dPanel = opp ? this.oppTingPanel.children[0].children[1] : this.tPanelData;

            dPanel.removeAllChildren();
            for (let index = 0; index < tingPaiDataArr.length; index++) {
                let tingData = tingPaiDataArr[index];
                let tingModel = util.instantiate(this.preTingItem);
                dPanel.addChild(tingModel);

                tingModel.getChildByName("pai").getComponent(cc.Sprite).spriteFrame = this.mahjongRes.getPaiSpriteFrame(tingData.tingPai);
                tingModel.getChildByName("fan").getComponent(cc.Label).string = tingData.baseFan.toString() + '番';
                tingModel.getChildByName("zhang").getComponent(cc.Label).string = tingData.RemainingNum.toString() + '张';
                let cover = tingModel.getChildByName("cover");
                if (tingData.RemainingNum > 0) {
                    cover.active = false;
                }
            }

            if (dPanel.parent.x < 520 && !dPanel.parent.getNumberOfRunningActions()) {
                dPanel.getComponent(cc.Layout).updateLayout();
                dPanel.parent.getComponent(cc.Layout).updateLayout();
                dPanel.parent.x = cc.winSize.width / 2 - dPanel.parent.width + 30;
            }
        }
    }

    showTingPanel(isShowPrompt: boolean, opp = false) {
        let panel = opp ? this.oppTingPanel : this.tingPanel;
        if (!panel.active) {
            panel.active = true;
            this.tingPanelPosX = this.tingPanel.getChildByName("bg").getPositionX();
            panel.getChildByName('bg').x = this.tingPanelPosX;
            panel.getChildByName('bg').getChildByName('data').getComponent(cc.Layout).updateLayout();
            panel.getChildByName('bg').getComponent(cc.Layout).updateLayout();
            this.showTingAction(panel);
        }
        panel.getComponent(cc.Button).enabled = isShowPrompt;
    }

    /**
     * 听牌
     */
    onClickTing(ev: cc.Event.EventTouch) {
        this.showTingAction(ev.target.parent.parent);
    }

    showTingAction(panel: cc.Node) {
        let bg = panel.getChildByName('bg');
        let posX = this.tingPanelPosX;
        if (bg.x < posX) {
            bg.runAction(cc.moveBy(.2, posX - bg.x, 0));
        } else {
            bg.runAction(cc.moveBy(.2, cc.winSize.width / 2 - bg.width + 30 - bg.x, 0));
        }
    }

    onHideTingPanel() {
        this.tingPanel.active = false;
    }

    //////////////////////////////////////////////////  账单

    showBillPanel() {
        let changeScoreData = this.mjResult.changeScoreData;
        let descDataArrs: { desc1: string, desc2: string, score: string, scoreColor: cc.Color }[] = [];
        changeScoreData.forEach((changeScoreInfo) => {
            let descData = {
                desc1: "",
                desc2: "",
                score: "",
                scoreColor: cc.Color.RED,
            }

            let isHaveSelf = false;
            let isSelfSuccess: boolean;

            let firstType = changeScoreInfo.type[0];
            let scoreNum = changeScoreInfo.changeScore.length;
            changeScoreInfo.changeScore.forEach((sInfo) => {
                let player = this.playerMgr.getPlayerByServerPos(sInfo.rPos);
                if (player.isMe) {
                    isHaveSelf = true;
                    // 判断自己状态
                    if (firstType >= ErmjType.HU_TYPE_EX.HUPAI_HU_PAI) {
                        let isZimo = false;
                        changeScoreInfo.type.forEach(typeIdx => {
                            if (typeIdx === ErmjType.HU_TYPE_EX.HUPAI_ZI_MO) {
                                isZimo = true;
                            }
                        });
                        if (sInfo.changeScore > 0) {
                            if (isZimo)
                                descData.desc1 = "自摸";
                            else
                                descData.desc1 = "胡";
                            descData.scoreColor = cc.Color.YELLOW;
                            isSelfSuccess = true;
                        } else {
                            if (isZimo)
                                descData.desc1 = "被自摸";
                            else
                                descData.desc1 = "点炮";
                            descData.scoreColor = cc.Color.RED;
                            isSelfSuccess = false;
                        }
                    } else {
                        if (sInfo.changeScore > 0) {
                            if (firstType === ErmjType.GangType.GANG_TYPE_DARK)
                                descData.desc1 = "我下雨";
                            else
                                descData.desc1 = "我刮风";
                            descData.scoreColor = cc.Color.YELLOW;
                            isSelfSuccess = true;
                        } else {
                            if (firstType === ErmjType.GangType.GANG_TYPE_DARK)
                                descData.desc1 = "被下雨";
                            else
                                descData.desc1 = "被刮风";
                            descData.scoreColor = cc.Color.RED;
                            isSelfSuccess = false;
                        }
                    }
                    descData.score = util.mul(sInfo.changeScore, this.baseScore).toString();
                }
            });

            if (isHaveSelf) {
                // 此条数据有自己的话就找出和自己相关的玩家
                if (firstType >= ErmjType.HU_TYPE_EX.HUPAI_HU_PAI) {
                    changeScoreInfo.changeScore.forEach((sInfo) => {
                        let player = this.playerMgr.getPlayerByServerPos(sInfo.rPos);
                        if (!isSelfSuccess && sInfo.changeScore > 0)
                            descData.desc2 = this.getPlayerSeatDesc(player.seat);
                    });
                } else if (firstType < ErmjType.GangType.GANG_TYPE_PENG) {
                    if (isSelfSuccess) {
                        if (scoreNum > 2)
                            descData.desc2 = "(全部)";
                        else {
                            changeScoreInfo.changeScore.forEach((sInfo) => {
                                let player = this.playerMgr.getPlayerByServerPos(sInfo.rPos);
                                if (sInfo.changeScore < 0)
                                    descData.desc2 = this.getPlayerSeatDesc(player.seat);
                            });
                        }
                    } else {
                        changeScoreInfo.changeScore.forEach((sInfo) => {
                            let player = this.playerMgr.getPlayerByServerPos(sInfo.rPos);
                            if (sInfo.changeScore > 0)
                                descData.desc2 = this.getPlayerSeatDesc(player.seat);
                        });
                    }
                }
                descDataArrs.push(descData);
            }
        });

        let totalScore: number = 0;
        this.billSvContent.removeAllChildren();
        descDataArrs.forEach((data, idx) => {
            let item = util.instantiate(this.billSvItem);
            item.active = true;
            this.billSvContent.addChild(item);

            let bg1 = item.getChildByName("bg1");
            let bg2 = item.getChildByName("bg2");
            bg1.active = false;
            bg2.active = false;
            if (idx % 2 === 0) {
                bg1.active = true;
            } else {
                bg2.active = true;
            }

            let desc1 = item.getChildByName("desc1").getComponent(cc.Label);
            let desc2 = item.getChildByName("desc2").getComponent(cc.Label);
            let goldDesc = item.getChildByName("goldDesc").getComponent(cc.Label);
            let gold = item.getChildByName("gold").getComponent(cc.Label);
            desc1.string = data.desc1;
            desc2.string = data.desc2;
            goldDesc.string = "金币";
            gold.string = data.score;
            gold.node.color = data.scoreColor;

            totalScore = util.add(totalScore, data.score).toNumber();
        });

        let icon1 = this.billIcon.getChildByName("0");
        let icon2 = this.billIcon.getChildByName("1");
        icon1.active = false;
        icon1.active = true;

        if (totalScore >= 0)
            this.billScore.node.color = cc.Color.YELLOW;
        else
            this.billScore.node.color = cc.Color.RED;
        this.billScore.string = totalScore.toString();
    }

    onHideBillPanel() {
    }

    private getPlayerSeatDesc(seat: number): string {
        if (seat === 1)
            return "(下家)";
        else if (seat === 2)
            return "(对家)";
        else if (seat === 3)
            return "(上家)"
        return "(全部)";
    }

    /////////////////////////////////////////////// 托管
    setSelfHu() {
        this.isGaming = false;

        this.setShowCancelAutoVisb(false);
        this.coverPanel.active = true;
        this.btnTing.active = false;
        this.mjOptPanel.hide();

        this.btnNew.active = false;
    }

    setShowCancelAutoVisb(isShow: boolean) {
        if (isShow) {
            if (!this.tPanelAuto.isChecked)
                this.tPanelAuto.check();
        } else {
            if (this.tPanelAuto.isChecked)
                this.tPanelAuto.uncheck();
        }
        this.coverPanel.active = isShow;
        this.trusteeshipPanel.active = isShow;
        this.onHideTingPanel();

        if (isShow)
            this.playerMgr.me.setAutoDiscard();
    }

    getIsAutoDraw(): boolean {
        return this.tPanelAuto.isChecked;
    }

    onClickBaoTing(ev: cc.Event.EventTouch) {
        this.playerMgr.me.coverUnTings(!this.baoTingPanel.isToBao());
    }

    /**
     * 碰杠胡操作
     * @param ev
     * @param info
     */
    onClickOpt(ev: cc.Event.EventTouch) {
        let opt = +ev.target.name;
        this.mjOptPanel.hide();
        this.coverPanel.active = false;
        if (ErmjType.OptType.OPT_PENG === opt) {
            this.msg.sendPeng();
        } else if (ErmjType.OptType.OPT_GANG === opt) {
            let selfPlayer = this.playerMgr.me;
            let isWait = selfPlayer.isWaitingDraw();
            let gangInfo: number[] = [];
            if (isWait) {
                gangInfo = selfPlayer.checkSelfGangPaiVal().outPaiVal;
            } else {
                gangInfo = this.lastDiscardInfo.outPaiVal;
            }

            if (gangInfo.length < 2)
                this.msg.sendGang(gangInfo[0]);
            else {
                // 选择要杠的值
                this.mjChooseGang.show(gangInfo);
            }
        } else if (ErmjType.OptType.OPT_HU === opt) {
            this.msg.sendHu();
        } else if (ErmjType.OptType.OPT_GUO === opt) {
            this.msg.sendPass();
        } else if (ErmjType.OptType.OPT_CHI === opt) {
            let selfPlayer = this.playerMgr.me;
            let lastPai = this.lastDiscardInfo.outPaiVal[0];
            let chiStartVals = selfPlayer.checkSelfChiPaiVal(lastPai);
            if (chiStartVals.length < 2)
                this.msg.sendChi(chiStartVals[0]);
            else {
                // 选择要吃的值
                this.mjChooseChi.show(lastPai, chiStartVals, this.mahjongRes);
            }
        }
    }

    /**
     * 杠
     * @param ev
     * @param info
     */
    onClickGang(ev: cc.Event.EventTouch, info: string) {
        let paiVal = +info;
        this.mjChooseGang.hide();
        this.msg.sendGang(paiVal);
    }

    /**
     * 吃
     * @param ev
     */
    onClickChi(ev: cc.Event.EventTouch) {
        this.mjChooseChi.hide();
        this.msg.sendChi(+ev.target.name);
    }

    onTogAutoDraw() {
        if (this.tPanelAuto.isChecked) {
            this.setShowCancelAutoVisb(true);
        } else {
            this.setShowCancelAutoVisb(false);
        }
    }

    onClickCancelAuto() {
        this.isTrusteeship = 0;
        this.setShowCancelAutoVisb(false);
        this.tPanelAuto.isChecked = false;
    }

    /**
     * 账单
     */
    onClickBill() {
        this.showBillPanel();
    }

    /**
     * 跳转新游戏
     */
    onClickNew() {
        this.changeRoom();
    }

    /////////////////////////////特效
    playAnimPeng(effPos: cc.Vec2) {
        return this.playAnim(this.preAnimPeng, effPos);
    }
    playAnimChi(effPos: cc.Vec2) {
        return this.playAnim(this.preAnimChi, effPos);
    }
    playAnimGang(effPos: cc.Vec2) {
        return this.playAnim(this.preAnimGang, effPos);
    }
    playAnimXy(effPos: cc.Vec2) {
        return this.playAnim(this.preAnimXy);
    }
    playAnimGf(effPos: cc.Vec2) {
        return this.playAnim(this.preAnimGf, effPos);
    }
    playAnimHu(effPos: cc.Vec2) {
        return this.playAnim(this.preAnimHu, effPos);
    }
    playAnimZimo(effPos: cc.Vec2) {
        return this.playAnim(this.preAnimZimo, effPos);
    }
    playAnimHuEff(nodeAnim: cc.Node) {
        this.playRepeatAnim(nodeAnim, false);
    }

    playAnimGskh() {
        return this.playAnim(this.preAnimGskh);
    }

    playAnimYpdx() {
        return this.playAnim(this.preAnimYpdx);
    }

    playAnimQgh() {
        return this.playAnim(this.preAnimQgh);
    }

    playAnimHjzy() {
        return this.playAnim(this.preAnimHjzy);
    }

    playExchange3Anim(node: cc.Node) {
        this.playRepeatAnim(node);
    }

    protected playAnim(animPrefab: cc.Prefab, pos?: cc.Vec2) {
        return new Promise(resolve => {
            if (!animPrefab) {
                cc.warn("no anim prefab");
                resolve(false);
                return;
            }
            let node = this.nodeAnimation.getChildByName(animPrefab.name);
            if (!node) {
                node = util.instantiate(animPrefab);
                this.nodeAnimation.addChild(node);
            }
            node.active = true;
            if (pos) {
                node.setPosition(pos);
            }
            let anim = node.getComponent(cc.Animation);
            if (!anim) {
                cc.warn("prefab no anim");
                resolve(false);
                return;
            }

            if (anim.defaultClip) {
                anim.play();
            } else {
                let clips = anim.getClips();
                if (!clips || clips.length === 0) {
                    resolve(false);
                    return;
                }
                anim.play(clips[0].name);
            }

            anim.on("stop", function finish() {
                anim.off("stop", finish);
                node.active = false;
                resolve(true);
            });
        });
    }

    showPrepareTicker(timer?: number) {
        if (this.dontPrepare) {
            if (timer) this.mjResult.showTicker(timer);
            this.dontPrepare = false;
        }
    }

}
