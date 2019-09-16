import PlayerMgr from "../game-share/playerMgr";
import DZPKPlayer from "./dzpkPlayer";
import DZPKGame from "./dzpkGame";
import { PlayerStates } from "../game-share/player";

export interface PlayerInfo {
    money?: string;
    avatar: number;
    gender: number;
    pos: number;
    location?: string;
    name?: string;
    score?: number;
    bReady?: boolean;
    takeMoney?: string;
}
export default class DZPKPlayerMgr extends PlayerMgr<DZPKPlayer> {
    playerCount = 6;
    constructor(protected game: DZPKGame) {
        super(game);

    }
    hideActions() {
        this.playerArr.forEach(p => {
            if (p && p.uid) {
                p.hideAction();
            }
        });
    }

    clearCards() {
        for (let player of this.playerArr) {
            if (player && player.uid) {
                player.clearHandCards();
            }
        }
    }

    resetRoundBets() {
        this.playerArr.forEach(p => {
            if (p && p.uid) {
                p.resetRoundBets();
            }
        });
    }

    updateDealer(doAnim = true) {
        this.playerArr.forEach(p => {
            if (p && p.uid) {
                try {
                    p.becomeDealer(doAnim);
                } catch (error) {
                    cc.warn(error);
                }
            }
        });
    }
    clearAllPlayer() {
        if (this.game && this.game.msg.timeOutId) {
            clearTimeout(this.game.msg.timeOutId);
        }
        super.clearAllPlayer();
    }

    clearAllWaitingTimer() {
        this.playerArr.forEach(p => {
            if (p && p.uid) {
                try {
                    p.clearWaitingTimer();
                } catch (error) {
                    cc.warn(error);
                }
            }
        });
    }


    updatePlayers(data?: PlayerInfo[]) {
        super.updatePlayers(data);
    }

    updatePlayersForTakeMoney(data?: PlayerInfo[]) {
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
                    player.updateShowMoney(info.money);
                }
            });
        }
    }


    setPlayerEnter(data: PlayerInfo, reCome = false, ani = true) {
        let realSeat = data.pos - this.seatOffset;
        if (realSeat < 0) {
            realSeat += this.playerCount;
        }
        let p = this.getPlayerBySeat(realSeat + this.startIndex);
        if (!p) {
            cc.info("RRRRRRRRRRRRRRRRRRRRRRRRRRRRRR")
            return;
        }

        //重入的玩家是正常的
        if (p.uid !== 0 && !reCome) {
            cc.info("重复的进入：%o", data);
            return;
        }
        p.init(this.game);
        p.updateId(1);

        p.gender = data.gender; // 更新头像之前先更新性别，因为头像是根据性别取的
        p.updateLocation(data.location);
        //有其一------------------------
        p.updateMoney(data.money);
        p.updateShowMoney(data.takeMoney);

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

    hidePlayers() {
        this.playerArr.forEach(p => {
            if (p && p.uid && !p.isMe) {
                p.updateShowMoney();
                p.updateHead(-1);
                p.updateLocation("--");
            }
        });
    }


}
