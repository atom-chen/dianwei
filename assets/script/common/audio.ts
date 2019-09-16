import g from "../g";
import ItemNames from "../common/itemNames";

const { ccclass, property } = cc._decorator;

export enum AUDIO_KEY { MUSIC = "music", SOUND = "sound" }
export enum AUDIO_STATUS { CLOSE, OPEN }

@ccclass
export default abstract class Audio extends cc.Component {

    @property(cc.AudioClip)
    protected clipStart: string = undefined;

    @property(cc.AudioClip)
    protected clipClick: string = undefined;

    @property(cc.AudioClip)
    private countdown: string = undefined;

    @property(cc.AudioClip)
    private rechargeSucc: string = undefined;

    static playingBgm: number;

    private static _configs: { [keyName: string]: number };

    static loadConfig() {
        let data: { [keyName: string]: number } = { "music": AUDIO_STATUS.OPEN, "sound": AUDIO_STATUS.OPEN };
        let val = cc.sys.localStorage.getItem(ItemNames.audio);
        if (val) data = JSON.parse(val);
        Audio._configs = data;
    }
    static saveConfig() {
        cc.sys.localStorage.setItem(ItemNames.audio, JSON.stringify(Audio._configs));
    }

    static playMusic(clip: string) {
        g.lobby.currBgmClip = clip;
        if (+Audio.configs[AUDIO_KEY.MUSIC] == AUDIO_STATUS.OPEN) {
            Audio.playingBgm = cc.audioEngine.play(clip, true, 1);
        }
    }

    onDestroy() {
        cc.audioEngine.stopAll();
    }

    stopMusic() {
        if (!Audio.playingBgm) {
            return;
        }
        cc.audioEngine.stop(Audio.playingBgm);
    }

    play(clip: string, loop = false) {
        if (+Audio.configs[AUDIO_KEY.SOUND] == AUDIO_STATUS.OPEN)
            return cc.audioEngine.play(clip, loop, 1);
    }

    stop(id: number) {
        cc.audioEngine.stop(id);
    }

    static get configs() {
        if (!Audio._configs) {
            Audio.loadConfig();
        }
        return Audio._configs;
    }

    /**
     * 播放游戏开始音效
     *
     * @memberof Audio
     */
    playStart() {
        this.play(this.clipStart);
    }

    playClick() {
        this.play(this.clipClick);
    }

    playClock() {
        this.play(this.countdown);
    }

    playRechargeSucc() {
        this.play(this.rechargeSucc);
    }
}