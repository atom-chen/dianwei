import PokerCard from "../game-share/pokerCard";

const { ccclass, property } = cc._decorator;

enum TurningState {
    None,
    ToFront,
    ToBack
}

@ccclass
export default class JHCard extends PokerCard { }
