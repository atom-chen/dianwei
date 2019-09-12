import PopActionBox from "../lobby/popActionBox"
import { showTip } from "../common/util";
import { ErrCodes } from "../common/code";
import { User } from "../common/user";
import * as util from "../common/util";

const { ccclass, property } = cc._decorator;

@ccclass
export default class BindSSS extends PopActionBox {
    @property(cc.EditBox)
    private ebAli: cc.EditBox = undefined;

    @property(cc.EditBox)
    private ebName: cc.EditBox = undefined;


    private _binding: boolean;

    protected onLoad() {
        super.onLoad();

        this.ebAli.string = "";
        this.ebName.string = "";
        this.ebAli.placeholder = `请输入支付宝账号`;
    }

    private onClickBindAli() {
        let ali = this.ebAli.string;
        let name = this.ebName.string.trim();

        if (!util.isEmail(ali) && !util.isValidateMobile(ali)) {
            showTip("账号格式不对");
            return;
        }

        if (!ali || !name) {
            showTip("请输入所有信息");
            return;
        }
        if (this._binding) {
            return;
        }

        let nameNick = name.replace(/[^\u4E00-\u9FA5]/g, "");
        if (nameNick !== name) {
            showTip("您输入的姓名包含特殊字符");
            return
        }

        if (User.instance.SSSAccount) {
            this._binding = true;
            window.pomelo.request("lobby.billHandler.modifyWithdrawAccount", { type: 1, account: ali, name, bankPwd: '888888', }, (data: { code: number }) => {
                this._binding = false;
                if (data.code !== 200) {
                    showTip(ErrCodes.getErrStr(data.code, "绑定失败"));
                    return;
                }
                showTip("绑定成功");
                User.instance.SSSAccount = ali;
                this.closeAction();
            });
            return
        }
        this._binding = true;
        window.pomelo.request("lobby.billHandler.bindSSS", { SSSRealName: name, SSSAccount: ali }, (data: { code: number }) => {
            this._binding = false;
            if (data.code !== 200) {
                showTip(ErrCodes.getErrStr(data.code, "绑定失败"));
                return;
            }
            showTip("绑定成功");
            User.instance.SSSAccount = ali;
            this.closeAction();
        });
    }
}
