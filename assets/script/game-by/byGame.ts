import BYBullet from "./byBullet";
import BYFish from "./byFish";
import BYFishMgr from "./byFishMgr";
import BYFishnetMgr from "./byFishnetMgr";
import BYBulletMgr from "./byBulletMgr";
import BYMsg from "./byMsg";
import BYPlayerMgr from "./byPlayerMgr";
import * as util from "../common/util";
import BYAnimMgr from "./byAnimMgr";
import BYAudio from "./byAudio";
import g from "../g";
import Game from "../game-share/game";
import BYIdleCheck from "./byIdleCheck"
import { GameId } from "../game-share/game";
import { QUITSHOW } from "../g";
import BYGunHandbook from "./byGunHandbook"
import BYFishHandbook from "./byFishHandbook"
import GameHelp from "../game-share/gameHelp"
import PopActionBox from "../lobby/popActionBox"

import { getQuadrantDegree, hideDotLine, createDotLine, drawDotLine } from "./byUtil"
const { ccclass, property } = cc._decorator;

@ccclass
export default class BYGame extends Game {
    @property(cc.Node)
    nodeBg: cc.Node = undefined;

    @property(cc.Node)
    bulletLayer: cc.Node = undefined;

    @property(cc.Node)
    gunLayer: cc.Node = undefined;
    @property(cc.Node)
    dieLayer: cc.Node = undefined;
    @property(cc.Node)
    fishLayer: cc.Node = undefined;
    @property(cc.Node)
    fishnetLayer: cc.Node = undefined;
    @property(cc.Node)
    effectsLayer: cc.Node = undefined;
    @property(cc.Node)
    uiLayer: cc.Node = undefined;

    @property(cc.Node)
    HLAutoIcon: cc.Node = undefined;  // 高亮的自动图标
    @property(cc.Node)
    HLLockIcon: cc.Node = undefined;

    @property(cc.Node)
    pot: cc.Node = undefined;

    @property(cc.Node)
    animationAim: cc.Node = undefined;

    @property(cc.Node)
    lockNotice: cc.Node = undefined;

    @property(cc.Node)
    enumLayer: cc.Node = undefined;

    @property(cc.Prefab)
    setting: cc.Prefab = undefined;

    @property(cc.Prefab)
    preFishHandbook: cc.Prefab = undefined;

    @property(cc.Prefab)
    preGunHandbook: cc.Prefab = undefined;

    @property(cc.Prefab)
    preHelp: cc.Prefab = undefined;

    @property(cc.SpriteFrame)
    usingBg: cc.SpriteFrame = undefined;

    @property([cc.Prefab])
    resArr: cc.Prefab[] = [];

    @property(cc.Node)
    nodeSeabed: cc.Node = undefined;
    //海底背景图
    @property([cc.SpriteFrame])
    seabeds: cc.SpriteFrame[] = []

    public gunCfg: { coin: string, level: number }[] = undefined;
    public amount: string;
    public halfSW: number
    public halfSH: number
    public static STEP_TIME = 1 / 6

    public myMaxGunSp: number = undefined;
    public fishMgr: BYFishMgr = undefined;
    public fishnetMgr: BYFishnetMgr = undefined;
    public bulletMgr: BYBulletMgr = undefined;
    public curTouchPos: cc.Vec2 = undefined;
    public canStart: boolean = false; // 是否可以开始发子弹 （处理gameinfo）
    public roomMaxRatio: number = 1;
    public msg: BYMsg = undefined;
    playerMgr: BYPlayerMgr = undefined;
    public byAnimMgr: BYAnimMgr = undefined;
    public byAudio: BYAudio = undefined;
    public clickFirstLockFish = false; // 自己是否 已经点击了 第一个锁定的鱼
    public sendLockFishs: cc.Node[] = [];
    public id: string = undefined;
    public moenyNotLayerIsShow: boolean = false;

    private byIdleCheck: BYIdleCheck = undefined;

    public tipCanShow: boolean = true;  // 子弹上限的提示 是可以显示
    private byFishHandbook: BYFishHandbook = undefined;
    public byGunHandbook: BYGunHandbook = undefined;
    private gameHelp: GameHelp = undefined
    public endGame: boolean = false;

    private gunResNodeArr: cc.Node[] = [undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined];

    gameName = GameId.BY;
    setGameEnd() { }
    setRoomInfo() { }
    setStarted() { }
    refreshRoomInfo() { }
    hideTicker() { }
    setWaitPrepare() { }
    setWaitStart() { }
    showTicker() { }
    updateUI() { }
    initRound() {
        if (this.playerMgr.seatOffset > 1) {
            this.playerMgr.isRotate = true;
        }
    }
    onLoad() {
        super.onLoad();
        this.halfSW = this.nodeCanvas.width / 2
        this.halfSH = this.nodeCanvas.height / 2
    }
    start() {
        this.nodeSeabed.getComponent(cc.Sprite).spriteFrame = this.seabeds[+this.id - 1];
    }

    dealRoomData(data: any): void {
        if (data.code === 200) {
            let users = data.users;
            if (data.rPos > 1) {
                this.playerMgr.isRotate = true;
            }
            this.playerMgr.handleMyInfo(data.rPos);
            this.playerMgr.handleUserInfo(users);
            this.byIdleCheck.kickTime = data.startKickTime / 1000;
            if (data.config) {
                let configx = JSON.parse(data.config);
                this.gunCfg = configx.bulletStyleDefs
                this.roomMaxRatio = configx.ratio;
            }
            window.pomelo.request("game.BYHandler.loadGameInfo", {}, (data: any) => { });
        } else {
            cc.log("加载房间信息失败");
        }
    }

    initGame() {
        cc.director.getCollisionManager().enabled = true;
        this.msg = new BYMsg(this);
        this.msg.init();
        this.fishMgr = this.fishLayer.getComponent(BYFishMgr);
        this.fishnetMgr = this.fishnetLayer.getComponent(BYFishnetMgr);
        this.bulletMgr = this.bulletLayer.getComponent(BYBulletMgr);
        this.byAudio = this.node.getChildByName("audio").getComponent(BYAudio);
        this.playerMgr = new BYPlayerMgr(this);
        this.byAnimMgr = this.effectsLayer.getComponent(BYAnimMgr);
        this.byAnimMgr.initGame(this);
        this.byIdleCheck = this.node.getComponent(BYIdleCheck);

        this.sendLockFishs = [];
        this.schedule(this.startCheck, BYGame.STEP_TIME);
        // this.schedule(this.starCheckLock, BYGame.STEP_TIME);
        this.schedule(this.checkLockFishs, 1);

        this.byAudio.playNormalBgMusic();
        this.playerMgr.playerAimCircleRotate();
    }

    // 初始化 子弹方向
    initMyTouchPos() {
        this.curTouchPos = this.touch2GamePos(cc.p(this.playerMgr.me.gunPos.x + this.halfSW, this.halfSH));
    }

    /**
     * 开始检测锁定和自动
     */
    public startCheck() {
        for (let i = 0; i < this.playerMgr.playerCount; i++) {
            let p = this.playerMgr.getPlayerBySeat(i);
            if (!p) continue;
            if (p.isAuto == 1 && (p.isLock != 1 || (p.isLock == 1 && p.lockFish == undefined))) {
                if (p.isMe) {
                    this.autoShootCallback();
                } else {
                    this.bulletMgr.shoot(i, cc.p(0, 0), p.autoAngle);
                }
            }
            if (p.isLock == 1) {
                if (p.isMe) {
                    this.lockFishCallback();
                } else {
                    let lockFish = p.lockFish;
                    if (lockFish == undefined || !lockFish.liveInCurScene()) {
                        continue;
                    }
                    this.bulletMgr.changeBulletMove(p.seat);
                    this.bulletMgr.shoot(p.seat, p.aimCircle.position, 0);
                }
            }
        }
    }

    // public starCheckLock() {
    //     for (let i = 0; i < this.playerMgr.playerCount; i++) {
    //         let p = this.playerMgr.getPlayerBySeat(i);
    //         if (!p) {
    //             continue;
    //         }
    //         if (p.isLock == 1 && p.seat != this.playerMgr.mySeat) {
    //             let lockFish = p.lockFish;
    //             if (lockFish == undefined || !lockFish.liveInCurScene()) {
    //                 continue;
    //             }
    //             this.bulletMgr.changeBulletMove(p.seat);
    //             this.bulletMgr.shoot(p.seat, p.aimCircle.position, 0);
    //         }
    //     }
    // }

    public FoundLockFishs() {
        let fishArr = [];
        // 在普通鱼种找 有没有符合要求的
        for (let i = 0; i < this.fishLayer.children.length; i++) {
            let fishNode = this.fishLayer.children[i];
            let fish = fishNode.getComponent(BYFish);

            if (fish.liveInCurScene()) {
                fishArr.push(fishNode);
            }
        }
        if (fishArr != undefined && fishArr != []) {
            fishArr.sort((a, b) => {
                if (b.getComponent(BYFish).typeId == BYFishMgr.bossFishType) {
                    return 100;
                } else if (a.getComponent(BYFish).typeId == BYFishMgr.bossFishType) {
                    return -100;
                } else {
                    return b.getComponent(BYFish).typeId - a.getComponent(BYFish).typeId;
                }
            });

            for (let i = 0; i < fishArr.length; i++) {
                if (this.sendLockFishs == undefined || this.sendLockFishs == [] || this.sendLockFishs.length < 3) {
                    if (this.sendLockFishs == undefined) {
                        this.sendLockFishs = [];
                        this.sendLockFishs.push(fishArr[i]);
                        continue;
                    }
                    let haved = false;
                    for (let j = 0; j < this.sendLockFishs.length; j++) {
                        if (this.sendLockFishs[j] == fishArr[i]) {
                            haved = true;
                        }
                    }
                    if (!haved) {
                        this.sendLockFishs.push(fishArr[i]);
                    }
                }
            }
        }
        if (this.msg && this.sendLockFishs) {
            this.msg.gameBYHandlerrobotFishInfo(this.sendLockFishs);
        }
    }


    public checkLockFishs() {
        let haveChange = false;
        if (this.sendLockFishs != undefined) {
            for (let i = 0; i < this.sendLockFishs.length; i++) {
                let fishNode = this.sendLockFishs[i];
                if (!fishNode.isValid) {
                    haveChange = true;
                    this.sendLockFishs.splice(i, 1);
                    i--;
                    continue;
                }
                let fish = fishNode.getComponent(BYFish);
                let isCan = fish.liveInCurScene();
                if (!isCan) {
                    haveChange = true;
                    this.sendLockFishs.splice(i, 1);
                    i--;
                }
            }
        }
        if (haveChange || this.sendLockFishs == undefined || this.sendLockFishs == [] || this.sendLockFishs.length === 0) {
            this.FoundLockFishs();
        }
    }



    // 锁定按钮
    private OnClickLockShootBullet() {
        this.byAudio.playButtonClickSound();
        this.hideChangeGunBtn();
        if (this.playerMgr.me.isLock) {
            this.closeLockFish();
        } else {
            this.openLockFish();
        }
    }

    public openClickFirstLockFish() {
        this.animationAim.position = cc.p(0, 0);
        this.animationAim.scale = 15;
        this.animationAim.opacity = 255;
        this.animationAim.active = true;
        let lockfish1 = this.playerMgr.me.lockFish.node;
        let tmpPos = this.toWroldPos(lockfish1.position, lockfish1.parent.position);
        let action = cc.spawn(
            cc.moveTo(0.3, tmpPos),
            cc.scaleTo(0.3, 1),
            cc.rotateBy(0.3, 10),
        );
        let callBack = cc.callFunc(this.animationAimHide, this);
        this.animationAim.runAction(cc.sequence(action, cc.fadeOut(0.05), callBack));
        this.clickFirstLockFish = true;
    }

    public animationAimHide() {
        this.animationAim.position = cc.p(-2000, 0);
    }

    // 打开锁定
    public openLockFish() {
        this.HLLockIcon.active = true;
        let me = this.playerMgr.me;
        if (me) {
            me.gunBgRotate(true);
        }
        me.isLock = 2;
        this.fishMgr.ShowOrHideFishButton(true);
        // this.schedule(this.LockShootCallback, BYGame.STEP_TIME);

        if (!this.lockNotice.active) {
            this.lockNotice.opacity = 0;
            this.lockNotice.active = true;
            let endFunc = cc.callFunc(() => { this.lockNotice.active = false });
            this.lockNotice.runAction(cc.sequence(cc.fadeIn(1), cc.delayTime(4), cc.fadeOut(1), endFunc));
        }

    }

    // 关闭锁定
    public closeLockFish() {
        let me = this.playerMgr.me;
        if (me) {
            me.gunBgRotate(false);
        }
        let mySeat = this.playerMgr.mySeat
        this.closeLock(mySeat);
        this.HLLockIcon.active = false;   // 关闭 按钮高亮的显示
        this.clickFirstLockFish = false;
        this.fishMgr.ShowOrHideFishButton(false);  // 鱼上面的点击事件隐藏
        // this.unschedule(this.LockShootCallback);
        this.msg.gameBYHandlerLock(0);  //通知服务器关闭LOCK状态
    }

    // public LockShootCallback() {
    //     this.lockFish();
    // }

    public toWroldPos(sonPos: cc.Vec2, parentPos: cc.Vec2) {
        if (this.playerMgr.isRotate) {
            sonPos.x = - sonPos.x;
            sonPos.y = - sonPos.y;
        }
        return cc.p(sonPos.x + parentPos.x, sonPos.y + parentPos.y);
    }

    private lockFishCallback() {
        if (!this.clickFirstLockFish) {
            return;
        }
        let me = this.playerMgr.me;
        if (me.lockFish && me.lockFish.liveInCurScene()) {
            let tmpPos = this.toWroldPos(me.lockFish.node.position, me.lockFish.node.parent.position);
            this.curTouchPos = tmpPos;
            this.bulletMgr.changeBulletMove(this.playerMgr.mySeat);
            this.bulletMgr.shoot(this.playerMgr.mySeat, tmpPos);
        } else {
            if (me.isLock === 1) {
                me.lockFish = undefined;
                me.isLock = 2;
                if (me.isAuto) {
                    let deg = getQuadrantDegree(me.gunPos, this.curTouchPos);
                    this.msg.gameBYHandlerAutoMatic(1, deg);
                }
                this.msg.gameBYHandlerLock(2);
            }
        }
    }

    // 自动按钮
    public OnClickAutoShootBullet() {
        this.hideChangeGunBtn();
        this.byAudio.playButtonClickSound();

        if (this.playerMgr.me.isAuto) {
            this.closeAutoShootBullet();
        } else {
            this.openAutoShootBullet();
        }
    }

    public openAutoShootBullet() {
        this.playerMgr.me.isAuto = 1;
        let deg = getQuadrantDegree(this.playerMgr.me.gunPos, this.curTouchPos);
        this.msg.gameBYHandlerAutoMatic(1, deg);
        this.HLAutoIcon.active = true;
        // this.schedule(this.autoShootCallback, BYGame.STEP_TIME);
    }
    public closeAutoShootBullet() {
        this.playerMgr.me.isAuto = 0;
        this.msg.gameBYHandlerAutoMatic(0);
        this.HLAutoIcon.active = false;
        // this.unschedule(this.autoShootCallback);
    }

    public autoShootCallback() {
        if (this.playerMgr.me.isLock != 1) {
            this.bulletMgr.shoot(this.playerMgr.mySeat, this.curTouchPos);
        }
    }
    // 自己发子弹 并改变炮台的转向
    public shootBullet() {
        var touchPos = this.curTouchPos;
        this.bulletMgr.shoot(this.playerMgr.mySeat, touchPos);
    }

    public changeAutoDegAndPost() {
        let deg = getQuadrantDegree(this.playerMgr.me.gunPos, this.curTouchPos);
        this.msg.gameBYHandlerAutoMatic(1, deg);
    }

    public showButtleCountMoreTip() {
        if (!this.tipCanShow) {
            return;
        }

        this.tipCanShow = false;
        util.showTip("亲，屏幕中炮弹太多啦，节约点子弹呗～");

        this.scheduleOnce(() => {
            this.tipCanShow = true;
        }, 1);
    }

    public closeLock(location: number) {
        let p = this.playerMgr.getPlayerBySeat(location);
        p.isLock = 0;
        p.lockFishId = -1;
        p.lockFishFormationId = -1;
        p.lockFish = undefined;
        p.aimCircle.active = false;
        p.hideLockDotLine();
    }

    touch2GamePos(v: cc.Vec2) {
        return new cc.Vec2(v.x - this.halfSW, v.y - this.halfSH);
    }

    // 接收到服务器消息后  改变本地 GUN的 锁定状态
    public changeGunLockState(seat: number, isLock: number) {
        let p = this.playerMgr.getPlayerBySeat(seat);
        if (!p) {
            return;
        }
        p.isLock = isLock;
        if (isLock === 0) {
            this.closeLock(seat);
            p.gunBgRotate(false);
        } else {
            p.gunBgRotate(true);
        }
    }

    // 接收到服务器消息后  改变本地炮台 锁定的鱼的ID
    public changeLockFishId(seat: number, fishId: number, fishFormationId: number = -1) {
        let p = this.playerMgr.getPlayerBySeat(seat);
        if (!p) {
            return;
        }
        p.lockFishId = fishId;
        p.lockFishFormationId = fishFormationId;
        this.doBulletFollowFish(seat, fishId, fishFormationId);
    }

    // 让子弹向锁定的鱼移动
    public doBulletFollowFish(seat: number, fishId: number, fishFomationId?: number) {
        let p = this.playerMgr.getPlayerBySeat(seat);
        let currentFish = this.fishMgr.getFishById(fishId, fishFomationId);
        if (!currentFish) {
            p.lockFish = undefined;
            cc.log("doBulletFollowFish  currentFish  undefined");
            return;
        }
        p.lockFish = currentFish.getComponent(BYFish);

        this.bulletMgr.changeBulletMove(seat);
    }

    public moenyNotEnough() {
        if (this.moenyNotLayerIsShow) {
            return;
        }
        this.moenyNotLayerIsShow = true;

        let c = util.showConfirm("亲，您的金币不足了噢，现在就去补充一点吗？", "去充值", "去银行");
        c.showClose();

        c.okFunc = () => {
            this.moenyNotLayerIsShow = false;
            this.byAudio.playButtonClickSound();

            g.lastGame = "";

            this.endGame = true;
            g.curQiutShow = QUITSHOW.SHOWRECHARGE;
            window.pomelo.request("lobby.lobbyHandler.leaveGame", undefined, () => { });
        };

        c.cancelFunc = () => {
            this.moenyNotLayerIsShow = false;
            this.byAudio.playButtonClickSound();

            g.lastGame = "";

            this.endGame = true;
            g.curQiutShow = QUITSHOW.SHOWBANK;
            window.pomelo.request("lobby.lobbyHandler.leaveGame", undefined, () => { });
        };

        c.closeFunc = () => {
            this.moenyNotLayerIsShow = false;
        };

    }

    public backBtClick() {

        this.byAudio.playButtonClickSound();
        let confirmnode = util.showConfirm("亲，确定不再多玩一会儿了吗？", "确定", "取消");
        confirmnode.okFunc = () => {
            this.backMainGame();

        };
    }

    public backMainGame() {

        this.endGame = true;
        window.pomelo.request("lobby.lobbyHandler.leaveGame", undefined, () => { });
    }

    public enmuLayerhide(elayer: cc.Node) {
        elayer.active = false;
    }

    public enmuBtclick() {
        this.hideChangeGunBtn();
        this.byAudio.playButtonClickSound();
        cc.director.getActionManager().removeAllActionsFromTarget(this.enumLayer);

        if (this.enumLayer.active) {
            let callBack1 = cc.callFunc(this.enmuLayerhide, this.enumLayer);
            this.enumLayer.runAction(cc.sequence(cc.fadeOut(0.2), callBack1));
        } else {
            this.enumLayer.opacity = 0;
            this.enumLayer.active = true;
            this.enumLayer.runAction(cc.fadeIn(0.2));
        }
    }

    public withdrawBtClick() {
        this.byAudio.playButtonClickSound();
        let confirmnode = util.showConfirm("亲，充值需要离开渔场才能进行噢，现在就要离开吗？", "确定", "取消");
        confirmnode.okFunc = () => {
            g.lastGame = "";
            g.curQiutShow = QUITSHOW.SHOWRECHARGE;
            this.backMainGame();
        };
    }

    public exchangeBtClick() {

        this.byAudio.playButtonClickSound();
        let confirmnode = util.showConfirm("亲，兑换需要离开渔场才能进行噢，现在就要离开吗？", "确定", "取消");
        confirmnode.okFunc = () => {
            g.lastGame = "";
            g.curQiutShow = QUITSHOW.SHOWBANK;
            this.backMainGame();
        };
    }



    public onClickChgGun() {
        this.byAudio.playButtonClickSound();
        if (!this.byGunHandbook) {
            let ui = util.instantiate(this.preGunHandbook);
            this.byGunHandbook = ui.getComponent(PopActionBox);
            this.byGunHandbook.autoDestroy = false
            this.uiLayer.addChild(ui);
        } else {
            this.byGunHandbook.openAnim();
        }
    }
    public onClickFishHandbook() {
        this.byAudio.playButtonClickSound();
        if (!this.byFishHandbook) {
            let ui = util.instantiate(this.preFishHandbook);
            this.byFishHandbook = ui.getComponent(PopActionBox);
            this.byFishHandbook.autoDestroy = false
            this.uiLayer.addChild(ui);
        } else {
            this.byFishHandbook.openAnim();
        }
    }
    public onClickHelp() {
        if (!this.gameHelp) {
            let ui = util.instantiate(this.preHelp);
            this.gameHelp = ui.getComponent(GameHelp);
            this.gameHelp.autoDestroy = false
            this.uiLayer.addChild(ui);
            this.gameHelp.openAnim(() => {
                this.gameHelp.showContent(this.helpDesc);
            })
        } else {
            this.gameHelp.openAnim(() => {
                this.gameHelp.showContent(this.helpDesc);
            })
        }
    }



    public setBtClick() {
        this.byAudio.playButtonClickSound();
        let node = util.instantiate(this.setting);
        node.getChildByName("panel").getChildByName("mid").getChildByName("relogin").active = false;
        this.uiLayer.addChild(node);
        node.active = true;
        node.setPosition(0, 0);
    }
    // 点击炮台后  弹出或隐藏 还炮按钮
    public showHuanPaoBt() {
        this.byAudio.playButtonClickSound();
        let bt = this.playerMgr.me.myHuanPaoBt;
        cc.director.getActionManager().removeAllActionsFromTarget(bt);
        if (bt.active) {

            let callBack1 = cc.callFunc(this.enmuLayerhide, bt);
            bt.runAction(cc.sequence(cc.fadeOut(0.2), callBack1));

        } else {
            bt.opacity = 0;
            bt.active = true;
            bt.runAction(cc.fadeIn(0.2));
        }
    }
    public hideChangeGunBtn() {
        let bt = this.playerMgr.me.myHuanPaoBt;
        if (bt) {
            if (!bt.active) {
                return;
            }
            // bt.active = false;
            this.byAudio.playButtonClickSound();
            cc.director.getActionManager().removeAllActionsFromTarget(bt);
            let callBack1 = cc.callFunc(this.enmuLayerhide, bt);
            bt.runAction(cc.sequence(cc.fadeOut(0.2), callBack1));
        }
    }




    public bgShake() {
        cc.director.getActionManager().removeAllActionsFromTarget(this.nodeBg)
        cc.director.getActionManager().removeAllActionsFromTarget(this.uiLayer)
        cc.director.getActionManager().removeAllActionsFromTarget(this.gunLayer)
        this.nodeBg.position = cc.p(0, 0)
        this.uiLayer.position = cc.p(0, 0)
        this.gunLayer.position = cc.p(0, 0)
        let t = 0.04
        let t2 = 0.08
        let action = cc.sequence(
            cc.moveBy(t, cc.p(10, 10)), cc.moveBy(t2, cc.p(-20, -20)),
            cc.moveBy(t, cc.p(10, 10)), cc.moveBy(t, cc.p(0, 10)),
            cc.moveBy(t2, cc.p(0, -20)), cc.moveBy(t, cc.p(0, 10)), cc.moveTo(0, cc.p(0, 0)));
        this.nodeBg.runAction(action)
        this.uiLayer.runAction(action.clone())
        this.gunLayer.runAction(action.clone())
    }

    getGunRes(type: number) {
        let resprefab = this.resArr[type];
        if (this.gunResNodeArr[type] != undefined) {
            return this.gunResNodeArr[type];
        }
        let node = cc.instantiate(resprefab);
        this.gunResNodeArr[type] = node;
        return node;
    }

    onDestroy() {
        cc.director.getScheduler().unscheduleAllForTarget(this);
        cc.director.getActionManager().removeAllActionsFromTarget(this.node);
        this.msg.removeExtraListeners();
        this.msg = null;
    }

    //-------------------------------------------------------------------


}
