// 시리얼 통신 관련 변수들
let serialPort;
let reader;
let textDecoder;
let incomingData = "";

// 현재 신호등 상태 및 밝기
let trafficLightState = "OFF";
let blinkState = false;
let lastBlinkTime = 0;
let ledBrightness = 255;
let currentMode = "";

// 색상 선택 상태
let selectedColorIndex = 0;
const colorList = ["RED", "YELLOW", "GREEN"];
let selectedColor = colorList[selectedColorIndex];

// handpose 관련
let video;
let handpose;
let hands = [];

// 제스처 인식 상태 변수
let gesture = "";
let fingerHistory = [];
let lastFingerCount = -1;
let lastX = null; // (스와이프용 변수였음)
let debugInfo = "";

// 슬라이더 UI
let slider, sliderLabel, sliderColorIcon;

function setup() {
  createCanvas(640, 480);
  frameRate(15);

  // 웹캠 설정
  video = createCapture({
    video: {
      width: { ideal: 640 },
      height: { ideal: 480 },
      facingMode: "user"
    }
  });
  video.size(640, 480);
  video.hide();

  // ml5.js handpose 모델 로드
  handpose = ml5.handpose(video, () => {
    console.log("🤖 Handpose model loaded");
  });

  // 예측 결과 수신
  handpose.on("predict", results => {
    hands = results;
  });

  // 슬라이더 UI 구성
  setupSlider();
}

function draw() {
  background(230);
  image(video, 0, 0, width, height);

  if (hands.length > 0) {
    const landmarks = hands[0].landmarks;
    drawHand(landmarks);        // 손 keypoint 시각화
    detectGesture(landmarks);   // 손가락 수 기반 제스처 인식
  } else {
    gesture = "손 인식 안됨";
    lastX = null;
  }

  drawLightsByState();  // 현재 신호등 상태에 따라 LED 시각화

  // 텍스트 정보 표시
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
    circle(x, y, 10); // 각 keypoint 표시
  }
}

function detectGesture(landmarks) {
  const count = fingersUp(landmarks);
  fingerHistory.push(count);
  if (fingerHistory.length > 5) fingerHistory.shift(); // 평균 처리

  const avg = Math.round(fingerHistory.reduce((a, b) => a + b, 0) / fingerHistory.length);
  debugInfo = `손가락 평균 수: ${avg}`;

  // 3↔4 전환 시 → 색상 next 변경
  if ((lastFingerCount === 3 && avg === 4) || (lastFingerCount === 4 && avg === 3)) {
    handleColorChange('next');
  }
  lastFingerCount = avg;

  // 손가락 수에 따라 모드 설정
  if (avg === 0) setMode("OFF", "OFF (주먹)");
  else if (avg === 1) setMode("EMERGENCY", "EMERGENCY (1개)");
  else if (avg === 2) setMode("BLINKING", "BLINKING (2개)");
  else if (avg === 5) setMode("NORMAL", "NORMAL (5개)");
}

function handleColorChange(dir) {
  // 현재는 항상 next로만 변경됨
  selectedColorIndex = (selectedColorIndex + 1) % colorList.length;
  selectedColor = colorList[selectedColorIndex];
  gesture = `🎨 색상 선택: ${selectedColor}`;
  updateSliderColor();
}

function updateSliderColor() {
  // 슬라이더 배경 및 색상 이름 표시 색상 변경
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
  // 모드 변경 시 시리얼 전송
  if (mode !== currentMode) {
    console.log("🚦 모드 변경됨:", mode);
    currentMode = mode;
    gesture = label;
    sendGestureCommand(mode);
  }
}

function drawLightsByState() {
  // 깜빡임 타이밍 처리
  if (millis() - lastBlinkTime > (trafficLightState === "GREEN_BLINK" ? 200 : 500)) {
    blinkState = !blinkState;
    lastBlinkTime = millis();
  }

  // 신호등 상태에 따른 LED 표시
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
  // 신호등 모양 그리기
  fill(0);
  rect(50, 50, 100, 300, 20);
  fill(r ? 'red' : '#555'); ellipse(100, 120, 60, 60);
  fill(y ? 'yellow' : '#555'); ellipse(100, 200, 60, 60);
  fill(g ? 'green' : '#555'); ellipse(100, 280, 60, 60);
}

function fingersUp(landmarks) {
  // 각 손가락이 접혔는지 판단 (엄지 제외하면 Y좌표 비교)
  const tips = [4, 8, 12, 16, 20];
  const pips = [2, 6, 10, 14, 18];
  let count = 0;
  for (let i = 0; i < tips.length; i++) {
    const tip = landmarks[tips[i]];
    const pip = landmarks[pips[i]];
    if (i === 0) {
      if (tip[0] > pip[0]) count++;  // 엄지는 X축 기준
    } else {
      if (tip[1] < pip[1]) count++;  // 나머지는 Y축 기준
    }
  }
  return count;
}

function setupSlider() {
  // 슬라이더 + 색상 라벨 UI 생성
  slider = createSlider(1, 10, 2, 0.5);
  slider.position(width - 230, 20);
  slider.style('width', '200px');
  sliderLabel = createSpan("2초");
  sliderLabel.position(width - 230, 50);

  // 색상 이름 표시 박스
  sliderColorIcon = createSpan();
  sliderColorIcon.position(width - 230, 80);
  sliderColorIcon.style('padding', '4px 10px');
  sliderColorIcon.style('border-radius', '10px');
  sliderColorIcon.style('color', 'white');
  sliderColorIcon.style('font-weight', 'bold');
  updateSliderColor();

  // 슬라이더 입력값 → 아두이노 전송
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
  // 모드 변경 명령 시리얼 전송
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
  // 시리얼 포트 연결
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
  // 시리얼 수신 데이터 처리
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
