export interface MatchInfo {
    id?: string;
    idx: number;
    color: number;
    bets: string;
    minMoney: string;
    maxMoney: string;
    jokerAs?: number;               // 牛牛
    hasMagic?: number;              // 金花
    change3Pai?: number;             // 麻将
    hasJoker?: number;               // 梭哈
    brnnMaxBoost?: number;           // 百人牛牛
    allInMaxMoney?: string;
    fanMaxLimit?: number;
    byRatio?: number;
    maxBet?: number;
    takeMoney?: string;
    hongbaoCnt?: number;                // 红包固定个数
    allowGrabMinMoney?: string;         // 抢红包最小限额
    allowGrabMaxMoney?: string;         // 抢红包最大限额

}
