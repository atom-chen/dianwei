import * as util from "../common/util";
import { ErrCodes } from "../common/code";
import { addSingleEvent, getMoneyStr } from "../common/util";
import g from "../g";
import Pay from "./pay"

interface PayCfg {
    code: number;
    minMoney: string;
    maxMoney: string;
    moneyRange: number[];
    extra: string;
    channel?: string;
}

const { ccclass, property } = cc._decorator;

@ccclass
export default class PayPage extends cc.Component {

    @property(cc.Label)
    private lblRange: cc.Label = undefined;

    @property(cc.EditBox)
    private ebAmount: cc.EditBox = undefined;

    @property(cc.Button)
    private btnRecharge: cc.Button = undefined;

    @property(cc.Sprite)
    private spCenter: cc.Sprite = undefined;

    @property(cc.Label)
    private lblTip: cc.Label = undefined;

    @property(cc.Sprite)
    private spBg: cc.Sprite = undefined;

    @property(cc.Node)
    private moneys: cc.Node = undefined;

    @property(cc.Node)
    private cover: cc.Node = undefined;

    @property(cc.Label)
    private limit: cc.Label = undefined;

    @property(cc.Label)
    private SSSTips: cc.Label = undefined;

    @property(cc.Sprite)
    private spType: cc.Sprite = undefined;

    @property(cc.Node)
    private yunPayBt: cc.Node = undefined;
    public mPay: Pay = undefined;


    private payment: string = "";

    private defaultValues = [10, 49, 99, 199, 499, 999, 1999, 4999];//[49, 99, 499, 999, 1499, 1999, 2999, 4999]; // 11-17 据运营需求更改 下同
    private aliValues = [10, 49, 99, 199, 499, 999, 1999, 4999];//[50, 100, 200, 500, 1000, 2000, 5000, 10000];
    fixedAliValues: number[] = [50, 100, 200, 500, 1000, 2000, 5000, 10000];
    private values: number[];

    private btCount: number = 8;
    limitOtherChannelMaxMoney: number = undefined;

    private channel: string = undefined;

    init(payment: string, bg: cc.SpriteFrame, tip: string, bgColor: cc.Color, spType: cc.SpriteFrame) {
        this.payment = payment;
        this.spCenter.spriteFrame = bg;
        this.lblTip.string = tip;
        this.spBg.node.color = bgColor;
        this.spType.spriteFrame = spType;

        this.yunPayBt.active = false;
        if (payment === "yun_pay") {
            this.yunPayBt.active = true;
            this.spBg.node.active = false;
        }
    }

    protected onLoad() {
        let handler = new cc.Component.EventHandler();
        handler.target = this.node;
        handler.component = cc.js.getClassName(this);
        handler.handler = "pay";
        addSingleEvent(this.btnRecharge, handler);

        handler = new cc.Component.EventHandler();
        handler.target = this.node;
        handler.component = cc.js.getClassName(this);
        handler.handler = "onEditAmount";
        this.ebAmount.textChanged.push(handler);

        this.btnRecharge.enableAutoGrayEffect = true;

        this.ebAmount.maxLength = 6;
    }

    private _min: number;
    private _max: number;
    setRange(min: number, max: number) {
        this._min = min;
        this._max = max;
        this.lblRange.string = '' + max;
        this.ebAmount.placeholder = '充值金额，最低' + min + '元。';

        for (let index = this.moneys.childrenCount - 1; index > -1; index--) {
            if (this.values[index] > max || this.values[index] < min) {
                let money = this.moneys.children[index];
                money.getComponent(cc.Button).interactable = false;
                money.getComponentInChildren(cc.LabelOutline).color = cc.hexToColor("#7B7E86");
            }
        }
    }

    getCfg() {
        this.ebAmount.string = "";
        window.pomelo.request("lobby.billHandler.getPayDataByType", { type: this.payment }, (data: PayCfg) => {
            if (data.code === 200) {
                this.setType(data.moneyRange);
                if (data.channel) {
                    this.channel = data.channel;
                }
                if (this.payment === "ali_fix" || this.payment === "wx_fix") {
                    this.setRange(+data.minMoney, +data.maxMoney);
                } else {
                    let max = +data.maxMoney;
                    if (!!this.limitOtherChannelMaxMoney) {
                        max = Math.min(+data.maxMoney, this.limitOtherChannelMaxMoney);
                    }
                    this.setRange(+data.minMoney, max);
                }
            } else {
                util.showTip(ErrCodes.getErrStr(data.code, "请求配置失败"));
                if (data.code === 11005) {
                    this.mPay.resetCheck(this.payment);
                }
            }
        });
    }
    setType(moneyRange: number[]) {
        this.values = this.defaultValues;
        let name = this.payment;
        if (name === 'ali_pay') {
            this.values = this.aliValues;
            this.SSSTips.node.active = true;
        } else if (name === 'ali_fix' || name === 'wx_fix') {
            this.values = this.fixedAliValues;
            this.cover.active = true
            this.lblRange.node.active = false
            this.limit.string = '无法输入，请用按钮选取'
            this.SSSTips.node.active = true;
        } else if (name === 'ali_person') {
            this.SSSTips.node.active = true;
        } else {
            this.SSSTips.node.active = false;
        }

        if (moneyRange) {
            if (moneyRange.length === this.btCount) {
                this.values = moneyRange;
            } else if (moneyRange.length > 0 && moneyRange.length < this.btCount) {
                let val = moneyRange[moneyRange.length - 1];
                let lg = moneyRange.length;
                for (let i = 1; i <= this.btCount - lg; i++) {
                    moneyRange.push(val + 500 * i);
                }
                this.values = moneyRange;
            }
        }


        for (let i = 0; i < this.moneys.childrenCount && i < this.btCount; i++) {
            let money = this.moneys.children[i];
            money.getComponentInChildren(cc.Label).string = this.values[i] + '元';
            money.active = !!this.values[i]
        }

    }

    private onEditAmount(str: string) {
        let money = parseFloat(getMoneyStr(str));
        if (isNaN(money)) {
            return;
        }
        this.ebAmount.string = money.toString();
    }

    private onClickClear() {
        this.ebAmount.string = ''
    }

    private onClickMoney(ev: cc.Event.EventTouch) {
        this.ebAmount.string = this.values[this.moneys.children.indexOf(ev.target)].toString();
    }

    /*
    闪付1充值 https://api.9127pay.com/enterprise.html
    闪付2充值 https://mbpay.9127pay.com/payment/seller/login/index.html
    闪付3充值 https://pay.886pay.com/acct/detail/bm/YQQP/41dc/2018-04-21
    闪付4充值 https://xpay.886pay.com/xpay/query.html
    */
    private pay() {
        let edit = this.ebAmount;
        let type = this.payment;
        if (!this._checkVal(edit.string)) {
            // util.showTip("充值金额不正确");
            return;
        }
        // if (this.values === this.aliValues && +edit.string % 50) {   // 11-17 据运营需求更改金额已不满足该条件
        //     util.showTip(`支付宝充值金额只能为50的整数倍`);
        //     return;
        // }


        util.showLoading("请稍等");
        let deviceType = cc.sys.os === cc.sys.OS_IOS ? "ios" : "android";

        let sendData: any = {
            billPrice: edit.string,
            payType: type,
            deviceType: deviceType
        };
        if (this.channel) {
            sendData = {
                billPrice: edit.string,
                payType: type,
                deviceType: deviceType,
                channel: this.channel,
            };
        }
        let self = this;
        window.pomelo.request("lobby.billHandler.recharge",
            sendData
            , (data: {
                code: number;
                url?: string;
                errorCode?: string;
            }) => {
                if (data.code !== 200) {
                    util.hideLoading();
                    util.showTip(ErrCodes.getErrStr(data.code, "充值失败"));
                    if (data.code === 11004) {
                        self.getCfg();
                    } else if (data.code === 11005) {
                        this.mPay.resetCheck(this.payment);
                    }
                    return;
                }
                if (data.url) {
                    util.hideLoading();
                    util.goToUrl(data.url);
                } else if (data.errorCode) {
                    util.showTip("充值失败，第三方错误");
                }
            });
    }

    private showWebView(url: string) {
        if (cc.sys.os === cc.sys.OS_IOS) {
            let reslt = jsb.reflection.callStaticMethod("JsClass", "showWebview:", url);
            if (!reslt) {
                util.goToUrl(url);
            }
        } else if (cc.sys.os === cc.sys.OS_ANDROID) {
            let reslt = jsb.reflection.callStaticMethod("org/cocos2dx/javascript/JsClass", "showWebview", "(Ljava/lang/String;)Z", url);
            if (!reslt) {
                util.goToUrl(url);
            }
        } else {
            util.goToUrl(url);
        }
    }

    private _checkVal(val: string) {
        let money = parseFloat(getMoneyStr(val));
        // if (!(money >= this._min && money <= this._max && money.toString().indexOf(".") < 0))
        //     return false;

        if (money < this._min) {
            util.showTip("充值金额不得小于" + this._min + "元");
            return false;
        }
        if (money > this._max) {
            util.showTip("充值金额不得大于" + this._max + "元");
            return false;
        }
        if (money.toString().indexOf(".") >= 0) {
            util.showTip("充值金额需为整数");
            return false;
        }
        return val && !isNaN(+val) && +val >= 10 && val.indexOf(".") === -1;
    }

    openYunPayDownloadUrl() {
        if (cc.sys.os === cc.sys.OS_IOS) {
            cc.sys.openURL("https://itunes.apple.com/cn/app/id600273928?mt=8");
        } else {
            cc.sys.openURL("https://youhui.95516.com/hybrid_v3/html/help/download.html");
        }
    }
}
