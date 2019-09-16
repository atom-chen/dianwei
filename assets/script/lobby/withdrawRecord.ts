import { showLoading, hideLoading, showTip } from "../common/util";
import { ErrCodes } from "../common/code";
import * as util from "../common/util";
import PopActionBox from "./popActionBox"
import WithdrawDetail from "./withdrawDetail";
const { ccclass, property } = cc._decorator;

export type WithdrawOrder = {
    SSSAccount: string;
    SSSRealName: string;
    money: string;
    createTime: number;
    state: number;
    status: number;
    amount: string;
    type: number;
    bankCardNumber: string;
    bankCardRealName: string;
}

@ccclass
export default class WithdrawRecord extends cc.Component {

    @property(cc.Node)
    private item: cc.Node = undefined;

    @property(cc.Node)
    private listContainer: cc.Node = undefined;

    @property(cc.Prefab)
    private preWithdrawDetail: cc.Prefab = undefined;

    @property(cc.Prefab)
    private preCustomerService: cc.Prefab = undefined;

    @property([cc.Color])
    colors: cc.Color[] = [];


    private types = ['支付宝', "银行卡", "代理兑换", "后台下分"];
    // private states = ["审核中", "审核中", "接单中", "接单中", "转账中", "完成"];

    private orders: WithdrawOrder[];

    private lWithdrawDetail: WithdrawDetail = undefined;

    protected onLoad() {
        // init logic
        this.item.active = false;
    }

    protected onEnable() {
        this.listContainer.destroyAllChildren();
        showLoading("加载兑换记录");
        window.pomelo.request("lobby.billHandler.getWithdraws", {}, (data: { code: number; orders?: WithdrawOrder[] }) => {
            hideLoading();
            if (data.code !== 200) {
                showTip(ErrCodes.getErrStr(data.code, "获取兑换记录失败"));
            } else {
                if (!data.orders) {
                    return;
                }
                data.orders.sort((a, b) => {
                    return b.createTime - a.createTime;
                });

                this.orders = data.orders;
                for (let o of data.orders) {
                    let newItem = util.instantiate(this.item);
                    this.listContainer.addChild(newItem);
                    newItem.active = true;

                    let type = newItem.getChildByName("type").getComponent(cc.Label);
                    let amount = newItem.getChildByName("amount").getComponent(cc.Label);
                    let real = newItem.getChildByName("real").getComponent(cc.Label);
                    let date = newItem.getChildByName("date").getComponent(cc.Label);
                    let state = newItem.getChildByName("lab").getComponent(cc.Label);
                    let staStke = newItem.getChildByName("lab").getComponent(cc.LabelOutline);
                    let schedule = newItem.getChildByName("jindu").getComponent(cc.ProgressBar);
                    let carryout = newItem.getChildByName("wancheng");
                    let wait = newItem.getChildByName("cuidan");
                    wait.getComponent(cc.Button).enableAutoGrayEffect = true;

                    type.string = this.types[o.type - 1];
                    amount.string = o.money;
                    real.string = o.amount;
                    date.string = util.formatTimeStr('d', o.createTime);

                    let status = "已受理";
                    let colour = this.colors[0];
                    let Stroke = this.colors[1];
                    let load = 0.3;
                    wait.active = true;
                    carryout.active = false;
                    if (o.state === 2){
                        status = "审核中";
                        load = 0.6;
                    } else if (o.state === 5){
                        status = "转账中";
                        load = 0.9;
                    } else if (o.state === 6){
                        status = "兑换失败";
                        colour = this.colors[4];
                        Stroke = this.colors[5];
                        if (!WithdrawDetail.check(o.status)) {
                            status = "兑换成功";
                            colour = this.colors[2];
                            Stroke = this.colors[3];
                        }
                        load = 1;
                        wait.active = false;
                        carryout.active = true;
                    }
                    state.string = status;
                    state.node.color = colour;
                    staStke.color = Stroke;
                    schedule.progress = load;

                    newItem.opacity = 0;
                    newItem.scale = 0.6;
                    newItem.runAction(cc.spawn(
                        cc.scaleTo(0.2, 1, 1).easing(cc.easeCircleActionOut()),
                        cc.fadeIn(0.2)
                    ));
                }
            }
        });
    }

    private onClickDetail(ev: cc.Event.EventTouch) {
        if (!this.lWithdrawDetail) {
            let ui = util.instantiate(this.preWithdrawDetail);
            this.lWithdrawDetail = ui.getComponent(PopActionBox);
            this.lWithdrawDetail.autoDestroy = false
            cc.find("Canvas").addChild(ui);
        } else {
            this.lWithdrawDetail.openAnim();
        }
        let items = ev.target.parent;
        let index = items.parent.children.indexOf(items);
        let order = this.orders[index];
        this.lWithdrawDetail.setOrder(order)
    }

    private onClickUrge(even: cc.Event.EventTouch){
        showTip("催单成功.");
        let node = even.target.getComponent(cc.Button);
        node.interactable = false;
        let Dianji = even.target.parent.getChildByName("Dianji");
        Dianji.active = true;
        Dianji.getComponent(cc.Animation).play();
        node.scheduleOnce(function () {
            Dianji.active = false;
            node.interactable = true;
        }, 2);
    }

    private onClickContactCS() {
        let node = util.instantiate(this.preCustomerService);
        let canvas = cc.find("Canvas");
        if (!canvas) {
            return;
        }
        canvas.addChild(node, 990);
    }
}
