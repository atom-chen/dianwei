import Poker from "../game-share/dpPoker";
import { CardPoint, CardColor } from "../game-share/dpPokerAlgorithm";

const { ccclass, property } = cc._decorator;

@ccclass
export default class PdkPoker extends Poker {
    private nodeFirst: cc.Node = undefined;
    private nodeNewBack: cc.Node = undefined

    onLoad() {
        super.onLoad();
        this.nodeFirst = this.node.getChildByName("front").getChildByName("first");
        this.nodeFirst.active = false;
        this.nodeNewBack = this.node.getChildByName("back");
        this.setPokerBack(false);
    }

    /**
     * ♥️3 首出
     */
    setFirst() {
        if (this.cardPoint === CardPoint.POINT_3 && this.cardSuit === CardColor.CARD_COLOR_HEART) {
            this.nodeFirst.active = true;
        } else {
            this.nodeFirst.active = false;
        }
    }

    setPokerBack(visible: boolean) {
        this.nodeNewBack.active = visible;
    }
}
