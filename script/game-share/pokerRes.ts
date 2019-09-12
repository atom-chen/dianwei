import * as util from "../common/util";
export enum DdzCardPoint {
    POINT_3 = 3,
    POINT_4 = 4,
    POINT_5 = 5,
    POINT_6 = 6,
    POINT_7 = 7,
    POINT_8 = 8,
    POINT_9 = 9,
    POINT_10 = 10,
    POINT_J = 11,
    POINT_Q = 12,
    POINT_K = 13,
    POINT_A = 14,
    POINT_2 = 16,
    POINT_SMALL_JOKER = 18,
    POINT_BIG_JOKER = 20,

}

export enum HHCardPoint {
    CARD_POINT_2 = 2,
    CARD_POINT_3 = 3,
    CARD_POINT_4 = 4,
    CARD_POINT_5 = 5,
    CARD_POINT_6 = 6,
    CARD_POINT_7 = 7,
    CARD_POINT_8 = 8,
    CARD_POINT_9 = 9,
    CARD_POINT_10 = 10,
    CARD_POINT_J = 11,
    CARD_POINT_Q = 12,
    CARD_POINT_K = 13,
    CARD_POINT_A = 14,
}

const { ccclass, property } = cc._decorator;

@ccclass
export default class PokerRes extends cc.Component {
    private _pokerModel: cc.Node;
    private _jokerModel: cc.Node;
    private _ddzModel: cc.Node;
    private _hhModel: cc.Node;

    private _resources: cc.Node;
    get pokerModel() {
        if (!this._pokerModel) {
            this._pokerModel = this.node.getChildByName("poker");
        }
        return this._pokerModel;
    }
    get jokerModel() {
        if (!this._jokerModel) {
            this._jokerModel = this.node.getChildByName("poker_joker");
        }
        return this._jokerModel;
    }
    get ddzModel() {
        if (!this._ddzModel) {
            this._ddzModel = this.node.getChildByName("poker_ddz");
        }
        return this._ddzModel;
    }

    get hhModel() {
        if (!this._hhModel) {
            this._hhModel = this.node.getChildByName("poker_hh");
        }
        return this._hhModel;
    }

    get resources() {
        if (!this._resources) {
            this._resources = this.node.getChildByName("res");
        }
        return this._resources;
    }

    onLoad() {
        // init logic
    }

    private copySprite(from: cc.Node, to: cc.Node) {
        to.getComponent(cc.Sprite).spriteFrame = from.getComponent(cc.Sprite).spriteFrame;
    }

    private getColor(suit: number) {
        if (!suit) {
            return;
        }
        return suit % 2 === 1 ? "black" : "red";
    }

    getJoker(joker: number) {
        if (joker !== 1 && joker !== 2) {
            cc.error("错误的参数：", joker);
            return;
        }
        let base = util.instantiate(this.jokerModel);
        let resCenter = this.resources.getChildByName("joker").getChildByName(joker.toString());
        let baseCenter = base.getChildByName("front").getChildByName("center");
        this.copySprite(resCenter, baseCenter);
        base.setPosition(0, 0);
        return base;
    }

    private getBack() {
        let base = util.instantiate(this.pokerModel);
        let baseFront = base.getChildByName("front");
        let baseBack = base.getChildByName("back");
        let baseMagic = base.getChildByName("magic");
        baseFront.active = false;
        baseBack.active = true;
        if (baseMagic) {
            baseMagic.active = false;
        }
        return base;
    }

    getCard(suit: number, num: number) {
        if (suit === 0 && num === 0) {
            return this.getBack();
        }
        if (suit < 0 || suit > 4 || num < 1 || num > 13) {
            cc.error("错误的参数：", suit, num);
            return;
        }
        let cardColor = this.getColor(suit);
        let base = util.instantiate(this.pokerModel);
        let baseFront = base.getChildByName("front");

        let baseSuit = baseFront.getChildByName("suit");
        let resSuit = this.resources.getChildByName("suit").getChildByName(suit.toString());
        if (baseSuit) {
            this.copySprite(resSuit, baseSuit);
        }

        if (cardColor) {
            let resCenter: cc.Node;
            if (num < 11) {
                resCenter = resSuit;
            } else {
                resCenter = this.resources.getChildByName(`role_${cardColor}`).getChildByName(num.toString());
            }
            let baseCenter = baseFront.getChildByName("center");
            this.copySprite(resCenter, baseCenter);
        }

        let baseNum = baseFront.getChildByName("number");
        if (baseNum) {
            let resNum = this.resources.getChildByName(`num_${cardColor || "red"}`).getChildByName(num.toString());
            this.copySprite(resNum, baseNum);
        }

        let baseMagic = base.getChildByName("magic");
        baseMagic.active = false;

        base.setPosition(0, 0);
        return base;
    }

    getMagic(suit: number, num: number, joker: number) {
        if (suit === 0 && num === 0) {
            return this.getBack();
        }
        if (suit < 0 || suit > 4 || num < 1 || num > 13) {
            cc.error("错误的参数：", suit, num);
            return undefined;
        }
        if (joker !== 0 && joker !== 1 && joker !== 2) {
            cc.error("错误的参数：", joker);
            return undefined;
        }
        let base = this.getCard(suit, num);
        if (base) {
            let baseFront = base.getChildByName("front");
            let resMagic = this.resources.getChildByName("magic");
            let resFront = resMagic.getChildByName("front");
            this.copySprite(resFront, baseFront);

            if (joker) {
                let baseMagic = base.getChildByName("magic");
                let resMagicMark = resMagic.getChildByName(`joker_${joker}`);
                this.copySprite(resMagicMark, baseMagic);
                baseMagic.active = true;
            }
        }
        return base;
    }

    // ---------------------------------------斗地主
    getCardNumber(realPoint: number) {
        let cardNumber: number = DdzCardPoint.POINT_A;
        if (realPoint === DdzCardPoint.POINT_A) {
            cardNumber = 1;
        } else if (realPoint === DdzCardPoint.POINT_2) {
            cardNumber = 2;
        } else {
            cardNumber = realPoint;
        }
        return cardNumber;
    }

    getDdzCard(cardData: number) {
        if (cardData === 0) {
            return this.getBack();
        }
        let base = util.instantiate(this.ddzModel);
        this.setDdzCard(base, cardData);
        return base;
    }

    setDdzCard(card: cc.Node, cardData: number) {
        let baseFront = card.getChildByName("front");
        let normal = baseFront.getChildByName("normal");
        let joker = baseFront.getChildByName("joker");
        let dealerLogo = baseFront.getChildByName("dealer");
        dealerLogo.active = false;
        let firstLogo = baseFront.getChildByName("first");
        firstLogo.active = false;

        // 判断是否王牌
        let realPoint: number = cardData & 0xff;
        if (realPoint === DdzCardPoint.POINT_SMALL_JOKER || realPoint === DdzCardPoint.POINT_BIG_JOKER) {
            joker.active = true;
            normal.active = false;
            let jokerSuit: number = realPoint === DdzCardPoint.POINT_SMALL_JOKER ? 1 : 2; // 大小王
            let resJoker = this.resources.getChildByName("joker").getChildByName(jokerSuit.toString());
            this.copySprite(resJoker, joker);
            let magic = joker.getChildByName("magic");
            let resMagic = this.resources.getChildByName("magic").getChildByName(`joker_${jokerSuit}`);
            this.copySprite(resMagic, magic);
        } else {
            normal.active = true;
            joker.active = false;
            let baseSuit = normal.getChildByName("suit");
            let suit: number = cardData >> 8; // 花色
            let resSuit = this.resources.getChildByName("suit").getChildByName(suit.toString());
            if (baseSuit) {
                this.copySprite(resSuit, baseSuit);
            }

            let baseCenter = normal.getChildByName("center");
            let cardColor = this.getColor(suit);
            let cardNumber = this.getCardNumber(realPoint);
            let resCenter: cc.Node;
            if (cardNumber < 11) {
                resCenter = resSuit;
            } else {
                resCenter = this.resources.getChildByName(`role_${cardColor}`).getChildByName(cardNumber.toString());
            }
            this.copySprite(resCenter, baseCenter);

            let baseNumber = normal.getChildByName("number");
            let resNum = this.resources.getChildByName(`num_${cardColor}`).getChildByName(cardNumber.toString());
            this.copySprite(resNum, baseNumber);
        }
    }

    // ---------------------------------------红黑
    private getHHColor(suit: number) {
        if (!suit) {
            return;
        }
        return suit % 2 === 0 ? "black" : "red";
    }

    getHHCardNumber(realPoint: number) {
        let cardNumber: number = HHCardPoint.CARD_POINT_A;
        if (realPoint === HHCardPoint.CARD_POINT_A) {
            cardNumber = 1;
        } else {
            cardNumber = realPoint;
        }
        return cardNumber;
    }

    getHHCard(cardData: number) {
        if (cardData === 0) {
            return this.getBack();
        }
        let base = util.instantiate(this.hhModel);
        this.setHHCard(base, cardData);
        return base;
    }

    setHHCard(card: cc.Node, cardData: number) {
        let baseFront = card.getChildByName("front");
        let baseBack = card.getChildByName("back");
        baseBack.active = false;

        let realPoint: number = cardData & 0x0f;
        let baseSuit = baseFront.getChildByName("suit");
        let suit: number = cardData >> 4; // 花色
        let resSuit = this.resources.getChildByName("hhSuit").getChildByName(suit.toString());
        if (baseSuit) {
            this.copySprite(resSuit, baseSuit);
        }

        let baseCenter = baseFront.getChildByName("center");
        let cardColor = this.getHHColor(suit);
        let cardNumber = this.getHHCardNumber(realPoint);
        let resCenter: cc.Node;
        if (cardNumber < 11) {
            resCenter = resSuit;
        } else {
            resCenter = this.resources.getChildByName(`role_${cardColor}`).getChildByName(cardNumber.toString());
        }
        this.copySprite(resCenter, baseCenter);

        let baseNumber = baseFront.getChildByName("number");
        let resNum = this.resources.getChildByName(`num_${cardColor}`).getChildByName(cardNumber.toString());
        this.copySprite(resNum, baseNumber);
    }

    setBack(card: cc.Node) {
        let baseBack = card.getChildByName("back");
        baseBack.active = true;
    }
}
