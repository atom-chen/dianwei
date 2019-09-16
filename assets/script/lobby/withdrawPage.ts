import { User } from "../common/user";
import { mul, showTip, showLoading, hideLoading, showConfirm } from "../common/util";
import { ErrCodes } from "../common/code";
import Confirm from "../common/confirm";
import ConfirmWithdraw from "./confirmWithdraw";
import * as util from "../common/util";
import LobbyUser from "./lobbyUser";
import g from "../g";
const { ccclass, property } = cc._decorator;

export enum WithdrawType {
    SSS = 1,
    BankCard,
    Agent
}

@ccclass
export default class WithdrawPage extends cc.Component {

    @property(cc.Label)
    private lblBalance: cc.Label = undefined;

    @property(cc.Label)
    private lblGoldLimit: cc.Label = undefined;

    @property(cc.EditBox)
    private ebAmount: cc.EditBox = undefined;

    @property(cc.Label)
    private lblFee: cc.Label = undefined;

    @property(cc.Label)
    private lblActType: cc.Label = undefined;

    @property(cc.Prefab)
    private preFinishTip: cc.Prefab = undefined;

    @property(cc.Prefab)
    protected preWithdrawConfirm: cc.Prefab = undefined;



    protected _loading: boolean = false;
    protected amount: number = 0;

    strBind: string = "";
    strAct: string = "";

    @property({ type: cc.Enum(WithdrawType) })
    protected type: WithdrawType = WithdrawType.SSS;
    get _type() {
        return this.type;
    }
    set _type(type: WithdrawType) {
        this.type = type;
    }

    private _lUser: LobbyUser;
    get lUser() {
        if (!this._lUser) {
            let topNode = cc.find("Canvas/top");
            if (!topNode) {
                return;
            }
            this._lUser = topNode.getComponent(LobbyUser);
        }
        return this._lUser;
    }

    protected onLoad() {
        // init logic
        let ins = User.instance;

        this.lblBalance.string = ins.money.toString();
    }

    init() {
        if (this.type === WithdrawType.BankCard) {
            this.strBind = "绑定银行卡";
            this.strAct = ErrCodes.BIND_CARD;
            this.lblGoldLimit.string = `金额范围:${g.withdrawCardMin}~${g.withdrawCardMax}`;
            this.lblActType.string = "银行卡账号:";
        } else if (this.type === WithdrawType.SSS) {
            this.strBind = `绑定支付宝`;
            this.strAct = ErrCodes.BIND_SSS;
            this.lblGoldLimit.string = `金额范围:${g.withdrawSSSMin}~${g.withdrawSSSMax}`;;
            this.lblActType.string = "支付宝账号:";
        } else if (this.type === WithdrawType.Agent) {
            this.strBind = `绑定`;
            // this.strAct = ErrCodes.BIND_SSS;
            this.lblGoldLimit.node.active = false;
            this.lblActType.string = "账号:";
        }
    }

    private getTypeName() {
        switch (this.type) {
            case WithdrawType.Agent:
                return "代理兑换";
            case WithdrawType.SSS:
                return `支付宝兑换`;
            case WithdrawType.BankCard:
                return "银行卡兑换";
        }
    }

    protected onEnable() {
        this.amount = 0;

        this.updateAmount();
    }

    private getFee(amount: number) {
        return mul(amount, 0.02).toNumber();
    }

    private updateAmount() {
        this.lblBalance.string = User.instance.money.toString();
        if (this.amount > User.instance.money) {
            this.amount = User.instance.money;
            showTip("输入金额已达最大值");
        }
        this.ebAmount.string = (this.amount === 0) ? "" : this.amount.toString();
        this.lblFee.string = `（ 手续费 : ${this.getFee(this.amount)}元 ）`;
    }

    private onEndEditAmount() {
        let num = +this.ebAmount.string;
        if (isNaN(num)) {
            num = 0;
        }
        this.amount = num;
        this.updateAmount();
    }

    private onClickClear() {
        this.amount = 0;
        this.updateAmount();
    }

    private onClickRaise(btn: cc.Event.EventTouch) {
        let target = btn.target as cc.Node;
        this.amount += +target.name;
        this.updateAmount();
    }

    protected checkOk() {
        if (this.amount < 100) {
            showTip("兑换金额不得小于100");
            return false;
        }
        if (this.type === WithdrawType.BankCard || this.type === WithdrawType.SSS) {
            let min: string;
            let max: string;
            if (this.type === WithdrawType.BankCard) {
                min = g.withdrawCardMin;
                max = g.withdrawCardMax;
            } else if (this.type === WithdrawType.SSS) {
                min = g.withdrawSSSMin;
                max = g.withdrawSSSMax;
            }
            if (min && max) {
                if (this.amount < +min) {
                    util.showTip("兑换金额不得小于" + min);
                    return false;
                }
                if (this.amount > +max) {
                    util.showTip("兑换金额不得大于" + max);
                    return false;
                }
                if (this.amount % 10 !== 0) {
                    util.showTip("兑换金额应为10的倍数");
                    return false;
                }
            }
        }
        if (this._loading) {
            return false;
        }
        return true;
    }

    private onClickOk() {
        if (!this.checkOk()) {
            return;
        }
        let di = util.instantiate(this.preWithdrawConfirm);
        let canvas = cc.find("Canvas");
        canvas.addChild(di);
        let c = di.getComponent(ConfirmWithdraw);
        c.showTip(this.amount, this.getTypeName());
        c.closeFunc = undefined;
        c.okFunc = () => {
            c.closeFunc = () => {
                this.withdraw(this.amount, '888888', this.type);
            }
        };
    }

    private withdraw(amount: number, pwd: string, type: WithdrawType) {
        this._loading = true;
        showLoading("申请提现");
        window.pomelo.request("lobby.billHandler.withdraw", {
            money: amount.toString(),
            deviceType: cc.sys.os === cc.sys.OS_IOS ? "ios" : "android",
            pwd: pwd,
            withdrawType: type
        }, (data: { code: number, userMoney: string, blocAliWithdrawTimes?: number, withdrawTimes?: number }) => {
            this._loading = false;
            hideLoading();
            if (data.code !== 200) {
                if (data.code === 3007) {
                    // let confirm = showConfirm("亲，您的金币大多是赠送的哦~，多去玩玩金币场再来吧。");
                } else {
                    if (data.code === 6013 || data.code === 6014) {
                        let s = showConfirm(`亲，请使用银行卡提现，更安全更放心！`);
                    } else {
                        showTip(ErrCodes.getErrStr(data.code, "申请提现失败"));
                    }
                }
                return;
            }
            if (data.blocAliWithdrawTimes != null && data.blocAliWithdrawTimes != undefined) {
                util.showTip(`您今日剩余提现次数为:${data.blocAliWithdrawTimes}`);
            }
            if (data.withdrawTimes != null && data.withdrawTimes != undefined) {
                util.showTip(`您今日剩余提现次数为:${data.withdrawTimes}`);
            }
            // 刷新玩家金币
            if (data.userMoney && !isNaN(+data.userMoney)) {
                User.instance.money = +data.userMoney;
                let user = this.lUser;
                if (user) {
                    user.refreshUserInfos();
                }
            }
            this.amount = 0;
            this.updateAmount();

            this.showFinishTip(amount);
        });
    }

    private showFinishTip(amount: number) {
        let canvas = cc.find("Canvas");
        let node = util.instantiate(this.preFinishTip);
        canvas.addChild(node, 999);
        let confirm: Confirm = node.getComponent(Confirm);
        confirm.show(amount.toString());
        confirm.autoClose = true;
    }
}
