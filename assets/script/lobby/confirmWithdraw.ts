import Confirm from "../common/confirm";

const { ccclass, property } = cc._decorator;

@ccclass
export default class ConfirmWithdraw extends Confirm {

    @property({ type: cc.Label, override: true, visible: false })
    info: cc.Label = undefined;

    @property(cc.Label)
    private amount: cc.Label = undefined;

    @property(cc.Label)
    private method: cc.Label = undefined;

    showTip(amount: number, method: string) {
        this.node.active = true;
        this.amount.string = amount.toString();
        this.method.string = method;
    }
}
