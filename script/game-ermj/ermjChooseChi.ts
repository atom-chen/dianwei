import MahjongRes from "../game-share/mahjongRes";

const { ccclass, property } = cc._decorator;

@ccclass
export default class ErmjChooseChi extends cc.Component {
    @property(cc.Node)
    chis: cc.Node = undefined;

    show(chiVal: number, startVals: number[], mahjongRes: MahjongRes) {
        this.node.active = true;

        this.chis.children.forEach((btn, i) => {
            if (i < startVals.length) {
                btn.active = true;
                btn.name = startVals[i] + '';

                btn.children.forEach((n, j) => {
                    let val = startVals[i] + j;
                    if (val === chiVal) {
                        n.opacity = 200;
                    } else {
                        n.opacity = 255;
                    }
                    let s = n.getChildByName('pai').getComponent(cc.Sprite);
                    s.spriteFrame = mahjongRes.getPaiSpriteFrame(val);
                })
            } else {
                btn.active = false;
            }
        })
    }

    hide() {
        this.node.active = false;
    }

}
