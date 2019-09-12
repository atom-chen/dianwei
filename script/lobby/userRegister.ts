import { UserInfo, Where, User } from "../common/user";
import * as util from "../common/util";
import { ErrCodes } from "../common/code";
import PopActionBox from "./popActionBox"
import Lobby from "./lobby";
import ItemNames from "../common/itemNames";
import g from "../g";
const { ccclass, property } = cc._decorator;

@ccclass
export default class UserRegister extends PopActionBox {


    @property(cc.EditBox)
    ebAccount: cc.EditBox = undefined;

    @property(cc.EditBox)
    ebVCode: cc.EditBox = undefined;

    @property(cc.EditBox)
    ebPwd: cc.EditBox = undefined;

    @property(cc.Button)
    btnBind: cc.Button = undefined;

    @property(cc.Button)
    btnSendCode: cc.Button = undefined;

    private isShowConfirm = false;
    private bindBonus: string;

    onLoad() {
        super.onLoad();
    }

    start() {
        super.start();
        let next = g.bindTime;
        let label = this.btnSendCode.node.getChildByName("lab").getComponent(cc.Label);
        util.doCountdown(this.btnSendCode, label, next);
    }

    onClickSure() {
        let phone = this.ebAccount.string.trim();
        let code = this.ebVCode.string.trim();
        let pwd = this.ebPwd.string;
        if (!util.isValidateMobile(phone)) {
            util.showTip("您输入的手机号码有误，请重新输入！");
            return;
        }
        if (!code || !pwd) {
            util.showTip("请输入完整信息！");
            return;
        }
        if (!util.checkPwdRule(pwd)) {
            util.showTip("密码格式不符合要求!只能输入数字或字符");
            return;
        }
        if (!util.checkPwd(pwd)) {
            util.showTip("密码格式不符合要求！最少需要6位");
            return;
        }
        util.showLoading("");

        window.pomelo.request("lobby.lobbyHandler.bind", { phone: phone, code: code, pwd: pwd },
            (data: { code: number; act?: string; bindBonus?: string; money?: string }) => {
                let act = data.act;
                if (data.code !== 200) {
                    util.hideLoading();
                    util.showTip(ErrCodes.getErrStr(data.code, "绑定失败"));
                    return;
                }
                util.showTip("绑定成功！");
                if (data.bindBonus && data.money) {
                    this.isShowConfirm = true;
                    User.instance.money = +data.money;
                    this.bindBonus = data.bindBonus;
                    let lob = cc.find("lobby").getComponent(Lobby);
                    lob.playFallCoin();
                }
                User.instance.act = data.act;
                cc.sys.localStorage.setItem(ItemNames.account, phone);
                g.act = phone;
                cc.sys.localStorage.setItem(ItemNames.password, pwd);
                g.pwd = pwd;
                util.hideLoading();
                this.onClose();
            });
    }

    onSendCodeButton() {
        let phone = this.ebAccount.string.trim();
        // 验证号码是否符合电话号码格式
        if (util.isValidateMobile(phone)) {
            let originLabel = this.btnSendCode.node.getChildByName("lab").getComponent(cc.Label);
            originLabel.string = "发送中";
            this.btnSendCode.interactable = false;
            window.pomelo.request("lobby.lobbyHandler.getBindVerifyCode", { phone: phone }, (data: any) => {
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
                g.bindTime = next;
                util.doCountdown(this.btnSendCode, originLabel, next);
            });
        }
        else {
            util.showTip("您输入的手机号码有误，请重新输入！");
            return;
        }
    }

    onClose() {
        if (this.isShowConfirm) {
            this.user.refreshUserInfos();
            let confirm = util.showConfirm("恭喜你获得绑定奖励 金币" + this.bindBonus);
            confirm.okFunc = function () {
                confirm.close();
                let lob = cc.find("lobby").getComponent(Lobby);
                lob.showNewbieBonus();
            };
        }

        this.closeAction();
    }
}
