import HHPlayer from "./hhPlayer";
import HHGame from "./hhGame";

import PlayerMgr from "../game-share/playerMgr";
import Game from "../game-share/game";
import { add } from "../common/util";
const { ccclass, property, menu } = cc._decorator;

interface PlayerInfo {
    money?: string;
    avatar: number;
    gender: number;
    pos: number;
    location?: string;
    winCount?: number,
    totalBets?: number,
}

@ccclass
export default class HHPlayerMgr extends PlayerMgr<HHPlayer> {
    playerCount = 5;  // 实际桌子上的玩家(不包括富豪、赌神)
    private _playerInfoArr: PlayerInfo[];
    private showPlayerNum = 7; // 界面总共显示的玩家
    private bigRegalPos: number;
    private gambleGodPos: number;

    constructor(protected game: HHGame) {
        super(game);
        this._playerInfoArr = [];
    }

    initBets() {
        this.playerArr.forEach(player => {
            if (player && player.uid) {
                player.initBets();
            }
        });
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
            this.updateTablePlayer(data);
        } else {
            this.updateTablePlayer();
        }
    }

    updatePlayer(p: HHPlayer, data: PlayerInfo) {
        p.gender = data.gender; // 更新头像之前先更新性别，因为头像是根据性别取的
        p.init(this.game);
        p.updateId(1);
        p.updateLocation(data.location);
        p.updateMoney(data.money);
        p.updateHead(data.avatar);
        p.serverPos = data.pos;
        p.labPos.string = p.serverPos.toString();
        p.enterAni(true);
        p.initBets();
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

        // 删除不能在桌子上的玩家
        let idx = 0;
        while (idx < people.length) {
            const info = people[idx];
            if (info.pos === this.gambleGodPos || info.pos === this.bigRegalPos || info.pos === this.getMePos()) {
                people.splice(idx, 1);
            } else {
                idx++;
            }
        }

        let newPosTab: number[] = [];
        for (let idx = 0; idx < this.playerCount - 1; idx++) {
            const info = people[idx];
            if (!info) break;
            let tempPlayer = this.playerArr[idx + 1];
            if (tempPlayer.uid) {
                if (tempPlayer.serverPos === info.pos) {
                    continue;
                }
                let isBeforeHaved = false;
                for (let i = 0; i < newPosTab.length; i++) {
                    const p = newPosTab[i];
                    if (p === tempPlayer.serverPos) {
                        isBeforeHaved = true;
                        break;
                    }
                }
                // 删除此排名之前并且不包含的旧玩家
                if (!isBeforeHaved) {
                    this.serverPlayers[tempPlayer.serverPos].uid = 0;
                    delete this.serverPlayers[tempPlayer.serverPos];
                }
            }
            this.updatePlayer(tempPlayer, info);
            this.serverPlayers[info.pos] = tempPlayer;
            newPosTab.push(info.pos);
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

    getMePos() {
        return this.seatOffset;
    }

    updateBalance(pos: number, money: string | number) {
        let playerInfo = this._playerInfoArr.filter((info: any) => {
            return (info.pos === pos);
        })[0];
        if (playerInfo) {
            playerInfo.money = add(money, 0).toString();
        }
    }

    private getEmptySeat(): HHPlayer {
        let emptyPlayerArr = this.playerArr.filter((player: HHPlayer) => {
            return (player.seat !== 0 && player.uid === 0);
        });

        // 随机选个座位
        let p = emptyPlayerArr[0];
        return p;
    }

    getAllPlayerInfo() {
        return this._playerInfoArr;
    }

    getInfoByPos(pos: number) {
        let playerInfo = this._playerInfoArr.filter((info: any) => {
            return (info.pos === pos);
        })[0];
        return playerInfo;
    }

    updatePlayerInfo(pos: number, chgMoney: string | number) {
        let playerInfo = this._playerInfoArr.filter((info: any) => {
            return (info.pos === pos);
        })[0];
        if (playerInfo) {
            playerInfo.money = add(playerInfo.money, chgMoney).toString();
        }
    }

    /**
     * 设置富豪、赌神
     */
    setBigRegalGambleGodPos() {
        let people = this._playerInfoArr.concat();
        if (!people) return;
        people.sort((a, b) => {
            return b.winCount - a.winCount;
        });
        if (!people[0]) return;

        let rPosGambleGod = people[0].pos;
        people.sort((a, b) => {
            return b.totalBets - a.totalBets;
        });
        let rPosBigRegal = people[0].pos;

        this.game.isExistFh = true;
        this.game.isExistDs = true;

        let oldBigRegalPos = this.bigRegalPos;
        let oldGambleGodPos = this.gambleGodPos;

        // 先设置好新富豪、赌神的位置，防止老富豪、老赌神在桌子上找不到座位坐下
        this.bigRegalPos = rPosBigRegal;
        this.gambleGodPos = rPosGambleGod;
        if (oldBigRegalPos !== rPosBigRegal) {
            this.chgBigRegalGambleGod(oldBigRegalPos, rPosBigRegal, this.game.fhPlayer);
        }
        if (oldGambleGodPos !== rPosGambleGod) {
            this.chgBigRegalGambleGod(oldGambleGodPos, rPosGambleGod, this.game.dsPlayer);
        }
    }

    setPlayerLeave(pos: number, isDismiss: boolean = false) {
        super.setPlayerLeave(pos);
        if (!isDismiss) {
            for (let idx = 0; idx < this._playerInfoArr.length; idx++) {
                let leavePlayerInfo = this._playerInfoArr[idx];
                if (leavePlayerInfo.pos === pos) {
                    this._playerInfoArr.splice(idx, 1);
                    break;
                }
            }
            this.findChgPlayer();
            if (pos === this.game.fhPlayer.serverPos) {
                this.game.isExistFh = false;
            }
            if (pos === this.game.dsPlayer.serverPos) {
                this.game.isExistDs = false;
            }
        }
    }

    /**
     * 一个玩家离开则从其他玩家列表中选一个来填补这个位置
     */
    private findChgPlayer() {
        // 是否已坐满
        if (!this.getEmptySeat()) {
            // cc.log("座位已满");
            return;
        }

        for (let playerIdx = 1; playerIdx < this._playerInfoArr.length; playerIdx++) {
            let playInfo = this._playerInfoArr[playerIdx];
            let rPos = playInfo.pos;
            let serverPlayer = this.serverPlayers[rPos];
            if (+playInfo.money <= this.game.MIN_BET) {
                continue;
            }

            if (!serverPlayer && rPos !== this.bigRegalPos && rPos !== this.gambleGodPos) {
                // cc.log("找到桌子位置 = " + playInfo.pos);
                this.setPlayerEnter(playInfo, true);
                break;
            }
        }
    }

    /**
     * 
     * 替换富豪或赌神
     * @param oldPos 
     * @param newPos 
     * @param player 富豪或赌神
     */
    chgBigRegalGambleGod(oldPos: number, newPos: number, player: HHPlayer) {
        // 先把新富豪从桌子中移除
        let newPlayer = this.game.playerMgr.getPlayerByServerPos(newPos);
        if (newPlayer && !newPlayer.isMe) {
            this.setPlayerLeave(newPos, true);
            // cc.log("新富豪从桌子中移除");
        }

        // 再把老富豪移除、放回桌子 或者选个玩家放在桌上
        if (oldPos !== undefined) {
            player.leaveHideOthers();
            player.leaveAni();
            player.serverPos = -1;
            player.specialPlayer = false;
            this.findChgPlayer();
            // cc.log("老富豪移除");
        } else {
            // cc.log("没有老富豪");
            this.findChgPlayer();
        }

        // 最后填补新富豪
        let newPlayerInfo = this._playerInfoArr.filter((info: any) => {
            return (info.pos === newPos);
        })[0];
        if (newPlayerInfo) {
            this.updatePlayer(player, newPlayerInfo);
            player.specialPlayer = true;
            // cc.log("新富豪进入");
        }
    }

    clearCards() { }
}
