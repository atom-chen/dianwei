import { Gender, UserInfo, Where, User } from "../common/user";
import * as util from "../common/util";
import PopActionBox from "./popActionBox"
import { ErrCodes } from "../common/code";
import ChangeAvatar from "./changeAvatar";
import g from "../g";

const { ccclass, property } = cc._decorator;

@ccclass
export default class UserBox extends PopActionBox {
    @property(cc.Button)
    btnNick: cc.Button = undefined;



    @property(cc.Sprite)
    sprHead: cc.Sprite = undefined;

    @property(cc.Label)
    labUserId: cc.Label = undefined;

    @property(cc.Label)
    ebNick: cc.Label = undefined;

    @property(cc.EditBox)
    ebPhone: cc.EditBox = undefined;

    @property(cc.Prefab)
    preChangeAvatar: cc.Prefab = undefined;

    @property(cc.Prefab)
    preChangePwd: cc.Prefab = undefined;

    @property(cc.Prefab)
    private preRename: cc.Prefab = undefined;

    @property([cc.SpriteFrame])
    sfNick: cc.SpriteFrame[] = [];

    @property(cc.Label)
    lblAli: cc.Label = undefined;

    @property(cc.Label)
    lblBank: cc.Label = undefined;

    @property(cc.Button)
    btnBindAli: cc.Button = undefined;

    @property(cc.Button)
    btnBindBank: cc.Button = undefined;

    @property(cc.Node)
    nodeMaskAct: cc.Node = undefined;

    @property(cc.Prefab)
    private preBindAli: cc.Prefab = undefined;

    @property(cc.Prefab)
    private preBindBank: cc.Prefab = undefined;

    @property(cc.Node)
    private nodeAli: cc.Node = undefined;

    @property(cc.Node)
    private nodeBank: cc.Node = undefined;

    @property(cc.Label)
    private lab1: cc.Label = undefined;

    @property(cc.Label)
    private lab2: cc.Label = undefined;

    private banNicks: string[];

    start() {
        this.lab1.string = `支付宝账号`;
        this.lab2.string = ErrCodes.BIND_SSS;

        let ins = User.instance;
        this.ebNick.string = ins.nick;

        let phoneNo = "未绑定";
        if (ins.act) {
            phoneNo = util.maskAccount(ins.act);
        }
        this.ebPhone.string = phoneNo;
        this.labUserId.string = ins.uid.toString();

        this.openAnim(() => {
            if (g.shield) {
                this.nodeAli.active = false;
                this.nodeBank.active = false;
            } else {
                this.refreshAli();
                this.refreshBank();
            }
        })
    }
    protected onEnable() {
        if (super.onEnable) {
            super.onEnable();
        }
        this.showAvatar();
    }

    showAvatar() {
        let user = User.instance;
        this.sprHead.spriteFrame = util.getAvatar(user.isMale, user.avatarId);
    }

    onToggleMale() {
        this.onClickSex(Gender.MALE);
    }

    onToggleFemale() {
        this.onClickSex(Gender.FEMALE);
    }

    onClickSex(sex: Gender) {
        window.pomelo.notify("lobby.userHandler.changeGender", { gender: sex === Gender.MALE ? 1 : 0 });
        User.instance.gender = sex;
        this.showAvatar();
        this.user.refreshUserInfos();
    }

    onClickUpdateNick() {
        let node = util.instantiate(this.preRename);
        this.node.addChild(node);
        node.once("close", (ev: cc.Event.EventCustom) => {
            let nick = g.uname;
            if (nick && nick !== "") {
                this.ebNick.string = nick;
            }
        });
    }

    onClickUpdateHead() {
        let parent = this.node.parent;
        this.closeAction(() => {
            this.openAction(parent, this.preChangeAvatar);
        });
    }

    onClickPwd() {
        let parent = this.node.parent;
        this.closeAction(() => {
            this.openAction(parent, this.preChangePwd);
        });
    }

    onClickRegister() {
        util.returnToLogin();
    }

    private onClickBindAli() {
        let canvas = cc.find("Canvas");
        let node = util.instantiate(this.preBindAli);
        canvas.addChild(node);
        node.setPosition(0, 0);

        node.once("close", this.refreshAli.bind(this));
    }

    private refreshAli() {
        let ins = User.instance;
        this.lblAli.string = ins.SSSAccount || ErrCodes.BIND_SSS;
        window.pomelo.request("lobby.billHandler.checkShowBankOrAliInfo", {}, (data: { sss: number }) => {
            this.btnBindAli.node.active = !!data.sss;
            this.btnBindAli.interactable = !!data.sss;
            // let lab = this.btnBindAli.node.getChildByName("New Label")
            // lab.color = !!data.sss ? cc.hexToColor("#4e4e4e") : cc.hexToColor("#9C3912");
        });
    }

    private onClickBindBank() {
        let canvas = cc.find("Canvas");
        let node = util.instantiate(this.preBindBank);
        canvas.addChild(node);
        node.setPosition(0, 0);

        node.once("close", this.refreshBank.bind(this));
    }

    private refreshBank() {
        let ins = User.instance;
        this.lblBank.string = ins.bankAccount || ErrCodes.BIND_CARD;
        window.pomelo.request("lobby.billHandler.checkShowBankOrAliInfo", {}, (data: { uuu: number }) => {
            this.btnBindBank.node.active = !!data.uuu;
            this.btnBindBank.interactable = !!data.uuu;
            // let lab = this.btnBindBank.node.getChildByName("New Label")
            // lab.color = !!data.uuu ? cc.hexToColor("#4e4e4e") : cc.hexToColor("#9C3912");
        });
    }

    private EncodeUtf8(s1: string) {
        var s = escape(s1);
        var sa = s.split("%");
        var retV = "";
        if (sa[0] != "") {
            retV = sa[0];
        }
        for (var i = 1; i < sa.length; i++) {
            if (sa[i].substring(0, 1) == "u") {
                retV += this.Hex2Utf8(this.Str2Hex(sa[i].substring(1, 5)));

            }
            else retV += "%" + sa[i];
        }

        return retV;
    }
    private Str2Hex(s: any) {
        var c = "";
        var n;
        var ss = "0123456789ABCDEF";
        var digS = "";
        for (var i = 0; i < s.length; i++) {
            c = s.charAt(i);
            n = ss.indexOf(c);
            digS += this.Dec2Dig(eval(n.toString()));

        }
        //return value;
        return digS;
    }
    private Dec2Dig(n1: any) {
        var s = "";
        var n2 = 0;
        for (var i = 0; i < 4; i++) {
            n2 = Math.pow(2, 3 - i);
            if (n1 >= n2) {
                s += '1';
                n1 = n1 - n2;
            }
            else
                s += '0';

        }
        return s;

    }
    private Dig2Dec(s: any) {
        var retV = 0;
        if (s.length == 4) {
            for (var i = 0; i < 4; i++) {
                retV += eval(s.charAt(i)) * Math.pow(2, 3 - i);
            }
            return retV;
        }
        return -1;
    }
    private Hex2Utf8(s: any) {
        var retS = "";
        var tempS = "";
        var ss = "";
        if (s.length == 16) {
            tempS = "1110" + s.substring(0, 4);
            tempS += "10" + s.substring(4, 10);
            tempS += "10" + s.substring(10, 16);
            var sss = "0123456789ABCDEF";
            for (var i = 0; i < 3; i++) {
                retS += "%";
                ss = tempS.substring(i * 8, (eval(i.toString()) + 1) * 8);
                retS += sss.charAt(this.Dig2Dec(ss.substring(0, 4)));
                retS += sss.charAt(this.Dig2Dec(ss.substring(4, 8)));
            }
            return retS;
        }
        return "";
    }

}
