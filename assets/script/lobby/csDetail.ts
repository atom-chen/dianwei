import PopActionBox from "../lobby/popActionBox"
import { showTip, showLoading, hideLoading } from "../common/util";
import { ErrCodes } from "../common/code";
import { User } from "../common/user";
import g from "../g";
import * as util from "../common/util";
import CustomerService from "./customerService";

const { ccclass, property } = cc._decorator;


@ccclass
export default class CSDetail extends PopActionBox {

    @property(cc.Label)
    private com: cc.Label = undefined;
    @property(cc.Label)
    private rep: cc.Label = undefined;
    @property(cc.Label)
    private ask: cc.Label = undefined;
    @property(cc.Label)
    private answer: cc.Label = undefined;
    @property(cc.Node)
    private not: cc.Node = undefined;
    @property(cc.Label)
    private done: cc.Label = undefined;

    id: string

    setContent(q: {
        id: string,
        questionTime: number,
        question: string,
        answerTime: number,
        answer: string,
        comment: number,
    }) {
        this.id = q.id
        this.com.string = this.format(q.questionTime) + '  提交'
        this.ask.string = '问：' + q.question
        if (q.answer) {
            this.rep.string = this.format(q.answerTime) + '  回复'
            this.answer.string = '答：' + q.answer
        }
        if (q.comment !== undefined) {
            this.not.active = false
            this.done.node.parent.active = true
            this.done.string = '您已打分：' + (q.comment ? '满意' : '不满意')
        }
    }

    format(t: number) {
        let timeStr = util.formatTimeStr('m', +t);
        return timeStr;
    }

    comment(ev: any, d: string) {
        showLoading("加载中");
        window.pomelo.request("lobby.kfHandler.setComment", { id: this.id, comment: +d }, (data: { code: number, question: any[] }) => {
            hideLoading();
            if (data.code === 200) {
                util.showTip('感谢您的反馈')
                this.not.active = false
                this.done.node.parent.active = true
                this.done.string = '您已打分：' + (+d ? '满意' : '不满意')

                let cs = this.node.parent.getComponent(CustomerService);
                let lab = cs.recContent.children[cs.ids.indexOf(this.id)].getComponentsInChildren(cc.Label)[2]
                lab.string = '已评价';
                lab.node.color = cc.Color.GREEN;
            }
            else {
                showTip(ErrCodes.getErrStr(data.code, ""));
            }
        });
    }
}
