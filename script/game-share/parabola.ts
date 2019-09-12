export default class Parabola {

    // /**
    //  * 起点
    //  * 
    //  * @private
    //  * @type {cc.Vec2}
    //  * @memberof Parabola
    //  */
    // private oriPos: cc.Vec2;

    // /**
    //  * 终点
    //  * 
    //  * @private
    //  * @type {cc.Vec2}
    //  * @memberof Parabola
    //  */
    // private tarPos: cc.Vec2;

    // /**
    //  * 开始时间
    //  * 
    //  * @private
    //  * @type {number}
    //  * @memberof Parabola
    //  */
    // private beginTime: number;

    // /**
    //  * 结束时间
    //  * 
    //  * @private
    //  * @type {number}
    //  * @memberof Parabola
    //  */
    // private endTime: number;

    // /**
    //  * 持续时间
    //  * 
    //  * @private
    //  * @memberof Parabola
    //  */
    // private duration = 500;

    // /**
    //  * 加速／减速 倍率
    //  * 
    //  * @private
    //  * @memberof Parabola
    //  */
    // private timeScale = 1;

    // // 公式： y = a*x*x + b*x + c;
    // private a = 0; // 实际指焦点到准线的距离，你可以抽象成曲率，这里模拟扔物体的抛物线，因此是开口向下的
    // private b = 0;
    // private c = 0;
    // private curX = 0;
    // private rate: number;

    // private compHandler: Function;

    // private shouldMove = false;

    // move(tarPos: cc.Vec2, duration: number, compHandler?: Function, curvature = -0.0006) {
    //     this.oriPos = this.node.position;
    //     this.curX = 0;

    //     // 换算成原点的相对坐标
    //     this.tarPos = cc.v2(tarPos.x - this.oriPos.x, tarPos.y - this.oriPos.y);
    //     let tarX = this.tarPos.x;
    //     let tarY = this.tarPos.y;
    //     // 根据两点坐标以及曲率确定运动曲线函数（也就是确定a, b的值）
    //     this.a = curvature;
    //     /*
    //      * 因为经过(0, 0), 因此c = 0
    //      * 于是：
    //      * y = a * x*x + b*x;
    //      * y1 = a * x1*x1 + b*x1;
    //      * y2 = a * x2*x2 + b*x2;
    //      * 利用第二个坐标：
    //      * b = (y2+ a*x2*x2) / x2
    //     */
    //     // 于是
    //     this.b = (tarY - this.a * Math.pow(tarX, 2)) / tarX;
    //     this.rate = -1;
    //     if (tarX > 0) {
    //         this.rate = 1;
    //     }
    //     this.duration = duration / this.timeScale;

    //     // 设置起止时间
    //     this.beginTime = Date.now();
    //     this.endTime = this.beginTime + this.duration;
    //     this.compHandler = compHandler;
    //     this.shouldMove = true;
    // }

    // protected update() {
    //     if (!this.shouldMove) {
    //         return;
    //     }
    //     let x, y;
    //     let curTime = Date.now();

    //     if (curTime > this.endTime) {
    //         x = this.tarPos.x;
    //         y = this.tarPos.y;

    //         this.node.setPosition(this.oriPos.x + x, this.oriPos.y + y);
    //         if (this.compHandler) {
    //             this.compHandler();
    //         }
    //         this.shouldMove = false;
    //         this.destroy();
    //         return;
    //     } else {
    //         // x 每一步的X轴的位置
    //         x = this.tarPos.x * ((curTime - this.beginTime) / this.duration);

    //         // 每一步的 Y 轴的位置y = a*x*x + b*x + c;   c==0;
    //         y = this.a * x * x + this.b * x;

    //         this.node.setPosition(this.oriPos.x + x, this.oriPos.y + y);
    //     }
    // }
    static move(t: number, startPoint: cc.Vec2, endPoint: cc.Vec2, height = 60, angle = 60) {
        // 把角度转换为弧度  
        let radian = angle * 3.14159 / 180.0;
        // 第二个控制点为整个抛物线的中点  
        let q2x = startPoint.x + (endPoint.x - startPoint.x) / 2.0;
        let q2 = cc.v2(q2x, startPoint.y + height + Math.abs(endPoint.y - startPoint.y) / 2);

        return cc.bezierTo(t, [startPoint, q2, endPoint])/* .easing(cc.easeInOut) */;
    }
}
