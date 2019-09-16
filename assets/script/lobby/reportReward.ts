import PopActionBox from "../lobby/popActionBox"
import { setClipboard, showTip, showConfirm, extractNum, isAppInstalled, openApp } from "../common/util";
import Lobby from "./lobby";

const { ccclass, property } = cc._decorator;

@ccclass
export default class ReportReward extends PopActionBox {

    @property(cc.Label)
    private lblAmount: cc.Label = undefined;

    @property(cc.Label)
    private lblWx: cc.Label = undefined;

    @property(cc.Label)
    private lblOpen: cc.Label = undefined;

    protected onLoad() {
        super.onLoad();
        let data = Lobby.reportData;
        this.lblWx.string = data.reportWx;
        this.lblAmount.string = data.reportBonus;
        data.isWX || (this.lblOpen.string = '复制并打开QQ');
    }

    private onClickCopy() {
        let act = extractNum(this.lblWx.string)
        if (Lobby.reportData.isWX) {
            let success = setClipboard(act);
            if (success) {
                let install = isAppInstalled('wx');
                if (!install) {
                    showTip("微信已拷贝到剪切板");
                } else {
                    let c = showConfirm("微信号拷贝成功，您可以通过此微信号举报代理");
                    c.okFunc = () => {
                        openApp('wx')
                    }
                }
            } else {
                showTip("微信号拷贝失败");
            }
        } else {
            let success = setClipboard(act);
            if (success) {
                let install = isAppInstalled('qq');
                if (!install) {
                    showTip("QQ已拷贝到剪切板");
                } else {
                    let c = showConfirm("QQ号拷贝成功，您可以通过此QQ号举报代理");
                    c.okFunc = () => {
                        openApp('qq', this.lblWx.string)
                    }
                }
            } else {
                showTip("QQ号拷贝失败");
            }
        }
    }
}
