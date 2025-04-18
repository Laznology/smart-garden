"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mqttConfig = void 0;
var dotenv_1 = require("dotenv");
dotenv_1.default.config();
exports.mqttConfig = {
    broker: process.env.MQTT_BROKER || 'broker.hivemq.com',
    port: parseInt(process.env.MQTT_PORT || '1883', 10),
    clientId: process.env.MQTT_CLIENT_ID || "smart_garden_gateway_".concat(Math.random().toString(16).slice(2, 8)),
    topics: (process.env.MQTT_TOPICS || 'sensors/#').split(','),
    options: {
        keepalive: 60,
        reconnectPeriod: 1000,
        clean: true,
        encoding: 'utf8',
        protocol: 'mqtt'
    }
};
