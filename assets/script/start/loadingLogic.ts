import Start from "./start";
import Login from "./login";
import AudioStart from "./audioStart";
import g from "../g";
import ItemNames from "../common/itemNames";

const { ccclass, property } = cc._decorator;

@ccclass
export default class LoadingLogic extends cc.Component {

    @property(Start)
    nodeStart: Start = undefined;

    @property(Login)
    nodeLogin: Login = undefined;

    @property(AudioStart)
    nodeAudio: AudioStart = undefined;


    onLoad() {
        this.nodeStart.node.active = false;
        this.nodeLogin.node.active = false;
        this.nodeStart.loadingLogic = this;
    }

    async start() {
        if (g.firstLoading) {
            this.showStart();
            g.firstLoading = false;
        }
    }

    private showStart() {
        this.nodeStart.node.active = true;
        this.nodeLogin.node.active = false;
        this.nodeAudio.playMusic();
    }

    showLogin() {
        this.nodeStart.node.active = false;
        this.nodeLogin.node.active = true;
        if (cc.sys.isNative && g.act) {
            this.nodeLogin.showLoginInfo();
        }
    }

    showMobile() {
        this.nodeStart.node.active = false;
        this.nodeLogin.node.active = true;
        this.nodeLogin.quickShowMobile();
    }
}
