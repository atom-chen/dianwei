import Player from "./player";
import PlayerMgr from "./playerMgr";
import GameMsg from "./gameMsg";
import { User } from "../common/user";
import Menu from "./menu";
import Audio from "../common/audio";
import * as util from "../common/util";
import Tips from "../common/tips";
import { addSingleEvent, showCurtain, showTip, showLoading } from "../common/util";
import { ErrCodes } from "../common/code";
import g from "../g";
import { QUITSHOW } from "../g";
import { How2Play } from "../common/how2play";
import Lobby from "../lobby/lobby";

const { ccclass, property } = cc._decorator;

export enum GameId {
    QZNN = "NIUNIU",
    JH = "JINHUA",
    SUOHA = "SUOHA",
    BRNN = "BRNIUNIU",
    DDZ = "DOUDIZHU",
    HH = "HONGHEI",
    BY = "BUYU",
    PDK = "PAODEKUAI",
    JDNN = "JDNIUNIU",
    LH = "LONGHU",
    ERMJ = "ERRENMAJIANG",
    DZPK = 'DEZHOUPUKE',
    QHB = 'QIANGHONGBAO',
}

export enum State {
    WaitStart = 1, // 等待开始
}
export const GameNames: { [index: string]: string } = {
    [GameId.QZNN]: "抢庄牛牛",
    [GameId.JH]: "拼三张",
    [GameId.SUOHA]: "欢乐五张",
    [GameId.BRNN]: "百人牛牛",
    [GameId.HH]: "红黑大战",
    [GameId.BY]: "欢乐捕鱼",
    [GameId.PDK]: "跑得快",
    [GameId.JDNN]: "经典牛牛",
    [GameId.LH]: "龙虎斗",
    [GameId.ERMJ]: "二人麻将",
    [GameId.DZPK]: "德州扑克",
    [GameId.QHB]: "红包扫雷",
}

export interface PlayerInfo {
    money?: string;
    avatar: number;
    gender: number;
    pos: number;
    location?: string;
    name?: string;
    score?: number;
    bReady?: boolean;
}

export interface MatchRoomData {
    startKickTime?: number;
    users: PlayerInfo[];
    leftTime?: number;
    isGaming?: number,
    config?: string,
    bets?: string,
    rType: number,
    rPos?: number,
    maxUserCount?: number,
    gameNo: string,
}

@ccclass
export default abstract class Game extends cc.Component {
    // ui
    @property({ type: cc.Node, tooltip: "动画播放节点" })
    protected nodeAnimation: cc.Node = undefined;

    @property({ type: cc.Label, tooltip: "房间号" })
    labGameId: cc.Label = undefined;

    @property({ type: cc.Prefab, tooltip: "开始游戏动画预制" })
    protected animStartGame: cc.Prefab = undefined;

    @property({ type: cc.Prefab, tooltip: "胜利动画预制" })
    protected animWin: cc.Prefab = undefined;

    @property({ type: Menu, tooltip: "菜单节点" })
    menu: Menu = undefined;

    @property({ type: cc.Node, tooltip: "准备按钮节点" })
    nodePrepare: cc.Node = undefined;

    /**
     * 不要用这个，用 PlayerMgr 里面的 PlayerArr
     *
     * @type {Player[]}
     * @memberof Game
     */
    @property({ type: [Player], tooltip: "玩家节点组" })
    players: Player[] = [];

    @property({ type: cc.Prefab, tooltip: "赢钱提示预制" })
    prefabLabelWin: cc.Prefab = undefined;

    @property({ type: cc.Prefab, tooltip: "抽税提示预制" })
    prefabLabelTax: cc.Prefab = undefined;

    @property({ type: Audio, tooltip: "游戏音效管理" })
    protected audioRes: Audio = undefined;

    @property({ type: cc.Prefab, tooltip: "牌型界面预制" })
    cardTypesBox: cc.Prefab = undefined;

    @property(cc.Node)
    public nodeCanvas: cc.Node = undefined;

    abstract readonly gameName: GameId;
    id: string;
    gameState = 0;
    playerMgr: PlayerMgr<Player>;
    msg: GameMsg;
    get isWaitingStart() {
        return this.gameState === 1;
    }

    isGaming: boolean;
    userTouched: boolean = true;
    checkTouched: boolean = false;

    get audioMgr() {
        return this.audioRes;
    }

    baseScore: number;// 底分
    maxUserCount: number;
    dontPrepare: boolean;
    protected _withinJoker: boolean;

    private _prepareDesc: cc.Label;
    private _prepareTime: cc.Label;
    private _firstLoad: boolean;
    private _prepareEndTime: number;
    abstract initGame(): void;

    abstract initRound(): void;

    //设置，显示好友房（金币房）信息
    abstract setRoomInfo(config: any): void;
    abstract dealRoomData(data: any): void;
    abstract refreshRoomInfo(): void;
    abstract showTicker(time: number): void;
    abstract hideTicker(): void;

    get helpDesc() {
        return How2Play.gameHelpDesc(this.gameName);
    };

    showStartTicker(time: number) {
        this.hidePrepareTicker();
        this.showTicker(time);
    };
    hideStartTicker() {
        this.showPrepareTicker();
        this.hideTicker();
    };

    changeState(s: number) {
        if (this.checkTouched && s == State.WaitStart && !this.userTouched) {
            let toLeave = () => {
                window.pomelo.request("lobby.lobbyHandler.leaveGame", undefined, () => { })
            }
            this.scheduleOnce(toLeave, 2.3);

            let confirm = util.showConfirm("亲，您已经一局未操作了，是否要继续游戏？", "继续", "返回");
            confirm.okFunc = () => {
                this.unschedule(toLeave);
                confirm.close();
            };
            confirm.cancelFunc = () => {
                this.unschedule(toLeave);
                toLeave();
                confirm.close();
            };
        }
        this.gameState = s;
        this.updateUI();
    }
    abstract updateUI(): void;

    initWithData(data: MatchRoomData) {
        this.isGaming = false;
        this.maxUserCount = data.maxUserCount;
        if (this.labGameId) {
            this.labGameId.string = data.gameNo;
        }
        if (!this._firstLoad) {
            this.reset();
        }
        this._firstLoad = false;
        if (data.bets) {
            this.baseScore = +data.bets;
        }
        if (data.isGaming) this.dontPrepare = true;
        this.initRound();
        let playerMgr = this.playerMgr;

        //房间信息----------------------------------------------------------
        if (data.config) {
            let config = JSON.parse(data.config);
            this.setRoomInfo(config);
        }

        //座位偏移
        if (data.rPos !== undefined) {
            if (this.gameName != GameId.BY) {

                playerMgr.seatOffset = data.rPos;
            } else {
                if (data.rPos > 1) {
                    playerMgr.isRotate = true;
                } else {
                    playerMgr.isRotate = false;
                }
            }
        }
        //处理gameInfo----------------------------------------------------
        if (data.isGaming) {
            this.isGaming = data.isGaming === 1;

        }
        //已有的玩家
        data.users.sort((a, b) => {
            return a.pos - b.pos;
        });

        cc.log("new game =====================");
        for (let player of data.users) {
            playerMgr.setPlayerEnter(player, false, false);
        }

        if (!this.isGaming) {
            this.setWaitPrepare();
            if (data.startKickTime) {
                this.showPrepareTicker(data.startKickTime);
            } else {
                this.hidePrepare();
            }
        } else {
            this.hidePrepare();
        }
        if (data.leftTime) {
            this.showStartTicker(data.leftTime);
        }
        //请求当前游戏信息
        if (!this.isGaming) {
            this.endLoadGameInfo();
        } else {
            this.loadGameInfo();
        }
        this.refreshRoomInfo();
        this.dealRoomData(data);
    }

    /**
     * 注册游戏消息
    */
    loadGameInfo() {
        if (!this.msg.loadGameHandler) {
            this.endLoadGameInfo();
            return;
        }
        // 处理当isGaming为1，但游戏又刚好结算的情况
        window.pomelo.request(this.msg.loadGameHandler, {}, (data: { code: number }) => {
            // 消息注册必须在loadGame消息之后
            if (data.code !== 200) {
                this.endLoadGameInfo();
            }
        });
    };

    endLoadGameInfo() {
        this.msg.addCurrGameMsg();
    }

    protected onLoad() {

        util.fitCanvas(this.nodeCanvas);

        g.lastGame = this.gameName;
        showCurtain(true, () => {
            showCurtain(false);
        });
        // init logic
        this._firstLoad = true;
        if (this.nodePrepare) {
            let handler = new cc.Component.EventHandler();
            handler.target = this.node;
            handler.component = cc.js.getClassName(this);
            handler.handler = "doPrepare";
            addSingleEvent(this.nodePrepare.getComponent(cc.Button), handler);
        }
        if (this.menu)
            this.menu.node.active = true;
        if (this.nodePrepare) {
            let node = this.nodePrepare.getChildByName("cont");
            this._prepareDesc = node.getChildByName("desc").getComponent(cc.Label);
            this._prepareTime = node.getChildByName("time").getComponent(cc.Label);
        }

        this.initGame();
        this.pullRoomData();
        if (this.checkTouched && this.menu) {
            this.menu.node.on(cc.Node.EventType.TOUCH_END, (event) => {
                this.userTouched = true;
            });
            (<any>this.menu.node)["_touchListener"].setSwallowTouches(false);
        }
    }

    pullRoomData() {

        return new Promise(resolve => {
            window.pomelo.request("game.roomHandler.getRoomData", {}, (data: any) => {
                if (data.code === 200) {
                    //这条消息之前可能有userenter消息造成写入serverPlayers，清掉，金花pk卡应该就是这问题造成的。服务器应确认为什么在getroomdata之前发送了userenter消息
                    this.playerMgr.clearAllPlayer();
                    this.initWithData(data);
                    resolve(true);
                } else {
                    this.returnLobby().then(() => {
                        showTip(ErrCodes.getErrStr(data.code, "加载房间信息失败"));
                        resolve(false);
                    });
                }
            });
        });
    }

    changeRoom() {
        let bReady = false;
        let me = this.playerMgr.me;
        if (me) {
            if (me.isReady) {
                bReady = true;
            }
        }

        util.showLoading("正在换桌");
        window.pomelo.request("lobby.matchHandler.changeRoom", {}, (data: { code: number }) => {
            cc.log("换桌data", data);
            util.hideLoading();
            if (data.code === 3003) {
                util.showTip("换桌失败，金币不足。");
                this.returnLobby();
                return;
            }
            if (data.code !== 200) {
                util.showTip("换桌失败，请稍后再试！");
                return;
            }
            this.pullRoomData().then(() => {
                util.showCurtain(true, () => {
                    showCurtain(false);
                });
                if (bReady && !this.isGaming) {
                    this.doPrepare();
                }
            });
        });
    }

    protected onDestroy() {
        Tips.clean();
        this.msg.unInit();
    }

    /**
     * 显示准备按钮
     *
     * @abstract
     * @memberof Game
     */
    showPrepare(): void {
        if (this.isGaming) {
            return;
        }
        if (!this._prepareDesc) {
            return;
        }
        let me = this.playerMgr.me;

        this._prepareDesc.string = "准备好了";
        if (!me.isReady) {
            this.nodePrepare.active = true;
        }
        this._prepareTime.node.active = false;
        this._prepareDesc.node.active = true;
    }
    /**
     * 隐藏准备按钮
     *
     * @abstract
     * @memberof Game
     */
    hidePrepare(justTime = false) {
        if (this.nodePrepare)
            this.nodePrepare.active = false;
    }
    private countdownPre() {
        let now = Date.now();
        if (!this._prepareTime || !this._prepareTime.isValid || now >= this._prepareEndTime) {
            this.unschedule(this.countdownPre);
            return;
        }
        let t = Math.round((this._prepareEndTime - now) / 1000);
        this._prepareTime.string = t.toString();
    }
    showPrepareTicker(timer?: number) {
        if (!this._prepareTime) {
            return;
        }
        this.showPrepare();
        this._prepareTime.node.active = true;
        if (timer === undefined) {
            return;
        }
        this._prepareEndTime = Date.now() + timer;
        let t = Math.round(timer / 1000);
        this._prepareTime.string = t.toString();
        this.unschedule(this.countdownPre);
        this.schedule(this.countdownPre, 1, t, 1);
    }
    hidePrepareTicker() {
        if (this._prepareTime)
            this._prepareTime.node.active = false;
    }

    doPrepare() {
        this.playerMgr.clearCards();
        window.pomelo.request("game.roomHandler.userReady", {}, (data: any) => {
            if (data.code === 200) {
                this.hidePrepare();
            }
        });
    }

    tickerShowAction(node: cc.Node, scale: number) {
        node.stopAllActions();
        node.scale = 0;
        node.runAction(cc.sequence(
            cc.moveBy(0, 0, -45),
            cc.spawn(
                cc.scaleTo(0.1, scale, scale).easing(cc.easeBackOut()),
                cc.fadeIn(0.3)
            )
        ));
    }

    tickerHideAction(node: cc.Node) {
        node.stopAllActions();
        node.runAction(cc.sequence(
            cc.spawn(
                cc.scaleTo(0.1, 0, 0).easing(cc.easeBackIn()),
                cc.fadeOut(0.3)
            ),
            cc.callFunc(() => {
                node.active = false;
            })
        ));
    }

    protected playAnim(animPrefab: cc.Prefab) {
        return new Promise(resolve => {
            if (!animPrefab) {
                cc.warn("no anim prefab");
                resolve(false);
                return;
            }
            let node = this.nodeAnimation.getChildByName(animPrefab.name);
            if (!node) {
                node = util.instantiate(animPrefab);
                this.nodeAnimation.addChild(node);
            }
            node.active = true;
            let anim = node.getComponent(cc.Animation);
            if (!anim) {
                cc.warn("prefab no anim");
                resolve(false);
                return;
            }

            if (anim.defaultClip) {
                anim.play();
            } else {
                let clips = anim.getClips();
                if (!clips || clips.length === 0) {
                    resolve(false);
                    return;
                }
                anim.play(clips[0].name);
            }

            anim.on("stop", function finish() {
                anim.off("stop", finish);
                node.active = false;
                resolve(true);
            });
        });
    }

    protected playRepeatAnim(nodeAnim: cc.Node, isRepeat = true) {
        return new Promise(resolve => {
            nodeAnim.active = true;
            let anim = nodeAnim.getComponent(cc.Animation);
            if (!anim) {
                cc.warn("no anim");
                resolve(false);
                return;
            }

            if (anim.defaultClip) {
                anim.play();
            } else {
                let clips = anim.getClips();
                if (!clips || clips.length === 0) {
                    resolve(false);
                    return;
                }
                anim.play(clips[0].name);
            }
            anim.on("stop", function () {
                if (!isRepeat) {
                    nodeAnim.active = false;
                    resolve(true);
                }
            });
        });
    }

    playAnimStartGame() {
        return this.playAnim(this.animStartGame);
    }

    playAnimWin() {
        return this.playAnim(this.animWin);
    }

    reset() {
        if (this.msg) {
            this.msg.unInit();
        }
        this.playerMgr.release();
        this.initGame();
    }
    /**
     * 返回大厅
     *
     * @returns
     * @memberof Game
     */
    returnLobby() {
        showLoading("加载中");
        let me = this.playerMgr.me;
        if (me && me.gameMoney !== undefined) {
            User.instance.money = me.gameMoney;
        }
        let canvas = cc.find("Canvas");
        if (canvas) {
            canvas.getComponentsInChildren(cc.Animation).forEach(a => {
                a.stop();
            });
        }
        return new Promise(resolve => {
            cc.director.loadScene(g.lobbyScene, () => {
                if (g.curQiutShow === QUITSHOW.SHOWRECHARGE) {
                    let nodeLobby = cc.find("lobby");
                    if (!nodeLobby) {
                        return;
                    }
                    let lobby = nodeLobby.getComponent(Lobby);
                    lobby.scheduleOnce(() => {
                        lobby.onClickRecharge();
                    }, 0.1);
                } else if (g.curQiutShow === QUITSHOW.SHOWBANK) {
                    let nodeLobby = cc.find("lobby");
                    if (!nodeLobby) {
                        return;
                    }
                    let lobby = nodeLobby.getComponent(Lobby);
                    lobby.scheduleOnce(() => {
                        lobby.onClickBank();
                    }, 0.1);
                }
                g.curQiutShow = QUITSHOW.NOSHOW;
                resolve();
            });
        });
    }
    /**
     * 设置游戏等待玩家准备状态
     *
     * @abstract
     * @memberof Game
     */
    abstract setWaitPrepare(): void;
    /**
     * 设置准备完毕等待开始状态
     *
     * @abstract
     * @memberof Game
     */
    abstract setWaitStart(): void;
    /**
     * 设置游戏已开始状态
     *
     * @abstract
     * @memberof Game
     */
    abstract setStarted(): void;
    /**
     * 设置游戏已结束状态
     *
     * @abstract
     * @memberof Game
     */
    abstract setGameEnd(): void;
}