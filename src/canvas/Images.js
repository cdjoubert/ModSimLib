

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

