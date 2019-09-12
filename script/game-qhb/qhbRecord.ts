import QHBGame from "./qhbGame";
import { add } from "../common/util";


const {ccclass, property} = cc._decorator;

@ccclass
export default class QHBRecord extends cc.Component {
    @property(cc.Toggle)
    sendTg: cc.Toggle = undefined;

    @property(cc.Toggle)
    grabTg: cc.Toggle = undefined;

    @property(cc.Node)
    private grabSview: cc.Node = undefined;

    @property(cc.Node)
    private sendSvContent: cc.Node = undefined;

    @property(cc.Node)
    private grabSvContent: cc.Node = undefined;

    @property(cc.Node)
    private sendSvItem: cc.Node = undefined;

    @property(cc.Node)
    private grabSvItem: cc.Node = undefined;

    @property(cc.Node)
    private sendTitle: cc.Node = undefined;

    @property(cc.Node)
    private grabTitle: cc.Node = undefined;

    @property(cc.Node)
    private sendInfo: cc.Node = undefined;

    @property(cc.Node)
    private grabInfo: cc.Node = undefined;

    @property(cc.Label)
    private tips: cc.Label = undefined;

    @property([cc.SpriteFrame])
    private sfEmojiText: cc.SpriteFrame[] = [];

    @property([cc.SpriteFrame])
    private sfEmoji: cc.SpriteFrame[] = [];

    @property([cc.SpriteFrame])
    private sfTitle: cc.SpriteFrame[] = [];

    private game: QHBGame;

    setGame(game: QHBGame) {
        this.game = game;
    }
    show() {
        this.node.active = true;
        if (this.sendTg.isChecked) {
            this.showSendList();
        } else {
            this.showGrabList();
        }
    }

    hide() {
        this.node.active = false;
    }

    onClickSend() {
        this.showSendList();
    }

    onClickGrab() {
        this.showGrabList();
    }

    showSendList() {
        this.showSendInfo();

        this.tips.node.active = false;
        this.grabSview.active = false;
        this.grabTitle.active = false;
        this.grabSvContent.active = false;

        let data = this.game.sRecord;
        if (!data || data.length === 0) {
            this.tips.string = "暂无记录～"
            this.tips.node.active = true;
            return;
        }
        this.sendTitle.active = true;
        this.sendSvContent.active = true;

        for(let idx = 0; idx < data.length; idx++) {
            let item;
            if (idx < this.sendSvContent.childrenCount) {
                item = this.sendSvContent.children[idx];
            } else {
                item = cc.instantiate(this.sendSvItem);
                this.sendSvContent.addChild(item);
            }

            let rank = item.getChildByName("rank").getComponent(cc.Label);
            let money = item.getChildByName("money").getComponent(cc.Label);
            let boomPly = item.getChildByName("boomPly").getComponent(cc.Label);
            let title = item.getChildByName("title_bg").getChildByName("title").getComponent(cc.Sprite);

            rank.string = (idx + 1).toString();
            money.string = data[idx].rbMoney;
            let num = data[idx].boomedPly;
            boomPly.string = num.toString();
            title.spriteFrame = this.sfTitle[num]
            item.active = true;

            if (data.length < this.sendSvContent.childrenCount) {
                for (let idx = data.length; idx < this.sendSvContent.childrenCount; idx++) {
                    let item = this.sendSvContent.children[idx];
                    item.active = false;
                }
            }
        }
    }

    showGrabList() {
        this.showGrabInfo();

        this.tips.node.active = false;
        this.sendTitle.active = false;
        this.sendSvContent.active = false;

        let data = this.game.gRecord;
        if (!data || data.length === 0) {
            this.tips.string = "暂无记录～"
            this.tips.node.active = true;
            return;
        }
        this.grabSview.active = true;
        this.grabTitle.active = true;
        this.grabSvContent.active = true;

        for (let idx = 0; idx < data.length; idx++) {
            let item;
            if (idx < this.grabSvContent.childrenCount) {
                item = this.grabSvContent.children[idx];
            } else {
                item = cc.instantiate(this.grabSvItem);
                this.grabSvContent.addChild(item);
            }

            let rank = item.getChildByName("rank").getComponent(cc.Label);
            let money = item.getChildByName("money").getComponent(cc.Label);
            let boomNo = item.getChildByName("boomNo").getComponent(cc.Label);
            let grabMoney = item.getChildByName("grabMoney").getComponent(cc.Label);
            let emoji = item.getChildByName("emoji").getComponent(cc.Sprite);
            let emojiText = item.getChildByName("emojiText").getComponent(cc.Sprite);

            rank.string = (idx + 1).toString();
            money.string = data[idx].money;
            grabMoney.string = data[idx].grabMoney;
            boomNo.string = data[idx].boom.toString();
            let isBoom = data[idx].isBoom;
            emoji.spriteFrame = this.sfEmoji[isBoom];
            emojiText.spriteFrame = this.sfEmojiText[isBoom];
            item.active = true;

            if (data.length < this.grabSvContent.childrenCount) {
                for (let idx = data.length; idx < this.grabSvContent.childrenCount; idx++) {
                    let item = this.grabSvContent.children[idx];
                    item.active = false;
                }
            }
        }
    }

    showSendInfo() {
        this.grabInfo.active = false;
        this.sendInfo.active = true;

        let money = 0;
        let boomPlys = 0;
        this.game.sRecord.forEach((record) => {
            money = add(record.rbMoney, money).toNumber() ;
            boomPlys = add(record.boomedPly, boomPlys).toNumber();
        });
        let lblMoney = this.sendInfo.getChildByName("money").getComponent(cc.Label);
        let lblBoom = this.sendInfo.getChildByName("boom").getComponent(cc.Label);
        lblMoney.string = money.toString();
        lblBoom.string = boomPlys.toString();
    }

    showGrabInfo() {
        this.sendInfo.active = false;
        this.grabInfo.active = true;

        let money = 0;
        let grabMoney = 0;
        let boomPlys = 0;
        this.game.gRecord.forEach((record) => {
            money = add(record.money, money).toNumber();
            grabMoney = add(record.grabMoney, grabMoney).toNumber();
            if (record.isBoom) {
                boomPlys++;
            }
        });
        let lblMoney = this.grabInfo.getChildByName("money").getComponent(cc.Label);
        let lblGrabMoney = this.grabInfo.getChildByName("grabMoney").getComponent(cc.Label);
        let lblBoom = this.grabInfo.getChildByName("boom").getComponent(cc.Label);
        lblMoney.string = money.toString();
        lblGrabMoney.string = grabMoney.toString();
        lblBoom.string = boomPlys.toString();
    }
}
