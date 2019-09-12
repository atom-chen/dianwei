import { Gender, UserInfo, Where, User } from "../common/user";
import * as util from "../common/util";
import PopActionBox from "../lobby/popActionBox"
import { addSingleEvent } from "../common/util";

const { ccclass, property } = cc._decorator;

@ccclass
export default class ChangeAvatar extends PopActionBox {
    @property(cc.Prefab)
    avatarItem: cc.Prefab = undefined;

    @property(cc.Node)
    page1: cc.Node = undefined;

    @property(cc.Node)
    page2: cc.Node = undefined;

    private newAvatarId: number;
    private nowGender: Gender;
    private changeGender: Gender;

    onLoad() {
        super.onLoad();
    }

    start() {
        super.openAnim(() => {
            let user = User.instance;
            let realId = user.avatarId % 10;
            for (let idIdx = 0; idIdx < 20; idIdx++) {
                let avatar = util.instantiate(this.avatarItem);
                let tg = avatar.getComponent(cc.Toggle);
                let parentNode;
                let isMale;
                if (idIdx < 10) {
                    parentNode = this.page1
                    isMale = false;
                    if (!user.isMale) {
                        if (idIdx === realId) {
                            tg.check();
                        }
                    }
                } else {
                    parentNode = this.page2;
                    isMale = true;
                    if (user.isMale) {
                        if (idIdx % 10 === realId) {
                            tg.check();
                        }
                    }
                }
                parentNode.addChild(avatar);
                let head = avatar.getChildByName("head");
                head.getComponent(cc.Sprite).spriteFrame = util.getAvatar(isMale, idIdx);

                let handler = new cc.Component.EventHandler();
                handler.target = this.node;
                handler.component = cc.js.getClassName(this);
                handler.handler = "onToggleAvatar";
                handler.customEventData = idIdx.toString();
                addSingleEvent(tg, handler);
            }
        });
        this.nowGender = User.instance.gender;
    }

    private onToggleAvatar(ev: cc.Event.EventTouch, data: string) {
        if (data == undefined) {
            return;
        }
        let idx = +data;
        if (isNaN(idx) || idx == undefined) {
            return;
        }
        if (idx < 10) {
            this.onClickSex(Gender.FEMALE);
            this.newAvatarId = idx;
        } else {
            this.onClickSex(Gender.MALE);
            this.newAvatarId = idx % 10;
        }
        this.onClickSure();
    }

    private onClickSex(sex: Gender) {
        window.pomelo.notify("lobby.userHandler.changeGender", { gender: sex === Gender.MALE ? 1 : 0 });
        this.changeGender = sex;
        User.instance.gender = sex;
    }

    private onClickSure() {
        let user = User.instance;
        if (this.newAvatarId !== undefined && (this.newAvatarId !== user.avatarId || this.changeGender !== this.nowGender)) {
            window.pomelo.notify("lobby.userHandler.changeAvatar", { avatar: this.newAvatarId });
            User.instance.avatarId = this.newAvatarId;
            this.user.refreshUserInfos();

            util.showTip("头像编辑成功！");
        }
        this.closeAction();
    }
}