
const { ccclass, property } = cc._decorator;

@ccclass
export default class ErmjBaoTing extends cc.Component {

    show() {
        this.node.active = true;

        this.node.children[0].active = true;
        this.node.children[1].active = false;
    }

    onClickBaoTing(ev: cc.Event.EventTouch) {
        for (const n of this.node.children) {
            n.active = false;
        }
    }

    isToBao() {
        return !this.node.children[0].active;
    }

    hide() {
        this.node.active = false;
    }

}
