import Audio from "../common/audio";

const { ccclass, property } = cc._decorator;

@ccclass
export default class AudioLobby extends Audio {
    @property(cc.AudioClip)
    adBg: string = undefined;

    onLoad() {
        Audio.playMusic(this.adBg);
    }
}
