import { PointNum, PokerAlgorithm } from "../game-share/dpPokerAlgorithm";
// 牌型
export enum CARD_TYPE {
    CT_ERROR = 0,                 //错误牌型
    CT_SINGLE = 1,                //单牌类型
    CT_DOUBLE = 2,                //对牌类型
    CT_THREE = 3,                 //三条类型
    CT_SINGLE_STRAIGHT = 4,       //单连类型（连子）
    CT_DOUBLE_STRAIGHT = 5,       //对连类型（连对）
    CT_THREE_STRAIGHT = 6,        //三连类型
    CT_THREE_TAKE_ONE = 7,        //三带一单
    CT_THREE_TAKE_TWO = 8,        //三带两单
    CT_FOUR_TAKE_ONE = 9,         //四带一
    CT_FOUR_TAKE_TWO = 10,         //四带二
    CT_FOUR_TAKE_THREE = 11,       //四带三
    CT_THREE_STRAIGHT_ONE = 12,   //三连带单
    CT_THREE_STRAIGHT_TWO = 13,   //三连带两单
    CT_BOMB = 14,                 //炸弹类型
    CT_ROCKET,	                   //王炸类型

}

const { ccclass, property } = cc._decorator;

@ccclass
export class PdkCardTools extends PokerAlgorithm {
    protected MIN_SINGLE_STRAIGHT_NUM = 5;
    protected MIN_DOUBLE_STRAIGHT_NUM = 4;
    protected MIN_THREE_STRAIGHT_NUM = 6;

    protected BOMB_TYPE = CARD_TYPE.CT_BOMB
    protected ROCKET_TYPE = CARD_TYPE.CT_ROCKET;

    constructor() {
        super();
        this.typeFuncArr =
            [this.isCardType1.bind(this), this.isCardType2.bind(this), this.isCardType3.bind(this),
            this.isCardType4.bind(this), this.isCardType5.bind(this), this.isCardType6.bind(this),
            this.isCardType7.bind(this), this.isCardType15.bind(this), this.isCardType16.bind(this),
            this.isCardType17.bind(this), this.isCardType18.bind(this), this.isCardType11.bind(this),
            this.isCardType19.bind(this), this.isCardType13.bind(this),];

        this.promptFuncArr =
            [this.promptCard1.bind(this), this.promptCard2.bind(this), this.promptCard3.bind(this),
            this.promptCard4.bind(this), this.promptCard5.bind(this), this.promptCard6.bind(this),
            this.promptCard7.bind(this), this.promptCard14.bind(this), this.promptCard15.bind(this),
            this.promptCard16.bind(this), this.promptCard17.bind(this), this.promptCard11.bind(this),
            this.promptCard18.bind(this), this.promptCard13.bind(this)];

    }

    protected isContainBomb(num: number) {
        return num <= this.FOUR_NUM;
    }

    /**
     * 四带类型
     * @param cardData 
     * @param pointNumArr 
     * @param takeNum 
     */
    private isFourTakeType(cardData: number[], pointNumArr: PointNum[], takeNum: number) {
        let fourNumPoint = 0;
        for (let pointData of pointNumArr) {
            if (pointData.num === this.FOUR_NUM) {
                fourNumPoint = pointData.point;
            }
        }
        if (fourNumPoint) {
            let dataLength = cardData.length;
            if (dataLength === (this.FOUR_NUM + takeNum)) {
                return fourNumPoint;
            }
        }
        return 0;
    }

    /**
     * 三带两单
     */
    protected isCardType15(cardData: number[], pointNumArr: PointNum[]) {
        cc.log("---------------------CardType--三带两单--");
        let dataLength = cardData.length;
        if (dataLength === 5) {
            let threeNumPoint = 0;
            for (let pointData of pointNumArr) {
                if (pointData.num === this.THREE_NUM) {
                    threeNumPoint = pointData.point;
                }
            }
            // 两个或三个不相同的牌面点数(可以是一对或两单)
            if (threeNumPoint) {
                return threeNumPoint;
            }
        }
        return 0;
    }

    /**
     * 四带一
     */
    protected isCardType16(cardData: number[], pointNumArr: PointNum[]) {
        cc.log("---------------------CardType--四带一--");
        return this.isFourTakeType(cardData, pointNumArr, 1);
    }

    /**
     * 四带二
     */
    protected isCardType17(cardData: number[], pointNumArr: PointNum[]) {
        cc.log("---------------------CardType--四带二--");
        return this.isFourTakeType(cardData, pointNumArr, 2);
    }

    /**
     * 四带三
     */
    protected isCardType18(cardData: number[], pointNumArr: PointNum[]) {
        cc.log("---------------------CardType--四带三--");
        return this.isFourTakeType(cardData, pointNumArr, 3);
    }

    /**
     * 三连带两单
     */
    protected isCardType19(cardData: number[], pointNumArr: PointNum[]) {
        cc.log("---------------------CardType--三连带两单--");
        let minUnitNum = 5;
        let dataLength = cardData.length;
        if (dataLength >= this.MIN_THREE_STRAIGHT_TWO_NUM && (dataLength % minUnitNum === 0)) {
            let threeNumPointArr: number[] = [];
            for (let pointData of pointNumArr) {
                if (pointData.num >= this.THREE_NUM) {
                    threeNumPointArr.push(pointData.point);
                }
            }

            // 单牌数是三条数的两倍
            let threeLength = threeNumPointArr.length;
            let straightNum = Math.floor(dataLength / minUnitNum);
            threeNumPointArr.sort(this.cardSort);
            if (threeLength === straightNum) {
                if (this.isConsecutiveLine(threeNumPointArr)) {
                    let point = threeNumPointArr[0];
                    return point;
                }
            } else {
                let continuePointArr = [];
                let continuePoint = threeNumPointArr[0];
                for (let idx = 0; idx < threeNumPointArr.length; idx++) {
                    let point = threeNumPointArr[idx];
                    if (point === continuePoint) {
                        continuePoint += 1;
                        continuePointArr.push(point);
                    } else {
                        continuePoint = point + 1;
                        if (continuePointArr.length <= 1) {
                            continuePointArr = [];
                            continuePointArr.push(point);
                        }
                    }
                }
                if (continuePointArr.length === straightNum) {
                    return continuePointArr[0];
                }
            }
        }
        return 0;
    }

    //-------------------------------------------------------------------------------
    /**
     * 除去三带、四带、飞机牌在剩余牌中找出所需带的单牌
     * @param selfCardArr 待筛选的手牌
     * @param planCardArr 已经选好的牌
     * @param takeNum 三带、四带、飞机所带单牌的个数
     */
    private getRemainTakeCard(selfCardArr: number[], planCardArr: number[], takeNum: number): number[] | undefined {
        let samePointArr = this.getRemainCard(selfCardArr, planCardArr);
        if (!samePointArr) {
            return undefined;
        }

        // 从剩余牌中选出所需个数的单牌
        let resultPointArr: number[] = [];
        for (let idx = 0; idx < samePointArr.length; idx++) {
            let pointArr = samePointArr[idx];
            for (let idx1 = 0; idx1 < pointArr.length; idx1++) {
                const point = pointArr[idx1];
                resultPointArr.push(point);
            }
        }

        if (resultPointArr.length < takeNum) {
            return undefined;
        }
        return resultPointArr.slice(0, takeNum);
    }

    /**
     * 获取三带、四带和所需的单牌
     * @param selfCardArr 
     * @param comparePoint 
     * @param sameTake 
     * @param takeNum 
     */
    private findTakeSingleCard(selfCardArr: number[], comparePoint: number, sameTake: number, takeNum: number) {
        // 先将所有三条、四条选出，再将所有剩余牌选出， 所有三带、四条和单牌进行重新组合
        let sameNumArr = this.findSameNumCard(selfCardArr, comparePoint, sameTake);
        if (sameNumArr && sameNumArr.length > 0) {
            for (let i = 0; i < sameNumArr.length; i++) {
                let appointNumArr = this.getRemainTakeCard(selfCardArr, sameNumArr[i], takeNum);
                if (appointNumArr && appointNumArr.length > 0) {
                    sameNumArr[i] = sameNumArr[i].concat(appointNumArr);
                } else {
                    return undefined;
                }
            }
        }
        return sameNumArr;
    }

    /**
     * 三带两单
     */
    protected promptCard14(selfCardArr: number[], playerCardArr: number[], comparePoint: number) {
        cc.log("promptCard--三带两单==================================");
        return this.findTakeSingleCard(selfCardArr, comparePoint, this.THREE_NUM, 2);
    }

    /**
     * 四带一
     */
    protected promptCard15(selfCardArr: number[], playerCardArr: number[], comparePoint: number) {
        cc.log("promptCard--四带一==================================");
        return this.findTakeSingleCard(selfCardArr, comparePoint, this.FOUR_NUM, 1);
    }

    /**
     * 四带二
     */
    protected promptCard16(selfCardArr: number[], playerCardArr: number[], comparePoint: number) {
        cc.log("promptCard--四带二==================================");
        return this.findTakeSingleCard(selfCardArr, comparePoint, this.FOUR_NUM, 2);
    }

    /**
     * 四带三
     */
    protected promptCard17(selfCardArr: number[], playerCardArr: number[], comparePoint: number) {
        cc.log("promptCard--四带三==================================");
        return this.findTakeSingleCard(selfCardArr, comparePoint, this.FOUR_NUM, 3);
    }

    /**
     * 三连带两单
     */
    protected promptCard18(selfCardArr: number[], playerCardArr: number[], comparePoint: number) {
        cc.log("promptCard--三连带两单==================================");
        // 把相同个数为3的牌取出来
        let pointNumArr = this.getSamePointArr(playerCardArr);
        let playerThreeNumArr: number[] = [];
        for (let i = 0; i < pointNumArr.length; i++) {
            let pointNumArr1 = pointNumArr[i];
            if (pointNumArr1.length === this.THREE_NUM) {
                playerThreeNumArr = playerThreeNumArr.concat(pointNumArr1);
            }
        }

        // 选出所有三连情况，再加上单牌
        let threeConsArr = this.findConsCard(selfCardArr, playerThreeNumArr, comparePoint, this.THREE_NUM);
        if (threeConsArr && threeConsArr.length > 0) {
            for (let i = 0; i < threeConsArr.length; i++) {
                let singleNum = playerCardArr.length - threeConsArr[i].length;
                let appointNumArr = this.getRemainTakeCard(selfCardArr, threeConsArr[i], singleNum);
                if (appointNumArr && appointNumArr.length > 0) {
                    threeConsArr[i] = threeConsArr[i].concat(appointNumArr);
                } else {
                    return undefined;
                }
            }
        }
        return threeConsArr;
    }

    /**
     * 准备打出的单牌是否为自己手牌中的最大单牌
     * @param selfCardArr 
     * @param discardData 
     */
    isMaxSingleCard(selfCardArr: number[], discardData: number) {
        let selfCardPoints = this.getAllPoints(selfCardArr);
        let pointNumArr = this.getSamePointArr(selfCardPoints);
        // 将单牌找出来
        let singleArr = [];
        for (let i = 0; i < pointNumArr.length; i++) {
            let pointNumArr1 = pointNumArr[i];
            if (pointNumArr1.length === this.SINGLE_NUM) {
                singleArr.push(pointNumArr1[0]);
                continue;
            }
        }

        if (singleArr.length > 0) {
            singleArr.sort(this.cardSort);
            let maxPoint = singleArr[singleArr.length - 1];
            let discardPoint = this.getCardPoint(discardData);
            if (maxPoint === discardPoint) {
                return true;
            }
        }
        return false;
    }

    /**
     * 是否手牌中最大的牌
     * @param selfCardArr 
     * @param discardData 
     */
    isMaxCard(selfCardArr: number[], discardData: number) {
        let selfCardPoints = this.getAllPoints(selfCardArr);
        selfCardPoints.sort(this.cardSort);
        let maxPoint = selfCardPoints[selfCardPoints.length - 1];
        let discardPoint = this.getCardPoint(discardData);
        return maxPoint === discardPoint;
    }

    /**
     * 把原数据转换成点数
     * @param cardArr 
     */
    private getAllPoints(cardArr: number[]) {
        let selfCardPoints = [];
        for (let data of cardArr) {
            selfCardPoints.push(this.getCardPoint(data));
        }
        return selfCardPoints;
    }

    /**
     * 是否满足三带出牌
     * @param selfCardArr 
     * @param playerCardArr 
     */
    isAllowThreeTake(selfCardArr: number[], playerCardArr: number[]) {
        let selfType = this.getCardType(selfCardArr);
        let playerType = this.getCardType(playerCardArr);
        // 上家出三带二，则自己可以出四带一
        if (playerType.cardType === CARD_TYPE.CT_THREE_TAKE_TWO && selfType.cardType === CARD_TYPE.CT_FOUR_TAKE_ONE
            && playerType.comparePoint < selfType.comparePoint) {
            return true;
        }
        return false;
    }
}


