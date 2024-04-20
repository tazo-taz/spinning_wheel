const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

const width = 500
const height = 500

canvas.width = width;
canvas.height = height;

let totalRotation = 0;
let oldTotalRotation = 0;

const steps = 10
const minLightness = 40
const generateRandomHSLColor = () => {
  const hue = Math.floor(Math.random() * 360);
  const lightness = minLightness;
  const saturation = Math.floor(Math.random() * 100);
  return {
    hue,
    saturation,
    lightness,
    toString() {
      return `hsl(${this.hue}, ${this.saturation}%, ${this.lightness}%)`
    }
  }
}



const generateCircleSectorAngle = (step, steps) => {
  const partialAngle = 2 * Math.PI / steps;
  const initialStartAngle = - Math.PI / 2 - partialAngle / 2;
  const initialEndAngle = partialAngle / 2 - Math.PI / 2;
  const startAngle = initialStartAngle + (step - 1) * partialAngle;
  const endAngle = initialEndAngle + (step - 1) * partialAngle;
  const rotatedAngle = (step - 1) * partialAngle
  //add normalized function to angles
  return {
    initialStartAngle: normalizeAngle(initialStartAngle),
    initialEndAngle: normalizeAngle(initialEndAngle),
    startAngle: normalizeAngle(startAngle),
    endAngle: normalizeAngle(endAngle),
    rotatedAngle: normalizeAngle(rotatedAngle),
  }

}
const partials = [...Array(steps)].map((_, index) => ({
  ...generateCircleSectorAngle(index + 1, steps),
  color: generateRandomHSLColor(),
  step: index + 1,
  active: false
}))

function viewPartials() {
  return partials.reduce((acc, partial, index) => {
    const partialText = `${partial.step} - ${partial.startAngle} - ${partial.endAngle} - ${partial.active}`
    if(index === 0) {
      return acc + partialText
    }
    return `${acc}
${partialText}`
  }, '')
}

const drawCirclePartial = ({
  color,
  initialStartAngle,
  initialEndAngle,
  rotatedAngle,
  step,
}) => {  
  const radius = width / 2;
  const centerX = width / 2;
  const centerY = height / 2;

  ctx.save();

  ctx.translate(centerX, centerY);
  ctx.rotate(rotatedAngle)

  // draw a circle
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(0, 0, radius, initialStartAngle, initialEndAngle, false);
  ctx.closePath();
  ctx.fillStyle = color.toString()
  ctx.fill();

  ctx.fillStyle = 'black';
  ctx.font = '20px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${step} step`, 0, -centerY * .75);

  ctx.restore();
}

function updateCirclePartial({
  color,
  active
}) {
 if (active && color.lightness < 60) {
    color.lightness += 2;
 } else if (!active && color.lightness > minLightness) {
    color.lightness -= 2;
  }
}

function handleRotation() {
  const rotation = totalRotation - oldTotalRotation
  if (rotation ) {
    partials.forEach(partial => {
      partial.rotatedAngle += rotation;
      partial.startAngle += rotation;
      partial.endAngle += rotation;
    });
  }
}

function normalizeAngle(angle) {
  // angle can be only between -π and π
  while (angle < -Math.PI) {
    angle += 2 * Math.PI;
  }
  while (angle >= Math.PI) {
    angle -= 2 * Math.PI;
  }
  return angle;
}

function animate() {
  requestAnimationFrame(animate);
  ctx.clearRect(0, 0, width, height);
  handleRotation()
  for (let index in partials) {
    drawCirclePartial(partials[index]);
    updateCirclePartial(partials[index]);
  }
}

function isCoordinateInsideCircleSector(x, y, radius, startAngle, endAngle) {
  const distance = distanceBetweenTwoPoints(x, y, width / 2, height / 2);
  if (distance > radius) {
    return false;
  }
  const angle = (getAngleBetweenTwoPoints(width / 2, height / 2, x, y))
  const nomralizedStartAngle = normalizeAngle(startAngle)
  const nomralizedEndAngle = normalizeAngle(endAngle)

  if (nomralizedEndAngle < 0 && nomralizedStartAngle > 0 && angle > 0) {
    return angle >= nomralizedStartAngle && Math.PI * 2 + nomralizedEndAngle >= angle;
  }

  if (nomralizedEndAngle < 0 && nomralizedStartAngle > 0 && angle < 0) {
    return angle <= nomralizedEndAngle && -Math.PI * 2 + nomralizedStartAngle <= angle;
  }

  return angle >= nomralizedStartAngle && angle <= nomralizedEndAngle;
}

function distanceBetweenTwoPoints(x1, y1, x2, y2) {
  return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
}

function getAngleBetweenTwoPoints(x1, y1, x2, y2) {
  return Math.atan2(y2 - y1, x2 - x1);
}

function getCircleSectorIndex(x, y) {
  const centerX = width / 2;
  const centerY = height / 2;
  const distance = distanceBetweenTwoPoints(x, y, centerX, centerY);

  if (distance > width / 2 || distance < 50) {
    return -1;
  }

  for (let index in partials) {
    const partial = partials[index];
    if (isCoordinateInsideCircleSector(x, y, width / 2, partial.startAngle, partial.endAngle)) {
      return index;
    }
  }
}

animate();

function getRandom(number, percentage) {
  const min = number * percentage;
  const value = Math.random() * (number * (1 - percentage * 2))
  return min + value;
}

addEventListener('mousemove', (event) => {
  //if(totalRotation || oldTotalRotation) return
  const x = event.clientX - canvas.getBoundingClientRect().left;  
  const y = event.clientY - canvas.getBoundingClientRect().top;

  const index = getCircleSectorIndex(x, y); 
  if (index !== -1) {
    canvas.style.cursor = 'pointer';
  } else {
    canvas.style.cursor = 'default';
  }
    partials.forEach((partial, i) => {
      partial.active = i == index;
    });
});

document.querySelector('button').addEventListener('click', () => {
  if (totalRotation || oldTotalRotation) return
  //const guessedIndex =6
 const guessedIndex = Math.floor(Math.random() * steps);
  let fullRotation = Math.PI * 2 * Math.floor(Math.random() * 5 + 6);
  const partialAngle = 2 * Math.PI / steps;
  const randomAngle = getRandom(partialAngle, 0.1);
  const indexRotation = Math.PI * 2 - partials[guessedIndex].startAngle
  totalRotation = fullRotation  + indexRotation - randomAngle
  console.log(guessedIndex);
  const el = document.getElementById("number")
  el.innerHTML = totalRotation
  totalRotation = 0
  gsap.from(el, {
    textContent: 0,
    duration: 7,
    ease: "power1.inOut",
    snap: { textContent: 0.001 },
    stagger: {
      each: 1,
      onUpdate: function () {
        oldTotalRotation = totalRotation
        totalRotation = this.targets()[0].textContent
      },
      onComplete: function () {
        oldTotalRotation = 0
        totalRotation = 0
        partials.forEach((partial, i) => {
          partial.startAngle = normalizeAngle(partial.startAngle % (Math.PI * 2))
          partial.endAngle = normalizeAngle(partial.endAngle % (Math.PI * 2))
          partial.rotatedAngle = normalizeAngle(partial.rotatedAngle % (Math.PI * 2))
        });
      }
    }
  });

});