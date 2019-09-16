import AgentRecharge from "./agentRecharge"
import * as util from "../common/util";
import OrderTrack from "./orderTrack";
import AgentChat, { orderInfo, ChatInfo, AcceptChatMsg } from "./agentChat";
class AgentUtil {
    isOld: boolean = true;
    chatUnreadMsgIdList: string[] = [];
    agentChat: AgentChat = undefined;
    agentRecharge: AgentRecharge = undefined;
    orderTrack: OrderTrack = undefined;
    names = ["支付宝", "微信", "银联", "信用卡", "花呗", "云闪付", "qq支付", "京东支付", "其他"];
    allPayType: string[] = [];
    createAgentRecharge(data: ChatInfo, agentRechargePrb: cc.Prefab, lobbyParent: cc.Node, orderTrack: OrderTrack, isWait: boolean = false) {
        let agentRechargeNode = lobbyParent.getChildByName("agentRecharge");
        if (!agentRechargeNode) {
            agentRechargeNode = cc.instantiate(agentRechargePrb);
            lobbyParent.addChild(agentRechargeNode);
        }
        agentRechargeNode.active = true;
        if (orderTrack) {
            agentRechargeNode.getComponent(AgentRecharge).initOrderTrack(orderTrack);
        }

        if (isWait) {
            agentRechargeNode.getComponent(AgentRecharge).initWait();
        } else {
            agentRechargeNode.getComponent(AgentRecharge).init(data);
        }

        util.hideLoading();
    }

    getIndexByType(type: string) {
        if (type.indexOf('ali_pay') != -1) {
            return 0
        } else if (type.indexOf('wx_pay') != -1) {
            return 1
        } else if (type.indexOf('union_pay') != -1) {
            return 2
        } else if (type.indexOf('xy_pay') != -1) {
            return 3
        } else if (type.indexOf('hb_pay') != -1) {
            return 4
        } else if (type.indexOf('yun_pay') != -1) {
            return 5
        } else if (type.indexOf('qq_pay') != -1) {
            return 6
        } else if (type.indexOf('jd_pay') != -1) {
            return 7
        } else {
            return 8
        }
    }
    getNameByType(type: string) {
        return this.names[this.getIndexByType(type)];
    }


    addUnReadMsg(data: AcceptChatMsg) {
        let index = this.chatUnreadMsgIdList.indexOf(data.chatId);
        if (index < 0) {
            this.chatUnreadMsgIdList.push(data.chatId);
        }
        this.dealAgentChatUnreadTip();
        this.dealOrderTrackUnreadTip(data.chatId, true);
        if (this.agentRecharge) {
            this.agentRecharge.handleChatToClientMsg(data);
        }
    }

    decReadMsg(unreadId: string) {
        let index = this.chatUnreadMsgIdList.indexOf(unreadId);
        if (index >= 0) {
            this.chatUnreadMsgIdList.splice(index, 1);
        }
        this.dealAgentChatUnreadTip();
        this.dealOrderTrackUnreadTip(unreadId, false);
    }

    dealOrderTrackUnreadTip(unreadId: string, isshow: boolean) {
        if (this.orderTrack) {
            this.orderTrack.checkShowUnread(unreadId, isshow);
        }
    }
    dealAgentChatUnreadTip() {
        if (this.agentChat) {
            this.agentChat.unReadTip.active = this.chatUnreadMsgIdList.length > 0 ? true : false;
        }
    }

    closeAgentRecharge() {
        if (this.agentChat) {
            this.agentChat.closeRequestRecharge();
        }
    }


    changePayTypeInWait(payType: string) {
        if (this.agentChat) {
            this.agentChat.mPayType = payType;
            this.agentChat.recharge();
        }
    }

}


let agentUtil = new AgentUtil();

export default agentUtil;
