import BYGame from "./byGame";
import BYFishMgr from "./byFishMgr";
import BYFish from "./byFish";
import BYFishRoute from "./byFishRoute";
import { massive } from "./massive";
import GameMsg from "../game-share/gameMsg";
import * as util from "../common/util";
import { resolveFireMsg, dealFireMsg, dealHitMsg } from "./byUtil"

interface Fishes {
    fishes: [
        {
            fishId: number,
            fishType: number,
            routeId: number,
            offsetId: number,
            aliveTime: number,
        }
    ]
}

interface hitInfo {

    fishId: number,
    gainMoney: string,
    rPos: number,
    massId?: number,
}


interface fishState {
    state: number,
    time: number,
}

interface fishFormationInfo {
    fishes: [
        {
            massiveId: number,
            massiveType: number,
        }
    ],
}


const { ccclass, property } = cc._decorator;

@ccclass

export default class BYMsg extends GameMsg {

    private _events: string[];
    protected game: BYGame;
    loadGameHandler = "";
    notifyCurrentGame = "byNotifyCurrentGameInfo";

    get events() {
        if (!this._events) {
            this._events = [];
        }
        return this._events;
    }

    init() {
        this.removeExtraListeners();
        super.init();
    }

    private listen(event: string, func: Function) {
        let p = window.pomelo;
        p.on(event, func.bind(this));
        this.events.push(event);
    }

    protected addExtraListeners(): void {
        cc.log("addExtraListeners");
        this.listen("byNotifyCurrentGameCreateFish", this.byNotifyCurrentGameCreateFish);
        this.listen("byNotifyCurrentGameUserHit", this.byNotifyCurrentGameUserHit);
        this.listen("byNotifyCurrentGameLock", this.byNotifyCurrentGameLock);
        this.listen("byNotifyCurrentGameAutoMatic", this.byNotifyCurrentGameAutoMatic);
        this.listen("byNotifyCurrentReturnMoney", this.byNotifyCurrentReturnMoney);
        this.listen("byNotifyCurrentBroadCastState", this.byNotifyCurrentBroadCastState);
        this.listen("byNotifyCurrentGameMassiveCreate", this.byNotifyCurrentGameMassiveCreate);
        this.listen("byNotifyCurrentGameDeathMassive", this.byNotifyCurrentGameDeathMassive);
        this.listen("byNotifyCurrentGameDeathFish", this.byNotifyCurrentGameDeathFish);
        this.listen("byNotifyCurrentGameUserCastSkillMsg", this.byNotifyCurrentGameUserCastSkillMsg);
        this.listen("byNotifyCurrentGameUserGetRemainPoints", this.byNotifyCurrentGameUserGetRemainPoints);
        // 炮台等级
        this.listen("byNotifyCurrentGameUserBulletRatio", this.byNotifyCurrentGameUserButtletLevel);

        this.listen("byNotifyCurrentGameUserFire", this.byNotifyCurrentGameUserFire);
        // 炮台样式
        this.listen("byNotifyCurrentGameUserChaButtleStyle", this.byNotifyCurrentGameUserChaButtleStyle);

        window.pomelo.once("disconnect", () => {
            if (this.game != undefined) {
                let me = this.game.playerMgr.me;
                if (me.isLock) {
                    this.game.closeLockFish();
                }
                if (me.isAuto) {
                    this.game.closeAutoShootBullet();
                }
                this.game.playerMgr.initPlayerIsAuto();
                this.game.playerMgr.initPlayerIsLock();
            }
        });
    }

    public removeExtraListeners(): void {
        this.events.forEach(e => {
            window.pomelo.off(e);
        });
    }


    protected handleCurrentGameInfo(data: any) {
        this.currentGameInfo(data);
        this.game.myMaxGunSp = data.maxBulletStyle;

        let gameInfos = data.gamerInfos;
        for (let i = 0; i < gameInfos.length; i++) {
            let info = gameInfos[i];
            let p = this.game.playerMgr.getPlayerByServerPos(info.rPos);
            p.init(this.game);
            if (!p.isMe) {
                p.changeGunSp(info.bulletStyle);
            }
            if (p) {
                p.changeLevelLable(info.ratio);
                p.changeCoinLabelById(parseFloat(info.remainPoints));
            }
        }

        let gunstyle = cc.sys.localStorage.getItem("gunStyle");

        if (gunstyle != null && gunstyle != undefined) {
            if (gunstyle <= data.maxBulletStyle) {
                this.game.playerMgr.me.changeGunSp(gunstyle);
                this.gameBYHandlerBulletStyle(gunstyle);
            } else {
                this.game.playerMgr.me.changeGunSp(1);
            }
        } else {
            this.game.playerMgr.me.changeGunSp(1);
        }
        this.game.amount = data.diffAmount
        this.game.fishMgr.initFishMass(data);
        this.game.canStart = true;
    }

    currentGameInfo(data: any) {
        if (data == undefined) {
            return;
        }
        for (let i = 0; i < data.gamerInfos.length; i++) {
            let userInfo = data.gamerInfos[i];
            let p = this.game.playerMgr.getPlayerByServerPos(userInfo.rPos);
            if (!p) {
                continue;
            }
            if (userInfo.ratio != undefined) {
                p.chgGunLevel(userInfo.ratio);
            }
            if (userInfo.bulletStyle != undefined) {
                p.changeGunSp(userInfo.bulletStyle);
            }
            if (userInfo.autoAngle != undefined) {
                p.isAuto = 1;
                p.autoAngle = userInfo.autoAngle;
            }
            if (userInfo.lockTarget) {
                p.isLock = 1;
                p.lockFishId = userInfo.lockTarget.fishId;
                if (userInfo.lockTarget.massId) {
                    p.lockFishFormationId = userInfo.lockTarget.massId;
                }
            }
            p.changeCoinLabelById(parseFloat(userInfo.remainPoints));
        }
        if (data.regularInfos == undefined) {
            return;
        }
        this.game.fishLayer.opacity = 0;
        for (let j = 0; j < data.regularInfos.length; j++) {
            let fish = data.regularInfos[j];
            let rootIdx = 0;
            for (let i = 0; i < BYFishRoute.anchor.length; i++) {
                if (BYFishRoute.anchor[i].id == fish.routeId) {
                    rootIdx = i;
                    break;
                }
            }
            let rootTime = BYFishRoute.anchor[rootIdx].curveTime;
            let aliveTime = fish.aliveTime / 1000 // 剩余存活
            let lineCount = BYFishRoute.anchor[rootIdx].points.length / 2
            let cj = lineCount * rootTime  // 路线总时间
            let liveTime = cj - aliveTime  // 已经存活
            if (aliveTime < 0) {
                aliveTime = 0;
                continue;
            }
            let startNum = liveTime / rootTime  // 已经走过了几段路线
            let intStartNum = Math.floor(startNum);
            let firstTime = 0;
            if (startNum > intStartNum + 0.5) {
                // 向上
                startNum = intStartNum + 1;
                firstTime = rootTime + aliveTime % rootTime;
            } else {
                startNum = intStartNum;
                firstTime = aliveTime % rootTime;
            }
            if (startNum >= 0) {
                this.game.fishMgr.createFish(fish.fishType, fish.routeId, fish.offsetId, fish.fishId, startNum, firstTime);
            }
        }
        this.game.fishLayer.runAction(cc.fadeIn(1.5));
    }




    private byNotifyCurrentGameUserGetRemainPoints(data: any) {
        for (let i = 0; i < data.gamerRemainPointsInfo.length; i++) {
            let remainPoint = data.gamerRemainPointsInfo[i];
            let p = this.game.playerMgr.getPlayerByServerPos(remainPoint.rPos);
            if (p) {
                p.changeCoinLabelById(parseFloat(remainPoint.remainPoints));
            }
        }
    }

    private byNotifyCurrentGameDeathMassive(data: any) {
        cc.log("byNotifyCurrentGameDeathMassive", data);
        for (let i = 0; i < data.deathMassive.length; i++) {
            let xfishFormationId = data.deathMassive[i];
            for (let j = 0; j < this.game.fishLayer.children.length; j++) {
                let fish = this.game.fishLayer.children[j];
                if (fish.active && !fish.getComponent(BYFish).isDieing && fish.getComponent(BYFish).fishFormationId == xfishFormationId) {
                    this.game.fishMgr.fishHide(fish);
                }
            }
        }
    }

    private byNotifyCurrentGameDeathFish(data: any) {
        let arr = data.deathFish;
        for (let i = 0; i < arr.length; i++) {
            let fishId = arr[i];
            let fish = this.game.fishMgr.getFishById(fishId);
            if (fish) {
                if (fish.getComponent(BYFish).typeId == 65) {
                    this.game.byAudio.playNormalBgMusic();
                }
                this.game.fishMgr.fishHide(fish);
            }
        }
    }

    private byNotifyCurrentGameUserFire(data: any) {

        let fireInfo = resolveFireMsg(data.fireMsg);
        let gameLocation = this.game.playerMgr.toGameLocation(fireInfo.rPos);
        let p = this.game.playerMgr.getPlayerByServerPos(fireInfo.rPos);

        if (p.isAuto == 1 || p.isLock == 1) {
            return;
        }
        this.game.bulletMgr.shoot(gameLocation, cc.p(0, 0), fireInfo.angle);

        if (p) {
            p.chgGunLevel(fireInfo.ratio);
        }

    }

    // 鱼不存在返回的接口
    private byNotifyCurrentReturnMoney(data: any) {

        if (data.rPos != undefined) {
            let p = this.game.playerMgr.getPlayerByServerPos(data.rPos);
            if (p) {
                p.incCoin(data.backMoney);
            }
        }
    }

    private byNotifyCurrentGameLock(data: any) {

        let p = this.game.playerMgr.getPlayerByServerPos(data.rPos);
        let seat = p.seat;
        p.isLock = data.on;
        if (data.on === 2) {
            return;
        }
        this.game.changeGunLockState(seat, data.on);

        if (data.on === 1 && data.fishId != undefined && data.massId != undefined) {
            this.game.changeLockFishId(seat, data.fishId, data.massId);
        } else if (data.on === 1 && data.fishId != undefined) {
            this.game.changeLockFishId(seat, data.fishId);
        }
    }

    private byNotifyCurrentGameAutoMatic(data: any) {
        let p = this.game.playerMgr.getPlayerByServerPos(data.rPos);
        p.isAuto = data.on;
        if (data.angle) {
            p.autoAngle = data.angle;
        } else {
            p.autoAngle = 0;
        }

    }

    private byNotifyCurrentGameUserHit(data: hitInfo) {
        if (data.massId) {
            this.game.fishMgr.fishDieByFishId(data.fishId, data.gainMoney, data.rPos, data.massId);
        } else {
            this.game.fishMgr.fishDieByFishId(data.fishId, data.gainMoney, data.rPos);
        }
    }

    private byNotifyCurrentGameCreateFish(data: Fishes) {
        if (this.game.playerMgr.isRotate == undefined) {
            return;
        }
        if (!this.game.canStart) {
            return;
        }
        for (let index = 0; index < data.fishes.length; index++) {
            let fish = data.fishes[index];
            this.game.fishMgr.createFish(fish.fishType, fish.routeId, fish.offsetId, fish.fishId);

        }
    }

    // 普通鱼 是1  鱼潮来前 是2    鱼潮 是 3
    private byNotifyCurrentBroadCastState(data: fishState) {
        cc.log("游戏状态 ：", data);

        if (data.state === 2) {
            this.game.fishMgr.normalFishLeaveByTime(data.time);
        } else if (data.state === 1) {
            this.game.byAnimMgr.hideBg2();
            if (this.game.fishMgr.fishLayerAction) {
                this.game.fishMgr.fishFormationEnd();
            }
        }

    }

    private byNotifyCurrentGameMassiveCreate(data: fishFormationInfo) {
        cc.log("byNotifyCurrentGameMassiveCreate ：", data);
        let xfishFormation = data.fishes[0];

        let index1 = 0;
        for (let n = 0; n < massive.length; n++) {
            let xiaoMassive = massive[n];
            if (xiaoMassive.type == xfishFormation.massiveType) {
                index1 = n;
                break;
            }
        }
        let fishMass = massive[index1];
        cc.log("fishMass.group", fishMass.group);
        if (fishMass.group == 1) {
            // 普通鱼阵
            this.game.fishMgr.createFishFormation(xfishFormation.massiveType, xfishFormation.massiveId, index1);
        } else if (fishMass.group == 2) {
            // 五条路线
            let fishArr = fishMass.routeIntervalFishes;
            for (let i = 0; i < fishArr.length; i++) {
                let arr = fishArr[i];
                this.game.fishMgr.createOneRootFormation(arr.routeId, arr.intervalTime, arr.intervalCount, arr.fishType, xfishFormation.massiveId);
            }
        } else if (fishMass.group == 3 || fishMass.group == 4) {
            // 圆 贝塞尔
            let yuanType = 1;
            if (fishMass.group == 4) {
                yuanType = 2;
                this.game.fishMgr.bezierFormationId = 1;
            } else {
                this.game.fishMgr.cirFormationId = 1;
            }

            let fishArr = fishMass.midIntervalFishes;
            let arr = fishArr.fishTypes;
            let rand = 0;
            let fishId = 1;
            this.game.fishMgr.schedule(() => {
                let tyep = arr[rand];
                this.game.fishMgr.createCircleFishFormation2(tyep, yuanType, xfishFormation.massiveId, fishId);
                rand++;
                if (yuanType == 1) {
                    fishId = fishId + 18
                } else if (yuanType == 2) {
                    fishId = fishId + 5
                }
                if (rand > arr.length) {
                    rand = 0;
                }
            }, fishArr.intervalTime, arr.length - 1);


        }
    }


    // 技能鱼
    private byNotifyCurrentGameUserCastSkillMsg(data: any) {

        let type = data.skillType;
        if (type == 1) {
            // 闪电
            this.game.byAnimMgr.playBoltAnimation(data.castFishIds, data.rPos, data.gainMoney);
        } else if (type == 2) {
            // 爆炸
            this.game.byAnimMgr.playBoomFish(data.castFishIds, data.rPos, data.gainMoney);
        } else if (type == 3) {
            // 冰冻
            this.game.byAnimMgr.playFrozenAnimation(data.frozenTime);
        } else if (type == 4) {
            // 美人鱼
            this.game.byAnimMgr.playMermaidAnimation(data.gainMoney, data.rPos);
        }
    }


    // 炮台等级
    private byNotifyCurrentGameUserButtletLevel(data: any) {
        let p = this.game.playerMgr.getPlayerByServerPos(data.rPos);
        if (!p || p.isMe) {
            return;
        }
        p.chgGunLevel(data.ratio);
    }

    private byNotifyCurrentGameUserChaButtleStyle(data: any) {
        let p = this.game.playerMgr.getPlayerByServerPos(data.rPos);
        if (p) {
            p.changeGunSp(data.bulletStyle);
        }
    }

    public gameBYHandlerAutoMatic(xon: number, xangle?: number) {

        if (xangle) {
            window.pomelo.notify("game.BYHandler.automatic", { on: xon, angle: xangle });
        } else {
            window.pomelo.notify("game.BYHandler.automatic", { on: xon });
        }

        this.game.playerMgr.me.isAuto = xon;
        if (xon === 0) {
            this.game.playerMgr.me.autoAngle = 0;
        }
    }

    public gameBYHandlerLock(xon: number, xfishId?: number, xmassId?: number) {


        let me = this.game.playerMgr.me;
        if (!me) {
            cc.log("---gameBYHandlerLock--没有我--");
            return;
        }
        me.isLock = xon;
        if (xmassId && xfishId && xmassId != -1 && xmassId != undefined) {
            me.lockFishId = xfishId;
            me.lockFishFormationId = xmassId;
            window.pomelo.notify("game.BYHandler.lock", { on: xon, fishId: xfishId, massId: xmassId });
        } else if (xfishId) {
            me.lockFishId = xfishId;
            me.lockFishFormationId = -1;
            window.pomelo.notify("game.BYHandler.lock", { on: xon, fishId: xfishId });
        } else {
            window.pomelo.notify("game.BYHandler.lock", { on: xon });
        }

        if (xon === 0) {
            me.lockFishId = -1;
            me.lockFishFormationId = -1;
            this.game.playerMgr.me.lockFish = undefined;
        }

    }
    public gameBYHandlerFire(xangle: number, xGrade: number, xBulletId: number) {
        let data = dealFireMsg(xangle, xGrade, xBulletId);
        window.pomelo.notify("game.BYHandler.fire", { fireInfo: data });
    }

    public gameBYHandlerHit(xfishId: number, xBulletId: number, xmassId?: number) {
        if (!xmassId) {
            xmassId = 0;
        }
        let data = dealHitMsg(xmassId, xfishId, xBulletId);
        window.pomelo.notify("game.BYHandler.hit", { hitInfo: data });
    }

    // 炮台等级
    public GameBYHandlerBulletLevel(xbulletLevel: number) {
        window.pomelo.notify("game.BYHandler.bulletRatio", { ratio: xbulletLevel });
    }


    public gameBYHandlerBulletStyle(xstyleGarde: string) {
        let xbulletStyle = parseInt(xstyleGarde);
        cc.sys.localStorage.setItem("gunStyle", xstyleGarde);
        window.pomelo.notify("game.BYHandler.bulletStyle", { bulletStyle: xbulletStyle });
    }


    public gameBYHandlerrobotFishInfo(data: any) {
        if (data == undefined || data == []) {
            window.pomelo.notify("game.BYHandler.robotFishInfo", { fishInfo: [{ fishId: 0, massId: 0 }] });
            return;
        }
        let arr = [];
        for (let i = 0; i < data.length; i++) {
            let item: any = {}
            let fishItem = data[i].getComponent(BYFish)
            item.fishId = fishItem.fishId;
            item.massId = fishItem.fishFormationId;
            if (fishItem.fishFormationId == -1) {
                item = {
                    fishId: fishItem.fishId,
                }
            }
            arr.push(item);
        }
        window.pomelo.notify("game.BYHandler.lockTargetFishInfo", { fishInfo: arr });
    }
}