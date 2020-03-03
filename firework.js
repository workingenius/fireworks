(function() {
    var GRAVITY = 9.8 * 3;

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
                fireworks.push(new Firework());
            }
            console.log(fireworks.length);
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

        // 爆炸产生的弹片数量
        var fragCount = (Math.floor(Math.random() * 20)) + 180;
        for (var i = 0; i < fragCount; i++) {
            var randStrength = 80 + Math.random() * 5;
            var randv = randomVelocity(randStrength);  // random velocity
            var randr = Math.random() * 2 + 2;  // random radius
            var frag = new Fragment(lx, ly, randv.x, randv.y, randr);
            this.fragmentLst.push(frag);
        }
    }

    /**
     * 生辰随机速度
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
            frag.draw(timeDiff);
        });
        this.fragmentLst = this.fragmentLst.filter(function (frag) {
            return !frag.isGone();
        });
    };

    Firework.prototype.isGone = function () {
        return this.fragmentLst.length <= 0;
    };

    /**
     * 礼花弹的一个弹片
     */
    function Fragment(lx, ly, vx, vy, ra, ttl) {
        this.lx = lx;  // location x
        this.ly = ly;  // location y
        this.vx = vx;  // velocity x
        this.vy = vy;  // velocity y
        this.ra = ra;  // fragment radius
        this.ttl = ttl || (Math.random() * 1 + 3);  // time to life (in seconds)
    }

    /**
     * 重绘当前弹片
     * @param timeDiff 离上一次重绘过了 timeDiff 秒
     */
    Fragment.prototype.draw = function (timeDiff) {
        this.ttl -= timeDiff;

        this.lx += (this.vx * timeDiff);
        this.ly += (this.vy * timeDiff);
        this.vy = this.vy + GRAVITY * timeDiff;

        if (this.ttl <= 2) {
            this.ra = this.ra * 0.99;
        }

        c.save();
        c.beginPath();
        c.fillStyle = 'yellow';
        c.arc(this.lx, this.ly, this.ra, 0, Math.PI * 2);
        c.fill();
        // c.fillRect(this.lx, this.ly, this.ra, this.ra);
        c.restore();
    };

    /**
     * 这片礼花弹是否已经看不见了
     */
    Fragment.prototype.isGone = function () {
        return (this.ttl <= 0) || (this.ra <= 3);
    };

})();