import Game, { GameId } from "../game-share/game";
import Parabola from "../game-share/parabola";
import QHBPlayerMgr, { PlayerInfo } from "./qhbPlayerMgr";
import QHBMsg, { GameStatus, redBagInfo, resultPlayerInfo } from "./qhbMsg";
import QHBAudio from "./qhbAudio";
import QHBOther from "./qhbOther";
import QHBPack from "./qhbPack";
import QHBPlayer from "./qhbPlayer";
import { getAvatar, parseLocation, showTip, add, sub, instantiate, showConfirm } from "../common/util";
import { Gender } from "../common/user";
import QHBRedBag from "./qhbRedBag";
import QHBRecord from "./qhbRecord";

interface sendRecord {
    rbMoney: string,
    boomedPly: number,
}

interface grabRecord {
    money: string,
    boom: number,
    grabMoney: string,
    isBoom: number,
}

const {ccclass, property} = cc._decorator;

@ccclass
export default class QHBGame extends Game {
    @property(cc.Node)
    ndLeftPlayerList: cc.Node = undefined;

    @property(cc.Node)
    ndRightPlayerList: cc.Node = undefined;

    @property(cc.Node)
    ndClockTimer: cc.Node = undefined;

    @property(cc.Node)
    ndRedBagParent: cc.Node = undefined;

    @property(cc.Node)
    ndBoomLayer: cc.Node = undefined;

    @property(cc.Node)
    ndAutoSendBtn: cc.Node = undefined;

    @property(cc.Node)
    ndAutoGrabBtn: cc.Node = undefined;

    @property(cc.Node)
    ndNormalWinAni: cc.Node = undefined;

    @property(cc.Prefab)
    preRedBag: cc.Prefab = undefined;

    @property(cc.Prefab)
    preGrabPlayer: cc.Prefab = undefined;

    @property(cc.Prefab)
    preMyBoomAni: cc.Prefab = undefined;

    @property(cc.Prefab)
    preOtherBoomAni: cc.Prefab = undefined;

    @property(QHBOther)
    qhbOther: QHBOther = undefined;

    @property(QHBPack)
    qhbPack: QHBPack = undefined;

    @property(QHBRecord)
    qhbRecord: QHBRecord = undefined;

    @property([QHBRedBag])
    qhbRedBagList: QHBRedBag[] = [];

    @property([cc.Node])
    waitingAniNds: cc.Node[] = [];

    @property(cc.Label)
    lblWaitingRound: cc.Label = undefined;


    gameName = GameId.QHB;
    playerMgr: QHBPlayerMgr;
    msg: QHBMsg;
    audioMgr: QHBAudio;

    REDBAG_COUNT: number = 10;                      // 该房间固定红包数量
    private MIN_GRAB: number = 10;                  // 抢红包最小金额（等价发红包最小金额）
    private MAX_SEND: number = 300;                 // 发红包最大金额
    private GRAB_BETS: number = 1;                  // 房间倍数
    private MONEY_LIST: number[] = [];              // 包红包界面可选择金额

    waitingRound: number = undefined;               // 雷包排队局数
    boomPool: cc.NodePool = undefined;              // 小炸弹池
    private redBagPool: cc.NodePool = undefined;    // 红包池
    private countDown: Function = undefined;        // 倒计时函数
    private isAutoGrab: boolean = false;            // 是否开启自动抢红包
    private isAutoSend: boolean = false;            // 是否开启自动发红包
    private isWaiting: boolean = false;             // 是否在队列中
    private grabSwitchFlag: boolean = false;        // 左右玩家切换进入
    private isClickGrab: boolean = false;           // 玩家是否点击了抢按钮


    public bankerPos: number = undefined;           // 当前发红包的玩家位置
    public curRedBagInfo: redBagInfo = undefined;   // 当前红包信息
    public autoSendMoney: string = undefined;       // 自动发红包的金额
    public autoSendBoomNo: number = undefined;      // 自动发红包的雷号
    public autoGrabMoney: string[] = [];            // 自动抢红包的设置金额
    public autoGrabBomNo: number[] = [];            // 自动抢红包的设置雷号
    public grabedPlayerList: QHBPlayer[] = [];      // 当局抢中红包的玩家
    public redBagList: redBagInfo[] = [];           // 待发红包列表
    public redBagPos: cc.Vec2[] = [];               // 记录红包的位置
    public redBagScale: number[] = [];              // 记录红包的缩放值
    public redBagOpacity: number[] = [];            // 记录红包的透明度
    public sRecord: sendRecord[] = [];              // 我的战绩发红包记录
    public gRecord: grabRecord[] = [];              // 我的战绩抢红包记录


    onLoad(){
        this.redBagPool = new cc.NodePool();
        for (let index = 0; index < 30; index++) {
            let redBag = instantiate(this.preRedBag);
            this.redBagPool.put(redBag);
        }
        this.boomPool = new cc.NodePool()
        for (let i = 0; i < 20; i++) {
            let boom = instantiate(this.preOtherBoomAni);
            this.boomPool.put(boom);
        }
        for (let i = 0; i < this.qhbRedBagList.length; i++) {
            let rb = this.qhbRedBagList[i].node;
            this.redBagPos[i] = rb.position;
            this.redBagScale[i] = rb.scale;
            this.redBagOpacity[i] = rb.opacity;
        }
        super.onLoad();
    }

    initGame() {
        // cc.log("----------initGame----------");
        this.msg = new QHBMsg(this);
        this.msg.init();
        this.playerMgr = new QHBPlayerMgr(this);
        this.menu.init(this);
        this.qhbOther.setGame(this);
        this.qhbOther.hide();
        this.qhbPack.setGame(this);
        this.qhbPack.hide();
        this.qhbRecord.setGame(this);
        this.qhbRecord.hide();
        this.initQHBRedBagList();
    }

    initQHBRedBagList() {
        for (let i = 0; i < this.qhbRedBagList.length; i++) {
            this.qhbRedBagList[i].init(this, i);
        }
    }

    start() {
        // cc.log("----------start----------");
    }

    initRound() {
        // cc.log("----------initRound----------");
        this.particialCtr(this.ndNormalWinAni, false);
        this.redBagList.shift();
        this.refreshWaitingRedBagList(false);
        this.recoverAllPoolItems(this.ndRedBagParent, this.redBagPool);
        this.recoverAllPoolItems(this.ndBoomLayer, this.boomPool);
        this.grabedPlayerList = [];
        this.grabSwitchFlag = false;
        this.isClickGrab = false;
    }

    setRoomInfo(config: any) {
        // cc.log("----------setRoomInfo----------", config);
        this.GRAB_BETS = config.bets;
        this.REDBAG_COUNT = config.hongbaoCnt;
        this.MIN_GRAB = config.allowGrabMinMoney;
        this.MAX_SEND = config.allowGrabMaxMoney;
        this.MONEY_LIST = config.moneyList;
     }

    setWaitPrepare() {  }

    showTicker() {  }

    refreshRoomInfo() {  }

    dealRoomData(data: any) {
        // cc.log("----------dealRoomData----------", data);
    }

    setStarted() {  }

    hideTicker() { }

    setGameEnd() {
        // cc.log("----------setGameEnd----------");
        this.clearGrabPlayerList();
        this.setRedBagInfo(0, 1); // 在结束时提前将下一个红包的信息设置好
    }

    setWaitStart() { }

    changeState(s: number, left?: number) {
        // cc.log("----------changeState----------", s);
        super.changeState(s);
    }

    updateUI() {
        // cc.log("----------updateUI----------");
        switch (this.gameState) {
            case GameStatus.FREE:
                // cc.log("准备阶段");
                this.setTimer(0);
                break;
            case GameStatus.GRAB:
                // cc.log("抢红包阶段");
                break;
            case GameStatus.BALANCE:
                // cc.log("结算阶段");
                this.setTimer(0);
                if (this.isClickGrab) {
                    this.audioMgr.playNotGrabed();
                }
                if (this.qhbOther.node.active) {
                    this.qhbOther.show();
                }
                break;
            case GameStatus.END:
                // cc.log("游戏结束");
                this.setTimer(0);
                break;
        }
        this.menu.hideChangeBtn();
     }

    /**
     * 倒计时
     * @param time
     */
    setTimer(time: number) {
        let totalTime = time;
        let timer = this.ndClockTimer.getComponentInChildren(cc.Label);
        timer.string = `${Math.floor(totalTime)}`;
        let self = this;
        if (time !== 0) {
            this.ndClockTimer.active = true;
            this.ndClockTimer.opacity = 255;
            this.schedule(self.countDown = function (dt: number) {
                totalTime -= dt;
                if (totalTime <= 0) {
                    timer.string = "0";
                    self.unschedule(self.countDown);
                    return;
                }
                timer.string = `${Math.floor(totalTime)}`;
            }, 0.95);
        } else {
            if (self.countDown !== undefined) self.unschedule(self.countDown);
            this.ndClockTimer.runAction(cc.fadeOut(0.3));
        }
    }

    /**
     * 设置当前红包信息
     * @param data
     */
    setCurRedBagInfo(data: { status: number, leftTime: number, curHB: redBagInfo, hongBaoList: redBagInfo[]}) {
        this.gameState = data.status;
        this.curRedBagInfo = data.curHB;
        this.bankerPos = data.curHB.pos;
        this.redBagList = data.hongBaoList;
        let p = this.playerMgr.getInfoByPos(data.curHB.pos);
        let curRB = this.getCurRedBagByOrder(0);
        curRB.setRedBagInfo(p, data.curHB);

        this.setRedBagInfo(1, 2); // 设置下下个红包信息

        let myPos = this.playerMgr.getMePos();
        if (this.waitingRound) {
            this.waitingRound = this.checkMyWaitingRound();
            this.lblWaitingRound.string = this.waitingRound.toString();
        }
        if (myPos === this.bankerPos) {
            this.redBagWaitingAni(false, 0);
        }
    }

    /**
     * 设置相应红包信息
     * @param idx 对应的红包队列信息
     * @param order 红包对象的编号
     */
    setRedBagInfo(idx: number, order: number) {
        let rb = this.redBagList[idx];
        if (rb) {
            let p = this.playerMgr.getInfoByPos(rb.pos);
            if (p) {
                let redBag = this.getCurRedBagByOrder(order);
                redBag.setRedBagInfo(p, rb);
            }
        }
    }

    /**
     * 通过order找到对应红包
     * @param order
     */
    getCurRedBagByOrder(order: number) {
        if (this.qhbRedBagList.length <= 0) return;
        let curRedBag;
        for (let i = 0; i < this.qhbRedBagList.length; i++) {
            if (this.qhbRedBagList[i].order === order) {
                curRedBag = this.qhbRedBagList[i];
            }
        }
        if (curRedBag) {
            return curRedBag;
        } else {
            // cc.warn("order: ", order, "红包未找到！");
        }
    }


    /**
     * 刷新抢中红包的玩家
     * @param data
     */
    refreshGrabPlayerList(data: PlayerInfo) {
        if (data.isGrabbed && !this.checkPlyContains(data.pos)) {
            let leftLength = this.ndLeftPlayerList.childrenCount;
            let rightLength = this.ndRightPlayerList.childrenCount;

            let myPos = this.playerMgr.getMePos();
            let item = instantiate(this.preGrabPlayer);
            let qhbP = item.getComponent(QHBPlayer);
            let parent;
            let idx;
            if (!this.grabSwitchFlag) {
                parent = this.ndLeftPlayerList;
                qhbP.posFlag = true;
                idx = leftLength;
            } else {
                parent = this.ndRightPlayerList;
                qhbP.posFlag = false;
                idx = rightLength;
            }
            qhbP.init(this);
            qhbP.idx = idx;
            qhbP.pos = data.pos;

            let p = this.playerMgr.getInfoByPos(data.pos);
            if (p) {
                let headSf = getAvatar((p.gender === Gender.MALE), p.avatar);
                let loc = parseLocation(p.location);
                let dataMoney = this.parse2Float(data.money);
                let curRB = this.getCurRedBagByOrder(0);
                if (data.pos === myPos) {
                    this.isClickGrab = false;   // 抢到了播放恭喜音效，在结算时就不播放手慢的音效
                    curRB.showMyGrabedMoney(dataMoney);
                    let chgMoney = data.chgMoney;
                    this.showMyResultMoney(chgMoney);
                    if (data.isBoom) {
                        this.playAnim(this.preMyBoomAni);
                        this.audioMgr.playBoom();
                    } else {
                        if (!this.autoGrab) this.audioMgr.playGrabed();
                    }
                    this.particialCtr(this.ndNormalWinAni, true);
                    qhbP.setPlyInfo(headSf, loc, dataMoney);
                    qhbP.showMeIcon();
                    qhbP.changeInfoBg();

                    this.saveGrabRecord(dataMoney, data.isBoom);    // 存储抢红包战绩信息
                } else {
                    qhbP.setPlyInfo(headSf, loc);
                }
                let rbNum = this.REDBAG_COUNT - leftLength - rightLength - 1;
                curRB.setRedBagNum(rbNum);
                // cc.log("----------新增抢中红包的玩家-----------", p);
            } else {
                // cc.warn(`玩家:${data.pos}不存在`, );
            }

            parent.addChild(item);
            this.grabSwitchFlag = !this.grabSwitchFlag;
            this.redBagFlyToPlayer(idx, item, qhbP);
            qhbP.grabAni();
            this.grabedPlayerList.push(qhbP);
        }
    }

    saveGrabRecord(dataMoney: string, isBoom: number) {
        if (this.gRecord.length >= 10) {
            this.gRecord.pop();
        }
        let gRecord = <grabRecord>{};
        gRecord.money = this.curRedBagInfo.money;
        gRecord.boom = this.curRedBagInfo.boomNo;
        gRecord.grabMoney = dataMoney;
        gRecord.isBoom = isBoom;
        this.gRecord.unshift(gRecord);
    }

    checkPlyContains(pos: number) {
        let contain = false;
        for (let i = 0; i < this.grabedPlayerList.length; i++) {
            let p = this.grabedPlayerList[i];
            if (p.pos === pos) {
                contain = true;
                break;
            }
        }
        return contain;
    }

    /**
     * 红包飞行动画
     * @param idx
     * @param player
     */
    private redBagFlyToPlayer(idx: number, player: cc.Node, p: QHBPlayer) {
        let rb = this.getOnePoolItem(this.redBagPool, this.preRedBag, this.ndRedBagParent);
        let curRedBag = this.getCurRedBagByOrder(0);
        if (!curRedBag) return;
        let startPos = curRedBag.node.convertToWorldSpaceAR(cc.Vec2.ZERO);
        rb.position = this.ndRedBagParent.convertToNodeSpaceAR(startPos);
        let endPos = player.parent.getPosition();
        if (p.posFlag) {
            endPos.x = endPos.x + 20;
        } else {
            endPos.x = endPos.x - 20;
        }
        let firstPos = endPos.y - player.height / 2;
        endPos.y = firstPos - (player.height + 14) * idx;
        rb.runAction(cc.sequence(
            // Parabola.move(0.4, rb.position, endPos),
            cc.jumpTo(0.4, endPos, 50, 1).easing(cc.easeIn(2)),
            cc.fadeOut(0.1),
        ));
    }

    /**
     * 得到一个池对象
     * @param pool
     * @param prefab
     * @param parent
     */
    getOnePoolItem(pool: cc.NodePool, prefab: cc.Prefab, parent: cc.Node): cc.Node {
        let item: cc.Node;
        if (pool.size() > 0) {
            item = pool.get();
        } else {
            item = instantiate(prefab);
        }
        parent.addChild(item);
        return item;
    }

    /**
     * 回收一个池对象
     * @param item
     * @param pool
     */
    private recoverOnePoolItem(item: cc.Node, pool: cc.NodePool) {
        item.removeFromParent(true);
        item.opacity = 255;
        item.name = "";
        pool.put(item);
    }

    /**
     * 回收全部的池对象
     * @param parent
     * @param poolItem
     * @param pool
     */
    recoverAllPoolItems(parent: cc.Node, pool: cc.NodePool) {
        let items = parent.children;
        for (let index = 0; index < items.length; index++) {
            let item = items[index];
            this.recoverOnePoolItem(item, pool);
        }
        if (parent.children.length > 0) {
            this.recoverAllPoolItems(parent, pool);
        }
    }

    /**
     * 清空上一局抢中红包的玩家
     */
    private clearGrabPlayerList() {
        let leftLen = this.ndLeftPlayerList.childrenCount;
        let rightLen = this.ndRightPlayerList.childrenCount;

        if (this.grabedPlayerList.length === leftLen + rightLen) { // 容错判断
            this.grabedPlayerList.forEach((player) => {
                player.exitAni();
            });
        } else {
            if (leftLen > 0) {
                this.ndLeftPlayerList.destroyAllChildren();
            }
            if (rightLen > 0) {
                this.ndRightPlayerList.destroyAllChildren();
            }
        }
    }

    /**
     * 红包切换
     */
    switchRedBag() {
        this.qhbRedBagList.forEach((qhb) => {
            qhb.switchAni();
        });
    }

    /**
     * 游戏结算
     * @param data
     */
    gameResult(data: resultPlayerInfo[]) {
        let myPos = this.playerMgr.getMePos();
        let isMyResult = false;
        let boomedPly = 0;
        for (let i = 0; i < data.length; i++) {
            let p = this.getPlayerByGrabedPos(data[i].pos);
            if (p) {
                let grabMoney = data[i].grabMoney;
                p.node.getChildByName("money").getComponent(cc.Label).string = this.parse2Float(grabMoney);
                if (data[i].isMaxHB) {
                    p.showMaxRB();
                    if (data[i].pos === myPos) {
                        this.audioMgr.playBigWin();
                        let curRB = this.getCurRedBagByOrder(0);
                        curRB.winEffectCtr(true);
                    }
                }
                if (data[i].isBoom) {
                    p.playAni();
                    boomedPly++;
                }
            } else {
                // cc.warn("玩家", data[i].pos, "不在抢中红包队列中");
            }
            if (data[i].pos === myPos) {    // 判断自己是否在发红包队列中
                this.isWaitingList = !!data[i].isSending;
                if (data[i].grabMoney !== "0") {
                    isMyResult = true;
                }
            }
            if (data[i].pos === this.bankerPos && data[i].payForMaster && data[i].lastMoney) { // 判断是否是庄家
                let inMoney = add(+data[i].payForMaster, +data[i].lastMoney);
                let endMoney;
                if (this.curRedBagInfo) {
                    endMoney = sub(+inMoney, +this.curRedBagInfo.money);
                }
                let curRB = this.getCurRedBagByOrder(0);
                let fix2Money = this.parse2Float(endMoney.toString());
                curRB.showBankerChgMoney(fix2Money, isMyResult);
                if (data[i].pos === myPos) {    // 判断是否自己坐庄的情况
                    let myEndMoney = add(data[i].payForMasterSubTax, data[i].lastMoney).toNumber();
                    this.showMyResultMoney(myEndMoney.toString());

                    this.saveSendRecord(boomedPly);     // 存储发红包战绩信息
                }
            }
        }
    }

    saveSendRecord(boomedPly: number) {
        if (this.sRecord.length >= 10) {
            this.sRecord.pop();
        }
        let sRecord = <sendRecord>{};
        sRecord.boomedPly = boomedPly;
        sRecord.rbMoney = this.curRedBagInfo.money;
        this.sRecord.unshift(sRecord);
    }

    /**
     * 玩家自身飘字并更新金币
     * @param money
     */
    showMyResultMoney(money: string) {
        // cc.log("飘字结算，", +money);
        let wMoney: string;
        let lMoney: string;
        if (+money >= 0) {
            wMoney = `+${money}`;
        } else if (+money < 0) {
            lMoney = `${money}`;
        }
        let mySelf = this.playerMgr.getMySelf();
        // cc.log("winMoney: ", wMoney, "loseMoney: ", lMoney);
        mySelf.showGetAndLost({ get: wMoney, lost: lMoney });
        mySelf.refreshMoney(+money);
    }

    getPlayerByGrabedPos(pos: number) {
        let ply: QHBPlayer = undefined;
        for (let i = 0; i < this.grabedPlayerList.length; i++) {
            let p = this.grabedPlayerList[i];
            if (p.pos === pos) {
                ply = p;
                break;
            }
        }
        return ply;
    }

    get isWaitingList() {
        return this.isWaiting;
    }

    set isWaitingList(b: boolean) {
        this.isWaiting = b;
    }

    get autoSend() {
        return this.isAutoSend;
    }

    set autoSend(b: boolean) {
        this.isAutoSend = b;
    }

    get autoGrab() {
        return this.isAutoGrab;
    }

    set autoGrab(b: boolean) {
        this.isAutoGrab = b;
    }

    /**
     * 刷新红包等待列表
     * @param add
     * @param redBag
     */
    refreshWaitingRedBagList(add: boolean, redBag?: redBagInfo) {
        if (this.qhbPack.node.active) {
            if (add) {
                this.qhbPack.refreshRedBagList(add, redBag);
            } else {
                this.qhbPack.refreshRedBagList(add);
            }
        }
    }

    /**
     * 补全小数后两位
     */
    private parse2Float(gold: string) {
        if (!gold || gold === "") return;
        let isDecimal = gold.split(".");
        if (isDecimal[1]) {
            let Decimal = isDecimal[1].split("");
            if (Decimal.length == 1) {
                return gold + "0";
            } else {
                return gold;
            }
        } else {
            return gold + ".00"
        }
    }

    playAni(nd: cc.Node, repeat: boolean = false) {
        this.playRepeatAnim(nd, repeat);
    }

    /**
     * 自动抢红包
     */
    onClickAutoGrab() {
        // if (this.autoGrabMoney.length <= 0 || this.autoGrabBomNo.length <= 0) {
        //     showTip("亲，请预先设置您的自动抢红包选项~");
        //     this.onClickSetting();
        //     return;
        // }
        let money = this.playerMgr.me.balance;
        if (money < this.MONEY_LIST[0]) {
            showTip("亲，金币不足自动抢无法开启哦～");
            return;
        }
        this.audioMgr.playClick();
        this.autoGrab = !this.autoGrab;
        let node = this.ndAutoGrabBtn.getChildByName("Qiang02");
        let ani = node.getComponent(cc.Animation);
        let effect = node.getChildByName("Particle");
        if (this.autoGrab) {
            showTip("自动抢红包功能已开启~");
            node.active = true;
            if (ani.defaultClip) ani.play();
            this.particialCtr(effect, true);
            this.onClickGrabRedBag();
            // this.ndAutoGrabBtn.spriteFrame = this.sfAutoBtn[1];
        } else {
            showTip("自动抢红包功能已关闭～");
            node.active = false;
            if (ani.defaultClip) ani.stop();
            this.particialCtr(effect, false);
            // this.ndAutoGrabBtn.spriteFrame = this.sfAutoBtn[0];
        }
    }

    /**
     * 检测红包是否符合自动抢的设置
     */
    checkRedBagCanGrab(money: string, boom: number) {
        let checkMoney = false;
        let checkBoom = false;
        for (let i = 0; i < this.autoGrabMoney.length; i++) {
            if (money === this.autoGrabMoney[i]) {
                checkMoney = true;
                break;
            }
        }

        for (let i = 0; i < this.autoGrabBomNo.length; i++) {
            if (boom === this.autoGrabBomNo[i]) {
                checkBoom = true;
                break;
            }
        }

        if (checkMoney && checkBoom) {
            return true;
        } else {
            return false;
        }
    }

    /**
     * 检测红包是否可以抢
     */
    checkCanGrab(money: string) {
        let me = this.playerMgr.me;
        if (me.balance < +money * this.GRAB_BETS) {
            return false;
        } else {
            return true;
        }
    }

    /**
     * 取消自动抢
     */
    cancelAutoGrab() {
        this.autoGrab = false;
        // this.autoGrabMoney = [];
        // this.autoGrabBomNo = [];
        let node = this.ndAutoGrabBtn.getChildByName("Qiang02")
        node.active = false;
        let effect = node.getChildByName("Particle");
        this.particialCtr(effect, false);
    }

    /**
     * 自动发红包
     */
    onClickAutoSend() {
        if (this.autoSendMoney === undefined || this.autoSendBoomNo === undefined) {
            showTip("您尚未发过红包哦～快去发红包把");
            this.onClickPackRedBag();
            return;
        }

        this.audioMgr.playClick();
        this.autoSend = !this.autoSend;
        let node = this.ndAutoSendBtn.getChildByName("Qiang02");
        let ani = node.getComponent(cc.Animation);
        let effect = node.getChildByName("Particle");
        if (this.autoSend) {
            showTip("已按您上一次的红包自动发放~");
            node.active = true;
            if (ani.defaultClip) ani.play();
            this.particialCtr(effect, true);
        } else {
            showTip("自动发红包功能已关闭～");
            node.active = false;
            if (ani.defaultClip) ani.stop();
            this.particialCtr(effect, false);
        }
    }

    /**
     * 检查金额是否足够自动
     */
    checkMoneyEnoughAuto(money: string) {
        let me = this.playerMgr.getMySelf();
        if (money === undefined || money === "0" || money === "" || me.balance < +money) {
            return false;
        } else {
            return true;
        }
    }

    /**
     * 取消自动发红包
     */
    cancelAutoSend() {
        this.autoSend = false;
        // this.autoSendMoney = undefined;
        let node = this.ndAutoSendBtn.getChildByName("Qiang02")
        node.active = false;
        let effect = node.getChildByName("Particle");
        this.particialCtr(effect, false);
    }

    /**
     * 显示自动抢按钮
     */
    showAutoSendBtn() {
        this.ndAutoSendBtn.runAction(
            cc.sequence(
                cc.spawn(
                    cc.moveTo(0.3, 276, -28),
                    cc.fadeIn(0.3),
                ),
                cc.callFunc(() => {
                    this.ndAutoSendBtn.getComponent(cc.Button).interactable = true;
                }),
            )
        );
    }

    /**
     * 打开其他玩家列表
     */
    onClickOther() {
        this.audioMgr.playClick();
        this.qhbOther.show();
    }

    /**
     * 设置自动发红包信息
     */
    setAutoSendInfo(money: string, boom: number) {
        this.autoSendMoney = money;
        this.autoSendBoomNo = boom;
    }

    /**
     * 打开包红包界面
     */
    onClickPackRedBag() {
        this.audioMgr.playClick();
        this.qhbPack.show(this.MONEY_LIST, this.MIN_GRAB);
    }

    /**
     * 抢红包
     */
    onClickGrabRedBag() {
        // cc.log("当前阶段： ", this.gameState);
        if (!this.curRedBagInfo) return;
        this.audioMgr.playClickGrabBtn();
        if (!this.checkCanGrab(this.curRedBagInfo.money)) {
            showTip("亲，金额不足不能抢哦～");
            return;
        }
        this.isClickGrab = true;
        this.msg.sendGrabRedBag(this.playerMgr.getMePos());
    }

    /**
     * 退出判断
     */
    onClickGoBack() {
        let str: string | undefined;
        let me = this.playerMgr.me;
        if (this.isWaitingList) {
            str = "您的红包正在排队中，不等一下吗？";
        } else {
            if (this.autoGrab || this.autoSend) {
                str = "亲，不在玩一会吗？确认要退出吗？"
            } else {
                if (this.isGaming && me && !me.isLooker) {
                    str = "亲，确定要退出吗？";
                }
            }
        }
        if (str) {
            let self = this;
            let confirm = showConfirm(str, "确定", "取消");
            confirm.okFunc = function () {
                self.isWaitingList = false;
                window.pomelo.request("lobby.lobbyHandler.leaveGame", undefined, function () {
                    confirm.close();
                });
            };
            confirm.cancelFunc = function() {
                self.isWaitingList = !!self.isWaitingList;
            }
        } else {
            window.pomelo.request("lobby.lobbyHandler.leaveGame", undefined, () => { });
        }
    }

    /**
     * 打开我的战绩
     */
    onClickMyRecord() {
        this.qhbRecord.show();
        this.qhbOther.hide();
    }

    /**
     * 特效控制
     * @param nd
     * @param isShow
     */
    particialCtr(nd: cc.Node, isShow: boolean) {
        let par = nd.getComponentsInChildren(cc.ParticleSystem);
        par.forEach((p) => {
            if (isShow) {
                p.resetSystem()
            } else {
                p.stopSystem();
            }
        })
    }

    /**
     * 雷包排队中动画
     * @param isShow: 显示or隐藏
     */
    redBagWaitingAni(isShow: boolean, round: number) {
        if (isShow) {
            this.waitingAni();
            this.schedule(this.waitingAni, 4);
            this.waitingAniNds[0].parent.active = true;
        } else {
            this.waitingAniNds.forEach((val, idx) => {
                val.stopAllActions();
                if (idx < 5) {
                    val.setPosition(0, 0);
                } else {
                    val.setPosition(0, -8);
                }
            })
            this.waitingAniNds[0].parent.active = false;
            this.unschedule(this.waitingAni);

        }
        this.waitingRound = round;
        this.lblWaitingRound.string = round.toString();
    }

    waitingAni() {
        let delay = 0.25;
        this.waitingAniNds.forEach((val, idx) => {
            val.runAction(cc.sequence(
                cc.delayTime(delay * idx),
                cc.jumpTo(0.25, cc.v2(val.x, val.y), 10, 1)
            ));
        });
    }

    /**
    * 找到自己的红包排队名次
    */
    checkMyWaitingRound() {
        if (!this.redBagList) return;
        let round = 0;
        let myPos = this.playerMgr.getMePos();
        for (let i = 0; i < this.redBagList.length; i++) {
            if (this.redBagList[i].pos === myPos) {
                round = i + 1;
                break;
            }
        }
        if (round === 0) {
            round = this.redBagList.length + 1;
        }
        return round;
    }

}
