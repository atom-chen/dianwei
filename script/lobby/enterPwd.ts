import Confirm from "../common/confirm";

const { ccclass, property } = cc._decorator;

@ccclass
export default class EnterPwd extends Confirm {


    @property(cc.EditBox)
    ebPwd: cc.EditBox = undefined;


    showConfirm() {
        this.node.active = true;

    }
}