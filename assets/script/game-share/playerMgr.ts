import Player, { PlayerStates } from "./player";
import Game, { PlayerInfo } from "./game";
import * as util from "../common/util";

export default abstract class PlayerMgr<T extends Player> {

    playerCount = 5;
    playerArr: T[];
    serverPlayers: { [serverPos: number]: T } = {};
    seatOffset = 0;
    isRotate: boolean = undefined;
    protected startIndex = 0;

    constructor(protected game: Game) {
        game.players.forEach(p => {
            p.hide();
        });
        this.playerArr = [];
        for (let i in game.players) {

            let p = game.players[i];
            let newNode = util.instantiate(p.node);
            p.node.parent.addChild(newNode);
            newNode.setSiblingIndex(p.node.getSiblingIndex() + 1);
            let newP = newNode.getComponent(Player);
            newP.seat = +i;
            this.playerArr.push(newP as T);
            p.node.active = false;
        }
    }

    get me() {
        return this.playerArr[0];
    }

    //改变所有玩家状态
    changeState(state: number) {
        this.playerArr.forEach(player => {
            if (player && player.uid) {
                player.changeState(state);
            }
        });
    }

    //改变游戏中玩家的状态
    changeGamerState(state: number) {
        this.gamer.forEach(g => {
            if (g && g.uid) {
                g.changeState(state);
            }
        })
    }

    getPlayerCount() {
        return this.playerArr.filter(player => player && player.uid).length;
    }

    //准备好的人数
    get readyCount() {
        return this.playerArr.filter(player => player && player.uid && player.state === PlayerStates.READY).length;
    }

    //通过seat获取玩家
    getPlayerBySeat(seat: number): T {
        return this.playerArr[seat];
    }

    /**根据服务器次序获取玩家 */
    getPlayerByServerPos(pos: number): T {
        return this.serverPlayers[pos];
    }

    //得到庄家
    getDealer() {
        for (let player of this.playerArr) {
            if (player && player.uid && player.isDealer) {
                return player;
            }
        }
        return null;
    }

    // 设置玩家进入，isGaming游戏是否正在进行
    setPlayerEnter(data: PlayerInfo, reCome = false, ani = true) {
        let realSeat = data.pos - this.seatOffset;
        if (realSeat < 0) {
            realSeat += this.playerCount;
        }
        let p = this.getPlayerBySeat(realSeat + this.startIndex);
        if (!p) {
            cc.log("RRRRRRRRRRRRRRRRRRRRRRRRRRRRRR")
            return;
        }
        //重入的玩家是正常的
        if (p.uid !== 0 && !reCome) {
            cc.warn("重复的进入：%o", data);
            return;
        }
        p.init(this.game);
        p.updateId(1);

        p.gender = data.gender; // 更新头像之前先更新性别，因为头像是根据性别取的
        p.updateLocation(data.location);
        //有其一------------------------
        p.updateMoney(data.money);
        //-------------------------------
        p.updateHead(data.avatar);
        p.serverPos = data.pos;
        this.serverPlayers[data.pos] = p;

        cc.log("setPlayerEnter  ", data.pos, this.serverPlayers)

        p.enterAni(ani);
        if (data.bReady) {
            if (this.game.isGaming) {
                p.changeState(PlayerStates.STARTED);
            } else {
                p.changeState(PlayerStates.READY);
            }
        } else {
            if (reCome) {
                p.changeState(PlayerStates.STARTED);
            } else {
                p.changeState(PlayerStates.UNREADY);
            }
        }
    }

    //设置玩家离开
    setPlayerLeave(pos: number) {
        if (this.serverPlayers[pos]) {
            this.serverPlayers[pos].uid = 0;
            this.serverPlayers[pos].leaveHideOthers();
            this.serverPlayers[pos].leaveAni();
            delete this.serverPlayers[pos];
        }
    }

    clearAllPlayer() {
        if (!this.serverPlayers) return;
        for (let i = 0; i < 5; i++) {
            if (this.serverPlayers[i]) {
                this.serverPlayers[i].uid = 0;
            }
        }
    }

    release() {
        this.playerArr.forEach(player => {
            player.release();
        });
    }

    updatePlayers(data?: PlayerInfo[]) {
        this.playerArr.forEach(player => {
            if (player.uid && player.isReady) {
                player.changeState(PlayerStates.STARTED);
            }
        });
        if (data) {
            data.forEach(info => {
                let player = this.getPlayerByServerPos(info.pos);
                if (player) {
                    player.gender = info.gender;
                    player.updateHead(info.avatar);
                    player.updateLocation(info.location);
                    player.updateMoney(info.money);
                }
            });
        }
    }

    hidePlayers() {
        this.playerArr.forEach(p => {
            if (p && p.uid && !p.isMe) {
                p.updateMoney();
                p.updateHead(-1);
                p.updateLocation("--");
            }
        });
    }

    initCustomSeat() {
        this.playerArr.forEach(player => {
            if (player.uid) {
                return;
            }
            player.init(this.game);
            player.clear();
        })
    }

    get gamer() {
        return this.playerArr.filter(p => !p.isLooker);
    }

    abstract clearCards(): void;
}
