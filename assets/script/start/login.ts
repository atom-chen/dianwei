import { loginHelper, LoginHelper } from "./loginHelper";
import Main from "../main";
import * as util from "../common/util";
import { ErrCodes } from "../common/code";
import g from "../g";
import { User } from "../common/user";
import Article from "./article";
import ItemNames from "../common/itemNames";
import { hideLoading } from "../common/util";
import aes from "./token";

const { ccclass, property } = cc._decorator;

const localStorage: Storage = cc.sys.localStorage;

@ccclass
export default class Login extends cc.Component {

    @property(cc.Node)
    nodeNormal: cc.Node = undefined;

    @property(cc.Button)
    btnFastLogin: cc.Button = undefined;

    @property(cc.Button)
    btnRegister: cc.Button = undefined;

    @property(cc.Button)
    btnLoginAct: cc.Button = undefined;

    @property(cc.EditBox)
    act: cc.EditBox = undefined;

    @property(cc.EditBox)
    pwd: cc.EditBox = undefined;

    @property(cc.Node)
    nodeMobile: cc.Node = undefined;

    @property(cc.Button)
    btnGetCode: cc.Button = undefined;

    @property(cc.Button)
    btnLoginMobile: cc.Button = undefined;

    @property(cc.EditBox)
    phone: cc.EditBox = undefined;

    @property(cc.EditBox)
    code: cc.EditBox = undefined;

    @property(cc.Prefab)
    private article: cc.Prefab = undefined;

    @property(cc.Node)
    private mobileNode: cc.Node = undefined;

    private switching: boolean;
    private reconnectCount: number;
    private isPreEnter = false;

    private fastSer: string;

    onLoad() {
        // init logic
        this.showNormal(false);
        this.showLoginInfo();
        let act = g.act;
        if (act) {
            this.act.string = act;
            this.phone.string = act;
        }
        let pwd = g.pwd;
        if (pwd) {
            this.pwd.string = pwd;
        }
        g.showRegister = undefined;
        g.lobby.isShowBind = true;

        if (g.review) {
            this.mobileNode.active = false;
        }
    }

    showLoginInfo() {
        let act = g.act;
        if (act) {
            this.act.string = act;
            this.phone.string = act;
        }
        let pwd = g.pwd;
        if (pwd) {
            this.pwd.string = pwd;
        }
        if (cc.sys.isNative && act) {
            this.hideQuickGame();
        }
    }

    hideQuickGame() {
        this.btnFastLogin.node.active = false;
        this.btnRegister.node.active = false;
    }

    onEndEditAct() {
        this.pwd.string = "";
        let act = this.act.string;
        if (util.isValidateMobile(act)) {
            this.phone.string = act;
        }
    }

    start() {
        this.reconnectCount = 1;
        if (g.loginTime) {
            let next = g.loginTime;
            util.doCountdown(this.btnGetCode, this.btnGetCode.getComponentInChildren(cc.Label), next);
        }
    }

    showNormal(doAnim = true) {
        this.switchNode(this.nodeMobile, this.nodeNormal, doAnim);
    }

    async showMobile() {
        let success = await this.switchNode(this.nodeNormal, this.nodeMobile, true);
        if (success) {
            util.showConfirm("请注意，只有已注册用户才能通过手机验证登录!");
        }
    }

    quickShowMobile() {
        this.nodeNormal.active = false;
        this.nodeMobile.active = true;
        this.nodeMobile.scale = 0;
        this.nodeMobile.runAction(cc.scaleTo(0.3, 1, 1).easing(cc.easeBackOut()));
    }

    private switchNode(from: cc.Node, to: cc.Node, doAnim: boolean) {
        return new Promise((resolve: (success: boolean) => void, reject) => {
            if (this.switching) {
                resolve(false);
                return;
            }
            if (doAnim) {
                if (from.active) {
                    this.switching = true;
                    from.runAction(cc.sequence(cc.scaleTo(0.3, 0, 0).easing(cc.easeBackIn()), cc.callFunc(() => {
                        from.active = false;
                        from.scale = 1;
                        to.active = true;
                        to.scale = 0;
                        to.runAction(cc.sequence(cc.scaleTo(0.3, 1, 1).easing(cc.easeBackOut()), cc.callFunc(() => {
                            this.switching = false;
                            resolve(true);
                        })));
                    })))
                }
            } else {
                to.active = true;
                from.active = false;
                resolve(true);
            }
        });
    }

    allowNormal(tog: cc.Toggle) {
        let active = tog.isChecked;
        this.btnFastLogin.interactable = active;
        this.btnLoginAct.interactable = active;
        this.btnRegister.interactable = active;
    }

    allowMobile(tog: cc.Toggle) {
        let active = tog.isChecked;
        this.btnLoginMobile.interactable = active;
    }

    async loginAct() {
        let act = this.act.string;
        let pwd = this.pwd.string;
        if (!this.btnFastLogin.node.active && g.act && g.pwd) {
            // 本地存有正式账号，则必须输入账号和密码才能登录
            if (!act) {
                util.showTip("请输入账号！");
                return;
            }
            if (!pwd) {
                util.showTip("请输入密码！");
                return;
            }
        }
        if (act || pwd) {
            if (!util.isValidateMobile(act)) {
                util.showTip("您输入的手机号码有误，请重新输入！");
                return;
            }
            if (!pwd) {
                util.showTip("请输入密码！");
                return;
            }
        }
        util.showLoading("正在登录");
        let code: number;
        if (act && pwd) {
            code = await loginHelper.loginByAct(act, pwd);
        } else {
            code = await loginHelper.loginByUuid();
        }
        if (code === 200) {
            loginHelper.enterLobby();
        } else {
            hideLoading();
            if (code === ErrCodes.FORBID_LOGIN) {
                util.showConfirm(ErrCodes.getErrStr(code, ""));
            } else {
                util.showTip(ErrCodes.getErrStr(code, "登录失败"));
                if (code === ErrCodes.UNUSUAL_LOGIN) {
                    this.quickShowMobile();
                }
            }
        }
    }

    async loginUuid() {
        util.showLoading("正在登录");
        let code = await loginHelper.loginByUuid();
        if (code === 200) {
            loginHelper.enterLobby();
        } else {
            hideLoading();
            if (code === ErrCodes.FORBID_LOGIN) {
                util.showConfirm(ErrCodes.getErrStr(code, ""));
            } else {
                util.showTip(ErrCodes.getErrStr(code, "登录失败"));
                if (code === ErrCodes.UNUSUAL_LOGIN) {
                    this.quickShowMobile();
                }
            }
        }
    }

    async getLoginCode() {
        let phone = this.phone.string;
        // 验证号码是否符合电话号码格式
        if (util.isValidateMobile(phone)) {
            let label = this.btnGetCode.getComponentInChildren(cc.Label);
            let originLabel = label.string;
            label.string = "发送中";
            this.btnGetCode.interactable = false;

            let code;
            if (!this.isPreEnter) {
                code = await this.preEnterServer();
            }
            if (!code || code === 200) {
                this.isPreEnter = true;
                window.pomelo.request("auth.authHandler.sendLoginVerifyCode", { phone: phone, pid: g.pid }, (data: { code: number }) => {
                    label.string = originLabel;
                    this.btnGetCode.interactable = true;
                    if (data.code !== 200) {
                        util.showTip(ErrCodes.getErrStr(data.code, "获取验证码失败"));
                        return;
                    }
                    let countdown = 60;
                    let next = Date.now() + countdown * 1000;
                    g.loginTime = next;
                    util.doCountdown(this.btnGetCode, label, next);
                    util.showTip("已发送验证码，请注意查收！");
                });
            } else {
                label.string = originLabel;
                this.btnGetCode.interactable = true;
            }
        } else {
            util.showTip("您输入的手机号码有误，请重新输入！");
            return;
        }
    }

    preEnterServer() {
        return new Promise(async (resolve: (code: number) => void) => {
            let pomelo = window.pomelo;
            let errCb = (err: any) => {
                pomelo.off("io-error");
                cc.error(err);
                resolve(500);
            };
            pomelo.on("io-error", errCb);

            let server = await LoginHelper.getFastestServer(g.gameServers);
            if (!server) {
                cc.error("g.gameserver == 0");
                resolve(505);
                return;
            }
            g.debugInfo = "server:" + server;

            let timer = setTimeout(function () {
                pomelo.off();
                pomelo.disconnect();
                g.debugInfo = "506";
                resolve(506);
            }, 15000);

            let log = (s: string) => {
                g.debugInfo = s;
            }
            (pomelo as any).init({ host: server }, log, () => {
                util.registerPomelo();
                clearTimeout(timer);
                pomelo.off("io-error", errCb);
                pomelo.once("close", () => {
                    cc.error("pomelo closed");
                    resolve(507);
                });

                let c = Math.random().toFixed(8);
                pomelo.request("connector.entryHandler.preEnter", { c: c }, (data: { code: number, s: string }) => {
                    g.debugInfo = " preEnter code,s=" + data.code;
                    clearTimeout(timer);
                    pomelo.off("close", () => {
                        cc.error("pomelo closed");
                        resolve(507);
                    });
                    if (data.code !== 200) {
                        resolve(data.code);
                        return;
                    }
                    let sign = md5("1T$j3MQfss#@Be!0" + c + data.s).toLowerCase();
                    let iv = util.toUTF8Array(sign).slice(0, 16);
                    aes.iv = iv;

                    // 握手成功后才记录下最快server
                    this.fastSer = server;
                    resolve(200);
                });
            });
        });
    }

    async loginMobile() {
        let phone = this.phone.string;
        let code = this.code.string;
        if (!util.isValidateMobile(phone)) {
            util.showTip("您输入的手机号码有误，请重新输入！");
            return;
        }
        if (!code) {
            util.showTip("请输入验证码！");
            return;
        }
        util.showLoading("正在登录");
        let ok = await loginHelper.loginByMobile(phone, code, this.fastSer);
        if (ok === 200) {
            loginHelper.enterLobby();
        } else {
            if (ok === 3001) {
                util.showTip("验证码有误，登录失败");
            } else {
                util.showTip(ErrCodes.getErrStr(ok, "登录失败"));
            }
            hideLoading();
        }
    }

    private onClickRegister() {
        g.showRegister = true;
        // cc.sys.localStorage.setItem("showRegister", "true");
        this.loginUuid();
    }

    private onClickReadPrivate() {
        let node = this.node.getChildByName("article");
        if (!node) {
            node = util.instantiate(this.article);
            this.node.addChild(node);
            node.name = "article";
            node.setPosition(0, 0);
        } else {
            let article = node.getComponent(Article);
            article.openAnim();
        }
    }
}