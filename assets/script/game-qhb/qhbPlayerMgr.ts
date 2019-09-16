import PlayerMgr from "../game-share/playerMgr";
import QHBPlayer from "./qhbPlayer";
import QHBGame from "./qhbGame";
import { add } from "../common/util";

const {ccclass, property} = cc._decorator;

export interface PlayerInfo {
    money?: string,
    avatar: number,
    gender: number,
    pos: number,
    isGrabbed: number,
    isMaster: number,
    isBoom: number,
    location?: string,
    chgMoney?: string,
    grabMoney?: string,
    noBoomCnt?: number,
    totalSendMoney?: number,
    totalGrabMoney?: number,
}


@ccclass
export default class QHBPlayerMgr extends PlayerMgr<QHBPlayer> {

    playerCount = 1;

    private _playerInfoArr: PlayerInfo[];

    constructor(protected game: QHBGame) {
        super(game);
        this._playerInfoArr = [];
    }

    setPlayerEnter(data: PlayerInfo, reCome = false, ani = true) {
        let p = this.getPlayerByServerPos(data.pos);
        if (p) {
            cc.warn("服务器有玩家1");
            return;
        }

        if (data.pos === this.seatOffset) {
            this._playerInfoArr.push(data);
            p = this.getPlayerBySeat(0);
            this.updatePlayer(p, data);
            this.serverPlayers[data.pos] = p;
        } else if (!reCome) {
            this.savePlayerInfo(data);
        } else {
            this.savePlayerInfo();
        }
    }

    updatePlayer(p: QHBPlayer, data: PlayerInfo) {
        p.gender = data.gender; // 更新头像之前先更新性别，因为头像是根据性别取的
        p.init(this.game);
        p.updateId(1);
        p.updateLocation(data.location);
        p.updateMoney(data.money);
        p.updateHead(data.avatar);
        p.serverPos = data.pos;
        // p.lblPos.string = p.serverPos.toString();
        p.enterAni(false);
        // if (data.pos !== this.seatOffset) p.hide();
    }

    /**
     * 存储玩家信息
     * @param data
     */
    savePlayerInfo(data?: PlayerInfo) {
        if (data) this._playerInfoArr.push(data);
        let people = this._playerInfoArr.concat();
        people.sort((a, b) => {
            return b.totalSendMoney - a.totalSendMoney;
        });
        // for (let idx = 0; idx < people.length; idx++) {
        //     if (people[idx].pos === this.seatOffset) {
        //         people.splice(idx, 1);
        //         break;
        //     }
        // }
        // for (let idx = 0; idx < this.playerCount - 1; idx++) {
        //     const info = people[idx];
        //     if (!info) break;
        //     // let tempPlayer = this.playerArr[idx + 1];
        //     let tempPlayer = new QHBPlayer();
        //     if (tempPlayer.uid) {
        //         if (tempPlayer.serverPos === info.pos) {
        //             continue;
        //         }
        //         this.serverPlayers[tempPlayer.serverPos].uid = 0;
        //         delete this.serverPlayers[tempPlayer.serverPos];
        //     }
        //     this.updatePlayer(tempPlayer, info);
        //     cc.log("_________otherPlayer_________", tempPlayer);
        //     this.serverPlayers[info.pos] = tempPlayer;
        // }
    }

    updateTotalBets(pos: number, totalSendMoney: number, noBoomCnt: number) {
        let playerInfo = this._playerInfoArr.filter((info: any) => {
            return (info.pos === pos);
        })[0];
        if (playerInfo) {
            playerInfo.totalSendMoney = totalSendMoney;
            playerInfo.noBoomCnt = noBoomCnt;
        }
    }

    getMePos() {
        return this.seatOffset;
    }

    getMySelf() {
        return this.playerArr[0];
    }

    updateBalance(pos: number, money: string | number) {
        let playerInfo = this._playerInfoArr.filter((info: any) => {
            return (info.pos === pos);
        })[0];
        if (playerInfo) {
            playerInfo.money = add(money, 0).toString();
        }
    }

    private getEmptySeat(): QHBPlayer {
        let emptyPlayerArr = this.playerArr.filter((player: QHBPlayer) => {
            return (player.seat !== 0 && player.uid === 0);
        });

        let p = emptyPlayerArr[Math.floor(Math.random() * emptyPlayerArr.length)];
        return p;
    }

    getAllPlayerInfo() {
        return this._playerInfoArr;
    }

    // 是否满员
    isPlayerFull() {
        return (this._playerInfoArr.length > this.playerCount);
    }

    getInfoByPos(pos: number) {
        let playerInfo = this._playerInfoArr.filter((info: any) => {
            return (info.pos === pos);
        })[0];
        return playerInfo;
    }

    updatePlayerInfo(pos: number, money: string | number) {
        let playerInfo = this._playerInfoArr.filter((info: any) => {
            return (info.pos === pos);
        })[0];
        if (playerInfo) {
            playerInfo.money = add(money, 0).toString();
        }
    }

    setPlayerLeave(pos: number) {
        super.setPlayerLeave(pos);

        for (let idx = 0; idx < this._playerInfoArr.length; idx++) {
            let leavePlayerInfo = this._playerInfoArr[idx];
            if (leavePlayerInfo.pos === pos) {
                this._playerInfoArr.splice(idx, 1);
                break;
            }
        }

        // 一个玩家离开则从其他玩家列表中选一个来填补这个位置
        let needPlayerNum = this._playerInfoArr.length > this.playerCount ? this.playerCount : this._playerInfoArr.length;
        for (let playerIdx = 1; playerIdx < needPlayerNum; playerIdx++) {
            let playInfo = this._playerInfoArr[playerIdx];
            let serverPlayer = this.serverPlayers[playInfo.pos];
            if (!serverPlayer) {
                this.setPlayerEnter(playInfo, true);
                break;
            }
        }
    }

    // clearAllPlayer() {
    //     super.clearAllPlayer();
    // }

    clearCards() { }
}
