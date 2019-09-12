import { PokerAlgorithm } from "../game-share/dpPokerAlgorithm";
// 牌型
export enum CARD_TYPE {
    CT_ERROR = 0,			            //错误牌型
    CT_SINGLE,			                //单牌类型
    CT_DOUBLE,			                //对牌类型
    CT_THREE,			                //三条类型
    CT_SINGLE_STRAIGHT,		            //单连类型（连子）
    CT_DOUBLE_STRAIGHT,		            //对连类型（连对）
    CT_THREE_STRAIGHT,		            //三连类型（飞机）
    CT_THREE_TAKE_ONE,	                //三带一单
    CT_THREE_TAKE_TWO,	                //三带一对
    CT_FOUR_TAKE_ONE,	                //四带两单
    CT_FOUR_TAKE_TWO,	                //四带两对
    CT_THREE_STRAIGHT_ONE,	            //三连带单
    CT_THREE_STRAIGHT_TWO,	            //三连带对
    CT_BOMB,		                    //炸弹类型
    CT_ROCKET,	                        //王炸类型
}

const { ccclass, property } = cc._decorator;

@ccclass
export class DdzCardTools extends PokerAlgorithm {
    protected MIN_SINGLE_STRAIGHT_NUM = 5;
    protected MIN_DOUBLE_STRAIGHT_NUM = 6;
    protected MIN_THREE_STRAIGHT_NUM = 6;

    protected BOMB_TYPE = CARD_TYPE.CT_BOMB
    protected ROCKET_TYPE = CARD_TYPE.CT_ROCKET;


    constructor() {
        super();
        this.typeFuncArr =
            [this.isCardType1.bind(this), this.isCardType2.bind(this), this.isCardType3.bind(this),
            this.isCardType4.bind(this), this.isCardType5.bind(this), this.isCardType6.bind(this),
            this.isCardType7.bind(this), this.isCardType8.bind(this), this.isCardType9.bind(this),
            this.isCardType10.bind(this), this.isCardType11.bind(this), this.isCardType12.bind(this),
            this.isCardType13.bind(this), this.isCardType14.bind(this)];

        this.promptFuncArr =
            [this.promptCard1.bind(this), this.promptCard2.bind(this), this.promptCard3.bind(this),
            this.promptCard4.bind(this), this.promptCard5.bind(this), this.promptCard6.bind(this),
            this.promptCard7.bind(this), this.promptCard8.bind(this), this.promptCard9.bind(this),
            this.promptCard10.bind(this), this.promptCard11.bind(this), this.promptCard12.bind(this),
            this.promptCard13.bind(this)];

    }

}


