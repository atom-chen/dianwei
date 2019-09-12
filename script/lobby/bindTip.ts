import * as util from "../common/util";
import PopActionBox from "./popActionBox"
import { User } from "../common/user";

const { ccclass, property } = cc._decorator;

@ccclass
export default class BindTip extends PopActionBox {
    @property(cc.Label)
    content: cc.Label = undefined;

    @property(cc.Button)
    btnRegister: cc.Button = undefined;

    @property(cc.Button)
    btnHasAccount: cc.Button = undefined;


    @property(cc.Prefab)
    preRegister: cc.Prefab = undefined;

    start() {
        super.start();
        let bindBonus = User.instance.bindBonus;
        this.content.string = bindBonus ? bindBonus.money + "" : "3";
    }

    onClickLogin() {
        util.returnToLogin();
    }
    onClickGoRegister() {
        let parent = this.node.parent;
        this.closeAction(() => {
            let node = this.openAction(parent, this.preRegister);
            node.name = "bind";
            node.once("close", () => {
                cc.log("close bind");
            });
        });
    }
}
