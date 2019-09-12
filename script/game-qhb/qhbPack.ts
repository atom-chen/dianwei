import QHBGame from "./qhbGame";
import { BooleanType } from "../game-ermj/ermj";
import { sub, showTip, getAvatar, parseLocation, random, instantiate } from "../common/util";
import { Gender } from "../common/user";
import { redBagInfo } from "./qhbMsg";

const {ccclass, property} = cc._decorator;

@ccclass
export default class QHBPack extends cc.Component {
    @property(cc.Label)
    lblRedBagMoney: cc.Label = undefined;

    @property(cc.Label)
    lblBoomNo: cc.Label = undefined;

    @property(cc.Node)
    ndSelectMoney: cc.Node = undefined;

    @property(cc.Node)
    ndGoldItem: cc.Node = undefined;

    @property(cc.Node)
    ndSelectBoom: cc.Node = undefined;

    @property(cc.Node)
    ndBoomItem: cc.Node = undefined;

    @property(cc.Node)
    ndWaitRedBagList: cc.Node = undefined;

    @property([cc.SpriteFrame])
    sfBg: cc.SpriteFrame[] = [];

    @property(cc.Prefab)
    ndRedBagItem: cc.Prefab = undefined;


    game: QHBGame;

    private redBagMoney: string = undefined;
    private boomNo: number = undefined;

    setGame(game: QHBGame) {
        this.game = game;
    }

    show(moneyList: number[], minMoney: number) {
        this.node.active = true;

        this.showRedBagList();

        this.redBagMoney = moneyList[0].toString();
        this.lblRedBagMoney.string = this.redBagMoney;
        // this.boomNo = 0;

        this.initGoldClickEvents(moneyList);
        this.initBoomClickEvents();
    }

    initGoldClickEvents(moneyList: number[]) {
        let goldCount = this.ndSelectMoney.childrenCount;
        for (let i = 0; i < moneyList.length; i++) {
            let goldItem: cc.Node = undefined;
            if (i < goldCount) {
                goldItem = this.ndSelectMoney.children[i];
            } else {
                goldItem = instantiate(this.ndGoldItem);
                this.ndSelectMoney.addChild(goldItem);
            }
            goldItem.active = true;
            let money = moneyList[i];
            let goldNum = goldItem.getComponentInChildren(cc.Label);
            goldNum.string = money.toString();
            let tg = goldItem.getComponent(cc.Toggle);
            tg.isChecked = false;
            let checkEvents = tg.checkEvents;
            checkEvents.length = 0;
            if (checkEvents.length === 0) {
                let handler = new cc.Component.EventHandler();
                handler.target = this.node;
                handler.component = cc.js.getClassName(this);
                handler.handler = "onClickGold";
                handler.customEventData = money.toString();
                tg.checkEvents.push(handler);
            }
            if (i === 0) {
                tg.isChecked = true;
            }
        }
    }

    initBoomClickEvents() {
        let boomCount = this.ndSelectBoom.childrenCount;
        for (let i = 0; i < 10; i++) {
            let boomItem;
            if (i < boomCount) {
                boomItem = this.ndSelectBoom.children[i];
            } else {
                boomItem = instantiate(this.ndBoomItem);
                this.ndSelectBoom.addChild(boomItem);
            }
            boomItem.active = true;
            let boom = boomItem.getComponentInChildren(cc.Label);
            boom.string = i.toString();
            let tg = boomItem.getComponent(cc.Toggle);
            tg.isChecked = false;
            let checkEvents = tg.checkEvents;
            checkEvents.length = 0;
            if (checkEvents.length === 0) {
                let handler = new cc.Component.EventHandler();
                handler.target = this.node;
                handler.component = cc.js.getClassName(this);
                handler.handler = "onClickBoom";
                handler.customEventData = i.toString();
                tg.checkEvents.push(handler);
            }
        }
    }

    private showRedBagList() {
        if (this.game.redBagList && this.game.redBagList.length > 0) {
            for (let i = 0; i < this.game.redBagList.length; i++) {
                let data = this.game.redBagList[i];
                this.refreshRedBagList(true, data, i+1);
            }
        }
    }

    refreshRedBagList(add: boolean, redBag?: redBagInfo, rank?: number) {
        if (add && redBag) {
            let item = instantiate(this.ndRedBagItem);
            let bg = item.getChildByName("infoBg").getComponent(cc.Sprite);
            let head = item.getChildByName("def").getComponent(cc.Sprite);
            let loc = item.getChildByName("loc").getComponent(cc.Label);
            let boomNo = item.getChildByName("num").getComponent(cc.Label);
            let money = item.getChildByName("money").getComponent(cc.Label);
            let rankNo = item.getChildByName("rank").getComponent(cc.Label);
            let myMark = item.getChildByName("wo_ic");
            let pos = redBag.pos
            let p = this.game.playerMgr.getInfoByPos(pos);
            let myPos = this.game.playerMgr.getMePos();
            if (p) {
                head.spriteFrame = getAvatar((p.gender === Gender.MALE), p.avatar);
                loc.string = parseLocation(p.location);
                boomNo.string = redBag.boomNo.toString();
                money.string = redBag.money;
                if (pos === myPos) {
                    bg.spriteFrame = this.sfBg[0];
                    myMark.active = true;
                } else {
                    bg.spriteFrame = this.sfBg[1];
                    myMark.active = false;
                }
                // cc.log("----------新增抢中红包的玩家-----------", p);
            } else {
                cc.warn(`玩家:${pos}不存在`);
            }
            item.active = true;
            if (rank) {
                rankNo.string = rank.toString();
            } else {
                let len = this.ndWaitRedBagList.childrenCount;
                rankNo.string = (len + 1).toString();
            }
            if (pos === myPos) {
                this.game.waitingRound = +rankNo.string;
            }
            this.ndWaitRedBagList.addChild(item);
        } else {
            if (this.ndWaitRedBagList.childrenCount <= 0) return;
            this.ndWaitRedBagList.children[0].runAction(cc.sequence(
                cc.spawn(
                    cc.moveBy(0.2, -200, 0),
                    cc.fadeOut(0.2),
                ),
                cc.callFunc(() => {
                    this.ndWaitRedBagList.removeChild(this.ndWaitRedBagList.children[0]);
                }),
            ));

            this.ndWaitRedBagList.children.forEach((child) => {
                let rank = child.getChildByName("rank").getComponent(cc.Label);
                let curRank = +rank.string - 1;
                rank.string = curRank.toString();
            });
        }
    }


    onClickGold(ev: cc.Event.EventTouch, idx: string) {
        let me = this.game.playerMgr.me
        if (me.balance < +idx) {
            showTip("金额不足，请重新选择～");
            ev.target.getComponent(cc.Toggle).isChecked = false;
            this.ndSelectMoney.children[0].getComponent(cc.Toggle).isChecked = true;
            return;
        }
        this.redBagMoney = idx;
        this.lblRedBagMoney.string = idx;
    }

    onClickBoom(ev: cc.Event.EventTouch, idx: string) {
        let tg = ev.target.getComponent(cc.Toggle);
        if (tg.isChecked) {
            this.boomNo = +idx;
            // this.lblBoomNo.string = "当前雷号：" + idx;
        } else {
            this.boomNo = undefined;
        }
        // cc.log("当前雷号：", this.boomNo);
    }

    onClickSendRedBag() {
        // if (this.game.autoSend) {   // 如果处于自动发的状态，可以修改下次的自动内容
        //     this.savaAutoInfo();
        // }

        if (this.game.isWaitingList) {
            showTip("埋雷失败，队列中已有您的红包～");
            this.hide();
            return;
        }
        if (this.redBagMoney === "0" || this.redBagMoney === "" || !this.game.checkMoneyEnoughAuto(this.redBagMoney)) {
            showTip("金额不足，埋雷失败！");
            return;
        }
        if (this.game.autoSendMoney === undefined) this.game.showAutoSendBtn();
        this.savaAutoInfo();
        this.game.msg.sendPackRedBag(this.redBagMoney, this.boomNo);
        showTip("埋雷成功～");
        this.hide();
    }

    savaAutoInfo(){
        if (this.boomNo === undefined) {
            let randBoom = random(0, 9);
            this.boomNo = randBoom;
        }
        this.game.setAutoSendInfo(this.redBagMoney, this.boomNo);
    }

    hide() {
        this.boomNo = undefined;
        this.ndWaitRedBagList.destroyAllChildren();
        this.node.active = false;
    }
}
