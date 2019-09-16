import { UserInfo, Where, User } from "../common/user";
import * as util from "../common/util";

const { ccclass, property } = cc._decorator;

@ccclass
export default class LobbyUser extends cc.Component {

    @property(cc.Button)
    private btnAvatar: cc.Button = undefined;

    @property(cc.Label)
    private labID: cc.Label = undefined;

    @property(cc.Label)
    private labNick: cc.Label = undefined;

    @property(cc.Label)
    private labCash: cc.Label = undefined;

    @property(cc.Node)
    private nodeBank: cc.Node = undefined;

    @property(cc.Label)
    private labBankGold: cc.Label = undefined;

    @property(cc.Label)
    private labLocation: cc.Label = undefined;

    get getAvatar() {
        return this.btnAvatar.node;
    }

    onLoad() {
        window.pomelo.on("updateOwnLocation", this.onLocationUpdate.bind(this));
    }

    private onLocationUpdate(data: { location: string }) {
        User.instance.location = data.location;
        this.refreshUserInfos();
    }

    start() {
        console.log(" lobby start");
        this.refreshUserInfos();
    }

    refreshUserInfos() {
        let user = User.instance;
        this.btnAvatar.getComponent(cc.Sprite).spriteFrame = util.getAvatar(user.isMale, user.avatarId);
        this.labID.string = user.uid.toString();
        this.labNick.string = user.nick;
        this.labCash.string = (util.toCNMoney(user.money.toString())).toString();
        this.labLocation.string = util.parseLocation(user.location);
        if (user.bankMoney && user.bankMoney > 0) {
            this.labBankGold.string = (util.toCNMoney(user.bankMoney.toString())).toString();
        } else {
            this.labBankGold.string = (util.toCNMoney(0 + '')).toString();
        }
    }

    protected onDestroy() {
        window.pomelo.off("recharge");
        window.pomelo.off("userMoney");
        window.pomelo.off("hasNewMail");
        window.pomelo.off("updateOwnLocation");
    }
}
