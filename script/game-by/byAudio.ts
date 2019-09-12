import ItemNames from "../common/itemNames";
import g from "../g";
import BYFishMgr from "./byFishMgr";
import { getFishKindType } from "./byUtil"
const { ccclass, property } = cc._decorator;


export enum AUDIO_KEY {
    KEY = "AUDIO_KEY",
    MUSIC = "music",
    SOUND = "sound",
}
export enum AUDIO_STATUS {
    CLOSE,
    OPEN,
}

@ccclass
export default abstract class BYAudio extends cc.Component {

    // @property(cc.AudioClip)
    // protected clipStart: string = undefined;

    // @property(cc.AudioClip)
    // protected clipClick: string = undefined;

    @property([cc.AudioClip])
    protected normalBgMArr: string[] = [];  // 普通背景音乐
    @property([cc.AudioClip])
    protected bossBgMArr: string[] = []; // boss进行时的 背景音乐
    @property([cc.AudioClip])
    protected bigFishDieSoundArr: string[] = [];  // 大型鱼死亡
    @property([cc.AudioClip])
    protected midFishDieSoundArr: string[] = []; // 中型鱼死亡
    @property(cc.AudioClip)
    protected bossDieSound: string = undefined; // boss死亡
    @property(cc.AudioClip)
    protected mermaidDieSound: string = undefined; // 美人鱼死亡

    @property([cc.AudioClip])
    protected coinSoundArr: string[] = []; // 收金币
    @property([cc.AudioClip])
    protected bulletSoundArr: string[] = []; // 发子弹
    @property([cc.AudioClip])
    protected hitSoundArr: string[] = []; // 击中鱼
    @property(cc.AudioClip)
    protected buttonClickSound: string = undefined; // 按钮点击
    @property(cc.AudioClip)
    protected boltSound: string = undefined;  // 闪电

    @property(cc.AudioClip)
    protected fishtideSound: string = undefined; // 鱼潮
    @property(cc.AudioClip)
    protected boomFishSound: string = undefined; // 爆炸鱼爆炸
    @property(cc.AudioClip)
    protected forzeSound: string = undefined; // 冰冻
    @property(cc.AudioClip)
    protected facaileSound: string = undefined; // 发财了
    @property(cc.AudioClip)
    protected bossComingSound: string = undefined; // boss来临 动画的时候 的 音效
    @property(cc.AudioClip)
    protected changeRatioSound: string = undefined; // 点击 切换炮台的 倍率
    @property(cc.AudioClip)
    protected bigFishDeathBoomSound: string = undefined; // 用于61号金魁鲇及以上的鱼种死亡爆炸音

    private playingBgm: number;
    private playCoinCoundIng = false;


    public static fishDeathSound: { [key: string]: number } = {
        "24": 0, "31": 1, "32": 2, "33": 3, "34": 4, "35": 5, "42": 6, "43": 7, "44": 8, "45": 9, "46": 10, "51": 11, "52": 12, "53": 13, "61": 14,
        "62": 15, "63": 16, "64": 17, "65": 18,
    };

    public fishDeathSoundOn: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    private static _configs: { [keyName: string]: number };

    onLoad() {
    }

    onDestroy() {
        cc.audioEngine.stopAll();
    }

    static loadConfig() {
        let data: { [keyName: string]: number } = { "music": AUDIO_STATUS.OPEN, "sound": AUDIO_STATUS.OPEN };

        let val = cc.sys.localStorage.getItem(ItemNames.audio);
        if (val) data = JSON.parse(val);

        BYAudio._configs = data;
    }
    protected playMusic(clip: string) {
        this.stopMusic();
        g.lobby.currBgmClip = clip;
        BYAudio.loadConfig();
        if (+BYAudio._configs[AUDIO_KEY.MUSIC] == AUDIO_STATUS.OPEN) {
            this.playingBgm = cc.audioEngine.play(clip, true, 1);
        }
    }

    public playNormalBgMusic() {
        this.playMusic(this.normalBgMArr[0]);
    }

    public playBossingBgMusic(type: number) {
        let rand = Math.random() * this.bossBgMArr.length;
        rand = Math.floor(rand);

        if (rand >= this.bossBgMArr.length) {
            rand = 0;
        }
        this.playMusic(this.bossBgMArr[0]);
    }

    public playBossComingSound() {


        this.play(this.bossComingSound);
    }

    public playShootBulletSound(type: number) {

        this.play(this.bulletSoundArr[type]);
    }

    // 0 少量  1 中量  2 少量
    public playCoinSound(type: number) {

        let time = 0.5;
        if (type == 1) {
            time = 1;
        }
        if (!this.playCoinCoundIng) {
            this.playCoinCoundIng = true;
            this.play(this.coinSoundArr[type]);
            this.scheduleOnce(() => {
                this.playCoinCoundIng = false;
            }, time);
        }

    }

    public playHitSound(type: number) {
        this.play(this.hitSoundArr[type]);
    }

    // public playChangeGunSound() {

    //     this.play(this.changeGunSound);
    // }

    public playChangeRatioSound() {
        this.play(this.changeRatioSound);
    }

    public playButtonClickSound() {
        this.play(this.buttonClickSound);
    }

    public playMidFishDieSound(fishType: number) {

        let xx = fishType + "";
        let index = BYAudio.fishDeathSound[xx];
        if (index == undefined) {
            return;
        }
        if (this.fishDeathSoundOn[index] == 0) {
            this.fishDeathSoundOn[index] = 1;
            this.play(this.midFishDieSoundArr[index]);
            this.scheduleOnce(() => {
                this.fishDeathSoundOn[index] = 0;
            }, 2);
        }
    }

    public playBigFishDieSound() {
        this.play(this.bigFishDieSoundArr[0]);
    }

    public playBoltSound() {
        this.play(this.boltSound);
    }

    public playFishtideSound() {
        this.play(this.fishtideSound);

    }

    public playBoomFishSound() {
        this.play(this.boomFishSound);
    }

    public playForzeSound() {
        this.play(this.forzeSound);
    }

    public playFacailiSound() {
        this.play(this.facaileSound);
    }

    public playMeirenDieSound() {
        this.play(this.mermaidDieSound);
    }

    // public playMeireningSound() {
    //     let rand = Math.random() * 3;
    //     rand = Math.floor(rand);
    //     if (rand == 3) {
    //         rand = 0;
    //     }
    //     this.play(this.mermaiSound[rand]);
    // }

    public playBossDieSound() {
        this.play(this.bossDieSound);
    }

    public playBigFishDeathBoomSound() {
        this.play(this.bigFishDeathBoomSound);
    }




    pauseMusic() {
        if (!this.playingBgm) {
            return;
        }
        cc.audioEngine.pause(this.playingBgm);
    }

    resumeMusic() {
        if (!this.playingBgm) {
            return;
        }
        cc.audioEngine.resume(this.playingBgm);
    }

    stopMusic() {
        if (!this.playingBgm) {
            cc.log("stopMusic = =this.playingBgm === ", this.playingBgm);
            return;
        }
        cc.audioEngine.stop(this.playingBgm);
    }

    stopAllMusic() {
        cc.audioEngine.stopAll();
    }

    play(clip: string, loop = false) {
        BYAudio.loadConfig();
        if (+BYAudio._configs[AUDIO_KEY.SOUND] == AUDIO_STATUS.OPEN) {
            cc.audioEngine.play(clip, loop, 1);
        }
    }

    delFishDie(fishType: number) {
        let tmpFish = getFishKindType(fishType);
        if (tmpFish > 3 && tmpFish < 9) {
            this.playBigFishDieSound();
        }
        this.playMidFishDieSound(fishType);
        if (fishType === BYFishMgr.bossFishType) {
            this.playNormalBgMusic();
            this.playBossDieSound();
        } else if (fishType === BYFishMgr.mermaidType) {
            this.playMeirenDieSound();
        } else if (fishType > 60 && fishType != BYFishMgr.frozenType) {
            this.playBigFishDeathBoomSound();
        }
    }


}