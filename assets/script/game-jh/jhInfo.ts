import JHGame from "./jhGame";
import { formatSeconds } from "../common/util";
import JHCard from "./jhCard";
import * as util from "../common/util";

const { ccclass, property } = cc._decorator;

@ccclass
export default class JHInfo extends cc.Component {

    @property(cc.Label)
    private betsPoolInfo: cc.Label = undefined;

    @property(cc.Label)
    private singlebetsPoolInfo: cc.Label = undefined;


    @property(cc.Label)
    private lblClock: cc.Label = undefined;

    @property(cc.Node)
    private leftInfo: cc.Node = undefined;

    @property(cc.Node)
    private rightInfo: cc.Node = undefined;

    @property(cc.Sprite)
    private spBlindTurn: cc.Sprite = undefined;



    private _layoutLeft: cc.Layout;
    private _layoutRight: cc.Layout;
    private _tickerPos: cc.Vec2;

    game: JHGame;

    onLoad() {
        // init logic
        this.leftInfo.active = false;
        this.rightInfo.active = false;
        this._layoutLeft = this.leftInfo.getComponent(cc.Layout);
        this._layoutRight = this.rightInfo.getComponent(cc.Layout);
        this._layoutLeft.enabled = false;
        this._layoutRight.enabled = false;
        this.betsPoolInfo.node.parent.active = false;
        this.singlebetsPoolInfo.node.parent.active = false;
        this.lblClock.node.parent.active = false;
        this._tickerPos = this.lblClock.node.parent.position;
        this.spBlindTurn.node.active = false;
    }

    updateBetsPool() {
        this.betsPoolInfo.node.parent.active = true;
        this.singlebetsPoolInfo.node.parent.active = true;
        if (this.game.curSingleBet === undefined || this.game.totalBets === undefined) {
            this.betsPoolInfo.string = "--"
            this.singlebetsPoolInfo.string = "--"
            return;
        }
        // this.betsPoolInfo.string = `当前单注 ${this.game.curSingleBet}  总注 ${this.game.totalBets}`;
        this.betsPoolInfo.string = `${this.game.totalBets}`;
        this.singlebetsPoolInfo.string = "" + this.game.curSingleBet;
    }

    updateLeft() {
        let game = this.game;
        let lblBaseScore = this.getInfoComp(cc.Label, this.leftInfo, "baseScore");
        lblBaseScore.string = "底分 " + this.game.baseScore;
        this._layoutLeft.enabled = false;
        this.leftInfo.active = true;
    }

    updateRound() {
        let game = this.game;
        let lblRound = this.getInfoComp(cc.Label, this.rightInfo, "round");
        if (game.round === undefined) {
            lblRound.string = "轮数 " + "-/-";
        } else {
            lblRound.string = "轮数 " + game.round + "/" + (game.totalRound || 20);
        }
    }

    updateRight() {
        let game = this.game;
        this.updateRound();

        this._layoutRight.enabled = false;
        this.rightInfo.active = true;
    }

    private getInfoComp<T extends cc.Component>(type: { prototype: T }, parent: cc.Node, name: string) {
        let node = parent.getChildByName(name);
        if (!node) {
            if (type.constructor === cc.Label.constructor) {
                let exam = parent.getChildByName("example");
                if (exam) {
                    exam.active = false;
                    node = util.instantiate(exam);
                    node.name = name;
                    node.active = true;
                    parent.addChild(node);
                }
            }
            if (!node) {
                return;
            }
        }
        node.active = true;
        return node.getComponent(type);
    }

    updateBlindIcon() {
        if (!this.spBlindTurn || !this.spBlindTurn.isValid) {
            return;
        }
        let node = this.spBlindTurn.node;
        let me = this.game.playerMgr.me;
        if (!me.isLooker && !this.game.canLookCard && !this.game.isResulting) {
            node.active = true;
        } else {
            node.active = false;
        }
    }

    private countdownStart() {
        let t = +this.lblClock.string || 0;
        t--;
        t = Math.max(t, 0);
        if (t > 0) {
            this.lblClock.string = t.toString();
            this.game.audioMgr.playClock();
        }
    }

    showTicker(time: number): void {
        let node = this.lblClock.node.parent;
        node.active = true;
        let t = Math.round(time);
        this.lblClock.string = t.toString();
        this.unschedule(this.countdownStart);
        this.schedule(this.countdownStart, 1, t, 1);
        node.stopAllActions();
        node.setPosition(this._tickerPos);
        node.scale = 0;
        node.runAction(cc.sequence(
            cc.moveBy(0, 0, -45),
            cc.spawn(
                cc.scaleTo(0.1, 1, 1),
                cc.moveBy(0.3, 0, 45).easing(cc.easeBackOut()),
                cc.fadeIn(0.3)
            )
        ));
    }

    hideTicker(): void {
        let node = this.lblClock.node.parent;
        node.stopAllActions();
        node.setPosition(this._tickerPos);
        node.scale = 1;
        node.runAction(cc.sequence(
            cc.spawn(
                cc.scaleTo(0.1, 0, 0),
                cc.moveBy(0.3, 0, -45).easing(cc.easeBackIn()),
                cc.fadeOut(0.3)
            ),
            cc.callFunc(() => {
                node.active = false;
            })
        ));
    }

}
