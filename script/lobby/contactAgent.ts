import PopActionBox from "../lobby/popActionBox"
import { showTip, setClipboard } from '../common/util';
import Complaint from "./complaint";
import * as util from "../common/util";
const { ccclass, property } = cc._decorator;

@ccclass
export default class ConcatAgent extends PopActionBox {

    @property(cc.Label)
    private agentName: cc.Label = undefined;

    @property(cc.Label)
    private qq: cc.Label = undefined;

    @property(cc.Label)
    private wx: cc.Label = undefined;

    @property(cc.Prefab)
    private preReport: cc.Prefab = undefined;

    @property(cc.Node)
    private layoutQq: cc.Node = undefined;

    @property(cc.Node)
    private layoutWx: cc.Node = undefined;

    private static noData = "--";

    protected onLoad() {
        super.onLoad();
        this.node.active = false;
    }

    private onClickQQ() {
        if (this.qq.string === ConcatAgent.noData) {
            showTip("该代理无QQ");
            return;
        }
        let success = setClipboard(this.qq.string);
        if (success) {
            let install = util.isAppInstalled('qq');
            if (!install) {
                showTip("QQ已拷贝到剪切板");
            } else {
                util.openApp('qq', this.qq.string)
            }
        } else {
            showTip("QQ号拷贝失败");
        }
    }

    private onClickWX() {
        if (this.wx.string === ConcatAgent.noData) {
            showTip("该代理无微信");
            return;
        }
        let success = setClipboard(this.wx.string);
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

    show(name: string, qq: string, wx: string) {
        this.agentName.string = name;
        this.qq.string = qq;
        this.layoutQq.active = !!qq;
        this.wx.string = wx;
        this.layoutWx.active = !!wx;
    }

    private onClickReport() {
        let parent = this.node.parent;
        let str = "代理名：" + this.agentName.string;
        if (this.wx) {
            str += "\n微信号：" + this.wx.string;
        }
        if (this.qq) {
            str += "\nQQ号：" + this.qq.string;
        }
        this.closeAction(() => {
            let node = util.instantiate(this.preReport);
            parent.addChild(node);
            let comp = node.getComponent(Complaint);
            comp.initAgentInfo(str);
        });
    }
}
