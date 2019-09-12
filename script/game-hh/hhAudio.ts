import Audio from "../common/audio";

const { ccclass, property } = cc._decorator;

@ccclass
export default class HHAudio extends Audio {
    @property(cc.AudioClip)
    private bgm: string = undefined;

    @property(cc.AudioClip)
    private startBet: string = undefined;

    @property(cc.AudioClip)
    private stopBet: string = undefined;

    @property(cc.AudioClip)
    private bet: string = undefined;

    @property(cc.AudioClip)
    private doBet: string = undefined;

    @property(cc.AudioClip)
    private flipCard: string = undefined;

    @property(cc.AudioClip)
    private showCard: string = undefined;

    @property(cc.AudioClip)
    private winBet: string = undefined;

    @property(cc.AudioClip)
    private alert: string = undefined;

    @property([cc.AudioClip])
    private shapeArr: string[] = [];

    onLoad() {
        this.playMusic();
    }

    playMusic() {
        Audio.playMusic(this.bgm);
    }

    playStart() {
    }

    playAlert() {
        this.play(this.alert);
    }

    playStartBet() {
        this.play(this.startBet);
    }

    playStopBet() {
        this.play(this.stopBet);
    }

    playBet() {
        this.play(this.bet);
    }

    playDoBeting() {
        this.play(this.doBet);
    }

    playFlip() {
        this.play(this.flipCard);
    }

    playShow() {
        this.play(this.showCard);
    }

    playShape(shape: number) {
        this.play(this.shapeArr[shape]);
    }

    playWinBet() {
        this.play(this.winBet);
    }

    onDestroy() {
        this.stopMusic();
    }

}
