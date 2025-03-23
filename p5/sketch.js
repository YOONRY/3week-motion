// ✅ 제스처 색상 전환: 3↔4 → 무조건 next / 슬라이더 우측 상단 이동 + 색상 아이콘 표시
let serialPort;
let reader;
let textDecoder;
let incomingData = "";
let trafficLightState = "OFF";
let blinkState = false;
let lastBlinkTime = 0;
let ledBrightness = 255;
let currentMode = "";
let selectedColorIndex = 0;
const colorList = ["RED", "YELLOW", "GREEN"];
let selectedColor = colorList[selectedColorIndex];

let video;
let handpose;
let hands = [];
let gesture = "";
let fingerHistory = [];
let lastX = null;
let debugInfo = "";
let slider, sliderLabel, sliderColorIcon;
let lastFingerCount = -1;

function setup() {
  createCanvas(640, 480);
  frameRate(15);

  video = createCapture({
    video: {
      width: { ideal: 640 },
      height: { ideal: 480 },
      facingMode: "user"
    }
  });

  video.size(640, 480);
  video.hide();

  handpose = ml5.handpose(video, () => {
    console.log("🤖 Handpose model loaded");
  });

  handpose.on("predict", results => {
    hands = results;
  });

  setupSlider();
}

function draw() {
  background(230);
  image(video, 0, 0, width, height);

  if (hands.length > 0) {
    const landmarks = hands[0].landmarks;
    drawHand(landmarks);
    detectGesture(landmarks);
  } else {
    gesture = "손 인식 안됨";
    lastX = null;
  }

  drawLightsByState();
  fill(0);
  textSize(16);
  text(`Gesture: ${gesture}`, 10, height - 60);
  text(`Current Mode: ${currentMode}`, 10, height - 40);
  text(`Selected Color: ${selectedColor}`, 10, height - 20);
  if (debugInfo) text(debugInfo, 10, height - 80);
}

function drawHand(landmarks) {
  fill(255, 0, 0);
  noStroke();
  for (let i = 0; i < landmarks.length; i++) {
    const [x, y] = landmarks[i];
    circle(x, y, 10);
  }
}

function detectGesture(landmarks) {
  const count = fingersUp(landmarks);
  fingerHistory.push(count);
  if (fingerHistory.length > 5) fingerHistory.shift();

  const avg = Math.round(fingerHistory.reduce((a, b) => a + b, 0) / fingerHistory.length);
  debugInfo = `손가락 평균 수: ${avg}`;

  // 색상 변경 조건: 3 <-> 4 → 항상 next
  if ((lastFingerCount === 3 && avg === 4) || (lastFingerCount === 4 && avg === 3)) {
    handleColorChange('next');
  }

  lastFingerCount = avg;

  if (avg === 0) setMode("OFF", "OFF (주먹)");
  else if (avg === 1) setMode("EMERGENCY", "EMERGENCY (1개)");
  else if (avg === 2) setMode("BLINKING", "BLINKING (2개)");
  else if (avg === 5) setMode("NORMAL", "NORMAL (5개)");
}

function handleColorChange(dir) {
  selectedColorIndex = (selectedColorIndex + 1) % colorList.length;
  selectedColor = colorList[selectedColorIndex];
  gesture = `🎨 색상 선택: ${selectedColor}`;
  updateSliderColor();
}

function updateSliderColor() {
  const colorMap = {
    RED: "#ff5555",
    YELLOW: "#ffcc00",
    GREEN: "#33cc66"
  };
  if (slider && slider.elt) slider.elt.style.background = colorMap[selectedColor];
  if (sliderColorIcon && sliderColorIcon.elt) {
    sliderColorIcon.style('background-color', colorMap[selectedColor]);
    sliderColorIcon.html(`&nbsp;${selectedColor}&nbsp;`);
  }
}

function setMode(mode, label) {
  if (mode !== currentMode) {
    console.log("🚦 모드 변경됨:", mode);
    currentMode = mode;
    gesture = label;
    sendGestureCommand(mode);
  }
}

function drawLightsByState() {
  if (millis() - lastBlinkTime > (trafficLightState === "GREEN_BLINK" ? 200 : 500)) {
    blinkState = !blinkState;
    lastBlinkTime = millis();
  }

  switch (trafficLightState) {
    case "RED": drawLights(true, false, false); break;
    case "YELLOW": drawLights(false, true, false); break;
    case "GREEN": drawLights(false, false, true); break;
    case "GREEN_BLINK": drawLights(false, false, blinkState); break;
    case "BLINKING": drawLights(blinkState, blinkState, blinkState); break;
    case "EMERGENCY": drawLights(true, false, false); break;
    case "OFF": drawLights(false, false, false); break;
  }
}

function drawLights(r, y, g) {
  fill(0);
  rect(50, 50, 100, 300, 20);
  fill(r ? 'red' : '#555'); ellipse(100, 120, 60, 60);
  fill(y ? 'yellow' : '#555'); ellipse(100, 200, 60, 60);
  fill(g ? 'green' : '#555'); ellipse(100, 280, 60, 60);
}

function fingersUp(landmarks) {
  const tips = [4, 8, 12, 16, 20];
  const pips = [2, 6, 10, 14, 18];
  let count = 0;
  for (let i = 0; i < tips.length; i++) {
    const tip = landmarks[tips[i]];
    const pip = landmarks[pips[i]];
    if (i === 0) {
      if (tip[0] > pip[0]) count++;
    } else {
      if (tip[1] < pip[1]) count++;
    }
  }
  return count;
}

function setupSlider() {
  slider = createSlider(1, 10, 2, 0.5);
  slider.position(width - 230, 20);
  slider.style('width', '200px');
  sliderLabel = createSpan("2초");
  sliderLabel.position(width - 230, 50);

  sliderColorIcon = createSpan();
  sliderColorIcon.position(width - 230, 80);
  sliderColorIcon.style('padding', '4px 10px');
  sliderColorIcon.style('border-radius', '10px');
  sliderColorIcon.style('color', 'white');
  sliderColorIcon.style('font-weight', 'bold');
  updateSliderColor();

  slider.input(async () => {
    sliderLabel.html(slider.value() + "초");
    if (!serialPort || !serialPort.writable || selectedColor === "") return;

    const millis = Math.floor(slider.value() * 1000);
    const encoder = new TextEncoder();
    const writer = serialPort.writable.getWriter();
    await writer.write(encoder.encode(`<SET_${selectedColor}:${millis}>`));
    writer.releaseLock();
  });
}

async function sendGestureCommand(mode) {
  if (!serialPort || !serialPort.writable) {
    console.log("⚠️ 시리얼 연결 안됨");
    return;
  }
  console.log("📤 시리얼로 전송 중: ", `<MODE:${mode}>`);
  const encoder = new TextEncoder();
  const writer = serialPort.writable.getWriter();
  await writer.write(encoder.encode(`<MODE:${mode}>`));
  writer.releaseLock();
}

async function connectSerial() {
  try {
    serialPort = await navigator.serial.requestPort();
    await serialPort.open({ baudRate: 115200 });
    textDecoder = new TextDecoderStream();
    reader = serialPort.readable.pipeThrough(textDecoder).getReader();
    readSerialData();
  } catch (error) {
    console.error("❌ 시리얼 연결 실패:", error);
  }
}

async function readSerialData() {
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        reader.releaseLock();
        break;
      }
      if (value) {
        incomingData += value;
        processSerialData();
      }
    }
  } catch (error) {
    console.error("⚠️ 시리얼 읽기 오류:", error);
  }
}

function processSerialData() {
  let stateStart = incomingData.indexOf("<");
  let stateEnd = incomingData.indexOf(">");
  let brightnessStart = incomingData.indexOf("[BRIGHTNESS:");
  let brightnessEnd = incomingData.indexOf("]");

  while (stateStart !== -1 && stateEnd !== -1 && stateStart < stateEnd) {
    trafficLightState = incomingData.substring(stateStart + 1, stateEnd).trim();
    incomingData = incomingData.substring(stateEnd + 1);
    stateStart = incomingData.indexOf("<");
    stateEnd = incomingData.indexOf(">");
  }

  while (brightnessStart !== -1 && brightnessEnd !== -1 && brightnessStart < brightnessEnd) {
    let brightnessValue = incomingData.substring(brightnessStart + 12, brightnessEnd);
    ledBrightness = parseInt(brightnessValue);
    incomingData = incomingData.substring(brightnessEnd + 1);
    brightnessStart = incomingData.indexOf("[BRIGHTNESS:");
    brightnessEnd = incomingData.indexOf("]");
  }
}
