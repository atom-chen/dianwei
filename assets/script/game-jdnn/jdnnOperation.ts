import { addSingleEvent, div } from "../common/util";
import JDNNGame from "./jdnnGame";

const { ccclass, property } = cc._decorator;

const BET_POINT_LIST = [5, 10, 15, 20, 25];

@ccclass
export default class JDNNOperation extends cc.Component {

    @property(cc.Node)
    private grabDealer: cc.Node = undefined;

    @property(cc.Node)
    private bet: cc.Node = undefined;

    private game: JDNNGame;

    protected onLoad() {
        // init logic
        this.initGrab();
        this.initBet();
    }

    init(game: JDNNGame) {
        this.game = game;
    }

    initRound() {
        this.grabDealer.active = false;
        this.bet.active = false;
    }

    private initGrab() {
        for (let child of this.grabDealer.children) {
            let btn = child.getComponent(cc.Button);
            if (!btn) {
                continue;
            }
            let handler = new cc.Component.EventHandler();
            handler.target = this.node;
            handler.component = cc.js.getClassName(this);
            handler.handler = "onClickGrab";
            handler.customEventData = child.name;
            addSingleEvent(btn, handler);
        }
    }

    private initBet() {
        for (let child of this.bet.children) {
            let btn = child.getComponent(cc.Button);
            if (!btn) {
                continue;
            }
            let handler = new cc.Component.EventHandler();
            handler.target = this.node;
            handler.component = cc.js.getClassName(this);
            handler.handler = "onClickBet";
            handler.customEventData = child.name;
            addSingleEvent(btn, handler);
        }
    }

    private onClickGrab(btn: cc.Button, data: string) {
        cc.log("click grab")
        this.game.msg.sendGrab(+data);
    }

    private onClickBet(btn: cc.Button, data: string) {
        let val = BET_POINT_LIST[+data];
        this.game.msg.sendBet(val);
    }

    showGrab() {
        this.grabDealer.active = true;
        let grabs = this.grabDealer.getComponentsInChildren(cc.Button);

        grabs.forEach((btn, index) => {
            btn.interactable = true;
        });
    }

    hideGrab() {
        this.grabDealer.active = false;
    }

    showBet() {
        this.bet.active = true;
        let bets = this.bet.getComponentsInChildren(cc.Button);

        for (let idx = 0; idx < BET_POINT_LIST.length; idx++) {
            const point = BET_POINT_LIST[idx];
            let btn = bets[idx];
            btn.interactable = true;
            let lab = btn.node.getChildByName("node").getChildByName("lab").getComponent(cc.Label);
            lab.string = `x${point}`;
        }
    }

    hideBet() {
        this.bet.active = false;
    }
}
