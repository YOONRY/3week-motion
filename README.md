# 🧪 p5.js & Arduino 일반 연동 프로젝트

## 🧾 프로젝트 개요
이 프로젝트는 **p5.js**와 **Arduino**를 활용하여 웹과 물리적 디바이스가 상호작용하는 과제물입니다. 웹 기반 인터페이스(p5.js)와 아두이노를 연결하여 실시간 시각화, 제어를 구현하였습니다.

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

## 🔗 참고자료
- [p5.js 공식 문서](https://p5js.org)
- [Arduino 공식 사이트](https://www.arduino.cc)
- [Web Serial API 문서](https://developer.mozilla.org/en-US/docs/Web/API/Serial)
- [챗GPT 활용](https://chat.openai.com)

---

# ✨ 제스처 기반 스마트 신호등 프로젝트

이 프로젝트는 **아두이노**와 **p5.js**, **ml5.js**를 활용하여 제스처로 제어 가능한 스마트 신호등 시스템을 구현한 것입니다. 손동작만으로 신호등의 모드 변경, 주기 조절, 색상 변경이 가능합니다.

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
| 0개 (주먹)       | 시스템 OFF | (이미지 삽입) |
| 1개 손가락       | Emergency 모드 | (이미지 삽입) |
| 2개 손가락       | Blinking 모드 | (이미지 삽입) |
| 5개 손가락       | Normal 모드 | (이미지 삽입) |
| 3↔4 변화         | 색상 순환 변경 | (이미지 삽입) |

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

---

## 📽️ 제스처 프로젝트 시연 영상

[👉 시연 영상 보러가기](https://youtu.be/alHJsZcv0D4?si=Yj-HD-j2aSYUaTnh)

---
