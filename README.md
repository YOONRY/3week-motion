# 🧪 p5.js & Arduino 일반 연동 프로젝트

---

## 디렉토리 구조

![image](https://github.com/user-attachments/assets/79f0c504-f4cc-40e6-aa38-9de3f18e29f8)

---


## 🧾 프로젝트 개요
이 프로젝트는 **p5.js**와 **Arduino**를 활용하여 웹과 물리적 디바이스가 상호작용하는 과제물입니다. 웹 기반 인터페이스(p5.js)와 아두이노를 연결하여 실시간 시각화, 제어를 구현하였습니다.

[👉 시연 영상 보러가기](https://youtu.be/alHJsZcv0D4?si=Yj-HD-j2aSYUaTnh)
---

## ⚙️ 사용된 기술
- **Arduino**: 물리적인 입력(버튼) 및 출력(LED) 제어
- **p5.js**: 웹 기반 시각화 및 인터페이스 구축
- **Web Serial API**: 웹과 아두이노 간의 직렬 통신
- **TaskScheduler (Arduino 라이브러리)**: 아두이노에서 효율적인 멀티태스킹 구현

---

## 🧱 하드웨어 구성 (핀 연결)

| 구성 요소 | 핀 번호 |
|-----------|----------|
| 🔴 빨간 LED | DIGITAL 4 |
| 🟡 노란 LED | DIGITAL 9 |
| 🟢 초록 LED | DIGITAL 5 |
| Emergency 버튼 | DIGITAL 6 |
| Blinking 버튼 | DIGITAL 7 |
| ON/OFF 버튼 | DIGITAL 8 |
| 🎚 가변저항 | 아날로그 A0 |

### 버튼 기본 상태
- PULL-UP 설정으로 **기본 HIGH**, 눌렸을 때 LOW

---

## 🧠 주요 기능 요약

### 1. 신호등 제어 시스템
- 아두이노의 LED를 p5.js에서 제어
- Emergency 모드: 빨간불 고정
- Blinking 모드: 3색 LED 깜빡임
- 시스템 전원 ON/OFF 지원

### 2. 실시간 데이터 시각화
- 가변저항 데이터 실시간 시각화
- UI 슬라이더로 LED 주기 변경 가능

---

## 🛠 실행 방법

### 아두이노 설정
1. Arduino IDE에서 코드 업로드
2. TaskScheduler 라이브러리 설치
3. 시리얼 모니터로 데이터 확인

### p5.js 실행
1. index.html 실행
2. "연결하기" 버튼 클릭 → Web Serial 연결
3. UI 통해 실시간 데이터 확인 및 LED 제어

---

## 🖼 참고 이미지

![회로 실물 이미지](https://github.com/user-attachments/assets/347b33e5-6301-43a3-a4c7-3030cacefa04)
![UI 예시](https://github.com/user-attachments/assets/250ace37-1a4d-4192-9cb2-0d01a42d2f96)
![구현 이해 이미지](https://github.com/user-attachments/assets/b2c87e03-96c6-4d6c-a4e7-da960ffac318)

---

# ✨ 제스처 기반 스마트 신호등 프로젝트

이 프로젝트는 **아두이노**와 **p5.js**, **ml5.js**를 활용하여 제스처로 제어 가능한 스마트 신호등 시스템을 구현한 것입니다. 손동작만으로 신호등의 모드 변경, 주기 조절, 색상 변경이 가능합니다.

---

## 📽️ 제스처 프로젝트 시연 영상

[👉 시연 영상 보러가기](https://youtu.be/s8UkQNZM8N8?si=ThqVXTJc3yFzXtc6)

---

## 이전 프로젝트와 비교

| 항목 | 제스처 제어 프로젝트 | 이전 프로젝트 |
|------|-----------------------|------------------|
| **핵심 기능** | 손 제스처를 인식하여 모드 및 색상 선택 가능 | HTML 슬라이더로 LED 주기 및 상태 직접 조절 |
| **제어 방식** | 제스처 인식(p5.js + ml5.js) + 슬라이더 | HTML 슬라이더 및 버튼 UI |
| **입력 장치** | 웹캠(손), 슬라이더 | 마우스(버튼 클릭, 슬라이더 조절) |
| **출력 장치** | 아두이노 LED 3색 (빨강, 노랑, 초록) | 동일 |
| **모드 변경 방식** | 손가락 수 인식 (0~5개)<br>OFF / EMERGENCY / BLINKING / NORMAL | 버튼 클릭을 통해 직접 선택 |
| **색상 선택 방식** | 손가락 수 3↔4 전환 시 색상 순환 변경 | 각각의 색상별 슬라이더 존재 |
| **통신 방식** | Web Serial API 사용<br>모드와 주기를 시리얼로 전송 | Web Serial API 사용, 슬라이더 값 전송 |
| **슬라이더 위치 및 디자인** | 우측 상단 고정<br>선택된 색상 강조 UI 포함 | 색상별 슬라이더 고정 위치 |

---

물론이죠! 제스처 기반 프로젝트에서 새로 추가된 코드 중 **핵심적인 3가지 중요 부분**을 아래와 같이 정리해 드릴게요:

---

## ✳️ 제스처 제어 프로젝트의 핵심 변경점 설명

### 1. 🖐 **손가락 개수로 모드 제어**  
```js
function detectGesture(landmarks) {
  const count = fingersUp(landmarks);
  fingerHistory.push(count);
  if (fingerHistory.length > 5) fingerHistory.shift();

  const avg = Math.round(fingerHistory.reduce((a, b) => a + b, 0) / fingerHistory.length);

  if ((lastFingerCount === 3 && avg === 4) || (lastFingerCount === 4 && avg === 3)) {
    handleColorChange('next'); // 색상 순환
  }
  lastFingerCount = avg;

  // 손가락 수에 따라 모드 전환
  if (avg === 0) setMode("OFF", "OFF (주먹)");
  else if (avg === 1) setMode("EMERGENCY", "EMERGENCY (1개)");
  else if (avg === 2) setMode("BLINKING", "BLINKING (2개)");
  else if (avg === 5) setMode("NORMAL", "NORMAL (5개)");
}
```

**설명**:  
- 손가락 개수를 인식해 **4가지 모드**(OFF/EMERGENCY/BLINKING/NORMAL)로 자동 전환.  
- 3↔4 손가락 전환 시 색상 변경 트리거로 사용.  
- `fingerHistory`를 이용해 순간 인식 오류 방지 → 평균 처리로 안정성 향상.

---

### 2. 🎨 **제스처로 색상 순환 (handleColorChange)**  
```js
function handleColorChange(dir) {
  selectedColorIndex = (selectedColorIndex + 1) % colorList.length;
  selectedColor = colorList[selectedColorIndex];
  gesture = `🎨 색상 선택: ${selectedColor}`;
  updateSliderColor();
}
```

**설명**:  
- **손가락 3↔4 전환 시마다 색상(빨/노/초) 변경**  
- `selectedColor` 상태값을 갱신하고, 해당 색상에 따라 슬라이더 UI 색상도 함께 업데이트.

---

### 3. 🎛 **색상별 주기 설정 슬라이더 + 아두이노 전송**  
```js
slider.input(async () => {
  sliderLabel.html(slider.value() + "초");
  if (!serialPort || !serialPort.writable || selectedColor === "") return;

  const millis = Math.floor(slider.value() * 1000);
  const encoder = new TextEncoder();
  const writer = serialPort.writable.getWriter();
  await writer.write(encoder.encode(`<SET_${selectedColor}:${millis}>`));
  writer.releaseLock();
});
```

**설명**:  
- 슬라이더를 통해 **선택된 색상**의 주기(지속 시간)를 설정  
- `SET_RED`, `SET_YELLOW`, `SET_GREEN` 형태로 **색상별 지연시간을 아두이노로 전송**  
- 사용자 인식을 위해 슬라이더 색상도 실시간으로 변경됨
- 기존의 3개 슬라이더를 하나로 통합 

---
## 📦 주요 구성 요소

| 구성 요소         | 설명                                       |
|------------------|--------------------------------------------|
| Arduino Uno      | LED, 버튼, 가변저항 연결 및 제어                        |
| TaskScheduler    | 아두이노 내 신호등 동작을 비동기적으로 처리               |
| p5.js + ml5.js   | 손 인식 및 제스처 판별, 슬라이더 UI 구성               |
| Web Serial API   | 웹과 아두이노 간 시리얼 통신                         |

---

## ⚙️ 아두이노 회로 구성

| 핀 이름         | 연결 대상        | 타입        | 기본 상태     |
|----------------|------------------|------------|--------------|
| D3             | 빨간 LED         | OUTPUT     | LOW          |
| D5             | 초록 LED         | OUTPUT     | LOW          |
| D9             | 노란 LED         | OUTPUT     | LOW          |
| D6             | 비상모드 버튼     | INPUT_PULLUP | 기본 HIGH   |
| D7             | 블링크모드 버튼   | INPUT_PULLUP | 기본 HIGH   |
| D8             | 전원 ON/OFF 버튼 | INPUT_PULLUP | 기본 HIGH   |
| A0             | 가변저항         | ANALOG     | -            |

> ✅ 모든 버튼은 `INPUT_PULLUP` 모드로 설정되었으므로, **기본 HIGH** 상태에서 **LOW(=눌림)**을 감지합니다.

---

## 🖐 제스처 모드 매핑 (Handpose + ml5.js)

| 손가락 수 | 인식 모드     |
|------------|---------------|
| 0개       | OFF           |
| 1개       | EMERGENCY     |
| 2개       | BLINKING      |
| 5개       | NORMAL        |
| 3↔4 전환 | 색상 변경(next) |

| 제스처 모드 예시 | 설명 | 예시 이미지 |
|------------------|------|--------------|
| 0개 (주먹)       | 시스템 OFF |![KakaoTalk_20250323_173719256](https://github.com/user-attachments/assets/5a60836e-64a8-4d47-8d49-2fd0e2406909) |
| 1개 손가락       | Emergency 모드 | ![KakaoTalk_20250323_173552947](https://github.com/user-attachments/assets/e2b84cd3-979d-464d-bc16-df26df57049e)|
| 2개 손가락       | Blinking 모드 | ![KakaoTalk_20250323_173418305](https://github.com/user-attachments/assets/1efbe763-6328-48f6-bdf8-f3cfee7d352f)|
| 5개 손가락       | Normal 모드 | ![KakaoTalk_20250323_173114182](https://github.com/user-attachments/assets/00cb1747-ace7-4c7c-ada3-0a51404070f4)|
| 3↔4 변화         | 색상 순환 변경 | ![KakaoTalk_20250323_173628394](https://github.com/user-attachments/assets/de3156ae-0fe6-42cb-8f28-ef79e27c99b3)|

---

## 🎛 슬라이더 기능
- NORMAL 모드에서만 동작
- 선택된 색상(RED / YELLOW / GREEN)에 따라 주기를 개별 조절
- UI 우측 상단 슬라이더 + 색상 라벨 표시

---

## 🔄 시리얼 통신 명령

| 명령 형태                 | 설명                         |
|--------------------------|------------------------------|
| `<MODE:NORMAL>`         | 노멀 모드로 변경               |
| `<MODE:EMERGENCY>`      | 이머전시 모드로 변경           |
| `<SET_RED:3000>`        | 빨간불 주기를 3000ms로 설정     |
| `<SET_YELLOW:1000>`     | 노란불 주기를 1000ms로 설정    |
| `<SET_GREEN:5000>`      | 초록불 주기를 5000ms로 설정    |
| `<SET,R:3000,Y:1000,G:5000>` | 일괄 주기 설정         |

> 모든 명령은 `>` 문자로 끝나야 하며, p5.js에서 TextEncoder로 전송됩니다.

---

## ✅ 실행 방법

1. 아두이노 보드에 코드를 업로드합니다.
2. 웹 페이지(p5.js 스케치) 실행 후 `Connect Serial` 버튼을 눌러 연결합니다.
3. 카메라 앞에서 손동작으로 모드를 제어하고 슬라이더로 주기를 조정합니다.

---

## 📸 시연 예시 이미지
> 이미지 예시 삽입 위치 (회로 구성 이미지, UI 화면 등)
![image](https://github.com/user-attachments/assets/e73079d4-1792-4e3a-996a-2a6a06498cd6)

---

## 🔗 참고자료
- [p5.js 공식 문서](https://p5js.org)
- [Arduino 공식 사이트](https://www.arduino.cc)
- [Web Serial API 문서](https://developer.mozilla.org/en-US/docs/Web/API/Serial)
- [챗GPT 활용](https://chat.openai.com)

---
