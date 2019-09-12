import ScrollViewBox from "../lobby/scrollViewBox"
import BYGame from "./byGame"

const { ccclass, property } = cc._decorator;

@ccclass
export default class BYFishHandbook extends ScrollViewBox {

    @property(cc.Node)
    private content: cc.Node = undefined

    @property(cc.Node)
    private tip: cc.Node = undefined

    @property(cc.SpriteFrame)
    sfBtn: cc.SpriteFrame = undefined;

    public byGame: BYGame = undefined

    onLoad() {
        super.onLoad()
        let game = cc.find("game")
        this.byGame = game.getComponent(BYGame)
    }

    protected start() {
        this.openAnim(() => {

        });
    }

}
