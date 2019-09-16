import PopActionBox from "./popActionBox"
import { WithdrawOrder } from "./withdrawRecord";
import { formatTimeStr } from "../common/util";

const { ccclass, property } = cc._decorator;

const infos = [
    `您的提现状态已经变更。
当前状态：转账中。
提现1~3分钟内到账。如遇支付宝系统繁忙会有延迟。请您耐心等待。`,

    `<color=#ffffff>您的提现请求我们已经提交支付宝。
但支付宝提示：业务繁忙，转账延迟。
一般情况下会延迟15~60分钟到账。偶尔会延迟1~8个小时到账。
请放心，我们已经与支付宝取得联系，让其尽快为您转账，请您耐心等待。</c>

<color=#ff0000>状态为“延迟到账”并且未超过8小时的，请勿联系客服，会被系统自动忽略。</c>`,

    `您的提现状态已经变更。
当前状态：转账失败。
请您确认绑定正确的支付宝信息，并联系客服修改。感谢您的支持。`,

    `您的提现已到账！
打开支付宝，查看您的交易记录即可。感谢您的支持。`,
];

@ccclass
export default class WithdrawDetail extends PopActionBox {

    static check(status: number) {
        return (status & 0x2000) === 0;
    }

    @property(cc.Label)
    time: cc.Label = null;

    @property(cc.Label)
    amount: cc.Label = null;

    @property(cc.Label)
    accountTitle: cc.Label = null;

    @property(cc.Label)
    account: cc.Label = null;

    @property(cc.Label)
    realName: cc.Label = null;

    @property(cc.Label)
    status: cc.Label = null;

    @property(cc.RichText)
    info: cc.RichText = null;


    setOrder(order: WithdrawOrder) {
        let timeStr = formatTimeStr('d', order.createTime);
        this.time.string = timeStr;
        this.amount.string = order.money;
        this.account.string = order.SSSAccount;
        this.realName.string = order.SSSRealName;

        this.status.string = "转账中";
        this.info.string = infos[0];
        if (order.state === 2) {
            this.status.string = "延迟到账";
            this.info.string = infos[1];
        } else if (order.state === 6) {
            this.status.string = "失败";
            this.info.string = infos[2];

            if (!WithdrawDetail.check(order.status)) {
                this.status.string = "成功";
                this.info.string = infos[3];
            }
        }

        if (order.type === 2) {
            this.accountTitle.string = '银行卡号：';
            this.account.string = order.bankCardNumber;
            this.realName.string = order.bankCardRealName;
            let str = '支付宝'
            this.info.string = this.info.string.replace(str, '银行');
        }
    }

}
