import * as util from "../common/util";
import { ErrCodes } from "../common/code";
import OrderTrack, { chargeOrder } from "./orderTrack";
import AgentRecharge from "./agentRecharge"
const { ccclass, property } = cc._decorator;
import agentUtil from "./agentUtil"


export interface ChatMsg {
    _id: string, //消息id
    fromUid?: number, //发送用户id
    toUid?: number, //目标用户id
    fromType?: number, //发送用户类型，0-玩家，1-代理
    toType?: number, //目标用户类型，同上
    createDate: number,
    type: number, //消息类型，1:文字  2:图片地址 3:图片base64内容 4:功能(收款信息)，先暂定这样，后期可能有变动
    content: string,
    read?: number
}

export interface ChatInfo {
    chatId: string,
    aUid: number,
    aName: string,
    msgs: ChatMsg[],
    payTypes: string[],
    state: number,
    evaluation: number,
    report: number,
    gender: number,
    avatar: number,
    typesDate?: TypeDate[],
}

export interface TypeDate {
    type: string,
    date: number,
}

interface Reason {
    aUid: number,
    aName: string,
    busyCnt: number,
}
export interface SendChatMsg {
    chatId: string,
    type: number,
    content: string,
    createDate: number,
}
export interface AcceptChatMsg {
    code: number,
    chatId: string,
    msgId: string,
    type: number,
    content: string,
    createDate: number,
}
export interface orderInfo {
    chatId: string,
    aUid: number,
    aName: string,
    createDate: number,
    pid: string,
    money: string,
    state: number,
    orderId: string,
    orderDate: number,
    finishDate: number,
    paidMoney: string,
    remarks: string,
    evaluation: number,
    report: number,
    reportId: string,
    haveProof: number,   // 是否提供了凭证
    payType: string
}

@ccclass
export default class AgentChat extends cc.Component {

    @property(cc.Node)
    payTypes: cc.Node = undefined;  // 各个支付方式的按钮

    @property(cc.Node)
    unReadTip: cc.Node = undefined;

    @property(cc.Prefab)
    OrderTrackPrb: cc.Prefab = undefined;

    @property(cc.Prefab)
    agentRechargePrb: cc.Prefab = undefined;

    private _events: string[];


    public lobbyParent: cc.Node = undefined;

    public waitTimer: boolean = false;
    private time: number = 2;

    public mPayType: string = "";
    get events() {
        if (!this._events) {
            this._events = [];
        }
        return this._events;
    }

    onLoad() {
        this.addExtraListeners();
        agentUtil.agentChat = this;
    }

    onEnable() {
        this.mPayType = "";
        this.sendChatEnter();
        this.checkMsgIsRead();
        this.getPay();
    }

    sendChatEnter() {
        window.pomelo.notify("chat.clientHandler.enter", {});
    }

    checkMsgIsRead() {
        agentUtil.chatUnreadMsgIdList = [];
        window.pomelo.request("chat.clientHandler.getUnreadMsg", {}, (data: {
            code: number, chats: {
                chatId: string,
                unreadCnt: number,
            }[]
        }) => {
            if (data.code === 200) {
                if (!data.chats || data.chats.length === 0) {
                    this.unReadTip.active = false;
                } else {
                    data.chats.forEach(el => {
                        agentUtil.chatUnreadMsgIdList.push(el.chatId);
                    });
                    this.unReadTip.active = true;
                }
            } else {
                util.showTip("获取未读消息列表失败！");
            }

        });
    }
    protected addExtraListeners(): void {
        window.pomelo.off("ChatMsg");
        this.listen("disconnect", this.handleDisconnect.bind(this));
        this.listen("ChatMsg", this.handleChatToClientMsg.bind(this));
    }

    private listen(event: string, func: Function) {
        let p = window.pomelo;
        p.on(event, func.bind(this));
        this.events.push(event);
    }

    public removeExtraListeners(): void {
        window.pomelo.off("ChatMsg");
    }
    onDestroy() {
        this.removeExtraListeners();
    }

    handleChatToClientMsg(data: AcceptChatMsg) {
        agentUtil.addUnReadMsg(data);
    }

    handleDisconnect() {
        if (this && this.enabled) {
            this.lobbyParent.removeAllChildren();
        }
    }
    // init() {
    //     this.getPay();
    // }


    getPay() {
        util.showLoading("加载中");
        this.payTypes.children.forEach(el => {
            el.active = false;
        });
        window.pomelo.request("chat.clientHandler.getPay", {}, (data: { code: number, pays: string[] }) => {
            if (data.code === 200) {
                for (let i = 0; i < this.payTypes.children.length && data && data.pays && i < data.pays.length; i++) {
                    let child = this.payTypes.children[i];
                    child.getChildByName("hl").active = false;
                    if (i === 0) {
                        child.getChildByName("hl").active = true;
                        this.mPayType = data.pays[0];
                    }
                    child.getComponentInChildren(cc.Label).string = agentUtil.getNameByType(data.pays[i]);
                    child.active = true;
                    child.getComponent(cc.Button).clickEvents[0].customEventData = data.pays[i];
                }
                agentUtil.allPayType = data.pays;
            } else {
                util.showTip(ErrCodes.getErrStr(data.code, "获取官方代充支付方式失败"));
            }
            util.hideLoading();
        });
    }

    /**
     * 点击订单查询
     */
    onClickOrderTrack() {
        util.showLoading("请稍等");

        window.pomelo.request("chat.clientHandler.getChats", {}, (data: { code: number, chats: orderInfo[] }) => {
            util.hideLoading();
            if (data.code === 200) {
                this.showOrderTrack(data.chats);
            } else {
                util.showTip(ErrCodes.getErrStr(data.code, "加载订单失败"));
            }
        });
    }
    showOrderTrack(data: orderInfo[]) {
        let orderTrackNode = this.node.getChildByName("orderTrack");
        if (!orderTrackNode) {
            orderTrackNode = cc.instantiate(this.OrderTrackPrb);
            this.lobbyParent.addChild(orderTrackNode);
        }
        let orderTrack = orderTrackNode.getComponent(OrderTrack);
        orderTrack.lobbyParent = this.lobbyParent;
        orderTrack.initData(data);
    }

    /**
     * 点击充值
     */
    onClickRecharge(event: cc.Event, customData: string) {
        this.recharge();
    }

    requestRecharge() {
        if (!this.waitTimer) {
            this.waitTimer = true;
            this.time = 10;
            cc.log("-----requestRecharge----");
            this.schedule(this.callBack, this.time);
        }
    }

    callBack() {
        this.recharge(true);
        this.time = this.time >= 64 ? this.time : this.time * 2;
    }

    closeRequestRecharge() {
        if (this.waitTimer) {
            this.unschedule(this.callBack);
            this.waitTimer = false;
        }
    }
    recharge(isAuto = false) {
        if (this.mPayType === "") {
            util.showTip("暂无充值渠道，无法发起充值！");
            return;
        }
        util.showLoading("加载中");
        let self = this;
        window.pomelo.request("chat.clientHandler.openRecharge",
            { type: self.mPayType }, (data: { code: number, chat: ChatInfo, reason: Reason }) => {
                // state  0 离线  1 在线   2 暂离
                util.hideLoading();
                if (data.code === 200) {
                    self.closeRequestRecharge();
                    self.handleOpenChat(data.chat);
                } else {
                    if (data.code === 15005) {   // 匹配失败
                        self.requestRecharge();
                        if (!isAuto) {
                            self.openWiatChat();
                        }
                    } else {
                        util.showTip(ErrCodes.getErrStr(data.code, "请求充值失败"));
                    }
                }
            });
    }

    /**
     * 点击 充多少的按钮
     * @param event
     * @param customData
     */
    onClickMoneyBt(event: cc.Event, customData: string) {
        let tnode: cc.Node = event.target;
        this.payTypes.children.forEach(el => {
            el.getChildByName("hl").active = false;
        });
        tnode.getChildByName("hl").active = true;

        this.mPayType = customData;
    }


    /**
     * 打开聊天界面
     */
    handleOpenChat(data: ChatInfo) {
        agentUtil.createAgentRecharge(data, this.agentRechargePrb, this.lobbyParent, undefined);
    }

    openWiatChat() {
        agentUtil.createAgentRecharge(undefined, this.agentRechargePrb, this.lobbyParent, undefined, true);
    }
}
