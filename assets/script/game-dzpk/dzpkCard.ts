import PokerCard from "../game-share/pokerCard";
import { setGray } from "../common/util";

const { ccclass, property } = cc._decorator;

@ccclass
export default class DZPKCard extends PokerCard {
    meDiscard() {
        setGray(this.node);
    }
}