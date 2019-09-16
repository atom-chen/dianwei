import * as ermj from "./ermj";
import LogicBase from "./ermjLogicBase";


const CARD_COUNT = 108;

enum ErmjType {
    SAN_PAI = 0,
    KA_PAI,
    DUI_PAI,
    SHUN_PAI,
    LIANG_DUI_PAI,
    KE_ZI,
    GANG_ZI
};

const MAX_HUPAI_TYPE = 20;
export default class GameLogic {
    public _cardArr: number[];
    //变量定义
    private _huTempData: ermj.CheckHuStruct;
    private _noJingHuTempData: ermj.CheckHuStruct;
    private _tempHupaistruct: ermj.PingHuStruct;
    private _huPaiStruct: ermj.PingHuStruct;
    private _pgVec: ermj.PengGangInfo[];

    private _byShunData: number[];
    private _byKeziData: number[];
    private _byGangData: number[][];
    private _byJiang: number;
    private _byPengNum: number;
    private _gen: number;
    private _score: number;
    public _maxScore: number;
    private _huType: number[];
    public _logicBase: LogicBase;
    public _ziMoType: number;
    public _dianGangHuaZiMo: boolean;
    public _haiDiLao: boolean;
    public _menQingZhongZhuang: boolean;
    public _yaoJiuJiangDui: boolean;
    public _tianDiHu: boolean;
    public _fanMaxLimit: number;
    constructor() {
        this._cardArr = [];
        this._huTempData = new ermj.CheckHuStruct();
        this._noJingHuTempData = new ermj.CheckHuStruct();
        this._tempHupaistruct = new ermj.PingHuStruct();
        this._huPaiStruct = new ermj.PingHuStruct();
        this._logicBase = new LogicBase();
        this._ziMoType = 3;
        this._dianGangHuaZiMo = true;
        this._haiDiLao = true;
        this._menQingZhongZhuang = true;
        this._yaoJiuJiangDui = true;
        this._tianDiHu = true;
        this._fanMaxLimit = 5;
    }

    GetHuaSe = (byCard: number) => {
        return Math.floor((byCard) / 10);
    }

    GetCardCount() {
        return this._cardArr.length;
    }
    //获取骰子点数
    GetTouZiPoint(valPoint: number[]) {
        for (let i = 0; i < 2; i++) {
            let rand = Math.random();
            valPoint[i] = Math.round(rand * 5) + 1;
        }
    }
    //洗牌
    RandPai() {
        let index = 0;
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < ermj.stcArr_A_Mj_WTT.length; j++) {
                this._cardArr[index++] = ermj.stcArr_A_Mj_WTT[j];
            }
        }
        for (let i = 0; i < 500; i++) {
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
    GetAPai() {
        if (this._cardArr.length > 0) {
            return this._cardArr.pop();
        } else {
            return 0;
        }
    }

    GetPaiSeCount(pais: number[], lastPai: number) {
        let count: number = 0;
        let se: boolean[] = [false, false, false, false, false, false];

        for (let i = 0; i < pais.length; i++) {
            let pt = Math.floor(pais[i] / 10);
            if (se[pt] == false &&
                pais[i] >= ermj.MJ_TYPE.MJ_TYPE_W1 &&
                pais[i] <= ermj.MJ_TYPE.MJ_TYPE_B9) {
                se[pt] = true;
                count++;
            }
        }
        if (se[Math.floor(lastPai / 10)] == false &&
            lastPai >= ermj.MJ_TYPE.MJ_TYPE_W1 &&
            lastPai <= ermj.MJ_TYPE.MJ_TYPE_B9) {
            se[Math.floor(lastPai / 10)] = true;
            count++;
        }
        return count;
    }


    IsHaveQueMen(pais: number[], lastPai: number, queType: number) {
        if (queType > 3 || queType < 1) {
            console.warn("参数错误：queType", queType);
            return false;
        }
        for (let i = 0; i < pais.length; i++) {
            if (Math.floor(pais[i] / 10) == queType &&
                pais[i] >= ermj.MJ_TYPE.MJ_TYPE_W1 &&
                pais[i] <= ermj.MJ_TYPE.MJ_TYPE_B9) {
                return true;
            }
        }
        if (Math.floor(lastPai / 10) == queType &&
            lastPai >= ermj.MJ_TYPE.MJ_TYPE_W1 &&
            lastPai <= ermj.MJ_TYPE.MJ_TYPE_B9) {
            return true;
        }
        return false;
    }
    MaoPaoSort(a: number[], count: number, big: boolean) {
        if (a === undefined) {
            return;
        }
        for (let i = 0; i < count - 1; i++) {
            for (let j = 0; j < count - i - 1; j++) {
                if (big) {
                    if (a[j] < a[j + 1]) {
                        let iTempBig = a[j];
                        a[j] = a[j + 1];
                        a[j + 1] = iTempBig;
                    }
                }
                else {
                    if (a[j] > a[j + 1]) {
                        let iTempBig = a[j];
                        a[j] = a[j + 1];
                        a[j + 1] = iTempBig;
                    }
                }
            }
        }
    }
    ChangeHandPaiData(handpai: number[]) {
        this._huTempData.Init();
        this._noJingHuTempData.Init();
        for (let i = 0; i < handpai.length; i++) {
            if (handpai[i] != 0) {
                this._huTempData.Add(handpai[i]);
            }
        }

        for (let i = 0; i < this._huTempData.data.length; i++) {
            if (this._huTempData.data[i][0] != 0) {
                for (let j = 0; j < this._huTempData.data[i][1]; j++)
                    this._noJingHuTempData.Add(this._huTempData.data[i][0]);
            }
        }
    }

    CountGen() {
        let count = 0, num = 0;
        let pai = 0;
        let pgMap: { [key: number]: number } = {};
        for (let i = 0; i < this._pgVec.length; i++) {
            let it = this._pgVec[i];
            if (it.pai != 0) {
                if (it.gangType === ermj.GangType.GANG_TYPE_PENG) {
                    pgMap[it.pai] = 3;
                } else {
                    pgMap[it.pai] = 4;
                }
            }
        }

        for (let i = 1; i < 4; i++) {
            for (let j = 1; j < 10; j++) {
                num = 0;
                pai = i * 10 + j;
                num += this._huTempData.GetPaiCount(pai);
                if (num >= 4) {
                    count++;
                }
                if (num == 1 && pgMap[pai] == 3) {
                    count++;
                }
                if (pgMap[pai] == 4) {
                    count++;
                }
            }
        }
        return count;
    }
    CheckQiDui() {
        if (this._pgVec.length > 0) {
            return false;
        }

        for (let i = 0; i < this._huTempData.data.length; ++i) {
            if (this._huTempData.data[i][1] == 0) {
                continue;
            }
            if (this._huTempData.data[i][1] % 2 == 1) {
                return false;
            }
        }
        return true;
    }
    CheckYiSe(handPai: number[]) {
        let zi: boolean = false;
        let type = 0, pai = 0;
        for (let i = 0; i < handPai.length; i++) {
            if (handPai[i] == 0) {
                continue;
            }
            pai = handPai[i];
            if (this.GetHuaSe(pai) == 4) {
                zi = true;
                continue;
            }
            if (type == 0) {
                type = this.GetHuaSe(pai);
            }
            if (type != this.GetHuaSe(pai)) {
                return 0;
            }
        }

        for (let it of this._pgVec) {
            if (it.pai == 0) {
                continue;
            }
            pai = it.pai;
            if (this.GetHuaSe(pai) == 4) {
                zi = true;
                continue;
            }
            if (type == 0) {
                type = this.GetHuaSe(pai);
            }
            if (type != this.GetHuaSe(pai)) {
                return 0;
            }
        }
        if (type == 0) {
            return 0;
        }

        if (zi) {
            return 1;
        }
        return 2;
    }
    CheckQingYiSe(handPai: number[]) {
        return (this.CheckYiSe(handPai) == 2);
    }
    SetAHupaiType(type: number, hupai: number[]) {
        if (this.CheckHupaiType(type, hupai)) {
            return;
        }
        hupai.push(type);
    }
    CheckHupaiType(type: number, hupai: number[]) {
        for (let i = 0; i < hupai.length; i++) {
            if (hupai[i] == type) {
                return true;
            }
        }
        return false;
    }
    ClearPingHuData() {
        this._byJiang = 0;
        this._byShunData = [];
        this._byKeziData = [];
        this._byGangData = [];
        this._byPengNum = 0;
    }
    CheckPingHuData() {
        this.ClearPingHuData();

        let num = 0;
        for (let i = 0; i < this._huPaiStruct.pingHuData.length; i++) {
            switch (this._huPaiStruct.pingHuData[i].byType) {
                case ermj.TYPE_JINGDIAO_JIANG:
                case ermj.TYPE_JIANG_PAI:
                    {
                        this._byJiang = this._huPaiStruct.pingHuData[i].data[0];
                    }
                    break;
                case ermj.TYPE_SHUN_ZI:
                    {
                        this._byShunData.push(this._huPaiStruct.pingHuData[i].data[0]);
                    }
                    break;
                case ermj.TYPE_AN_KE:
                    {
                        this._byKeziData.push(this._huPaiStruct.pingHuData[i].data[0]);
                    }
                    break;
                default:
                    break;
            }
        }

        let pai: number;
        for (let it of this._pgVec) {
            if (it.pai == 0) {
                continue;
            }

            pai = it.pai;

            switch (it.gangType) {
                case ermj.GangType.GANG_TYPE_PENG:
                    {
                        this._byKeziData.push(pai);
                        this._byPengNum++;
                    }
                    break;
                case ermj.GangType.GANG_TYPE_DARK:
                    {
                        this._byGangData.push([ermj.GangType.GANG_TYPE_DARK, pai]);

                    }
                    break;
                case ermj.GangType.GANG_TYPE_ADD:
                    {
                        this._byGangData.push([ermj.GangType.GANG_TYPE_ADD, pai]);
                    }
                    break;
                case ermj.GangType.GANG_TYPE_SHINE:
                    {
                        this._byGangData.push([ermj.GangType.GANG_TYPE_SHINE, pai]);
                    }
                    break;
            }
        }
    }

    MakePingHu(PaiData: ermj.CheckHuStruct, hupaistruct: ermj.PingHuStruct, csnum: number):any {
        if (PaiData.GetAllPaiCount() <= 0) {
            this.CheckPingHuData();
            let score = this.CalcPingHuScore();
            if (this._score < score) {
                this._score = score;
                //this._tempHupaistruct = this._huPaiStruct;
                this._tempHupaistruct.pingHuData = [];
                for (let huData of this._huPaiStruct.pingHuData) {
                    this._tempHupaistruct.pingHuData.push({
                        byType: huData.byType,
                        data: huData.data.concat()
                    });
                }
            }
            return true;
        }
        let pai = 0;
        let count = 0;
        for (let i = 0; i < PaiData.data.length; i++) {
            if (PaiData.data[i][1] == 0 || PaiData.data[i][1] == 0) {
                continue;
            }
            pai = PaiData.data[i][0];
            count = PaiData.data[i][1];
            break;
        }

        let data: number[];
        let caishen: boolean[];
        data = [];

        let bReturn: boolean = false;
        data[0] = pai;
        data[1] = pai;
        data[2] = pai;
        if (count >= 3) {
            hupaistruct.AddData(ermj.TYPE_AN_KE, data);
            PaiData.SetPaiCount(pai, count - 3);
            bReturn = this.MakePingHu(PaiData, hupaistruct, csnum);

            PaiData.SetPaiCount(pai, count);
            hupaistruct.DeleteData(ermj.TYPE_AN_KE, data);

        }
        if (pai % 10 < 8 && PaiData.GetPaiCount(pai + 1) >= 1 && PaiData.GetPaiCount(pai + 2) >= 1) {
            caishen = [];
            data[0] = pai;
            data[1] = pai + 1;
            data[2] = pai + 2;
            hupaistruct.AddData(ermj.TYPE_SHUN_ZI, data);
            PaiData.SetPaiCount(pai, count - 1);
            PaiData.SetPaiCount(pai + 1, PaiData.GetPaiCount(pai + 1) - 1);
            PaiData.SetPaiCount(pai + 2, PaiData.GetPaiCount(pai + 2) - 1);

            let retTemp = this.MakePingHu(PaiData, hupaistruct, csnum);
            if (retTemp) {
                bReturn = retTemp;
            }
            PaiData.SetPaiCount(pai, count);
            PaiData.SetPaiCount(pai + 1, PaiData.GetPaiCount(pai + 1) + 1);
            PaiData.SetPaiCount(pai + 2, PaiData.GetPaiCount(pai + 2) + 1);
            hupaistruct.DeleteData(ermj.TYPE_SHUN_ZI, data);
        }
        return bReturn;
    }


    CheckPingHu() {
        this._tempHupaistruct.Init();
        this._huPaiStruct.Init();
        let pai: number[] = [0, 0, 0, 0];
        let bHu: boolean = false;
        this._score = 0;
        for (let i = 0; i < this._noJingHuTempData.data.length; i++) {
            if (this._noJingHuTempData.data[i][1] < 2 || this._noJingHuTempData.data[i][0] == 0) {
                continue;
            }
            this._huPaiStruct.Init();
            this._noJingHuTempData.data[i][1] -= 2;
            pai[0] = pai[1] = this._noJingHuTempData.data[i][0];
            this._huPaiStruct.AddData(ermj.TYPE_JIANG_PAI, pai);
            let bHuTemp = this.MakePingHu(this._noJingHuTempData, this._huPaiStruct, 0);
            if (!bHu)
                bHu = bHuTemp;
            this._noJingHuTempData.data[i][1] += 2;
            if (bHu) {
                this._huPaiStruct.Init();
                for (let huData of this._tempHupaistruct.pingHuData) {
                    this._huPaiStruct.pingHuData.push({
                        byType: huData.byType,
                        data: huData.data.concat()
                    });
                }
            }
        }
        return bHu;
    }
    CheckQuanDaiYao() {
        if (!this._yaoJiuJiangDui)
            return false;
        for (let i = 0; i < this._huPaiStruct.pingHuData.length; ++i) {
            if (this._huPaiStruct.pingHuData[i].byType == ermj.TYPE_JIANG_PAI ||
                this._huPaiStruct.pingHuData[i].byType == ermj.TYPE_JINGDIAO_JIANG ||
                this._huPaiStruct.pingHuData[i].byType == ermj.TYPE_AN_KE) {
                if (this._huPaiStruct.pingHuData[i].data[0] < ermj.MJ_TYPE.MJ_TYPE_FD &&
                    this._huPaiStruct.pingHuData[i].data[0] % 10 != 1 &&
                    this._huPaiStruct.pingHuData[i].data[0] % 10 != 9) {
                    return false;
                }
            }
            else if (this._huPaiStruct.pingHuData[i].byType == ermj.TYPE_SHUN_ZI) {
                let jiu: boolean = false;
                for (let j = 0; j < 3; j++) {
                    if (this._huPaiStruct.pingHuData[i].data[j] % 10 == 1 || this._huPaiStruct.pingHuData[i].data[j] % 10 == 9) {
                        jiu = true;
                    }
                }
                if (!jiu) {
                    return false;
                }
            }
        }
        for (let it of this._pgVec) {
            if (it.pai >= ermj.MJ_TYPE.MJ_TYPE_FD) {
                continue;
            }
            let jiu: boolean = false;

            if (it.pai % 10 == 1 || it.pai % 10 == 9) {
                jiu = true;
            }

            if (!jiu) {
                return false;
            }
        }
        return true;
    }
    CheckPengPengHu() {
        if (this._byShunData.length == 0) {
            return true;
        }
        return false;
    }
    ReSetAHupaiType(type: number, hupai: number[]) {
        for (let i = 0; i < hupai.length;) {
            if (hupai[i] === type) {
                hupai.splice(i, 1);
            } else {
                i++;
            }
        }
    }
    CheckJiangDui() {
        if (!this._yaoJiuJiangDui)
            return false;
        for (let i = 0; i < this._huPaiStruct.pingHuData.length; ++i) {
            if (this._huPaiStruct.pingHuData[i].byType == ermj.TYPE_SHUN_ZI) {
                return false;
            }

            if (this._huPaiStruct.pingHuData[i].data[0] % 10 != 2 && this._huPaiStruct.pingHuData[i].data[0] % 10 != 5 && this._huPaiStruct.pingHuData[i].data[0] % 10 != 8) {
                return false;
            }
        }
        for (let it of this._pgVec) {
            let pai = 0;
            pai = it.pai;
            switch (it.gangType) {
                case ermj.GangType.GANG_TYPE_ADD:
                case ermj.GangType.GANG_TYPE_DARK:
                case ermj.GangType.GANG_TYPE_SHINE:
                case ermj.GangType.GANG_TYPE_PENG:
                    {
                        if (pai % 10 != 2 && pai % 10 != 5 && pai % 10 != 8) {
                            return false;
                        }
                    }
                    break;
            }
        }
        return true;
    }
    CheckHuGen(handpai: number[], lastpai: number) {
        if (lastpai == 0) {
            return false;
        }
        //std::map < int, int > pgMap;
        let pgMap: { [pai: number]: number } = {};
        for (let it of this._pgVec) {
            if (it.gangType == ermj.GangType.GANG_TYPE_PENG &&
                it.pai != 0) {
                pgMap[it.pai] = 3;
            } else {
                pgMap[it.pai] = 4;
            }
        }
        if (this._logicBase.GetNumInArr(handpai, lastpai) >= 4 ||
            (this._logicBase.GetNumInArr(handpai, lastpai) == 1 &&
                pgMap[lastpai] == 3)) {
            return true;
        }
        return false;
    }
    CheckGangKai(rPos: number, acVec: ermj.UserAction[], lastPai: number) {
        if (acVec.length < 3)
            return false;
        let huActionPos: number = acVec.length - 1;
        let UpcardPos = acVec.length - 2;
        let gangPos = acVec.length - 3;
        if (acVec[huActionPos].action == ermj.Action.USER_ACTION_HU &&
            acVec[huActionPos].card == lastPai &&
            acVec[huActionPos].station == rPos &&
            acVec[UpcardPos].station == rPos &&
            acVec[UpcardPos].card == lastPai &&
            acVec[UpcardPos].action == ermj.Action.USER_ACTION_UP_CARD &&
            acVec[gangPos].action == ermj.Action.USER_ACTION_GANG &&
            acVec[gangPos].station == rPos
        ) {
            return true;
        }
        return false;
    }

    checkDianGang(rPos: number, acVec: ermj.UserAction[], lastPai: number) {
        if (acVec.length < 4)
            return false;
        let gangPaiFrom = acVec.length - 4;
        if (acVec[gangPaiFrom].action == ermj.Action.USER_ACTION_OUT_CARD) {
            return true;
        }
        return false;
    }

    CheckGangHouPao(rPos: number, acVec: ermj.UserAction[], lastPai: number) {
        if (acVec.length < 4)
            return false;
        let huActionPos = acVec.length - 1;
        let pre = acVec.length - 2;
        let pre_1 = acVec.length - 3;
        let outCardPos;
        let UpcardPos;
        let gangPos;
        if (acVec[pre].action == ermj.Action.USER_ACTION_HU &&
            acVec[pre_1].action == ermj.Action.USER_ACTION_HU) {
            if (acVec.length < 6) {
                return false;
            }
            outCardPos = acVec.length - 4;
            UpcardPos = acVec.length - 5;
            gangPos = acVec.length - 6;
        } else if (acVec[pre].action == ermj.Action.USER_ACTION_HU &&
            acVec[pre_1].action != ermj.Action.USER_ACTION_HU) {
            if (acVec.length < 5) {
                return false;
            }
            outCardPos = acVec.length - 3;
            UpcardPos = acVec.length - 4;
            gangPos = acVec.length - 5;
        } else if (acVec[pre].action != ermj.Action.USER_ACTION_HU &&
            acVec[pre_1].action != ermj.Action.USER_ACTION_HU) {
            outCardPos = acVec.length - 2;
            UpcardPos = acVec.length - 3;
            gangPos = acVec.length - 4;
        } else {
            return false;
        }

        if (acVec[huActionPos].action == ermj.Action.USER_ACTION_HU &&
            acVec[huActionPos].card == lastPai &&
            acVec[huActionPos].station == rPos &&
            acVec[outCardPos].action == ermj.Action.USER_ACTION_OUT_CARD &&
            acVec[UpcardPos].action == ermj.Action.USER_ACTION_UP_CARD &&
            acVec[gangPos].action == ermj.Action.USER_ACTION_GANG
        ) {
            return true;
        }
        return false;
    }
    CheckQuanDaiYaoQiDui() {
        if (!this._yaoJiuJiangDui)
            return false;
        for (let i = 0; i < this._huTempData.data.length; i++) {
            if (this._huTempData.data[i][0] != 0 &&
                this._huTempData.data[i][0] % 10 != 1 &&
                this._huTempData.data[i][0] % 10 != 9) {
                return false;
            }
        }
        return true;
    }
    CanHu(pai: number[],
        lastPai: number,
        queType: number,
        hutype: number[],
        acVec: ermj.UserAction[],
        rPos: number,
        pgVec: ermj.PengGangInfo[],
        checkJiao: boolean) {
        if (this.GetPaiSeCount(pai, lastPai) >= 3) {
            return false;
        }
        if (this.IsHaveQueMen(pai, lastPai, queType)) {
            return false;
        }
        let handPai: number[] = pai.concat();
        if (lastPai != 0) {
            handPai.push(lastPai);
        }
        this._pgVec = [];
        for (let it of pgVec) {
            this._pgVec.push(it);
        }
        this.MaoPaoSort(handPai, handPai.length, false);
        let bCanHu: boolean = false;
        this.ChangeHandPaiData(handPai);
        let nGengCount: number = 0;
        nGengCount = this.CountGen();
        if (this.CheckQiDui()) {
            bCanHu = true;
            if (this.CheckQingYiSe(handPai)) {
                if (nGengCount == 0) {
                    this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_QING_QI_DUI, hutype);
                } else if (nGengCount == 1) {
                    this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_QING_LONG_QI_DUI, hutype);
                } else if (nGengCount == 2) {
                    this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_QING_SHUANG_LONG_QI_DUI, hutype);
                } else if (nGengCount == 3) {
                    this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_QING_SAN_LONG_QI_DUI, hutype);
                }
            } else {
                if (nGengCount == 0) {
                    this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_AN_QI_DUI, hutype);
                } else if (nGengCount == 1) {
                    this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_LONG_QI_DUI, hutype);
                } else if (nGengCount == 2) {
                    this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_SHUANG_LONG_QI_DUI, hutype);
                } else if (nGengCount == 3) {
                    this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_SAN_LONG_QI_DUI, hutype);
                    if (this.CheckQuanDaiYaoQiDui()) {
                        this.ReSetAHupaiType(ermj.HU_TYPE_EX.HUPAI_SAN_LONG_QI_DUI, hutype);
                        this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_YAO_JIU_QI_DUI, hutype);
                    }
                }
            }

            if (this.checkQiDuiDuanYaoJiu()) {
                this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_DUAN_YAO_JIU, hutype);
            }
        }
        else if (this.CheckPingHu()) {
            this.CheckPingHuData();
            bCanHu = true;
            if (this.CheckQingYiSe(handPai)) {
                this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_QING_YI_SE, hutype);
            }
            if (this.CheckQuanDaiYao()) {
                if (this.CheckQingYiSe(handPai)) {
                    this.ReSetAHupaiType(ermj.HU_TYPE_EX.HUPAI_QING_YI_SE, hutype);
                    this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_QING_DAI_YAO, hutype);
                } else {
                    this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_QUAN_DAI_YAO, hutype);
                }
            }
            if (this.CheckPengPengHu()) {
                if (this.CheckQingYiSe(handPai)) {
                    if (this.CheckJinGouDiao()) {
                        if (this.check18LuoHan()) {
                            this.ReSetAHupaiType(ermj.HU_TYPE_EX.HUPAI_QING_YI_SE, hutype);
                            this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_QING_18_LUO_HAN, hutype);
                        } else {
                            this.ReSetAHupaiType(ermj.HU_TYPE_EX.HUPAI_QING_YI_SE, hutype);
                            this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_QING_JIN_GOU_DIAO, hutype);
                        }
                    } else {
                        this.ReSetAHupaiType(ermj.HU_TYPE_EX.HUPAI_QING_YI_SE, hutype);
                        this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_QING_DA_DUI, hutype);
                    }
                } else if (this.CheckJiangDui()) {
                    if (this.CheckJinGouDiao()) {
                        if (this.check18LuoHan()) {
                            this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_JIANG_18_LUO_HAN, hutype);
                        } else {
                            this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_JIANG_JIN_GOU, hutype);
                        }
                    } else {
                        this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_JIANG_DA_DUI, hutype);
                    }
                } else {
                    if (this.CheckJinGouDiao()) {
                        if (this.check18LuoHan()) {
                            this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_18_LUO_HAN, hutype);
                        } else {
                            this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_JIN_GOU_DIAO, hutype);
                        }
                    } else {
                        this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_PENG_PENG_HU, hutype);
                    }
                }
            }
            if (hutype.length == 0) {
                this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_HU_PAI, hutype);
            }
            if (nGengCount == 1) {
                this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_GEN_ONE, hutype);
            } else if (nGengCount == 2) {
                this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_GEN_TWO, hutype);
            } else if (nGengCount == 3) {
                this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_GEN_THREE, hutype);
            } else if (nGengCount == 4) {
                this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_GEN_FOUR, hutype);
            }
            if (this.checkDuanYaoJiu()) {
                this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_DUAN_YAO_JIU, hutype);
            }
        }
        if (this.checkMenQianQing()) {
            this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_MEN_QIAN_QING, hutype);
        }

        if (this.CheckGangKai(rPos, acVec, lastPai)) {
            this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_TYPE_GANG_KAI, hutype);
            if (!this._dianGangHuaZiMo) {//点杠花当点炮
                if (this.checkDianGang(rPos, acVec, lastPai)) {
                    this.ReSetAHupaiType(ermj.HU_TYPE_EX.HUPAI_ZI_MO, hutype);
                }
            }
        }
        if (this.CheckGangHouPao(rPos, acVec, lastPai)) {
            this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_TYPE_GANG_PAO, hutype);
        }
        if (this.CheckTianHu(rPos, acVec, lastPai)) {
            this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_TYPE_TIAN_HU, hutype);
        }
        if (this.CheckDiHu(rPos, acVec, lastPai)) {
            this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_TYPE_DI_HU, hutype);
        }
        if (this.CheckQiangGangHe(rPos, acVec, lastPai)) {
            this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_TYPE_QIANG_GANG, hutype);
        }
        if (!checkJiao) {
            if (this.checkHaiDiLao()) {
                this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_HAI_DI_LAO, hutype);
            }
        }
        if (this.CheckZiMo(rPos, acVec, lastPai)) {
            this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_ZI_MO, hutype);
        }
        this._huType = hutype.concat();
        return bCanHu;
    }
    checkQiDuiDuanYaoJiu() {
        if (!this._menQingZhongZhuang) {
            return false;
        }
        for (let i = 0; i < this._huTempData.data.length; ++i) {
            if (this._huTempData.data[i][0] % 10 == 1 ||
                this._huTempData.data[i][0] % 10 == 9) {
                return false;
            }
        }
        return true;
    }


    checkDuanYaoJiu() {
        if (!this._menQingZhongZhuang) {
            return false;
        }
        for (let i = 0; i < this._huPaiStruct.pingHuData.length; ++i) {
            if (this._huPaiStruct.pingHuData[i].byType == ermj.TYPE_JIANG_PAI ||
                this._huPaiStruct.pingHuData[i].byType == ermj.TYPE_JINGDIAO_JIANG ||
                this._huPaiStruct.pingHuData[i].byType == ermj.TYPE_AN_KE) {
                if (this._huPaiStruct.pingHuData[i].data[0] < ermj.MJ_TYPE.MJ_TYPE_FD &&
                    (this._huPaiStruct.pingHuData[i].data[0] % 10 == 1 ||
                        this._huPaiStruct.pingHuData[i].data[0] % 10 == 9)) {
                    return false;
                }
            }
            else if (this._huPaiStruct.pingHuData[i].byType == ermj.TYPE_SHUN_ZI) {
                let hasYaoJiu: boolean = false;
                for (let j = 0; j < 3; j++) {
                    if (this._huPaiStruct.pingHuData[i].data[j] % 10 == 1 || this._huPaiStruct.pingHuData[i].data[j] % 10 == 9) {
                        hasYaoJiu = true;
                    }
                }
                if (hasYaoJiu) {
                    return false;
                }
            }
        }
        for (let it of this._pgVec) {
            if (it.pai >= ermj.MJ_TYPE.MJ_TYPE_FD) {
                continue;
            }
            let hasYaoJiu: boolean = false;

            if (it.pai % 10 == 1 || it.pai % 10 == 9) {
                hasYaoJiu = true;
            }

            if (hasYaoJiu) {
                return false;
            }
        }
        return true;
    }



    checkMenQianQing() {
        if (!this._menQingZhongZhuang) {
            return false;
        }
        if (this._pgVec.length > 0) {
            return false;
        } else {
            return true;
        }
    }


    check18LuoHan() {
        for (let pgInfo of this._pgVec) {
            if (pgInfo.gangType === ermj.GangType.GANG_TYPE_PENG) {
                return false;
            }
        }
        return true;
    }


    checkHaiDiLao() {
        if (!this._haiDiLao)
            return false;
        if (this._cardArr.length == 0)
            return true;
        else
            return false;
    }
    CalcPingHuScore() {
        let hutype: number[] = [];
        if (this.CheckQuanDaiYao()) {
            this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_QUAN_DAI_YAO, hutype);
        }
        if (this.CheckPengPengHu()) {
            this.SetAHupaiType(ermj.HU_TYPE_EX.HUPAI_PENG_PENG_HU, hutype);
        }
        return this.GetPingHuScore(hutype);
    }
    GetPingHuScore(huType: number[]) {
        let score: number = 1;
        for (let i = 0; i < MAX_HUPAI_TYPE; i++) {
            if (huType[i] != 0) {
                let type = huType[i];
                switch (type) {
                    case ermj.HU_TYPE_EX.HUPAI_PENG_PENG_HU: {//
                        score *= 2;
                    } break;
                    case ermj.HU_TYPE_EX.HUPAI_QUAN_DAI_YAO: {//
                        score *= 4;
                    } break;
                }
            }
        }
        return score;
    }
    CheckJinGouDiao() {
        if (this._pgVec.length == 4) {
            return true;
        } else {
            return false;
        }
    }
    CheckTianHu(rPos: number, acVec: ermj.UserAction[], lastPai: number) {
        if (acVec.length != 2)
            return false;
        let huActionPos = acVec.length - 1;
        if (acVec[huActionPos].action == ermj.Action.USER_ACTION_HU &&
            acVec[huActionPos].card == lastPai &&
            acVec[huActionPos].station == rPos
        ) {
            return true;
        }
        return false;
    }
    CheckDiHu(rPos: number, acVec: ermj.UserAction[], lastPai: number) {
        if (acVec.length <= 2) {
            return false;
        }
        let moCount = 0;
        let pengGangCount = 0;
        let huPos = acVec.length - 1;
        let upCard = acVec.length - 2;

        for (let ac of acVec) {
            if (ac.station === rPos && ac.action === ermj.Action.USER_ACTION_UP_CARD) {
                moCount++;
            }

            if (ac.action === ermj.Action.USER_ACTION_PENG || ac.action === ermj.Action.USER_ACTION_GANG) {
                pengGangCount++;
            }
        }
        if (moCount == 1 &&
            pengGangCount == 0 &&
            acVec[upCard].action == ermj.Action.USER_ACTION_UP_CARD &&
            acVec[upCard].station == rPos &&
            acVec[upCard].card == lastPai &&
            acVec[huPos].action == ermj.Action.USER_ACTION_HU &&
            acVec[huPos].station == rPos &&
            acVec[huPos].card == lastPai
        ) {
            return true;
        }

        return false;
    }
    CheckQiangGangHe(rPos: number, acVec: ermj.UserAction[], lastPai: number) {
        if (acVec.length < 4)
            return false;
        let huActionPos = acVec.length - 1;
        let pre = acVec.length - 2;
        let pre_1 = acVec.length - 3;
        let GangPos;
        if (acVec[pre].action == ermj.Action.USER_ACTION_HU &&
            acVec[pre_1].action == ermj.Action.USER_ACTION_HU) {
            GangPos = acVec.length - 4;
        } else if (acVec[pre].action == ermj.Action.USER_ACTION_HU &&
            acVec[pre_1].action != ermj.Action.USER_ACTION_HU) {
            GangPos = acVec.length - 3;
        } else if (acVec[pre].action != ermj.Action.USER_ACTION_HU &&
            acVec[pre_1].action != ermj.Action.USER_ACTION_HU) {
            GangPos = acVec.length - 2;
        } else {
            return false;
        }

        if (acVec[huActionPos].action == ermj.Action.USER_ACTION_HU &&
            acVec[huActionPos].card == lastPai &&
            acVec[huActionPos].station == rPos &&
            acVec[GangPos].card == lastPai &&
            acVec[GangPos].action == ermj.Action.USER_ACTION_GANG
        ) {
            return true;
        }
        return false;
    }
    CheckZiMo(rPos: number, acVec: ermj.UserAction[], lastPai: number) {
        if (acVec.length < 2)
            return false;
        let huActionPos = acVec.length - 1;
        let UpcardPos = acVec.length - 2;
        if (acVec[huActionPos].action == ermj.Action.USER_ACTION_HU &&
            acVec[huActionPos].card == lastPai &&
            acVec[huActionPos].station == rPos &&
            acVec[UpcardPos].station == rPos &&
            acVec[UpcardPos].card == lastPai &&
            acVec[UpcardPos].action == ermj.Action.USER_ACTION_UP_CARD
        ) {
            return true;
        }
        return false;
    }
    GetAHandPaiCount(handPai: number[], handCount: number, pai: number) {
        let count = 0;
        for (let i = 0; i < handCount; i++) {
            if (handPai[i] == pai) {
                count++;
            }
        }
        return count;
    }
    CanPeng(pai: number[], lastpai: number, queType: number) {
        if (Math.floor(lastpai / 10) == queType || lastpai == 0)
            return false;
        let handPai: number[] = [];
        handPai = pai.concat();
        handPai.push(lastpai);

        this.ChangeHandPaiData(handPai);
        for (let i = 0; i < this._huTempData.data.length; i++) {
            if (this._huTempData.data[i][0] == lastpai && this._huTempData.data[i][1] >= 3) {
                return true;
            }
        }
        return false;
    }
    CanGang(pai: number[], lastpai: number, gangPai: number, queType: number, me: boolean, Result: number[], pgVec: ermj.PengGangInfo[]) {
        if (Math.floor(gangPai / 10) == queType)
            return false;
        let bb = false;
        let handPai: number[] = [];
        handPai = pai.concat();
        if (lastpai != 0) {
            handPai.push(lastpai);
        }
        this.ChangeHandPaiData(handPai);
        if (me) {
            let hasOne = false;
            for (let i = 0; i < this._huTempData.data.length; i++) {
                if (this._huTempData.data[i][0] == gangPai && this._huTempData.data[i][1] == 4) {
                    Result[0] = this._huTempData.data[i][0];
                    Result[1] = ermj.GangType.GANG_TYPE_DARK;
                    bb = true;
                }
                if (this._huTempData.data[i][0] == gangPai && this._huTempData.data[i][1] == 1) {
                    hasOne = true;
                }
            }
            for (let it of pgVec) {
                if (it.gangType == ermj.GangType.GANG_TYPE_PENG && it.pai == gangPai && hasOne) {
                    Result[0] = lastpai;
                    Result[1] = ermj.GangType.GANG_TYPE_ADD;
                    bb = true;
                }
            }
        }
        else {
            for (let i = 0; i < this._huTempData.data.length; i++) {
                if (this._huTempData.data[i][0] == lastpai && this._huTempData.data[i][1] == 4) {
                    Result[0] = this._huTempData.data[i][0];
                    Result[1] = ermj.GangType.GANG_TYPE_SHINE;
                    bb = true;
                }
            }
        }
        return bb;
    }
    HasGang(
        pai: number[],
        lastpai: number,
        queType: number,
        pgVec: ermj.PengGangInfo[]) {
        let bb = false;
        let handPai: number[] = [];
        handPai = pai.concat();
        handPai.push(lastpai);

        for (let it of pgVec) {
            if (it.gangType == ermj.GangType.GANG_TYPE_PENG) {
                handPai.push(it.pai);
                handPai.push(it.pai);
                handPai.push(it.pai);
            }
        }

        this.ChangeHandPaiData(handPai);
        for (let i = 0; i < this._huTempData.data.length; i++) {
            if (this._huTempData.data[i][0] != 0 &&
                this._huTempData.data[i][1] == 4 &&
                Math.floor(this._huTempData.data[i][0] / 10) !== queType) {
                bb = true;
            }
        }
        return bb;
    }
    CanOutCard(handPai: number[], upCard: number, outCard: number, queType: number) {
        if (outCard == 0)
            return false;
        let bExist = false;
        let bExistQuePai = false;
        for (let i = 0; i < handPai.length; i++) {
            if (handPai[i] == outCard) {
                bExist = true;
            }
            if (Math.floor(handPai[i] / 10) == queType) {
                bExistQuePai = true;
            }
        }

        if (bExist == false && upCard == outCard) {
            bExist = true;
        }

        if (Math.floor(upCard / 10) == queType) {
            bExistQuePai = true;
        }
        if (bExist) {
            if (bExistQuePai) {
                if (Math.floor(outCard / 10) != queType) {
                    return false;
                } else {
                    return true;
                }
            } else {
                return true;
            }
        } else {
            return false;
        }
    }
    GetHuFanScore(huType?: number[]) {
        if (huType) {
            this._huType = huType.concat();
        }

        let fanScore: { fan: number, score: number } = {
            fan: 1,
            score: 1
        };
        let bAdd: boolean = false;
        for (let i = 0; i < this._huType.length; i++) {
            if (this._huType[i] != 0) {
                let type = this._huType[i];
                switch (type) {
                    case ermj.HU_TYPE_EX.HUPAI_HU_PAI: {

                    } break;
                    case ermj.HU_TYPE_EX.HUPAI_JIANG_JIN_GOU: {
                        fanScore.score *= 16;
                        fanScore.fan += 4;
                    } break;
                    case ermj.HU_TYPE_EX.HUPAI_18_LUO_HAN: {
                        fanScore.score *= 64;
                        fanScore.fan += 6;
                    } break;
                    case ermj.HU_TYPE_EX.HUPAI_QING_18_LUO_HAN: {
                        fanScore.score *= 256;
                        fanScore.fan += 8;
                    } break;
                    case ermj.HU_TYPE_EX.HUPAI_JIANG_18_LUO_HAN: {
                        fanScore.score *= 256;
                        fanScore.fan += 8;
                    } break;
                    case ermj.HU_TYPE_EX.HUPAI_PENG_PENG_HU: {
                        fanScore.score *= 2;
                        fanScore.fan += 1;
                    } break;
                    case ermj.HU_TYPE_EX.HUPAI_QING_YI_SE: {
                        fanScore.score *= 4;
                        fanScore.fan += 2;
                    } break;
                    case ermj.HU_TYPE_EX.HUPAI_AN_QI_DUI: {
                        fanScore.score *= 4;
                        fanScore.fan += 2;
                    } break;
                    case ermj.HU_TYPE_EX.HUPAI_QUAN_DAI_YAO: {
                        fanScore.score *= 4;
                        fanScore.fan += 2;
                    } break;
                    case ermj.HU_TYPE_EX.HUPAI_JIANG_DA_DUI: {
                        fanScore.score *= 8;
                        fanScore.fan += 3;
                    } break;
                    case ermj.HU_TYPE_EX.HUPAI_QING_DA_DUI: {
                        fanScore.score *= 8;
                        fanScore.fan += 3;
                    } break;
                    case ermj.HU_TYPE_EX.HUPAI_QING_QI_DUI: {
                        fanScore.score *= 16;
                        fanScore.fan += 4;
                    } break;
                    case ermj.HU_TYPE_EX.HUPAI_LONG_QI_DUI: {
                        fanScore.score *= 8;
                        fanScore.fan += 3;
                    } break;
                    case ermj.HU_TYPE_EX.HUPAI_SHUANG_LONG_QI_DUI: {
                        fanScore.score *= 16;
                        fanScore.fan += 4;
                    } break;
                    case ermj.HU_TYPE_EX.HUPAI_SAN_LONG_QI_DUI: {
                        fanScore.score *= 32;
                        fanScore.fan += 5;
                    } break;
                    case ermj.HU_TYPE_EX.HUPAI_QING_LONG_QI_DUI: {
                        fanScore.score *= 32;
                        fanScore.fan += 5;
                    } break;
                    case ermj.HU_TYPE_EX.HUPAI_QING_SHUANG_LONG_QI_DUI: {
                        fanScore.score *= 64;
                        fanScore.fan += 6;
                    } break;
                    case ermj.HU_TYPE_EX.HUPAI_QING_SAN_LONG_QI_DUI: {
                        fanScore.score *= 128;
                        fanScore.fan += 7;
                    } break;
                    case ermj.HU_TYPE_EX.HUPAI_TYPE_GANG_KAI: {
                        fanScore.score *= 2;
                        fanScore.fan += 1;
                    } break;
                    case ermj.HU_TYPE_EX.HUPAI_TYPE_GANG_PAO: {
                        fanScore.score *= 2;
                        fanScore.fan += 1;
                    } break;
                    case ermj.HU_TYPE_EX.HUPAI_TYPE_TIAN_HU: {
                        fanScore.score *= 32;
                        fanScore.fan += 5;
                    } break;
                    case ermj.HU_TYPE_EX.HUPAI_TYPE_DI_HU: {
                        fanScore.score *= 32;
                        fanScore.fan += 5;
                    } break;
                    case ermj.HU_TYPE_EX.HUPAI_TYPE_QIANG_GANG: {
                        fanScore.score *= 2;
                        fanScore.fan += 1;
                    } break;
                    case ermj.HU_TYPE_EX.HUPAI_CHA_JIAO: {

                    } break;
                    case ermj.HU_TYPE_EX.HUPAI_YAO_JIU_QI_DUI: {
                        fanScore.score *= 32;
                        fanScore.fan += 5;
                    } break;
                    case ermj.HU_TYPE_EX.HUPAI_QING_DAI_YAO: {
                        fanScore.score *= 32;
                        fanScore.fan += 5;
                    } break;
                    case ermj.HU_TYPE_EX.HUPAI_ZI_MO: {
                        if (this._ziMoType == ermj.ZIMO_TYPE.ZIMO_FAN) {   //自摸加翻
                            fanScore.score *= 2;
                            fanScore.fan += 1;
                        }
                        else if (this._ziMoType == ermj.ZIMO_TYPE.ZIMO_DI) {//自摸加底
                            bAdd = true;
                        }
                        else if (this._ziMoType == ermj.ZIMO_TYPE.ZIMO_NULL) {//自摸不加

                        }
                    } break;
                    case ermj.HU_TYPE_EX.HUPAI_JIN_GOU_DIAO: {
                        fanScore.score *= 4;
                        fanScore.fan += 2;
                    } break;
                    case ermj.HU_TYPE_EX.HUPAI_QING_JIN_GOU_DIAO: {
                        fanScore.score *= 16;
                        fanScore.fan += 4;
                    } break;
                    case ermj.HU_TYPE_EX.HUPAI_GEN_ONE: {
                        fanScore.score *= 2;
                        fanScore.fan += 1;
                    } break;
                    case ermj.HU_TYPE_EX.HUPAI_GEN_TWO: {
                        fanScore.score *= 4;
                        fanScore.fan += 2;
                    } break;
                    case ermj.HU_TYPE_EX.HUPAI_GEN_THREE: {
                        fanScore.score *= 8;
                        fanScore.fan += 3;
                    } break;
                    case ermj.HU_TYPE_EX.HUPAI_GEN_FOUR: {
                        fanScore.score *= 16;
                        fanScore.fan += 4;
                    } break;
                    case ermj.HU_TYPE_EX.HUPAI_HAI_DI_LAO: {
                        fanScore.score *= 2;
                        fanScore.fan += 1;
                    } break;
                    case ermj.HU_TYPE_EX.HUPAI_MEN_QIAN_QING: {
                        fanScore.score *= 2;
                        fanScore.fan += 1;
                    } break;
                    case ermj.HU_TYPE_EX.HUPAI_DUAN_YAO_JIU: {
                        fanScore.score *= 2;
                        fanScore.fan += 1;
                    } break;
                }
            }
        }
        if (fanScore.fan > this._fanMaxLimit) {
            fanScore.fan = this._fanMaxLimit;
            fanScore.score = Math.pow(2, this._fanMaxLimit - 1);
        }

        if (bAdd == true) {
            fanScore.score += 1;
        }
        return fanScore;
    }
    CheckBigHu(
        pai: number[],
        queType: number,
        bigHu: ermj.stCheckBigHu,
        acVec: ermj.UserAction[],
        rPos: number,
        pgVec: ermj.PengGangInfo[]) {
        let bWan = true;
        let bBing = true;
        let bTiao = true;
        if (queType == ermj.MJ_TYPE_PAI.MJ_TYPE_PAI_WAN) {
            bWan = false;
        } else if (queType == ermj.MJ_TYPE_PAI.MJ_TYPE_PAI_TIAO) {
            bTiao = false;
        } else if (queType == ermj.MJ_TYPE_PAI.MJ_TYPE_PAI_BING) {
            bBing = false;
        }
        let vecFan: ermj.stCheckBigHu[] = [];
        if (bWan) {
            for (let i = ermj.MJ_TYPE.MJ_TYPE_W1; i <= ermj.MJ_TYPE.MJ_TYPE_W9; i++) {
                let huType: number[] = [];
                let bHu = this.CanHu(pai, i, queType, huType, acVec, rPos, pgVec, true);
                if (bHu) {
                    let fanScore = this.GetHuFanScore();
                    let hu: ermj.stCheckBigHu = {
                        huType: huType.concat(),
                        score: fanScore.score,
                        pai: i,
                        fan: fanScore.fan
                    };
                    vecFan.push(hu);
                }
            }
        }
        if (bTiao) {
            for (let i = ermj.MJ_TYPE.MJ_TYPE_T1; i <= ermj.MJ_TYPE.MJ_TYPE_T9; i++) {
                let huType: number[] = [];
                let bHu = this.CanHu(pai, i, queType, huType, acVec, rPos, pgVec, true);
                if (bHu) {
                    let fanScore = this.GetHuFanScore();
                    let hu: ermj.stCheckBigHu = {
                        huType: huType.concat(),
                        score: fanScore.score,
                        pai: i,
                        fan: fanScore.fan
                    };
                    vecFan.push(hu);
                }
            }
        }
        if (bBing) {
            for (let i = ermj.MJ_TYPE.MJ_TYPE_B1; i <= ermj.MJ_TYPE.MJ_TYPE_B9; i++) {
                let huType: number[] = [];
                let bHu = this.CanHu(pai, i, queType, huType, acVec, rPos, pgVec, true);
                if (bHu) {
                    let fanScore = this.GetHuFanScore();
                    let hu: ermj.stCheckBigHu = {
                        huType: huType.concat(),
                        score: fanScore.score,
                        pai: i,
                        fan: fanScore.fan
                    };
                    vecFan.push(hu);
                }
            }
        }
        if (vecFan.length <= 0) {
            return false;
        }
        for (let it of vecFan) {
            if (it.score > bigHu.score) {

                bigHu.huType = it.huType.concat();
                bigHu.score = it.score;
                bigHu.fan = it.fan;
                bigHu.pai = it.pai;
            }
        }
        return true;
    }
    CheckJiao(pai: number[],
        queType: number,
        vecFan: ermj.stCheckBigHu[],
        pgVec: ermj.PengGangInfo[]
    ) {
        let bWan = true;
        let bBing = true;
        let bTiao = true;
        if (queType == ermj.MJ_TYPE_PAI.MJ_TYPE_PAI_WAN) {
            bWan = false;
        } else if (queType == ermj.MJ_TYPE_PAI.MJ_TYPE_PAI_TIAO) {
            bTiao = false;
        } else if (queType == ermj.MJ_TYPE_PAI.MJ_TYPE_PAI_BING) {
            bBing = false;
        }
        let acVec: ermj.UserAction[] = [];
        if (bWan) {
            for (let i = ermj.MJ_TYPE.MJ_TYPE_W1; i <= ermj.MJ_TYPE.MJ_TYPE_W9; i++) {
                let huType: number[] = [];
                let bHu = this.CanHu(pai, i, queType, huType, acVec, 0, pgVec, true);
                if (bHu) {
                    let fanScore = this.GetHuFanScore();
                    let hu: ermj.stCheckBigHu = {
                        huType: huType.concat(),
                        score: fanScore.score,
                        pai: i,
                        fan: fanScore.fan
                    };
                    vecFan.push(hu);
                }
            }
        }
        if (bTiao) {
            for (let i = ermj.MJ_TYPE.MJ_TYPE_T1; i <= ermj.MJ_TYPE.MJ_TYPE_T9; i++) {
                let huType: number[] = [];
                let bHu = this.CanHu(pai, i, queType, huType, acVec, 0, pgVec, true);
                if (bHu) {
                    let fanScore = this.GetHuFanScore();
                    let hu: ermj.stCheckBigHu = {
                        huType: huType.concat(),
                        score: fanScore.score,
                        pai: i,
                        fan: fanScore.fan
                    };
                    vecFan.push(hu);
                }
            }
        }
        if (bBing) {
            for (let i = ermj.MJ_TYPE.MJ_TYPE_B1; i <= ermj.MJ_TYPE.MJ_TYPE_B9; i++) {
                let huType: number[] = [];
                let bHu = this.CanHu(pai, i, queType, huType, acVec, 0, pgVec, true);
                if (bHu) {
                    let fanScore = this.GetHuFanScore();
                    let hu: ermj.stCheckBigHu = {
                        huType: huType.concat(),
                        score: fanScore.score,
                        pai: i,
                        fan: fanScore.fan
                    };
                    vecFan.push(hu);
                }
            }
        }
        if (vecFan.length <= 0) {
            return false;
        }
        return true;
    }

    getChange3Card(handPai: number[]) {
        let paiTemp: number[] = [];
        paiTemp = handPai.concat();
        this.MaoPaoSort(paiTemp, paiTemp.length, false);
        let vecItemType: number[][] = [[], [], [], []];
        let vecPaiType: number[][] = [[], [], [], []];
        for (let i = 0; i < handPai.length; i++) {
            let PaiNumber = paiTemp[i];
            if (PaiNumber == 0) {
                continue;
            }
            let PaiDian = PaiNumber % 10;
            let HuaSe = Math.floor(PaiNumber / 10);
            vecItemType[HuaSe].push(PaiDian);
            vecPaiType[HuaSe].push(PaiNumber);
        }

        let typeNum: number[] = [];
        let minIndex = -1;
        let typeVec: number[] = [];
        for (let i = 1; i < 4; i++) {
            typeNum[i] = vecItemType[i].length;
            if (typeNum[i] >= 3) {
                if (minIndex == -1) {
                    minIndex = i;
                    typeVec.push(i);
                } else {
                    if (typeNum[i] < typeNum[minIndex]) {
                        minIndex = i;
                        typeVec = [];
                        typeVec.push(i);
                    } else if (typeNum[i] == typeNum[minIndex]) {
                        typeVec.push(i);
                    }
                }
            }
        }

        let type = -1;

        if (typeVec.length === 1) {//选三张
            type = minIndex;
        } else if (typeVec.length === 2) {
            if (typeNum[minIndex] == 3) {
                let paiDian1 = Math.abs(vecItemType[typeVec[0]][0] - vecItemType[typeVec[0]][1]);
                let paiDian2 = Math.abs(vecItemType[typeVec[0]][1] - vecItemType[typeVec[0]][2]);
                let paiDian3 = Math.abs(vecItemType[typeVec[1]][0] - vecItemType[typeVec[1]][1]);
                let paiDian4 = Math.abs(vecItemType[typeVec[1]][1] - vecItemType[typeVec[1]][2]);
                let tempAry1: number[] = [paiDian1, paiDian2];
                let tempAry2: number[] = [paiDian3, paiDian4];
                let tempType1 = this.GetMaJiangType(2, tempAry1);
                let tempType2 = this.GetMaJiangType(2, tempAry2);
                if (tempType1 > tempType2) {
                    type = typeVec[1];

                }
                else if (tempType1 == tempType2) {
                    if ((paiDian1 + paiDian2) > (paiDian3 + paiDian4)) {
                        type = typeVec[0];
                    }
                    else if ((paiDian1 + paiDian2) == (paiDian3 + paiDian4)) {
                        //let pos = Math.round(Math.random());
                        //type = typeVec[pos];
                        //本来应该随机，现在写死，和客户端统一，取数组的第一个元素
                        type = typeVec[0];
                    }
                    else {
                        type = typeVec[1];
                    }
                }
                else {
                    type = typeVec[0];
                }
            } else if (typeNum[minIndex] === 4) {
                let tempType1;
                let tempType2;
                let paiDian1 = Math.abs(vecItemType[typeVec[0]][0] - vecItemType[typeVec[0]][1]);
                let paiDian2 = Math.abs(vecItemType[typeVec[0]][1] - vecItemType[typeVec[0]][2]);
                let paiDian3 = Math.abs(vecItemType[typeVec[0]][2] - vecItemType[typeVec[0]][3]);
                let paiDian4 = Math.abs(vecItemType[typeVec[1]][0] - vecItemType[typeVec[1]][1]);
                let paiDian5 = Math.abs(vecItemType[typeVec[1]][1] - vecItemType[typeVec[1]][2]);
                let paiDian6 = Math.abs(vecItemType[typeVec[1]][2] - vecItemType[typeVec[1]][3]);

                let tempAry1: number[] = [paiDian1, paiDian2, paiDian3];
                let tempAry2: number[] = [paiDian4, paiDian5, paiDian6];
                tempType1 = this.GetMaJiangType(3, tempAry1);
                tempType2 = this.GetMaJiangType(3, tempAry2);

                if (tempType1 > tempType2) {
                    type = typeVec[1];
                }
                else if (tempType1 == tempType2) {
                    if ((paiDian1 + paiDian2 + paiDian3) > (paiDian4 + paiDian5 + paiDian6)) {
                        type = typeVec[0];
                    }
                    else if ((paiDian1 + paiDian2 + paiDian3) == (paiDian4 + paiDian5 + paiDian6)) {
                        // let pos = Math.round(Math.random());
                        // type = typeVec[pos];
                        //本来应该随机，现在写死，和客户端统一，取数组的第一个元素
                        type = typeVec[0];
                    }
                    else {
                        type = typeVec[1];
                    }
                } else {
                    type = typeVec[0];
                }
            } else if (typeNum[minIndex] === 6 || typeNum[minIndex] === 7) {
                let weight: number[] = [0, 0];
                weight[0] = this.countPaiWeight(vecPaiType[typeVec[0]]);
                weight[1] = this.countPaiWeight(vecPaiType[typeVec[1]]);
                if (weight[0] > weight[1]) {
                    type = typeVec[1];
                } else {
                    type = typeVec[0]
                }
            }
        }

        let paiDian: number[] = [];
        if (type === -1) {
            console.warn("change3Card not slect type");
        }

        return this.select3PaiFromOneType(vecPaiType[type]);
    }

    select3PaiFromOneType(pai: number[]) {
        let paiDian = [];
        if (pai.length === 3) {
            for (let i = 0; i < pai.length; i++) {
                paiDian.push(pai[i]);
            }
        } else {
            let checker = new ermj.CheckHuStruct();
            //杠子 100000 三条10000  两对 1000  顺子 100 对子 10 单牌 1 
            for (let i = 0; i < pai.length; i++) {
                checker.Add(pai[i]);
            }
            let fourArr: number[][] = [];
            let threeArr: number[][] = [];
            let shunArr: number[][] = [];
            let duiArr: number[][] = [];
            let danArr: number[][] = [];


            for (let i = 0; i < checker.data.length;) {
                if (checker.data[i][1] === 4) {
                    fourArr.push(checker.data[i])
                    checker.data.splice(i, 1);
                } else if (checker.data[i][1] === 3) {
                    threeArr.push(checker.data[i]);
                    checker.data.splice(i, 1);
                } else {
                    i++;
                }
            }
            for (let i = 0; i < checker.data.length;) {
                if (i + 2 < checker.data.length) {
                    if (checker.data[i][0] + 1 === checker.data[i + 1][0] && checker.data[i][0] + 2 === checker.data[i + 2][0]) {
                        let duiCount = 0;
                        let tempDui: number[] = [];
                        let tempDian: number[] = [];
                        for (let j = i; j < i + 3; j++) {
                            if (checker.data[j][1] == 2) {
                                duiCount++;
                                tempDui.push(checker.data[j][0]);
                            } else {
                                tempDian.push(checker.data[j][0]);
                            }
                        }
                        if (duiCount === 2) {
                            duiArr.push([tempDui[0], 2]);
                            duiArr.push([tempDui[1], 2]);
                            danArr.push([tempDian[0], 1]);
                        } else if (duiCount === 3) {
                            duiArr.push([tempDui[0], 2]);
                            duiArr.push([tempDui[1], 2]);
                            duiArr.push([tempDui[2], 2]);
                        } else if (duiCount === 1) {
                            shunArr.push([checker.data[i][0], 1]);
                            danArr.push([tempDui[0], 1]);
                        } else if (duiCount === 0) {
                            shunArr.push([checker.data[i][0], 1]);
                        }
                        checker.data.splice(i, 3);
                        continue;
                    }
                }

                if (checker.data[i][1] === 2) {
                    duiArr.push([checker.data[i][0], 2]);
                    i++;
                } else if (checker.data[i][1] === 1) {
                    danArr.push([checker.data[i][0], 1]);
                    i++;
                }
            }
            for (let i = 0; i < 3;) {
                if (danArr.length > 0) {
                    paiDian.push(danArr[0][0]);
                    danArr.splice(0, 1);
                    i++;
                } else if (duiArr.length > 0) {
                    if (paiDian.length === 2) {
                        paiDian.push(duiArr[0][0]);
                        i++;
                    } else if (paiDian.length <= 1) {
                        paiDian.push(duiArr[0][0]);
                        paiDian.push(duiArr[0][0]);
                        duiArr.splice(0, 1);
                        i += 2;
                    }
                } else if (shunArr.length > 0) {
                    if (paiDian.length === 2) {
                        paiDian.push(shunArr[0][0]);
                        i++;
                    } else if (paiDian.length === 1) {
                        paiDian.push(shunArr[0][0]);
                        paiDian.push(shunArr[0][0] + 1);
                        i += 2;
                    } else if (paiDian.length === 0) {
                        paiDian.push(shunArr[0][0]);
                        paiDian.push(shunArr[0][0] + 1);
                        paiDian.push(shunArr[0][0] + 2);
                        i += 3;
                    }
                } else if (threeArr.length > 0) {
                    if (paiDian.length === 2) {
                        paiDian.push(threeArr[0][0]);
                        i++;
                    } else if (paiDian.length === 1) {
                        paiDian.push(threeArr[0][0]);
                        paiDian.push(threeArr[0][0]);
                        i += 2;
                    } else if (paiDian.length === 0) {
                        paiDian.push(threeArr[0][0]);
                        paiDian.push(threeArr[0][0]);
                        paiDian.push(threeArr[0][0]);
                        i += 3;
                    }
                } else if (fourArr.length > 0) {
                    if (paiDian.length === 2) {
                        paiDian.push(fourArr[0][0]);
                        i++;
                    } else if (paiDian.length === 1) {
                        paiDian.push(fourArr[0][0]);
                        paiDian.push(fourArr[0][0]);
                        i += 2;
                    } else if (paiDian.length === 0) {
                        paiDian.push(fourArr[0][0]);
                        paiDian.push(fourArr[0][0]);
                        paiDian.push(fourArr[0][0]);
                        i += 3;
                    }
                }
            }
        }
        return paiDian;
    }

    countPaiWeight(pai: number[]) {
        let weight = 0;
        let checker = new ermj.CheckHuStruct();
        //杠子 100000 三条10000  两对 1000  顺子 100 对子 10 单牌 1 
        for (let i = 0; i < pai.length; i++) {
            checker.Add(pai[i]);
        }
        for (let i = 0; i < checker.data.length;) {
            if (checker.data[i][1] === 4) {
                weight += 100000;
                checker.data[i][1] = 0;
                checker.data.splice(i, 1);
            } else if (checker.data[i][1] === 3) {
                weight += 10000;
                checker.data[i][1] = 0;
                checker.data.splice(i, 1);
            } else {
                i++;
            }
        }
        for (let i = 0; i < checker.data.length;) {
            if (i + 2 < checker.data.length) {
                if (checker.data[i][0] + 1 === checker.data[i + 1][0] && checker.data[i][0] + 2 === checker.data[i + 2][0]) {
                    let duiCount = 0
                    if (checker.data[i][1] == 2) {
                        duiCount++;
                    }
                    if (checker.data[i + 1][1] == 2) {
                        duiCount++;
                    }
                    if (checker.data[i + 2][1] == 2) {
                        duiCount++;
                    }
                    if (duiCount === 2) {
                        weight += 1000;
                        weight += 1;
                    } else if (duiCount === 3) {
                        weight += 1000;
                        weight += 10;
                    } else if (duiCount === 1) {
                        weight += 100;
                        weight += 1;
                    } else if (duiCount === 0) {
                        weight += 100;
                    }
                    checker.data.splice(i, 3);
                    continue;
                }
            }

            if (checker.data[i][1] === 2) {
                weight += 10;
                i++;
            } else if (checker.data[i][1] === 1) {
                weight += 1;
                i++;
            }
        }
        return weight;
    }


    ChooseQue(handPai: number[]) {
        let QueType = ermj.MJ_TYPE_PAI.MJ_TYPE_PAI_WAN;
        let paiTemp: number[] = [];
        paiTemp = handPai.concat();
        this.MaoPaoSort(paiTemp, paiTemp.length, false);

        let vecItemType: number[][] = [[], [], [], []];
        for (let i = 0; i < paiTemp.length; i++) {
            let PaiNumber = paiTemp[i];
            if (PaiNumber == 0) {
                continue;
            }
            let PaiDian = PaiNumber % 10;
            let HuaSe = Math.floor(PaiNumber / 10);
            vecItemType[HuaSe].push(PaiDian);
        }

        let typeNum: number[] = [];
        let minIndex = 1;
        let typeVec: number[] = [];
        for (let i = 1; i < 4; i++) {
            typeNum[i] = vecItemType[i].length;
            if (typeNum[minIndex] > typeNum[i]) {
                minIndex = i;
                typeVec = [];
                typeVec.push(i);
            } else if (typeNum[minIndex] == typeNum[i]) {
                typeVec.push(i);
            }
        }
        if (typeVec.length == 1) {
            return minIndex;
        } else if (typeVec.length == 2) {
            if (typeNum[minIndex] == 1 || typeNum[minIndex] == 0) {
                //let pos = Math.round(Math.random());
                //QueType = typeVec[pos];
                //本来应该随机，现在写死，和客户端统一，取数组的第一个元素
                QueType = typeVec[0];
            } else if (typeNum[minIndex] == 2) {
                let paiDian1 = Math.abs(vecItemType[typeVec[0]][0] - vecItemType[typeVec[0]][1]);
                let paiDian2 = Math.abs(vecItemType[typeVec[1]][0] - vecItemType[typeVec[1]][1]);
                if (paiDian1 > paiDian2) {
                    QueType = typeVec[0];
                }
                else if (paiDian1 == paiDian2) {
                    //let pos = Math.round(Math.random());
                    //QueType = typeVec[pos];
                    //本来应该随机，现在写死，和客户端统一，取数组的第一个元素
                    QueType = typeVec[0];
                }
                else {
                    QueType = typeVec[1];
                }
            } else if (typeNum[minIndex] == 3) {
                let paiDian1 = Math.abs(vecItemType[typeVec[0]][0] - vecItemType[typeVec[0]][1]);
                let paiDian2 = Math.abs(vecItemType[typeVec[0]][1] - vecItemType[typeVec[0]][2]);
                let paiDian3 = Math.abs(vecItemType[typeVec[1]][0] - vecItemType[typeVec[1]][1]);
                let paiDian4 = Math.abs(vecItemType[typeVec[1]][1] - vecItemType[typeVec[1]][2]);
                let tempAry1: number[] = [paiDian1, paiDian2];
                let tempAry2: number[] = [paiDian3, paiDian4];
                let tempType1 = this.GetMaJiangType(2, tempAry1);
                let tempType2 = this.GetMaJiangType(2, tempAry2);
                if (tempType1 > tempType2) {
                    QueType = typeVec[1];
                }
                else if (tempType1 == tempType2) {
                    if ((paiDian1 + paiDian2) > (paiDian3 + paiDian4)) {
                        QueType = typeVec[0];
                    }
                    else if ((paiDian1 + paiDian2) == (paiDian3 + paiDian4)) {
                        //let pos = Math.round(Math.random());
                        //QueType = typeVec[pos];
                        //本来应该随机，现在写死，和客户端统一，取数组的第一个元素
                        QueType = typeVec[0];
                    }
                    else {
                        QueType = typeVec[1];
                    }
                }
                else {
                    QueType = typeVec[0];
                }
            } else if (typeNum[minIndex] == 4) {
                let tempType1;
                let tempType2;
                let paiDian1 = Math.abs(vecItemType[typeVec[0]][0] - vecItemType[typeVec[0]][1]);
                let paiDian2 = Math.abs(vecItemType[typeVec[0]][1] - vecItemType[typeVec[0]][2]);
                let paiDian3 = Math.abs(vecItemType[typeVec[0]][2] - vecItemType[typeVec[0]][3]);
                let paiDian4 = Math.abs(vecItemType[typeVec[1]][0] - vecItemType[typeVec[1]][1]);
                let paiDian5 = Math.abs(vecItemType[typeVec[1]][1] - vecItemType[typeVec[1]][2]);
                let paiDian6 = Math.abs(vecItemType[typeVec[1]][2] - vecItemType[typeVec[1]][3]);

                let tempAry1: number[] = [paiDian1, paiDian2, paiDian3];
                let tempAry2: number[] = [paiDian4, paiDian5, paiDian6];
                tempType1 = this.GetMaJiangType(3, tempAry1);
                tempType2 = this.GetMaJiangType(3, tempAry2);

                if (tempType1 > tempType2) {
                    QueType = typeVec[1];
                }
                else if (tempType1 == tempType2) {
                    if ((paiDian1 + paiDian2 + paiDian3) > (paiDian4 + paiDian5 + paiDian6)) {
                        QueType = typeVec[0];
                    }
                    else if ((paiDian1 + paiDian2 + paiDian3) == (paiDian4 + paiDian5 + paiDian6)) {
                        //本来应该随机，现在写死，和客户端统一，取数组的第一个元素
                        //let pos = Math.round(Math.random());
                        //QueType = typeVec[pos];
                        QueType = typeVec[0];
                    }
                    else {
                        QueType = typeVec[1];
                    }
                } else {
                    QueType = typeVec[0];
                }
            }
        }
        return QueType;
    }

    GetMaJiangType(PaiCount: number, Pai: number[]) {
        let tempType = ErmjType.SAN_PAI;
        if (PaiCount == 2) {
            if (Pai[0] == 0 || Pai[1] == 0) {
                tempType = ErmjType.DUI_PAI;
            }
            if (Pai[0] == 0 && Pai[1] == 0) {
                tempType = ErmjType.KE_ZI;
            }
            if (Pai[0] == 1 && Pai[1] == 1) {
                tempType = ErmjType.SHUN_PAI;
            }
        }
        else if (PaiCount == 3) {
            if (Pai[0] == 0 || Pai[1] == 0 || Pai[2] == 0) {
                tempType = ErmjType.DUI_PAI;
            }
            if (Pai[0] == 1 && Pai[1] == 1 || Pai[1] == 1 && Pai[2] == 1) {
                tempType = ErmjType.SHUN_PAI;
            }
            if (Pai[0] == 0 && Pai[2] == 0) {
                tempType = ErmjType.LIANG_DUI_PAI;
            }
            if (Pai[0] == 0 && Pai[1] == 0 || Pai[1] == 0 && Pai[2] == 0) {
                tempType = ErmjType.KE_ZI;
            }
            if (Pai[0] == 0 && Pai[1] == 0 && Pai[2] == 0) {
                tempType = ErmjType.GANG_ZI;
            }
        }
        return tempType;
    }


    checkAutoOutCard(handPai: number[], inPai: number, queType: number) {
        let pais: number[] = handPai.concat();
        if (inPai !== 0) {
            pais.push(inPai);
        }

        if (this.IsHaveQueMen(pais, 0, queType)) {
            for (let pai of pais) {
                if (Math.floor(pai / 10) === queType) {
                    return pai;
                }
            }
        } else {
            return pais.pop();
        }
    }
}

//////////////////////////////////////////////////////////////////////////
