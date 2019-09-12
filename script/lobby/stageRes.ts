import * as util from "../common/util";
import { MatchInfo } from "./lobbyIface";
import { GameId } from "../game-share/game";

const { ccclass, property } = cc._decorator;

@ccclass
export default class StageRes extends cc.Component {
    private _resources: cc.Node;

    get resources() {
        if (!this._resources) {
            this._resources = this.node.getChildByName("res");
        }
        return this._resources;
    }
    onLoad() {
        // init logic
    }

    private copySprite(from: cc.Node, to: cc.Node) {
        to.getComponent(cc.Sprite).spriteFrame = from.getComponent(cc.Sprite).spriteFrame;
    }

    /**
     * 创建场次卡
     */
    getStageModel(matchInfo: MatchInfo, gameName: GameId, idx: number) {
        let nodeGame = this.node.getChildByName(gameName)
        if (!nodeGame) {
            //除捕鱼外通用
            nodeGame = this.node.getChildByName("normal")
        }
        let model = util.instantiate(nodeGame.getChildByName(idx.toString()))
        if (gameName === GameId.BY) {
            let bets = matchInfo.bets;
            let id = matchInfo.id;
            let idnex = parseInt(id) - 1;
            let max1 = util.mul(bets, matchInfo.byRatio).toNumber();

            // 炮倍
            let psobeiLb = model.getChildByName("paobei").getChildByName("mul");
            psobeiLb.getComponent(cc.Label).string = bets + "-" + max1;
            // 多少元炮场
            model.getChildByName("layout").getChildByName('score').getComponent(cc.Label).string = "" + max1;
            // 入场限制
            model.getChildByName("limit").getComponent(cc.Label).string = matchInfo.minMoney + "元"
            return model
        }
        // else if (gameName === GameId.DZ) {
        //     if (!model) {
        //         model = util.instantiate(nodeGame.getChildByName("4"))
        //     }
        //     let limit = model.getChildByName("limit").getComponent(cc.Label);
        //     limit.string = matchInfo.minMoney + '元';
        //     let mz = model.getChildByName("mz").getChildByName("lb").getComponent(cc.Label);
        //     mz.string = `${matchInfo.bets}/${+matchInfo.bets * 2}`;

        //     let haveTakeMony = model.getChildByName("takemoney").getChildByName("have");
        //     let nohaveTakeMony = model.getChildByName("takemoney").getChildByName("nohave");
        //     let takeMoneyLabel = haveTakeMony.getChildByName("layout").getChildByName("moeny").getComponent(cc.Label);
        //     if (matchInfo.takeMoney === "-1") {
        //         haveTakeMony.active = false;
        //         nohaveTakeMony.active = true;
        //     } else {
        //         haveTakeMony.active = true;
        //         nohaveTakeMony.active = false;
        //         takeMoneyLabel.string = matchInfo.takeMoney;
        //     }
        //     return model
        // }
        else if (gameName === GameId.QHB) {
            let bets = matchInfo.bets;
            let redBagCount = matchInfo.hongbaoCnt;
            let minLimit = matchInfo.allowGrabMinMoney;
            let maxLimit = matchInfo.allowGrabMaxMoney;

            let roomInfo = model.getChildByName("info").getComponent(cc.Label);
            let minMoney = model.getChildByName("layout").getChildByName("min").getComponent(cc.Label);
            let maxMoney = model.getChildByName("layout").getChildByName("max").getComponent(cc.Label);

            if (redBagCount && bets) {
                roomInfo.string = `${redBagCount}包${bets}倍`;
            }
            if (minMoney && minMoney !== undefined) {
                minMoney.string = minLimit;
            }
            if (maxMoney && maxMoney !== undefined) {
                maxMoney.string = maxLimit;
            }
            return model;
        }
        else {  ////NIUNIU DOUDIZHU PAODEKUAI LONGHU DEZHOUPUKE HONGHEI BRNIUNIU JDNIUNIU ERRENMAJIANG JINHUA
            let score = model.getChildByName("layout").getChildByName('score').getComponent(cc.Label)
            score.string = matchInfo.bets
            let limit = model.getChildByName("limit").getComponent(cc.Label);
            limit.string = matchInfo.minMoney + '元'
            let max = model.getChildByName("max");
            let maxDes = max.getChildByName("New Label").getComponent(cc.Label);
            let maxLab = max.getChildByName('lb').getComponent(cc.Label);
            if (gameName === GameId.JH) {
                maxDes.string = "全押上限";
                max.active = true;
                maxLab.string = matchInfo.allInMaxMoney + "元"
            } else if (gameName === GameId.DDZ) {
                maxDes.string = "最大倍数";
                max.active = true;
                maxLab.string = matchInfo.maxBet + "倍"
            } else if (gameName === GameId.BRNN) {
                maxDes.string = "最高返奖"
                max.active = true;
                maxLab.string = matchInfo.brnnMaxBoost + "倍";
            } else if (gameName === GameId.DZPK) {
                maxDes.string = "最高携带"
                max.active = true;
                maxLab.string = matchInfo.takeMoney + "元";
                if (matchInfo.takeMoney === "-1") {
                    maxDes.string = ""
                    maxLab.string = "不限携带";
                }
            }
            else {
                max.active = false;
            }
            return model
        }
    }
}
