enum ChannelStatus {
    /**
     * 渠道屏蔽
     */
    SHIELD = 0x000000001,
    /**
     * 游戏使用别名
     */
    USE_ALIAS = 0x000000002,
    /**
     * 下载跳转渠道页
     */
    STATUS_JMP = 0x000000004,
    /**
     * 师徒
     */
    BAN_MASTER = 0x000000008,
    /**
     * 举报代理
     */
    REPORT_AGENT = 0x0000010,
    /**
     * 在线支付开关
     */
    ONLINE_RECHARGE = 0x000000040,
    /**
     * 充值策略
     */
    RECHARGE_ENFORCE = 0x000000020,
}

enum UserFlagStatus {
    FLAG_SHOW_BILLBOARD = 0x000000001,         //公告板
    FLAG_SHIELD = 0x000000002,                 //是否屏蔽
    FLAG_HAS_NEW_TRANSFER = 0x000000004,       //是否有新的转账
}
/**
 * 渠道和用户的屏蔽状态
 * 
 * @export
 * @class ShieldStatus
 */
export class ShieldStatus {
    constructor(private channelState: number, private userState: number) { }

    private isChannelOpen(state: ChannelStatus) {
        return !!this.channelState && ((this.channelState & state) > 0);
    }
    private isUserOpen(state: UserFlagStatus) {
        return !!this.userState && ((this.userState & state) > 0);
    }

    /**
     * 代理总开关
     */
    private _switchReport: number;
    set switchReport(value: number) {
        this._switchReport = value;
    }
    get switchReport() {
        return this._switchReport;
    }

    /**
     * 只有渠道屏蔽收徒
     */
    get channelApprentice() {
        return this.isChannelOpen(ChannelStatus.BAN_MASTER);
    }

    /**
     * 开启屏蔽
     * 
     * @readonly
     * @memberof Channel
     */
    get shield() {
        return this.isChannelOpen(ChannelStatus.SHIELD) || this.isUserOpen(UserFlagStatus.FLAG_SHIELD);
    }

    //---------------------------------------------------用户相关
    get showBillboard() {
        return this.isUserOpen(UserFlagStatus.FLAG_SHOW_BILLBOARD);
    }

    //---------------------------------------------------渠道相关
    /**
     * 游戏使用别名
     * 
     * @readonly
     * @memberof Channel
     */
    get useAlias() {
        return this.isChannelOpen(ChannelStatus.USE_ALIAS);
    }
    /**
     * 下载跳转非官方落地页
     * 
     * @readonly
     * @memberof Channel
     */
    get downloadJmp() {
        return this.isChannelOpen(ChannelStatus.STATUS_JMP);
    }
    /**
     * 允许第三方支付
     * 
     * @readonly
     * @memberof Channel
     */
    get allow3rdRecharge() {
        return this.isChannelOpen(ChannelStatus.ONLINE_RECHARGE);
    }
    /**
     * 开启代理充值策略
     * 
     * @readonly
     * @memberof Channel
     */
    get usePayEnforce() {
        return this.isChannelOpen(ChannelStatus.RECHARGE_ENFORCE);
    }

    get reportAgent() {
        return (!!this.switchReport && this.isChannelOpen(ChannelStatus.REPORT_AGENT));
    }
}