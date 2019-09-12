import Audio from "../common/audio";
import { Gender } from "../common/user";
import { JHAction } from "./jhPlayer";
const { ccclass, property } = cc._decorator;


@ccclass
export default class JHAudio extends Audio {
    @property(cc.AudioClip)
    private bgm: string = undefined;

    @property(cc.AudioClip)
    private dealCard: string = undefined;

    @property([cc.AudioClip])
    private m_call: string[] = [];

    @property([cc.AudioClip])
    private m_raise: string[] = [];

    @property([cc.AudioClip])
    private m_discard: string[] = [];

    @property([cc.AudioClip])
    private m_allIn: string[] = [];

    @property([cc.AudioClip])
    private m_look: string[] = [];

    @property([cc.AudioClip])
    private m_pk: string[] = [];

    @property([cc.AudioClip])
    private w_call: string[] = [];

    @property([cc.AudioClip])
    private w_raise: string[] = [];

    @property([cc.AudioClip])
    private w_discard: string[] = [];

    @property([cc.AudioClip])
    private w_allIn: string[] = [];

    @property(cc.AudioClip)
    private af_allIn: string = undefined;

    @property([cc.AudioClip])
    private w_look: string[] = [];

    @property([cc.AudioClip])
    private w_pk: string[] = [];

    @property(cc.AudioClip)
    private pk: string = undefined;

    @property(cc.AudioClip)
    private pkLose: string = undefined;

    @property(cc.AudioClip)
    private win: string = undefined;

    @property(cc.AudioClip)
    private straightGold: string = undefined;

    @property(cc.AudioClip)
    private leopard: string = undefined;

    @property(cc.AudioClip)
    private alarm: string = undefined;

    @property([cc.AudioClip])
    private chip: string[] = [];

    @property(cc.AudioClip)
    private magic: string = undefined;

    private _allInId: number;

    onLoad() {
        // cc.log(this.clipWin);
        this.playMusic();
    }

    playMusic() {
        Audio.playMusic(this.bgm);
    }

    onDestroy() {
        this.stopMusic();
    }

    playChip() {
        this.play(this.getRandomClip(this.chip));
    }

    playDealCard() {
        this.play(this.dealCard);
    }

    private getRandomClip(clipArray: string[]) {
        return clipArray[Math.floor(Math.random() * clipArray.length)];
    }

    noticeAction(male: boolean, action: JHAction) {
        if (male) {
            switch (action) {
                case JHAction.Call:
                    this.play(this.getRandomClip(this.m_call));
                    break;
                case JHAction.Discard:
                    this.play(this.getRandomClip(this.m_discard));
                    break;
                case JHAction.Raise:
                    this.play(this.getRandomClip(this.m_raise));
                    break;
                case JHAction.AllIn:
                    this.play(this.getRandomClip(this.m_allIn));
                    break;
            }
        } else {
            switch (action) {
                case JHAction.Call:
                    this.play(this.getRandomClip(this.w_call));
                    break;
                case JHAction.Discard:
                    this.play(this.getRandomClip(this.w_discard));
                    break;
                case JHAction.Raise:
                    this.play(this.getRandomClip(this.w_raise));
                    break;
                case JHAction.AllIn:
                    this.play(this.getRandomClip(this.w_allIn));
                    break;
            }
        }
    }

    playAllIn(play: boolean) {
        if (play) {
            if (this._allInId) {
                return;
            }
            this._allInId = this.play(this.af_allIn, true);
        } else {
            if (this._allInId !== undefined) {
                this.stop(this._allInId);
                this._allInId = undefined;
            }
        }
    }

    noticeLookCard(male: boolean) {
        this.play(this.getRandomClip(male ? this.m_look : this.w_look));
    }

    noticePk(male: boolean) {
        this.play(this.getRandomClip(male ? this.m_pk : this.w_pk));
    }

    playPk() {
        this.play(this.pk);
    }

    playSoundWin() {
        this.play(this.win);
    }

    playSoundStraightGold() {
        this.play(this.straightGold);
    }

    playSoundLeopard() {
        this.play(this.leopard);
    }

    playSoundAlarm() {
        this.play(this.alarm);
    }

    playSoundPkLose() {
        this.play(this.pkLose);
    }

    playSoundMagic() {
        this.play(this.magic);
    }
}
