export function MAKE_A_MJ(hs: number, pd: number) {
    return ((hs) * 10 + (pd));
}

export enum MJ_TYPE_PAI {
    MJ_TYPE_PAI_NONE = 0,
    MJ_TYPE_PAI_WAN = 1,
    MJ_TYPE_PAI_TIAO = 2,
    MJ_TYPE_PAI_TONG = 3,
    MJ_TYPE_PAI_FENG = 4,
    MJ_TYPE_PAI_JIAN = 5
};

export enum YI_SE {
    YI_SE_QING = 1,
    YI_SE_ZI,
    YI_SE_HUN
}

export enum MJ_POINT {
    POINT1 = 1,
    POINT2 = 2,
    POINT3 = 3,
    POINT4 = 4,
    POINT5 = 5,
    POINT6 = 6,
    POINT7 = 7,
    POINT8 = 8,
    POINT9 = 9,

    EAST = 1,
    SOUTH = 3,
    WEST = 5,
    NORTH = 7,

    ZHONG = 1,
    FA = 3,
    BAI = 5
}

export enum MJ_TYPE {
    MJ_TYPE_W1 = MAKE_A_MJ(MJ_TYPE_PAI.MJ_TYPE_PAI_WAN, MJ_POINT.POINT1),
    MJ_TYPE_W2 = MAKE_A_MJ(MJ_TYPE_PAI.MJ_TYPE_PAI_WAN, MJ_POINT.POINT2),
    MJ_TYPE_W3 = MAKE_A_MJ(MJ_TYPE_PAI.MJ_TYPE_PAI_WAN, MJ_POINT.POINT3),
    MJ_TYPE_W4 = MAKE_A_MJ(MJ_TYPE_PAI.MJ_TYPE_PAI_WAN, MJ_POINT.POINT4),
    MJ_TYPE_W5 = MAKE_A_MJ(MJ_TYPE_PAI.MJ_TYPE_PAI_WAN, MJ_POINT.POINT5),
    MJ_TYPE_W6 = MAKE_A_MJ(MJ_TYPE_PAI.MJ_TYPE_PAI_WAN, MJ_POINT.POINT6),
    MJ_TYPE_W7 = MAKE_A_MJ(MJ_TYPE_PAI.MJ_TYPE_PAI_WAN, MJ_POINT.POINT7),
    MJ_TYPE_W8 = MAKE_A_MJ(MJ_TYPE_PAI.MJ_TYPE_PAI_WAN, MJ_POINT.POINT8),
    MJ_TYPE_W9 = MAKE_A_MJ(MJ_TYPE_PAI.MJ_TYPE_PAI_WAN, MJ_POINT.POINT9),

    MJ_TYPE_FE = MAKE_A_MJ(MJ_TYPE_PAI.MJ_TYPE_PAI_FENG, MJ_POINT.EAST),
    MJ_TYPE_FS = MAKE_A_MJ(MJ_TYPE_PAI.MJ_TYPE_PAI_FENG, MJ_POINT.SOUTH),
    MJ_TYPE_FW = MAKE_A_MJ(MJ_TYPE_PAI.MJ_TYPE_PAI_FENG, MJ_POINT.WEST),
    MJ_TYPE_FN = MAKE_A_MJ(MJ_TYPE_PAI.MJ_TYPE_PAI_FENG, MJ_POINT.NORTH),

    MJ_TYPE_JZ = MAKE_A_MJ(MJ_TYPE_PAI.MJ_TYPE_PAI_JIAN, MJ_POINT.ZHONG),
    MJ_TYPE_JF = MAKE_A_MJ(MJ_TYPE_PAI.MJ_TYPE_PAI_JIAN, MJ_POINT.FA),
    MJ_TYPE_JB = MAKE_A_MJ(MJ_TYPE_PAI.MJ_TYPE_PAI_JIAN, MJ_POINT.BAI)
}

export interface HuPaiInfo {
    pingHuStruct?: PingHuStruct,
    byJiang?: number,
    byShunData?: number[],
    byChiData?: number[],
    byMingKeziData?: number[],
    byAnKeziData?: number[],
    byMingGang?: number[],
    byAddGang?: number[],
    byAnGang?: number[],
    huPaiType?: number[],
    fan?: number
}

export enum PingHuType {
    TYPE_DARK = 1,     //暗杠
    TYPE_SHINE = 2,    //明杠
    TYPE_ADD = 3,      //巴杠
    TYPE_PENG = 4,
    TYPE_CHI = 5,
    TYPE_JIANG = 6,
    TYPE_SHUN = 7,
    TYPE_ANKE = 8,
    TYPE_MINGKE = 9,
}

export interface ChiPengGangInfo {
    pai: number;                        // 牌数据
    pingHuType: PingHuType;                 // 杠牌类型
    chiPai?: number;                   //吃的牌
}

export interface UserAction {
    pos: number;
    action: Action;
    pai: number;
    time: Date;
};

export enum Quan_Feng {
    EAST_FENG,
    SOUTH_FENG,
    WEST_FENG,
    NOETH_FENG
}

export enum Men_Feng {
    SOUTH_FENG,
    NORTH_FENG
}

export const Quan_Feng_Pai = {
    [Quan_Feng.EAST_FENG]: MJ_TYPE.MJ_TYPE_FE,
    [Quan_Feng.SOUTH_FENG]: MJ_TYPE.MJ_TYPE_FS,
    [Quan_Feng.WEST_FENG]: MJ_TYPE.MJ_TYPE_FW,
    [Quan_Feng.NOETH_FENG]: MJ_TYPE.MJ_TYPE_FN
}

export const Men_Feng_Pai = {
    [Men_Feng.SOUTH_FENG]: MJ_TYPE.MJ_TYPE_FS,
    [Men_Feng.NORTH_FENG]: MJ_TYPE.MJ_TYPE_FN
}

export enum Action {
    USER_ACTION_OUT_CARD,
    USER_ACTION_UP_CARD,
    USER_ACTION_CHI,
    USER_ACTION_PENG,
    USER_ACTION_GANG,
    USER_ACTION_HU,
    USER_ACTION_PASS,
    USER_ACTION_TING
};

export interface ERMJBaseConfig {
    waitTime: number,           // 等待设置时长
    sendCardTime: number,       // 发牌时间
    userOptTime: number,        // 玩家操作时间
    resultTime: number,
}

export const mjAllTypeCard: number[] = [
    MJ_TYPE.MJ_TYPE_FE,
    MJ_TYPE.MJ_TYPE_FS,
    MJ_TYPE.MJ_TYPE_FW,
    MJ_TYPE.MJ_TYPE_FN,

    MJ_TYPE.MJ_TYPE_JZ,
    MJ_TYPE.MJ_TYPE_JF,
    MJ_TYPE.MJ_TYPE_JB,

    MJ_TYPE.MJ_TYPE_W1,
    MJ_TYPE.MJ_TYPE_W2,
    MJ_TYPE.MJ_TYPE_W3,
    MJ_TYPE.MJ_TYPE_W4,
    MJ_TYPE.MJ_TYPE_W5,
    MJ_TYPE.MJ_TYPE_W6,
    MJ_TYPE.MJ_TYPE_W7,
    MJ_TYPE.MJ_TYPE_W8,
    MJ_TYPE.MJ_TYPE_W9
];

export enum HU_TYPE_EX {
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
    HUPAI_SI_GUI,                           //四归
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

export const TypeFan = {
    //88番
    [HU_TYPE_EX.HUPAI_DA_SI_XI]: 88,
    [HU_TYPE_EX.HUPAI_DA_SAN_YUAN]: 88,
    [HU_TYPE_EX.HUPAI_JIU_LIAN_BAO_DENG]: 88,
    [HU_TYPE_EX.HUPAI_SI_GANG]: 88,
    [HU_TYPE_EX.HUPAI_LIAN_QI_DUI]: 88,
    [HU_TYPE_EX.HUPAI_TIAN_HE]: 88,
    [HU_TYPE_EX.HUPAI_DI_HE]: 88,
    [HU_TYPE_EX.HUPAI_REN_HE]: 88,
    [HU_TYPE_EX.HUPAI_BAI_WAN_DAN]: 88,
    //64番
    [HU_TYPE_EX.HUPAI_XIAO_SI_XI]: 64,
    [HU_TYPE_EX.HUPAI_XIAO_SAN_YUAN]: 64,
    [HU_TYPE_EX.HUPAI_ZI_YI_SE]: 64,
    [HU_TYPE_EX.HUPAI_SI_AN_KE]: 64,
    [HU_TYPE_EX.HUPAI_YI_SE_SHUANG_LONG_HUI]: 64,
    //48番
    [HU_TYPE_EX.HUPAI_YI_SE_SI_TONG_SHUN]: 48,
    [HU_TYPE_EX.HUPAI_YI_SE_SI_JIE_GAO]: 48,
    //32番
    [HU_TYPE_EX.HUPAI_YI_SE_SI_BU_GAO]: 32,
    [HU_TYPE_EX.HUPAI_SAN_GANG]: 32,
    [HU_TYPE_EX.HUPAI_HUN_YAO_JIU]: 32,
    //24番
    [HU_TYPE_EX.HUPAI_QI_DUI]: 24,
    [HU_TYPE_EX.HUPAI_QING_YI_SE]: 24,
    [HU_TYPE_EX.HUPAI_YI_SE_SAN_TONG_SHUN]: 24,
    [HU_TYPE_EX.HUPAI_YI_SE_SAN_JIE_GAO]: 24,
    //16番
    [HU_TYPE_EX.HUPAI_QING_LONG]: 16,
    [HU_TYPE_EX.HUPAI_YI_SE_SAN_BU_GAO]: 16,
    [HU_TYPE_EX.HUPAI_SAN_AN_KE]: 16,
    [HU_TYPE_EX.HUPAI_TIAN_TING]: 16,
    //12番
    [HU_TYPE_EX.HUPAI_DA_YU_WU]: 12,
    [HU_TYPE_EX.HUPAI_XIAO_YU_WU]: 12,
    [HU_TYPE_EX.HUPAI_SAN_FENG_KE]: 12,
    //8番
    [HU_TYPE_EX.HUPAI_MIAO_SHOU_HUI_CHUN]: 8,
    [HU_TYPE_EX.HUPAI_HAI_DI_LAO_YUE]: 8,
    [HU_TYPE_EX.HUPAI_GANG_SHANG_KAI_HUA]: 8,
    [HU_TYPE_EX.HUPAI_QIANG_GANG_HE]: 8,
    //6番
    [HU_TYPE_EX.HUPAI_PENG_PENG_HE]: 6,
    [HU_TYPE_EX.HUPAI_HUN_YI_SE]: 6,
    [HU_TYPE_EX.HUPAI_QUAN_QIU_REN]: 6,
    [HU_TYPE_EX.HUPAI_SHUANG_AN_GANG]: 6,
    [HU_TYPE_EX.HUPAI_SHUANG_JIAN_KE]: 6,
    //4番
    [HU_TYPE_EX.HUPAI_QUAN_DAI_YAO]: 4,
    [HU_TYPE_EX.HUPAI_BU_QIU_REN]: 4,
    [HU_TYPE_EX.HUPAI_SHUANG_MING_GANG]: 4,
    [HU_TYPE_EX.HUPAI_HE_JUE_ZHANG]: 4,
    [HU_TYPE_EX.HUPAI_LI_ZHI]: 4,
    //2番
    [HU_TYPE_EX.HUPAI_JIAN_KE]: 2,
    [HU_TYPE_EX.HUPAI_QUAN_FENG_KE]: 2,
    [HU_TYPE_EX.HUPAI_MEN_FENG_KE]: 2,
    [HU_TYPE_EX.HUPAI_MEN_QIAN_QIANG]: 2,
    [HU_TYPE_EX.HUPAI_PING_HE]: 2,
    [HU_TYPE_EX.HUPAI_SI_GUI]: 2,
    [HU_TYPE_EX.HUPAI_SHUANG_AN_KE]: 2,
    [HU_TYPE_EX.HUPAI_AN_GANG]: 2,
    [HU_TYPE_EX.HUPAI_DUAN_YAO]: 2,
    //1番
    [HU_TYPE_EX.HUPAI_ER_WU_BA_JIANG]: 1,
    [HU_TYPE_EX.HUPAI_YAO_JIU_TOU]: 1,
    [HU_TYPE_EX.HUPAI_BAO_TING]: 1,
    [HU_TYPE_EX.HUPAI_YI_BAN_GAO]: 1,
    [HU_TYPE_EX.HUPAI_LIAN_LIU]: 1,
    [HU_TYPE_EX.HUPAI_LAO_SHAO_FU]: 1,
    [HU_TYPE_EX.HUPAI_YAO_JIU_KE]: 1,
    [HU_TYPE_EX.HUPAI_MING_GANG]: 1,
    [HU_TYPE_EX.HUPAI_BIAN_ZHANG]: 1,
    [HU_TYPE_EX.HUPAI_KAN_ZHANG]: 1,
    [HU_TYPE_EX.HUPAI_DAN_DIAO_JIANG]: 1,
    [HU_TYPE_EX.HUPAI_ZI_MO]: 1,
}

export const HuTypeFilter = {
    [HU_TYPE_EX.HUPAI_DA_SI_XI]:
        [
            HU_TYPE_EX.HUPAI_MEN_FENG_KE, HU_TYPE_EX.HUPAI_QUAN_FENG_KE, HU_TYPE_EX.HUPAI_XIAO_SI_XI,
            HU_TYPE_EX.HUPAI_SAN_FENG_KE, HU_TYPE_EX.HUPAI_PENG_PENG_HE, HU_TYPE_EX.HUPAI_YAO_JIU_KE
        ],
    [HU_TYPE_EX.HUPAI_DA_SAN_YUAN]:
        [
            HU_TYPE_EX.HUPAI_XIAO_SAN_YUAN, HU_TYPE_EX.HUPAI_JIAN_KE, HU_TYPE_EX.HUPAI_SHUANG_JIAN_KE,
            HU_TYPE_EX.HUPAI_YAO_JIU_KE
        ],
    [HU_TYPE_EX.HUPAI_JIU_LIAN_BAO_DENG]:
        [
            HU_TYPE_EX.HUPAI_QING_YI_SE, HU_TYPE_EX.HUPAI_BU_QIU_REN, HU_TYPE_EX.HUPAI_MEN_QIAN_QIANG,
            HU_TYPE_EX.HUPAI_YAO_JIU_KE
        ],
    [HU_TYPE_EX.HUPAI_SI_GANG]:
        [
            HU_TYPE_EX.HUPAI_SHUANG_AN_GANG, HU_TYPE_EX.HUPAI_SHUANG_MING_GANG, HU_TYPE_EX.HUPAI_MING_GANG,
            HU_TYPE_EX.HUPAI_AN_GANG, HU_TYPE_EX.HUPAI_DAN_DIAO_JIANG
        ],
    [HU_TYPE_EX.HUPAI_LIAN_QI_DUI]:
        [
            HU_TYPE_EX.HUPAI_QING_YI_SE, HU_TYPE_EX.HUPAI_BU_QIU_REN, HU_TYPE_EX.HUPAI_DAN_DIAO_JIANG,
            HU_TYPE_EX.HUPAI_MEN_QIAN_QIANG, HU_TYPE_EX.HUPAI_QI_DUI, HU_TYPE_EX.HUPAI_LIAN_LIU,
            HU_TYPE_EX.HUPAI_YI_BAN_GAO
        ],
    [HU_TYPE_EX.HUPAI_TIAN_HE]:
        [
            HU_TYPE_EX.HUPAI_DAN_DIAO_JIANG, HU_TYPE_EX.HUPAI_BIAN_ZHANG, HU_TYPE_EX.HUPAI_KAN_ZHANG
        ],
    [HU_TYPE_EX.HUPAI_BAI_WAN_DAN]:
        [
            HU_TYPE_EX.HUPAI_QING_YI_SE
        ],
    [HU_TYPE_EX.HUPAI_XIAO_SI_XI]:
        [
            HU_TYPE_EX.HUPAI_SAN_FENG_KE, HU_TYPE_EX.HUPAI_YAO_JIU_KE
        ],
    [HU_TYPE_EX.HUPAI_XIAO_SAN_YUAN]:
        [
            HU_TYPE_EX.HUPAI_JIAN_KE, HU_TYPE_EX.HUPAI_SHUANG_JIAN_KE, HU_TYPE_EX.HUPAI_YAO_JIU_KE
        ],
    [HU_TYPE_EX.HUPAI_ZI_YI_SE]:
        [
            HU_TYPE_EX.HUPAI_PENG_PENG_HE, HU_TYPE_EX.HUPAI_HUN_YAO_JIU, HU_TYPE_EX.HUPAI_QUAN_DAI_YAO,
            HU_TYPE_EX.HUPAI_YAO_JIU_KE
        ],
    [HU_TYPE_EX.HUPAI_SI_AN_KE]:
        [
            HU_TYPE_EX.HUPAI_MEN_QIAN_QIANG, HU_TYPE_EX.HUPAI_PENG_PENG_HE, HU_TYPE_EX.HUPAI_SAN_AN_KE,
            HU_TYPE_EX.HUPAI_SHUANG_AN_KE, HU_TYPE_EX.HUPAI_BU_QIU_REN
        ],
    [HU_TYPE_EX.HUPAI_YI_SE_SHUANG_LONG_HUI]:
        [
            HU_TYPE_EX.HUPAI_PING_HE, HU_TYPE_EX.HUPAI_QI_DUI, HU_TYPE_EX.HUPAI_QING_YI_SE,
            HU_TYPE_EX.HUPAI_YI_BAN_GAO, HU_TYPE_EX.HUPAI_LAO_SHAO_FU
        ],
    [HU_TYPE_EX.HUPAI_YI_SE_SI_TONG_SHUN]:
        [
            HU_TYPE_EX.HUPAI_YI_SE_SAN_JIE_GAO, HU_TYPE_EX.HUPAI_SI_GUI, HU_TYPE_EX.HUPAI_YI_BAN_GAO,
            HU_TYPE_EX.HUPAI_YI_SE_SAN_TONG_SHUN
        ],
    [HU_TYPE_EX.HUPAI_YI_SE_SI_JIE_GAO]:
        [
            HU_TYPE_EX.HUPAI_YI_SE_SAN_TONG_SHUN, HU_TYPE_EX.HUPAI_YI_SE_SAN_JIE_GAO, HU_TYPE_EX.HUPAI_PENG_PENG_HE
        ],
    [HU_TYPE_EX.HUPAI_YI_SE_SI_BU_GAO]:
        [
            HU_TYPE_EX.HUPAI_YI_SE_SAN_BU_GAO, HU_TYPE_EX.HUPAI_LAO_SHAO_FU, HU_TYPE_EX.HUPAI_LIAN_LIU
        ],
    [HU_TYPE_EX.HUPAI_SAN_GANG]:
        [
            HU_TYPE_EX.HUPAI_SHUANG_MING_GANG, HU_TYPE_EX.HUPAI_SHUANG_AN_GANG, HU_TYPE_EX.HUPAI_MING_GANG,
            HU_TYPE_EX.HUPAI_AN_GANG
        ],
    [HU_TYPE_EX.HUPAI_HUN_YAO_JIU]:
        [
            HU_TYPE_EX.HUPAI_PENG_PENG_HE, HU_TYPE_EX.HUPAI_YAO_JIU_KE, HU_TYPE_EX.HUPAI_QUAN_DAI_YAO
        ],
    [HU_TYPE_EX.HUPAI_QI_DUI]:
        [
            HU_TYPE_EX.HUPAI_MEN_QIAN_QIANG, HU_TYPE_EX.HUPAI_BU_QIU_REN, HU_TYPE_EX.HUPAI_DAN_DIAO_JIANG
        ],
    [HU_TYPE_EX.HUPAI_YI_SE_SAN_TONG_SHUN]:
        [
            HU_TYPE_EX.HUPAI_YI_SE_SAN_JIE_GAO, HU_TYPE_EX.HUPAI_YI_BAN_GAO
        ],
    [HU_TYPE_EX.HUPAI_YI_SE_SAN_JIE_GAO]:
        [
            HU_TYPE_EX.HUPAI_YI_SE_SAN_TONG_SHUN
        ],
    [HU_TYPE_EX.HUPAI_QING_LONG]:
        [
            HU_TYPE_EX.HUPAI_LIAN_LIU, HU_TYPE_EX.HUPAI_LAO_SHAO_FU
        ],
    [HU_TYPE_EX.HUPAI_SAN_AN_KE]:
        [
            HU_TYPE_EX.HUPAI_SHUANG_AN_KE
        ],
    [HU_TYPE_EX.HUPAI_TIAN_TING]:
        [
            HU_TYPE_EX.HUPAI_LI_ZHI, HU_TYPE_EX.HUPAI_BAO_TING
        ],
    [HU_TYPE_EX.HUPAI_SAN_FENG_KE]:
        [
            HU_TYPE_EX.HUPAI_YAO_JIU_KE
        ],
    [HU_TYPE_EX.HUPAI_MIAO_SHOU_HUI_CHUN]:
        [
            HU_TYPE_EX.HUPAI_ZI_MO
        ],
    [HU_TYPE_EX.HUPAI_GANG_SHANG_KAI_HUA]:
        [
            HU_TYPE_EX.HUPAI_ZI_MO
        ],
    [HU_TYPE_EX.HUPAI_QIANG_GANG_HE]:
        [
            HU_TYPE_EX.HUPAI_HE_JUE_ZHANG
        ],
    [HU_TYPE_EX.HUPAI_QUAN_QIU_REN]:
        [
            HU_TYPE_EX.HUPAI_DAN_DIAO_JIANG
        ],
    [HU_TYPE_EX.HUPAI_SHUANG_AN_GANG]:
        [
            HU_TYPE_EX.HUPAI_SHUANG_AN_KE, HU_TYPE_EX.HUPAI_AN_GANG
        ],
    [HU_TYPE_EX.HUPAI_SHUANG_JIAN_KE]:
        [
            HU_TYPE_EX.HUPAI_JIAN_KE
        ],
    [HU_TYPE_EX.HUPAI_BU_QIU_REN]:
        [
            HU_TYPE_EX.HUPAI_MEN_QIAN_QIANG, HU_TYPE_EX.HUPAI_ZI_MO
        ],
    [HU_TYPE_EX.HUPAI_SHUANG_MING_GANG]:
        [
            HU_TYPE_EX.HUPAI_MING_GANG
        ],
    [HU_TYPE_EX.HUPAI_LI_ZHI]:
        [
            HU_TYPE_EX.HUPAI_BAO_TING, HU_TYPE_EX.HUPAI_MEN_QIAN_QIANG
        ],
    [HU_TYPE_EX.HUPAI_JIAN_KE]:
        [
            HU_TYPE_EX.HUPAI_YAO_JIU_KE
        ],
    [HU_TYPE_EX.HUPAI_QUAN_FENG_KE]:
        [
            HU_TYPE_EX.HUPAI_YAO_JIU_KE
        ],
    [HU_TYPE_EX.HUPAI_MEN_FENG_KE]:
        [
            HU_TYPE_EX.HUPAI_YAO_JIU_KE
        ]
}


export class PingHuStruct {
    public pingHuData: { byType: number, pai: number, chiPai?: number }[];
    constructor() {
        this.Init();
    };
    load(temp: PingHuStruct) {
        for (let data of temp.pingHuData) {
            this.pingHuData.push({ ...data });
        }
    }
    AddData = (type: number, pai: number, chiPai?: number) => {
        this.pingHuData.push({
            byType: type,
            pai: pai,
            chiPai: chiPai
        });
    }
    DeleteData = (type: number, pai: number) => {
        for (let i = 0; i < this.pingHuData.length; i++) {
            if (this.pingHuData[i].byType === type && pai == this.pingHuData[i].pai) {
                this.pingHuData.splice(i, 1);
                break;
            }
        }
    }

    Init = () => {
        this.pingHuData = [];
    }
}

export class PaiCounter {
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