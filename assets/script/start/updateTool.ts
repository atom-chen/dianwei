import ItemNames from "../common/itemNames";
import g from "../g";
import { showConfirm, hideLoading } from "../common/util";
import { verCmp } from "../common/update";

enum HANDLER_STATUS {
    Failure = 0,
    Newest,
    Do,
}

export class UpdateTool {
    private updating: boolean;
    private checkListener: cc.EventListener;
    private updateListener: cc.EventListener;
    private assetsMgr: jsb.AssetsManager;
    private canRetry: boolean;
    overHandler: Function;
    showVer: (ver: string) => void;
    infoHandler: (info: string) => void;
    progressHandler: (num: number) => void;
    checkNewHandler: (cb: (update: boolean) => void) => void;
    private _progress = 0;
    private currUrl = "";
    get progress() {
        if (isNaN(this._progress)) {
            return 0;
        }
        return this._progress;
    }
    private _valid = true;
    get valid() {
        return this._valid;
    }
    constructor(private manifest: string | jsb.Manifest, private relativePath = "", private mainGame = false, private autoRetry = false) {
        this.hotInit();
        let regex = /^http(s)?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}/;
        let a = g.domainName.split(".");
        let d = "";
        // ip还是域名
        if (regex.test(g.domainName)) {
            d = `${a[a.length - 1].substring(0, 3)}`;
        } else {
            d = `${a[a.length - 2]}`;
        }
        this.currUrl = d;
    }

    get storagePath() {
        return (jsb.fileUtils ? jsb.fileUtils.getWritablePath() : '/') + this.relativePath;
    }

    private hotInit() {
        cc.log("*****hotInit");
        this.canRetry = false;
        if (!cc.sys.isNative) {
            cc.log("** HU 不可用 (仅原生APP) **");
            return;
        }

        // 冷更新清除缓存
        let localPath = this.storagePath;
        g.debugInfo = "local path: " + localPath;
        if (this.mainGame) {
            let ver = localStorage.getItem(ItemNames.localVer);
            g.debugInfo = "local ver = " + ver;
            if (!ver || ver !== g.appVer) {
                localStorage.setItem(ItemNames.localVer, g.appVer);
                if (ver && ver !== g.appVer) {
                    // 大版本更新则先删除更新目录，再更新paths
                    g.debugInfo = " ** cold update";
                    if (jsb.fileUtils.removeDirectory(localPath)) {
                        g.debugInfo = " ** remove local path ok";
                        localStorage.setItem(ItemNames.searchPaths, "");
                        jsb.fileUtils.setSearchPaths([]);
                    }
                }
            }
        }

        // 修改热更新域名
        let manifestStr = jsb.fileUtils.getStringFromFile(`${localPath}/project.manifest`);
        if (manifestStr) {
            // 只要热更新过就会执行，通过前面筛选出来的最快域名来当作热更新的域名
            let manifestJson = JSON.parse(manifestStr);
            g.debugInfo = " curr packageUrl " + manifestJson.packageUrl;

            manifestJson.packageUrl = `${g.domainName}client/`;
            manifestJson.remoteManifestUrl = `${manifestJson.packageUrl}project.manifest`;
            manifestJson.remoteVersionUrl = `${manifestJson.packageUrl}version.manifest`;

            let customManifestStr = JSON.stringify(manifestJson);
            let isSuc = jsb.fileUtils.writeStringToFile(customManifestStr, `${localPath}/project.manifest`);
            g.debugInfo = " is write = " + isSuc;
        } else {
            g.debugInfo = "no local this.manifest";
        }
        g.debugInfo = " fastest packageUrl " + g.domainName;

        this.assetsMgr = new jsb.AssetsManager("", localPath);
        // Init with empty manifest url for testing custom manifest
        cc.log("-- HOTUPDATE 本地路径:", localPath);

        // 设置版本比较方法
        this.assetsMgr.setVersionCompareHandle(verCmp);

        if (!cc.macro.ENABLE_GC_FOR_NATIVE_OBJECTS) {
            this.assetsMgr.retain();
        }

        // let panel = this.panel;
        // Setup the verification callback, but we don"t have md5 check function yet, so only print some message
        // Return true if the verification passed, otherwise return false
        this.assetsMgr.setVerifyCallback((path, asset) => {
            let dataPath = jsb.fileUtils.getDataFromFile(path);
            let code = md5(dataPath);
            if (code === asset.md5) {
                return true;
            }
            g.debugInfo = "MD5 ERR:" + asset.path + " \n remote:" + asset.md5 + " \n download:" + code;
            return false;
        });

        if (cc.sys.os === cc.sys.OS_ANDROID) {
            this.assetsMgr.setMaxConcurrentTask(2);
        }
        g.debugInfo = "热更新准备好了";
    }

    private release() {
        cc.log("*****hotRelease");
        g.debugInfo = "hot release";
        if (!cc.sys.isNative) {
            return;
        }
        this._valid = false;
        if (this.updateListener) {
            cc.eventManager.removeListener(this.updateListener);
            this.updateListener = undefined;
        }
        if (this.checkListener) {
            cc.eventManager.removeListener(this.checkListener);
            this.checkListener = undefined;
        }
        if (this.assetsMgr && !cc.macro.ENABLE_GC_FOR_NATIVE_OBJECTS) {
            this.assetsMgr.release();
        }
    }

    /**
     * 检查是否有热更新资源 undefined:有错误;true:有更新需要更新;false:已经最新.
     * @returns undefined:有错误;true:有更新需要更新;false:已经最新.
     */
    start() {
        cc.log("*****hotCheck");
        if (!cc.sys.isNative) {
            cc.warn("no native, no check");
            return;
        }
        if (this.updating) {
            this.showInfo("正在更新中…");
            g.debugInfo = "** 正在更新中 0 …";
            return;
        }


        this.showInfo("检查版本");
        g.debugInfo = "** 检查版本 1 start";

        if (this.assetsMgr.getLocalManifest()) {
            g.debugInfo = "** have getLocalManifest";
        } else {
            g.debugInfo = "** not have getLocalManifest";
        }

        if (!this.assetsMgr.getLocalManifest() && this.assetsMgr.getState() === jsb.AssetsManager.State.UNINITED) {
            this.showInfo("载入清单文件");
            g.debugInfo = "** 载入清单文件";
            if (typeof this.manifest === "string") {
                g.debugInfo = "this.manifest string 1";
                // 如果本地有文件来则不是第一次进入游戏
                if (jsb.fileUtils.getStringFromFile(`${this.storagePath}/project.manifest`)) {
                    g.debugInfo = "this.manifest string 11";
                    // 实际上不能修改本地manifest内容，但不执行这步操作LocalManifest就获取不到
                    this.assetsMgr.loadLocalManifest(this.manifest);
                } else {
                    // 第一次进入游戏时，自定义构造manifest文件内容并存入本地
                    g.debugInfo = "this.manifest string 12";

                    let manifestStr = jsb.fileUtils.getStringFromFile(this.manifest);
                    let manifestJson = JSON.parse(manifestStr);
                    g.debugInfo = " curr packageUrl " + manifestJson.packageUrl;

                    manifestJson.packageUrl = `${g.domainName}client/`;
                    manifestJson.remoteManifestUrl = `${manifestJson.packageUrl}project.manifest`;
                    manifestJson.remoteVersionUrl = `${manifestJson.packageUrl}version.manifest`;

                    let newManifest = new jsb.Manifest(JSON.stringify(manifestJson), this.storagePath);
                    this.assetsMgr.loadLocalManifest(newManifest, this.storagePath);
                }
            } else {
                g.debugInfo = "this.manifest string 2";
                this.assetsMgr.loadLocalManifest(this.manifest, this.storagePath);
            }
        }
        let localManifest = this.assetsMgr.getLocalManifest();
        g.hotVer = localManifest.getVersion();
        g.debugInfo = "g.hotVer = " + g.hotVer;
        g.debugInfo = "** 热更新地址 = " + localManifest.getPackageUrl();
        this.showVer(g.hotVer);

        if (!localManifest || !localManifest.isLoaded()) {
            this.showInfo("** 载入清单文件失败了");
            g.debugInfo = "** 载入清单文件失败了";
            return;
        }

        if (!this.checkListener) {
            g.debugInfo = "add checkListener";
            this.checkListener = <cc.EventListener>new jsb.EventListenerAssetsManager(this.assetsMgr, this.checkHandler.bind(this));
            cc.eventManager.addListener(this.checkListener, 1);
        }

        this.assetsMgr.checkUpdate();
        this.showInfo("检查更新资源");
        g.debugInfo = "** 检查更新资源 2 ready";
    }

    private hotUpdate() {
        cc.log("*****hotUpdate");
        if (!cc.sys.isNative) {
            return;
        }

        if (this.updating) {
            g.debugInfo = "** 已经在更新中，不能反复更新！（UPDATE）";
            return;
        }
        this.showProgress(0);

        this.showInfo("资源更新中…");
        g.debugInfo = "UPDATE START(1)!!!";

        if (this.assetsMgr.getState() === jsb.AssetsManager.State.UNINITED) {
            if (typeof this.manifest === "string") {
                this.assetsMgr.loadLocalManifest(this.manifest);
            } else {
                this.assetsMgr.loadLocalManifest(this.manifest, this.storagePath);
            }
        }

        if (!this.updateListener) {
            this.updateListener = <cc.EventListener>new jsb.EventListenerAssetsManager(this.assetsMgr, this.updateHandler.bind(this));
            cc.eventManager.addListener(this.updateListener, 1);
        }

        this.assetsMgr.update();
        this.updating = true;
        g.debugInfo = "UPDATE START(2)!!! ready";
    }

    private async hotRetry() {
        cc.log("*****hotRetry");
        if (!cc.sys.isNative) {
            return;
        }
        if (!this.updating) {
            if (this.canRetry) {
                this.showInfo("重试资源更新");
                g.debugInfo = "** 重试资源更新！";
                await this.showRetry();
                this.assetsMgr.downloadFailedAssets();
            } else {
                // 没有发现本地清单文件或下载清单文件失败
                g.debugInfo = "** 更新重试，加载清单错造成。"
            }
        }
    }

    private showRetry() {
        cc.log("show retry");
        if (this.autoRetry) {
            return;
        }
        return new Promise(resolve => {
            hideLoading();
            let str = `亲，当前网络环境稍差，点击确定重试。\n${g.errorMsg}`;
            let s = showConfirm(str);
            s.okFunc = () => {
                s.close();
                resolve();
            };
        });
    }

    private async checkHandler(event: jsb.EventAssetsManager) {
        cc.log("*****checkHandler");
        let code = event.getEventCode();
        let ret: HANDLER_STATUS;
        g.debugInfo = "** checkHandler code = " + code;
        switch (code) {
            case jsb.EventAssetsManager.ERROR_NO_LOCAL_MANIFEST:
                this.showInfo("没有找到本地文件列表");
                g.debugInfo = "** 没有找到本地文件列表";
                ret = HANDLER_STATUS.Failure;
                break;
            case jsb.EventAssetsManager.ERROR_DOWNLOAD_MANIFEST:
                this.showInfo("下载清单文件错。");
                g.debugInfo = "** 下载清单文件错";
                ret = HANDLER_STATUS.Failure;
                break;
            case jsb.EventAssetsManager.ERROR_PARSE_MANIFEST:
                this.showInfo("解析清单文件错。");
                g.debugInfo = "** 解析清单文件错";
                ret = HANDLER_STATUS.Failure;
                break;
            case jsb.EventAssetsManager.ALREADY_UP_TO_DATE:
                this.showInfo("已经是最新版本了。");
                g.debugInfo = "** 已经是最新版本了。";
                ret = HANDLER_STATUS.Newest;
                break;
            case jsb.EventAssetsManager.NEW_VERSION_FOUND:
                this.showInfo("检测到新版本");
                g.debugInfo = "** 检测到新版本";
                ret = HANDLER_STATUS.Do;
                break;
            default:
                g.debugInfo = "** CHECK UPDATE Code(没处理):" + code;
                return;
        }

        g.debugInfo = "** checkCompleted1";
        if (ret === HANDLER_STATUS.Failure) {
            await this.showRetry();
            this.start();
        } else if (ret === HANDLER_STATUS.Newest) {
            this.beginLogin();
        } else if (ret === HANDLER_STATUS.Do) {
            if (typeof this.checkNewHandler === "function") {
                this.checkNewHandler(update => {
                    if (update) {
                        this.hotUpdate();
                    }
                });
            } else {
                this.hotUpdate();
            }
        }

        if (this.checkListener) {
            g.debugInfo = "** removeListener checkListener";
            cc.eventManager.removeListener(this.checkListener);
            this.checkListener = undefined;
        }
        g.debugInfo = "** checkCompleted2";
    }

    private updateHandler(event: jsb.EventAssetsManager) {
        cc.log("*****updateHandler");
        let code = event.getEventCode();
        let ret: HANDLER_STATUS;
        // g.debugInfo = "UPDATE Code:" + code;
        switch (code) {
            case jsb.EventAssetsManager.ERROR_NO_LOCAL_MANIFEST:
                this.showInfo("没有发现本地清单文件！");
                ret = HANDLER_STATUS.Failure;
                break;
            case jsb.EventAssetsManager.UPDATE_PROGRESSION:
                if (event.getPercent())
                    this.showProgress(event.getPercent());
                let msg = event.getMessage();
                if (msg) {
                    setTimeout(() => {
                        g.debugInfo = "Updated Total files: " + event.getTotalFiles() + "  Total size: " + event.getTotalBytes();
                    }, 0);
                }
                return;
            case jsb.EventAssetsManager.ERROR_DOWNLOAD_MANIFEST:
            case jsb.EventAssetsManager.ERROR_PARSE_MANIFEST:
                this.showInfo("下载清单文件失败.");
                g.debugInfo = "下载清单文件失败";
                ret = HANDLER_STATUS.Failure;
                break;
            case jsb.EventAssetsManager.ALREADY_UP_TO_DATE:
                this.showInfo("已经最新版本了.");
                g.debugInfo = "** 已经最新版本了";
                ret = HANDLER_STATUS.Newest;
                break;
            case jsb.EventAssetsManager.UPDATE_FINISHED:
                this.showInfo("更新完成。");
                g.debugInfo = "** 更新完成" + event.getMessage();
                ret = HANDLER_STATUS.Do;
                this.showProgress(1);
                break;
            case jsb.EventAssetsManager.UPDATE_FAILED:
                this.showInfo("更新失败。");
                g.debugInfo = "** 更新失败 " + event.getMessage();
                this.canRetry = true;
                ret = HANDLER_STATUS.Failure;
                break;
            case jsb.EventAssetsManager.ERROR_UPDATING:
                g.debugInfo = "ERROR_UPDATING " + event.getAssetId() + ", " + event.getMessage();
                g.errorMsg = this.currUrl + ":" + event.getAssetId() + ", " + event.getMessage();
                return;
            case jsb.EventAssetsManager.ERROR_DECOMPRESS:
                // g.debugInfo = "ERROR_DECOMPRESS " + event.getMessage();
                return;
            default:
                // g.debugInfo = "UPDATE Code:(未处理)" + code;
                return;
        }

        g.debugInfo = "** updated end1";
        if (ret === HANDLER_STATUS.Failure) {
            g.debugInfo = "** 更新 失败";
            this.updating = false;
            this.hotRetry();
        } else if (ret === HANDLER_STATUS.Newest || (!this.mainGame && ret === HANDLER_STATUS.Do)) {
            this.beginLogin();
        } else if (ret === HANDLER_STATUS.Do) {
            if (this.updateListener) {
                cc.eventManager.removeListener(this.updateListener);
                this.updateListener = undefined;
            }

            if (this.mainGame) {
                this.showInfo("准备重启游戏");
                g.debugInfo = "准备重启游戏";
                // Prepend the manifest"s search path
                let paths = jsb.fileUtils.getSearchPaths();
                let path = this.assetsMgr.getLocalManifest().getSearchPaths();

                g.debugInfo = " ** searchPaths before: " + paths.toString();
                paths = path.concat(paths);
                g.debugInfo = " ** searchPaths after: " + paths.toString();
                localStorage.setItem(ItemNames.searchPaths, JSON.stringify(paths));
                jsb.fileUtils.setSearchPaths(paths);
                localStorage.setItem(ItemNames.hotUpdateTime, (new Date()).getTime().toString());

                cc.audioEngine.stopAll();
                cc.game.restart();
            }
            this.release();
        }
        g.debugInfo = "** updated end2";
    }

    private beginLogin() {
        this.release();
        cc.log("over");
        if (typeof this.overHandler === "function") {
            this.overHandler();
        }
    }

    private showInfo(info: string) {
        if (typeof this.infoHandler === "function") {
            this.infoHandler(info);
        }
    }

    private showProgress(pro: number) {
        this._progress = pro;
        if (typeof this.progressHandler === "function") {
            this.progressHandler(pro);
        }
    }
}