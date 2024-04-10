////////////////////////////////////////////////////////////////////
// Raspberry PiでフルカラーLED照明をつくる
// Hiroshi SUGIMURA
////////////////////////////////////////////////////////////////////
import java.io.IOException;
import processing.net.*;
import controlP5.*;

import com.sonycsl.echo.Echo;
import com.sonycsl.echo.node.EchoNode;
import com.sonycsl.echo.eoj.profile.NodeProfile;
import com.sonycsl.echo.eoj.device.DeviceObject;

import com.sonycsl.echo.processing.defaults.DefaultNodeProfile;
import com.sonycsl.echo.eoj.device.housingfacilities.GeneralLighting;

////////////////////////////////////////////////////////////////////
// 追加ここから
// GPIO
import com.pi4j.io.gpio.GpioController;
import com.pi4j.io.gpio.GpioFactory;
import com.pi4j.io.gpio.GpioPinDigitalOutput;
import com.pi4j.io.gpio.GpioPinPwmOutput;
import com.pi4j.io.gpio.PinPullResistance;
import com.pi4j.io.gpio.RaspiPin;
import com.pi4j.io.gpio.PinState;

GpioController gpio;
GpioPinPwmOutput led_r;  // Pin12, GPIO 1
GpioPinDigitalOutput led_g;  // Pin8, GPIO 0
GpioPinDigitalOutput led_b;  // Pin10, GPIO 2

// for LED control
byte led_r_level = (byte) 0x00;
byte led_g_level = (byte) 0x00;
byte led_b_level = (byte) 0x00;

// ここまで
////////////////////////////////////////////////////////////////////

color backgroundLightOnColor = color(255, 255, 255);
color backgroundLightOffColor = color(0, 0, 0);
color backgroundNow = backgroundLightOffColor;


// 照明クラスを実装します。
public class LightEmulator extends GeneralLighting {
  byte[] mStatus = {
    0x31
  }; // 電源状態を格納する変数です。デフォルトはOFFと仮定します。
  byte[] mLocation = {
    0x00
  }; // 機器の置き場所を格納する変数です。
  byte[] mFaultStatus = {
    0x42
  };  // 機器に問題が発生した時に、そのコードを格納します。
  byte[] mManufacturerCode = {
    0, 0, 0
  };  // ベンダー固有のメーカコードです。
  byte[] mLightingMode = {
    0x42
  }; // 照明のモードです。

////////////////////////////////////////////////////////////////////
// 追加ここから
  byte[] mColor = {
    (byte)255, (byte)255, (byte)255
  }; // color
// ここまで
////////////////////////////////////////////////////////////////////

  protected boolean setOperationStatus(byte[] edt) {
    mStatus[0] = edt[0] ;
    //背景色を変更
    if (mStatus[0] == 0x30) {
      backgroundNow = backgroundLightOnColor;
    } else {
      backgroundNow = backgroundLightOffColor;
    }
    //電源状態が変化したことを他のノードに通知します
    try {
      inform().reqInformOperationStatus().send();
    }
    catch (IOException e) {
      e.printStackTrace();
    }
    return true;
  }
  protected byte[] getOperationStatus() {
    return mStatus;
  }

////////////////////////////////////////////////////////////////////
// 追加ここから
  protected boolean setRgbSettingForColorLighting(byte[] edt) {
    System.out.println("RGB edt is :" + edt[0] +"," + edt[1] + ", " + edt[2] );
    mColor[0] = edt[0];
    led_r_level = mColor[0];

    mColor[1] = (edt[1] & (byte)0x80) != 0 ? (byte)0xFF : (byte)0x00;
    led_g_level = mColor[1];

    mColor[2] = (edt[2] & (byte)0x80) != 0 ? (byte)0xFF : (byte)0x00;
    led_b_level = mColor[2];

    backgroundNow = color( (int)led_r_level & 0xff, (int)led_g_level & 0xff, (int)led_b_level & 0xff);

    System.out.println("RGB is :" + (int)(led_r_level & 0xff) +", " + (int) (led_g_level & 0xff) + ", " + (int) (led_b_level & 0xff) );
    return true;
  }

  protected byte[] getRgbSettingForColorLighting() {
    return mColor;
  }

  protected void setupPropertyMaps() {
    super.setupPropertyMaps();
    addGetProperty( EPC_RGB_SETTING_FOR_COLOR_LIGHTING );
    addSetProperty( EPC_RGB_SETTING_FOR_COLOR_LIGHTING );
  }
  // ここまで
  ////////////////////////////////////////////////////////////////////

  protected boolean setInstallationLocation(byte[] edt) {
    mLocation[0] = edt[0];
    try {
      inform().reqInformInstallationLocation().send();
    }
    catch (IOException e) {
      e.printStackTrace();
    }
    return true;
  }
  protected byte[] getInstallationLocation() {
    return mLocation;
  }
  protected byte[] getFaultStatus() {
    return mFaultStatus;
  }
  protected byte[] getManufacturerCode() {
    return mManufacturerCode;
  }

  protected byte[] getLightingModeSetting() {
    return mLightingMode;
  }

  protected boolean setLightingModeSetting(byte[] edt) {
    mLightingMode[0] = edt[0];
    return true;
  }

  public String toString() {
    if (mStatus[0] == 0x31) {
      return "Light Emulator(Off)";
    } else {
      return "Light Emulator(On)";
    }
  }
}

ControlP5 cp5 ;
LightEmulator light ;
String[] btnStrs = {
  "SWITCH_ON", "SWITCH_OFF"
};

void setup() {
  ////////////////////////////////////////////////////////////////////
// 追加ここから
  // GPIO
  gpio = GpioFactory.getInstance();
  led_r = gpio.provisionPwmOutputPin( RaspiPin.GPIO_01 );
  led_g = gpio.provisionDigitalOutputPin( RaspiPin.GPIO_04 );
  led_b = gpio.provisionDigitalOutputPin( RaspiPin.GPIO_05 );
 // ここまで
  //////////////////////////////////////////////////////////////

  size(210, (btnStrs.length)*30);
  frameRate(30);

  // 次に、学習と再生のユーザーインターフェースを作成します。
  cp5 = new ControlP5(this) ;
  // 送信用のボタンを左に、学習用のボタンを右に表示します。
  for ( int bi=0; bi<btnStrs.length; ++bi ) {
    cp5.addButton(btnStrs[bi], 0, 0, (bi)*30, 100, 25) ;
  }

  // System.outにログを表示するようにします。
  //Echo.addEventListener( new Echo.Logger(System.out) ) ;

  // 自分自身がLightEmulatorを含むノードになることにしましょう。
  try {
    light = new LightEmulator() ;
    Echo.start( new DefaultNodeProfile(), new DeviceObject[] {
      light
    }
    );
  }
  catch( IOException e) {
    e.printStackTrace();
  }
}

void draw() {
  background(backgroundNow);

  ////////////////////////////////////////////////////////////////////
// 追加ここから
  led_r.setPwm( ((int)led_r_level & 0xff) * 4);

  if ( led_g_level == (byte)0xFF ) {
    led_g.high();
  } else {
    led_g.low();
  }

  if ( led_b_level == (byte)0xFF ) {
    led_b.high();
  } else {
    led_b.low();
  }
  // ここまで
  ///////////////////////////////////////
}

// ボタンが押された時の処理です。
// ※ControlP5ではボタンのラベルがそのまま関数名になります。
public void SWITCH_ON(int theValue) {
  try {
    light.set().reqSetOperationStatus(new byte[] {
      0x30
    }
    ).send();

    ////////////////////////////////////////////////////////////////////
// 追加ここから
    light.set().reqSetRgbSettingForColorLighting(new byte[] { (byte)0xff, (byte)0xff, (byte)0xff }).send();
// ここまで
    ////////////////////////////////////////////////////////////////////

  }
  catch(IOException e) {
    e.printStackTrace();
  }
}
public void SWITCH_OFF(int theValue) {
  try {
    light.set().reqSetOperationStatus(new byte[] {
      0x31
    }
    ).send();

    ////////////////////////////////////////////////////////////////////
// 追加ここから
    light.set().reqSetRgbSettingForColorLighting(new byte[] { (byte)0x00, (byte)0x00, (byte)0x00 }).send();
// ここまで
    ////////////////////////////////////////////////////////////////////
  }
  catch(IOException e) {
    e.printStackTrace();
  }
}

