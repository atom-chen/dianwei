import PopActionBox from "../lobby/popActionBox"
import * as util from "../common/util";
import g from "../g";
import { UserInfo, Where, User } from "../common/user";
import { AUDIO_KEY, AUDIO_STATUS } from "../common/audio";
import { returnToLogin } from "../common/util";
import Game from "../game-share/game";
import ItemNames from "../common/itemNames";
import Audio from "../common/audio";

const { ccclass, property } = cc._decorator;

const localStorage = cc.sys.localStorage;
@ccclass
export class Setting extends PopActionBox {
    @property(cc.Button)
    btnMusic: cc.Button = undefined;

    @property(cc.Button)
    btnSound: cc.Button = undefined;

    @property(cc.Node)
    nodeLogin: cc.Node = undefined;

    @property([cc.SpriteFrame])
    sfAudio: cc.SpriteFrame[] = [];

    @property(cc.Label)
    private labVer: cc.Label = undefined;



    @property(cc.Prefab)
    private preDebug: cc.Prefab = undefined;

    OFFICIAL_URL = g.serviceCfg.web;

    private game: Game;
    private debugFlag = 0;

    onLoad() {
        super.onLoad();

    }

    start() {
        super.start();
        this.setDefault();

        this.labVer.string = g.hotVer;
    }

    hideReLogin() {
        this.nodeLogin.active = false;;
    }

    onClickDebug(e: cc.Event, data: string) {
        this.debugFlag = this.debugFlag | +data;
        if (this.debugFlag === 3) {
            this.debugFlag = 0;
            let ui = util.instantiate(this.preDebug);
            let canvas = cc.find("Canvas");
            canvas.addChild(ui, 1000);
        }
    }

    onClickMusic() {
        if (+Audio.configs[AUDIO_KEY.MUSIC] === AUDIO_STATUS.OPEN) {
            this.setMusic(AUDIO_STATUS.CLOSE);
        } else {
            this.setMusic(AUDIO_STATUS.OPEN);
        }
    }

    onClickCopy() {
        if (util.setClipboard(this.OFFICIAL_URL)) util.showTip("官网地址复制成功!");
    }

    onClickSound() {
        if (+Audio.configs[AUDIO_KEY.SOUND] === AUDIO_STATUS.OPEN) {
            this.setSound(AUDIO_STATUS.CLOSE);
        } else {
            this.setSound(AUDIO_STATUS.OPEN);
        }
    }

    setDefault() {
        let data = Audio.configs;
        // let music = +data[AUDIO_KEY.MUSIC];
        // if (music === null) {
        //     data[AUDIO_KEY.MUSIC] = 1;
        // }
        // let sound = +data[AUDIO_KEY.SOUND];
        // if (sound === null) {
        //     data[AUDIO_KEY.SOUND] = 1;
        // }
        // localStorage.setItem(ItemNames.audio, JSON.stringify(data));

        if (data[AUDIO_KEY.MUSIC] === AUDIO_STATUS.OPEN) {
            this.btnMusic.getComponent(cc.Sprite).spriteFrame = this.sfAudio[0];
        } else {
            this.btnMusic.getComponent(cc.Sprite).spriteFrame = this.sfAudio[1];
        }

        if (data[AUDIO_KEY.SOUND] === AUDIO_STATUS.OPEN) {
            this.btnSound.getComponent(cc.Sprite).spriteFrame = this.sfAudio[0];
        } else {
            this.btnSound.getComponent(cc.Sprite).spriteFrame = this.sfAudio[1];
        }
    }

    setMusic(flag: number) {
        if (flag !== undefined) {
            Audio.configs[AUDIO_KEY.MUSIC] = flag;
            Audio.saveConfig();
            if (flag === AUDIO_STATUS.OPEN) {
                this.btnMusic.getComponent(cc.Sprite).spriteFrame = this.sfAudio[0];
                let currBgmClip = g.lobby.currBgmClip;
                if (currBgmClip != "")
                    Audio.playMusic(currBgmClip);
            } else {
                this.btnMusic.getComponent(cc.Sprite).spriteFrame = this.sfAudio[1];
                cc.audioEngine.stopAll();
            }
        }
    }
    setSound(flag: number) {
        if (flag !== undefined) {
            if (flag === AUDIO_STATUS.OPEN) {
                this.btnSound.getComponent(cc.Sprite).spriteFrame = this.sfAudio[0];
            } else {
                this.btnSound.getComponent(cc.Sprite).spriteFrame = this.sfAudio[1];
            }
            Audio.configs[AUDIO_KEY.SOUND] = flag;
            Audio.saveConfig();
        }
    }


    private async onClickReLogin() {
        // if (this.game) {
        //     await this.game.returnLobby();
        // }
        returnToLogin();
    }

    setGame(game: Game) {
        this.game = game;
    }
}
