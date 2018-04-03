/*
 * ModSimLib
 * 
 * Simulate models of electric machines
 * 
 * The MIT License (MIT)
 * 
 * Copyright (c) 2017 Charles JOUBERT
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 * 
 */

/*
 * This library make heavy use of KonvaJS (konvajs/konva)
 * KonvaJS is based upon kineticJS from Eric Drowell (which is no longer maintained)
 */

/*
 * This library helps to create graphical building blocks to simulate physical systems
 * Some of these blocks are :
 * 
 * - sliders (linear or logarithmic, with value displayed)
 * - arrows to represent phasors
 * - curved arrow (ArcArrows) to indicate angles between arrows
 * - ImageSwith : on/off switch represented with two different images
 * - SpinningImages : make an image spin at a speed depending on a variable. Can also be moved "by hand"
 * - analog and digital meters
 * - "flow" meters : may represent the flow of power with moving arrows
 * - polyline with dots : The moving yellow dots indicate current. The idea comes from : http://www.falstad.com/circuit/
 * 
 * - ImageLoader : to help load images
 * 
 * 
 */



// Ref: https://stackoverflow.com/questions/35087268/javascript-module-pattern-files-concatenation-in-a-one-file-and-using-their-func
var $ML = (function(root) {
// Anonymous function to initialize $ML
// "Immediately-Invoked Function Expression" (IIFE)




root.default_layer = 0;
root.set_default_layer = function (layer) {
    root.default_layer = layer;
}


root.getOpts = function (opt_array, name, default_value) {
    /*
     * Get element of opt_array whose name is "name"
     * If opt_array is undefined, or does not contain "name"
     * default_value is used instead
     */
    if (opt_array === undefined || opt_array[name] === undefined)
        return default_value;
    else
        return opt_array[name];
}

// Clone an object
root.clone = function(obj) {
    if (null == obj || "object" != typeof obj) return obj;
    var copy = obj.constructor();
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = root.
            clone(obj[attr]);
    }
    return copy;
}

// inspect an object (for debugging)
// usage : xinspect(object)
root.xinspect = function(o, maxrecurse, i){
    if(typeof maxrecurse == 'undefined') maxrecurse=3;
    if(typeof i == 'undefined') i=0; // Present level of recursion
    if(i > maxrecurse) return '[MAX RECURSION LEVEL]';
    var spc = Array(i).join("  ");
    var r='';
    for(var p in o){
        var t=typeof o[p];
        r=r+(spc+'"'+p+'" ('+t+') => '+(t=='object' ? 'object:'+xinspect(o[p], maxrecurse, i + 1) : o[p]) +'\n');
    }
    return r;
}


root._block = function(config) {
}
    
root.block_list = [];
root.block_dict = {};

root._block.prototype = {
    _register: function(config, block_class, inputs, outputs) {
        if (config === undefined)
            config = {};
        this.config = config;
        if (inputs === undefined)
            inputs = [];
        if (outputs === undefined)
            outputs = [];
        this.inputs = inputs;
        this.outputs = outputs;
        this.block_class = block_class;
        this.hidden = false;
        this._init(config);
        this._postinit();
        self = this;
        root.block_list.push(self);  // registering current block
        root.block_dict[block_class + "." + self.name] = self;
        return config;
    },
    addToLayer : function (layer) {
        this.layer = layer;
        layer.add(this.group);
    },
    setPosition : function (p) {
        this.group.setPosition(p);
    },
    rotateDeg : function (a) {
        this.group.rotateDeg(a);
    },
    draggable : function (b) {
        this.group.draggable(b);
    },
    visible : function (b) {
        if (b) {
            this.hidden = false;
            this.group.show();
        } else {
            this.hidden = true;
            this.group.hide();
        }
    },
    _postinit: function () {
        if ("x" in this.config && "y" in this.config) {
            this.setPosition({x:this.config.x, y:this.config.y});
        }
        if ("layer" in this.config) {
            if (this.config.layer) {
                this.addToLayer(this.config.layer);
            }
        } else if  (root.default_layer) {
            this.addToLayer(root.default_layer);
        }
        if ("name" in this.config) {
            this.name = this.config.name;
        }
        if ("draggable" in this.config) {
            this.draggable(this.config.draggable);
        }
    },
};

/*
 * Extends an old prototype with a new one.
 * Poor man inheritance
 * 
 */
root._xtend=function(old_proto, new_proto) {
        proto_base = Object.create(old_proto);
        for (var attrname in new_proto) { proto_base[attrname] = new_proto[attrname]; }
        return proto_base;
};

/*
 * Specialized inheritance for the core library
 */
root._block_xtend=function(new_proto) {
        root._xtend(root._block.prototype, new_proto);
        return proto_base;
};

root.iterate_blocks = function (class_re, name_re, func, arg) {
    /*
     * call func(block, arg) for each block that
     * corresponds to class_re and name_re
     * class_re and name_re are strings corresponding to regular expressions
     */
    var re_c = new RegExp(class_re);
    var re_n = new RegExp(name_re);
    var count = root.block_list.length;
    for(var i = 0; i < count; i++) {
        var e = root.block_list[i];
        if (typeof e.block_class == "undefined" || ! re_c.test(e.block_class)) {
            continue;
        }
        if (typeof e.name == "undefined" || ! re_n.test(e.name)) {
            continue;
        }
        func(e, arg);
    }
}

/*
 * Make all blocks draggable / not draggable. Usefull to place the blocks with the mouse
 * 
 */
root.draggable_all = function (state) {
    var count = root.block_list.length;
    for(var i = 0; i < count; i++) {
        var e = root.block_list[i];
        e.draggable(state);
    }
}

/*
 * Helper function to be called when a button is clicked. e.g. :
 *  <button onclick="$ML.toggle_draggable(this)">Drag</button> 
 * 
 */
root.toggle_draggable = function (button) {
    var node = button.childNodes[0];
    if (node.data != "Do NOT drag") {
        node.data = "Do NOT drag";
        root.draggable_all(true);
    } else {
        node.data = "Drag";
        root.draggable_all(false);
    }
}

root.dump_blocks = function () {
    var count = root.block_list.length;
    for(var i = 0; i < count; i++) {
        var e = root.block_list[i];
        var block_class = e.block_class;
        var name = e.name;
        var pos = e.group.getPosition();
        var x = pos.x;
        var y = pos.y;
        console.log("{ block_class:\"" + block_class + "\", name:\"" + name +
            "\", x:" + x +
            ", y:" + y +
            ", }," 
            );
    }
}



return root;
}) ($ML || {}); // Fin de la "Immediately-Invoked Function Expression" (IIFE)


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

/****************************************************************************
 *                   Sliders
 ****************************************************************************/

var $ML = (function(root) {

root.Slider = function (config) {
    /*
     * Crée un slider
     * Options (dans config) :
     * min: valeur mini
     * max: valeur maxi
     * n: nombre de positions
     * value: valeur initiale
     * format: si présent : la valeur est affichée avec le format (façon printf)
     * log: si présent et à true : échelle logarithmique
     * color: couleur du curseur (et du texte si présent)
     * width:
     * height: dimensions du slider
     * 
     * MEMBRES:
     * value: valeur courante du slider
     * 
     * FONCTIONS MEMBRES:
     * setval(v): force la valeur du slider
     * getval() : renvoie la valeur courante
     * addToLayer(layer): ajoute l'instrument à la couche "layer"
     * setPosition(p): change la position à p
     * rotateDeg(a): tourne l'ensemble de a degres
     * draggable(b): si b==true : rend "draggable"
     * 
     */
    this._register(config, "Slider", [], ["value"]);
};

root.Slider.prototype = root._block_xtend({
    _init: function (config) {
        this.group = new Konva.Group();
        this.min = root.getOpts(config, "min", 0);
        this.max = root.getOpts(config, "max", 100);
        this.n   = root.getOpts(config, "n", 11);
        this.log  = root.getOpts(config, "log", false);
        this.color = root.getOpts(config, "color", "#808080");
        this.width = root.getOpts(config, "width", 100);
        this.height = root.getOpts(config, "height", 15);
        this.slow_callback = root.getOpts(config, "slow_callback", null);
        this.fast_callback = root.getOpts(config, "fast_callback", null);
        this.bw = 2 * this.height; // button width
        this.dx = (this.width - this.bw) / (1.0*(this.n-1));  // pixel step for cursor
        var self = this;
        if (!this.log){  // if it is a linear scale :
            this._index2val = function (i) {
                return self.min + (i / (self.n-1)) * (self.max - self.min);
            };
            this._val2index = function (v) {
                return Math.round((self.n - 1) * (v - self.min) / (self.max - self.min));
            };
        } else {  // for logarithmic scale
            this._index2val = function (i) {
                return self.min * Math.pow(self.max/self.min, i/(self.n-1));
            };
            this._val2index = function (v) {
                return Math.round((self.n - 1) * Math.log(v / self.min) / Math.log(self.max / self.min));
            };
        }
        this.base = new Konva.Rect({
                x: 0,
                y: 0,
                width: this.width,
                height: this.height,
                fill: "#F0F0F0",
                stroke: 'black'
            });
        this.cursor = new Konva.Rect({
                x: 0,
                y: 0,
                width: this.bw,
                height: this.height,
                cornerRadius: this.height/2,
                fill: this.color,
                stroke: 'black',
                draggable: true,
                dragBoundFunc: function(pos) {
                    var p = self._get_relative_cursor_position(pos);
                    var pos_index = Math.round(p.x / (1.0*self.dx));
                    if (pos_index >= self.n)
                        pos_index = self.n - 1;
                    if (pos_index < 0)
                        pos_index = 0;
                    //console.log("pos_index: ", pos_index, self.n);
                    self.value = self._index2val(pos_index);
                    //console.log("**Value   : ",self.value, pos_index);
                    var x = self.dx * pos_index;
                    if (self.text) {
                        self.text.setText(sprintf(self.format, parseFloat(self.value)));
                    }
                    if (self.fast_callback) {  // appelé a chaque mouvement du curseur
                        self.fast_callback(self.value, self);
                    }
                    //console.log("x: " + x + "x0: " + x0 + "y0: " + y0);
                    return self._set_relative_cursor_position({x:x, y:0});
                }
        });
        if (this.slow_callback) {  // appelé seulement au relachement du curseur
            this.cursor.on("dragend", function(evt) {
                self.slow_callback(self.value, self);
            });
        }   
        this.group.add(this.base);
        this.group.add(this.cursor);
        // Set initial value and put cursor at the good position
        // at this time, there is no rotation, so call this._setval
        // instead of this.setval
        if ("value" in config) {
            var _posx = this._setval(config["value"]);
        } else {
            var _posx = this._setval(this.min);
        }
        this.cursor.setPosition({x:_posx, y:0});
        if ("format" in config) {   // On va rajouter l'affichage de la valeur
            this.format = config.format;
            this.text = new Konva.Text({
                    x: 0,
                    y: -this.height,
                    text: sprintf(this.format, parseFloat(this.value)),
                    fontSize: 14,
                    fontFamily: 'Monospace',
                    fill: this.color,
                    align: 'left'
            });
            this.group.add(this.text);
            this.text.setY(-this.text.getTextHeight());
        }
    },
    _get_relative_cursor_position: function(p) {
        // Transforms coordinates in p to be relative to group position
        // Could be changed for vertical slider
        if (typeof p === "undefined") {
            p = this.cursor.getAbsolutePosition();
        }
        var pg = this.group.getAbsolutePosition();
        //console.log("_get_relative_cursor_position: ", pg, p);
        var pr = {x:(p.x-pg.x), y:(p.y-pg.y)};
        return pr;
    },
    _set_relative_cursor_position: function(p) {
        // Transforms coordinates in p to be absolute
        // Could be changed for vertical slider
        var pg = this.group.getAbsolutePosition();
        var pr = {x:(p.x+pg.x), y:(p.y+pg.y)};
        //console.log("_set_relative_cursor_position", p, pg, pr);
        return pr;
    },
    _setval: function (v) { // Internal function. Used alone before any rotation
        if (v < this.min) v=this.min;
        if (v > this.max) v=this.max;
        this.value = v;
        var x = this._val2index(v) * this.dx;
        return x;
    },
    setval: function (v) { // Set value
        var x = this._setval(v);
        var p = this._set_relative_cursor_position({x:x, y:0});
        //console.log("setval: ", v, this._val2index(v), x);
        this.cursor.setAbsolutePosition(p);
    },
    getval: function () {
        return this.value;
    },
});


root.VSlider = function(config) {
    this._register(config, "VSlider", [], ["value"]);
};


root.VSlider.prototype = root._xtend(root.Slider.prototype, {
    _init: function (config) {
        root.Slider.prototype._init.call(this, config);
        this.group.rotate(-90);
    },
    _get_relative_cursor_position: function(p) {
        // Transforms coordinates in p to be relative to group position
        if (typeof p === "undefined") {
            p = this.cursor.getPosition();
        }
        var pg = this.group.getPosition();
        var pr = {x:-(p.y-pg.y), y:(p.x-pg.x)};
        return pr;
    },
    _set_relative_cursor_position: function(p) {
        // Transforms coordinates in p to be absolute
        var pg = this.group.getPosition();
        var pr = {x:(p.y+pg.x), y:(-p.x+pg.y)};
        //console.log("_set_relative_cursor_position", p, pg, pr);
        return pr;
    },
});


return root;
}) ($ML || {}); // Fin de la "Immediately-Invoked Function Expression" (IIFE)

/****************************************************************************
 *                   Meters / Flowmeters ... 
 ****************************************************************************/

var $ML = (function(root) {

root.FlowMeter = function(config) {
    /*
     * Crée un appareil de mesure de "flux" (exemple puissances)
     * Options (dans config) :
     * x:
     * y: Position de l'objet
     * max: valeur max (en absolu) correspondant à la vitesse de défilement  des fleches maximale
     * color: couleur des fleches (et eventuellement du texte)
     * height:
     * width:  hauteur et largeur de la zone des fleches
     * format: si présent : format numérique (printf) de la valeur affichée
     *         s'il n'est pas présent : la valeur n'est pas affichée
     * 
     * FONCTIONS MEMBRES:
     * setval(v) : change la valeur à v
     * addToLayer(layer): ajoute l'instrument à la couche "layer"
     * setPosition(p): change la position à p
     * rotateDeg(a): tourne l'ensemble de a degres
     * draggable(b): si b==true : rend "draggable"
     * 
     */
    config = this._register(config, "FlowMeter", ["value"], []);
}

root.FlowMeter.prototype = root._block_xtend({ 
    _init: function(config){
        this.group = new Konva.Group();
        this.max = root.getOpts(config, "max", 100);
        this.color = root.getOpts(config, "color", "yellow");
        this.reverse = root.getOpts(config, "reverse", false); // inversion entre sens flêche et indication
        var h = root.getOpts(config, "height", 15);  // height and width of display area
        var w = root.getOpts(config, "height", 100); 
        var b = 2;   // inner margin
        var N = 3;  // number of arrows
        this.wa = Math.round(w / N);  // width between arrows
        this.ha = Math.round(h/2); // arrow half height
        var disp_rect = {fill: 'white', stroke: 'black', strokeWidth: 1,
            x:0, y:0, width:w, height:h
        };
        var dx = 0;
        var dy = 0;  // translation of display rectangle and arrows

        if ("format" in config) {   // On va tracer un cadre autour et mettre un texte avec la valeur
            this.format = config.format;
            var dx = b;
            var dy = b;  // translation of display
            this.bigbox = new Konva.Rect({
                x: 0,
                y: 0,
                width: w+2*b,
                height: 2*h+3*b,
                fill: 'white',
                stroke: 'black',
                strokeWidth: 1
            });
            this.group.add(this.bigbox);
            this.text = new Konva.Text({
                    x: b,
                    y: h+2*b,
                    text: '0123456',
                    fontSize: 12,
                    fontFamily: 'Monospace',
                    fill: this.color,
                    align: 'left'
            });
            this.group.add(this.text);
            this.bigbox.setHeight(this.text.getTextHeight()+h+3*b);
        } else {
        }
        this.box = new Konva.Rect(disp_rect);
        this.group.add(this.box);
        this.box.setPosition({x:dx, y:dy});
        this.arrows=[];
        var arrow_group = new Konva.Group();
        arrow_group.setClip({x:0, y:0, width:w, height:h});
        for (var i=0 ; i<N ; i++){
            var arrow=new Konva.Line({
                fill: this.color,
                stroke: this.color,
                closed: true
            });
            arrow.move(dx, dy);
            this.arrows.push(arrow);
            arrow_group.add(arrow);
        }
        this.group.add(arrow_group);
        arrow_group.setPosition({x:dx, y:dy});
        this.offset=0;     // offset for arrow position
        this.setval(0);
    },
    _set_arrows: function(time_diff) {
        this.offset = this.offset + this.speed * time_diff;
        if (this.offset > 1) this.offset = 0;
        if (this.offset < 0) this.offset = 1;
        var N = this.arrows.length;
        for (var i=0 ; i<N ; i++){
            var ox = this.wa * (i + this.offset); // Offset
            //ox = this.wa * (ox-Math.floor(ox));
            this.arrows[i].setPoints([ox, 0, ox + this.ep, this.ha, ox, this.ha*2]);
        }
    },
    setval: function (v) {
        if (this.text)
            this.text.setText(sprintf(this.format, parseFloat(v)));

        if (v < -this.max) v = -this.max;
        if (v > this.max)  v = this.max;
        if (this.reverse) v = -v;

        this.ep = Math.round(2 * this.ha * v / this.max);
        this.speed = 3 * v / (this.max * 1000);
        this._set_arrows(0);
    },
    addToLayer : function (layer) {
        this.layer = layer;
        var self = this;
        this.anim = new Konva.Animation(function (frame) {
            self._set_arrows(frame.timeDiff);
        }, layer);
        layer.add(this.group);
        this.anim.start();
    },
});

/****************************************************************************
 *                   Meters 
 ****************************************************************************/

// Appareil de mesure numerique
root.DigitalMeter = function (config) {
    /*
     * Crée un appareil de mesure numerique
     * Options (dans config) :
     * x:
     * y: Position de l'objet
     * width:
     * height:
     * max: valeur max 
     * min : valeur min
     * color: couleur du texte
     * fill: si présent : couleur de remplissage
     * stroke: si présent : couleur du contour
     * scale: échelle (1.0 par défaut)
     * unit: unité (exemple : 'V' ou 'A' ou 'W' ou 'Ω' ...
     * format: format numérique (printf) de la valeur affichée
     * 
     * FONCTIONS MEMBRES:
     * setval(v) : change la valeur à v
     * addToLayer(layer): ajoute l'instrument à la couche "layer"
     * setPosition(p): change la position à p
     * rotateDeg(a): tourne l'ensemble de a degres
     * draggable(b): si b==true : rend "draggable"
     * 
     */

    config = this._register(config, "DigitalMeter", ["value"], []);
    this.setval(this.value);
};

root.DigitalMeter.prototype = root._block_xtend({
    _init:function(config) {
        config = config || {};
        
        this.value = root.getOpts(config, "value", 0.0);
        
        this.width = root.getOpts(config, "width", 80);
        this.adapt_width_for = root.getOpts(config, "adapt_width_for", null);
        this.height = root.getOpts(config, "height", 15);
        this.format = root.getOpts(config, "format", '%3.0f');
        this.scale = root.getOpts(config, "scale", 1.0);
        this.color = root.getOpts(config, "color", "black");
        this.fill = root.getOpts(config, "fill", null);
        this.stroke = root.getOpts(config, "stroke", null);
        
        this.group = new Konva.Group();
        
        this.text = new Konva.Text({
                x: 2,
                y: 2,
                text: '999',
                fontSize: 14 * this.scale,
                fontFamily: 'monospace',
                fill: this.color,
                align: 'left'
            });
        if (this.adapt_width_for !== null) {
            this.text.setText(sprintf(this.format, this.adapt_width_for));
            var rect_width = this.text.getTextWidth();
            var rect_height = this.text.getTextHeight();
        } else {
            var rect_width = this.width * this.scale;
            var rect_height = this.height * this.scale;
        }
            

        if (this.fill || this.stroke) {
            var rect = {
                    x: 0,
                    y: 0,
                    width: rect_width,
                    height: rect_height,
                };
            if (this.fill)
                rect.fill = this.fill;
            if (this.stroke)
                rect.stroke = this.stroke;
            this.base = new Konva.Rect(rect);
            this.group.add(this.base);
        }

        this.group.add(this.text);
    },
    setval: function (v) {
        this.text.setText(sprintf(this.format, v));
        this.layer.draw();
    },
});


// Appareil de mesure à aiguille
root.AnalogMeter = function (config) {
    /*
     * Crée un appareil de mesure à aiguille
     * Options (dans config) :
     * x:
     * y: Position de l'objet
     * max: valeur max 
     * min : valeur min
     * color: couleur du fond
     * text_color: color du texte
     * scale: échelle (1.0 par défaut)
     * unit: unité (exemple : 'V' ou 'A' ou 'W' ou 'Ω' ...
     * format: si présent : format numérique (printf) de la valeur affichée
     *         s'il n'est pas présent : la valeur n'est pas affichée
     * 
     * FONCTIONS MEMBRES:
     * setval(v) : change la valeur à v
     * addToLayer(layer): ajoute l'instrument à la couche "layer"
     * setPosition(p): change la position à p
     * rotateDeg(a): tourne l'ensemble de a degres
     * draggable(b): si b==true : rend "draggable"
     * 
     */

    config = this._register(config, "AnalogMeter", ["value"], []);
    this.setval(this.value);
};



root.AnalogMeter.prototype = root._block_xtend({
    _init:function(config) {
        config = config || {};
        
        this.min = root.getOpts(config, "min", 0);
        this.max = root.getOpts(config, "max", 0);
        this.value = root.getOpts(config, "value", this.min);
        
        this.unit = root.getOpts(config, "unit", '');
        this.format = root.getOpts(config, "format", '%3.0f');
        this.scale = root.getOpts(config, "scale", 1.0);
        this.color = root.getOpts(config, "color", "lightblue");
        this.text_color = root.getOpts(config, "text_color", "#555");

        this._redLine = new Konva.Line({
            points: [0, 0, -20 * this.scale, 0],
            y:-2,
            stroke: 'red',
            strokeWidth: 2,
            lineCap: 'round',
            lineJoin: 'round'
        });

        this._path = new Konva.Path({
            // Donnees SVG issues de voltmetre.svg et voltmetre.odg
            data: 'M 14,-2484 C -1216,-2484 -2155,-1545 -2155,-315 -2155,-207 -2148,-101 -2133,2 L -1483,2 C -1435,-799 -803,-1399 14,-1399 831,-1399 1463,-799 1511,2 L 2162,2 C 2177,-101 2184,-207 2184,-315 2184,-1545 1244,-2484 14,-2484 Z M 14,-2800 C 1423,-2800 2500,-1724 2500,-315 2500,1094 1423,2171 14,2171 -1395,2171 -2471,1094 -2471,-315 -2471,-1724 -1395,-2800 14,-2800 Z',
            fill: this.color,
            scale: {x:0.01 * this.scale, y:0.01 * this.scale}
        });

        this._back_path = new Konva.Path({
            // Donnees SVG issues de voltmetre_back.svg et voltmetre.odg (in yellow)
            data: 'M 0,-2700 C 1361,-2700 2400,-1704 2400,-400 2400,904 1361,1900 0,1900 -1361,1900 -2400,904 -2400,-400 -2400,-1704 -1361,-2700 0,-2700 Z M -2400,-2700 L -2400,-2700 Z M 2401,1901 L 2401,1901 Z',
            fill: "white",
            scale: {x:0.01 * this.scale, y:0.01 * this.scale}
        });

        this._unite = new Konva.Text({
                x: 0,
                y: 0,
                text: this.unit,
                fontSize: 12 * this.scale,
                fontFamily: 'Monospace',
                fill: this.text_color,
                align: 'center'
            });
        this._unite.setX(-this._unite.getTextWidth()/2);
        this._unite.setY(-this._unite.getTextHeight());
        this.group = new Konva.Group();
        this.group.add(this._back_path); // back of the meter to avoid "look through" problem
        this.group.add(this._redLine);
        this.group.add(this._path);
        this.group.add(this._unite);

        if (this.format) {
            this._valeur = new Konva.Text({
                    x: 0,
                    y: 2 * this.scale,
                    text: '999',
                    fontSize: 12 * this.scale,
                    fontFamily: 'Monospace',
                    fill: this.text_color,
                    align: 'right'
                });
            this._valeur.setX(-this._valeur.getTextWidth()/2);
            this.group.add(this._valeur);
        }
    },
    setval: function (v) {
        if (this.format) {
            this._valeur.setText(sprintf(this.format, v));
            this._valeur.setX(-this._valeur.getTextWidth()/2);
        }
        if (v<this.min) v=this.min;
        if (v>this.max) v=this.max;
        var angle = 0+180*(v-this.min)/(this.max-this.min);
        angle = Math.PI*angle/180;
        var x = -Math.cos(angle)* 20 * this.scale;
        var y = -Math.sin(angle)* 20 * this.scale;
        this._redLine.setPoints([0, 0, x, y]);
        this.layer.draw();
    },
});


return root;
}) ($ML || {});
/****************************************************************************
 *                   On/Off Switch
 ****************************************************************************/

var $ML = (function(root) {

root.ImageSwitch = function (config) {
    /*
     * Charge un bouton On/Off
     * 
     * config: options de configuration:
     * - img_false : image affichée pour l'état "false" (off)
     * - img_true : image affichée pour l'état "true" (on)
     * - value : valeur initiale
     * - callback : si présent, fonction appelée avec comme argument : (valeur, objet ImageSwitch)
     * - x : position en abscisse
     * - y : position en ordonnee
     * 
     * PROPRIETES:
     * value : valeur (true/false)
     * 
     * FONCTIONS MEMBRES:
     * 
     * 
     */
    this._register(config, "ImageSwitch", [], ["value"]);
}

root.ImageSwitch.prototype = root._block_xtend({
    _init: function (config) {
        this.img=[];
        this.img[0] = root.getOpts(config, "img_false", null);
        this.img[1] = root.getOpts(config, "img_true", null);
        this.value = root.getOpts(config, "value", false);
        this.group = new Konva.Group();
        this.callback = root.getOpts(config, "callback", null);
        this.sw_groups = [];  // switch groups the switch is belonging to
        var img_opt = {x:0, y:0};
        var self = this;
        var il_config = {
            visible_only: (this.value) ? 1 : 0,
            callback: function(IL) {
                for (var i = 0 ; i<2 ; i++) {
                    //console.log("cb: ", i);
                    var  shape = IL.getKImage(i);
                    shape.on("click", function (evt) {self._do_switch(evt);});
                    shape.setName(sprintf("%d",i));
                }
            },
            layer:this.group,   // TODO: pas très satisfaisant !! Mettre à 0 puis tout placer ds un groupe
        };
        this.loader = new root.ImageLoader(this.img, img_opt, il_config);
    },
    _setval: function (val) { // Force the value of the switch
        // For use by sw groups to avoid infinite recursion
        //console.log("Val: ", val)
        if (val) {
            this.loader.show_only(1);
            this.value = true;
        } else {
            //console.log("ZERO");
            this.loader.show_only(0);
            this.value = false;
        }
        this.layer.draw();
    },
    setval: function (val, excl_group) { 
        this._setval(val);
        for (var i = 0; i < this.sw_groups.length ; i++) {
            if (typeof excl_group == "undefined" || excl_group != this.sw_groups[i]) {
                this.sw_groups[i].signal(this); // signals a change for current switch
            }
        }
    },
    _do_switch: function (evt) {
        var target = evt.target;
        //console.log("sw: ", target.name(), "Name: ", this.name);
        this.setval(target.name() == "0");
        if (this.callback) {
            this.callback(this.value, this);
        }
    },
    getval: function () {
        return this.value;
    },
});


root.SwitchGroup = function (config, sw_list) {
    /*
     * Group switches for synchronous operation
     * 
     * A switch can be part of one or several groups.
     * 
     * config: config options:
     * - exclusive (boolean): 
     *   * true  (default) : at most ONE switch in the group can be "on" at a time
     *   * false : all the swithches in the group have the same state
     * 
     * PROPERTIES:
     * value : valeur (true/false)
     * 
     * MEMBER FUNCTIONS:
     * - add(sw) : adds swith sw to the group
     * 
     */
    this.exclusive = root.getOpts(config, "exclusive", true);
    this.sw_list = [];
    if (typeof sw_list == "undefined") {
        sw_list = [];
    }
    for (var i = 0 ; i < sw_list.length ; i++) {
        this.add(sw_list[i]);
    }
}

root.SwitchGroup.prototype={
    add: function (sw) {
        sw.sw_groups.push(this);  // let the switch know it is belonging to this present group
        this.sw_list.push(sw);
    },
    signal: function (sw) { // switch sw signals its states has just changed
        var sw_state = sw.getval();
        for (var i = 0 ; i < this.sw_list.length ; i++) {
            if (this.sw_list[i] != sw) {
                if (this.exclusive) {
                    //console.log("exclusive i: ", i, "state: ", !sw_state);
                    this.sw_list[i].setval(false, this);
                } else {
                    this.sw_list[i].setval(sw_state, this);
                }
            }
        }
    },
}


return root;
}) ($ML || {});



/****************************************************************************
 *                   ImageLoader
 ****************************************************************************/

var $ML = (function(root) {


root.ImageLoader =  function(URLs, img_opt, config) {
    /*
     * Charge (et affiche) une série d'images
     * 
     * URLs: tableau contenant :
     *   - soit des chaines de caracteres donnant l'URL des images a charger
     *   - soit des tableaux avec comme elements :
     *     * une chaine de caractere donnant l'URL de l'image
     *     * la position en x
     *     * la position en y
     *     * le zindex (numérique ou "top" ou "bottom"). Peut etre omis ou remplace par null
     *     * une chaine de caracteres contenant une ou plusieurs des options :
     *       - 'c' : (x, y) est la position du CENTRE de l'image au lieu du coin superieur gauche
     *       - 'r' : le centre de rotation est le centre de l'image
     *       - 'd' : l'image peut etre deplacée à la souris (draggable)
     *       - 'h' : l'image est initialement cachee
     * img_opt: options qui sont passées à TOUTES les images
     * config: options pour ImageLoader:
     * - layer : si présent : on ajoute toutes les images à la couche "layer" (ce peut être un autre type de container)
     *           un groupe par exemple
     * - callback : si présent, fonction appelée (avec l'objet ImageLoader comme argument) quand tout est chargé
     * - visible_only : si présent et >=0 : seule l'image d'index visible_only sera visible
     * - dx : decalage suivant x ajouté à chaque image
     * - dy : decalage suivant y ajouté à chaque image
     * - partial: ne crée pas les image KImages
     * - zindex : force le zindex de la Kimage dans son container. Si zindex=="top" ou "bottom" : force
     *   à top ou bottom
     * 
     * PROPRIETES:
     * length : nombre d'images (== nombre d'éléments dans URLs)
     * load_complete : vrai si toutes les images ont été chargées
     * loaded : nombre d'images effectivement chargées
     * visible_only : si >=0 : indique que l'image d'index visible_only est la seule visible
     * 
     * FONCTIONS MEMBRES:
     * getImage(i) : renvoie l'Image (javascript) d'index i
     * getKImage(i) : renvoie l'Image (Konvajs) d'index i
     * show_only(i) : affiche l'image d'index i et cache toutes les autres
     * show_all() : affiche toutes les images
     * is_only_visible(i) : vrai si seulement l'image d'index i est visible
     * createKImages(layer) : créée des images KImages à partir de celles chargées, et les
     *     ajoute à la couche "layer" (si le paramètres n'est pas null)
     * 
     */
    this.URLs = URLs;
    this.img_opt = img_opt || {};
    this._init(config);
}
        // TODO : test le fait de mettre un array au lieu de SRC
        // Dans l'array :
        // [src, x, y, zindex]
        // seul src est obligatoire
        // rajouter un parametre pour le positionnement (centré ou non) et le point de referencement
root.ImageLoader.prototype={
    _init: function(config) {
        this.img_opt["x"] = root.getOpts(this.img_opt, "x", 0); // force l'existence de x et y
        this.img_opt["y"] = root.getOpts(this.img_opt, "y", 0);
        this.config = config || {};
        if ("layer" in this.config) {
            this.addToLayer(this.config.layer);
        } else if  (root.default_layer) {
            this.addToLayer(root.default_layer);
        } else {
            this.layer = null;
        }
        this.callback = root.getOpts(this.config, "callback", null);
        this.visible_only = root.getOpts(this.config, "visible_only", -1);
        this.partial = root.getOpts(this.config, "partial", false);
        this.zindex = root.getOpts(this.config, "zindex", null);
        this.dx = root.getOpts(this.config, "dx", 0);
        this.dy = root.getOpts(this.config, "dy", 0);
        this.image_properties = [];
        this.length = this.URLs.length;
        this.loaded = 0;
        this.load_complete = false;
        //console.log(" ** layer name ", this.layer.my_name);
        for (var i = 0; i < this.length ; i++) {
            var img = new Image();
            if (this.URLs[i].constructor == Array) {
                var prop = this.URLs[i];
                var src = prop[0];
            } else {
                var prop = [];
                var src = this.URLs[i];
            }
            this.image_properties[i] = {img: img, src:src, loaded:false, KImage:null, prop:prop};
            img.src = src;
            img.index = i;      // See: http://stackoverflow.com/questions/17578280/how-to-pass-parameters-into-image-load-event
            img.context = this; // See: http://stackoverflow.com/questions/17578280/how-to-pass-parameters-into-image-load-event
            img.onload = this._image_loaded;
        }
    },
    _image_loaded: function () {
        var i = this.index;
        var self = this.context;
        //console.log("  _image_loaded index:", i, " src:", this.src);
        self.image_properties[i]["loaded"] = true;
        self.loaded++;
        //console.log("Prop: " + xinspect(self.image_properties[i]) + "\n  i=" + i);
        //console.log("Processing " + i + " src=" + self.image_properties[i]["src"]);
        if (self.loaded == self.length) {
            self.load_complete = true;
            //console.log("****  load_complete = true ****");
            if (! self.partial) {
                //console.log(" ** createKImages. Name: ", self.layer.my_name);
                self.createKImages(self.layer, self.zindex);
            }
            if (self.callback) {
                self.callback(self);  // Called upon loading of all images
            }
        }
    },
    createKImages: function(layer, zindex) {
        //console.log("createKImages. Layer name ", layer.my_name);
        for (var j = 0; j < this.length ; j++) {
            var properties = this.image_properties[j];
            var img_opt = root.clone(this.img_opt);
            img_opt["image"] = properties["img"];
            if (typeof properties.prop[1] != 'undefined') {
                img_opt["x"] = properties.prop[1];
            }
            if (typeof properties.prop[2] != 'undefined') {
                img_opt["y"] = properties.prop[2];
            }
            if (typeof properties.prop[3] != 'undefined' && properties.prop[3] != null) {
                zindex = properties.prop[3];
            }
            if (this.dx)
                img_opt["x"] += j*this.dx;
            if (this.dy)
                img_opt["y"] += j*this.dy;
            var KImage=new Konva.Image(img_opt);
            if (this.visible_only >= 0) {  // display only image of index j
                //console.log("Visible only"); 
                if (this.visible_only == j) {
                    KImage.show();
                } else {
                    KImage.hide();
                }
            }
            if (typeof properties.prop[4] != 'undefined') {  // Infos sur le positionnement et centre rotation
                var action = properties.prop[4];
                w = KImage.width();
                h = KImage.height();
                var R = action.indexOf("r") >= 0;  // Img must be rotated around its center
                var C = action.indexOf("c") >= 0;  // The given coordinates are the center of img
                // See: https://github.com/konvajs/konva/issues/26
                if (R) {
                    // l'axe de rotation est fixé au centre de l'objet, et le centre corespond aux
                    // nouvelles coordonnées de l'objet
                    KImage.offsetX(w / 2);
                    KImage.offsetY(h / 2);
                }
                if (R && !C) {
                    // On déplace l'objet
                    KImage.x(KImage.x() + w / 2);
                    KImage.y(KImage.y() + h / 2);
                }
                if (C && !R) {
                    KImage.x(KImage.x() - w / 2);
                    KImage.y(KImage.y() - h / 2);
                }
                if (action.indexOf("d") >= 0) {
                    KImage.draggable(true);
                }
                if (action.indexOf("h") >= 0) {
                    KImage.hide();
                }
            }
            this.image_properties[j]["KImage"] = KImage;
            if (layer) {
                //console.log("Adding layer ", j, " layer name ", layer.my_name, " src=", this.image_properties[j]["src"]);
                layer.add(KImage);
                if (typeof zindex == "string" && zindex == "top") {
                    KImage.moveToTop();
                } else if (typeof zindex == "string" && zindex == "bottom") {
                    KImage.moveToBottom();
                } else if (typeof zindex == "number") {
                    KImage.setZIndex(zindex);
                }
            }
        }
        if (layer) {
            layer.draw(); // Pour s'assurer qu'on redessine tout une fois les images chargées
        }
    },
    getImage: function(i) {
        if (i >= 0 && i < this.length && this.load_complete) {
            return this.image_properties[i]["img"];
        } else {
            return null;
        }
    },
    getKImage: function(i) {
        if (i >= 0 && i < this.length && this.load_complete) {
            return this.image_properties[i]["KImage"];
        } else {
            return null;
        }
    },
    show_only: function(i) {
        this.visible_only = i;
        for (var j = 0; j < this.length ; j++) {
            if (j == i) {
                this.getKImage(j).show();
            } else {
                this.getKImage(j).hide();
            }
        }
    },
    show_all: function() {
        this.visible_only = -1;
        for (var j = 0; j < this.length ; j++) {
            this.getImage(i).show();
        }
    },
    is_only_visible: function(i) {
        if (this.visible_only < 0) {
            return false;
        } else  {
            return this.getImage(i).isVisible();
        }
    },
    addToLayer : function (layer) {
        this.layer = layer;
    },
    dump: function() {
        // TODO: do not dump to console, but to a string instead
        for(var i = 0; i < this.length; i++) {
            var e = this.getKImage(i);
            var src = e.getImage().src;
            var x = e.getX();
            var y = e.getY();
            var zi = e.getZIndex();
            var prop = this.image_properties[i].prop[4];
            var str = "['" + src + "', " + x + ", " + y + ", " + zi;
            if (typeof prop != 'undefined') {
                str += ", '" + prop + "'";
            }
            str += "], // index : " + i;
            console.log(str);
        }
    },
};

/****************************************************************************
 *                   SpinningImage
 ****************************************************************************/


root.SpinningImage = function (config) {
    /*
     * Image tournante. La vitesse peut être changée
     * 
     * On peut specifier soit une image, soit une liste de nodes, à faire tourner.
     * 
     * config: options pour l'image:
     * - img (opt): url de l'image
     * - objs (opt): tableau de nodes Konva à placer dans le groupe tournant
     * - layer : si présent : on ajoute toutes les images à la couche "layer"
     * - x : 
     * - y : position de l'image
     * - min : valeur minimale du paramètre (default : 0)
     * - max : valeur maximale du paramètre - correspond à la vitesse max (default : 100)
     * - max_speed : vitesse maximale. Exprimée en t/s (default : 1 t/s)
     * - reverse : si "true" : la rotation s'effectue dans le sens inverse
     * - value : valeur initiale de la vitesse
     * 
     * FONCTIONS MEMBRES:
     * setval(v) : change la valeur de la vitesse à v
     * addToLayer(layer): ajoute l'instrument à la couche "layer"
     * setPosition(p): change la position à p
     * draggable(b): si b==true : rend "draggable"
     * man_rotate(b): si b==true : on peut faire tourner l'image à la souris
     * set_angle(a): remet l'angle à la valeur a
     * add_angle(a): additionne a à l'angle courant
     * get_angle(): renvoie la valeur courante de l'angle
     * 
     * 
     * 
     */
    this._register(config, "SpinningImage", ["value"], []);
}

root.SpinningImage.prototype = root._block_xtend({
    _init: function (config) {
        this.img=[];
        this.img[0] = root.getOpts(config, "img", null);
        this.objs = root.getOpts(config, "objs", null);
        this.max_speed = root.getOpts(config, "max_speed", 1.0);
        this.max = root.getOpts(config, "max", 100.0);
        this.min = root.getOpts(config, "min", 0.0);
        this.reverse = root.getOpts(config, "reverse", false);
        var layer = root.getOpts(config, "layer", null);
        this.initial_value = root.getOpts(config, "value", 0.0);
        var self = this;
        this.group = new Konva.Group({
            dragBoundFunc: function(pos) {
                if (self.enable_man_rotate) {
                    return this.getAbsolutePosition(); // center does not move
                } else {
                    return pos;
                }
            }
        });
        this.angle = 0.0;
        this.setval(this.initial_value);
        var mv_group = function () { // prepare group and center it
            for (var i = 0 ; self.objs && i < self.objs.length ; i++) { // add objects to group
                self.group.add(self.objs[i]);
            }
            var r = self.group.getClientRect();
            var w = r.width;
            var h = r.height;
            //console.log("w: ", w, "h: ", h, "r: ", r);
            self.group.offsetX(w/2); // centering group
            self.group.offsetY(h/2);
            if (layer) {
                self.addToLayer(layer);
            }
        }
        if (this.img[0]) {
            var il_config = {
                callback: function(IL) {
                    var Kimage = IL.getKImage(0);
                    self.group.add(Kimage);
                    mv_group();
                },
            };
            this.loader = new root.ImageLoader(this.img, {}, il_config);
        } else {
            mv_group();
        }
        this.enable_man_rotate = root.getOpts(config, "man_rotate", false); // Enable user click and drag manual rotation
        this.group.on('dragstart', function(evt) {
            if (self.enable_man_rotate) {
                //console.log('dragstart');
                self.init_angle = self._pointer_angle(self.group, self.group) - self.angle;
            }
        });
        this.group.on('dragmove', function(evt) {
            if(self.enable_man_rotate) {
                var r = self._pointer_angle(self.group, self.group);
                self.set_angle(r - self.init_angle);
                self.layer.draw();
            }
        });
    },
    _pointer_angle: function(layer, obj) {
        var mousePos = layer.getStage().getPointerPosition();
        var x = obj.getX() - mousePos.x;
        var y = obj.getY() - mousePos.y;
        var r = (Math.atan2(y, x)*180/Math.PI);
        //console.log('p_angle', mousePos.x, mousePos.y, x, y, r*180/Math.PI);
        return r;
    },
    setval: function (v) {
        if (v < this.min) v = this.min;
        if (v > this.max) v = this.max;
                                               var v2;
        if (this.reverse) {
            v2 = -v;
        } else {
            v2 = +v;
        }

        this.speed = v2 * this.max_speed / (this.max * 1.0);
        //console.log("Speed0: ", this.speed);
        this._set_rotation(0);
    },
    set_angle: function (a) {
        //console.log("SET ANGLE", a);
        this.angle = a;
        if (this.angle > 360) this.angle -= 360;
        if (this.angle <   0) this.angle += 360;
        this.group.setRotation(this.angle);
    },
    add_angle: function (a) {
        this.set_angle(this.angle + a)
    },
    _set_rotation : function (time_diff) {
        this.set_angle(this.angle + this.speed * 360 * time_diff/1000);
        //console.log("Speed: ", this.speed);
    },
    dragBoundFunc: function(pos) {
        if (this.enable_man_rotate) {
            return this.group.getAbsolutePosition(); // center does not move
        } else {
            return pos;
        }
    },
    start: function() {
        this.anim.start();
    },
    stop: function() {
        this.anim.stop();
    },
    addToLayer : function (layer) {
        this.layer = layer;
        var self = this;
        this.anim = new Konva.Animation(function (frame) {
            if (! self.enable_man_rotate) {
                self._set_rotation(frame.timeDiff);
            }
        }, layer);
        layer.add(this.group);
        this.anim.start();
    },
    man_rotate : function (b) {
        this.enable_man_rotate = b;
        if (b) {
            this.group.draggable(true);
        } 
    },
    draggable : function (b) {
        this.group.draggable(b);
        if (b) {
            this.enable_man_rotate = false;
        }
    },
    get_angle : function () {
        return this.angle;
    },
});


return root;
}) ($ML || {});



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


