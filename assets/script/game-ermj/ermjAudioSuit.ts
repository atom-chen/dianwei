const { ccclass, property } = cc._decorator;

@ccclass
export default class AudioSuit extends cc.Component {
    @property([cc.AudioClip])
    private audioClip1: string[] = [];

    @property([cc.AudioClip])
    private audioClip2: string[] = [];

    @property([cc.AudioClip])
    private audioClip3: string[] = [];

    @property([cc.AudioClip])
    private audioClip4: string[] = [];

    @property([cc.AudioClip])
    private audioClip5: string[] = [];

    @property([cc.AudioClip])
    private audioClip6: string[] = [];

    @property([cc.AudioClip])
    private audioClip7: string[] = [];

    @property([cc.AudioClip])
    private audioClip8: string[] = [];

    @property([cc.AudioClip])
    private audioClip9: string[] = [];


    @property([cc.AudioClip])
    private w_audioClip1: string[] = [];

    @property([cc.AudioClip])
    private w_audioClip2: string[] = [];

    @property([cc.AudioClip])
    private w_audioClip3: string[] = [];

    @property([cc.AudioClip])
    private w_audioClip4: string[] = [];

    @property([cc.AudioClip])
    private w_audioClip5: string[] = [];

    @property([cc.AudioClip])
    private w_audioClip6: string[] = [];

    @property([cc.AudioClip])
    private w_audioClip7: string[] = [];

    @property([cc.AudioClip])
    private w_audioClip8: string[] = [];

    @property([cc.AudioClip])
    private w_audioClip9: string[] = [];

    private maleAudioArr: string[][] = [];
    private femaleAudioArr: string[][] = [];
    onLoad() {
        this.maleAudioArr = [this.audioClip1, this.audioClip2, this.audioClip3, this.audioClip4, this.audioClip5,
        this.audioClip6, this.audioClip7, this.audioClip8, this.audioClip9];
        this.femaleAudioArr = [this.w_audioClip1, this.w_audioClip2, this.w_audioClip3, this.w_audioClip4, this.w_audioClip5,
        this.w_audioClip6, this.w_audioClip7, this.w_audioClip8, this.w_audioClip9];
    }

    getAudioClip(isMale: boolean, rank: number): string {
        let clipArr: string[] = [];
        if (isMale) {
            clipArr = this.maleAudioArr[rank - 1].concat();
        } else {
            clipArr = this.femaleAudioArr[rank - 1].concat();
        }
        return clipArr[Math.floor(Math.random() * clipArr.length)];
    }
}
