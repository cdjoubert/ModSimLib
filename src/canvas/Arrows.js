

// Class "Arrow"

var $ML = (function(root) {

root.Arrow = function (config) {
    this._register(config, "Arrow", [], []);
} 

root.Arrow.prototype = root._block_xtend({
    _init: function (config) {
        this.group = new Konva.Group();
        this.line = null;
        this.head=null;
        this.color=config.color || 'black';
        this.size=config.size || 5;  // Size of the arrow head
        this.scale=config.scale || 1;
        var x0 = root.getOpts(config, "x0", 0);
        var y0 = root.getOpts(config, "y0", 0);
        var x1 = root.getOpts(config, "x1", x0);
        var y1 = root.getOpts(config, "y1", y0);
        this.angle = 0;
        this.is_not_visible=false;   // devient vrai si la fleche est plus petite qu'un pixel
        this.line = new Konva.Line({
            points: [x0, y0, x1, y1],
            strokeWidth: config.strokeWidth || 1,
            stroke: this.color
        });
        var s=this.size;
        this.head = new Konva.Line({
            points: [-2*s,0,-3*s,-s,0,0,-3*s,s],
            fill: this.color,
            stroke: this.color,
            closed: true
        });
        this.group.add(this.line);
        this.group.add(this.head);
        this.setPoints(x0,y0,x1,y1);
    },
    reverseY: true, // Inverse les coordonnées en Y pour ressembler à un repère normal
    setPoints: function(x0,y0,x1,y1) {
        this.x0 = x0;
        this.y0 = y0;
        this.x1 = x1;
        this.y1 = y1;
        x0 *=this.scale;
        y0 *=this.scale;
        x1 *=this.scale;
        y1 *=this.scale;
        
        if (this.reverseY) {
            y0=-y0;
            y1=-y1;
        }
        
        this.is_not_visible = this.get_length() * this.scale <1.0;
        //console.log(this.name + " : " + this.is_not_visible + " - " + this.get_length());
        if (this.is_not_visible || this.hidden) {
            this.group.hide();
        } else {
            this.group.show();
            this.line.setPoints([x0, y0, x1, y1]);

            this.head.setX(x1);
            this.head.setY(y1);
            var a = this.get_angle();
            this.angle = a;
            if (this.reverseY)
                a = -a;
            this.head.setRotation(a);
        }
    },
    translate_to: function(pos) {
        if (typeof pos.block_class != "undefined" && pos.block_class == "Arrow") {
            var x = pos.x1; // on récupère l'extrémité de l'autre fleche
            var y = pos.y1;
        } else {
            var x = pos.x;
            var y = pos.y;
        }
        var dx = this.x1 - this.x0;
        var dy = this.y1 - this.y0;
        this.setPoints(x, y, x+dx, y+dy);
    },
    get_angle:function() {
        var dx = this.x1 - this.x0;
        var dy = this.y1 - this.y0;
        if (! this.is_not_visible) { // La fleche est-elle visible ?
            var a = (180/Math.PI)*Math.atan2(dy, dx);
            this.angle = a;
        } else {
            var a = this.angle; // sinon, on renvoie la dernière valeur de l'angle
        }
        return a;
    },
    get_length: function () {
        var dx = this.x1 - this.x0;
        var dy = this.y1 - this.y0;
        return Math.sqrt(dx*dx + dy*dy);
    },
    set_angle:function(angle) {
        this.angle = angle;
        angle *= (Math.PI/180);
        var l = this.get_length();
        var x1 = this.x0 + l*Math.cos(angle);
        var y1 = this.y0 + l*Math.sin(angle);
        this.setPoints(this.x0, this.y0, x1, y1);
    },
    set_length:function(l) {
        var angle = this.get_angle() * (Math.PI/180);
        var x1 = this.x0 + l*Math.cos(angle);
        var y1 = this.y0 + l*Math.sin(angle);
        this.setPoints(this.x0, this.y0, x1, y1);
    },
});

// Fleche courbe

root.ArcArrow = function (config) { 
    this._register(config, "ArcArrow", [], []);
}

root.ArcArrow.prototype = root._block_xtend({
    _init: function (config) {
        this.color=root.getOpts(config, "color", "grey");
        this.size=root.getOpts(config, "size", 2);
        this.scale=root.getOpts(config, "scale",1);
        this.fontsize=root.getOpts(config, "fontsize", 12);
        this.visible=config.visible || true;
        this.show_angle=config.show_angle || true;
        this.group = new Konva.Group();
        this.arc = new Konva.Arc({stroke: this.color,
            fill: this.color});
        var s=this.size;
        this.head=new Konva.Line({
                points: [-2*s,0,-3*s,-s,0,0,-3*s,s],
                fill: this.color,
                stroke: this.color,
                closed: true
            });
        this.label= new Konva.Label();
        this.text=new Konva.Text({fontFamily: 'Monospace', fontSize: this.fontsize, fill: 'black'});

        this.group.add(this.arc);
        this.group.add(this.head);
        this.label.add(this.text);
        this.group.add(this.label);
        
        this.x0 = root.getOpts(config, "x0", 0);
        this.y0 = root.getOpts(config, "y0", 0);
        this.startAngle = root.getOpts(config, "startAngle", 0);
        this.endAngle = root.getOpts(config, "endAngle", 90);
        this.radius =root.getOpts(config, "radius", 10);
        this.format = root.getOpts(config, "format", '%+3.0f°'); // 'φ=%+3.0f°'
        
        this.calc();
        if (typeof layer != 'undefined') {
            layer.add(this.group);
        }
    },
    reverseY: true, // Inverse les coordonnées en Y pour ressembler à un repère normal
    setPoint: function(x0,y0) {
        this.x0=x0;
        this.y0=y0;
        this.calc();
    },
    setAll: function (x0,y0,startAngle,endAngle,radius) {
        this.x0=x0;
        this.y0=y0;
        this.startAngle = startAngle;
        this.endAngle = endAngle;
        this.radius = radius;
        this.calc();
    },
    setAngles: function (startAngle,endAngle) {
        this.startAngle = startAngle;
        this.endAngle = endAngle;
        this.calc();
    },
    setRadius: function (radius) {
        this.radius = radius;
        this.calc();
    },
    setAngleFromPoint: function (x, y, is_end) {
        var angle=(180/Math.PI)*Math.atan2(y-this.y0,x-this.x0);
        if (typeof is_end == 'undefined' || is_end == true) {
            this.endAngle=angle;
        } else {
            this.startAngle=angle;
        }
        this.calc();
    },
    calc: function() {
        var radius = this.radius * this.scale;
        var x0 = this.x0 * this.scale;
        var y0 = this.y0 * this.scale;
        var startAngle = this.startAngle;
        var endAngle = this.endAngle;
        if (this.reverseY) {
            startAngle=-startAngle;
            endAngle=-endAngle;
            y0 = -y0;
        }
        var x1=x0+radius*Math.cos((Math.PI/180)*endAngle);
        var y1=y0+radius*Math.sin((Math.PI/180)*endAngle);
        var visible=this.visible;
        if (Math.abs(endAngle-startAngle)<8) {
            visible=false;
        }
        if (Math.sin((Math.PI/180)*(endAngle-startAngle))>0) {
            var angle=endAngle-startAngle;
            var rotation=startAngle;
            var rot_fleche=+90;
        } else {
            var angle=startAngle-endAngle;
            var rotation=endAngle;
            var rot_fleche=-90;
        }

        var angle_moy=(startAngle+endAngle)/2;
        var xl=x0+(radius+10)*Math.cos((Math.PI/180)*angle_moy);
        var yl=y0+(radius+10)*Math.sin((Math.PI/180)*angle_moy);

        this.arc.setAttrs({
            innerRadius: radius,
            outerRadius: radius,
            angle: angle,
            rotation: rotation
        });
        this.head.setX(x1);
        this.head.setY(y1);
        this.head.setRotation(endAngle+rot_fleche);
        this.arc.setX(x0);
        this.arc.setY(y0);
        this.arc.visible(visible);
        this.head.visible(visible);
        this.label.setX(xl);
        this.label.setY(yl);
        //this.label.setScale(this.text_scale_x,this.text_scale_y);
        //this.label.setScaleY(-1);
        this.label.visible(this.show_angle && visible);
        var disp_angle = endAngle-startAngle;
        if (this.reverseY) {
            disp_angle = -disp_angle;
        }
        this.text.text(sprintf(this.format,disp_angle));
    }
});

return root;
}) ($ML || {}); // Fin de la "Immediately-Invoked Function Expression" (IIFE)