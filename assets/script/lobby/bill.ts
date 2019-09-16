import { Gender, UserInfo, Where, User } from "../common/user";
import * as util from "../common/util";
import { ErrCodes } from "../common/code";
import PopActionBox from "./popActionBox";
import BillDetail from "./billDetail";

export interface TransferRecrod {
    uid: number;
    vipUid: number;
    money: string;
    dateTime: number;
    state: number;
    status: number;
    orderId: string;
}

const { ccclass, property } = cc._decorator;

@ccclass
export default class Bill extends PopActionBox {
    @property(cc.ScrollView)
    svContent: cc.ScrollView = undefined;

    @property(cc.Node)
    contentItem: cc.Node = undefined;

    @property(cc.Label)
    labTips: cc.Label = undefined;

    @property(cc.Prefab)
    preDetail: cc.Prefab = undefined;

    transfers: TransferRecrod[] = [];

    page = 0;

    onLoad() {
        super.onLoad();
        this.svContent.node.active = false;
    }

    start() {
        this.svContent.content.removeAllChildren();
        this.openAnim(() => {
            this.svContent.node.active = true;
        });
    }

    showContent() {
        this.loadRec(true);
    }

    loadRec(first = false) {
        first && util.showLoading("");
        window.pomelo.request("lobby.billHandler.getVipData", { page: this.page++ }, (data: { code: number; vipInfo?: TransferRecrod[] }) => {
            first && util.hideLoading();

            if (data.vipInfo) {
                this.transfers.push(...data.vipInfo);
                this.labTips.node.active = false;

                data.vipInfo.forEach(transferInfo => {
                    let item = util.instantiate(this.contentItem);
                    let bgRed = item.getChildByName("bgRed");
                    let bgGreen = item.getChildByName("bgGreen");
                    let transfer = item.getChildByName("transfer").getComponent(cc.Label);
                    let labId = item.getChildByName("id").getComponent(cc.Label);
                    let labMoney = item.getChildByName("money").getComponent(cc.Label);
                    let labDate = item.getChildByName("date").getComponent(cc.Label);
                    let labState = item.getChildByName("state").getChildByName("status").getComponent(cc.Label);

                    let transferOut = (transferInfo.uid === User.instance.uid)
                    bgRed.active = false;
                    bgGreen.active = false;
                    if (transferOut) {
                        bgRed.active = true;
                        transfer.string = "转出";
                        labId.string = transferInfo.vipUid.toString();
                    } else {
                        bgGreen.active = true;
                        transfer.string = "转入";
                        labId.string = transferInfo.uid.toString();
                    }
                    labMoney.string = transferInfo.money;
                    let dateStr = util.formatTimeStr('m', transferInfo.dateTime);
                    labDate.string = dateStr;

                    labState.string = "延迟到账";
                    labState.node.parent.color = cc.hexToColor('#FF9900');
                    if (transferInfo.state === 6) {
                        labState.string = "失败";
                        labState.node.parent.color = cc.hexToColor('#FF0101');
                        if (transferInfo.status & 0x2000) {
                            labState.string = "成功";
                            labState.node.parent.color = cc.hexToColor('#037C05');
                        }
                    }

                    this.svContent.content.addChild(item);
                });
            } else {
                this.labTips.node.active = first;
            }
        });
    }

    svDidScroll(ev: any, eventType: cc.ScrollView.EventType) {
        if (cc.ScrollView.EventType.SCROLL_TO_BOTTOM === eventType) {
            this.loadRec()
        }
    }

    onClickDetail(ev: cc.Event.EventTouch) {
        let ui = util.instantiate(this.preDetail);
        let Canvas = cc.find("Canvas");
        Canvas.addChild(ui);
        let idx = this.svContent.content.children.indexOf(ev.target);
        ui.getComponent(BillDetail).showContent(this.transfers[idx]);
    }
}
