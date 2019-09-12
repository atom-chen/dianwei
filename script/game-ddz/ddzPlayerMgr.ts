import DdzPlayer from "./ddzPlayer";

import PlayerMgr from "../game-share/playerMgr";
import Game, { PlayerInfo } from "../game-share/game";
import * as util from "../common/util";


export default class DdzPlayerMgr extends PlayerMgr<DdzPlayer> {
    playerCount = 3;

    initEnable() {
        this.playerArr.forEach(player => {
            if (player && player.uid) {
                player.onEnable();
            }
        });
    }

    endJiaoFen() {
        this.playerArr.forEach(player => {
            player.hideAllStatus();
        });
    }

    setRemainCard() {
        this.playerArr.forEach(player => {
            player.setCurrCardNum();
        });
    }

    turnAddMul(leftTime: number) {
        this.playerArr.forEach(player => {
            if (!player.addMul && !player.isDealer) {
                player.setWaitTime(leftTime);
            }
        });
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
