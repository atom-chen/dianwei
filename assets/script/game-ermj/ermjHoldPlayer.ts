import MjPaiModel from "./mjPaiModel";
import ErmjPlayer from "./ermjPlayer";
import ErmjGame from "./ermjGame";
import GameLogic from "./ermjGameLogic";
import * as ErmjType from "./ermj";
import TingHuPai, { CheckHuData, TingPaiData, HuPaiData } from "./ermjTingHuPai";
import Logic from "./ermjLogic";
import { PingHuType, HuPaiInfo } from "./ermjTypes";
import ErmjResult from "./ermjResult";

const { ccclass, property } = cc._decorator;

@ccclass
export default class ErmjHoldMgr extends ErmjPlayer {
    @property(cc.Node)
    private nodeCover: cc.Node = undefined;

    @property(cc.Node)
    private nodeCancel: cc.Node = undefined;

    private EXCHANGE_TOTAL = 3;

    private _paiModelArr: MjPaiModel[] = [];                             // 手牌集合
    private _currChooseSelfPai: MjPaiModel;
    private _selfNewDrawPai: MjPaiModel;                                 // 新摸到的牌
    protected _huShowPai: cc.Sprite;                                     //显示胡的牌
    private _gameLogic: GameLogic;


    private _currSelfQueSuit: number;                                    // 自己定缺
    private _paiValArr: number[] = [];                                   // 手牌数据集合
    private _exchangePaiSuit: number;                                     // 换三张的花色
    private _exchangePaiValArr: number[] = [];                            // 换三张数据

    // 状态
    private _isExchangePaiStatus = false;
    private _isDrawAnim = false;

    setXuanPaiStatus(visible: boolean) {
    }
    setQueStatus(visible: boolean) {
    }

    createHoldPai() {
        this._gameLogic = new GameLogic();
        for (let index = 0; index <= this.HOLDS_NUM; index++) {
            let model = this.game.mahjongRes.getHoldsModel(this.seat, 11);
            this.nodeHold.addChild(model);

            let paiModel = model.getComponent(MjPaiModel);
            paiModel.init(this, this.game);
            this._paiModelArr[index] = paiModel;
        }

        let showHu = this.getShowHuModel();
        showHu.setPosition(0, -90);
        this.nodeHold.addChild(showHu);

        this.commonUI();
        this.initRound();
    }

    resetData() {
        this._isExchangePaiStatus = false;
        this._isDrawAnim = false;
        this._exchangePaiValArr = [];
        this._paiValArr = [];
        this.holdsPaiArray(true);
    }

    initHold(holdData?: number[]) {
        cc.log("initHold = " + holdData);
        this._paiValArr = holdData;
        this.holdsPaiArray(true);
    }

    showNewDrawPai() {
        this._selfNewDrawPai = this._paiModelArr[this._paiValArr.length - 1];
        this._selfNewDrawPai.node.x = this.getPaiPosX(this._paiValArr.length - 1) + 30;

        if (!this.game.nodeBaoTingCover.active) {
            // 看打哪张牌才有叫
            let checkJiaoData = this.discardCheckJiao(this._paiValArr, this._gangDataArr);
            if (checkJiaoData.length) {
                this.showDiscardCheckJiao(checkJiaoData);
                this.game.baoTingPanel.show();
            }
        }

        if (this._isDrawAnim) {
            this._isDrawAnim = false;

            let moveDis = 100;
            this._selfNewDrawPai.setNormalY();
            let drawNode = this._selfNewDrawPai.node;
            drawNode.y += moveDis;
            drawNode.rotation = 100;
            drawNode.runAction(cc.sequence(
                cc.rotateTo(0.2, 0),
                cc.moveTo(0.2, drawNode.x, drawNode.y - moveDis),
            ));
        }
    }

    addHoldsPai(paiVal?: number) {
        this.holdsPaiArray(true);
        if (paiVal) {
            this._paiValArr.push(paiVal);
            this.holdsPaiArray(false);   // 新摸到的牌不参与排序
            this._isDrawAnim = true;
        }
        this.checkSelfGangPaiVal();
        this.showNewDrawPai();
    }

    setDiscard(pai: number, isTing: number) {
        this._discardDataArr.push(pai);
        let startPos: cc.Vec2;
        for (let index = 0; index < this._paiModelArr.length; index++) {
            let holdsPai = this._paiModelArr[index];
            let isSelected = holdsPai.isSelected;
            if (isSelected) {
                startPos = holdsPai.getMovePos();
                cc.log("找到打出的牌");
                break;
            }
        }
        if (startPos === undefined) {
            let holdsPai = this._paiModelArr[this._paiValArr.length - 1];
            startPos = cc.p(holdsPai.node.x, holdsPai.node.y);
        }
        // 转化为相对于Node坐标
        let worldPoint = this.nodeHold.convertToWorldSpaceAR(startPos);
        let showPoint = this.node.convertToNodeSpaceAR(worldPoint);
        this.discardAction(showPoint, pai);

        let needDelArr = this._paiValArr.filter(v => {
            return v === pai;
        }).slice(0, 1);
        this.removeSelfPai(needDelArr);

        if (isTing) {
            this.game.nodeBaoTingCover.active = true;
            this.baoTing();
        }
        this.game.baoTingPanel.hide();
        this.game.currOptPlayer = -1;
    }

    setAutoDiscard() {
        let paiTotal = this._paiValArr.length;
        if (paiTotal % 3 === 2) {
            this.scheduleOnce(() => {
                this.game.msg.sendOutPai(this._paiValArr[paiTotal - 1]);
            }, 3);
        }
    }

    setPGangAfterHold(gangType: ErmjType.GangType, paiVal: number, chiVal?: number) {
        let needPaiValArr: number[] = [];
        let samePaiValArr = this._paiValArr.filter(v => {
            return (paiVal === v);
        });
        if (ErmjType.GangType.GANG_TYPE_PENG === gangType) {
            needPaiValArr = samePaiValArr.slice(0, 2);
        } else if (ErmjType.GangType.GANG_TYPE_CHI === gangType) {
            for (let i = 0; i < 3; i++) {
                if (paiVal + i !== chiVal) {
                    needPaiValArr.push(paiVal + i);
                }
            }
        } else {
            needPaiValArr = samePaiValArr;
        }

        this.removeSelfPai(needPaiValArr);
        this.holdsPaiArray(true);
    }

    hideDraw(isZm: boolean) {
        if (isZm) {
            this._paiValArr.pop();
            this.holdsPaiArray(true);
        }
        this._huShowPai.node.parent.x = this.getPaiPosX(this._paiValArr.length - 1) + 85;
    }

    quickGangAfter() {
        this.holdsPaiArray(true);
    }


    /**
     * 选出同花色低于三张的所有牌
     * @param paiValArr
     */
    getNumUnderThreeValArr(paiValArr: number[]): number[] {
        // 先按同花色分类
        let allSuitArr: { [seat: number]: number[] } = [];
        for (let index = 1; index <= 3; index++) {
            allSuitArr[index] = [];
        }
        for (let paiIdx = 0; paiIdx < paiValArr.length; paiIdx++) {
            let paiVal = paiValArr[paiIdx];
            let suit = Math.floor(paiVal / 10);
            allSuitArr[suit].push(paiVal);
        }

        // 选出低于三张的
        let resultValArr: number[] = [];
        for (let suitIdx = 1; suitIdx <= 3; suitIdx++) {
            let paiArr = allSuitArr[suitIdx];
            if (paiArr.length < 3) {
                for (let index = 0; index < paiArr.length; index++) {
                    resultValArr.push(paiArr[index]);
                }
            }
        }
        return resultValArr;
    }

    /**
     * 从手牌中删除牌
     * @param needRemoveValArr
     */
    removeSelfPai(needRemoveValArr: number[]) {
        needRemoveValArr.sort(this.paiSortFunc);
        this._paiValArr.sort(this.paiSortFunc);

        needRemoveValArr.forEach(element => {
            let idx = this._paiValArr.indexOf(element);
            if (idx > -1)
                this._paiValArr.splice(idx, 1);
        });

        this.holdsPaiArray(true);

        // 自己出单牌后，判断是否有叫来隐藏查叫提示和提示按钮
        if (needRemoveValArr.length === 1) {
            let pengGangDataArr = this._gangDataArr;
            let isTingPai = this.checkJiao(this._paiValArr, pengGangDataArr, this._currSelfQueSuit);
            if (isTingPai.length) {
                this.game.setTingData(isTingPai);
                this.game.showTingPanel(false);
            }
            else {
                this.game.tingPanel.active = false;
            }
        }
    }

    tipJiaos() {
        let isTingPai = this.checkJiao(this._paiValArr, this.gangDataArr, this._currSelfQueSuit);
        if (isTingPai.length) {
            this.game.setTingData(isTingPai);
            this.game.showTingPanel(false);
        }
    }

    /**
     * 自己杠牌的值
     */
    checkSelfGangPaiVal(): ErmjType.SaveDiscardInfo {
        // 计算自己可杠的牌
        let paiNumArr: { [u: number]: number } = [];
        let gangValArr: number[] = [];
        // 碰过的牌中查找
        let pengGangDataArr = this._gangDataArr;
        if (pengGangDataArr.length > 0) {
            for (let gangIdx = 0; gangIdx < pengGangDataArr.length; gangIdx++) {
                let gangInfo = pengGangDataArr[gangIdx];
                if ((gangInfo.indexOf("p") >= 0)) {
                    let realVal = parseInt(gangInfo.substr(1));
                    if (paiNumArr[realVal] === undefined)
                        paiNumArr[realVal] = 0;
                    paiNumArr[realVal] += 3;
                }
            }
        }
        let pengs = [];
        for (const k in paiNumArr) {
            pengs.push(+k);
        }
        // 手牌中查找
        for (let valIdx = 0; valIdx < this._paiValArr.length; valIdx++) {
            let val = this._paiValArr[valIdx];
            if (paiNumArr[val] === undefined)
                paiNumArr[val] = 0;
            paiNumArr[val] += 1;
        }
        let isCanGang = false;
        for (let key in paiNumArr) {
            if (paiNumArr.hasOwnProperty(key)) {
                let num = paiNumArr[key];
                if (num >= 4) {
                    isCanGang = true;
                    gangValArr.push(+key);
                    console.log("可以杠的值 = " + key);
                }
            }
        }

        let lastDiscardInfo: ErmjType.SaveDiscardInfo = {
            outPos: -1,
            outPaiVal: []
        };
        if (isCanGang) {
            lastDiscardInfo.outPos = this.serverPos;
            lastDiscardInfo.outPaiVal = gangValArr.concat();
        }

        if (this.game.nodeBaoTingCover.active) {
            let thp = new TingHuPai;

            let pais = this._paiValArr.concat();
            pais.pop();
            let baoTingNeeds = thp.getNeeds(pais).toString();

            for (let i = lastDiscardInfo.outPaiVal.length - 1; i > -1; i--) {
                let v = lastDiscardInfo.outPaiVal[i];
                let newPais = thp.splicedArray(this._paiValArr, [v]);
                if (pengs.indexOf(v) < 0) {
                    newPais = thp.splicedArray(newPais, [v, v, v]);
                }
                let newNeeds = thp.getNeeds(newPais).toString();
                if (newNeeds !== baoTingNeeds) {
                    lastDiscardInfo.outPaiVal.splice(i, 1);
                }
            }
        }
        return lastDiscardInfo;
    }

    /**
     * 自己吃牌的值
     */
    checkSelfChiPaiVal(val: number) {
        // 计算自己可吃的牌
        let ret = []
        let toCheckOffsets = [[-2, -1], [-1, 1], [1, 2]];
        for (let i = 0; i < 3; i++) {
            if (this._paiValArr.indexOf(val + toCheckOffsets[i][0]) >= 0) {
                if (this._paiValArr.indexOf(val + toCheckOffsets[i][1]) >= 0) {
                    ret.push(i + val - 2);
                }
            }
        }
        return ret;
    }

    isWaitingDraw(): boolean {
        if (this._paiValArr.length % 3 === 2)
            return true;
        return false;
    }

    setPaisCanClick(can: boolean) {
        for (let paiIdx = 0; paiIdx <= this.HOLDS_NUM; paiIdx++) {
            if (paiIdx < this._paiValArr.length) {
                let holdsPai = this._paiModelArr[paiIdx];
                holdsPai.setCanClick(can);
            }
        }
    }

    /**
     * 客户端判断可出牌
     */
    clientOutPai(outHoldsPai: MjPaiModel) {
        this._currChooseSelfPai = undefined;
        this.showLikeDiscard(0);

        // 轮到自己才能出牌
        if (this.game.currOptPlayer === this.serverPos) {
            outHoldsPai.setSelectedStatus(true, true);
            for (let index = 0; index < this._paiModelArr.length; index++) {
                let holdsPai = this._paiModelArr[index];
                if (holdsPai != outHoldsPai)
                    holdsPai.setSelectedStatus(false);
            }

            let ting = this.game.baoTingPanel.isToBao() ? 1 : 0;
            this.game.msg.sendOutPai(outHoldsPai.paiVal, ting);
            this.game.currOptPlayer = -1;

            // 打此牌是否有叫
            if (outHoldsPai.isHaveJiao) {
                this.game.setTingData(outHoldsPai.getTingPaiData());
                this.game.showTingPanel(false);
            }
        } else {
            outHoldsPai.setSelectedStatus(false);
        }
    }

    /**
     * 正在点击的牌
     * @param selfPai
     */
    clickSelfPai(selfPai: MjPaiModel) {
        let beforeClickPai: MjPaiModel = this._currChooseSelfPai;
        this._currChooseSelfPai = selfPai;
        // 判断是否再次点击相同的牌
        if (beforeClickPai === this._currChooseSelfPai) {
            this.clientOutPai(this._currChooseSelfPai);
        } else {
            for (let paiIdx = 0; paiIdx < this._paiModelArr.length; paiIdx++) {
                let holdsPai = this._paiModelArr[paiIdx];
                if (holdsPai !== selfPai)
                    holdsPai.setSelectedStatus(false);
            }

            // 打此牌是否有叫
            if (selfPai.isHaveJiao) {
                this.game.setTingData(selfPai.getTingPaiData());
                this.game.showTingPanel(false);
            } else {
                this.game.tingPanel.active = false;
            }
            this.showLikeDiscard(selfPai.paiVal);
        }
    }

    /**
    * 和自己将打出的牌相同的牌高亮显示
    * @param discardVal
    */
    showLikeDiscard(discardVal: number) {
        for (let rPos = 0; rPos < this.game.playerMgr.getPlayerCount(); rPos++) {
            let player = this.game.playerMgr.getPlayerByServerPos(rPos);
            player.setDiscardLikeStatus(discardVal);
        }
    }

    setPaiRemainNum(minusNum: number) {
    }

    /**
     * 重置自己手牌状态
     */
    setHoldsResetStatus() {
        if (this._currChooseSelfPai) {
            this._currChooseSelfPai = undefined;
            for (let paiIdx = 0; paiIdx <= this.HOLDS_NUM; paiIdx++) {
                let holdsPai = this._paiModelArr[paiIdx];
                holdsPai.setSelectedStatus(false);
            }
            this.showLikeDiscard(0);
        }
    }

    coverUnTings(cover: boolean) {
        for (let paiIdx = 0; paiIdx <= this.HOLDS_NUM; paiIdx++) {
            if (paiIdx < this._paiValArr.length) {
                let holdsPai = this._paiModelArr[paiIdx];
                holdsPai.setCoverVisible(cover && !holdsPai.isHaveJiao);
            }
        }
    }

    /**
     * 自己的手牌排序
     * @param isResetSort 是否重新排序
     */
    holdsPaiArray(isResetSort: boolean) {
        // 排序
        if (isResetSort) {
            this._paiValArr.sort(this.paiSortFunc)
        }

        // 修改牌值
        for (let paiIdx = 0; paiIdx <= this.HOLDS_NUM; paiIdx++) {
            let holdsPai = this._paiModelArr[paiIdx];
            holdsPai.resetStatus();
            if (paiIdx < this._paiValArr.length) {
                holdsPai.node.active = true;
                holdsPai.node.x = this.getPaiPosX(paiIdx);
                holdsPai.paiVal = this._paiValArr[paiIdx];
                if (paiIdx === (this._paiValArr.length - 1)) {
                    this._selfNewDrawPai = holdsPai;
                }

            } else
                holdsPai.node.active = false;
        }
        this._currChooseSelfPai = undefined;
    }

    animate() {
        for (let paiIdx = 0; paiIdx <= this.HOLDS_NUM; paiIdx++) {
            let holdsPai = this._paiModelArr[paiIdx];
            if (paiIdx < this._paiValArr.length) {
                holdsPai.node.opacity = 0;
                holdsPai.node.y += 20;
                holdsPai.node.runAction(cc.sequence(
                    cc.delayTime(paiIdx * .2),
                    cc.spawn(
                        cc.moveBy(.2, 0, -20),
                        cc.fadeIn(.2)
                    )
                ))
            }
        }
    }

    getPaiPosX(paiNum: number) {
        let leftDis = this._gangDataArr.length * 180;
        let dis = 76;
        let x = leftDis + dis * 0.5 + paiNum * dis;
        return x;
    }


    paiSortFunc(a: number, b: number): number {
        return a - b;
    }

    /////////////////////////////////////胡、听牌
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
        for (let valIdx = 0; valIdx < this._paiValArr.length; valIdx++) {
            let paiVal = this._paiValArr[valIdx];
            if (paiVal === tingVal)
                remainNum -= 1;
        }

        return remainNum;
    }

    // 显示打出哪张牌有叫
    showDiscardCheckJiao(checkHuDataArr: CheckHuData[]) {
        for (var dataIdx = 0; dataIdx < checkHuDataArr.length; dataIdx++) {
            let checkdata = checkHuDataArr[dataIdx];
            for (let paiIdx = 0; paiIdx < this._paiValArr.length; paiIdx++) {
                let holdsPai = this._paiModelArr[paiIdx];
                let paiVal = holdsPai.paiVal;
                if ((checkdata.discard === paiVal) && (!holdsPai.isHaveJiao)) {
                    holdsPai.setJiaoShow(true, checkdata.tingDataArr);
                }
            }
        }
    }

    // 将手牌和碰杠牌合并整理
    arrangePai(holdsPaiValArr: number[], pengGangDataArr: string[]): string[] {
        let allTiles: string[] = new Array();
        for (let index = 0; index < holdsPaiValArr.length; index++) {
            let paiVal = holdsPaiValArr[index];
            allTiles.push(paiVal.toString());
        }
        for (let index = 0; index < pengGangDataArr.length; index++) {
            let paiVal = pengGangDataArr[index];
            allTiles.push(paiVal);
        }
        return allTiles;
    }

    /**
     *  [
     *      [
     *          discard,
     *          [[tingPai, baseFan, RemainingNum], [tingPai, baseFan, RemainingNum]]
     *      ],
     *      [
     *          discard,
     *          [[tingPai, baseFan, RemainingNum], [tingPai, baseFan, RemainingNum]]
     *      ],
     *  ]
     */
    // 打哪张牌才下叫
    discardCheckJiao(holdsPaiValArr: number[], pengGangDataArr: string[]): CheckHuData[] {
        let tingHuPai = new TingHuPai();
        let discards = tingHuPai.getDiscards(holdsPaiValArr);

        let checkHuDataArr = [];
        for (const dis of discards) {
            let tingDataArr = [];
            for (const ne of dis.nes) {
                let holds = holdsPaiValArr.concat();
                holds.splice(holds.indexOf(dis.dis), 1);

                tingDataArr.push({
                    tingPai: ne,
                    baseFan: this.getFan(holds, ne),
                    RemainingNum: this.getTingPaiRemainNum(ne),
                })
            }
            checkHuDataArr.push({
                discard: dis.dis,
                tingDataArr: tingDataArr,
            });
        }
        return checkHuDataArr;

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
        let logic = new Logic;
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
        // cc.log('fanshu',types.map(t=>(new ErmjResult).HU_DESC_ARR[t]),this.cpg)
        return logic.GetFan(types);
    }

    checkJiao(holdsPaiValArr: number[], pengangDataArr: string[], queSuit?: number): TingPaiData[] | undefined {
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

    // 是否胡牌
    isHuPai(): boolean {
        let holdsPaiValArr = this._paiValArr;
        let pengGangDataArr = this._gangDataArr;
        let allTiles = this.arrangePai(holdsPaiValArr, pengGangDataArr);
        let tingHuPai = new TingHuPai();
        if (holdsPaiValArr.length % 3 === 2) {
            // 是否胡牌
            let huData = tingHuPai.Hupai(allTiles, false, this._currSelfQueSuit);
            if (huData.baseFan !== -1)
                return true;
        }
        return false;
    }
}
