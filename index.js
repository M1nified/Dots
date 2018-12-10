const settings = {
  connectionsNumber: 2,
  addPointOnClick: true,
  pointsCount: 100
};
class Vector {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
  distanceTo(vector) {
    return Math.sqrt(Math.pow(this.x - vector.x, 2) + Math.pow(this.y - vector.y, 2));
  }
}
class Point {
  constructor() {
    this.position = new Vector(0, 0);
    this.direction = new Vector(1, 1);
    this.r = 2;
    this.speed = 1;
  }
  distanceTo(point) {
    return this.position.distanceTo(point.position);
  }
  move(deltaTime) {
    this.position.x += this.speed * this.direction.x * deltaTime;
    this.position.y += this.speed * this.direction.y * deltaTime;
    return this;
  }
  keepInBounds(boundsVector) {
    if (this.position.x < 0) {
      this.direction.x *= -1;
      this.position.x *= -1;
    } else if (this.position.x > boundsVector.x) {
      this.direction.x *= -1;
      this.position.x = boundsVector.x - (this.position.x % boundsVector.x)
    }
    if (this.position.y < 0) {
      this.direction.y *= -1;
      this.position.y *= -1;
    } else if (this.position.y > boundsVector.y) {
      this.direction.y *= -1;
      this.position.y = boundsVector.y - (this.position.y % boundsVector.y)
    }
    return this;
  }
  printIn(ctx) {
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, this.r, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fill();
    return this;
  }
  printLineToPointIn(ctx, point, opacity = 1) {
    ctx.beginPath();
    ctx.lineWidth = "1";
    ctx.strokeStyle = "green"; // Green path
    ctx.moveTo(this.position.x, this.position.y);
    ctx.lineTo(point.position.x, point.position.y);
    ctx.globalAlpha = opacity;
    ctx.stroke(); // Draw it
    ctx.globalAlpha = 1;
    return this;
  }
  printLineToPointsIn(ctx, points, opacity = 1) {
    points.forEach(p => this.printLineToPointIn(ctx, p, opacity));
    return this;
  }
  printLineToClosestPointsIn(ctx, points, count = 2) {
    const closest = [],
      cpy = points.slice();
    let topDist = null;
    cpy.sort((a, b) => this.distanceTo(a) - this.distanceTo(b));
    // this.printLineToPointsIn(ctx, cpy.splice(0, count));
    const nextDist = count < cpy.length ? this.distanceTo(cpy[count]) : null;
    for (let i = 0; i < count && i < cpy.length; i++) {
      this.printLineToPointIn(ctx, cpy[i], nextDist != null ? (nextDist - this.distanceTo(cpy[i])) / nextDist : 1);
    }
    return this;
  }
}

function normalizeDirection(directionVector) {
  const x = directionVector.x,
    y = directionVector.y;
  if (x > y) {
    const a = x / y,
      newY = Math.sqrt(1 / (a * a + 1)),
      newX = a * newY;
    return new Vector(newX, newY);
  } else {
    const a = y / x,
      newX = Math.sqrt(1 / (a * a + 1)),
      newY = a * newX;
    return new Vector(newX, newY);
  }
}

function randomPoint() {
  let pt = new Point();
  pt.position = new Vector(Math.random() * canvas.width, Math.random() * canvas.height)
  pt.direction = new Vector(Math.random(), Math.random());
  pt.direction = normalizeDirection(pt.direction);
  pt.direction.x *= Math.random() > .5 ? 1 : -1;
  pt.direction.y *= Math.random() > .5 ? 1 : -1;
  pt.speed = Math.random();
  pt.speed *= .02;
  pt.speed += .04;
  return pt;
}

const canvas = document.querySelector("canvas"),
  ctx = canvas.getContext("2d");

let canvasBounds = new Vector(window.innerWidth, window.innerHeight);
canvas.width = canvasBounds.x;
canvas.height = canvasBounds.y;

const points = [];
for (let i = 0; i < settings.pointsCount; i++) {
  points.push(randomPoint());
}

let last = null;
const frame = (timestamp) => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (last == null) last = timestamp;
  if (settings.pointsCount != points.length) {
    while (settings.pointsCount > points.length) {
      points.push(randomPoint())
    }
    while (settings.pointsCount < points.length) {
      points.pop()
    }
  }
  let progress = timestamp - last;
  points.forEach(p => {
    p.move(progress)
      .keepInBounds(canvasBounds)
      .printLineToClosestPointsIn(ctx, points, settings.connectionsNumber + 1)
      .printIn(ctx)
  })
  last = timestamp;
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

document.querySelectorAll(".setting").forEach(element => {
  for (let i = 0; i < element.classList.length; i++) {
    if (/^setting-/.test(element.classList[i])) {
      const settingName = element.classList[i].replace(/^setting-/, '');
      if (element.tagName.toLowerCase() == 'input') {
        if (element.type == 'checkbox') {
          element.checked = !!settings[settingName];
          element.addEventListener('change', () => {
            settings[settingName] = element.checked;
          })
        } else {
          element.value = settings[settingName];
          element.addEventListener('change', () => {
            settings[settingName] = Math.max(0, parseInt(element.value));
          })
        }
      }
    }
  }
})

window.addEventListener("resize", () => {
  canvasBounds = new Vector(window.innerWidth, window.innerHeight);
  canvas.width = canvasBounds.x;
  canvas.height = canvasBounds.y;
})
