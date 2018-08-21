// docs
// http://svgjs.com/elements/#svg-polyline
// 

// TODOs
// Draw a clock wire
// build plots
// make button change when mouse over mouse down etc.
// 


var dbg = undefined;

function app() {
    function testSupport() {
        if (!SVG.supported) {
            alert('SVG not supported');
        }
    }
    
    const CANVAS_WIDTH = 1100;
    const CANVAS_HEIGHT = 800;
    
    const BORDER = 3;
    const BORDER_COLOR = "#268BD2"; // rgb(88,110,117)
    
    const MUX_FACE_WIDTH = 50;
    const LATCH_GUTTER = 50;
    const LATCH_WIDTH = 130 + LATCH_GUTTER;
    const LATCH_HEIGHT = LATCH_WIDTH * 1.5;
    const LATCH_TOP = 200;
    const LATCH_LEFT = 600;
    
    const WIRE_WIDTH = BORDER;

    const PLOT_MARGIN = 5;
    const PLOT_HEIGHT = LATCH_HEIGHT / 3 - PLOT_MARGIN;

    const INPUT_TERM = 0;
    const OUTPUT_TERM = 1;

    const SIGNAL_VALID = 0;
    const SIGNAL_INVALID = 1;


    // https://en.wikipedia.org/wiki/Shades_of_green
    const ARTICHOKE = "#4b6f44";
    const FOREST = "#228b22";
    const SHAMROCK = "#009e60";
    const BRIGHT_GREEN = "#66ff00";
    const BRIGHT_BLUE = "#6600ff";

    //
    const VALID_HI = BRIGHT_GREEN;
    const VALID_LO = BRIGHT_BLUE;
    function isValid(color) {
        return color === VALID_HI || color === VALID_LO;
    }

    function randomValidColor() {
        if (Math.random() > .5) return VALID_HI;
        return VALID_LO;
    }

    const TERMINAL_LENGTH = 20;
    const TERM_DOT_SIZE = 10;

    

    // utility functions.
    function randomInvalidSignalColor() {
        let colors = ["#444", "#555", "#666", "#565656", "#454545", "#474747", "#585858", "#454545"];
        let idx = Math.floor(Math.random() * colors.length);
        return colors[idx];
    }

    
    
    
    
    // ---------------------------------------------------------------------------------------------
    class Canvas {
        constructor(w, h) {
            testSupport();
            this.h = h;
            this.w = w;
            this.ctx = SVG('drawing').size(w, h);
            dbg = this.ctx;            
            this.ctx.rect(this.w, this.h).attr({ fill: '#fff' });        

            this.latch = new Latch(LATCH_LEFT, LATCH_TOP);
            
            this.buttonLo = new Button(VALID_LO, 
                                       _=> { this.latch.validOnD1(VALID_LO); },
                                       _=> { this.latch.invalidOnD1(); }                
            );
            this.buttonHi = new Button(VALID_HI,
                                       c=> { this.latch.validOnD1(VALID_HI); },
                                       _=> { this.latch.invalidOnD1(); }                
            );
            
        }

        draw(ctx) {
            this.latch.draw(this.ctx);
            this.buttonLo.draw(this.ctx);
            this.buttonHi.draw(this.ctx);
        }
    }

    // ---------------------------------------------------------------------------------------------
    class Plot {
        constructor(name) {
            // text box
            // outline
        }
    }

    class PlotList {
        constructor() {
            this.plots = [];
        }
        
        addPlot(name) {
            this.plots.push(new Plot(name));
        }
    }

    // ---------------------------------------------------------------------------------------------
    class Button {
        constructor(signalType, mouseDownCallback, mouseUpCallback) {
            this.signalType = signalType;
            this.btn_width = 58;
            this.btn_height = 63;
            this.mouseDownCallback = mouseDownCallback;
            this.mouseUpCallback = mouseUpCallback;
            
            this.left = LATCH_LEFT - TERMINAL_LENGTH - this.btn_width - 2*TERM_DOT_SIZE;
            this.top = LATCH_TOP + LATCH_HEIGHT/3 + (LATCH_HEIGHT/3 - this.btn_height)/2;
        }

        draw(ctx) { 
            var imgFile = "img/btn-hand-hi.jpg";
            if (this.signalType == VALID_LO) imgFile = "img/btn-hand-lo.jpg";

            let offset = this.signalType == VALID_LO ? this.btn_width : 0;
            
            this.element = ctx            
                .image(imgFile, this.btn_width, this.btn_height)
                .move(this.left - offset, this.top);

            let box = ctx.rect(this.btn_width, this.btn_height)
                .move(this.left - offset, this.top)                
                .attr({ fill: "#000",
                        'fill-opacity': .1 })
                .stroke({ width: BORDER,
                          color: BORDER_COLOR });

            box.mouseover(_=> {
                box.attr({'fill-opacity' : 0 });
                this.element.fire('mouseover');
            });

            box.mouseout(_=> {
                box.attr({'fill-opacity' : .1 });
                this.element.fire('mouseout');
            });

            box.mousedown(_=> {
                box.attr({'fill-opacity' : .2 });
                this.element.fire('mousedown', this.signalType);
            });
            box.mouseup(_=> {
                box.attr({'fill-opacity' : 0 });
                this.element.fire('mouseup');
            });
            
            this.element.mousedown(this.mouseDownCallback, VALID_LO);
            this.element.mouseup(this.mouseUpCallback);
        }
    }
    
    // ---------------------------------------------------------------------------------------------
    
    class Terminal {
        constructor(x, y, termType) {
            this.x = x;
            this.y = y;
            this.type = termType;
            this.dot = undefined;
            this.line = undefined;
            this.signal_type = SIGNAL_INVALID;
        }

        draw(ctx) {
            let x = this.type == INPUT_TERM ? -TERMINAL_LENGTH - BORDER: TERMINAL_LENGTH;
            let dotnudge = this.type == INPUT_TERM ? -TERM_DOT_SIZE/2 : 0;
            
            this.line = ctx
                .line(this.x, this.y, this.x+x, this.y)
                .stroke({
                    width: WIRE_WIDTH,
                    color: BORDER_COLOR
                });
            
            this.dot = ctx
                .circle(TERM_DOT_SIZE)
                .move(this.x + x + dotnudge, this.y-TERM_DOT_SIZE/2)
                .attr({                    
                    color: BORDER_COLOR,
                    fill: BORDER_COLOR
                });
        }
        
        centerOfConnector(name) {
            if (["Q", "D0", "D1", "CLK"].indexOf(name) == -1) {
                throw new Error("connector not found: " + name);
            }
        }
    }

    function randomColor() {
        return "#" + [ Math.round(9 * Math.random()),
                       Math.round(9 * Math.random()),
                       Math.round(9 * Math.random()) ].join("");
    }
    
    // ---------------------------------------------------------------------------------------------    
    class PropBox {
        // A split box vertical partition making side by side sub
        // boxes. The split slides right showing the progress of a
        // signal propogating through the part.
        constructor(left, top) {
            this.top = top;
            this.left = left;
            this.numSegments = 30;
            this.segments = [];
        }

        update() {
            for (var i=this.numSegments-1; i>0; i--) {
                var nbrLeftColor = this.segments[i-1].attr().fill;
                if (isValid(nbrLeftColor)) {
                    this.updateSegment(i, nbrLeftColor);
                } else {                    
                    this.updateSegment(i, randomInvalidSignalColor());
                }
            }

            for (var i=this.numSegments-1; i>0; i--) { 
                var leftColor = this.segments[i-1].attr().fill;
                var curColor = this.segments[i].attr().fill;
                if (isValid(curColor) && !isValid(leftColor)) {
                    // this is a sneaky way to implement signal 
                    
                    // OK. if this runs every time then TCD = TPD/2.
                    // flip a coin to increase the TCD.
                    if (Math.random() > .5) {
                        this.updateSegment(i, randomInvalidSignalColor());
                    }
                }
                
            }

        }
        
        draw(ctx) {
            let SEGMENT_WIDTH = LATCH_WIDTH/this.numSegments;
            let SEGMENT_HEIGHT = LATCH_HEIGHT/3;
            
            for (var i=0; i<this.numSegments; i++) {                
                let r = ctx.rect(SEGMENT_WIDTH, SEGMENT_HEIGHT)
                    .move(this.left + i*SEGMENT_WIDTH, this.top)
                    .attr({ fill: randomColor() });
                this.segments.push(r);
            }
            let border = ctx.rect(LATCH_WIDTH - BORDER, SEGMENT_HEIGHT - BORDER/2)
                .move(this.left+BORDER/2, this.top + BORDER/2)
                .attr({ fill: 'none',
                        "stroke-width": BORDER,
                        "stroke": BORDER_COLOR
                      });
            this.segments.push(border);
        }

        updateSegment(idx, color) {            
            this.segments[idx].attr({fill:color});
        }
    }
    
    // ---------------------------------------------------------------------------------------------
    class DelayView {
        constructor(top, left) {
            this.top = top;
            this.left = left;
            this.boxLeft = null;
            this.boxRight = null;
        }

        draw(ctx) {
        }
    }

    class Wire {
        constructor(arr) {
            this.arr = arr;
        }

        draw(ctx) {
            this.line = ctx
                .polyline(this.arr)
                .attr({
                    'stroke': randomInvalidSignalColor(),
                    'fill': "none",
                    'stroke-width': WIRE_WIDTH
                });
            //this.line.plot(this.arr);
        }
    }
    
    class Latch {
        constructor(left, top) {
            this.left = left;
            this.top = top;
            this.outline = undefined;
            this.setup();
            this.tCD = 12;
            this.tPD = 24;
            // need a text label.
            // need
        }

        update() {
            this.propBoxD0.update();
            this.propBoxD1.update();
            this.propBoxS.update();
        }
        
        clockHi() {
            this.propBoxS.updateSegment(1, randomInvalidSignalColor() );
            this.propBoxS.updateSegment(0, VALID_HI );
            console.log("clock high");
        }

        clockLo() {
            this.propBoxS.updateSegment(1, randomInvalidSignalColor() );
            this.propBoxS.updateSegment(0, VALID_LO );
            console.log("clock low");
        }

        right() {
            return this.left + LATCH_WIDTH+LATCH_GUTTER+MUX_FACE_WIDTH + BORDER/2;
        }
        
        setup() {
            let outputLeft = CANVAS_WIDTH/2 + LATCH_WIDTH/2 + BORDER/2;
            
            let heightQ = this.top + LATCH_HEIGHT * (1/2);
            let heightD0 = LATCH_TOP + LATCH_HEIGHT * (0/3 + 1/6);
            let heightD1 = LATCH_TOP + LATCH_HEIGHT * (1/3 + 1/6);
            let heightClk = LATCH_TOP + LATCH_HEIGHT * (2/3 + 1/6);
            
            this.termD0 = new Terminal(this.left-BORDER/2, heightD0, INPUT_TERM);
            this.termD1 = new Terminal(this.left-BORDER/2, heightD1, INPUT_TERM);
            this.termClk = new Terminal(this.left-BORDER/2, heightClk, INPUT_TERM);
            this.termQ = new Terminal(this.right(), heightQ, OUTPUT_TERM);

            this.feedbackWire = new Wire(new SVG.PointArray([
                [this.right() + TERMINAL_LENGTH + TERM_DOT_SIZE, this.top + LATCH_HEIGHT/2],
                [this.right() + 4*TERMINAL_LENGTH, this.top + LATCH_HEIGHT/2],
                [this.right() + 7*TERMINAL_LENGTH, this.top + LATCH_HEIGHT/2],
                [this.right() + 4*TERMINAL_LENGTH, this.top + LATCH_HEIGHT/2],
                [this.right() + 4*TERMINAL_LENGTH, this.top - LATCH_GUTTER],
                [this.left    - 3*TERMINAL_LENGTH, this.top - LATCH_GUTTER],
                [this.left    - 3*TERMINAL_LENGTH, heightD0],
                [this.left    - TERMINAL_LENGTH - TERM_DOT_SIZE - BORDER/2, heightD0],
            ]));
            
            this.propBoxD0 = new PropBox(LATCH_LEFT + LATCH_GUTTER, LATCH_TOP + 0 * LATCH_HEIGHT/3);
            this.propBoxD1 = new PropBox(LATCH_LEFT + LATCH_GUTTER, LATCH_TOP + 1 * LATCH_HEIGHT/3);
            this.propBoxS  = new PropBox(LATCH_LEFT + LATCH_GUTTER, LATCH_TOP + 2 * LATCH_HEIGHT/3);
        }

        
        validOnD1(c) { this.propBoxD1.updateSegment(0, c); }
        invalidOnD1() { this.propBoxD1.updateSegment(0, randomInvalidSignalColor()); }
        
        draw(ctx) {
            var array = new SVG.PointArray(
                [[0, 0],
                 [LATCH_WIDTH+LATCH_GUTTER, 0],
                 [LATCH_WIDTH+LATCH_GUTTER+MUX_FACE_WIDTH, MUX_FACE_WIDTH],
                 [LATCH_WIDTH+LATCH_GUTTER+MUX_FACE_WIDTH, LATCH_HEIGHT - MUX_FACE_WIDTH],
                 [LATCH_WIDTH+LATCH_GUTTER, LATCH_HEIGHT],
                 [0, LATCH_HEIGHT],
                 [0, 0],
                 [LATCH_GUTTER, 0],
                 [LATCH_GUTTER, LATCH_HEIGHT],
                 [LATCH_WIDTH+LATCH_GUTTER, LATCH_HEIGHT],
                 [LATCH_WIDTH+LATCH_GUTTER, 0],
                ]);
            
            this.outline = ctx
                .polyline(array)
                .move(this.left, this.top)
                .attr({
                    'stroke': BORDER_COLOR,
                    'fill': "#FFF",
                    'stroke-width': BORDER
                });
            
            this.termD0.draw(ctx);
            this.termD1.draw(ctx);
            this.termQ.draw(ctx);
            this.termClk.draw(ctx);
            this.feedbackWire.draw(ctx);

            this.portTextD0 = ctx
                .text("D0")
                .size(24)
                .move(this.left + 9, this.top + LATCH_HEIGHT / 6 - 14)
                .attr({'fill':BORDER_COLOR});
            
            this.portTextD1 = ctx
                .text("D1")
                .size(24)
                .move(this.left + 9, this.top + 3 * LATCH_HEIGHT / 6 - 14)
                .attr({'fill':BORDER_COLOR});

            this.portTextS = ctx
                .text("S")
                .size(24)
                .move(this.left + 9, this.top + 5 * LATCH_HEIGHT / 6 - 14)
                .attr({'fill':BORDER_COLOR});

            this.portTextOut = ctx
                .text("D0")
                .size(24)
                .move(this.right() + 7*TERMINAL_LENGTH + 5, this.top + LATCH_HEIGHT/2 - 14)
                .attr({'fill':BORDER_COLOR});
            
            // this.portTextOut = ctx
            //     .text("D0)
            
            this.propBoxD0.draw(ctx);
            this.propBoxD1.draw(ctx);
            this.propBoxS.draw(ctx);
        }
    }
    
    function main() {
        let canv = new Canvas(CANVAS_WIDTH, CANVAS_HEIGHT);
        dbg=canv;
        canv.draw();
        
        function forever() {
            canv.latch.update();
            setTimeout( _ => { forever(); }, 50);
        }
        forever();


        function clockHi() {
            canv.latch.clockHi();
            setTimeout( _ => { clockLo(); }, 2000);
        }

        function clockLo() {
            canv.latch.clockLo();
            setTimeout( _ => { clockHi(); }, 2000);
        }
        clockLo();



        
        console.log("done");
    }

    main();
}
