'use strict';

((window: Window) => {

  // ==================== TYPES & INTERFACES ====================
  interface MQTTPacket {
    cmd: string;
    qos?: number;
    dup?: boolean;
    retain?: boolean;
    topic?: string;
    messageId?: number;
    payload?: Uint8Array;
  }

  interface Parser {
    on(event: 'packet', fn: (data: MQTTPacket) => void): void;
    on(event: 'error', fn: (data: Error) => void): void;
    parse(data: Uint8Array): void;
  }

  interface Settings {
    block_seen_chat: boolean;
    block_typing_chat: boolean;
  }

  interface GenerateOptions {
    protocolVersion?: number;
  }

  // ==================== MQTT PARSER / GENERATOR ====================
  const textDecoder = new TextDecoder();
  const textEncoder = new TextEncoder();

  const CMD_NAMES: (string | null)[] = [
    null, 'connect', 'connack', 'publish', 'puback',
    'pubrec', 'pubrel', 'pubcomp', 'subscribe', 'suback',
    'unsubscribe', 'unsuback', 'pingreq', 'pingresp', 'disconnect', 'auth'
  ];

  function decodeRemainingLength(data: Uint8Array, startIndex: number): { value: number; bytesRead: number } {
    let value = 0;
    let multiplier = 1;
    let index = startIndex;
    let byte: number;

    do {
      if (index >= data.length) throw new Error('Incomplete remaining length');
      byte = data[index++];
      value += (byte & 0x7F) * multiplier;
      multiplier *= 128;
    } while (byte & 0x80);

    return { value, bytesRead: index - startIndex };
  }

  function encodeRemainingLength(length: number): number[] {
    const bytes: number[] = [];
    do {
      let byte = length % 128;
      length = Math.floor(length / 128);
      if (length > 0) byte |= 0x80;
      bytes.push(byte);
    } while (length > 0);
    return bytes;
  }

  function parser(opts: GenerateOptions = {}): Parser {
    const listeners: { packet: Array<(packet: MQTTPacket) => void>; error: Array<(error: Error) => void> } = {
      packet: [],
      error: []
    };

    return {
      on(event: 'packet' | 'error', fn: any) {
        if (event === 'packet') listeners.packet.push(fn);
        if (event === 'error') listeners.error.push(fn);
      },
      parse(data: Uint8Array) {
        let pos = 0;
        while (pos < data.length) {
          let packet: MQTTPacket | undefined;
          let headerSize: number;
          let remainingLength: number;

          try {
            const byte0 = data[pos];
            const typeNum = (byte0 >> 4) & 0x0F;
            const cmd = CMD_NAMES[typeNum];

            const rl = decodeRemainingLength(data, pos + 1);
            headerSize = 1 + rl.bytesRead;
            remainingLength = rl.value;

            if (pos + headerSize + remainingLength > data.length) {
              throw new Error('Incomplete packet');
            }

            packet = { cmd: cmd ?? 'unknown' };
            let offset = pos + headerSize;

            if (typeNum === 3) { // PUBLISH
              packet.qos = (byte0 >> 1) & 0x03;
              packet.dup = !!(byte0 & 0x08);
              packet.retain = !!(byte0 & 0x01);

              // Topic
              const topicLen = (data[offset] << 8) | data[offset + 1];
              offset += 2;
              packet.topic = textDecoder.decode(data.subarray(offset, offset + topicLen));
              offset += topicLen;

              // Message ID (nếu QoS > 0)
              if (packet.qos && packet.qos > 0) {
                packet.messageId = (data[offset] << 8) | data[offset + 1];
                offset += 2;
              }

              // Payload
              packet.payload = data.slice(offset, pos + headerSize + remainingLength);
            }
          } catch (err) {
            listeners.error.forEach(fn => fn(err as Error));
            return;
          }

          listeners.packet.forEach(fn => fn(packet!));
          pos += headerSize! + remainingLength!;
        }
      }
    };
  }

  function generate(packet: MQTTPacket, opts: GenerateOptions = {}): ArrayBuffer {
    const qos = packet.qos || 0;
    const topicBytes = textEncoder.encode(packet.topic || '');

    let payloadBytes: Uint8Array;
    if (packet.payload instanceof Uint8Array) {
      payloadBytes = packet.payload;
    } else if (typeof packet.payload === 'string') {
      payloadBytes = textEncoder.encode(packet.payload);
    } else {
      payloadBytes = new Uint8Array(0);
    }

    const hasMessageId = qos > 0;
    const remainingLength = 2 + topicBytes.length + (hasMessageId ? 2 : 0) + payloadBytes.length;
    const rlBytes = encodeRemainingLength(remainingLength);

    const byte0 = (3 << 4) |
      ((packet.dup ? 1 : 0) << 3) |
      ((qos & 0x03) << 1) |
      (packet.retain ? 1 : 0);

    const totalSize = 1 + rlBytes.length + remainingLength;
    const buffer = new Uint8Array(totalSize);
    let pos = 0;

    buffer[pos++] = byte0;
    rlBytes.forEach(b => buffer[pos++] = b);

    // Topic length + topic
    buffer[pos++] = (topicBytes.length >> 8) & 0xFF;
    buffer[pos++] = topicBytes.length & 0xFF;
    buffer.set(topicBytes, pos);
    pos += topicBytes.length;

    // Message ID
    if (hasMessageId) {
      buffer[pos++] = (packet.messageId! >> 8) & 0xFF;
      buffer[pos++] = packet.messageId! & 0xFF;
    }

    // Payload
    buffer.set(payloadBytes, pos);

    return buffer.buffer;
  }

  // ==================== MAIN LOGIC ====================
  const settings = {
    blockSeenChat: true,
    blockTyping: true
  };

  function updateSettings() {
    try {
      const configStr = document.documentElement.getAttribute('data-social-aio-config');
      if (configStr) {
        const config = JSON.parse(configStr);
        settings.blockSeenChat = config.blockSeenChat !== false;
        settings.blockTyping = config.blockTyping !== false;
      }
    } catch (e) {}
  }

  updateSettings();

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'data-social-aio-config') {
        updateSettings();
      }
    });
  });
  observer.observe(document.documentElement, { attributes: true });

  function getUserID(): string | null {
    try {
      return document.cookie.match(/c_user=([0-9]+)/)?.[1] ?? null;
    } catch {
      return null;
    }
  }

  function safeParse(str: any): any {
    if (!str) return null;
    try {
      const parsed = JSON.parse(str);
      return parsed || null;
    } catch {
      return null;
    }
  }

  const ignoreTopic = ['/send_additional_contacts', '/br_sr', '/sr_res', '/ls_app_settings'];
  const ignoreCmd = ['pingreq', 'subscribe'];
  const c_user = getUserID();
  const opts: GenerateOptions = { protocolVersion: 3 };

  function getCurrentTimestamp(): number {
    return Date.now() * 1000;
  }

  // ==================== WEBSOCKET PROXY ====================
  const wsProxy = new Proxy(WebSocket as any, {
    construct(target: typeof WebSocket, args: ConstructorParameters<typeof WebSocket>): WebSocket {
      const instance = new target(...args);

      instance.send = new Proxy(instance.send, {
        apply(targetSend: any, thisArg: WebSocket, args: any[]) {
          const originalData = new Uint8Array(args[0]);
          const t = parser(opts);

          const send = () => {
            if (instance.readyState === WebSocket.OPEN) {
              targetSend.apply(thisArg, args);
            }
          };

          try {
            const dataStr = textDecoder.decode(originalData);
            if (settings.blockTyping && (dataStr.includes('typing_state') || dataStr.includes('"type":4'))) return;
            if (settings.blockSeenChat && (dataStr.includes('last_read_watermark_ts') || dataStr.includes('"label":"21"'))) return;
          } catch (e) {}

          t.on('packet', (i: MQTTPacket) => {
            try {
              if (ignoreTopic.includes(i.topic || '') || ignoreCmd.includes(i.cmd)) return send();

              if (i.payload && i.topic === '/ls_req') {
                const a = safeParse(textDecoder.decode(i.payload));
                if (settings.blockTyping && a && a.type === 4) {
                  const e = safeParse(a.payload);
                  if (e && safeParse(e.payload)?.thread_key) return;
                }

                if (settings.blockSeenChat && a && a.type === 3) {
                  let s = safeParse(a.payload);
                  if (s && s.tasks && Array.isArray(s.tasks) && s.tasks.length >= 1) {
                    let shouldModify = false;
                    for (const task of s.tasks) {
                      if (task.label === '21') {
                        shouldModify = true;
                        task.payload = JSON.stringify({
                          thread_id: c_user?.toString() || '',
                          last_read_watermark_ts: getCurrentTimestamp()
                        });
                      }
                    }
                    if (shouldModify) {
                      a.payload = JSON.stringify(s);
                      i.payload = textEncoder.encode(JSON.stringify(a));
                      args[0] = generate(i, opts);
                      return send();
                    }
                  }
                }
              }
              send();
            } catch { send(); }
          });

          t.on('error', () => send());
          t.parse(originalData);
        }
      });

      return instance;
    }
  }) as typeof WebSocket;

  (window as any).WebSocket = wsProxy;

})(window);
