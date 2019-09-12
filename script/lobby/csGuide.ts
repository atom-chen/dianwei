import PopActionBox from "./popActionBox"
import { User } from "../common/user";
import * as util from "../common/util";
import ItemNames from "../common/itemNames";
import g from "../g";

const { ccclass, property } = cc._decorator;

@ccclass
export default class CSGuide extends PopActionBox {
    @property(cc.Prefab)
    preCS: cc.Prefab = undefined;

    @property(cc.Prefab)
    previp: cc.Prefab = undefined;

    @property(cc.Prefab)
    premail: cc.Prefab = undefined;

    @property(cc.Button)
    private btnProblem: cc.Button = undefined;

    @property(cc.Node)
    private vipservice: cc.Node = undefined;

    @property(cc.Node)
    private exchange: cc.Node = undefined;

    private cdTime = 900
    private isappeal:boolean = false;
    protected onLoad() {
        if (super.onLoad) {
            super.onLoad();
        }
        g.CustomerJudge = false;
        this.vipservice.active = false;
        this.exchange.active = false;
        if(g._vip.isvip && g._vip.weChat != ""){
            this.vipservice.active = true;
        }else{
            this.exchange.active = true;
        }
        let ts = cc.sys.localStorage.getItem(ItemNames.problemCD)
        let cd = this.cdTime - Math.floor((Date.now() - ts) / 1000)
        if (cd > 0) {
            //this.startCountDown(cd)
        }
    }


    protected onEnable() {
        if (super.onEnable) {
            super.onEnable();
        }
        console.log("请求申诉订单");
        window.pomelo.request("lobby.kfHandler.showRechargeQuestion", {}, (data: { code: number; show: number }) => {
            console.log("收到返回");
            console.log(data);
            if(data.code === 200 && data.show === 1){
                console.log("有订单");
                this.isappeal = true;
            }else{
                console.log("没有订单");
                this.isappeal = false;
            }
        });
    }

    startCountDown(t: number) {
        this.schedule(this.countDown, 1, t - 1)
        this.btnProblem.interactable = false
        this.btnProblem.node.tag = t
    }

    countDown() {
        this.btnProblem.node.tag--
        let lbl = this.btnProblem.getComponentInChildren(cc.Label)
        if (!this.btnProblem.node.tag) {
            this.btnProblem.interactable = true
            lbl.string = '充值申诉'
            return
        }

        let min = Math.floor(this.btnProblem.node.tag / 60)
        if (min) {
            lbl.string = min + '分钟'
        } else {
            let sec = this.btnProblem.node.tag % 60
            lbl.string = sec + '秒'
        }
    }

    onClickFeedBackBtn() {
        if(this.isappeal){
            g.CustomerJudge = true;
            this.onClickCustomerServices();
        }else{
            let uid = User.instance.uid;
            let uuid = util.genNewUUID()
            cc.sys.openURL(`${g.serviceCfg.rechargeQuestionUrl}/html/rechargeQuestion.html?uid=${uid}&uuid=${uuid}&token=${md5(`${uid + uuid}-2ghlmcl1hblsqt`)}`)
            //cc.sys.localStorage.setItem(ItemNames.problemCD, Date.now())
            //this.startCountDown(this.cdTime)
        }
    }

    onClickCustomerServices() {
        let parent = this.node.parent;
        this.closeAction(() => {
            this.openAction(parent, this.preCS);
        });
    }

    onClickvipservice() {
        let parent = this.node.parent;
        this.closeAction(() => {
            this.openAction(parent, this.previp);
        });
    }
}
