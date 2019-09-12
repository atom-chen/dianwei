import PopActionBox from "../lobby/popActionBox"
import { showTip, instantiate, showConfirm, checkBank } from "../common/util";
import { ErrCodes } from "../common/code";
import { User } from "../common/user";
import ConfirmBindBank from "./confirmBindBank";
const { ccclass, property } = cc._decorator;

@ccclass
export default class BindBank extends PopActionBox {

    @property(cc.EditBox)
    private ebBank: cc.EditBox = undefined

    @property(cc.EditBox)
    private ebName: cc.EditBox = undefined


    @property(cc.Prefab)
    private preConfirmBindBank: cc.Prefab = undefined

    @property(cc.Label)
    labBankName: cc.Label = undefined


    private _binding: boolean
    private bankName: string = '请输入15位到19位的银行卡号'
    private bankCode: string;


    protected onLoad() {
        super.onLoad()
        this.ebBank.string = ''
        this.ebName.string = ''
        this.labBankName.string = "请输入银行卡号，系统将自动识别归属银行";
    }
    async onChanged(val: string) {
        if (val && val.length >= 15 && val.length <= 19) {
            let info = await checkBank(val)
            let name = ''
            if (info.cardNum) {
                if (info.cardNum === this.ebBank.string) name = '未知银行'
            } else {
                name = info.bankName
                this.bankCode = info.bankCode;
            }
            if (name) {
                this.bankName = name
                this.labBankName.string = name
            }
        } else {
            this.labBankName.string = '请输入15位到19位的银行卡号'
        }
    }

    private onClickBindBank() {
        let bankAct = this.ebBank.string
        let name = this.ebName.string.trim()
        let bankCode = this.bankCode;

        if (!bankAct || !name) {
            showTip("请输入所有信息")
            return
        }
        if (bankAct.length < 10) {
            showTip("请输入正确的银行卡号")
            return
        }
        if (this._binding) {
            return
        }

        let nameNick = name.replace(/[^\u4E00-\u9FA5]/g, "");
        if (nameNick !== name) {
            showTip("您输入的姓名包含特殊字符");
            return
        }

        let canvas = cc.find("Canvas")
        let di = instantiate(this.preConfirmBindBank)
        canvas.addChild(di, 999)
        di.active = true
        let cf = di.getComponent(ConfirmBindBank)
        cf.showConfirm(bankAct, this.bankName, name)
        cf.okFunc = () => {
            if (User.instance.bankAccount) {
                this._binding = true
                window.pomelo.request("lobby.billHandler.modifyWithdrawAccount", {
                    type: 2,
                    account: bankAct,
                    name,
                    creditCard: bankCode,
                    bankPwd: '888888',
                }, (data: { code: number }) => {
                    this._binding = false
                    if (data.code !== 200) {
                        showTip(ErrCodes.getErrStr(data.code, '绑定失败'))
                        return
                    }
                    showTip('绑定成功')
                    User.instance.bankAccount = bankAct.replace(/(\d{2})\d*(\d{2})/, "$1****$2")
                    this.closeAction()
                })


            } else {
                this._binding = true
                window.pomelo.request("lobby.billHandler.bindBankCard", {

                    bankCardRealName: name,
                    bankCardNumber: bankAct,
                    bankOfCreditCard: bankCode

                }, (data: { code: number }) => {
                    this._binding = false
                    if (data.code !== 200) {
                        showTip(ErrCodes.getErrStr(data.code, "绑定失败"))
                        return
                    }
                    showTip("绑定成功");
                    User.instance.bankAccount = bankAct.replace(/(\d{2})\d*(\d{2})/, "$1****$2")
                    this.closeAction()
                })
            }
        }
    }
}