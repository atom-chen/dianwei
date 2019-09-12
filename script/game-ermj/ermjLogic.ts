import * as ermj from "./ermjTypes";
import { TypeFan, HU_TYPE_ER } from "./ermj";
const CARD_COUNT = 64;

export default class GameLogic {
    _cardArr: number[];

    private _tmpData: ermj.PaiCounter;
    private _huPaiStruct: ermj.PingHuStruct;
    private _userAction: ermj.UserAction[];
    private _huType: number[];

    constructor() {
        this._cardArr = [];
        this._userAction = [];
        this._tmpData = new ermj.PaiCounter();
        this._huPaiStruct = new ermj.PingHuStruct();
    }

    AddAction = (action: ermj.UserAction) => {
        this._userAction.push(action);
    }

    InitUserAction = () => {
        this._userAction = [];
    }

    GetCardCount = () => {
        return this._cardArr.length;
    }

    //获取骰子点数
    GetTouZiPoint = (valPoint: number[]) => {
        for (let i = 0; i < 2; i++) {
            let rand = Math.random();
            valPoint[i] = Math.round(rand * 5) + 1;
        }
    }

    //洗牌
    RandPai = () => {
        let index = 0;
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < ermj.mjAllTypeCard.length; j++) {
                this._cardArr[index++] = ermj.mjAllTypeCard[j];
            }
        }

        for (let i = 0; i < 200; i++) {
            let pos = Math.round(Math.random() * (CARD_COUNT - 1));
            let num = i % CARD_COUNT;
            if (pos >= CARD_COUNT || num >= CARD_COUNT) {
                console.warn('RandCardError');
            }
            let temp = this._cardArr[num];
            this._cardArr[num] = this._cardArr[pos];
            this._cardArr[pos] = temp;
        }
    }

    GetAPai = () => {
        if (this._cardArr.length > 0) {
            return this._cardArr.pop();
        } else {
            return 0;
        }
    }

    GetPaiType = (card: number) => {
        return Math.floor(card / 10);
    }

    GetPaiPoint = (card: number) => {
        return card % 10;
    }

    GetPaiPoints = (cards: number[]) => {
        let tmp: number[] = [];
        for (let card of cards) {
            tmp.push(this.GetPaiPoint(card));
        }
        return tmp;
    }

    CounterPai = (handlePai: number[], lastpai?: number) => {
        let counter = new ermj.PaiCounter();
        let tmpHandlePai: number[] = [];
        if (lastpai) {
            tmpHandlePai = handlePai.concat(lastpai);
        } else {
            tmpHandlePai = handlePai.concat();
        }

        tmpHandlePai.sort((a, b) => {
            return a - b;
        })
        for (let hPai of tmpHandlePai) {
            counter.Add(hPai);
        }
        return counter;
    }

    CanChi = (handlePai: number[], pai: number) => {
        let counter = this.CounterPai(handlePai);
        let type = this.GetPaiType(pai);
        if (type !== ermj.MJ_TYPE_PAI.MJ_TYPE_PAI_WAN) return false;
        let cardCount_m2 = counter.GetPaiCount(pai - 2);
        let cardCount_m1 = counter.GetPaiCount(pai - 1);
        let cardCount_p2 = counter.GetPaiCount(pai + 2);
        let cardCount_p1 = counter.GetPaiCount(pai + 1);
        if (cardCount_m2 > 0 && cardCount_m1 > 0) return true;
        if (cardCount_m1 > 0 && cardCount_p1 > 0) return true;
        if (cardCount_p1 > 0 && cardCount_p2 > 0) return true;
        return false;
    }

    CanPeng = (handlePai: number[], pai: number) => {
        let counter = this.CounterPai(handlePai);
        if (counter.GetPaiCount(pai) >= 2) return true;
        return false;
    }

    CanGang = (handlePai: number[], lastpai: number, gangPai: number, me: boolean, pgVec: ermj.ChiPengGangInfo[], Result: number[]) => {
        let counter = this.CounterPai(handlePai, lastpai);
        let bGang = false;
        if (me) {
            let hasOne = false;
            for (let i = 0; i < counter.data.length; i++) {
                if (counter.data[i][0] === gangPai && counter.data[i][1] === 4) {
                    Result[0] = counter.data[i][0];
                    Result[1] = ermj.PingHuType.TYPE_DARK;
                    bGang = true;
                }
                if (counter.data[i][0] === gangPai && counter.data[i][1] === 1) {
                    hasOne = true;
                }
            }
            for (let it of pgVec) {
                if (it.pingHuType === ermj.PingHuType.TYPE_PENG && it.pai === gangPai && hasOne) {
                    Result[0] = lastpai;
                    Result[1] = ermj.PingHuType.TYPE_ADD;
                    bGang = true;
                }
            }
            if (!bGang) {
                for (let i = 0; i < counter.data.length; i++) {
                    if (counter.data[i][1] === 4) {
                        Result[0] = counter.data[i][0];
                        Result[1] = ermj.PingHuType.TYPE_DARK;
                        bGang = true;
                    } else if (counter.data[i][1] === 1) {
                        for (let it of pgVec) {
                            if (it.pingHuType === ermj.PingHuType.TYPE_PENG && it.pai === counter.data[i][0]) {
                                Result[0] = lastpai;
                                Result[1] = ermj.PingHuType.TYPE_ADD;
                                bGang = true;
                            }
                        }
                    }
                }
            }
        } else {
            for (let i = 0; i < counter.data.length; i++) {
                if (counter.data[i][0] === lastpai && counter.data[i][1] === 4) {
                    bGang = true;
                    Result[0] = counter.data[i][0];
                    Result[1] = ermj.PingHuType.TYPE_SHINE;
                    break;
                }
            }
        }

        return bGang;
    }

    CanOutPai = (handlePai: number[], outPai: number, upPai: number) => {
        let counter = this.CounterPai(handlePai);
        if (outPai !== upPai && counter.GetPaiCount(outPai) === 0) return false;
        return true;
    }

    ChangeHandPaiData = (handpai: number[], huTempData: ermj.PaiCounter) => {
        for (let i = 0; i < handpai.length; i++) {
            if (handpai[i] != 0) {
                huTempData.Add(handpai[i]);
            }
        }
    }

    GetGangCount = (pgVec: ermj.ChiPengGangInfo[]) => {
        let mingCount = 0;
        let anCount = 0;
        for (let pg of pgVec) {
            if (pg.pingHuType === ermj.PingHuType.TYPE_ADD ||
                pg.pingHuType === ermj.PingHuType.TYPE_SHINE) {
                mingCount++;
            } else if (pg.pingHuType === ermj.PingHuType.TYPE_DARK) {
                anCount++;
            }
        }
        return [mingCount, anCount];
    }

    CheckYiSe = (huTempData: ermj.PaiCounter, pgVec: ermj.ChiPengGangInfo[]) => {
        let firstPaiTyp = this.GetPaiType(huTempData.data[0][0]);
        for (let i = 1; i < huTempData.data.length; i++) {
            let type = this.GetPaiType(huTempData.data[i][0]);
            if (ermj.MJ_TYPE_PAI.MJ_TYPE_PAI_WAN === firstPaiTyp) {
                if (type !== firstPaiTyp) return ermj.YI_SE.YI_SE_HUN;
            } else if (ermj.MJ_TYPE_PAI.MJ_TYPE_PAI_JIAN === firstPaiTyp ||
                ermj.MJ_TYPE_PAI.MJ_TYPE_PAI_FENG === firstPaiTyp) {
                if (type === ermj.MJ_TYPE_PAI.MJ_TYPE_PAI_WAN) return ermj.YI_SE.YI_SE_HUN;
            } else {
                console.error("[ermj]手牌牌型有误：pai=", huTempData.data[i][0], "type=", type);
                return 0;
            }
        }

        for (let pai of pgVec) {
            let type = this.GetPaiType(pai.pai);
            if (ermj.MJ_TYPE_PAI.MJ_TYPE_PAI_WAN === firstPaiTyp) {
                if (type !== firstPaiTyp) return ermj.YI_SE.YI_SE_HUN;
            } else if (ermj.MJ_TYPE_PAI.MJ_TYPE_PAI_JIAN === firstPaiTyp ||
                ermj.MJ_TYPE_PAI.MJ_TYPE_PAI_FENG === firstPaiTyp) {
                if (type === ermj.MJ_TYPE_PAI.MJ_TYPE_PAI_WAN) return ermj.YI_SE.YI_SE_HUN;
            } else {
                console.error("[ermj]亮牌牌型有误：pai=", pai);
                return 0;
            }
        }
        let resType: number = 0;
        if (firstPaiTyp === ermj.MJ_TYPE_PAI.MJ_TYPE_PAI_WAN) {
            resType = ermj.YI_SE.YI_SE_QING;
        } else if (firstPaiTyp === ermj.MJ_TYPE_PAI.MJ_TYPE_PAI_JIAN || firstPaiTyp === ermj.MJ_TYPE_PAI.MJ_TYPE_PAI_FENG) {
            resType = ermj.YI_SE.YI_SE_ZI;
        }
        return resType;
    }

    SetAHupaiType = (type: number, hupai: number[]) => {
        if (this.CheckHupaiType(type, hupai)) {
            return;
        }
        hupai.push(type);
    }
    CheckHupaiType = (type: number, hupai: number[]) => {
        for (let i = 0; i < hupai.length; i++) {
            if (hupai[i] == type) {
                return true;
            }
        }
        return false;
    }

    SortArrRemoveSame = (arr: number[]) => {
        for (let i = 0; i < arr.length - 1; i++) {
            if (arr[i] === arr[i + 1]) {
                arr.splice(i, 1);
                i--;
            }
        }
    }

    CheckJiuLianBaoDeng = (huTempData: ermj.PaiCounter, pgVec: ermj.ChiPengGangInfo[]) => {
        if (pgVec.length > 0) return false;
        let data = huTempData.data;
        if (data[0][0] !== ermj.MJ_TYPE.MJ_TYPE_W1 ||
            data[data.length - 1][0] !== ermj.MJ_TYPE.MJ_TYPE_W9 ||
            data[0][1] < 3 ||
            data[data.length - 1][1] < 3)
            return false;
        for (let i = 0; i < data.length - 1; i++) {
            if (data[i][0] + 1 !== data[i + 1][0]) return false;
        }
        return true;
    }

    CheckYiSeShuangLongHui = (handlePai: number[], pgVec: ermj.ChiPengGangInfo[]) => {
        let tmpPai = handlePai.concat();
        for (let pg of pgVec) {
            if (pg.pingHuType !== ermj.PingHuType.TYPE_CHI) return false;
            tmpPai.push(pg.pai);
            tmpPai.push(pg.pai + 1);
            tmpPai.push(pg.pai + 2);
        }

        tmpPai.sort((a, b) => {
            return a - b;
        })
        let tmpCounter = new ermj.PaiCounter();
        for (let pai of tmpPai) {
            if (this.GetPaiType(pai) !== ermj.MJ_TYPE_PAI.MJ_TYPE_PAI_WAN) return false;
            tmpCounter.Add(pai);
        }

        let data = tmpCounter.data;
        let len = data.length;
        if (data[0][0] === ermj.MJ_TYPE.MJ_TYPE_W1 &&
            data[1][0] === ermj.MJ_TYPE.MJ_TYPE_W2 &&
            data[2][0] === ermj.MJ_TYPE.MJ_TYPE_W3 &&
            data[3][0] === ermj.MJ_TYPE.MJ_TYPE_W5 &&
            data[len - 1][0] === ermj.MJ_TYPE.MJ_TYPE_W9 &&
            data[len - 2][0] === ermj.MJ_TYPE.MJ_TYPE_W8 &&
            data[len - 3][0] === ermj.MJ_TYPE.MJ_TYPE_W7 &&
            data[0][1] === 2 &&
            data[1][1] === 2 &&
            data[2][1] === 2 &&
            data[3][1] === 2 &&
            data[len - 1][1] === 2 &&
            data[len - 2][1] === 2 &&
            data[len - 3][1] === 2) {
            return true;
        }
        return false;
    }

    CheckDaYuWu = (huTempData: ermj.PaiCounter, pgVec: ermj.ChiPengGangInfo[]) => {
        for (let pai of huTempData.data) {
            if (pai[0] < ermj.MJ_TYPE.MJ_TYPE_W6) return false;
        }
        let pgPoint: number;
        for (let pg of pgVec) {
            if (pg.pai <= ermj.MJ_TYPE.MJ_TYPE_W5) return false;
        }
        return true;
    }

    CheckXiaoYuWu = (huTempData: ermj.PaiCounter, pgVec: ermj.ChiPengGangInfo[]) => {
        for (let pai of huTempData.data) {
            if (pai[0] > ermj.MJ_TYPE.MJ_TYPE_W4) return false;
        }

        let pgPoint: number;
        for (let pg of pgVec) {
            if (pg.pingHuType === ermj.PingHuType.TYPE_CHI) {
                if (pg.pai + 2 >= ermj.MJ_TYPE.MJ_TYPE_W5) return false;
            } else {
                if (pg.pai >= ermj.MJ_TYPE.MJ_TYPE_W5) return false;
            }
        }
        return true;
    }

    CheckDuanYao = (huTempData: ermj.PaiCounter, pgVec: ermj.ChiPengGangInfo[]) => {
        for (let pai of huTempData.data) {
            let type = this.GetPaiType(pai[0]);
            if (pai[0] === ermj.MJ_TYPE.MJ_TYPE_W1 ||
                pai[0] === ermj.MJ_TYPE.MJ_TYPE_W9 ||
                type === ermj.MJ_TYPE_PAI.MJ_TYPE_PAI_JIAN ||
                type === ermj.MJ_TYPE_PAI.MJ_TYPE_PAI_FENG)
                return false;
        }
        for (let pg of pgVec) {
            let type = this.GetPaiType(pg.pai);
            if (type === ermj.MJ_TYPE_PAI.MJ_TYPE_PAI_JIAN ||
                type === ermj.MJ_TYPE_PAI.MJ_TYPE_PAI_FENG) return false;
            if (pg.pingHuType === ermj.PingHuType.TYPE_CHI) {
                if (pg.pai + 2 === ermj.MJ_TYPE.MJ_TYPE_W9) return false;
                else if (pg.pai === ermj.MJ_TYPE.MJ_TYPE_W1) return false;
            } else {
                if (pg.pai === ermj.MJ_TYPE.MJ_TYPE_W1 ||
                    pg.pai === ermj.MJ_TYPE.MJ_TYPE_W9) return false;
            }
        }
        return true;
    }

    CheckBaiWanDan = (hupai: number[], pgVec: ermj.ChiPengGangInfo[]) => {
        let allCount = 0;
        let hupaiPoints = this.GetPaiPoints(hupai);
        for (let point of hupaiPoints) {
            allCount += point;
        }

        for (let pg of pgVec) {
            if (pg.pingHuType === ermj.PingHuType.TYPE_CHI) {
                let tmpPgPoint1 = this.GetPaiPoint(pg.pai);
                let tmpPgPoint2 = this.GetPaiPoint(pg.pai + 1);
                let tmpPgPoint3 = this.GetPaiPoint(pg.pai + 2);
                allCount += tmpPgPoint1 + tmpPgPoint2 + tmpPgPoint3;
            } else if (pg.pingHuType === ermj.PingHuType.TYPE_PENG) {
                let point = this.GetPaiPoint(pg.pai);
                allCount += point * 3;
            } else if (pg.pingHuType <= 3) {//都是杠的类型
                let point = this.GetPaiPoint(pg.pai);
                allCount += point * 4;
            }
        }

        if (allCount < 100) return false;
        return true;
    }

    CheckQiDui(pgVec: ermj.ChiPengGangInfo[], huTempData: ermj.PaiCounter) {
        if (pgVec.length > 0) {
            return false;
        }
        for (let i = 0; i < huTempData.data.length; ++i) {
            if (huTempData.data[i][1] == 0) {
                continue;
            }
            if (huTempData.data[i][1] % 2 == 1) {
                return false;
            }
        }
        return true;
    }

    CheckContinue = (hupai: number[]) => {
        let tmp = hupai.concat();
        this.SortArrRemoveSame(tmp);
        for (let i = 0; i < tmp.length - 1; i++) {
            if (tmp[i] + 1 !== tmp[i + 1]) return false;
        }
        return true;
    }

    CheckLianQiDui = (hupai: number[]) => {
        return this.CheckContinue(hupai);
    }

    CheckGang = (mingCount: number, anCount: number, hutype: number[]) => {
        let allCount = mingCount + anCount;
        if (allCount === 4) {
            this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_SI_GANG, hutype);
        } else if (allCount === 3) {
            this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_SAN_GANG, hutype);
        } else if (mingCount === 2) {
            this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_SHUANG_MING_GANG, hutype);
        } else if (anCount === 2) {
            this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_SHUANG_AN_GANG, hutype);
        } else if (mingCount === 1 && anCount === 1) {
            this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_AN_GANG, hutype);
            this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_MING_GANG, hutype);
        } else if (mingCount === 1) {
            this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_MING_GANG, hutype);
        } else if (anCount === 1) {
            this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_AN_GANG, hutype);
        } else if (allCount === 0) {
            this.testPrint("[ermj]没有杠");
        } else {
            console.error("[ermj]杠牌数量有误：", allCount);
            return;
        }
    }

    CheckSiGui = (huTempData: ermj.PaiCounter, pgVec: ermj.ChiPengGangInfo[]) => {
        this._tmpData.Init();
        for (let pai of pgVec) {
            if (pai.pingHuType === ermj.PingHuType.TYPE_PENG) {
                for (let i = 0; i < 3; i++) {
                    this._tmpData.Add(pai.pai)
                }
            } else if (pai.pingHuType === ermj.PingHuType.TYPE_CHI) {
                this._tmpData.Add(pai.pai);
                this._tmpData.Add(pai.pai + 1);
                this._tmpData.Add(pai.pai + 2);
            }
        }

        for (let hDa of huTempData.data) {
            if (hDa[1] === 4) return true;
            for (let data of this._tmpData.data) {
                if (data[1] === 4) return true;
                if (hDa[0] === data[0] &&
                    hDa[1] + data[1] === 4) {
                    return true;
                }
            }
        }
        return false;
    }

    CheckSiAnKe = (huPaiInfo: ermj.HuPaiInfo) => {
        if (huPaiInfo.byAnKeziData.length + huPaiInfo.byAnGang.length === 4) return true;
        return false;
    }

    CheckSanAnKe = (huPaiInfo: ermj.HuPaiInfo) => {
        if (huPaiInfo.byAnKeziData.length + huPaiInfo.byAnGang.length === 3) return true;
        return false;
    }

    CheckShuangAnKe = (huPaiInfo: ermj.HuPaiInfo) => {
        if (huPaiInfo.byAnKeziData.length + huPaiInfo.byAnGang.length === 2) return true;
        return false;
    }

    CheckHunYaoJiu = (huPaiInfo: ermj.HuPaiInfo) => {
        if (huPaiInfo.byAnKeziData.length + huPaiInfo.byMingKeziData.length + huPaiInfo.byAnGang.length + huPaiInfo.byMingGang.length !== 4) return false;
        let jiangType = this.GetPaiType(huPaiInfo.byJiang);
        if (jiangType === ermj.MJ_TYPE_PAI.MJ_TYPE_PAI_NONE) {
            console.error("1[ermj]CheckHunYaoJiu-将牌类型有误:jiangType=", jiangType);
            return false;
        }
        if (jiangType === ermj.MJ_TYPE_PAI.MJ_TYPE_PAI_WAN) {
            if (huPaiInfo.byJiang !== ermj.MJ_TYPE.MJ_TYPE_W1 &&
                huPaiInfo.byJiang !== ermj.MJ_TYPE.MJ_TYPE_W9) {
                return false;
            }
        }
        for (let kezi of huPaiInfo.byMingKeziData) {
            let typ = this.GetPaiType(kezi);
            if (typ === ermj.MJ_TYPE_PAI.MJ_TYPE_PAI_NONE) {
                console.error("2[ermj]CheckHunYaoJiu-将牌类型有误:typ=", typ);
                return false;
            }
            if (typ === ermj.MJ_TYPE_PAI.MJ_TYPE_PAI_WAN) {
                if (kezi !== ermj.MJ_TYPE.MJ_TYPE_W1 &&
                    kezi !== ermj.MJ_TYPE.MJ_TYPE_W9) {
                    return false;
                }
            }
        }
        for (let kezi of huPaiInfo.byAnKeziData) {
            let typ = this.GetPaiType(kezi);
            if (typ === ermj.MJ_TYPE_PAI.MJ_TYPE_PAI_NONE) {
                console.error("3[ermj]CheckHunYaoJiu-将牌类型有误:typ=", typ);
                return false;
            }
            if (typ === ermj.MJ_TYPE_PAI.MJ_TYPE_PAI_WAN) {
                if (kezi !== ermj.MJ_TYPE.MJ_TYPE_W1 &&
                    kezi !== ermj.MJ_TYPE.MJ_TYPE_W9) {
                    return false;
                }
            }
        }
        for (let kezi of huPaiInfo.byAnGang) {
            let typ = this.GetPaiType(kezi);
            if (typ === ermj.MJ_TYPE_PAI.MJ_TYPE_PAI_NONE) {
                console.error("4[ermj]CheckHunYaoJiu-将牌类型有误:typ=", typ);
                return false;
            }
            if (typ === ermj.MJ_TYPE_PAI.MJ_TYPE_PAI_WAN) {
                if (kezi !== ermj.MJ_TYPE.MJ_TYPE_W1 &&
                    kezi !== ermj.MJ_TYPE.MJ_TYPE_W9) {
                    return false;
                }
            }
        }
        for (let kezi of huPaiInfo.byMingGang) {
            let typ = this.GetPaiType(kezi);
            if (typ === ermj.MJ_TYPE_PAI.MJ_TYPE_PAI_NONE) {
                console.error("5[ermj]CheckHunYaoJiu-将牌类型有误:typ=", typ);
                return false;
            }
            if (typ === ermj.MJ_TYPE_PAI.MJ_TYPE_PAI_WAN) {
                if (kezi !== ermj.MJ_TYPE.MJ_TYPE_W1 &&
                    kezi !== ermj.MJ_TYPE.MJ_TYPE_W9) {
                    return false;
                }
            }
        }
        for (let kezi of huPaiInfo.byAddGang) {
            let typ = this.GetPaiType(kezi);
            if (typ === ermj.MJ_TYPE_PAI.MJ_TYPE_PAI_NONE) {
                console.error("6[ermj]CheckHunYaoJiu-将牌类型有误:typ=", typ);
                return false;
            }
            if (typ === ermj.MJ_TYPE_PAI.MJ_TYPE_PAI_WAN) {
                if (kezi !== ermj.MJ_TYPE.MJ_TYPE_W1 &&
                    kezi !== ermj.MJ_TYPE.MJ_TYPE_W9) {
                    return false;
                }
            }
        }
        return true;
    }

    CheckPengPengHe = (huPaiInfo: ermj.HuPaiInfo) => {
        if (huPaiInfo.byShunData.length === 0) return true;
        return false;
    }

    CheckQuanDaiYao = (huPaiInfo: ermj.HuPaiInfo) => {
        if (this.GetPaiType(huPaiInfo.byJiang) === ermj.MJ_TYPE_PAI.MJ_TYPE_PAI_WAN) {
            if (huPaiInfo.byJiang !== ermj.MJ_TYPE.MJ_TYPE_W1 &&
                huPaiInfo.byJiang !== ermj.MJ_TYPE.MJ_TYPE_W9) {
                return false;
            }
        }
        for (let pai of huPaiInfo.byMingGang) {
            if (this.GetPaiType(pai) === ermj.MJ_TYPE_PAI.MJ_TYPE_PAI_WAN) {
                if (pai !== ermj.MJ_TYPE.MJ_TYPE_W1 &&
                    pai !== ermj.MJ_TYPE.MJ_TYPE_W9) {
                    return false;
                }
            }
        }
        for (let pai of huPaiInfo.byAnGang) {
            if (this.GetPaiType(pai) === ermj.MJ_TYPE_PAI.MJ_TYPE_PAI_WAN) {
                if (pai !== ermj.MJ_TYPE.MJ_TYPE_W1 &&
                    pai !== ermj.MJ_TYPE.MJ_TYPE_W9) {
                    return false;
                }
            }
        }
        for (let pai of huPaiInfo.byAddGang) {
            if (this.GetPaiType(pai) === ermj.MJ_TYPE_PAI.MJ_TYPE_PAI_WAN) {
                if (pai !== ermj.MJ_TYPE.MJ_TYPE_W1 &&
                    pai !== ermj.MJ_TYPE.MJ_TYPE_W9) {
                    return false;
                }
            }
        }
        for (let pai of huPaiInfo.byMingKeziData) {
            if (this.GetPaiType(pai) === ermj.MJ_TYPE_PAI.MJ_TYPE_PAI_WAN) {
                if (pai !== ermj.MJ_TYPE.MJ_TYPE_W1 &&
                    pai !== ermj.MJ_TYPE.MJ_TYPE_W9) {
                    return false;
                }
            }
        }
        for (let pai of huPaiInfo.byAnKeziData) {
            if (this.GetPaiType(pai) === ermj.MJ_TYPE_PAI.MJ_TYPE_PAI_WAN) {
                if (pai !== ermj.MJ_TYPE.MJ_TYPE_W1 &&
                    pai !== ermj.MJ_TYPE.MJ_TYPE_W9) {
                    return false;
                }
            }
        }
        for (let pai of huPaiInfo.byShunData) {
            if (this.GetPaiType(pai) === ermj.MJ_TYPE_PAI.MJ_TYPE_PAI_WAN) {
                if (pai !== ermj.MJ_TYPE.MJ_TYPE_W1 &&
                    pai !== ermj.MJ_TYPE.MJ_TYPE_W9) {
                    return false;
                }
            }
        }
        return true;
    }

    CheckYaoJiuKe = (huPaiInfo: ermj.HuPaiInfo) => {
        if (huPaiInfo.byMingKeziData.length + huPaiInfo.byAnKeziData.length + huPaiInfo.byAddGang.length + huPaiInfo.byAnGang.length + huPaiInfo.byMingGang.length === 0) return false;
        for (let pai of huPaiInfo.byMingKeziData) {
            let typ = this.GetPaiType(pai);
            if (typ === ermj.MJ_TYPE_PAI.MJ_TYPE_PAI_WAN) {
                if (pai === ermj.MJ_TYPE.MJ_TYPE_W1 ||
                    pai === ermj.MJ_TYPE.MJ_TYPE_W9) {
                    return true;
                }
            } else if (typ === ermj.MJ_TYPE_PAI.MJ_TYPE_PAI_JIAN ||
                typ === ermj.MJ_TYPE_PAI.MJ_TYPE_PAI_FENG) {
                return true;
            }
        }
        for (let pai of huPaiInfo.byAnKeziData) {
            let typ = this.GetPaiType(pai);
            if (typ === ermj.MJ_TYPE_PAI.MJ_TYPE_PAI_WAN) {
                if (pai === ermj.MJ_TYPE.MJ_TYPE_W1 ||
                    pai === ermj.MJ_TYPE.MJ_TYPE_W9) {
                    return true;
                }
            } else if (typ === ermj.MJ_TYPE_PAI.MJ_TYPE_PAI_JIAN ||
                typ === ermj.MJ_TYPE_PAI.MJ_TYPE_PAI_FENG) {
                return true;
            }
        }
        for (let pai of huPaiInfo.byMingGang) {
            let typ = this.GetPaiType(pai);
            if (typ === ermj.MJ_TYPE_PAI.MJ_TYPE_PAI_WAN) {
                if (pai === ermj.MJ_TYPE.MJ_TYPE_W1 ||
                    pai === ermj.MJ_TYPE.MJ_TYPE_W9) {
                    return true;
                }
            } else if (typ === ermj.MJ_TYPE_PAI.MJ_TYPE_PAI_JIAN ||
                typ === ermj.MJ_TYPE_PAI.MJ_TYPE_PAI_FENG) {
                return true;
            }
        }
        for (let pai of huPaiInfo.byAnGang) {
            let typ = this.GetPaiType(pai);
            if (typ === ermj.MJ_TYPE_PAI.MJ_TYPE_PAI_WAN) {
                if (pai === ermj.MJ_TYPE.MJ_TYPE_W1 ||
                    pai === ermj.MJ_TYPE.MJ_TYPE_W9) {
                    return true;
                }
            } else if (typ === ermj.MJ_TYPE_PAI.MJ_TYPE_PAI_JIAN ||
                typ === ermj.MJ_TYPE_PAI.MJ_TYPE_PAI_FENG) {
                return true;
            }
        }
        for (let pai of huPaiInfo.byAddGang) {
            let typ = this.GetPaiType(pai);
            if (typ === ermj.MJ_TYPE_PAI.MJ_TYPE_PAI_WAN) {
                if (pai === ermj.MJ_TYPE.MJ_TYPE_W1 ||
                    pai === ermj.MJ_TYPE.MJ_TYPE_W9) {
                    return true;
                }
            } else if (typ === ermj.MJ_TYPE_PAI.MJ_TYPE_PAI_JIAN ||
                typ === ermj.MJ_TYPE_PAI.MJ_TYPE_PAI_FENG) {
                return true;
            }
        }
        return false;
    }

    CheckYiSeSiTongShun = (huPaiInfo: ermj.HuPaiInfo) => {
        let shunData = huPaiInfo.byShunData;
        if (shunData.length !== 4) return false;
        if (shunData[0] !== shunData[1] ||
            shunData[1] !== shunData[2] ||
            shunData[2] !== shunData[3]) {
            return false;
        }
        return true;
    }

    CheckYiSeSiJieGao = (huPaiInfo: ermj.HuPaiInfo) => {
        if (huPaiInfo.byMingKeziData.length + huPaiInfo.byAnKeziData.length + huPaiInfo.byMingGang.length + huPaiInfo.byAnGang.length + huPaiInfo.byAddGang.length !== 4) return false;
        let allKeZi: number[] = [];
        for (let pai of huPaiInfo.byMingKeziData) {
            allKeZi.push(pai);
        }
        for (let pai of huPaiInfo.byAnKeziData) {
            allKeZi.push(pai);
        }
        for (let pai of huPaiInfo.byMingGang) {
            allKeZi.push(pai);
        }
        for (let pai of huPaiInfo.byAnGang) {
            allKeZi.push(pai);
        }
        for (let pai of huPaiInfo.byAddGang) {
            allKeZi.push(pai);
        }
        allKeZi.sort((a, b) => {
            return a - b;
        })
        if (allKeZi[0] + 1 !== allKeZi[1] ||
            allKeZi[1] + 1 !== allKeZi[2] ||
            allKeZi[2] + 1 !== allKeZi[3]) {
            return false;
        }
        return true;
    }

    CheckYiSeSiBuGao = (huPaiInfo: ermj.HuPaiInfo) => {
        let szData = huPaiInfo.byShunData;
        if (szData.length !== 4) return false;
        szData.sort((a, b) => {
            return a - b;
        })

        if (szData[0] + 1 === szData[1] &&
            szData[1] + 1 === szData[2] &&
            szData[2] + 1 === szData[3]) {
            return true;
        }

        if (szData[0] + 2 === szData[1] &&
            szData[1] + 2 === szData[2] &&
            szData[2] + 2 === szData[3]) {
            return true;
        }
    }

    CheckYiSeSanTongShun = (huPaiInfo: ermj.HuPaiInfo) => {
        let shunData = huPaiInfo.byShunData;
        if (shunData.length < 3) return false;
        let szObj: { [sz: number]: number } = {};
        for (let sz of shunData) {
            if (szObj[sz]) {
                szObj[sz]++;
                if (szObj[sz] === 3) return true;
            } else {
                szObj[sz] = 1;
            }
        }

        return false;
    }

    CheckYiSeSanJieGao = (huPaiInfo: ermj.HuPaiInfo) => {
        if (huPaiInfo.byAnKeziData.length + huPaiInfo.byMingKeziData.length + huPaiInfo.byMingGang.length + huPaiInfo.byAnGang.length + huPaiInfo.byAddGang.length < 3) return false;
        let allKeZi: number[] = [];
        for (let pai of huPaiInfo.byMingKeziData) {
            allKeZi.push(pai);
        }
        for (let pai of huPaiInfo.byAnKeziData) {
            allKeZi.push(pai);
        }
        for (let pai of huPaiInfo.byMingGang) {
            allKeZi.push(pai);
        }
        for (let pai of huPaiInfo.byAnGang) {
            allKeZi.push(pai);
        }
        for (let pai of huPaiInfo.byAddGang) {
            allKeZi.push(pai);
        }
        allKeZi.sort((a, b) => {
            return a - b;
        })
        if (allKeZi.length === 3) {
            if (allKeZi[0] + 1 === allKeZi[1] &&
                allKeZi[1] + 1 === allKeZi[2]) {
                return true;
            }
        } else if (allKeZi.length === 4) {
            this.SortArrRemoveSame(allKeZi);
            let len = allKeZi.length;
            if (len < 3) return false;
            if (allKeZi[0] + 1 === allKeZi[1] &&
                allKeZi[1] + 1 === allKeZi[2]) {
                return true;
            }
            if (allKeZi[len - 3] + 1 === allKeZi[len - 2] &&
                allKeZi[len - 2] + 1 === allKeZi[len - 1]) {
                return true;
            }
        }

        return false;
    }

    CheckYiSeSanBuGao = (huPaiInfo: ermj.HuPaiInfo) => {
        let szData = huPaiInfo.byShunData.concat();
        if (szData.length < 3) return false;
        szData.sort((a, b) => {
            return a - b;
        })

        if (szData.length === 3) {
            if (szData[0] + 1 === szData[1] &&
                szData[1] + 1 === szData[2]) {
                return true;
            }
            if (szData[0] + 2 === szData[1] &&
                szData[1] + 2 === szData[2]) {
                return true;
            }
        } else if (szData.length === 4) {
            this.SortArrRemoveSame(szData);
            let len = szData.length;
            if (len < 3) return false;
            if (szData[0] + 1 === szData[1] &&
                szData[1] + 1 === szData[2]) {
                return true;
            }
            if (szData[len - 3] + 1 === szData[len - 2] &&
                szData[len - 2] + 1 === szData[len - 1]) {
                return true;
            }
            if (szData[0] + 2 === szData[1] &&
                szData[1] + 2 === szData[2]) {
                return true;
            }
            if (szData[len - 3] + 2 === szData[len - 2] &&
                szData[len - 2] + 2 === szData[len - 1]) {
                return true;
            }
        }
        return false;
    }

    CheckDaSiXi = (huPaiInfo: ermj.HuPaiInfo) => {
        if (huPaiInfo.byAnKeziData.length + huPaiInfo.byMingKeziData.length +
            huPaiInfo.byAddGang.length + huPaiInfo.byAnGang.length +
            huPaiInfo.byMingGang.length !== 4) return false;
        for (let kz of huPaiInfo.byAnKeziData) {
            if (this.GetPaiType(kz) !== ermj.MJ_TYPE_PAI.MJ_TYPE_PAI_FENG) return false;
        }
        for (let kz of huPaiInfo.byMingKeziData) {
            if (this.GetPaiType(kz) !== ermj.MJ_TYPE_PAI.MJ_TYPE_PAI_FENG) return false;
        }
        for (let ga of huPaiInfo.byAnGang) {
            if (this.GetPaiType(ga) !== ermj.MJ_TYPE_PAI.MJ_TYPE_PAI_FENG) return false;
        }
        for (let ga of huPaiInfo.byMingGang) {
            if (this.GetPaiType(ga) !== ermj.MJ_TYPE_PAI.MJ_TYPE_PAI_FENG) return false;
        }
        for (let ga of huPaiInfo.byAddGang) {
            if (this.GetPaiType(ga) !== ermj.MJ_TYPE_PAI.MJ_TYPE_PAI_FENG) return false;
        }
        return true;
    }

    CheckXiaoSiXi = (huPaiInfo: ermj.HuPaiInfo) => {
        if (this.GetPaiType(huPaiInfo.byJiang) !== ermj.MJ_TYPE_PAI.MJ_TYPE_PAI_FENG) return false;
        if (huPaiInfo.byAnKeziData.length + huPaiInfo.byMingKeziData.length +
            huPaiInfo.byAddGang.length + huPaiInfo.byAnGang.length +
            huPaiInfo.byMingGang.length < 3) return false;
        let fengCount = 0;
        for (let kz of huPaiInfo.byAnKeziData) {
            if (this.GetPaiType(kz) === ermj.MJ_TYPE_PAI.MJ_TYPE_PAI_FENG) fengCount++;
        }
        for (let kz of huPaiInfo.byMingKeziData) {
            if (this.GetPaiType(kz) === ermj.MJ_TYPE_PAI.MJ_TYPE_PAI_FENG) fengCount++;
        }
        for (let ga of huPaiInfo.byAnGang) {
            if (this.GetPaiType(ga) === ermj.MJ_TYPE_PAI.MJ_TYPE_PAI_FENG) fengCount++;
        }
        for (let ga of huPaiInfo.byMingGang) {
            if (this.GetPaiType(ga) === ermj.MJ_TYPE_PAI.MJ_TYPE_PAI_FENG) fengCount++;
        }
        for (let ga of huPaiInfo.byAddGang) {
            if (this.GetPaiType(ga) === ermj.MJ_TYPE_PAI.MJ_TYPE_PAI_FENG) fengCount++;
        }
        if (fengCount === 3) return true;
        return false;
    }

    CheckQingLong = (hupai: number[], pgVec: ermj.ChiPengGangInfo[]) => {
        let allPai = hupai.concat();
        for (let pg of pgVec) {
            if (pg.pingHuType === ermj.PingHuType.TYPE_CHI) {
                allPai.push(pg.pai);
                allPai.push(pg.pai + 1);
                allPai.push(pg.pai + 2);
            } else if (this.GetPaiType(pg.pai) === ermj.MJ_TYPE_PAI.MJ_TYPE_PAI_WAN) {
                allPai.push(pg.pai);
            }
        }
        allPai.sort((a, b) => {
            return a - b;
        })
        this.SortArrRemoveSame(allPai);
        if (allPai[0] !== ermj.MJ_TYPE.MJ_TYPE_W1 ||
            allPai[allPai.length - 1] !== ermj.MJ_TYPE.MJ_TYPE_W9) {
            return false;
        }
        for (let i = 0; i < allPai.length - 1; i++) {
            if (allPai[i] + 1 !== allPai[i + 1]) return false;
        }
        return true;
    }

    CheckSanFengKe = (huPaiInfo: ermj.HuPaiInfo) => {
        if (huPaiInfo.byAnKeziData.length + huPaiInfo.byMingKeziData.length +
            huPaiInfo.byAddGang.length + huPaiInfo.byAnGang.length +
            huPaiInfo.byMingGang.length < 3) return false;
        let fengKZCount = 0;
        for (let kz of huPaiInfo.byMingKeziData) {
            if (this.GetPaiType(kz) === ermj.MJ_TYPE_PAI.MJ_TYPE_PAI_FENG) fengKZCount++;
        }
        if (fengKZCount >= 3) return true;
        for (let kz of huPaiInfo.byAnKeziData) {
            if (this.GetPaiType(kz) === ermj.MJ_TYPE_PAI.MJ_TYPE_PAI_FENG) fengKZCount++;
        }
        if (fengKZCount >= 3) return true;
        for (let ga of huPaiInfo.byAnGang) {
            if (this.GetPaiType(ga) === ermj.MJ_TYPE_PAI.MJ_TYPE_PAI_FENG) fengKZCount++;
        }
        if (fengKZCount >= 3) return true;
        for (let ga of huPaiInfo.byMingGang) {
            if (this.GetPaiType(ga) === ermj.MJ_TYPE_PAI.MJ_TYPE_PAI_FENG) fengKZCount++;
        }
        if (fengKZCount >= 3) return true;
        for (let ga of huPaiInfo.byAddGang) {
            if (this.GetPaiType(ga) === ermj.MJ_TYPE_PAI.MJ_TYPE_PAI_FENG) fengKZCount++;
        }
        if (fengKZCount >= 3) return true;
        return false;
    }

    CheckDaSanYuan = (huPaiInfo: ermj.HuPaiInfo) => {
        if (huPaiInfo.byAnKeziData.length + huPaiInfo.byMingKeziData.length +
            huPaiInfo.byAddGang.length + huPaiInfo.byAnGang.length +
            huPaiInfo.byMingGang.length < 3) return false;
        let jianKZCount = 0;
        for (let kz of huPaiInfo.byMingKeziData) {
            if (this.GetPaiType(kz) === ermj.MJ_TYPE_PAI.MJ_TYPE_PAI_JIAN) jianKZCount++;
        }
        if (jianKZCount === 3) return true;
        for (let kz of huPaiInfo.byAnKeziData) {
            if (this.GetPaiType(kz) === ermj.MJ_TYPE_PAI.MJ_TYPE_PAI_JIAN) jianKZCount++;
        }
        if (jianKZCount === 3) return true;
        for (let ga of huPaiInfo.byAnGang) {
            if (this.GetPaiType(ga) === ermj.MJ_TYPE_PAI.MJ_TYPE_PAI_JIAN) jianKZCount++;
        }
        if (jianKZCount === 3) return true;
        for (let ga of huPaiInfo.byMingGang) {
            if (this.GetPaiType(ga) === ermj.MJ_TYPE_PAI.MJ_TYPE_PAI_JIAN) jianKZCount++;
        }
        if (jianKZCount >= 3) return true;
        for (let ga of huPaiInfo.byAddGang) {
            if (this.GetPaiType(ga) === ermj.MJ_TYPE_PAI.MJ_TYPE_PAI_JIAN) jianKZCount++;
        }
        if (jianKZCount >= 3) return true;
        return false;
    }

    CheckXiaoSanYuan = (huPaiInfo: ermj.HuPaiInfo) => {
        if (this.GetPaiType(huPaiInfo.byJiang) !== ermj.MJ_TYPE_PAI.MJ_TYPE_PAI_JIAN) return false;
        return this.CheckShuangJianKe(huPaiInfo)
    }

    CheckShuangJianKe = (huPaiInfo: ermj.HuPaiInfo) => {
        if (huPaiInfo.byAnKeziData.length + huPaiInfo.byMingKeziData.length +
            huPaiInfo.byAddGang.length + huPaiInfo.byAnGang.length +
            huPaiInfo.byMingGang.length < 2) return false;
        let jianKZCount = 0;
        for (let kz of huPaiInfo.byMingKeziData) {
            if (this.GetPaiType(kz) === ermj.MJ_TYPE_PAI.MJ_TYPE_PAI_JIAN) jianKZCount++;
        }
        if (jianKZCount >= 2) return true;
        for (let kz of huPaiInfo.byAnKeziData) {
            if (this.GetPaiType(kz) === ermj.MJ_TYPE_PAI.MJ_TYPE_PAI_JIAN) jianKZCount++;
        }
        if (jianKZCount >= 2) return true;
        for (let ga of huPaiInfo.byAnGang) {
            if (this.GetPaiType(ga) === ermj.MJ_TYPE_PAI.MJ_TYPE_PAI_JIAN) jianKZCount++;
        }
        if (jianKZCount >= 2) return true;
        for (let ga of huPaiInfo.byMingGang) {
            if (this.GetPaiType(ga) === ermj.MJ_TYPE_PAI.MJ_TYPE_PAI_JIAN) jianKZCount++;
        }
        if (jianKZCount >= 2) return true;
        for (let ga of huPaiInfo.byAddGang) {
            if (this.GetPaiType(ga) === ermj.MJ_TYPE_PAI.MJ_TYPE_PAI_JIAN) jianKZCount++;
        }
        if (jianKZCount >= 2) return true;
        return false;
    }

    CheckJianKe = (huPaiInfo: ermj.HuPaiInfo) => {
        if (huPaiInfo.byMingKeziData.length + huPaiInfo.byAnKeziData.length +
            huPaiInfo.byAddGang.length + huPaiInfo.byAnGang.length +
            huPaiInfo.byMingGang.length === 0) return false;
        for (let kz of huPaiInfo.byMingKeziData) {
            if (this.GetPaiType(kz) === ermj.MJ_TYPE_PAI.MJ_TYPE_PAI_JIAN) return true;
        }
        for (let kz of huPaiInfo.byAnKeziData) {
            if (this.GetPaiType(kz) === ermj.MJ_TYPE_PAI.MJ_TYPE_PAI_JIAN) return true;
        }
        for (let kz of huPaiInfo.byMingGang) {
            if (this.GetPaiType(kz) === ermj.MJ_TYPE_PAI.MJ_TYPE_PAI_JIAN) return true;
        }
        for (let kz of huPaiInfo.byAnGang) {
            if (this.GetPaiType(kz) === ermj.MJ_TYPE_PAI.MJ_TYPE_PAI_JIAN) return true;
        }
        for (let kz of huPaiInfo.byAddGang) {
            if (this.GetPaiType(kz) === ermj.MJ_TYPE_PAI.MJ_TYPE_PAI_JIAN) return true;
        }
        return false;
    }

    CheckHeJueZhang = (appearPai: number[], lastPai: number) => {
        this._tmpData.Init();
        for (let pai of appearPai) {
            this._tmpData.Add(pai);
        }
        for (let data of this._tmpData.data) {
            if (data[0] === lastPai && data[1] === 3) return true;
        }
        return false;
    }

    CheckPingHe = (huPaiInfo: ermj.HuPaiInfo) => {
        if (huPaiInfo.byShunData.length !== 4 || this.GetPaiType(huPaiInfo.byJiang) !== ermj.MJ_TYPE_PAI.MJ_TYPE_PAI_WAN) return false;
    }

    CheckErWuBaJiang = (huPaiInfo: ermj.HuPaiInfo) => {
        if (huPaiInfo.byJiang === ermj.MJ_TYPE.MJ_TYPE_W2 ||
            huPaiInfo.byJiang === ermj.MJ_TYPE.MJ_TYPE_W5 ||
            huPaiInfo.byJiang === ermj.MJ_TYPE.MJ_TYPE_W8) {
            return true;
        }
        return false;
    }

    CheckYaoJiuTou = (huPaiInfo: ermj.HuPaiInfo) => {
        if (huPaiInfo.byJiang === ermj.MJ_TYPE.MJ_TYPE_W1 ||
            huPaiInfo.byJiang === ermj.MJ_TYPE.MJ_TYPE_W9) {
            return true;
        }
        return false;
    }

    CheckYiBanGao = (huPaiInfo: ermj.HuPaiInfo) => {
        if (huPaiInfo.byShunData.length < 2) return false;
        this._tmpData.Init();
        for (let sz of huPaiInfo.byShunData) {
            this._tmpData.Add(sz);
        }

        for (let data of this._tmpData.data) {
            if (data[1] === 2) return true;
        }
        return false;
    }

    CheckLianLiu = (hupai: number[], pgVec: ermj.ChiPengGangInfo[]) => {
        let tmp = hupai.concat();
        for (let pg of pgVec) {
            if (pg.pingHuType === ermj.PingHuType.TYPE_CHI) {
                tmp.push(pg.pai);
                tmp.push(pg.pai + 1);
                tmp.push(pg.pai + 2);
            } else {
                tmp.push(pg.pai);
            }
        }
        tmp.sort((a, b) => {
            return a - b;
        })
        this.SortArrRemoveSame(tmp);
        if (tmp.length < 6) return false;
        for (let i = 0; i < tmp.length - 5; i++) {
            if (tmp[i] + 1 === tmp[i + 1] &&
                tmp[i + 1] + 1 === tmp[i + 2] &&
                tmp[i + 2] + 1 === tmp[i + 3] &&
                tmp[i + 3] + 1 === tmp[i + 4] &&
                tmp[i + 4] + 1 === tmp[i + 5]) {
                return true;
            }
        }
        return false;
    }

    CheckLaoShaoFu = (huPaiInfo: ermj.HuPaiInfo) => {
        if (huPaiInfo.byShunData.length < 2) return false;
        let sz_1WCount = 0;
        let sz_7WCount = 0;
        for (let sz of huPaiInfo.byShunData) {
            if (sz === ermj.MJ_TYPE.MJ_TYPE_W1) sz_1WCount++;
            else if (sz === ermj.MJ_TYPE.MJ_TYPE_W7) sz_7WCount++;
        }
        if (sz_1WCount > 0 && sz_7WCount > 0) return true;
        return false;
    }

    CheckBianZhang = (huPaiInfo: ermj.HuPaiInfo, lastPai: number) => {
        if (huPaiInfo.byShunData.length === 0) return false;
        if (lastPai === ermj.MJ_TYPE.MJ_TYPE_W3) {
            let isHas123ShunZi = false;
            let isHas345ShunZi = false;
            for (let sz of huPaiInfo.byShunData) {
                if (sz === ermj.MJ_TYPE.MJ_TYPE_W1) {
                    isHas123ShunZi = true;
                }
                if (sz === ermj.MJ_TYPE.MJ_TYPE_W3) {
                    isHas345ShunZi = true;
                }
            }
            if (isHas123ShunZi && !isHas345ShunZi) return true;
        } else if (lastPai === ermj.MJ_TYPE.MJ_TYPE_W7) {
            let isHas789ShunZi = false;
            let isHas567ShunZi = false;
            for (let sz of huPaiInfo.byShunData) {
                if (sz === ermj.MJ_TYPE.MJ_TYPE_W7) {
                    isHas789ShunZi = true;
                }
                if (sz === ermj.MJ_TYPE.MJ_TYPE_W5) {
                    isHas567ShunZi = true;
                }
            }
            if (isHas789ShunZi && !isHas567ShunZi) return true;
        }
        return false;
    }

    CheckKanZhang = (huPaiInfo: ermj.HuPaiInfo, lastPai: number, rPos: number) => {
        if (huPaiInfo.byShunData.length === 0) return false;
        let isKanZhang = false;
        let isOtherLastPaiSZ = false;
        for (let sz of huPaiInfo.byShunData) {
            if (sz + 1 === lastPai) {
                isKanZhang = true;
            }
            if (sz === lastPai) {
                isOtherLastPaiSZ = true;
            }
            if (sz - 2 === lastPai) {
                isOtherLastPaiSZ = true;
            }
        }
        if (isKanZhang && !isOtherLastPaiSZ) return true;
        return false;
    }

    CheckDanDiaoJiang = (huPaiInfo: ermj.HuPaiInfo, lastPai: number) => {
        let jiang = huPaiInfo.byJiang;
        if (jiang !== lastPai) return false;
        for (let sz of huPaiInfo.byShunData) {
            if ((sz === jiang - 3 &&
                sz + 1 === jiang - 2 &&
                sz + 2 === jiang - 1) ||
                (sz === jiang + 1 &&
                    sz + 1 === jiang + 2 &&
                    sz + 2 === jiang + 3)) {
                return false
            }
        }
        return true;
    }

    CheckQuanFengKe = (huPaiInfo: ermj.HuPaiInfo, quanFeng: number) => {
        for (let kz of huPaiInfo.byAnKeziData) {
            if (kz === quanFeng) return true;
        }
        for (let kz of huPaiInfo.byMingKeziData) {
            if (kz === quanFeng) return true;
        }
        return false;
    }

    CheckMenFengKe = (huPaiInfo: ermj.HuPaiInfo, menFeng: number) => {
        for (let kz of huPaiInfo.byAnKeziData) {
            if (kz === menFeng) return true;
        }
        for (let kz of huPaiInfo.byMingKeziData) {
            if (kz === menFeng) return true;
        }
        return false;
    }

    CanHu = (handlePai: number[],
        lastPai: number,
        pgVec: ermj.ChiPengGangInfo[],
        hutype: number[],
        appearPai: number[],
        rPos: number,
        pHuInfo: ermj.HuPaiInfo[],
        quanFeng: number,
        menFeng: number) => {
        let handPai: number[] = handlePai.concat();
        if (lastPai != 0) {
            handPai.push(lastPai);
        }

        handPai.sort((a, b) => {
            return a - b;
        })
        let bCanHu: boolean = false;
        let huTempData = new ermj.PaiCounter();
        this.ChangeHandPaiData(handPai, huTempData);
        let gangCount = this.GetGangCount(pgVec);
        let mingCount = gangCount[0];
        let anCount = gangCount[1];
        let allCount = mingCount + anCount;
        let yiSe = this.CheckYiSe(huTempData, pgVec);
        let pingHuType: ermj.HuPaiInfo[] = [];
        if (this.CheckQiDui(pgVec, huTempData)) {
            bCanHu = true;
            this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_QI_DUI, hutype);
            if (this.CheckLianQiDui(handPai)) {
                this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_LIAN_QI_DUI, hutype);
            } else if (yiSe === ermj.YI_SE.YI_SE_QING) {
                this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_QING_YI_SE, hutype);
            } else if (yiSe === ermj.YI_SE.YI_SE_ZI) {
                this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_ZI_YI_SE, hutype);
            } else if (yiSe === ermj.YI_SE.YI_SE_HUN) {
                this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_HUN_YI_SE, hutype);
            }
        }
        if (this.CheckPingHu(huTempData, pgVec, pingHuType, lastPai, rPos)) {
            bCanHu = true;
            for (let pHu of pingHuType) {
                let tmpHuType: number[] = [];
                this.CheckPingHuData(pgVec, pHu);
                if (yiSe === ermj.YI_SE.YI_SE_QING) {
                    this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_QING_YI_SE, tmpHuType);
                    if (this.CheckJiuLianBaoDeng(huTempData, pgVec)) {
                        this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_JIU_LIAN_BAO_DENG, tmpHuType);
                    } else if (this.CheckDaYuWu(huTempData, pgVec)) {
                        this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_DA_YU_WU, tmpHuType);
                    } else if (this.CheckXiaoYuWu(huTempData, pgVec)) {
                        this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_XIAO_YU_WU, tmpHuType);
                    } else if (this.CheckDuanYao(huTempData, pgVec)) {
                        this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_DUAN_YAO, tmpHuType);
                    }

                    if (this.CheckBaiWanDan(handPai, pgVec)) {
                        this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_BAI_WAN_DAN, tmpHuType);
                    }

                    if (this.CheckYiSeShuangLongHui(handPai, pgVec)) {
                        this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_YI_SE_SHUANG_LONG_HUI, tmpHuType);
                    }
                } else if (yiSe === ermj.YI_SE.YI_SE_ZI) {
                    this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_ZI_YI_SE, tmpHuType);
                } else if (yiSe === ermj.YI_SE.YI_SE_HUN) {
                    this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_HUN_YI_SE, tmpHuType);
                    if (this.CheckHunYaoJiu(pHu)) {
                        this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_HUN_YAO_JIU, tmpHuType);
                    }
                }

                if (this.CheckDaSiXi(pHu)) {
                    this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_DA_SI_XI, tmpHuType);
                } else if (this.CheckXiaoSiXi(pHu)) {
                    this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_XIAO_SI_XI, tmpHuType);
                } else if (this.CheckSanFengKe(pHu)) {
                    this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_SAN_FENG_KE, tmpHuType);
                } else if (this.CheckDaSanYuan(pHu)) {
                    this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_DA_SAN_YUAN, tmpHuType);
                } else if (this.CheckXiaoSanYuan(pHu)) {
                    this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_XIAO_SAN_YUAN, tmpHuType);
                } else if (this.CheckShuangAnKe(pHu)) {
                    this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_SHUANG_AN_KE, tmpHuType);
                }

                if (this.CheckJianKe(pHu)) {
                    this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_JIAN_KE, tmpHuType);
                } else if (this.CheckYaoJiuKe(pHu)) {
                    this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_YAO_JIU_KE, tmpHuType);
                }

                if (this.CheckSiAnKe(pHu)) {
                    this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_SI_AN_KE, tmpHuType);
                } else if (this.CheckSanAnKe(pHu)) {
                    this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_SAN_AN_KE, tmpHuType);
                } else if (this.CheckShuangAnKe(pHu)) {
                    this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_SHUANG_AN_KE, tmpHuType);
                }

                if (this.CheckYiSeSiTongShun(pHu)) {
                    this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_YI_SE_SI_TONG_SHUN, tmpHuType);
                } else if (this.CheckYiSeSiJieGao(pHu)) {
                    this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_YI_SE_SI_JIE_GAO, tmpHuType);
                } else if (this.CheckYiSeSiBuGao(pHu)) {
                    this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_YI_SE_SI_BU_GAO, tmpHuType);
                } else if (this.CheckYiSeSanTongShun(pHu)) {
                    this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_YI_SE_SAN_TONG_SHUN, tmpHuType);
                } else if (this.CheckYiSeSanJieGao(pHu)) {
                    this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_YI_SE_SAN_JIE_GAO, tmpHuType);
                } else if (this.CheckYiSeSanBuGao(pHu)) {
                    this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_YI_SE_SAN_BU_GAO, tmpHuType);
                } else if (this.CheckYiBanGao(pHu)) {
                    this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_YI_BAN_GAO, tmpHuType);
                }

                if (this.CheckPengPengHe(pHu)) {
                    this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_PENG_PENG_HE, tmpHuType);
                } else if (this.CheckQingLong(handPai, pgVec)) {
                    this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_QING_LONG, tmpHuType);
                } else if (this.CheckLianLiu(handPai, pgVec)) {
                    this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_LIAN_LIU, tmpHuType);
                } else if (this.CheckLaoShaoFu(pHu)) {
                    this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_LAO_SHAO_FU, tmpHuType);
                }

                if (this.CheckPingHe(pHu)) {
                    this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_PING_HE, tmpHuType);
                }

                if (this.CheckErWuBaJiang(pHu)) {
                    this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_ER_WU_BA_JIANG, tmpHuType);
                } else if (this.CheckYaoJiuTou(pHu)) {
                    this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_YAO_JIU_TOU, tmpHuType);
                }

                if (this.CheckQuanDaiYao(pHu)) {
                    this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_QUAN_DAI_YAO, tmpHuType);
                }
                if (this.CheckShuangJianKe(pHu)) {
                    this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_SHUANG_JIAN_KE, tmpHuType);
                }

                if (this.CheckBianZhang(pHu, lastPai)) {
                    this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_BIAN_ZHANG, tmpHuType);
                } else if (this.CheckKanZhang(pHu, lastPai, rPos)) {
                    this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_KAN_ZHANG, tmpHuType);
                } else if (this.CheckDanDiaoJiang(pHu, lastPai)) {
                    this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_DAN_DIAO_JIANG, tmpHuType);
                }


                if (this.CheckQuanFengKe(pHu, quanFeng)) {
                    this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_QUAN_FENG_KE, tmpHuType);
                }

                if (this.CheckMenFengKe(pHu, menFeng)) {
                    this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_MEN_FENG_KE, tmpHuType);
                }

                this.CheckGang(mingCount, anCount, tmpHuType);
                pHu.fan = this.GetFan(tmpHuType);
                pHu.huPaiType = tmpHuType;
            }
        }
        if (hutype.length > 0) {
            pingHuType.push({
                huPaiType: hutype,
                fan: this.GetFan(hutype) //只需要这两个元素
            });
        }
        let huTypeAndInfo = this.GetMaxFanTypesAndPHuInfo(pingHuType);
        hutype = huTypeAndInfo.types.concat();
        pHuInfo.push(huTypeAndInfo.pHu);

        if (this.CheckSiGui(huTempData, pgVec)) {
            this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_SI_GUI, hutype);
        }

        if (this.CheckHeJueZhang(appearPai, lastPai)) {
            this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_HE_JUE_ZHANG, hutype);
        }

        this.CheckFilter(hutype);
        this._huType = hutype.concat();
        this.testPrint("[ermj]hutype:", hutype);

        return hutype;
    }

    GetMaxFanTypesAndPHuInfo = (pingHuType: ermj.HuPaiInfo[]) => {
        let maxFanType: number[] = [];
        let pHuInfo: ermj.HuPaiInfo;
        let maxFan = 0;
        for (let pht of pingHuType) {
            if (maxFan < pht.fan) {
                maxFan = pht.fan;
                maxFanType = pht.huPaiType;
                pHuInfo = pht;
            }
        }
        return { types: maxFanType, pHu: pHuInfo };
    }

    CheckQiangGangHe = (rPos: number, lastPai: number) => {
        let userAction = this._userAction;
        if (userAction.length < 4) return false;
        let huPos = userAction.length - 1;
        let gangPos = userAction.length - 2;
        if (userAction[huPos].action === ermj.Action.USER_ACTION_HU &&
            userAction[huPos].pai === lastPai &&
            userAction[huPos].pos === rPos &&
            userAction[gangPos].action === ermj.Action.USER_ACTION_GANG &&
            userAction[gangPos].pai === lastPai &&
            userAction[gangPos].pos !== rPos) {
            return true;
        }
        return false;
    }

    CheckZiMo = (rPos: number, lastPai: number) => {
        let userAction = this._userAction;
        if (userAction.length < 2) return false;
        let huPos = userAction.length - 1;
        let moPos = userAction.length - 2;
        if (userAction[huPos].action === ermj.Action.USER_ACTION_HU &&
            userAction[huPos].pai === lastPai &&
            userAction[huPos].pos === rPos &&
            userAction[moPos].pos === rPos &&
            userAction[moPos].action === ermj.Action.USER_ACTION_UP_CARD &&
            userAction[moPos].pai === lastPai) {
            return true;
        }
        return false;
    }

    CheckMenQianQing = (rPos: number, lastPai: number, pgVec: ermj.ChiPengGangInfo[]) => {
        for (let pg of pgVec) {
            if (pg.pingHuType !== ermj.PingHuType.TYPE_DARK) return false;
        }
        let userAction = this._userAction;
        if (userAction.length < 2) return false;
        let huPos = userAction.length - 1;
        let prePos = userAction.length - 2;
        if (userAction[huPos].action === ermj.Action.USER_ACTION_HU &&
            userAction[huPos].pai === lastPai &&
            userAction[huPos].pos === rPos &&
            (userAction[prePos].action === ermj.Action.USER_ACTION_OUT_CARD || userAction[prePos].action === ermj.Action.USER_ACTION_GANG) &&
            userAction[prePos].pai === lastPai &&
            userAction[prePos].pos !== rPos) {
            return true;
        }
        return false;
    }

    CheckBuQiuRen = (rPos: number, lastPai: number, pgVec: ermj.ChiPengGangInfo[]) => {
        for (let pg of pgVec) {
            if (pg.pingHuType !== ermj.PingHuType.TYPE_DARK) return false;
        }
        if (this.CheckZiMo(rPos, lastPai)) return true;
        return false;
    }

    CheckQuanQiuRen = (rPos: number, lastPai: number, pgVec: ermj.ChiPengGangInfo[], huPaiInfo: ermj.HuPaiInfo) => {
        if (!this.CheckZiMo(rPos, lastPai) && this.CheckDanDiaoJiang(huPaiInfo, lastPai)) return true;
        return false;
    }

    CheckGangShangKaiHua = (rPos: number, lastPai: number) => {
        let userAction = this._userAction;
        let huPos = userAction.length - 1;
        let gangHouMoPaiPos = userAction.length - 2
        let gangPos = userAction.length - 3;
        if (userAction[huPos].action === ermj.Action.USER_ACTION_HU &&
            userAction[huPos].pai === lastPai &&
            userAction[huPos].pos === rPos &&
            userAction[gangPos].action === ermj.Action.USER_ACTION_GANG &&
            userAction[gangPos].pos === rPos &&
            userAction[gangHouMoPaiPos].action === ermj.Action.USER_ACTION_UP_CARD &&
            userAction[gangHouMoPaiPos].pai === lastPai &&
            userAction[gangHouMoPaiPos].pos === rPos) {
            return true;
        }
        return false;
    }

    CheckHaiDiLaoYue = (rPos: number, lastPai: number) => {
        if (this._cardArr.length !== 0) return false
        let userAction = this._userAction;
        if (userAction.length < 2) return false;
        let huPos = userAction.length - 1;
        let prePos = userAction.length - 2;
        if (userAction[huPos].action === ermj.Action.USER_ACTION_HU &&
            userAction[huPos].pai === lastPai &&
            userAction[huPos].pos === rPos &&
            (userAction[prePos].action === ermj.Action.USER_ACTION_OUT_CARD || userAction[prePos].action === ermj.Action.USER_ACTION_GANG) &&
            userAction[prePos].pai === lastPai &&
            userAction[prePos].pos !== rPos) {
            return true;
        }
    }

    CheckMiaoShouHuiChun = (rPos: number, lastPai: number) => {
        if (this.CheckZiMo(rPos, lastPai) && this._cardArr.length === 0) return true;
        return false;
    }

    CheckRenHe = (rPos: number, lastPai: number) => {
        let userAction = this._userAction;
        if (userAction.length < 2 || userAction.length > 10) return false;
        let huPos = userAction.length - 1;
        let prePos = userAction.length - 2;
        let outPaiCount = 0;
        for (let act of userAction) {
            if (act.action === ermj.Action.USER_ACTION_OUT_CARD) {
                outPaiCount++;
            }
        }
        if (outPaiCount !== 1) return false;
        if (userAction[huPos].action === ermj.Action.USER_ACTION_HU &&
            userAction[huPos].pai === lastPai &&
            userAction[huPos].pos === rPos &&
            userAction[prePos].action === ermj.Action.USER_ACTION_OUT_CARD &&
            userAction[prePos].pai === lastPai &&
            userAction[prePos].pos !== rPos) {
            return true;
        }
        return false;
    }

    CheckDiHe = (rPos: number, lastPai: number) => {
        let userAction = this._userAction;
        if (userAction.length < 2 || userAction.length > 10) return false;
        let huPos = userAction.length - 1;
        let prePos = userAction.length - 2;
        let outPaiCount = 0;
        for (let act of userAction) {
            if (act.action === ermj.Action.USER_ACTION_OUT_CARD) {
                outPaiCount++;
            }
        }
        if (outPaiCount !== 1) return false;
        if (userAction[huPos].action === ermj.Action.USER_ACTION_HU &&
            userAction[huPos].pai === lastPai &&
            userAction[huPos].pos === rPos &&
            userAction[prePos].action === ermj.Action.USER_ACTION_UP_CARD &&
            userAction[prePos].pai === lastPai &&
            userAction[prePos].pos === rPos) {
            return true;
        }
        return false;
    }

    CheckTianHe = () => {
        if (this._userAction.length === 1 && this._userAction[0].action === ermj.Action.USER_ACTION_HU) return true;
        return false;
    }

    CheckTianTing = (rPos: number) => {
        if (this._userAction[rPos].action === ermj.Action.USER_ACTION_TING) return true;
        return false;
    }

    HuPai = (rPos: number, lastPai: number, huType: number[], pgVec: ermj.ChiPengGangInfo[], huPaiInfo: ermj.HuPaiInfo, isTingPai: boolean) => {
        if (this.CheckQiangGangHe(rPos, lastPai)) {
            this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_QIANG_GANG_HE, huType);
        } else if (this.CheckGangShangKaiHua(rPos, lastPai)) {
            this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_GANG_SHANG_KAI_HUA, huType);
        } else if (this.CheckHaiDiLaoYue(rPos, lastPai)) {
            this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_HAI_DI_LAO_YUE, huType);
        } else if (this.CheckMiaoShouHuiChun(rPos, lastPai)) {
            this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_MIAO_SHOU_HUI_CHUN, huType);
        }

        if (this.CheckBuQiuRen(rPos, lastPai, pgVec)) {
            this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_BU_QIU_REN, huType);
        } else if (this.CheckZiMo(rPos, lastPai)) {
            this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_ZI_MO, huType);
        } else if (this.CheckMenQianQing(rPos, lastPai, pgVec)) {
            this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_MEN_QIAN_QIANG, huType);
        } else if (this.CheckQuanQiuRen(rPos, lastPai, pgVec, huPaiInfo)) {
            this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_QUAN_QIU_REN, huType);
        }

        if (this.CheckRenHe(rPos, lastPai)) {
            this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_REN_HE, huType);
        } else if (this.CheckDiHe(rPos, lastPai)) {
            this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_DI_HE, huType);
        } else if (this.CheckTianHe()) {
            this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_TIAN_HE, huType);
        } else if (this.CheckTianTing(rPos)) {
            this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_TIAN_TING, huType);
        }

        if (isTingPai) {
            this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_BAO_TING, huType);
            if (this.CheckMenQianQing(rPos, lastPai, pgVec)) {
                this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_LI_ZHI, huType);
            }
        }

        this.CheckFilter(huType);
        return huType;
    }

    CheckFilter = (huType: number[]) => {
        huType.sort((a, b) => {
            return a - b;
        })

        for (let i = 0; i < huType.length - 1;) {
            let ht = (ermj.HuTypeFilter as any)[huType[i]];
            if (huType[i] === huType[i + 1]) {
                huType.splice(i, 1);
            }
            if (!ht) {
                i++;
                continue;
            }

            let add = false;
            for (let typ of ht) {
                let index = huType.indexOf(typ, i + 1);
                if (index !== -1) {
                    huType.splice(index, 1);
                    if (index === i + 1) add = true;
                }
            }
            if (!add) {
                i++;
            }
        }
    }

    GetFan = (huType: number[]) => {
        let allFan = 0;
        huType.forEach(value => {
            allFan += TypeFan[value];
        })
        return allFan;
    }

    ChangePai = (pai: number) => {

    }

    CheckIsHuPai = (handlePai: number[], lastPai: number, pgVec: ermj.ChiPengGangInfo[]) => {
        let temp = handlePai.concat(lastPai);
        let counter = this.CounterPai(temp);
        let isHu = false;
        if (this.CheckPingHu(counter, pgVec, [], lastPai, 0)) isHu = true;
        else if (this.CheckQiDui(pgVec, counter)) isHu = true;
        return isHu;
    }

    CanTing = (handlePai: number[], upPai: number, pgVec: ermj.ChiPengGangInfo[], tingPaiData: { [pai: number]: number[] } = {}) => {
        let tmpHandlerPai = handlePai.concat(upPai);
        let canTing = false;
        let hasCheck: { [pai: number]: boolean } = {};
        for (let outPai of tmpHandlerPai) {
            if (hasCheck[outPai]) continue;
            let pos = tmpHandlerPai.indexOf(outPai);
            tmpHandlerPai.splice(pos, 1);
            for (let pai of ermj.mjAllTypeCard) {
                if (this.CheckIsHuPai(tmpHandlerPai, pai, pgVec)) {
                    if (tingPaiData[outPai] === undefined) {
                        tingPaiData[outPai] = [];
                    }
                    tingPaiData[outPai].push(pai);
                    canTing = true;
                }
            }
            tmpHandlerPai.splice(pos, 0, outPai);
            hasCheck[outPai] = true;
        }

        return canTing;
    }

    CheckPingHu = (huTempData: ermj.PaiCounter, pgVec: ermj.ChiPengGangInfo[], pingHuType: ermj.HuPaiInfo[], lastpai: number, rPos: number) => {
        this._huPaiStruct.Init();
        let bHu: boolean = false;
        for (let i = 0; i < huTempData.data.length; i++) {
            if (huTempData.data[i][1] < 2 || huTempData.data[i][0] == 0) {
                continue;
            }
            this._huPaiStruct.Init();
            huTempData.data[i][1] -= 2;
            this._huPaiStruct.AddData(ermj.PingHuType.TYPE_JIANG, huTempData.data[i][0]);
            this.MakePingHu(huTempData, this._huPaiStruct, pgVec, pingHuType, lastpai, rPos);
            huTempData.data[i][1] += 2;
        }

        return pingHuType.length > 0;
    }

    ChangePaoPai = (handlePai: number[], nextHuPai: number[]) => {
        let needRemovePai: number[] = []
        this.testPrint("[ermj]changePaoPai-before:", handlePai);
        for (let pai of nextHuPai) {
            for (let i = 0; i < handlePai.length;) {
                if (handlePai[i] === pai) {
                    handlePai.splice(i, 1);
                    needRemovePai.push(pai);
                } else {
                    i++;
                }
            }
        }
        if (needRemovePai.length === 0) return;
        for (let i = 0; i < this._cardArr.length; i++) {
            let isHuPai = false;
            for (let pai of nextHuPai) {
                if (pai === this._cardArr[i]) {
                    isHuPai = true;
                    break;
                }
            }
            if (isHuPai) continue;
            if (needRemovePai.length === 0) break;
            handlePai.push(this._cardArr[i]);
            this._cardArr[i] = needRemovePai[0];
            needRemovePai.splice(0, 1);
        }
        this.testPrint("[ermj]changePaoPai-after:", handlePai);
    }

    ChangeToTingPai = (handlePai: number[], pgVec: ermj.ChiPengGangInfo[]) => {
        let paiCounter = new ermj.PaiCounter();
        let tmpHandlePai = handlePai.concat();
        tmpHandlePai.sort((a, b) => {
            return a - b;
        })
        for (let pai of tmpHandlePai) {
            paiCounter.Add(pai);
        }
        let remainPais: number[][] = [];
        for (let i = 0; i < paiCounter.data.length; i++) {
            if (paiCounter.data[i][1] < 2 || paiCounter.data[i][0] == 0) {
                continue;
            }
            paiCounter.data[i][1] -= 2;
            this.MakeGroup(paiCounter, remainPais);
            paiCounter.data[i][1] += 2;
        }
        if (remainPais.length === 0) return;
        let minLen = 20;
        let minIndex: number;
        for (let i = 0; i < remainPais.length; i++) {
            if (remainPais[i].length < minLen) {
                minLen = remainPais[i].length;
                minIndex = i;
            }
        }
        let tmpRemainPais = remainPais[minIndex].concat();
        if (this._cardArr.length < tmpRemainPais.length) return;

        this.SelectBestPaisFromArrOrg(tmpRemainPais, handlePai, pgVec);
    }

    SelectBestPaisFromArrOrg = (remainPais: number[], handlePai: number[], pgVec: ermj.ChiPengGangInfo[]) => {
        let tmpArrPaisCounter = new ermj.PaiCounter();
        let tmpArr = this._cardArr.concat(remainPais);
        tmpArr.sort((a, b) => {
            return a - b;
        })
        for (let pai of tmpArr) {
            tmpArrPaisCounter.Add(pai);
        }

        let len = remainPais.length;
        let changePais: number[] = [];
        if (len + 1 === 3) {
            if (tmpArrPaisCounter.data[tmpArrPaisCounter.data.length - 1][1] >= 3) {
                changePais.push(tmpArrPaisCounter.data[tmpArrPaisCounter.data.length - 1][0]);
                changePais.push(tmpArrPaisCounter.data[tmpArrPaisCounter.data.length - 1][0]);
            } else if (tmpArrPaisCounter.data[tmpArrPaisCounter.data.length - 2][1] >= 3) {
                changePais.push(tmpArrPaisCounter.data[tmpArrPaisCounter.data.length - 2][0]);
                changePais.push(tmpArrPaisCounter.data[tmpArrPaisCounter.data.length - 2][0]);
            } else {
                for (let i = 0; i < tmpArrPaisCounter.data.length - 2; i++) {
                    if (tmpArrPaisCounter.data[i][1] >= 3) {
                        changePais.push(tmpArrPaisCounter.data[i][0]);
                        changePais.push(tmpArrPaisCounter.data[i][0]);
                        break;
                    } else if (tmpArrPaisCounter.data[i][0] + 1 === tmpArrPaisCounter.data[i + 1][0] &&
                        tmpArrPaisCounter.data[i][0] + 2 === tmpArrPaisCounter.data[i + 2][0] &&
                        tmpArrPaisCounter.data[i][1] > 0 &&
                        tmpArrPaisCounter.data[i + 1][1] > 0 &&
                        tmpArrPaisCounter.data[i + 2][1] > 0) {
                        changePais.push(tmpArrPaisCounter.data[i][0]);
                        changePais.push(tmpArrPaisCounter.data[i + 1][0]);
                        break;
                    }
                }
            }
        } else if (len + 1 === 6) {
            let tmpArr: number[] = [];
            for (let i = 0; i < tmpArrPaisCounter.data.length; i++) {
                if (tmpArrPaisCounter.data[i][1] >= 3) {
                    tmpArr.push(tmpArrPaisCounter.data[i][0]);
                    if (tmpArr.length === 2) break;
                }
            }
            if (tmpArr.length === 2) {
                changePais.push(tmpArr[0]);
                changePais.push(tmpArr[0]);
                changePais.push(tmpArr[0]);
                changePais.push(tmpArr[1]);
                changePais.push(tmpArr[1]);
            } else if (tmpArr.length === 1) {
                for (let i = 0; i < tmpArrPaisCounter.data.length - 2; i++) {
                    if (tmpArrPaisCounter.data[i][0] + 1 === tmpArrPaisCounter.data[i + 1][0] &&
                        tmpArrPaisCounter.data[i][0] + 2 === tmpArrPaisCounter.data[i + 2][0] &&
                        tmpArrPaisCounter.data[i][1] > 0 &&
                        tmpArrPaisCounter.data[i + 1][1] > 0 &&
                        tmpArrPaisCounter.data[i + 2][1] > 0 &&
                        tmpArr[0] !== tmpArrPaisCounter.data[i][0] &&
                        tmpArr[0] !== tmpArrPaisCounter.data[i + 1][0]) {
                        changePais.push(tmpArrPaisCounter.data[i][0]);
                        changePais.push(tmpArrPaisCounter.data[i + 1][0]);
                        changePais.push(tmpArr[0]);
                        changePais.push(tmpArr[0]);
                        changePais.push(tmpArr[0]);
                        break;
                    }
                }
            } else {
                for (let i = 0; i < tmpArrPaisCounter.data.length - 2; i++) {
                    if (tmpArrPaisCounter.data[i][0] + 1 === tmpArrPaisCounter.data[i + 1][0] &&
                        tmpArrPaisCounter.data[i][0] + 2 === tmpArrPaisCounter.data[i + 2][0] &&
                        tmpArrPaisCounter.data[i][1] > 0 &&
                        tmpArrPaisCounter.data[i + 1][1] > 0 &&
                        tmpArrPaisCounter.data[i + 2][1] > 0) {
                        tmpArr.push(tmpArrPaisCounter.data[i][0]);
                        tmpArr.push(tmpArrPaisCounter.data[i + 1][0]);
                        tmpArr.push(tmpArrPaisCounter.data[i + 2][0]);
                        if (tmpArr.length === 4) {
                            changePais.push(tmpArrPaisCounter.data[i][0]);
                            changePais.push(tmpArrPaisCounter.data[i + 1][0]);
                            changePais.push(tmpArr[0]);
                            changePais.push(tmpArr[0]);
                            changePais.push(tmpArr[0]);
                            break;
                        }
                    }
                }
            }
        } else if (len + 1 === 9) {
            let tmpArr: number[] = [];
            for (let i = 0; i < tmpArrPaisCounter.data.length; i++) {
                if (tmpArrPaisCounter.data[i][1] >= 3) {
                    tmpArr.push(tmpArrPaisCounter.data[i][0]);
                    if (tmpArr.length === 3) break;
                }
            }
            if (tmpArr.length === 3) {
                changePais.push(tmpArr[0]);
                changePais.push(tmpArr[0]);
                changePais.push(tmpArr[0]);
                changePais.push(tmpArr[1]);
                changePais.push(tmpArr[1]);
                changePais.push(tmpArr[1]);
                changePais.push(tmpArr[2]);
                changePais.push(tmpArr[2]);
            } else if (tmpArr.length === 2) {
                for (let i = 0; i < tmpArrPaisCounter.data.length - 2; i++) {
                    if (tmpArrPaisCounter.data[i][0] + 1 === tmpArrPaisCounter.data[i + 1][0] &&
                        tmpArrPaisCounter.data[i][0] + 2 === tmpArrPaisCounter.data[i + 2][0] &&
                        tmpArrPaisCounter.data[i][1] > 0 &&
                        tmpArrPaisCounter.data[i + 1][1] > 0 &&
                        tmpArrPaisCounter.data[i + 2][1] > 0 &&
                        tmpArr[0] !== tmpArrPaisCounter.data[i][0] &&
                        tmpArr[0] !== tmpArrPaisCounter.data[i + 1][0]) {
                        changePais.push(tmpArrPaisCounter.data[i][0]);
                        changePais.push(tmpArrPaisCounter.data[i + 1][0]);
                        changePais.push(tmpArr[0]);
                        changePais.push(tmpArr[0]);
                        changePais.push(tmpArr[0]);
                        changePais.push(tmpArr[1]);
                        changePais.push(tmpArr[1]);
                        changePais.push(tmpArr[1]);
                        break;
                    }
                }
            } else {
                tmpArr = [];
                for (let i = 0; i < tmpArrPaisCounter.data.length - 2; i++) {
                    if (tmpArrPaisCounter.data[i][0] + 1 === tmpArrPaisCounter.data[i + 1][0] &&
                        tmpArrPaisCounter.data[i][0] + 2 === tmpArrPaisCounter.data[i + 2][0] &&
                        tmpArrPaisCounter.data[i][1] > 0 &&
                        tmpArrPaisCounter.data[i + 1][1] > 0 &&
                        tmpArrPaisCounter.data[i + 2][1] > 0) {
                        tmpArr.push(tmpArrPaisCounter.data[i][0]);
                        tmpArr.push(tmpArrPaisCounter.data[i + 1][0]);
                        tmpArr.push(tmpArrPaisCounter.data[i + 2][0]);
                        if (tmpArr.length === 9) {
                            for (let j = 0; j < tmpArr.length - 1; j++) {
                                changePais.push(tmpArr[i]);
                            }
                            break;
                        }
                    }
                }
            }
        } else if (len + 1 === 12) {
            let tmpArr: number[] = [];
            for (let i = 0; i < tmpArrPaisCounter.data.length; i++) {
                if (tmpArrPaisCounter.data[i][1] >= 3) {
                    tmpArr.push(tmpArrPaisCounter.data[i][0]);
                    if (tmpArr.length === 4) break;
                }
            }
            if (tmpArr.length === 4) {
                changePais.push(tmpArr[0]);
                changePais.push(tmpArr[0]);
                changePais.push(tmpArr[0]);
                changePais.push(tmpArr[1]);
                changePais.push(tmpArr[1]);
                changePais.push(tmpArr[1]);
                changePais.push(tmpArr[2]);
                changePais.push(tmpArr[2]);
                changePais.push(tmpArr[2]);
                changePais.push(tmpArr[3]);
                changePais.push(tmpArr[3]);
            } else if (tmpArr.length === 3) {
                for (let i = 0; i < tmpArrPaisCounter.data.length - 2; i++) {
                    if (tmpArrPaisCounter.data[i][0] + 1 === tmpArrPaisCounter.data[i + 1][0] &&
                        tmpArrPaisCounter.data[i][0] + 2 === tmpArrPaisCounter.data[i + 2][0] &&
                        tmpArrPaisCounter.data[i][1] > 0 &&
                        tmpArrPaisCounter.data[i + 1][1] > 0 &&
                        tmpArrPaisCounter.data[i + 2][1] > 0 &&
                        tmpArr[0] !== tmpArrPaisCounter.data[i][0] &&
                        tmpArr[0] !== tmpArrPaisCounter.data[i + 1][0]) {
                        changePais.push(tmpArrPaisCounter.data[i][0]);
                        changePais.push(tmpArrPaisCounter.data[i + 1][0]);
                        changePais.push(tmpArr[0]);
                        changePais.push(tmpArr[0]);
                        changePais.push(tmpArr[0]);
                        changePais.push(tmpArr[1]);
                        changePais.push(tmpArr[1]);
                        changePais.push(tmpArr[1]);
                        changePais.push(tmpArr[2]);
                        changePais.push(tmpArr[2]);
                        changePais.push(tmpArr[2]);
                        break;
                    }
                }
            } else {
                tmpArr = [];
                for (let i = 0; i < tmpArrPaisCounter.data.length - 2; i++) {
                    if (tmpArrPaisCounter.data[i][0] + 1 === tmpArrPaisCounter.data[i + 1][0] &&
                        tmpArrPaisCounter.data[i][0] + 2 === tmpArrPaisCounter.data[i + 2][0] &&
                        tmpArrPaisCounter.data[i][1] > 0 &&
                        tmpArrPaisCounter.data[i + 1][1] > 0 &&
                        tmpArrPaisCounter.data[i + 2][1] > 0) {
                        tmpArr.push(tmpArrPaisCounter.data[i][0]);
                        tmpArr.push(tmpArrPaisCounter.data[i + 1][0]);
                        tmpArr.push(tmpArrPaisCounter.data[i + 2][0]);
                        if (tmpArr.length === 12) {
                            for (let j = 0; j < tmpArr.length - 1; j++) {
                                changePais.push(tmpArr[i]);
                            }
                            break;
                        }
                    }
                }
            }
        }

        if (changePais.length !== remainPais.length || changePais.length === 0 || remainPais.length === 0) return;
        for (let i = 0; i < remainPais.length; i++) {
            let index_handle = handlePai.indexOf(remainPais[i]);
            let index_remain = this._cardArr.indexOf(changePais[i]);
            handlePai[index_handle] = changePais[i];
            this._cardArr[index_remain] = remainPais[i];
        }

        this.testPrint("[ermj]changePais:", changePais);
        this.testPrint("[ermj]remainPais:", remainPais);
    }

    MakeGroup = (paiCounter: ermj.PaiCounter, remainPais: number[][]) => {
        let pai = 0;
        let count = 0;
        for (let i = 0; i < paiCounter.data.length; i++) {
            if (paiCounter.data[i][1] === 0) {
                continue;
            }
            pai = paiCounter.data[i][0];
            count = paiCounter.data[i][1];
            break;
        }
        let isCountSuccess = false;
        let isShunZi = false;
        if (count >= 3) {
            isCountSuccess = true;
            paiCounter.SetPaiCount(pai, count - 3);
            this.MakeGroup(paiCounter, remainPais);
            paiCounter.SetPaiCount(pai, count);
        }
        if (pai % 10 < 8 && paiCounter.GetPaiCount(pai + 1) >= 1 && paiCounter.GetPaiCount(pai + 2) >= 1) {
            isShunZi = true;
            paiCounter.SetPaiCount(pai, count - 1);
            paiCounter.SetPaiCount(pai + 1, paiCounter.GetPaiCount(pai + 1) - 1);
            paiCounter.SetPaiCount(pai + 2, paiCounter.GetPaiCount(pai + 2) - 1);

            this.MakeGroup(paiCounter, remainPais);
            paiCounter.SetPaiCount(pai, count);
            paiCounter.SetPaiCount(pai + 1, paiCounter.GetPaiCount(pai + 1) + 1);
            paiCounter.SetPaiCount(pai + 2, paiCounter.GetPaiCount(pai + 2) + 1);
        }

        if (!isCountSuccess && !isShunZi) {
            let tmpRemainCount: number[] = [];
            for (let i = 0; i < paiCounter.data.length; i++) {
                if (paiCounter.data[i][1] === 1) {
                    tmpRemainCount.push(paiCounter.data[i][0]);
                } else if (paiCounter.data[i][1] === 2) {
                    tmpRemainCount.push(paiCounter.data[i][0]);
                    tmpRemainCount.push(paiCounter.data[i][0]);
                }
            }
            remainPais.push(tmpRemainCount);
        }
    }

    CheckPingHuData = (pgVec: ermj.ChiPengGangInfo[], pHu: ermj.HuPaiInfo) => {
        let num = 0;
        let pingHuData = pHu.pingHuStruct.pingHuData;
        for (let i = 0; i < pingHuData.length; i++) {
            let pai = pingHuData[i].pai;
            switch (pingHuData[i].byType) {
                case ermj.PingHuType.TYPE_JIANG:
                    {
                        pHu.byJiang = pai;
                    }
                    break;
                case ermj.PingHuType.TYPE_SHUN:
                    {
                        pHu.byShunData.push(pai);
                    }
                    break;
                case ermj.PingHuType.TYPE_ANKE:
                    {
                        pHu.byAnKeziData.push(pai);
                    }
                    break;
                case ermj.PingHuType.TYPE_MINGKE:
                    {
                        pHu.byMingKeziData.push(pai);
                    }
                    break;
                default:
                    break;
            }
        }

        let pai: number;
        for (let it of pgVec) {
            if (it.pai == 0) {
                continue;
            }

            pai = it.pai;

            switch (it.pingHuType) {
                case ermj.PingHuType.TYPE_PENG:
                    {
                        pHu.byMingKeziData.push(pai);
                    }
                    break;
                case ermj.PingHuType.TYPE_CHI:
                    {
                        pHu.byShunData.push(pai);
                    }
                    break;
                case ermj.PingHuType.TYPE_DARK:
                    {
                        pHu.byAnGang.push(pai);
                    }
                    break;
                case ermj.PingHuType.TYPE_ADD:
                    {
                        pHu.byAddGang.push(pai);
                    }
                    break;
                case ermj.PingHuType.TYPE_SHINE:
                    {
                        pHu.byMingGang.push(pai);
                    }
                    break;
            }
        }
    }

    MakePingHu(PaiData: ermj.PaiCounter,
        hupaistruct: ermj.PingHuStruct,
        pgVec: ermj.ChiPengGangInfo[],
        pingHuType: ermj.HuPaiInfo[], lastpai: number, rPos: number) {
        if (PaiData.GetAllPaiCount() <= 0) {
            let temp: ermj.PingHuStruct = new ermj.PingHuStruct();
            temp.load(hupaistruct);
            pingHuType.push({
                pingHuStruct: temp,
                byJiang: 0,
                byShunData: [],
                byChiData: [],
                byMingKeziData: [],
                byAnKeziData: [],
                byMingGang: [],
                byAddGang: [],
                byAnGang: [],
                huPaiType: [],
                fan: 0
            });
            return;
        }
        let pai = 0;
        let count = 0;
        for (let i = 0; i < PaiData.data.length; i++) {
            if (PaiData.data[i][1] == 0) {
                continue;
            }
            pai = PaiData.data[i][0];
            count = PaiData.data[i][1];
            break;
        }

        if (count >= 3) {
            let isZimo = this.CheckZiMo(rPos, lastpai);
            if (pai === lastpai && !isZimo) {
                hupaistruct.AddData(ermj.PingHuType.TYPE_MINGKE, pai);
            } else {
                hupaistruct.AddData(ermj.PingHuType.TYPE_ANKE, pai);
            }

            PaiData.SetPaiCount(pai, count - 3);
            this.MakePingHu(PaiData, hupaistruct, pgVec, pingHuType, lastpai, rPos);

            PaiData.SetPaiCount(pai, count);
            if (pai === lastpai && !isZimo) {
                hupaistruct.DeleteData(ermj.PingHuType.TYPE_MINGKE, pai);
            } else {
                hupaistruct.DeleteData(ermj.PingHuType.TYPE_ANKE, pai);
            }
        }
        if (pai % 10 < 8 && PaiData.GetPaiCount(pai + 1) >= 1 && PaiData.GetPaiCount(pai + 2) >= 1) {
            hupaistruct.AddData(ermj.PingHuType.TYPE_SHUN, pai);
            PaiData.SetPaiCount(pai, count - 1);
            PaiData.SetPaiCount(pai + 1, PaiData.GetPaiCount(pai + 1) - 1);
            PaiData.SetPaiCount(pai + 2, PaiData.GetPaiCount(pai + 2) - 1);

            this.MakePingHu(PaiData, hupaistruct, pgVec, pingHuType, lastpai, rPos);
            PaiData.SetPaiCount(pai, count);
            PaiData.SetPaiCount(pai + 1, PaiData.GetPaiCount(pai + 1) + 1);
            PaiData.SetPaiCount(pai + 2, PaiData.GetPaiCount(pai + 2) + 1);
            hupaistruct.DeleteData(ermj.PingHuType.TYPE_SHUN, pai);
        }
    }

    testPrint = (...args: any[]) => {
        let params = "";
        for (let arg of args) {
            if (arg instanceof Array || arg instanceof Object) {
                params += " " + JSON.stringify(arg);
            } else {
                params += " " + arg;
            }
        }
        //console.log("房间号："  + "||局号：" + "||位置：" +  "||", params);
    }
}
// let lll = new GameLogic
// let fff= lll.CanHu(
//     [13,13,14,14,15,15,17,19,19,45,45,51,51],
//     17,
//  [],
// [],
//     [55,47,11,45,17,47,41,43,41,47,14],
//     0,
//     [],
//     0,
//     0
// )
// console.log(lll.GetFan(fff));
// let logic = new GameLogic();
// let handlePai = [
//     //     ermj.MJ_TYPE.MJ_TYPE_W8, ermj.MJ_TYPE.MJ_TYPE_W6, ermj.MJ_TYPE.MJ_TYPE_W6,
//     //     ermj.MJ_TYPE.MJ_TYPE_W6, ermj.MJ_TYPE.MJ_TYPE_W5,
//     //     ermj.MJ_TYPE.MJ_TYPE_FE, ermj.MJ_TYPE.MJ_TYPE_W5, ermj.MJ_TYPE.MJ_TYPE_W1,
//     //     ermj.MJ_TYPE.MJ_TYPE_W7, ermj.MJ_TYPE.MJ_TYPE_W3, ermj.MJ_TYPE.MJ_TYPE_W2,
//     //     ermj.MJ_TYPE.MJ_TYPE_W5, ermj.MJ_TYPE.MJ_TYPE_W9,
//     ermj.MJ_TYPE.MJ_TYPE_W1, ermj.MJ_TYPE.MJ_TYPE_JB, ermj.MJ_TYPE.MJ_TYPE_FN,
//     ermj.MJ_TYPE.MJ_TYPE_JZ, ermj.MJ_TYPE.MJ_TYPE_JB, ermj.MJ_TYPE.MJ_TYPE_FN,
//     ermj.MJ_TYPE.MJ_TYPE_JZ, ermj.MJ_TYPE.MJ_TYPE_W1, ermj.MJ_TYPE.MJ_TYPE_W2,
// ];

// let lastPai = ermj.MJ_TYPE.MJ_TYPE_JZ;

// let _huType = [];
// let pgVec = [
//     { pai: ermj.MJ_TYPE.MJ_TYPE_FE, pingHuType: ermj.PingHuType.TYPE_PENG }
// ]
// let isHu = logic.CanHu(handlePai, lastPai, pgVec, _huType, [], 0, [], 0, 0);
// let ishuhu = logic.CheckIsHuPai(handlePai, lastPai, pgVec);
// console.log("ishuhu:", ishuhu);

// console.log("isHu:", isHu);
// logic.printHuTypes(isHu);
// logic.CheckFilter(isHu);
// console.log("filter1:", isHu);
// logic.printHuTypes(isHu);
// console.log(logic.GetFan(isHu))


// console.log(logic.CheckYiSeSanTongShun());

// logic.RandPai();
// logic.checkIsCanAnGang(logic._cardArr);
