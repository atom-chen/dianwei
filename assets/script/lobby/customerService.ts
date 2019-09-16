import PopActionBox from "../lobby/popActionBox"
import { showTip, showLoading, hideLoading } from "../common/util";
import { ErrCodes } from "../common/code";
import { User } from "../common/user";
import g from "../g";
import * as util from "../common/util";
import CSDetail from "./csDetail";
import ItemNames from "../common/itemNames";
import Lobby from "./lobby"

const { ccclass, property } = cc._decorator;

type Faq = {
    question: string;
    answer: string
}

enum QUESTION_TYPE {
    TYPE_NULL,
    TYPE_NORMAL,                // 提问
    TYPE_REPORT_BUSINESS,       // 投诉商人
    TYPE_ALL
}

@ccclass
export default class CustomerService extends PopActionBox {

    @property(cc.Node)
    private nodeAsk: cc.Node = undefined;

    @property(cc.Node)
    private nodeFaq: cc.Node = undefined;

    @property(cc.EditBox)
    private editAsk: cc.EditBox = undefined;

    @property(cc.RichText)
    private richFaq: cc.RichText = undefined;

    @property(cc.Button)
    private btnCommit: cc.Button = undefined;

    @property(cc.Prefab)
    private premail: cc.Prefab = undefined;

    @property(cc.Node)
    private rec: cc.Node = undefined;
    @property(cc.Node)
    recContent: cc.Node = undefined;
    @property(cc.Node)
    private recItem: cc.Node = undefined;
    @property(cc.Prefab)
    private preCSDetail: cc.Prefab = undefined;
    @property(cc.Toggle)
    private togRec: cc.Toggle = undefined;
    @property(cc.Button)
    private btnProblem: cc.Button = undefined;

    @property(cc.Node)
    private problem: cc.Node = undefined;

    @property(cc.Toggle)
    private congzhi: cc.Toggle = undefined;

    public tLobby: Lobby = undefined;
    private cdTime = 900
    ids: string[] = []
    page = 1

    private onClickBack() {
        this.nodeAsk.active = true;
        this.nodeFaq.active = false;
    }

    protected onLoad() {
        if (super.onLoad) {
            super.onLoad();
        }
        this.tLobby = cc.find('lobby').getComponent(Lobby);
        this.recItem.removeFromParent()
        if(g.CustomerJudge){
            this.congzhi.check()
        }else{
            this.loadRec(true)
        }
        

        let ts = cc.sys.localStorage.getItem(ItemNames.problemCD)
        let cd = this.cdTime - Math.floor((Date.now() - ts) / 1000)
        if (cd > 0) {
            //this.startCountDown(cd)
        }
    }

    private async getFaq() {
        let faqs = await new Promise((resolve: (ret?: Faq[]) => void) => {
            window.pomelo.request("lobby.kfHandler.getFaq", {}, (data: { code: number, faq: Faq[] }) => {
                if (data.code === 200) {
                    resolve(data.faq);
                } else {
                    resolve();
                }
            });
        });
        if (faqs) {
            let str = "";
            faqs.forEach((faq, index) => {
                let qus = faq.question.replace("\n", "");
                let ans = faq.answer.replace("\n", "");
                str += `<color=#dd6945>问题${index + 1}:</c><color=#2F4287>${qus}</c><br/><color=#dd6945>回答: </c><color=#da9999>${ans}</c>${index !== faqs.length - 1 ? "<br/><br/>" : ""}`;
            });
            this.richFaq.string = str;
        }
    }

    protected onEnable() {
        if (super.onEnable) {
            super.onEnable();
        }
        if(!g.CustomerJudge){
            this.nodeAsk.active = true;
            this.nodeFaq.active = false;
            this.checkCD();
        }
    }

    private onClickReset() {
        this.editAsk.string = "";
    }

    private onClickCommit() {
        let content = this.editAsk.string.trim();
        if (content.length < 8) {
            showTip("输入的问题字数不得少于8个！");
            return;
        }
        showLoading("提交中");
        window.pomelo.request("lobby.kfHandler.putIn", { content: content, type: QUESTION_TYPE.TYPE_NORMAL }, (data: { code: number }) => {
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

    private async onClickFaq() {
        await this.getFaq();
        this.rec.active = false
        this.nodeAsk.active = false;
        this.problem.active = false;
        this.nodeFaq.active = true;
    }

    onClickProblem() {
        let uid = User.instance.uid;
        let uuid = util.genNewUUID()
        cc.sys.openURL(`${g.serviceCfg.rechargeQuestionUrl}/html/rechargeQuestion.html?uid=${uid}&uuid=${uuid}&token=${md5(`${uid + uuid}-2ghlmcl1hblsqt`)}`)
        //cc.sys.localStorage.setItem(ItemNames.problemCD, Date.now())
        //this.startCountDown(this.cdTime)
    }

    startCountDown(t: number) {
        this.schedule(this.countDown, 1, t - 1)
        this.btnProblem.interactable = false
        this.btnProblem.node.tag = t
    }

    countDown() {
        this.btnProblem.node.tag--
        if (!this.btnProblem.node.tag) {
            this.btnProblem.interactable = true
            this.btnProblem.getComponentInChildren(cc.Label).string = '充值申诉'
            return
        }

        let min = Math.floor(this.btnProblem.node.tag / 60)
        if (min) {
            this.btnProblem.getComponentInChildren(cc.Label).string = "充值申诉("+ min + ')分钟'
        } else {
            let sec = this.btnProblem.node.tag % 60
            this.btnProblem.getComponentInChildren(cc.Label).string = "充值申诉(" + sec + ')秒'
        }
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


    onCheckAsk() {
        this.rec.active = false
        this.problem.active = false;
        this.nodeAsk.active = true
        this.nodeFaq.active = false
    }

    onCheckRec() {
        this.rec.active = true
        this.problem.active = false;
        this.nodeAsk.active = false
        this.nodeFaq.active = false
    }

    onClickRecharge() {
        this.problem.active = true;
        this.rec.active = false
        this.nodeAsk.active = false;
        this.nodeFaq.active = false;
    }

    loadRec(first = false) {
        window.pomelo.request("lobby.kfHandler.getQuestions", { page: this.page++ + '' }, (data: {
            code: number,
            questions: {
                id: string,
                questionTime: number,
                answerTime: number,
                comment: number,
                read: number
            }[],
        }) => {
            if (data.code === 200) {
                for (const q of data.questions || []) {
                    if (!q.read && first) {
                        first = false
                        this.showRec(q.id)
                        this.scheduleOnce(() => {
                            this.togRec.check()
                        }, 0.2)
                    }
                    this.ids.push(q.id)
                    let item = cc.instantiate(this.recItem);
                    item.active = true;
                    this.recContent.addChild(item);
                    let labs = item.getComponentsInChildren(cc.Label)
                    labs[0].string = this.format(q.questionTime) + ' 提交'
                    labs[1].string = this.format(q.answerTime) + ' 回复'
                    labs[2].string = q.comment === undefined ? '未评价' : '已评价'
                    labs[2].node.color = q.comment === undefined ? cc.Color.RED : cc.Color.GREEN
                }
            }
            else {
                showTip(ErrCodes.getErrStr(data.code, ""));
            }
        });
    }

    svDidScroll(ev: any, eventType: cc.ScrollView.EventType) {
        if (cc.ScrollView.EventType.SCROLL_TO_BOTTOM === eventType) {
            this.loadRec()
        }
    }

    format(t: number) {
        let timeStr = util.formatTimeStr('m', +t);
        return timeStr;
    }

    onClickRec(ev: cc.Event.EventTouch) {
        this.showRec(this.ids[this.recContent.children.indexOf(ev.target)])
    }

    showRec(id: string) {
        showLoading("加载中");
        window.pomelo.request("lobby.kfHandler.setRead", { id }, (data: { code: number, question: any }) => {
            hideLoading();
            if (data.code === 200) {
                let di = util.instantiate(this.preCSDetail);
                this.node.addChild(di);
                di.getComponent(CSDetail).setContent({ id, ...(data.question[0] || data.question) })
            }
            else {
                showTip(ErrCodes.getErrStr(data.code, ""));
            }
        });
    }

    private onClickMail(even: cc.Event.EventTouch) {
        if (this.tLobby) {
            this.tLobby.onClickMail();
            this.node.zIndex = -1;
        } else {
            util.showTip("请到邮箱里面查看详情哟～");
        }
    }
}
