import PopActionBox from "../lobby/popActionBox"
import { showTip } from "../common/util"
import { User } from "../common/user"
import { ErrCodes } from "../common/code"
import g from "../g"
const { ccclass, property } = cc._decorator

@ccclass
export default class Rename extends PopActionBox {
    @property(cc.EditBox)
    private ebNick: cc.EditBox = undefined
    private static banNicks: string

    protected onLoad() {
        super.onLoad()
        this.getBanNicks()
    }

    private onClickOk() {
        let nick = this.ebNick.string.trim()
        if (!nick) {
            showTip("昵称不能为空！");
            return;
        }
        //昵称不能以"U"开头
        let reg = /^U[1-9][0-9]*$/
        if (reg.test(nick)) {
            showTip("昵称不不符合规则！")
            return
        }
        if (this.getNickLength(nick) > 10) {
            showTip("长度超限！请输入5个汉字或10个字符。")
            return
        }
        let validateNick = nick.replace(/[^\a-\z\A-\Z0-9\u4E00-\u9FA5\ ]/, "")
        if (validateNick !== nick) {
            showTip("您输入的昵称包含违禁字符！")
            return
        }
        let testNick = nick.toLowerCase()
        let testNickR = testNick.split("").reverse().join("")
        if (Rename.banNicks && typeof (Rename.banNicks) === 'string') {
            let arr = Rename.banNicks.split(';')
            if (arr.filter(d => testNick.indexOf(d) > -1 || testNickR.indexOf(d) > -1).length > 0) {
                showTip("您输入的昵称包含禁用词！")
                return
            }
        }

        window.pomelo.request("lobby.userHandler.changeName", { name: nick }, (data: { code: number }) => {
            this.ebNick.stayOnTop = false
            if (data.code === 200) {
                User.instance.nick = nick
                this.user.refreshUserInfos()
                g.uname = nick
                showTip("修改昵称成功！")
                this.closeAction()
            } else {
                showTip(ErrCodes.getErrStr(data.code, "修改昵称失败"))
            }
        })
    }

    private getNickLength(str: any) {
        if (str === null) { return 0 }
        if (typeof str !== "string") {
            str += ""
        }
        return str.replace(/[^\x00-\xff]/g, "01").length
    }

    private getBanNicks() {
        if (Rename.banNicks)
            return
        window.pomelo.request("lobby.userHandler.getDictionary", {}, (data: { code: number; dictionary: string }) => {
            if (data.code === 200) {
                Rename.banNicks = data.dictionary;
            }
        })
    }
}
