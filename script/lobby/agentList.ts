import * as util from "../common/util";
import ConcatAgent from "./contactAgent";
import g from "../g";
const { ccclass, property } = cc._decorator;

interface AgentInfo {
    name: string;
    qq: string;
    wx: string;
    hot: number;
}

const HOT_NUMBER = 1000;

@ccclass
export default class AgentList extends cc.Component {

    @property(cc.Button)
    private refresh: cc.Button = undefined;

    @property(cc.Node)
    private agentList: cc.Node = undefined;

    @property(cc.Node)
    private item: cc.Node = undefined;

    @property(cc.Prefab)
    private agentBox: cc.Prefab = undefined;

    @property(cc.Prefab)
    private complaintBox: cc.Prefab = undefined;

    private fetchingAgents: boolean;
    private needTop = 1;
    private canRefresh: boolean;


    init() {
        this.item.active = false;
        this.canRefresh = true;
        let payEnforceData = g.payEnforceData;
        if (!payEnforceData.locationRule || (payEnforceData.locationRule && !!payEnforceData.locationRule.rechargeAgent)) {
            this.loadAgents();
        } else {
            this.node.active = false;
        }
    }

    private onClickRefresh() {
        if (!this.canRefresh) {
            util.showTip("已刷新");
            return;
        }
        this.loadAgents().then(success => {
            if (success) {
                util.showTip("已刷新");
                this.canRefresh = false;
                this.scheduleOnce(() => {
                    this.canRefresh = true;
                }, 5);
            }
        });
    }

    private onClickComplaint() {
        let di = util.instantiate(this.complaintBox);
        let canvas = cc.find("Canvas");
        canvas.addChild(di);
    }

    /**
     * 刷新代理商信息
     */
    private loadAgents() {
        util.showLoading("加载代理商");
        return new Promise((resolve: (ret: boolean) => void) => {
            window.pomelo.request("lobby.billHandler.getAgent", {}, (data: { code: number, agents: AgentInfo[] }) => {
                if (!data || data.code !== 200) {
                    util.hideLoading();
                    util.showTip("获取代理商信息失败");
                    resolve(false);
                    return;
                }
                let agents = data.agents;
                if (!agents || agents.length === 0) {
                    util.showTip("暂无任何代理商");
                    util.hideLoading();
                    resolve(false);
                    return;
                }
                this.agentList.destroyAllChildren();
                agents.sort((a, b) => {
                    return b.hot - a.hot;
                })
                agents.forEach((agent, index) => {
                    if (index <= 5) { //只取前六个显示
                        let item = <cc.Node>util.instantiate(this.item);
                        item.active = true;
                        this.agentList.addChild(item);
                        let title = item.getChildByName("title").getComponent(cc.Label);
                        title.string = agent.name;
                        let btn = item.getComponent(cc.Button);
                        if (!btn) {
                            return;
                        }
                        let ev = new cc.Component.EventHandler();
                        ev.target = this.node;
                        ev.component = cc.js.getClassName(this);
                        ev.handler = "showAgent";
                        ev.customEventData = JSON.stringify(agent);
                        btn.clickEvents.push(ev);

                        let hot = item.getChildByName("hot");
                        hot.active = agent.hot >= HOT_NUMBER;
                    }
                });
                util.hideLoading();
                resolve(true);
            });
        });
    }

    private showAgent(btn: cc.Button, dataStr: string) {
        let di = util.instantiate(this.agentBox);
        let canvas = cc.find("Canvas");
        canvas.addChild(di);
        di.setPosition(0, 0);
        di.active = true;
        let agent = di.getComponent(ConcatAgent);
        let data: AgentInfo = JSON.parse(dataStr);
        agent.show(data.name, data.qq.trim(), data.wx.trim());
    }
}
