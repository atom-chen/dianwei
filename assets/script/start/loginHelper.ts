import { ErrCodes } from "../common/code";
import { UserInfo, Where, User } from "../common/user";
import g from "../g";
import { genUUID, toUTF8Array, showLoading, registerPomelo, returnToGame, hideLoading, chkChineseStr } from "../common/util";
import Lobby, { ReportData } from "../lobby/lobby";
import { ShieldStatus } from "../common/shieldStatus";
import ItemNames from "../common/itemNames";
import aes from "./token";
import itemNames from "../common/itemNames";
import { gameInfo } from "../game-qhb/qhbMsg";

declare let aesjs: any;

type AuthCert = { uuid: string; businessPackage?: number } | { uuid: string; accessToken: string; businessPackage?: number } |
{ uuid: string, act: string; pwd: string; businessPackage?: number } | { uuid: string, act: string; code: string; businessPackage?: number }

const localStorage: Storage = cc.sys.localStorage;

interface ShowPackageInfo {
    isUpdate?: number,
    title?: string,
    content?: string,
    url?: string
}
interface LobbyEnterData {
    code: number;
    user: UserInfo;
    newbieBonus?: {
        money: number;
    };
    bindBonus?: {
        money: number;
    };
    where?: Where;
    hasNewTransfer?: number; // 是否有新的转账
    withdrawSwitch?: number;
    rechargeSwitch?: number;
    channelStatus?: number;
    report?: ReportData;
    userFlag: number;
    games: { gid: string, idx: number, active: number }[];
}

export class LoginHelper {



    private getIplistOnce = true;

    private fastestServer: string = "";
    private static errCount = 0

    private static connTest(server: string, servers201: string[], servers200: string[]): void {
        g.debugInfo = "test1=" + server
        let host = server
        if (server.indexOf("://") !== -1) {
            host = server.substring(server.indexOf("://") + 3)
        }

        if (g.outDev || g.localDev) {
            servers201.push(host);
            return
        }

        let temp = "http://" + host + "/888666/"
        g.debugInfo = "test= " + temp;
        let start = Date.now();
        let xhr = new XMLHttpRequest();
        xhr.timeout = 16000;
        xhr.onreadystatechange = (ev) => {
            g.debugInfo = "state chg=" + xhr.readyState + ",sta=" + xhr.status
        }
        xhr.onload = () => {
            if (xhr.status === 201) {
                servers201.push(host);
            } else {
                servers200.push(host);
            }
            g.debugInfo = xhr.status + "  " + temp + " opened, costs " + (Date.now() - start);
        }
        xhr.ontimeout = function () {
            g.debugInfo = "获取超时:" + temp;
        };
        xhr.onerror = function () {
            LoginHelper.errCount++
            g.debugInfo = temp + " error! ";
        };
        xhr.open("GET", temp);
        xhr.send();
    }
    static getFastestServer(servers: string[]): Promise<string | undefined> {
        return new Promise(async resolve => {
            LoginHelper.errCount = 0
            let servers200: string[] = [];
            let servers201: string[] = [];
            for (let s of servers) {
                LoginHelper.connTest(s, servers201, servers200);
            }
            let checkcount = 0;
            let total = servers.length
            let checkTimer
            let okServers = await new Promise<string[]>(resolve => {
                checkTimer = setInterval(() => {
                    checkcount++;
                    if (LoginHelper.errCount === total || checkcount > 15) {
                        g.debugInfo = "全err或超过15了"
                        resolve([])
                        return
                    }
                    let ok = [...servers201, ...servers200];
                    if (LoginHelper.errCount === total - 1 && ok.length === 1) {
                        g.debugInfo = "只有一个没err，ok1个"
                        resolve(ok.slice(0, 1))
                        return
                    }

                    //0-15秒只要两个201返回就返回
                    if (servers201.length >= 2) {
                        g.debugInfo = "server201 ok len>=2,len=" + servers201.length
                        resolve(servers201.slice(0, 2));
                        return;
                    }

                    if (checkcount >= 5 && checkcount <= 12) { //5-12秒，有任意两个节点返回就返回
                        if (ok.length >= 2) {
                            g.debugInfo = "5 ~ 12 oklen=" + ok.length
                            resolve(ok.slice(0, 2));
                            return;
                        }
                    } else if (checkcount > 12) {//12-15秒，有任意一个节点返回就返回
                        if (ok.length >= 1) {
                            g.debugInfo = " >12 oklen:" + ok.length
                            resolve(ok.slice(0, 2));
                            return;
                        }
                    }
                }, 1000);
            })
            g.debugInfo = "race over okservers:" + JSON.stringify(okServers);
            clearInterval(checkTimer);
            let rS: string = "";
            if (okServers.length === 2) {
                let idx = (Math.random() >= 0.5) ? 0 : 1;
                rS = okServers[idx];
            } else if (okServers.length === 1) {
                rS = okServers[0];
            }

            if (rS) {
                rS = "ws://" + rS
                resolve(rS);
            } else {
                cc.log("setTimeout no server");
                resolve();
            }
        });
    }

    /**
     *
     * @param token
     * @param ser 判断是否通过验证码登录
     */
    private async login(token: AuthCert, ser?: string) {
        cc.log("准备连接游戏服务器" + ser);
        if (cc.sys.os === cc.sys.OS_IOS) {//只检查iOS
            //根据app ID来判断  如果里面是网址链接则为企业包（下载地址）
            if (g.appId && g.appId.toString().indexOf('http') >= 0) {
                token.businessPackage = 1;
            } else {
                token.businessPackage = 0;//不需要提示
            }
        }
        let preEnterData;
        if (!ser) {
            // 正常登录流程
            window.pomelo.off();
            this.fastestServer = await LoginHelper.getFastestServer(g.gameServers);
            g.debugInfo = "[fastestServer] =" + this.fastestServer;
            if (!this.fastestServer) {
                g.debugInfo = "no server";
                let str = cc.sys.localStorage.getItem(itemNames.ipList);
                // 本地存有iplist（刚才用iplist并没有找到fastestServer），再次链接默认的ip，
                if (str) {
                    g.debugInfo = "begin connect default server";
                    this.fastestServer = await LoginHelper.getFastestServer(g.defaultIp);
                    if (!this.fastestServer) {
                        g.debugInfo = "no default server";
                        return 505;
                    }
                } else {
                    g.debugInfo = "return 505";
                    return 505;
                }
            }
            g.debugInfo = "fastest server: " + this.fastestServer;
            let ret = await this.handShake(this.fastestServer, 15000);
            if (!ret) return 500;
            g.debugInfo = " begin preEnter ";
            preEnterData = await this.preEnter();
            g.debugInfo = "handShake back data = " + preEnterData;
        }

        // 握手成功才会有aes.iv
        if (preEnterData instanceof Array || (ser && aes.iv)) {
            let code = await this.entry(token);
            if (code !== 200) {
                if (!token.uuid && (code === 400 || code === 500)) {
                    token.uuid = localStorage.getItem(ItemNames.uuid) || genUUID();
                    code = await this.login(token, this.fastestServer);
                } else {
                    return code;
                }
                g.debugInfo = "login again code = " + code;
            }

            g.debugInfo = "连接游戏服务器成功1" + this.getIplistOnce;
            if (this.getIplistOnce) {
                g.debugInfo = "get ip list";
                this.getIplistOnce = false;
                let str = await this.getIplist();
                g.debugInfo = "get ip list end";
                //当前连接不在列表中，断开重连
                if (str !== "" && str.indexOf(this.fastestServer) === -1) {
                    let pomelo = window.pomelo;
                    g.debugInfo = "主动断开，重新连接";
                    pomelo.off("disconnect");
                    pomelo.disconnect();

                    code = await this.login(token);
                }
            }
            g.debugInfo = "连接游戏服务器成功b:" + code;
            if (token.uuid) {
                localStorage.setItem(ItemNames.uuid, token.uuid);
            }
            return code;
        }
        // 登录失败
        return preEnterData;
    }

    private tryGetChannel() {
        if (cc.sys.isNative && !g.act) {
            g.debugInfo = "尝试获取channel";
            let downloadUrl = "";
            if (cc.sys.os === cc.sys.OS_IOS) {
                downloadUrl = jsb.reflection.callStaticMethod("JsClass", "getChannel");
            } else if (cc.sys.os === cc.sys.OS_ANDROID) {
                downloadUrl = jsb.reflection.callStaticMethod("org/cocos2dx/javascript/JsClass", "getChannel", "()Ljava/lang/String;");
            }
            let channel = "";
            g.debugInfo = "获取downloadUrl = " + downloadUrl;
            if (downloadUrl) {
                if (!chkChineseStr(downloadUrl) && downloadUrl.length < 150) {
                    channel = downloadUrl;
                }
            }
            g.channel = channel;
            g.debugInfo = "获取channel=" + g.channel;
        }
        g.debugInfo = "tryGetChannel end";
    }

    private async loginOver(ret: number) {
        let code = ret;
        if (ret === 200) {
            code = await loginHelper.requestEnterLobby();
        }
        return code;
    }

    async enterLobby(pro?: cc.Node, barWidth?: number) {
        cc.log("enterLobby");
        let connected = true;
        window.pomelo.once("disconnect", function () {
            connected = false;
        });
        let handler = function () {
            // registerPomelo();
            if (!connected) {
                window.pomelo.emit("disconnect");
            }
        }
        showLoading("加载中");
        if (User.instance.where && User.instance.where.gid != "BUYU") {
            let ok = await returnToGame(User.instance.where, pro, barWidth);

            if (ok) {
                handler();
                return;
            }
        }
        if (cc.director.getScene().name === g.lobbyScene) {
            let s = cc.director.getScene();
            let lobby = s.getChildByName("lobby").getComponent(Lobby);
            lobby.registerMethod();

            hideLoading();
            handler();
            return;
        }
        cc.director.preloadScene(g.lobbyScene, err => {
            if (err) {
                cc.error(err);
            }
            if (pro) {
                // TweenLite.to(pro, 0.5, {
                //     width: barWidth, onComplete: function () {
                //         cc.director.loadScene(g.lobbyScene, handler);
                //     }
                // });
                let w = (0.02 * (barWidth - pro.width)) / 0.5;
                let proTimer = setInterval(() => {
                    if (pro.width < barWidth) {
                        pro.width += w;
                    } else {
                        cc.director.loadScene(g.lobbyScene, handler);
                        clearInterval(proTimer);
                    }
                }, 0.02);
            } else {
                cc.director.preloadScene(g.lobbyScene, function () {
                    if (cc.director.getScene().name != g.lobbyScene) {
                        let canvas = cc.find("Canvas");
                        if (canvas) {
                            canvas.getComponentsInChildren(cc.Animation).forEach(a => {
                                a.stop();
                            });
                        }
                        cc.director.loadScene(g.lobbyScene, handler);
                    }
                });
            }
        });
    }

    loginByToken() {
        g.debugInfo = 'token登录';
        let localToken = localStorage.getItem(ItemNames.certificate);
        if (!localToken) {
            return;
        }
        let token: AuthCert = {
            uuid: localStorage.getItem(ItemNames.uuid) || genUUID(),
            act: "",
            pwd: "",
            code: "",
            accessToken: localToken,
            businessPackage: undefined,//需要提示
        };

        return this.login(token).then(ret => {
            if (ret === 9008) {
                localStorage.removeItem(ItemNames.certificate);
            }
            return this.loginOver(ret);
        });
    }

    loginByUuid() {
        g.debugInfo = '游客登录';
        if (g.act) {
            localStorage.removeItem(ItemNames.uuid);
        }
        localStorage.removeItem(ItemNames.account);
        localStorage.removeItem(ItemNames.password);
        let token: AuthCert = {
            uuid: localStorage.getItem(ItemNames.uuid) || genUUID(),
            act: "",
            pwd: "",
            code: "",
            businessPackage: undefined
        };

        return this.login(token).then(ret => {
            return this.loginOver(ret);
        });
    }

    loginByAct(act: string, pwd: string) {
        g.debugInfo = '账号登录';
        let token: AuthCert = {
            uuid: "",
            act: act,
            pwd: pwd,
            code: "",
            businessPackage: undefined
        };

        return this.login(token).then(ret => {
            if (ret === 200) {
                localStorage.setItem(ItemNames.account, act);
                g.act = act;
                localStorage.setItem(ItemNames.password, pwd);
                g.pwd = pwd;
            }
            return this.loginOver(ret);
        });
    }

    loginByMobile(mobile: string, code: string, ser: string) {
        g.debugInfo = '手机登录 ser =' + ser;
        localStorage.removeItem(ItemNames.account);
        localStorage.removeItem(ItemNames.password);
        let token: AuthCert = {
            uuid: "",
            act: mobile,
            pwd: "",
            code: code,
            businessPackage: undefined
        };
        return this.login(token, ser).then(ret => {
            return this.loginOver(ret);
        });
    }

    private handShake(cntUrl: string, timeout: number) {
        return new Promise<boolean>(resolve => {
            g.debugInfo = "--------------------handShake--------------------";
            let pomelo = window.pomelo;

            pomelo.disconnect();
            let timer = setTimeout(function () {
                pomelo.off();
                pomelo.disconnect();
                g.debugInfo = "handshake 1timeout 506";
                resolve(false);
            }, timeout);
            function errCb(event: Event) {
                cc.log('io-error=========', event)
                g.debugInfo = " errCb = ";
                clearTimeout(timer);
                resolve(false);
            }
            window.pomelo.once("io-error", errCb);

            let log = (s: string) => {
                g.debugInfo = s;
            }
            g.debugInfo = " begin init ";
            (pomelo as any).init({ host: cntUrl }, log, () => {
                registerPomelo();
                clearTimeout(timer);
                window.pomelo.off("io-error", errCb);
                pomelo.once("close", resolve);
                resolve(true)
            });
        });
    }

    private preEnter() {
        return new Promise<any>(resolve => {
            let timer = setTimeout(function () {
                // window.pomelo.off();
                // window.pomelo.disconnect();
                g.debugInfo = "handshake 2timeout 506";
                resolve(506);
            }, 15000)
            let cls = function () {
                g.debugInfo = "pomelo close";
                resolve(505);
            }
            window.pomelo.once("close", cls);
            let c = Math.random().toFixed(8);
            window.pomelo.request("connector.entryHandler.preEnter", { c: c }, (data: { code: number, s: string }) => {
                g.debugInfo = " preEnter code,s=" + data.code;
                window.pomelo.off("close", cls);
                clearTimeout(timer);
                if (data.code !== 200) {
                    resolve(data.code);
                    return;
                }
                let sign = md5("1T$j3MQfss#@Be!0" + c + data.s).toLowerCase();
                let iv = toUTF8Array(sign).slice(0, 16);

                aes.iv = iv;
                resolve(iv);
            });
        })
    }


    //注册
    private entry(token: AuthCert) {
        return new Promise((resolve: (ret: number) => void, reject) => {
            let pomelo = window.pomelo;
            pomelo.once("close", resolve);
            this.tryGetChannel();
            let data = { token: token, pid: g.pid, channel: g.channel, version: g.hotVer, bundleId: g.bundleId, platform: cc.sys.os === cc.sys.OS_ANDROID ? "android" : (cc.sys.os === cc.sys.OS_IOS ? "ios" : "web") };
            let dataStr = JSON.stringify(data);
            g.debugInfo = "enter chl= " + data.channel + ",bid=" + data.bundleId + ",plat=" + data.platform;
            let result = aes.encryptCBC(dataStr);

            g.debugInfo = "connector enter";
            pomelo.request("connector.entryHandler.enter", { token: result }, (data: { code: number, token: string }) => {
                pomelo.off("close", resolve);
                g.debugInfo = "entryHandler.enter  code = " + data.code
                if (data.code === 200 && data.token) {
                    try {
                        let str = aes.decryptCBC(data.token);
                        //let da = JSON.parse(str);
                        let dec: { accessToken: string, updateInfo: ShowPackageInfo } = JSON.parse(str);
                        let info = dec.updateInfo;
                        g.debugInfo = "token decryptCBC = " + str;
                        if (dec && dec.accessToken !== undefined) {
                            g.debugInfo = "da.accessToken " + dec.accessToken;
                            localStorage.setItem(ItemNames.certificate, dec.accessToken);
                        }
                        if (info && info.isUpdate === 1) {//需要提示
                            g.lobby.showShopPackage = true
                            g.needIsUpdate = info.isUpdate
                            g.updateTitel = info.title
                            g.updateContent = info.content
                            g.updateUrl = info.url
                        }
                    } catch (error) {
                        g.debugInfo = "token catch";
                        cc.warn(error);
                    }
                }
                resolve(data.code);
            });
        });
    }

    private getIplist() {
        return new Promise((resolve: (str: string) => void) => {
            // let data = { ips: ["59.153.74.66:21087/", "59.153.74.48:21087/",] };
            let pomelo = window.pomelo;
            pomelo.request("lobby.lobbyHandler.getIpList", {}, (data: { code: number, ips: string[] }) => {
                if (data.code === 500 || (data.code === 200 && !data.ips)) {
                    resolve("");
                }
                // 将服务器传过来的ip都保存下来
                if (data.ips && data.ips.length > 0) {
                    let newIps: string[] = [];
                    data.ips.forEach(ip => {
                        newIps.push(`ws://${ip}`);
                    });
                    let str = JSON.stringify(newIps);
                    cc.log("str====" + str)
                    cc.sys.localStorage.setItem(itemNames.ipList, str);
                    resolve(str);
                }
            });
        });
    }

    private requestEnterLobby() {
        return new Promise((resolve: (code: number) => void, reject) => {
            cc.warn("lobby enter");
            window.pomelo.request("lobby.lobbyHandler.enter", {}, (data: LobbyEnterData) => {
                if (data.code !== 200) {
                    resolve(data.code);
                    return;
                }
                let user = User.instance;
                user.shieldStatus = new ShieldStatus(data.channelStatus, data.userFlag);
                user.shieldStatus.switchReport = data.report.switchReport;
                g.shield = user.shieldStatus.shield;
                g.debugInfo = "shield:" + g.shield;
                g.lobby.shouldShowBulletinBoard = user.shieldStatus.showBillboard;
                user.initData(data.user);
                user.newbieBonus = data.newbieBonus;
                user.bindBonus = data.bindBonus;
                user.hasNewTransfer = !!data.hasNewTransfer;
                user.where = data.where;
                g.channel = data.user.channel;
                Lobby.setAvailableFuncs(data);
                Lobby.reportData = data.report;
                g.saveGameList = data.games;

                g.debugInfo = "进入大厅…";
                resolve(200);
            });
        });
    }
}

export let loginHelper = new LoginHelper();