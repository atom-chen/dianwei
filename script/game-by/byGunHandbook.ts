import PopActionBox from "../lobby/popActionBox"
import BYGame from "./byGame"

const { ccclass, property } = cc._decorator;

@ccclass
export default class BYGunHandbook extends PopActionBox {

    @property(cc.Node)
    private content: cc.Node = undefined

    @property(cc.Node)
    private tip: cc.Node = undefined

    @property(cc.SpriteFrame)
    sfBtn: cc.SpriteFrame = undefined;

    public game: BYGame = undefined

    onLoad() {
        super.onLoad()
        let game = cc.find("game")
        this.game = game.getComponent(BYGame)
    }

    protected start() {
        this.openAnim(() => {
            for (let i = 1; i < this.content.children.length; i++) {
                let item = this.content.children[i];
                let label = item.getChildByName("beishu");
                label.getComponent(cc.Label).string = "累充" + this.game.gunCfg[i].coin + "元";
            }
            this.init()
            this.setChangeGunLayerMoney()
        });
    }


    init() {
        this.game.byAudio.playButtonClickSound();

        for (let i = 0; i < this.content.children.length; i++) {
            let item = this.content.children[i];
            let btn = item.getChildByName("button")
            btn.getChildByName("sy").active = true;
            btn.getChildByName("syz").active = false;
            btn.getChildByName("bgsy").active = false;
            if (i == this.game.playerMgr.me.gunSpType) {
                btn.getChildByName("sy").active = false;
                btn.getChildByName("syz").active = true;
                btn.getChildByName("bgsy").active = true;
            }
        }

        this.setButtonGray(this.game.myMaxGunSp);
        this.node.on("close", () => {
            this.game.hideChangeGunBtn();
        });
    }

    setButtonGray(garde: number) {
        for (let i = 0; i < garde; i++) {
            let item = this.content.children[i];
            item.getChildByName("button").getChildByName("bgsy").getComponent(cc.Sprite).spriteFrame = this.game.usingBg;
        }

        for (let i = garde; i < this.content.children.length; i++) {
            let item = this.content.children[i];
            let btn = item.getChildByName("button")
            btn.getChildByName("sy").active = false;
            btn.getChildByName("syz").active = false;
            btn.getChildByName("bgsy").active = true;
            btn.getChildByName("bgsy").getComponent(cc.Sprite).spriteFrame = this.sfBtn;
            btn.getChildByName("hq").active = true;
        }
    }

    setChangeGunLayerMoney() {

        let moneyLabel = this.tip.getChildByName("money");
        moneyLabel.getComponent(cc.Label).string = this.game.amount
        let lvsp = this.tip.getChildByName("lvsp");
        let spx = this.game.myMaxGunSp + 1;
        if (spx > 8) {
            spx = 8;
        }
        let spxx = "s" + spx;
        lvsp.getChildByName(spxx).active = true;
    }
    // 换炮 按钮点击
    public onClickUse(event: cc.Event, grade: any) {
        if (grade > this.game.myMaxGunSp) {
            // 点击了获取按钮
            this.game.withdrawBtClick();
            return;
        }
        let me = this.game.playerMgr.me;
        if (me) {
            me.changeGunSp(grade);
        }
        this.closeAction();
        this.game.msg.gameBYHandlerBulletStyle(grade);
    }
}
