const { ccclass, property } = cc._decorator;

@ccclass
export default class Loading extends cc.Component {

    @property(cc.Node)
    centerSprite: cc.Node = undefined;

    @property(cc.Node)
    circleSprite1: cc.Node = undefined;

    @property(cc.Node)
    circleSprite2: cc.Node = undefined;

    @property(cc.Label)
    info: cc.Label = undefined;

    private showing: boolean;

    onLoad() {
        // init logic
        this.info.string = "请等待";
    }

    start() {
        let anim = () => {
            let centerAni1 = cc.scaleTo(0.5, 0, 1);
            let centerAni2 = cc.scaleTo(0.5, 1, 1);
            let circleAni1 = cc.rotateBy(1, 180);
            let circleAni2 = cc.rotateBy(1, -180);
            let sequence1 = cc.sequence(centerAni1, centerAni2);
            this.centerSprite.runAction(sequence1);
            this.circleSprite1.runAction(circleAni1);
            this.circleSprite2.runAction(circleAni2);
        }
        anim();
        this.schedule(anim, 1);
    }

    show(info?: string) {
        if (info) {
            this.info.string = info;
        }
        if (this.showing) {
            return;
        }
        this.showing = true;
        this.node.active = true;
        this.node.opacity = 0;
        this.node.stopAllActions();
        this.node.runAction(cc.fadeIn(0.5));
    }

    close() {
        let closeActions: cc.FiniteTimeAction[] = [];
        let action = this.node.getActionByTag(1);
        if (action && action instanceof cc.FiniteTimeAction && !action.isDone()) {
            closeActions.push(action);
        }
        closeActions.push(cc.fadeOut(0.2));
        closeActions.push(cc.callFunc(() => {
            this.showing = false;
            this.node.destroy();
        }));
        this.node.stopAllActions();
        this.node.runAction(cc.sequence(closeActions));
    }
}
