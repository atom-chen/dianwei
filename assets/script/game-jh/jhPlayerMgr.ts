import PlayerMgr from "../game-share/playerMgr";
import JHPlayer from "./jhPlayer";
import JHGame from "./jhGame";
import JHHero from "./jhHero";

export default class JHPlayerMgr extends PlayerMgr<JHPlayer> {
    protected game: JHGame;
    get me() {
        return this.playerArr[0] as JHHero;
    }
    clearCards(): void {
        for (let player of this.playerArr) {
            if (player && player.uid) {
                player.clearCards();
            }
        }
    }

    async drawFakeCards() {
        for (let p of this.playerArr) {
            if (!p.uid || p.isLooker) {
                continue;
            }
            for (let i = 0; i < 3; i++) {
                p.addCards(i, 0);
                await new Promise(resolve => setTimeout(resolve, 50));
            }
        }
    }

    hideLooked() {
        this.playerArr.forEach(p => {
            if (!p.uid || p.isLooker) {
                return;
            }
            p.updateLooked(false);
        });
    }

    endTurn() {
        this.playerArr.forEach(p => {
            if (!p.uid || p.isLooker || !p.isTuring) {
                return;
            }
            p.endTurn();
        });
    }

    setPlayersActive() {
        this.playerArr.forEach(p => {
            if (p && p.uid) {
                p.getPkNode().active = true;
            }
        });
    }
}