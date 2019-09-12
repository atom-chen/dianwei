import JDNNGame, { RoundType, JokerType, BullType } from "./jdnnGame";
import { formatSeconds } from "../common/util";
import { GameId, GameNames } from "../game-share/game";

const { ccclass, property } = cc._decorator;

@ccclass
export default class JDNNInfo extends cc.Component {

    @property(cc.Node)
    private nodeBets: cc.Node = undefined;

    @property(cc.Node)
    private nodeClock: cc.Node = undefined;

    @property(cc.Label)
    private lblBets: cc.Label = undefined;

    @property(cc.Label)
    private lblClock: cc.Label = undefined;

    @property(cc.Label)
    private lblPrompt: cc.Label = undefined;

    @property(cc.Sprite)
    private spPrompt: cc.Sprite = undefined;

    @property([cc.SpriteFrame])
    private sfPrompt: cc.SpriteFrame[] = [];

    @property(cc.Label)
    private lblClockTime: cc.Label = undefined;

    @property(cc.Node)
    private nodePromptBg: cc.Node = undefined;

    private game: JDNNGame;
    private _tickerPos: cc.Vec2;

    init(game: JDNNGame) {
        this.game = game;
    }

    onLoad() {
        // init logic
        this.nodeBets.active = false;
        this.nodeClock.active = false;
        this._tickerPos = this.nodeClock.position;
    }

    updateBetsPool() {
        // let str = GameNames[Games.JDNIUNIU] + "    底分" + this.game.baseScore;
        let str = this.game.baseScore + ".00";
        this.nodeBets.active = true;
        this.lblBets.string = str;
    }

    private countdownStart() {
        let t = +this.lblClockTime.string || 0;
        t--;
        t = Math.max(t, 0);
        if (t > 0 && this.lblClockTime.node.parent.active) {
            this.lblClockTime.string = t.toString();
            this.game.audioMgr.playClock();
        }
    }

    showTicker(time: number): void {
        // let node = this.lblClockTime.node.parent;
        // node.active = true;
        this.nodePromptBg.active = true;
        this.spPrompt.node.active = true;
        let t = Math.round(time);
        this.lblClockTime.string = t.toString();
        this.unschedule(this.countdownStart);
        this.schedule(this.countdownStart, 1, t, 1);
        // node.stopAllActions();
        // node.setPosition(this._tickerPos);
        // node.scale = 0;
        // node.runAction(cc.sequence(
        //     cc.moveBy(0, 0, -45),
        //     cc.spawn(
        //         cc.scaleTo(0.1, 1, 1),
        //         cc.moveBy(0.3, 0, 45).easing(cc.easeBackOut()),
        //         cc.fadeIn(0.3)
        //     )
        // ));
    }

    hideTicker(): void {
        // let node = this.lblClockTime.node.parent;
        // node.stopAllActions();
        // node.setPosition(this._tickerPos);
        // node.scale = 1;
        // node.runAction(cc.sequence(
        //     cc.spawn(
        //         cc.scaleTo(0.1, 0, 0),
        //         cc.moveBy(0.3, 0, -45).easing(cc.easeBackIn()),
        //         cc.fadeOut(0.3)
        //     ),
        //     cc.callFunc(() => {
        //         node.active = false;
        //     })
        // ));

        this.spPrompt.node.active = false;
        this.nodePromptBg.active = false;
    }

    showPrompt(idx: number) {    //pr:string
        // this.lblPrompt.node.active = true;
        // this.lblPrompt.string = pr;
        this.nodePromptBg.active = true;
        this.spPrompt.node.active = true;
        this.spPrompt.spriteFrame = this.sfPrompt[idx]
    }

    hidePrompt() {
        // this.lblPrompt.node.active = false;
        this.nodePromptBg.active = false;
        this.spPrompt.node.active = false;
    }

}
