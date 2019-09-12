import Audio from "../common/audio";

const { ccclass, property } = cc._decorator;

@ccclass
export default class BrnnAudio extends Audio {
    @property(cc.AudioClip)
    private bgm: string = undefined;

    @property(cc.AudioClip)
    private coin: string = undefined;

    @property(cc.AudioClip)
    private coins: string = undefined;

    @property(cc.AudioClip)
    private sendCard: string = undefined;

    @property(cc.AudioClip)
    private doBet: string = undefined;

    @property(cc.AudioClip)
    private win: string = undefined;

    @property(cc.AudioClip)
    private lose: string = undefined;

    @property([cc.AudioClip])
    private m_BullArr: string[] = [];

    @property([cc.AudioClip])
    private w_BullArr: string[] = [];

    @property(cc.AudioClip)
    private m_BullBoom: string = undefined;

    @property(cc.AudioClip)
    private w_BullBoom: string = undefined;

    @property(cc.AudioClip)
    private m_BullMarbled: string = undefined;

    @property(cc.AudioClip)
    private w_BullMarbled: string = undefined;

    @property(cc.AudioClip)
    private m_BullSmall: string = undefined;

    @property(cc.AudioClip)
    private w_BullSmall: string = undefined;

    onLoad() {
        this.playMusic();
    }

    playMusic() {
        Audio.playMusic(this.bgm);
    }

    playStart() {
    }

    playStartSound() {
        this.play(this.clipStart);
    }

    playCoin() {
        this.play(this.coin);
    }

    playCoins() {
        this.play(this.coins);
    }

    playSendCard() {
        this.play(this.sendCard);
    }

    playDoBeting() {
        this.play(this.doBet);
    }

    playWin() {
        this.play(this.win);
    }

    playLose() {
        this.play(this.lose);
    }

    playBull(isMale: boolean, nnType: number) {
        if (isMale) {
            this.play(this.m_BullArr[nnType]);
        } else {
            this.play(this.w_BullArr[nnType]);
        }
    }

    playBullBoom(isMale: boolean) {
        if (isMale) {
            this.play(this.m_BullBoom);
        } else {
            this.play(this.w_BullBoom);
        }
    }

    playBullMarbled(isMale: boolean) {
        if (isMale) {
            this.play(this.m_BullMarbled);
        } else {
            this.play(this.w_BullMarbled);
        }
    }

    playBullSmall(isMale: boolean) {
        if (isMale) {
            this.play(this.m_BullSmall);
        } else {
            this.play(this.w_BullSmall);
        }
    }

    onDestroy() {
        this.stopMusic();
    }

}