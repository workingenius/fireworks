(function() {
    var GRAVITY = 9.8;

    var canvas = null;
    var c = null;
    var framework;

    window.onload = function () {
        canvas = document.querySelector('canvas');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        c = canvas.getContext('2d');

        framework = new Framework();
        animate();
    };

    function animate() {
        c.clearRect(0, 0, window.innerWidth, window.innerHeight);
        c.fillRect(0, 0, window.innerWidth, window.innerHeight, 'black');
        framework.draw(Date.now());
        window.requestAnimationFrame(animate);
    }

    /**
     * 一次礼花爆炸
     */
    function Framework() {
        this.fragmentLst = [];

        var fragCount = (Math.floor(Math.random() * 20)) + 20;
        for (var i = 0; i < fragCount; i++) {
            this.fragmentLst.push(Fragment.randomFragmentAt(
                window.innerWidth / 2, window.innerHeight / 2
            ));
        }

        this.timestamp = Date.now();
    }

    Framework.prototype.draw = function (timestamp) {
        var timeDiff = (timestamp - this.timestamp) * 0.001;
        this.fragmentLst.forEach(function (frag, i) {
            frag.draw(timeDiff);
        });
        this.fragmentLst = this.fragmentLst.filter(function (frag) {
            return !frag.isGone();
        });
        this.timestamp = timestamp;
    };

    /**
     * 礼花弹的一个弹片
     */
    function Fragment(lx, ly, vx, vy, ra) {
        this.lx = lx;  // location x
        this.ly = ly;  // location y
        this.vx = vx;  // velocity x
        this.vy = vy;  // velocity y
        this.ra = ra;
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

    Fragment.randomFragmentAt = function (x, y) {
        return new Fragment(
            x, y,
            (Math.random() - 0.5) * 100, (Math.random() - 0.5) * 100, 
            14 + (Math.random() - 0.5) * 5
        );
    };
})();