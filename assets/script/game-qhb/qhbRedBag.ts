import QHBGame from "./qhbGame";
import { PlayerInfo } from "./qhbPlayerMgr";
import { redBagInfo } from "./qhbMsg";
import { getAvatar, parseLocation } from "../common/util";
import { Gender } from "../common/user";

const {ccclass, property} = cc._decorator;


@ccclass
export default class QHBRedBag extends cc.Component {
    @property(cc.Node)
    ndNormal: cc.Node = undefined;

    @property(cc.Node)
    ndResult: cc.Node = undefined;

    @property(cc.Sprite)
    spNormalAvatar: cc.Sprite = undefined;

    @property(cc.Label)
    lblNormalLoc: cc.Label = undefined;

    @property(cc.Label)
    lblRedBagGold: cc.Label = undefined;

    @property(cc.Label)
    lblRedBagNum: cc.Label = undefined;

    @property(cc.Label)
    lblNormalBoomNo: cc.Label = undefined;

    @property(cc.Node)
    ndGrabAni: cc.Node = undefined;

    @property(cc.Sprite)
    spResultPanel: cc.Sprite = undefined;

    @property(cc.Sprite)
    spMyResultPanel: cc.Sprite = undefined;

    @property(cc.Sprite)
    spResultAvatar: cc.Sprite = undefined;

    @property(cc.Label)
    lblResultLoc: cc.Label = undefined;

    @property(cc.Label)
    lblMyGrabedMoney: cc.Label = undefined;

    @property(cc.Label)
    lblResultChgMoney: cc.Label = undefined;

    @property(cc.Label)
    lblResultBoomNo: cc.Label = undefined;

    @property([cc.SpriteFrame])
    sfRedBagBgs: cc.SpriteFrame[] = [];

    @property([cc.Font])
    ftResult: cc.Font[] = [];

    game: QHBGame;
    order: number;


    private actionIsEnd: boolean = true;  // 避免再动画过程中，改变了当前红包信息
    private redBagPos: cc.Vec2[] = [];
    private redBagScale: number[] = [];
    private redBagOpacity: number[] = [];

    init(game: QHBGame, order: number) {
        this.game = game;
        this.redBagPos = this.game.redBagPos;
        this.redBagScale = this.game.redBagScale;
        this.redBagOpacity = this.game.redBagOpacity;
        this.setOrder(order)
    }

    setOrder(order: number) {
        this.order = order;
        if (order === 0) {
            this.grabParticialCtr(true);
            this.game.playAni(this.ndGrabAni, true);
            this.ndGrabAni.opacity = 255;
            this.ndGrabAni.getChildByName("qiang_ic2").getComponent(cc.Button).interactable = true;
        } else {
            this.grabParticialCtr(false);
            this.ndGrabAni.opacity = 0;
            this.ndGrabAni.getChildByName("qiang_ic2").getComponent(cc.Button).interactable = false;
        }
    }

    /**
     * 设置红包信息
     * @param p
     * @param rb
     * @param isResult
     * @param chgMoney
     */
    setRedBagInfo(p: PlayerInfo, rb: redBagInfo) {
        if (!this.actionIsEnd || !p) return;
        this.showMyRedBag(p);
        let avatar = getAvatar((p.gender === Gender.MALE), p.avatar);
        let loc = parseLocation(p.location);
        let boomNo = rb.boomNo.toString();
        this.spNormalAvatar.spriteFrame = avatar;
        this.lblNormalLoc.string = loc;
        this.lblRedBagNum.string = this.game.REDBAG_COUNT.toString();
        this.lblRedBagGold.string = rb.money;
        this.lblNormalBoomNo.string = boomNo;

        this.spResultAvatar.spriteFrame = avatar;
        this.lblResultLoc.string = loc;
        this.lblResultBoomNo.string = boomNo;
        this.ndResult.active = false;
        this.ndNormal.active = true;
        this.lblRedBagGold.node.parent.active = true;
    }

    /**
     * 展示自己的红包
     * @param p
     */
    showMyRedBag(p: PlayerInfo) {
        if (p.pos === this.game.playerMgr.getMePos()) {
            this.ndNormal.getComponent(cc.Sprite).spriteFrame = this.sfRedBagBgs[3];
            this.spMyResultPanel.spriteFrame = this.sfRedBagBgs[5];
        } else {
            this.ndNormal.getComponent(cc.Sprite).spriteFrame = this.sfRedBagBgs[2];
            this.spMyResultPanel.spriteFrame = this.sfRedBagBgs[4];
        }
    }

    /**
     * 展示玩家自己抢到的金币
     * @param grabMoney
     */
    showMyGrabedMoney(grabMoney: string) {
        this.ndNormal.active = false;
        this.ndResult.active = true;
        this.spResultPanel.spriteFrame = this.sfRedBagBgs[0];
        this.lblMyGrabedMoney.string = "+" + grabMoney;
        this.lblMyGrabedMoney.node.parent.active = true;
        this.lblResultChgMoney.node.active = false;
    }

    /**
     * 展示庄家输赢
     * @param chgMoney  庄家输赢
     * @param isMyResult 玩家自己是否有抢
     */
    showBankerChgMoney(chgMoney: string, isMyResult: boolean) {
        this.ndNormal.active = false;
        this.ndResult.active = true;
        this.lblResultChgMoney.node.parent.opacity = 0;
        this.lblResultChgMoney.node.active = true;
        if (!isMyResult) {
            this.lblMyGrabedMoney.node.parent.active = false;
            this.spResultPanel.spriteFrame = this.sfRedBagBgs[1];
        }
        if (+chgMoney >= 0) {
            chgMoney = "+" + chgMoney;
            this.lblResultChgMoney.font = this.ftResult[0];
        } else {
            this.lblResultChgMoney.font = this.ftResult[1];
        }
        this.lblResultChgMoney.string = chgMoney;
        this.lblResultChgMoney.node.parent.runAction(cc.fadeIn(0.4));
    }

    /**
     * 切换动画
     */
    switchAni() {
        this.actionIsEnd = false;
        this.ndGrabAni.getComponent(cc.Animation).stop();

        let a1 = cc.sequence(
            cc.spawn(
                cc.scaleBy(0.5, 2),
                cc.fadeOut(0.5),
            ),
            cc.callFunc(() => {
                this.actionIsEnd = true;
                this.ndResult.active = false;
                this.ndNormal.active = true;
                this.node.setPosition(this.redBagPos[2]);
                this.node.scale = this.redBagScale[2];
                this.node.opacity = this.redBagOpacity[2];
                this.node.zIndex = 0;
                this.lblResultChgMoney.node.parent.opacity = 0;
                this.setOrder(2);
            }),
        );

        let a2 = cc.sequence(
            cc.spawn(
                cc.scaleTo(0.5, this.redBagScale[0]),
                cc.fadeIn(0.5),
                cc.moveTo(0.5, this.redBagPos[0]),
            ),
            cc.callFunc(() => {
                this.actionIsEnd = true;
                this.node.setPosition(this.redBagPos[0]);
                this.node.zIndex = 2;
                this.setOrder(0);
            }),
        );

        let a3 = cc.sequence(
            cc.spawn(
                cc.scaleTo(0.5, this.redBagScale[1]),
                cc.fadeTo(0.5, this.redBagOpacity[1]),
                cc.moveTo(0.5, this.redBagPos[1]),
            ),
            cc.callFunc(() => {
                this.actionIsEnd = true;
                this.node.setPosition(this.redBagPos[1]);
                this.node.zIndex = 1;
                this.setOrder(1);
            }),
        );

        if (this.order === 0) {
            this.winEffectCtr(false);
            this.grabParticialCtr(false);
            this.ndGrabAni.runAction(cc.fadeOut(0.4));
            this.node.runAction(a1);
        } else if (this.order === 1) {
            this.ndGrabAni.runAction(cc.sequence(
                cc.fadeIn(2),
                cc.callFunc(() => {
                    this.grabParticialCtr(true);
                }),
            ));
            this.node.runAction(a2);
        } else {
            this.node.runAction(a3);
        }
    }

    /**
     * 动态设置红包数量
     */
    setRedBagNum(num: number) {
        this.lblRedBagNum.string = num.toString();
    }

    /**
     * 抢特效控制
     * @param active
     */
    private grabParticialCtr(active: boolean) {
        let par1 = this.ndGrabAni.getChildByName("particle");
        let parChild = par1.getComponentsInChildren(cc.ParticleSystem);
        parChild.forEach((p) => {
            if (active) {
                p.resetSystem();
            } else {
                p.stopSystem();
            }
        });

        let par2 = this.ndGrabAni.getChildByName("Quan").getComponent(cc.ParticleSystem);
        if (active) {
            par2.resetSystem();
        } else {
            par2.stopSystem();
        }
    }

    /**
     * 金币喷射特效动画控制
     */
    winEffectCtr(active: boolean) {
        let star = this.ndResult.getChildByName("Star");
        let starEff = star.getComponent(cc.ParticleSystem);
        let gold = this.ndResult.getChildByName("Gold");
        let goldEff = gold.getComponent(cc.ParticleSystem);
        let lights = this.ndResult.getChildByName("lights");
        let ani = this.ndResult.getComponent(cc.Animation);
        lights.active = active;
        if (active) {
            starEff.resetSystem();
            goldEff.resetSystem();
            ani.play();
        } else {
            starEff.stopSystem();
            goldEff.stopSystem();
            ani.stop();
        }
    }
}
