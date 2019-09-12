import PlayerMgr from "../game-share/playerMgr";
import NNPlayer from "./nnPlayer";

export default class NNPlayerMgr extends PlayerMgr<NNPlayer> {
    clearCards(): void {
        for (let player of this.playerArr) {
            if (player && player.uid) {
                player.clearCards();
            }
        }
    }

}