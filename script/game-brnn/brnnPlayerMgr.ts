import BrnnPlayer from "./brnnPlayer";

import PlayerMgr from "../game-share/playerMgr";
import Game from "../game-share/game";
import * as util from "../common/util";

interface PlayerInfo {
    money?: string;
    avatar: number;
    gender: number;
    pos: number;
    location?: string;
    winCount?: number,
    totalBets?: number,
}

export default class BrnnPlayerMgr extends PlayerMgr<BrnnPlayer> {
    playerCount = 7;
    private _playerInfoArr: PlayerInfo[];

    constructor(protected game: Game) {
        super(game);
        this._playerInfoArr = [];
    }

    setPlayerEnter(data: PlayerInfo, reCome = false, ani = true) {
        let p = this.getPlayerByServerPos(data.pos);
        if (p) {
            console.log("服务器有玩家1");
            return;
        }

        if (data.pos === this.seatOffset) {
            this._playerInfoArr.push(data);
            p = this.getPlayerBySeat(0);
            this.updatePlayer(p, data);
            this.serverPlayers[data.pos] = p;
        } else if (!reCome) {
            this.updateTablePlayer(data);
        } else {
            this.updateTablePlayer();
        }
    }

    updatePlayer(p: BrnnPlayer, data: PlayerInfo) {
        p.gender = data.gender; // 更新头像之前先更新性别，因为头像是根据性别取的
        p.init(this.game);
        p.updateId(1);
        p.updateLocation(data.location);
        p.updateMoney(data.money);
        p.updateHead(data.avatar);
        p.serverPos = data.pos;
        p.enterAni(true);
    }

    /**
     * 刷新桌上玩家
     * @param data 
     */
    updateTablePlayer(data?: PlayerInfo) {
        if (data) this._playerInfoArr.push(data);
        let people = this._playerInfoArr.concat();
        people.sort((a, b) => {
            return b.totalBets - a.totalBets;
        });
        for (let idx = 0; idx < people.length; idx++) {
            if (people[idx].pos === this.seatOffset) {
                people.splice(idx, 1);
                break;
            }
        }

        for (let idx = 0; idx < this.playerCount - 1; idx++) {
            const info = people[idx];
            if (!info) break;
            let tempPlayer = this.playerArr[idx + 1];
            if (tempPlayer.uid) {
                if (tempPlayer.serverPos === info.pos) {
                    continue;
                }
                this.serverPlayers[tempPlayer.serverPos].uid = 0;
                delete this.serverPlayers[tempPlayer.serverPos];
            }
            this.updatePlayer(tempPlayer, info);
            this.serverPlayers[info.pos] = tempPlayer;
        }
    }

    updateTotalBets(pos: number, totalBets: number, winCount: number) {
        let playerInfo = this._playerInfoArr.filter((info: any) => {
            return (info.pos === pos);
        })[0];
        if (playerInfo) {
            playerInfo.totalBets = totalBets;
            playerInfo.winCount = winCount;
        }
    }

    private getEmptySeat(): BrnnPlayer {
        let emptyPlayerArr = this.playerArr.filter((player: BrnnPlayer) => {
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
            playerInfo.money = util.add(money, 0).toString();
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

    clearCards() { }

}
