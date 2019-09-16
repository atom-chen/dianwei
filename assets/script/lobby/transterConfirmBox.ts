import PopActionBox from "./popActionBox";

const { ccclass, property } = cc._decorator;

@ccclass
export default class TransterConfirmBox extends PopActionBox {
    @property(cc.Label)
    labTransferId: cc.Label = undefined;

    @property(cc.Label)
    labTransferMoney: cc.Label = undefined;

    @property(cc.Button)
    btnOk: cc.Button = undefined;

    @property(cc.Button)
    btnCancel: cc.Button = undefined;

    private closeCB: Function;

    init(receiverId: number, amount: number, cb: Function) {
        this.labTransferId.string = receiverId.toString();
        this.labTransferMoney.string = amount.toString();
        this.closeCB = cb;
    }

    onClickOk() {
        this.closeAction(() => {
            this.closeCB(true);
        });
    }

    onClickCancel() {
        this.closeAction();
    }

}
