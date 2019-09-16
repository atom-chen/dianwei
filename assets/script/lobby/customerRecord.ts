import { showLoading, hideLoading, showTip } from "../common/util";
import { ErrCodes } from "../common/code";
import * as util from "../common/util";

export type OrderInfo = {
    createTime: number;
    money: string;
    type: number;
    state: number;
    id: string;
}
const { ccclass, property } = cc._decorator;

@ccclass
export default class CustomerRecord extends cc.Component {

    @property(cc.Node)
    private item: cc.Node = undefined;

    @property(cc.Node)
    private Parentnode: cc.Node = undefined;

    @property([cc.Color])
    private colors: cc.Color[] = [];

    private types = ["其他","官方代充","支付宝","vip充值","固定支付宝","个人支付宝","微信","银联","QQ钱包","京东","点卡支付","云闪付"];

    private prompts = ['客服已收到您的申诉问题,请耐心等待.', "客服正在处理您的问题,请耐心等待.", "客服正在加急处理您的问题,请耐心等待."];

    onLoad () {
        this.item.active = false;
    }

    protected onEnable() {
        console.log("请求列表信息")
        this.Parentnode.destroyAllChildren();
        showLoading("加载申诉记录");
        window.pomelo.request("lobby.kfHandler.getQuestionOrderInfo", {}, (data: { code: number; infos?: OrderInfo[] }) => {
            hideLoading();
            if (data.code !== 200) {
                showTip(ErrCodes.getErrStr(data.code, "获取申诉记录失败"));
            } else {
                console.log(data.infos);
                if (!data.infos) {
                    return;
                }
                data.infos.sort((a, b) => {
                    return b.createTime - a.createTime;
                });
                for (let a of data.infos) {
                    let newItem = util.instantiate(this.item);
                    this.Parentnode.addChild(newItem);
                    newItem.active = true;
                    
                    let theway = newItem.getChildByName("theway").getComponent(cc.Label);//方式
                    let amount = newItem.getChildByName("amount").getComponent(cc.Label);//金额
                    let single = newItem.getChildByName("single").getComponent(cc.Label);//单号
                    let date = newItem.getChildByName("date").getComponent(cc.Label);//日期
        
                    let schedule = newItem.getChildByName("schedule").getComponent(cc.ProgressBar);//进度条
                    let status = newItem.getChildByName("status").getComponent(cc.Label);//状态
                    let staStke = newItem.getChildByName("status").getComponent(cc.LabelOutline);//状态描边
                    let prompt = newItem.getChildByName("prompt").getComponent(cc.Label);//提示 

                    let Urge = newItem.getChildByName("Urge");//催单按钮
                    Urge.getComponent(cc.Button).enableAutoGrayEffect = true;
                    let chaka = newItem.getChildByName("chakan");//查看按钮

                    date.string = util.formatTimeStr('d', a.createTime);
                    single.string = a.id;
                    amount.string = a.money;
                    theway.string = this.types[a.type];

                    Urge.active = false;
                    chaka.active = false;
                    prompt.node.active = false;

                    if(a.state == 3){
                        schedule.progress = 1;
                        status.string = "申诉完成";
                        status.node.color = this.colors[2];
                        staStke.color = this.colors[3];
                        chaka.active = true;
                    }else if(a.state == 4){
                        schedule.progress = 1;
                        status.string = "申诉失败";
                        status.node.color = this.colors[4];
                        staStke.color = this.colors[5];
                        chaka.active = true;
                    }else{
                        let jetlag = this.dealWithProgress(a.createTime);
                        switch (jetlag) {
                            case 1:
                                schedule.progress = 0.3;
                                prompt.string = this.prompts[0];
                                break;
                            case 2:
                                schedule.progress = 0.6;
                                prompt.string = this.prompts[1];
                                break;
                            case 3:
                                schedule.progress = 0.7;
                                prompt.string = this.prompts[2];
                                break;
                            case 4:
                                schedule.progress = 0.8;
                                prompt.string = this.prompts[2];
                                break;
                            case 5:
                                schedule.progress = 0.9;
                                prompt.string = this.prompts[2];
                                break;
                            default:
                                break;
                        }
                        status.string = "等待处理";
                        status.node.color = this.colors[0];
                        staStke.color = this.colors[1];
                        prompt.node.active = true;
                        Urge.active = true;
                    }

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

    private dealWithProgress(time:number){
        let current = Date.now();
        let jetlag = current - time;
        if (jetlag <= 1800000){
            return 1;
        } else if (jetlag <= 7200000){
            return 2;
        } else if (jetlag <= 18000000) {
            return 3;
        } else if (jetlag <= 28800000) {
            return 4;
        } else {
            return 5;
        }
    }

    private onClickUrge(even: cc.Event.EventTouch) {
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
}
