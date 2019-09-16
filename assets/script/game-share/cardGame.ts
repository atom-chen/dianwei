import Game from "./game";
import PokerRes from "./pokerRes";
import PokerCard, { Suit, Jokers } from "./pokerCard";
import { setGray } from "../common/util";
import * as util from "../common/util";
const { ccclass, property } = cc._decorator;

/**
 * 带扑克牌的游戏类
 */
@ccclass
export default abstract class CardGame<T extends PokerCard> extends Game {

    @property({ type: cc.Prefab, tooltip: "动画播放背景预制" })
    protected prefabAnimBg: cc.Prefab = undefined;

    @property(cc.Prefab)
    private prefabCardRes: cc.Prefab = undefined;

    private _cardRes: cc.Node;
    protected _fakeCardPool: cc.NodePool;
    protected abstract cardType: { new(): T };

    protected onLoad() {
        super.onLoad();
        this._cardRes = util.instantiate(this.prefabCardRes);
        this._fakeCardPool = new cc.NodePool();
        this.initFakeCardPool();
    }

    protected initFakeCardPool() {
        for (let i = 0; i < 20; i++) {
            let card = this.genRealCardByVal(0);
            this._fakeCardPool.put(card.node);
        }
    }

    private getFakeCard() {
        let c = this._fakeCardPool.get();
        if (!c) {
            let d = this.genRealCardByVal(0);
            return d;
        }
        let e = c.getComponent(this.cardType) as T;
        if (e) {
            e.destroy();
        }
        e = c.addComponent(this.cardType);
        e.value = 0;
        c.rotation = 0;
        setGray(c, false);
        return e;
    }

    recycleCard(c: T) {
        let n = c.node;
        if (n && n.isValid) {
            if (c.value !== 0) {
                n.removeFromParent(true);
                n.destroy();
                return;
            }
            c.destroy();
            n.removeFromParent(true);
            this._fakeCardPool.put(n);
        }
    }

    getDZCardByVal(val: number) {
        if (val === 0) {
            return this.getFakeCard();
        } else {
            let pokerRes = this._cardRes.getComponent(PokerRes);
            let node;
            node = pokerRes.getDdzCard(val);
            node.active = true;
            let card = node.addComponent(this.cardType);
            card.value = val;
            return card;
        }
    }

    private convertCardVal(rune: number, pretend: number) {
        if (pretend && pretend > 0) {
            if (rune === 1000 || rune === 2000) {
                return (rune + (pretend % 100));//变成王+癞子点数
            } else {
                return (pretend % 100);//变成癞子点数
            }
        } else {
            return rune;
        }
    }

    /**
     * 根据服务器的 value 值获取卡牌
     *
     * @template T
     * @param {{ new(): T }} type
     * @param {number} val
     * @param {number} [pretend]
     * @returns
     * @memberof CardGame
     */
    genCardByVal(val: number, pretend?: number) {
        if (val === 0) {
            return this.getFakeCard();
        } else {
            return this.genRealCardByVal(val, pretend);
        }
    }

    private genRealCardByVal(val: number, pretend?: number) {
        if (pretend) {
            val = this.convertCardVal(val, pretend);
        }
        let node;
        if (val === 1000) {
            node = this.genCard(Suit.JOKER_S);
        } else if (val === 2000) {
            node = this.genCard(Suit.JOKER_L);
        } else {
            let suit = Math.floor(val / 100) % 10;
            let num = val % 100;
            let joker: Jokers | undefined;
            if (val > 2000) {
                joker = Jokers.LARGE;
            } else if (val > 1000) {
                joker = Jokers.SMALL;
            }
            node = this.genCard(suit, num, joker);
        }
        node.active = true;
        let card = node.addComponent(this.cardType);
        card.value = val;
        return card;
    }

    private genCard(suit: Suit, num?: number, joker?: Jokers) {
        let pokerRes = this._cardRes.getComponent(PokerRes);
        let card: cc.Node | undefined;
        if (suit === Suit.JOKER_S) {
            card = pokerRes.getJoker(Jokers.SMALL);
        } else if (suit === Suit.JOKER_L) {
            card = pokerRes.getJoker(Jokers.LARGE);
        } else if (num !== undefined) {
            if (joker) {
                card = pokerRes.getMagic(suit, num, joker);
            } else {
                if (suit === 0) {
                    card = pokerRes.getMagic(suit, num, Jokers.None);
                } else {
                    card = pokerRes.getCard(suit, num);
                }
            }
        }
        return card;
    }

    protected playAnim(animPrefab: cc.Prefab, cards?: cc.Node[]) {
        return new Promise(resolve => {
            if (!animPrefab) {
                cc.warn("no anim prefab");
                resolve(false);
                return;
            }
            let node = this.nodeAnimation.getChildByName(animPrefab.name);
            if (!node) {
                node = util.instantiate(animPrefab);
                this.nodeAnimation.addChild(node);
            }
            node.active = true;
            let anim = node.getComponent(cc.Animation);
            if (!anim) {
                cc.warn("prefab no anim");
                resolve(false);
                return;
            }
            if (cards) {
                for (let i = 0; i < cards.length; i++) {
                    let n = node.getChildByName("c" + (i + 1));
                    if (n && cards[i]) {
                        n.destroyAllChildren();
                        n.removeAllChildren();
                        n.addChild(cards[i]);
                    }
                }
            }
            let bg = this.nodeAnimation.getChildByName("animBg");
            if (!bg) {
                bg = util.instantiate(this.prefabAnimBg);
                this.nodeAnimation.addChild(bg);
                bg.name = "animBg";
                bg.setSiblingIndex(0);
            }
            bg.active = true;
            bg.opacity = 0;
            bg.stopAllActions();
            bg.runAction(cc.fadeTo(0.2, 100));

            if (anim.defaultClip) {
                anim.play();
            } else {
                let clips = anim.getClips();
                if (!clips || clips.length === 0) {
                    resolve(false);
                    return;
                }
                anim.play(clips[0].name);
            }
            anim.on("stop", function finish() {
                anim.off("stop", finish);
                try {
                    node.active = false;
                    bg.stopAllActions();
                    bg.runAction(cc.sequence(
                        cc.fadeOut(0.2),
                        cc.callFunc(() => {
                            bg.active = false;
                        })
                    ));
                } catch (error) {
                    cc.error(error);
                }
                resolve(true);
            });
        });
    }
}