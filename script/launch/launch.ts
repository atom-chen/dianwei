import * as util from "../common/util";
const { ccclass, property } = cc._decorator;

@ccclass
export default class Launch extends cc.Component {
    @property(cc.Node)
    private nodeLogo: cc.Node = undefined;

    @property(cc.Node)
    private nodeCanvas: cc.Node = undefined;


    protected onLoad() {
        this.nodeLogo.opacity = 0;
        util.fitCanvas(this.nodeCanvas);
    }

    protected async start() {
        let p1 = new Promise(resolve => {
            this.nodeLogo.runAction(cc.sequence(
                cc.fadeIn(0.5),
                cc.delayTime(1),
                cc.callFunc(resolve)
            ));
        });
        let p2 = new Promise(resolve => {
            cc.director.preloadScene("start", resolve);
        });
        await Promise.all([p1, p2]);
        this.nodeLogo.runAction(cc.sequence(
            cc.fadeOut(0.5),
            cc.callFunc(function () {
                cc.director.loadScene("start")
            })
        ));
    }



    // test() {
    //     let spk1 = this.testteest.getComponent(sp.Skeleton);
    //     if (spk1) {
    //         var bone = spk1.findBone('fj_4');

    //         cc.log(bone);

    //         this.schedule(() => {
    //             cc.log(bone.worldX, bone.worldY);
    //             this.child.position = cc.v2(bone.worldX, bone.worldY);
    //         }, 0.02);


    //     }
    // }
}
