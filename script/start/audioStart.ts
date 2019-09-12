import Audio from "../common/audio";

const { ccclass, property } = cc._decorator;

@ccclass
export default class AudioStart extends Audio {
    @property(cc.AudioClip)
    clipMusic: string = undefined;

    playMusic() {
        Audio.playMusic(this.clipMusic);
    }
}
