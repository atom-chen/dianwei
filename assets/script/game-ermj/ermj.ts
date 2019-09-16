export function MAKE_A_MJ(hs: number, pd: number) {
    return ((hs) * 10 + (pd));
}
////////////////////////////////////////////客户端枚举
export enum GameStatus {
    GAME_WAIT = 0,                  // 等待开始
    GAME_SEND_CARD,                 // 发牌
    GAME_WAIT_USER_OUT_CARD,        // 等待用户出牌
    GAME_CHI_PENG_GANG_HU,          // 碰杠户
    GAME_ROUND_RESULT               // 结束
};

// 布尔值判断
export enum BooleanType {
    BOOLEAN_NO = 0,
    BOOLEAN_YES,
}
// 玩家座位
export enum PlayerSeat {
    SEAT_SELF = 0,
    SEAT_UP,
};
// 操作类型
export enum OptType {
    OPT_PENG = 0,
    OPT_GANG,
    OPT_HU,
    OPT_CHI,
    OPT_GUO,
}
// 换三张的类型 （动画演示）
export enum ChangeType {
    CHANGE_CLOCKWISE = 0,           // 顺时针
    CHANGE_ANTICLOCKWISE,           // 逆时针
    CHANGE_OPPONENT                 // 对家       
}

export enum UserState {
    USER_STATE_NULL = 0,
    USER_STATE_TING_PAI = 1,
    USER_STATE_HU_PAI = 2
}

export interface PaisInfo {
    rPos: number,
    pais: Array<number>,
}

export interface ChangeScore {
    rPos: number,
    changeScore: number,
}

export interface PGangInfo {
    type: GangType,
    pai: number,
    chiPai: number,
}

export interface QueInfo {
    rPos: number,
    queType: number,
}

export interface GameResult {
    huPai: number,
    rPos: number,
    handlePai: Array<number>,
    chgMoney: string,
}

export interface PlayerInfo {
    isMale: boolean,
    avatar: number,
    location?: string,
    name?: string,
    isMe: boolean,
    isDealer: boolean,
}

export interface SaveDiscardInfo {
    outPos: number,
    outPaiVal: number[]
}

////////////////////////////////////////////////
export enum MJ_TYPE_PAI {
    MJ_TYPE_PAI_NONE = 0,
    MJ_TYPE_PAI_WAN = 1,
    MJ_TYPE_PAI_TIAO = 2,
    MJ_TYPE_PAI_BING = 3,
    MJ_TYPE_PAI_FENG = 4,
    MJ_TYPE_PAI_HUA = 5
};

export enum GangType {
    GANG_TYPE_DARK = 1,             // 暗杠
    GANG_TYPE_SHINE = 2,            // 点杠
    GANG_TYPE_ADD = 3,              // 巴杠
    GANG_TYPE_PENG = 4,
    GANG_TYPE_CHI,
}
export interface PengGangInfo {
    pai: number;                        // 牌数据
    gangType: GangType;                 // 杠牌类型
    winStation: number[];              // 赢位置
    winCount: number;                   // 数量
}

export enum Action {
    USER_ACTION_OUT_CARD,
    USER_ACTION_UP_CARD,
    USER_ACTION_PENG,
    USER_ACTION_GANG,
    USER_ACTION_HU,
    USER_ACTION_PASS
};

export interface UserAction {
    station: number;
    action: Action;
    card: number;
};

enum MJ_TYPE_PAI_DIAN {
    MJ_TYPE_PAI_DIAN_NONE = -1,

    MJ_TYPE_PAI_DIAN_1 = 1,
    MJ_TYPE_PAI_DIAN_2 = 2,
    MJ_TYPE_PAI_DIAN_3 = 3,
    MJ_TYPE_PAI_DIAN_4 = 4,
    MJ_TYPE_PAI_DIAN_5 = 5,
    MJ_TYPE_PAI_DIAN_6 = 6,
    MJ_TYPE_PAI_DIAN_7 = 7,
    MJ_TYPE_PAI_DIAN_8 = 8,
    MJ_TYPE_PAI_DIAN_9 = 9

};


export interface XZConfig {
    change3Pai: boolean,
    ziMoType: number,
    dianGangHuaZiMo: boolean,
    haiDiLao: boolean,
    menQingZhongZhuang: boolean,
    yaoJiuJiangDui: boolean,
    dianGangCaGua: boolean,
    tianDiHu: boolean,
    jiShiYu: boolean,
    huJiaoZhuanYi: boolean,
    fanMaxLimit: number
};

export interface stCheckBigHu {
    huType: number[];
    score: number;
    fan: number;
    pai: number;
};
export interface XZBaseConfig {
    waitTime: number,           // 等待设置时长
    changeThreeCardTime: number,// 换3张时间
    changeThreeCardAnimalTime: number,// 换3张时间
    dingQueTime: number,        // 定缺时间
    sendCardTime: number,       // 发牌时间
    userOptTime: number,        // 玩家操作时间
    resultTime: number,
}

export enum MJ_TYPE {
    MJ_TYPE_NONE = 0,
    MJ_TYPE_FCHUN = MAKE_A_MJ(MJ_TYPE_PAI.MJ_TYPE_PAI_FENG, 11),
    MJ_TYPE_FXIA = MAKE_A_MJ(MJ_TYPE_PAI.MJ_TYPE_PAI_FENG, 12),
    MJ_TYPE_FQIU = MAKE_A_MJ(MJ_TYPE_PAI.MJ_TYPE_PAI_FENG, 13),
    MJ_TYPE_FDONG = MAKE_A_MJ(MJ_TYPE_PAI.MJ_TYPE_PAI_FENG, 14),
    MJ_TYPE_FMEI = MAKE_A_MJ(MJ_TYPE_PAI.MJ_TYPE_PAI_FENG, 15),
    MJ_TYPE_FLAN = MAKE_A_MJ(MJ_TYPE_PAI.MJ_TYPE_PAI_FENG, 16),
    MJ_TYPE_FZHU = MAKE_A_MJ(MJ_TYPE_PAI.MJ_TYPE_PAI_FENG, 17),
    MJ_TYPE_FJU = MAKE_A_MJ(MJ_TYPE_PAI.MJ_TYPE_PAI_FENG, 18),

    MJ_TYPE_CAISHEN = MAKE_A_MJ(MJ_TYPE_PAI.MJ_TYPE_PAI_FENG, 19),
    MJ_TYPE_YUANBAO = MAKE_A_MJ(MJ_TYPE_PAI.MJ_TYPE_PAI_FENG, 20),
    MJ_TYPE_MAO = MAKE_A_MJ(MJ_TYPE_PAI.MJ_TYPE_PAI_FENG, 21),
    MJ_TYPE_LAOXU = MAKE_A_MJ(MJ_TYPE_PAI.MJ_TYPE_PAI_FENG, 22),

    MJ_TYPE_FD = MAKE_A_MJ(MJ_TYPE_PAI.MJ_TYPE_PAI_FENG, MJ_TYPE_PAI_DIAN.MJ_TYPE_PAI_DIAN_1),
    MJ_TYPE_FN = MAKE_A_MJ(MJ_TYPE_PAI.MJ_TYPE_PAI_FENG, MJ_TYPE_PAI_DIAN.MJ_TYPE_PAI_DIAN_2),
    MJ_TYPE_FX = MAKE_A_MJ(MJ_TYPE_PAI.MJ_TYPE_PAI_FENG, MJ_TYPE_PAI_DIAN.MJ_TYPE_PAI_DIAN_3),
    MJ_TYPE_FB = MAKE_A_MJ(MJ_TYPE_PAI.MJ_TYPE_PAI_FENG, MJ_TYPE_PAI_DIAN.MJ_TYPE_PAI_DIAN_4),
    MJ_TYPE_ZHONG = MAKE_A_MJ(MJ_TYPE_PAI.MJ_TYPE_PAI_FENG, MJ_TYPE_PAI_DIAN.MJ_TYPE_PAI_DIAN_5),
    MJ_TYPE_FA = MAKE_A_MJ(MJ_TYPE_PAI.MJ_TYPE_PAI_FENG, MJ_TYPE_PAI_DIAN.MJ_TYPE_PAI_DIAN_6),
    MJ_TYPE_BAI = MAKE_A_MJ(MJ_TYPE_PAI.MJ_TYPE_PAI_FENG, MJ_TYPE_PAI_DIAN.MJ_TYPE_PAI_DIAN_7),

    MJ_TYPE_W1 = MAKE_A_MJ(MJ_TYPE_PAI.MJ_TYPE_PAI_WAN, MJ_TYPE_PAI_DIAN.MJ_TYPE_PAI_DIAN_1),
    MJ_TYPE_W2 = MAKE_A_MJ(MJ_TYPE_PAI.MJ_TYPE_PAI_WAN, MJ_TYPE_PAI_DIAN.MJ_TYPE_PAI_DIAN_2),
    MJ_TYPE_W3 = MAKE_A_MJ(MJ_TYPE_PAI.MJ_TYPE_PAI_WAN, MJ_TYPE_PAI_DIAN.MJ_TYPE_PAI_DIAN_3),
    MJ_TYPE_W4 = MAKE_A_MJ(MJ_TYPE_PAI.MJ_TYPE_PAI_WAN, MJ_TYPE_PAI_DIAN.MJ_TYPE_PAI_DIAN_4),
    MJ_TYPE_W5 = MAKE_A_MJ(MJ_TYPE_PAI.MJ_TYPE_PAI_WAN, MJ_TYPE_PAI_DIAN.MJ_TYPE_PAI_DIAN_5),
    MJ_TYPE_W6 = MAKE_A_MJ(MJ_TYPE_PAI.MJ_TYPE_PAI_WAN, MJ_TYPE_PAI_DIAN.MJ_TYPE_PAI_DIAN_6),
    MJ_TYPE_W7 = MAKE_A_MJ(MJ_TYPE_PAI.MJ_TYPE_PAI_WAN, MJ_TYPE_PAI_DIAN.MJ_TYPE_PAI_DIAN_7),
    MJ_TYPE_W8 = MAKE_A_MJ(MJ_TYPE_PAI.MJ_TYPE_PAI_WAN, MJ_TYPE_PAI_DIAN.MJ_TYPE_PAI_DIAN_8),
    MJ_TYPE_W9 = MAKE_A_MJ(MJ_TYPE_PAI.MJ_TYPE_PAI_WAN, MJ_TYPE_PAI_DIAN.MJ_TYPE_PAI_DIAN_9),

    MJ_TYPE_T1 = MAKE_A_MJ(MJ_TYPE_PAI.MJ_TYPE_PAI_TIAO, MJ_TYPE_PAI_DIAN.MJ_TYPE_PAI_DIAN_1),
    MJ_TYPE_T2 = MAKE_A_MJ(MJ_TYPE_PAI.MJ_TYPE_PAI_TIAO, MJ_TYPE_PAI_DIAN.MJ_TYPE_PAI_DIAN_2),
    MJ_TYPE_T3 = MAKE_A_MJ(MJ_TYPE_PAI.MJ_TYPE_PAI_TIAO, MJ_TYPE_PAI_DIAN.MJ_TYPE_PAI_DIAN_3),
    MJ_TYPE_T4 = MAKE_A_MJ(MJ_TYPE_PAI.MJ_TYPE_PAI_TIAO, MJ_TYPE_PAI_DIAN.MJ_TYPE_PAI_DIAN_4),
    MJ_TYPE_T5 = MAKE_A_MJ(MJ_TYPE_PAI.MJ_TYPE_PAI_TIAO, MJ_TYPE_PAI_DIAN.MJ_TYPE_PAI_DIAN_5),
    MJ_TYPE_T6 = MAKE_A_MJ(MJ_TYPE_PAI.MJ_TYPE_PAI_TIAO, MJ_TYPE_PAI_DIAN.MJ_TYPE_PAI_DIAN_6),
    MJ_TYPE_T7 = MAKE_A_MJ(MJ_TYPE_PAI.MJ_TYPE_PAI_TIAO, MJ_TYPE_PAI_DIAN.MJ_TYPE_PAI_DIAN_7),
    MJ_TYPE_T8 = MAKE_A_MJ(MJ_TYPE_PAI.MJ_TYPE_PAI_TIAO, MJ_TYPE_PAI_DIAN.MJ_TYPE_PAI_DIAN_8),
    MJ_TYPE_T9 = MAKE_A_MJ(MJ_TYPE_PAI.MJ_TYPE_PAI_TIAO, MJ_TYPE_PAI_DIAN.MJ_TYPE_PAI_DIAN_9),

    MJ_TYPE_B1 = MAKE_A_MJ(MJ_TYPE_PAI.MJ_TYPE_PAI_BING, MJ_TYPE_PAI_DIAN.MJ_TYPE_PAI_DIAN_1),
    MJ_TYPE_B2 = MAKE_A_MJ(MJ_TYPE_PAI.MJ_TYPE_PAI_BING, MJ_TYPE_PAI_DIAN.MJ_TYPE_PAI_DIAN_2),
    MJ_TYPE_B3 = MAKE_A_MJ(MJ_TYPE_PAI.MJ_TYPE_PAI_BING, MJ_TYPE_PAI_DIAN.MJ_TYPE_PAI_DIAN_3),
    MJ_TYPE_B4 = MAKE_A_MJ(MJ_TYPE_PAI.MJ_TYPE_PAI_BING, MJ_TYPE_PAI_DIAN.MJ_TYPE_PAI_DIAN_4),
    MJ_TYPE_B5 = MAKE_A_MJ(MJ_TYPE_PAI.MJ_TYPE_PAI_BING, MJ_TYPE_PAI_DIAN.MJ_TYPE_PAI_DIAN_5),
    MJ_TYPE_B6 = MAKE_A_MJ(MJ_TYPE_PAI.MJ_TYPE_PAI_BING, MJ_TYPE_PAI_DIAN.MJ_TYPE_PAI_DIAN_6),
    MJ_TYPE_B7 = MAKE_A_MJ(MJ_TYPE_PAI.MJ_TYPE_PAI_BING, MJ_TYPE_PAI_DIAN.MJ_TYPE_PAI_DIAN_7),
    MJ_TYPE_B8 = MAKE_A_MJ(MJ_TYPE_PAI.MJ_TYPE_PAI_BING, MJ_TYPE_PAI_DIAN.MJ_TYPE_PAI_DIAN_8),
    MJ_TYPE_B9 = MAKE_A_MJ(MJ_TYPE_PAI.MJ_TYPE_PAI_BING, MJ_TYPE_PAI_DIAN.MJ_TYPE_PAI_DIAN_9)
};

export const TYPE_JIANG_PAI = 15
export const TYPE_JINGDIAO_JIANG = 16
export const TYPE_SHUN_ZI = 17
export const TYPE_AN_KE = 18
export enum ZIMO_TYPE {
    ZIMO_FAN = 1,
    ZIMO_DI,
    ZIMO_NULL
}

export enum HU_TYPE_EX {
    HUPAI_HU_PAI = 150,  //150
    HUPAI_AN_QI_DUI,                        //暗七对
    HUPAI_LONG_QI_DUI,                      //龙七对
    HUPAI_SHUANG_LONG_QI_DUI,               //双龙七对
    HUPAI_SAN_LONG_QI_DUI,                  //三龙七对
    HUPAI_QING_QI_DUI,                      //清七对
    HUPAI_QING_LONG_QI_DUI,                 //清隆七对
    HUPAI_QING_SHUANG_LONG_QI_DUI,          //清双龙七对
    HUPAI_QING_SAN_LONG_QI_DUI,             //清三龙七对
    HUPAI_YAO_JIU_QI_DUI,                   //幺九七对


    HUPAI_PENG_PENG_HU,                     //大对子
    HUPAI_QING_DA_DUI,                      //清大对
    HUPAI_JIANG_DA_DUI,                     //将大对
    HUPAI_JIN_GOU_DIAO,                     //金钩钓
    HUPAI_QING_JIN_GOU_DIAO,                //清金钩钓
    HUPAI_JIANG_JIN_GOU,                    //将金钩
    HUPAI_18_LUO_HAN,                       //18罗汉
    HUPAI_QING_18_LUO_HAN,                  //清18罗汉
    HUPAI_JIANG_18_LUO_HAN,                 //将18罗汉

    HUPAI_DUAN_YAO_JIU,                     //断幺九
    HUPAI_MEN_QIAN_QING,                    //门前清
    HUPAI_QING_YI_SE,                       //清一色
    HUPAI_QUAN_DAI_YAO,                     //全带幺
    HUPAI_TYPE_GANG_KAI,                    //杠上开花
    HUPAI_TYPE_GANG_PAO,                    //杠上炮
    HUPAI_TYPE_TIAN_HU,                     //天胡
    HUPAI_TYPE_DI_HU,                       //地胡
    HUPAI_TYPE_QIANG_GANG,                  //抢杠
    HUPAI_CHA_JIAO,                         //查叫
    HUPAI_QING_DAI_YAO,                     //清带幺
    HUPAI_HAI_DI_LAO,                       //海底
    HUPAI_ZI_MO,                            //自摸
    HUPAI_GEN_ONE,                          //根*1
    HUPAI_GEN_TWO,                          //根*2
    HUPAI_GEN_THREE,                        //根*3
    HUPAI_GEN_FOUR,                         //根*4
    HUPAI_NOT_TING_PAI_RETURN_TAX,          //退税
    HUPAI_HUA_ZHU_PEI_MAN,                  //花🐷陪满
};

export class PingHuStruct {
    public pingHuData: { byType: number, data: number[] }[];
    constructor() {
        this.Init();
    };
    AddData = (type: number, pai: number[]) => {
        this.pingHuData.push({
            byType: type,
            data: pai.concat()
        });
    }
    DeleteData = (type: number, pai: number[]) => {
        for (let i = 0; i < this.pingHuData.length; i++) {
            if (this.pingHuData[i].byType === type && pai[0] == this.pingHuData[i].data[0] && pai[1] == this.pingHuData[i].data[1]) {
                this.pingHuData.splice(i, 1);
                break;
            }
        }
    }

    Init = () => {
        this.pingHuData = [];
    }
}

export class CheckHuStruct {
    public data: number[][];
    Add = (pai: number) => {
        let exist = false;
        for (let i = 0; i < this.data.length; i++) {
            if (this.data[i][0] === pai) {
                this.data[i][1]++;
                exist = true;
            }
        }

        if (exist == false) {
            this.data.push([pai, 1]);
        }
    };
    GetPaiCount = (pai: number) => {
        for (let i = 0; i < this.data.length; i++) {
            if (this.data[i][0] == pai && pai != 0 && this.data[i][1] != 0) {
                return this.data[i][1];
            }
        }
        return 0;
    };
    GetDataCount = () => {
        let conut = 0;
        for (let i = 0; i < this.data.length; i++) {
            if (this.data[i][0] != 0) {
                conut++;
            }
        }
        return conut;
    };
    GetAllPaiCount = () => {
        let num = 0;
        for (let i = 0; i < this.data.length; i++) {
            if (this.data[i][0] != 0) {
                num += this.data[i][1];
            }
        }
        return num;
    };
    SetPaiCount = (pai: number, num: number) => {
        for (let i = 0; i < this.data.length; i++) {
            if (this.data[i][0] == pai && pai != 0) {
                this.data[i][1] = num;
            }
        }
    }
    Init = () => {
        this.data = [];
    }
    constructor() {
        this.Init();
    }
};

export const stcArr_A_Mj_WTT: number[] =
    [
        MJ_TYPE.MJ_TYPE_W1,
        MJ_TYPE.MJ_TYPE_W2,
        MJ_TYPE.MJ_TYPE_W3,
        MJ_TYPE.MJ_TYPE_W4,
        MJ_TYPE.MJ_TYPE_W5,
        MJ_TYPE.MJ_TYPE_W6,
        MJ_TYPE.MJ_TYPE_W7,
        MJ_TYPE.MJ_TYPE_W8,
        MJ_TYPE.MJ_TYPE_W9,

        MJ_TYPE.MJ_TYPE_B1,
        MJ_TYPE.MJ_TYPE_B2,
        MJ_TYPE.MJ_TYPE_B3,
        MJ_TYPE.MJ_TYPE_B4,
        MJ_TYPE.MJ_TYPE_B5,
        MJ_TYPE.MJ_TYPE_B6,
        MJ_TYPE.MJ_TYPE_B7,
        MJ_TYPE.MJ_TYPE_B8,
        MJ_TYPE.MJ_TYPE_B9,

        MJ_TYPE.MJ_TYPE_T1,
        MJ_TYPE.MJ_TYPE_T2,
        MJ_TYPE.MJ_TYPE_T3,
        MJ_TYPE.MJ_TYPE_T4,
        MJ_TYPE.MJ_TYPE_T5,
        MJ_TYPE.MJ_TYPE_T6,
        MJ_TYPE.MJ_TYPE_T7,
        MJ_TYPE.MJ_TYPE_T8,
        MJ_TYPE.MJ_TYPE_T9
    ];


    export enum HU_TYPE_ER {
        HUPAI_HU_PAI = 100,                     //100
        //88番
        HUPAI_DA_SI_XI,                         //大四喜
        HUPAI_DA_SAN_YUAN,                      //大三元
        HUPAI_JIU_LIAN_BAO_DENG,                //九莲宝灯
        HUPAI_SI_GANG,                          //四杠
        HUPAI_LIAN_QI_DUI,                      //连七对
        HUPAI_TIAN_HE,                          //天和
        HUPAI_DI_HE,                            //地和
        HUPAI_REN_HE,                           //人和
        HUPAI_BAI_WAN_DAN,                      //百万石
        //64番
        HUPAI_XIAO_SI_XI,                       //小四喜
        HUPAI_XIAO_SAN_YUAN,                    //小三元
        HUPAI_ZI_YI_SE,                         //字一色
        HUPAI_SI_AN_KE,                         //四暗刻
        HUPAI_YI_SE_SHUANG_LONG_HUI,            //一色双龙会
        //48番
        HUPAI_YI_SE_SI_TONG_SHUN,               //一色四同顺
        HUPAI_YI_SE_SI_JIE_GAO,                 //一色四节高
        //32番
        HUPAI_YI_SE_SI_BU_GAO,                  //一色四步高
        HUPAI_SAN_GANG,                         //三杠
        HUPAI_HUN_YAO_JIU,                      //混幺九
        //24番
        HUPAI_QI_DUI,                           //七对
        HUPAI_QING_YI_SE,                       //清一色
        HUPAI_YI_SE_SAN_TONG_SHUN,              //一色三同顺
        HUPAI_YI_SE_SAN_JIE_GAO,                //一色三节高
        //16番
        HUPAI_QING_LONG,                        //青龙
        HUPAI_YI_SE_SAN_BU_GAO,                 //一色三步高
        HUPAI_SAN_AN_KE,                        //三暗刻
        HUPAI_TIAN_TING,                        //天听
        //12番
        HUPAI_DA_YU_WU,                         //大于5
        HUPAI_XIAO_YU_WU,                       //小于5
        HUPAI_SAN_FENG_KE,                      //三风刻
        //8番
        HUPAI_MIAO_SHOU_HUI_CHUN,               //妙手回春
        HUPAI_HAI_DI_LAO_YUE,                   //海底捞月
        HUPAI_GANG_SHANG_KAI_HUA,               //杠上开花
        HUPAI_QIANG_GANG_HE,                    //抢杠和
        //6番
        HUPAI_PENG_PENG_HE,                     //碰碰和
        HUPAI_HUN_YI_SE,                        //混一色
        HUPAI_QUAN_QIU_REN,                     //全求人
        HUPAI_SHUANG_AN_GANG,                   //双暗杠
        HUPAI_SHUANG_JIAN_KE,                   //双箭刻
        //4番
        HUPAI_QUAN_DAI_YAO,                     //全带幺
        HUPAI_BU_QIU_REN,                       //不求人
        HUPAI_SHUANG_MING_GANG,                 //双明杠
        HUPAI_HE_JUE_ZHANG,                     //和绝张
        HUPAI_LI_ZHI,                           //立直
        //2番
        HUPAI_JIAN_KE,                          //箭刻
        HUPAI_QUAN_FENG_KE,                     //圈风刻
        HUPAI_MEN_FENG_KE,                      //门风刻
        HUPAI_MEN_QIAN_QIANG,                   //门前清
        HUPAI_PING_HE,                          //平和
        HUPAI_SI_GUI,                           //四归一
        HUPAI_SHUANG_AN_KE,                     //双暗刻
        HUPAI_AN_GANG,                          //暗杠
        HUPAI_DUAN_YAO,                         //断幺
        //1番
        HUPAI_ER_WU_BA_JIANG,                   //二五八将
        HUPAI_YAO_JIU_TOU,                      //幺九头
        HUPAI_BAO_TING,                         //报听
        HUPAI_YI_BAN_GAO,                       //一般高
        HUPAI_LIAN_LIU,                         //连六
        HUPAI_LAO_SHAO_FU,                      //老少副
        HUPAI_YAO_JIU_KE,                       //幺九刻
        HUPAI_MING_GANG,                        //明杠
        HUPAI_BIAN_ZHANG,                       //边张
        HUPAI_KAN_ZHANG,                        //坎张
        HUPAI_DAN_DIAO_JIANG,                   //单调将
        HUPAI_ZI_MO,                            //自摸
    };
    
    export const TypeFan: {[t:number]: number} = {
        //88番
        [HU_TYPE_ER.HUPAI_DA_SI_XI]: 88,
        [HU_TYPE_ER.HUPAI_DA_SAN_YUAN]: 88,
        [HU_TYPE_ER.HUPAI_JIU_LIAN_BAO_DENG]: 88,
        [HU_TYPE_ER.HUPAI_SI_GANG]: 88,
        [HU_TYPE_ER.HUPAI_LIAN_QI_DUI]: 88,
        [HU_TYPE_ER.HUPAI_TIAN_HE]: 88,
        [HU_TYPE_ER.HUPAI_DI_HE]: 88,
        [HU_TYPE_ER.HUPAI_REN_HE]: 88,
        [HU_TYPE_ER.HUPAI_BAI_WAN_DAN]: 88,
        //64番
        [HU_TYPE_ER.HUPAI_XIAO_SI_XI]: 64,
        [HU_TYPE_ER.HUPAI_XIAO_SAN_YUAN]: 64,
        [HU_TYPE_ER.HUPAI_ZI_YI_SE]: 64,
        [HU_TYPE_ER.HUPAI_SI_AN_KE]: 64,
        [HU_TYPE_ER.HUPAI_YI_SE_SHUANG_LONG_HUI]: 64,
        //48番
        [HU_TYPE_ER.HUPAI_YI_SE_SI_TONG_SHUN]: 48,
        [HU_TYPE_ER.HUPAI_YI_SE_SI_JIE_GAO]: 48,
        //32番
        [HU_TYPE_ER.HUPAI_YI_SE_SI_BU_GAO]: 32,
        [HU_TYPE_ER.HUPAI_SAN_GANG]: 32,
        [HU_TYPE_ER.HUPAI_HUN_YAO_JIU]: 32,
        //24番
        [HU_TYPE_ER.HUPAI_QI_DUI]: 24,
        [HU_TYPE_ER.HUPAI_QING_YI_SE]: 24,
        [HU_TYPE_ER.HUPAI_YI_SE_SAN_TONG_SHUN]: 24,
        [HU_TYPE_ER.HUPAI_YI_SE_SAN_JIE_GAO]: 24,
        //16番
        [HU_TYPE_ER.HUPAI_QING_LONG]: 16,
        [HU_TYPE_ER.HUPAI_YI_SE_SAN_BU_GAO]: 16,
        [HU_TYPE_ER.HUPAI_SAN_AN_KE]: 16,
        [HU_TYPE_ER.HUPAI_TIAN_TING]: 16,
        //12番
        [HU_TYPE_ER.HUPAI_DA_YU_WU]: 12,
        [HU_TYPE_ER.HUPAI_XIAO_YU_WU]: 12,
        [HU_TYPE_ER.HUPAI_SAN_FENG_KE]: 12,
        //8番
        [HU_TYPE_ER.HUPAI_MIAO_SHOU_HUI_CHUN]: 8,
        [HU_TYPE_ER.HUPAI_HAI_DI_LAO_YUE]: 8,
        [HU_TYPE_ER.HUPAI_GANG_SHANG_KAI_HUA]: 8,
        [HU_TYPE_ER.HUPAI_QIANG_GANG_HE]: 8,
        //6番
        [HU_TYPE_ER.HUPAI_PENG_PENG_HE]: 6,
        [HU_TYPE_ER.HUPAI_HUN_YI_SE]: 6,
        [HU_TYPE_ER.HUPAI_QUAN_QIU_REN]: 6,
        [HU_TYPE_ER.HUPAI_SHUANG_AN_GANG]: 6,
        [HU_TYPE_ER.HUPAI_SHUANG_JIAN_KE]: 6,
        //4番
        [HU_TYPE_ER.HUPAI_QUAN_DAI_YAO]: 4,
        [HU_TYPE_ER.HUPAI_BU_QIU_REN]: 4,
        [HU_TYPE_ER.HUPAI_SHUANG_MING_GANG]: 4,
        [HU_TYPE_ER.HUPAI_HE_JUE_ZHANG]: 4,
        [HU_TYPE_ER.HUPAI_LI_ZHI]: 4,
        //2番
        [HU_TYPE_ER.HUPAI_JIAN_KE]: 2,
        [HU_TYPE_ER.HUPAI_QUAN_FENG_KE]: 2,
        [HU_TYPE_ER.HUPAI_MEN_FENG_KE]: 2,
        [HU_TYPE_ER.HUPAI_MEN_QIAN_QIANG]: 2,
        [HU_TYPE_ER.HUPAI_PING_HE]: 2,
        [HU_TYPE_ER.HUPAI_SI_GUI]: 2,
        [HU_TYPE_ER.HUPAI_SHUANG_AN_KE]: 2,
        [HU_TYPE_ER.HUPAI_AN_GANG]: 2,
        [HU_TYPE_ER.HUPAI_DUAN_YAO]: 2,
        //1番
        [HU_TYPE_ER.HUPAI_ER_WU_BA_JIANG]: 1,
        [HU_TYPE_ER.HUPAI_YAO_JIU_TOU]: 1,
        [HU_TYPE_ER.HUPAI_BAO_TING]: 1,
        [HU_TYPE_ER.HUPAI_YI_BAN_GAO]: 1,
        [HU_TYPE_ER.HUPAI_LIAN_LIU]: 1,
        [HU_TYPE_ER.HUPAI_LAO_SHAO_FU]: 1,
        [HU_TYPE_ER.HUPAI_YAO_JIU_KE]: 1,
        [HU_TYPE_ER.HUPAI_MING_GANG]: 1,
        [HU_TYPE_ER.HUPAI_BIAN_ZHANG]: 1,
        [HU_TYPE_ER.HUPAI_KAN_ZHANG]: 1,
        [HU_TYPE_ER.HUPAI_DAN_DIAO_JIANG]: 1,
        [HU_TYPE_ER.HUPAI_ZI_MO]: 1,
    }