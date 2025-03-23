#include <Arduino.h>
#include <TaskScheduler.h>

// 핀 정의
#define RED_LED 3
#define YELLOW_LED 9
#define GREEN_LED 5
#define BTN_EMERGENCY 6
#define BTN_BLINKING 7
#define BTN_ONOFF 8
#define POTENTIOMETER_PIN A0

// 상태 변수
int ledBrightness = 255;
bool emergencyMode = false;
bool blinkingMode = false;
bool systemOn = true;

// 디바운싱
unsigned long lastDebounceTimeEmergency = 0;
unsigned long lastDebounceTimeBlinking = 0;
unsigned long lastDebounceTimeOnOff = 0;
const unsigned long debounceDelay = 50;

int trafficState = 0;
unsigned long lastStateChangeTime = 0;
unsigned long trafficDelays[] = {2000, 500, 2000, 200, 130, 200, 130, 200, 130, 500};

Scheduler runner;

void blinkLEDs();
void toggleLEDs();
void emergencyModeOn();
void sendTrafficLightState();
void checkButtons();

Task taskBlinking(500, TASK_FOREVER, &blinkLEDs, &runner, false);
Task taskToggleLEDs(100, TASK_FOREVER, &toggleLEDs, &runner, true);
Task taskEmergency(100, TASK_FOREVER, &emergencyModeOn, &runner, false);
Task taskSendTrafficState(500, TASK_FOREVER, &sendTrafficLightState, &runner, true);

int previousBrightness = -1;
String lastSentState = "";

void updateLEDBrightness() {
  int sensorValue = analogRead(POTENTIOMETER_PIN);
  ledBrightness = map(sensorValue, 0, 1023, 0, 255);
}

void sendTrafficLightState() {
  String state;

  if (!systemOn) state = "OFF";
  else if (emergencyMode) state = "EMERGENCY";
  else if (blinkingMode) state = "BLINKING";
  else {
    if (trafficState == 0) state = "RED";
    else if (trafficState == 1 || trafficState == 9) state = "YELLOW";
    else if (trafficState == 2) state = "GREEN";
    else if (trafficState >= 3 && trafficState <= 8) state = "GREEN_BLINK";
  }

  if (state != lastSentState) {
    Serial.print("<" + state + ">");
    lastSentState = state;
  }

  if (ledBrightness != previousBrightness) {
    Serial.print("[BRIGHTNESS:" + String(ledBrightness) + "]");
    previousBrightness = ledBrightness;
  }
}

void toggleLEDs() {
  unsigned long now = millis();
  checkButtons();
  updateLEDBrightness();

  if (now - lastStateChangeTime >= trafficDelays[trafficState]) {
    lastStateChangeTime = now;
    trafficState = (trafficState + 1) % 10;

    analogWrite(RED_LED, (trafficState == 0) ? ledBrightness : 0);
    analogWrite(YELLOW_LED, (trafficState == 1 || trafficState == 9) ? ledBrightness : 0);
    analogWrite(GREEN_LED, (trafficState == 2 || trafficState == 3 || trafficState == 5 || trafficState == 7) ? ledBrightness : 0);
  }
}

void emergencyModeOn() {
  checkButtons();
  updateLEDBrightness();
  analogWrite(RED_LED, ledBrightness);
  analogWrite(YELLOW_LED, 0);
  analogWrite(GREEN_LED, 0);
}

void blinkLEDs() {
  static unsigned long lastBlinkTime = 0;
  unsigned long now = millis();

  if (!blinkingMode) return;

  if (now - lastBlinkTime > 500) {
    static bool state = false;
    state = !state;

    int brightness = state ? ledBrightness : 0;
    analogWrite(RED_LED, brightness);
    analogWrite(YELLOW_LED, brightness);
    analogWrite(GREEN_LED, brightness);

    lastBlinkTime = now;
  }

  sendTrafficLightState();
}

void checkButtons() {
  unsigned long currentMillis = millis();

  if (digitalRead(BTN_EMERGENCY) == LOW && (currentMillis - lastDebounceTimeEmergency > debounceDelay)) {
    emergencyMode = !emergencyMode;
    if (emergencyMode) {
      taskEmergency.enable();
      taskBlinking.disable();
      taskToggleLEDs.disable();
      taskSendTrafficState.enable();
      Serial.println("<EMERGENCY MODE ENABLED>");
    } else {
      taskEmergency.disable();
      taskToggleLEDs.enable();
      taskSendTrafficState.enable();
      Serial.println("<EMERGENCY MODE DISABLED>");
    }
    lastDebounceTimeEmergency = currentMillis;
    while (digitalRead(BTN_EMERGENCY) == LOW);
  }

  if (digitalRead(BTN_BLINKING) == LOW && (currentMillis - lastDebounceTimeBlinking > debounceDelay)) {
    blinkingMode = !blinkingMode;
    if (blinkingMode) {
      taskBlinking.enable();
      taskToggleLEDs.disable();
      Serial.println("<BLINKING MODE ENABLED>");
    } else {
      taskBlinking.disable();
      taskToggleLEDs.enable();
      Serial.println("<BLINKING MODE DISABLED>");
    }
    lastDebounceTimeBlinking = currentMillis;
    while (digitalRead(BTN_BLINKING) == LOW);
  }

  if (digitalRead(BTN_ONOFF) == LOW && (currentMillis - lastDebounceTimeOnOff > debounceDelay)) {
    systemOn = !systemOn;
    if (systemOn) {
      taskToggleLEDs.enable();
      taskSendTrafficState.enable();
    } else {
      taskToggleLEDs.disable();
      taskBlinking.disable();
      taskEmergency.disable();
      taskSendTrafficState.disable();
      digitalWrite(RED_LED, LOW);
      digitalWrite(YELLOW_LED, LOW);
      digitalWrite(GREEN_LED, LOW);
      Serial.print("<OFF>");
    }
    lastDebounceTimeOnOff = currentMillis;
    while (digitalRead(BTN_ONOFF) == LOW);
  }
}

void setup() {
  pinMode(RED_LED, OUTPUT);
  pinMode(YELLOW_LED, OUTPUT);
  pinMode(GREEN_LED, OUTPUT);
  pinMode(BTN_EMERGENCY, INPUT_PULLUP);
  pinMode(BTN_BLINKING, INPUT_PULLUP);
  pinMode(BTN_ONOFF, INPUT_PULLUP);

  Serial.begin(115200);

  runner.addTask(taskToggleLEDs);
  runner.addTask(taskSendTrafficState);
  taskToggleLEDs.enable();
  taskSendTrafficState.enable();
}

void loop() {
  checkButtons();
  if (systemOn) {
    runner.execute();
  }

  if (Serial.available() > 0) {
    String received = Serial.readStringUntil('>');
    int redDuration, yellowDuration, greenDuration;

    if (!blinkingMode && sscanf(received.c_str(), "<SET,R:%d,Y:%d,G:%d", &redDuration, &yellowDuration, &greenDuration) == 3) {
      trafficDelays[0] = redDuration;
      trafficDelays[1] = yellowDuration;
      trafficDelays[2] = greenDuration;
      Serial.println("Timings Updated");
    } else if (received.startsWith("<SET_RED:")) {
      trafficDelays[0] = received.substring(9).toInt();
      Serial.println("Red Timing Updated");
    } else if (received.startsWith("<SET_YELLOW:")) {
      trafficDelays[1] = received.substring(12).toInt();
      Serial.println("Yellow Timing Updated");
    } else if (received.startsWith("<SET_GREEN:")) {
      trafficDelays[2] = received.substring(11).toInt();
      Serial.println("Green Timing Updated");
    } else if (blinkingMode) {
      Serial.println("Ignored: Blinking Mode Active");
    }
  }
}