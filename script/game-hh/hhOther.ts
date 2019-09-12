import hhGame from "./hhGame";
import { instantiate, parseLocation, getAvatar } from "../common/util";
import { Gender } from "../common/user";

const { ccclass, property } = cc._decorator;

@ccclass
export default class HHOther extends cc.Component {
    @property(cc.Node)
    private oSvContent: cc.Node = undefined;

    @property(cc.Node)
    private oSvItem: cc.Node = undefined;

    @property([cc.SpriteFrame])
    private sfBg: cc.SpriteFrame[] = [];

    @property([cc.SpriteFrame])
    private goldBg: cc.SpriteFrame[] = [];

    private game: hhGame;
    setGame(game: hhGame) {
        this.game = game;
    }

    show() {
        this.node.active = true;
        this.oSvItem.active = false;

        let people = this.game.playerMgr.getAllPlayerInfo().concat();
        if (!people || people.length === 0) return;

        people.sort((a, b) => {
            return b.winCount - a.winCount;
        })
        let dsPos = people[0].pos;
        let dsPlayerInfo;
        for (let idx = 0; idx < people.length; idx++) {
            let info = people[idx]
            if (info.pos === dsPos) {
                dsPlayerInfo = info;
                people.splice(idx, 1);
                break;
            }
        }

        people.sort((a, b) => {
            return b.totalBets - a.totalBets;
        })
        people.unshift(dsPlayerInfo);
        cc.log(people);
        for (let idx = 0; idx < people.length; idx++) {
            let playInfo = people[idx];
            let item;
            if (idx < this.oSvContent.childrenCount - 1) {
                item = this.oSvContent.children[idx];
            } else {
                item = instantiate(this.oSvItem);
                this.oSvContent.addChild(item);
            }
            item.active = true;

            let bg = item.getComponent(cc.Sprite);
            let logo1 = item.getChildByName("logo1");
            let logo2 = item.getChildByName("logo2");
            let sort1 = logo2.getComponentInChildren(cc.Label);
            let logo3 = item.getChildByName("logo3");
            let sort2 = logo3.getComponentInChildren(cc.Label);
            let head = item.getChildByName("def1").getComponentInChildren(cc.Sprite);
            let loc = item.getChildByName("loc").getComponent(cc.Label);
            let money = item.getChildByName("bg").getComponentInChildren(cc.Label);
            let bet = item.getChildByName("bet").getComponent(cc.Label);
            let winNum = item.getChildByName("win").getComponent(cc.Label);
            let goldBg = item.getChildByName("bg").getComponent(cc.Sprite);
            if (idx === 0) {
                logo1.active = true;
                logo2.active = false;
                logo3.active = false;
            } else if (idx < 9) {
                logo1.active = false;
                logo2.active = true;
                logo3.active = false;
                sort1.string = idx.toString();
            } else {
                logo1.active = false;
                logo2.active = false;
                logo3.active = true;
                sort2.string = idx.toString();
            }
            if (idx < 2) {
                bg.spriteFrame = this.sfBg[0];
                goldBg.spriteFrame = this.goldBg[0];
            } else {
                bg.spriteFrame = this.sfBg[1];
                goldBg.spriteFrame = this.goldBg[1];
            }
            head.spriteFrame = getAvatar((playInfo.gender === Gender.MALE), playInfo.avatar);
            loc.string = parseLocation(playInfo.location) ? parseLocation(playInfo.location) : "--";
            money.string = playInfo.money;
            if (playInfo.totalBets !== undefined && playInfo.winCount !== undefined) {
                bet.string = playInfo.totalBets.toString();
                winNum.string = playInfo.winCount.toString();
            } else {
                bet.string = "0";
                winNum.string = "0";
            }
        }

        if (people.length < this.oSvContent.childrenCount) {
            for (let idx = people.length; idx < this.oSvContent.childrenCount; idx++) {
                let item = this.oSvContent.children[idx];
                item.active = false;
            }
        }
    }

    hide() {
        this.node.active = false;
    }
}