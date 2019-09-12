import { HU_TYPE_ER } from "./ermj";

export interface CheckHuData {
    discard: number;                // 如果打出此张牌
    tingDataArr: TingPaiData[];   //则听这些牌
}

export interface TingPaiData {
    tingPai: number;        //要听的牌
    baseFan: number;        //胡牌番数
    RemainingNum: number;   //听牌剩余个数
}

export interface HuPaiData {
    baseFan: number;  // 番数
    huDesc: string;   // 胡牌类型描述
}

interface CardsInfo {
    known: number[];                   // 明牌（杠，碰）
    unknown: number[];                 // 暗牌
    suits: number[];                   // 花色列表
    groups: number[][];           // 组合（判胡后出现）
    fixedGroups: number[][];      // 固定组合（杠碰）
    total: number;                          // 总牌数，包括杠碰
    n: number;                              // 暗牌数
    double: number;                         // 对子数 （暗牌）
    triple: number;                         // 刻子数 （暗牌）
    quadruple: number;                      // 根数 （暗牌）
    gang: number;                           // 杠数
    peng: number;                           // 碰数
    root: number;                           // 总根数
}

export default class TingHuPai {
    copyArr(oldArr: number[]) {
        let newArr: number[] = new Array();
        for (let key in oldArr) {
            if (oldArr.hasOwnProperty(key)) {
                let element = oldArr[key];
                newArr[key] = element;
            }
        }
        return newArr
    }

    copyCardInfo(copyCardsInfo: CardsInfo): CardsInfo {
        let groups1: number[][] = new Array();
        for (let key in copyCardsInfo.groups) {
            if (copyCardsInfo.groups.hasOwnProperty(key)) {
                let element = copyCardsInfo.groups[key];
                let newArr = this.copyArr(element);
                groups1[key] = newArr;
            }
        }

        let fixedGroups1: number[][] = new Array();
        for (let key in copyCardsInfo.fixedGroups) {
            if (copyCardsInfo.fixedGroups.hasOwnProperty(key)) {
                let element = copyCardsInfo.fixedGroups[key];
                let newArr = this.copyArr(element);
                fixedGroups1[key] = newArr;
            }
        }

        let info: CardsInfo = {
            known: this.copyArr(copyCardsInfo.known),
            unknown: this.copyArr(copyCardsInfo.unknown),
            suits: this.copyArr(copyCardsInfo.suits),
            groups: groups1,
            fixedGroups: fixedGroups1,
            total: copyCardsInfo.total,
            n: copyCardsInfo.n,
            double: copyCardsInfo.double,
            triple: copyCardsInfo.triple,
            quadruple: copyCardsInfo.quadruple,
            gang: copyCardsInfo.gang,
            peng: copyCardsInfo.peng,
            root: copyCardsInfo.root,
        };
        return info;
    }

    ReCount(CardsInfo: CardsInfo) {
        CardsInfo.total = 0;
        CardsInfo.n = 0;
        CardsInfo.double = 0;
        CardsInfo.triple = 0;
        CardsInfo.quadruple = 0;
        CardsInfo.gang = 0;
        CardsInfo.peng = 0;
        CardsInfo.root = 0;
        for (let key in CardsInfo.unknown) {
            if (CardsInfo.unknown.hasOwnProperty(key)) {
                let num = CardsInfo.unknown[parseInt(key)];
                if (num !== undefined) {
                    if (num === 2) {
                        CardsInfo.double += 1;
                    } else if (num === 3) {
                        CardsInfo.triple += 1;
                    } else if (num === 4) {
                        CardsInfo.quadruple += 1;
                        CardsInfo.root += 1;
                    }
                    CardsInfo.n += num;
                    CardsInfo.total += num;
                }
            }
        }

        for (let key in CardsInfo.known) {
            if (CardsInfo.known.hasOwnProperty(key)) {
                let num = CardsInfo.known[key];
                if (num !== undefined) {
                    if (num === 3) {
                        CardsInfo.peng += 1;
                        if (CardsInfo.unknown.hasOwnProperty(key) && (CardsInfo.unknown[key] + num >= 4))
                            CardsInfo.root += 1;
                    } else if (num === 4) {
                        CardsInfo.gang += 1;
                        CardsInfo.root += 1;
                    }
                    CardsInfo.total += num;
                }
            }
        }
    }

    Count(cards: string[]): CardsInfo | undefined {
        let CardsInfo: CardsInfo = {
            known: [],
            unknown: [],
            suits: [],
            groups: [],
            fixedGroups: [],
            total: 0,
            n: 0,
            double: 0,
            triple: 0,
            quadruple: 0,
            gang: 0,
            peng: 0,
            root: 0,
        };
        for (let index = 0; index < cards.length; index++) {
            let card = cards[index];
            let realCard: number;
            if ((card.indexOf("g") >= 0) || (card.indexOf("p") >= 0)) {
                realCard = parseInt(card.substr(1));
                if (card.indexOf("g") >= 0) {
                    CardsInfo.fixedGroups.push([realCard, realCard, realCard, realCard]);
                    CardsInfo.known[realCard] = 4;
                } else if (card.indexOf("p") >= 0) {
                    CardsInfo.fixedGroups.push([realCard, realCard, realCard]);
                    CardsInfo.known[realCard] = 3
                }
            } else {
                realCard = parseInt(card);
                if (!CardsInfo.unknown[realCard]) {
                    CardsInfo.unknown[realCard] = 0;
                }
                if (CardsInfo.unknown[realCard] >= 4)
                    return undefined;
                CardsInfo.unknown[realCard] += 1;
            }
            let suit = Math.floor(realCard / 10);
            if (CardsInfo.suits.indexOf(suit) < 0) {
                CardsInfo.suits.push(suit);
            }
        }
        this.ReCount(CardsInfo)
        return CardsInfo
    }

    GetClr(val: number) {
        return Math.floor(val / 10);
    }

    GetNum(val: number) {
        return val % 10;
    }

    GetColorCnt(cards: number[], clr?: number): any {
        let count = [0, 0, 0];
        for (let index = 0; index < cards.length; index++) {
            let val = cards[index];
            count[this.GetClr(val) - 1] += 1;
        }

        if (clr !== undefined)
            return count[clr - 1];
        else {
            let zeroSeat = 0;
            count.forEach((element, i) => {
                if (element === 0)
                    zeroSeat = i;
            });
            return count[zeroSeat];
        }
    }

    // 出这张牌后是否是缺（即不是花猪），cards所有牌；excludeVal排除一张val，nil则不排除；undesireColor定缺的花色
    RemainIsLack(cards: number[], excludeVal?: number, undesireColor?: number): boolean {
        let count = this.GetColorCnt(cards, undesireColor);
        if (count > 0)
            return false;
        let remainCards: number[] = new Array();
        if (excludeVal !== undefined) {
            for (let index = 0; index < cards.length; index++) {
                let card = cards[index];
                if (card !== excludeVal) {
                    remainCards.push(card);
                }
            }
        } else {
            remainCards = cards;
        }

        let count1 = this.GetColorCnt(remainCards, undesireColor);
        if (count1 > 0)
            return false;
        return true;
    }

    GetHandCards(cards: string[]): number[] {
        let handCards: number[] = new Array();
        for (let index = 0; index < cards.length; index++) {
            let card = cards[index];
            if ((card.indexOf("g") < 0) && (card.indexOf("p") < 0)) {
                handCards.push(parseInt(card));
            }
        }
        return handCards;
    }

    Exists(val: number): boolean {
        return val ? (val > 0) : false;
    }

    IsAlone(cards: number[], card: number): boolean {
        if ((cards[card] === 1) && (!this.Exists(cards[card - 1])) && (!this.Exists(cards[card + 1]))) {
            return true;
        }
        return false;
    }

    // 带19
    IsWith19(CardsInfo: CardsInfo) {
        let is19SameFunc = (groups: number[][]): boolean => {
            let is19 = true;
            for (let groupIdx = 0; groupIdx < groups.length; groupIdx++) {
                let group = groups[groupIdx];
                for (let valIdx = 0; valIdx < group.length; valIdx++) {
                    let card = group[valIdx];
                    let cardVal = card % 10;
                    if (cardVal === 1 || cardVal === 9) {
                        is19 = true;
                        break;
                    }
                    is19 = false;
                }
                if (!is19)
                    break;
            }
            return is19;
        }
        let is19: boolean;
        is19 = is19SameFunc(CardsInfo.groups);
        if (is19) {
            is19 = is19SameFunc(CardsInfo.fixedGroups);
        }
        return is19;
    }

    // 大对子
    IsBigPair(CardsInfo: CardsInfo): boolean {
        return ((CardsInfo.double === 1) && (CardsInfo.triple + CardsInfo.peng + CardsInfo.gang === 4));
    }

    // 将对258
    IsAll258(CardsInfo: CardsInfo): boolean {
        let is258SameFunc = (gang: number[]) => {
            for (let key in gang) {
                if (gang.hasOwnProperty(key)) {
                    let card = parseInt(key);
                    let cardVal = card % 10;
                    if ((cardVal !== 2) && (cardVal !== 5) && (cardVal !== 8)) {
                        return false;
                    }
                }
            }
            return true;
        }
        let isUnknown258 = is258SameFunc(CardsInfo.unknown);
        if (!isUnknown258)
            return false;
        let isKnown258 = is258SameFunc(CardsInfo.known);
        if (!isKnown258)
            return false;
        return true;
    }

    // 金钩钩
    IsLackOne(CardsInfo: CardsInfo) {
        return this.IsBigPair(CardsInfo) && (CardsInfo.triple === 0);
    }

    Is18Monk(CardsInfo: CardsInfo) {
        return this.IsLackOne(CardsInfo) && (CardsInfo.peng === 0);
    }

    GetResult(baseFan: number, baseStr: string, rootNum?: number): HuPaiData {
        let desc = `${baseStr}${baseFan} FAN`;
        if ((rootNum !== undefined) && rootNum > 0) {
            baseFan += rootNum;
            desc = `${baseStr},GEN ${rootNum} FAN`;
        }
        return { baseFan: baseFan, huDesc: desc };
    }

    Hupai(cards: any, dontCount: boolean, undesireColor?: number): HuPaiData {
        // 判断是否打缺
        if (undesireColor !== undefined) {
            let isLack = this.RemainIsLack(this.GetHandCards(cards), undefined, undesireColor);
            if (!isLack) {
                console.log("no hu 1");
                return { baseFan: -1, huDesc: "no hu" };
            }
        }

        // 判断其他和牌
        let Jiang = false;
        let Hu = (CardsInfo: CardsInfo): boolean => {
            if (CardsInfo.n <= 0)
                return true;
            let cards = CardsInfo.unknown;
            for (let j = 1; j < 4; j++) {
                for (let i = 1; i < 10; i++) {
                    let card = j * 10 + i;
                    if (this.Exists(cards[card])) {
                        if ((i % 10 != 9) && (i % 10 != 0) && this.Exists(cards[card + 1]) && this.Exists(cards[card + 2])) {
                            cards[card] -= 1;
                            cards[card + 1] -= 1;
                            cards[card + 2] -= 1;
                            CardsInfo.n -= 3;
                            // if ((this.IsAlone(cards, card)) || (this.IsAlone(cards, card + 1)) || (this.IsAlone(cards, card + 2))) {
                            //     cards[card] += 1;
                            //     cards[card + 1] += 1;
                            //     cards[card + 2] += 1;
                            //     CardsInfo.n += 3;
                            //     break
                            // }
                            let ok = Hu(CardsInfo);
                            if (ok) {
                                let cardArr: number[] = [card, card + 1, card + 2];
                                CardsInfo.groups.push(cardArr);
                                return true
                            }
                            cards[card] += 1;
                            cards[card + 1] += 1;
                            cards[card + 2] += 1;
                            CardsInfo.n += 3;
                        }

                        let cardNum = cards[card];
                        if (cardNum >= 3) {
                            cards[card] -= 3;
                            CardsInfo.n -= 3;
                            // if (this.IsAlone(cards, card)) {
                            //     cards[card] += 3;
                            //     CardsInfo.n += 3;
                            //     break
                            // }
                            let ok = Hu(CardsInfo);
                            if (ok) {
                                let cardArr: number[] = [card, card, card];
                                CardsInfo.groups.push(cardArr);
                                return true
                            }
                            cards[card] += 3;
                            CardsInfo.n += 3;
                        }

                        if ((!Jiang) && cardNum >= 2) {
                            Jiang = true;
                            cards[card] -= 2;
                            CardsInfo.n -= 2;
                            // if (this.IsAlone(cards, card)) {
                            //     cards[card] += 2;
                            //     CardsInfo.n += 2;
                            //     break
                            // }
                            let ok = Hu(CardsInfo);
                            if (ok) {
                                let cardArr: number[] = [card, card];
                                CardsInfo.groups.push(cardArr);
                                return true
                            }
                            cards[card] += 2;
                            CardsInfo.n += 2;
                            Jiang = false;
                        }
                    }
                }
            }
            return false;
        }

        let CardsInfo = dontCount ? cards : this.Count(cards);
        if (CardsInfo !== undefined) {
            this.ReCount(CardsInfo);
            let fan = 0;
            let cardType = "";
            // 无碰杠
            if (CardsInfo.total === CardsInfo.n) {
                if ((CardsInfo.total === 14) && (CardsInfo.quadruple * 2 + CardsInfo.double === 7)) { // 七对
                    let rootNum = CardsInfo.quadruple;
                    //----------------------------------- 幺九七对
                    let all19 = true;
                    for (let key in CardsInfo.unknown) {
                        if (CardsInfo.unknown.hasOwnProperty(key)) {
                            let card = parseInt(key);
                            let value = card % 10;
                            if ((value !== 1) && (value !== 9)) {
                                all19 = false;
                                break
                            }
                        }
                    }
                    if (all19) {
                        return this.GetResult(5, "19 7dui", rootNum);
                    }

                    //------------------------------------- 將七对
                    let all258 = true;
                    for (let key in CardsInfo.unknown) {
                        if (CardsInfo.unknown.hasOwnProperty(key)) {
                            let card = parseInt(key);
                            let value = card % 10;
                            if ((value !== 2) && (value !== 5) && (value !== 8)) {
                                all258 = false;
                                break
                            }
                        }
                    }
                    if (all258) {
                        return this.GetResult(4, "jiang 7dui", rootNum);
                    }

                    //------------------------------------- 清七对
                    if (CardsInfo.suits.length === 1) {
                        if (rootNum === 0)
                            return this.GetResult(5, "qing 7dui"); // 清七对
                        else
                            return this.GetResult(5, "qing long 7dui", rootNum - 1) // 清龙七对
                    } else {
                        // ---------------------------------- 普通七对
                        if (rootNum === 0)
                            return this.GetResult(3, "an 7dui"); // 暗七对
                        else
                            return this.GetResult(4, "long 7dui", rootNum - 1) // 龙七对
                    }
                }
            }

            let temp = (CardsInfo.unknown as number[]).slice();
            let ok = Hu(CardsInfo);
            CardsInfo.unknown = temp;
            this.ReCount(CardsInfo);
            if (ok) {
                let isWith19 = this.IsWith19(CardsInfo);        // 带幺九
                let isOneColor = CardsInfo.suits.length == 1;   // 清一色
                let isBigPair = this.IsBigPair(CardsInfo);      // 大对子
                let isAll258 = this.IsAll258(CardsInfo);        // 全258
                let isLackOne = this.IsLackOne(CardsInfo);      // 金钩钓
                let is18Monk = this.Is18Monk(CardsInfo);        // 18罗汉
                let rootNum = CardsInfo.root;

                if (isOneColor && isWith19) {
                    return this.GetResult(5, "qing dai yao", rootNum);      //清带幺
                } else if (is18Monk) {
                    return this.GetResult(5, "18 luo han", rootNum);        //罗汉
                } else if (isLackOne && isBigPair && isAll258) {
                    return this.GetResult(4, "258 JGD", rootNum);           //将对金钩钓
                } else if (isOneColor && isLackOne) {
                    return this.GetResult(3, "qing JGD", rootNum);          //清金钩钓
                } else if (isBigPair && isAll258) {
                    return this.GetResult(3, "258 dui", rootNum);           //将对
                } else if (isBigPair && isOneColor) {
                    return this.GetResult(4, "qing da dui", rootNum);       //清大对
                } else if (isWith19) {
                    return this.GetResult(3, "quan 19", rootNum);           //全幺九
                } else if (isOneColor) {
                    return this.GetResult(3, "qing", rootNum);              //清一色
                } else if (isLackOne) {
                    return this.GetResult(3, "da dui JGD", rootNum);        //大对金钩钓
                } else if (isBigPair) {
                    return this.GetResult(2, "da dui zi", rootNum);         //大对子
                } else {
                    return this.GetResult(1, "su", rootNum);                //su
                }
            }

        }
        return { baseFan: -1, huDesc: "no hu" };
    }

    GetListens(cards: string[], undesireColor?: number): HuPaiData[] | HuPaiData[][] {
        // 胡牌所需的牌
        let GetNeed = (CardsInfo: CardsInfo, except?: number): HuPaiData[] => {
            let needs = [];
            for (let suitIdx = 0; suitIdx < CardsInfo.suits.length; suitIdx++) {
                let suit = CardsInfo.suits[suitIdx];
                for (let k = 1; k < 10; k++) {
                    let newCard = suit * 10 + k;
                    let knownNum = CardsInfo.known[newCard];
                    if (knownNum === undefined)
                        knownNum = 0;
                    let unKnownNum = CardsInfo.unknown[newCard];
                    if (unKnownNum === undefined)
                        unKnownNum = 0;

                    let unKnownNum1 = CardsInfo.unknown[newCard - 1];
                    if (unKnownNum1 === undefined)
                        unKnownNum1 = 0;
                    let unKnownNum2 = CardsInfo.unknown[newCard + 1];
                    if (unKnownNum2 === undefined)
                        unKnownNum2 = 0;

                    // if ((newCard !== except) && (unKnownNum > 0 || unKnownNum1 > 0 || unKnownNum2 > 0)) {
                    //     CardsInfo.unknown[newCard] = unKnownNum + 1;
                    //     let temp = this.copyCardInfo(CardsInfo);
                    //     CardsInfo.unknown[newCard] = unKnownNum;
                    //     let huData = this.Hupai(temp, true);
                    //     if (huData.baseFan !== -1) {
                    //         needs[newCard] = huData;
                    //     }
                    // }
                    // 可以打某张胡某张
                    if ((unKnownNum > 0 || unKnownNum1 > 0 || unKnownNum2 > 0)) {
                        CardsInfo.unknown[newCard] = unKnownNum + 1;
                        let temp = this.copyCardInfo(CardsInfo);
                        CardsInfo.unknown[newCard] = unKnownNum;
                        let huData = this.Hupai(temp, true);
                        if (huData.baseFan !== -1) {
                            needs[newCard] = huData;
                        }
                    }
                }
            }
            return needs;
        }

        let CardsInfo = this.Count(cards);
        if (CardsInfo.n % 3 == 2) {
            let listens: HuPaiData[][] = [];
            // 打出手上的某张牌是否有叫
            let discards: number[] = [];
            for (let key in CardsInfo.unknown) {
                if (CardsInfo.unknown.hasOwnProperty(key)) {
                    let card = parseInt(key);
                    let num = CardsInfo.unknown[key];
                    if (discards.indexOf(card) < 0) {
                        CardsInfo.unknown[card] -= 1;
                        if (CardsInfo.unknown[card] === 0) {
                            CardsInfo.unknown[card] = undefined;
                        }
                        discards.push(card);
                        let temp = this.copyCardInfo(CardsInfo);
                        let needs = GetNeed(temp, card);
                        if (needs.length > 0) {
                            listens[card] = needs;
                        }
                        CardsInfo.unknown[card] = num;
                    }
                }
            }
            let realListens: HuPaiData[][] = [];
            for (let key in listens) {
                if (listens.hasOwnProperty(key)) {
                    let card = parseInt(key);
                    let lis = listens[key];
                    let isLack = this.RemainIsLack(this.GetHandCards(cards), card, undesireColor)
                    if (isLack) {
                        realListens[card] = lis;
                    }
                }
            }
            return realListens;
        }
        // 未摸牌，求听牌
        else {
            let listens: HuPaiData[] = [];
            // 判断有没有打缺
            let count = this.GetColorCnt(this.GetHandCards(cards), undesireColor);
            if (count === 0) {
                listens = GetNeed(CardsInfo);
            }
            return listens;
        }
    }


    getDiscards(vals: number[]) {
        let discards = [];

        for (const val of vals) {
            let needs = this.getNeeds(this.splicedArray(vals, [val]));
            if (needs.length) {
                discards.push({
                    dis: val,
                    nes: needs,
                });
            }
        }

        return discards;
    }

    getNeeds(vals: number[]) {
        let needs = [];

        let suits = [1, 4, 5];
        let points = [
            [1, 2, 3, 4, 5, 6, 7, 8, 9],
            [1, 3, 5, 7],
            [1, 3, 5],
        ];
        for (let i = 0; i < suits.length; i++) {
            for (const p of points[i]) {
                let val = suits[i] * 10 + p;
                if (this.isCompleted(this.concatedArray(vals, val))) {
                    needs.push(val);
                }
            }
        }

        return needs;
    }

    concatedArray(vals: number[], val: number) {
        vals = vals.concat(val);
        vals.sort((a, b) => {
            return a - b;
        })
        return vals;
    }

    isCompleted(vals: number[]) {
        if (this.isPairs(vals)) {
            return true;
        }

        let rets = this.completeEyes(vals);
        while (rets.length) {
            let ret = rets.pop();
            if (!ret.length) {
                return true;
            }
            rets = rets.concat(this.completeFirstTile(ret));
        }
        return false;
    }

    isPairs(vals: number[]) {
        if (vals.length !== 14) {
            return false;
        }

        for (let i = 0; i < vals.length - 1; i += 2) {
            if (vals[i] !== vals[i + 1]) {
                return false;
            }
        }

        return true;
    }

    completeEyes(vals: number[]) {
        let rets = [];
        let lastEye;
        for (let i = 0; i < vals.length - 1;) {
            let val = vals[i];
            if (val === vals[i + 1]) {
                if (val !== lastEye) {
                    lastEye = val;
                    rets.push(this.splicedArray(vals, [val, val]));
                }

                i += 2;
            } else {
                i++;
            }
        }
        return rets;
    }

    completeFirstTile(vals: number[]) {
        let rets = [];

        let val = vals[0];
        if (val === vals[1] && val === vals[2]) {
            rets.push(this.splicedArray(vals, [val, val, val]));
        }
        if (vals.indexOf(val + 1) > -1 && vals.indexOf(val + 2) > -1) {
            rets.push(this.splicedArray(vals, [val, val + 1, val + 2]));
        }

        return rets;
    }

    splicedArray(vals: number[], splicingVals: number[]) {
        vals = vals.concat();
        splicingVals.forEach(v => {
            vals.splice(vals.indexOf(v), 1);
        });
        return vals;
    }


    getFan(vals: number[]) {
        let nums = this.getNums(vals);
        let types = [];
        if (this.isBigFour(nums)) {
            types.push(HU_TYPE_ER.HUPAI_DA_SI_XI);
        }
        if (this.isBigThree(nums)) {
            types.push(HU_TYPE_ER.HUPAI_DA_SAN_YUAN);
        }
        if (this.isNineLights(nums)) {
            types.push(HU_TYPE_ER.HUPAI_JIU_LIAN_BAO_DENG);
        }
        if (this.isFourKongs(nums)) {
            types.push(HU_TYPE_ER.HUPAI_SI_GANG);
        }
        if (this.isSeqPairs(nums)) {
            types.push(HU_TYPE_ER.HUPAI_LIAN_QI_DUI);
        }
        if (this.isHundred(nums)) {
            types.push(HU_TYPE_ER.HUPAI_BAI_WAN_DAN);
        }

        if (this.isSmallFour(nums)) {
            types.push(HU_TYPE_ER.HUPAI_DA_SI_XI);
        }
        if (this.isSmallThree(nums)) {
            types.push(HU_TYPE_ER.HUPAI_DA_SI_XI);
        }
        if (this.isHonors(nums)) {
            types.push(HU_TYPE_ER.HUPAI_DA_SI_XI);
        }
        if (this.isFourConcealedTris(nums)) {
            types.push(HU_TYPE_ER.HUPAI_DA_SI_XI);
        }
        if (this.isTwoDragons(nums)) {
            types.push(HU_TYPE_ER.HUPAI_DA_SI_XI);
        }

        if (this.isFourSameSeqs(nums)) {
            types.push(HU_TYPE_ER.HUPAI_DA_SI_XI);
        }
        if (this.isFourSeqTris(nums)) {
            types.push(HU_TYPE_ER.HUPAI_DA_SI_XI);
        }

        if (this.isFourStepSeqs(nums)) {
            types.push(HU_TYPE_ER.HUPAI_DA_SI_XI);
        }
        if (this.is3Kongs(nums)) {
            types.push(HU_TYPE_ER.HUPAI_DA_SI_XI);
        }
        if (this.is19s(nums)) {
            types.push(HU_TYPE_ER.HUPAI_DA_SI_XI);
        }

        if (this.is7Doubles(nums)) {
            types.push(HU_TYPE_ER.HUPAI_DA_SI_XI);
        }
        if (this.is1Suit(nums)) {
            types.push(HU_TYPE_ER.HUPAI_DA_SI_XI);
        }
        if (this.is3SameSeqs(nums)) {
            types.push(HU_TYPE_ER.HUPAI_DA_SI_XI);
        }
        if (this.is3SeqTris(nums)) {
            types.push(HU_TYPE_ER.HUPAI_DA_SI_XI);
        }

        if (this.isDragon(nums)) {
            types.push(HU_TYPE_ER.HUPAI_DA_SI_XI);
        }
        if (this.is3StepSeqs(nums)) {
            types.push(HU_TYPE_ER.HUPAI_DA_SI_XI);
        }
        if (this.is3ConCealedTris(nums)) {
            types.push(HU_TYPE_ER.HUPAI_DA_SI_XI);
        }
        if (this.isNaturallyReady(nums)) {
            types.push(HU_TYPE_ER.HUPAI_DA_SI_XI);
        }

        if (this.isGT5(nums)) {
            types.push(HU_TYPE_ER.HUPAI_DA_SI_XI);
        }
        if (this.isLT5(nums)) {
            types.push(HU_TYPE_ER.HUPAI_DA_SI_XI);
        }
        if (this.is3WindTris(nums)) {
            types.push(HU_TYPE_ER.HUPAI_DA_SI_XI);
        }


        if (this.isPengs(nums)) {
            types.push(HU_TYPE_ER.HUPAI_DA_SI_XI);
        }
        if (this.isMixed(nums)) {
            types.push(HU_TYPE_ER.HUPAI_DA_SI_XI);
        }
        if (this.is2ConcealedKongs(nums)) {
            types.push(HU_TYPE_ER.HUPAI_DA_SI_XI);
        }
        if (this.is2DragonTris(nums)) {
            types.push(HU_TYPE_ER.HUPAI_DA_SI_XI);
        }

        if (this.isAllWith1(nums)) {
            types.push(HU_TYPE_ER.HUPAI_DA_SI_XI);
        }
        if (this.is2ExposedKongs(nums)) {
            types.push(HU_TYPE_ER.HUPAI_DA_SI_XI);
        }
        if (this.isSelfReadyDeclare(nums)) {
            types.push(HU_TYPE_ER.HUPAI_DA_SI_XI);
        }

        if (this.isDragonTri(nums)) {
            types.push(HU_TYPE_ER.HUPAI_DA_SI_XI);
        }
        if (this.isCleanDoor(nums)) {
            types.push(HU_TYPE_ER.HUPAI_DA_SI_XI);
        }
        if (this.is4Seqs(nums)) {
            types.push(HU_TYPE_ER.HUPAI_DA_SI_XI);
        }
        if (this.is4In1(nums)) {
            types.push(HU_TYPE_ER.HUPAI_DA_SI_XI);
        }
        if (this.is2ConcealedTris(nums)) {
            types.push(HU_TYPE_ER.HUPAI_DA_SI_XI);
        }
        if (this.isConcealedKong(nums)) {
            types.push(HU_TYPE_ER.HUPAI_DA_SI_XI);
        }
        if (this.isNo1s(nums)) {
            types.push(HU_TYPE_ER.HUPAI_DA_SI_XI);
        }

        if (this.is258Eyes(nums)) {
            types.push(HU_TYPE_ER.HUPAI_DA_SI_XI);
        }
        if (this.is19Eyes(nums)) {
            types.push(HU_TYPE_ER.HUPAI_DA_SI_XI);
        }
        if (this.isDeclared(nums)) {
            types.push(HU_TYPE_ER.HUPAI_DA_SI_XI);
        }
        if (this.isSameHeights(nums)) {
            types.push(HU_TYPE_ER.HUPAI_DA_SI_XI);
        }
        if (this.isSeq6(nums)) {
            types.push(HU_TYPE_ER.HUPAI_DA_SI_XI);
        }
        if (this.isOldYoung(nums)) {
            types.push(HU_TYPE_ER.HUPAI_DA_SI_XI);
        }
        if (this.is19Tri(nums)) {
            types.push(HU_TYPE_ER.HUPAI_DA_SI_XI);
        }
        if (this.isExposedKong(nums)) {
            types.push(HU_TYPE_ER.HUPAI_DA_SI_XI);
        }

        if (-1 !== types.indexOf(HU_TYPE_ER.HUPAI_DA_SI_XI)) {
            this.spliceArray(types, [
                HU_TYPE_ER.HUPAI_PENG_PENG_HE,
                HU_TYPE_ER.HUPAI_YAO_JIU_KE,
            ]);
        }
        if (-1 !== types.indexOf(HU_TYPE_ER.HUPAI_DA_SAN_YUAN)) {
            this.spliceArray(types, [
                HU_TYPE_ER.HUPAI_JIAN_KE,
                HU_TYPE_ER.HUPAI_SHUANG_JIAN_KE,
                HU_TYPE_ER.HUPAI_YAO_JIU_KE,
            ]);
        }
        if (-1 !== types.indexOf(HU_TYPE_ER.HUPAI_JIU_LIAN_BAO_DENG)) {
            this.spliceArray(types, [
                HU_TYPE_ER.HUPAI_QING_YI_SE,
                HU_TYPE_ER.HUPAI_MEN_QIAN_QIANG,
                HU_TYPE_ER.HUPAI_YAO_JIU_KE,
            ]);
        }
        if (-1 !== types.indexOf(HU_TYPE_ER.HUPAI_SI_GANG)) {
            this.spliceArray(types, [
                HU_TYPE_ER.HUPAI_SHUANG_AN_GANG,
                HU_TYPE_ER.HUPAI_SHUANG_MING_GANG,
                HU_TYPE_ER.HUPAI_MING_GANG,
                HU_TYPE_ER.HUPAI_AN_GANG,
            ]);
        }
        if (-1 !== types.indexOf(HU_TYPE_ER.HUPAI_LIAN_QI_DUI)) {
            this.spliceArray(types, [
                HU_TYPE_ER.HUPAI_QING_YI_SE,
                HU_TYPE_ER.HUPAI_MEN_QIAN_QIANG,
                HU_TYPE_ER.HUPAI_QI_DUI,
                HU_TYPE_ER.HUPAI_LIAN_LIU,
                HU_TYPE_ER.HUPAI_YI_BAN_GAO,
            ]);
        }
        if (-1 !== types.indexOf(HU_TYPE_ER.HUPAI_BAI_WAN_DAN)) {
            this.spliceArray(types, [
                HU_TYPE_ER.HUPAI_QING_YI_SE,
            ]);
        }

        if (-1 !== types.indexOf(HU_TYPE_ER.HUPAI_XIAO_SI_XI)) {
            this.spliceArray(types, [
                HU_TYPE_ER.HUPAI_SAN_FENG_KE,
                HU_TYPE_ER.HUPAI_YAO_JIU_KE,
            ]);
        }
        if (-1 !== types.indexOf(HU_TYPE_ER.HUPAI_XIAO_SAN_YUAN)) {
            this.spliceArray(types, [
                HU_TYPE_ER.HUPAI_JIAN_KE,
                HU_TYPE_ER.HUPAI_SHUANG_JIAN_KE,
                HU_TYPE_ER.HUPAI_YAO_JIU_KE,
            ]);
        }
        if (-1 !== types.indexOf(HU_TYPE_ER.HUPAI_ZI_YI_SE)) {
            this.spliceArray(types, [
                HU_TYPE_ER.HUPAI_PENG_PENG_HE,
                HU_TYPE_ER.HUPAI_HUN_YAO_JIU,
                HU_TYPE_ER.HUPAI_QUAN_DAI_YAO,
                HU_TYPE_ER.HUPAI_YAO_JIU_KE,
            ]);
        }
        if (-1 !== types.indexOf(HU_TYPE_ER.HUPAI_SI_AN_KE)) {
            this.spliceArray(types, [
                HU_TYPE_ER.HUPAI_MEN_QIAN_QIANG,
                HU_TYPE_ER.HUPAI_PENG_PENG_HE,
                HU_TYPE_ER.HUPAI_SAN_AN_KE,
                HU_TYPE_ER.HUPAI_SHUANG_AN_KE,
            ]);
        }
        if (-1 !== types.indexOf(HU_TYPE_ER.HUPAI_YI_SE_SHUANG_LONG_HUI)) {
            this.spliceArray(types, [
                HU_TYPE_ER.HUPAI_PING_HE,
                HU_TYPE_ER.HUPAI_QI_DUI,
                HU_TYPE_ER.HUPAI_QING_YI_SE,
                HU_TYPE_ER.HUPAI_YI_BAN_GAO,
                HU_TYPE_ER.HUPAI_LAO_SHAO_FU,
            ]);
        }
        
        if (-1 !== types.indexOf(HU_TYPE_ER.HUPAI_YI_SE_SHUANG_LONG_HUI)) {
            this.spliceArray(types, [
                HU_TYPE_ER.HUPAI_PING_HE,
                HU_TYPE_ER.HUPAI_QI_DUI,
                HU_TYPE_ER.HUPAI_QING_YI_SE,
                HU_TYPE_ER.HUPAI_YI_BAN_GAO,
                HU_TYPE_ER.HUPAI_LAO_SHAO_FU,
            ]);
        }
    }

    spliceArray(types: number[], spTypes: number[]) {
        for (const t of spTypes) {
            let idx = types.indexOf(t);
            if (-1 !== idx) {
                types.splice(idx, 1);
            }
        }
    }

    isBigFour(nums: { [v: number]: number }) {
        return this.isBig(nums, [41, 43, 45, 47])
    }
    isBigThree(nums: { [v: number]: number }) {
        return this.isBig(nums, [51, 53, 55])
    }
    isNineLights(nums: { [v: number]: number }) {
        for (const v of [11, 19]) {
            if (!nums[v] || nums[v] < 3) {
                return false
            }
        }
        for (const v of [12, 13, 14, 15, 16, 17, 18]) {
            if (!nums[v]) {
                return false
            }
        }
        return true
    }
    isFourKongs(nums: { [v: number]: number }) {
        let sum = 0;
        for (const v in nums) {
            sum += nums[v];
        }
        return 18 === sum;
    }
    isSeqPairs(nums: { [v: number]: number }) {
        let last;
        for (const v in nums) {
            if (last && (+v !== last + 1 || nums[v] !== 2)) {
                return false
            }
            last = +v
        }
        return true
    }
    isHundred(nums: { [v: number]: number }) {
        let sum = 0
        for (const v in nums) {
            if (+v > 19) {
                return false
            }
            sum += +v % 10 * nums[v]
        }
        return sum > 99
    }

    isSmallFour(nums: { [v: number]: number }) {
        return this.isSmall(nums, [41, 43, 45, 47])
    }
    isSmallThree(nums: { [v: number]: number }) {
        return this.isSmall(nums, [51, 53, 55])
    }
    isHonors(nums: { [v: number]: number }) {
        for (const v in nums) {
            return +v > 19
        }
    }
    isFourConcealedTris(nums: { [v: number]: number }) {//tdddd

    }
    isTwoDragons(nums: { [v: number]: number }) {
        for (const v of [11, 12, 13, 15, 17, 18, 19]) {
            if (nums[v] !== 2) {
                return false
            }
        }
        return true
    }

    isFourSameSeqs(nums: { [v: number]: number }) {
        let vs = Object.keys(nums)
        if (4 !== vs.length) {
            return false
        }
        if (2 !== nums[+vs[0]] && 2 !== nums[+vs[vs.length - 1]]) {
            return false
        }
        return true
    }
    isFourSeqTris(nums: { [v: number]: number }) {
        let vs = Object.keys(nums)
        if (5 !== vs.length) {
            return false
        }
        let offset
        if (2 === nums[+vs[0]]) {
            offset = 1
        } else if (2 === nums[+vs[vs.length - 1]]) {
            offset = 0
        } else {
            return false
        }
        for (let i = offset; i < vs.length - 1 + offset; i++) {
            if (nums[+vs[i]] < 3) {
                return false
            }
            if (i > offset && +vs[i] !== +vs[i - 1] + 1) {
                return false
            }
        }
        return true
    }

    isFourStepSeqs(nums: { [v: number]: number }) {
        const counts = [
            [1, 2, 3, 3, 2, 1],
            [1, 1, 2, 1, 2, 1, 2, 1, 1],
        ];
        for (let i = 0; i < counts.length; i++) {
            for (let j = 0; j < 10 - counts[i].length; j++) {
                for (let k = 0; k < counts[i].length; k++) {
                    if (!(nums[11 + j + k] >= counts[i][k])) {
                        break;
                    }
                    if (counts[i].length - 1 === k) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    is3Kongs(nums: { [v: number]: number }) {
        let sum = 0;
        for (const v in nums) {
            sum += nums[v];
        }
        return 17 === sum;
    }
    is19s(nums: { [v: number]: number }) {
        for (const v in nums) {
            if (+v > 11 && +v < 19) {
                return false;
            }
        }
        return true;
    }

    is7Doubles(nums: { [v: number]: number }) {
        for (const v in nums) {
            if (!(nums[+v] in [2, 4])) {
                return false;
            }
        }
        return true;
    }
    is1Suit(nums: { [v: number]: number }) {
        for (const v in nums) {
            if (+v > 19) {
                return false;
            }
        }
        return true;
    }
    is3SameSeqs(nums: { [v: number]: number }) {
        return this.is3SeqTris(nums);
    }
    is3SeqTris(nums: { [v: number]: number }) {
        let vs = Object.keys(nums)
        for (let i = 0; i < vs.length - 2; i++) {
            if (+vs[i] === +vs[i + 1] - 1 && +vs[i] === +vs[i + 2] - 2) {
                if (nums[+vs[i]] >= 3 && nums[+vs[i + 1]] >= 3 && nums[+vs[i + 2]] >= 3) {
                    return true;
                }
            }
        }
        return false;
    }

    isDragon(nums: { [v: number]: number }) {
        for (let v = 11; v <= 19; v++) {
            if (!nums[v]) {
                return false;
            }
        }
        return true;
    }
    is3StepSeqs(nums: { [v: number]: number }) {
        const counts = [
            [1, 2, 3, 2, 1],
            [1, 1, 2, 1, 2, 1, 1],
        ]
        for (const aCounts of counts) {
            for (let j = 0; j < 10 - aCounts.length; j++) {
                for (let k = 0; k < aCounts.length; k++) {
                    if (!(nums[11 + j + k] >= aCounts[k])) {
                        break;
                    }
                    if (aCounts.length - 1 === k) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    is3ConCealedTris(nums: { [v: number]: number }) {

    }
    isNaturallyReady(nums: { [v: number]: number }) {

    }

    isGT5(nums: { [v: number]: number }) {
        for (const v in nums) {
            if (+v <= 5 || +v > 19) {
                return false;
            }
        }
        return true;
    }
    isLT5(nums: { [v: number]: number }) {
        for (const v in nums) {
            if (+v >= 15) {
                return false;
            }
        }
        return true;
    }
    is3WindTris(nums: { [v: number]: number }) {
        let count = 0
        for (const v of [41, 43, 45, 47]) {
            if (nums[v] >= 3) {
                count++;
            }
        }
        return 3 === count;
    }


    isPengs(nums: { [v: number]: number }) {
        for (const v in nums) {
            if (!(nums[v] >= 2)) {
                return false;
            }
        }
        return true;
    }
    isMixed(nums: { [v: number]: number }) {
        return true;
    }
    is2ConcealedKongs(nums: { [v: number]: number }) {

    }
    is2DragonTris(nums: { [v: number]: number }) {
        let count = 0
        for (const v of [51, 53, 55]) {
            if (nums[v] >= 3) {
                count++;
            }
        }
        return 2 === count;
    }

    isAllWith1(nums: { [v: number]: number }) {

    }
    is2ExposedKongs(nums: { [v: number]: number }) {

    }
    isSelfReadyDeclare(nums: { [v: number]: number }) {

    }

    isDragonTri(nums: { [v: number]: number }) {
        for (const v of [51, 53, 55]) {
            if (nums[v] >= 3) {
                return true;
            }
        }
    }
    isCleanDoor(nums: { [v: number]: number }) {

    }
    is4Seqs(nums: { [v: number]: number }) {

    }
    is4In1(nums: { [v: number]: number }) {
        for (const v in nums) {
            if (4 === nums[v]) {
                return true;
            }
        }
        return false;
    }
    is2ConcealedTris(nums: { [v: number]: number }) {

    }
    isConcealedKong(nums: { [v: number]: number }) {

    }
    isNo1s(nums: { [v: number]: number }) {
        for (const v in nums) {
            if (11 === +v || +v >= 19) {
                return false;
            }
        }
        return true;
    }

    is258Eyes(nums: { [v: number]: number }) {

    }
    is19Eyes(nums: { [v: number]: number }) {

    }
    isDeclared(nums: { [v: number]: number }) {

    }
    isSameHeights(nums: { [v: number]: number }) {
        let vs = Object.keys(nums);
        for (let i = 0; i < vs.length - 2; i++) {
            if (+vs[i] === +vs[i + 1] - 1 && +vs[i] === +vs[i + 2] - 2) {
                if (nums[+vs[i]] >= 2 && nums[+vs[i + 1]] >= 2 && nums[+vs[i + 2]] >= 2) {
                    return true;
                }
            }
        }
        return false;
    }
    isSeq6(nums: { [v: number]: number }) {
        for (let v = 11; v <= 14; v++) {
            for (let j = 0; j < 6; j++) {
                if (!nums[v]) {
                    break;
                }
                if (5 === j) {
                    return true;
                }
            }
        }
        return false;
    }
    isOldYoung(nums: { [v: number]: number }) {
        for (const v of [11, 12, 13, 17, 18, 19]) {
            if (!nums[v]) {
                return false;
            }
        }
        return true;
    }
    is19Tri(nums: { [v: number]: number }) {
        for (const v in nums) {
            if ((11 === +v || +v >= 19) && nums[v] >= 3) {
                return true;
            }
        }
        return false;
    }
    isExposedKong(nums: { [v: number]: number }) {

    }



    isBig(nums: { [v: number]: number }, tars: number[]) {
        for (const v of tars) {
            if (!nums[v] || nums[v] < 3) {
                return false
            }
        }
        return true
    }

    isSmall(nums: { [v: number]: number }, tars: number[]) {
        let pairExsisted = false
        for (const v of tars) {
            if (!nums[v] || nums[v] < 2) {
                return false
            }
            if (nums[v] === 2) {
                if (pairExsisted) {
                    return false
                }
                pairExsisted = true
            }
        }
        return pairExsisted
    }

    getNums(vals: number[]) {
        let nums: { [v: number]: number } = {}
        for (const v of vals) {
            nums[v] = (nums[v] || 0) + 1
        }
        return nums
    }
}
