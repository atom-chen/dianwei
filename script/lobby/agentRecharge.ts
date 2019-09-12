import PopActionBox from "./popActionBox"
import OrderTrack from "./orderTrack";
import * as util from "../common/util";
import { ErrCodes } from "../common/code";
import { User } from "../common/user";
import ChatContent from "./chatContent"
import agentUtil from "./agentUtil"
import { ChatInfo, ChatMsg, AcceptChatMsg, SendChatMsg, orderInfo , TypeDate} from "./agentChat"


const { ccclass, property } = cc._decorator;
enum orderState {
    UNFINISHED = 0,
    FINISHED = 1,
    CLOSED = 2,
}
export interface payInfo { // chat支付信息
    _id: string,
    type: string,
    active: boolean,
    act: string,
    name: string,
    bank?: string,
    qrCode?: string,
    feeRate?: string
}

@ccclass
export default class AgentRecharge extends PopActionBox {
    @property(ChatContent)
    leftItem: ChatContent = undefined;

    @property(ChatContent)
    rightItem: ChatContent = undefined;

    @property(cc.Node)
    evaluationItem: cc.Node = undefined;

    @property(cc.Node)
    reportItem: cc.Node = undefined;

    @property(cc.Node)
    addImage: cc.Node = undefined;
    @property(cc.EditBox)
    edit: cc.EditBox = undefined;

    @property(cc.ScrollView)
    scrollView: cc.ScrollView = undefined;

    @property(cc.Label)
    title: cc.Label = undefined;

    @property(cc.Node)
    contentNode: cc.Node = undefined;

    @property(cc.Node)
    scaleNode: cc.Node = undefined;

    @property(cc.Sprite)
    scaleSp: cc.Sprite = undefined;

    @property(cc.Node)
    bottomBtsNode: cc.Node = undefined;

    @property(cc.Node)
    tipNode: cc.Node = undefined;    // 订单完成，玩法继续聊天的提示节点


    @property(cc.Node)
    payTypes: cc.Node = undefined;

    @property(cc.Node)
    payTypeItem: cc.Node = undefined;

    @property(cc.Node)
    reportInfo: cc.Node = undefined;

    @property(cc.EditBox)
    reportEdit: cc.EditBox = undefined;


    @property(cc.Node)
    payInfo: cc.Node = undefined;

    @property(cc.Label)
    payInfoTitle: cc.Label = undefined;

    @property(cc.Label)
    codeFeeRate: cc.Label = undefined;   // 二维码费率

    @property(cc.Label)
    txtFeeRate: cc.Label = undefined;  // 文字  费率


    @property(cc.Node)
    nextBt: cc.Node = undefined;

    @property(cc.Node)
    imageNode: cc.Node = undefined;

    @property(cc.Label)
    imageTitle: cc.Label = undefined;

    @property(cc.Sprite)
    imageSp: cc.Sprite = undefined;

    @property(cc.Node)
    textPay: cc.Node = undefined;
    @property(cc.Label)
    actLabel: cc.Label = undefined;
    @property(cc.Label)
    nameLabel: cc.Label = undefined;

    @property(cc.Label)
    matchInfo: cc.Label = undefined;

    @property(cc.Node)
    mask: cc.Node = undefined;

    @property(cc.Node)
    arrow: cc.Node = undefined;

    @property(cc.Label)
    agentID: cc.Label = undefined;
    private tmpSp: cc.SpriteFrame = undefined;
    private agentName: string = undefined;  // 代理名字
    private agentUid: number = undefined;   // 代理ID
    private agentGender: number = undefined;  // 代理性别
    private agentAvatar: number = undefined;    // 代理头像
    private myGender: number = undefined;  // 自己的性别
    private myAvatar: number = undefined;  // 自己的头像
    private myName: string = undefined;  // 自己的名字
    private _id: string = undefined; // 聊天ID
    private _events: string[];
    private unReadLable: cc.Label[] = [];
    private nEvalaution: cc.Node = undefined;  // 评价node
    private nReport: cc.Node = undefined;  // 举报node
    private orderTrack: OrderTrack = undefined;
    private curOrderState: number = undefined;
    private curOrderEvaluation: number = undefined;  // 当前订单的评价
    private curOrderReport: number = undefined;  // 当前订单的评价
    private tmpPath: string = undefined;
    private canSendMsg: boolean = true;
    private imageSriteFrame: cc.SpriteFrame[] = [];
    public orgSize: number = 0;
    private orgTitleY: number = 0;

    private curPage: number = 0;
    private curZIndex: number = 0;

    private loadingPageInfo: boolean = false;

    private isWaiting: boolean = false;  //  等待中

    private needPayType: boolean = false;  //  需要加载支付宝充值
    private agentPayTypes: string[] = [];

    private curTypesDate: TypeDate[] = undefined;
    get events() {
        if (!this._events) {
            this._events = [];
        }
        return this._events;
    }

    protected onLoad() {
        super.onLoad();
        this.orgTitleY = this.title.node.y;
        this.contentNode.active = false;
        this.orgSize = this.leftItem.node.height;
        this.leftItem.node.active = false;
        this.rightItem.node.active = false;
        this.evaluationItem.active = false;
        this.reportItem.active = false;
        this.scaleNode.active = false;
        this.curPage = 0;

        this.addExtraListeners();
        agentUtil.agentRecharge = this;

        if (cc.sys.isNative) {
            this.tmpPath = jsb.fileUtils.getWritablePath() + "tmp.jpg";
        }

    }
    openAnim() {
        super.openAnim(() => {
            this.contentNode.x = 0;
            this.contentNode.y = 0;
            this.contentNode.active = true;
            this.scrollView.scrollToBottom();
            if (this.needPayType) {
                this.initPayTypes(this.agentPayTypes);
            }
        });
    }
    protected addExtraListeners(): void {
        this.listen("OrderState", this.handleOrderState);
        this.listen("MsgReaded", this.handleMsgIsRead);
    }


    private listen(event: string, func: Function) {
        let p = window.pomelo;
        p.on(event, func.bind(this));
        this.events.push(event);
    }

    onDestroy() {
        this.cancleConfirm();
        window.pomelo.off("OrderState");
        window.pomelo.off("MsgReaded");
        agentUtil.agentRecharge = undefined;
    }
    public removeExtraListeners(): void {
        this.events.forEach(e => {
            window.pomelo.off(e);
        });
    }

    init(data: ChatInfo) {
        this.contentNode.children.forEach(el => {
            if (el.active) el.active = false;
        });

        this.imageSriteFrame = [];
        this._id = data.chatId;
        this.agentUid = data.aUid;
        this.agentName = data.aName;
        this.curOrderState = data.state;
        this.curOrderEvaluation = data.evaluation;
        this.curOrderReport = data.report;
        this.agentGender = data.gender;
        this.agentAvatar = data.avatar;
        let user = User.instance;
        this.myAvatar = user.avatarId;
        this.myGender = user.gender;
        this.myName = user.nick;

        if (data.typesDate) {
            this.curTypesDate = data.typesDate;
        }
        this.agentPayTypes = data.payTypes;

        this.initTitle(false);
        this.clientReadMsg();
        this.initContent(data.msgs);
        // this.initPayTypes(data.payTypes);

        this.needPayType = true;

        this.bottomBtsNode.active = true;
        this.tipNode.active = false;
        this.canSendMsg = true;
        this.title.node.y = this.orgTitleY;

        this.startConfirm();

        if (!agentUtil.isOld) {
            if (this.curOrderState === orderState.UNFINISHED || !this.curOrderState) {
                util.showConfirm("给代理转账后，请务必点击“发送付款截图”，上传您的支付凭证。不上传支付凭证金币不会到账!", "确定", "取消");
            }
        }
    }

    initWait() {
        this.contentNode.children.forEach(el => {
            if (el.active) el.active = false;
        });
        this.isWaiting = true;
        this.initTitle(true);
        this.bottomBtsNode.active = false;
        this.tipNode.getComponent(cc.Label).string = "匹配中，暂时无法发送消息";
        if (agentUtil.allPayType) {
            this.needPayType = true;
            this.agentPayTypes = agentUtil.allPayType;
            // this.initPayTypes(agentUtil.allPayType);
        }
        this.tipNode.active = true;
        this.title.node.y = 0;
        this.canSendMsg = false;
    }
    clientReadMsg() {
        window.pomelo.notify("chat.clientHandler.readChatMsg", { chatId: this._id });
        agentUtil.decReadMsg(this._id);
    }

    initOrderTrack(orderTrack: OrderTrack) {
        this.orderTrack = orderTrack;
    }
    initTitle(isWait: boolean = false) {
        if (isWait) {
            // let tmp = Math.ceil(Math.random() * 5);
            this.matchInfo.node.active = true;
            this.title.node.active = false;
            this.matchInfo.string = `当前充值方式为：${agentUtil.getNameByType(agentUtil.agentChat.mPayType)}
该充值方式的代理忙需要等待，请稍候
推荐您在左侧选择其他支付方式，减少排队时间`;
        } else {
            this.matchInfo.node.active = false;
            this.title.node.active = true;
            this.title.string = `代理${this.agentName}正在为您服务`;
        }
    }
    async initContent(data: ChatMsg[]) {
        if (!data) {
            this.initUI();
            return;
        }
        if (data.length < 10) {        // 初始化消息小于10个  说明是 没有分页的
            this.loadingPageInfo = true;      // 设置不再加载历史记录
        }

        if (agentUtil.isOld) {
            if (this.orderTrack) {
                for (let i = data.length - 1; i >= 0; i--) {
                    let tmsg = data[i];
                    if (tmsg.fromUid === this.agentUid) {
                        await this.createOneLeftItem(tmsg);
                    } else {
                        await this.createOneRightItem(tmsg, true);
                    }
                }
            } else {
                for (let i = 0; i < data.length; i++) {
                    let tmsg = data[i];
                    if (tmsg.fromUid === this.agentUid) {
                        await this.createOneLeftItem(tmsg);
                    } else {
                        await this.createOneRightItem(tmsg, true);
                    }
                }
            }
        } else {
            for (let i = data.length - 1; i >= 0; i--) {
                let tmsg = data[i];
                if (tmsg.fromUid === this.agentUid) {
                    await this.createOneLeftItem(tmsg);
                } else {
                    await this.createOneRightItem(tmsg, true);
                }
            }
        }

        this.initUI();
        this.scrollView.scrollToBottom();
    }

    initUI() {
        // 订单 完成或取消
        if (agentUtil.isOld) {
            if (this.curOrderState === 2 || this.curOrderState === 3) {
                this.bottomBtsNode.active = false;
                this.tipNode.active = true;
                this.tipNode.getComponent(cc.Label).string = "该订单已经关闭,无法继续聊天";
                this.canSendMsg = false;
                // 未评价
                if (this.curOrderEvaluation === 0) {
                    this.createEvaluationItem();
                }
                if (!this.curOrderReport) {
                    this.createReportItem();
                }
            }

        } else {
            if (this.curOrderState === orderState.FINISHED || this.curOrderState === orderState.CLOSED) {
                this.bottomBtsNode.active = false;
                this.tipNode.active = true;
                this.tipNode.getComponent(cc.Label).string = "警告，此订单已关闭无法充值和发送付款截图!";
                this.canSendMsg = false;
                if (this.curOrderState === orderState.FINISHED) {
                    // 未评价
                    if (this.curOrderEvaluation === 0) {
                        this.createEvaluationItem();
                    }
                    if (!this.curOrderReport) {
                        this.createReportItem();
                    }
                }
            }
        }
    }

    /**
     * 初始化 该代理的支持的支付方式
     */
    initPayTypes(payData: string[]) {

        this.payTypes.children.forEach(el => {
            if (el.active) el.active = false;
        });
        if (!payData || payData.length === 0) {
            return;
        }

        for (let i = 0; i < payData.length; i++) {
            let xItem = cc.instantiate(this.payTypeItem);
            xItem.getComponentInChildren(cc.Label).string = agentUtil.getNameByType(payData[i]);
            xItem.getComponent(cc.Button).clickEvents[0].customEventData = payData[i];
            xItem.active = true;
            this.payTypes.addChild(xItem);
        }
    }

    /**
     * 点击充值方式
     * @param event
     * @param customData
     */
    onClickPayType(event: cc.Event, customData: string) {
        if (this.isWaiting) {
            // this.closeAction(() => {
            agentUtil.changePayTypeInWait(customData);
            // });
        } else {
            window.pomelo.request("chat.clientHandler.switchPayType", { chatId: this._id, type: customData },
                (data: { code: number, chat?: { chatId: string, msgs: ChatMsg[] } }) => {
                    if (data.code != 200) {
                        util.showTip(ErrCodes.getErrStr(data.code, "切换支付方式失败"));
                        return;
                    }
                    if (data.chat.msgs) {
                        data.chat.msgs.forEach(el => {
                            this.createOneLeftItem(el);
                        });
                    }

                });
        }

        this.cancleConfirm();
        this.startConfirm();
    }

    createOneLeftItem(data: any, zIndex?: number) {
        cc.log("------createOneLeftItem---------", data);
        return new Promise(async reslove => {
            let leftItem = this.leftItem;
            if (data.type === 1 || data.type === 3 || data.type === 4) {  // 文字
                leftItem.chatLb.node.active = true;
                leftItem.payType.active = false;
                leftItem.setChatLbStr(data.content);
            } else if (data.type === 5) {  // 收款信息
                leftItem.chatLb.node.active = false;
                leftItem.payType.active = true;
                let jsonData = JSON.parse(data.content);
                leftItem.setPayTitle(agentUtil.getNameByType(jsonData[0].type));
                leftItem.setPayIndex(agentUtil.getIndexByType(jsonData[0].type));
                leftItem.setPayButtonCustomData(data.content);

                if (this.curTypesDate) {
                    let haveType = false;
                    for (const value of this.curTypesDate) {
                        if (jsonData.length === 1 && value.type != jsonData[0].type) continue;
                        if (jsonData.length === 2 && value.type != jsonData[0].type && value.type != jsonData[1].type) continue;
                        haveType = true;
                        if (value.date < data.createDate) continue;
                        leftItem.setPayButtonCustomData("expired");
                    }
                    if (!haveType) leftItem.setPayButtonCustomData("expired");
                }

                if (!this.agentPayTypes || this.agentPayTypes.length === 0) {
                    leftItem.setPayButtonCustomData("expired");
                }
            }
            leftItem.setTimeLbStr(data.createDate);
            leftItem.setIconSp(this.agentGender, this.agentAvatar);
            let nLeftItem = cc.instantiate(leftItem.node);
            nLeftItem.active = true;
            if (zIndex) nLeftItem.setLocalZOrder(zIndex);
            this.contentNode.addChild(nLeftItem);
            if (!zIndex && this.contentNode.height > this.scrollView.node.height) this.scrollView.scrollToBottom();
            reslove();
        })
    }
    async createOneRightItem(data: any, isHistory: boolean, zIndex?: number) {
        return new Promise(async reslove => {
            let rightItem = this.rightItem;
            rightItem.node.height = this.orgSize;
            if (data.type === 2) {   //  base64图片
                rightItem.image.node.active = true;
                rightItem.chatLb.node.active = false;
                if (isHistory) {
                    this.saveBase64ToFile(data.content);
                }
                await this.loadTmpPng();
                rightItem.setImage(this.tmpSp);
            } else {
                rightItem.image.node.active = false;
                rightItem.chatLb.node.active = true;
                rightItem.setChatLbStr(data.content);
            }
            if (isHistory) {
                rightItem.setTimeLbStr(data.createDate);
            } else {
                rightItem.setTimeLbStr(Date.now());
            }
            rightItem.setStateLbStr(data.read);
            rightItem.setIconSp(this.myGender, this.myAvatar);
            let nRightItem = cc.instantiate(rightItem.node);
            let chatContent = nRightItem.getComponent(ChatContent);
            this.unReadLable.push(chatContent.stateLb);

            nRightItem.active = true;
            if (zIndex) nRightItem.setLocalZOrder(zIndex);
            this.contentNode.addChild(nRightItem);
            if (!zIndex && this.contentNode.height > this.scrollView.node.height) this.scrollView.scrollToBottom();
            reslove();
        })
    }



    getUTF8(data: string) {
        if (!data) {
            return "";
        }
        var out, i, len, c;
        out = "";
        len = data.length;
        for (i = 0; i < len; i++) {
            c = data.charCodeAt(i);
            if ((c >= 0x0001) && (c <= 0x007F)) {
                out += data.charAt(i);
            } else if (c > 0x07FF) {
                out += String.fromCharCode(0xE0 | ((c >> 12) & 0x0F));
                out += String.fromCharCode(0x80 | ((c >> 6) & 0x3F));
                out += String.fromCharCode(0x80 | ((c >> 0) & 0x3F));
            } else {
                out += String.fromCharCode(0xC0 | ((c >> 6) & 0x1F));
                out += String.fromCharCode(0x80 | ((c >> 0) & 0x3F));
            }
        }
        return out;
    }
    createEvaluationItem() {

        this.nEvalaution = cc.instantiate(this.evaluationItem);
        this.nEvalaution.active = true;
        this.contentNode.addChild(this.nEvalaution);
        this.scrollView.scrollToBottom();

        this.bottomBtsNode.active = false;
        this.tipNode.active = true;
        this.tipNode.getComponent(cc.Label).string = "警告，此订单已关闭无法充值和发送付款截图!";
        this.canSendMsg = false;
    }


    createReportItem() {
        this.nReport = cc.instantiate(this.reportItem);
        this.nReport.active = true;
        this.contentNode.addChild(this.nReport);
        this.scrollView.scrollToBottom();

        this.bottomBtsNode.active = false;
        this.tipNode.active = true;
        this.tipNode.getComponent(cc.Label).string = "警告，此订单已关闭无法充值和发送付款截图!";
        this.canSendMsg = false;
    }

    private onClickAddImage() {
        this.cancleConfirm();
        this.startConfirm();
        this.hideMask();
        if (!this.canSendMsg) {
            return;
        }
        let callback = `cc.find('Canvas/parent/agentRecharge').getComponent('agentRecharge').choosePic();`;
        if (cc.sys.os === cc.sys.OS_IOS) {
            jsb.reflection.callStaticMethod("JsClass", "openImagePicke:andCallback:", this.tmpPath, callback);
        } else if (cc.sys.os === cc.sys.OS_ANDROID) {
            jsb.reflection.callStaticMethod("org/cocos2dx/javascript/JsClass", "goPhotoAlbum", "(Ljava/lang/String;Ljava/lang/String;)V", this.tmpPath, callback);
        }

    }

    saveBase64ToFile(data: string) {
        if (data.indexOf("data:image/png") != -1) {
            data = data.replace("data:image/png", "data:image/jpeg");
        }

        if (cc.sys.os === cc.sys.OS_IOS) {
            jsb.reflection.callStaticMethod("JsClass", "saveBase64ToFile:andData:", this.tmpPath, data);
        } else if (cc.sys.os === cc.sys.OS_ANDROID) {
            let str = "data:image/jpeg;base64,";
            data = data.substr(str.length);
            jsb.reflection.callStaticMethod("org/cocos2dx/javascript/JsClass", "saveBase64ToFile", "(Ljava/lang/String;Ljava/lang/String;)V", this.tmpPath, data);
        }
    }

    // 原生相册中选择图片后的回调
    choosePic() {
        let data: any = jsb.fileUtils.getDataFromFile(this.tmpPath);
        let base64data = this.arrayBufferToBase64(data);
        let senddata = {
            content: base64data,
            type: 2,
            chatId: this._id,
            createDate: Date.now(),
        };

        if (jsb.fileUtils.isFileExist(this.tmpPath)) {
            let self = this;
            cc.loader.load(this.tmpPath, (err: any, sp: cc.Texture2D) => {
                // 将玩家的图片 缩小5倍显示
                self.tmpSp = new cc.SpriteFrame(sp);
                // let spsize: cc.Size = self.tmpSp.getOriginalSize();
                // self.tmpSp.setOriginalSize(new cc.Size(spsize.width * 0.2, spsize.height * 0.2));
                this.createOneRightItem(senddata, false);
                this.sendMessage(senddata);
                cc.loader.release(this.tmpPath);
            });
        }
    }


    loadTmpPng() {
        return new Promise(resolve => {

            if (jsb.fileUtils.isFileExist(this.tmpPath)) {
                let self = this;
                cc.loader.load(this.tmpPath, (err: any, sp: any) => {
                    self.tmpSp = new cc.SpriteFrame(sp);
                    cc.loader.release(this.tmpPath);
                    resolve();
                });
            }
        });
    }

    loadUrlPng(imageData: string) {
        let self = this;
        return new Promise(resolve => {
            cc.loader.load({ url: imageData, type: 'png' }, function (error: any, spriteFrame: cc.Texture2D) {
                if (!error) {
                    self.tmpSp = new cc.SpriteFrame(spriteFrame);
                    resolve();
                } else {
                    util.showTip("加载二维码失败，请重试!");
                    cc.log("----error-----", error);
                }
            });
        });
    }
    arrayBufferToBase64(raw: any) {
        var base64 = '';
        var encodings = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
        var bytes = new Uint8Array(raw);
        var byteLength = bytes.byteLength;
        var byteRemainder = byteLength % 3;
        var mainLength = byteLength - byteRemainder;
        var a, b, c, d;
        var chunk;
        // Main loop deals with bytes in chunks of 3
        for (var i = 0; i < mainLength; i = i + 3) {
            // Combine the three bytes into a single integer
            chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
            // Use bitmasks to extract 6-bit segments from the triplet
            a = (chunk & 16515072) >> 18; // 16515072 = (2^6 - 1) << 18
            b = (chunk & 258048) >> 12; // 258048 = (2^6 - 1) << 12
            c = (chunk & 4032) >> 6; // 4032 = (2^6 - 1) << 6
            d = chunk & 63; // 63 = 2^6 - 1
            // Convert the raw binary segments to the appropriate ASCII encoding
            base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d];
        }
        // Deal with the remaining bytes and padding
        if (byteRemainder == 1) {
            chunk = bytes[mainLength];
            a = (chunk & 252) >> 2 // 252 = (2^6 - 1) << 2;
            // Set the 4 least significant bits to zero
            b = (chunk & 3) << 4 // 3 = 2^2 - 1;
            base64 += encodings[a] + encodings[b] + '==';
        }
        else if (byteRemainder == 2) {
            chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1];
            a = (chunk & 16128) >> 8 // 16128 = (2^6 - 1) << 8;
            b = (chunk & 1008) >> 4 // 1008 = (2^6 - 1) << 4;
            // Set the 2 least significant bits to zero
            c = (chunk & 15) << 2 // 15 = 2^4 - 1;
            base64 += encodings[a] + encodings[b] + encodings[c] + '=';
        }
        return "data:image/jpeg;base64," + base64;
    }


    /**
     * 点击消息发送
     */
    private onClickSendButton() {
        this.cancleConfirm();
        this.startConfirm();
        if (!this.canSendMsg) {
            return;
        }
        let data: SendChatMsg = undefined;
        let content = this.edit.string;

        if (content === "" || !content) {
            util.showTip("发送内容不能为空!");
            return;
        } else {
            data = {
                content: content,
                chatId: this._id,
                type: 1,
                createDate: Date.now(),
            }
        }

        this.createOneRightItem(data, false);
        this.sendMessage(data);
    }
    sendMessage(data: any) {
        let self = this;
        window.pomelo.request("chat.clientHandler.sendMsgToAgent", data, (data: { code: number, chatId: string, msgId: string }) => {
            if (data.code === 200) {

            } else {
                util.showTip(ErrCodes.getErrStr(data.code, "发送信息失败"));
            }
        });
        self.edit.string = "";
    }
    /**
     * 点击评价
     * @param event
     * @param customData
     */
    onClickEvaluationBt(event: cc.Event, customData: string) {
        this.cancleConfirm();
        this.startConfirm();

        let tip = customData === "2" ? "感谢您的好评,我们会做得更好!" : "感谢您的评价,我们会努力改正!";
        window.pomelo.request("chat.clientHandler.evaluation", { chatId: this._id, evaluation: +customData }, (data: { code: number }) => {
            if (data.code === 200) {
                this.nEvalaution.active = false;
                this.scrollView.scrollToBottom();
                if (this.orderTrack) {
                    this.orderTrack.chgOrderIcon(+customData);
                }
                util.showTip(tip);
            } else {
                util.showTip(ErrCodes.getErrStr(data.code, "评价失败"));
            }
        });
    }


    /**
     * 点击举报按钮
     */
    onClickReport() {
        this.cancleConfirm();
        this.startConfirm();
        this.reportInfo.active = true;
    }

    onClcikCloseReportInfo() {
        this.reportInfo.active = false;
    }

    onClickConfirmReport() {
        if (!this.reportEdit.string) {
            util.showTip("请输入举报理由");
            return;
        }
        window.pomelo.request("chat.clientHandler.report", { chatId: this._id, reportRemarks: this.reportEdit.string }, (data: { code: number }) => {
            if (data.code === 200) {
                util.showTip("举报代理成功,我们会以邮件方式告知您处理结果!");
                this.nReport.active = false;
                this.reportInfo.active = false;
                this.scrollView.scrollToBottom();
            } else {
                util.showTip(ErrCodes.getErrStr(data.code, "举报代理失败"));
            }
        });
    }
    onClickScaleBt(event: cc.Event, customData: string) {
        this.cancleConfirm();
        this.startConfirm();
        this.scaleSp.spriteFrame = this.imageSriteFrame[+customData];
        this.changeImgSize(this.scaleSp.node, 350, false);
        this.scaleNode.active = true;
    }

    onClickScaleCloseBt() {
        this.scaleNode.active = false;
    }

    /**
     * 处理聊天消息
     * @param data
     */
    handleChatToClientMsg(data: AcceptChatMsg) {
        if (this._id === data.chatId) {
            this.createOneLeftItem(data);
            this.clientReadMsg();
        }
    }



    /**
     * 处理订单状态  以便显示  评价.举报
     * @param data
     */
    handleOrderState(data: { chatId: string, state: number }) {
        if (data.chatId != this._id) {
            return;
        }
        if (agentUtil.isOld) {
            if (data.state === 2 || data.state === 3) {
                this.createEvaluationItem();
                this.createReportItem();
                this.cancleConfirm();
                if (this.orderTrack) {
                    this.orderTrack.chgOrderState(data.state);
                }
                this.curOrderState = data.state;
            }
        } else {
            if (data.state === orderState.FINISHED || data.state === orderState.CLOSED) {
                if (data.state === orderState.FINISHED) {
                    this.createEvaluationItem();
                    this.createReportItem();
                }
                this.cancleConfirm();
                if (this.orderTrack) {
                    this.orderTrack.chgOrderState(data.state);
                }
                this.curOrderState = data.state;
            }
        }
    }

    /**
     * 处理消息已读
     */
    handleMsgIsRead(data: { code: number, chatId: string }) {
        if (data.chatId === this._id) {
            this.unReadLable.forEach(el => {
                el.string = "已读";
            });
        }
    }

    changeImgSize(imgNode: cc.Node, toSize: number = 400, isRotate: boolean = false) {
        let nheight = imgNode.height;
        let nwidth = imgNode.width;
        imgNode.rotation = 0;
        imgNode.scale = 1;
        if (imgNode.height > imgNode.width && imgNode.height > toSize) {
            if (nheight / nwidth > 1.5 && isRotate) {
                imgNode.rotation = 90;
            }
            imgNode.scale = toSize / nheight;
        } else if (imgNode.width >= imgNode.height && imgNode.width > toSize) {
            imgNode.scale = toSize / nwidth;
        }
    }

    onClickCopy(ev: cc.Event, customData: string) {
        this.cancleConfirm();
        this.startConfirm();
        let node: cc.Node = ev.target;
        let parent = node.parent.parent;
        let lb = parent.getComponent(cc.Label);
        if (lb && lb.string) {
            util.setClipboard(lb.string);
            util.showTip("内容已拷贝到剪切板!");
        }
    }

    closeAction(cb?: Function) {
        super.closeAction(cb);
        agentUtil.closeAgentRecharge();
    }

    /**
     * 点击小卡片充值
     * @param event
     * @param customData
     */
    async onClickPay(event: cc.Event, customData: string) {
        if (agentUtil.isOld) {
            if (this.curOrderState === 2 || this.curOrderState === 3) {
                util.showTip("亲,该订单已经关闭了哟～");
                return;
            }
        } else {
            if (this.curOrderState === orderState.FINISHED || this.curOrderState === orderState.CLOSED) {
                util.showTip("亲,该订单已经关闭了哟～");
                return;
            }
            if (customData === "expired") {
                util.showTip("当前订单已失效，请关闭订单后，重新选择");
                return;
            }
        }

        this.cancleConfirm();
        this.startConfirm();

        this.imageNode.active = false;
        this.textPay.active = false;
        this.agentID.string = "" + this.agentUid;


        let tmp = JSON.parse(customData);

        for (let i = 0; i < tmp.length; i++) {
            let jData = tmp[i];
            if (jData.qrCode) {
                util.showLoading("加载中");
                this.imageNode.active = true;

                this.codeFeeRate.string = "手续费率：" + (jData.feeRate ? +jData.feeRate * 100 + "%" : "0");

                if (cc.sys.isNative) {
                    this.saveBase64ToFile(jData.qrCode);
                    await this.loadTmpPng();
                    this.imageSp.spriteFrame = this.tmpSp;
                }

                this.imageSriteFrame.push(this.imageSp.spriteFrame);
                this.imageSp.node.getComponent(cc.Button).clickEvents[0].customEventData = "" + (this.imageSriteFrame.length - 1);
                this.changeImgSize(this.imageSp.node, 300, false);
                this.imageTitle.string = "【" + agentUtil.getNameByType(jData.type) + "二维码付款" + "】";

                util.hideLoading();
            } else {
                this.txtFeeRate.string = "手续费率：" + (jData.feeRate ? +jData.feeRate * 100 + "%" : "0");
                this.textPay.active = true;
                this.actLabel.string = jData.act;
                this.nameLabel.string = jData.name;
                this.textPay.getChildByName("title").getComponent(cc.Label).string = "【" + agentUtil.getNameByType(jData.type) + "转账付款" + "】";
            }
        }

        this.payInfo.active = true;
    }


    /**
     * 点击已付款
     */
    onClickPaid() {
        if (agentUtil.isOld) {
            if (this.curOrderState === 2 || this.curOrderState === 3) {
                util.showTip("亲,该订单已经关闭了哟～");
                return;
            }
        } else {
            if (this.curOrderState === orderState.FINISHED || this.curOrderState === orderState.CLOSED) {
                util.showTip("亲,该订单已经关闭了哟～");
                return;
            }
        }

        let data = {
            content: "我已经付款了，请尽快充值!",
            chatId: this._id,
            type: 3,
            createDate: Date.now(),
        }

        this.createOneRightItem(data, false);
        this.sendMessage(data);
        this.sendAgentMsg();
        this.payInfo.active = false;

        this.showMask();
    }



    showMask() {
        this.mask.active = true;
        this.arrow.stopAllActions();
        this.arrow.runAction(cc.sequence(cc.moveBy(0.4, cc.p(0, -20)), cc.moveBy(0.7, cc.p(0, 20))).repeatForever());
    }

    hideMask() {
        this.mask.active = false;
        this.arrow.stopAllActions();
    }


    sendAgentMsg() {
        let data = {
            content: "亲，成功付款后，请点击左下方的上传按钮，上传您的充值截图哦～",
            chatId: this._id,
            type: 4,
            createDate: Date.now(),
        }

        this.createOneLeftItem(data);
        this.sendMessage(data);
    }
    /**
     * 点击账户异常
     */
    onClickActException() {
        if (agentUtil.isOld) {
            if (this.curOrderState === 2 || this.curOrderState === 3) {
                util.showTip("亲,该订单已经关闭了哟～");
                return;
            }
            this.edit.string = "你的收款账户存在异常，请检查!";
            this.onClickSendButton();

            this.payInfo.active = false;
        } else {
            if (this.curOrderState === orderState.FINISHED || this.curOrderState === orderState.CLOSED) {
                util.showTip("亲,该订单已经关闭了哟～");
                return;
            }
            let data = {
                content: "你的收款账户存在异常，请检查!",
                chatId: this._id,
                type: 0,
                createDate: Date.now(),
            }
            this.createOneRightItem(data, false);
            this.sendMessage(data);
            this.payInfo.active = false;
        }
    }

    /**
     * 点击下一个支付方式
     */
    onClickNextPayInfo() {
        this.cancleConfirm();
        this.startConfirm();
        if (this.imageNode.active) {
            this.imageNode.active = false;
            this.textPay.active = true;
        } else {
            this.imageNode.active = true;
            this.textPay.active = false;
        }
    }

    onClickClosePayInfo() {
        this.payInfo.active = false;
    }

    onClickCopyAct() {
        util.setClipboard(this.actLabel.string);
        util.showTip("内容已拷贝到剪切板!");
    }
    onClickCopyName() {
        util.setClipboard(this.nameLabel.string);
        util.showTip("内容已拷贝到剪切板!");
    }
    onScrollEvent() {
        // 滑到最上面
        if (this.scrollView.getScrollOffset().y < -20 && !this.loadingPageInfo && !this.isWaiting) {
            this.loadingPageInfo = true;
            this.getOrderInfoPage();
        }
    }

    getOrderInfoPage() {
        cc.log("====getOrderInfoPage====");
        util.showLoading("加载历史消息中");
        this.curPage++;
        window.pomelo.request("chat.clientHandler.getChatMsg", {
            chatId: this._id,
            pageCnt: 10,
            page: this.curPage,
        },
            (data: {
                code: number, chat: orderInfo, msgs: ChatMsg[], payTypes: string[], online: number,
                gender: number, avatar: number
            }) => {
                util.hideLoading();
                if (data.code === 200) {
                    if (!data.msgs || data.msgs.length === 0) {
                        util.showTip("没有更多历史消息了!");
                    } else {
                        this.initPageContent(data.msgs);
                    }
                } else {
                    this.loadingPageInfo = false;
                    util.showTip(ErrCodes.getErrStr(data.code, "加载失败"));
                }
            });
    }

    async initPageContent(data: ChatMsg[]) {
        if (!data) {
            return;
        }
        for (let i = 0; i < data.length; i++) {
            let tmsg = data[i];
            this.curZIndex--;
            if (tmsg.fromUid === this.agentUid) {
                await this.createOneLeftItem(tmsg, this.curZIndex);
            } else {
                await this.createOneRightItem(tmsg, true, this.curZIndex);
            }
        }
        this.scrollView.getScrollOffset().y = 0;
        this.loadingPageInfo = false;
    }


    startConfirm() {
        if (this.curOrderState === orderState.UNFINISHED || !this.curOrderState) {
            this.scheduleOnce(this.callBack, 60);
        }
    }
    callBack() {
        util.showConfirm("亲，请问您充值了吗？请点击小卡片充值哦");
    }
    cancleConfirm() {
        this.unschedule(this.callBack);

    }

    /**
 * 玩家点击关闭订单
 */
    async onClickCloseOrder() {
        if (agentUtil.isOld) {
            util.showTip("此功能暂未开放!");
            return;
        }
        let node = util.showConfirm("此订单关闭后，本次充值将无法给该商人发送付款截图，请确定是否关闭", "确定", "取消");
        let self = this;
        node.okFunc = async function () {
            window.pomelo.request("chat.clientHandler.closeOrder", {
                chatId: self._id,
            }, (data: { code: number }) => {
                if (data.code != 200) {
                    util.showTip(ErrCodes.getErrStr(data.code, "关闭订单失败"));
                } else {
                    self.bottomBtsNode.active = false;
                    self.tipNode.active = true;
                    self.canSendMsg = false;
                    self.curOrderState = orderState.CLOSED;
                    // self.orderTrack.chgOrderState(orderState.CLOSED);
                    self.tipNode.getComponent(cc.Label).string = "警告，此订单已关闭无法充值和发送付款截图!";
                }
            });
        }
    }

}
