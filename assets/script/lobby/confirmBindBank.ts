import Confirm from "../common/confirm";

const { ccclass, property } = cc._decorator;

@ccclass
export default class ConfirmBindBank extends Confirm {

    @property({ type: cc.Label, visible: false, override: true })
    info: cc.Label = undefined;

    @property(cc.Label)
    private lblAct: cc.Label = undefined;

    @property(cc.Label)
    private lblBank: cc.Label = undefined;

    @property(cc.Label)
    private lblName: cc.Label = undefined;

    showConfirm(act: string, bank: string, name: string) {
        this.node.active = true;
        this.lblAct.string = act;
        this.lblBank.string = bank;
        this.lblName.string = name;
    }
}