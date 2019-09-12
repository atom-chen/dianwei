import BaseLobbyUi from "./baseLobbyUi";
import Lobby from "./lobby";
import * as util from "../common/util";
import { showLoading, showTip, setClipboard, instantiate } from "../common/util";
import { ErrCodes } from "../common/code";
import { User } from "../common/user";
import Bill from "./bill";
import g from "../g";
import PopActionBox from "./popActionBox"
import WithdrawPage from "./withdrawPage"
import { WithdrawType } from "./withdrawPage"

const { ccclass, property } = cc._decorator;

interface WithdrawInfo {
    code: number,
    SSS?: number,
    bankCard?: number,
    agent?: number,
    rule?: LocationWithdrawRule,
    sssMinMoney?: string,
    sssMaxMoney?: string,
    bankCardMinMoney?: string,
    bankCardMaxMoney?: string,
    vip?: number,
    vipMinMoney?: string,
    vipMaxMoney?: string,
    blocUnionWithdrawRate?: string // 银行卡的手续费（老版本，兼容使用）
    bankWithdrawRate?: string,    // 银行卡的手续费
    aliWithdrawRate?: string,     // zfb的手续费
}

interface LocationWithdrawRule {
    withdrawA: number,
    withdrawB: number,
}

interface Agent {
    name: string,
    qq: string,
    wx: string,
    hot: number,
}

const HOT_NUMBER = 1000;

@ccclass
export default class Withdraw extends PopActionBox {
    @property(cc.ToggleContainer)
    private tgTab: cc.ToggleContainer = undefined;

    @property(cc.Node)
    nodeRight: cc.Node = undefined;

    @property(cc.Node)
    nodeSSS: cc.Node = undefined;

    @property(cc.Node)
    nodeRecord: cc.Node = undefined;//兑换记录

    @property(cc.Node)
    nodeCard: cc.Node = undefined;

    @property(cc.Node)
    nodeVip: cc.Node = undefined;

    @property(cc.Node)
    nodeAgent: cc.Node = undefined;

    @property(cc.Label)
    private lab1: cc.Label = undefined;

    @property(cc.Label)
    private lab2: cc.Label = undefined;

    // 转账
    @property(cc.EditBox)
    ebPwd: cc.EditBox = undefined;

    @property(cc.EditBox)
    ebTransferMoney: cc.EditBox = undefined;

    @property(cc.EditBox)
    ebBusinessmanId: cc.EditBox = undefined;

    @property(cc.Label)
    labTransferMax: cc.Label = undefined;

    @property(cc.Button)
    btnBusinessmanInfo: cc.Button = undefined;

    @property(cc.Node)
    businessmanList: cc.Node = undefined;

    @property(cc.Node)
    businessmanItem: cc.Node = undefined;

    @property(cc.Node)
    nodeConcat: cc.Node = undefined;

    @property(cc.Label)
    labBusinessmanId: cc.Label = undefined;

    @property(cc.Label)
    labBusinessmanQq: cc.Label = undefined;

    @property(cc.Label)
    labBusinessmanWx: cc.Label = undefined;

    @property(cc.Node)
    layoutBusinessQQ: cc.Node = undefined;

    @property(cc.Node)
    layoutBusinessWx: cc.Node = undefined;

    @property(cc.Node)
    nodeTransferInfo: cc.Node = undefined;

    @property(cc.Label)
    labTransferId: cc.Label = undefined;

    @property(cc.Label)
    labTransferMoney: cc.Label = undefined;

    @property(cc.Label)
    labTransferQq: cc.Label = undefined;

    @property(cc.Label)
    labTransferWx: cc.Label = undefined;

    @property(cc.RichText)
    labTransferConcat: cc.RichText = undefined;

    @property(cc.Node)
    layoutTransferQQ: cc.Node = undefined;

    @property(cc.Node)
    layoutTransferWx: cc.Node = undefined;

    @property(cc.Prefab)
    preTransferBill: cc.Prefab = undefined;

    @property(cc.Label)
    private cardLimit: cc.Label = undefined;

    @property(cc.Node)
    private ndVip: cc.Node = undefined;

    @property(cc.Node)
    private ndRecord: cc.Node = undefined;

    @property(cc.Label)
    private cardTip: cc.Label = undefined;

    @property(cc.Label)
    private aliTip: cc.Label = undefined;

    private transferMin: string;
    private transferMax: string;

    private withdrawPage: WithdrawPage = undefined;
    private nodeBusinessmanInfos: cc.Node[];
    private blocUnionWithdrawRate: string = "0.02";
    protected onLoad() {
        // init logic
        super.onLoad();
        // this._showRight("bank");
        this.businessmanItem.active = false
        this.lab1.string = '支付宝';
        this.lab2.string = '支付宝';
    }

    start() {
        this.openAnim(() => {
            this.beforeShow()
        });
    }

    async beforeShow(...args: any[]) {
        window.pomelo.request("lobby.bankHandler.enter", {}, (data: {
            code: number, money: number, bankMoney: number,
        }) => {
            if (data.code === 200) {
                User.instance.money = data.money;
                this.btnBusinessmanInfo.interactable = false;
                this.ebBusinessmanId.string = "";
                this.nodeConcat.active = false;
                this.nodeTransferInfo.active = false;
            }
        })

        window.pomelo.request("lobby.billHandler.getWithdrawAgents", {}, (data: { agents: Agent[] }) => {
            if (!data.agents) return;
            let i = Math.floor(Math.random() * data.agents.length);
            let temp = data.agents[0];
            data.agents[0] = data.agents[i];
            data.agents[i] = temp;

            this.nodeBusinessmanInfos = [];
            this.businessmanList.removeAllChildren();
            for (let index = 0; index < data.agents.length; index++) {
                let btnNode = <cc.Node>instantiate(this.businessmanItem);
                this.businessmanList.addChild(btnNode);
                btnNode.active = true;
                btnNode.setPosition(0, 0);

                this.nodeBusinessmanInfos.push(btnNode);
                const info = data.agents[index];
                if (info) {
                    btnNode.name = info.name.toString();
                    btnNode.getChildByName("choose").active = false;
                    let lab = btnNode.getComponentInChildren(cc.Label);
                    lab.string = info.name;
                    let hot = btnNode.getChildByName("hot");
                    hot.active = info.hot >= HOT_NUMBER;
                    let handler = new cc.Component.EventHandler();
                    handler.target = this.node;
                    handler.component = cc.js.getClassName(this);
                    handler.handler = "showBusinessmanInfo";
                    handler.customEventData = JSON.stringify(info);
                    let btn = btnNode.getComponent(cc.Button);
                    btn.clickEvents = [];
                    btn.clickEvents.push(handler);
                } else {
                    btnNode.active = false;
                }
            }
        })
        let ok = await this.getWithdrawInfo()
    }

    /**
     * 请求充值通道开关
     */
    private getWithdrawInfo() {
        showLoading("加载兑换信息");
        return new Promise((resolve: (ok: boolean) => void) => {
            window.pomelo.request("lobby.billHandler.withdrawEnforce", {}, (data: WithdrawInfo) => {
                if (!data || !data.code || data.code !== 200) {
                    resolve(false);
                    let str = "加载兑换信息失败";
                    if (data.code) {
                        showTip(ErrCodes.getErrStr(data.code, str));
                    } else {
                        showTip(str + "，未获取到信息");
                    }
                    return;
                }

                if (data.rule) {
                    this.nodeSSS.active = !!data.rule.withdrawA;
                    this.nodeCard.active = !!data.rule.withdrawB;
                } else {
                    this.nodeSSS.active = !!data.SSS;
                    this.nodeCard.active = !!data.bankCard;
                }
                this.nodeRecord.active = true
                this.nodeAgent.active = !!data.agent;

                if (data.blocUnionWithdrawRate) {
                    this.cardTip.string = `提示：提现5分钟到账，提现金额为10的倍数，且提现后携带余额大于10，手续费${+data.blocUnionWithdrawRate * 100}%`
                }

                if (data.bankWithdrawRate) {
                    this.cardTip.string = `提示：提现5分钟到账，提现金额为10的倍数，且提现后携带余额大于10，手续费${+data.bankWithdrawRate * 100}%`
                }
                if (data.aliWithdrawRate) {
                    this.aliTip.string = `提示：提现5分钟到账，提现金额为10的倍数，且提现后携带余额大于10，手续费${+data.aliWithdrawRate * 100}%`
                }
                if (data.bankCardMinMoney && data.bankCardMaxMoney) {
                    g.withdrawCardMin = data.bankCardMinMoney;
                    g.withdrawCardMax = data.bankCardMaxMoney;
                    this.cardLimit.string = `金额范围:${g.withdrawCardMin}~${g.withdrawCardMax}`;
                }
                if (data.sssMinMoney && data.sssMaxMoney) {
                    g.withdrawSSSMin = data.sssMinMoney;
                    g.withdrawSSSMax = data.sssMaxMoney;
                    // this.sssLimit.string = `金额范围:${g.withdrawSSSMin}~${g.withdrawSSSMax}`;
                }
                if (data.vipMinMoney && data.vipMaxMoney) {
                    this.transferMin = data.vipMinMoney;
                    this.transferMax = data.vipMaxMoney;
                    this.nodeVip.active = !!data.vip;
                    this.ebTransferMoney.placeholder = `最低${this.transferMin}起`;
                    this.labTransferMax.string = `最大${this.transferMax}`;
                }
                this.showDefaultRight();
                util.hideLoading()
                resolve(true);
            });
        });
    }

    private showDefaultRight() {
        let defalutNode;
        if (this.nodeCard.active) {
            this._showRight("bank");
            defalutNode = this.nodeCard;
        } else if (this.nodeSSS.active) {
            this._showRight("ali");
            defalutNode = this.nodeSSS;
        } else if (this.nodeAgent.active) {
            this._showRight("agent");
            defalutNode = this.nodeAgent;
        } else if (this.nodeVip.active) {
            this._showRight("vip");
            defalutNode = this.nodeVip;
        } else if (this.nodeRecord.active) {
            this._showRight("record");
            defalutNode = this.nodeRecord;
        }
        defalutNode.getComponent(cc.Toggle).isChecked = true;
    }

    private onClickLeft(btn: cc.Toggle, name: string) {
        this._showRight(name);
    }

    private _showRight(name: string) {
        let children = this.nodeRight.children;
        children.forEach(child => {
            child.active = false;
        });
        let child = this.nodeRight.getChildByName("normal");
        if (!child) {
            return;
        }
        this.withdrawPage = child.getComponent(WithdrawPage);
        if (this.withdrawPage) {
            if (name === "bank") {
                this.withdrawPage._type = WithdrawType.BankCard;
                this.cardTip.node.active = true;
                this.aliTip.node.active = false;
            } else if (name === "ali") {
                this.withdrawPage._type = WithdrawType.SSS;
                this.cardTip.node.active = false;
                this.aliTip.node.active = true;
            } else if (name === "agent") {
                this.withdrawPage._type = WithdrawType.Agent
            } else if (name === "vip") {
                this.ndVip.active = true;
            } else if (name === "record") {
                this.ndRecord.active = true;
            }
            if (name !== "vip" && name !== "record") {
                this.withdrawPage.init();
                child.active = true;
            }
        }
    }


    private showBusinessmanInfo(ev: cc.Event, data: string) {
        let agentInfo = <Agent>JSON.parse(data);
        this.showConcatInfo(agentInfo);

        this.nodeBusinessmanInfos.forEach(node => {
            let choose = node.getChildByName("choose");
            choose.active = false;
            if (node.name === agentInfo.name.toString()) {
                choose.active = true;
            }
        });

        this.openConcat()
    }

    private showConcatInfo(agentInfo: Agent) {
        this.labBusinessmanId.string = agentInfo.name.toString();
        if (agentInfo.qq && agentInfo.qq !== "0") {
            this.labBusinessmanQq.string = agentInfo.qq.toString();
            this.labTransferQq.string = agentInfo.qq.toString();
            this.layoutBusinessQQ.active = true;
            // this.layoutTransferQQ.active = true;
        } else {
            this.labBusinessmanQq.string = "";
            this.layoutBusinessQQ.active = false;
            this.layoutTransferQQ.active = false;
        }
        if (agentInfo.wx && agentInfo.wx !== "0") {
            this.labBusinessmanWx.string = agentInfo.wx.toString();
            this.labTransferWx.string = agentInfo.wx.toString();
            this.layoutBusinessWx.active = true;
            // this.layoutTransferWx.active = true;
        } else {
            this.labBusinessmanWx.string = "";
            this.layoutBusinessWx.active = false;
            this.layoutTransferWx.active = false;
        }
        this.btnBusinessmanInfo.interactable = true;

    }

    private onClickCopy() {
        let success = setClipboard(this.labBusinessmanId.string);
        if (success) {
            showTip("商人ID复制成功");
        }
    }

    private onClickQQ() {
        if (!this.labBusinessmanQq.string) {
            showTip("该商人没有QQ");
            return;
        }
        let success = setClipboard(this.labBusinessmanQq.string);
        if (success) {
            let install = util.isAppInstalled('qq');
            if (!install) {
                showTip("QQ已拷贝到剪切板");
            } else {
                util.openApp('qq', this.labBusinessmanQq.string)
            }
        } else {
            showTip("QQ号拷贝失败");
        }
    }

    private onClickWX() {
        if (!this.labBusinessmanWx.string) {
            showTip("该商人没有微信");
            return;
        }
        let success = setClipboard(this.labBusinessmanWx.string);
        if (success) {
            let install = util.isAppInstalled('wx');
            if (!install) {
                showTip("微信已拷贝到剪切板");
            } else {
                util.openApp('wx')
            }
        } else {
            showTip("微信号拷贝失败");
        }
    }

    private openConcat() {
        this.nodeConcat.active = true;
    }

    private closeConcat() {
        this.nodeConcat.active = false;
    }

    // 转账
    onClickTranster() {
        let receiverId = +this.ebBusinessmanId.string.trim();
        let amount = this.ebTransferMoney.string.trim();
        let pwd = this.ebPwd.string.trim();
        if (!receiverId || !amount) {
            util.showTip("请补全所有信息！");
            return;
        }
        if (receiverId === User.instance.uid) {
            util.showTip("不得转账给自己！");
            return;
        }
        if (+amount < +this.transferMin) {
            util.showTip("转账金额不得少于" + this.transferMin);
            return;
        }
        if (+amount > +this.transferMax) {
            util.showTip("转账金额不得多于" + this.transferMax);
            return;
        }
        if (+amount > +User.instance.money) {
            util.showTip("金额不足");
            return;
        }
        if (+amount % 100 !== 0) {
            util.showTip("转账金额必须为100的整数");
            return
        }
        this.labTransferId.string = receiverId.toString();
        this.nodeTransferInfo.active = true;
        this.labTransferMoney.string = amount.toString();
        this.labTransferConcat.string = `我是 UID:</color><color=#000000>${User.instance.uid}</color> <color=#946500>的玩家,已向商人 ID:</color><color=#000000>${receiverId}</color> <color=#946500>转款</color> <color=#000000>${amount}</color> <color=#946500>,请向我绑定的银行卡转账。`;
        let sss = instantiate(this.nodeTransferInfo);
        sss.name = "sss";
        let canvas = cc.find("Canvas");
        canvas.addChild(sss);
        this.nodeTransferInfo.active = false;
    }

    private closeNewTransferInfo() {
        let canvas = cc.find("Canvas");
        let sss = canvas.getChildByName("sss");
        sss.removeFromParent();
    }

    onClickSure() {
        util.showLoading("");
        window.pomelo.request("lobby.billHandler.withdraw", {
            money: this.labTransferMoney.string,
            deviceType: cc.sys.os === cc.sys.OS_IOS ? "ios" : "android",
            pwd: "888888",
            withdrawType: 5,
            vipId: this.labTransferId.string,
        }, (data: { code: number, userMoney: string, blocAliWithdrawTimes?: number, withdrawTimes?: number }) => {
            if (data.code === 200) {
                util.hideLoading();
                if (data.code === 200) {
                    if (data.userMoney) {
                        User.instance.money = +data.userMoney;
                        this.user.refreshUserInfos();
                    }
                    this.nodeTransferInfo.active = false;
                    this.closeNewTransferInfo();
                    util.showTip("转账成功！");
                    if (data.blocAliWithdrawTimes != null && data.blocAliWithdrawTimes != undefined) {
                        util.showTip(`您今日剩余提现次数为:${data.blocAliWithdrawTimes}`);
                    }
                    if (data.withdrawTimes != null && data.withdrawTimes != undefined) {
                        util.showTip(`您今日剩余提现次数为:${data.withdrawTimes}`);
                    }
                } else {
                    util.showTip(ErrCodes.getErrStr(data.code, "转账失败"));
                }
            } else {
                util.hideLoading();
                util.showTip(ErrCodes.getErrStr(data.code, "转账失败"));
            }
        })

    }

    onClickCancel() {
        this.nodeTransferInfo.active = false;
        this.closeNewTransferInfo();
    }

    onClickCopyConcat() {
        let receiverId = +this.labTransferId.string.trim();
        let amount = this.labTransferMoney.string.trim();
        let text = `我是UID：${User.instance.uid}的玩家，已向商人ID：${receiverId}转款${amount}，请向我绑定的银行卡转账。`;
        let success = setClipboard(text);
        if (success) {
            showTip("复制成功");
        }
    }

    onClickBill() {
        let ui = util.instantiate(this.preTransferBill);
        let Canvas = cc.find("Canvas");
        Canvas.addChild(ui);
        ui.getComponent(Bill).showContent();
    }
}
