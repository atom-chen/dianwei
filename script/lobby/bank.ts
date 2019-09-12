import { User } from "../common/user";
import * as util from "../common/util";
import { ErrCodes } from "../common/code";
import Lobby from "./lobby";
import { showTip } from "../common/util";
import PopActionBox from "../lobby/popActionBox"
import g from "../g";

enum UI_NAME {
    deposit,
    draw,
    transfer,
}

const { ccclass, property } = cc._decorator;

@ccclass
export default class Bank extends PopActionBox {

    @property(cc.ToggleContainer)
    tgBtn: cc.ToggleContainer = undefined;

    @property(cc.Node)
    nodeUI: cc.Node = undefined;

    @property(cc.Node)
    nodeIn: cc.Node = undefined

    @property(cc.Node)
    nodeOut: cc.Node = undefined

    @property(cc.Label)
    labCash: cc.Label = undefined;

    @property(cc.Label)
    labDeposit: cc.Label = undefined;

    @property(cc.Node)
    nodeBtnExChange: cc.Node = undefined;

    // 存入和取出
    @property(cc.EditBox)
    ebSave: cc.EditBox = undefined;

    @property(cc.Slider)
    sldSave: cc.Slider = undefined;

    @property(cc.Node)
    savePro: cc.Node = undefined;

    @property(cc.Button)
    btnSave: cc.Button = undefined;

    @property(cc.Button)
    clearBtn: cc.Button = undefined;

    @property(cc.Label)
    lblAlert: cc.Label = undefined;

    @property(cc.Label)
    lblOpera: cc.Label = undefined;

    private isSaveOper: boolean = true;
    private sliderProWidth: number;
    private _lobby: Lobby = undefined

    onLoad() {
        super.onLoad();
        this.sliderProWidth = this.sldSave.node.width;
    }
    init(lobby: Lobby) {
        this._lobby = lobby;
    }
    showTransfer() {
        this.tgBtn.toggleItems.forEach((tog: cc.Toggle, togIdx) => {
            if ((this.tgBtn.toggleItems.length - 1) === togIdx) {
                tog.isChecked = true;
            } else {
                tog.isChecked = false;
            }
        });
        this.showUI(UI_NAME.transfer);
    }

    beforeShow(data: { code: number, money: number, bankMoney: number, transferMinMoney: number, transfer: number }) {
        User.instance.money = data.money;
        User.instance.bankMoney = data.bankMoney;
        this.user.refreshUserInfos();
        this.updateEnterData(data.bankMoney, data.transferMinMoney);
        this.showBank()
    }

    updateEnterData(bankMoney: number, transferMinMoney?: number) {
        User.instance.bankMoney = bankMoney;
        this.refreshData();
    }

    refreshData() {
        this.user.refreshUserInfos();
        this.labCash.string = User.instance.money.toString();
        this.labDeposit.string = User.instance.bankMoney.toString();
    }

    showBank() {
        cc.log("showBank");
        this.node.active = true;
        this.ebSave.string = "";
        this.tgBtn.toggleItems.forEach((tog: cc.Toggle, togIdx) => {
            if (0 === togIdx) {
                tog.isChecked = true;
            } else {
                tog.isChecked = false;
            }
        });
        this.showUI(UI_NAME.deposit);
        this.nodeBtnExChange.active = !g.shield && !!Lobby.availableFuncs.withdraw;
    }

    chooseOpUI(ev: cc.Event.EventTouch, gameData: UI_NAME) {
        this.showUI(+gameData);
    }

    showUI(name: UI_NAME) {
        if (name === undefined)
            return

        this.ebSave.string = "";
        if (name === UI_NAME.deposit) {
            this.isSaveOper = true;
            this.nodeIn.active = true;
            this.nodeOut.active = false;
            this.lblAlert.string = "存款金额";
            this.lblOpera.string = "立即存入";
            this.ebSave.placeholder = "请输入存入金额";
        }
        else if (name === UI_NAME.draw) {
            this.isSaveOper = false;
            this.nodeIn.active = false;
            this.nodeOut.active = true;
            this.lblAlert.string = "取款金额";
            this.lblOpera.string = "立即取出";
            this.ebSave.placeholder = "请输入取出金额";
        }
        this.setSaveOrDrawMoney(this.ebSave.string);
    }

    //只在值有变化时调用，输入0.的.时不会调用
    onChangedText() {
        let ebStr = this.ebSave.string;
        if (!ebStr) return;
        let pattern = /^([1-9]\d{0,9}|0)([.]?|(\.\d{1,2})?)$/;
        if (!pattern.test(ebStr)) {
            this.setSaveOrDrawMoney('');
            showTip("数据格式错误");
            return;
        }

        if (this.isSaveOper) {
            if (+ebStr > User.instance.money) {
                ebStr = User.instance.money.toString();
            }
        } else {
            if (+ebStr > User.instance.bankMoney) {
                ebStr = User.instance.bankMoney.toString();
            }
        }
        if (+ebStr <= 0) {
            ebStr = "";
        }
        this.setSaveOrDrawMoney(ebStr);
    }

    onClickOperaBtn() {
        let money = this.ebSave.string.trim();
        if (!money || +money <= 0) {
            if (this.isSaveOper) {
                util.showTip("请输入要存入的金额");
            } else {
                util.showTip("输入有误！请输入要取出的金额");
            }
            return;
        }
        this.btnSave.interactable = false;
        util.showLoading("");
        if (this.isSaveOper) {
            window.pomelo.request("lobby.bankHandler.saveMoney", { money: money }, (data: { code: number }) => {
                this.btnSave.interactable = true;
                if (data.code === 200) {
                    this.setSaveOrDrawMoney('');

                    window.pomelo.off("saveMoneyNotify");
                    window.pomelo.on("saveMoneyNotify", (data: { code: number, money: string, bankMoney: string }) => {
                        util.hideLoading();
                        if (data.code === 200) {
                            User.instance.money = +data.money;
                            if (this) {
                                User.instance.bankMoney = +data.bankMoney;
                                this.refreshData();
                            }
                            util.showTip("存款成功！");
                        } else {
                            util.showTip(ErrCodes.getErrStr(data.code, "存款失败"));
                        }
                    });
                } else {
                    util.hideLoading();
                    util.showTip(ErrCodes.getErrStr(data.code, "存款失败"));
                }
            });
        } else {
            window.pomelo.request("lobby.bankHandler.getMoney", { money: money }, (data: any) => {
                this.btnSave.interactable = true;
                if (data.code === 200) {
                    this.setSaveOrDrawMoney('');

                    window.pomelo.off("getMoneyNotify");
                    window.pomelo.on("getMoneyNotify", (data: { code: number; money: string; bankMoney: string }) => {
                        util.hideLoading();
                        if (data.code === 200) {
                            User.instance.money = +data.money;
                            if (this) {
                                User.instance.bankMoney = +data.bankMoney;
                                this.refreshData();
                            }
                            util.showTip("取款成功！");
                        } else {
                            util.showTip(ErrCodes.getErrStr(data.code, "取款失败"));
                        }
                    });
                } else {
                    util.hideLoading();
                    util.showTip(ErrCodes.getErrStr(data.code, "取款失败"));
                }
            });
        }
    }

    private setSaveOrDrawMoney(m: string) {
        this.ebSave.string = m;
        let labCash: string;
        let labDeposit: string;
        if (this.isSaveOper) {
            if (User.instance.money == 0) {
                this.sldSave.progress = 0;
                this.savePro.width = 0;
            } else {
                this.sldSave.progress = +m / User.instance.money;
            }
            if (m === '') m = '0';
            labCash = util.sub(User.instance.money, m).toString();
            labDeposit = util.add(User.instance.bankMoney, m).toString();
        } else {
            if (User.instance.bankMoney == 0) {
                this.sldSave.progress = 0;
                this.savePro.width = 0;
            } else {
                this.sldSave.progress = +m / User.instance.bankMoney;
            }
            if (m === '') m = '0';
            labCash = util.add(User.instance.money, m).toString();
            labDeposit = util.sub(User.instance.bankMoney, m).toString();
        }
        this.savePro.width = this.sldSave.progress * this.sliderProWidth;
        this.labCash.string = labCash
        this.labDeposit.string = labDeposit
    }

    private onClickClearMoney() {
        this.setSaveOrDrawMoney('');
    }

    private onClickAllMoney() {
        if (this.isSaveOper) {
            this.setSaveOrDrawMoney(User.instance.money.toString());
        } else {
            this.setSaveOrDrawMoney(User.instance.bankMoney.toString());
        }
    }

    private onSliderMoney() {
        let val: number;
        if (this.isSaveOper) {
            val = Math.floor(this.sldSave.progress * User.instance.money)
            if (User.instance.money - val < 1) {
                val = User.instance.money
            }
        } else {
            val = Math.floor(this.sldSave.progress * User.instance.bankMoney)
            if (User.instance.bankMoney - val < 1) {
                val = User.instance.bankMoney
            }
        }
        this.setSaveOrDrawMoney(val.toString());
        let proWidth = Math.floor(this.sldSave.progress * this.sliderProWidth);
        this.savePro.width = proWidth;
    }

    private onClickWithdraw() {
        if (!this._lobby) {
            return;
        }
        this.closeAction()
        this._lobby.onClickWithdraw();
    }
}
