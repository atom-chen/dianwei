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

//扑克点数
export enum CardPoint {
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

//扑克花色
export enum CardColor {
    CARD_COLOR_NULL,
    CARD_COLOR_SPADES,          //黑桃♠️
    CARD_COLOR_HEART,           //红心♥️
    CARD_COLOR_PLUM,            //梅花♣️
    CARD_COLOR_DIAMOND,         //方片♦️
}

export interface PointNum {
    point: number,
    num: number
}

export interface CardTypeInfo {
    cardType: CARD_TYPE;
    comparePoint: number;
}

const { ccclass, property } = cc._decorator;

/** 
 * 斗地主和跑得快算法
*/
@ccclass
export class PokerAlgorithm {
    protected SINGLE_NUM = 1;
    protected DOUBLE_NUM = 2;
    protected THREE_NUM = 3;
    protected FOUR_NUM = 4;

    protected MIN_SINGLE_STRAIGHT_NUM = 5;                     // 单连最小构成个数
    protected MIN_DOUBLE_STRAIGHT_NUM = 6;                     // 连对最小构成个数
    protected MIN_THREE_STRAIGHT_NUM = 6;                      // 三连最小构成个数
    protected MIN_THREE_STRAIGHT_ONE_NUM = 8;                  // 三连带单构成个数
    protected MIN_THREE_STRAIGHT_TWO_NUM = 10;                 // 三连带对构成个数

    protected BOMB_TYPE: number;
    protected ROCKET_TYPE: number;

    protected typeFuncArr: ((cardData: number[], pointNumArr: PointNum[]) => number)[];
    protected promptFuncArr: ((selfCardArr: number[], playerCardArr: number[], comparePoint: number) => number[][])[];

    constructor() {
        // 判断牌类型
        this.typeFuncArr = [];
        // 获取提示牌集合所有情况
        this.promptFuncArr = [];
    }

    /**
     * 统计相同点数牌的个数
     * @param cardData 
     */
    private getPointAndNumArr(cardData: number[]) {
        let tempArr = cardData.concat();
        let resultArr: PointNum[] = [];
        for (let i = 0; i < tempArr.length; i++) {
            let value1 = tempArr[i];
            if (value1) {
                let sameNum = 0;
                for (let j = i; j < tempArr.length; j++) {
                    let value2 = tempArr[j];
                    if (value1 === value2) {
                        sameNum += 1;
                        tempArr[j] = undefined;
                    }
                }
                resultArr.push({ point: value1, num: sameNum });
            }
        }
        return resultArr;
    }

    /**
     * 牌是否连续
     * @param cardData 
     * @param interval 连子间隔（单连、对连、三连)
     */
    protected isConsecutiveLine(cardData: number[], interval = 1) {
        let initValue = cardData[0];
        for (let idx = 0; idx < cardData.length; idx++) {
            let cardPoint = cardData[idx];
            // 点数大于2则退出
            if (cardPoint === initValue) {
                let sortIdx = idx + 1;
                if ((sortIdx % interval === 0)) {
                    initValue += 1;
                }
            } else {
                return false;
            }
        }
        return true;
    }

    /**
     * 是否连子牌
     * @param cardData 
     * @param pointNumArr 
     * @param samePointNum N连
     */
    private isStraightCard(cardData: number[], pointNumArr: PointNum[], samePointNum: number) {
        let dataLength = cardData.length;
        if (pointNumArr.length !== Math.floor(dataLength / samePointNum)) {
            return false;
        }

        for (let pointData of pointNumArr) {
            if (pointData.num !== samePointNum) {
                return false;
            }
        }

        return this.isConsecutiveLine(cardData, samePointNum);
    }

    /**
     * 卡牌升序
     * @param a 
     * @param b 
     */
    protected cardSort(a: number, b: number) {
        return a - b;
    }

    protected getCardPoint(cardData: number) {
        return (cardData & 0xff);
    }

    //----------------------------判断牌型---------------------------------
    /**
     * 单牌
     */
    protected isCardType1(cardData: number[], pointNumArr: PointNum[]) {
        // cc.log("---------------------CardType--单牌--");
        if (cardData.length === this.SINGLE_NUM) {
            let point = cardData[0];
            return point;
        }
        return 0;
    }

    /**
     * 对子
     */
    protected isCardType2(cardData: number[], pointNumArr: PointNum[]) {
        // cc.log("---------------------CardType--对子--");
        if (cardData.length === this.DOUBLE_NUM) {
            let cardPoint1 = cardData[0];
            let cardPoint2 = cardData[1];
            // 点数不等于王
            if (cardPoint1 === cardPoint2) {
                return cardPoint1;
            }
            return 0;
        }
        return 0;
    }

    /**
     * 三条
     */
    protected isCardType3(cardData: number[], pointNumArr: PointNum[]) {
        // cc.log("---------------------CardType--三条--");
        if (cardData.length === this.THREE_NUM) {
            for (let pointData of pointNumArr) {
                if (pointData.num === this.THREE_NUM) {
                    return pointData.point;
                }
            }
        }
        return 0;
    }

    /**
     * 单连
     */
    protected isCardType4(cardData: number[], pointNumArr: PointNum[]) {
        // cc.log("---------------------CardType--单连--");
        if (cardData.length >= this.MIN_SINGLE_STRAIGHT_NUM) {
            if (this.isConsecutiveLine(cardData)) {
                let point = cardData[0];
                return point;
            }
        }
        return 0;
    }

    /**
     * 连对
     */
    protected isCardType5(cardData: number[], pointNumArr: PointNum[]) {
        // cc.log("---------------------CardType--连对--");
        let dataLength = cardData.length;
        if (dataLength >= this.MIN_DOUBLE_STRAIGHT_NUM && (dataLength % this.DOUBLE_NUM === 0)) {
            if (this.isStraightCard(cardData, pointNumArr, this.DOUBLE_NUM)) {
                let point = cardData[0];
                return point;
            }
        }
        return 0;
    }

    /**
     * 三连
     */
    protected isCardType6(cardData: number[], pointNumArr: PointNum[]) {
        // cc.log("---------------------CardType--三连--");
        let dataLength = cardData.length;
        if (dataLength >= this.MIN_THREE_STRAIGHT_NUM && (dataLength % this.THREE_NUM === 0)) {
            if (this.isStraightCard(cardData, pointNumArr, this.THREE_NUM)) {
                let point = cardData[0];
                return point;
            }
        }
        return 0;
    }

    /**
     * 三带一单
     */
    protected isCardType7(cardData: number[], pointNumArr: PointNum[]) {
        // cc.log("---------------------CardType--三带一单--");
        let dataLength = cardData.length;
        if (dataLength === 4) {
            for (let pointData of pointNumArr) {
                if (pointData.num === this.THREE_NUM) {
                    return pointData.point;
                }
            }
        }
        return 0;
    }

    /**
     * 三带一对
     */
    protected isCardType8(cardData: number[], pointNumArr: PointNum[]) {
        // cc.log("---------------------CardType--三带一对--");
        let dataLength = cardData.length;
        if (dataLength === 5) {
            let threeNumPoint = 0;
            for (let pointData of pointNumArr) {
                // 不能出现单牌
                if (pointData.num === this.SINGLE_NUM) {
                    return 0;
                }
                if (pointData.num === this.THREE_NUM) {
                    threeNumPoint = pointData.point;
                }
            }

            // 只能两个不相同的牌面点数
            if (pointNumArr.length === 2) {
                return threeNumPoint;
            }
        }
        return 0;
    }

    /**
     * 四带两单
     */
    protected isCardType9(cardData: number[], pointNumArr: PointNum[]) {
        // cc.log("---------------------CardType--四带两单--");
        let dataLength = cardData.length;
        if (dataLength === 6) {
            let forNumPoint;
            for (let pointData of pointNumArr) {
                // 不能出现三条
                if (pointData.num === this.THREE_NUM) {
                    return 0;
                }
                if (pointData.num === this.FOUR_NUM) {
                    forNumPoint = pointData.point;
                }
            }

            if (forNumPoint) {
                return forNumPoint;
            }
        }
        return 0;
    }

    /**
     * 四带两对
     */
    protected isCardType10(cardData: number[], pointNumArr: PointNum[]) {
        // cc.log("---------------------CardType--四带两对--");
        let dataLength = cardData.length;
        if (dataLength === 8) {
            let forNumPoint = 0;
            for (let pointData of pointNumArr) {
                if (pointData.num === this.SINGLE_NUM || pointData.num === this.THREE_NUM) {
                    return 0;
                }
                if (pointData.num === this.FOUR_NUM) {
                    forNumPoint = pointData.point;
                }
            }

            if (pointNumArr.length === 3) {
                return forNumPoint;
            }
        }
        return 0;
    }

    /**
     * 三连带单
     */
    protected isCardType11(cardData: number[], pointNumArr: PointNum[]) {
        // cc.log("---------------------CardType--三连带单--");
        let minUnitNum = 4;
        let dataLength = cardData.length;
        if (dataLength >= this.MIN_THREE_STRAIGHT_ONE_NUM && (dataLength % minUnitNum === 0)) {
            let threeNumPointArr: number[] = [];
            for (let pointData of pointNumArr) {
                // 原则上不拆炸弹
                if (pointData.num === this.FOUR_NUM) {
                    return 0;
                }
                if (pointData.num === this.THREE_NUM) {
                    threeNumPointArr.push(pointData.point);
                }
            }

            threeNumPointArr.sort(this.cardSort);
            let straightNum = Math.floor(dataLength / minUnitNum);
            if (threeNumPointArr.length === straightNum) {
                if (this.isConsecutiveLine(threeNumPointArr)) {
                    let point = threeNumPointArr[0];
                    return point;
                }
            } else if (threeNumPointArr.length > straightNum) {
                // 三个及以上单牌相同
                // 获取比较值
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
                return continuePointArr[0];
            }
        }
        return 0;
    }

    /**
     * 三连带对
     */
    protected isCardType12(cardData: number[], pointNumArr: PointNum[]) {
        // cc.log("---------------------CardType--三连带对--");
        let minUnitNum = 5;
        let dataLength = cardData.length;
        if (dataLength >= this.MIN_THREE_STRAIGHT_TWO_NUM && (dataLength % minUnitNum === 0)) {
            let threeNumPointArr: number[] = [];
            let twoNumPointArr: number[] = [];
            for (let pointData of pointNumArr) {
                if (pointData.num === this.FOUR_NUM || pointData.num === this.SINGLE_NUM) {
                    return 0;
                }
                if (pointData.num === this.THREE_NUM) {
                    threeNumPointArr.push(pointData.point);
                }
                if (pointData.num === this.DOUBLE_NUM) {
                    twoNumPointArr.push(pointData.point);
                }
            }

            // 三条数和对子数始终相等
            let threeLength = threeNumPointArr.length;
            let twoLength = twoNumPointArr.length;
            let straightNum = Math.floor(dataLength / minUnitNum);
            if (threeLength !== twoLength || threeLength !== straightNum || twoLength !== straightNum) {
                return 0;
            }

            threeNumPointArr.sort(this.cardSort);
            if (this.isConsecutiveLine(threeNumPointArr)) {
                let point = threeNumPointArr[0];
                return point;
            }
        }
        return 0;
    }

    /**
     * 炸弹
     */
    protected isCardType13(cardData: number[], pointNumArr: PointNum[]) {
        // cc.log("---------------------CardType--炸弹--");
        let dataLength = cardData.length;
        if (dataLength === this.FOUR_NUM) {
            for (let pointData of pointNumArr) {
                if (pointData.num === this.FOUR_NUM) {
                    return pointData.point;
                }
            }
        }
        return 0;
    }

    /**
     * 王炸
     */
    protected isCardType14(cardData: number[], pointNumArr: PointNum[]) {
        // cc.log("---------------------CardType--王炸--");
        let dataLength = cardData.length;
        if (dataLength === this.DOUBLE_NUM) {
            // 判断是否等于王的点数
            if (cardData[0] === CardPoint.POINT_SMALL_JOKER
                && cardData[1] === CardPoint.POINT_BIG_JOKER) {
                return cardData[0];
            }
        }
        return 0;
    }

    /**
     * 判断牌的类型
     * @param cardData 
     */
    getCardType(cardData: number[]): CardTypeInfo {
        let cardTypeInfo: CardTypeInfo = { cardType: CARD_TYPE.CT_ERROR, comparePoint: CARD_TYPE.CT_ERROR }

        if (cardData && cardData.length > 0) {
            // 先把所有原数据转换成点数
            let cardPoints = [];
            for (let data of cardData) {
                cardPoints.push(this.getCardPoint(data));
            }
            cardPoints.sort(this.cardSort);

            let len = cardPoints.length;
            if (len > 2 && cardPoints[len - 1] === CardPoint.POINT_BIG_JOKER && cardPoints[len - 2] === CardPoint.POINT_SMALL_JOKER)
                return cardTypeInfo;

            let pointNumArr = this.getPointAndNumArr(cardPoints);
            for (let typeIdx = 0; typeIdx < this.typeFuncArr.length; typeIdx++) {
                let func = this.typeFuncArr[typeIdx];
                let comparePoint = func(cardPoints, pointNumArr);
                if (comparePoint !== 0) {
                    let cardType = typeIdx + 1;
                    cardTypeInfo.cardType = cardType;
                    cardTypeInfo.comparePoint = comparePoint;
                    // cc.log("比较值 = " + comparePoint);
                    return cardTypeInfo;
                }
            }
        }
        return cardTypeInfo;
    }

    //----------------------------出牌提示---------------------------------

    /**
     * 把点数相同的牌放在一起  // [[4], [5, 5]]
     * @param cardData 
     * @param sameNum 
     */
    protected getSamePointArr(cardData: number[], sameNum = this.SINGLE_NUM): number[][] {
        let dataArr: number[][] = [];
        for (let idx = 0; idx < cardData.length; idx++) {
            let point = cardData[idx];
            if (!dataArr[point]) {
                dataArr[point] = [];
            }
            dataArr[point].push(cardData[idx]);
        }
        let newData: number[][] = [];
        for (let data of dataArr) {
            if (data) {
                // 是否把炸弹算入
                if (this.isContainBomb(sameNum)) {
                    let dataLength = data.length;
                    if (dataLength >= sameNum && this.isContainBomb(dataLength)) {
                        newData.push(data);
                    }
                } else {
                    newData.push(data);
                }
            }
        }
        return newData;
    }

    protected isContainBomb(num: number) {
        return num < this.FOUR_NUM;
    }

    /**
     * 从现有牌集合中除去已经被选择了的牌集合
     * @param selfCardArr 
     * @param sameNum 
     * @param needCardArrNum 
     * @param planCardArr 
     */
    protected getRemainCard(selfCardArr: number[], planCardArr?: number[], sameNum?: number): number[][] | undefined {
        // 先剔除已选好的牌
        let oldCardArr = selfCardArr.concat();
        if (planCardArr) {
            planCardArr.sort(this.cardSort);
            let deleteNum = 0;
            for (let cardIdx = 0; cardIdx < planCardArr.length; cardIdx++) {
                let planPoint = planCardArr[cardIdx];
                let idx = oldCardArr.indexOf(planPoint);
                if (idx > -1)
                    oldCardArr.splice(idx, 1);
            }
        }
        if (oldCardArr.length < 1) {
            return undefined;
        }

        // 筛选出满足个数的集合
        let samePointArr = this.getSamePointArr(oldCardArr, sameNum);
        // 按相同个数升序
        samePointArr.sort((a, b) => {
            if (a.length === b.length) {
                return a[0] - b[0];
            } else {
                return a.length - b.length;
            }
        });

        return samePointArr;
    }

    /**
     * 将牌按相同个数区分，依次找到所需要的相同个数的牌数{{单},{对},{三}}
     * @param selfCardArr 待筛选的牌
     * @param sameNum 相同牌的个数 (单,对,三)
     * @param needCardArrNum 最后所需要的牌集合的个数 (无值则表示找到所有符合标准的)
     * @param planCardArr 已经选好的牌(在剩下的牌中选择)
     */
    private getAppointNumCard(selfCardArr: number[], sameNum: number, needCardArrNum?: number, planCardArr?: number[]): number[][] | undefined {
        let samePointArr = this.getRemainCard(selfCardArr, planCardArr, sameNum);
        if (!samePointArr) {
            return undefined;
        }

        // 再修改为指定相同个数(全部为单|全部为对|全部为三)
        let resultPointArr: number[][] = [];
        for (let idx = 0; idx < samePointArr.length; idx++) {
            let pointArr = samePointArr[idx];
            if (pointArr.length >= sameNum) {
                resultPointArr.push(pointArr.slice(0, sameNum));
            }
        }
        if (resultPointArr.length < 1) {
            return undefined;
        }

        // 从结果中选出需要的个数
        let resultArrNum = resultPointArr.length;
        if (needCardArrNum && needCardArrNum > resultArrNum) {
            return undefined;
        }

        let needNum = needCardArrNum ? needCardArrNum : resultArrNum;
        return resultPointArr.slice(0, needCardArrNum);
    }

    /**
     * 在按相同个数选出的牌集合中选出大于比较值的集合 // [[4],[6],[8]] 或 [[4,4],[6,6],[8,8]]
     * @param selfCardArr 
     * @param comparePoint 
     * @param sameNum 
     */
    protected findSameNumCard(selfCardArr: number[], comparePoint: number, sameNum: number): number[][] | undefined {
        let resultPointArr = this.getAppointNumCard(selfCardArr, sameNum);
        if (resultPointArr !== undefined) {
            resultPointArr = resultPointArr.filter(v => {
                let point = v[0];
                return point > comparePoint;
            });
            return resultPointArr;
        }
        return undefined;
    }

    /**
     * 得到连续的牌集合 // [[[3],[4,4],[5]], [[4,4],[5,5],[6]]]
     * @param selfCardArr 
     * @param consecutiveNum 
     */
    private getConsPoint(selfCardArr: number[], consecutiveNum: number): number[][][] {
        let samePointArr = this.getSamePointArr(selfCardArr);
        let resultConsArr: number[][][] = [];

        // 按需要的连续个数
        for (let i = 0; i < samePointArr.length - consecutiveNum + 1; i++) {
            let initPoint = samePointArr[i][0];
            let ConsArr: number[][] = [];
            for (let j = i; j < i + consecutiveNum; j++) {
                let pointArr = samePointArr[j];
                let point = pointArr[0];
                if (point === initPoint) {
                    initPoint += 1;
                    ConsArr.push(pointArr);
                } else {
                    break;
                }
            }
            if (ConsArr.length === consecutiveNum) {
                resultConsArr.push(ConsArr);
            }
        }
        return resultConsArr;
    }

    /**
     * 按相同个数选出连续的牌集合 // [[3,4,5], [4,4,5,5,6,6]]
     * @param selfCardArr 
     * @param playerCardArr 
     * @param comparePoint 
     * @param sameNum 
     */
    protected findConsCard(selfCardArr: number[], playerCardArr: number[], comparePoint: number, sameNum: number): number[][] | undefined {
        let consecutiveNum = Math.floor(playerCardArr.length / sameNum);
        let consArr = this.getConsPoint(selfCardArr, consecutiveNum);
        if (consArr.length > 0) {
            let resultConsArr: number[][] = [];
            for (let i = 0; i < consArr.length; i++) {
                let consArr1 = consArr[i];
                let initPoint = consArr1[0][0];
                // 选出比上家牌大的集合
                if (initPoint > comparePoint) {
                    let resultConsArr1: number[] = [];
                    for (let j = 0; j < consArr1.length; j++) {
                        let consArr2 = consArr1[j];
                        // 按需要的相同个数来组成新的集合
                        if (consArr2.length >= sameNum) {
                            for (let k = 0; k < sameNum; k++) {
                                let point = consArr2[k];
                                resultConsArr1.push(point);
                            }
                        } else {
                            break;
                        }
                    }
                    // 新组成的牌必须和上家的牌个数相同
                    if (resultConsArr1.length === playerCardArr.length) {
                        resultConsArr.push(resultConsArr1);
                    }
                }
            }
            if (resultConsArr.length > 0) {
                return resultConsArr;
            }
        }
        return undefined;
    }

    /**
     * 获取和三带有关的牌集合 // [[3,3,3], [4,4,4]] 或 [[4,4,4,3]] 或 [[4,4,4,3,3]]
     * @param selfCardArr 
     * @param comparePoint 
     * @param sameNum 
     */
    protected findThreeTakeCard(selfCardArr: number[], comparePoint: number, sameNum?: number): number[][] | undefined {
        // 先将所有三条选出，再将所有带牌选出， 所有三带和带牌进行重新组合
        let sameNumArr = this.findSameNumCard(selfCardArr, comparePoint, this.THREE_NUM);
        if (sameNum && sameNumArr && sameNumArr.length > 0) {
            for (let i = 0; i < sameNumArr.length; i++) {
                let appointNumArr = this.getAppointNumCard(selfCardArr, sameNum, 1, sameNumArr[i]);
                if (appointNumArr && appointNumArr.length > 0) {
                    let firstArr = appointNumArr[0];
                    sameNumArr[i] = sameNumArr[i].concat(firstArr);
                } else {
                    return undefined;
                }
            }
        }
        return sameNumArr;
    }

    /**
    * 获取和四带有关的牌集合
    * @param selfCardArr 
    * @param comparePoint 
    * @param sameNum 
    */
    protected findFourTakeCard(selfCardArr: number[], comparePoint: number, sameNum?: number): number[][] | undefined {
        let sameNumArr = this.findSameNumCard(selfCardArr, comparePoint, this.FOUR_NUM);
        if (sameNum && sameNumArr && sameNumArr.length > 0) {
            for (let i = 0; i < sameNumArr.length; i++) {
                let appointNumArr = this.getAppointNumCard(selfCardArr, sameNum, 2, sameNumArr[i]);
                if (!appointNumArr && sameNum === this.SINGLE_NUM) {
                    // 四带两单情况，没找到两单的话就找一对
                    appointNumArr = this.getAppointNumCard(selfCardArr, this.DOUBLE_NUM, 1, sameNumArr[i]);
                }
                if (appointNumArr && appointNumArr.length > 0) {
                    for (let j = 0; j < appointNumArr.length; j++) {
                        let appointNumArr1 = appointNumArr[j];
                        sameNumArr[i] = sameNumArr[i].concat(appointNumArr1);
                    }
                } else {
                    return undefined;
                }
            }
        }
        return sameNumArr;
    }

    /**
     * 飞机
     * @param selfCardArr 
     * @param playerCardArr 
     * @param comparePoint 
     * @param sameNum 
     */
    findThreeStraightCard(selfCardArr: number[], playerCardArr: number[], comparePoint: number, sameNum: number) {
        // 把相同个数为3的牌取出来
        let pointNumArr = this.getSamePointArr(playerCardArr);
        let playerThreeNumArr: number[] = [];
        for (let i = 0; i < pointNumArr.length; i++) {
            let pointNumArr1 = pointNumArr[i];
            if (pointNumArr1.length === this.THREE_NUM) {
                playerThreeNumArr = playerThreeNumArr.concat(pointNumArr1);
            }
        }
        if (playerThreeNumArr.length === playerCardArr.length) {
            // 三连恰好带了个三条的情况，通过比较值判断三条是在连续值的前面还是后面
            // cc.log("three straight equal three");
            playerThreeNumArr.sort(this.cardSort);
            let firstPoint = playerThreeNumArr[0];
            let lastPoint = playerThreeNumArr[playerThreeNumArr.length - 1];
            if (firstPoint === comparePoint) {
                playerThreeNumArr = playerThreeNumArr.slice(0, playerThreeNumArr.length - 3);
            } else {
                playerThreeNumArr = playerThreeNumArr.slice(3, playerThreeNumArr.length);
            }
        }

        // 选出所有三连情况，再加上单牌或对子
        let threeConsArr = this.findConsCard(selfCardArr, playerThreeNumArr, comparePoint, this.THREE_NUM);
        if (threeConsArr && threeConsArr.length > 0) {
            let cardNum = playerCardArr.length;
            for (let i = 0; i < threeConsArr.length; i++) {
                let consArr = threeConsArr[i];
                let remainCardArr = this.getRemainCard(selfCardArr, consArr, sameNum);
                // 加上需要带单、带双的个数
                if (sameNum === this.SINGLE_NUM) {
                    // 单牌从单、双、三的集合中依次取完该集合中的所有牌
                    for (let j = 0; j < remainCardArr.length; j++) {
                        let samePointArr = remainCardArr[j];
                        for (let k = 0; k < samePointArr.length; k++) {
                            if (consArr.length < cardNum) {
                                consArr.push(samePointArr[k]);
                            }
                        }
                        if (consArr.length >= cardNum) {
                            break;
                        }
                    }
                    // 取完所有牌也没满足个数的情况
                    if (consArr.length < cardNum) {
                        return undefined;
                    }
                } else if (sameNum === this.DOUBLE_NUM) {
                    // 对牌是从双、三的牌集合中依次取该集合的前两张牌
                    if (remainCardArr.length < sameNum) {
                        return undefined;
                    }
                    for (let j = 0; j < remainCardArr.length; j++) {
                        let samePointArr = remainCardArr[j];
                        for (let k = 0; k < sameNum; k++) {
                            if (consArr.length < cardNum) {
                                consArr.push(samePointArr[k]);
                            }
                        }
                        if (consArr.length >= cardNum) {
                            break;
                        }
                    }
                }
            }
        }
        return threeConsArr;
    }

    /**
     * 单牌
     */
    protected promptCard1(selfCardArr: number[], playerCardArr: number[], comparePoint: number) {
        // cc.log("promptCard--单牌==================================");
        return this.findSameNumCard(selfCardArr, comparePoint, this.SINGLE_NUM);
    }

    /**
     * 对子
     */
    protected promptCard2(selfCardArr: number[], playerCardArr: number[], comparePoint: number) {
        // cc.log("promptCard--对子==================================");
        return this.findSameNumCard(selfCardArr, comparePoint, this.DOUBLE_NUM);
    }

    /**
     * 三条
     */
    protected promptCard3(selfCardArr: number[], playerCardArr: number[], comparePoint: number) {
        // cc.log("promptCard--三条==================================");
        return this.findThreeTakeCard(selfCardArr, comparePoint);
    }

    /**
     * 连子
     */
    protected promptCard4(selfCardArr: number[], playerCardArr: number[], comparePoint: number) {
        // cc.log("promptCard--连子==================================");
        return this.findConsCard(selfCardArr, playerCardArr, comparePoint, this.SINGLE_NUM);
    }

    /**
     * 连对
     */
    protected promptCard5(selfCardArr: number[], playerCardArr: number[], comparePoint: number) {
        // cc.log("promptCard--连对==================================");
        return this.findConsCard(selfCardArr, playerCardArr, comparePoint, this.DOUBLE_NUM);
    }

    /**
     * 三连
     */
    protected promptCard6(selfCardArr: number[], playerCardArr: number[], comparePoint: number) {
        // cc.log("promptCard--三连==================================");
        return this.findConsCard(selfCardArr, playerCardArr, comparePoint, this.THREE_NUM);
    }

    /**
     * 三带一单
     */
    protected promptCard7(selfCardArr: number[], playerCardArr: number[], comparePoint: number) {
        // cc.log("promptCard--三带一单==================================");
        return this.findThreeTakeCard(selfCardArr, comparePoint, this.SINGLE_NUM);
    }

    /**
     * 三带一对
     */
    protected promptCard8(selfCardArr: number[], playerCardArr: number[], comparePoint: number) {
        // cc.log("promptCard--三带一对==================================");
        return this.findThreeTakeCard(selfCardArr, comparePoint, this.DOUBLE_NUM);
    }

    /**
     * 四带两单
     */
    protected promptCard9(selfCardArr: number[], playerCardArr: number[], comparePoint: number) {
        // cc.log("promptCard--四带两单==================================");
        return this.findFourTakeCard(selfCardArr, comparePoint, this.SINGLE_NUM);
    }

    /**
     * 四带两对
     */
    protected promptCard10(selfCardArr: number[], playerCardArr: number[], comparePoint: number) {
        // cc.log("promptCard--四带两对==================================");
        return this.findFourTakeCard(selfCardArr, comparePoint, this.DOUBLE_NUM);
    }

    /**
     * 三连带单
     */
    protected promptCard11(selfCardArr: number[], playerCardArr: number[], comparePoint: number) {
        // cc.log("promptCard--三连带单==================================");
        return this.findThreeStraightCard(selfCardArr, playerCardArr, comparePoint, this.SINGLE_NUM);
    }

    /**
     * 三连带对
     */
    protected promptCard12(selfCardArr: number[], playerCardArr: number[], comparePoint: number) {
        // cc.log("promptCard--三连带对==================================");
        return this.findThreeStraightCard(selfCardArr, playerCardArr, comparePoint, this.DOUBLE_NUM);
    }

    /**
     * 炸弹
     */
    protected promptCard13(selfCardArr: number[], playerCardArr: number[], comparePoint: number) {
        // cc.log("promptCard--炸弹==================================");
        return this.findFourTakeCard(selfCardArr, comparePoint);
    }

    /**
     * 牌是否为小王
     * @param cardData 
     * @param cardInfo 
     */
    private isSmallJoker(cardData: number[], cardInfo: CardTypeInfo): boolean {
        if (cardInfo.cardType === CARD_TYPE.CT_SINGLE
            && cardInfo.comparePoint === CardPoint.POINT_SMALL_JOKER) {
            return true;
        }
        return false;
    }

    /**
     * 获取所有炸弹、王炸
     * @param selfCardArr 
     */
    private findAllBombCard(selfCardArr: number[]): number[][] | undefined {
        let samePointArr = this.getSamePointArr(selfCardArr, this.FOUR_NUM);
        let bombArr: number[][] = [];
        let rocketArr: number[] = [];
        for (let i = 0; i < samePointArr.length; i++) {
            let samePoint = samePointArr[i];
            let point = samePoint[0];
            // 普通炸弹和王炸
            if (samePoint.length === this.FOUR_NUM) {
                bombArr.push(samePoint);
            }
            if (samePoint.length === this.SINGLE_NUM
                && (point === CardPoint.POINT_SMALL_JOKER || point === CardPoint.POINT_BIG_JOKER)) {
                rocketArr.push(point);
                if (rocketArr.length === this.DOUBLE_NUM) {
                    bombArr.push(rocketArr);
                }
            }
        }

        if (bombArr.length > 0) {
            // 王炸最后提示
            bombArr.sort((a, b) => {
                if (a.length === b.length) {
                    let aPoint = a[0];
                    let bPoint = b[0];
                    return aPoint - bPoint;
                } else {
                    return b.length - a.length;
                }
            });
            return bombArr;
        } else {
            return undefined;
        }
    }

    /**
     * 获取火箭
     * @param selfCardArr 
     */
    private findRocketCard(selfCardArr: number[]): number[][] | undefined {
        let samePointArr = this.getSamePointArr(selfCardArr);
        let resultArr: number[][] = [];
        let rocketArr: number[] = [];
        for (let samePoint of samePointArr) {
            // 牌点数为王且个数为两张 
            let point = samePoint[0];
            if (samePoint.length === this.SINGLE_NUM
                && (point === CardPoint.POINT_SMALL_JOKER || point === CardPoint.POINT_BIG_JOKER)) {
                rocketArr.push(point);
                if (rocketArr.length === this.DOUBLE_NUM) {
                    resultArr.push(rocketArr);
                    return resultArr;
                }
            }
        }
        return undefined;
    }

    /**
     * 首出提示 或 首出滑动提示
     * @param selfCardArr 
     */
    findFirstPromptCard(selfCardArr: number[]): number[][] {
        selfCardArr.sort(this.pointSort);
        let cardTypeInfo = this.getCardType(selfCardArr);
        if (cardTypeInfo.cardType !== CARD_TYPE.CT_ERROR) {
            return [selfCardArr];
        } else {
            // 查找是否有三连、对连、连子
            let threeStraightCards = this.selectThreeStraight(selfCardArr);
            if (threeStraightCards && threeStraightCards.length > 0) {
                return [threeStraightCards];
            } else {
                let doubleStraightCards = this.selectDoubleStraight(selfCardArr);
                if (doubleStraightCards && doubleStraightCards.length > 0) {
                    return [doubleStraightCards];
                } else {
                    let straightCards = this.selectStraight(selfCardArr);
                    if (straightCards && straightCards.length > 0) {
                        // cc.log("straightCards = " + straightCards);
                        return [straightCards];
                    }
                }
            }
        }
        return [[selfCardArr[0]]];
    }

    /**
     * 获取和玩家的牌型相同且比之较大的牌集合
     * @param selfCardArr 
     * @param playerCardArr 
     */
    findPromptCard(selfCardArr: number[], playerCardArr: number[]): number[][] | undefined {
        if (!playerCardArr) {
            return this.findFirstPromptCard(selfCardArr);
        }

        let cardTypeInfo = this.getCardType(playerCardArr);
        let playerType = cardTypeInfo.cardType;
        if (playerType !== CARD_TYPE.CT_ERROR) {
            let func = this.promptFuncArr[playerType - 1];

            if (playerType === this.ROCKET_TYPE) {
                return undefined;
            } else {
                // 先把所有原数据转换成点数
                let selfCardPoints = [];
                for (let data of selfCardArr) {
                    selfCardPoints.push(this.getCardPoint(data));
                }
                let playerCardPoints = [];
                for (let data of playerCardArr) {
                    playerCardPoints.push(this.getCardPoint(data));
                }

                selfCardPoints.sort(this.cardSort);
                playerCardPoints.sort(this.cardSort);
                let promptCardPointArr = func(selfCardPoints, playerCardPoints, cardTypeInfo.comparePoint);
                // cc.log("selfCardPoints = " + selfCardPoints + "    playerCardPoints = " + playerCardPoints);

                // 测试 如果单牌没找到，再考虑大小王
                if (promptCardPointArr && promptCardPointArr.length > 0) {
                    if (playerType !== this.BOMB_TYPE) {
                        let bombs = this.findAllBombCard(selfCardPoints);
                        if (bombs)
                            promptCardPointArr = promptCardPointArr.concat(bombs);
                    }
                } else if (playerType === this.BOMB_TYPE) {
                    // 得到王炸
                    promptCardPointArr = this.findRocketCard(selfCardPoints);
                } else {
                    promptCardPointArr = this.findAllBombCard(selfCardPoints);
                }
                if (promptCardPointArr !== undefined) {
                    // cc.log("promptCardPointArr = %o", promptCardPointArr);
                    // 将计算得到的点数还原成原始数据
                    let promptCardData: number[][] = [];
                    for (let i = 0; i < promptCardPointArr.length; i++) {
                        let cardPoints = promptCardPointArr[i];
                        cardPoints.sort((a, b) => { return b - a })// 手牌是降序
                        let cardData: number[] = [];
                        let sameNum = 0;
                        for (let j = 0; j < selfCardArr.length; j++) {
                            let data = selfCardArr[j];
                            let point = this.getCardPoint(data);
                            let promptPoint = cardPoints[sameNum];
                            if (point === promptPoint) {
                                sameNum += 1;
                                cardData.push(data);
                                if (sameNum >= cardPoints.length) {
                                    break;
                                }
                            }
                        }
                        promptCardData.push(cardData);
                    }
                    return promptCardData;
                }
            }
        }
        return undefined;
    }

    /**
     * 是否可以出牌
     * @param discardData 
     * @param playerCardData 
     */
    isAllowPlayCard(discardData: number[], playerCardData?: number[]): boolean {
        let selfCardInfo = this.getCardType(discardData);
        if (playerCardData) {
            let playerCardInfo = this.getCardType(playerCardData);
            if (playerCardInfo.cardType === selfCardInfo.cardType) {
                // 牌型和牌数据长度必须相等才能比较
                if (discardData.length === playerCardData.length) {
                    // 对王特殊处理(上家是小王才可以出牌)
                    if ((selfCardInfo.comparePoint === CardPoint.POINT_BIG_JOKER)
                        && this.isSmallJoker(playerCardData, playerCardInfo)) {
                        return true;
                    }
                    return selfCardInfo.comparePoint > playerCardInfo.comparePoint;
                } else {
                    return false;
                }
            } else if (selfCardInfo.cardType === this.BOMB_TYPE) {
                // 自己是炸弹而上家是王炸
                if (playerCardInfo.cardType === this.ROCKET_TYPE) {
                    return false;
                } else {
                    return true;
                }
            } else if (selfCardInfo.cardType === this.ROCKET_TYPE) {
                return true;
            } else {
                return false;
            }
        } else {
            if (selfCardInfo.cardType !== CARD_TYPE.CT_ERROR) {
                return true;
            } else {
                return false;
            }
        }
    }

    private pointSort(aData: number, bData: number) {
        let aPoint = aData & 0xff;
        let bPoint = bData & 0xff;
        let aSuit = aData >> 8;
        let bSuit = bData >> 8;
        if (aPoint === bPoint) {
            return aSuit - bSuit;
        } else {
            return aPoint - bPoint;
        }
    }

    /**
     * 从牌中找到顺子
     * @param cards 
     */
    selectStraight(cards: number[]): number[] | undefined {
        if (cards.length < this.MIN_SINGLE_STRAIGHT_NUM) {
            return undefined;
        }

        cards.sort(this.pointSort);
        let consCards = [];
        let consPoint = this.getCardPoint(cards[0]);
        for (let idx = 0; idx < cards.length; idx++) {
            let point = this.getCardPoint(cards[idx]);
            if (point === consPoint) {
                consPoint += 1;
                consCards.push(cards[idx])
            } else if (point !== (consPoint - 1)) {
                consPoint = point + 1;
                if (consCards.length >= this.MIN_SINGLE_STRAIGHT_NUM) {
                    return consCards;
                } else {
                    consCards = [];
                }
            }
        }
        if (consCards.length >= this.MIN_SINGLE_STRAIGHT_NUM) {
            return consCards;
        }
        return undefined;
    }

    /**
     * 从牌中找到连对
     * @param cards 
     */
    selectDoubleStraight(cards: number[]): number[] | undefined {
        if (cards.length < this.MIN_DOUBLE_STRAIGHT_NUM) {
            return [];
        }

        cards.sort(this.pointSort);

        let consCards = [];
        let currPoint = 0;

        for (let idx = 0; idx < cards.length - 1;) {
            let point1 = this.getCardPoint(cards[idx]);
            let point2 = this.getCardPoint(cards[idx + 1]);

            if (point1 === point2) {
                if (currPoint === 0 || point1 === currPoint + 1) {
                    consCards.push(cards[idx], cards[idx + 1]);
                    currPoint = point1;

                    idx += 2;
                } else {
                    if (point1 === currPoint) {
                        idx += 2;
                    } else {
                        if (consCards.length >= this.MIN_DOUBLE_STRAIGHT_NUM) {
                            return consCards;
                        }

                        consCards = [];
                        consCards.push(cards[idx], cards[idx + 1]);
                        currPoint = point1;

                        idx += 2;
                    }
                }
            } else {
                idx++;
            }

        }

        if (consCards.length >= this.MIN_DOUBLE_STRAIGHT_NUM) {
            return consCards;
        }

        return [];
    }

    /**
     * 从牌中找到三连
     * @param cards 
     */
    selectThreeStraight(cards: number[]) {
        if (cards.length < this.MIN_THREE_STRAIGHT_NUM) {
            return [];
        }

        cards.sort(this.pointSort);

        let consCards = [];
        let currPoint = 0;

        for (let idx = 0; idx < cards.length - 2;) {
            let point1 = this.getCardPoint(cards[idx]);
            let point2 = this.getCardPoint(cards[idx + 1]);
            let point3 = this.getCardPoint(cards[idx + 2]);

            if (point1 === point2 && point2 === point3) {
                if (currPoint === 0 || point1 === currPoint + 1) {
                    consCards.push(cards[idx], cards[idx + 1], cards[idx + 2]);
                    currPoint = point1;

                    idx += 3;
                } else {
                    if (consCards.length >= this.MIN_THREE_STRAIGHT_NUM) {
                        break;
                    }

                    consCards = [];
                    consCards.push(cards[idx], cards[idx + 1], cards[idx + 2]);
                    currPoint = point1;

                    idx += 3;
                }
            } else {
                idx++;
            }

        }

        if (consCards.length >= this.MIN_THREE_STRAIGHT_NUM) {
            let rest = [];
            for (const c of cards) {
                if (consCards.indexOf(c) < 0) {
                    rest.push(c);
                }
            }

            let doubles = this.findDoubles(rest);
            let consNum = consCards.length / 3;
            if (doubles.length / 2 >= consNum) {
                for (let i = 0; i < consNum; i++) {
                    consCards.push(doubles[2 * i], doubles[2 * i + 1]);
                }
            } else {
                if (rest.length >= consNum) {
                    for (let i = 0; i < consNum; i++) {
                        consCards.push(rest[i]);
                    }
                }
            }

            return consCards;
        }

        return [];
    }

    private findDoubles(cards: number[]) {
        let doubles = [];

        for (let idx = 0; idx < cards.length - 1;) {
            let point1 = this.getCardPoint(cards[idx]);
            let point2 = this.getCardPoint(cards[idx + 1]);

            if (point1 === point2) {
                doubles.push(cards[idx], cards[idx + 1]);
                idx += 2;
            } else {
                idx++;
            }

        }

        return doubles;
    }

    /**
     * 单点时 自动选出对子、三带
     * @param holdsCardData 
     * @param playerCardData 
     * @param idx 
     */
    findTouchPrompt(holdsCardData: number[], playerCardData: number[], idx: number) {
        // 把相等的牌选出来
        let cardPoint = this.getCardPoint(holdsCardData[idx]);
        let samePointArr: number[] = [];
        for (let i = Math.max(0, idx - 3); i <= idx + 3 && i < holdsCardData.length; i++) {
            if (this.getCardPoint(holdsCardData[i]) === cardPoint) {
                samePointArr.push(holdsCardData[i]);
            }
        }

        let cardType = this.getCardType(playerCardData);
        if (cardType.cardType === CARD_TYPE.CT_DOUBLE || cardType.cardType === CARD_TYPE.CT_THREE
            || cardType.cardType === CARD_TYPE.CT_THREE_TAKE_ONE || cardType.cardType === CARD_TYPE.CT_THREE_TAKE_TWO) {
            // 如果是炸弹则整个选出
            let sameNum = samePointArr.length;
            if (sameNum === this.FOUR_NUM) {
                // 炸弹
                return samePointArr;
            } else if (cardPoint > cardType.comparePoint) {
                if (cardType.cardType === CARD_TYPE.CT_DOUBLE) {
                    // 对子
                    if (sameNum >= this.DOUBLE_NUM) {
                        return samePointArr.slice(0, 2);
                    }
                } else if (sameNum > this.DOUBLE_NUM) {
                    // 三带
                    return samePointArr.slice(0, 3);
                }
            }
        }
        return undefined;
    }
}


