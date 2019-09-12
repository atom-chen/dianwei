import PlayerMgr from "../game-share/playerMgr";
import JDNNPlayer from "./jdnnPlayer";

export default class JDNNPlayerMgr extends PlayerMgr<JDNNPlayer> {
    clearCards(): void {
        for (let player of this.playerArr) {
            if (player && player.uid) {
                player.clearCards();
            }
        }
    }

}