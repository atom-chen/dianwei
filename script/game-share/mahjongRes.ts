import * as util from "../common/util";
export enum GangType {
    GANG_TYPE_DARK = 1,             // 暗杠
    GANG_TYPE_SHINE = 2,            // 点杠
    GANG_TYPE_ADD = 3,              // 巴杠
    GANG_TYPE_PENG = 4,
    GANG_TYPE_CHI,
    GANG_RETURN_TAX = 5,
}

const { ccclass, property } = cc._decorator;

@ccclass
export default class MahjongRes extends cc.Component {
    @property([cc.Node])
    private resPaiArr: cc.Node[] = [];

    @property([cc.Node])
    private resGangBackArr: cc.Node[] = [];

    // 手牌
    @property([cc.Node])
    private nodeHoldArr: cc.Node[] = [];

    // 弃牌区
    @property([cc.Node])
    private nodeDiscardArr: cc.Node[] = [];

    // 碰杠
    @property([cc.Node])
    private nodeGangArr: cc.Node[] = [];

    // 胡牌
    @property([cc.Node])
    private nodeHuArr: cc.Node[] = [];


    private _paiSFArr: cc.SpriteFrame[][] = undefined;
    private _gangSFArr: cc.SpriteFrame[] = undefined;
    private _gangBackSFArr: cc.SpriteFrame[] = undefined;

    get paiSFArr() {
        if (!this._paiSFArr) {
            this._paiSFArr = [];
            for (let idx1 = 0; idx1 < this.resPaiArr.length; idx1++) {
                let paiArr = this.resPaiArr[idx1];
                let tempArr: cc.SpriteFrame[] = [];
                for (let idx2 = 1; idx2 <= paiArr.childrenCount; idx2++) {
                    let sf = paiArr.getChildByName(idx2.toString()).getComponent(cc.Sprite).spriteFrame;
                    tempArr[idx2] = sf;
                }
                this._paiSFArr[idx1] = tempArr;
            }
        }
        return this._paiSFArr;
    }

    get gangSFArr() {
        if (!this._gangSFArr) {
            this._gangSFArr = [];
            for (let idx = 0; idx < this.nodeGangArr.length; idx++) {
                let element = this.nodeGangArr[idx];
                this._gangSFArr[idx] = element.getComponentInChildren(cc.Sprite).spriteFrame;
            }
        }
        return this._gangSFArr;
    }

    get gangBackSFArr() {
        if (!this._gangBackSFArr) {
            this._gangBackSFArr = [];
            for (let idx = 0; idx < this.resGangBackArr.length; idx++) {
                let element = this.resGangBackArr[idx];
                this._gangBackSFArr[idx] = element.getComponent(cc.Sprite).spriteFrame;
            }
        }
        return this._gangBackSFArr;
    }

    private setSpriteFrame(sprite: cc.Sprite, paiVal: number) {
        if (!sprite || !paiVal)
            return;
        sprite.spriteFrame = this.getPaiSpriteFrame(paiVal);
    }

    // 牌面
    getPaiSpriteFrame(paiVal: number) {
        if (!paiVal)
            return;
        let suit = Math.floor(paiVal / 10);
        let rank = paiVal % 10;
        return this.paiSFArr[suit - 1][rank];
    }

    // 手牌
    getHoldsModel(seat: number, paiVal?: number) {
        if (seat < 0)
            return;

        let model = util.instantiate(this.nodeHoldArr[seat]);
        if (paiVal !== undefined) {
            let pai = model.getComponentInChildren(cc.Sprite);
            this.setSpriteFrame(pai, paiVal);
        }
        return model;
    }

    // 弃牌
    getDiscardModel(seat: number, paiVal: number) {
        if (seat < 0 || !paiVal)
            return;
        let model = util.instantiate(this.nodeDiscardArr[seat]);
        let pai = model.getComponentInChildren(cc.Sprite);
        this.setSpriteFrame(pai, paiVal);
        return model;
    }

    getPengModel(seat: number, paiVal: number) {
        if (seat < 0 || !paiVal)
            return;
        let model = util.instantiate(this.nodeGangArr[seat]);
        model.name = seat.toString();
        this.setGangVal(model, paiVal, GangType.GANG_TYPE_PENG);
        return model;
    }

    getGangModel(seat: number, paiVal: number, gangType: number) {
        if (seat < 0 || !paiVal)
            return;
        let model = util.instantiate(this.nodeGangArr[seat]);
        model.name = seat.toString();
        this.setGangVal(model, paiVal, gangType);
        return model;
    }

    getHuModel(seat: number) {
        if (seat < 0)
            return;
        let model = util.instantiate(this.nodeHuArr[seat]);
        return model;
    }

    setGangVal(model: cc.Node, paiVal: number, gangType: number) {
        if (GangType.GANG_TYPE_DARK === gangType) {
            this.showGang(model, paiVal, false, true);
        } else if (GangType.GANG_TYPE_SHINE === gangType) {
            this.showGang(model, paiVal, true, false);
        } else if (GangType.GANG_TYPE_ADD === gangType) {
            this.showGang(model, paiVal, true, true);
        } else if (GangType.GANG_TYPE_PENG === gangType) {
            this.showGang(model, paiVal, true, false, false);
        } else if (GangType.GANG_TYPE_CHI === gangType) {
            this.showGang(model, paiVal, true, false, false, 1);
        }
    }

    /**
     * 
     * @param model 
     * @param paiVal 
     * @param firstRowPaiUp 前三张牌是否向上
     * @param secondRowPaiUp 最后一张牌是否向上
     */
    showGang(model: cc.Node, paiVal: number, firstRowPaiUp: boolean, secondRowPaiUp: boolean, isGang = true, dVal = 0) {
        let seat = +model.name;
        for (let idx = 1; idx <= model.childrenCount; idx++) {
            let node = model.getChildByName(idx.toString());
            let nodePai = node.getComponent(cc.Sprite);
            let pai = node.getComponentInChildren(cc.Sprite);
            node.active = true;
            if (idx < model.childrenCount) {
                pai.node.active = firstRowPaiUp;
                let sf = firstRowPaiUp ? this.gangSFArr[seat] : this.gangBackSFArr[seat];
                nodePai.spriteFrame = sf;
            } else {
                pai.node.active = secondRowPaiUp;
                let sf = secondRowPaiUp ? this.gangSFArr[seat] : this.gangBackSFArr[seat];
                nodePai.spriteFrame = sf;
            }
            this.setSpriteFrame(pai, paiVal + (idx - 1) * dVal);

            if (!isGang && idx === model.childrenCount)
                node.active = false;
        }
    }

}
