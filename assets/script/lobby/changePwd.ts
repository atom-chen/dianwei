import { Gender, UserInfo, Where, User } from "../common/user";
import * as util from "../common/util";
import { ErrCodes } from "../common/code";
import PopActionBox from "../lobby/popActionBox"
import ItemNames from "../common/itemNames";
import g from "../g";

const { ccclass, property } = cc._decorator;

@ccclass
export default class ChangePwd extends PopActionBox {
    @property(cc.Button)
    btnSendCode: cc.Button = undefined;

    @property(cc.Button)
    btnOk: cc.Button = undefined;

    @property(cc.EditBox)
    ebPhone: cc.EditBox = undefined;

    @property(cc.EditBox)
    ebVCode: cc.EditBox = undefined;

    @property(cc.EditBox)
    ebNewPwd: cc.EditBox = undefined;

    onLoad() {
        super.onLoad();
    }

    start() {
        super.start();

        let ins = User.instance;
        if (ins.act) {
            this.ebPhone.string = util.maskAccount(ins.act);
        }

        let next = g.chgPwdTime;
        let label = this.btnSendCode.node.getChildByName("lab").getComponent(cc.Label);
        util.doCountdown(this.btnSendCode, label, next);
    }

    onClickVCode() {
        let originLabel = this.btnSendCode.node.getChildByName("lab").getComponent(cc.Label);
        originLabel.string = "发送中";
        this.btnSendCode.interactable = false;
        window.pomelo.request("lobby.lobbyHandler.getChangePwdVerifyCode", {}, (data: any) => {
            console.log("获取验证码:" + data);
            originLabel.string = "获取验证码";
            if (data.code !== 200) {
                util.showTip(ErrCodes.getErrStr(data.code, "获取验证码失败"));
                this.btnSendCode.interactable = true;
                return;
            }
            util.showTip("已发送验证码，请注意查收！");
            let countdown = 60;
            let next = Date.now() + countdown * 1000;
            g.chgPwdTime = next;

            util.doCountdown(this.btnSendCode, originLabel, next);
        });
    }

    onClickOk() {
        let mobile = User.instance.act;
        let code = this.ebVCode.string.trim();
        let pwd = this.ebNewPwd.string;
        if (!mobile || !code || !pwd) {
            util.showTip("请输入完整信息！");
            return;
        }

        if (!util.checkPwd(pwd)) {
            util.showTip("密码格式不符合要求！最少需要6位");
            return;
        }
        window.pomelo.request("lobby.lobbyHandler.changePwd", { code: code, pwd: pwd }, (data: any) => {
            if (data.code !== 200) {
                util.showTip(ErrCodes.getErrStr(data.code, "密码修改失败"));
                return;
            }
            cc.sys.localStorage.setItem(ItemNames.password, pwd);
            util.showTip("密码修改成功！");
            this.closeAction();
        });
    }
}
