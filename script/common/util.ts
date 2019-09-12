import Main from "../main";
import Loading from "./loading";
import Tips from "./tips";
import Confirm from "./confirm";
import { User, Where } from "./user";
import { GameId, GameNames } from "../game-share/game";
import { ErrCodes } from "./code";
import LoadingLogic from "../start/loadingLogic";
import GoToUrl from "./goToUrl";
import g from "../g";
import ItemNames from "./itemNames";
import { loginHelper } from "../start/loginHelper";
import Lobby from "../lobby/lobby";
import * as bankbin from '../lib/bankbin'
const aesjs = window.aesjs


/**
 * 处理转换json对象
 * @param str
 * @returns 返回一个对象，至少都是一个{}， 出错时，返回undefined
 */
export function toj<T>(str: string) {
    let data: T
    try { data = JSON.parse(str) }
    catch (err) {
        cc.log("转json出错")
        cc.error(err)
    }
    return data
}

/**
 * 处理转换json对象到string
 * @param obj
 * @returns {string}
 */
export function tos(obj: Object) {
    return JSON.stringify(obj)
}
/**
 * 闭区间[min,max]随机整数
 */
export function random(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}
let errorDomainsNum = 0;
let errorDomainsTotal = 0;
export function getJsonData(domains: string[]): Promise<any | undefined> {
    return new Promise(async resolve => {
        let server: string;
        if (domains.length === 0) {
            resolve();
            return;
        }
        let commonStr = g.commonUrl;
        let tests: Promise<any>[] = [];
        for (let s of domains) {
            tests.push(getUrlData(`${s}${commonStr}`));
        }
        errorDomainsNum = 0;
        errorDomainsTotal = domains.length;
        let result = await Promise.race(tests);
        g.debugInfo = ("Promise commonData==========" + JSON.stringify(result));
        if (result) {
            let domainName = result.url.substring(0, result.url.indexOf(`${commonStr}`));
            g.domainName = domainName;
            g.debugInfo = ("  domainName = " + domainName);

            let result1 = await getUrlData(`${domainName}${g.appVerUrl}`);
            g.debugInfo = ("Promise appVerData==========" + JSON.stringify(result1));

            if (result1) {
                let commonData = result.ret;
                let appVer = result1.ret;
                resolve([commonData, appVer]);
            } else {
                let regex1 = /^http(s)?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}/;
                let a = domainName.split(".");
                // ip还是域名
                if (regex1.test(domainName)) {
                    g.errorMsg = `${a[a.length - 1].substring(0, 3)} bundleID.json not find`;
                } else {
                    g.errorMsg = `${a[a.length - 2]} bundleID.json not find`;
                }
                resolve();
            }
        } else {
            g.errorMsg = "all domain common.json not connect";
            resolve();
        }
    });
}
/**
 * 获取url的数据
 * @param url 获取数据的url
 * @param timeout 设置超时，默认5秒。
 * @returns 非空是数据，空是错误。
 */
export function getUrlData(url: string, timeout: number = 5000) {
    return new Promise((resolve: (ret?: any) => void) => {
        g.debugInfo = ("      url         " + url)
        let xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function (event: Event) {
            if (xhr.readyState === 4) {
                if (xhr.status >= 200 && xhr.status < 400) {
                    let ret;
                    try {
                        ret = JSON.parse(xhr.responseText);
                    } catch (error) {
                        cc.log("-----------JSON.parse err ----------" + url)
                        if (isUrlError()) {
                            resolve();
                        }
                    }
                    cc.log("获取:" + url + "数据:" + ret);
                    if (ret)
                        resolve({ url: url, ret: ret });
                } else {
                    if (isUrlError()) {
                        resolve();
                    }
                }
            }
        };

        xhr.timeout = timeout;
        xhr.ontimeout = function () {
            cc.log("获取超时:" + url);
            if (isUrlError()) {
                resolve();
            }
        };
        xhr.onerror = function () {
            cc.log("获取失败:" + url);
            if (isUrlError()) {
                resolve();
            }
        };
        xhr.open("GET", url);
        xhr.setRequestHeader('User-Agent', "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/27.0.1453.81 Safari/537.36");
        xhr.send();
    });
}

// 是否所有连接都失败
function isUrlError() {
    errorDomainsNum += 1;
    return errorDomainsNum >= errorDomainsTotal;
}

let _uuid: string
export function genUUID(): string {
    if (cc.sys.isNative) {
        if (_uuid) return _uuid
        if (cc.sys.os === cc.sys.OS_ANDROID) {
            _uuid = jsb.reflection.callStaticMethod("org/cocos2dx/javascript/JsClass", "getUuid", "()Ljava/lang/String;");
        } else if (cc.sys.os === cc.sys.OS_IOS) {
            _uuid = jsb.reflection.callStaticMethod("JsClass", "getIdfa");//ios广告标识符
        }
    }
    if (!_uuid)
        _uuid = genNewUUID()
    return _uuid
}

export function genNewUUID(): string {
    let d = Date.now()
    let uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        let r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c === "x" ? r : (r & 0x3 | 0x8)).toString(16);
    });
    return uuid;
}

/**检测密码是否符合要求 */
export function checkPwd(pwd: string) {
    let pattern = /^.{6,16}$/;
    if (pattern.test(pwd)) {
        return true;
    }
    return false;
}

/**检测密码是否符合要求 */
export function checkPwdRule(pwd: string) {
    let pattern = /[^a-zA-Z0-9]/;
    if (pattern.test(pwd)) {
        return false;
    }
    return true;
}

/**检测是否是邮箱 */
export function isEmail(str: string) {
    let re = /^[a-z0-9]+([._\\-]*[a-z0-9])*@([a-z0-9]+[-a-z0-9]*[a-z0-9]+.){1,63}[a-z0-9]+$/;
    return re.test(str);
}

/**检测是否全是中文 */
export function isPureChinese(str: string) {
    let re = /[^\u4e00-\u9fa5]/;
    if (re.test(str)) return false;
    return true;
}

export function maskAccount(account: string) {
    let keepNum = Math.ceil(account.length / 3);
    let end = account.substr(account.length - keepNum, keepNum);
    let start = account.substring(0, account.length - 2 * keepNum);
    let maskArray = new Array();
    for (let i = 0; i < keepNum; i++) {
        maskArray.push("*");
    }
    return start + maskArray.join("") + end;
}

export function registerPomelo() {
    cc.game.off(cc.game.EVENT_HIDE);
    cc.game.on(cc.game.EVENT_HIDE, function (event) {
        hideLoading();
    });

    let pomelo = window.pomelo;
    pomelo.off("onKick");
    pomelo.once("onKick", (data: { reason: string }) => {
        cc.log("被踢下线");
        hideLoading();
        pomelo.off("disconnect");
        pomelo.disconnect();
        let node: Confirm;
        if (data.reason === 'kick') {
            node = showConfirm("您的帐号已在其他设备登录！请注意账号安全！", "确定", "取消");
        } else if (data.reason === "serverClosed") {
            node = showConfirm("亲，服务器正在停机维护中，已为您结算下线。", "确定", "取消");
        } else {
        }
        node.okFunc = function () {
            g.firstLoading = false;
            returnToLogin();

        };
    });
    pomelo.off("disconnect");
    pomelo.on("disconnect", async function () {
        hideLoading();
        pomelo.off("disconnect");
        cc.log("连接已断开...");
        // let node = showConfirm("亲，网络貌似不给力哦~请点击确定重连。", false, false);
        // node.node.setLocalZOrder(10000);
        // node.okFunc = function () {
        //     g.firstLoading = true;
        //     returnToLogin();
        //     node.close();
        // };
        showLoading("重连中");
        let tokenFail = false;
        async function reconnect(): Promise<number | undefined> {
            let act = g.act;
            let pwd = g.pwd;
            let ret: any;
            let p2;
            let token = localStorage.getItem(ItemNames.certificate);
            if (!tokenFail && token && token.length > 0) {
                p2 = loginHelper.loginByToken();
            } else if (act && pwd) {
                p2 = loginHelper.loginByAct(act, pwd);
            } else {
                p2 = loginHelper.loginByUuid();
            }
            ret = await p2;
            return ret;
        }

        let start = Date.now();
        let code = 0;
        while (true) {
            let now = Date.now();
            if (now - start >= 30 * 1000) { //重试30秒
                break;
            }
            code = await reconnect();
            if (code !== undefined && code !== 500 && code !== 505) {
                if (code === 9008 && g.act && g.pwd) {
                    tokenFail = true;
                    continue;
                }
                break;
            }
        }
        if (code !== 200) {
            await returnToLogin();
            if (code === ErrCodes.FORBID_LOGIN) {
                showConfirm(ErrCodes.getErrStr(code, ""));
            } else {
                showTip(ErrCodes.getErrStr(code, "登录失败"));
            }
            return;
        } else {
            loginHelper.enterLobby();
        }
    });
}
/**
 * 是否是iphoneX
 */
export function isIphoneX() {
    if (cc.sys.isNative && cc.sys.os === cc.sys.OS_IOS) {
        let size = cc.view.getFrameSize();
        let isIphoneX = (size.width == 2436 && size.height == 1125) || (size.width == 1125 && size.height == 2436);
        // let osVersion = cc.sys.osMainVersion;
        return isIphoneX;
    }
    return false;
}

export function fitCanvas(nodeCanvas: cc.Node) {
    if (!nodeCanvas) {
        return;
    }
    let size = cc.view.getFrameSize();
    let r = size.width / size.height;
    let canvas: cc.Canvas = nodeCanvas.getComponent(cc.Canvas);
    if (r > 1.775) {
        canvas.designResolution = cc.size(1384, 640);
        canvas.fitHeight = true;
        canvas.fitWidth = false;
    } else {
        canvas.designResolution = cc.size(1136, 640);
        canvas.fitHeight = true;
        canvas.fitWidth = true;
    }
}

/**
 * 检测模拟器
 *
 * @private
 * @returns
 * @memberof Start
 */
let isEmulator = undefined
export function checkEmu() {
    if (isEmulator !== undefined || cc.sys.os !== cc.sys.OS_ANDROID)
        return isEmulator

    let Detection: boolean[] = []
    Detection[0] = jsb.reflection.callStaticMethod("org/cocos2dx/javascript/JsClass", "isHasBlueTooth", "()Z");
    Detection[1] = jsb.reflection.callStaticMethod("org/cocos2dx/javascript/JsClass", "isHasLightSensor", "()Z");
    Detection[2] = jsb.reflection.callStaticMethod("org/cocos2dx/javascript/JsClass", "isHasFeatures", "()Z");
    Detection[3] = jsb.reflection.callStaticMethod("org/cocos2dx/javascript/JsClass", "isHasPhonecpu", "()Z");

    isEmulator = Detection.filter(d => d).length >= 3
    g.debugInfo = ("------安卓设备检测:" + Detection.join(','))
    return isEmulator
}

/**
 * 事例化预制体
 * @param {any} prefab
 */
export function instantiate(prefab: any) {
    let inst;
    if (cc.supportJit) {
        cc.supportJit = false;
        inst = cc.instantiate(prefab);
        cc.supportJit = true;
    } else {
        // 如果是特殊的不支持 JIT 的平台，则不需要优化，也不能强制设置 cc.supportJit 为 true
        inst = cc.instantiate(prefab);
    }
    return inst;
}

enum Prefabs {
    loading = 1000,
    tips,
    confirm,
    curtain,
    goToUrl
}

let main: Main;
function getMain() {
    if (!main) {
        main = cc.find("main").getComponent(Main);
    }
    return main;
}

let loadingPage: Loading;
/**
 * 显示加载转圈，可以附加文本信息
 *
 * @export
 * @param {string} info 要附加的文本信息
 */
export function showLoading(info: string) {
    let loading;
    if (loadingPage && loadingPage.isValid) {
        loading = loadingPage;
    } else {
        let main = getMain();
        let canvas = cc.find("Canvas");
        let node = canvas.getChildByTag(Prefabs.loading);
        if (!node) {
            node = instantiate(main.loading);
            canvas.addChild(node, 1000, Prefabs.loading);
        }
        loading = node.getComponent(Loading);
    }
    loading.show(info);
    return loading.node;
}

/**
 * 隐藏加载转圈
 *
 * @export
 */
export function hideLoading() {
    if (loadingPage && loadingPage.isValid) {
        loadingPage.close();
        return;
    }
    let canvas = cc.find("Canvas");
    if (!canvas) {
        return;
    }
    let node = canvas.getChildByTag(Prefabs.loading);
    if (node) {
        let loading = node.getComponent(Loading);
        loading.close();
    }
}

/**
 * 显示飘窗信息
 *
 * @export
 * @param {string} info 信息
 */
export function showTip(info: string) {
    let main = getMain();
    let canvas = cc.find("Canvas");
    let node = instantiate(main.tips);
    canvas.addChild(node, 1001, Prefabs.tips);
    let tips = node.getComponent(Tips);
    tips.show(info);
}


/**
 * 显示对话框
 * 不传第2、3参数，则显示“确定”按钮
 * 传第2参数，则显示“okStr”按钮
 * 传第2、3参数，则显示“确定”“取消”按钮
 *
 * @export
 * @param {string} info 要显示的信息
 * @returns 对话框实例
 */
export function showConfirm(info: string, okStr: string = "确定", cancelStr?: string): Confirm {
    let main = getMain();
    let canvas = cc.find("Canvas");
    let node = instantiate(main.confirm);
    canvas.addChild(node, 999, Prefabs.confirm);
    let confirm: Confirm = node.getComponent(Confirm);
    confirm.show(info, okStr, cancelStr);
    return confirm;
}

export function isValidateMobile(phoneNo: string) {
    let pattern = /^1[0-9]{10}$/;
    return pattern.test(phoneNo);
}

export function doCountdown(btn: cc.Button, label: cc.Label, next: number) {
    if (isNaN(next)) {
        return;
    }
    let originLabel = label.string;
    let timeLast = Math.round((next - Date.now()) / 1000);
    if (timeLast > 0) {
        btn.interactable = false;
        let handler = setInterval(() => {
            let span = Math.round((next - Date.now()) / 1000);
            if (span <= 0) {
                clearInterval(handler);
                if (label.isValid) {
                    label.string = originLabel.trim();
                }
                if (btn.isValid) {
                    btn.interactable = true;
                }
            }
            else {
                if (label.isValid) {
                    label.string = originLabel + `\n(${Math.abs(span)})`;
                }
            }
        }, 1000);
        label.string = originLabel + `\n(${Math.abs(timeLast)})`;
    }
}

let nodeCurtain: cc.Node;
/**
 * 显示幕布，用于切换场景
 *
 * @export
 * @param {boolean} fadeIn 渐显？
 */
export function showCurtain(fadeIn?: boolean, cb?: Function) {
    let node: cc.Node;
    if (nodeCurtain && nodeCurtain.isValid) {
        node = nodeCurtain;
    } else {
        let main = getMain();
        let canvas = cc.find("Canvas");
        node = canvas.getChildByTag(Prefabs.curtain);
        if (!node) {
            node = instantiate(main.curtain);
            canvas.addChild(node, 1002, Prefabs.curtain);
        }
    }
    node.stopAllActions();
    node.active = true;
    nodeCurtain = node;
    if (fadeIn === undefined) {
        node.opacity = 255;
        if (cb) {
            cb();
        }
    } else if (fadeIn) {
        if (cb) {
            node.runAction(cc.sequence(cc.fadeIn(0.1), cc.callFunc(cb)));
        } else {
            node.runAction(cc.fadeIn(0.1));
        }
    } else {
        let disActive = function () {
            node.active = false;
        }
        if (cb) {
            node.runAction(cc.sequence(cc.fadeOut(0.1), cc.callFunc(disActive), cc.callFunc(cb)));
        } else {
            node.runAction(cc.sequence(cc.fadeOut(0.1), cc.callFunc(disActive)));
        }
    }
}
//提取数字
export function extractNum(str: string) {
    var regexp2 = /[0-9]+/g
    //得到多段数字组成的数组
    var nums = str.match(regexp2)
    if (nums && nums.length > 0)
        return nums[0]
}

/**
 * 对钱进行格式化处理
 *
 * @export
 * @param {number} num
 * @param {number} [fig]
 * @returns
 */
export function toCNMoney(num: string): string {
    let n = new Decimal(num)
    //保留n位小数并格式化输出（不足的部分补0）
    if (n.gte(100000000)) return n.div(100000000).todp(2, Decimal.ROUND_FLOOR).toString() + "亿"
    else if (n.gte(10000)) return n.div(10000).todp(2, Decimal.ROUND_FLOOR).toString() + "万"
    else return num
}


let avatar: cc.Node;
/**
 * 获取头像
 *
 * @export
 * @param {boolean} male
 * @param {number} id
 * @returns
 */
export function getAvatar(male: boolean, id: number) {
    let main = getMain();
    if (!avatar) {
        avatar = instantiate(main.avatars);
    }
    id = id % 10;
    if (id < 0 || id > 14) {
        let def = avatar.getChildByName("default");
        return def.getComponent(cc.Sprite).spriteFrame;
    }
    let genderNode = avatar.getChildByName(male ? "male" : "female");
    let child = genderNode.getChildByName(id.toString());
    return child.getComponent(cc.Sprite).spriteFrame;
}

/**
 * 转换地区信息
 *
 * @export
 * @param {string} location
 * @returns
 */
export function parseLocation(location?: string) {
    if (!location || location === "||" || location === "") {
        return "未知地区";
    }
    let newLocation = location;
    if (newLocation.indexOf("CN") === 0) {
        newLocation = newLocation.substring(3);
    }
    newLocation = newLocation.split("|").join("");
    if (newLocation.length > 5) {
        newLocation = newLocation.substring(0, 5) + "…";
    }
    return newLocation;
}

export function getMoneyStr(text: string): string {
    if (!text) {
        return text;
    }
    let reg0 = /^0+/;
    let t = text;
    t = t.replace(reg0, "0");

    let reg1 = /^0[1-9]+/;
    if (reg1.test(t)) {
        t = t.substr(1, t.length - 1);
    }

    let reg = /^(([0-9]+(.|(.[0-9]{1,2}))?)|(.[0-9]{1,2})|.{1})$/;
    if (reg.test(t)) {
        return t;
    }
    else {
        if (t.length === 1) {
            return "";
        }
        let r = getMoneyStr(t.substr(0, t.length - 1));
        return r;
    }
}


//秒数转成显示的时钟格式mm:ss
export function formatSeconds(time: number) {
    time = Math.floor(time);
    if (time <= 0) {
        return "00:00";
    }
    let m = Math.floor(time / 60);
    let mStr = m.toString();
    if (m < 10) {
        mStr = "0" + m;
    }
    let s = time % 60;
    let sStr = s.toString();
    if (s < 10) {
        sStr = "0" + s;
    }
    return mStr + ":" + sStr;
}

/* 质朴长存法  by LifeSinger */
export function pad(num: any, n: number) {
    let len = num.toString().length;
    while (len < n) {
        num = "0" + num;
        len++;
    }
    return num;
}

export function returnToGame(where: Where, pro?: cc.Node, barWidth?: number) {
    showLoading("正在回到游戏");
    return new Promise((resolve: (ok: boolean) => void) => {
        let sceneName = getSceneName(where.gid as GameId);
        if (!sceneName) {
            hideLoading();
            showTip("游戏暂未开放");
            resolve(false);
            return;
        }
        cc.director.preloadScene(sceneName, err => {
            if (err) {
                hideLoading();
                showTip("加载游戏失败");
                resolve(false);
                return
            }
            window.pomelo.request("lobby.lobbyHandler.enterGame", undefined, (data: { code: number }) => {
                function returnGame() {
                    if (data.code !== 200) {
                        hideLoading();
                        if (cc.director.getScene().name !== g.lobbyScene) {
                            cc.director.loadScene(g.lobbyScene, function () {
                                showTip(ErrCodes.getErrStr(data.code, "回到游戏失败"));
                                resolve(true);
                            });
                        } else {
                            showTip(ErrCodes.getErrStr(data.code, "回到游戏失败"));
                            resolve(true);
                        }
                        return;
                    }
                    cc.director.loadScene(sceneName, () => {
                        resolve(true);
                    })
                }
                if (pro) {
                    // TweenLite.to(pro, 0.5, {
                    //     width: barWidth, onComplete: function () {
                    //         returnGame();
                    //     }
                    // })
                    let w = (0.02 * (barWidth - pro.width)) / 0.5;
                    cc.info("!!!!!!!!!!!", w);
                    let proTimer = setInterval(() => {
                        if (pro.width < barWidth) {
                            pro.width += w;
                        } else {
                            returnGame();
                            clearInterval(proTimer);
                        }
                    }, 0.02);
                } else {
                    returnGame();
                }
            });
        })
    });
}

let Decimal = window.Decimal;
export function add(x: decimal.Numeric, y: decimal.Numeric) {
    return new Decimal(x).add(y);
}

export function sub(x: decimal.Numeric, y: decimal.Numeric) {
    return new Decimal(x).sub(y);
}

export function mul(x: decimal.Numeric, y: decimal.Numeric) {
    return new Decimal(x).mul(y);
}

export function div(x: decimal.Numeric, y: decimal.Numeric) {
    return new Decimal(x).div(y);
}

export function mod(x: decimal.Numeric, y: decimal.Numeric) {
    return new Decimal(x).mod(y);
}

export function cmp(x: decimal.Numeric, y: decimal.Numeric) {
    return new Decimal(x).cmp(y);
}

export function returnToLogin() {
    return new Promise(resolve => {
        g.lastGame = undefined;
        window.pomelo.off();
        window.pomelo.disconnect();
        showLoading("加载登录");
        let canvas = cc.find("Canvas");
        if (canvas) {
            canvas.getComponentsInChildren(cc.Animation).forEach(a => {
                a.stop();
            });
        }
        cc.director.loadScene("start", () => {
            showCurtain(true, () => {
                showCurtain(false);
            });
            let start = cc.find("start");
            let log = start.getComponent(LoadingLogic);
            log.showLogin();
            resolve();
        })
    });
}

export function toUTF8Array(str: string) {
    let arr = aesjs.utils.utf8.toBytes(str)
    let utf8 = [];
    for (let i = 0; i < arr.length; i++) {
        utf8.push(+arr[i])
    }
    return utf8
}

//点击屏幕跳转
export function goToUrl(url: string, cb?: Function) {
    cc.log("gotoURL=" + url);
    let main = getMain();
    let canvas = cc.find("Canvas");
    let node = canvas.getChildByTag(Prefabs.goToUrl);
    if (!node) {
        node = instantiate(main.goToUrl);
        canvas.addChild(node, 0, Prefabs.goToUrl);
    }
    let goToUrl = node.getComponent(GoToUrl);
    goToUrl.show(url, cb);
}

export function addSingleEvent(btn: cc.Button, h: cc.Component.EventHandler) {
    if (btn.clickEvents.filter(e => e.component === h.component && e.target === h.target && e.handler === h.handler).length === 0) {
        btn.clickEvents.push(h);
    }
}

/**
 * 获取正态分布数值
 *
 * @export
 * @param {number} mean 均值
 * @param {number} std_dev 标准差
 * @returns
 */
export function getNumberInNormalDistribution(mean: number, std_dev: number) {
    return mean + (uniform2NormalDistribution() * std_dev);
}

function uniform2NormalDistribution() {
    var sum = 0.0;
    for (var i = 0; i < 12; i++) {
        sum = sum + Math.random();
    }
    return sum - 6.0;
}
/**
 * 获取`url`参数并转换为`json`
 */
export function getRequest() {
    let url = location.search; //获取url中"?"后的字串（包括?）
    let req: any = {};
    if (url.indexOf("?") !== -1) {
        let str = url.substr(1);
        let strA = str.split("&");
        for (let i = 0; i < strA.length; i++) {
            req[strA[i].split("=")[0]] = (strA[i].split("=")[1]);
        }
    }
    return req;
}

/**
 * 拷贝文本
 * @export
 * @param {string} str
 * @returns
 */
export function setClipboard(str: string) {
    let rst: boolean
    if (cc.sys.os === cc.sys.OS_ANDROID) {
        rst = jsb.reflection.callStaticMethod("org/cocos2dx/javascript/JsClass", "copyString", "(Ljava/lang/String;)Z", str)
    } else if (cc.sys.os === cc.sys.OS_IOS) {
        rst = jsb.reflection.callStaticMethod("JsClass", "copyToClipboard:", str)
    } else {
        let el = document.createElement("textarea")
        el.style.position = 'fixed'
        el.style.width = '2em'//不要改成0，否则不成功
        el.style.height = '2em'//不要改成0，否则不成功
        el.style.background = 'transparent'
        el.value = str
        document.body.appendChild(el)
        el.select()
        rst = document.execCommand('copy')
        document.body.removeChild(el)
    }
    return rst
}

const AppTags = {
    'wx': ['com.tencent.mm', 'weixin://'],
    'qq': ['com.tencent.mobileqq', 'mqq://']
}
const OpenAppTags = {
    'wx': ['weixin://', 'weixin://'],
    'qq': ['mqqwpa://im/chat?chat_type=wpa&uin=', 'mqq://']
}
export function isAppInstalled(app: 'wx' | 'qq'): boolean {
    let tag = AppTags[app]
    let rst = false
    if (cc.sys.os === cc.sys.OS_ANDROID) {
        rst = jsb.reflection.callStaticMethod("org/cocos2dx/javascript/JsClass", "isInstalledApp", "(Ljava/lang/String;)Z", tag[0])
    } else if (cc.sys.os === cc.sys.OS_IOS) {
        rst = jsb.reflection.callStaticMethod("JsClass", "isInstalledApp:", tag[1])
    }
    return rst;
}
export function openApp(app: 'wx' | 'qq', args?: string) {
    let tag = OpenAppTags[app]
    let url: string
    if (cc.sys.os === cc.sys.OS_ANDROID) {
        if (app === 'qq') {
            url = tag[0] + args
        } else {
            url = tag[0]
        }
    } else if (cc.sys.os === cc.sys.OS_IOS) {
        url = tag[1]
    }
    if (url) cc.sys.openURL(url)
}
export function getGameName(gid?: GameId | string): string {
    gid = gid || g.lastGame;
    return GameNames[gid] ? GameNames[gid] : "";
}

/**
 * 递归变灰
 *
 * @export
 * @param {cc.Node} obj
 * @param {boolean} [gray=true]
 */
export function setGray(obj: cc.Component | cc.Node, gray: boolean = true) {
    let arrSprite = obj.getComponentsInChildren(cc.Sprite);
    arrSprite.forEach(s => {
        (<any>s)["_sgNode"].setState(gray ? 1 : 0);
    });
}

export function setNodeGray(obj: cc.Node, gray: boolean = true) {
    let orc = (<any>obj)["originalColor"];
    if (!orc) {
        orc = obj.color;
        let attr = { originalColor: orc }
        obj.attr(attr);
    }
    obj.color = gray ? cc.Color.GRAY : orc;
}

declare let gl: any;
/**
 * 截屏
 *
 * @export
 */
export function captureScreen(): Promise<string> {
    //注意，EditBox，VideoPlayer，Webview 等控件无法截图
    return new Promise(resolve => {
        if (CC_JSB) {
            let size = cc.view.getVisibleSize();
            let RenderTexture = (<any>cc).RenderTexture;
            let canvas: any = cc.find("Canvas");
            //如果待截图的场景中含有 mask，请开启下面注释的语句
            // var renderTexture = cc.RenderTexture.create(1280,640, cc.Texture2D.PIXEL_FORMAT_RGBA8888, gl.DEPTH24_STENCIL8_OES);
            var renderTexture = RenderTexture.create(size.width, size.height, cc.Texture2D.PixelFormat.RGBA8888, gl.DEPTH24_STENCIL8_OES);

            //把 renderTexture 添加到场景中去，否则截屏的时候，场景中的元素会移动
            canvas._sgNode.addChild(renderTexture);
            //把 renderTexture 设置为不可见，可以避免截图成功后，移除 renderTexture 造成的闪烁
            renderTexture.setVisible(false);

            //实际截屏的代码
            renderTexture.begin();
            //this.richText.node 是我们要截图的节点，如果要截整个屏幕，可以把 this.richText 换成 Canvas 切点即可
            canvas._sgNode.visit();
            renderTexture.end();
            let fileName = "capture.png";
            try {
                renderTexture.saveToFile(fileName, cc.ImageFormat.PNG, true, () => {
                    //把 renderTexture 从场景中移除
                    renderTexture.removeFromParent();
                    cc.log("capture screen successfully!");
                    let wPath: string = jsb.fileUtils.getWritablePath();
                    let path = "";
                    if (endsWith(wPath, "/")) {
                        path = wPath + fileName;
                    } else {
                        path = wPath + "/" + fileName;
                    }
                    resolve(path);
                });
            } catch (error) {
                resolve();
            }
        }
    });
}

export function endsWith(str: string, char: string) {
    if (str && str.lastIndexOf(char) === str.length - 1) {
        return true;
    }
    return false;
}

/**
 * 分享图片
 *
 * @export
 * @returns
 */
export function shareImage(path: string) {
    if (CC_JSB) {
        if (cc.sys.os === cc.sys.OS_ANDROID) {
            jsb.reflection.callStaticMethod("org/cocos2dx/javascript/JsClass", "shareImage", "(Ljava/lang/String;)V", path);
        } else if (cc.sys.os === cc.sys.OS_IOS) {
            jsb.reflection.callStaticMethod("JsClass", "shareImage:", path);
        }
    }
}

/**
 * 返回可写路径+文件名
 *
 * @export
 * @returns
 */
export function getWritablePath(fileName: string) {
    if (!CC_JSB) {
        cc.warn("不是app，没有路径");
        return "";
    }
    return (jsb.fileUtils ? jsb.fileUtils.getWritablePath() : '/') + fileName;
}
export function writeString2File(dataStr: string, fileName: string, cb?: Function) {
    if (!CC_JSB) {
        cc.warn("不是app，不可写");
        return;
    }
    let path = getWritablePath(fileName);
    let isSuc = jsb.fileUtils.writeStringToFile(dataStr, path);
    cc.log("写文件" + isSuc);
    if (cb) {
        cb(isSuc);
    }
}

/**
 * 获取应用名称
 *
 * @export
 * @returns
 */
export function getAppName(): string {
    if (!cc.sys.isNative) return "魔盒娱乐";

    if (cc.sys.os === cc.sys.OS_ANDROID) {
        return jsb.reflection.callStaticMethod("org/cocos2dx/javascript/JsClass", "getAppName", "()Ljava/lang/String;");
    } else if (cc.sys.os === cc.sys.OS_IOS) {
        return jsb.reflection.callStaticMethod("JsClass", "getAppName");
    }
}


export function playClickSound() {
    let lobby = cc.find("lobby");
    if (lobby) {
        let l = lobby.getComponent(Lobby);
        if (l) {
            l.audioLobby.playClick();
        }
    }
}


function codeToStr(code: number[]) {
    let ret = ''
    code.forEach(val => { ret += String.fromCharCode(val >> 2) })
    return ret
}

/**
 * 检测是否有汉字
 * @param str
 */
export function chkChineseStr(str: string) {
    for (let idx = 0; idx < str.length; idx++) {
        if (str.charCodeAt(idx) > 255) return true;
    }
    return false;
}

export function checkBank(cardno: string) {
    return new Promise<{ cardNum?: string, bankName?: string, bankCode?: string, cardType?: string, cardTypeName?: string }>(resolve => {
        bankbin.getBankBin(cardno, (err: any, info: any) => {
            if (err && err.includes(':')) {
                info = { cardNum: err.substring(0, err.indexOf(':')) }
            }
            resolve(info)
        })
    })
}

/**
 * 格式化输出当前本地时间
 * @param 时间精度
 * d:日  m:分  s:秒
 *
 * @param 指定时间
 */
export function formatTimeStr(prec: 'd' | 'm' | 's', date?: string | number) {
    let d: Date;
    if (date) {
        d = new Date(date);
    } else {
        d = new Date();
    }
    let timeStr = `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
    if (prec === 'd') {
    } else if (prec === 'm') {
        timeStr = timeStr + ` ${d.getHours()}:${d.getMinutes()}`;
    } else if (prec === 's') {
        timeStr = timeStr + ` ${d.getHours()}:${d.getMinutes()} ${d.getSeconds()}`;
    } else {
        timeStr = timeStr + ` ${d.getHours()}:${d.getMinutes()} ${d.getSeconds()}:${d.getMilliseconds()}`;
    }
    return timeStr;
}

export function getSceneName(id: GameId) {
    switch (id) {
        case GameId.JH: return "game-jh"
        case GameId.QZNN: return "game-qznn"
        case GameId.JDNN: return "game-jdnn"
        case GameId.BRNN: return "game-brnn"
        case GameId.DDZ: return "game-ddz"
        case GameId.HH: return "game-hh"
        case GameId.BY: return "game-by"
        case GameId.PDK: return "game-pdk"
        case GameId.LH: return "game-lh"
        case GameId.ERMJ: return "game-ermj"
        case GameId.DZPK: return "game-dzpk"
        case GameId.QHB: return "game-qhb"
    }
}