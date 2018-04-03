
/****************************************************************************
 *                   Polyline
 ****************************************************************************/

var $ML = (function(root) {

root.Polyline = function(config) {
    /*
     * Crée une ligne brisée, avec des points colorés qui se déplacent 
     * à une certaine vitesse pour représenter le courant électrique
     * Représentation similaire à celle utilisée par Paul Falstad (http://www.falstad.com/circuit/)
     * Options (dans config) :
     * stroke: couleur de la ligne
     * color: color of the dots
     * strokeWidth: stroke width
     * max_spedd: max speed of the dots (space between dots per second)
     * min: minimum value
     * max: maximum value (corresponding to max speed)
     * reverse: dots are in reverse
     * dot_space: space between dots
     * points: list of coordinates for the line. [x1, y1, x2, y2, ... xn, yn]
     * 
     */
    config = this._register(config, "Polyline", ["value"], []);
}

root.Polyline.prototype = root._block_xtend({ 
    _init: function(config) {
        this.stroke = root.getOpts(config, "stroke", "black"); // Color of the line
        this.color = root.getOpts(config, "color", "orange");   // color of the dots
        this.size = root.getOpts(config, "size", 6.0);   // size of the dots
        this.strokeWidth = root.getOpts(config, "strokeWidth", 1);   // stroke width
        this.max_speed = root.getOpts(config, "max_speed", 6.0);  // max speed (dot space / s)
        this.max = root.getOpts(config, "max", 100);
        this.min = root.getOpts(config, "min", -100);
        this.reverse = root.getOpts(config, "reverse", false);
        this.dot_space = root.getOpts(config, "dot_space", 20); // space between dots
        this.points = root.getOpts(config, "points", []);
        this.group = new Konva.Group();
        this.offset = 0;
        this.speed = 0;
        this.segments=[];
        this.total_length = 0;
        this.Kline = new Konva.Line({
            points:this.points,
            x:this.x,
            y:this.y,
            stroke:this.stroke,
        });
        this.group.add(this.Kline);
        
        for (var i=0 ; i<(this.points.length-2) ; i+=2) {
            var x1 = this.points[i];
            var y1 = this.points[i+1];
            var x2 = this.points[i+2];
            var y2 = this.points[i+3];
            var l = Math.sqrt((x2-x1)*(x2-x1)+(y2-y1)*(y2-y1));
            var ux = (x2-x1) / l;     // Vecteur unitaire  donnant la direction du segment
            var uy = (y2-y1) / l;
            this.total_length += l;
            this.segments.push({
                length:l,
                point_indexes:[],
                vect:{x:ux, y:uy},
                coord:[x1, y1, x2, y2],
            });
        }
        this.dots = [];
        this._init_dots();
    },
    _get_line_index: function(dist) {
        // Get line index and remainig length from length 
        var remaining = dist;
        var i;
        for (i=0 ; i<this.segments.length ; i++) {
            var last_rem = remaining;
            remaining -= this.segments[i].length;
            if (remaining < 0) {
                var seg = this.segments[i];
                var px = seg.coord[0] + seg.vect.x * last_rem;
                var py = seg.coord[1] + seg.vect.y * last_rem;
                return {i:i, remaining:last_rem, point:{x:px, y:py}} ;
            }
        }
        return {i:null, remaining:remaining, point:null}; // on est au-dela du dernier segment
    },
    _init_dots: function () {
        var n = Math.floor(this.total_length / this.dot_space) + 1;
        for (var i = 0 ; i < n ; i++) {
            var dist = i * this.dot_space;
            //var p = this.getPointOnLine(dist);
            var l_index = this._get_line_index(dist);
            var p = l_index.point;
            var obj = new Konva.Circle({
                x: p.x,
                y: p.y,
                radius: this.size/2,
                fill: this.color,
            });
            var segment = this.segments[l_index.i];
            this.dots.push({
                p:p,
                obj:obj,
                base_dist:dist,
                seg_index:l_index.i,
                to_seg_end:(segment.length - l_index.remaining)
            });
            // on rajoute l'index du point dans la liste des segments
            segment.point_indexes.push(this.dots.length - 1);
            //console.log("P: ", p);
            this.group.add(obj);
        }
    },
    move_dots_old: function (offset) {
        var n = Math.floor(this.total_length / this.dot_space);
        for (var i = 0 ; i < this.dots.length ; i++) {
            var dot = this.dots[i];
            var pt = this.getPointOnLine(dot.base_dist + offset);
            if (pt !== null) {
                dot.obj.setX(pt.x);
                dot.obj.setY(pt.y);
                dot.obj.show();
            } else {
                dot.obj.hide();
            }
        }
    },
    move_dots: function (offset) {
        var n = Math.floor(this.total_length / this.dot_space);
        for (var i = 0 ; i < this.dots.length ; i++) {
            var dot = this.dots[i];
            if (offset <= dot.to_seg_end) { // Cas génral : on reste sur le segment
                var segment = this.segments[dot.seg_index];
                var dot_x = dot.p.x;
                var dot_y = dot.p.y;
            } else if ((dot.seg_index + 1) < this.segments.length) {
                // si on arrive en bout de segment, on passe sur le suivant ...
                var segment = this.segments[dot.seg_index + 1];
                var dot_x = segment.coord[0] - segment.vect.x * dot.to_seg_end;
                var dot_y = segment.coord[1] - segment.vect.y * dot.to_seg_end;
            } else {
                // ... sauf s'il n'y en a plus après
                var segment = null;
                var dot_x = null;
                var dot_y = null;
            }
            if (dot_x !== null) {
                var x = dot_x + segment.vect.x * offset;
                var y = dot_y + segment.vect.y * offset;
                dot.obj.setX(x);
                dot.obj.setY(y);
                dot.obj.show();
            } else {
                dot.obj.hide();
            }
        }
    },
    getPointOnLine: function(dist) {
        var p = this._get_line_index(dist);
        if (p.i === null) {
            return null;
        }
        var s = this.segments[p.i].coord;
        var pt = p.point;
        return pt;
    },
    setval: function (v) {
        if (v < this.min) v = this.min;
        if (v > this.max) v = this.max;
        if (this.reverse) {
            v = -v;
        }

        this.speed = v * this.max_speed / this.max;
        this._set_pos(0);
    },
    _set_pos : function (time_diff) {
        this.offset += this.speed * this.dot_space * time_diff/1000;
        if (this.offset > this.dot_space) this.offset = 0;
        if (this.offset <   0) this.offset = this.dot_space;
        this.move_dots(this.offset);
    },
    addToLayer : function (layer) {
        this.layer = layer;
        var self = this;
        this.anim = new Konva.Animation(function (frame) {
            self._set_pos(frame.timeDiff);
        }, layer);
        layer.add(this.group);
        this.anim.start();
    },  
});


return root;
}) ($ML || {});


