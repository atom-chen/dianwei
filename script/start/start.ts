import { loginHelper } from "./loginHelper";
import LoadingLogic from "./loadingLogic";
import * as util from "../common/util";
import { ErrCodes } from "../common/code";
import g from "../g";
import { User } from "../common/user";
// import { loadScene, verCmp, getChannel } from "../common/util";
import ItemNames from "../common/itemNames";
import { showTip, showConfirm, checkEmu, getUrlData } from "../common/util";
import { UpdateTool } from "./updateTool";
import { checkUpdatable, UPDATE_STATUS } from "../common/update";

function dealNumber(params: any, name: string) {
    let item = params[name] && +params[name];
    if (!isNaN(item)) {
        return item;
    }
    return undefined;
}

/**
 * 获取链接参数
 *
 * @private
 * @param {string} url
 * @returns
 * @memberof Start
 */
const localStorage: Storage = cc.sys.localStorage;
const { ccclass, property } = cc._decorator;
@ccclass
export default class Start extends cc.Component {
    @property(cc.Mask)
    progressMask: cc.Mask = undefined;

    @property(cc.Label)
    info: cc.Label = undefined;

    @property(cc.Label)
    tips: cc.Label = undefined;

    @property(cc.RawAsset)
    private manifest: string = undefined;

    @property(cc.Label)
    private lblResVer: cc.Label = undefined

    @property(cc.Prefab)
    private preDebug: cc.Prefab = undefined;

    @property(cc.Node)
    private devBtn1: cc.Node = undefined;

    @property(cc.Node)
    private devBtn2: cc.Node = undefined;

    @property(cc.Node)
    private debugBtn1: cc.Node = undefined;

    @property(cc.Node)
    private debugBtn2: cc.Node = undefined;
    @property(cc.Node)
    private nodeCanvas: cc.Node = undefined;
    @property(cc.Node)
    private bar: cc.Node = undefined;

    @property(cc.Prefab)
    private preSuperService: cc.Prefab = undefined;
    @property(cc.Node)
    private serviceBtn: cc.Node = undefined;
    private timer: number = undefined;

    private barWidth = 0

    @property
    readonly checkUpdate: boolean = true;
    loadingLogic: LoadingLogic;

    private reconnectCount: number;

    private devFlag = 0;
    private debugFlag = 0;


    onLoad() {
        g.debugInfo = "== 启动界面载入 (首个页面) onload ==";
        this.barWidth = this.bar.width
        util.fitCanvas(this.nodeCanvas);
        this.progressMask.node.width = 0;
        this.lblResVer.string = "";
        this.dealParams();
        this.chgTips();

        if (this.devBtn1 && this.devBtn2) {
            this.devBtn1.setLocalZOrder(10000);
            this.devBtn2.setLocalZOrder(10000);
        }
        this.serviceBtn.active = false;
        this.serviceBtn.setLocalZOrder(10010);
        this.timer = setTimeout(() => {
            if (this.serviceBtn) {
                this.serviceBtn.active = true;
            }
        }, 3000);

        g.debugInfo = "---------------os-----------------";
        if (cc.sys.os === cc.sys.OS_ANDROID) {
            g.debugInfo = "OS_ANDROID";
        } else if (cc.sys.os === cc.sys.OS_IOS) {
            g.debugInfo = "OS_IOS";
        }
    }

    runTips() {
        this.tips.node.runAction(cc.repeatForever(cc.sequence(
            cc.fadeIn(0.8),
            cc.delayTime(1.8),
            cc.fadeOut(0.8),
            cc.callFunc(this.chgTips, this)
        )));
    }

    chgTips() {
        let l = g.loginTips.length;
        if (g.review || l === 0) {
            this.tips.string = "";
        } else {
            this.tips.string = g.loginTips[Math.floor(cc.rand()) % l];
        }
    }

    onDestroy() {
        clearTimeout(this.timer);
    }

    /**
     * 处理url参数，推荐人和房间号
     */
    private dealParams() {
        if (!cc.sys.isBrowser) {
            return;
        }
        let req = util.getRequest();
        if (req) {
            cc.log("url req =", req);
            let val = dealNumber(req, "roomId");
            if (val !== undefined) {
                g.roomId = val;
            }
            g.channel = req.channel;
        }
    }

    async start() {
        g.debugInfo = "== 启动界面载入 (首个页面) start ==";
        this.info.string = "准备启动";

        if (checkEmu()) {
            g.debugInfo = "当前设备为模拟器";
            let conf = showConfirm("请不要在模拟器中运行本游戏");
            conf.okFunc = cc.game.end;
            return;
        }

        this.runTips();

        if (!this.checkUpdate) {
            g.debugInfo = "检查更新开关未开！！！";
            this.beginLogin();
            return;
        }

        if (!cc.sys.isNative) {
            cc.log("not native");
            this.beginLogin();
            return;
        }

        // 热更新后1分钟内不再检测
        let currTime = (new Date()).getTime();
        let updateTime = +localStorage.getItem(ItemNames.hotUpdateTime);
        if ((currTime - updateTime) < 1000 * 60) {
            g.debugInfo = " hot update not need check！ coldTime";
            this.beginLogin();
            return;
        }


        let updateStatus = await checkUpdatable();
        // 是否在维护
        if (updateStatus === UPDATE_STATUS.MAINTAIN) return;
        // 检测热更新, 直接进入游戏了，不要检查热更新（因为是美服审核）
        if (updateStatus === UPDATE_STATUS.NO) {
            g.debugInfo = " 不要用热更新 ";
            this.beginLogin();
            return;
        }

        //开始热更新
        g.debugInfo = " 开始热更新 ";
        localStorage.setItem(ItemNames.manifestMain, this.manifest);
        let tool = new UpdateTool(this.manifest, ItemNames.lobbyPath, true);
        tool.showVer = ver => {
            this.lblResVer.string = ver;
        }
        tool.infoHandler = info => {
            this.info.string = info;
        };
        tool.progressHandler = num => {
            this.progressMask.node.width = num * this.barWidth;
        };
        tool.overHandler = this.beginLogin.bind(this);
        tool.start();
    }

    private async beginLogin() {
        cc.log("begin login");
        this.showResVersion();
        if (this.progressMask) {
            this.progressMask.node.width = 0;
            // TweenLite.to(this.progressMask.node, 30, {
            //     width: 0.95 * this.barWidth
            // });
            let w = (0.02 * (this.barWidth - this.progressMask.node.width)) / 20;
            this.schedule(() => {
                if (this.progressMask.node.width <= 0.95 * this.barWidth) {
                    this.progressMask.node.width += w;
                }
            }, 0.02);
        }
        this.reLogin();
    }

    private async reLogin() {
        cc.log("re login");
        this.info.string = "正在登录";
        let act = g.act;
        let pwd = g.pwd;
        let code: number;
        let token = localStorage.getItem(ItemNames.certificate);
        if (token && token !== "undefined") {
            code = await loginHelper.loginByToken();
            if (code === 9008 && act && pwd) {
                code = await loginHelper.loginByAct(act, pwd);
            }
        } else if (act && pwd) {
            code = await loginHelper.loginByAct(act, pwd);
        } else {
            code = await loginHelper.loginByUuid();
        }

        if (code === 200) {
            loginHelper.enterLobby(this.progressMask.node, this.barWidth);
        } else {
            this.loadingLogic.showLogin();
            if (code === ErrCodes.FORBID_LOGIN) {
                showConfirm(ErrCodes.getErrStr(code, ""));
            } else {
                showTip(ErrCodes.getErrStr(code, "登录失败"));
                if (code === ErrCodes.UNUSUAL_LOGIN) {
                    this.loadingLogic.showMobile();
                }
            }
        }
        // TweenLite.killTweensOf(this.progressMask.node);
    }

    private onClickShow(e: cc.Event, data: string) {
        // this.debugFlag = this.debugFlag | +data;
        // if (this.debugFlag === 3) {
        //     this.debugFlag = 0;
        //     let ui = util.instantiate(this.preDebug);
        //     let canvas = cc.find("Canvas");
        //     canvas.addChild(ui, 1000);
        // }
    }

    private onClickDev(e: cc.Event, data: string) {
        this.devFlag = this.devFlag | +data;
        if (this.devFlag === 3) {
            cc.sys.localStorage.setItem(ItemNames.devFlag, "1");
        }
    }

    /**
     * 显示资源版本号
     */
    private async showResVersion() {
        if (!cc.sys.isNative) {
            let ver = await new Promise((resolve: (v: string | undefined) => void) => {
                cc.loader.load(this.manifest, (err: Error, str: string) => {
                    let json;
                    try {
                        json = JSON.parse(str);
                    } catch (error) {
                        resolve(undefined);
                        return;
                    }
                    resolve(json.version);
                });
            })
            g.hotVer = ver;
        }
        this.lblResVer.string = g.hotVer;
    }

    private onClickShowService() {
        let canvas = cc.find("Canvas");
        if (canvas.getChildByName('superService')) {
            return;
        }
        let node = util.instantiate(this.preSuperService);
        canvas.addChild(node, 1000);
        node.active = true;
        node.setPosition(0, 0);
    }
}