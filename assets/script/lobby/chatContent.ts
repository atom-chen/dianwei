import * as util from "../common/util";
import QRCode from "./qRCode";
const { ccclass, property } = cc._decorator;

interface RcgTypes {
    recType: string,
    recStr: string,
}

@ccclass

export default class ChatContent extends cc.Component {


    @property(cc.Sprite)
    iconSp: cc.Sprite = undefined;   // 头像

    @property(cc.Label)
    timeLb: cc.Label = undefined;   // 时间

    @property(cc.Label)
    chatLb: cc.Label = undefined;  // 聊天文字

    @property(cc.Sprite)
    image: cc.Sprite = undefined;   // 玩家截图 仅存在玩家消息中

    @property(cc.Label)
    stateLb?: cc.Label = undefined;  // 消息状态  读与未读  仅存在玩家消息中

    @property(cc.Node)
    payType: cc.Node = undefined;  //  支付方式    仅存在代理消息中

    @property(cc.Label)
    payTitle: cc.Label = undefined;


    @property(cc.Button)
    payButton: cc.Button = undefined;

    @property(cc.Node)
    content: cc.Node = undefined;

    @property(cc.Sprite)
    payCardIcon: cc.Sprite = undefined;

    @property([cc.SpriteFrame])
    cardIconSps: cc.SpriteFrame[] = [];

    @property([cc.SpriteFrame])
    cardBgSps: cc.SpriteFrame[] = [];

    @property(cc.Node)
    invalidTip: cc.Node = undefined;
    
    setChatLbStr(content: string) {
        this.chatLb.string = content;
    }

    setPayTitle(title: string) {
        this.payTitle.string = title;
    }

    setPayIndex(index: number) {
        this.payCardIcon.spriteFrame = this.cardIconSps[index];
        this.payType.getComponent(cc.Sprite).spriteFrame = this.cardBgSps[index];
    }

    setImageBtCustomData(data: string) {
        this.image.node.getComponent(cc.Button).clickEvents[0].customEventData = data;
    }

    setPayButtonCustomData(data: string) {
        this.payButton.clickEvents[0].customEventData = data;
        this.invalidTip.active = data === "expired";
    }

    setTimeLbStr(time: number) {
        this.timeLb.string = util.formatTimeStr("m", time);
    }
    setIconSp(gender: number, avatar: number) {
        this.iconSp.spriteFrame = util.getAvatar(gender === 1 ? true : false, avatar);
    }
    setImage(tsp: cc.SpriteFrame) {
        this.image.spriteFrame = tsp;
        let spsize: cc.Size = tsp.getOriginalSize();
        this.image.node.height = spsize.height * 0.2;
        this.image.node.width = spsize.width * 0.2;

        cc.log("-------1----", this.image.node.height);
        cc.log("-------2----", this.image.node.width);
    }


    setStateLbStr(read: number) {
        if (!read) {
            this.stateLb.string = "未读";
        }
    }
}
