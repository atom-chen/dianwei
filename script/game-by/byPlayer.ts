import Player from "../game-share/player";
import BYGame from "./byGame";
import BYFish from "./byFish";
import { User } from "../common/user";
import Game from "../game-share/game";
import * as util from "../common/util";
import BYFishRoute from "./byFishRoute";
import { getQuadrantDegree, hideDotLine, createDotLine, drawDotLine } from "./byUtil"

const { ccclass, property } = cc._decorator;

@ccclass
export default class BYPlayer extends Player {
    game: BYGame;

    @property(cc.Node)
    gun: cc.Node = undefined;

    @property(cc.Node)
    lizi: cc.Node = undefined;

    @property(cc.Node)
    emptySeat: cc.Node = undefined;

    @property(cc.Sprite)
    gunsp: cc.Sprite = undefined;

    @property(cc.Sprite)
    flame: cc.Sprite = undefined;

    @property(cc.Node)
    coinLabel: cc.Node = undefined;

    @property(cc.Label)
    adresslabel: cc.Label = undefined;

    @property(cc.Node)
    beishuLabel: cc.Node = undefined;

    @property(cc.Node)
    pochan: cc.Node = undefined;

    @property(cc.Node)
    paotai_xuanzhuan: cc.Node = undefined;

    @property(cc.Node)
    beishu0: cc.Node = undefined;
    @property(cc.Node)
    bslabel0: cc.Node = undefined;
    @property(cc.Node)
    pot: cc.Node = undefined;
    @property(cc.Node)
    aimCircle: cc.Node = undefined;

    @property(cc.Node)
    gunbg: cc.Node = undefined;

    @property(cc.Node)
    scaleGun: cc.Node = undefined;

    @property(cc.Node)
    roulette: cc.Node = undefined;

    public myHuanPaoBt: cc.Node;
    myGunLevel: number = 1;

    gunSpType: number = -1;  // 子弹精灵的类型
    isLock: number = 0;  // 锁定
    isAuto: number = 0;  // 自动
    gunPos: cc.Vec2 = cc.p(0, 0);  // 炮台位置
    lockFishId: number = 0;  // 锁定鱼的ID
    lockFishFormationId: number = -1;
    lockFish: BYFish = undefined;
    autoAngle: number = 0;
    linPotArr: cc.Node[] = [];


    bulletNode: cc.Node = undefined;
    fishNetNode: cc.Node = undefined;

    private rouletteName: cc.Node = undefined;

    private rouletteCoin: cc.Node = undefined;
    private rouletteBg: cc.Node = undefined;
    private gunBg1: cc.Node = undefined;  // 锁定时 炮台下 转动的bg
    private gunBg2: cc.Node = undefined;  // 锁定时 炮台下 转动的bg
    private originalGunSpPos: cc.Vec2 = undefined;

    public bulletCount: number = 0; // 在屏幕中的子弹数量
    init(game: Game) {
        super.init(game);
        if (util.isIphoneX() && this.seat < 2) {
            this.beishu0.y = -12;
            this.bslabel0.y = -6;
        }
        let p = this.gunsp.node.convertToWorldSpaceAR(cc.Vec2.ZERO)
        let p2 = this.node.parent.convertToNodeSpaceAR(p)
        this.gunPos = p2;
        createDotLine(this.pot, this.linPotArr);
        this.originalGunSpPos = this.gunsp.node.position;
        this.flame.node.active = false;
        this.gunbg.active = false;
        this.initRoulette();
    }

    initRoulette() {
        this.rouletteName = this.roulette.getChildByName("name");
        this.rouletteCoin = this.roulette.getChildByName("coin");
        this.rouletteBg = this.roulette.getChildByName("bg");
    }
    hideLockDotLine() {
        this.aimCircle.active = false;
        hideDotLine(this.linPotArr);
    }

    changeState() { }

    get isMe() {
        return this.seat === this.game.playerMgr.mySeat;
    }

    /**
     * 展示炮台的加减按钮 和 屏蔽按钮
     */
    showMyGunBt() {
        let jian = this.gun.getChildByName("jian");
        let jia = this.gun.getChildByName("jia");
        let button = this.gun.getChildByName("button");

        this.myHuanPaoBt = this.gun.getChildByName("huanpao");
        this.myHuanPaoBt.active = true;
        jian.active = true;
        jia.active = true;
        button.active = true;
    }

    public showRoulette(fishType: number, coin: string) {

        let name = BYFishRoute.fishName[fishType];
        if (this.roulette.active) {
            cc.director.getActionManager().removeAllActionsFromTarget(this.rouletteBg);
            cc.director.getActionManager().removeAllActionsFromTarget(this.rouletteCoin);
        }
        this.roulette.active = true;
        this.rouletteName.getComponent(cc.Label).string = name;
        let coinnum = +coin;
        this.rouletteCoin.getComponent(cc.Label).string = coinnum.toFixed(2).toString();
        this.rouletteCoin.rotation = 0;
        let callback = cc.callFunc(this.hideRoulette, this);
        let roAc = cc.sequence(cc.rotateBy(0.25, -20), cc.rotateBy(0.5, 40), cc.rotateBy(0.5, -40), cc.rotateBy(0.25, 20));
        this.rouletteCoin.runAction(roAc);
        this.rouletteBg.runAction(cc.sequence(cc.rotateBy(2, 1020), callback));
    }
    private hideRoulette() {
        this.roulette.active = false;
    }
    changeLocation(adress: string) {
        this.adresslabel.string = adress;
    }
    aimCircleRotate() {
        this.aimCircle.active = true;
        this.aimCircle.runAction(cc.rotateBy(8, 360).repeatForever());
        this.aimCircle.active = false;
    }
    changeGunSp(type: number) {

        if (this.gunSpType === type - 1) {
            return;
        }
        this.gunSpType = type - 1;
        let resnode: cc.Node = this.game.getGunRes(this.gunSpType);
        let gun = resnode.getChildByName("gun");
        let flame = resnode.getChildByName("flame");
        let bullet = resnode.getChildByName("bullet");
        this.bulletNode = bullet;
        let net = resnode.getChildByName("net");
        this.fishNetNode = net;
        let gunbg = resnode.getChildByName("gunbg");
        if (gunbg) {
            let gunbgres = cc.instantiate(gunbg);
            this.gunBg1 = gunbgres.getChildByName("bg1");
            this.gunBg2 = gunbgres.getChildByName("bg2");
            gunbgres.position = cc.p(0, 0);
            this.gunbg.addChild(gunbgres);
        } else {
            if (this.gunbg) {
                this.gunbg.removeAllChildren();
            }
            this.gunBg1 = undefined;
            this.gunBg2 = undefined;
        }
        this.gunsp.spriteFrame = gun.getComponent(cc.Sprite).spriteFrame;
        this.flame.spriteFrame = flame.getComponent(cc.Sprite).spriteFrame;
    }

    gunShake(point: cc.Vec2) {

        this.gunsp.node.stopAllActions();
        // cc.director.getActionManager().removeAllActionsFromTarget(this.gunsp.node);
        this.gunsp.node.setPosition(this.originalGunSpPos);
        this.gunsp.node.runAction(cc.sequence(cc.moveBy(0.1, cc.p(-point.x / 7, -point.y / 7)), cc.moveBy(0.15, cc.p(point.x / 7, point.y / 7))));
    }
    showFlame() {
        this.flame.node.active = true;
        cc.director.getActionManager().removeAllActionsFromTarget(this.flame.node);
        let callback = cc.callFunc((flame: cc.Node) => { flame.active = false; });
        this.flame.node.runAction(cc.sequence(cc.delayTime(0.05), callback));
    }

    changeGunRotation(pos: cc.Vec2) {
        let deg = getQuadrantDegree(this.gunPos, pos);
        let xrotation = 0;
        if (this.seat > 1) {
            xrotation = deg - 90;
        } else {
            xrotation = deg + 90;
        }
        this.gunsp.node.rotation = xrotation;
    }

    // 展示或隐藏本地位置的炮台
    showOrHideGun(toshow: boolean) {
        this.gun.active = toshow;
        this.lizi.active = toshow;
        this.emptySeat.active = !toshow;
    }
    // 展示自己炮台的 加减按钮
    chgGunGardeAinmation() {
        if (!this.isMe) {
            return;
        }
        this.paotai_xuanzhuan.active = true;
        this.paotai_xuanzhuan.getComponent(cc.Animation).play();
        this.scaleGun.runAction(cc.sequence(cc.scaleTo(0.15, 0.7), cc.scaleTo(0.2, 1)));
        this.game.byAudio.playChangeRatioSound();
    }

    showWaitJoin() {
        this.emptySeat.active = true;
        this.emptySeat.runAction(cc.sequence(cc.fadeOut(3), cc.fadeIn(2), cc.fadeOut(3), cc.fadeIn(2)));
        this.scheduleOnce(() => {
            this.emptySeat.active = false;
        }, 130);
    }

    leaveAni() {
        this.gun.active = false;
    }
    enterAni() {
        this.gun.active = true;
    }
    leaveHideOthers() {
        cc.log("leaveHideOthers");
        this.resettingGunInfo();
        this.emptySeat.active = true;
        this.lizi.active = false;
        this.emptySeat.opacity = 255;
        this.emptySeat.runAction(cc.sequence(cc.fadeOut(3), cc.fadeIn(2), cc.fadeOut(3), cc.fadeIn(2)));
        this.scheduleOnce(() => {
            this.emptySeat.active = false;
        }, 130);
    }
    // 加炮台等级按钮的回调
    onClickIncreaseGunLevel(event: cc.Event) {
        if (!this.isMe) {
            return;
        }

        let tmpLevel = this.myGunLevel + 1;
        if (tmpLevel > this.game.roomMaxRatio) {
            tmpLevel = 1;
        }
        this.game.msg.GameBYHandlerBulletLevel(tmpLevel);
        this.chgGunLevel(tmpLevel);

    }

    // 减炮台等级按钮的回调
    onClickReduceGunLevel(event: cc.Event, customData: number) {
        if (customData != this.game.playerMgr.mySeat) {
            return;
        }
        let tmpLevel = this.myGunLevel - 1;
        if (tmpLevel < 1) {
            tmpLevel = this.game.roomMaxRatio;
        }
        this.game.msg.GameBYHandlerBulletLevel(tmpLevel);
        this.chgGunLevel(tmpLevel);
    }

    changeLevelLable(grade: number) {
        if (!this.game || !this.game.baseScore) {
            return;
        }
        let showRatioString = util.mul(grade, this.game.baseScore);
        this.beishuLabel.getComponent(cc.Label).string = "" + showRatioString;
    }

    // 改变该gunid的炮台的倍数
    chgGunLevel(grade: number) {
        if (grade == undefined) {
            return;
        }
        this.changeLevelLable(grade);
        this.myGunLevel = grade;
        if (this.isMe) {
            this.chgGunGardeAinmation();
        }
    }

    // 改变game 中储存的 炮台类型
    changeBulletType(grade: number) {
        this.gunSpType = grade - 1;
        let isshow = true;
        if (this.isLock == 0) {
            isshow = false;
        }
        this.gunBgRotate(isshow);
    }

    public gunBgRotate(isshow: boolean) {

        if (isshow && this.gunBg1 && this.gunBg2) {
            this.gunbg.active = true;
            this.gunBg1.runAction(cc.rotateBy(2, 360).repeatForever());
            this.gunBg2.runAction(cc.rotateBy(2, -360).repeatForever());
        } else {
            if (this.gunBg1 && this.gunBg2) {
                this.gunBg1.stopAllActions();
                this.gunBg2.stopAllActions();
            }
            if (this.gunbg) {
                this.gunbg.active = false;
            }
        }
    }

    // 改变玩家的 jinbi信息
    changeCoinLabelById(coin: number) {
        this.money = coin;
        if (this.isMe) {
            User.instance.money = coin;
        }
        if (coin < this.game.baseScore && !this.pochan.active) {
            this.pochan.active = true;
        } else if (coin >= this.game.baseScore && this.pochan.active) {
            this.pochan.active = false;
        }
        this.coinLabel.getComponent(cc.Label).string = coin.toFixed(2);
        this.balance = coin;
        if (coin < 0) {
            this.coinLabel.getComponent(cc.Label).string = "0";
        }
    }

    incCoin(incCoin: string) {
        this.changeCoinLabelById(util.add(this.coinLabel.getComponent(cc.Label).string, incCoin).toNumber());
    }
    decCoin(decCoin: string) {
        let coinStr = this.coinLabel.getComponent(cc.Label).string;
        let coin = util.mul(decCoin, this.game.baseScore).toNumber();
        coin = util.sub(coinStr, coin).toNumber();
        this.changeCoinLabelById(coin);
    }

    resettingGunInfo() {

        this.isLock = 0;
        this.lockFishFormationId = -1;
        this.lockFishId = -1;
        this.lockFish = undefined;
        this.isAuto = 0;
        this.changeLevelLable(1);
        this.changeBulletType(1);
        this.aimCircle.active = false;
        this.hideLockDotLine();

    }
    update() {
        this.drawLockLine();
    }

    drawLockLine() {
        // 如果是锁定状态
        if (this.isLock === 1) {
            if (this.lockFish) {
                let fish = this.lockFish.node;
                if (!this.lockFish.liveInCurScene()) {
                    this.lockFish = undefined;
                    this.hideLockDotLine();
                    return;
                }
                let tmpPos = this.game.toWroldPos(fish.position, fish.parent.position);
                let x = tmpPos.x;
                let y = tmpPos.y;
                this.aimCircle.position = cc.p(x, y);
                this.aimCircle.active = true;
                drawDotLine(this.gunPos, cc.p(x, y), this.linPotArr);
            } else {
                let fishId = this.lockFishId;
                let massId = this.lockFishFormationId;
                let fish = this.game.fishMgr.getFishById(fishId, massId);
                if (fish == undefined) {
                    this.hideLockDotLine();
                } else {
                    this.lockFish = fish.getComponent(BYFish);
                }
            }
        } else {
            this.hideLockDotLine();
        }
    }

}
