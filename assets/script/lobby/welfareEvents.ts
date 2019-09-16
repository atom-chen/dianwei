import LobbyPopBox from "../lobby/popActionBox";
import { showLoading, hideLoading, showConfirm, showTip} from "../common/util";
import Lobby from "./lobby";

export interface WelfareResult {
    idx: number;
    actId: number;
    name: string;
}
export interface WelfareCfgCondition {
    recharge: string;
    chgMoney: string;
}

export interface WelfareCurCondition {
    recharge: string;
    chgMoney: string;
}


const {ccclass, property} = cc._decorator;

@ccclass
export class WelfareEvents extends LobbyPopBox {
    @property(cc.Button)
    private btnReceive: cc.Button = undefined;

    @property([cc.SpriteFrame])
    private btnSpriteFrame: cc.SpriteFrame[] = [];

    private _lobby: Lobby = undefined

    private cfgConditionRecharge = "50"; // 配置充值金额
    private cfgConditionChgMoney = "20"; // 配置流水金额
    private curConditionRecharge = "0"; //当前充值金额
    private curConditionChgMoney = "0"; //当前流水金额
    private receiveState = 0; // 当前领取状态
    private btnState = -1; // 领取按钮状态： -2: 充值条件未达成， -1: 流水条件未达成， 0： 可领取， 1: 已领取

    onLoad () {
        super.onLoad();
    }

    start() {
        this.openAnim();
    }

    init(lobby: Lobby) {
        this._lobby = lobby;
        if (this._lobby.welfareCfgCondition) {
            this.cfgConditionRecharge = this._lobby.welfareCfgCondition.recharge;
            this.cfgConditionChgMoney = this._lobby.welfareCfgCondition.chgMoney;
        }
        if (this._lobby.welfareCurCondition) {
            this.curConditionRecharge = this._lobby.welfareCurCondition.recharge;
            this.curConditionChgMoney = this._lobby.welfareCurCondition.chgMoney;
        }
        if (this._lobby.welfareGetState) this.receiveState = this._lobby.welfareGetState;
        this.setBtnState();
    }

    private setBtnState() {
        if (this.curConditionRecharge === undefined || +this.curConditionRecharge < +this.cfgConditionRecharge) {
            this.btnState = -2;
            return;
        }
        if (this.curConditionChgMoney === undefined || +this.curConditionChgMoney < +this.cfgConditionChgMoney) {
            this.btnState = -1;
            return;
        }
        if (this.receiveState === 0) {
            this.btnState = 0;
        } else if (this.receiveState === 1) {
            this.btnState = 1;
        }
        this.changeBtnState(this.btnState);
    }

    private changeBtnState(state: number) {
        let sp = this.btnReceive.getComponent(cc.Sprite);
        let lab = this.btnReceive.getComponentInChildren(cc.Label);
        let outline = this.btnReceive.getComponentInChildren(cc.LabelOutline);
        if (state === -2 || state === -1) {
            sp.spriteFrame = this.btnSpriteFrame[0];
            lab.node.color = cc.hexToColor("#FFFFFF");
            lab.string = "参与活动";
            outline.enabled = true;
        } else if (state === 0) {
            sp.spriteFrame = this.btnSpriteFrame[1];
            lab.node.color = cc.hexToColor("#0B5A01");
            lab.string = "可领取";
            outline.enabled = false;
        } else if (state === 1) {
            this.btnReceive.interactable = false;
            sp.spriteFrame = this.btnSpriteFrame[2];
            lab.node.color = cc.hexToColor("#9C3912");
            lab.string = "已领取";
            outline.enabled = false;
        }
    }

    onClickReceive() {
        if (!this._lobby) {
            cc.info("活动id不存在");
            return
        }
        if (this.btnState === -2 || this.btnState === -1) {
            this.cantGetWelfare(this.btnState);
        } else if (this.btnState === 0) {
            this.canGetWelfare();
        }
    }

    private cantGetWelfare(state: number) {
        if (state === -2) {
            showTip("充值金额不足，请满足充值条件后领取~");
            this.closeAction(() => {
                this._lobby.onClickRecharge();
            });
        } else if (state === -1) {
            showTip("流水不足20元，请您再多玩一下游戏哦");
        }
    }

    private canGetWelfare() {
        showLoading("福利领取中...");
        let id = this._lobby.welfareEventID;
        window.pomelo.request("lobby.eventHandler.getCode", { actId: id }, (data: { code: number }) => {
            hideLoading();
            if (data.code === 200) {
                showConfirm("恭喜您，会员码领取成功，快去邮件中查收吧～");
                this.btnState = 1;
                this.changeBtnState(this.btnState);
            } else {
                let errCode = data.code;
                if (errCode === 13001) {
                    showConfirm("活动期间您的充值金额未满" + this.cfgConditionRecharge + "元，快去充值吧！");
                } else if (errCode === 13002) {
                    showConfirm("活动期间您的游戏流水未满" + this.cfgConditionChgMoney + "元，快去游戏吧！");
                } else if (errCode === 13003) {
                    showConfirm("您已领取会员码，欢迎下次再参与！");
                } else if (errCode === 13004) {
                    showConfirm("会员码已发放完毕，请稍后再试！");
                }
            }
        })
    }
}
