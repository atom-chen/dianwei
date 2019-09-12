import Audio from "../common/audio";

const { ccclass, property } = cc._decorator;

@ccclass
export default class LhdzAudio extends Audio {
    @property(cc.AudioClip)
    private bgm: string = undefined;

    @property(cc.AudioClip)
    private vs: string = undefined;

    @property(cc.AudioClip)
    private startBet: string = undefined;

    @property(cc.AudioClip)
    private stopBet: string = undefined;

    @property(cc.AudioClip)
    private doBet: string = undefined;

    @property(cc.AudioClip)
    private bet: string = undefined;

    @property(cc.AudioClip)
    private flipCard: string = undefined;

    @property(cc.AudioClip)
    private showCard: string = undefined;

    @property(cc.AudioClip)
    private winBet: string = undefined;

    @property([cc.AudioClip])
    private lhWinBets: string[] = [];

    @property([cc.AudioClip])
    private points: string[] = [];

    onLoad() {
        this.playMusic();
    }

    playMusic() {
        Audio.playMusic(this.bgm);
    }

    playStart() {
    }

    playStartBet() {
        this.play(this.startBet);
    }

    playStopBet() {
        this.play(this.stopBet);
    }

    playDoBeting() {
        this.play(this.doBet);
    }

    playBet() {
        this.play(this.bet);
    }

    playFlip() {
        this.play(this.flipCard);
    }

    playShow() {
        this.play(this.showCard);
    }

    playWinBet() {
        this.play(this.winBet);
    }

    playWinArea(area: number) {
        this.play(this.lhWinBets[area]);
    }

    playPoint(cardData: number) {
        let realPoint: number = cardData & 0x0f;
        this.play(this.points[realPoint - 1]);
    }

    playVsSound() {
        this.play(this.vs);
    }

    onDestroy() {
        this.stopMusic();
    }

}
