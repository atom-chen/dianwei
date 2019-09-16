import Audio from "../common/audio";

const {ccclass, property} = cc._decorator;

@ccclass
export default class QHBAudio extends Audio {
    @property(cc.AudioClip)
    private bgm: string = undefined;

    @property(cc.AudioClip)
    private clickGrab: string = undefined;

    @property(cc.AudioClip)
    private boom: string = undefined;

    @property(cc.AudioClip)
    private bigWin: string = undefined;

    @property(cc.AudioClip)
    private grabed: string = undefined;

    @property(cc.AudioClip)
    private notGrabed: string = undefined;



    onLoad() {
        this.playMusic();
    }

    playMusic() {
        Audio.playMusic(this.bgm);
    }

    playClickGrabBtn() {
        this.play(this.clickGrab);
    }

    playBoom() {
        this.play(this.boom);
    }

    playBigWin() {
        this.play(this.bigWin);
    }

    playGrabed() {
        this.play(this.grabed);
    }

    playNotGrabed() {
        this.play(this.notGrabed);
    }
}
