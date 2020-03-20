
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
        this.base = null;
        
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
    setfill: function (v) {
        if (this.base) {
            this.base.fill(v);
        }
    },
    setcolor: function (v) {
        this.text.fill(v);
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
