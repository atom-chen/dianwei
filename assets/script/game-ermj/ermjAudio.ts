import Audio from "../common/audio";
import AudioSuit from "./ermjAudioSuit";
import * as ermj from "./ermj";


const { ccclass, property } = cc._decorator;

@ccclass
export default class ErmjAudio extends Audio {
    @property(cc.AudioClip)
    private bgm: string = undefined;

    @property(cc.AudioClip)
    private endQue: string = undefined;

    @property(cc.AudioClip)
    private eff_gf: string = undefined;

    @property(cc.AudioClip)
    private eff_xy: string = undefined;

    @property(cc.AudioClip)
    private eff_hu: string = undefined;

    @property(cc.AudioClip)
    private eff_draw: string = undefined;

    @property([cc.AudioClip])
    private m_chi: string[] = [];

    @property([cc.AudioClip])
    private m_peng: string[] = [];

    @property(cc.AudioClip)
    private m_gang: string = undefined;
    @property(cc.AudioClip)
    private m_double: string = undefined;

    @property(cc.AudioClip)
    private m_gf: string = undefined;

    @property(cc.AudioClip)
    private m_xy: string = undefined;

    @property([cc.AudioClip])
    private m_hu: string[] = [];

    @property([cc.AudioClip])
    private w_chi: string[] = [];
    @property([cc.AudioClip])
    private w_peng: string[] = [];

    @property(cc.AudioClip)
    private w_gang: string = undefined;
    @property(cc.AudioClip)
    private w_double: string = undefined;

    @property(cc.AudioClip)
    private w_gf: string = undefined;

    @property(cc.AudioClip)
    private w_xy: string = undefined;

    @property([cc.AudioClip])
    private w_hu: string[] = [];


    @property(AudioSuit)
    private eff_wan: AudioSuit = undefined;

    @property(AudioSuit)
    private eff_feng: AudioSuit = undefined;

    @property(AudioSuit)
    private eff_jian: AudioSuit = undefined;

    onLoad() {
        this.playMusic();
    }

    playMusic() {
        Audio.playMusic(this.bgm);
    }

    playComDraw() {
        this.play(this.eff_draw);
    }

    playEndQue() {
        this.play(this.endQue);
    }

    playComGf() {
        this.play(this.eff_gf);
    }

    playComXy() {
        this.play(this.eff_xy);
    }

    playComHu() {
        this.play(this.eff_hu);
    }

    getClipIdx(length: number) {
        return Math.floor(Math.random() * length);
    }

    playPeng(isMale: boolean) {
        let pengArr: string[] = [];
        if (isMale) {
            pengArr = this.m_peng;
        } else {
            pengArr = this.w_peng;
        }
        let clip = pengArr[this.getClipIdx(pengArr.length)];
        this.play(clip);
    }

    playChi(isMale: boolean) {
        let chiArr: string[] = [];
        if (isMale) {
            chiArr = this.m_chi;
        } else {
            chiArr = this.w_chi;
        }
        let clip = chiArr[this.getClipIdx(chiArr.length)];
        this.play(clip);
    }

    playGang(isMale: boolean) {
        if (isMale) {
            this.play(this.m_gang);
        } else {
            this.play(this.w_gang);
        }
    }

    playDouble(isMale: boolean) {
        if (isMale) {
            this.play(this.m_double);
        } else {
            this.play(this.w_double);
        }
    }

    playGangGf(isMale: boolean) {
        this.playComGf();
        let gangType = Math.floor(Math.random() * 2);
        if (gangType === 0) {
            this.playGang(isMale);
        } else {
            if (isMale) {
                this.play(this.m_gf);
            } else {
                this.play(this.w_gf);
            }
        }
    }

    playGangXy(isMale: boolean) {
        this.playComXy();
        let gangType = Math.floor(Math.random() * 2);
        if (gangType === 0) {
            this.playGang(isMale);
        } else {
            if (isMale) {
                this.play(this.m_xy);
            } else {
                this.play(this.w_xy);
            }
        }
    }

    playHu(isMale: boolean, isZimo: boolean, isJp: boolean) {
        if (isMale) {
            if (!isJp) {
                if (!isZimo) {
                    this.play(this.m_hu[0]);
                } else {
                    this.play(this.m_hu[1]);
                }
            } else {
                this.play(this.m_hu[2]);
            }
        } else {
            if (!isJp) {
                if (!isZimo) {
                    this.play(this.w_hu[0]);
                } else {
                    this.play(this.w_hu[1]);
                }
            } else {
                this.play(this.w_hu[2]);
            }
        }
    }

    playDraw(isMale: boolean, paiVal: number) {
        let suit = Math.floor(paiVal / 10);
        let rank = paiVal % 10;
        let clip: string;
        if (suit === ermj.MJ_TYPE_PAI.MJ_TYPE_PAI_WAN) {
            clip = this.eff_wan.getAudioClip(isMale, rank);
        } else if (suit === ermj.MJ_TYPE_PAI.MJ_TYPE_PAI_FENG) {
            clip = this.eff_feng.getAudioClip(isMale, rank);
        } else if (suit === ermj.MJ_TYPE_PAI.MJ_TYPE_PAI_HUA) {
            clip = this.eff_jian.getAudioClip(isMale, rank);
        }
        if (clip) {
            this.play(clip);
        }
    }

    onDestroy() {
        this.stopMusic();
    }

}
