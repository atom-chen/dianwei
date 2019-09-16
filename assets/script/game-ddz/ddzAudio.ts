import Audio from "../common/audio";
import { CardPoint, CardColor } from "../game-share/dpPokerAlgorithm";

const { ccclass, property } = cc._decorator;

@ccclass
export default class DdzAudio extends Audio {
    @property(cc.AudioClip)
    private bgmNor1: string = undefined;

    @property(cc.AudioClip)
    private bgmNor2: string = undefined;

    @property(cc.AudioClip)
    private bgmRocket: string = undefined;

    @property(cc.AudioClip)
    private bgmExciting: string = undefined;

    @property(cc.AudioClip)
    private click: string = undefined;

    @property(cc.AudioClip)
    private initHolds: string = undefined;

    @property(cc.AudioClip)
    private gameWin: string = undefined;

    @property(cc.AudioClip)
    private gameLose: string = undefined;

    @property(cc.AudioClip)
    private alert: string = undefined;

    @property(cc.AudioClip)
    private bomb: string = undefined;

    @property(cc.AudioClip)
    private wang_bomb: string = undefined;

    @property(cc.AudioClip)
    private chuntian: string = undefined;

    @property(cc.AudioClip)
    private plane: string = undefined;

    @property(cc.AudioClip)
    private dizhu: string = undefined;

    @property([cc.AudioClip])
    private playCard: string[] = [];

    // --------------------------------man
    @property([cc.AudioClip])
    private m_single: string[] = [];

    @property([cc.AudioClip])
    private m_double: string[] = [];

    @property([cc.AudioClip])
    private m_tuple: string[] = [];

    @property([cc.AudioClip])
    private m_baojing: string[] = [];

    @property([cc.AudioClip])
    private m_buyao: string[] = [];

    @property([cc.AudioClip])
    private m_dani: string[] = [];

    @property([cc.AudioClip])
    private m_score: string[] = [];

    @property([cc.AudioClip])
    private m_addMul: string[] = [];

    @property(cc.AudioClip)
    private m_feiji: string = undefined;

    @property(cc.AudioClip)
    private m_shunzi: string = undefined;

    @property(cc.AudioClip)
    private m_liandui: string = undefined;

    @property(cc.AudioClip)
    private m_sandaiyi: string = undefined;

    @property(cc.AudioClip)
    private m_sandaiyidui: string = undefined;

    @property(cc.AudioClip)
    private m_sidaier: string = undefined;

    @property(cc.AudioClip)
    private m_sidailiangdui: string = undefined;

    @property(cc.AudioClip)
    private m_zhadan: string = undefined;

    @property(cc.AudioClip)
    private m_wangzha: string = undefined;

    // --------------------------------woman
    @property([cc.AudioClip])
    private w_single: string[] = [];

    @property([cc.AudioClip])
    private w_double: string[] = [];

    @property([cc.AudioClip])
    private w_tuple: string[] = [];

    @property([cc.AudioClip])
    private w_baojing: string[] = [];

    @property([cc.AudioClip])
    private w_buyao: string[] = [];

    @property([cc.AudioClip])
    private w_dani: string[] = [];

    @property([cc.AudioClip])
    private w_score: string[] = [];

    @property([cc.AudioClip])
    private w_addMul: string[] = [];

    @property(cc.AudioClip)
    private w_feiji: string = undefined;

    @property(cc.AudioClip)
    private w_shunzi: string = undefined;

    @property(cc.AudioClip)
    private w_liandui: string = undefined;

    @property(cc.AudioClip)
    private w_sandaiyi: string = undefined;

    @property(cc.AudioClip)
    private w_sandaiyidui: string = undefined;

    @property(cc.AudioClip)
    private w_sidaier: string = undefined;

    @property(cc.AudioClip)
    private w_sidailiangdui: string = undefined;

    @property(cc.AudioClip)
    private w_zhadan: string = undefined;

    @property(cc.AudioClip)
    private w_wangzha: string = undefined;


    onLoad() {
        this.playMusic();
    }

    playOutCard() {
        let random = Math.floor(Math.random() * 2);
        this.play(this.playCard[random]);
    }

    playSuc() {
        this.play(this.gameWin);
    }

    playFail() {
        this.play(this.gameLose);
    }

    playInitHolds() {
        this.play(this.initHolds);
    }

    playScore(isMale: boolean, score: number) {
        if (isMale) {
            this.play(this.m_score[score]);
        } else {
            this.play(this.w_score[score]);
        }
    }

    playAddMul(isMale: boolean, mul: number) {
        if (isMale) {
            this.play(this.m_addMul[mul - 1]);
        } else {
            this.play(this.w_addMul[mul - 1]);
        }
    }

    playSingle(isMale: boolean, cardData: number) {
        let num = this.getCardNumber(cardData);
        if (isMale) {
            this.play(this.m_single[num - 1]);
        } else {
            this.play(this.w_single[num - 1]);
        }
    }

    playDouble(isMale: boolean, cardData: number) {
        let num = this.getCardNumber(cardData);
        if (isMale) {
            this.play(this.m_double[num - 1]);
        } else {
            this.play(this.w_double[num - 1]);
        }
    }

    playTuple(isMale: boolean, cardData: number) {
        let num = this.getCardNumber(cardData);
        if (isMale) {
            this.play(this.m_tuple[num - 1]);
        } else {
            this.play(this.w_tuple[num - 1]);
        }
    }

    playBuyao(isMale: boolean) {
        let random = Math.floor(Math.random() * 4);
        if (isMale) {
            this.play(this.m_buyao[random]);
        } else {
            this.play(this.w_buyao[random]);
        }
    }

    playDani(isMale: boolean) {
        let random = Math.floor(Math.random() * 3);
        if (isMale) {
            this.play(this.m_dani[random]);
        } else {
            this.play(this.w_dani[random]);
        }
    }

    playFeiji(isMale: boolean) {
        if (isMale) {
            this.play(this.m_feiji);
        } else {
            this.play(this.w_feiji);
        }
    }

    playShunzi(isMale: boolean) {
        if (isMale) {
            this.play(this.m_shunzi);
        } else {
            this.play(this.w_shunzi);
        }
    }

    playLiandui(isMale: boolean) {
        if (isMale) {
            this.play(this.m_liandui);
        } else {
            this.play(this.w_liandui);
        }
    }

    playSandaiyi(isMale: boolean) {
        if (isMale) {
            this.play(this.m_sandaiyi);
        } else {
            this.play(this.w_sandaiyi);
        }
    }

    playSandaiyidui(isMale: boolean) {
        if (isMale) {
            this.play(this.m_sandaiyidui);
        } else {
            this.play(this.w_sandaiyidui);
        }
    }

    playSidaier(isMale: boolean) {
        if (isMale) {
            this.play(this.m_sidaier);
        } else {
            this.play(this.w_sidaier);
        }
    }

    playSidailiangdui(isMale: boolean) {
        if (isMale) {
            this.play(this.m_sidailiangdui);
        } else {
            this.play(this.w_sidailiangdui);
        }
    }

    playZhadan(isMale: boolean) {
        if (isMale) {
            this.play(this.m_zhadan);
        } else {
            this.play(this.w_zhadan);
        }
    }

    playWangZha(isMale: boolean) {
        if (isMale) {
            this.play(this.m_wangzha);
        } else {
            this.play(this.w_wangzha);
        }
        this.playRocketBgm();
    }

    playBaojing(isMale: boolean, remindNum: number) {
        if (isMale) {
            this.play(this.m_baojing[remindNum - 1]);
        } else {
            this.play(this.w_baojing[remindNum - 1]);
        }

        this.stopMusic();
        Audio.playMusic(this.bgmExciting);
    }

    playQuRenDizhu() {
        this.play(this.dizhu);
    }

    /**
     * 报警
     */
    playAlert() {
        this.play(this.alert);
    }

    playAnimBomb() {
        this.play(this.bomb);
    }

    playAnimWangBomb() {
        this.play(this.wang_bomb);
    }

    playAnimCT() {
        this.play(this.chuntian);
    }

    playAnimPlane() {
        this.play(this.plane);
    }

    playMusic() {
        this.stopMusic();
        let bgIdx = Math.floor(Math.random() * 2);
        let bgm = (bgIdx === 0) ? this.bgmNor1 : this.bgmNor2;
        Audio.playMusic(bgm);
    }

    playRocketBgm() {
        this.stopMusic();
        Audio.playMusic(this.bgmRocket);
    }

    playStartSound() {
        this.play(this.clipStart);
    }

    onDestroy() {
        this.stopMusic();
    }

    private getCardNumber(cardData: number) {
        let point = cardData & 0xff;
        let cardNumber: number = CardPoint.POINT_A;
        if (point === CardPoint.POINT_A) {
            cardNumber = 1;
        } else if (point === CardPoint.POINT_2) {
            cardNumber = 2;
        } else if (point === CardPoint.POINT_SMALL_JOKER) {
            cardNumber = 14;
        } else if (point === CardPoint.POINT_BIG_JOKER) {
            cardNumber = 15;
        } else {
            cardNumber = point;
        }
        return cardNumber;
    }

}
