(function() {
    var GRAVITY = 9.8 * 6;

    var canvas = null;
    var c = null;
    var fireworks = [];
    var lastTimestamp = null;

    window.onload = function () {
        canvas = document.querySelector('canvas');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        c = canvas.getContext('2d');
        lastTimestamp = Date.now() * 0.001;
        animate();

        setInterval(function () {
            if (Math.random() < 0.8) {
                if (fireworks.length < 3) {
                    fireworks.push(new Firework());
                }
            }
        }, 1000);
    };

    function animate() {
        var now = Date.now() * 0.001;

        c.clearRect(0, 0, window.innerWidth, window.innerHeight);
        c.fillRect(0, 0, window.innerWidth, window.innerHeight, 'black');
        
        fireworks.forEach(function (firework) {
            firework.draw(now - lastTimestamp);
        });
        fireworks = fireworks.filter(function (firework) {
            return !firework.isGone();
        });
        
        window.requestAnimationFrame(animate);
        lastTimestamp = now;
    }

    /**
     * 一次礼花爆炸
     */
    function Firework() {
        this.fragmentLst = [];

        var lx = Math.random() * window.innerWidth;
        var ly = Math.random() * window.innerHeight / 2;
        var randc = randomColor();

        // 爆炸产生的弹片数量
        var fragCount = (Math.floor(Math.random() * 10)) + 100;
        for (var i = 0; i < fragCount; i++) {
            var randStrength = 200 + Math.random() * 3;
            var randv = randomVelocity(randStrength);  // random velocity
            var randr = Math.random() * 1 + 3;  // random radius
            var frag = new Fragment(lx, ly, randv.x, randv.y, randr, null, randc);
            this.fragmentLst.push(frag);
        }
    }

    /**
     * 生成随机速度
     * @param strength 速度矢量模
     * @returns {x: x方向分量, y: y方向分量}
     * */
    function randomVelocity(strength) {
        var s = 10;
        var r = 1000;
        var d = 10000;
        var u = Math.random();
        var v = Math.random();
        var phi = 2 * Math.PI * u;
        var the = Math.acos(2 * v - 1);
        var sinPhi = Math.sin(phi);
        var cosPhi = Math.cos(phi);
        var sinThe = Math.sin(the);
        var cosThe = Math.cos(the);
        var under = sinThe * sinPhi * r + d;
        var x = s * (sinThe * cosPhi * r) / under;
        var y = s * cosThe * r / under;
        return {x: x * strength, y: y * strength};
    }

    /**
     * 重绘一次爆炸的当前样子
     * @param timeDiff 离上一次重绘过了多少秒
     */
    Firework.prototype.draw = function (timeDiff) {
        this.fragmentLst.forEach(function (frag, i) {
            frag.drawTail(timeDiff);
        });
        this.fragmentLst.forEach(function (frag, i) {
            frag.draw(timeDiff);
        });
        this.fragmentLst = this.fragmentLst.filter(function (frag) {
            return !frag.isGone();
        });
    };

    /** 这次爆炸是否已经完全看不见了 */
    Firework.prototype.isGone = function () {
        return this.fragmentLst.length <= 0;
    };

    /**
     * 礼花弹的一个弹片
     */
    function Fragment(lx, ly, vx, vy, ra, ttl, color) {
        this.lx = lx;  // location x
        this.ly = ly;  // location y
        this.vx = vx;  // velocity x
        this.vy = vy;  // velocity y
        this.ra = ra;  // fragment radius
        this.ttl = ttl || (Math.random() * 0.5 + 2.2);  // time to life (in seconds)
        // 弹片颜色 r 分量，g 分量， b 分量
        this.color = color;
        this.colorStyle = colorToStyle(colorLighter(color, 0.5));
        this.tail = [];
        this.isBurnUp = false;  // 是否已烧完
    }

    /**
     * 重绘当前弹片
     * @param timeDiff 离上一次重绘过了 timeDiff 秒
     */
    Fragment.prototype.draw = function (timeDiff) {
        // 只有尚未烧完时，才需重绘
        if (!this.isBurnUp) {
            c.save();
            c.beginPath();
            c.fillStyle = this.colorStyle;
            c.arc(this.lx, this.ly, this.ra, 0, Math.PI * 2);
            c.fill();
            c.restore();
        }
    };

    Fragment.prototype.drawTail = function (timeDiff) {
        // 尚未烧完时，迭代状态，并留下尾巴上的一点
        if (!this.isBurnUp) {
            this.ttl -= timeDiff;
    
            var lx0 = this.lx, ly0 = this.ly;
            this.lx += (this.vx * timeDiff);
            this.ly += (this.vy * timeDiff);
            this.vy = this.vy + GRAVITY * timeDiff;
            var lx1 = this.lx, ly1 = this.ly;
    
            if (this.ttl <= 2) {
                this.ra = this.ra * 0.9;
            }
            if (this.ttl <= 0 || this.ra < 1.5) {
                this.isBurnUp = true;
            }
    
            // new tail spot
            this.tail.push(new TailSpot(lx0, ly0, lx1, ly1, this.ra, this.color));
        }

        c.save();
        // 不论是否烧完，尾巴都需迭代重绘，并把已经消散的尾巴片段去掉
        this.tail.forEach(function (ts, i) {
            ts.draw(timeDiff);
        });
        c.restore();
        this.tail = this.tail.filter(function (ts) {
            return !ts.isGone();
        });
    };

    /** 这片礼花弹是否已经看不见了 */
    Fragment.prototype.isGone = function () {
        // 当自己本身已经烧完，尾巴全部消散，则完全看不见了
        return this.isBurnUp && this.tail.length <= 0;
    };

    /**
     * 弹片尾巴上的光点
     * 
     * 每个光点实际上是弹片轨迹中间的一小段直线，因为采样率非常高，看起来非常平滑
     * 每一小段的亮度不同，导致看起来整条轨迹弧线的亮度是均匀变化的，制造出尾巴逐渐消散的效果
     * */
    function TailSpot(lx0, ly0, lx1, ly1, ra, color) {
        this.lx0 = lx0;  // 起始位置 x 分量
        this.ly0 = ly0;  // 起始位置 y 分量
        this.lx1 = lx1;  // 终止位置 x 分量
        this.ly1 = ly1;  // 终止位置 y 分量
        this.ra = ra;    // 线段宽度
        this.light = 1;  // 亮度，1 为全亮，0 为全消散
        this.color = color;
    }

    TailSpot.prototype.draw = function (timeDiff) {
        var color = colorDarker(this.color, this.light);
        c.strokeStyle = colorToStyle(color);
        c.lineWidth = this.ra;
        c.lineCap = 'round';
        c.beginPath();
        c.moveTo(this.lx0, this.ly0);
        c.lineTo(this.lx1, this.ly1);
        c.stroke();

        this.ra = this.ra * 0.96;
        this.light = this.light * 0.94;
        
    };

    /** 尾巴上的这一小片段是否已经完全消散 */
    TailSpot.prototype.isGone = function () {
        // 亮度非常低，或者宽度非常小时，几乎看不见
        return this.light < 0.2 || this.ra < 1;
    }

    /** 
     * 生成随机颜色
     * @returns {r, g, b}
     */
    function randomColor() {
        var r = Math.random() * 255;
        var g = Math.random() * 255;
        var b = Math.random() * 255;
        return {r: r, g: g, b: b};
    }

    function colorToStyle(c) {
        return 'rgb(' + c.r + ',' + c.g + ',' + c.b + ')';
    }

    /**
     * 颜色变暗
     */
    function colorDarker(color, rate) {
        return {
            r: color.r * rate,
            g: color.g * rate,
            b: color.b * rate,
        };
    }

    /**
     * 颜色变亮
     */
    function colorLighter(color, rate) {
        return {
            r: 255 - ((255 - color.r) * rate),
            g: 255 - ((255 - color.g) * rate),
            b: 255 - ((255 - color.b) * rate),
        };
    }

})();