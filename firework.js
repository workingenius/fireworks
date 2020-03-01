(function() {
    var GRAVITY = 9.8;

    var canvas = null;
    var c = null;
    var fireworks = [];

    window.onload = function () {
        canvas = document.querySelector('canvas');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        c = canvas.getContext('2d');
        animate();

        setInterval(function () {
            if (Math.random() < 0.2) {
                fireworks.push(new Firework());
            }
            console.log(fireworks.length);
        }, 1000);
    };

    function animate() {
        c.clearRect(0, 0, window.innerWidth, window.innerHeight);
        c.fillRect(0, 0, window.innerWidth, window.innerHeight, 'black');
        
        fireworks.forEach(function (firework) {
            firework.draw(Date.now());
        });
        fireworks = fireworks.filter(function (firework) {
            return !firework.isGone();
        });
        
        window.requestAnimationFrame(animate);
    }

    /**
     * 一次礼花爆炸
     */
    function Firework() {
        this.fragmentLst = [];

        var lx = Math.random() * window.innerWidth;
        var ly = Math.random() * window.innerHeight / 2;

        // 爆炸产生的弹片数量
        var fragCount = (Math.floor(Math.random() * 20)) + 20;
        for (var i = 0; i < fragCount; i++) {
            var randStrength = 20 + Math.random() * 20;
            var randv = randomVelocity(randStrength);  // random velocity
            var randr = Math.random() * 4 + 10;  // random radius
            var frag = new Fragment(lx, ly, randv.x, randv.y, randr);
            this.fragmentLst.push(frag);
        }

        this.timestamp = Date.now();
    }

    /**
     * 生辰随机速度
     * @param strength 速度矢量模
     * @returns {x: x方向分量, y: y方向分量}
     * */
    function randomVelocity(strength) {
        var randAng = Math.PI * 2 * Math.random();  // 0 到 2pi 随机角度
        return {
            x: Math.cos(randAng) * strength,
            y: Math.sin(randAng) * strength,
        };
    }

    Firework.prototype.draw = function (timestamp) {
        var timeDiff = (timestamp - this.timestamp) * 0.001;
        this.fragmentLst.forEach(function (frag, i) {
            frag.draw(timeDiff);
        });
        this.fragmentLst = this.fragmentLst.filter(function (frag) {
            return !frag.isGone();
        });
        this.timestamp = timestamp;
    };

    Firework.prototype.isGone = function () {
        return this.fragmentLst.length <= 0;
    };

    /**
     * 礼花弹的一个弹片
     */
    function Fragment(lx, ly, vx, vy, ra) {
        this.lx = lx;  // location x
        this.ly = ly;  // location y
        this.vx = vx;  // velocity x
        this.vy = vy;  // velocity y
        this.ra = ra;  // fragment radius
    }

    /**
     * 重绘当前弹片，离上一次重绘过了 timeDiff 秒
     */
    Fragment.prototype.draw = function (timeDiff) {
        this.lx += (this.vx * timeDiff);
        this.ly += (this.vy * timeDiff);
        this.vy = this.vy + GRAVITY * timeDiff;

        c.save();
        c.beginPath();
        c.fillStyle = 'yellow';
        c.arc(this.lx, this.ly, this.ra, 0, Math.PI * 2);
        c.fill();
        // c.fillRect(this.lx, this.ly, this.ra, this.ra);
        c.restore();

        this.ra = this.ra * 0.99;
        // console.log(this.ra);
    };

    /**
     * 这片礼花弹是否已经看不见了
     */
    Fragment.prototype.isGone = function () {
        return this.ra < 1;
    };

})();