import Game from "../game-share/game";
import { ShieldStatus } from "./shieldStatus";
import g from "../g";
import itemNames from "./itemNames";

export enum Gender {
    FEMALE,
    MALE
}

export interface Where {
    gid: string;
    mid: string;
    rType: number;
}

export interface UserInfo {
    uid: number;
    name: string;
    avatar: number;
    currentGame: any;
    gender: 0 | 1;
    pos?: number;
    location: string;
    bReady?: 0 | 1;
    score?: number;
    money?: string;
    SSSAccount?: string;
    bankAccount?: string;
    channel?: string;//渠道号
    modifyChannel?: number;//是否可以修改渠道
}

export class User {
    act?: string;//账号
    uid: number;
    avatarId: number;
    gender: Gender;
    nick: string;
    money: number;
    bankMoney?: number;
    newbieBonus?: { money: number };
    bindBonus?: { money: number };
    where?: Where;
    location: string;
    currentGame?: Game;
    vipLevel: number;
    hasNewTransfer: boolean;
    SSSAccount?: string;
    bankAccount?: string;

    shieldStatus: ShieldStatus;

    private static _instance: User;
    public static get instance(): User {
        if (!this._instance) {
            this._instance = new User();
        }
        return this._instance;
    }

    /**
     * 是否为男性
     * 
     * @readonly
     * @memberof User
     */
    get isMale() {
        return this.gender === Gender.MALE;
    }

    private constructor() { }

    initData(data: {
        uid: number;
        name: string;
        gender: number;
        pos?: number;
        bReady?: number;
        score?: number;
        money?: string;
        act?: string;
        avatar: number;
        location: string;
        SSSAccount?: string
        bankCardNumber?: string;
        vip?: number;
    }) {
        this.gender = data.gender;
        this.uid = data.uid;
        this.money = data.money && +data.money || 0;
        this.nick = data.name;
        this.act = data.act;
        if (!g.act && data.act) {
            localStorage.setItem(itemNames.account, data.act);
            g.act = data.act
        }
        this.avatarId = data.avatar;
        this.location = data.location;
        this.SSSAccount = data.SSSAccount;
        this.bankAccount = data.bankCardNumber;
        this.vipLevel = data.vip || 0;
        this.initOnlyAgentRate();
    }

    static getAvatar(gender?: Gender, avatarId?: number) {
        if (gender === undefined) {
            gender = this.instance.gender;
        }
        if (avatarId === undefined) {
            avatarId = this.instance.avatarId;
        }
        return new Promise((resolve: (sprite: cc.SpriteFrame) => void, reject) => {
            cc.loader.loadRes("common/avatar/head_" + (gender === Gender.MALE ? "m" : "w") + "_" + avatarId, cc.SpriteFrame, (err, spriteFrame) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(spriteFrame);
                }
            });
        });
    }

    release() {
        User.instance.where = undefined;
    }

    /**
     * 连续只展示代理充值的时候没有充值的次数
     * 
     * @type {number}
     * @memberof User
     */
    ignoreAgent: number;

    /**
     * 只展示代理充值的几率
     * 
     * @type {number}
     * @memberof User
     */
    onlyAgentRate: number;

    /**
     * 减少只显示代理充值的几率值
     * 
     * @type {number}
     * @memberof User
     */
    decreaseRate: number;
    /**
     * 连续只显示代理的次数
     * 
     * @type {number}
     * @memberof User
     */
    onlyAgent: number;
    /**
     * 代理充值次数
     * 
     * @type {number}
     * @memberof User
     */
    agentTimes: number;
    /**
     * 初始化只显示代理相关数据
     * 
     * @private
     * @memberof User
     */
    private initOnlyAgentRate() {
        this.ignoreAgent = 0;
        this.onlyAgentRate = 0;
        this.decreaseRate = 0;
        this.onlyAgent = 0;
        this.agentTimes = 0;
    }
}
