import PopActionBox from "../lobby/popActionBox"
import { showTip, showLoading, hideLoading } from "../common/util";
import { ErrCodes } from "../common/code";
import { User } from "../common/user";
import g from "../g";
import ItemNames from "../common/itemNames";

enum QUESTION_TYPE {
    TYPE_NULL,
    TYPE_NORMAL,                // 提问
    TYPE_REPORT_BUSINESS,       // 投诉商人
    TYPE_ALL
}

const { ccclass, property } = cc._decorator;

@ccclass
export default class Complaint extends PopActionBox {

    @property(cc.EditBox)
    private editAsk: cc.EditBox = undefined;

    @property(cc.Button)
    private btnCommit: cc.Button = undefined;

    protected onEnable() {
        if (super.onEnable) {
            super.onEnable();
        }
        this.checkCD();
    }

    private onClickReset() {
        this.editAsk.string = "";
    }

    private onClickCommit() {
        let content = this.editAsk.string.trim();
        if (content.length < 10) {
            showTip("输入的问题字数不得少于10个！");
            return;
        }
        showLoading("提交中");
        window.pomelo.request("lobby.kfHandler.putIn", { content: content, type: QUESTION_TYPE.TYPE_REPORT_BUSINESS }, (data: { code: number }) => {
            hideLoading();
            if (data.code === 200) {
                showTip("提交成功！");
                let next = Date.now() + 60 * 10 * 1000;
                g.complainTime = next;
                cc.sys.localStorage.setItem(ItemNames.complainTime, next);
                this.onClickReset();
                this.checkCD();
            }
            else {
                showTip(ErrCodes.getErrStr(data.code, "问题提交失败"));
            }
        });
    }

    private checkCD() {
        let latestComplainTime = cc.sys.localStorage.getItem(ItemNames.complainTime);
        let next = g.complainTime;
        if (latestComplainTime) {
            next = latestComplainTime;
        }
        if (!next || isNaN(next)) {
            return;
        }
        let now = Date.now();
        if (now < next) {
            this.btnCommit.interactable = false;
            let lbl = this.btnCommit.getComponentInChildren(cc.Label);
            lbl.string = `提交(${Math.round((next - now) / 1000)})`;
            let self = this;
            this.schedule(function count() {
                if (!self || !self.btnCommit || !self.btnCommit.isValid) {
                    self.unschedule(count);
                    return;
                }
                let span = Math.round((next - Date.now()) / 1000);
                lbl.string = `提交(${span})`;
                if (span <= 0) {
                    self.unschedule(count);
                    self.btnCommit.interactable = true;
                    lbl.string = "提交";
                }
            }, 1);
        }
    }

    initAgentInfo(str: string) {
        this.editAsk.string = str.trim() + "\n";
        this.editAsk.setFocus();
    }
}
