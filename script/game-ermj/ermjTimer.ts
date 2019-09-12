import * as util from "../common/util";
import ErmjTicker from "./ermjTicker";

const { ccclass, property } = cc._decorator;

@ccclass
export default class ErmjTimer extends cc.Component {


    @property(cc.Node)
    private nodeSeat: cc.Node = undefined;

    @property(cc.Label)
    private labRemain: cc.Label = undefined;

    @property(cc.Label)
    private labScore: cc.Label = undefined;

    @property(cc.Label)
    private labDes: cc.Label = undefined;


    private _remainNum = 0;
    private PAI_NUM_REMAIN_BEGIN = 64;

    @property(ErmjTicker)
    clock: ErmjTicker = null;
    @property(ErmjTicker)
    ticker: ErmjTicker = null;


    clockTick(time: number) {
        this.clock.node.parent.active = true;
        this.clock.startTick(time);
    }

    hideClock() {
        this.clock.node.parent.active = false;
    }

    setGameTicker(time: number) {
        this.ticker.startTick(time);
    }

    start() {
        let fadeTime = 1.5;
        this.nodeSeat.children.forEach(element => {
            element.active = true;
            element.runAction(cc.repeatForever(cc.sequence(cc.fadeOut(fadeTime), cc.fadeIn(fadeTime))));
            element.active = false;
        });
    }

    reset() {
        this.nodeSeat.children.forEach((v) => {
            v.active = false;
        });
    }

    setMode(isChange3: boolean) {
        this.labDes.node.active = true;
        if (isChange3) {
            this.labDes.string = "血战换三张";
        } else {
            this.labDes.string = "血战自摸加番";
        }
    }

    setBet(bet: number) {
        this.labScore.node.active = true;
        this.labScore.string = `底分 ${bet}`;
    }

    hideMode() {
        this.labDes.node.active = false;
        this.labScore.node.active = false;
    }

    setTurn(seat: number) {
        for (let index = 0; index < this.nodeSeat.children.length; index++) {
            let nodeTurn = this.nodeSeat.children[index];
            if (index === seat)
                nodeTurn.active = true;
            else
                nodeTurn.active = false;
        }
    }

    getSuitWorldPos(seat: number): cc.Vec2 {
        return cc.p();
    }

    setSuit(seat: number, suit: number) {
    }

    setRemainPaiTotal(total: number, isAll = false) {
        this._remainNum = isAll ? this.PAI_NUM_REMAIN_BEGIN : total;
        this.labRemain.string = this._remainNum + "";
    }

    setPlayerDraw() {
        this._remainNum -= 1;
        this.labRemain.string = this._remainNum + "";
    }

    setWait(leftTime: number, seat: number) {
        this.setGameTicker(leftTime);
        this.setTurn(seat);
    }
}
