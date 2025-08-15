//  "make a p5js sketch that draws a tulip, a daisy, and an orchid in the painting style of Kandinsky, add animation and give the js"
// Kandinsky-ish animated composition — p5.js (enhanced motion)
// Click: reshuffle   |   Space: pause/play   |   S: save PNG

let elems = [];
let palette;
let paused = false;
let seed = 1234;
let grainG; // paper grain overlay
let parallaxOn = true;

function setup() {
  createCanvas(900, 600);
  pixelDensity(1);
  noCursor();
  buildPaperGrain();
  initComposition();
}

function buildPaperGrain() {
  grainG = createGraphics(300, 200); // small tile, scaled up
  grainG.pixelDensity(1);
  grainG.loadPixels();
  for (let y = 0; y < grainG.height; y++) {
    for (let x = 0; x < grainG.width; x++) {
      const n = 235 + random(-18, 18); // light gray speckle
      const a = 25 + random(5);        // low alpha
      const idx = 4 * (x + y * grainG.width);
      grainG.pixels[idx + 0] = n;
      grainG.pixels[idx + 1] = n;
      grainG.pixels[idx + 2] = n;
      grainG.pixels[idx + 3] = a;
    }
  }
  grainG.updatePixels();
}

function initComposition() {
  randomSeed(seed);
  noiseSeed(seed);

  palette = [
    color(235, 64, 52),   // red
    color(242, 190, 57),  // yellow
    color(42, 112, 197),  // blue
    color(33, 33, 33),    // near-black
    color(244, 244, 244), // off-white
    color(52, 168, 83),   // green accent
    color(186, 85, 211)   // violet
  ];

  elems = [];
  addGuides();

  for (let i = 0; i < 7; i++) elems.push(makeCircleForm());
  for (let i = 0; i < 6; i++) elems.push(makeRectForm());
  for (let i = 0; i < 5; i++) elems.push(makeTriangleForm());
  for (let i = 0; i < 4; i++) elems.push(makeArcForm());
  for (let i = 0; i < 7; i++) elems.push(makeLineForm());

  // dynamic ribbons
  for (let i = 0; i < 3; i++) elems.push(makeRibbon());
  // floating dots
  for (let i = 0; i < 18; i++) elems.push(makeBubble());
}

function draw() {
  background(248, 246, 240);

  // subtle parallax drift for the whole composition
  const t = millis() * 0.001;
  if (parallaxOn) {
    push();
    translate(sin(t * 0.2) * 6, cos(t * 0.17) * 5);
  }

  // soft vignette frame
  push();
  noFill();
  stroke(0, 20);
  strokeWeight(30);
  rect(15, 15, width - 30, height - 30, 6);
  pop();

  elems.forEach(e => e.update?.(t));
  elems.forEach(e => e.draw());

  if (parallaxOn) pop();

  // paper grain overlay (tile to cover canvas)
  push();
  blendMode(MULTIPLY);
  for (let y = 0; y < height; y += grainG.height) {
    for (let x = 0; x < width; x += grainG.width) {
      image(grainG, x, y);
    }
  }
  blendMode(BLEND);
  pop();

  // tiny cursor dot
  noStroke();
  fill(0, 120);
  circle(mouseX, mouseY, 4);
}

function mousePressed() {
  seed = floor(random(1e6));
  initComposition();
}

function keyPressed() {
  if (key === ' ') { paused = !paused; paused ? noLoop() : loop(); }
  if (key.toLowerCase() === 's') saveCanvas('kandinsky_motion', 'png');
  if (key.toLowerCase() === 'p') parallaxOn = !parallaxOn;
}

function windowResized() {
  resizeCanvas(windowWidth < 900 ? windowWidth : 900,
               windowHeight < 600 ? windowHeight : 600);
  buildPaperGrain();
  initComposition();
}

// ---------- Forms ----------
function makeCircleForm() {
  const r = random(26, 95);
  const base = createVector(random(width*0.15, width*0.85), random(height*0.18, height*0.82));
  const drift = p5.Vector.random2D().mult(random(18, 70));
  const w = random(2, 8);
  const fillCol = random([true, false]) ? random(palette) : null;
  const strokeCol = color(20, 20, 20, 230);
  const rotSpeed = random(-0.6, 0.6);
  const satCount = floor(random(1, 4));
  const satR = r * random(0.7, 1.2);
  const satSpeed = random(0.4, 1.2) * random([1, -1]);

  let a0 = random(TAU);

  return {
    update(t) { a0 += 0.01 * satSpeed; },
    draw(){
      push();
      const px = base.x + drift.x * sin(frameCount*0.003);
      const py = base.y + drift.y * cos(frameCount*0.002);
      translate(px, py);
      rotate(frameCount * 0.002 * rotSpeed);

      // pulse stroke
      const pulse = 0.5 + 0.5 * sin(frameCount * 0.03 + px * 0.01);
      stroke(strokeCol);
      strokeWeight(w * (0.8 + 0.6 * pulse));
      if (fillCol) { fill(fillCol); } else { noFill(); }
      circle(0, 0, r*2);

      // satellites
      noStroke();
      for (let i = 0; i < satCount; i++) {
        const ang = a0 + (TAU / satCount) * i;
        const sx = cos(ang) * satR, sy = sin(ang) * satR;
        fill(0, 180);
        circle(sx, sy, max(3, r*0.12));
        fill(255, 90);
        circle(sx + 2, sy - 2, max(2, r*0.07));
      }
      pop();
    }
  };
}

function makeRectForm() {
  const sz = createVector(random(60, 160), random(18, 60));
  const pos = createVector(random(width*0.1, width*0.9), random(height*0.12, height*0.88));
  const rot = random(TAU);
  const rotSpeed = random(-0.4, 0.4);
  const col = random(palette);
  const alpha = random(140, 230);
  const orbitR = random(10, 90);
  const w = random(3, 7);
  const slidePhase = random(TAU);

  return {
    draw(){
      push();
      translate(pos.x, pos.y);
      rotate(rot + frameCount*0.002*rotSpeed);

      // soft orbit motion + sliding along long axis
      const ox = orbitR * sin(frameCount*0.003 + rot);
      const oy = orbitR * cos(frameCount*0.0025 + rot);
      const slide = sin(frameCount*0.02 + slidePhase) * 10;
      translate(ox + slide, oy - slide*0.5);

      // shadow
      noStroke();
      fill(0, 18);
      rect(6, 6, sz.x, sz.y, 3);

      // body
      stroke(0, 220);
      strokeWeight(w);
      fill(red(col), green(col), blue(col), alpha);
      rect(0, 0, sz.x, sz.y, 3);

      // scanning line
      noStroke();
      fill(255, 30);
      const s = (frameCount % 120) / 120 * sz.x;
      rect(s - 8, 0, 12, sz.y, 2);
      pop();
    }
  };
}

function makeTriangleForm() {
  const pos = createVector(random(width*0.15, width*0.85), random(height*0.2, height*0.8));
  const s = random(50, 140);
  const a = random(TAU);
  const rotSpeed = random(-0.3, 0.3);
  const col = random(palette);
  const w = random(2, 5);
  const bob = random(6, 16);

  return {
    draw(){
      push();
      const by = sin(frameCount*0.02 + pos.x*0.01) * bob;
      translate(pos.x, pos.y + by);
      rotate(a + frameCount*0.002*rotSpeed);

      stroke(0, 210);
      strokeWeight(w);
      fill(col);
      polygon(0, 0, s, 3);

      // inscribed rotating small triangle
      rotate(-frameCount*0.01*rotSpeed);
      noFill();
      stroke(0, 170);
      polygon(0, 0, s*0.5, 3);
      pop();
    }
  };
}

function makeArcForm() {
  const pos = createVector(random(width*0.2, width*0.8), random(height*0.2, height*0.8));
  const r0 = random(60, 180);
  const w = random(5, 12);
  const a0 = random(TAU);
  const span0 = random(PI*0.25, PI*0.95);
  const drift = p5.Vector.random2D().mult(random(10, 35));
  const col = random(palette);
  const breathe = random(0.5, 1.4);

  return {
    draw(){
      push();
      const br = r0 + 10 * sin(frameCount*0.02*breathe);
      const sp = span0 + 0.25 * sin(frameCount*0.01*breathe);
      translate(pos.x + drift.x * sin(frameCount*0.004), pos.y + drift.y * cos(frameCount*0.0032));

      noFill();
      stroke(0, 220);
      strokeWeight(w * (0.9 + 0.2 * sin(frameCount*0.02)));
      arc(0, 0, br*2, br*2, a0 + 0.05*sin(frameCount*0.01), a0 + sp + 0.05*cos(frameCount*0.01));

      // colored thin arc overlay
      stroke(col);
      strokeWeight(2);
      arc(0, 0, (br-8)*2, (br-8)*2, a0+0.2, a0+sp-0.1);
      pop();
    }
  };
}

function makeLineForm() {
  const a = createVector(random(width*0.05, width*0.95), random(height*0.1, height*0.9));
  const b = p5.Vector.fromAngle(random(TAU)).mult(random(90, 240)).add(a);
  const w = random(2, 6);
  const dash = random([true, false]);
  const col = color(0, 0, 0, 230);
  const jitter = random(0.8, 2.0);
  const dashMove = random(0.8, 2.0);

  return {
    draw(){
      push();
      stroke(col);
      strokeWeight(w);
      if (dash) {
        drawingContext.setLineDash([10, 8]);
        drawingContext.lineDashOffset = -frameCount * dashMove;
      } else {
        drawingContext.setLineDash([]);
      }
      const jx = (noise(frameCount*0.01, a.x)*2-1) * jitter;
      const jy = (noise(frameCount*0.01, a.y)*2-1) * jitter;
      line(a.x + jx, a.y + jy, b.x - jx, b.y - jy);
      drawingContext.setLineDash([]);
      pop();

      // endpoint accents
      push();
      noStroke(); fill(0);
      circle(a.x, a.y, 6);
      circle(b.x, b.y, 6);
      pop();
    }
  };
}

function makeRibbon() {
  const y0 = random(height*0.1, height*0.9);
  const amp = random(25, 60);
  const speed = random(0.6, 1.2) * random([1, -1]);
  const thick = random(4, 9);
  const col = random(palette);

  return {
    draw(){
      push();
      noFill();
      stroke(col);
      strokeWeight(thick);
      beginShape();
      for (let x = -40; x <= width+40; x += 20) {
        const y = y0 + sin((x*0.02) + frameCount*0.02*speed) * amp;
        curveVertex(x, y);
      }
      endShape();
      pop();
    }
  };
}

function makeBubble() {
  let p = createVector(random(width), random(height));
  const r = random(4, 10);
  const v = createVector(random(-0.4, 0.4), random(-0.3, -0.8)); // drift upward

  return {
    update() {
      p.add(v);
      if (p.x < -10) p.x = width + 10;
      if (p.x > width + 10) p.x = -10;
      if (p.y < -10) p.y = height + 10;
      if (p.y > height + 10) p.y = -10;
    },
    draw(){
      this.update();
      noStroke();
      fill(0, 40);
      circle(p.x + 2, p.y + 2, r + 1);
      fill(255, 240);
      circle(p.x, p.y, r);
      fill(255, 120);
      circle(p.x - r*0.2, p.y - r*0.2, r*0.4);
    }
  };
}

function addGuides() {
  // large muted circle groundings (static)
  for (let i = 0; i < 3; i++) {
    const r = random(140, 260);
    const pos = createVector(random(width*0.2, width*0.8), random(height*0.25, height*0.75));
    const c = color(0, 0, 0, 12);
    elems.push({
      draw(){
        push();
        noStroke();
        fill(c);
        circle(pos.x, pos.y, r*2);
        pop();
      }
    });
  }

  // thin diagonal scaffolding lines (static)
  for (let i = 0; i < 5; i++) {
    const x = random(width);
    const y = random(height);
    const ang = random([-PI/4, PI/6, -PI/3, PI/5]);
    const len = random(180, 420);
    const w = random(1, 2);
    elems.push({
      draw(){
        push();
        translate(x, y);
        rotate(ang);
        stroke(0, 40);
        strokeWeight(w);
        line(-len/2, 0, len/2, 0);
        pop();
      }
    });
  }
}

// ---------- Helpers ----------
function polygon(x, y, r, n) {
  beginShape();
  for (let i = 0; i < n; i++) {
    const a = TAU * (i / n) - HALF_PI;
    vertex(x + cos(a) * r, y + sin(a) * r);
  }
  endShape(CLOSE);
}
