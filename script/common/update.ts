import g from "../g";
import ItemNames from "./itemNames";
import { getJsonData, hideLoading, showConfirm, showLoading } from "./util";

export enum UPDATE_STATUS {
    NO,
    MAINTAIN,
    UPDATE,
}

export async function checkUpdatable(loadingStr?: string) {
    if (!CC_JSB) {
        return UPDATE_STATUS.NO;
    }
    let cmpRes: number;
    let TOTAL_TIMES = 2;
    if (g.review)
        TOTAL_TIMES = 99;
    let autoRetryCount = TOTAL_TIMES;
    let ok = false;
    while (!ok) {
        g.debugInfo = "check updatable, remain times:" + autoRetryCount;

        let testUrls = g.domainNames;
        let testIdx = 0;
        while (testIdx < testUrls.length) {
            cc.log("testIdx ======" + testIdx);
            let requests = await getJsonData(testUrls[testIdx]);
            if (requests) {
                cc.log("*************** 请求2个json文件 over *****************")
                let commonData: { maintain: boolean, desc: string, cs: string, hotUpdate: boolean } = requests[0];
                let appVerData: { appVer: string, appId: string } = requests[1];

                g.debugInfo = "commonUrl: " + JSON.stringify(commonData);
                g.debugInfo = "appVerData: " + JSON.stringify(appVerData);
                if (!commonData.hotUpdate) {
                    g.debugInfo = "***************common not hotUpdate";
                    return UPDATE_STATUS.NO;
                }

                let devFlag = cc.sys.localStorage.getItem(ItemNames.devFlag);
                if (commonData.maintain === true && !devFlag) {
                    hideLoading();
                    let desc = commonData.desc || "服务器维护中，请稍后登录。";
                    let s = showConfirm(desc, "确定", "取消");
                    s.okFunc = cc.game.end;
                    return UPDATE_STATUS.MAINTAIN;
                }
                g.debugInfo = "remote appVer: " + appVerData.appVer + " " + appVerData.appId + " " + g.appVerUrl;
                g.appId = appVerData.appId;
                cmpRes = verCmp(g.appVer, appVerData.appVer);
                g.debugInfo = "local appVer vs remote appVer: " + cmpRes;
                ok = true;
                break;
            } else {
                testIdx++;
            }
        }

        //自动重试几次后，提示用户点击再重试
        if (--autoRetryCount < 1 && !ok) {
            hideLoading();
            await showRetry();
            if (loadingStr) {
                showLoading(loadingStr);
            }
            autoRetryCount = TOTAL_TIMES;
        }
    }
    // 小于0，需要冷更新。
    if (cmpRes < 0) await coldUpdate();


    let chkHotUpdate = true;
    // 检查，审核版本，是否需要检查热更新。
    if (cmpRes > 0) {
        chkHotUpdate = false;
    }
    g.hotUpdate = chkHotUpdate;
    if (chkHotUpdate) return UPDATE_STATUS.UPDATE;
    return UPDATE_STATUS.NO;
}


function showRetry() {
    cc.log("show retry");
    return new Promise(resolve => {
        let str = `亲，当前网络环境稍差，点击确定重试。\n${g.errorMsg}`;
        let s = showConfirm(str, "确定", "取消");
        s.okFunc = () => {
            resolve();
        };
    });
}

export async function coldUpdate() {
    g.debugInfo = "cold update go";
    // 去冷更新
    return new Promise<boolean>(resolve => {
        hideLoading();
        let s = showConfirm(`检测到有新版本，为了提升游戏体验，强烈推荐您确认更新！`, "确定", "取消");
        s.okFunc = () => {
            if (cc.sys.os === cc.sys.OS_IOS) {

                //如果配的是url
                if (g.appId && g.appId.toString().indexOf('http') >= 0) {
                    cc.sys.openURL(g.appId)
                } else {
                    //否则打开商店
                    jsb.reflection.callStaticMethod("JsClass",
                        "openAppWithIdentifier:",
                        g.appId);
                }

            } else if (cc.sys.os === cc.sys.OS_ANDROID) {
                cc.sys.openURL(g.apkDownloadUrl);
                cc.game.end();
            }
            resolve(true);
        }
        s.cancelFunc = () => {
            resolve(false);
        }
    });
}

/**
 * 比较两个版本号
 * @returns {number} 1:a>b   0 a=b   -1 a<b
 */
export function verCmp(ver1: string, ver2: string) {
    g.debugInfo = "va:" + ver1 + "-vb:" + ver2;
    let vA = ver1.split(".");
    let vB = ver2.split(".");
    for (let i = 0; i < vA.length; ++i) {
        let a = parseInt(vA[i]);
        let b = parseInt(vB[i] || "0");
        if (a === b) continue;
        else return a - b;
    }
    if (vB.length > vA.length) return -1;
    else return 0;
}
