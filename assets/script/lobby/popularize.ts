import { instantiate, setClipboard, showTip, extractNum, isAppInstalled } from "../common/util";
import PopActionBox from "./popActionBox"

const { ccclass, property } = cc._decorator;

@ccclass
export default class Popularize extends PopActionBox {

    @property(cc.Node)
    private item: cc.Node = undefined;

    @property(cc.Node)
    private list: cc.Node = undefined;

    @property(cc.Node)
    private notice: cc.Node = undefined;

    @property(cc.ScrollView)
    sv: cc.ScrollView = undefined;

    onLoad() {
        super.onLoad();
        this.sv.node.active = false;
    }

    start() {
        this.openAnim(() => {
            this.sv.node.active = true;
            window.pomelo.request("lobby.lobbyHandler.getPopularize", {}, (data: {
                code: number;
                wxs: string[];
            }) => {
                if (data.code === 200) {
                    if (data.wxs) {
                        for (let idx = 0; idx < data.wxs.length; idx++) {
                            const wx = data.wxs[idx];
                            let item = <cc.Node>instantiate(this.item);
                            item.active = true;
                            this.sv.content.addChild(item);
                            item.x = 0;
                            let name = item.getComponentInChildren(cc.Label);
                            name.string = wx;

                            let btn = item.getComponentInChildren(cc.Button);
                            let handler = new cc.Component.EventHandler();
                            handler.target = this.node;
                            handler.component = cc.js.getClassName(this);
                            handler.handler = "onClickCopy";
                            handler.customEventData = wx;
                            btn.clickEvents.push(handler);
                        }
                    }
                    this.notice.active = !data.wxs;
                }
            });
        });

    }

    onClickCopy(ev: cc.Event.EventTouch, wx: string) {
        if (!wx) return;
        let success = setClipboard(wx)
        if (success) {
            let install = isAppInstalled('wx');
            if (!install) {
                showTip("微信已拷贝到剪切板");
            } else {
                cc.sys.openURL("weixin://");
            }
        } else {
            showTip("微信号拷贝失败");
        }
    }
}
