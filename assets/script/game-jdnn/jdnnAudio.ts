import Audio from "../common/audio";
import { BullType } from "./jdnnGame";

const { ccclass, property } = cc._decorator;

@ccclass
export default class JDNNAudio extends Audio {

    @property(cc.AudioClip)
    private bgm: string = undefined;

    @property(cc.AudioClip)
    private deal: string = undefined;

    @property(cc.AudioClip)
    private bet: string = undefined;

    @property(cc.AudioClip)
    private dealerChoosing: string = undefined;

    @property(cc.AudioClip)
    private dealerChosen: string = undefined;

    @property(cc.AudioClip)
    private m_bulls: string[] = [];

    @property(cc.AudioClip)
    private w_bulls: string[] = [];

    @property(cc.AudioClip)
    private win: string = undefined;

    @property(cc.AudioClip)
    private winAll: string = undefined;

    @property(cc.AudioClip)
    private lose: string = undefined;

    @property(cc.AudioClip)
    private chips: string = undefined;

    protected onLoad() {
        this.playMusic();
    }

    playMusic() {
        Audio.playMusic(this.bgm);
    }

    playDeal() {
        this.play(this.deal);
    }

    playBet() {
        this.play(this.bet);
    }

    playDealerChoosing() {
        this.play(this.dealerChoosing);
    }

    playDealerChoose() {
        this.play(this.dealerChosen);
    }

    playBull(bullType: BullType, male: boolean) {
        let bulls = male ? this.m_bulls : this.w_bulls;
        this.play(bulls[bullType]);
    }

    playWin() {
        this.play(this.win);
    }

    playWinAll() {
        this.play(this.winAll);
    }

    playLose() {
        this.play(this.lose);
    }

    playChips() {
        this.play(this.chips);
    }
}
