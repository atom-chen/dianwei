import * as util from "../common/util";
import Game from "../game-share/game";

import ErmjGame from "./ermjGame";
import * as ErmjType from "./ermj";
import TurningPlayer from "../game-share/turningPlayer";
import { jiaBeiInfo } from "./ermjMsg";
import { ChiPengGangInfo, PingHuType, HuPaiInfo } from "./ermjTypes";
import TingHuPai, { TingPaiData } from "./ermjTingHuPai";
import GameLogic from "./ermjLogic";

export enum PlayerStates {
    /**未准备 */
    UNREADY,
    /**已准备 */
    READY,
    STARTED,
    START_GAME,
    RESULT,
    //end了
    END,
    //断线了
    OFFLINE
}

const { ccclass, property } = cc._decorator;

@ccclass
export default class ErmjPlayer extends TurningPlayer {
    @property(cc.Node)
    protected nodeTax: cc.Node = undefined;
    @property(cc.Sprite)
    protected showPai: cc.Sprite = undefined;

    @property(cc.Node)
    protected nodeGang: cc.Node = undefined;

    @property(cc.Node)
    protected nodeHold: cc.Node = undefined;

    @property(cc.Node)
    protected nodeDiscard: cc.Node = undefined;

    @property(cc.Node)
    nodeBaoTing: cc.Node = undefined;

    @property(cc.Node)
    protected nodeLeave: cc.Node = undefined;

    @property(cc.Node)
    protected nodeEff: cc.Node = undefined;

    @property(cc.Node)
    protected nodeWindEff: cc.Node = undefined;

    @property(cc.Node)
    protected nodeShowHu: cc.Node = undefined;

    @property(cc.Sprite)
    protected spriShowHu: cc.Sprite = undefined;

    @property(cc.SpriteFrame)
    protected sfHuArr: cc.SpriteFrame[] = [];

    @property(cc.Node)
    private nodeAnimHu: cc.Node = undefined;


    protected _newDrawPai: cc.Node;                   //刚摸到的牌
    protected _huShowPai: cc.Sprite;                  //显示胡的牌
    protected _showPaiPos: cc.Vec2;                   //显示牌的坐标


    protected readonly DISCARD_NUM = 26;              //弃牌总数

    protected readonly HOLDS_NUM = 13;                //手牌总数
    protected _holdPais: number[];
    protected _holdNum: number;                       //剩余手牌数量
    protected _gangDataArr: string[] = [];             //碰杠数据
    cpg: ChiPengGangInfo[] = [];             //碰杠数据
    protected _discardDataArr: number[] = [];          //弃牌区数据
    protected _zimoData: number;                        //自摸牌数据(计算剩余牌)
    protected _currGangPaiVal: number;                 // 用于抢杠胡的杠牌值


    protected _isInitUI = false;
    isLeave = false;

    game: ErmjGame;

    setHoldPais(pais: number[]) {
        this._holdPais = pais;
        this.resetHoldsArray();
    }

    get isInitUI() {
        return this._isInitUI;
    }

    get gangDataArr(): string[] {
        return this._gangDataArr;
    }

    get discardDataArr(): number[] {
        return this._discardDataArr;
    }

    get zimoData(): number {
        return this._zimoData;
    }

    onLoad() {
        super.onLoad();
    }

    init(game: Game) {
        super.init(game);
        if (!this._isInitUI) {
            cc.log("init 0 ")
            this._isInitUI = true;
            this._showPaiPos = this.showPai.node.parent.getPosition();
            this.createHoldPai();
        }
    }

    onEnable() {
        this.initUI();
    }

    private initUI() {
        if (this._newDrawPai)
            this._newDrawPai.active = false;
        if (this._huShowPai) {
            this._huShowPai.node.parent.active = false;
            this.nodeAnimHu.active = false;
        }

        this.spriteTimer.node.active = false;
        this.nodeTax.active = false;
        this.showPai.node.parent.active = false;
        this.spriteDealer.node.active = false;
        this.setLeave(false);
    }

    initRound() {
        this.baoTing(false);

        this._gangDataArr = [];
        this.nodeGang.children.forEach(node => {
            node.opacity = 0;
        });
        this.cpg = [];

        this._discardDataArr = []
        this.nodeDiscard.children.forEach(node => {
            node.opacity = 0;
            node.getChildByName("hu").active = false;
            node.getChildByName("discard").active = false;
            node.getChildByName("double").active = false;
            let point = node.getChildByName("point");
            point.opacity = 0;
        });

        this.nodeEff.active = true;
        this.nodeEff.children.forEach((eff) => {
            eff.active = false;
        });

        this._zimoData = undefined;
        this._huShowPai.node.parent.active = false;
        this.nodeAnimHu.active = false;
        this.spriShowHu.node.active = false;

        this.resetData();
    }

    resetData() {
        this._holdPais = undefined;
        this._newDrawPai.active = false;
        this._newDrawPai.getChildByName('face').active = false;
        for (var index = 0; index <= this.HOLDS_NUM; index++) {
            let hold = this.nodeHold.getChildByTag(index);
            hold.opacity = 0;
            hold.getChildByName('face').active = false;
        }
    }

    createHoldPai() {
        cc.log("createPaiUI");
        // 手牌
        for (let index = 0; index <= this.HOLDS_NUM; index++) {
            let model = this.game.mahjongRes.getHoldsModel(this.seat * 2);
            this.nodeHold.addChild(model);
            model.opacity = 0;
            model.tag = this.HOLDS_NUM - index;

            model.y = 0;
        }

        this._newDrawPai = this.game.mahjongRes.getHoldsModel(this.seat * 2);
        this.node.addChild(this._newDrawPai);
        let worldPoint = this.nodeHold.convertToWorldSpaceAR(cc.v2(0, 0));
        let holdPoint = this.node.convertToNodeSpaceAR(worldPoint);
        if (this.seat === ErmjType.PlayerSeat.SEAT_UP) {
            holdPoint.x -= this.HOLDS_NUM * 46;
        }
        this._newDrawPai.setPosition(holdPoint);
        this._newDrawPai.active = false;

        let showHu = this.getShowHuModel();
        this.node.addChild(showHu);
        showHu.setPosition(holdPoint);

        this.commonUI();
        this.initRound();
    }

    getShowHuModel() {
        // 胡牌显示
        let huModel = this.game.mahjongRes.getHuModel(this.seat * 2);
        this._huShowPai = huModel.getChildByName("tile").getComponent(cc.Sprite);
        return huModel;
    }

    commonUI() {
        // 杠牌
        for (let index = 0; index < 4; index++) {
            let model = this.game.mahjongRes.getGangModel(this.seat * 2, 11, 2);
            model.tag = index;
            this.nodeGang.addChild(model);
            model.opacity = 0;
            model.y = 0;
        }

        // 弃牌
        for (let index = 0; index < this.DISCARD_NUM; index++) {
            let model = this.game.mahjongRes.getDiscardModel(this.seat * 2, 11);
            this.nodeDiscard.addChild(model);
            model.opacity = 0;
            if (this.seat === ErmjType.PlayerSeat.SEAT_SELF) {
                model.tag = this.DISCARD_NUM - (index + 1);
            } else {
                model.tag = index;
            }
            let point = model.getChildByName("point");
            point.active = true;
            let time = 1;
            point.runAction(cc.repeatForever(cc.sequence(cc.moveBy(time, cc.p(0, 25)), cc.moveBy(time, cc.p(0, -25)))));
        }
    }

    initHold(holdData?: number[]) {
        this._holdNum = this.HOLDS_NUM;
        if (this.isDealer) {
            this._holdNum += 1;
        }

        for (var index = 0; index <= this.HOLDS_NUM; index++) {
            let hold = this.nodeHold.getChildByTag(index);
            if (index < this._holdNum + 1) {
                hold.opacity = 255;
                if (!this.isDealer && index === 0) {
                    hold.opacity = 0;
                }
            } else {
                hold.opacity = 0;
            }
        }
    }

    hidePointer() {
        this.nodeDiscard.children.forEach(node => {
            let point = node.getChildByName("point");
            point.opacity = 0;
        });
    }

    ////////////////////////////////////玩家相关

    changeState(state: PlayerStates): void {
        this.state = state;
        switch (state) {
            case PlayerStates.UNREADY:
                break;
            case PlayerStates.READY:
                break;
            case PlayerStates.END:
                break;
            case PlayerStates.OFFLINE:
                break;
        }

        this.updateLookerView();
    }

    get isLooker() {
        return false;
    }

    setDealerVisb(visb: boolean) {
        this.isDealer = visb
        this.spriteDealer.node.active = visb;
    }

    showResultScore(score: number) {
        this.nodeTax.active = true;
        let showLabel;
        if (score > 0) {
            showLabel = util.instantiate(this.game.prefabLabelWin);
        } else {
            showLabel = util.instantiate(this.game.prefabLabelTax);
        }
        let label = showLabel.getComponentInChildren(cc.Label);
        if (label) {
            label.string = "" + score;
        }
        this.nodeTax.addChild(showLabel);
        showLabel.y += 50;

        showLabel.runAction(cc.sequence(
            cc.moveBy(1, 0, 50),
            cc.fadeOut(0.5),
            cc.callFunc(showLabel.destroy.bind(showLabel))
        ));
    }

    showTax(tax: string) {
        this.nodeTax.active = true;
        let showLabel = util.instantiate(this.game.prefabLabelTax);
        let label = showLabel.getComponentInChildren(cc.Label);
        if (label) {
            label.string = "-" + tax;
        }
        this.nodeTax.addChild(showLabel);
        showLabel.y += 20;

        showLabel.runAction(cc.sequence(
            cc.moveBy(1, 0, 50),
            cc.fadeOut(0.5),
            cc.callFunc(showLabel.destroy.bind(showLabel))
        ));
    }

    showTaxRebate(taxRebate: string) {
        this.nodeTax.active = true;
        let showLabel = util.instantiate(this.game.preTaxRebate);
        let label = showLabel.getComponentInChildren(cc.Label);
        if (label) {
            label.string = taxRebate;
        }
        this.nodeTax.addChild(showLabel);

        showLabel.runAction(cc.sequence(
            cc.moveBy(1, 0, 50),
            cc.fadeOut(0.5),
            cc.callFunc(showLabel.destroy.bind(showLabel))
        ));
    }

    leaveAni() {
        if (this.game.isGaming)
            this.setLeave(true);
        else
            this.hide();
    }

    hide() {
        this.setLeave(false);
        super.hide();
    }

    setLeave(visible: boolean) {
        this.isLeave = visible;
        this.nodeLeave.active = visible;
    }

    getEffOptPos(): cc.Vec2 {
        return this.nodeEff.getPosition();
    }

    getEffWindPos(): cc.Vec2 {
        return this.nodeWindEff.getPosition();
    }

    ///////////////////////////////////游戏相关

    startGame() {
        this.changeState(PlayerStates.START_GAME);
    }

    /**
     * 显示刚摸到的牌
     */
    showNewDrawPai() {
        this.resetHoldsArray(true);
    }

    /**
     * 添加新手牌
     * @param paiVal
     */
    addHoldsPai(paiVal?: number) {
        this._holdNum += 1;
        if (this._holdPais) {
            this._holdPais.unshift(paiVal);
        }
    }

    /**
     * 出牌
     */
    setDiscard(pai: number, isTing: number) {
        this._discardDataArr.push(pai);
        this.discardAction(this._newDrawPai.getPosition(), pai);

        if (this._holdPais) {
            this._holdPais.splice(this._holdPais.indexOf(pai), 1);

            let isTingPai = this.checkJiao(this._holdPais, this._gangDataArr);
            if (isTingPai.length) {
                this.game.setTingData(isTingPai, true);
                this.game.showTingPanel(false, true);
            } else {
                this.game.oppTingPanel.active = false;
            }

        }
        this.setPaiRemainNum(1);

        if (isTing) {
            this.baoTing();
        }
    }

    checkJiao(holdsPaiValArr: number[], pengangDataArr: string[]): TingPaiData[] | undefined {
        let tingHuPai = new TingHuPai();
        let needs = tingHuPai.getNeeds(holdsPaiValArr);
        let tingDataArr = [];
        for (const ne of needs) {
            tingDataArr.push({
                tingPai: ne,
                baseFan: this.getFan(holdsPaiValArr.concat(), ne),
                RemainingNum: this.getTingPaiRemainNum(ne),
            })
        }

        return tingDataArr
    }

    getFan(holds: number[], ne: number) {

        let appeared = []
        for (const p of this.game.playerMgr.playerArr) {
            appeared.push(...p.discardDataArr);
            for (const aCpg of p.cpg) {
                if (aCpg.pingHuType <= PingHuType.TYPE_ADD) {
                    appeared.push(aCpg.pai, aCpg.pai, aCpg.pai, aCpg.pai);
                } else if (aCpg.pingHuType === PingHuType.TYPE_PENG) {
                    appeared.push(aCpg.pai, aCpg.pai, aCpg.pai);
                } else if (aCpg.pingHuType === PingHuType.TYPE_CHI) {
                    appeared.push(aCpg.pai, aCpg.pai + 1, aCpg.pai + 2);
                }
            }
        }
        let type: number[] = [];
        let info: HuPaiInfo[] = [];
        let logic = new GameLogic;
        let types = logic.CanHu(
            holds,
            ne,
            this.cpg,
            type,
            appeared,
            0,
            info,
            0,
            0
        );
        return logic.GetFan(types);
    }

    // 可听的牌还剩多少
    getTingPaiRemainNum(tingVal: number): number {
        let remainNum = 4;
        for (let rPos = 0; rPos < this.game.playerMgr.playerCount; rPos++) {
            let player = this.game.playerMgr.getPlayerByServerPos(rPos);
            let zimoVal = player.zimoData;
            let gangValArr = player.gangDataArr;
            let discardValArr = player.discardDataArr;

            // 分别从自摸牌、碰杠牌、弃牌中查找
            if (zimoVal && (zimoVal === tingVal)) {
                remainNum -= 1;
            }
            for (let gangIdx = 0; gangIdx < gangValArr.length; gangIdx++) {
                let gangData = gangValArr[gangIdx];
                let gangVal = +(gangData.substr(1));
                if (gangData.indexOf("c") >= 0) {
                    if (gangVal >= tingVal - 2 && gangVal <= tingVal) {
                        remainNum--;
                    }
                    continue;
                }
                if (gangVal === tingVal) {
                    if (gangData.indexOf("p") >= 0)
                        remainNum -= 3;
                    else
                        remainNum -= 4;
                }
            }
            for (let valIdx = 0; valIdx < discardValArr.length; valIdx++) {
                let paiVal = discardValArr[valIdx];
                if (paiVal === tingVal)
                    remainNum -= 1;
            }
        }

        // 自己手牌中查找
        for (let valIdx = 0; valIdx < this._holdPais.length; valIdx++) {
            let paiVal = this._holdPais[valIdx];
            if (paiVal === tingVal)
                remainNum -= 1;
        }

        return remainNum;
    }

    doubled(infos: jiaBeiInfo[]) {
        for (const info of infos) {
            for (let i = this._discardDataArr.length - 1; i >= 0; i--) {
                if (this._discardDataArr[i] === info.pai) {
                    const n = this.nodeDiscard.getChildByTag(i);
                    let double = n.getChildByName('double');
                    if (!double.active) {
                        double.active = true;
                        // double.color = info.paiPos === this.game.playerMgr.me.serverPos ? cc.Color.BLUE : cc.Color.GREEN;
                        break;
                    }
                }
            }
        }
    }

    baoTing(ting = true) {
        this.nodeBaoTing.active = ting;
    }

    quickSetPlayerDiscard(paiValArr: number[], huArr: number[], isShowPointer: boolean) {
        let huIdxArr = huArr ? huArr : [];
        this._discardDataArr = [];

        let huIdxCount = 0;
        let huIdxTotal = huIdxArr.length;
        for (let index = 0; index < paiValArr.length; index++) {
            let paiVal = paiValArr[index];

            this._discardDataArr.push(paiVal);
            let sf = this.game.mahjongRes.getPaiSpriteFrame(paiVal);
            let lastDiscardPai = this.nodeDiscard.getChildByTag(this._discardDataArr.length - 1);
            lastDiscardPai.opacity = 255;
            lastDiscardPai.getComponentInChildren(cc.Sprite).spriteFrame = sf;

            if (huIdxCount < huIdxTotal && index === huIdxArr[huIdxCount]) {
                huIdxCount += 1;
                lastDiscardPai.getChildByName("hu").active = true;
            }

            // 指针
            if (index === paiValArr.length - 1 && isShowPointer) {
                this.game.playerMgr.hidePointer();
                lastDiscardPai.getChildByName("point").opacity = 255;
            }
        }
    }

    removeFromDiscard() {
        let lastDiscardPai = this.nodeDiscard.getChildByTag(this._discardDataArr.length - 1);
        lastDiscardPai.opacity = 0;
        this._discardDataArr.pop();

        this.game.playerMgr.hidePointer();
    }

    setPaiRemainNum(minusNum: number) {
        this._holdNum -= minusNum;
        this.resetHoldsArray();
    }

    tipJiaos() {
        if (this._holdPais) {
            let isTingPai = this.checkJiao(this._holdPais, this.gangDataArr);
            if (isTingPai.length) {
                this.game.setTingData(isTingPai, true);
                this.game.showTingPanel(false, true);
            }
        }
    }

    findExchangeThreePai() {
    }

    findSuitPai() {
    }

    /**
    * 托管自动出牌
    */
    setAutoDiscard() {
    }

    isHuPai(): boolean {
        return false;
    }

    isWaitingDraw(): boolean {
        return false;
    }

    checkSelfGangPaiVal(): ErmjType.SaveDiscardInfo {
        return { outPos: -1, outPaiVal: [] };
    }

    checkSelfChiPaiVal(val: number) {
        return new Array<number>();
    }

    getExchangeThreeData(): number[] {
        return [];
    }

    /**
     * 手牌飞向弃牌区动画
     * @param startPos
     * @param paiVal
     */
    discardAction(startPos: cc.Vec2, paiVal: number) {
        let paiSpriteF = this.game.mahjongRes.getPaiSpriteFrame(paiVal);
        this.showPai.spriteFrame = paiSpriteF;
        this.showPai.node.active = true;
        let showPaiParent = this.showPai.node.parent;
        showPaiParent.stopAllActions();
        showPaiParent.active = true;
        showPaiParent.scale = 1;
        showPaiParent.rotation = 0;
        showPaiParent.opacity = 150;
        showPaiParent.setPosition(startPos);

        let rotation = 0;

        let actTime1 = 0.2;
        let move = cc.moveTo(actTime1, this._showPaiPos);
        let scale = cc.scaleTo(actTime1, 1.5);
        let fade = cc.fadeTo(actTime1, 255);
        let spw1 = cc.spawn(move, scale, fade);
        showPaiParent.runAction(cc.sequence(
            spw1,
            cc.callFunc(() => {
                let lastDiscardPai = this.nodeDiscard.getChildByTag(this._discardDataArr.length - 1);
                let lastDiscardPos = cc.p(lastDiscardPai.x, lastDiscardPai.y);

                let worldPoint = this.nodeDiscard.convertToWorldSpaceAR(lastDiscardPos);
                let discardPoint = this.node.convertToNodeSpaceAR(worldPoint);

                this.scheduleOnce(() => {
                    showPaiParent.stopAllActions();
                    let actTime = 0.15;
                    let move = cc.moveTo(actTime, discardPoint);
                    let scale = cc.scaleTo(actTime, 0.65);
                    let rotate = cc.rotateTo(actTime, rotation);
                    let spw = cc.spawn(move, scale, rotate);
                    showPaiParent.runAction(cc.sequence(
                        spw,
                        cc.callFunc(() => {
                            showPaiParent.active = false;
                            // 判断当前弃牌是否已被碰杠了
                            let lastPaiVal = this._discardDataArr[this._discardDataArr.length - 1];
                            if (lastPaiVal === paiVal) {
                                lastDiscardPai.opacity = 255;
                                lastDiscardPai.getComponentInChildren(cc.Sprite).spriteFrame = paiSpriteF;

                                this.game.playerMgr.hidePointer();
                                lastDiscardPai.getChildByName("point").opacity = 255;

                                this.game.audioMgr.playComDraw();
                            }
                        }),
                    ));
                }, 1);
            }),
        ));
    }

    /**
     *
     * 抢杠胡
     */
    setQiangGangHu() {
        let paiVal = this._currGangPaiVal;
        // 先把抢杠的牌还回弃牌区并设置好胡状态
        this._discardDataArr.push(paiVal);
        this.setDiscardHuStatus(paiVal)

        // 把杠牌变成碰牌
        let pengGangIdx = 0;
        let gangDataArr = this._gangDataArr;
        if (gangDataArr.length > 0) {
            for (let index = 0; index < gangDataArr.length; index++) {
                let gangData = gangDataArr[index];
                let gangVal = parseInt(gangData.substr(1));
                if (gangVal === paiVal) {
                    this._gangDataArr[index] = `p${paiVal}`;
                    this.cpg[index].pingHuType = PingHuType.TYPE_PENG;
                    pengGangIdx = index;
                    break;
                }
            }
        }

        let gangModel = this.nodeGang.getChildByTag(pengGangIdx);
        this.game.mahjongRes.setGangVal(gangModel, paiVal, ErmjType.GangType.GANG_TYPE_PENG);
    }

    /**
     * 碰或杠吃牌操作
     *
     */
    setPGangPai(gangPaiVal: number, gangType: ErmjType.GangType, chiVal?: number) {
        if (ErmjType.GangType.GANG_TYPE_ADD === gangType) {
            for (const info of this.cpg) {
                if (info.pai === gangPaiVal) {
                    info.pingHuType = gangType as number;
                }
            }
        } else {
            this.cpg.push({
                pai: gangPaiVal,
                pingHuType: gangType as number,
                chiPai: chiVal,
            })
        }

        let pGangIdx: number;
        // 保存到碰杠数据中
        if (gangType === ErmjType.GangType.GANG_TYPE_PENG) {
            this._gangDataArr.push(`p${gangPaiVal}`);
            pGangIdx = this._gangDataArr.length - 1;
        } else if (gangType === ErmjType.GangType.GANG_TYPE_CHI) {
            this._gangDataArr.push(`c${gangPaiVal}`);
            pGangIdx = this._gangDataArr.length - 1;
        } else {
            // 判断此时的杠是否是由碰来的
            let isSame = false;
            let gangDataArr = this._gangDataArr;
            if (gangDataArr.length > 0) {
                for (let index = 0; index < gangDataArr.length; index++) {
                    let gangData = gangDataArr[index];
                    let gangVal = parseInt(gangData.substr(1));
                    if (gangVal === gangPaiVal) {
                        gangDataArr[index] = `g${gangPaiVal}`;
                        isSame = true;
                        pGangIdx = index;
                        break;
                    }
                }
            }
            if (!isSame) {
                this._gangDataArr.push(`g${gangPaiVal}`);
                pGangIdx = this._gangDataArr.length - 1;
            }
            this._currGangPaiVal = gangPaiVal;
        }

        // 修改UI
        let gangModel = this.nodeGang.getChildByTag(pGangIdx);
        gangModel.opacity = 255;
        this.game.mahjongRes.setGangVal(gangModel, gangPaiVal, gangType);

        // 减少牌数
        this.setPGangAfterHold(gangType, gangPaiVal, chiVal);
    }

    setPGangAfterHold(gangType: ErmjType.GangType, paiVal: number, chiVal?: number) {
        let minusNum = 0;
        if (ErmjType.GangType.GANG_TYPE_DARK === gangType) {
            minusNum = 4;
        } else if (ErmjType.GangType.GANG_TYPE_SHINE === gangType) {
            minusNum = 3;
        } else if (ErmjType.GangType.GANG_TYPE_ADD === gangType) {
            minusNum = 1;
        } else if (ErmjType.GangType.GANG_TYPE_PENG === gangType) {
            minusNum = 2;
        } else if (ErmjType.GangType.GANG_TYPE_CHI === gangType) {
            minusNum = 2;
        }
        if (this._holdPais) {
            let pais = []
            if (ErmjType.GangType.GANG_TYPE_CHI === gangType) {
                for (let i = 0; i < 3; i++) {
                    if (paiVal + i !== chiVal) {
                        pais.push(paiVal + i);
                    }
                }
            } else {
                for (let i = 0; i < minusNum; i++) {
                    pais.push(paiVal);
                }
            }
            for (const p of pais) {
                this._holdPais.splice(this._holdPais.indexOf(p), 1);
            }
        }
        this.setPaiRemainNum(minusNum);
    }

    quickSetPengGang(gangPaiVal: number, gangType: number) {
        this.cpg.push({
            pai: gangPaiVal,
            pingHuType: gangType as number,
        })
        if (ErmjType.GangType.GANG_TYPE_PENG === gangType) {
            this._gangDataArr.push(`p${gangPaiVal}`);
        } else if (ErmjType.GangType.GANG_TYPE_CHI === gangType) {
            this._gangDataArr.push(`c${gangPaiVal}`);
        } else {
            this._gangDataArr.push(`g${gangPaiVal}`);
        }

        let pGangIdx = this._gangDataArr.length - 1;
        let gangModel = this.nodeGang.getChildByTag(pGangIdx);
        gangModel.opacity = 255;
        this.game.mahjongRes.setGangVal(gangModel, gangPaiVal, gangType);

        this.quickGangAfter();
    }

    quickGangAfter() {
        this.setPaiRemainNum(3);
    }

    /**
     * 胡牌
     * @param huVal
     * @param isZm
     */
    async setPlayerHu(huVal: number, isZm: boolean, playAnim = true) {
        this._huShowPai.node.parent.active = true;
        this._huShowPai.spriteFrame = this.game.mahjongRes.getPaiSpriteFrame(huVal);
        this.hideDraw(isZm);

        // 在胡的牌上播放特效
        let nodeHuPai = this._huShowPai.node.parent;
        let worldPoint = nodeHuPai.convertToWorldSpaceAR(cc.v2(0, 0));
        let showPoint = this.node.convertToNodeSpaceAR(worldPoint);

        if (isZm) {
            this._zimoData = huVal;
        }
        if (playAnim) {
            this.nodeAnimHu.active = true;
            this.nodeAnimHu.setLocalZOrder(1);
            this.nodeAnimHu.setPosition(showPoint);
            this.game.playAnimHuEff(this.nodeAnimHu);

            if (isZm) {
                await this.game.playAnimZimo(this.getEffOptPos());
            } else {
                await this.game.playAnimHu(this.getEffOptPos());
            }
        }
        this.spriShowHu.node.active = true;
        this.spriShowHu.spriteFrame = isZm ? this.sfHuArr[1] : this.sfHuArr[0];
        this.spriShowHu.node.stopAllActions();
        if (playAnim) {
            this.spriShowHu.node.setPosition(this.nodeEff.getPosition());
            if (!this.isMe) {
                this.spriShowHu.node.runAction(cc.moveTo(1, this.nodeShowHu.getPosition()));
            }
        } else {
            this.spriShowHu.node.setPosition(this.nodeShowHu.getPosition());
        }
    }

    hideDraw(isZm: boolean) {
        this._newDrawPai.active = false;
    }

    quickSetPlayerHu(huVal: number, isZm: boolean) {
        this.setPlayerHu(huVal, isZm, false);
    }

    setDiscardHuStatus(paiVal: number) {
        let lastDiscard = this._discardDataArr[this._discardDataArr.length - 1];
        if (lastDiscard === paiVal) {
            let lastDiscardPai = this.nodeDiscard.getChildByTag(this._discardDataArr.length - 1);
            lastDiscardPai.getChildByName("hu").active = true;
        }
    }

    setDiscardLikeStatus(paiVal: number) {
        for (let valIdx = 0; valIdx < this._discardDataArr.length; valIdx++) {
            let disPaiVal = this._discardDataArr[valIdx];
            let lastDiscardPai = this.nodeDiscard.getChildByTag(valIdx);
            let discardCover = lastDiscardPai.getChildByName("discard");
            discardCover.active = false;
            if (disPaiVal === paiVal) {
                discardCover.active = true;
            }
        }
    }

    setHoldsResetStatus() { }

    /**
     *
     * @param cover 遮盖打了没叫的牌
     */
    coverUnTings(cover: boolean) { }


    setFace(hold: cc.Node, index: number) {
        if (this._holdPais) {
            hold.getChildByName('face').active = true;
            let sp = hold.getComponentsInChildren(cc.Sprite)[2];
            let fr = this.game.mahjongRes.getPaiSpriteFrame(this._holdPais[index]);
            sp.spriteFrame = fr;
        }
    }
    resetHoldsArray(showNewDraw: boolean = false) {
        if (this._holdPais && !showNewDraw) {
            this._holdPais.sort((a, b) => {
                return a - b
            })
        }
        this._newDrawPai.active = showNewDraw;
        this.setFace(this._newDrawPai, 0)

        let holdNum = showNewDraw ? this._holdNum : this._holdNum + 1;
        for (var index = 0; index <= this.HOLDS_NUM; index++) {
            let hold = this.nodeHold.getChildByTag(index);
            if (index < holdNum) {
                hold.opacity = 255;
                if (index === 0) {
                    hold.opacity = 0;
                } else {
                    let idx = index - (showNewDraw ? 0 : 1);
                    this.setFace(hold, idx);
                }
            } else {
                hold.opacity = 0;
            }
        }
    }

    noticeTurnOver(): void {
        // TODO:暂时没做
    }

}
