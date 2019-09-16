import  { DZPKCardType } from "./dzpkGame";

interface Sorted {
    [x: number]: number
}

interface CardInfo {
    suit: number,
    pt: number
}

class Shape {
    val: number
    private idx = 4
    setType(type: number) { this.val |= (type << 20) }
    push(v: number) { this.val |= (v << 4 * this.idx--) }
}


export enum CardPoint {
    n2 = 2,
    n3 = 3,
    n4 = 4,
    n5 = 5,
    n6 = 6,
    n7 = 7,
    n8 = 8,
    n9 = 9,
    n10 = 10,
    nJ = 11,
    nQ = 12,
    nK = 13,
    na = 14,
}

let cards: number[];
const SELECT_CNT = 5

function getSuit(card: number) { return card >> 8 }
function getPoint(card: number) { return card & 0x00000ff }

//洗牌

function combinations2<T>(source: T[], n: number, callback: (combIndexes: T[]) => boolean) {
    let m = source.length;
    let combIndexes: T[] = [];
    let abort: boolean = false;
    let inner = (start:number, choose_:number) => {
        if (abort) {
            return;
        }
        if (choose_ == 0) {
            abort = callback([...combIndexes]);
        } else {
            for (let i = start; i <= m - choose_; ++i) {
                combIndexes.push(source[i]);
                inner(i + 1, choose_ - 1);
                combIndexes.pop();
            }
        }
    }
    inner(0, n);
}

export function getMaxShape(cards: number[]) {
    if (cards.length < SELECT_CNT){
        if (cards.length === 2 && getPoint(cards[0]) === getPoint(cards[1])){
            return 1
        }
        return
    }else {
        let maxShape: number = undefined
        combinations2(cards, SELECT_CNT, (cards): boolean => {
            let shape = getType(cards)
            if (!maxShape) maxShape = shape
            else if (maxShape < shape) maxShape = shape
            return false
        })
        return maxShape >> 20
    }
}

function getType(cards: number[]) {
    let info = cards.map(card => {
        return { suit: getSuit(card), pt: getPoint(card) }
    }).sort((a, b) => b.pt - a.pt)
    let isTongHua = info.every(v => v.suit === info[0].suit)
    let shape = new Shape()
    if (isTongHua) {
        if (info[0].pt === CardPoint.na &&
            info[4].pt === CardPoint.n10) {
            shape.setType(DZPKCardType.huangJiaTongHuaShun)
        } else if (info[0].pt === CardPoint.na &&
            info[1].pt === CardPoint.n5) {
            shape.setType(DZPKCardType.tongHuaShun)
            shape.push(CardPoint.n5)
        } else if (info[0].pt - 4 === info[4].pt) {
            shape.setType(DZPKCardType.tongHuaShun)
            shape.push(info[0].pt)
        } else {
            shape.setType(DZPKCardType.tongHua)
            info.forEach(v => shape.push(v.pt))
        }
    } else {
        if (checkJinGang(info, shape)) return shape.val
        if (checkHuLu(info, shape)) return shape.val
        if (checkShunZi(info, shape)) return shape.val
        if (checkSanTiao(info, shape)) return shape.val
        if (checkLiangDui(info, shape)) return shape.val
        if (checkYiDui(info, shape)) return shape.val
        shape.setType(DZPKCardType.gaoPai)
        info.forEach(v => shape.push(v.pt));
    }
    return shape.val
}

function checkJinGang(info: CardInfo[], shape: Shape) {
    if (info[0].pt === info[3].pt) {
        shape.setType(DZPKCardType.siTiao)
        shape.push(info[0].pt)
        shape.push(info[4].pt)
        return true
    } else if (info[1].pt === info[4].pt) {
        shape.setType(DZPKCardType.siTiao)
        shape.push(info[1].pt)
        shape.push(info[0].pt)
        return true
    }
    return false
}

function checkHuLu(info: CardInfo[], shape: Shape) {
    if (info[0].pt === info[2].pt && info[3].pt === info[4].pt) {
        shape.setType(DZPKCardType.huLu)
        shape.push(info[0].pt)
        shape.push(info[3].pt)
        return true
    } else if (info[0].pt === info[1].pt && info[2].pt === info[4].pt) {
        shape.setType(DZPKCardType.huLu)
        shape.push(info[2].pt)
        shape.push(info[0].pt)
        return true
    }
    return false
}

function checkSanTiao(info: CardInfo[], shape: Shape) {
    if (info[0].pt === info[2].pt) {
        shape.setType(DZPKCardType.sanTiao)
        shape.push(info[0].pt)
        shape.push(info[3].pt)
        shape.push(info[4].pt)
        return true
    } else if (info[1].pt === info[3].pt) {
        shape.setType(DZPKCardType.sanTiao)
        shape.push(info[1].pt)
        shape.push(info[0].pt)
        shape.push(info[4].pt)
        return true
    } else if (info[2].pt === info[4].pt) {
        shape.setType(DZPKCardType.sanTiao)
        shape.push(info[2].pt)
        shape.push(info[0].pt)
        shape.push(info[1].pt)
        return true
    }
    return false
}

function  checkLiangDui(info: CardInfo[], shape: Shape) {
    if (info[0].pt === info[1].pt && info[2].pt === info[3].pt) {
        shape.setType(DZPKCardType.liangDui)
        shape.push(info[0].pt)
        shape.push(info[2].pt)
        shape.push(info[4].pt)
        return true
    } else if (info[1].pt === info[2].pt && info[3].pt === info[4].pt) {
        shape.setType(DZPKCardType.liangDui)
        shape.push(info[1].pt)
        shape.push(info[3].pt)
        shape.push(info[0].pt)
        return true
    } else if (info[0].pt === info[1].pt && info[3].pt === info[4].pt) {
        shape.setType(DZPKCardType.liangDui)
        shape.push(info[0].pt)
        shape.push(info[3].pt)
        shape.push(info[2].pt)
        return true
    }
    return false
}

function  checkYiDui(info: CardInfo[], shape: Shape) {
    if (info[0].pt === info[1].pt) {
        shape.setType(DZPKCardType.yiDui)
        shape.push(info[0].pt)
        shape.push(info[2].pt)
        shape.push(info[3].pt)
        shape.push(info[4].pt)
        return true
    } else if (info[1].pt === info[2].pt) {
        shape.setType(DZPKCardType.yiDui)
        shape.push(info[1].pt)
        shape.push(info[0].pt)
        shape.push(info[3].pt)
        shape.push(info[4].pt)
        return true
    } else if (info[2].pt === info[3].pt) {
        shape.setType(DZPKCardType.yiDui)
        shape.push(info[2].pt)
        shape.push(info[0].pt)
        shape.push(info[1].pt)
        shape.push(info[4].pt)
        return true
    } else if (info[3].pt === info[4].pt) {
        shape.setType(DZPKCardType.yiDui)
        shape.push(info[3].pt)
        shape.push(info[0].pt)
        shape.push(info[1].pt)
        shape.push(info[2].pt)
        return true
    }
    return false
}

function  checkShunZi(info: CardInfo[], shape: Shape) {
    let isConti = true
    for (let i = 0; i < info.length - 1; i++) {
        if (info[i].pt - 1 !== info[i + 1].pt) {
            isConti = false
            break
        }
    }
    if (isConti) {
        shape.setType(DZPKCardType.shunZi)
        shape.push(info[0].pt)
        return true
    } else if (info[0].pt === CardPoint.na
        && info[1].pt === CardPoint.n5
        && info[1].pt === info[2].pt + 1
        && info[2].pt === info[3].pt + 1
        && info[3].pt === info[4].pt + 1) {
        shape.setType(DZPKCardType.shunZi)
        shape.push(info[1].pt)
        return true
    }
    return false
}