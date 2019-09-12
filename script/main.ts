import g from "./g";
import ItemNames from "./common/itemNames";
import DebugPanel from "./start/debugPanel";
import setProtos from "./start/registerProtos";

const FRAME_RATE = 60;

const { ccclass, property, executionOrder } = cc._decorator;
@ccclass
@executionOrder(0)
export default class Main extends cc.Component {
    // 这里可以设置一些全局需要用到的预制件进来（因为这个节点，不会被释放，可以永久保存）
    // 比如保存Tips，Dialog， 操作条，等全局资源预制件。
    @property(cc.Prefab)
    loading: cc.Prefab = undefined;
    @property(cc.Prefab)
    tips: cc.Prefab = undefined;

    @property(cc.Prefab)
    //引用显示
    confirm: cc.Prefab = undefined;

    @property(cc.Prefab)
    curtain: cc.Prefab = undefined;

    @property(cc.Prefab)
    avatars: cc.Prefab = undefined;

    @property(cc.Prefab)
    goToUrl: cc.Prefab = undefined;

    onLoad() {
        this.info();
        setProtos();
        // let xian = setProtos();
        // cc.log(xian);
        // cc.log("__________________________________________________________________________________________________________________________");
        // 这个地方是在Start场景里就加载了。然后不会释放掉。
        cc.game.addPersistRootNode(this.node);

        // 设置ccc的帧率
        cc.game.setFrameRate(FRAME_RATE);

        // 预加载大厅大厅，需要进入，还是需要loadScene一次哦。
        cc.director.preloadScene(g.lobbyScene, function (err) {
            if (err) {
                return;
            }
            g.lobbyLoaded = true;
        });

        // Decimal
        let Decimal = window.Decimal;
        Decimal.set({
            precision: 20,
            rounding: Decimal.ROUND_HALF_UP,
            toExpNeg: -7,
            toExpPos: 21
        });
        g.act = localStorage.getItem(ItemNames.account);
        g.pwd = localStorage.getItem(ItemNames.password);

        let debugPanel = this.getComponent(DebugPanel)
        debugPanel.initDebug();
    }

    private info() {
        let sys = cc.sys;
        cc.log("--M-a-i-n--S-t-a-r-t--");
        cc.log("  os:        %s", sys.os);
        cc.log("  searchPaths(1st time is null):", sys.localStorage.getItem(ItemNames.searchPaths));
        cc.log("---I----N----F----O---");
    }
}
