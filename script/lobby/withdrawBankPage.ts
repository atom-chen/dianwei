import WithdrawPage from "./withdrawPage";
import { User } from "../common/user";
import { showTip } from "../common/util";
import ConfirmWithdraw from "./confirmWithdraw";
import * as util from "../common/util";
import { ErrCodes } from "../common/code";
import { WithdrawType } from "./withdrawPage"
const { ccclass, property } = cc._decorator;

@ccclass
export default class WithdrawBankPage extends WithdrawPage {

    @property(cc.Label)
    private lblAct: cc.Label = undefined;

    @property(cc.RichText)
    private lblBind: cc.RichText = undefined;

    @property(cc.Prefab)
    private preSSSBind: cc.Prefab = undefined;

    @property(cc.Prefab)
    private preBankBind: cc.Prefab = undefined;

    private getAct() {
        let ins = User.instance;
        if (this._type === WithdrawType.BankCard) {
            return ins.bankAccount;
        } else {
            return ins.SSSAccount;
        }
    }

    protected onEnable() {
        if (super.onEnable) {
            super.onEnable();
        }
        this.refresh();
    }

    private onClickBind() {
        let canvas = cc.find("Canvas");
        let node;
        if (this._type === WithdrawType.BankCard) {
            node = util.instantiate(this.preBankBind);
        } else if (this._type === WithdrawType.SSS) {
            node = util.instantiate(this.preSSSBind);
        }
        canvas.addChild(node);
        node.setPosition(0, 0);

        node.once("close", () => {
            this.refresh();
        });
    }

    private refresh() {
        if (!this || !this.isValid) {
            return;
        }
        let act = this.getAct();
        this.lblAct.string = act || this.strAct;

        window.pomelo.request("lobby.billHandler.checkShowBankOrAliInfo", {}, (data: { sss: number, uuu: number }) => {
            this.lblBind.node.active = this._type === WithdrawType.BankCard ? !!data.uuu : !!data.sss;
        });

        this.lblBind.string = "<u>" + this.strBind + "</u>";
        this.node.color = cc.hexToColor(act ? "#bbbbbb" : "#fb003c");
    }

    protected checkOk() {
        let ok = super.checkOk();
        if (!ok) {
            return false;
        }
        let act = this.getAct();
        if (!act) {
            if (this._type === WithdrawType.BankCard) {
                showTip(ErrCodes.BIND_CARD);
            } else {
                showTip(ErrCodes.BIND_SSS);
            }
            return false;
        }
        return true;
    }
}
