import * as util from "../common/util";
import PopActionBox from "./popActionBox"
import { Mail, MailMsg } from "./mailMsg";
import { setClipboard, showTip } from "../common/util";

const { ccclass, property } = cc._decorator;

@ccclass
export default class MailBox extends PopActionBox {
    @property(cc.Node)
    nodeList: cc.Node = undefined;

    @property(cc.Node)
    nodeContent: cc.Node = undefined;

    @property(cc.Node)
    btnClearAll: cc.Node = undefined;

    @property(cc.Node)
    btnDelRead: cc.Node = undefined;

    // 邮件列表
    @property(cc.ScrollView)
    svMail: cc.ScrollView = undefined;

    @property(cc.Node)
    svItem: cc.Node = undefined;

    @property(cc.Node)
    labTips: cc.Node = undefined;

    // 邮件内容
    @property(cc.Label)
    labDate: cc.Label = undefined;

    @property(cc.Label)
    rtContent: cc.Label = undefined;

    @property(cc.Node)
    private nodeCopyCode: cc.Node = undefined;

    private currMail: Mail;
    private msg: MailMsg;
    private withdrawCode: string;

    onLoad() {
        super.onLoad();
        this.mailJudge(false);
        this.svMail.node.active = false;
    }

    start() {
        this.openAnim(() => {
            this.svMail.node.active = true;
        });
    }

    setMailMsg(msg: MailMsg) {
        this.msg = msg;
        this.msg.pullMails(0, () => this.showMailList(this.msg.mails))
        this.svMail.content.removeAllChildren();
    }

    svDidScroll(ev: cc.Event.EventTouch, eventType: cc.ScrollView.EventType) {
        if (cc.ScrollView.EventType.SCROLL_TO_BOTTOM === eventType) {
            let p = this.svMail.content.childrenCount / 20;
            if (Math.floor(p) === p)
                this.msg.pullMails(p, (mails: Mail[]) => this.showMailList(mails))
        }
    }

    mailJudge(bol:boolean){
        this.labTips.active = !bol;
        this.btnDelRead.active = bol;
        this.btnClearAll.active = bol;
    }

    showMailList(mailInfoArr: Mail[]) {
        this.nodeList.active = true;
        this.nodeContent.active = false;
        if (mailInfoArr && mailInfoArr.length > 0) {
            this.mailJudge(true);
            // 游戏中邮件排序：1.时间最近的排前面 2.未读的排前面
            // mailInfoArr.sort((a, b) => {
            //     if (a.bRead === b.bRead) {
            //         return b.sendTime - a.sendTime;
            //     } else if (a.bRead) {
            //         return 1;
            //     } else {
            //         return -1;
            //     }
            // });
            mailInfoArr.forEach(mailInfo => {
                let item = util.instantiate(this.svItem);
                item.active = true;
                let readIcon = item.getChildByName("readIcon");
                let labContent = item.getChildByName("labContent").getComponent(cc.Label);
                let labDate = item.getChildByName("labDate").getComponent(cc.Label);

                readIcon.opacity = mailInfo.bRead ? 160 : 255;
                labContent.string = this.getPreviewContent(mailInfo.content);
                labContent.node.opacity = mailInfo.bRead ? 160 : 255;
                // let date = new Date(mailInfo.sendTime);
                // let dateStr = date.getFullYear() + "-" + util.pad(date.getMonth() + 1, 2) + "-" + date.getDate() + " " + util.pad(date.getHours(), 2) + ":" + util.pad(date.getMinutes(), 2);
                let dateStr = util.formatTimeStr('m', mailInfo.sendTime);
                labDate.string = dateStr;

                this.svMail.content.addChild(item);

                let handler = new cc.Component.EventHandler();
                handler.target = this.node;
                handler.component = "mailBox";
                handler.handler = "showMailDetail";
                handler.customEventData = JSON.stringify(mailInfo);
                item.getComponent(cc.Button).clickEvents.push(handler);
            });
        }else{
            this.mailJudge(false);
        }

        if (this.svMail.content.childrenCount) {
            this.labTips.active = false;
            this.btnClearAll.active = true;
            this.btnDelRead.active = true;
        } else {
            this.labTips.active = true;
            this.btnClearAll.active = false;
            this.btnDelRead.active = false;
        }
    }

    showMailDetail(ev: cc.Event.EventTouch, data: string) {
        this.nodeList.active = false;
        this.nodeContent.active = true;

        let mailInfo = JSON.parse(data) as Mail;
        this.currMail = mailInfo;
        let dateStr = util.formatTimeStr('m', mailInfo.sendTime);
        this.labDate.string = dateStr;
        let content = mailInfo.content;
        this.rtContent.string = content;

        this.nodeCopyCode.active = false;
        this.withdrawCode = undefined;

        let reg = /.*兑换码:(.*)\n?/g;
        let s = content.match(reg);
        if (s && s.length === 1) {
            let code = s[0].replace(reg, "$1");
            this.nodeCopyCode.active = true;
            this.withdrawCode = code;
        }

        if (!mailInfo.bRead) {
            window.pomelo.notify("lobby.mailHandler.read", { id: mailInfo._id });
            mailInfo.bRead = true;
            this.msg.changeMailRead(mailInfo._id, true);
        }

    }

    private getPreviewContent(content: string) {
        let str = "";
        for (let c of content) {
            if (c === "\n") {
                break;
            }
            str += c;
            if ((str.length + 3) >= 20) {
                return str + "…";
            }
        }
        return str;
    }

    onClickBack() {
        this.svMail.content.removeAllChildren();
        this.showMailList(this.msg.mails);
    }

    async onClickClearAll() {
        let isSuccess = await this.msg.clearAllMails();
        if (isSuccess)
            this.onClickBack();
    }

    async onClickClearRead() {
        let isSuccess = await this.msg.delReadMails();
        if (isSuccess)
            this.onClickBack();
    }

    async onClickDel() {
        let isSuccess = await this.msg.delMailInfo(this.currMail);
        if (isSuccess)
            this.onClickBack();
    }

    private onClickCopyCode() {
        if (!this.withdrawCode) {
            return;
        }
        let success = setClipboard(this.withdrawCode);
        if (success) {
            showTip("复制兑换码成功");
        } else {
            showTip("复制兑换码失败");
        }
    }
}
