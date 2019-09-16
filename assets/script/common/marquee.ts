import { getGameName } from "./util";

const { ccclass, property } = cc._decorator;

@ccclass
export default class Marquee extends cc.Component {

    @property(cc.RichText)
    private richContent: cc.RichText = null;

    @property
    private showAd = false;

    @property
    private speed = 1;

    @property
    private spanNotice = 2;

    @property
    private spanAds = 3;

    private ads: string[] = [];

    private notices: { content: string, level: string }[] = [];

    private adIndex = 0;

    private shouldMove = false;

    private showingNotice = false;

    private convertFromLaya(str: string) {
        str = str.replace(/(.*)>(.*)\|(.*)<(.*)/g, "$1>$2$3<$4");
        return str.replace(/<span color='(.*?)'>(.*?)<\/span>/g, "<color=$1>$2</c>");
    }

    protected onLoad() {
        if (this.showAd) {
            window.pomelo.request("lobby.lobbyHandler.getAdvertisements", {}, (data: { code: number, advertisements?: string[] }) => {
                if (data.code !== 200 || !data.advertisements) {
                    return;
                }
                this.ads = [];
                data.advertisements.forEach(a => {
                    let s = this.convertFromLaya(a);
                    this.ads.push(s);
                });
                this.showAds();
            });
        }

        window.pomelo.on("globalNotice", this.onReceiveNotice.bind(this));
        this.node.active = false;
    }

    private onReceiveNotice(data: { content: string, level: string }) {
        let newAnnouncement = data.content;
        let reg = /\^\w+\^/g;
        let match = data.content.match(reg);
        if (match && match.length > 0) {
            let content = match[0];
            // 用gid来获取游戏名
            let name = getGameName(content.substr(1, content.length - 2));
            newAnnouncement = data.content.replace(reg, name);
        }
        data.content = newAnnouncement;

        if (this.showingNotice) {
            if (this.notices.length >= 10) {
                return;
            }
            if (this.notices.some(a => a.content === data.content)) {
                return;
            }
            this.notices.push(data);
            return;
        }
        this.richContent.string = this.convertFromLaya(data.content);
        this.showingNotice = true;
        this.resetRich();
    }

    private showNextNotice() {
        if (!this.notices || this.notices.length === 0) {
            return;
        }
        this.notices.sort((a, b) => {
            return +a.level - +b.level;
        });
        let notice = this.notices.shift();
        this.onReceiveNotice(notice);
    }

    private showAds() {
        if (!this.ads || this.ads.length === 0) {
            return;
        }
        let ad = this.ads[this.adIndex];
        if (this.adIndex >= this.ads.length) {
            this.adIndex = 0;
            ad = this.ads[this.adIndex];
        }
        this.adIndex++;
        this.richContent.string = ad;
        this.resetRich();
    }

    private resetRich() {
        this.node.active = true;
        this.node.stopAllActions();
        this.node.opacity = 0;
        this.node.runAction(cc.fadeIn(1));
        let node = this.richContent.node;
        let parent = node.parent;
        node.x = parent.width / 2 + 20 * this.speed;
        this.shouldMove = true;
    }

    protected update() {
        if (!this.shouldMove) {
            return;
        }
        let node = this.richContent.node;
        let parent = node.parent;
        node.x -= this.speed;
        if (node.x + node.width < -parent.width / 2) {
            this.shouldMove = false;

            let action;
            if (this.showAd) {
                if (!this.showingNotice) {
                    action = cc.sequence(
                        cc.fadeOut(1),
                        cc.delayTime(this.spanAds),
                        cc.callFunc(this.showAds, this)
                    );
                } else {
                    this.showingNotice = false;
                    if (!this.notices || this.notices.length === 0) {
                        action = cc.sequence(
                            cc.fadeOut(1),
                            cc.delayTime(this.spanNotice),
                            cc.callFunc(this.showAds, this)
                        );
                    } else {
                        action = cc.sequence(
                            cc.fadeOut(1),
                            cc.delayTime(this.spanNotice),
                            cc.callFunc(this.showNextNotice, this)
                        );
                    }
                }
            } else {
                action = cc.fadeOut(1);
            }

            this.node.runAction(action);
        }
    }

    protected onDestroy() {
        window.pomelo.off("globalNotice");
    }
}