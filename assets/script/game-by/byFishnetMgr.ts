import BYGame from "./byGame";
import * as util from "../common/util";
const { ccclass, property } = cc._decorator;
@ccclass
export default class BYFishnetMgr extends cc.Component {

    public game: BYGame = undefined;

    private netPool: cc.Node[][] = [[], [], [], [], [], [], [], [], [], []];


    onLoad() {
        let game = cc.find("game");
        this.game = game.getComponent(BYGame);
    }

    onDestroy() {
    }

    getOneFishNet(seat: number) {
        let p = this.game.playerMgr.getPlayerBySeat(seat);
        let oneNetPool = this.netPool[p.gunSpType];
        let fishNet = undefined;
        for (let i = 0; i < oneNetPool.length; i++) {
            fishNet = oneNetPool[i];
            if (!fishNet.active) {
                return fishNet;
            }
        }
        fishNet = util.instantiate(p.fishNetNode);
        oneNetPool.push(fishNet);
        this.node.addChild(fishNet);
        return fishNet;
    }
    public createFishNet(seat: number, pos: cc.Vec2) {
        let p = this.game.playerMgr.getPlayerBySeat(seat);
        let net = this.getOneFishNet(seat);
        net.active = true;
        net.opacity = 0;
        net.scale = 1;
        net.runAction(cc.fadeIn(0.1));
        let random3 = util.random(-30, 30);
        let random4 = util.random(-30, 30);
        net.position = cc.p(pos.x + random3, pos.y + random4);
        let time = 0.3;
        if (p.gunSpType > 1) {
            net.runAction(cc.rotateBy(0.55, 239));
            time = 0.3;
        }

        this.scheduleOnce(() => {
            let callBack = cc.callFunc(() => {
                net.active = false;
            });
            net.runAction(cc.sequence(cc.scaleTo(0.15, 0.39), callBack));
        }, time);

        return;
    }

}
