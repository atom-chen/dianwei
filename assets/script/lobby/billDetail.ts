import PopActionBox from "./popActionBox"
import { captureScreen, shareImage, formatTimeStr } from "../common/util";
import { TransferRecrod } from "./bill";

const { ccclass, property } = cc._decorator;

const infos = [
    `您提交的转账请求正在进行转账，由于业务繁忙，转账会出现延迟，一般情况会延迟5-30分钟，我们会尽快为您转账，请耐心等待`,

    `您提交的转账请求已经转账失败，失败后金币已经返回你的保险箱，请到保险箱中进行查收`,

    `您提交的转账请求已经完成，请复制转账凭证联系商人进行兑换`,
];

@ccclass
export default class BillDetail extends PopActionBox {

    static check(status: number) {
        return (status & 0x2000) === 0;
    }

    @property(cc.Label)
    userId: cc.Label = null;

    @property(cc.Label)
    merId: cc.Label = null;

    @property(cc.Label)
    time: cc.Label = null;

    @property(cc.Label)
    amount: cc.Label = null;

    @property(cc.Label)
    orderId: cc.Label = null;

    @property(cc.Label)
    status: cc.Label = null;

    @property(cc.RichText)
    info: cc.RichText = null;

    @property(cc.Node)
    copy: cc.Node = null;


    showContent(order: TransferRecrod) {
        this.userId.string = order.uid + '';
        this.merId.string = order.vipUid + '';
        this.time.string = formatTimeStr('m', order.dateTime);
        this.amount.string = order.money;
        this.orderId.string = order.orderId;

        this.status.string = "延迟到账";
        this.info.string = infos[0];
        if (order.state === 6) {
            this.status.string = "失败";
            this.info.string = infos[1];
            if (order.status & 0x2000) {
                this.status.string = "成功";
                this.info.string = infos[2];
                this.copy.active = true;
            }
        }

    }

    async onClickCopy() {
        let path = await captureScreen();
        shareImage(path);
    }

}
