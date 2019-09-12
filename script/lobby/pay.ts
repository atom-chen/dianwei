import { UserInfo, Where, User } from "../common/user";
import * as util from "../common/util";
import { ErrCodes } from "../common/code";
import PayPage from "./payPage";
import Lobby from "../lobby/lobby";
import CardList from "./cardList";
import g from "../g";
import PopActionBox from "./popActionBox"
import AgentChat from "./agentChat";
import AgentList from "./agentList";
import agentUtil from "./agentUtil"

const { ccclass, property } = cc._decorator;

interface PayTypes {
    name: string;
    minMoney: number;
    maxMoney: number;
}

interface RechargeEnforce {
    srTimesLLmit: number,                   //成功充值次数限制
    srTotalLLimit: string,                  //成功充值总金额限制
    srOnlyShowAgentRate: string,            //只显示代理几率
    srConNoBillTimes: number,               //连续展示几次代理但是不充值降低几率的次数
    srDecRate: string,                      //连续展示几次代理但是不充值降低记录的几率
    saOnlyShowAgentRate: string,            //代理充值成功过的玩家只展示代理的几率
    saConNoBillTimes: number,               //代理充值成功过的玩家只展示代理连续打开几次代理不充值降低几率的次数
    saDecRate: string,                      //代理充值成功过的玩家只展示代理连续代开几次代理不充值降低几率的几率
    perACIncRate: string,                   //玩家代理充值成功一次增加
    limitOtherChannelMaxMoney: number,     //是否限制其他充值方式最高金额
    otherChannelMaxMoney: string,           //其他充值方式最高金额

}

interface PayEnforceData {
    code: number;
    payEnforce: number;
    payTypes?: {
        idx: number,
        type: string,
    }[];
    onlineRechargeOKTimes?: number;
    onlineRecharge?: string;
    agentOKTimes?: number;
    re: RechargeEnforce;
    locationRule?: LocationRechargeRule;
    agentVipSwitch?: number,
    banVip?: number;
    newAgentSwitch: boolean,
    vipSwitch?: number,
    rechargeMsgs?:{
        type: number;
        content: string;
    }[];
}


interface LocationRechargeRule {
    rechargeOnline: number,
    rechargePerson: number, // 个人zfb
    rechargeAgent: number,
}

@ccclass("PayData")
class PayData {
    @property()
    payment: string = "";

    @property()
    title: string = "";

    @property(cc.SpriteFrame)
    titleSpri: cc.SpriteFrame = undefined;

    @property(cc.SpriteFrame)
    iconFocus: cc.SpriteFrame = undefined;

    @property(cc.SpriteFrame)
    bg: cc.SpriteFrame = undefined;

    @property(cc.Color)
    bgColor: cc.Color = cc.Color.WHITE;

    @property()
    tip: string = "";


}

let showTimes = 0;
let wantPayTimes = 0;

const Person_Recharge = "ali_person";

@ccclass
export default class Pay extends PopActionBox {
    @property(AgentChat)
    agentChat: AgentChat = undefined;

    @property(AgentList)
    agentList: AgentList = undefined;

    @property(cc.ToggleContainer)
    private tgRecharge: cc.ToggleContainer = undefined;

    @property([PayData])
    private recharges: PayData[] = [];

    @property(cc.Node)
    private noRecharge: cc.Node = undefined;

    @property(cc.Node)
    private nodeRight: cc.Node = undefined;

    @property(cc.Node)
    private leftList: cc.Node = undefined;

    @property(cc.Node)
    private itemLeft: cc.Node = undefined;

    @property(cc.Node)
    private itemRight: cc.Node = undefined;

    @property(cc.Node)
    private cardTog: cc.Node = undefined;
    @property(CardList)
    private cardList: CardList = undefined;

    @property(cc.Label)
    private lblMyID: cc.Label = undefined;

    @property(cc.Node)
    private officialRecharge: cc.Node = undefined;

    @property(cc.Node)
    private vipRecharge: cc.Node = undefined; 

    @property(cc.Node)
    private recommend: cc.Node = undefined;

    @property(cc.Node)
    private notification: cc.Node = undefined;

    @property(cc.Button)
    private notificatbtn: cc.Button = undefined;

    @property(cc.RichText)
    private notifictext: cc.RichText = undefined;

    private locationRule: LocationRechargeRule;
    private showAgent: boolean;

    private canShowChat: boolean = false;

    private isnotific:boolean = false;

    public limitOtherChannelMaxMoney: number = undefined;

    protected onLoad() {
        super.onLoad();
        this.checkAgentChat();
        this.showAgent = true;

        this.leftList.active = false
    }

    start() {
        this.lblMyID.string = "ID: " + User.instance.uid.toString();
        util.showLoading("正在进入充值");
        this.openAnim(() => {
            new Promise((resolve: (ok: boolean) => void) => {
                window.pomelo.request("lobby.billHandler.payEnforce", {}, (data: PayEnforceData) => {
                    util.hideLoading();
                    if (data.code === 200) {
                        g.payEnforceData = data;
                        if (data.locationRule) {
                            this.locationRule = data.locationRule;
                            if (!data.locationRule.rechargeAgent) {
                                this.hideAgent();
                            }
                        }
                        if (data.banVip) this.hideAgent();
                        if (data.vipSwitch != undefined && data.vipSwitch != null) {
                            agentUtil.isOld = false;
                            if (data.vipSwitch === 0) this.hideAgent();
                        }

                        if (this.canShowChat && data.newAgentSwitch) {
                            this.agentChat.lobbyParent = this.node.parent;
                            this.officialRecharge.active = true;
                        } else {
                            this.canShowChat = false;
                            this.officialRecharge.active = false;
                        }
                        this.agentList.init();
                        this.initRecharges(data.payTypes);
                        if(data.rechargeMsgs){
                            this.isnotific = this.timeout(data.rechargeMsgs);
                        }else{
                            this.isnotific = false;
                        }
                        if (this.canShowChat && data.agentVipSwitch) {
                            this.hideAgent();
                        }
                        this.show()
                        resolve(true);
                    } else {
                        resolve(false);
                    }
                })
            });
        });
    }

    timeout(rechargeMsgs: { type: number, content: string }[]) {
        if(rechargeMsgs){
            let first,daily,Each:string = "";
            for(let i = 0; i < rechargeMsgs.length; i++){
                if(rechargeMsgs[i].type == 1){
                    daily = rechargeMsgs[i].content;
                }else if(rechargeMsgs[i].type == 2){
                    first = rechargeMsgs[i].content;
                }else if(rechargeMsgs[i].type == 3){
                    Each = rechargeMsgs[i].content;
                }
            }
            //每日
            let dailyse = cc.sys.localStorage.getItem("Timesdaily");
            //首次
            let firstse = cc.sys.localStorage.getItem("Timesfirst");
            //每日的时间
            let newTime = cc.sys.localStorage.getItem("nowTimestamp");
            let current = Date.now();
            let b = 1 * 24 * 60 * 60 * 1000;
            if(first && first != firstse){
                this.notifictext.string = first;
                cc.sys.localStorage.setItem("Timesfirst", first);
                return true;
            }else if(daily && (daily != dailyse || !newTime || (newTime + b) <= current)){
                this.notifictext.string = daily;
                cc.sys.localStorage.setItem("Timesdaily", daily);
                cc.sys.localStorage.setItem("nowTimestamp", current);
                return true;
            }else if(Each){
                this.notifictext.string = Each;
                return true;
            }else{
                return false;
            }
        }else{
            return false;
        }
    }

    private hideAgent() {
        this.showAgent = false;
        let agentTg = this.tgRecharge.node.getChildByName("agentList");
        agentTg.active = false;
    }

    // 检查是否有 聊天充值
    private checkAgentChat() {
        let have = false;
        if (!cc.sys.isNative) {
            have = true;
        } else if (cc.sys.os === cc.sys.OS_IOS) {
            have = jsb.reflection.callStaticMethod("JsClass", "haveAgentChat");
        } else if (cc.sys.os === cc.sys.OS_ANDROID) {
            have = jsb.reflection.callStaticMethod("org/cocos2dx/javascript/JsClass", "haveAgentChat", "()Z");
        }
        this.canShowChat = have;
    }
    private initRecharges(payTypes: { idx: number, type: string }[]) {
        if (!payTypes) {
            // util.showTip("暂无充值项");
            return;
        }

        for (let i = 0; i < payTypes.length; i++) {
            for (let j = i + 1; j < payTypes.length; j++) {
                let one = payTypes[i];
                let two = payTypes[j];
                if (one.idx > two.idx) {
                    let tmp = payTypes[i];
                    payTypes[i] = payTypes[j];
                    payTypes[j] = tmp;
                }
            }
        }

        for (let i = 0; i < payTypes.length; i++) {
            for (let j = 0; j < this.recharges.length; j++) {
                let r = this.recharges[j];
                if (r.payment === payTypes[i].type) {
                    let leftNode = this.tgRecharge.node.getChildByName(r.payment);
                    if (leftNode) {
                        leftNode.setLocalZOrder(payTypes[i].idx);
                        break;
                    }

                    let item = util.instantiate(this.itemLeft);
                    let tog = item.getComponent(cc.Toggle);
                    let target = tog.target;
                    target.getChildByName("icon").getComponent(cc.Sprite).spriteFrame = r.iconFocus;
                    target.getChildByName("lab").getComponent(cc.Label).string = r.title;
                    let mark = tog.checkMark.node;
                    mark.getChildByName("icon").getComponent(cc.Sprite).spriteFrame = r.iconFocus;
                    mark.getChildByName("lab").getComponent(cc.Label).string = r.title;
                    item.active = true;
                    item.name = r.payment;
                    this.tgRecharge.node.addChild(item);
                    item.setLocalZOrder(payTypes[i].idx);

                    item.x = 0;
                    if (item.name === "yun_pay") {
                        item.getChildByName("Background").getChildByName("bg_bq").active = true;
                        item.getChildByName("checkmark").getChildByName("bg_bq").active = true;
                    }

                    let handler = new cc.Component.EventHandler();
                    handler.target = this.node;
                    handler.component = cc.js.getClassName(this);
                    handler.handler = "onCheckLeft";
                    handler.customEventData = r.payment;
                    util.addSingleEvent(tog, handler);
                    let right = util.instantiate(this.itemRight);
                    right.name = r.payment;
                    this.nodeRight.addChild(right);
                    right.setPosition(-183, 35);
                    let page = right.getComponent(PayPage);
                    page.mPay = this;
                    page.init(r.payment, r.bg, r.tip, r.bgColor, r.titleSpri);
                }
            }
        }
    }

    private onClickCopyID() {
        let uid = User.instance.uid.toString();
        let success = util.setClipboard(`您好，我要充值《${util.getAppName()}》，我的id${uid}。`);
        if (success) {
            util.showTip("已拷贝到剪切板");
        }
    }

    private onCheckLeft(tog: cc.Toggle, data: string) {
        this.changeView(data);
    }

    private changeView(name: string) {
        let node = this.nodeRight.getChildByName(name);
        if (!node) {
            this.nodeRight.children.forEach(child => {
                if (child.name !== 'bg')
                    child.active = false
            });
            return;
        }
        let page = node.getComponent(PayPage);
        if (page && !node.active) {
            page.getCfg();
        }
        this.nodeRight.children.forEach(child => {
            if (child.name !== 'bg')
                child.active = false
        });

        node.active = true;
    }

    // 重置选中状态到 第一个标签
    resetCheck(payment: string) {
        let child: cc.Node = undefined;
        for (let i = 0; i < this.tgRecharge.node.children.length; i++) {
            let mchild = this.tgRecharge.node.children[i];
            if (mchild.active && mchild.name != payment) {
                child = mchild;
                break;
            }
        }

        if (child && child.active) {
            let oldItem = this.tgRecharge.node.getChildByName(payment);
            oldItem.active = false;

            child.getComponent(cc.Toggle).isChecked = true;
            let name = child.getComponent(cc.Toggle).checkEvents[0].customEventData;
            this.changeView(name);
        }
    }
    //动态展示
    private randomShowPayButton() {

        for (let i = 0; i < this.tgRecharge.node.childrenCount; i++) {
            let child = this.tgRecharge.node.children[i];
            if (child.name === "agentList" || child.name === "agentChat") {
                continue;
            }

            child.active = false;
        }

        let rechargeSwitch = !!Lobby.availableFuncs.recharge;
        if (!rechargeSwitch) {
            return;
        }

        this.rechargeTactics();
    }

    /**
     * 充值策略
     */
    private rechargeTactics() {
        let data = <PayEnforceData>g.payEnforceData;
        if (data.code !== 200) {
            console.warn(ErrCodes.getErrStr(data.code, "获取充值通道失败"));
            return;
        }
        if (!data.payTypes) {
            console.warn("没有充值通道数据");
            return;
        }



        let ins = User.instance;
        if (data.payEnforce === 0 || !ins.shieldStatus.usePayEnforce) {
            this.showOnline(data.payTypes);
            return;
        }
        let rechargeEnforce = data.re;

        let onlyRate = ins.onlyAgentRate;
        let ignoreNum = ins.ignoreAgent;
        let decRate = ins.decreaseRate;
        let onlyNum = ins.onlyAgent;
        let lastTimes = ins.agentTimes;

        let agentTimes = data.agentOKTimes || 0;
        let onlineTimes = data.onlineRechargeOKTimes || 0;
        let onlineTotal = data.onlineRecharge || "0";

        // 如果没有数据，就先初始化
        if (onlyRate <= 0) {
            if (ignoreNum === 0 && agentTimes > 0) { // 代理充值过的，不是反复不代理充值降到0的，一律为80%几率只显示代理
                onlyRate = util.add(rechargeEnforce.saOnlyShowAgentRate, 0).toNumber();
                decRate = util.add(rechargeEnforce.saDecRate, 0).toNumber();
            } else if (onlineTimes > rechargeEnforce.srTimesLLmit && util.sub(onlineTotal, rechargeEnforce.srTotalLLimit).toNumber() > 0) { // 否则在线充值金额够的，只显示代理几率为60%
                onlyRate = util.add(rechargeEnforce.srOnlyShowAgentRate, 0).toNumber();
                decRate = util.add(rechargeEnforce.srDecRate, 0).toNumber();
            }
        }

        let conNoBillTimes: number;
        if (lastTimes > 0) { // 如果记录有过代理充值
            conNoBillTimes = rechargeEnforce.saConNoBillTimes;
        } else {
            conNoBillTimes = rechargeEnforce.srConNoBillTimes;
        }

        if (agentTimes > lastTimes) { // 新增了代理成功次数
            onlyRate += util.mul(agentTimes - lastTimes, rechargeEnforce.perACIncRate).toNumber(); // 增加相应只显示代理几率
            ignoreNum = 0; // 连续不代理次数重置
        } else { // 没有新增代理
            // 如果上次只展示了代理充值
            if (onlyNum > 0) {
                // 没代理充值次数+1
                ignoreNum++;
                // 如果达到一定次数，则减少只显示代理充值的几率
                if (ignoreNum >= conNoBillTimes) {
                    onlyRate -= decRate;
                }
            } else { // 否则将没代理充值次数重置
                ignoreNum = 0;
            }
        }

        lastTimes = agentTimes;
        // 得到几率
        let rate = Math.random();
        // 根据几率决定是否显示在线充值
        if (rate > onlyRate) {
            // 代理充值过的，除SSS外限制最高充值金额为500
            if (agentTimes > 0 && !!rechargeEnforce.limitOtherChannelMaxMoney) {
                this.limitOtherChannelMaxMoney = rechargeEnforce.limitOtherChannelMaxMoney;
            }
            // 显示在线充值
            this.showOnline(data.payTypes);
            // 连续只显示代理次数归零
            onlyNum = 0;
        } else {
            onlyNum++;
        }

        ins.onlyAgentRate = onlyRate;
        ins.ignoreAgent = ignoreNum;
        ins.decreaseRate = decRate;
        ins.onlyAgent = onlyNum;
        ins.agentTimes = lastTimes;
    }

    /**
     * 显示在线充值
     *
     * @private
     * @param {PayInfo[]} types
     * @returns
     * @memberof Recharge
     */
    private showOnline(types: { idx: number, type: string }[]) {
        if (!User.instance.shieldStatus.allow3rdRecharge) {
            return;
        }
        if (!types) {
            return;
        }


        // 充值策略将在线分为 在线充值和个人zfb
        let showTypes: { idx: number, type: string }[] = [];
        if (this.locationRule) {
            types.forEach(t => {
                if (t.type === Person_Recharge) {
                    if (!!this.locationRule.rechargePerson) {
                        showTypes.push(t);
                    }
                } else if (!!this.locationRule.rechargeOnline) {
                    showTypes.push(t);
                }
            });
        } else {
            showTypes = types.concat();
        }

        if (showTypes && showTypes.length === 0) {
            this.noRecharge.active = true;
        }
        showTypes.forEach(t => {
            let child = this.tgRecharge.node.getChildByName(t.type);
            if (!child) {
                return;
            }
            let node = this.nodeRight.getChildByName(t.type)
            if (!node) {
                return;
            }
            let page = node.getComponent(PayPage);
            if (!page) {
                return;
            }

            child.active = true;

            page.limitOtherChannelMaxMoney = this.limitOtherChannelMaxMoney;

        });

        let togs = this.tgRecharge.getComponentsInChildren(cc.Toggle);
        let togName;
        for (let tog of togs) {
            if (!tog.node.active) {
                continue;
            }
            tog.check();
            togName = tog.node.name;
            break;
        }

        // 若无代理充值则显示第一个在线充值
        if (!this.showAgent && togName) {
            this.changeView(togName);
        }
    }

    async show() {
        this.leftList.active = true
        this.randomShowPayButton();
        this.vipRecharge.setLocalZOrder(999);
        if (this.canShowChat) {
            this.tgRecharge.node.getChildByName('agentChat').getComponent(cc.Toggle).check();
            this.changeView("agentChat");
        } else {
            if (this.showAgent) {
                this.tgRecharge.node.getChildByName('agentList').getComponent(cc.Toggle).check();
                this.changeView("agentList");
            }
        }
        if(this.isnotific){
            await new Promise(resolve => {
                this.notificationShow();
                this.notificatbtn.node.on(cc.Node.EventType.TOUCH_START,function(){
                    resolve();
                });
            });
        }
        this.showRecommend();
    }

    /**
     * 消息通知
     */

    notificationShow(){
        cc.director.getActionManager().removeAllActionsFromTarget(this.notification);
        this.notification.active = true;
        this.notification.opacity = 1;
        this.notification.runAction(cc.fadeIn(1));
    }

    onClickClosenotif(){
        this.notification.runAction(cc.sequence(cc.fadeOut(1), cc.callFunc(() => { this.notification.active = false; })));
    }

    /**
 * 展示 强烈推荐官方代充
 */
    showRecommend() {
        if (cc.sys.localStorage.getItem("showRecommend")) {
            return;
        }
        cc.sys.localStorage.setItem("showRecommend", "1");
        this.recommend.active = true;
        this.recommend.opacity = 1;
        this.recommend.runAction(cc.fadeIn(1));
    }

    onClickCloseRecommend() {
        this.recommend.runAction(cc.sequence(cc.fadeOut(1), cc.callFunc(() => { this.recommend.active = false; })));
    }

}
