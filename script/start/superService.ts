import { showTip, setClipboard } from '../common/util';
import * as util from "../common/util";
import g from '../g';
import PopActionBox from '../lobby/popActionBox';
const { ccclass, property } = cc._decorator

const localStorage: Storage = cc.sys.localStorage;
@ccclass
export default class SuperService extends PopActionBox {
    @property(cc.Label)
    private lbUrl: cc.Label = undefined;
    @property(cc.Label)
    private lbWx: cc.Label = undefined;
    @property(cc.Label)
    private lbQQ: cc.Label = undefined;

    onLoad() {
        super.onLoad();
        this.node.active = false;
        this.nodeBox.getChildByName('mid').children.forEach(item => {
            item.active = false;
        });
    }

    start() {
        super.start();
        if (g.serviceCfg.web.trim()) {
            this.lbUrl.node.parent.active = true;
            this.lbUrl.string = g.serviceCfg.web;
        }
        if (g.serviceCfg.weChat.trim()) {
            this.lbWx.node.parent.active = true;
            this.lbWx.string = g.serviceCfg.weChat;
        }
        if (g.serviceCfg.qq.trim()) {
            this.lbQQ.node.parent.active = true;
            this.lbQQ.string = g.serviceCfg.qq;
        }
    }

    onClickGotoUrl() {
        if (this.lbUrl.string === '') {
            showTip("暂无官网地址");
            return
        }
        cc.sys.openURL(this.lbUrl.string);
    }

    onClickCopyWx() {
        if (this.lbWx.string === '') {
            showTip("暂无客服微信");
            return;
        }
        let success = setClipboard(this.lbWx.string);
        if (success) {
            let install = util.isAppInstalled('wx');
            if (!install) {
                showTip("客服微信已拷贝到剪切板");
            } else {
                util.openApp('wx', this.lbWx.string)
            }
        } else {
            showTip("客服微信拷贝失败");
        }
    }

    onClickChatQQ() {
        if (this.lbQQ.string === '') {
            showTip("暂无客服QQ");
            return;
        }
        let success = setClipboard(this.lbQQ.string);
        if (success) {
            let install = util.isAppInstalled('qq');
            if (!install) {
                showTip("客服QQ已拷贝到剪切板");
            } else {
                util.openApp('qq', this.lbQQ.string)
            }
        } else {
            showTip("客服QQ拷贝失败");
        }
    }

}