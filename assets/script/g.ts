import itemNames from "./common/itemNames";

// 退出游戏后展示
export const enum QUITSHOW {
    SHOWBANK,   // 展示银行界面
    SHOWRECHARGE,  // 展示充值界面
    NOSHOW   // 不展示其他洁面
}
/**
 * 开发状态列表
 */
const enum DEV_STATUS {
    OFFICIAL,   // 正式
    LOCAL_DEV,  // 内网
    OUT_DEV,    // 外网
    REVIEW      // 美服
}

/**
 * 本地服务器列表
 */
const enum LOC_SERVER {
    AG = "ws://192.168.3.99:5101",  // 阿贵
    LJ = "ws://192.168.1.175:5101",  // 雷杰
}


class GlobalVal {
    // 修改当前开发状态
    _dev = DEV_STATUS.OFFICIAL;

    // 本地连接地址
    _loc = LOC_SERVER.LJ;
    //调取不同的网络
    get review() {
        return this._dev === DEV_STATUS.REVIEW;
    }

    get outDev() {
        return this._dev === DEV_STATUS.OUT_DEV;
    }
    get localDev() {
        return this._dev === DEV_STATUS.LOCAL_DEV;
    }

    _bundleId: string;
    /**
     * 获取包名
     *
     * @export
     * @returns
     */
    //获取bundleId函数
    get bundleId(): string {
        if (!this._bundleId) {
            if (!cc.sys.isNative) {
                this._bundleId = "com.mh.mh";
            } else if (cc.sys.os === cc.sys.OS_IOS) {
                this._bundleId = jsb.reflection.callStaticMethod("JsClass", "getBundleID");
            } else if (cc.sys.os === cc.sys.OS_ANDROID) {
                this._bundleId = jsb.reflection.callStaticMethod("org/cocos2dx/javascript/JsClass", "getBundleID", "()Ljava/lang/String;");
            }
        }
        return this._bundleId;
    }

    _appVer: string;
    /**
     * 获取app版本
     *
     * @export
     * @returns
     */
    get appVer(): string {
        //isNative判断是不是native平台，如果打包的是jsb那就是ture。其他的就是false
        if (!cc.sys.isNative) return "";
        //版本为空，进行版本获取
        if (!this._appVer) {
            // TODO: 从原生获取版本
            let os = cc.sys.os;
            if (os === cc.sys.OS_ANDROID) {
                this._appVer = jsb.reflection.callStaticMethod("org/cocos2dx/javascript/JsClass", "getAppVersion", "()Ljava/lang/String;");
            } else if (os === cc.sys.OS_IOS) {
                this._appVer = jsb.reflection.callStaticMethod("JsClass", "getAppVersion");
            } else if (os === cc.sys.OS_OSX || os === cc.sys.OS_WINDOWS) {
                this._appVer = "0.5";
            }
        }
        g.debugInfo = "app ver : " + this._appVer + " os:" + cc.sys.os;
        return this._appVer;
    }

    //端口的设置
    _hotVer: string;
    get hotVer(): string {
        return this._hotVer || "";
    }

    set hotVer(ver: string) {
        this._hotVer = ver;
    }
    // 多平台
    _pid: string = "B";
    get pid(): string {
        return this._pid;
    }

    /**
     * 复制官网，服务器发送lobby.lobbyHandler.getWeb
     * 如果是空，读取默认值
     */
    _serviceCfg = {
        web: "https://txon.xjssrsfw.com",
        weChat: '',
        qq: '2958104462',
        rechargeQuestionUrl: "https://fqnrg.guangyqp.com",
    }

    _vip = {
        web: "https://fqnrg.guangyqp.com",
        isvip: false,
        weChat: "",
        info: 0,
        dailyNotify: "",
    }

    _vipinfo = {
        _newVipNotify: {
            content: "",
            id: "",
        },
        _notifyPush: {
            content: "",
            id: "",
        },
        _wxChangeNotice: {
            content: "",
            id: "",
        },
    }

    set serviceCfg(data) {
        if (data.web)
            this._serviceCfg.web = data.web;
        if (data.weChat)
            this._serviceCfg.weChat = data.weChat;
        if (data.qq)
            this._serviceCfg.qq = data.qq;
        if (data.rechargeQuestionUrl)
            this._serviceCfg.rechargeQuestionUrl = data.rechargeQuestionUrl;
    }

    get serviceCfg() {
        let strWeb: string = localStorage.getItem(itemNames.officialUrl);
        let strWx: string = localStorage.getItem(itemNames.weChat);
        let strQq: string = localStorage.getItem(itemNames.qq)
        if (strWeb && strWeb !== 'undefined') {
            this._serviceCfg.web = strWeb;
        }
        if (strWx && strWx !== 'undefined') {
            this._serviceCfg.weChat = strWx;
        }
        if (strQq && strQq !== 'undefined') {
            this._serviceCfg.qq = strQq;
        }
        return this._serviceCfg;
    }

    get apkDownloadUrl() {
        let web = this._serviceCfg.web;
        if (web.lastIndexOf('/') === web.length - 1) {
            return `${web}apk`;
        } else {
            return `${web}/apk`;
        }
    }

    private _domainName = "";
    get domainName() {
        return this._domainName;
    }
    set domainName(domain: string) {
        this._domainName = domain;
    }

    get domainNames() {
        if (this._dev === DEV_STATUS.LOCAL_DEV) {
            return [["http://192.168.1.9/client/alocal/"]];
        } else if (this._dev === DEV_STATUS.OUT_DEV) {
            return [["https://test.zfgame888.com/"]];
        } else if (this._dev === DEV_STATUS.OFFICIAL || this._dev === DEV_STATUS.REVIEW) {
            return [
                ["http://47.112.12.41:21827/", "http://47.112.21.21:21827/"],
                ["http://47.98.46.250:21827/", "http://47.244.132.103:21827/"],
                ["https://update.bzxxkj.com/", "https://update.fjjysb.com/"],
                ["https://update.zqymqq.com/", "https://update.cashpp.com/"],
            ];
        }
    }
    /**
     * 所有包通用配置地址，包含服务器是否在维护
     */
    get commonUrl() {
        return "json/common.json";
    }
    /**
     * 此包私有配置地址,包含是否在审核、包版本
     */
    get appVerUrl() {
        if (this._dev === DEV_STATUS.LOCAL_DEV || this._dev === DEV_STATUS.OUT_DEV) {
            return "json/test_version.json";
        } else if (this._dev === DEV_STATUS.OFFICIAL || this._dev === DEV_STATUS.REVIEW) {
            let bundle = this.bundleId;
            if (!bundle) {
                bundle = "ver";
            }
            return `json/${bundle}.json`;
        }
    }

    _defaultIp: string[] = [
        "120.78.120.112:27890",
        "47.97.208.141:27890",
        "47.52.170.139:27890",
        "47.93.14.192:27890",
        "59.153.74.52:27890",
        "36.250.14.7:27890"
    ];
    get defaultIp() {
        return this._defaultIp;
    }
    get gameServers() {
        if (this._dev === DEV_STATUS.LOCAL_DEV) {
            return [this._loc];
        } else if (this._dev === DEV_STATUS.OUT_DEV) {
            //return ["183.61.126.200:5101"] // 一部
            return ['121.201.122.224:5101']   // 二部
        } else if (this._dev === DEV_STATUS.REVIEW) {
            return ["iosaudit.youdayl.com:5101"];
        } else if (this._dev === DEV_STATUS.OFFICIAL) {
            let str = cc.sys.localStorage.getItem(itemNames.ipList);
            if (str) {
                try {
                    let list: string[] = JSON.parse(str);
                    if (list && list.length > 0) {
                        return list;
                    } else {
                        return this._defaultIp;
                    }
                } catch (error) {
                    return this._defaultIp;
                }
            } else {
                return this._defaultIp;
            }
        }
    }


    lobbyLoaded = false;
    /**
     * 苹果审核屏蔽
     */
    shield = false;
    // audio = false;

    hotUpdate = false;

    lobby = {
        isShowBind: true,
        shouldShowBulletinBoard: false,
        currBgmClip: "",
        showShopPackage: true
    };

    firstLoading = true;

    lastGame = "";

    saveGameList: { gid: string, idx: number, active: number }[];
    saveGameRoomList: {
        [gameName: string]: {
            id?: string;
            idx: number;
            color: number;
            bets: string;
            minMoney: string;
            maxMoney: string;
            jokerAs?: number;
            hasMagic?: number;
            change3Pai?: number;
            hasJoker?: number;
            brnnMaxBoost?: number;
            allInMaxMoney?: string;
            fanMaxLimit?: number;
        }[]
    } = {};

    get lobbyScene() {
        return "lobby";
    }
    errorMsg: string;

    _debugInfo: string = "";
    set debugInfo(info: string) {
        if (!info) return;
        let d = new Date();
        let timeStr = `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${d.getMinutes()} ${d.getSeconds()}:${d.getMilliseconds()}`;
        info = timeStr + "  " + info;
        cc.log(info);
        this._debugInfo = this._debugInfo + "\n" + info;
    }
    get debugInfo() {
        return this._debugInfo;
    }

    _channel: string = "";

    set channel(s: string) {
        this._channel = s || "";
    }
    get channel() {
        return this._channel;
    }

    loginTips: string[] = [
        "超多惊喜，超多奖励，场次多多，任你选择！",
        "登录送金，绑定再送金！",
        "万人在线，真人对战！",
        "多样竞技，激情对战，把握时机，加大下注！"
    ]

    act: string;
    pwd: string;

    /// for game temprary
    uname: string;
    masterId: number;
    roomId: number;

    chgPwdTime: number;
    chgBankPwdTime: number;

    complainTime: number;
    bindTime: number;

    loginTime: number;

    showRegister: boolean;

    appId: string;

    payEnforceData: any;

    // 兑换限制
    withdrawCardMin: string;
    withdrawCardMax: string;
    withdrawSSSMin: string;
    withdrawSSSMax: string;

    curQiutShow: QUITSHOW = QUITSHOW.NOSHOW;

    //客服界面判断
    CustomerJudge: boolean = false;

    //活动按钮显隐判断
    eventsActive: boolean = false;

    // ios推送上传设备token开关
    iosPushSwitch: boolean = true;
    // ios上传设备token网址
    iosPushUrl: string = "https://fqnrg.guangyqp.com/s/uploadDeviceToken";

    needIsUpdate: number = 0;//是否更新
    updateTitel: string = "undefined";//标题
    updateContent: string = "undefined";//内容
    updateUrl: string = "undefined";//链接
}

let g = new GlobalVal();
export default g;
