import PlayerMgr from "../game-share/playerMgr";
import ErmjPlayer from "./ermjPlayer";

export default class ErmjPlayerMgr extends PlayerMgr<ErmjPlayer> {
    playerCount = 2;

    setPlayerDealer(pos: number) {
        for (let player of this.playerArr) {
            if (player && (player.serverPos === pos)) {
                player.setDealerVisb(true);
            } else {
                player.setDealerVisb(false);
            }
        }
    }

    initHold(holdData: number[]) {
        for (let player of this.playerArr) {
            if (player) {
                player.initHold(holdData);
            }
        }
    }

    initRound() {
        for (let player of this.playerArr) {
            if (player && player.isInitUI) {
                player.initRound();
                player.hidePointer();
            }
        }
    }

    hidePointer() {
        for (let player of this.playerArr) {
            if (player) {
                player.hidePointer();
            }
        }
    }

    clearCards() { }

    clearAllLeavePlayer() {
        for (let player of this.playerArr) {
            if (player && player.isLeave) {
                this.setPlayerLeave(player.serverPos);
            }
        }
    }

    setPlayerLeave(pos: number) {
        if (this.serverPlayers[pos]) {
                this.serverPlayers[pos].leaveAni();

            if (!this.game.isGaming) {
                this.serverPlayers[pos].uid = 0;
                this.serverPlayers[pos].leaveHideOthers();
                delete this.serverPlayers[pos];
            }
        }
    }
}
