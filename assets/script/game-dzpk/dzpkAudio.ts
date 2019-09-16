import Audio from "../common/audio";
import { DZPKCardType } from "./dzpkGame";
import { DZPKAction } from "./dzpkPlayer";

const { ccclass, property } = cc._decorator;

@ccclass
export default class DZPKAudio extends Audio {

    @property(cc.AudioClip)
    bgm: string = undefined;

    @property([cc.AudioClip])
    chip: string[] = [];
    @property(cc.AudioClip)
    meWin: string = undefined;

    @property(cc.AudioClip)
    dealCard: string = undefined;

    @property(cc.AudioClip)
    alarm: string = undefined;

    @property([cc.AudioClip])
    win: string[] = [];

    @property([cc.AudioClip])
    m_call: string[] = [];

    @property([cc.AudioClip])
    m_pass: string[] = [];

    @property([cc.AudioClip])
    m_raise: string[] = [];

    @property([cc.AudioClip])
    m_discard: string[] = [];

    @property([cc.AudioClip])
    m_showHand: string[] = [];

    @property([cc.AudioClip])
    w_call: string[] = [];

    @property([cc.AudioClip])
    w_pass: string[] = [];

    @property([cc.AudioClip])
    w_raise: string[] = [];

    @property([cc.AudioClip])
    w_discard: string[] = [];

    @property([cc.AudioClip])
    w_showHand: string[] = [];

    onLoad() {
        // cc.log(this.clipWin);
        this.playMusic();
    }

    playMusic() {
        Audio.playMusic(this.bgm);
    }

    noticeWin(cardType: DZPKCardType) {
        this.play(this.win[cardType]);
    }

    playCheer() {
        this.play(this.meWin);
    }
    private getRandomClip(clipArray: string[]) {
        return clipArray[Math.floor(Math.random() * clipArray.length)];
    }

    noticeAction(male: boolean, action: DZPKAction) {
        if (male) {
            switch (action) {
                case DZPKAction.Call:
                    this.play(this.getRandomClip(this.m_call));
                    break;
                case DZPKAction.Discard:
                    this.play(this.getRandomClip(this.m_discard));
                    break;
                case DZPKAction.Check:
                    this.play(this.getRandomClip(this.m_pass));
                    break;
                case DZPKAction.Raise:
                    this.play(this.getRandomClip(this.m_raise));
                    break;
                case DZPKAction.AllIn:
                    this.play(this.getRandomClip(this.m_showHand));
                    break;
            }
        } else {
            switch (action) {
                case DZPKAction.Call:
                    this.play(this.getRandomClip(this.w_call));
                    break;
                case DZPKAction.Discard:
                    this.play(this.getRandomClip(this.w_discard));
                    break;
                case DZPKAction.Check:
                    this.play(this.getRandomClip(this.w_pass));
                    break;
                case DZPKAction.Raise:
                    this.play(this.getRandomClip(this.w_raise));
                    break;
                case DZPKAction.AllIn:
                    this.play(this.getRandomClip(this.w_showHand));
                    break;
            }
        }
    }

    noticeDealCard() {
        this.play(this.dealCard);
    }

    noticeMoveChips() {
        this.play(this.getRandomClip(this.chip));
    }

    noticeTurnOver() {
        this.play(this.alarm);
    }

    onDestroy() {
        this.stopMusic();
    }
}
