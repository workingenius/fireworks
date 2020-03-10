(function() {
    /*
     * Firework simulation, with html5 canvas
     *
     * When an EXPLOTION occurs in the sky, many STARs burst out in every direction.
     * A STAR may be followed by a LIGHT TRAIL.
     */

    
    var canvas = null;
    var c = null;  // canvas context

    var GRAVITY = 9.8 * 6;
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
                    fireworks.push(new Explosion());
                }
            }
        }, 1000);

        // setInterval(animate, 40);
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
     * An Explosion is composed of many stars with different velocity and maybe different colors.
     */
    function Explosion() {
        this.starLst = [];

        var lx = Math.random() * window.innerWidth;
        var ly = Math.random() * window.innerHeight / 2;
        var randc = randomColor();

        var starCount = (Math.floor(Math.random() * 10)) + 20;
        for (var i = 0; i < starCount; i++) {
            var randStrength = 200 + Math.random() * 3;
            var randv = randomVelocity(randStrength);  // random velocity
            var randr = Math.random() * 1 + 3;  // random radius
            var frag = new Star(lx, ly, randv.x, randv.y, randr, null, randc);
            this.starLst.push(frag);
        }
    }

    /**
     * make a random velocity, simulating the visual effect of a sphere explosion
     * @param strength velocity vector length
     * @returns {x, y}
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
     * draw the explosion on the canvas
     * @param timeDiff seconds after the last draw
     */
    Explosion.prototype.draw = function (timeDiff) {
        this.starLst.forEach(function (star, i) {
            star.drawLightTrail(timeDiff);
        });
        this.starLst.forEach(function (star, i) {
            star.draw(timeDiff);
        });
        this.starLst = this.starLst.filter(function (star) {
            return !star.isGone();
        });
    };

    /** check if the explosion is totally over and can't be seen any longer */
    Explosion.prototype.isGone = function () {
        return this.starLst.length <= 0;
    };

    /**
     * A Star, and its following light track
     */
    function Star(lx, ly, vx, vy, ra, ttl, color) {
        this.lx = lx;  // location x
        this.ly = ly;  // location y
        this.vx = vx;  // velocity x
        this.vy = vy;  // velocity y
        this.ra = ra;  // star radius
        this.ttl = ttl || (Math.random() * 0.5 + 2.2);  // time to live (in seconds)
        this.color = color;
        this.colorStyle = colorToStyle(colorLighter(color, 0.5));
        this.lightTrail = [];
        this.isBurnUp = false;
    }

    /**
     * draw the star on the canvas
     * @param timeDiff seconds after the last draw
     */
    Star.prototype.draw = function (timeDiff) {
        // only need to draw before it's burnt up
        if (!this.isBurnUp) {
            c.save();
            c.beginPath();
            c.fillStyle = this.colorStyle;
            c.arc(this.lx, this.ly, this.ra, 0, Math.PI * 2);
            c.fill();
            c.restore();
        }
    };

    Star.prototype.drawLightTrail = function (timeDiff) {
        // before burnt up, step on to the next state
        if (!this.isBurnUp) {
            this.ttl -= timeDiff;
    
            var lx0 = this.lx, ly0 = this.ly;
            this.lx += (this.vx * timeDiff);
            this.ly += (this.vy * timeDiff);
            this.vy = this.vy + GRAVITY * timeDiff;
            var lx1 = this.lx, ly1 = this.ly;
    
            if (this.ttl <= 2) {
                this.ra = this.ra * Math.pow(0.1, timeDiff);
            }
            if (this.ttl <= 0 || this.ra < 1.5) {
                this.isBurnUp = true;
            }
    
            // leave a new light trail segment
            this.lightTrail.push(new LTSegment(lx0, ly0, lx1, ly1, this.ra, this.color));
        }

        // draw the light trail and release those are gone
        c.save();
        this.lightTrail.forEach(function (ts, i) {
            ts.draw(timeDiff);
        });
        c.restore();
        this.lightTrail = this.lightTrail.filter(function (ts) {
            return !ts.isGone();
        });
    };

    /** check the star is over or not */
    Star.prototype.isGone = function () {
        // burnt up, and the whole light trail is gone
        return this.isBurnUp && this.lightTrail.length <= 0;
    };

    /**
     * Light Trail Segment
     * 
     * A light trail is composed of many short straight segments.
     * When frames goes fast, it looks as a curve trailing a star.
     * 
     * */
    function LTSegment(lx0, ly0, lx1, ly1, ra, color) {
        // segment start point
        this.lx0 = lx0;
        this.ly0 = ly0;
        // segment end point
        this.lx1 = lx1;
        this.ly1 = ly1;
        // segment width
        this.ra = ra;
        this.light = 1;  // 1 for totally light，0 for totally dark
        this.color = color;
    }

    LTSegment.prototype.draw = function (timeDiff) {
        var color = colorDarker(this.color, this.light);
        c.strokeStyle = colorToStyle(color);
        c.lineWidth = this.ra;
        c.lineCap = 'round';
        c.beginPath();
        c.moveTo(this.lx0, this.ly0);
        c.lineTo(this.lx1, this.ly1);
        c.stroke();

        this.ra = this.ra * Math.pow(0.5, timeDiff);
        this.light = this.light * Math.pow(0.01, timeDiff);
        
    };

    /** check the segment is unseen or not */
    LTSegment.prototype.isGone = function () {
        // a segment is gone when it is almost dark or small enough
        return this.light < 0.2 || this.ra < 1;
    }

    /** 
     * make a random color
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

    function colorDarker(color, rate) {
        return {
            r: color.r * rate,
            g: color.g * rate,
            b: color.b * rate,
        };
    }

    function colorLighter(color, rate) {
        return {
            r: 255 - ((255 - color.r) * rate),
            g: 255 - ((255 - color.g) * rate),
            b: 255 - ((255 - color.b) * rate),
        };
    }

})();