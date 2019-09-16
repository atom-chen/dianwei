import LobbyHome from "./lobbyHome";
import LobbyUser from "./lobbyUser";
import Stage from "./stage";
import Bank from "./bank";
import { MatchInfo } from "./lobbyIface";
import { BillboardTitle, BillBoard } from "./billBoard";
import AudioLobby from "./audioLobby";
import PopActionBox from "./popActionBox"
import { MailMsg } from "./mailMsg";
import MailBox from "./mailBox";
import Pay from "./pay";
import g from "../g";
import {
    fitCanvas, getSceneName, returnToGame, instantiate, sub, cmp,
    hideLoading, showLoading, showTip, showConfirm,
} from '../common/util';
import { ErrCodes } from "../common/code";
import Game, { GameId } from "../game-share/game";
import { Where, User } from "../common/user";
import GameHelp from "../game-share/gameHelp";
import { How2Play } from "../common/how2play";
import { WelfareResult, WelfareCfgCondition, WelfareCurCondition, WelfareEvents } from "./welfareEvents";
import itemNames from "../common/itemNames";
import shopPackage from "./shopPackage"
const { ccclass, property } = cc._decorator;

// 大厅现处于的界面
export enum LOBBY_STATUS {
    Lobby,
    Stage,

}

export type ReportData = {
    switchReport?: number;
    reportBonus?: string;
    reportWx?: string;
    isWX: number;
}

@ccclass
export default class Lobby extends cc.Component {
    @property(AudioLobby)
    audioLobby: AudioLobby = undefined;

    @property(Stage)
    stage: Stage = undefined;

    @property(LobbyHome)
    lobbyHome: LobbyHome = undefined;

    @property(cc.Prefab)
    private preFallCoin: cc.Prefab = undefined;

    @property(MailMsg)
    mailMsg: MailMsg = undefined;

    @property(cc.Node)
    nodeParent: cc.Node = undefined;

    @property(cc.Node)
    newTransfer: cc.Node = undefined;

    @property(cc.Node)
    nodeTopMenu: cc.Node = undefined;

    @property(cc.Label)
    lblOffcialWeb: cc.Label = undefined;

    @property(cc.Node)
    private nodeCanvas: cc.Node = undefined;

    @property(cc.Node)
    private nodeEvents: cc.Node = undefined;

    @property(cc.Node)
    private webviewbg: cc.Node = undefined;

    // 入口按钮
    @property(cc.Button)
    private btnQmdl: cc.Button = undefined;

    @property(cc.Button)
    private btnBack: cc.Button = undefined;

    @property(cc.Button)
    private btnWithdraw: cc.Button = undefined;

    @property(cc.Button)
    private btnBank: cc.Button = undefined;

    @property(cc.Button)
    protected btnQuickRecharge: cc.Button = undefined;

    @property(cc.Node)
    protected btnQuickBank: cc.Node = undefined;

    @property(cc.Button)
    private btnReport: cc.Button = undefined;

    // 子界面
    @property(cc.Prefab)
    private preWelfare: cc.Prefab = undefined;

    @property(cc.Prefab)
    shopPackageView: cc.Prefab = undefined


    @property(cc.Prefab)
    private preBank: cc.Prefab = undefined;

    @property(cc.Prefab)
    private preWithdraw: cc.Prefab = undefined;

    @property(cc.Prefab)
    private prefabPay: cc.Prefab = undefined;

    @property(cc.Prefab)
    private preCS: cc.Prefab = undefined;

    @property(cc.Prefab)
    private preBindUser: cc.Prefab = undefined;

    @property(cc.Prefab)
    private preRegister: cc.Prefab = undefined;

    @property(cc.Prefab)
    private preUserInfo: cc.Prefab = undefined;

    @property(cc.Prefab)
    private preSetting: cc.Prefab = undefined;

    @property(cc.Prefab)
    private preMail: cc.Prefab = undefined;

    @property(cc.Prefab)
    private preBillBoard: cc.Prefab = undefined;

    @property(cc.Prefab)
    private prePopularize: cc.Prefab = undefined;

    @property(cc.Prefab)
    private preReportReward: cc.Prefab = undefined;

    @property(cc.Prefab)
    private gameHelp: cc.Prefab = undefined;

    @property(cc.Prefab)
    private vipwindow: cc.Prefab = undefined;

    private billTitle: BillboardTitle[];
    private lUserRegister: PopActionBox = undefined;
    private lUserInfo: PopActionBox = undefined;
    private lMail: PopActionBox = undefined;
    private lBillBoard: BillBoard = undefined;
    private showStage: boolean = undefined;

    private welfareEvents: WelfareEvents = undefined;
    welfareEventID: number = 2;    // 活动id
    welfareCfgCondition: WelfareCfgCondition; // 活动配置金额（包含充值与流水）
    welfareCurCondition: WelfareCurCondition; // 活动当前金额（包含充值与流水）
    welfareGetState: number;  // 活动是否领取状态

    private _lUser: LobbyUser;
    get lUser() {
        if (!this._lUser) {
            let topNode = cc.find("Canvas/top");
            this._lUser = topNode.getComponent(LobbyUser);
        }
        return this._lUser;
    }
    protected _currLobbyUI: LOBBY_STATUS;
    get currLobbyUI() {
        return this._currLobbyUI;
    }
    /**
     * 显示或隐藏的功能
     *
     * @private
     * @type {*}
     * @memberof Lobby
     */
    private static _availableFuncs: {
        withdraw?: 0 | 1,
        recharge?: 0 | 1,
    } = {};
    static get availableFuncs() {
        return this._availableFuncs;
    }

    private static _reportData: ReportData;
    /**
     * 举报数据
     *
     */
    static set reportData(val: ReportData) {
        this._reportData = val;
    }
    static get reportData() {
        return this._reportData;
    }

    onLoad() {
        fitCanvas(this.nodeCanvas);
        this._currLobbyUI = LOBBY_STATUS.Lobby;
        this.lobbyHome.init(this);
        this.setAvatarShow(true);

        this.initReport();
        this.initChannelShield();
        //请求用户vip信息
        this.vipNotice();
        if (g.iosPushSwitch) {
            //上传DeviceToken
            this.uplDevToken();
        }
    }

    start() {
        if (g.lastGame) {
            this.returnStage();
        } else {
            this.lobbyHome.node.active = true;
        }

        // 依次显示游戏公告，绑定提示，新人奖，保险柜金币和官网地址
        this.showTips();
        this.showNewTransferTip();
        this.registerMethod();
        this.requestBankMoney();
        this.showWebUrl();
    }

    private uplDevToken() {
        if (cc.sys.os === cc.sys.OS_IOS) {
            let Token = cc.sys.localStorage.getItem(itemNames.deviceToken);
            let Device = jsb.reflection.callStaticMethod("JsClass", "getDeviceToken");
            let bundleId = g.bundleId;
            g.debugInfo = "DeviceToken========" + Device;
            cc.info("DeviceToken========" + Device);
            if (Device && Device != Token) {
                g.debugInfo = "上传DeviceToken";
                cc.info("上传DeviceToken");
                var xhr = new XMLHttpRequest();
                xhr.open("POST", g.iosPushUrl);
                xhr.setRequestHeader('Content-Type', "application/json");
                xhr.onreadystatechange = function () {
                    g.debugInfo = "" + xhr.readyState;
                    cc.info("" + xhr.readyState);
                    g.debugInfo = "" + xhr.status;
                    cc.info("" + xhr.status);
                    if (xhr.readyState == 4 && xhr.status === 200) {
                        g.debugInfo = '上传成功'
                        cc.info('上传成功');
                        cc.sys.localStorage.setItem(itemNames.deviceToken, Device);
                    }
                }
                xhr.ontimeout = function () {
                    g.debugInfo = 'sendlog超时'
                    cc.info('sendlog超时');
                };
                xhr.onerror = function () {
                    g.debugInfo = 'sendlog失败'
                    cc.info('sendlog失败');
                };
                let ret = {
                    pid: g.pid,
                    deviceToken: Device,
                    bundleId: bundleId,
                    token: md5(Device + "-1gdxg1dq2bn1bw1b" + bundleId + g.pid)
                }
                xhr.send(JSON.stringify(ret));
            }
        }
    }

    private vipNotice() {
        if (cc.sys.os === cc.sys.OS_IOS || cc.sys.os === cc.sys.OS_ANDROID) {
            let vip = g._vip;
            g.debugInfo = "检测vip";
            let ret = this.createToken();
            let url = vip.web + '/s/vipInfo?token=' + ret;
            var xhr = new XMLHttpRequest();
            xhr.open("GET", url);
            xhr.setRequestHeader('Content-Type', "application/json");
            xhr.onreadystatechange = function () {
                if (xhr.readyState == 4 && xhr.status === 200) {
                    g.debugInfo = "vip返回====" + xhr.response;
                    let jsons = JSON.parse(xhr.response);
                    if (jsons["msg"] && jsons["msg"]["isVip"]) {
                        g._vip.isvip = jsons.msg.isVip;
                        if (jsons["msg"]["currentServiceWx"]) {
                            g._vip.weChat = jsons.msg.currentServiceWx;
                        }
                        if (jsons["msg"]["dailyNotify"]) {
                            g._vip.dailyNotify = jsons.msg.dailyNotify.content;
                        }
                        if (jsons["msg"]["newVipNotify"]) {
                            g._vipinfo._newVipNotify.content = jsons.msg.newVipNotify.content;
                            g._vipinfo._newVipNotify.id = jsons.msg.newVipNotify.id;
                        }
                        if (jsons["msg"]["notifyPush"]) {
                            g._vipinfo._notifyPush.content = jsons.msg.notifyPush.content;
                            g._vipinfo._notifyPush.id = jsons.msg.notifyPush.id;
                        }
                        if (jsons["msg"]["wxChangeNotice"]) {
                            g._vipinfo._wxChangeNotice.content = jsons.msg.wxChangeNotice.content;
                            g._vipinfo._wxChangeNotice.id = jsons.msg.wxChangeNotice.id;
                        }
                    } else {
                        g._vip.isvip = false;
                    }
                }
            }
            xhr.ontimeout = function () {
                g.debugInfo = 'sendlog超时'
            };
            xhr.onerror = function () {
                g.debugInfo = 'sendlog失败'
            };
            xhr.send();
        }
    }

    private vipRead(id: string, idx: number) {
        let vip = g._vip;
        g.debugInfo = "读取vip信息";
        let token = this.createToken();
        let url = vip.web + '/s/readVipNotice?token=' + token;
        var xhr = new XMLHttpRequest();
        xhr.open("POST", url);
        xhr.setRequestHeader('Content-Type', "application/json");
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4 && xhr.status === 200) {
                switch (idx) {
                    case 1:
                        g._vipinfo._notifyPush.content = "";
                        g._vipinfo._notifyPush.id = "";
                        break;
                    case 2:
                        g._vipinfo._newVipNotify.content = "";
                        g._vipinfo._newVipNotify.id = "";
                        break;
                    case 3:
                        g._vipinfo._wxChangeNotice.content = "";
                        g._vipinfo._wxChangeNotice.id = "";
                        break;
                }
                g._vip.info = -1;
            }
        }
        xhr.ontimeout = function () {
            g.debugInfo = 'sendlog超时'
        };
        xhr.onerror = function () {
            g.debugInfo = 'sendlog失败'
        };
        let ret = {
            type: idx,
            id: id,
        }
        xhr.send(JSON.stringify(ret));
    }

    private createToken() {
        var crypto = require('crypto');
        var buffer = require('buffer').Buffer;
        let accessToken = localStorage.getItem(itemNames.certificate);
        let uid = User.instance.uid;
        let start = Date.now();
        const toSign = uid + "." + start + "." + accessToken;
        const hash = crypto.createHash("md5");
        const sign = hash.update(toSign).digest("hex");
        const toToken = uid + "." + start + "." + sign;
        const tokenBuffer = buffer.from(toToken);
        const token = tokenBuffer.toString("base64");
        return token;
    }

    private vipinfo() {
        let vipwin;
        vipwin = instantiate(this.vipwindow);
        this.nodeParent.addChild(vipwin, 999);
        return vipwin;
    }

    private setAvatarShow(visible: boolean) {
        this.lUser.getAvatar.active = visible;
        this.btnBack.node.active = !visible;
    }

    public showWebUrl() {
        this.lblOffcialWeb.string = this.Removepara(g.serviceCfg.web);
        this.lobbyHome.setQRContent();
    }

    Removepara(link: string) {
        let segme = link.split("?");
        return segme[0];
    }

    /**
     * 设置显示或隐藏的功能，例如兑换
     */
    static setAvailableFuncs(data: any) {
        let func = this._availableFuncs;
        func.withdraw = data.withdrawSwitch;
        func.recharge = data.rechargeSwitch;
    }

    /**
     * 初始化举报代理相关
     */
    private initReport() {
        let data = Lobby._reportData;
        this.btnReport.node.active = !!data && User.instance.shieldStatus.reportAgent;
        if (!this.btnReport.node.active) {
            return;
        }
    }

    protected initChannelShield() {
        if (g.shield) {
            this.btnBank.node.active = false;
            this.btnWithdraw.node.active = false;
            this.btnQuickRecharge.node.active = false;
            this.btnQuickBank.active = false;
        }
        if (User.instance.shieldStatus.channelApprentice) {
            this.btnQmdl.node.active = false;
        }
    }

    registerMethod() {
        window.pomelo.off("recharge");
        window.pomelo.off("userMoney");
        window.pomelo.off("bankMoney");
        window.pomelo.off("hasNewMail");
        window.pomelo.off("ChatRechargeNotify");

        window.pomelo.on("recharge", (data: { money: string }) => {
            let old = User.instance.money
            User.instance.money = +data.money;
            showConfirm("充值" + sub(data.money, old).toString() + "金币成功。");
            this.rechargeSucc();
            this._lUser.refreshUserInfos();
        });

        window.pomelo.on("userMoney", (data: { money: string }) => {
            User.instance.money = +data.money;
            this._lUser.refreshUserInfos();
        });

        window.pomelo.on("bankMoney", (data: { bankMoney: string }) => {
            User.instance.bankMoney = +data.bankMoney;
            this._lUser.refreshUserInfos();
        });

        window.pomelo.on("hasNewMail", () => {
            this.mailMsg.onHasNewMail();
        });

        window.pomelo.on("ChatRechargeNotify", (data: { money: string }) => {
            showConfirm("充值" + data.money + "金币成功,请到保险箱里查收!");
        });
        // 主动同步一次
        this._lUser.refreshUserInfos();
        window.pomelo.request("lobby.mailHandler.checkNew", {}, (data: { code: number, hasNew: boolean }) => {
            if (data.code === 200 && !!data.hasNew) {
                this.mailMsg.onHasNewMail();
            }
        })

        // 生成二维码
        window.pomelo.request("lobby.lobbyHandler.getWeb", {}, (data: { code: number, web: string, qq: string, wx: string, rechargeQuestionUrl?: string }) => {
            if (data.code === 200) {
                g.serviceCfg = { web: data.web, weChat: data.wx, qq: data.qq, rechargeQuestionUrl: data.rechargeQuestionUrl };
                this.showWebUrl()
                if (data.web)
                    localStorage.setItem(itemNames.officialUrl, data.web);
                if (data.wx)
                    localStorage.setItem(itemNames.weChat, data.wx);
                if (data.qq)
                    localStorage.setItem(itemNames.qq, data.qq);
            }
        });

        // 联运活动
        let eventsList: WelfareResult[] = [];
        window.pomelo.request("lobby.eventHandler.getEventData", {}, (data: { code: number, result: WelfareResult[] }) => {
            if (data.code === 200) {
                cc.info("活动信息：  ", data.result);
                if (data.result) {
                    data.result.forEach((val) => {
                        eventsList.push(val);
                    })
                    eventsList.sort((a, b) => {
                        return a.idx - b.idx; // 按照idx升序
                    });
                    // cc.info("存储的活动信息：  ", this.eventsList);
                    let len = eventsList.length;
                    if (len > 0 && eventsList[0].actId) {
                        g.eventsActive = true;
                        this.welfareEventID = eventsList[0].actId;
                        cc.info(this.welfareEventID);
                    } else {
                        g.eventsActive = false;
                    }
                } else {
                    g.eventsActive = false;
                }
            } else {
                cc.info("获取活动数据失败： code： ", data.code);
                g.eventsActive = false;
            }
            this.nodeEvents.active = g.eventsActive;
            this.lobbyHome.showOrHideEventPage(g.eventsActive);
        })
    }

    private requestBankMoney() {
        window.pomelo.request("lobby.bankHandler.enter", {}, (data: { code: number, money: number, bankMoney: number, transferMinMoney: number, transfer: number }) => {
            if (data.code === 200) {
                User.instance.bankMoney = data.bankMoney;
                this._lUser.refreshUserInfos();
            }
        })
    }

    /**
     * 返回最后加入的游戏
     *
     * @private
     * @returns
     * @memberof Lobby
     */
    private returnStage() {
        cc.log("returnStage:" + g.lastGame);
        if (!g.lastGame || g.lastGame === GameId.HH || g.lastGame === GameId.LH) {
            this.backLobby();
            return;
        }
        this.showGameStage(g.lastGame as GameId);
        g.lastGame = undefined;
        cc.log("returnStage over:" + g.lastGame);
    }

    protected showNewTransferTip() {
        this.newTransfer.active = false;
    }

    hideOtherLobbyUI() {
        let p;
        switch (this._currLobbyUI) {
            case LOBBY_STATUS.Lobby:
                p = this.lobbyHome.hide();
                break;
            case LOBBY_STATUS.Stage:
                p = this.stage.hide();
                break;
            default:
                break;
        }
        return p;
    }

    showShopPackageView() {
        return new Promise(resolve => {
            let node = this.shopPackage(g.updateContent, g.updateTitel);
            g.lobby.showShopPackage = false;
            if (!node) {
                resolve();
                return;
            }
            node.once("close", resolve);
        });
    }
    shopPackage(content: string, titel: string) {
        let view = cc.instantiate(this.shopPackageView);
        let viewScript = view.getComponent(shopPackage);
        viewScript.setContent(content);
        viewScript.setTitle(titel);
        this.nodeParent.addChild(view, 999);
        return view;
    }
    async showTips() {
        if (g.lobby.shouldShowBulletinBoard) {
            await new Promise(resolve => {
                this.onClickBillBoard();
                this.lBillBoard.node.once("close", resolve);
                g.lobby.shouldShowBulletinBoard = false;
            });
        }

        if (User.instance.newbieBonus) {
            await this.showNewbieBonus();
        }
        //显示防调签名提示
        if (!!g.needIsUpdate && g.lobby.showShopPackage) {
            await this.showShopPackageView();
        }
        if (!User.instance.act && g.lobby.isShowBind) {
            await new Promise(resolve => {
                let node = this.showBindTips();
                if (!node) {
                    resolve();
                    return;
                }
                g.lobby.isShowBind = false;
                let nodeComponent = node.getComponent(PopActionBox);
                nodeComponent.init(this);
                node.once("close", resolve);
            });
        }

        if (g._vip.isvip) {
            if (g._vipinfo._newVipNotify.id != "") {
                g._vip.info = 2;
                await new Promise(resolve => {
                    let node = this.vipinfo();
                    if (!node) {
                        resolve();
                        return;
                    }
                    this.vipRead(g._vipinfo._newVipNotify.id, 2);
                    node.once("close", resolve);
                });
            }
            if (g._vipinfo._notifyPush.id != "") {
                g._vip.info = 1;
                await new Promise(resolve => {
                    let node = this.vipinfo();
                    if (!node) {
                        resolve();
                        return;
                    }
                    this.vipRead(g._vipinfo._notifyPush.id, 1);
                    node.once("close", resolve);
                });
            }
            if (g._vipinfo._wxChangeNotice.id != "") {
                g._vip.info = 3;
                await new Promise(resolve => {
                    let node = this.vipinfo();
                    if (!node) {
                        resolve();
                        return;
                    }
                    this.vipRead(g._vipinfo._wxChangeNotice.id, 3);
                    node.once("close", resolve);
                });
            }
        }
    }

    showBindTips() {
        let ui;
        if (g.showRegister) {
            g.showRegister = undefined;
            if (!this.lUserRegister) {
                ui = instantiate(this.preRegister);
                this.lUserRegister = ui.getComponent(PopActionBox);
            } else {
                this.lUserRegister.openAnim();
            }
        } else {
            ui = instantiate(this.preBindUser);
        }
        this.nodeParent.addChild(ui, 999);
        return ui;
    }

    showNewbieBonus() {
        // 获取新人奖励
        let bonus = User.instance.newbieBonus;
        if (!bonus) {
            return;
        }
        return new Promise(resolve => {
            cc.log("新人奖励")
            User.instance.newbieBonus = undefined;
            let confirm = showConfirm("恭喜你获得新人奖励 金币" + bonus.money);
            confirm.okFunc = () => {
                confirm.close();
                window.pomelo.request("lobby.lobbyHandler.getNewbieBonus", {}, (data: {
                    code: number;
                    money: number;
                }) => {
                    if (data.code === 200) {
                        User.instance.money = data.money;
                        this.lUser.refreshUserInfos();
                        this.playFallCoin();
                    }
                    else {
                        showTip(ErrCodes.getErrStr(data.code, "错误"));
                    }
                });
            };
            confirm.node.once("close", resolve);
        });
    }

    /**
     * 打开玩家信息
     */
    private onClickUser() {
        cc.log("打开用户消息" + User.instance.act);

        if (!User.instance.act) {
            this.showBindTips();
            return;
        }

        if (!this.lUserInfo) {
            let ui = instantiate(this.preUserInfo);
            this.lUserInfo = ui.getComponent(PopActionBox);
            this.lUserInfo.autoDestroy = false
            this.nodeParent.addChild(ui);
        } else {
            this.lUserInfo.openAnim();
        }
    }

    private onClickCS() {
        if (!User.instance.act) {
            this.showBindTips();
            return;
        }
        let di = instantiate(this.preCS);
        this.nodeParent.addChild(di);
    }

    onClickBank() {
        if (!User.instance.act) {
            this.showBindTips();
            return;
        }
        showLoading("正在进入银行");
        window.pomelo.request("lobby.bankHandler.enter", {}, (data: { code: number, money: number, bankMoney: number, transferMinMoney: number, transfer: number }) => {
            hideLoading();
            if (data.code === 200) {
                let b = instantiate(this.preBank);
                this.nodeParent.addChild(b);
                let bank = b.getComponent(Bank)
                bank.init(this);
                bank.beforeShow(data)
            } else if (data.code === 3006) {
                showTip("你正在游戏中，无法使用银行！");
            } else {
                showTip(ErrCodes.getErrStr(data.code, "进入银行失败"));

            }
        })
    }




    async onClickRecharge() {

        let nodeRecharge = instantiate(this.prefabPay);
        this.nodeParent.addChild(nodeRecharge);
    }

    private onClickSetting() {
        let ui = instantiate(this.preSetting);
        this.nodeParent.addChild(ui);
    }

    onClickPopularize() {
        let ui = instantiate(this.prePopularize);
        this.nodeParent.addChild(ui);
    }

    onClickWelfare() {
        if (!User.instance.act) {
            this.showBindTips();
            return;
        }
        showLoading("福利载入中...");
        window.pomelo.request("lobby.eventHandler.checkEventChannel", { actId: this.welfareEventID },
            (data: { code: number, st: number, ed: number, cfgCondition: WelfareCfgCondition, curCondition: WelfareCurCondition, get: number }) => {
                hideLoading()
                if (data.code === 200) {
                    if (data.st) {
                        let serverst = new Date(data.st).toLocaleString();
                        //如果为0 则表示任意时间开始
                        cc.info("活动开始时间：  ", serverst)
                    }
                    if (data.ed) {
                        let servered = new Date(data.ed).toLocaleString()
                        //如果为0， 则表示任意时间结束
                        cc.info("活动结束时间：   ", servered);
                    }
                    if (data.cfgCondition) this.welfareCfgCondition = data.cfgCondition;
                    if (data.curCondition) this.welfareCurCondition = data.curCondition;
                    if (data.get) this.welfareGetState = data.get
                    cc.info(data.cfgCondition, data.curCondition, data.get);
                    let localTime = Math.floor((new Date().getTime()) / 1000);
                    if (data.st && data.st / 1000 <= localTime) {
                        if (data.ed && data.ed / 1000 >= localTime) {
                            let nodeWelfare = instantiate(this.preWelfare);
                            this.nodeParent.addChild(nodeWelfare);
                            this.welfareEvents = nodeWelfare.getComponent(WelfareEvents)
                            this.welfareEvents.init(this);
                        } else {
                            showConfirm("亲，本次活动已结束，感谢您的参与，祝您游戏愉快！");
                        }
                    } else {
                        if (data.st) {
                            let startTime = new Date(data.st).toLocaleString();
                            showConfirm("亲，活动将于" + startTime + "开始，请耐心等待");
                        } else {
                            showConfirm("当前尚无活动！");
                        }
                    }
                } else {
                    cc.info("失败code：  ", data.code);
                    showTip(ErrCodes.getErrStr(data.code, "载入失败"));
                }
            })
    }
    private onClickMail() {
        if (!this.lMail) {
            let ui = instantiate(this.preMail);
            this.nodeParent.addChild(ui);
            this.lMail = ui.getComponent(MailBox);
            this.lMail.autoDestroy = false
        } else {
            this.lMail.openAnim();
        }
        (<MailBox>this.lMail).setMailMsg(this.mailMsg);
    }

    private async onClickBillBoard() {
        if (!this.lBillBoard) {
            let ui = instantiate(this.preBillBoard);
            this.nodeParent.addChild(ui);
            this.lBillBoard = ui.getComponent(BillBoard);
            this.lBillBoard.autoDestroy = false
            if (!this.billTitle) {
                showLoading("加载公告");
                await new Promise(resolve => {
                    window.pomelo.request("lobby.lobbyHandler.getBillboardTitle", {}, (data: { code: number, titles: BillboardTitle[] }) => {
                        if (data.code === 200) {
                            this.billTitle = data.titles;
                        }
                        resolve();
                    });
                });
                hideLoading();
            }
            this.lBillBoard.showBillBoard(this.billTitle);

        } else {
            this.lBillBoard.openAnim();
        }
    }

    private onClickHelp() {
        let node = instantiate(this.gameHelp);
        let canvas = cc.find("Canvas");
        canvas.addChild(node);
        node.active = true;
        node.setPosition(0, 0);
        let gameHelp = node.getComponent(GameHelp);
        gameHelp.showContent(How2Play.gameHelpDesc(g.lastGame as GameId));

    }

    onClickWithdraw() {
        if (!User.instance.act) {
            this.showBindTips();
            return;
        }
        let nodeWithdraw = instantiate(this.preWithdraw);
        this.nodeParent.addChild(nodeWithdraw);
    }

    private onClickReport(ev: cc.Event.EventTouch) {
        let btn = ev.target as cc.Button;
        btn.interactable = false;
        let node = instantiate(this.preReportReward);
        this.nodeParent.addChild(node);
        this.scheduleOnce(() => {
            btn.interactable = true;
        }, 1);
    }

    private onClickCloseWbview() {
        this.webviewbg.active = false;
    }

    /**
     * 金币下落特效
     */
    playFallCoin() {
        let fallCoin = instantiate(this.preFallCoin);
        this.node.addChild(fallCoin);
        this.scheduleOnce(() => {
            fallCoin.removeFromParent();
        }, 3);
    }

    /**
     *  充值成功特效
     */
    private rechargeSucc() {
        this.playFallCoin();
        this.audioLobby.playRechargeSucc();
    }

    private onClickState(ev: cc.Event.EventTouch, info: string) {
        if (!info) {
            showTip("加入游戏没有info");
            return;
        }
        this.audioLobby.playClick();
        let matchInfo = JSON.parse(info);

        this.enterGame(matchInfo.rid, matchInfo);
    }

    backLobby(ev?: cc.Event.EventTouch) {
        this.lobbyHome.beforeShow().then(success => {
            g.lastGame = undefined;
            this.nodeTopMenu.active = true
            hideLoading();
            if (success) {
                this.hideOtherLobbyUI();
                this.setAvatarShow(true);
                this.lobbyHome.show();
                this._currLobbyUI = LOBBY_STATUS.Lobby;
            }
        });
    }

    enterGame(game: GameId, info: MatchInfo) {
        let money = User.instance.money;
        let { minMoney, maxMoney } = info;
        if (maxMoney && maxMoney !== "-1") {
            let ret = cmp(money, maxMoney);
            if (ret === 1) {
                showTip("本房进房上限为" + maxMoney + "，请去银行存一些再来吧~~");
                return;
            }
        }
        let sceneName = getSceneName(game);
        if (!sceneName) {
            showTip("游戏暂未开放");
            return;
        }
        this.joinGame(sceneName, game, info.id, maxMoney, minMoney);
    }

    joinGame(sceneName: string, game: GameId, matchId: string, maxMoney?: string, minMoney?: string) {
        showLoading("加载中");
        cc.director.preloadScene(sceneName, () => {
            window.pomelo.request("lobby.matchHandler.join", { gid: game, mid: matchId }, (data: { code: number, where?: Where }) => {
                if (!data) {
                    hideLoading();
                    showTip("加入房间失败，未知错误");
                    return;
                }

                if (data.code !== 200 && data.code !== 4005) {
                    if (!data.where) {
                        let money = User.instance.money;
                        if (minMoney && minMoney !== "-1") {
                            let ret = cmp(money, minMoney);
                            if (ret === -1) {
                                if (!g.shield) {
                                    let c = showConfirm("亲，您身上的金币不太多了噢~换个房间或者再补充点金币吧。", "去充值", "去银行");
                                    c.showClose();
                                    c.okFunc = this.onClickRecharge.bind(this);
                                    c.cancelFunc = this.onClickBank.bind(this);
                                }
                                hideLoading();
                                return;
                            }
                        }
                    }
                    this.enterFailHandler(data.code, +maxMoney, data.where);
                    return;
                }

                cc.director.loadScene(sceneName!, () => {
                    let node = cc.find("game");
                    if (!node) {
                        cc.warn("找不到game节点");
                        return;
                    }
                    let game = node.getComponent(Game);
                    if (sceneName === "game-by") {
                        game = node.getComponent("byGame");
                        game.id = matchId!;
                        return;
                    }
                    if (!game) {
                        cc.warn("找不到game脚本");
                        return;
                    }
                    game.id = matchId!;
                });
            });
        });
    }

    enterFailHandler(code: number, maxMoney: number, where?: Where) {
        let cb = () => {
            hideLoading();
            if (code === 4006) {
                let confirm = showConfirm("您正在其他游戏房间中，是否回到该房间？", "确定", "取消");
                confirm.okFunc = () => {
                    returnToGame(where!);
                    confirm.close();
                };
            } else if (code === 3012) {
                showTip("本房进房上限为" + maxMoney + "，请去银行存一些再来吧~~");
            }
            else {
                if (cc.director.getScene().name !== g.lobbyScene) {
                    cc.director.loadScene(g.lobbyScene, function () {
                        showTip(ErrCodes.getErrStr(code, "进入房间失败"));
                    });
                } else {
                    showTip(ErrCodes.getErrStr(code, "进入房间失败"));
                }
            }
        }
        if (cc.director.getScene().name !== g.lobbyScene) {
            cc.director.loadScene(g.lobbyScene, cb);
        } else {
            cb();
        }
    }

    async showGameStage(game: GameId) {
        if (this.currLobbyUI === LOBBY_STATUS.Stage || this.showStage)
            return

        cc.info("当前游戏" + game);
        this.showStage = true;
        this.audioLobby.playClick();
        if (game === GameId.HH || game === GameId.LH) {
            let matches = g.saveGameRoomList[game];
            if (!matches) {
                matches = await Stage.getMatchList(game);
                if (matches) {
                    g.saveGameRoomList[game] = matches;
                }
            }
            this.showStage = false;
            if (!matches) return;
            this.enterGame(game, matches[0]);

        } else {
            this.nodeTopMenu.active = false
            this.stage.beforeShow(game).then(success => {
                this.showStage = false;
                hideLoading();
                if (success) {
                    g.lastGame = game;
                    this._currLobbyUI = LOBBY_STATUS.Stage;
                    this.setAvatarShow(false);
                    this.lobbyHome.hide();
                    this.stage.show();
                }
            });
        }
    }
}
