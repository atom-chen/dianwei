import PopActionBox from "./popActionBox"
import AgentChat, { ChatInfo, ChatMsg , TypeDate} from "./agentChat";
import { time } from "../game-by/massive";
import * as util from "../common/util";
import { ErrCodes } from "../common/code";
import AgentRecharge from "./agentRecharge"
import { orderInfo } from "./agentChat"
import agentUtil from "./agentUtil"
import { User } from "../common/user";
import ItemNames from "../common/itemNames";
import g from "../g";

const { ccclass, property } = cc._decorator;

export interface chargeOrder {
    _id: string,
    gold: number,
    aName: number,
    state: number,    // 1 完成 2 未完成  3 取消
    createDate: number,
    evaluation: number,          // 0 未评价  1 满意   2 不满意
}


@ccclass("Order")
class Order {
    @property(cc.Node)
    item: cc.Node = undefined;

    @property(cc.Sprite)
    iconSp: cc.Sprite = undefined;
    @property(cc.Label)
    orderNumberLb: cc.Label = undefined;

    @property(cc.Label)
    moneyLb: cc.Label = undefined;

    @property(cc.Node)
    msgUnread: cc.Node = undefined;

    @property(cc.Label)
    agentNameLb: cc.Label = undefined;

    @property(cc.Label)
    stateLb: cc.Label = undefined;

    @property(cc.Label)
    timeLb: cc.Label = undefined;

    @property(cc.Button)
    copyBt: cc.Button = undefined;

    @property(cc.Button)
    enterBt: cc.Button = undefined;
}

@ccclass
export default class OrderTrack extends PopActionBox {

    @property(Order)
    OrderItem: Order = undefined;

    @property(cc.Node)
    content: cc.Node = undefined;
    @property(cc.Prefab)
    agentRechargePrb: cc.Prefab = undefined;

    @property(cc.Prefab)
    csPre: cc.Prefab = undefined;

    @property([cc.SpriteFrame])
    evaluationSps: cc.SpriteFrame[] = [];

    public lobbyParent: cc.Node = undefined;
    public orderData: orderInfo[] = undefined;
    private orderState: string[] = ["未完成", "完成", "关闭"];

    private orderItemArr: cc.Node[] = [];

    private curClickIndex: number = undefined;

    private canClick: boolean = true;
    private cdTime = 900
    protected onLoad() {
        super.onLoad();
        this.OrderItem.item.active = false;
        this.OrderItem.msgUnread.active = false;
        this.content.removeAllChildren();
        this.content.active = false;
        this.registerMethod();

        agentUtil.orderTrack = this;
    }

    registerMethod() {
        window.pomelo.off("AgentState");
        window.pomelo.on("AgentState", this.handleAgentState);

        window.pomelo.off("OrderState");
        window.pomelo.on("OrderState", this.handleOrderState.bind(this));

    }

    onDestroy() {
        window.pomelo.off("AgentState");
        window.pomelo.off("OrderState");
        agentUtil.orderTrack = undefined;
    }

    handleOrderState(data: { orderId: string, state: number }) {
        if (!this.orderData) {
            return;
        }
        for (let i = 0; i < this.orderData.length; i++) {
            if (this.orderData[i].chatId === data.orderId) {
                this.orderData[i].state = data.state;
                this.orderItemArr[i].getChildByName("state").getComponent(cc.Label).string = "" + this.orderState[data.state];;
            }
        }
    }

    handleAgentState(data: { code: number }) {
        util.showTip(ErrCodes.getErrStr(data.code, "代理状态提示"));
    }

    initUnread() {
        for (let j = 0; j < agentUtil.chatUnreadMsgIdList.length; j++) {
            let unReadId = agentUtil.chatUnreadMsgIdList[j];
            this.checkShowUnread(unReadId);
        }
    }

    checkShowUnread(chatId: string, isShow = true) {
        if (this.orderData) {
            for (let i = 0; i < this.orderData.length; i++) {
                if (this.orderData[i].chatId === chatId) {
                    this.orderItemArr[i].getChildByName("p").active = isShow;
                }
            }
        }
    }

    openAnim() {
        super.openAnim(() => {
            this.content.x = 0;
            this.content.y = 0;
            this.content.active = true;
            this.canClick = true;
        });
    }
    initData(data: orderInfo[]) {
        this.content.removeAllChildren();
        if (!data) {
            return;
        }
        if (agentUtil.isOld) {
            this.orderState = ["未完成", "未完成", "取消", "完成"];
        }
        this.orderData = data;

        for (let i = 0; i < data.length; i++) {
            const el = data[i];
            this.createOrderItem(el, i);
        }

        this.initUnread();
    }



    createOrderItem(el: orderInfo, index: number) {
        this.OrderItem.orderNumberLb.string = el.chatId;
        this.OrderItem.moneyLb.string = "" + el.paidMoney;
        this.OrderItem.agentNameLb.string = "" + el.aName;
        this.OrderItem.stateLb.string = "" + this.orderState[el.state];
        this.OrderItem.timeLb.string = util.formatTimeStr("m", el.createDate);
        this.OrderItem.copyBt.clickEvents[0].customEventData = "" + index;
        this.OrderItem.enterBt.clickEvents[0].customEventData = "" + index;
        this.OrderItem.iconSp.spriteFrame = this.evaluationSps[el.evaluation];

        let nOrderItem = cc.instantiate(this.OrderItem.item);
        nOrderItem.active = true;
        this.orderItemArr.push(nOrderItem);
        this.content.addChild(nOrderItem);
    }

    /**
     *
     * 点击复制按钮
     * @param event
     * @param customData
     */
    onClickCopyBt(event: cc.Event, customData: string) {
        let data = this.orderData[+customData];
        let string = data.chatId + " " + this.orderState[data.state] + " " + util.formatTimeStr("m", data.createDate);
        util.setClipboard(string);
        util.showTip("内容已拷贝到剪切板!");
    }

    /**
     * 点击进入订单按钮
     * @param event
     * @param customData
     */
    onClickEnterBt(event: cc.Event, customData: string) {
        if (!this.canClick) {
            return;
        }
        this.canClick = false;
        util.showLoading("加载中");
        window.pomelo.request("chat.clientHandler.getChatMsg", {
            chatId: this.orderData[+customData].chatId,
            pageCnt: 10,
            page: 0,
        },
            (data: {
                code: number, chat: orderInfo, msgs: ChatMsg[], payTypes: string[], online: number,
                gender: number, avatar: number, typesDate?: TypeDate[]
            }) => {
                if (data.code === 200) {
                    this.curClickIndex = +customData;
                    this.handleOpenChat(data);
                } else {
                    util.hideLoading();
                    util.showTip(ErrCodes.getErrStr(data.code, "进入订单失败"));
                }
                this.canClick = true;
            });
    }

    handleOpenChat(data: {
        code: number, chat: orderInfo, msgs: ChatMsg[], payTypes: string[], online: number,
        gender: number, avatar: number, typesDate?: TypeDate[]
    }) {
        let chatData: ChatInfo = {
            chatId: data.chat.chatId,
            aUid: data.chat.aUid,
            aName: data.chat.aName,
            msgs: data.msgs,
            payTypes: data.payTypes,

            state: data.chat.state,
            evaluation: data.chat.evaluation,
            report: data.chat.report,
            gender: data.gender,
            avatar: data.avatar,
            typesDate: data.typesDate
        };

        if (data.online === 0) {
            util.showTip("当前代理不在线!!");
        }
        agentUtil.createAgentRecharge(chatData, this.agentRechargePrb, this.lobbyParent, this);
    }

    onClickComplaintAgent() {
        let time = cc.sys.localStorage.getItem(ItemNames.problemCD)
        if (time) {
            let tc = this.cdTime - Math.floor((Date.now() - time) / 1000);
            if (tc > 0) {
                util.showTip(`${tc}秒后方能再次发起问题申诉`);
                return;
            }
        }
        let uid = User.instance.uid;
        let uuid = util.genNewUUID()
        cc.sys.openURL(`${g.serviceCfg.rechargeQuestionUrl}/html/rechargeQuestion.html?uid=${uid}&uuid=${uuid}&token=${md5(`${uid + uuid}-2ghlmcl1hblsqt`)}`)

        cc.sys.localStorage.setItem(ItemNames.problemCD, Date.now())

    }

    /**
     *  根据评价更改 订单 评价icon
     * @param evaluation 评价
     */
    chgOrderIcon(evaluation: number) {
        let itemNode = this.orderItemArr[this.curClickIndex];
        let icon = itemNode.getChildByName("sp");
        icon.getComponent(cc.Sprite).spriteFrame = this.evaluationSps[evaluation];
    }

    chgOrderState(state: number) {
        let itemNode = this.orderItemArr[this.curClickIndex];
        itemNode.getChildByName("state").getComponent(cc.Label).string = "" + this.orderState[state];
    }

    onClcikBg() {
        // this.node.active = false;
    }

}
