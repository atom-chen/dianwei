import PdkPlayer from "./pdkPlayer";

import PlayerMgr from "../game-share/playerMgr";
import Game, { PlayerInfo } from "../game-share/game";
import * as util from "../common/util";


export default class PdkPlayerMgr extends PlayerMgr<PdkPlayer> {
    playerCount = 3;

    initEnable() {
        this.playerArr.forEach(player => {
            if (player && player.uid) {
                player.onEnable();
            }
        });
    }

    setRemainCard() {
        this.playerArr.forEach(player => {
            player.setCurrCardNum();
        });
    }

    getNextPlayer(): PdkPlayer {
        for (const player of this.playerArr) {
            if (player.isRightPlayer) {
                return player;
            }
        }
        return;
    }

    clearCards() {
        this.playerArr.forEach(player => {
            if (player) {
                player.cleanCards();
                player.setCardsLayout(true);
            }
        });
    }

}
