class WebBLECentral {
    constructor() {
        this.device = null;
        this.server = null;
        this.services = new Map();
        this.characteristics = new Map();
        this.selectedCharacteristic = null; // 現在選択中の特性（情報表示用）
        this.writeCharacteristic = null;   // 送信用特性
        this.notifyCharacteristic = null;  // 受信用特性
        this.isScanning = false;
        this.discoveredDevices = new Map();
        this.ignoreEcho = true;             // エコーバックを無視するフラグ
        this.lastSentData = null;           // 最後に送信したデータ
        this.lastSentTime = 0;              // 最後に送信した時刻

        this.initializeUI();
        this.checkBluetoothSupport();
    }

    initializeUI() {
        // ボタンイベントリスナー
        document.getElementById('scanBtn').addEventListener('click', () => this.scanDevices());
        document.getElementById('connectBtn').addEventListener('click', () => this.connectToSelectedDevice());
        document.getElementById('disconnectBtn').addEventListener('click', () => this.disconnect());
        document.getElementById('discoverBtn').addEventListener('click', () => this.discoverServices());
        document.getElementById('refreshServicesBtn').addEventListener('click', () => this.refreshServices());
        document.getElementById('writeBtn').addEventListener('click', () => this.writeData());
        document.getElementById('writeHexBtn').addEventListener('click', () => this.writeHexData());
        document.getElementById('readBtn').addEventListener('click', () => this.readData());
        document.getElementById('subscribeBtn').addEventListener('click', () => this.subscribeToNotifications());
        document.getElementById('unsubscribeBtn').addEventListener('click', () => this.unsubscribeFromNotifications());
        document.getElementById('clearLogBtn').addEventListener('click', () => this.clearLog());
        document.getElementById('ignoreEcho').addEventListener('change', (e) => {
            this.ignoreEcho = e.target.checked;
            this.log(`🔄 エコーバック無視: ${this.ignoreEcho ? 'ON' : 'OFF'}`, 'info');
        });
    }

    checkBluetoothSupport() {
        if (!navigator.bluetooth) {
            this.log('❌ Web Bluetooth API がサポートされていません', 'error');
            this.showError('このブラウザは Web Bluetooth API をサポートしていません。Chrome、Edge、Operaをご利用ください。');
            return false;
        }
        this.log('✅ Web Bluetooth API がサポートされています', 'success');
        return true;
    }

    async scanDevices() {
        if (!this.checkBluetoothSupport()) return;

        try {
            this.log('🔍 デバイスのスキャンを開始します...', 'info');
            this.updateScanStatus('scanning');

            // すべてのBLEデバイスを検索（フィルターなし）
            const device = await navigator.bluetooth.requestDevice({
                acceptAllDevices: true,
                optionalServices: [
                    // 基本サービス
                    'generic_access',
                    'generic_attribute',
                    'device_information',
                    // UART/シリアル通信関連
                    '6e400001-b5a3-f393-e0a9-e50e24dcca9e', // Nordic UART Service
                    '49535343-fe7d-4ae5-8fa9-9fafd205e455', // Microchip Transparent UART
                    '0000ffe0-0000-1000-8000-00805f9b34fb', // HM-10 UART Service
                    '0000fff0-0000-1000-8000-00805f9b34fb', // Common UART Service
                    // バッテリー・センサー系
                    'battery_service',
                    'environmental_sensing',
                    'heart_rate',
                    'health_thermometer',
                    // その他よく使われるサービス
                    'immediate_alert',
                    'link_loss',
                    'tx_power',
                    'cycling_power',
                    'cycling_speed_and_cadence',
                    'running_speed_and_cadence',
                    'human_interface_device'
                ]
            });

            this.discoveredDevices.clear();
            this.discoveredDevices.set(device.id, device);
            this.displayDeviceList();

            this.log(`✅ デバイスを発見: ${device.name || 'Unknown'} (${device.id})`, 'success');
            document.getElementById('connectBtn').disabled = false;

        } catch (error) {
            this.log(`❌ スキャンエラー: ${error.message}`, 'error');
            this.showError(`デバイスのスキャンに失敗しました: ${error.message}`);
        } finally {
            this.updateScanStatus('idle');
        }
    }

    displayDeviceList() {
        const deviceList = document.getElementById('deviceList');
        deviceList.innerHTML = '';

        if (this.discoveredDevices.size === 0) {
            deviceList.style.display = 'none';
            return;
        }

        deviceList.style.display = 'block';

        this.discoveredDevices.forEach((device, id) => {
            const deviceItem = document.createElement('div');
            deviceItem.className = 'device-item';
            deviceItem.innerHTML = `
                <div class="device-name">${device.name || 'Unknown Device'}</div>
                <div class="device-id">${device.id}</div>
            `;

            deviceItem.addEventListener('click', () => {
                // 選択状態を更新
                document.querySelectorAll('.device-item').forEach(item => {
                    item.style.background = '';
                });
                deviceItem.style.background = '#e3f2fd';

                this.selectedDevice = device;
                this.log(`📱 デバイスを選択: ${device.name || 'Unknown'} (${device.id})`, 'info');
            });

            deviceList.appendChild(deviceItem);
        });
    }

    async connectToSelectedDevice() {
        if (!this.selectedDevice) {
            this.showError('デバイスが選択されていません');
            return;
        }

        try {
            this.log(`🔗 デバイスに接続中: ${this.selectedDevice.name || 'Unknown'}...`, 'info');

            this.device = this.selectedDevice;
            this.server = await this.device.gatt.connect();

            this.device.addEventListener('gattserverdisconnected', () => {
                this.onDisconnected();
            });

            this.updateConnectionStatus(true);
            this.log(`✅ 接続成功: ${this.device.name || 'Unknown'} (${this.device.id})`, 'success');

            // 接続後に基本的なサービスを探索
            await this.discoverServices();

        } catch (error) {
            this.log(`❌ 接続エラー: ${error.message}`, 'error');
            this.showError(`デバイスへの接続に失敗しました: ${error.message}`);
        }
    }

    async discoverServices() {
        if (!this.server) {
            this.showError('デバイスが接続されていません');
            return;
        }

        try {
            this.log('🔍 サービスを探索中...', 'info');

            const services = await this.server.getPrimaryServices();
            this.services.clear();
            this.characteristics.clear();

            this.log(`📋 ${services.length} 個のサービスを発見しました`, 'success');

            for (const service of services) {
                this.services.set(service.uuid, service);
                this.log(`🔍 サービス探索: ${this.getServiceName(service.uuid)} (${service.uuid})`, 'info');

                try {
                    const characteristics = await service.getCharacteristics();
                    this.log(`  └─ ${characteristics.length} 個の特性を発見`, 'info');

                    for (const characteristic of characteristics) {
                        this.characteristics.set(characteristic.uuid, characteristic);

                        const properties = [];
                        if (characteristic.properties.read) properties.push('Read');
                        if (characteristic.properties.write) properties.push('Write');
                        if (characteristic.properties.writeWithoutResponse) properties.push('WriteNoResp');
                        if (characteristic.properties.notify) properties.push('Notify');
                        if (characteristic.properties.indicate) properties.push('Indicate');

                        this.log(`  └─ ${this.getCharacteristicName(characteristic.uuid)} [${properties.join(', ')}]`, 'info');
                    }
                } catch (error) {
                    this.log(`⚠️ サービス ${service.uuid} の特性取得に失敗: ${error.message}`, 'warning');
                }
            }

            this.displayServices();

            if (services.length === 0) {
                this.log('⚠️ サービスが見つかりませんでした。デバイスが対応していないか、optionalServicesに含まれていない可能性があります', 'warning');
            }

        } catch (error) {
            this.log(`❌ サービス探索エラー: ${error.message}`, 'error');
            this.showError(`サービスの探索に失敗しました: ${error.message}`);

            // 詳細なデバッグ情報を表示
            if (error.name === 'SecurityError') {
                this.log('💡 ヒント: SecurityErrorが発生しました。optionalServicesにサービスUUIDを追加してください', 'warning');
            }
            if (error.name === 'NotSupportedError') {
                this.log('💡 ヒント: デバイスがサポートしていないサービスです', 'warning');
            }
        }
    }

    displayServices() {
        const servicesList = document.getElementById('servicesList');
        servicesList.innerHTML = '';

        if (this.services.size === 0) {
            servicesList.style.display = 'none';
            return;
        }

        servicesList.style.display = 'block';

        this.services.forEach((service, uuid) => {
            const serviceItem = document.createElement('div');
            serviceItem.innerHTML = `
                <h4 style="margin: 10px 0 5px 0; color: #2d3748;">📋 Service: ${this.getServiceName(uuid)}</h4>
                <div style="font-size: 0.9em; color: #6c757d; margin-bottom: 10px;">${uuid}</div>
            `;

            // このサービスの特性を表示
            const characteristicsContainer = document.createElement('div');
            characteristicsContainer.style.marginLeft = '20px';

            this.characteristics.forEach((characteristic, charUuid) => {
                if (characteristic.service.uuid === uuid) {
                    const charItem = document.createElement('div');
                    charItem.className = 'characteristic-item';

                    const properties = [];
                    if (characteristic.properties.read) properties.push('Read');
                    if (characteristic.properties.write) properties.push('Write');
                    if (characteristic.properties.writeWithoutResponse) properties.push('WriteNoResp');
                    if (characteristic.properties.notify) properties.push('Notify');
                    if (characteristic.properties.indicate) properties.push('Indicate');

                    charItem.innerHTML = `
                        <div>
                            <strong>⚙️ ${this.getCharacteristicName(charUuid)}</strong><br>
                            <span class="characteristic-uuid">${charUuid}</span><br>
                            <small>Properties: ${properties.join(', ')}</small>
                        </div>
                        <div class="characteristic-controls">
                            ${characteristic.properties.read ? '<button class="btn-secondary" onclick="central.selectCharacteristic(\'' + charUuid + '\'); central.readData();">Read</button>' : ''}
                            ${(characteristic.properties.write || characteristic.properties.writeWithoutResponse) ? '<button class="btn-primary" onclick="central.selectWriteCharacteristic(\'' + charUuid + '\');">Select Write</button>' : ''}
                            ${characteristic.properties.notify ? '<button class="btn-secondary" onclick="central.selectNotifyCharacteristic(\'' + charUuid + '\'); central.subscribeToNotifications();">Notify</button>' : ''}
                            ${characteristic.properties.indicate ? '<button class="btn-secondary" onclick="central.selectNotifyCharacteristic(\'' + charUuid + '\'); central.subscribeToNotifications();">Indicate</button>' : ''}
                        </div>
                    `;

                    characteristicsContainer.appendChild(charItem);
                }
            });

            serviceItem.appendChild(characteristicsContainer);
            servicesList.appendChild(serviceItem);
        });
    }

    selectCharacteristic(uuid) {
        this.selectedCharacteristic = this.characteristics.get(uuid);
        if (this.selectedCharacteristic) {
            this.log(`🎯 特性を選択: ${this.getCharacteristicName(uuid)}`, 'info');
        }
    }

    selectWriteCharacteristic(uuid) {
        this.writeCharacteristic = this.characteristics.get(uuid);
        this.selectedCharacteristic = this.writeCharacteristic; // 情報表示用
        if (this.writeCharacteristic) {
            this.log(`📤 送信用特性を選択: ${this.getCharacteristicName(uuid)}`, 'success');
            this.updateDataControls();
        }
    }

    selectNotifyCharacteristic(uuid) {
        this.notifyCharacteristic = this.characteristics.get(uuid);
        this.selectedCharacteristic = this.notifyCharacteristic; // 情報表示用
        if (this.notifyCharacteristic) {
            this.log(`📥 受信用特性を選択: ${this.getCharacteristicName(uuid)}`, 'success');
            this.updateDataControls();
        }
    }

    updateDataControls() {
        const hasWriteCharacteristic = this.writeCharacteristic !== null;
        const hasNotifyCharacteristic = this.notifyCharacteristic !== null;
        const hasSelectedCharacteristic = this.selectedCharacteristic !== null;

        const canRead = hasSelectedCharacteristic && this.selectedCharacteristic.properties.read;
        const canWrite = hasWriteCharacteristic && (this.writeCharacteristic.properties.write || this.writeCharacteristic.properties.writeWithoutResponse);
        const canNotify = hasNotifyCharacteristic && (this.notifyCharacteristic.properties.notify || this.notifyCharacteristic.properties.indicate);

        document.getElementById('writeBtn').disabled = !canWrite;
        document.getElementById('writeHexBtn').disabled = !canWrite;
        document.getElementById('readBtn').disabled = !canRead;
        document.getElementById('subscribeBtn').disabled = !canNotify;
        document.getElementById('unsubscribeBtn').disabled = !canNotify;

        // 現在の状態をログに表示
        if (hasWriteCharacteristic) {
            this.log(`✅ 送信準備完了: ${this.getCharacteristicName(this.writeCharacteristic.uuid)}`, 'info');
        }
        if (hasNotifyCharacteristic) {
            this.log(`✅ 受信準備完了: ${this.getCharacteristicName(this.notifyCharacteristic.uuid)}`, 'info');
        }
    }

    async writeData() {
        if (!this.writeCharacteristic) {
            this.showError('送信用特性が選択されていません');
            return;
        }

        const data = document.getElementById('writeData').value;
        if (!data) {
            this.showError('送信データを入力してください');
            return;
        }

        try {
            const encoder = new TextEncoder();
            const dataArray = encoder.encode(data);

            // 送信データを記録（エコーバック検出用）
            this.lastSentData = dataArray;
            this.lastSentTime = Date.now();

            // writeWithoutResponseを優先的に使用（UART通信でよく使われる）
            if (this.writeCharacteristic.properties.writeWithoutResponse) {
                await this.writeCharacteristic.writeValueWithoutResponse(dataArray);
                this.log(`📤 データ送信成功 (WriteWithoutResponse): "${data}" → ${this.getCharacteristicName(this.writeCharacteristic.uuid)}`, 'success');
            } else if (this.writeCharacteristic.properties.write) {
                await this.writeCharacteristic.writeValue(dataArray);
                this.log(`📤 データ送信成功 (Write): "${data}" → ${this.getCharacteristicName(this.writeCharacteristic.uuid)}`, 'success');
            } else {
                throw new Error('書き込み可能な特性ではありません');
            }

        } catch (error) {
            this.log(`❌ データ送信エラー: ${error.message}`, 'error');
            this.showError(`データの送信に失敗しました: ${error.message}`);
        }
    }

    async writeHexData() {
        if (!this.writeCharacteristic) {
            this.showError('送信用特性が選択されていません');
            return;
        }

        const hexData = document.getElementById('writeHex').value.replace(/\s/g, '');
        if (!hexData) {
            this.showError('HEXデータを入力してください');
            return;
        }

        try {
            const bytes = hexData.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16));
            if (!bytes) {
                throw new Error('無効なHEXデータです');
            }

            const dataArray = new Uint8Array(bytes);

            // 送信データを記録（エコーバック検出用）
            this.lastSentData = dataArray;
            this.lastSentTime = Date.now();

            // writeWithoutResponseを優先的に使用（UART通信でよく使われる）
            if (this.writeCharacteristic.properties.writeWithoutResponse) {
                await this.writeCharacteristic.writeValueWithoutResponse(dataArray);
                this.log(`📤 HEXデータ送信成功 (WriteWithoutResponse): ${hexData}`, 'success');
            } else if (this.writeCharacteristic.properties.write) {
                await this.writeCharacteristic.writeValue(dataArray);
                this.log(`📤 HEXデータ送信成功 (Write): ${hexData}`, 'success');
            } else {
                throw new Error('書き込み可能な特性ではありません');
            }

        } catch (error) {
            this.log(`❌ HEXデータ送信エラー: ${error.message}`, 'error');
            this.showError(`HEXデータの送信に失敗しました: ${error.message}`);
        }
    }

    async readData() {
        if (!this.selectedCharacteristic) {
            this.showError('特性が選択されていません');
            return;
        }

        try {
            const value = await this.selectedCharacteristic.readValue();
            this.displayReceivedData(value);
            this.log(`📥 データ読取成功`, 'success');

        } catch (error) {
            this.log(`❌ データ読取エラー: ${error.message}`, 'error');
            this.showError(`データの読取に失敗しました: ${error.message}`);
        }
    }

    async subscribeToNotifications() {
        if (!this.notifyCharacteristic) {
            this.showError('受信用特性が選択されていません');
            return;
        }

        try {
            await this.notifyCharacteristic.startNotifications();
            this.notifyCharacteristic.addEventListener('characteristicvaluechanged', (event) => {
                this.displayReceivedData(event.target.value);
                this.log(`📥 通知受信: ${this.getCharacteristicName(event.target.uuid)}`, 'info');
            });

            this.log(`🔔 通知を開始しました: ${this.getCharacteristicName(this.notifyCharacteristic.uuid)}`, 'success');

        } catch (error) {
            this.log(`❌ 通知開始エラー: ${error.message}`, 'error');
            this.showError(`通知の開始に失敗しました: ${error.message}`);
        }
    }

    async unsubscribeFromNotifications() {
        if (!this.notifyCharacteristic) {
            this.showError('受信用特性が選択されていません');
            return;
        }

        try {
            await this.notifyCharacteristic.stopNotifications();
            this.log(`🔕 通知を停止しました: ${this.getCharacteristicName(this.notifyCharacteristic.uuid)}`, 'success');

        } catch (error) {
            this.log(`❌ 通知停止エラー: ${error.message}`, 'error');
            this.showError(`通知の停止に失敗しました: ${error.message}`);
        }
    }

    displayReceivedData(dataView) {
        // バイト配列として変換
        const byteArray = new Uint8Array(dataView.buffer);

        // エコーバック検出
        if (this.ignoreEcho && this.lastSentData && this.lastSentTime) {
            const timeDiff = Date.now() - this.lastSentTime;
            // 5秒以内に送信されたデータと同じ内容ならエコーバックとして無視
            if (timeDiff < 5000 && this.arraysEqual(byteArray, this.lastSentData)) {
                this.log(`🔄 エコーバック検出（無視）: ${this.arrayToHex(byteArray)}`, 'warning');
                return;
            }
        }

        const receivedDataDiv = document.getElementById('receivedData');
        const dataContentDiv = document.getElementById('dataContent');

        const hexString = Array.from(byteArray)
            .map(b => b.toString(16).padStart(2, '0'))
            .join(' ');

        // 文字列として表示（可能な場合）
        const decoder = new TextDecoder();
        let textString = '';
        try {
            textString = decoder.decode(dataView);
        } catch (error) {
            textString = '(デコード不可)';
        }

        const timestamp = new Date().toLocaleTimeString();

        dataContentDiv.innerHTML = `
            <div><strong>時刻:</strong> ${timestamp}</div>
            <div><strong>HEX:</strong> ${hexString}</div>
            <div><strong>テキスト:</strong> ${textString}</div>
            <div><strong>バイト数:</strong> ${byteArray.length}</div>
        `;

        receivedDataDiv.style.display = 'block';
        this.log(`📥 データ受信: HEX[${hexString}] TEXT[${textString}]`, 'info');
    }

    // 配列比較用ヘルパーメソッド
    arraysEqual(a, b) {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) return false;
        }
        return true;
    }

    // HEX文字列変換用ヘルパーメソッド
    arrayToHex(array) {
        return Array.from(array)
            .map(b => b.toString(16).padStart(2, '0'))
            .join(' ');
    }

    async disconnect() {
        try {
            if (this.server) {
                await this.server.disconnect();
            }
            this.onDisconnected();
            this.log('✅ 切断完了', 'success');
        } catch (error) {
            this.log(`❌ 切断エラー: ${error.message}`, 'error');
        }
    }

    onDisconnected() {
        this.device = null;
        this.server = null;
        this.services.clear();
        this.characteristics.clear();
        this.selectedCharacteristic = null;
        this.writeCharacteristic = null;
        this.notifyCharacteristic = null;
        this.lastSentData = null;
        this.lastSentTime = 0;
        this.updateConnectionStatus(false);
        this.log('🔌 デバイスが切断されました', 'warning');
    }

    async refreshServices() {
        if (!this.server) {
            this.showError('デバイスが接続されていません');
            return;
        }
        await this.discoverServices();
    }

    updateConnectionStatus(connected) {
        const statusDiv = document.getElementById('connectionStatus');
        const deviceInfoDiv = document.getElementById('deviceInfo');

        if (connected && this.device) {
            statusDiv.className = 'status connected';
            statusDiv.textContent = '接続済み';

            document.getElementById('connectedDeviceName').textContent = this.device.name || 'Unknown';
            document.getElementById('connectedDeviceId').textContent = this.device.id;
            deviceInfoDiv.style.display = 'block';

            document.getElementById('connectBtn').disabled = true;
            document.getElementById('disconnectBtn').disabled = false;
            document.getElementById('discoverBtn').disabled = false;
            document.getElementById('refreshServicesBtn').disabled = false;

        } else {
            statusDiv.className = 'status disconnected';
            statusDiv.textContent = '未接続';
            deviceInfoDiv.style.display = 'none';

            document.getElementById('connectBtn').disabled = false;
            document.getElementById('disconnectBtn').disabled = true;
            document.getElementById('discoverBtn').disabled = true;
            document.getElementById('refreshServicesBtn').disabled = true;

            // データ操作ボタンも無効化
            document.getElementById('writeBtn').disabled = true;
            document.getElementById('writeHexBtn').disabled = true;
            document.getElementById('readBtn').disabled = true;
            document.getElementById('subscribeBtn').disabled = true;
            document.getElementById('unsubscribeBtn').disabled = true;
        }
    }

    updateScanStatus(status) {
        const scanStatusDiv = document.getElementById('scanStatus');
        const scanBtn = document.getElementById('scanBtn');

        if (status === 'scanning') {
            scanStatusDiv.className = 'status scanning';
            scanStatusDiv.textContent = '🔍 スキャン中...';
            scanStatusDiv.style.display = 'block';
            scanBtn.disabled = true;
        } else {
            scanStatusDiv.style.display = 'none';
            scanBtn.disabled = false;
        }
    }

    log(message, type = 'info') {
        const logArea = document.getElementById('logArea');
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = document.createElement('div');

        let color = '#e2e8f0';
        if (type === 'error') color = '#feb2b2';
        if (type === 'success') color = '#9ae6b4';
        if (type === 'warning') color = '#fbb6ce';

        logEntry.style.color = color;
        logEntry.innerHTML = `[${timestamp}] ${message}`;
        logArea.appendChild(logEntry);
        logArea.scrollTop = logArea.scrollHeight;
    }

    clearLog() {
        document.getElementById('logArea').innerHTML = '';
    }

    showError(message) {
        // エラーダイアログを表示
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error';
        errorDiv.textContent = message;

        document.querySelector('.container').insertBefore(errorDiv, document.querySelector('.container').firstChild);

        // 5秒後に自動で削除
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }

    getServiceName(uuid) {
        const serviceNames = {
            // 標準サービス
            '00001800-0000-1000-8000-00805f9b34fb': 'Generic Access',
            '00001801-0000-1000-8000-00805f9b34fb': 'Generic Attribute',
            '0000180a-0000-1000-8000-00805f9b34fb': 'Device Information',
            '0000180f-0000-1000-8000-00805f9b34fb': 'Battery Service',
            '00001812-0000-1000-8000-00805f9b34fb': 'Human Interface Device',
            '0000181a-0000-1000-8000-00805f9b34fb': 'Environmental Sensing',
            '0000181b-0000-1000-8000-00805f9b34fb': 'Body Composition',
            '0000180d-0000-1000-8000-00805f9b34fb': 'Heart Rate',
            '00001809-0000-1000-8000-00805f9b34fb': 'Health Thermometer',
            '00001802-0000-1000-8000-00805f9b34fb': 'Immediate Alert',
            '00001803-0000-1000-8000-00805f9b34fb': 'Link Loss',
            '00001804-0000-1000-8000-00805f9b34fb': 'Tx Power',
            // UART/シリアル通信サービス
            '6e400001-b5a3-f393-e0a9-e50e24dcca9e': 'Nordic UART Service (NUS)',
            '49535343-fe7d-4ae5-8fa9-9fafd205e455': 'Microchip Transparent UART',
            '0000ffe0-0000-1000-8000-00805f9b34fb': 'HM-10 UART Service',
            '0000fff0-0000-1000-8000-00805f9b34fb': 'Common UART Service',
            // その他
            '00001816-0000-1000-8000-00805f9b34fb': 'Cycling Speed and Cadence',
            '00001818-0000-1000-8000-00805f9b34fb': 'Cycling Power',
            '00001814-0000-1000-8000-00805f9b34fb': 'Running Speed and Cadence'
        };
        return serviceNames[uuid] || 'Unknown Service';
    }

    getCharacteristicName(uuid) {
        const characteristicNames = {
            // 標準特性
            '00002a00-0000-1000-8000-00805f9b34fb': 'Device Name',
            '00002a01-0000-1000-8000-00805f9b34fb': 'Appearance',
            '00002a04-0000-1000-8000-00805f9b34fb': 'Peripheral Preferred Connection Parameters',
            '00002a05-0000-1000-8000-00805f9b34fb': 'Service Changed',
            '00002a19-0000-1000-8000-00805f9b34fb': 'Battery Level',
            '00002a29-0000-1000-8000-00805f9b34fb': 'Manufacturer Name String',
            '00002a24-0000-1000-8000-00805f9b34fb': 'Model Number String',
            '00002a25-0000-1000-8000-00805f9b34fb': 'Serial Number String',
            '00002a27-0000-1000-8000-00805f9b34fb': 'Hardware Revision String',
            '00002a26-0000-1000-8000-00805f9b34fb': 'Firmware Revision String',
            '00002a28-0000-1000-8000-00805f9b34fb': 'Software Revision String',
            '00002a37-0000-1000-8000-00805f9b34fb': 'Heart Rate Measurement',
            '00002a38-0000-1000-8000-00805f9b34fb': 'Body Sensor Location',
            '00002a39-0000-1000-8000-00805f9b34fb': 'Heart Rate Control Point',
            // Nordic UART Service 特性
            '6e400002-b5a3-f393-e0a9-e50e24dcca9e': 'Nordic UART RX (Write)',
            '6e400003-b5a3-f393-e0a9-e50e24dcca9e': 'Nordic UART TX (Notify)',
            // Microchip Transparent UART 特性
            '49535343-1e4d-4bd9-ba61-23c647249616': 'Microchip UART Data',
            '49535343-8841-43f4-a8d4-ecbe34729bb3': 'Microchip UART Control',
            // HM-10 UART 特性
            '0000ffe1-0000-1000-8000-00805f9b34fb': 'HM-10 UART Data',
            // Common UART 特性
            '0000fff1-0000-1000-8000-00805f9b34fb': 'Common UART RX',
            '0000fff2-0000-1000-8000-00805f9b34fb': 'Common UART TX',
            '0000fff3-0000-1000-8000-00805f9b34fb': 'Common UART Control',
            '0000fff4-0000-1000-8000-00805f9b34fb': 'Common UART Config'
        };
        return characteristicNames[uuid] || 'Unknown Characteristic';
    }
}

// アプリケーションを初期化
const central = new WebBLECentral();

// ページロード時の初期化
document.addEventListener('DOMContentLoaded', () => {
    central.log('🚀 WebBLE Central が起動しました', 'success');
    central.log('📱 BLE デバイスのテストを開始できます', 'info');
});
