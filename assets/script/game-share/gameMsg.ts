import { User } from "../common/user";
import Game, { PlayerInfo, GameId } from "./game";
import * as util from "../common/util";
import { PlayerStates } from "./player";
import g from "../g";
import Lobby from "../lobby/lobby";

let pomelo = window.pomelo;
export default abstract class GameMsg {

    abstract readonly loadGameHandler: string;
    abstract readonly notifyCurrentGame: string;

    constructor(protected game: Game) { }

    init() {
        this.removeEventListeners();
        this.addListeners();
    }

    unInit() {
        this.removeEventListeners();
    }

    addCurrGameMsg() {
        this.removeExtraListeners();
        this.removeSpecialListeners();
        this.addExtraListeners();
        this.addSpecialListeners();
    }

    private addSpecialListeners() {
        pomelo.on(this.notifyCurrentGame, this.handleCurrentGameInfo.bind(this));
    };
    private removeSpecialListeners() {
        pomelo.off(this.notifyCurrentGame);
    }

    protected abstract addExtraListeners(): void;
    protected abstract removeExtraListeners(): void;

    private addListeners() {
        //准备的倒计时，到时间踢掉
        pomelo.on("startKickTimer", this.handleStartKickTimer);
        pomelo.on("stopKickTimer", this.handleStopKickTimer);

        //游戏外消息---------------------------------------------------------
        //开始倒计时
        pomelo.on("startTimer", this.handleStartTimer);
        //stop倒计时
        pomelo.on("stopStartTimer", this.handleStopStartTimer);
        //游戏开始
        pomelo.on("startGame", this.handleStartGame);

        /**
         * 如果在房间里，收到别人进入房间的消息。
         * @data : Users[]
         */
        pomelo.on("userEnter", this.handleUserEnter);
        pomelo.on("userRecome", this.handleUserRecome);
        /**
        * 其他玩家掉线，服务器发这个消息过来。
        * @uid: number 掉线用户的id（一定是异常掉线，如果是正常离开，或者申请离开，都是其他消息）
        */
        pomelo.on("userLost", this.handleUserLost);
        // 玩家离开
        pomelo.on("userLeave", this.handleLeave);
        //托管
        pomelo.on("userAuto", this.handleAuto);
        pomelo.on("userReady", this.handleReady);
        //好友房结束,金币房结束
        pomelo.on("gameEnd", this.handleEnd);
        pomelo.on("updateUserLocation", this.handleLocationChange);
        pomelo.on("changeRoomSuccess", this.handleChangeRoomSuccess);
        this.addSpecialListeners();
    }

    private removeEventListeners() {
        pomelo.off("startKickTimer", this.handleStartKickTimer);
        pomelo.off("stopKickTimer", this.handleStopKickTimer);
        pomelo.off("startTimer", this.handleStartTimer);
        pomelo.off("stopStartTimer", this.handleStopStartTimer);
        pomelo.off("startGame", this.handleStartGame);
        pomelo.off("userEnter", this.handleUserEnter);
        pomelo.off("userRecome", this.handleUserRecome);
        pomelo.off("userLost", this.handleUserLost);
        pomelo.off("userLeave", this.handleLeave);
        pomelo.off("userAuto", this.handleAuto);
        pomelo.off("userReady", this.handleReady);
        pomelo.off("gameEnd", this.handleEnd);
        pomelo.off("updateUserLocation", this.handleLocationChange);
        pomelo.off("changeRoomSuccess", this.handleChangeRoomSuccess);
        this.removeExtraListeners();
        this.removeSpecialListeners();
    }

    /**
     * 断线重连
     * @param data
     */
    protected handleCurrentGameInfo(data: any): void {
        this.game.endLoadGameInfo();
    }

    handleUserEnter = (data: any) => {
        let game = this.game;
        if (game && game._isOnLoadCalled) {
            this.doUserEnter(data);
        } else {
            cc.warn("游戏还没初始化完毕");
        }
    }

    doUserEnter(data: any) {
        if (data.user.uid !== User.instance.uid && this.game) {
            this.game.playerMgr.setPlayerEnter(data.user);
        }
    }

    handleUserRecome = (data: any) => {
        data.user.money = undefined;
        data.user.score = undefined;
        if (this.game && this.game._isOnLoadCalled) {
            this.doUserRecome(data);
        } else {
            cc.warn("游戏还没初始化完毕");
        }
    }

    doUserRecome(data: any) {
        if (this.game) {
            this.game.playerMgr.setPlayerEnter(data.user, true, false);
        }
    }
    //------------------------------------------------------------------------


    private handleStartKickTimer = (data: any) => {
        if (this.game && this.game.isValid) {
            this.game.showPrepareTicker(data.leftTime);
        }
    }

    private handleStopKickTimer = (data: any) => {
        if (this.game) {
            this.game.hidePrepareTicker();
        }
    }
    //处理消息
    handleLeaveReason(reason: any) {
        //卡房间踢出，斗地主跑得快倒计时退出
        if (reason === 1) {
            util.showConfirm("您已退出房间");
        } else if (reason === 5) {
            util.showConfirm("亲，你很久没有操作了，请休息一会儿再来吧～");
        } else if (reason === 3) {
            if (!g.shield) {
                let nodeLobby = cc.find("lobby");
                if (!nodeLobby) {
                    return;
                }
                let lobby = nodeLobby.getComponent(Lobby);
                let c = util.showConfirm("亲，您身上的金币不太够了噢～请补充点金币吧。", "去充值", "去银行");
                c.showClose();
                c.okFunc = lobby.onClickRecharge.bind(lobby);
                c.cancelFunc = lobby.onClickBank.bind(lobby);
            }
        }
    }

    //发消息---------------------------------------------------------------------------------

    private handleStartTimer = (data: any) => {
        this.game.setWaitStart();
        this.game.showStartTicker(data.timerSecond);
        let me = this.game.playerMgr.me;
    }
    private handleStopStartTimer = (data: any) => {
        this.game.setWaitPrepare();
        this.game.hideStartTicker();
    }

    handleStartGame = (data: { users?: PlayerInfo[], willChangeRoom: number, gameNo: string }) => {
        let game = this.game;
        game.isGaming = true;
        let me = this.game.playerMgr.me;
        if (me) {
            game.userTouched = false;
            if (me.isLooker) {
                game.userTouched = true;
            }
        }
        game.setStarted();
        game.hidePrepare();
        game.playAnimStartGame().then(() => {
            if (data.willChangeRoom) {
                util.showTip("本局结束后将自动换桌");
            }
        });
        game.playerMgr.updatePlayers(data.users);
        game.hideTicker();
        if (this.game.audioMgr) {
            this.game.audioMgr.playStart();
        }
        if (game.labGameId)
            game.labGameId.string = data.gameNo;
    }

    private handleReady = (data: any) => {
        if (this.game) {
            let p = this.game.playerMgr.getPlayerByServerPos(data.rPos);
            if (p) {
                p.changeState(PlayerStates.READY);
            }
        }
    }
    private handleUserLost = (data: any) => {
        if (!this.game) {
            return;
        }
        let p = this.game.playerMgr.getPlayerByServerPos(data.rPos);
        if (!p) {
            return;
        }
        if (p.isMe) {
            // this.game.returnLobby();
            util.showConfirm("您已掉线！");
        } else {
            if (p.state === PlayerStates.READY) {
                p.changeState(PlayerStates.UNREADY);
            }
        }
    }

    private handleLeave = (data: any) => {
        if (!this.game) {
            return;
        }
        let p = this.game.playerMgr.getPlayerByServerPos(data.rPos);

        if (p && p.isMe) {
            if (data.reason !== 4) {
                this.removeEventListeners();
                this.game.returnLobby().then(() => {
                    this.handleLeaveReason(data.reason);
                });
            }
        } else {
            this.game.playerMgr.setPlayerLeave(data.rPos);
        }
    }

    private handleAuto = (data: any) => {
        if (this.game) {
            let p = this.game.playerMgr.getPlayerByServerPos(data.rPos);
            if (p && p.isMe) {
                this.game.returnLobby();
            }
        }
    }

    //游戏end
    private handleEnd = (data: { startKickTime?: number }) => {
        let game = this.game;
        if (game) {
            let me = game.playerMgr.me;
            if (me && !me.isLooker && me.gameMoney !== undefined) {
                User.instance.money = me.gameMoney;
            }
            game.isGaming = false;
            game.setGameEnd();
            if (game.gameName === GameId.DDZ || game.gameName === GameId.PDK || game.gameName === GameId.ERMJ)
                game.dontPrepare = true;
            game.initRound();
            if (data.startKickTime) {
                game.showPrepareTicker(data.startKickTime);
            }
        }
    }

    private handleLocationChange(data: { rPos: number; location: string }) {
        let game = this.game;
        if (game) {
            let player = game.playerMgr.getPlayerByServerPos(data.rPos);
            if (!player) {
                return;
            }
            player.updateLocation(data.location);
        }
    }

    private handleChangeRoomSuccess = (data: any) => {
        // 强制换桌后必然是准备状态
        this.game.pullRoomData().then(ok => {
            if (ok && !this.game.isGaming) {
                this.game.doPrepare();
            }
        });
        util.showTip("为了防止作弊，换桌成功");
    }
}