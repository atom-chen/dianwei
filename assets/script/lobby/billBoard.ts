import PopActionBox from "./popActionBox"
import * as util from "../common/util";
import { showLoading, hideLoading } from "../common/util";
export interface BillboardTitle {
    idx: number,
    title: string,
}
export interface BulletinData {
    idx: number,
    title: string,
    subTitle: string,
    content: string
}

const { ccclass, property } = cc._decorator;

@ccclass
export class BillBoard extends PopActionBox {
    @property(cc.Label)
    labTitle: cc.Label = undefined;

    @property(cc.ToggleContainer)
    tgBtn: cc.ToggleContainer = undefined;

    @property(cc.Node)
    tBtn: cc.Node = undefined;

    @property(cc.Node)
    svNode: cc.Node = undefined;

    @property(cc.RichText)
    svContent: cc.RichText = undefined;

    @property(cc.Label)
    labVer: cc.Label = undefined;

    private notices: BulletinData[] = [];
    private sv: cc.ScrollView;

    onLoad() {
        super.onLoad();
        this.svNode.active = false;
        this.sv = this.svNode.getComponent(cc.ScrollView);
        this.svContent.node.opacity = 0;
    }

    start() {
        this.openAnim(() => {
            let node = this.svNode;
            node.active = true;
            node.stopAllActions();
            node.opacity = 0;
            node.runAction(cc.fadeIn(0.2));
        });
    }

    showBillBoard(titles: BillboardTitle[]) {
        if (titles && titles.length > 0) {
            if (titles.length > 5) {
                this.tgBtn.node.scale = 0.8;
            }
            this.tgBtn.node.active = true;

            this.tgBtn.node.removeAllChildren();

            titles.forEach((titleInfo) => {
                let item = util.instantiate(this.tBtn);

                this.tgBtn.node.addChild(item);

                let labBg = item.getChildByName("bg").getChildByName("lab").getComponent(cc.Label);
                let labMark = item.getChildByName("mark").getChildByName("lab").getComponent(cc.Label);
                labBg.string = titleInfo.title.toString();
                labMark.string = titleInfo.title.toString();
                let handler = new cc.Component.EventHandler();
                handler.target = this.node;
                handler.component = "billBoard";
                handler.handler = "onClickTog";
                handler.customEventData = titleInfo.idx.toString();
                item.getComponent(cc.Toggle).checkEvents.push(handler);
            });
            this.requestContent(titles[0].idx.toString());
        }
        else {
            this.tgBtn.node.active = false;
            this.svNode.active = false;
        }
    }

    onClickTog(ev: cc.Event.EventTouch, idxStr: string) {
        this.requestContent(idxStr);
    }

    requestContent(idxStr: string) {
        let notice: BulletinData = this.notices.filter(value => value.idx.toString() === idxStr)[0];
        if (notice) {
            this.showContent(notice);
        } else {
            showLoading("加载公告");
            window.pomelo.request("lobby.lobbyHandler.getBillboard", { idx: idxStr }, (data: { code: number, billboard?: BulletinData }) => {
                hideLoading();
                if (data.code === 200 && data.billboard) {
                    this.notices.push(data.billboard);
                    this.showContent(data.billboard);
                }
            });
        }
    }
    showContent(notice: BulletinData) {
        this.labTitle.string = notice.subTitle;

        this.sv.stopAutoScroll();
        this.sv.scrollToTop();
        this.svContent.string = notice.content;

        let node = this.svContent.node;
        node.stopAllActions();
        node.opacity = 0;
        node.runAction(cc.fadeIn(0.2));
    }
}
